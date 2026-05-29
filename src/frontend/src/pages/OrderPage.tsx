import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { ShoppingCart, Plus, Minus, CircleCheck as CheckCircle, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Stand {
  id: string;
  name: string;
  location: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: "food" | "alcohol" | "general";
  emoji: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "1", name: "Hot Dog",       price: 6.00,  category: "food",    emoji: "🌭" },
  { id: "2", name: "Nachos",        price: 8.50,  category: "food",    emoji: "🧀" },
  { id: "3", name: "Popcorn",       price: 5.00,  category: "food",    emoji: "🍿" },
  { id: "4", name: "Burger",        price: 10.00, category: "food",    emoji: "🍔" },
  { id: "5", name: "Draft Beer",    price: 9.00,  category: "alcohol", emoji: "🍺" },
  { id: "6", name: "Seltzer",       price: 7.00,  category: "alcohol", emoji: "🍹" },
  { id: "7", name: "Water",         price: 3.00,  category: "general", emoji: "💧" },
  { id: "8", name: "Soda",          price: 4.50,  category: "general", emoji: "🥤" },
];

const TIP_PCTS = [0, 10, 15, 20];

const CATEGORY_COLORS: Record<string, string> = {
  food:    "bg-orange-500/20 text-orange-400",
  alcohol: "bg-blue-500/20 text-blue-400",
  general: "bg-white/10 text-muted-foreground",
};

export default function OrderPage() {
  const { clerkUserId } = useAuth();
  const [stands, setStands] = useState<Stand[]>([]);
  const [standId, setStandId] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [tipPct, setTipPct] = useState(15);
  const [ordering, setOrdering] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("stands").select("id, name, location").eq("is_active", true).order("name").then(({ data }) => {
      if (data) setStands(data);
    });
  }, []);

  function adjust(id: string, delta: number) {
    setCart(prev => {
      const next = { ...prev };
      const cur = next[id] ?? 0;
      const newVal = Math.max(0, cur + delta);
      if (newVal === 0) delete next[id];
      else next[id] = newVal;
      return next;
    });
  }

  const subtotal = Object.entries(cart).reduce((s, [id, qty]) => {
    const item = MENU_ITEMS.find(m => m.id === id);
    return s + (item?.price ?? 0) * qty;
  }, 0);
  const tipAmount = subtotal * tipPct / 100;
  const total = subtotal + tipAmount;
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  async function placeOrder() {
    if (!clerkUserId || !standId || itemCount === 0) return;
    setOrdering(true);
    try {
      const rows = Object.entries(cart).map(([id, qty]) => {
        const item = MENU_ITEMS.find(m => m.id === id)!;
        return {
          staff_id: clerkUserId,
          fan_id: clerkUserId,
          amount: item.price * qty,
          transaction_type: "digital",
          category: item.category,
          note: `x${qty} ${item.name}`,
          tipper_name: "Self",
        };
      });
      const { error } = await supabase.from("transactions").insert(rows);
      if (error) throw error;
      setDone(true);
      toast.success("Order placed!");
    } catch {
      toast.error("Failed to place order.");
    } finally {
      setOrdering(false);
    }
  }

  if (done) {
    return (
      <AppShell title="Order" showBack>
        <div className="flex flex-col items-center justify-center py-20 gap-4 fade-in-up">
          <CheckCircle className="h-16 w-16 text-teal" />
          <h2 className="text-xl font-bold text-foreground">Order Placed!</h2>
          <p className="text-sm text-muted-foreground">Total: ${total.toFixed(2)}</p>
          <button
            onClick={() => { setDone(false); setCart({}); setTipPct(15); }}
            className="rounded-xl bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth"
          >
            New Order
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Order Food & Drinks" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Stand selector */}
        {stands.length > 0 && (
          <div className="glassmorphism rounded-2xl p-4">
            <label className="mb-2 block text-xs font-semibold text-muted-foreground">Select Stand</label>
            <div className="flex flex-wrap gap-2">
              {stands.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStandId(s.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-smooth ${
                    standId === s.id ? "bg-teal text-white" : "bg-black/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="space-y-2">
          {MENU_ITEMS.map(item => (
            <div key={item.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[item.category]}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => adjust(item.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-muted-foreground hover:bg-white/20 transition-smooth">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center text-sm font-bold text-foreground">{cart[item.id] ?? 0}</span>
                <button onClick={() => adjust(item.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/20 text-teal hover:bg-teal/30 transition-smooth">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tip */}
        {itemCount > 0 && (
          <div className="glassmorphism rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Add a Tip</p>
            <div className="flex gap-2">
              {TIP_PCTS.map(p => (
                <button
                  key={p}
                  onClick={() => setTipPct(p)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-smooth ${
                    tipPct === p ? "bg-teal text-white" : "bg-black/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === 0 ? "None" : `${p}%`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        {itemCount > 0 && (
          <div className="glassmorphism rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {tipPct > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tip ({tipPct}%)</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground border-t border-border/30 pt-2">
              <span>Total</span>
              <span className="text-teal">${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          disabled={itemCount === 0 || ordering}
          onClick={placeOrder}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 disabled:cursor-not-allowed glow-teal-hero"
        >
          <ShoppingCart className="h-4 w-4" />
          {ordering ? "Placing Order…" : itemCount > 0 ? `Place Order — $${total.toFixed(2)}` : "Add Items to Order"}
        </button>
      </div>
    </AppShell>
  );
}
