import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Star, Gift, History, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
}

interface LedgerEntry {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

type Tab = "redeem" | "history";

export default function RewardsPage() {
  const { clerkUserId } = useAuth();
  const [tab, setTab] = useState<Tab>("redeem");
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (!clerkUserId) return;
    Promise.all([fetchBalance(), fetchRewards(), fetchLedger()]).finally(() => setLoading(false));
  }, [clerkUserId]);

  async function fetchBalance() {
    const { data } = await supabase
      .from("fan_point_balances")
      .select("total_points")
      .eq("user_id", clerkUserId!)
      .maybeSingle();
    if (data) setBalance(Number(data.total_points) || 0);
  }

  async function fetchRewards() {
    const { data } = await supabase
      .from("rewards_catalog")
      .select("*")
      .eq("is_active", true)
      .order("points_cost");
    if (data) setRewards(data);
  }

  async function fetchLedger() {
    const { data } = await supabase
      .from("fan_point_ledger")
      .select("id, points, reason, created_at")
      .eq("user_id", clerkUserId!)
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setLedger(data);
  }

  async function redeemReward(reward: Reward) {
    if (balance < reward.points_cost) { toast.error("Not enough points."); return; }
    setRedeeming(reward.id);
    try {
      const { error: redeemError } = await supabase.from("reward_redemptions").insert({
        user_id: clerkUserId!,
        reward_id: reward.id,
        points_spent: reward.points_cost,
      });
      if (redeemError) throw redeemError;

      const { error: ledgerError } = await supabase.from("fan_point_ledger").insert({
        user_id: clerkUserId!,
        points: -reward.points_cost,
        reason: `Redeemed: ${reward.name}`,
      });
      if (ledgerError) throw ledgerError;

      toast.success(`${reward.name} redeemed!`);
      await Promise.all([fetchBalance(), fetchLedger()]);
    } catch {
      toast.error("Redemption failed.");
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <AppShell title="Rewards">
      <div className="space-y-5 fade-in-up">
        {/* Balance */}
        <div className="glassmorphism rounded-2xl p-6 text-center border border-teal/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 mx-auto mb-3">
            <Star className="h-7 w-7 text-amber-400" />
          </div>
          <p className="text-4xl font-bold text-foreground">{balance.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">Fan Points</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-black/20 p-1">
          {(["redeem", "history"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold capitalize transition-smooth ${
                tab === t ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "redeem" ? <Gift className="h-3.5 w-3.5" /> : <History className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal" />
          </div>
        ) : tab === "redeem" ? (
          rewards.length === 0 ? (
            <div className="glassmorphism rounded-2xl py-12 text-center">
              <Gift className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No rewards available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rewards.map((r) => (
                <div key={r.id} className="glassmorphism rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">{r.points_cost.toLocaleString()} pts</span>
                    </div>
                  </div>
                  <button
                    onClick={() => redeemReward(r)}
                    disabled={balance < r.points_cost || redeeming === r.id}
                    className="rounded-xl bg-teal px-4 py-2 text-xs font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {redeeming === r.id ? "…" : "Redeem"}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          ledger.length === 0 ? (
            <div className="glassmorphism rounded-2xl py-12 text-center">
              <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No point history yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ledger.map((entry) => (
                <div key={entry.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className={`text-sm font-bold ${entry.points >= 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                    {entry.points >= 0 ? "+" : ""}{entry.points}
                  </p>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
