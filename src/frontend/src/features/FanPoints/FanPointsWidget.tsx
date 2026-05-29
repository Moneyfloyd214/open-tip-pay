import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Star, Gift, TrendingUp, Loader as Loader2 } from "lucide-react";

interface LedgerEntry {
  id: string;
  points: number;
  event_type: string;
  note: string;
  created_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  point_cost: number;
  category: string;
  image_url: string;
}

export default function FanPointsWidget() {
  const { clerkUserId } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"points" | "rewards">("points");

  useEffect(() => {
    if (!clerkUserId) return;
    load();
  }, [clerkUserId]);

  async function load() {
    setLoading(true);
    const [ledgerRes, rewardsRes] = await Promise.all([
      supabase
        .from("fan_point_ledger")
        .select("*")
        .eq("fan_id", clerkUserId!)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("rewards").select("*").eq("is_active", true).limit(12),
    ]);
    if (ledgerRes.data) {
      setLedger(ledgerRes.data);
      setBalance(ledgerRes.data.reduce((s, e) => s + e.points, 0));
    }
    if (rewardsRes.data) setRewards(rewardsRes.data);
    setLoading(false);
  }

  const categoryIcon = (c: string) =>
    c === "merchandise" ? "👕" : c === "discount" ? "🎫" : c === "experience" ? "🌟" : "🎁";

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance banner */}
      <div className="glassmorphism rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fan Points Balance</p>
          <div className="flex items-end gap-1.5 mt-1">
            <span className="text-4xl font-bold text-foreground">{balance.toLocaleString()}</span>
            <span className="text-sm text-teal mb-1">pts</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Earn 1 pt per $1 tipped</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/20 border border-teal/30">
          <Star className="h-7 w-7 text-teal" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-black/20 p-1 w-fit">
        {(["points", "rewards"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-smooth ${
              activeTab === t ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "points" ? "History" : "Redeem"}
          </button>
        ))}
      </div>

      {activeTab === "points" && (
        <div className="glassmorphism rounded-2xl p-5 space-y-1">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal" /> Point History
          </h3>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No points yet. Start tipping to earn!
            </p>
          ) : (
            ledger.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground capitalize">{e.event_type}</p>
                  <p className="text-[11px] text-muted-foreground">{e.note || "—"}</p>
                </div>
                <span className={`text-sm font-bold ${e.points > 0 ? "text-teal" : "text-destructive"}`}>
                  {e.points > 0 ? "+" : ""}{e.points}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="glassmorphism rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-teal" /> Available Rewards
          </h3>
          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No rewards available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rewards.map((r) => (
                <div key={r.id} className="rounded-xl bg-black/20 p-4 border border-border/50">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{categoryIcon(r.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-teal">{r.point_cost} pts</span>
                        <button
                          disabled={balance < r.point_cost}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-smooth ${
                            balance >= r.point_cost
                              ? "bg-teal text-white hover:bg-teal-light"
                              : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          Redeem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
