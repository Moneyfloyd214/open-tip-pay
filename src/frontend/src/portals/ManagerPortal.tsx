import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Users, MapPin, DollarSign, ClipboardList,
  LogOut, UserCheck, Check, X,
  Loader as Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "staff" | "checkin" | "payouts" | "roster";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Stand {
  id: string;
  name: string;
  location: string;
}

interface CheckIn {
  id: string;
  user_id: string;
  stand_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  profiles: { full_name: string } | null;
  stands: { name: string } | null;
}

interface TipPool {
  id: string;
  stand_id: string;
  status: string;
  total_amount: number | null;
  split_method: string;
  created_at: string;
  stands: { name: string } | null;
}

interface RosterEntry {
  id: string;
  user_id: string;
  stand_id: string;
  is_geo_validated: boolean;
  profiles: { full_name: string; email: string } | null;
  stands: { name: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  staff:   "bg-blue-500/20 text-blue-400",
  manager: "bg-teal/20 text-teal",
  admin:   "bg-amber-500/20 text-amber-400",
  fan:     "bg-white/10 text-muted-foreground",
};

const POOL_STATUS_COLORS: Record<string, string> = {
  open:        "bg-teal/20 text-teal",
  distributed: "bg-blue-500/20 text-blue-400",
  pending:     "bg-amber-500/20 text-amber-400",
  cancelled:   "bg-destructive/20 text-destructive",
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function ManagerPortal() {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("staff");

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "staff",   label: "Staff",    icon: Users         },
    { key: "checkin", label: "Check-In", icon: UserCheck     },
    { key: "payouts", label: "Payouts",  icon: DollarSign    },
    { key: "roster",  label: "Roster",   icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/3 top-[-15%] h-[600px] w-[600px] rounded-full bg-teal/[0.06] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-1/4 h-[400px] w-[400px] rounded-full bg-teal/[0.04] blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal glow-teal">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Manager Portal</span>
              <span className="ml-2 rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-teal">MANAGER</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-smooth"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="mx-auto flex max-w-3xl border-t border-border/20">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-smooth ${
                tab === key
                  ? "text-teal border-b-2 border-teal"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {tab === "staff"   && <StaffTab />}
        {tab === "checkin" && <CheckInTab />}
        {tab === "payouts" && <PayoutsTab />}
        {tab === "roster"  && <RosterTab />}
      </main>
    </div>
  );
}

// ── Staff Management Tab ───────────────────────────────────────────────────────
function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignStandId, setAssignStandId] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id, full_name, email, role, is_active").in("role", ["staff", "manager"]).order("full_name").then(({ data }) => { if (data) setStaff(data); }),
      supabase.from("stands").select("id, name, location").order("name").then(({ data }) => { if (data) setStands(data); }),
    ]).finally(() => setLoading(false));
  }, []);

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from("profiles").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    toast.success(!current ? "Staff activated." : "Staff deactivated.");
  }

  async function changeRole(id: string, role: string) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { toast.error("Failed to update role."); return; }
    setStaff(prev => prev.map(s => s.id === id ? { ...s, role } : s));
    toast.success("Role updated.");
  }

  async function assignToStand(userId: string) {
    const standId = assignStandId[userId];
    if (!standId) return;
    const { error } = await supabase.from("stand_staff").upsert({ stand_id: standId, user_id: userId }, { onConflict: "stand_id,user_id" });
    if (error) { toast.error("Failed to assign stand."); return; }
    toast.success("Assigned to stand.");
    setAssignStandId(prev => { const n = { ...prev }; delete n[userId]; return n; });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3 fade-in-up">
      <h2 className="text-sm font-semibold text-foreground mb-1">Staff Members ({staff.length})</h2>
      {staff.length === 0 ? (
        <EmptyState icon={Users} message="No staff members found." />
      ) : (
        staff.map(s => (
          <div key={s.id} className="glassmorphism rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold">
                  {(s.full_name || s.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_COLORS[s.role] ?? "bg-white/10 text-muted-foreground"}`}>
                  {s.role}
                </span>
                <button
                  onClick={() => toggleActive(s.id, s.is_active)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-smooth ${s.is_active ? "bg-teal/20 text-teal" : "bg-destructive/20 text-destructive"}`}
                >
                  {s.is_active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={s.role}
                onChange={(e) => changeRole(s.id, e.target.value)}
                className="flex-1 rounded-lg border border-border bg-black/20 px-2 py-1.5 text-xs text-foreground focus:border-teal focus:outline-none transition-smooth"
              >
                <option value="fan">Fan</option>
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
              <select
                value={assignStandId[s.id] ?? ""}
                onChange={(e) => setAssignStandId(prev => ({ ...prev, [s.id]: e.target.value }))}
                className="flex-1 rounded-lg border border-border bg-black/20 px-2 py-1.5 text-xs text-foreground focus:border-teal focus:outline-none transition-smooth"
              >
                <option value="">Assign to stand…</option>
                {stands.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
              <button
                onClick={() => assignToStand(s.id)}
                disabled={!assignStandId[s.id]}
                className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
              >
                Assign
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Check-In Tab ───────────────────────────────────────────────────────────────
function CheckInTab() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [standId, setStandId] = useState("");
  const [userId, setUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [ciRes, stRes, stfRes] = await Promise.all([
      supabase.from("check_ins").select("*, profiles(full_name), stands(name)").gte("checked_in_at", today).order("checked_in_at", { ascending: false }),
      supabase.from("stands").select("id, name, location"),
      supabase.from("profiles").select("id, full_name, email, role, is_active").in("role", ["staff", "manager"]),
    ]);
    if (ciRes.data) setCheckIns(ciRes.data as unknown as CheckIn[]);
    if (stRes.data) setStands(stRes.data);
    if (stfRes.data) setStaff(stfRes.data);
    setLoading(false);
  }

  async function checkIn() {
    if (!standId || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("check_ins").insert({ stand_id: standId, user_id: userId });
    setSubmitting(false);
    if (error) { toast.error("Failed to check in."); return; }
    toast.success("Checked in.");
    setUserId("");
    loadData();
  }

  async function checkOut(id: string) {
    const { error } = await supabase.from("check_ins").update({ checked_out_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed to check out."); return; }
    toast.success("Checked out.");
    loadData();
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 fade-in-up">
      <div className="glassmorphism rounded-2xl p-5 space-y-3 border border-teal/20">
        <h3 className="text-sm font-semibold text-foreground">New Check-In</h3>
        <select value={standId} onChange={e => setStandId(e.target.value)} className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth">
          <option value="">Select stand…</option>
          {stands.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
        </select>
        <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground focus:border-teal focus:outline-none transition-smooth">
          <option value="">Select staff member…</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
        </select>
        <button onClick={checkIn} disabled={!standId || !userId || submitting} className="w-full rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40">
          {submitting ? "Checking in…" : "Check In"}
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today's Check-Ins</h3>
        {checkIns.length === 0 ? (
          <EmptyState icon={UserCheck} message="No check-ins today." />
        ) : (
          <div className="space-y-2">
            {checkIns.map(ci => (
              <div key={ci.id} className="glassmorphism rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{ci.profiles?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{ci.stands?.name ?? "—"} · {new Date(ci.checked_in_at).toLocaleTimeString()}</p>
                </div>
                {ci.checked_out_at ? (
                  <span className="text-xs text-muted-foreground">Out {new Date(ci.checked_out_at).toLocaleTimeString()}</span>
                ) : (
                  <button onClick={() => checkOut(ci.id)} className="rounded-lg bg-destructive/20 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/30 transition-smooth">
                    Check Out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Types for weighted split ───────────────────────────────────────────────────
interface SplitAllocation {
  user_id: string;
  full_name: string;
  hours_worked: number;
  role_weight: number;
  blended_weight: number;
  share_pct: number;
  allocated_amount: number;
}

// ── Payouts Tab ────────────────────────────────────────────────────────────────
function PayoutsTab() {
  const [pools, setPools] = useState<TipPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, SplitAllocation[]>>({});
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("tip_pools").select("*, stands(name)").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setPools(data as unknown as TipPool[]);
      setLoading(false);
    });
  }, []);

  async function loadPreview(pool: TipPool) {
    if (preview[pool.id]) { setPreview(prev => { const n = { ...prev }; delete n[pool.id]; return n; }); return; }
    setPreviewLoading(pool.id);

    // Fetch tip_pool_splits with user/role_weight info
    const { data: splits } = await supabase
      .from("tip_pool_splits")
      .select("user_id, role_weight, hours_worked, profiles(full_name)")
      .eq("pool_id", pool.id);

    let allocations: SplitAllocation[] = [];

    if (splits && splits.length > 0) {
      // Use role_weight from splits, hours_worked from splits (updated at check-out)
      const sumBlended = splits.reduce((s, sp) => s + (sp.hours_worked || 1) * (sp.role_weight || 1), 0);
      allocations = splits.map(sp => {
        const h = Number(sp.hours_worked) || 1;
        const r = Number(sp.role_weight) || 1;
        const blend = h * r;
        const pct = sumBlended > 0 ? (blend / sumBlended) * 100 : 100 / splits.length;
        const amount = ((pool.total_amount ?? 0) * pct) / 100;
        return {
          user_id: sp.user_id,
          full_name: (sp as any).profiles?.full_name ?? sp.user_id.slice(0, 8),
          hours_worked: h,
          role_weight: r,
          blended_weight: blend,
          share_pct: pct,
          allocated_amount: amount,
        };
      });
    } else {
      // Fallback: equal split among stand staff with check-ins for pool period
      const { data: staffRows } = await supabase
        .from("check_ins")
        .select("user_id, hours_worked, profiles(full_name)")
        .eq("stand_id", pool.stand_id)
        .gte("checked_in_at", pool.created_at);

      if (staffRows && staffRows.length > 0) {
        const sumH = staffRows.reduce((s, ci) => s + (Number(ci.hours_worked) || 1), 0);
        allocations = staffRows.map(ci => {
          const h = Number(ci.hours_worked) || 1;
          const pct = (h / sumH) * 100;
          return {
            user_id: ci.user_id,
            full_name: (ci as any).profiles?.full_name ?? ci.user_id.slice(0, 8),
            hours_worked: h,
            role_weight: 1,
            blended_weight: h,
            share_pct: pct,
            allocated_amount: ((pool.total_amount ?? 0) * pct) / 100,
          };
        });
      }
    }

    setPreview(prev => ({ ...prev, [pool.id]: allocations }));
    setPreviewLoading(null);
  }

  async function distribute(pool: TipPool) {
    setDistributing(pool.id);
    try {
      const allocations = preview[pool.id];
      if (allocations && allocations.length > 0) {
        // Write individual allocated amounts to tip_pool_splits
        const totalCents = Math.round((pool.total_amount ?? 0) * 100);
        for (const alloc of allocations) {
          const cents = Math.round((alloc.allocated_amount) * 100);
          await supabase.from("tip_pool_splits").upsert({
            pool_id: pool.id,
            user_id: alloc.user_id,
            role_weight: alloc.role_weight,
            hours_worked: alloc.hours_worked,
            allocated_amount_cents: cents,
          }, { onConflict: "pool_id,user_id" });
        }
        // Log a transaction for each allocation
        const txRows = allocations.map(alloc => ({
          staff_id: alloc.user_id,
          fan_id: alloc.user_id,
          amount: alloc.allocated_amount,
          transaction_type: "digital",
          category: "general",
          note: `Pool payout — ${alloc.share_pct.toFixed(1)}% (${alloc.hours_worked}h × ${alloc.role_weight}x weight)`,
          tipper_name: "Tip Pool",
        }));
        await supabase.from("transactions").insert(txRows);
      }
      const { error } = await supabase.from("tip_pools").update({ status: "distributed" }).eq("id", pool.id);
      if (error) throw error;
      setPools(prev => prev.map(p => p.id === pool.id ? { ...p, status: "distributed" } : p));
      setPreview(prev => { const n = { ...prev }; delete n[pool.id]; return n; });
      toast.success("Tips distributed with weighted blending.");
    } catch {
      toast.error("Failed to distribute.");
    } finally {
      setDistributing(null);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3 fade-in-up">
      <h2 className="text-sm font-semibold text-foreground mb-1">Tip Pools</h2>
      {pools.length === 0 ? (
        <EmptyState icon={DollarSign} message="No tip pools found." />
      ) : (
        pools.map(pool => (
          <div key={pool.id} className="glassmorphism rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{pool.stands?.name ?? "Unknown Stand"}</p>
                <p className="text-xs text-muted-foreground capitalize">{pool.split_method} split · {new Date(pool.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {pool.total_amount != null && (
                  <span className="text-sm font-bold text-teal">${Number(pool.total_amount).toFixed(2)}</span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${POOL_STATUS_COLORS[pool.status] ?? "bg-white/10 text-muted-foreground"}`}>
                  {pool.status}
                </span>
              </div>
            </div>

            {pool.status === "open" && (
              <>
                <button
                  onClick={() => loadPreview(pool)}
                  disabled={previewLoading === pool.id}
                  className="w-full rounded-xl border border-teal/30 py-2 text-xs font-semibold text-teal hover:bg-teal/10 transition-smooth disabled:opacity-40"
                >
                  {previewLoading === pool.id ? "Calculating…" : preview[pool.id] ? "Hide Breakdown" : "Preview Split"}
                </button>

                {preview[pool.id] && (
                  <div className="space-y-1.5 rounded-xl bg-black/20 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Blended Split (hours × role weight)
                    </p>
                    {preview[pool.id].length === 0 ? (
                      <p className="text-xs text-muted-foreground">No check-in data found for this pool.</p>
                    ) : (
                      preview[pool.id].map(alloc => (
                        <div key={alloc.user_id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal/20 text-teal text-[10px] font-bold flex-shrink-0">
                              {alloc.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-foreground truncate">{alloc.full_name}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-muted-foreground">{alloc.hours_worked}h × {alloc.role_weight}x</span>
                            <span className="text-muted-foreground w-10 text-right">{alloc.share_pct.toFixed(1)}%</span>
                            <span className="font-bold text-teal w-14 text-right">${alloc.allocated_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button
                  onClick={() => distribute(pool)}
                  disabled={distributing === pool.id}
                  className="w-full rounded-xl bg-teal py-2.5 text-xs font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
                >
                  {distributing === pool.id ? "Distributing…" : "Approve & Distribute"}
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ── Game Roster Tab ────────────────────────────────────────────────────────────
function RosterTab() {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("stand_staff").select("*, profiles(full_name, email), stands(name)").then(({ data }) => {
      if (data) setRoster(data as unknown as RosterEntry[]);
      setLoading(false);
    });
  }, []);

  async function validateGeo(id: string) {
    const { error } = await supabase.from("stand_staff").update({ is_geo_validated: true }).eq("id", id);
    if (error) { toast.error("Failed to validate."); return; }
    setRoster(prev => prev.map(r => r.id === id ? { ...r, is_geo_validated: true } : r));
    toast.success("Geo-validation confirmed.");
  }

  async function removeFromRoster(id: string) {
    const { error } = await supabase.from("stand_staff").delete().eq("id", id);
    if (error) { toast.error("Failed to remove."); return; }
    setRoster(prev => prev.filter(r => r.id !== id));
    toast.success("Removed from roster.");
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-3 fade-in-up">
      <h2 className="text-sm font-semibold text-foreground mb-1">Game Roster ({roster.length})</h2>
      {roster.length === 0 ? (
        <EmptyState icon={ClipboardList} message="Roster is empty. Assign staff to stands first." />
      ) : (
        roster.map(entry => (
          <div key={entry.id} className="glassmorphism rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold">
                {(entry.profiles?.full_name || entry.profiles?.email || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{entry.profiles?.full_name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{entry.stands?.name ?? "Unknown Stand"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {entry.is_geo_validated ? (
                <span className="flex items-center gap-1 rounded-full bg-teal/20 px-2.5 py-0.5 text-[10px] font-semibold text-teal">
                  <MapPin className="h-2.5 w-2.5" /> Verified
                </span>
              ) : (
                <button
                  onClick={() => validateGeo(entry.id)}
                  className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/30 transition-smooth"
                >
                  <MapPin className="h-2.5 w-2.5" /> Validate
                </button>
              )}
              <button
                onClick={() => removeFromRoster(entry.id)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-smooth"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
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

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="glassmorphism rounded-2xl py-12 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
