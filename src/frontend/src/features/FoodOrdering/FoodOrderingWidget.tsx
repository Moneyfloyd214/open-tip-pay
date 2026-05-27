import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingCart, Plus, Minus, Loader as Loader2, Utensils } from "lucide-react";
import { toast } from "sonner";

interface Stand {
  id: string;
  name: string;
  location: string;
  pos_type: string;
}

export default function FoodOrderingWidget() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const MOCK_MENU = [
    { id: "1", name: "Hot Dog", price_cents: 500, emoji: "🌭" },
    { id: "2", name: "Nachos", price_cents: 800, emoji: "🧀" },
    { id: "3", name: "Beer", price_cents: 1200, emoji: "🍺" },
    { id: "4", name: "Soda", price_cents: 400, emoji: "🥤" },
    { id: "5", name: "Popcorn", price_cents: 600, emoji: "🍿" },
    { id: "6", name: "Pretzel", price_cents: 700, emoji: "🥨" },
  ];

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("stands").select("id, name, location, pos_type").eq("is_active", true);
    if (data) setStands(data);
    setLoading(false);
  }

  function adjust(itemId: string, delta: number) {
    setQuantities((prev) => {
      const next = (prev[itemId] || 0) + delta;
      if (next <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  }

  const totalCents = MOCK_MENU.reduce((s, item) => s + (quantities[item.id] || 0) * item.price_cents, 0);
  const cartCount = Object.values(quantities).reduce((s, v) => s + v, 0);

  function placeOrder() {
    if (!selectedStand) { toast.error("Select a stand first"); return; }
    if (cartCount === 0) { toast.error("Add items to your order"); return; }
    toast.success(`Order placed at ${selectedStand.name}!`);
    setQuantities({});
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stand selector */}
      <div className="glassmorphism rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Utensils className="h-4 w-4 text-teal" /> Select a Stand
        </h3>
        {stands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active stands available.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stands.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStand(s)}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-smooth border ${
                  selectedStand?.id === s.id
                    ? "border-teal bg-teal/20 text-teal"
                    : "border-border bg-black/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="ml-1.5 text-xs opacity-60">{s.location}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="glassmorphism rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Menu</h3>
          {cartCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-teal/20 px-2.5 py-0.5 text-xs font-bold text-teal">
              <ShoppingCart className="h-3 w-3" /> {cartCount} items
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MOCK_MENU.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">${(item.price_cents / 100).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(quantities[item.id] || 0) > 0 && (
                  <>
                    <button
                      onClick={() => adjust(item.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-smooth"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-foreground">
                      {quantities[item.id]}
                    </span>
                  </>
                )}
                <button
                  onClick={() => adjust(item.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-teal/20 text-teal hover:bg-teal/30 transition-smooth"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary */}
      {cartCount > 0 && (
        <div className="glassmorphism rounded-2xl p-5 border border-teal/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Order Total</p>
              {selectedStand && <p className="text-xs text-muted-foreground">{selectedStand.name}</p>}
            </div>
            <span className="text-xl font-bold text-teal">${(totalCents / 100).toFixed(2)}</span>
          </div>
          <button
            onClick={placeOrder}
            className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth glow-teal-hero"
          >
            Place Order — ${(totalCents / 100).toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
