import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Shield, Users, ChartBar as BarChart3, DollarSign, LogOut, Loader as Loader2, TrendingUp, Star, Plus, X, Check, CreditCard, Wifi, TriangleAlert as AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";

type Tab = "analytics" | "pos" | "fanpoints" | "users" | "deposit";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsStats {
  total_tips: number;
  total_amount: number;
  active_staff: number;
  total_fans: number;
}

interface CategoryBreakdown {
  food: number;
  alcohol: number;
  general: number;
}

interface GamePhase {
  id: string;
  phase_name: string;
  is_active: boolean;
  started_at: string | null;
}

interface Stand {
  id: string;
  name: string;
  location: string;
  pos_type: string;
  is_active: boolean;
  is_volunteer_org: boolean;
  volunteer_org_id: string | null;
}

interface SimulatedTicket {
  id: string;
  stand_id: string;
  stand_name: string;
  items: string;
  amount: number;
  tip: number;
  pos_type: string;
  is_volunteer_org: boolean;
  volunteer_org_id: string | null;
  timestamp: string;
  status: "pending" | "ingested" | "routed";
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  is_active: boolean;
}

interface PointLeader {
  user_id: string;
  total_points: number;
  profiles: { full_name: string; email: string } | null;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  stripe_connect_status: string;
}

const POS_TYPES = ["square", "clover", "toast", "skyTab", "manual", "other"];
const POS_COLORS: Record<string, string> = {
  square:  "text-blue-400",
  clover:  "text-green-400",
  toast:   "text-orange-400",
  skyTab:  "text-cyan-400",
  manual:  "text-yellow-400",
  other:   "text-muted-foreground",
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("analytics");

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "analytics", label: "Analytics", icon: BarChart3   },
    { key: "pos",       label: "POS",        icon: CreditCard  },
    { key: "fanpoints", label: "Fan Pts",    icon: Star        },
    { key: "users",     label: "Users",      icon: Users       },
    { key: "deposit",   label: "Deposit",    icon: DollarSign  },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-[-15%] h-[700px] w-[700px] rounded-full bg-teal/[0.05] blur-[130px]" />
        <div className="absolute bottom-[-5%] right-1/3 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Admin Panel</span>
              <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">ADMIN</span>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="mx-auto flex max-w-4xl border-t border-border/20">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-xs font-semibold transition-smooth ${
                tab === key
                  ? "text-teal border-b-2 border-teal"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "pos"       && <POSTab />}
        {tab === "fanpoints" && <FanPointsTab />}
        {tab === "users"     && <UsersTab />}
        {tab === "deposit"   && <DepositTab />}
      </main>
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [stats, setStats] = useState<AnalyticsStats>({ total_tips: 0, total_amount: 0, active_staff: 0, total_fans: 0 });
  const [breakdown, setBreakdown] = useState<CategoryBreakdown>({ food: 0, alcohol: 0, general: 0 });
  const [phases, setPhases] = useState<GamePhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [enablingQ3, setEnablingQ3] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("transactions").select("amount, category").then(({ data }) => {
        if (!data) return;
        setStats(prev => ({
          ...prev,
          total_tips: data.length,
          total_amount: data.reduce((s, t) => s + (t.amount || 0), 0),
        }));
        const cats = { food: 0, alcohol: 0, general: 0 };
        data.forEach(t => { const c = (t.category as keyof CategoryBreakdown) ?? "general"; cats[c] = (cats[c] || 0) + (t.amount || 0); });
        setBreakdown(cats);
      }),
      supabase.from("profiles").select("role, is_active").then(({ data }) => {
        if (!data) return;
        setStats(prev => ({
          ...prev,
          active_staff: data.filter(p => p.role === "staff" && p.is_active).length,
          total_fans: data.filter(p => p.role === "fan").length,
        }));
      }),
      supabase.from("game_phases").select("*").order("started_at", { ascending: false }).then(({ data }) => {
        if (data) setPhases(data);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  async function activatePhase(id: string) {
    await supabase.from("game_phases").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("game_phases").update({ is_active: true }).eq("id", id);
    setPhases(prev => prev.map(p => ({ ...p, is_active: p.id === id })));
    toast.success("Game phase activated.");
  }

  async function enableQ3Cutoff() {
    setEnablingQ3(true);
    const { error } = await supabase.from("tip_pools").update({ q3_cutoff_enforced: true, cutoff_at: new Date().toISOString() }).eq("status", "open");
    setEnablingQ3(false);
    if (error) { toast.error("Failed to apply Q3 cutoff."); return; }
    toast.success("Q3 cutoff applied to all open pools.");
  }

  const catTotal = breakdown.food + breakdown.alcohol + breakdown.general || 1;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 fade-in-up">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Tips",    value: stats.total_tips.toString(),           icon: Activity,    color: "text-teal" },
          { label: "Total Earned",  value: `$${stats.total_amount.toFixed(0)}`,   icon: TrendingUp,  color: "text-emerald-400" },
          { label: "Active Staff",  value: stats.active_staff.toString(),         icon: Users,       color: "text-blue-400" },
          { label: "Fans",          value: stats.total_fans.toString(),           icon: Star,        color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glassmorphism rounded-2xl p-4 text-center">
            <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="glassmorphism rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue by Category</h3>
        {[
          { key: "food",    label: "Food",    color: "bg-orange-500" },
          { key: "alcohol", label: "Alcohol", color: "bg-blue-500" },
          { key: "general", label: "General", color: "bg-teal" },
        ].map(({ key, label, color }) => {
          const val = breakdown[key as keyof CategoryBreakdown];
          const pct = Math.round((val / catTotal) * 100);
          return (
            <div key={key} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground capitalize">{label}</span>
                <span className="text-xs font-semibold text-foreground">${val.toFixed(0)} ({pct}%)</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Q3 Cutoff */}
      <div className="glassmorphism rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Q3 Cutoff Control</h3>
          </div>
          <button
            onClick={enableQ3Cutoff}
            disabled={enablingQ3}
            className="rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-smooth disabled:opacity-40"
          >
            {enablingQ3 ? "Applying…" : "Enforce Q3 Cutoff"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Enforcing Q3 cutoff marks all open tip pools with a cutoff timestamp. Tips after cutoff are held for the next period.</p>
      </div>

      {/* Game Phases */}
      <div className="glassmorphism rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="text-sm font-semibold text-foreground">Game Phases</h3>
        </div>
        <div className="divide-y divide-border/20">
          {phases.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No game phases defined.</p>
          ) : (
            phases.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.phase_name}</p>
                  {p.started_at && <p className="text-xs text-muted-foreground">{new Date(p.started_at).toLocaleString()}</p>}
                </div>
                {p.is_active ? (
                  <span className="rounded-full bg-teal/20 px-2.5 py-0.5 text-[10px] font-semibold text-teal">Active</span>
                ) : (
                  <button onClick={() => activatePhase(p.id)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 transition-smooth">
                    Activate
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── POS ticket simulator helpers ───────────────────────────────────────────────
const MOCK_ITEMS = [
  ["Hot Dog x2", "Nachos x1"],
  ["Draft Beer x3"],
  ["Burger x1", "Soda x2"],
  ["Popcorn x2", "Water x1"],
  ["Seltzer x2"],
  ["Nachos x1", "Draft Beer x2"],
];

function generateMockTicket(stand: Stand): SimulatedTicket {
  const items = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)];
  const amount = parseFloat((Math.random() * 35 + 5).toFixed(2));
  const tip = parseFloat((amount * (Math.random() * 0.2 + 0.1)).toFixed(2));
  return {
    id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    stand_id: stand.id,
    stand_name: stand.name,
    items: items.join(", "),
    amount,
    tip,
    pos_type: stand.pos_type,
    is_volunteer_org: stand.is_volunteer_org,
    volunteer_org_id: stand.volunteer_org_id,
    timestamp: new Date().toISOString(),
    status: "pending",
  };
}

// ── POS / Stands Tab ───────────────────────────────────────────────────────────
function POSTab() {
  const { user } = useAuth();
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", pos_type: "square", is_volunteer_org: false });
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<SimulatedTicket[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [ingestingId, setIngestingId] = useState<string | null>(null);
  const [selectedStandId, setSelectedStandId] = useState<string>("all");

  useEffect(() => {
    supabase.from("stands").select("*").order("name").then(({ data }) => {
      if (data) setStands(data as Stand[]);
      setLoading(false);
    });
  }, []);

  async function addStand() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("stands").insert({
      name: form.name,
      location: form.location,
      pos_type: form.pos_type,
      is_volunteer_org: form.is_volunteer_org,
      is_active: true,
    }).select().maybeSingle();
    setSaving(false);
    if (error) { toast.error("Failed to add stand."); return; }
    if (data) setStands(prev => [...prev, data as Stand]);
    setShowAdd(false);
    setForm({ name: "", location: "", pos_type: "square", is_volunteer_org: false });
    toast.success("Stand added.");
  }

  async function toggleStand(id: string, current: boolean) {
    const { error } = await supabase.from("stands").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    setStands(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
  }

  function simulateTickets() {
    const activeStands = stands.filter(s => s.is_active);
    if (activeStands.length === 0) { toast.error("No active stands to simulate."); return; }
    setSimulating(true);
    const count = Math.floor(Math.random() * 3) + 2;
    const newTickets: SimulatedTicket[] = Array.from({ length: count }, () => {
      const stand = activeStands[Math.floor(Math.random() * activeStands.length)];
      return generateMockTicket(stand);
    });
    setTickets(prev => [...newTickets, ...prev].slice(0, 30));
    setSimulating(false);
    toast.success(`${count} POS ticket${count > 1 ? "s" : ""} received.`);
  }

  async function ingestTicket(ticket: SimulatedTicket) {
    if (!user) return;
    setIngestingId(ticket.id);
    try {
      const { error } = await supabase.from("transactions").insert({
        staff_id: user.id,
        fan_id: user.id,
        amount: ticket.tip,
        transaction_type: "digital",
        category: "food",
        note: `POS (${ticket.pos_type.toUpperCase()}) — ${ticket.items} — subtotal $${ticket.amount.toFixed(2)}`,
        tipper_name: "POS Terminal",
        ...(ticket.volunteer_org_id ? { volunteer_org_id: ticket.volunteer_org_id } : {}),
      });
      if (error) throw error;
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: ticket.is_volunteer_org ? "routed" : "ingested" } : t));
      toast.success(ticket.is_volunteer_org
        ? `Tip routed to volunteer org for ${ticket.stand_name}.`
        : `Ticket ingested — $${ticket.tip.toFixed(2)} tip recorded.`
      );
    } catch {
      toast.error("Failed to ingest ticket.");
    } finally {
      setIngestingId(null);
    }
  }

  async function ingestAll() {
    const pending = tickets.filter(t => t.status === "pending");
    for (const t of pending) await ingestTicket(t);
  }

  const filteredTickets = selectedStandId === "all"
    ? tickets
    : tickets.filter(t => t.stand_id === selectedStandId);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 fade-in-up">
      {/* Stands list */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Stands & POS ({stands.length})</h2>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth">
          {showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showAdd ? "Cancel" : "Add Stand"}
        </button>
      </div>

      {showAdd && (
        <div className="glassmorphism rounded-2xl p-5 space-y-3 border border-teal/20 fade-in-up">
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Stand name" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
          <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location (e.g. Section 122)" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
          <select value={form.pos_type} onChange={e => setForm(f => ({ ...f, pos_type: e.target.value }))} className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth">
            {POS_TYPES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(f => ({ ...f, is_volunteer_org: !f.is_volunteer_org }))}
              className={`h-5 w-9 rounded-full relative transition-smooth ${form.is_volunteer_org ? "bg-teal" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${form.is_volunteer_org ? "left-[18px]" : "left-0.5"}`} />
            </div>
            <span className="text-xs text-muted-foreground">Volunteer Organization stand (tips routed to org account)</span>
          </label>
          <button onClick={addStand} disabled={!form.name.trim() || saving} className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40">
            {saving ? "Adding…" : "Add Stand"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {stands.map(s => (
          <div key={s.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.is_active ? "bg-teal/20" : "bg-white/5"}`}>
                <Wifi className={`h-4 w-4 ${s.is_active ? "text-teal" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  {s.is_volunteer_org && (
                    <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">VOL ORG</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{s.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold capitalize ${POS_COLORS[s.pos_type] ?? "text-muted-foreground"}`}>{s.pos_type}</span>
              <button onClick={() => toggleStand(s.id, s.is_active)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-smooth ${s.is_active ? "bg-teal/20 text-teal" : "bg-destructive/20 text-destructive"}`}>
                {s.is_active ? "Online" : "Offline"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* POS Ticket Simulator */}
      <div className="glassmorphism rounded-2xl p-5 border border-teal/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal" />
            <h3 className="text-sm font-semibold text-foreground">POS Ticket Simulator</h3>
          </div>
          <div className="flex items-center gap-2">
            {tickets.some(t => t.status === "pending") && (
              <button
                onClick={ingestAll}
                className="rounded-xl bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-smooth"
              >
                Ingest All
              </button>
            )}
            <button
              onClick={simulateTickets}
              disabled={simulating}
              className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Simulate
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Simulates real-time POS ticket ingestion from Toast, Square, SkyTab, and other terminals. Volunteer org tips are automatically routed to the linked org account.
        </p>

        {stands.length > 0 && (
          <select
            value={selectedStandId}
            onChange={e => setSelectedStandId(e.target.value)}
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth"
          >
            <option value="all">All Stands</option>
            {stands.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center">
            <Wifi className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No tickets yet. Click Simulate to generate POS events.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredTickets.map(t => (
              <div key={t.id} className="rounded-xl bg-black/20 px-4 py-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold uppercase ${POS_COLORS[t.pos_type] ?? "text-muted-foreground"}`}>{t.pos_type}</span>
                    <span className="text-xs text-muted-foreground">{t.stand_name}</span>
                    {t.is_volunteer_org && (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">VOL ORG</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground truncate">{t.items}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ${t.amount.toFixed(2)} + <span className="text-teal">${t.tip.toFixed(2)} tip</span>
                    {" · "}{new Date(t.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {t.status === "pending" ? (
                    <button
                      onClick={() => ingestTicket(t)}
                      disabled={ingestingId === t.id}
                      className="rounded-lg bg-teal px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
                    >
                      {ingestingId === t.id ? "…" : "Ingest"}
                    </button>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      t.status === "routed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-teal/20 text-teal"
                    }`}>
                      {t.status === "routed" ? "Routed" : "Ingested"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fan Points Tab ─────────────────────────────────────────────────────────────
function FanPointsTab() {
  const [leaderboard, setLeaderboard] = useState<PointLeader[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", points_cost: "" });
  const [savingReward, setSavingReward] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("fan_point_balances").select("user_id, total_points, profiles(full_name, email)").order("total_points", { ascending: false }).limit(10).then(({ data }) => { if (data) setLeaderboard(data as unknown as PointLeader[]); }),
      supabase.from("rewards_catalog").select("*").order("points_cost").then(({ data }) => { if (data) setRewards(data); }),
    ]).finally(() => setLoading(false));
  }, []);

  async function addReward() {
    if (!rewardForm.name.trim() || !rewardForm.points_cost) return;
    setSavingReward(true);
    const { data, error } = await supabase.from("rewards_catalog").insert({
      name: rewardForm.name.trim(),
      description: rewardForm.description.trim() || null,
      points_cost: parseInt(rewardForm.points_cost),
      is_active: true,
    }).select().maybeSingle();
    setSavingReward(false);
    if (error) { toast.error("Failed to add reward."); return; }
    if (data) setRewards(prev => [...prev, data]);
    setShowAddReward(false);
    setRewardForm({ name: "", description: "", points_cost: "" });
    toast.success("Reward added.");
  }

  async function toggleReward(id: string, current: boolean) {
    const { error } = await supabase.from("rewards_catalog").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 fade-in-up">
      {/* Leaderboard */}
      <div className="glassmorphism rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">Top Fan Points</h3>
        </div>
        <div className="divide-y divide-border/20">
          {leaderboard.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No points earned yet.</p>
          ) : (
            leaderboard.map((entry, i) => (
              <div key={entry.user_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <p className="text-sm font-medium text-foreground">{entry.profiles?.full_name || entry.profiles?.email || "—"}</p>
                </div>
                <span className="text-sm font-bold text-amber-400">{Number(entry.total_points).toLocaleString()} pts</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rewards catalog */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Rewards Catalog</h3>
          <button onClick={() => setShowAddReward(v => !v)} className="flex items-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal-light transition-smooth">
            {showAddReward ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showAddReward ? "Cancel" : "Add Reward"}
          </button>
        </div>

        {showAddReward && (
          <div className="glassmorphism rounded-2xl p-5 space-y-3 border border-teal/20 mb-3 fade-in-up">
            <input type="text" value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))} placeholder="Reward name" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
            <input type="text" value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optional)" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
            <input type="number" value={rewardForm.points_cost} onChange={e => setRewardForm(f => ({ ...f, points_cost: e.target.value }))} placeholder="Points cost" min="1" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
            <button onClick={addReward} disabled={!rewardForm.name.trim() || !rewardForm.points_cost || savingReward} className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40">
              {savingReward ? "Adding…" : "Add Reward"}
            </button>
          </div>
        )}

        <div className="space-y-2">
          {rewards.map(r => (
            <div key={r.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.description ?? "—"} · {r.points_cost.toLocaleString()} pts</p>
              </div>
              <button onClick={() => toggleReward(r.id, r.is_active)} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-smooth ${r.is_active ? "bg-teal/20 text-teal" : "bg-destructive/20 text-destructive"}`}>
                {r.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, email, role, is_active, stripe_connect_status").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  async function changeRole(id: string, role: string) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { toast.error("Failed to update role."); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    toast.success("Role updated.");
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLORS: Record<string, string> = {
    admin:   "bg-amber-500/20 text-amber-400",
    manager: "bg-teal/20 text-teal",
    staff:   "bg-blue-500/20 text-blue-400",
    fan:     "bg-white/10 text-muted-foreground",
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 fade-in-up">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users…"
        className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
      />
      <p className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal text-xs font-bold">
              {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_COLORS[u.role] ?? "bg-white/10 text-muted-foreground"}`}>
                {u.role}
              </span>
              <select
                value={u.role}
                onChange={e => changeRole(u.id, e.target.value)}
                className="rounded-lg border border-border bg-black/20 px-2 py-1 text-[11px] text-foreground focus:border-teal focus:outline-none transition-smooth"
              >
                <option value="fan">Fan</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Direct Deposit Simulator Tab ───────────────────────────────────────────────
function DepositTab() {
  const [users, setUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("profiles").select("id, full_name, email").in("role", ["staff", "manager"]).order("full_name").then(({ data }) => {
      if (data) setUsers(data);
      setLoading(false);
    });
  }, []);

  async function sendDeposit() {
    if (!targetId || !amount) return;
    setSending(true);
    const { error } = await supabase.from("transactions").insert({
      staff_id: targetId,
      fan_id: targetId,
      amount: parseFloat(amount),
      transaction_type: "direct_deposit",
      category: "general",
      note: note.trim() || "Direct deposit",
      tipper_name: "Admin",
    });
    setSending(false);
    if (error) { toast.error("Failed to send deposit."); return; }
    toast.success(`$${parseFloat(amount).toFixed(2)} direct deposit sent.`);
    setAmount("");
    setNote("");
    setTargetId("");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 fade-in-up">
      <div className="glassmorphism rounded-2xl p-5 border border-teal/20 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-semibold text-foreground">Direct Deposit Simulator</h3>
        </div>
        <p className="text-xs text-muted-foreground">Issue a direct deposit to any staff member's account. This simulates a payroll or bonus transfer.</p>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Recipient</label>
          <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth">
            <option value="">Select staff member…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Amount ($)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.01" step="0.01" className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Note (optional)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Payroll, bonus, etc." className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth" />
        </div>

        <button
          onClick={sendDeposit}
          disabled={!targetId || !amount || sending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 glow-teal-hero"
        >
          <Check className="h-4 w-4" />
          {sending ? "Processing…" : `Send $${parseFloat(amount || "0").toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

// ── Shared micro-components ────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-teal" />
    </div>
  );
}
