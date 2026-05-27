import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Shield, Users, ChartBar as BarChart3, DollarSign, LogOut, Loader as Loader2, TrendingUp, Activity, Award, CircleCheck as CheckCircle } from "lucide-react";
import { toast } from "sonner";

type UserRole = "fan" | "staff" | "manager" | "admin";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  stripe_connect_status: string;
  created_at: string;
}

interface PlatformStats {
  total_users: number;
  total_transactions: number;
  total_tips_cents: number;
  total_stands: number;
  total_rewards: number;
}

type Tab = "overview" | "users" | "rewards" | "transactions";

const ROLE_COLORS: Record<UserRole, string> = {
  fan: "bg-blue-400/20 text-blue-400",
  staff: "bg-teal/20 text-teal",
  manager: "bg-yellow-400/20 text-yellow-400",
  admin: "bg-red-400/20 text-red-400",
};

export default function AdminPanel() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0, total_transactions: 0, total_tips_cents: 0,
    total_stands: 0, total_rewards: 0,
  });
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [usersRes, txRes, standsRes, rewardsRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, role, is_active, stripe_connect_status, created_at").order("created_at", { ascending: false }),
      supabase.from("transactions").select("tip_amount_cents").eq("status", "completed"),
      supabase.from("stands").select("id"),
      supabase.from("rewards").select("id"),
    ]);
    if (usersRes.data) {
      setUsers(usersRes.data);
      setStats({
        total_users: usersRes.data.length,
        total_transactions: txRes.data?.length ?? 0,
        total_tips_cents: txRes.data?.reduce((s, t) => s + t.tip_amount_cents, 0) ?? 0,
        total_stands: standsRes.data?.length ?? 0,
        total_rewards: rewardsRes.data?.length ?? 0,
      });
    }
    setLoading(false);
  }

  async function updateRole(userId: string, newRole: UserRole) {
    setSavingUserId(userId);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) toast.error("Failed to update role");
    else {
      toast.success("Role updated");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    }
    setSavingUserId(null);
  }

  async function toggleUserActive(userId: string, current: boolean) {
    await supabase.from("profiles").update({ is_active: !current }).eq("id", userId);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !current } : u));
  }

  function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

  const filteredUsers = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "rewards", label: "Rewards", icon: Award },
    { key: "transactions", label: "Transactions", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/80">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-foreground">Admin Panel</span>
              <span className="ml-2 rounded-full bg-red-400/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                ADMIN
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
                tab === key ? "bg-red-500/80 text-white" : "text-muted-foreground hover:text-foreground"
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
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {[
                    { label: "Total Users", value: stats.total_users, icon: Users },
                    { label: "Transactions", value: stats.total_transactions, icon: Activity },
                    { label: "Tips Processed", value: fmt(stats.total_tips_cents), icon: DollarSign },
                    { label: "Active Stands", value: stats.total_stands, icon: TrendingUp },
                    { label: "Rewards", value: stats.total_rewards, icon: Award },
                  ].map((s) => (
                    <div key={s.label} className="glassmorphism rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                        <s.icon className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Role breakdown */}
                <div className="glassmorphism rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">User Breakdown by Role</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(["fan", "staff", "manager", "admin"] as UserRole[]).map((r) => {
                      const count = users.filter((u) => u.role === r).length;
                      return (
                        <div key={r} className="rounded-xl bg-black/20 p-3 text-center">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_COLORS[r]}`}>
                            {r}
                          </span>
                          <p className="mt-2 text-2xl font-bold text-foreground">{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === "users" && (
              <div className="glassmorphism rounded-2xl p-6 fade-in-up">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal" /> All Users ({filteredUsers.length})
                  </h2>
                  <div className="flex gap-1 rounded-xl bg-black/20 p-1">
                    {(["all", "fan", "staff", "manager", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-smooth ${
                          roleFilter === r ? "bg-teal text-white" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold flex-shrink-0">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {savingUserId === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-teal" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                            className="rounded-lg border border-border bg-black/30 px-2 py-1 text-xs text-foreground focus:border-teal focus:outline-none transition-smooth"
                          >
                            {(["fan", "staff", "manager", "admin"] as UserRole[]).map((r) => (
                              <option key={r} value={r} className="bg-background capitalize">{r}</option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => toggleUserActive(u.id, u.is_active)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-smooth ${
                            u.is_active ? "bg-teal/20 text-teal hover:bg-teal/30" : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          }`}
                        >
                          {u.is_active ? "Active" : "Suspended"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards management stub */}
            {tab === "rewards" && (
              <div className="glassmorphism rounded-2xl p-6 fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Award className="h-4 w-4 text-teal" /> Rewards Catalog
                  </h2>
                  <span className="text-sm text-muted-foreground">{stats.total_rewards} total</span>
                </div>
                <RewardsManager />
              </div>
            )}

            {/* Transactions */}
            {tab === "transactions" && (
              <div className="glassmorphism rounded-2xl p-6 fade-in-up">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-teal" /> Transaction Log
                </h2>
                <TransactionLog />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function RewardsManager() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("rewards").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setRewards(data);
      setLoading(false);
    });
  }, []);

  async function createReward() {
    if (!name.trim() || !cost) return;
    setSaving(true);
    const { error } = await supabase.from("rewards").insert({
      name: name.trim(), description: desc.trim(),
      point_cost: parseInt(cost), category,
    });
    if (error) toast.error("Failed to create reward");
    else {
      toast.success("Reward created!");
      setName(""); setDesc(""); setCost(""); setShowForm(false);
      const { data } = await supabase.from("rewards").select("*").order("created_at", { ascending: false });
      if (data) setRewards(data);
    }
    setSaving(false);
  }

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-teal" />;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-1.5 rounded-xl border border-teal/30 px-3 py-1.5 text-sm font-semibold text-teal hover:bg-teal/10 transition-smooth"
      >
        <CheckCircle className="h-3.5 w-3.5" /> Add Reward
      </button>

      {showForm && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Reward name *" className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none" />
          <div className="flex gap-2">
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Point cost *" className="flex-1 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-foreground focus:border-teal focus:outline-none" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 rounded-xl border border-border bg-black/20 px-3 py-2 text-sm text-foreground focus:border-teal focus:outline-none">
              {["merchandise", "discount", "experience", "other"].map((c) => (
                <option key={c} value={c} className="bg-background capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={createReward} disabled={saving || !name.trim() || !cost} className="flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light disabled:opacity-60">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {rewards.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{r.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{r.category} · {r.point_cost} pts</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.is_active ? "bg-teal/20 text-teal" : "bg-muted text-muted-foreground"}`}>
            {r.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      ))}
    </div>
  );
}

function TransactionLog() {
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("id, tipper_name, tip_amount_cents, transaction_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTxs(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader2 className="h-5 w-5 animate-spin text-teal" />;
  if (txs.length === 0) return <p className="text-sm text-muted-foreground">No transactions yet.</p>;

  return (
    <div className="space-y-2">
      {txs.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t.tipper_name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground capitalize">{t.transaction_type} · {new Date(t.created_at).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-teal">${(t.tip_amount_cents / 100).toFixed(2)}</p>
            <span className={`text-[10px] font-semibold uppercase ${t.status === "completed" ? "text-teal" : t.status === "failed" ? "text-destructive" : "text-yellow-400"}`}>
              {t.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
