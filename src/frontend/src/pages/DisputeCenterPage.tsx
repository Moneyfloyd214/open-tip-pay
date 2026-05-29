import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { TriangleAlert as AlertTriangle, Plus, X, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Dispute {
  id: string;
  transaction_id: string | null;
  reason: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open:     "bg-amber-500/20 text-amber-400",
  resolved: "bg-teal/20 text-teal",
  rejected: "bg-destructive/20 text-destructive",
};

export default function DisputeCenterPage() {
  const { clerkUserId } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [user]);

  async function loadDisputes() {
    if (!clerkUserId) return;
    const { data } = await supabase
      .from("disputes")
      .select("*")
      .eq("user_id", clerkUserId)
      .order("created_at", { ascending: false });
    if (data) setDisputes(data);
    setLoading(false);
  }

  async function submitDispute() {
    if (!reason.trim() || !clerkUserId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("disputes").insert({
        user_id: clerkUserId,
        transaction_id: txnId.trim() || null,
        reason: reason.trim(),
        status: "open",
      });
      if (error) throw error;
      toast.success("Dispute submitted.");
      setShowForm(false);
      setTxnId("");
      setReason("");
      loadDisputes();
    } catch {
      toast.error("Failed to submit dispute.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Dispute Center" showBack>
      <div className="space-y-4 fade-in-up">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Dispute a transaction or report an issue.</p>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "Cancel" : "New Dispute"}
          </button>
        </div>

        {showForm && (
          <div className="glassmorphism rounded-2xl p-5 space-y-3 border border-teal/20 fade-in-up">
            <h3 className="text-sm font-semibold text-foreground">File a Dispute</h3>
            <input
              type="text"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="Transaction ID (optional)"
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth resize-none"
            />
            <button
              disabled={!reason.trim() || submitting}
              onClick={submitDispute}
              className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit Dispute"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="glassmorphism rounded-2xl py-12 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No disputes on file.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="glassmorphism rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm text-foreground">{d.reason}</p>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[d.status] ?? "bg-white/10 text-foreground"}`}>
                    {d.status}
                  </span>
                </div>
                {d.transaction_id && (
                  <p className="text-[11px] text-muted-foreground mb-1">Txn: {d.transaction_id}</p>
                )}
                {d.resolution_notes && (
                  <p className="text-xs text-teal bg-teal/5 rounded-lg px-3 py-2 mt-2">{d.resolution_notes}</p>
                )}
                <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(d.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
