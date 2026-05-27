import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Receipt, ArrowDownLeft, ArrowUpRight, Loader as Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  tipper_name: string | null;
  note: string | null;
  transaction_type: string;
  category: string | null;
  created_at: string;
  staff_id: string | null;
  fan_id: string | null;
  is_q3_cutoff: boolean;
}

type Filter = "all" | "received" | "sent" | "food" | "alcohol";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-400",
  alcohol: "bg-purple-500/20 text-purple-400",
  general: "bg-blue-500/20 text-blue-400",
};

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setTxns([]);
    setPage(0);
    setHasMore(true);
    loadTxns(0);
  }, [filter, user]);

  async function loadTxns(pageNum: number) {
    if (!user) return;
    setLoading(true);

    let q = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1);

    if (filter === "received") q = q.eq("staff_id", user.id);
    else if (filter === "sent") q = q.eq("fan_id", user.id).neq("staff_id", user.id);
    else if (filter === "food") q = q.eq("category", "food");
    else if (filter === "alcohol") q = q.eq("category", "alcohol");
    else q = q.or(`staff_id.eq.${user.id},fan_id.eq.${user.id}`);

    const { data } = await q;
    if (data) {
      setTxns(prev => pageNum === 0 ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadTxns(next);
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "received", label: "Received" },
    { key: "sent",     label: "Sent" },
    { key: "food",     label: "Food" },
    { key: "alcohol",  label: "Alcohol" },
  ];

  return (
    <AppShell title="Activity">
      <div className="space-y-4 fade-in-up">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-smooth ${
                filter === key
                  ? "bg-teal text-white"
                  : "bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && txns.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-teal" />
          </div>
        ) : txns.length === 0 ? (
          <div className="glassmorphism rounded-2xl py-12 text-center">
            <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txns.map((t) => {
              const isReceived = t.staff_id === user?.id;
              const catColor = CATEGORY_COLORS[t.category ?? "general"] ?? CATEGORY_COLORS.general;
              return (
                <div key={t.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isReceived ? "bg-teal/20" : "bg-white/10"}`}>
                    {isReceived
                      ? <ArrowDownLeft className="h-4 w-4 text-teal" />
                      : <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {t.tipper_name || (isReceived ? "Anonymous" : "Sent")}
                      </p>
                      {t.category && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColor}`}>
                          {t.category}
                        </span>
                      )}
                      {t.is_q3_cutoff && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Q3</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.note || t.transaction_type} · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${isReceived ? "text-teal" : "text-muted-foreground"}`}>
                    {isReceived ? "+" : "-"}${t.amount.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && txns.length > 0 && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full rounded-xl border border-border py-3 text-sm text-muted-foreground hover:text-foreground hover:border-teal/40 transition-smooth disabled:opacity-40"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
