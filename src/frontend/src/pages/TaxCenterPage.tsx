import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { FileText, Download, CircleAlert as AlertCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface MonthRow {
  month: string;
  count: number;
  total: number;
}

export default function TaxCenterPage() {
  const { clerkUserId } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [totalEarned, setTotalEarned] = useState(0);
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clerkUserId) return;
    loadData();
  }, [year, clerkUserId]);

  async function loadData() {
    setLoading(true);
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const { data } = await supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("staff_id", clerkUserId!)
      .gte("created_at", start)
      .lte("created_at", end);

    if (!data) { setLoading(false); return; }

    setTotalEarned(data.reduce((s, t) => s + t.amount, 0));

    const byMonth: Record<string, MonthRow> = {};
    data.forEach(t => {
      const m = new Date(t.created_at).toLocaleString("default", { month: "long" });
      if (!byMonth[m]) byMonth[m] = { month: m, count: 0, total: 0 };
      byMonth[m].count++;
      byMonth[m].total += t.amount;
    });
    setMonthly(Object.values(byMonth));
    setLoading(false);
  }

  function exportCSV() {
    if (monthly.length === 0) { toast.error("No data to export."); return; }
    const rows = [
      ["Month", "Tips Count", "Total ($)"],
      ...monthly.map(m => [m.month, m.count.toString(), m.total.toFixed(2)]),
      ["TOTAL", monthly.reduce((s, m) => s + m.count, 0).toString(), totalEarned.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tips-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded.");
  }

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthMap: Record<string, MonthRow> = {};
  monthly.forEach(m => { monthMap[m.month] = m; });

  return (
    <AppShell title="Tax Center" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Year selector */}
        <div className="flex items-center justify-between glassmorphism rounded-2xl px-5 py-4">
          <button onClick={() => setYear(y => y - 1)} className="text-muted-foreground hover:text-foreground transition-smooth text-lg font-bold">‹</button>
          <span className="text-lg font-bold text-foreground">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="text-muted-foreground hover:text-foreground transition-smooth text-lg font-bold disabled:opacity-30"
          >›</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glassmorphism rounded-2xl p-4">
            <TrendingUp className="h-4 w-4 text-teal mb-2" />
            <p className="text-xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="glassmorphism rounded-2xl p-4">
            <FileText className="h-4 w-4 text-blue-400 mb-2" />
            <p className="text-xl font-bold text-foreground">{monthly.reduce((s, m) => s + m.count, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Tips</p>
          </div>
        </div>

        {/* 1099-K notice */}
        {totalEarned >= 600 && (
          <div className="flex gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              You may receive a 1099-K for {year}. Earnings over $600 are reportable. Consult a tax professional.
            </p>
          </div>
        )}

        {/* Monthly breakdown */}
        <div className="glassmorphism rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/40">
            <h2 className="text-sm font-semibold text-foreground">Monthly Breakdown</h2>
          </div>
          {loading ? (
            <div className="py-8 text-center">
              <div className="h-4 w-32 bg-white/5 rounded animate-pulse mx-auto" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/20">
                  <th className="px-5 py-2 text-left">Month</th>
                  <th className="px-5 py-2 text-right">Tips</th>
                  <th className="px-5 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(m => {
                  const row = monthMap[m];
                  return (
                    <tr key={m} className="border-b border-border/10 last:border-0">
                      <td className="px-5 py-2.5 text-foreground">{m}</td>
                      <td className="px-5 py-2.5 text-right text-muted-foreground">{row?.count ?? 0}</td>
                      <td className={`px-5 py-2.5 text-right font-semibold ${row ? "text-teal" : "text-muted-foreground/40"}`}>
                        ${(row?.total ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <button
          onClick={exportCSV}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-teal/40 transition-smooth"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
    </AppShell>
  );
}
