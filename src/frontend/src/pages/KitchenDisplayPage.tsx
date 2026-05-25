import { OrderStatus } from "@/backend";
import type { FoodOrder } from "@/backend";
import { useBranding } from "@/context/BrandingContext";
import {
  DEMO_ACTIVE_ORDER,
  DEMO_STANDS,
  useDemoMode,
} from "@/context/DemoContext";
import {
  useGetActiveOrdersForManager,
  useUpdateOrderStatus,
} from "@/hooks/useQueries";
import { ChefHat, LogOut, MonitorCheck, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KDSStand {
  id: string;
  name: string;
  pin: string;
}

const KDS_STANDS: KDSStand[] = [
  { id: "stand-1", name: "Lucas Oil Grill", pin: "1111" },
  { id: "stand-2", name: "End Zone Bites", pin: "2222" },
  { id: "stand-3", name: "Colts Fan Eats", pin: "3333" },
];

const activeStandIds = (() => {
  try {
    const raw = localStorage.getItem("demo_active_stands");
    return raw ? new Set(JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
})();

const VISIBLE_KDS_STANDS = activeStandIds
  ? KDS_STANDS.filter((s) => activeStandIds.has(s.id))
  : KDS_STANDS;

const SESSION_KEY = "kds_session";
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface KDSSession {
  standId: string;
  expiresAt: number;
}

function loadSession(): KDSSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as KDSSession;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveSession(standId: string): KDSSession {
  const session: KDSSession = {
    standId,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Demo extra orders ────────────────────────────────────────────────────────
// Use raw string literals so these module-level constants are safe to
// construct before the backend canister has initialized (public /kitchen route).

const DEMO_EXTRA_ORDERS: FoodOrder[] = [
  {
    id: "order-demo-2",
    status: "Placed" as FoodOrder["status"],
    standId: "stand-2",
    createdAt: BigInt(Date.now() - 2 * 60 * 1000),
    updatedAt: BigInt(Date.now() - 2 * 60 * 1000),
    deliveryMethod: "Pickup" as FoodOrder["deliveryMethod"],
    totalInCents: BigInt(1699),
    customerId: {
      _isPrincipal: true,
      toText: () => "demo-user-2",
      toUint8Array: () => new Uint8Array([1]),
      compareTo: () => 0,
    } as unknown as import("@dfinity/principal").Principal,
    items: [
      {
        itemId: "item-201",
        itemName: "Nachos Supreme",
        quantity: BigInt(1),
        priceInCents: BigInt(1099),
      },
      {
        itemId: "item-203",
        itemName: "Garlic Fries",
        quantity: BigInt(1),
        priceInCents: BigInt(599),
      },
    ],
    seatNumber: "Section 114, Row F, Seat 8",
  },
  {
    id: "order-demo-3",
    status: "ReadyForPickup" as FoodOrder["status"],
    standId: "stand-3",
    createdAt: BigInt(Date.now() - 8 * 60 * 1000),
    updatedAt: BigInt(Date.now() - 3 * 60 * 1000),
    deliveryMethod: "Delivery" as FoodOrder["deliveryMethod"],
    totalInCents: BigInt(1748),
    customerId: {
      _isPrincipal: true,
      toText: () => "demo-user-3",
      toUint8Array: () => new Uint8Array([2]),
      compareTo: () => 0,
    } as unknown as import("@dfinity/principal").Principal,
    items: [
      {
        itemId: "item-301",
        itemName: "Buffalo Wings (6pc)",
        quantity: BigInt(1),
        priceInCents: BigInt(1249),
      },
      {
        itemId: "item-303",
        itemName: "Fountain Drink",
        quantity: BigInt(2),
        priceInCents: BigInt(449),
      },
    ],
    seatNumber: "Section 118, Row 12, Seat 3",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badge: string;
    border: string;
    next?: string;
    nextLabel?: string;
  }
> = {
  placed: {
    label: "Placed",
    badge: "bg-yellow-500/25 text-yellow-300 border border-yellow-500/40",
    border: "border-yellow-500/50",
    next: "preparing",
    nextLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    badge: "bg-orange-500/25 text-orange-300 border border-orange-500/40",
    border: "border-orange-500/50",
    next: "readyForPickup",
    nextLabel: "Mark Ready",
  },
  readyForPickup: {
    label: "Ready",
    badge: "bg-teal/25 text-teal border border-teal/40",
    border: "border-teal/50",
    next: "onTheWay",
    nextLabel: "Out for Delivery",
  },
  onTheWay: {
    label: "On the Way",
    badge: "bg-teal/25 text-teal border border-teal/40",
    border: "border-teal/50",
    next: undefined,
    nextLabel: undefined,
  },
};

const ACTIVE_STATUSES = new Set([
  "Placed",
  "Preparing",
  "ReadyForPickup",
  "OnTheWay",
]);

function getStatusKey(status: OrderStatus): string {
  if (status === OrderStatus.Placed) return "placed";
  if (status === OrderStatus.Preparing) return "preparing";
  if (status === OrderStatus.ReadyForPickup) return "readyForPickup";
  if (status === OrderStatus.OnTheWay) return "onTheWay";
  if (status === OrderStatus.Completed) return "completed";
  return "cancelled";
}

function getNextOrderStatus(key: string): OrderStatus | null {
  if (key === "placed") return OrderStatus.Preparing;
  if (key === "preparing") return OrderStatus.ReadyForPickup;
  if (key === "readyForPickup") return OrderStatus.OnTheWay;
  return null;
}

function formatTime(createdAt: bigint): string {
  const ms = Number(createdAt);
  if (ms === 0) {
    // demo — use relative display
    return "Just now";
  }
  return new Date(ms / 1_000_000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  index,
  onAdvance,
  isUpdating,
}: {
  order: FoodOrder;
  index: number;
  onAdvance: (orderId: string, nextStatus: OrderStatus) => void;
  isUpdating: boolean;
}) {
  const statusKey = getStatusKey(order.status);
  const config = STATUS_CONFIG[statusKey];
  const nextStatus = getNextOrderStatus(statusKey);
  const isDelivery = (order.deliveryMethod as string) === "Delivery";

  const total = order.items.reduce(
    (sum, item) =>
      sum +
      Number(
        item.priceInCents ??
          (item as { priceCents?: bigint }).priceCents ??
          BigInt(0),
      ) *
        Number(item.quantity),
    0,
  );

  return (
    <div
      data-ocid={`kds.order.${index + 1}`}
      className={`bg-muted/30 backdrop-blur-xl border-2 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${
        config?.border ?? "border-border"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="font-black text-white tracking-wide"
            style={{ fontSize: "22px", lineHeight: 1.2 }}
          >
            📍 {order.seatNumber}
          </p>
          <p className="text-white/50 text-sm mt-1">
            Order #{order.id.slice(-4).toUpperCase()} ·{" "}
            {formatTime(order.createdAt)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {config && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.badge}`}
            >
              {config.label}
            </span>
          )}
          <span
            data-ocid={`kds.delivery_badge.${index + 1}`}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
              isDelivery
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "bg-purple-500/20 text-purple-300 border-purple-500/40"
            }`}
          >
            {isDelivery ? "Delivery" : "Pickup"}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {order.items.map((item, i) => (
          <div key={item.itemId ?? i} className="flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/20 font-black text-teal"
              style={{ fontSize: "18px" }}
            >
              {Number(item.quantity)}×
            </span>
            <span
              className="text-white font-semibold"
              style={{ fontSize: "18px" }}
            >
              {item.itemName}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-white/50 text-sm">
          Total: ${(total / 100).toFixed(2)}
        </span>

        {nextStatus !== null && config?.nextLabel && (
          <button
            type="button"
            data-ocid={`kds.advance_button.${index + 1}`}
            disabled={isUpdating}
            onClick={() => onAdvance(order.id, nextStatus)}
            className="rounded-xl bg-teal px-5 py-2.5 font-bold text-navy shadow-lg shadow-teal/30 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-dark active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: "16px" }}
          >
            {config.nextLabel}
          </button>
        )}

        {!nextStatus && (
          <span className="text-teal/70 text-sm font-semibold">
            Awaiting pickup ✓
          </span>
        )}
      </div>
    </div>
  );
}

// ─── PIN Screen ───────────────────────────────────────────────────────────────

function PINScreen({ onUnlock }: { onUnlock: (standId: string) => void }) {
  const [selectedStand, setSelectedStand] = useState<KDSStand | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { brandName, poweredByText } = useBranding();

  useEffect(() => {
    if (selectedStand && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedStand]);

  const handlePINDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) {
      // Auto-submit
      setTimeout(() => {
        if (selectedStand && next === selectedStand.pin) {
          onUnlock(selectedStand.id);
        } else {
          setError("Incorrect PIN. Please try again.");
          setPin("");
        }
      }, 150);
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  if (!selectedStand) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        {/* Glow */}
        <div
          className="pointer-events-none fixed inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-8">
          {/* Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40 shadow-lg shadow-teal/20">
              <MonitorCheck className="h-8 w-8 text-teal" />
            </div>
            <p className="text-2xl font-black text-white mt-4">{brandName}</p>
            {poweredByText && (
              <p className="text-sm text-white/40">{poweredByText}</p>
            )}
            <p className="text-white/60 text-sm mt-2">Kitchen Display System</p>
          </div>

          {/* Stand selection */}
          <div className="space-y-3">
            <p className="text-white/60 text-sm text-center font-semibold uppercase tracking-wider">
              Select your stand
            </p>
            {VISIBLE_KDS_STANDS.map((stand) => (
              <button
                key={stand.id}
                type="button"
                data-ocid={`kds.stand_select.${stand.id}`}
                onClick={() => {
                  setSelectedStand(stand);
                  setPin("");
                  setError("");
                }}
                className="w-full rounded-2xl bg-muted/30 backdrop-blur-xl border border-border hover:border-teal/40 hover:bg-teal/5 px-5 py-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{stand.name}</p>
                    <p className="text-white/40 text-sm mt-0.5">
                      Tap to enter PIN
                    </p>
                  </div>
                  <ChefHat className="h-5 w-5 text-white/30 group-hover:text-teal transition-colors duration-200" />
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-white/25 text-xs">
            Session expires after 4 hours of inactivity
          </p>
        </div>
      </div>
    );
  }

  // PIN entry
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xs space-y-8">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40">
            <ChefHat className="h-8 w-8 text-teal" />
          </div>
          <p className="text-xl font-black text-white mt-4">
            {selectedStand.name}
          </p>
          <p className="text-white/50 text-sm">Enter your 4-digit PIN</p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-teal shadow-lg shadow-teal/50"
                  : "bg-white/20"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-red-400 text-sm font-semibold animate-pulse">
            {error}
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              type="button"
              data-ocid={`kds.pin_digit.${d}`}
              onClick={() => handlePINDigit(d)}
              className="rounded-2xl bg-muted/30 border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-white font-bold text-2xl transition-all duration-150 active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            data-ocid="kds.pin_back"
            onClick={() => {
              setSelectedStand(null);
              setPin("");
              setError("");
            }}
            className="rounded-2xl bg-muted/30 border border-border hover:border-white/30 py-5 text-white/50 font-semibold text-sm transition-all duration-150 active:scale-95"
          >
            ‹ Back
          </button>
          <button
            type="button"
            data-ocid="kds.pin_digit.0"
            onClick={() => handlePINDigit("0")}
            className="rounded-2xl bg-muted/30 border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-white font-bold text-2xl transition-all duration-150 active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            data-ocid="kds.pin_backspace"
            onClick={handleBackspace}
            className="rounded-2xl bg-muted/30 border border-border hover:border-white/30 py-5 text-white/50 font-bold text-xl transition-all duration-150 active:scale-95"
          >
            ⌫
          </button>
        </div>

        {/* Hidden input for accessibility */}
        <input
          ref={inputRef}
          type="text"
          inputMode="none"
          className="sr-only"
          aria-label="PIN entry"
          value={pin}
          readOnly
        />
      </div>
    </div>
  );
}

// ─── KDS Display ──────────────────────────────────────────────────────────────

function KDSDisplay({
  standId,
  onLogout,
}: { standId: string; onLogout: () => void }) {
  const { isDemoMode } = useDemoMode();
  const { brandName, poweredByText } = useBranding();
  const updateStatus = useUpdateOrderStatus();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const {
    data: liveOrders = [],
    isRefetching,
    refetch,
  } = useGetActiveOrdersForManager();

  // Build order list
  const allOrders = useMemo<FoodOrder[]>(() => {
    if (isDemoMode) {
      // Demo: show all demo orders regardless of stand filter
      return [DEMO_ACTIVE_ORDER as unknown as FoodOrder, ...DEMO_EXTRA_ORDERS];
    }
    // Real: filter by selected stand
    return liveOrders.filter((o) => o.standId === standId);
  }, [isDemoMode, liveOrders, standId]);

  const activeOrders = useMemo(
    () => allOrders.filter((o) => ACTIVE_STATUSES.has(getStatusKey(o.status))),
    [allOrders],
  );

  const stand = KDS_STANDS.find((s) => s.id === standId);
  const standName = isDemoMode
    ? (DEMO_STANDS.find((s) => s.id === standId)?.name ?? "Kitchen Display")
    : (stand?.name ?? "Kitchen Display");

  const handleAdvance = async (orderId: string, nextSt: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      if (!isDemoMode) {
        await updateStatus.mutateAsync({ orderId, status: nextSt });
      }
      toast.success("Order updated!", { duration: 2000 });
    } catch {
      toast.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  // Auto-refresh every 3 seconds (extra client-side poll layer)
  useEffect(() => {
    if (isDemoMode) return;
    const interval = setInterval(() => {
      refetch();
    }, 3000);
    return () => clearInterval(interval);
  }, [isDemoMode, refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal/8 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-teal/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-muted/30 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-4 px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/20 border border-teal/40">
              <ChefHat className="h-5 w-5 text-teal" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <p className="text-white font-black text-lg truncate">
                  {brandName}
                </p>
                {poweredByText && (
                  <span className="text-white/35 text-xs hidden sm:inline">
                    {poweredByText}
                  </span>
                )}
              </div>
              <p className="text-white/50 text-sm truncate">
                {standName} · Kitchen Display
              </p>
            </div>
          </div>

          {/* Order count badge */}
          <div
            data-ocid="kds.order_count_badge"
            className="flex items-center gap-2 rounded-xl bg-teal/15 border border-teal/30 px-4 py-2"
          >
            <span
              className="text-2xl font-black text-teal"
              style={{ fontSize: "24px" }}
            >
              {activeOrders.length}
            </span>
            <span className="text-white/60 text-sm font-semibold">
              active {activeOrders.length === 1 ? "order" : "orders"}
            </span>
          </div>

          {isRefetching && (
            <RefreshCw
              className="h-4 w-4 text-teal/60 animate-spin"
              aria-label="Refreshing"
            />
          )}

          <button
            type="button"
            data-ocid="kds.logout_button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border hover:border-red-500/40 hover:bg-red-500/10 px-4 py-2 text-white/60 hover:text-red-400 transition-all duration-200 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Title bar */}
      <div className="px-6 pt-6 pb-3 max-w-[1600px] mx-auto">
        <h1
          className="font-black text-teal uppercase tracking-widest"
          style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
        >
          Active Orders
        </h1>
        {isDemoMode && (
          <p className="text-yellow-400/70 text-sm mt-1">
            Demo mode · All stands shown
          </p>
        )}
      </div>

      {/* Orders grid */}
      <main className="px-6 pb-10 max-w-[1600px] mx-auto">
        {activeOrders.length === 0 ? (
          <div
            data-ocid="kds.empty_state"
            className="flex flex-col items-center justify-center py-32 gap-6 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal/10 border border-teal/20">
              <ChefHat className="h-10 w-10 text-teal/50" />
            </div>
            <div>
              <p className="text-white/60 font-bold text-2xl">
                No active orders
              </p>
              <p className="text-white/30 text-base mt-2">
                Waiting for new orders — auto-refreshes every 3 seconds
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            }}
          >
            {activeOrders.map((order, i) => (
              <OrderCard
                key={order.id}
                order={order}
                index={i}
                onAdvance={handleAdvance}
                isUpdating={updatingId === order.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KitchenDisplayPage() {
  const { isDemoMode } = useDemoMode();

  // In demo mode, auto-select stand-1 and skip PIN
  const [session, setSession] = useState<KDSSession | null>(() => {
    if (isDemoMode)
      return { standId: "stand-1", expiresAt: Date.now() + SESSION_TTL_MS };
    return loadSession();
  });

  const handleUnlock = (standId: string) => {
    const newSession = saveSession(standId);
    setSession(newSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return <PINScreen onUnlock={handleUnlock} />;
  }

  return <KDSDisplay standId={session.standId} onLogout={handleLogout} />;
}
