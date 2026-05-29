import { SignIn, SignUp } from "@clerk/clerk-react";
import { DollarSign, Shield, Smartphone, Zap } from "lucide-react";
import { useState } from "react";

type Mode = "signin" | "signup";

const FEATURES = [
  { icon: Zap, label: "Instant", desc: "Real-time tips" },
  { icon: Shield, label: "Secure", desc: "Bank-grade auth" },
  { icon: Smartphone, label: "Mobile-First", desc: "Works anywhere" },
] as const;

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/4 top-[-10%] h-[400px] w-[400px] rounded-full bg-teal/[0.12] blur-[60px]" />
        <div className="absolute bottom-[-5%] right-1/4 h-[320px] w-[320px] rounded-full bg-teal/[0.08] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Logo / wordmark */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal shadow-2xl ring-2 ring-teal/40 glow-teal">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Open Tip Pay</h1>
            <p className="text-sm text-muted-foreground">Cashless tipping for the modern workforce</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-black/20 p-1">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-smooth ${
                mode === m ? "bg-teal text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Clerk auth UI */}
        <div className="flex justify-center">
          {mode === "signin" ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "glassmorphism rounded-2xl border-0 shadow-none bg-transparent",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-teal hover:bg-teal-light text-white font-bold rounded-xl glow-teal-hero",
                  formFieldInput: "rounded-xl border border-border bg-black/20 text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-teal/40",
                  formFieldLabel: "text-foreground",
                  footerActionLink: "text-teal hover:text-teal-light",
                  identityPreviewText: "text-foreground",
                  identityPreviewEditButton: "text-teal",
                },
              }}
              forceRedirectUrl="/dashboard"
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "glassmorphism rounded-2xl border-0 shadow-none bg-transparent",
                  headerTitle: "text-foreground",
                  headerSubtitle: "text-muted-foreground",
                  formButtonPrimary: "bg-teal hover:bg-teal-light text-white font-bold rounded-xl glow-teal-hero",
                  formFieldInput: "rounded-xl border border-border bg-black/20 text-foreground placeholder:text-muted-foreground focus:border-teal focus:ring-teal/40",
                  formFieldLabel: "text-foreground",
                  footerActionLink: "text-teal hover:text-teal-light",
                },
              }}
              forceRedirectUrl="/onboarding"
            />
          )}
        </div>

        {/* Feature highlights */}
        <div className="glassmorphism rounded-2xl px-4 py-5">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/15">
                  <Icon className="h-4 w-4 text-teal" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] leading-tight text-muted-foreground/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo mode entry */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => { window.location.href = "/onboarding?demo=1"; }}
            className="text-xs text-muted-foreground hover:text-teal transition-smooth underline underline-offset-4"
          >
            Explore as a Guest — no account needed
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50">
          © {new Date().getFullYear()} Open Tip Pay
        </p>
      </div>
    </div>
  );
}
