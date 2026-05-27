import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [1, 2, 5, 10, 20, 50];

export default function SendMoneyPage() {
  const { user } = useAuth();
  const [slug, setSlug] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;
  const canSend = slug.trim().length > 0 && finalAmount > 0;

  async function handleSend() {
    if (!canSend || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        staff_id: user.id,
        fan_id: user.id,
        amount: finalAmount,
        note,
        transaction_type: "digital",
        tipper_name: slug.trim(),
        category: "general",
      });
      if (error) throw error;
      toast.success(`$${finalAmount.toFixed(2)} sent!`);
      setSlug("");
      setAmount(0);
      setCustomAmount("");
      setNote("");
    } catch {
      toast.error("Failed to send — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell title="Send Money" showBack>
      <div className="space-y-5 fade-in-up">
        <div className="glassmorphism rounded-2xl p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Recipient</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Name, tip slug, or @handle"
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30 transition-smooth"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Amount</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setAmount(p); setCustomAmount(""); }}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-smooth ${
                    amount === p && !customAmount
                      ? "bg-teal text-white glow-teal"
                      : "bg-black/20 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
              placeholder="Custom amount"
              min="0.01"
              step="0.01"
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Great service!"
              maxLength={100}
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
            />
          </div>
        </div>

        {finalAmount > 0 && slug.trim() && (
          <div className="glassmorphism rounded-xl px-4 py-3 text-center fade-in-up">
            <p className="text-sm text-muted-foreground">
              Sending <span className="text-foreground font-bold">${finalAmount.toFixed(2)}</span> to{" "}
              <span className="text-teal font-semibold">{slug.trim()}</span>
            </p>
          </div>
        )}

        <button
          disabled={!canSend || sending}
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 disabled:cursor-not-allowed glow-teal-hero"
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : `Send${finalAmount > 0 ? ` $${finalAmount.toFixed(2)}` : ""}`}
        </button>
      </div>
    </AppShell>
  );
}
