import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { DollarSign, Send, QrCode, ArrowDownLeft, Receipt, Star, TriangleAlert as AlertTriangle, TrendingUp, Users, Zap } from "lucide-react";
import { toast } from "sonner";

interface RecentTip {
  id: string;
  amount: number;
  tipper_name: string | null;
  created_at: string;
  transaction_type: string;
}

interface Stats {
  total_received: number;
  total_this_week: number;
  tip_count: number;
}

export default function RoleDashboard() {
  const { user, profile } = useAuth();
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [stats, setStats] = useState<Stats>({ total_received: 0, total_this_week: 0, tip_count: 0 });
  const [fanPoints, setFanPoints] = useState(0);
  const [q3Active, setQ3Active] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";
  const tipSlug = user?.id?.slice(0, 8) ?? "";

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchTips(),
      fetchFanPoints(),
      fetchQ3Status(),
    ]).finally(() => setLoadingData(false));
  }, [user]);

  async function fetchTips() {
    const { data } = await supabase
      .from("transactions")
      .select("id, amount, tipper_name, created_at, transaction_type")
      .eq("staff_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setRecentTips(data);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekData = data.filter(t => new Date(t.created_at) >= weekAgo);
      setStats({
        total_received: data.reduce((s, t) => s + (t.amount || 0), 0),
        total_this_week: weekData.reduce((s, t) => s + (t.amount || 0), 0),
        tip_count: data.length,
      });
    }
  }

  async function fetchFanPoints() {
    const { data } = await supabase
      .from("fan_point_balances")
      .select("total_points")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) setFanPoints(Number(data.total_points) || 0);
  }

  async function fetchQ3Status() {
    const { data } = await supabase
      .from("game_phases")
      .select("id, phase_name, is_active")
      .eq("is_active", true)
      .maybeSingle();
    if (data?.phase_name?.toLowerCase().includes("q3")) setQ3Active(true);
  }

  const QUICK_ACTIONS = [
    { label: "Send Tip",    icon: Send,         href: "/wallet/send",    color: "bg-teal/20 text-teal" },
    { label: "My QR",       icon: QrCode,        href: `/tip/${tipSlug}`, color: "bg-blue-500/20 text-blue-400" },
    { label: "Receive",     icon: ArrowDownLeft, href: "/wallet/request", color: "bg-emerald-500/20 text-emerald-400" },
    { label: "Split",       icon: Users,         href: "/wallet/split",   color: "bg-amber-500/20 text-amber-400" },
  ];

  return (
    <AppShell>
      <div className="space-y-6 fade-in-up">
        {/* Q3 Cutoff Banner */}
        {q3Active && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs font-medium text-amber-300">
              Q3 Cutoff is active — tips after the cutoff will be held until the next pool opens.
            </p>
          </div>
        )}

        {/* Welcome + Balance */}
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold text-foreground capitalize">{displayName}</h1>
          {profile?.role && (
            <span className="mt-1 inline-flex items-center rounded-full bg-teal/20 px-2.5 py-0.5 text-[11px] font-semibold text-teal capitalize">
              {profile.role}
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Earned",  value: `$${stats.total_received.toFixed(2)}`, icon: DollarSign },
            { label: "This Week",     value: `$${stats.total_this_week.toFixed(2)}`, icon: TrendingUp },
            { label: "Tips",          value: stats.tip_count.toString(),             icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glassmorphism rounded-2xl p-4 text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-teal" />
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
              <button
                key={label}
                onClick={() => { window.location.href = href; }}
                className="flex flex-col items-center gap-2 rounded-2xl glassmorphism p-4 hover:border-teal/40 transition-smooth"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fan Points */}
        {fanPoints > 0 && (
          <button
            onClick={() => { window.location.href = "/rewards"; }}
            className="w-full glassmorphism rounded-2xl p-4 flex items-center justify-between border-teal/20 hover:border-teal/40 transition-smooth"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Fan Points</p>
                <p className="text-xs text-muted-foreground">Redeem for rewards</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-400">{fanPoints.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">pts</p>
            </div>
          </button>
        )}

        {/* Recent Tips */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Tips</h2>
            <button
              onClick={() => { window.location.href = "/transactions"; }}
              className="text-xs text-teal hover:text-teal-light transition-smooth"
            >
              View all
            </button>
          </div>
          {loadingData ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : recentTips.length === 0 ? (
            <div className="glassmorphism rounded-2xl py-10 text-center">
              <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No tips yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Share your tip link to start receiving.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTips.map((tip) => (
                <div key={tip.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-xs font-bold">
                      {(tip.tipper_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tip.tipper_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tip.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-teal">+${(tip.amount || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tip Link */}
        <div className="glassmorphism rounded-2xl p-4 border border-teal/20">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Your Tip Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/20 px-3 py-2 text-xs text-muted-foreground">
              {window.location.origin}/tip/{tipSlug}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/tip/${tipSlug}`);
                toast.success("Tip link copied!");
              }}
              className="rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
