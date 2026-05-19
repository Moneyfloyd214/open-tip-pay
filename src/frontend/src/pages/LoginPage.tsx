import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Loader2, PlayCircle, Shield, Smartphone, Zap } from "lucide-react";
import { useDemoMode } from "../context/DemoContext";

const FEATURES = [
  { icon: Zap, label: "Instant", desc: "Real-time transfers" },
  { icon: Shield, label: "Secure", desc: "2FA + biometric" },
  { icon: Smartphone, label: "Mobile-First", desc: "PWA ready" },
] as const;

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();
  const { enterDemoMode } = useDemoMode();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-navy-dark px-4 py-12"
      data-testid="login-page-ready"
    >
      {/* Ambient background orbs — reduced blur for lower-end device paint perf */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-[-10%] h-[400px] w-[400px] rounded-full bg-teal/[0.12] blur-[60px]" />
        <div className="absolute bottom-[-5%] right-1/4 h-[320px] w-[320px] rounded-full bg-teal/[0.08] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-10 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <img
            src="/assets/generated/opentip-logo.dim_200x200.png"
            alt="Open Tip Pay"
            className="h-20 w-20 rounded-2xl shadow-2xl ring-2 ring-teal/40"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Wordmark */}
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">
              Open Tip Pay
            </h1>
            <p className="text-lg font-medium tracking-wide text-teal-light">
              Universal P2P Payment Platform
            </p>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/65">
              Send money, pay friends, split bills — instantly and securely.
            </p>
          </div>
        </div>

        {/* CTA buttons — Skip to Demo is rendered first for instant access */}
        <div className="space-y-3">
          {/* Demo bypass first in DOM order — ensures it's first-interactive */}
          <Button
            onClick={enterDemoMode}
            size="lg"
            variant="outline"
            data-ocid="login.skip_to_demo_button"
            className="w-full border border-teal/30 bg-teal/8 py-5 text-sm font-semibold text-teal transition-colors duration-200 hover:border-teal/60 hover:bg-teal/15"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Skip to Demo
          </Button>
          <p className="text-[11px] text-white/25">
            Explore with sample data · No sign-in required
          </p>

          <div className="relative flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] text-white/30">or sign in</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            data-ocid="login.get_started_button"
            className={`w-full bg-teal py-6 text-base font-bold text-white shadow-xl transition-colors duration-200 hover:bg-teal-dark ${
              !isLoggingIn ? "glow-teal-hero" : ""
            }`}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting…
              </>
            ) : (
              "Get Started"
            )}
          </Button>
          <p className="text-xs text-white/35">
            Secured by Internet Identity · No password required
          </p>
        </div>

        {/* Feature highlights */}
        <div className="glassmorphism rounded-2xl px-4 py-5">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 px-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/15">
                  <Icon className="h-4 w-4 text-teal" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-[10px] leading-tight text-white/45">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle footer */}
        <p className="text-[11px] text-white/25">
          © {new Date().getFullYear()} Open Tip Pay
        </p>
      </div>
    </div>
  );
}
