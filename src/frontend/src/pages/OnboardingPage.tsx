import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ChevronRight, X, DollarSign, QrCode, Star,
  Shield, Zap, ArrowRight, Check,
} from "lucide-react";

// ── Slide definitions ──────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    tag: "Welcome",
    title: "Welcome to Colts Tip Pay",
    subtitle: "powered by Open Tip Pay",
    body: "Modern, mobile-first payment and tipping experience built for Lucas Oil Stadium. Pay instantly, tip effortlessly, and earn rewards every time.",
    icon: DollarSign,
    iconBg: "bg-teal/20",
    iconColor: "text-teal",
    accent: "from-teal/20 to-transparent",
    visual: (
      <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-teal/10 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-teal/15" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal glow-teal z-10">
          <DollarSign className="h-10 w-10 text-white" />
        </div>
      </div>
    ),
  },
  {
    id: 2,
    tag: "Payments",
    title: "Send & Receive Instantly",
    subtitle: "Universal payments for everyone",
    body: "Fans, staff, and businesses all use the same platform. Send money P2P, split bills with your crew, or request payment — all from your phone in seconds.",
    icon: Zap,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    accent: "from-blue-500/15 to-transparent",
    visual: (
      <div className="mx-auto w-full max-w-xs space-y-2">
        {[
          { name: "Bartender · Jake",  amount: "+$12.00", dir: "in",  delay: "" },
          { name: "You → Section 122", amount: "-$5.00",  dir: "out", delay: "animation-delay-150" },
          { name: "Fan Split · 3 ppl", amount: "+$8.50",  dir: "in",  delay: "animation-delay-300" },
        ].map((row, i) => (
          <div key={i} className={`glassmorphism rounded-xl px-4 py-3 flex items-center justify-between fade-in-up ${row.delay}`}>
            <div className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center ${row.dir === "in" ? "bg-teal/20" : "bg-white/10"}`}>
                <ArrowRight className={`h-3.5 w-3.5 ${row.dir === "in" ? "text-teal rotate-180" : "text-muted-foreground"}`} />
              </div>
              <span className="text-xs text-foreground">{row.name}</span>
            </div>
            <span className={`text-xs font-bold ${row.dir === "in" ? "text-teal" : "text-muted-foreground"}`}>{row.amount}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 3,
    tag: "Tipping",
    title: "Tip Your Crew",
    subtitle: "No cash? No problem.",
    body: "Scan any staff member's QR badge to tip concession workers, bartenders, valet, and more — directly from your phone. Fast, contactless, and instant.",
    icon: QrCode,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    accent: "from-emerald-500/15 to-transparent",
    visual: (
      <div className="mx-auto flex flex-col items-center gap-4">
        <div className="glassmorphism rounded-2xl p-5 border border-teal/30 flex flex-col items-center gap-3">
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 49 }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-sm ${
                  [0,1,2,7,14,21,28,35,42,43,44,6,13,20,27,34,41,48,3,5,10,12,15,17,22,23,24,25,26,31,33,38,40,45,47].includes(i)
                    ? "bg-teal"
                    : "bg-transparent"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-medium">Scan to Tip</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-teal/20 px-4 py-2 border border-teal/30">
          <Check className="h-3.5 w-3.5 text-teal" />
          <span className="text-xs font-semibold text-teal">$5.00 tip sent!</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    tag: "Rewards",
    title: "Earn Fan Points",
    subtitle: "Every dollar = more Colts perks",
    body: "Every payment inside Lucas Oil Stadium earns Fan Points. Redeem for merch, food credits, premium seating upgrades, and exclusive Indianapolis Colts experiences.",
    icon: Star,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    accent: "from-amber-500/15 to-transparent",
    visual: (
      <div className="mx-auto flex flex-col items-center gap-4 w-full max-w-xs">
        <div className="glassmorphism rounded-2xl p-5 border border-amber-500/20 w-full">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <Star className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fan Points</p>
              <p className="text-xs text-muted-foreground">Lucas Oil Stadium</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-400">2,450 pts</p>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div className="h-2 w-3/5 rounded-full bg-amber-400" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">550 pts to next reward</p>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full">
          {["Merch", "Food", "Seats"].map(r => (
            <div key={r} className="glassmorphism rounded-xl py-2 text-center">
              <p className="text-[10px] text-muted-foreground">{r}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    tag: "Security",
    title: "Secure & Trusted",
    subtitle: "Bank-level protection",
    body: "Login with biometrics, freeze all withdrawals instantly with Vault Lock, and require 2FA on every transfer. Your money is always protected — in the stadium and beyond.",
    icon: Shield,
    iconBg: "bg-blue-600/20",
    iconColor: "text-blue-400",
    accent: "from-blue-600/15 to-transparent",
    visual: (
      <div className="mx-auto flex flex-col items-center gap-3 w-full max-w-xs">
        {[
          { label: "Biometric Login",       status: "Active",  color: "text-teal",       bg: "bg-teal/20" },
          { label: "Vault Lock",            status: "Enabled", color: "text-amber-400",  bg: "bg-amber-500/20" },
          { label: "2FA Withdrawals",       status: "On",      color: "text-blue-400",   bg: "bg-blue-500/20" },
          { label: "Internet Identity",     status: "Verified",color: "text-emerald-400",bg: "bg-emerald-500/20" },
        ].map(({ label, status, color, bg }) => (
          <div key={label} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Check className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-xs text-foreground">{label}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${color}`}>{status}</span>
          </div>
        ))}
      </div>
    ),
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
interface OnboardingPageProps {
  demoMode?: boolean;
}

export default function OnboardingPage({ demoMode = false }: OnboardingPageProps) {
  const { user } = useAuth();
  const [slide, setSlide] = useState(0);
  const [completing, setCompleting] = useState(false);

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  const progress = ((slide + 1) / SLIDES.length) * 100;

  async function markOnboardingComplete() {
    if (!user || completing) return;
    setCompleting(true);
    await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);
    window.location.href = demoMode ? "/dashboard?demo=1" : "/dashboard";
  }

  function skip() {
    if (demoMode) {
      window.location.href = "/dashboard?demo=1";
    } else {
      markOnboardingComplete();
    }
  }

  function next() {
    if (isLast) {
      markOnboardingComplete();
    } else {
      setSlide(s => s + 1);
    }
  }

  const Icon = current.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className={`absolute inset-0 bg-gradient-to-b ${current.accent} opacity-60 transition-all duration-700`} />
        <div className="absolute left-1/4 top-[-20%] h-[600px] w-[600px] rounded-full bg-teal/[0.05] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-safe-top pt-6 pb-2">
        {/* Colts branding */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-bold text-foreground">Colts Tip Pay</span>
        </div>
        {/* Skip */}
        <button
          onClick={skip}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-white/15 hover:text-foreground transition-smooth"
        >
          <X className="h-3 w-3" />
          Skip
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-2">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-1 rounded-full bg-teal transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-1.5 flex-1 mx-0.5 rounded-full transition-smooth ${i === slide ? "bg-teal" : i < slide ? "bg-teal/40" : "bg-white/10"}`}
            />
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-4 overflow-y-auto">
        {/* Visual area */}
        <div className="flex items-center justify-center py-6 min-h-[200px]">
          {current.visual}
        </div>

        {/* Tag */}
        <div className="flex justify-center mb-3">
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${current.iconBg} ${current.iconColor}`}>
            {current.tag}
          </span>
        </div>

        {/* Text */}
        <div className="text-center space-y-2 mb-2">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {current.title}
          </h1>
          <p className="text-sm font-semibold text-teal">{current.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {current.body}
          </p>
        </div>

        {/* Slide dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-smooth ${i === slide ? "w-6 h-2 bg-teal" : "w-2 h-2 bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-6 pb-safe-bottom pb-8 space-y-3">
        {isLast && demoMode && (
          <button
            onClick={() => { window.location.href = "/dashboard"; }}
            className="w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-teal/40 transition-smooth"
          >
            Sign In with My Account
          </button>
        )}
        <button
          onClick={next}
          disabled={completing}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-60 glow-teal-hero"
        >
          {completing ? (
            "Getting Started…"
          ) : isLast ? (
            <>
              {demoMode ? "Start Demo" : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
