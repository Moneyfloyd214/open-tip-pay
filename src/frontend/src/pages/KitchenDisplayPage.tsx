import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChefHat, LogOut, MonitorCheck, RefreshCw, CircleCheck as CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Stand {
  id: string;
  name: string;
  location: string;
}

type OrderStatus = "placed" | "preparing" | "ready" | "completed";

interface KDSOrder {
  id: string;
  stand_id: string;
  tipper_name: string;
  amount_cents: number;
  note: string;
  created_at: string;
  kds_status: OrderStatus;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string; border: string; next?: OrderStatus; nextLabel?: string }> = {
  placed:    { label: "New",      badge: "bg-yellow-500/25 text-yellow-300 border border-yellow-500/40", border: "border-yellow-500/50", next: "preparing", nextLabel: "Start Preparing" },
  preparing: { label: "Preparing", badge: "bg-orange-500/25 text-orange-300 border border-orange-500/40", border: "border-orange-500/50", next: "ready", nextLabel: "Mark Ready" },
  ready:     { label: "Ready",    badge: "bg-teal/25 text-teal border border-teal/40", border: "border-teal/50", next: "completed", nextLabel: "Complete" },
  completed: { label: "Done",     badge: "bg-green-500/25 text-green-300 border border-green-500/40", border: "border-border" },
};

const SESSION_KEY = "kds_session_v2";
const SESSION_TTL = 4 * 60 * 60 * 1000;

function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { standId, exp } = JSON.parse(raw);
    if (Date.now() > exp) { localStorage.removeItem(SESSION_KEY); return null; }
    return standId;
  } catch { return null; }
}

// PIN Screen
function PINScreen({ stands, onUnlock }: { stands: Stand[]; onUnlock: (id: string) => void }) {
  const [selected, setSelected] = useState<Stand | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const DEMO_PIN = "1234";

  useEffect(() => { if (selected && inputRef.current) inputRef.current.focus(); }, [selected]);

  function digit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next); setError("");
    if (next.length === 4) {
      setTimeout(() => {
        if (next === DEMO_PIN) {
          localStorage.setItem(SESSION_KEY, JSON.stringify({ standId: selected!.id, exp: Date.now() + SESSION_TTL }));
          onUnlock(selected!.id);
        } else {
          setError("Incorrect PIN. Try 1234 for demo.");
          setPin("");
        }
      }, 150);
    }
  }

  if (!selected) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40">
            <MonitorCheck className="h-8 w-8 text-teal" />
          </div>
          <p className="text-2xl font-black text-foreground mt-4">Open Tip Pay</p>
          <p className="text-muted-foreground text-sm">Kitchen Display System</p>
        </div>
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm text-center font-semibold uppercase tracking-wider">Select your stand</p>
          {stands.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No active stands configured. Add stands in the Manager Portal.</p>
          ) : stands.map((s) => (
            <button key={s.id} onClick={() => { setSelected(s); setPin(""); setError(""); }}
              className="w-full rounded-2xl glassmorphism border border-border hover:border-teal/40 hover:bg-teal/5 px-5 py-4 text-left transition-smooth group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-bold">{s.name}</p>
                  <p className="text-muted-foreground text-sm">{s.location}</p>
                </div>
                <ChefHat className="h-5 w-5 text-muted-foreground group-hover:text-teal transition-smooth" />
              </div>
            </button>
          ))}
        </div>
        <p className="text-center text-muted-foreground/40 text-xs">PIN: 1234 (demo)</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-xs space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40">
            <ChefHat className="h-8 w-8 text-teal" />
          </div>
          <p className="text-xl font-black text-foreground mt-4">{selected.name}</p>
          <p className="text-muted-foreground text-sm">Enter your 4-digit PIN</p>
        </div>
        <div className="flex justify-center gap-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`h-4 w-4 rounded-full transition-all ${i < pin.length ? "bg-teal shadow-lg shadow-teal/50" : "bg-white/20"}`} />
          ))}
        </div>
        {error && <p className="text-center text-destructive text-sm">{error}</p>}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button key={d} onClick={() => digit(d)}
              className="rounded-2xl glassmorphism border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-foreground font-bold text-2xl transition-smooth active:scale-95">
              {d}
            </button>
          ))}
          <button onClick={() => { setSelected(null); setPin(""); setError(""); }}
            className="rounded-2xl glassmorphism border border-border py-5 text-muted-foreground font-semibold text-sm transition-smooth active:scale-95">
            ‹ Back
          </button>
          <button onClick={() => digit("0")}
            className="rounded-2xl glassmorphism border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-foreground font-bold text-2xl transition-smooth active:scale-95">
            0
          </button>
          <button onClick={() => { setPin((p) => p.slice(0, -1)); setError(""); }}
            className="rounded-2xl glassmorphism border border-border py-5 text-muted-foreground font-bold text-xl transition-smooth active:scale-95">
            ⌫
          </button>
        </div>
        <input ref={inputRef} type="text" inputMode="none" className="sr-only" readOnly value={pin} />
      </div>
    </div>
  );
}

// KDS Display
function KDSDisplay({ standId, standName, onLogout }: { standId: string; standName: string; onLogout: () => void }) {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // In a real deployment this would pull from a food_orders table.
  // For now we surface recently completed transactions for this stand as "orders".
  async function load() {
    setRefreshing(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, stand_id, tipper_name, tip_amount_cents, note, created_at")
      .eq("stand_id", standId)
      .in("status", ["completed", "pending"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setOrders(data.map((t) => ({ ...t, amount_cents: t.tip_amount_cents, kds_status: "placed" as OrderStatus })));
    }
    setRefreshing(false);
  }

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [standId]);

  function advance(orderId: string) {
    setUpdatingId(orderId);
    setOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const cfg = STATUS_CONFIG[o.kds_status];
      if (!cfg.next) return o;
      return { ...o, kds_status: cfg.next as OrderStatus };
    }));
    toast.success("Order updated!");
    setUpdatingId(null);
  }

  const active = orders.filter((o) => o.kds_status !== "completed");

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal/8 blur-[160px]" />
      </div>
      <header className="sticky top-0 z-30 glassmorphism border-b border-border">
        <div className="flex items-center gap-4 px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20 border border-teal/40">
              <ChefHat className="h-5 w-5 text-teal" />
            </div>
            <div>
              <p className="text-foreground font-black text-lg">Open Tip Pay KDS</p>
              <p className="text-muted-foreground text-sm">{standName} · Kitchen Display</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-teal/15 border border-teal/30 px-4 py-2">
            <span className="text-2xl font-black text-teal">{active.length}</span>
            <span className="text-muted-foreground text-sm font-semibold">active</span>
          </div>
          <button onClick={load} className={`p-2 text-muted-foreground hover:text-foreground transition-smooth ${refreshing ? "animate-spin" : ""}`}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-border hover:border-destructive/40 hover:text-destructive px-4 py-2 text-muted-foreground text-sm font-semibold transition-smooth">
            <LogOut className="h-4 w-4" /> Exit
          </button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-teal uppercase tracking-widest mb-6">Active Orders</h1>
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal/10 border border-teal/20">
              <CheckCircle className="h-10 w-10 text-teal/50" />
            </div>
            <p className="text-muted-foreground font-bold text-2xl">All clear!</p>
            <p className="text-muted-foreground/60 text-sm">No active orders · Auto-refreshes every 10 seconds</p>
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {active.map((order, i) => {
              const cfg = STATUS_CONFIG[order.kds_status];
              return (
                <div key={order.id} className={`glassmorphism border-2 rounded-2xl p-5 flex flex-col gap-4 transition-smooth ${cfg.border}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-foreground text-xl">{order.tipper_name || "Guest"}</p>
                      <p className="text-muted-foreground text-sm">
                        #{order.id.slice(-4).toUpperCase()} · {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  {order.note && (
                    <p className="text-sm text-muted-foreground italic">"{order.note}"</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground text-sm">Tip: ${(order.amount_cents / 100).toFixed(2)}</span>
                    {cfg.next && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() => advance(order.id)}
                        className="rounded-xl bg-teal px-5 py-2.5 font-bold text-white shadow-lg shadow-teal/30 hover:bg-teal-dark transition-smooth active:scale-95 disabled:opacity-50"
                      >
                        {cfg.nextLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function KitchenDisplayPage() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [standId, setStandId] = useState<string | null>(loadSession);

  useEffect(() => {
    supabase.from("stands").select("id, name, location").eq("is_active", true).then(({ data }) => {
      if (data) setStands(data);
    });
  }, []);

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setStandId(null);
  }

  if (!standId) return <PINScreen stands={stands} onUnlock={setStandId} />;

  const stand = stands.find((s) => s.id === standId);
  return <KDSDisplay standId={standId} standName={stand?.name ?? "Stand"} onLogout={handleLogout} />;
}
