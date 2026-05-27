import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DollarSign, Star, ShoppingCart, Wifi, LogOut, QrCode, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import FanPointsWidget from "@/features/FanPoints/FanPointsWidget";
import FoodOrderingWidget from "@/features/FoodOrdering/FoodOrderingWidget";
import POSStatusWidget from "@/features/POSIntegration/POSStatusWidget";

type Tab = "tips" | "points" | "food" | "pos";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "tips",   label: "Tip",      icon: DollarSign   },
  { key: "points", label: "Points",   icon: Star         },
  { key: "food",   label: "Order",    icon: ShoppingCart },
  { key: "pos",    label: "Stands",   icon: Wifi         },
];

export default function FanDashboardPage() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("tips");
  const [copied, setCopied] = useState(false);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Fan";
  const tipUrl = `${window.location.origin}/tip/${user?.id?.slice(0, 8)}`;

  function copyTipUrl() {
    navigator.clipboard.writeText(tipUrl);
    setCopied(true);
    toast.success("Tip link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-[-10%] h-[400px] w-[400px] rounded-full bg-teal/[0.1] blur-[80px]" />
        <div className="absolute bottom-[-5%] right-1/4 h-[300px] w-[300px] rounded-full bg-teal/[0.06] blur-[80px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-foreground">Open Tip Pay</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 py-6 pb-28">
        {/* Welcome */}
        <div className="mb-6 fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Hey, {displayName}!</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Fan · {user?.email}</p>
        </div>

        {/* Quick tip QR */}
        {tab === "tips" && (
          <div className="mb-6 glassmorphism rounded-2xl p-5 border border-teal/20 fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
                <QrCode className="h-5 w-5 text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Your Tip Link</p>
                <p className="text-xs text-muted-foreground">Share to receive tips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-black/20 px-3 py-2 text-xs text-muted-foreground truncate">
                {tipUrl}
              </code>
              <button
                onClick={copyTipUrl}
                className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground/60">
              Anyone with this link can tip you — no account required.
            </p>
          </div>
        )}

        {/* Feature content */}
        <div className="fade-in-up">
          {tab === "tips"   && <TipSendWidget />}
          {tab === "points" && <FanPointsWidget />}
          {tab === "food"   && <FoodOrderingWidget />}
          {tab === "pos"    && <POSStatusWidget />}
        </div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-smooth ${
                tab === key ? "text-teal" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${tab === key ? "text-teal" : ""}`} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// Quick send-a-tip widget for the fan's own contacts
function TipSendWidget() {
  const [slug, setSlug] = useState("");
  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");

  const PRESETS = [1, 2, 5, 10];

  return (
    <div className="space-y-4">
      <div className="glassmorphism rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Send a Tip</h3>
        <p className="text-xs text-muted-foreground mb-4">Enter a staff member's tip page link or slug to tip them directly.</p>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Tip page slug or URL"
          className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/40 transition-smooth mb-3"
        />
        <div className="flex gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-smooth ${
                amount === p ? "bg-teal text-white" : "bg-black/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth mb-3"
        />
        <button
          disabled={!slug.trim() || amount === 0 || !name.trim()}
          onClick={() => {
            const dest = slug.startsWith("http") ? slug : `${window.location.origin}/tip/${slug}`;
            window.open(dest, "_blank");
          }}
          className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 disabled:cursor-not-allowed glow-teal-hero"
        >
          {amount > 0 ? `Go to Tip Page — $${amount}` : "Go to Tip Page"}
        </button>
      </div>
    </div>
  );
}
