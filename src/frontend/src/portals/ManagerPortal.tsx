import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Users, ChartBar as BarChart3, Layers, DollarSign, LogOut, Plus, Loader as Loader2, CircleCheck as CheckCircle, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Stand {
  id: string;
  name: string;
  location: string;
  pos_type: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  stripe_connect_status: string;
  is_active: boolean;
}

interface TipPool {
  id: string;
  name: string;
  total_amount_cents: number;
  pos_ticket_count: number;
  split_method: string;
  status: string;
  opened_at: string;
}

interface TransactionSummary {
  total: number;
  amount: number;
  today: number;
}

type Tab = "overview" | "staff" | "stands" | "pools";

export default function ManagerPortal() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [stands, setStands] = useState<Stand[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pools, setPools] = useState<TipPool[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({ total: 0, amount: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  // New stand form
  const [showStandForm, setShowStandForm] = useState(false);
  const [newStandName, setNewStandName] = useState("");
  const [newStandLocation, setNewStandLocation] = useState("");
  const [newStandPOS, setNewStandPOS] = useState("manual");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [standsRes, staffRes, poolsRes, txRes] = await Promise.all([
      supabase.from("stands").select("*").order("name"),
      supabase.from("profiles").select("id, full_name, email, stripe_connect_status, is_active").in("role", ["staff"]),
      supabase.from("tip_pools").select("*").order("opened_at", { ascending: false }).limit(10),
      supabase.from("transactions").select("amount_cents, tip_amount_cents, created_at").eq("status", "completed"),
    ]);
    if (standsRes.data) setStands(standsRes.data);
    if (staffRes.data) setStaff(staffRes.data);
    if (poolsRes.data) setPools(poolsRes.data);
    if (txRes.data) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      setSummary({
        total: txRes.data.length,
        amount: txRes.data.reduce((s, t) => s + t.tip_amount_cents, 0),
        today: txRes.data.filter((t) => new Date(t.created_at) >= today).reduce((s, t) => s + t.tip_amount_cents, 0),
      });
    }
    setLoading(false);
  }

  async function createStand() {
    if (!newStandName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("stands").insert({
      name: newStandName.trim(),
      location: newStandLocation.trim(),
      pos_type: newStandPOS,
    });
    if (error) toast.error("Failed to create stand");
    else {
      toast.success("Stand created!");
      setNewStandName(""); setNewStandLocation(""); setShowStandForm(false);
      loadAll();
    }
    setSaving(false);
  }

  async function toggleStand(id: string, current: boolean) {
    await supabase.from("stands").update({ is_active: !current }).eq("id", id);
    setStands((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  }

  function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "staff", label: "Staff", icon: Users },
    { key: "stands", label: "Stands", icon: Layers },
    { key: "pools", label: "Tip Pools", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Manager Portal</span>
              <span className="ml-2 rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
                {profile?.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:block">{profile?.full_name || profile?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Tab nav */}
        <div className="mb-6 flex gap-1 rounded-xl bg-black/20 p-1 w-fit overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-smooth ${
                tab === key ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-teal" />
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === "overview" && (
              <div className="space-y-6 fade-in-up">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Total Transactions", value: String(summary.total), icon: TrendingUp },
                    { label: "All-Time Tips", value: fmt(summary.amount), icon: DollarSign },
                    { label: "Tips Today", value: fmt(summary.today), icon: CheckCircle },
                  ].map((s) => (
                    <div key={s.label} className="glassmorphism rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                        <s.icon className="h-4 w-4 text-teal" />
                      </div>
                      <p className="text-3xl font-bold text-foreground">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: "Active Stands", value: stands.filter((s) => s.is_active).length },
                    { label: "Staff Members", value: staff.length },
                    { label: "Open Tip Pools", value: pools.filter((p) => p.status === "open").length },
                  ].map((s) => (
                    <div key={s.label} className="glassmorphism rounded-2xl p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff */}
            {tab === "staff" && (
              <div className="glassmorphism rounded-2xl p-6 fade-in-up">
                <h2 className="mb-4 text-base font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal" /> Staff Members
                </h2>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No staff members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {staff.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold flex-shrink-0">
                            {(s.full_name || s.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            s.stripe_connect_status === "active"
                              ? "bg-teal/20 text-teal"
                              : s.stripe_connect_status === "pending"
                              ? "bg-yellow-400/20 text-yellow-400"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {s.stripe_connect_status === "active" ? "Payout Active" : s.stripe_connect_status === "pending" ? "Pending" : "No Payout"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.is_active ? "bg-teal/20 text-teal" : "bg-destructive/20 text-destructive"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stands */}
            {tab === "stands" && (
              <div className="space-y-4 fade-in-up">
                <div className="glassmorphism rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Layers className="h-4 w-4 text-teal" /> Stands & POS
                    </h2>
                    <button
                      onClick={() => setShowStandForm(!showStandForm)}
                      className="flex items-center gap-1.5 rounded-xl border border-teal/30 px-3 py-1.5 text-sm font-semibold text-teal hover:bg-teal/10 transition-smooth"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Stand
                    </button>
                  </div>

                  {showStandForm && (
                    <div className="mb-4 rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-3">
                      <input
                        value={newStandName}
                        onChange={(e) => setNewStandName(e.target.value)}
                        placeholder="Stand name *"
                        className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
                      />
                      <input
                        value={newStandLocation}
                        onChange={(e) => setNewStandLocation(e.target.value)}
                        placeholder="Location (e.g. Section 114)"
                        className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
                      />
                      <select
                        value={newStandPOS}
                        onChange={(e) => setNewStandPOS(e.target.value)}
                        className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth"
                      >
                        {["square", "clover", "toast", "manual", "other"].map((p) => (
                          <option key={p} value={p} className="bg-background capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={createStand}
                          disabled={saving || !newStandName.trim()}
                          className="flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light transition-smooth disabled:opacity-60"
                        >
                          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          Create Stand
                        </button>
                        <button onClick={() => setShowStandForm(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {stands.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No stands yet. Add your first stand.</p>
                  ) : (
                    <div className="space-y-2">
                      {stands.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.location} · <span className="capitalize">{s.pos_type}</span></p>
                          </div>
                          <button
                            onClick={() => toggleStand(s.id, s.is_active)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                              s.is_active ? "bg-teal/20 text-teal hover:bg-teal/30" : "bg-muted text-muted-foreground hover:bg-muted/60"
                            }`}
                          >
                            {s.is_active ? "Active" : "Inactive"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tip Pools */}
            {tab === "pools" && (
              <div className="glassmorphism rounded-2xl p-6 fade-in-up">
                <h2 className="mb-4 text-base font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal" /> Tip Pools
                </h2>
                {pools.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No tip pools yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pools.map((p) => (
                      <div key={p.id} className="rounded-xl bg-black/20 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{p.name || "Unnamed Pool"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{p.split_method} split · {p.pos_ticket_count} tickets</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-teal">{fmt(p.total_amount_cents)}</p>
                            <span className={`text-[10px] font-semibold uppercase ${
                              p.status === "open" ? "text-teal" :
                              p.status === "distributed" ? "text-green-400" :
                              p.status === "cancelled" ? "text-destructive" : "text-yellow-400"
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
