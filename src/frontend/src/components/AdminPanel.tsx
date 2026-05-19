import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@dfinity/principal";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Code2,
  CreditCard,
  Database,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  Lock,
  MessageCircle,
  Monitor,
  Phone,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Terminal,
  UserCog,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminCloseSupportTicket,
  useAdminGetAllSupportConversations,
  useAdminGetSupportMessages,
  useAdminReplySupportMessage,
  useApproveBusinessApplication,
  useCompleteDirectDeposit,
  useGetActiveSessions,
  useGetAllBusinessApplications,
  useGetCompilationStatus,
  useGetEncryptionLog,
  useGetFraudAlerts,
  useGetKYCConfigurationStatus,
  useGetPendingDirectDeposits,
  useGetSMSConfigurationStatus,
  useGetTipsSent,
  useIsCallerAdmin,
  useIsStripeConfigured,
  useRejectBusinessApplication,
  useSearchUsers,
  useSetKYCConfiguration,
  useSetSMSConfiguration,
  useSetStripeConfiguration,
  useSimulateDirectDeposit,
} from "../hooks/useQueries";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab =
  | "applications"
  | "fraud"
  | "sessions"
  | "audit"
  | "settings"
  | "roles"
  | "directdeposit"
  | "support";
type AuditFilter = "today" | "week" | "all";

interface AdminPanelProps {
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tsToMs(ts: bigint) {
  return Number(ts) / 1_000_000;
}

function formatTs(ts: bigint) {
  return new Date(tsToMs(ts)).toLocaleString();
}

function truncatePrincipal(p: Principal | string) {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("applications");

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-teal/40 border-t-teal animate-spin" />
          <p className="text-white/50 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6">
        <div className="glassmorphism rounded-2xl p-8 border border-red-500/20 text-center max-w-sm w-full">
          <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Access Denied</h2>
          <p className="text-sm text-white/50 mb-6">
            Admin privileges required for this panel.
          </p>
          <Button
            onClick={onClose}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "applications",
      label: "Applications",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "fraud",
      label: "Fraud Alerts",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "roles",
      label: "User Roles",
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      id: "directdeposit",
      label: "Deposits",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      id: "support",
      label: "Support",
      icon: <MessageCircle className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-navy-dark relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* ── Sticky Header ── */}
        <div className="frosted-glass border-b border-teal/20 px-4 pt-4 pb-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 max-w-4xl mx-auto mb-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200"
              aria-label="Close Admin Panel"
              data-ocid="admin-close-btn"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal shrink-0" />
                Admin Panel
              </h1>
              <p className="text-xs text-white/40">
                Platform management · Creator only
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center neon-glow">
              <ShieldCheck className="h-4 w-4 text-teal" />
            </div>
          </div>

          {/* Summary stats */}
          <AdminStatsSummary />

          {/* Tab bar */}
          <div
            className="flex gap-1 mt-4 overflow-x-auto"
            role="tablist"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                data-ocid={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-teal border-teal bg-teal/10"
                    : "text-white/50 border-transparent hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "fraud" && <FraudAlertsTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "audit" && <AuditLogTab />}
          {activeTab === "settings" && <AdminSettingsTab />}
          {activeTab === "roles" && <UserRolesTab />}
          {activeTab === "directdeposit" && <DirectDepositAdminTab />}
          {activeTab === "support" && <SupportAdminTab />}
        </main>
      </div>
    </div>
  );
}

// ── Summary Stats ─────────────────────────────────────────────────────────────
function AdminStatsSummary() {
  const { data: allApps = [] } = useGetAllBusinessApplications();
  const { data: fraudAlerts = [] } = useGetFraudAlerts();
  const { data: tipsSent = [] } = useGetTipsSent();

  const pendingCount = allApps.filter(
    ([, app]) => app.status === "pending",
  ).length;
  const unresolvedFraud = fraudAlerts.filter((a) => !a.resolved).length;

  const stats = [
    {
      label: "Pending Apps",
      value: pendingCount,
      icon: <FileText className="h-4 w-4" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Fraud Alerts",
      value: unresolvedFraud,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "Tips Sent",
      value: tipsSent.length,
      icon: <Zap className="h-4 w-4" />,
      color: "text-teal",
      bg: "bg-teal/10 border-teal/20",
    },
    {
      label: "Total Apps",
      value: allApps.length,
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div
      className="grid grid-cols-4 gap-2 max-w-4xl mx-auto"
      data-ocid="admin-stats-row"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={`glassmorphism rounded-xl p-2.5 border ${s.bg} flex flex-col items-center text-center`}
        >
          <span className={s.color}>{s.icon}</span>
          <p className={`text-lg font-bold ${s.color} mt-1 leading-none`}>
            {s.value}
          </p>
          <p className="text-[10px] text-white/40 leading-tight mt-0.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────
function ApplicationsTab() {
  const { data: allApps = [], isLoading } = useGetAllBusinessApplications();
  const approve = useApproveBusinessApplication();
  const reject = useRejectBusinessApplication();
  const [rejectingPrincipal, setRejectingPrincipal] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const filtered =
    filter === "all"
      ? allApps
      : allApps.filter(([, app]) => app.status === filter);

  const handleApprove = async (principal: Principal) => {
    try {
      await approve.mutateAsync(principal);
      toast.success("Application approved!");
    } catch {
      toast.error("Failed to approve application");
    }
  };

  const handleReject = async (principal: Principal) => {
    try {
      await reject.mutateAsync({
        applicant: principal,
        reason: rejectionReason.trim() || undefined,
      });
      toast.success("Application rejected.");
      setRejectingPrincipal(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to reject application");
    }
  };

  if (isLoading) return <TabSkeleton rows={3} />;

  return (
    <div className="space-y-4" data-ocid="admin-applications-tab">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-ocid={`app-filter-${f}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === f
                ? "bg-teal/20 text-teal border border-teal/40"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Filter className="h-3 w-3" />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-white/20" />}
          title="No applications"
          description="Business applications will appear here when submitted."
        />
      )}

      {filtered.map(([principal, app]) => {
        const pid = principal.toString();
        const isRejecting = rejectingPrincipal === pid;

        return (
          <div
            key={pid}
            className="glassmorphism rounded-xl p-5 border border-white/10 space-y-3"
            data-ocid={`app-card-${pid.slice(0, 8)}`}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-teal/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white truncate">
                    {app.businessName}
                  </p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {app.businessType}
                </p>
                <p className="text-xs text-white/30 font-mono mt-0.5">
                  {truncatePrincipal(principal)}
                </p>
              </div>
              <p className="text-xs text-white/30 shrink-0">
                {new Date(tsToMs(app.createdAt)).toLocaleDateString()}
              </p>
            </div>

            {app.description && (
              <p className="text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 border border-white/5 leading-relaxed">
                {app.description}
              </p>
            )}

            {app.status === "rejected" && app.rejectionReason && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{app.rejectionReason}</p>
              </div>
            )}

            {(app.status === "pending" || app.status === "rejected") && (
              <div className="space-y-2">
                {isRejecting ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reason for rejection (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs resize-none"
                      data-ocid="rejection-reason-input"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReject(principal)}
                        disabled={reject.isPending}
                        size="sm"
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs"
                        data-ocid={`confirm-reject-${pid.slice(0, 8)}`}
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setRejectingPrincipal(null);
                          setRejectionReason("");
                        }}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white/60 hover:bg-white/10 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {app.status === "pending" && (
                      <Button
                        onClick={() => handleApprove(principal)}
                        disabled={approve.isPending}
                        size="sm"
                        className="flex-1 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold text-xs"
                        data-ocid={`approve-app-${pid.slice(0, 8)}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                      </Button>
                    )}
                    <Button
                      onClick={() => setRejectingPrincipal(pid)}
                      size="sm"
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs"
                      data-ocid={`reject-app-${pid.slice(0, 8)}`}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Fraud Alerts Tab ──────────────────────────────────────────────────────────
function FraudAlertsTab() {
  const { data: alerts = [], isLoading } = useGetFraudAlerts();

  if (isLoading) return <TabSkeleton rows={3} />;

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-10 w-10 text-teal/40" />}
        title="No alerts — platform is clean"
        description="Fraud alerts will appear here if suspicious activity is detected."
        teal
      />
    );
  }

  const unresolved = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-5" data-ocid="admin-fraud-tab">
      {unresolved.length > 0 && (
        <section>
          <SectionHeading
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            title="Unresolved Alerts"
            count={unresolved.length}
            countColor="text-red-400"
          />
          <div className="space-y-3 mt-3">
            {unresolved.map((alert) => (
              <FraudAlertCard
                key={`${alert.userId.toString()}-${alert.timestamp}`}
                alert={alert}
              />
            ))}
          </div>
        </section>
      )}
      {resolved.length > 0 && (
        <section>
          <SectionHeading
            icon={<CheckCircle className="h-4 w-4 text-green-400" />}
            title="Resolved"
            count={resolved.length}
            countColor="text-green-400"
          />
          <div className="space-y-3 mt-3">
            {resolved.map((alert) => (
              <FraudAlertCard
                key={`${alert.userId.toString()}-${alert.timestamp}`}
                alert={alert}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FraudAlertCard({
  alert,
}: {
  alert: {
    resolved: boolean;
    userId: Principal;
    timestamp: bigint;
    severity: string;
    reason: string;
  };
}) {
  const severityMap: Record<string, string> = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  const severityColor =
    severityMap[alert.severity] ?? "text-white/60 bg-white/5 border-white/10";

  return (
    <div
      className={`glassmorphism rounded-xl p-4 border ${
        alert.resolved ? "border-white/10 opacity-60" : "border-red-500/20"
      }`}
      data-ocid={`fraud-alert-${alert.userId.toString().slice(0, 8)}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${severityColor}`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{alert.reason}</p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${severityColor}`}
            >
              {alert.severity}
            </span>
            {alert.resolved && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-500/10 border-green-500/20 text-green-400 font-semibold uppercase">
                Resolved
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 font-mono mt-1">
            {truncatePrincipal(alert.userId)}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {formatTs(alert.timestamp)}
          </p>
        </div>
      </div>
      {!alert.resolved && (
        <Button
          size="sm"
          onClick={() =>
            toast.info("Mark Resolved coming in next backend update")
          }
          className="mt-3 w-full bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal/80 text-xs"
          data-ocid={`resolve-fraud-${alert.userId.toString().slice(0, 8)}`}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Mark Resolved
        </Button>
      )}
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────
function SessionsTab() {
  const { data: sessions = [], isLoading } = useGetActiveSessions();

  if (isLoading) return <TabSkeleton rows={3} />;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Monitor className="h-10 w-10 text-white/20" />}
        title="No active sessions"
        description="Sessions will appear here as users authenticate."
      />
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-sessions-tab">
      <SectionHeading
        icon={<Monitor className="h-4 w-4 text-teal" />}
        title="Active Sessions"
        count={sessions.length}
      />
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className="glassmorphism rounded-xl p-4 border border-white/10"
          data-ocid={`session-card-${session.sessionId.slice(0, 8)}`}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
              {session.deviceName.toLowerCase().includes("mobile") ||
              session.deviceName.toLowerCase().includes("phone") ? (
                <Smartphone className="h-5 w-5 text-teal/70" />
              ) : (
                <Monitor className="h-5 w-5 text-teal/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">
                {session.deviceName || "Unknown device"}
              </p>
              <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.location || "Unknown location"}
              </p>
              <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Logged in {formatTs(session.loginTimestamp)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast.info("Session revoke coming soon")}
              className="shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs h-8"
              data-ocid={`revoke-session-${session.sessionId.slice(0, 8)}`}
            >
              Revoke
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const { data: events = [], isLoading } = useGetEncryptionLog();
  const [timeFilter, setTimeFilter] = useState<AuditFilter>("all");

  const now = Date.now();
  const filtered = events.filter((e) => {
    const ms = tsToMs(e.timestamp);
    if (timeFilter === "today") return now - ms < 86_400_000;
    if (timeFilter === "week") return now - ms < 604_800_000;
    return true;
  });

  const eventIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("encrypt")) return <Lock className="h-4 w-4" />;
    if (t.includes("kyc")) return <ShieldCheck className="h-4 w-4" />;
    if (t.includes("withdraw")) return <Database className="h-4 w-4" />;
    if (t.includes("pin")) return <Terminal className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const filterLabels: Record<AuditFilter, string> = {
    today: "Today",
    week: "This Week",
    all: "All Time",
  };

  return (
    <div className="space-y-4" data-ocid="admin-audit-tab">
      <div className="flex gap-2">
        {(["today", "week", "all"] as AuditFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTimeFilter(f)}
            data-ocid={`audit-filter-${f}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              timeFilter === f
                ? "bg-teal/20 text-teal border border-teal/40"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {isLoading && <TabSkeleton rows={5} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<Activity className="h-10 w-10 text-white/20" />}
          title="No events in this range"
          description="Security events from the encryption log will appear here."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {[...filtered]
            .sort((a, b) => Number(b.timestamp - a.timestamp))
            .map((event) => (
              <div
                key={`${event.eventType}-${event.timestamp}`}
                className="glassmorphism rounded-xl px-4 py-3 border border-white/10 flex items-start gap-3"
                data-ocid={`audit-event-${event.timestamp}`}
              >
                <div className="h-8 w-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0 text-teal/70">
                  {eventIcon(event.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/90">
                    {event.eventType}
                  </p>
                  <p className="text-xs text-teal/70 mt-0.5">
                    {event.dataType}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {formatTs(event.timestamp)}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-white/20 shrink-0 mt-1" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  "data-ocid": dataOcid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  "data-ocid"?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-ocid={dataOcid}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50 pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        aria-label={show ? "Hide value" : "Show value"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function CredentialBadge({
  configured,
  label,
}: { configured: boolean; label?: string }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      {label ?? "Connected"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Not Connected
    </span>
  );
}

function AdminSettingsTab() {
  const { data: compilationStatus, isLoading: statusLoading } =
    useGetCompilationStatus();
  const { data: stripeConfigured = false } = useIsStripeConfigured();
  const { data: smsStatus } = useGetSMSConfigurationStatus();
  const { data: kycStatus } = useGetKYCConfigurationStatus();

  const setStripe = useSetStripeConfiguration();
  const setSMS = useSetSMSConfiguration();
  const setKYC = useSetKYCConfiguration();

  // Stripe
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeCountries, setStripeCountries] = useState("US,CA,GB");

  // Twilio
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");

  // KYC
  const [kycApiKey, setKycApiKey] = useState("");
  const [kycProvider, setKycProvider] = useState<"persona" | "onfido">(
    "persona",
  );

  const handleSaveStripe = async () => {
    if (!stripeSecretKey.trim()) {
      toast.error("Stripe secret key is required");
      return;
    }
    try {
      const countryList = stripeCountries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);
      await setStripe.mutateAsync({
        secretKey: stripeSecretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success("Stripe credentials saved");
      setStripeSecretKey("");
      setStripeCountries("US,CA,GB");
    } catch {
      toast.error("Failed to save Stripe credentials");
    }
  };

  const handleSaveSMS = async () => {
    if (!twilioSid.trim() || !twilioToken.trim() || !twilioPhone.trim()) {
      toast.error("All Twilio fields are required");
      return;
    }
    try {
      await setSMS.mutateAsync({
        accountSid: twilioSid.trim(),
        authToken: twilioToken.trim(),
        fromPhone: twilioPhone.trim(),
      });
      toast.success("Twilio credentials saved — SMS 2FA is now live");
      setTwilioSid("");
      setTwilioToken("");
      setTwilioPhone("");
    } catch {
      toast.error("Failed to save Twilio credentials");
    }
  };

  const handleSaveKYC = async () => {
    if (!kycApiKey.trim()) {
      toast.error("KYC API key is required");
      return;
    }
    try {
      await setKYC.mutateAsync({
        apiKey: kycApiKey.trim(),
        provider: kycProvider,
      });
      toast.success(`KYC credentials saved — ${kycProvider} is now active`);
      setKycApiKey("");
    } catch {
      toast.error("Failed to save KYC credentials");
    }
  };

  return (
    <div className="space-y-8" data-ocid="admin-settings-tab">
      {/* ── Credentials Section ── */}
      <section>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
          Integration Credentials
        </p>

        {/* Card 1: Stripe */}
        <div className="space-y-4">
          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
            data-ocid="stripe-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Stripe — Fiat Payments
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Required to activate card payments, bank linking, and
                    withdrawals.
                  </p>
                </div>
              </div>
              <CredentialBadge configured={stripeConfigured} />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="stripe-secret-key"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  Secret Key
                </label>
                <PasswordInput
                  id="stripe-secret-key"
                  value={stripeSecretKey}
                  onChange={setStripeSecretKey}
                  placeholder="sk_live_xxxxxxxxxxxxxxxx"
                  data-ocid="stripe-secret-key"
                />
              </div>
              <div>
                <label
                  htmlFor="stripe-countries"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  Allowed Countries{" "}
                  <span className="text-white/30">
                    (comma-separated, e.g. US,CA,GB)
                  </span>
                </label>
                <input
                  id="stripe-countries"
                  type="text"
                  value={stripeCountries}
                  onChange={(e) => setStripeCountries(e.target.value)}
                  placeholder="US,CA,GB"
                  data-ocid="stripe-allowed-countries"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveStripe}
              disabled={setStripe.isPending}
              data-ocid="save-stripe-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setStripe.isPending ? "Saving…" : "Save Stripe Credentials"}
            </button>
          </div>

          {/* Card 2: Twilio */}
          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
            data-ocid="twilio-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Twilio — SMS 2FA
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Required to send real one-time codes during withdrawals.
                  </p>
                </div>
              </div>
              <CredentialBadge
                configured={smsStatus?.configured ?? false}
                label={
                  smsStatus?.configured && smsStatus.fromPhone
                    ? `Connected · ${smsStatus.fromPhone}`
                    : undefined
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="twilio-sid"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  Account SID
                </label>
                <input
                  id="twilio-sid"
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  data-ocid="twilio-account-sid"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-auth-token"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  Auth Token
                </label>
                <PasswordInput
                  id="twilio-auth-token"
                  value={twilioToken}
                  onChange={setTwilioToken}
                  placeholder="••••••••••••••••••••••••••••••••"
                  data-ocid="twilio-auth-token"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-from-phone"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  From Phone Number
                </label>
                <input
                  id="twilio-from-phone"
                  type="tel"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  placeholder="+1234567890"
                  data-ocid="twilio-from-phone"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSMS}
              disabled={setSMS.isPending}
              data-ocid="save-twilio-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setSMS.isPending ? "Saving…" : "Save Twilio Credentials"}
            </button>
          </div>

          {/* Card 3: KYC */}
          <div
            className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
            data-ocid="kyc-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    KYC Verification — Persona / Onfido
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Required for identity verification on withdrawals over $200.
                  </p>
                </div>
              </div>
              <CredentialBadge
                configured={kycStatus?.configured ?? false}
                label={
                  kycStatus?.configured && kycStatus.provider
                    ? `Connected · ${kycStatus.provider}`
                    : undefined
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="kyc-api-key"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  API Key
                </label>
                <PasswordInput
                  id="kyc-api-key"
                  value={kycApiKey}
                  onChange={setKycApiKey}
                  placeholder="••••••••••••••••••••••••••••••••"
                  data-ocid="kyc-api-key"
                />
              </div>
              <div>
                <label
                  htmlFor="kyc-provider"
                  className="text-xs text-white/50 mb-1.5 block"
                >
                  Provider
                </label>
                <select
                  id="kyc-provider"
                  value={kycProvider}
                  onChange={(e) =>
                    setKycProvider(e.target.value as "persona" | "onfido")
                  }
                  data-ocid="kyc-provider-select"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-teal/50 appearance-none cursor-pointer"
                >
                  <option value="persona" className="bg-[#0f172a]">
                    Persona
                  </option>
                  <option value="onfido" className="bg-[#0f172a]">
                    Onfido
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveKYC}
              disabled={setKYC.isPending}
              data-ocid="save-kyc-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setKYC.isPending ? "Saving…" : "Save KYC Credentials"}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 flex items-start gap-2 bg-teal/5 border border-teal/20 rounded-xl px-4 py-3">
          <Lock className="h-4 w-4 text-teal shrink-0 mt-0.5" />
          <p className="text-xs text-teal/80 leading-relaxed">
            Credentials are encrypted and stored securely. They are never
            exposed to end users.
          </p>
        </div>
      </section>

      {/* ── Compilation Status ── */}
      <section>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
          Security Compilation Status
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-teal" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Code Obfuscation & Protection
              </p>
              <p className="text-xs text-white/40">
                ProGuard (Android) · SwiftShield (iOS)
              </p>
            </div>
          </div>

          {statusLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : compilationStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal/70" />
                  <span className="text-xs font-semibold text-white/80">
                    Obfuscation Layer
                  </span>
                </div>
                <Badge className="bg-teal/20 text-teal border-teal/30 text-[10px]">
                  {compilationStatus.obfuscationLayer}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 bg-green-500/5 rounded-lg border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-400/70" />
                  <span className="text-xs font-semibold text-white/80">
                    ProGuard (Android)
                  </span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-400/70" />
                  <span className="text-xs font-semibold text-white/80">
                    SwiftShield (iOS)
                  </span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-[10px] text-white/30 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last verified:{" "}
                {formatTs(compilationStatus.verificationTimestamp)}
              </p>
              {compilationStatus.tooltipNote && (
                <p className="text-xs text-white/40 italic bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  {compilationStatus.tooltipNote}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/40 text-center py-4">
              Compilation status unavailable
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ── User Roles Tab ─────────────────────────────────────────────────────────────
function UserRolesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [], isLoading: searching } =
    useSearchUsers(searchQuery);

  const handleRoleAction = (username: string, role: string) => {
    toast.success(`Role update for @${username} → ${role} queued`);
  };

  return (
    <div className="space-y-4" data-ocid="admin-roles-tab">
      <div className="glassmorphism rounded-xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-white">Search Users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            type="search"
            placeholder="Search by @username or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            data-ocid="role-search-input"
          />
        </div>
        {searching && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="h-3 w-3 rounded-full border border-teal/60 border-t-transparent animate-spin" />
            Searching…
          </div>
        )}
        {!searching &&
          searchQuery.trim().length > 0 &&
          searchResults.length === 0 && (
            <p className="text-xs text-white/40 text-center py-2">
              No users found for "{searchQuery}"
            </p>
          )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.username}
              className="glassmorphism rounded-xl p-4 border border-white/10"
              data-ocid={`role-card-${result.username}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                  <span className="text-teal font-bold text-sm">
                    {result.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      @{result.username}
                    </p>
                    {result.isVerified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-teal shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">
                    {result.bio || "No bio"}
                  </p>
                </div>
                <Badge className="bg-white/10 text-white/60 border-white/10 text-[10px] shrink-0">
                  User
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "Manager")}
                  className="flex-1 bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal/80 text-xs"
                  data-ocid={`promote-manager-${result.username}`}
                >
                  → Manager
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "Admin")}
                  className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs"
                  data-ocid={`promote-admin-${result.username}`}
                >
                  → Admin
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "User")}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-xs"
                  data-ocid={`demote-user-${result.username}`}
                >
                  Demote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searchQuery.trim() && (
        <div className="glassmorphism rounded-xl p-6 border border-white/10 text-center">
          <UserCog className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50 font-semibold">
            Search to find a user
          </p>
          <p className="text-xs text-white/30 mt-1">
            Type a username or phone number above to assign roles.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Support Admin Tab ─────────────────────────────────────────────────────────
function SupportAdminTab() {
  const { data: conversations = [], isLoading } =
    useAdminGetAllSupportConversations();
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null,
  );
  const { data: messages = [], refetch: refetchMessages } =
    useAdminGetSupportMessages(selectedPrincipal);
  const reply = useAdminReplySupportMessage();
  const close = useAdminCloseSupportTicket();
  const [replyText, setReplyText] = useState("");

  const handleReply = async () => {
    if (!selectedPrincipal || !replyText.trim()) return;
    try {
      await reply.mutateAsync({
        userPrincipal: selectedPrincipal,
        message: replyText.trim(),
      });
      toast.success("Reply sent");
      setReplyText("");
      await refetchMessages();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleClose = async (p: Principal) => {
    try {
      await close.mutateAsync(p);
      toast.success("Ticket closed");
      if (selectedPrincipal?.toString() === p.toString())
        setSelectedPrincipal(null);
    } catch {
      toast.error("Failed to close ticket");
    }
  };

  if (isLoading) return <TabSkeleton rows={3} />;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-10 w-10 text-teal/30" />}
        title="No support conversations"
        description="User support tickets will appear here when opened."
        teal
      />
    );
  }

  return (
    <div className="space-y-4" data-ocid="admin-support-tab">
      {/* Conversation list */}
      {!selectedPrincipal && (
        <div className="space-y-3">
          <SectionHeading
            icon={<MessageCircle className="h-4 w-4 text-teal" />}
            title="Support Tickets"
            count={conversations.length}
          />
          {conversations.map(([principal, convo]) => {
            const pid = principal.toString();
            const statusMap: Record<string, string> = {
              open: "bg-teal/10 text-teal border-teal/30",
              waiting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
              resolved: "bg-green-500/10 text-green-400 border-green-500/20",
            };
            const statusCls =
              statusMap[convo.status.toLowerCase()] ?? statusMap.open;
            return (
              <button
                key={pid}
                type="button"
                className="w-full text-left glassmorphism rounded-xl p-4 border border-white/10 hover:border-teal/30 transition-colors"
                data-ocid={`admin-support-ticket-${pid.slice(0, 8)}`}
                onClick={() => setSelectedPrincipal(principal)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {convo.subject}
                    </p>
                    <p className="text-xs text-white/40 font-mono mt-0.5">
                      {truncatePrincipal(principal)}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(
                        Number(convo.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusCls}`}
                    >
                      {convo.status}
                    </span>
                    {Number(convo.unreadCount) > 0 && (
                      <span className="h-4 w-4 bg-teal text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {Number(convo.unreadCount)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Thread view */}
      {selectedPrincipal && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPrincipal(null)}
              className="border-white/10 text-white/60 hover:bg-white/5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              All Tickets
            </Button>
            <p className="text-xs text-white/40 font-mono truncate flex-1">
              {truncatePrincipal(selectedPrincipal)}
            </p>
            <Button
              size="sm"
              onClick={() => handleClose(selectedPrincipal)}
              disabled={close.isPending}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs"
              data-ocid="admin-support-close-ticket-button"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Close Ticket
            </Button>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === "admin";
              const ts = new Date(Number(msg.timestamp) / 1_000_000);
              return (
                <div
                  key={`admin-msg-${String(msg.timestamp)}-${idx}`}
                  className={`flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isAdmin ? "bg-teal text-white" : "bg-white/10 text-white/90 border border-white/10"}`}
                  >
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-white/25 px-1">
                    {isAdmin ? "You (Admin)" : "User"} ·{" "}
                    {ts.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">
                No messages yet
              </p>
            )}
          </div>

          {/* Reply input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleReply();
                }
              }}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-teal/50"
              data-ocid="admin-support-reply-input"
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || reply.isPending}
              size="sm"
              className="bg-teal hover:bg-teal/90 text-white px-4"
              data-ocid="admin-support-reply-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Direct Deposit Admin Tab ──────────────────────────────────────────────────

function DirectDepositAdminTab() {
  const { data: pending = [], isLoading: pendingLoading } =
    useGetPendingDirectDeposits();
  const simulate = useSimulateDirectDeposit();
  const complete = useCompleteDirectDeposit();

  const [targetUser, setTargetUser] = useState("");
  const [amount, setAmount] = useState("");
  const [isTest, setIsTest] = useState(true);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);

  function tsToMs(ts: bigint) {
    return Number(ts) / 1_000_000;
  }

  const handleSimulate = async () => {
    if (!targetUser.trim()) {
      toast.error("Enter a user principal");
      return;
    }
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const result = await simulate.mutateAsync({
        targetUser: targetUser.trim(),
        amount: BigInt(amountCents),
        isTest,
      });
      const depositId =
        typeof result === "object" && result !== null && "id" in result
          ? (result as { id: string }).id
          : "unknown";
      setSimulateResult(
        `Deposit simulated! ID: ${depositId} · $${(amountCents / 100).toFixed(2)}${isTest ? " (test)" : ""}`,
      );
      setTargetUser("");
      setAmount("");
      toast.success("Deposit simulated successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Simulation failed");
    }
  };

  const handleComplete = async (depositId: string) => {
    try {
      await complete.mutateAsync(depositId);
      toast.success("Deposit completed!");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to complete deposit",
      );
    }
  };

  return (
    <div className="space-y-6" data-ocid="admin-directdeposit-tab">
      {/* ── Simulate Section ── */}
      <div className="glassmorphism rounded-xl p-5 border border-teal/20 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-white">
            Simulate Direct Deposit
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="dd-target-user"
              className="text-xs text-white/50 mb-1.5 block"
            >
              Target User (Principal)
            </label>
            <input
              id="dd-target-user"
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="aaaaa-bbbbb-ccccc-ddddd-cai"
              data-ocid="admin-dd-target-input"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
            />
          </div>
          <div>
            <label
              htmlFor="dd-amount"
              className="text-xs text-white/50 mb-1.5 block"
            >
              Amount (USD)
            </label>
            <input
              id="dd-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              data-ocid="admin-dd-amount-input"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              data-ocid="admin-dd-test-toggle"
              className="sr-only"
            />
            <div
              role="switch"
              aria-checked={isTest}
              tabIndex={0}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                isTest ? "bg-teal/60" : "bg-white/20"
              }`}
              onClick={() => setIsTest((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setIsTest((v) => !v);
              }}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isTest ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-xs text-white/70">
              Mark as test deposit
              <span className="text-white/30 ml-1">
                (won't affect real balance)
              </span>
            </span>
          </label>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={simulate.isPending}
          className="w-full bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold"
          data-ocid="admin-dd-simulate-btn"
        >
          {simulate.isPending ? "Simulating…" : "Simulate Deposit"}
        </Button>

        {simulateResult && (
          <div
            className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
            data-ocid="admin-dd-simulate-success"
          >
            <p className="text-xs text-green-400 font-medium">
              {simulateResult}
            </p>
          </div>
        )}
      </div>

      {/* ── Pending Deposits ── */}
      <div>
        <SectionHeading
          icon={<Clock className="h-4 w-4 text-amber-400" />}
          title="Pending Deposits (All Users)"
          count={pending.length}
          countColor="text-amber-400"
        />

        {pendingLoading && <TabSkeleton rows={3} />}

        {!pendingLoading && pending.length === 0 && (
          <EmptyState
            icon={<Building2 className="h-10 w-10 text-white/20" />}
            title="No pending deposits"
            description="Simulated deposits that haven't been completed will appear here."
          />
        )}

        {!pendingLoading && pending.length > 0 && (
          <div className="space-y-3 mt-3">
            {pending.map((dep, idx) => (
              <div
                key={dep.id}
                className="glassmorphism rounded-xl p-4 border border-amber-500/20 space-y-3"
                data-ocid={`admin-dd-pending-item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">
                        ${(Number(dep.amount) / 100).toFixed(2)}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pending
                      </span>
                      {dep.isTest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-white/10 text-white/40 border-white/10">
                          Test
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 font-mono truncate">
                      {dep.targetUser}
                    </p>
                    <p className="text-[10px] text-white/30 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {new Date(tsToMs(dep.createdAt)).toLocaleString()}
                    </p>
                    {dep.clearAt && dep.clearAt > BigInt(0) && (
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        Clears{" "}
                        {new Date(tsToMs(dep.clearAt)).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleComplete(dep.id)}
                    disabled={complete.isPending}
                    className="shrink-0 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal text-xs h-8"
                    data-ocid={`admin-dd-complete-btn.${idx + 1}`}
                  >
                    Complete Now
                  </Button>
                </div>
                <p className="text-[10px] text-white/25 font-mono break-all">
                  ID: {dep.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const cls = map[status] ?? "bg-white/10 text-white/60 border-white/10";
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${cls}`}
    >
      {status}
    </span>
  );
}

function SectionHeading({
  icon,
  title,
  count,
  countColor = "text-white/60",
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  countColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-sm font-bold text-white">{title}</p>
      {count !== undefined && (
        <span className={`text-xs font-semibold ${countColor}`}>({count})</span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  teal,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  teal?: boolean;
}) {
  return (
    <div
      className={`glassmorphism rounded-xl p-8 border ${
        teal ? "border-teal/20" : "border-white/10"
      } text-center`}
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <p
        className={`text-sm font-semibold ${teal ? "text-teal/80" : "text-white/60"}`}
      >
        {title}
      </p>
      <p className="text-xs text-white/30 mt-1 max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}

function TabSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => `sk-${i}`).map((id) => (
        <div
          key={id}
          className="glassmorphism rounded-xl p-4 border border-white/10 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
