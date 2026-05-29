import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Users, Plus, Minus, CircleCheck as CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  name: string;
  percent: number;
}

export default function SplitPaymentPage() {
  const { clerkUserId } = useAuth();
  const [totalAmount, setTotalAmount] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "", percent: 50 },
    { name: "", percent: 50 },
  ]);
  const [equalSplit, setEqualSplit] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const total = parseFloat(totalAmount) || 0;
  const pctTotal = participants.reduce((s, p) => s + p.percent, 0);
  const validPct = Math.abs(pctTotal - 100) < 0.01;
  const canSplit = total > 0 && participants.every(p => p.name.trim()) && validPct;

  function addParticipant() {
    if (participants.length >= 6) return;
    const even = Math.floor(100 / (participants.length + 1));
    const newParts = participants.map(p => ({ ...p, percent: even }));
    newParts.push({ name: "", percent: 100 - even * participants.length });
    setParticipants(newParts);
  }

  function removeParticipant(i: number) {
    if (participants.length <= 2) return;
    const newParts = participants.filter((_, idx) => idx !== i);
    if (equalSplit) {
      const even = 100 / newParts.length;
      setParticipants(newParts.map(p => ({ ...p, percent: even })));
    } else {
      setParticipants(newParts);
    }
  }

  function updateName(i: number, name: string) {
    setParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, name } : p));
  }

  function updatePercent(i: number, val: string) {
    const pct = parseFloat(val) || 0;
    setParticipants(prev => prev.map((p, idx) => idx === i ? { ...p, percent: pct } : p));
  }

  function toggleEqual() {
    const next = !equalSplit;
    setEqualSplit(next);
    if (next) {
      const even = 100 / participants.length;
      setParticipants(prev => prev.map(p => ({ ...p, percent: even })));
    }
  }

  async function handleSplit() {
    if (!canSplit || !clerkUserId) return;
    setSending(true);
    try {
      const rows = participants.map(p => ({
        staff_id: clerkUserId,
        fan_id: clerkUserId,
        amount: parseFloat((total * p.percent / 100).toFixed(2)),
        tipper_name: p.name.trim(),
        transaction_type: "digital",
        category: "general",
        note: `Split payment — ${p.percent.toFixed(1)}%`,
      }));
      const { error } = await supabase.from("transactions").insert(rows);
      if (error) throw error;
      setDone(true);
      toast.success("Split payment processed!");
    } catch {
      toast.error("Failed to process split.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <AppShell title="Split Payment" showBack>
        <div className="flex flex-col items-center justify-center py-20 gap-4 fade-in-up">
          <CheckCircle className="h-16 w-16 text-teal" />
          <h2 className="text-xl font-bold text-foreground">Split Complete!</h2>
          <p className="text-sm text-muted-foreground">${total.toFixed(2)} split among {participants.length} people.</p>
          <button
            onClick={() => { setDone(false); setTotalAmount(""); setParticipants([{name:"",percent:50},{name:"",percent:50}]); }}
            className="rounded-xl bg-teal px-6 py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth"
          >
            New Split
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Split Payment" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Total */}
        <div className="glassmorphism rounded-2xl p-5">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Total Amount to Split</label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth text-center"
          />
        </div>

        {/* Participants */}
        <div className="glassmorphism rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal" />
              <span className="text-sm font-semibold text-foreground">Participants ({participants.length})</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <div
                onClick={toggleEqual}
                className={`h-5 w-9 rounded-full transition-smooth relative ${equalSplit ? "bg-teal" : "bg-white/10"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${equalSplit ? "left-[18px]" : "left-0.5"}`} />
              </div>
              Equal
            </label>
          </div>

          {participants.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={p.name}
                onChange={(e) => updateName(i, e.target.value)}
                placeholder={`Person ${i + 1}`}
                className="flex-1 rounded-xl border border-border bg-black/20 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={p.percent}
                  onChange={(e) => !equalSplit && updatePercent(i, e.target.value)}
                  readOnly={equalSplit}
                  className={`w-16 rounded-xl border border-border bg-black/20 px-2 py-2.5 text-sm text-center text-foreground focus:border-teal focus:outline-none transition-smooth ${equalSplit ? "opacity-60" : ""}`}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              {total > 0 && (
                <span className="w-16 text-right text-xs font-semibold text-teal">
                  ${(total * p.percent / 100).toFixed(2)}
                </span>
              )}
              {participants.length > 2 && (
                <button onClick={() => removeParticipant(i)} className="text-destructive hover:text-destructive/80">
                  <Minus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {!validPct && (
            <p className="text-xs text-destructive">Percentages must add up to 100% (currently {pctTotal.toFixed(1)}%)</p>
          )}

          {participants.length < 6 && (
            <button
              onClick={addParticipant}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-teal/40 transition-smooth"
            >
              <Plus className="h-4 w-4" /> Add Person
            </button>
          )}
        </div>

        <button
          disabled={!canSplit || sending}
          onClick={handleSplit}
          className="w-full rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 disabled:cursor-not-allowed glow-teal-hero"
        >
          {sending ? "Processing…" : `Split $${total.toFixed(2)}`}
        </button>
      </div>
    </AppShell>
  );
}
