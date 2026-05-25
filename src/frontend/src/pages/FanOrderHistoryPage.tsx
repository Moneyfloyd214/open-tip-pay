import { DeliveryMethod, OrderStatus } from "@/backend";
import type { FoodOrder, OrderItem } from "@/backend";
import { useBranding } from "@/context/BrandingContext";
import { DEMO_ACTIVE_ORDER, DEMO_STANDS } from "@/context/DemoContext";
import { useDemoMode } from "@/context/DemoContext";
import { useGetMyOrders } from "@/hooks/useQueries";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Stand name lookup ────────────────────────────────────────────────────────
const standNames: Record<string, string> = {
  "stand-1": "Lucas Oil Grill",
  "stand-2": "End Zone Bites",
  "stand-3": "Colts Fan Eats",
};

function getStandName(standId: string): string {
  const demo = DEMO_STANDS.find((s) => s.id === standId);
  return demo?.name ?? standNames[standId] ?? standId;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(ts: bigint | number): string {
  const ms = Number(ts) < 1e13 ? Number(ts) * 1000 : Number(ts);
  const d = new Date(ms > 0 ? ms : Date.now());
  return d
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", " ·");
}

function calcTotal(items: OrderItem[]): number {
  return items.reduce(
    (sum, i) => sum + Number(i.priceInCents) * Number(i.quantity),
    0,
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    [OrderStatus.Completed]: {
      label: "Completed",
      cls: "bg-green-500/20 text-green-400 border border-green-500/30",
    },
    [OrderStatus.Cancelled]: {
      label: "Cancelled",
      cls: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
    [OrderStatus.Placed]: {
      label: "Placed",
      cls: "bg-teal/20 text-teal border border-teal/30",
    },
    [OrderStatus.Preparing]: {
      label: "Preparing",
      cls: "bg-teal/20 text-teal border border-teal/30",
    },
    [OrderStatus.ReadyForPickup]: {
      label: "Ready for Pickup",
      cls: "bg-teal/20 text-teal border border-teal/30",
    },
    [OrderStatus.OnTheWay]: {
      label: "On the Way",
      cls: "bg-teal/20 text-teal border border-teal/30",
    },
  };
  const { label, cls } = cfg[status as string] ?? {
    label: String(status),
    cls: "bg-white/10 text-white/60 border border-border",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

// ─── Local demo orders ────────────────────────────────────────────────────────
const DEMO_HISTORY_ORDERS: FoodOrder[] = [
  {
    id: "order-demo-2",
    status: OrderStatus.Completed,
    standId: "stand-1",
    seatNumber: "107A",
    deliveryMethod: DeliveryMethod.Delivery,
    createdAt: BigInt(Date.now() - 1000 * 60 * 90) as unknown as bigint,
    updatedAt: BigInt(Date.now() - 1000 * 60 * 60) as unknown as bigint,
    totalInCents: BigInt(1798),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-101",
        itemName: "Colts BBQ Brisket Sandwich",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(1099) as unknown as bigint,
      },
      {
        itemId: "item-102",
        itemName: "Loaded Colts Nachos",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(699) as unknown as bigint,
      },
    ],
  },
  {
    id: "order-demo-3",
    status: OrderStatus.Cancelled,
    standId: "stand-2",
    seatNumber: "221C",
    deliveryMethod: DeliveryMethod.Pickup,
    createdAt: BigInt(Date.now() - 1000 * 60 * 60 * 3) as unknown as bigint,
    updatedAt: BigInt(Date.now() - 1000 * 60 * 60 * 3) as unknown as bigint,
    totalInCents: BigInt(849),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-201",
        itemName: "End Zone Chili Dog",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(849) as unknown as bigint,
      },
    ],
  },
  {
    id: "order-demo-4",
    status: OrderStatus.Completed,
    standId: "stand-3",
    seatNumber: "315B",
    deliveryMethod: DeliveryMethod.Delivery,
    createdAt: BigInt(Date.now() - 1000 * 60 * 60 * 24) as unknown as bigint,
    updatedAt: BigInt(Date.now() - 1000 * 60 * 60 * 23) as unknown as bigint,
    totalInCents: BigInt(2398),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-301",
        itemName: "Horseshoe Basket",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(999) as unknown as bigint,
      },
      {
        itemId: "item-302",
        itemName: "Colts Fan Cheese Fries",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(649) as unknown as bigint,
      },
      {
        itemId: "item-303",
        itemName: "Lucas Oil Lemonade (32 oz)",
        quantity: BigInt(1) as unknown as bigint,
        priceInCents: BigInt(750) as unknown as bigint,
      },
    ],
  },
];

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, index }: { order: FoodOrder; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const statusKey =
    typeof order.status === "object"
      ? (Object.keys(order.status as object)[0] as OrderStatus)
      : (order.status as OrderStatus);

  const deliveryKey =
    typeof order.deliveryMethod === "object"
      ? Object.keys(order.deliveryMethod as object)[0]
      : String(order.deliveryMethod);

  const total = calcTotal(order.items);

  return (
    <div
      className="bg-muted/30 backdrop-blur-xl border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-teal/20"
      data-ocid={`order_history.item.${index + 1}`}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={() => setExpanded((v) => !v)}
        data-ocid={`order_history.item.${index + 1}.toggle`}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm">
              {getStandName(order.standId)}
            </span>
            <StatusBadge status={statusKey} />
          </div>
          <p className="text-white/50 text-xs">{formatDate(order.createdAt)}</p>
          <p className="text-white/70 text-xs">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            {" ·  "}
            <span className="text-teal font-semibold">
              ${(total / 100).toFixed(2)}
            </span>
          </p>
        </div>
        <div className="shrink-0 mt-1 text-white/40 text-lg leading-none select-none">
          {expanded ? "▲" : "▼"}
        </div>
      </button>

      {/* Expandable details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Meta */}
          <div className="flex gap-4 text-xs text-white/50">
            <span>Seat {order.seatNumber}</span>
            <span>·</span>
            <span>
              {deliveryKey === "delivery" ? "Seat Delivery" : "Pickup"}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-1.5">
            {order.items.map((item, i) => (
              <div
                key={item.itemId ?? i}
                className="flex justify-between text-sm"
              >
                <span className="text-white/80 min-w-0 truncate pr-2">
                  {item.itemName} × {Number(item.quantity)}
                </span>
                <span className="text-white/60 shrink-0">
                  $
                  {(
                    (Number(item.priceInCents) * Number(item.quantity)) /
                    100
                  ).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
              <span className="text-white">Total</span>
              <span className="text-teal">${(total / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Reorder */}
          <button
            type="button"
            className="w-full mt-1 py-2 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm font-semibold hover:bg-teal/20 transition-colors"
            onClick={() => toast.info("Reorder coming soon!")}
            data-ocid={`order_history.item.${index + 1}.reorder_button`}
          >
            Reorder
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FanOrderHistoryPage() {
  const { brandName, poweredByText } = useBranding();
  const { isDemoMode } = useDemoMode();
  const { data: liveOrders = [], isLoading } = useGetMyOrders();

  const rawOrders: FoodOrder[] = isDemoMode
    ? [DEMO_ACTIVE_ORDER as unknown as FoodOrder, ...DEMO_HISTORY_ORDERS]
    : liveOrders;

  const orders = [...rawOrders].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-teal/8 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-safe-top">
        {/* Header */}
        <div className="flex items-center gap-3 py-4 mb-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/30 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Back"
            data-ocid="order_history.back_button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight">
              Order History
            </h1>
            {poweredByText && (
              <p className="text-teal/70 text-xs truncate">
                {brandName} · {poweredByText}
              </p>
            )}
          </div>
          <Package className="h-5 w-5 text-teal/60" />
        </div>

        {/* Content */}
        {isLoading && !isDemoMode ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            data-ocid="order_history.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-white/30" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">
                No orders yet
              </p>
              <p className="text-white/45 text-sm mt-1">
                Tap <span className="text-teal">Order Food</span> on your
                dashboard to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            {orders.map((order, i) => (
              <OrderCard key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
