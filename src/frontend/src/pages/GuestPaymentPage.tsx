import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DollarSign, CircleCheck as CheckCircle, Loader as Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TipLink {
  id: string;
  slug: string;
  title: string;
  message: string;
  worker_id: string;
}

interface WorkerProfile {
  full_name: string;
  avatar_url: string;
}

const PRESETS = [1, 2, 5, 10, 20, 50];

type Step = "loading" | "notfound" | "input" | "submitting" | "success";

function GuestPaymentContent() {
  const slug = window.location.pathname.split("/tip/")[1]?.split("/")[0] ?? "";

  const [step, setStep] = useState<Step>("loading");
  const [tipLink, setTipLink] = useState<TipLink | null>(null);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [tipperEmail, setTipperEmail] = useState("");
  const [note, setNote] = useState("");

  const effectiveAmount = customAmount ? parseFloat(customAmount) : amount;
  const canPay = effectiveAmount >= 1 && tipperName.trim().length >= 2;

  useEffect(() => {
    if (!slug) { setStep("notfound"); return; }
    (async () => {
      const { data: link } = await supabase
        .from("tip_links")
        .select("id, slug, title, message, worker_id")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!link) { setStep("notfound"); return; }
      setTipLink(link);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", link.worker_id)
        .maybeSingle();
      setWorker(profile);
      setStep("input");
    })();
  }, [slug]);

  async function handlePay() {
    if (!canPay || !tipLink) return;
    setStep("submitting");

    const { error } = await supabase.from("tips").insert({
      tip_link_id: tipLink.id,
      worker_id: tipLink.worker_id,
      tipper_name: tipperName.trim(),
      tipper_email: tipperEmail.trim(),
      amount_cents: Math.round(effectiveAmount * 100),
      message: note.trim(),
      status: "completed",
    });

    if (error) {
      toast.error("Something went wrong. Please try again.");
      setStep("input");
    } else {
      setStep("success");
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (step === "notfound") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div className="glassmorphism rounded-2xl p-8 max-w-sm w-full">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 mx-auto">
            <DollarSign className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Tip link not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This link may be inactive or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6 fade-in-up">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/20 border-2 border-teal mx-auto glow-teal">
            <CheckCircle className="h-10 w-10 text-teal" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Tip Sent!</h2>
            <p className="text-muted-foreground mt-1">${effectiveAmount.toFixed(2)} sent to {worker?.full_name || "your recipient"}</p>
          </div>
          <div className="glassmorphism rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">Thank you, {tipperName}! Your generosity makes a difference.</p>
            {tipLink?.message && (
              <p className="mt-3 text-sm font-medium text-teal">"{tipLink.message}"</p>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground hover:text-teal transition-smooth"
          >
            Send another tip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-[-10%] h-[300px] w-[300px] rounded-full bg-teal/[0.1] blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/20 mx-auto mb-3">
            <DollarSign className="h-6 w-6 text-teal" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Open Tip Pay</h1>
        </div>

        {/* Worker card */}
        <div className="glassmorphism rounded-2xl p-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/20 border-2 border-teal/40 mx-auto mb-3">
            {worker?.avatar_url ? (
              <img src={worker.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-teal">
                {(worker?.full_name || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-foreground">{tipLink?.title || "Send a Tip"}</h2>
          {worker?.full_name && <p className="text-sm text-muted-foreground">to {worker.full_name}</p>}
          {tipLink?.message && <p className="mt-2 text-xs text-muted-foreground/70 italic">"{tipLink.message}"</p>}
        </div>

        {/* Amount selection */}
        <div className="glassmorphism rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Select Amount</h3>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => { setAmount(p); setCustomAmount(""); }}
                className={`rounded-xl py-2.5 text-sm font-semibold transition-smooth ${
                  amount === p && !customAmount
                    ? "bg-teal text-white glow-teal"
                    : "bg-black/20 text-muted-foreground hover:text-foreground hover:bg-black/30"
                }`}
              >
                ${p}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Custom amount ($)"
            value={customAmount}
            min={1}
            step={0.01}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
          />
        </div>

        {/* Your info */}
        <div className="glassmorphism rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Your Details</h3>
          <input
            type="text"
            placeholder="Your name *"
            value={tipperName}
            onChange={(e) => setTipperName(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
          />
          <input
            type="email"
            placeholder="Email (optional)"
            value={tipperEmail}
            onChange={(e) => setTipperEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
          />
          <input
            type="text"
            placeholder="Leave a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
          />
        </div>

        {/* Pay button */}
        <button
          type="button"
          onClick={handlePay}
          disabled={!canPay || step === "submitting"}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-smooth ${
            canPay
              ? "bg-teal text-white glow-teal-hero hover:bg-teal-light"
              : "bg-black/20 text-muted-foreground cursor-not-allowed"
          }`}
        >
          {step === "submitting" ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          ) : (
            <>
              <DollarSign className="h-5 w-5" />
              {effectiveAmount >= 1 ? `Send $${effectiveAmount.toFixed(2)} Tip` : "Select an amount"}
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-muted-foreground/40 pb-4">
          Secured by Open Tip Pay
        </p>
      </div>
    </div>
  );
}

export function GuestPaymentPage() {
  return <GuestPaymentContent />;
}

export default GuestPaymentPage;
