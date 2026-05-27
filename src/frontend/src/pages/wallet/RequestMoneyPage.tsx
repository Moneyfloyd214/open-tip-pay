import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Copy, Check, QrCode, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface TipStat {
  count: number;
  total: number;
}

export default function RequestMoneyPage() {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [weekStats, setWeekStats] = useState<TipStat>({ count: 0, total: 0 });
  const [monthStats, setMonthStats] = useState<TipStat>({ count: 0, total: 0 });
  const [recentTippers, setRecentTippers] = useState<{ name: string; amount: number }[]>([]);

  const tipSlug = user?.id?.slice(0, 8) ?? "";
  const tipUrl = `${window.location.origin}/tip/${tipSlug}`;

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  async function loadStats() {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);

    const { data } = await supabase
      .from("transactions")
      .select("amount, tipper_name, created_at")
      .eq("staff_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data) return;

    const week = data.filter(t => new Date(t.created_at) >= weekAgo);
    const month = data.filter(t => new Date(t.created_at) >= monthAgo);

    setWeekStats({ count: week.length, total: week.reduce((s, t) => s + t.amount, 0) });
    setMonthStats({ count: month.length, total: month.reduce((s, t) => s + t.amount, 0) });
    setRecentTippers(
      data.slice(0, 5).map(t => ({ name: t.tipper_name || "Anonymous", amount: t.amount }))
    );
  }

  function copyLink() {
    navigator.clipboard.writeText(tipUrl);
    setCopied(true);
    toast.success("Tip link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AppShell title="Receive Tips" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Tip link card */}
        <div className="glassmorphism rounded-2xl p-5 border border-teal/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
              <QrCode className="h-5 w-5 text-teal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Your Tip Link</p>
              <p className="text-xs text-muted-foreground">Share this to receive tips</p>
            </div>
          </div>

          <code className="block mb-3 rounded-xl bg-black/20 px-3 py-3 text-xs text-muted-foreground break-all">
            {tipUrl}
          </code>

          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth glow-teal-hero"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "This Week", count: weekStats.count, total: weekStats.total },
            { label: "This Month", count: monthStats.count, total: monthStats.total },
          ].map(({ label, count, total }) => (
            <div key={label} className="glassmorphism rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-teal" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">${total.toFixed(2)}</p>
              <p className="text-[11px] text-muted-foreground">{count} tip{count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>

        {/* Recent tippers */}
        {recentTippers.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Tippers</h2>
            <div className="space-y-2">
              {recentTippers.map((t, i) => (
                <div key={i} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-xs font-bold">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                  </div>
                  <p className="text-sm font-bold text-teal">+${t.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/60">
          Anyone with your tip link can tip you — no account required.
        </p>
      </div>
    </AppShell>
  );
}
