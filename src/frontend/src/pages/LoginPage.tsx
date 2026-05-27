import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DollarSign, Eye, EyeOff, Loader as Loader2, Shield, Smartphone, Zap } from "lucide-react";

type Mode = "signin" | "signup";

const FEATURES = [
  { icon: Zap, label: "Instant", desc: "Real-time tips" },
  { icon: Shield, label: "Secure", desc: "Bank-grade auth" },
  { icon: Smartphone, label: "Mobile-First", desc: "Works anywhere" },
] as const;

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (mode === "signup") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
      } else {
        setSuccess("Account created! You can now sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setLoading(false);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setSuccess("");
  }

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

        {/* Auth card */}
        <div className="glassmorphism rounded-2xl p-7">
          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl bg-black/20 p-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-smooth ${
                  mode === m ? "bg-teal text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  required
                  minLength={mode === "signup" ? 8 : 1}
                  className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 text-sm font-bold text-white transition-smooth hover:bg-teal-light disabled:opacity-60 glow-teal-hero"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
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

        <p className="text-center text-[11px] text-muted-foreground/50">
          © {new Date().getFullYear()} Open Tip Pay
        </p>
      </div>
    </div>
  );
}
