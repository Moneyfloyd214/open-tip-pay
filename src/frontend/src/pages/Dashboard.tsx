import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { DollarSign, Copy, Check, LogOut, TrendingUp, Users, CreditCard, Plus, ExternalLink, Loader as Loader2, QrCode, Settings } from "lucide-react";
import { toast } from "sonner";

interface TipLink {
  id: string;
  slug: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

interface TipStat {
  total_tips: number;
  total_amount_cents: number;
  this_month_cents: number;
}

export default function Dashboard() {
  const { clerkUserId, profile, signOut } = useAuth();
  const [tipLinks, setTipLinks] = useState<TipLink[]>([]);
  const [stats, setStats] = useState<TipStat>({ total_tips: 0, total_amount_cents: 0, this_month_cents: 0 });
  const [loading, setLoading] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "settings">("overview");

  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "there";
  const origin = window.location.origin;

  useEffect(() => {
    if (!clerkUserId) return;
    loadData();
  }, [clerkUserId]);

  async function loadData() {
    setLoading(true);
    const [linksRes, tipsRes] = await Promise.all([
      supabase.from("tip_links").select("*").eq("worker_id", clerkUserId!).order("created_at", { ascending: false }),
      supabase.from("tips").select("amount_cents, created_at").eq("worker_id", clerkUserId!),
    ]);

    if (linksRes.data) setTipLinks(linksRes.data);

    if (tipsRes.data) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const total = tipsRes.data.reduce((s, t) => s + t.amount_cents, 0);
      const month = tipsRes.data
        .filter((t) => new Date(t.created_at) >= monthStart)
        .reduce((s, t) => s + t.amount_cents, 0);
      setStats({ total_tips: tipsRes.data.length, total_amount_cents: total, this_month_cents: month });
    }
    setLoading(false);
  }

  async function createTipLink() {
    if (!clerkUserId) return;
    setCreatingLink(true);
    const slug = `${(profile?.full_name || "tip").toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`;
    const { error } = await supabase.from("tip_links").insert({
      worker_id: clerkUserId,
      slug,
      title: `Tip ${profile?.full_name || "Me"}`,
      message: "Thank you for your generosity!",
    });
    if (error) {
      toast.error("Failed to create tip link");
    } else {
      toast.success("Tip link created!");
      loadData();
    }
    setCreatingLink(false);
  }

  async function toggleLink(id: string, current: boolean) {
    await supabase.from("tip_links").update({ is_active: !current }).eq("id", id);
    setTipLinks((prev) => prev.map((l) => l.id === id ? { ...l, is_active: !current } : l));
  }

  function copyLink(slug: string) {
    navigator.clipboard.writeText(`${origin}/tip/${slug}`);
    setCopiedSlug(slug);
    toast.success("Link copied!");
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-foreground">Open Tip Pay</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 fade-in-up">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 fade-in-up delay-500">
          {[
            { label: "Total Tips Received", value: loading ? "—" : String(stats.total_tips), icon: Users, color: "text-teal" },
            { label: "All-Time Earnings", value: loading ? "—" : fmt(stats.total_amount_cents), icon: TrendingUp, color: "text-teal" },
            { label: "This Month", value: loading ? "—" : fmt(stats.this_month_cents), icon: CreditCard, color: "text-teal" },
          ].map((s) => (
            <div key={s.label} className="glassmorphism rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-black/20 p-1 w-fit">
          {(["overview", "links", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-smooth ${
                activeTab === tab ? "bg-teal text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-4 fade-in-up">
            <div className="glassmorphism rounded-2xl p-6">
              <h2 className="mb-4 text-base font-semibold text-foreground flex items-center gap-2">
                <QrCode className="h-4 w-4 text-teal" />
                Your Tip Links
              </h2>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-teal" />
                </div>
              ) : tipLinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <DollarSign className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No tip links yet</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">Create your first tip link to start receiving tips</p>
                  <button
                    onClick={createTipLink}
                    disabled={creatingLink}
                    className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light transition-smooth disabled:opacity-60"
                  >
                    {creatingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Create Tip Link
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tipLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{link.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{origin}/tip/{link.slug}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${link.is_active ? "bg-teal/20 text-teal" : "bg-muted text-muted-foreground"}`}>
                          {link.is_active ? "Active" : "Off"}
                        </span>
                        <button
                          onClick={() => copyLink(link.slug)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-smooth"
                        >
                          {copiedSlug === link.slug ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a
                          href={`/tip/${link.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-smooth"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => toggleLink(link.id, link.is_active)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-smooth"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tipLinks.length > 0 && (
                <button
                  onClick={createTipLink}
                  disabled={creatingLink}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-teal/30 px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/10 transition-smooth disabled:opacity-60"
                >
                  {creatingLink ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  New Tip Link
                </button>
              )}
            </div>
          </div>
        )}

        {/* Links tab */}
        {activeTab === "links" && (
          <div className="glassmorphism rounded-2xl p-6 fade-in-up">
            <h2 className="mb-2 text-base font-semibold text-foreground">Share Your Tip Page</h2>
            <p className="mb-6 text-sm text-muted-foreground">Share these links with customers to receive cashless tips instantly.</p>
            {tipLinks.filter((l) => l.is_active).map((link) => (
              <div key={link.id} className="mb-4 rounded-xl border border-teal/20 bg-teal/5 p-5">
                <p className="text-sm font-bold text-teal mb-1">{link.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 rounded-lg bg-black/20 px-3 py-2 text-xs text-muted-foreground truncate">
                    {origin}/tip/{link.slug}
                  </code>
                  <button
                    onClick={() => copyLink(link.slug)}
                    className="flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth"
                  >
                    {copiedSlug === link.slug ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
              </div>
            ))}
            {tipLinks.filter((l) => l.is_active).length === 0 && (
              <p className="text-sm text-muted-foreground">No active tip links. Create one in the Overview tab.</p>
            )}
          </div>
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="glassmorphism rounded-2xl p-6 fade-in-up">
            <h2 className="mb-4 text-base font-semibold text-foreground">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
                <p className="text-sm text-foreground">{profile?.full_name || "—"}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</label>
                <p className="text-sm text-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</label>
                <span className="inline-flex items-center rounded-full bg-teal/20 px-2.5 py-0.5 text-xs font-semibold text-teal capitalize">
                  {profile?.role || "worker"}
                </span>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Member Since</label>
                <p className="text-sm text-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
