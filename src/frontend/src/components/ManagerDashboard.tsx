import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Link2,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAcceptStaffInvite,
  useCreateRosterInviteLink,
  useDeclineStaffInvite,
  useFindUserByPhone,
  useGetManagerRoster,
  useGetMyRosterInvites,
  useGetPayoutHistory,
  useGetStaffTipTotals,
  useGetTipPoolSettings,
  useInviteStaffByPhone,
  useRecordPayout,
  useRemoveStaffMember,
  useSetTipPoolMode,
} from "../hooks/useQueries";
import type {
  PayoutRecord,
  StaffInvite,
  StaffMember,
} from "../hooks/useQueries";

type Tab = "overview" | "staff" | "payouts" | "settings";
export type DateRange = "today" | "week" | "month" | "all";
type AddStaffMode = "link" | "phone";

interface ManagerDashboardProps {
  onClose: () => void;
}

export default function ManagerDashboard({ onClose }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dateRange, setDateRange] = useState<DateRange>("week");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addStaffMode, setAddStaffMode] = useState<AddStaffMode>("link");
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [foundUser, setFoundUser] = useState<{
    name: string;
    username: string;
    photo?: string;
  } | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {},
  );

  const { data: roster = [], isLoading: rosterLoading } = useGetManagerRoster();
  const { data: tipTotals = [] } = useGetStaffTipTotals(dateRange);
  const { data: poolSettings } = useGetTipPoolSettings();
  const { data: payoutHistory = [], isLoading: payoutsLoading } =
    useGetPayoutHistory();

  const createLink = useCreateRosterInviteLink();
  const findByPhone = useFindUserByPhone();
  const inviteByPhone = useInviteStaffByPhone();
  const removeStaff = useRemoveStaffMember();
  const setPoolMode = useSetTipPoolMode();
  const recordPayout = useRecordPayout();

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPool = tipTotals.reduce((sum, [, amt]) => sum + amt, BigInt(0));
  const staffCount = roster.filter((m) => m.status === "active").length;
  const fairShare = staffCount > 0 ? totalPool / BigInt(staffCount) : BigInt(0);

  function centsToUsd(cents: bigint) {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }

  function tipForMember(principal: string) {
    const entry = tipTotals.find(([p]) => p.toString() === principal);
    return entry ? entry[1] : BigInt(0);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleGenerateLink = async () => {
    try {
      const link = await createLink.mutateAsync();
      setGeneratedLink(link);
      toast.success("Invite link generated!");
    } catch {
      toast.error("Failed to generate invite link");
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    toast.success("Link copied!");
  };

  const handleShareLink = () => {
    if (!generatedLink) return;
    if (navigator.share) {
      navigator.share({ title: "Join my staff roster", url: generatedLink });
    } else {
      handleCopyLink();
    }
  };

  const handlePhoneLookup = async () => {
    if (!phoneInput.trim()) return;
    try {
      const result = await findByPhone.mutateAsync(phoneInput.trim());
      if (result.__kind__ === "ok") {
        setFoundUser({
          name: result.ok.username,
          username: result.ok.username,
        });
      } else {
        toast.error(result.err ?? "User not found");
        setFoundUser(null);
      }
    } catch {
      toast.error("Failed to search for user");
    }
  };

  const handleSendPhoneInvite = async () => {
    if (!phoneInput.trim()) return;
    try {
      await inviteByPhone.mutateAsync(phoneInput.trim());
      toast.success("Invite sent!");
      setPhoneInput("");
      setFoundUser(null);
      setShowAddStaff(false);
    } catch {
      toast.error("Failed to send invite");
    }
  };

  const handleRemoveStaff = async () => {
    if (!removeTarget) return;
    try {
      await removeStaff.mutateAsync(removeTarget.principal);
      setRemoveTarget(null);
      toast.success(`${removeTarget.displayName} removed from roster`);
    } catch {
      toast.error("Failed to remove staff member");
    }
  };

  const handleDistribute = async () => {
    try {
      const distributions: [string, bigint][] = roster
        .filter((m) => m.status === "active")
        .map((m) => {
          const custom = customAmounts[m.principal.toString()];
          const amount = custom
            ? BigInt(Math.round(Number.parseFloat(custom) * 100))
            : fairShare;
          return [m.principal.toString(), amount];
        });
      await recordPayout.mutateAsync({
        distributions,
        notes: `${dateRange} distribution`,
      });
      setCustomAmounts({});
      toast.success("Payout recorded!");
    } catch {
      toast.error("Failed to record payout");
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    { id: "staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
    {
      id: "payouts",
      label: "Payouts",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-navy-dark relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="frosted-glass border-b border-teal/20 px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all duration-200"
              aria-label="Close Manager Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                Manager Dashboard
              </h1>
              <p className="text-xs text-white/50">
                Tip pool &amp; staff management
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-teal" />
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mt-4 max-w-4xl mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-ocid={`manager-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-teal/20 text-teal border border-teal/40"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {activeTab === "overview" && (
            <OverviewTab
              totalPool={totalPool}
              staffCount={staffCount}
              tipTotals={tipTotals}
              roster={roster}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              centsToUsd={centsToUsd}
              tipForMember={tipForMember}
            />
          )}
          {activeTab === "staff" && (
            <StaffTab
              roster={roster}
              isLoading={rosterLoading}
              tipForMember={tipForMember}
              centsToUsd={centsToUsd}
              onAddStaff={() => setShowAddStaff(true)}
              onRemove={setRemoveTarget}
              dateRange={dateRange}
            />
          )}
          {activeTab === "payouts" && (
            <PayoutsTab
              roster={roster}
              fairShare={fairShare}
              totalPool={totalPool}
              customAmounts={customAmounts}
              onCustomAmountChange={(principal, val) =>
                setCustomAmounts((prev) => ({ ...prev, [principal]: val }))
              }
              onDistribute={handleDistribute}
              isDistributing={recordPayout.isPending}
              payoutHistory={payoutHistory}
              isLoading={payoutsLoading}
              centsToUsd={centsToUsd}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              poolSettings={poolSettings}
              onSetPoolMode={async (enabled, mode) => {
                try {
                  await setPoolMode.mutateAsync({ enabled, mode });
                  toast.success("Pool settings updated");
                } catch {
                  toast.error("Failed to update settings");
                }
              }}
              isUpdating={setPoolMode.isPending}
            />
          )}
        </main>
      </div>

      {/* Add Staff Bottom Sheet */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-teal/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal" />
              Add Staff Member
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Invite someone to join your staff roster
            </DialogDescription>
          </DialogHeader>

          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAddStaffMode("link");
                setPhoneInput("");
                setFoundUser(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                addStaffMode === "link"
                  ? "bg-teal/20 text-teal border border-teal/40"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              }`}
              data-ocid="add-staff-link-tab"
            >
              <Link2 className="h-4 w-4" />
              Invite Link
            </button>
            <button
              type="button"
              onClick={() => {
                setAddStaffMode("phone");
                setGeneratedLink(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                addStaffMode === "phone"
                  ? "bg-teal/20 text-teal border border-teal/40"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              }`}
              data-ocid="add-staff-phone-tab"
            >
              <Phone className="h-4 w-4" />
              By Phone
            </button>
          </div>

          {/* Invite Link flow */}
          {addStaffMode === "link" && (
            <div className="space-y-3">
              {!generatedLink ? (
                <Button
                  onClick={handleGenerateLink}
                  disabled={createLink.isPending}
                  className="w-full bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold"
                  data-ocid="generate-invite-link-btn"
                >
                  {createLink.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Generate Invite Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="glassmorphism rounded-lg p-3 border border-teal/20">
                    <p className="text-xs text-white/50 mb-1">Invite link</p>
                    <p className="text-sm text-teal break-all font-mono">
                      {generatedLink}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyLink}
                      className="flex-1 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal text-sm"
                      data-ocid="copy-invite-link-btn"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleShareLink}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/20 text-white/80 text-sm"
                      data-ocid="share-invite-link-btn"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedLink(null)}
                    className="w-full border-white/10 text-white/50 text-xs"
                  >
                    Generate New Link
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Phone number flow */}
          {addStaffMode === "phone" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setFoundUser(null);
                  }}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 flex-1"
                  data-ocid="staff-phone-input"
                />
                <Button
                  onClick={handlePhoneLookup}
                  disabled={findByPhone.isPending || !phoneInput.trim()}
                  className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal px-3"
                  data-ocid="lookup-phone-btn"
                >
                  {findByPhone.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {foundUser && (
                <div className="glassmorphism rounded-lg p-3 border border-teal/20 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                    <span className="text-teal font-bold text-sm">
                      {foundUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {foundUser.name}
                    </p>
                    <p className="text-xs text-white/50">
                      @{foundUser.username}
                    </p>
                  </div>
                  <Button
                    onClick={handleSendPhoneInvite}
                    disabled={inviteByPhone.isPending}
                    size="sm"
                    className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal text-xs shrink-0"
                    data-ocid="send-phone-invite-btn"
                  >
                    {inviteByPhone.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Invite"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddStaff(false);
                setGeneratedLink(null);
                setPhoneInput("");
                setFoundUser(null);
              }}
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Staff Confirmation */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-red-500/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Remove Staff Member?
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {removeTarget?.displayName} will be removed from your roster and
              will no longer appear in tip pool distributions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveStaff}
              disabled={removeStaff.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
              data-ocid="confirm-remove-staff-btn"
            >
              {removeStaff.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({
  totalPool,
  staffCount,
  tipTotals,
  roster,
  dateRange,
  onDateRangeChange,
  centsToUsd,
  tipForMember,
}: {
  totalPool: bigint;
  staffCount: number;
  tipTotals: [string, bigint][];
  roster: StaffMember[];
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  centsToUsd: (n: bigint) => string;
  tipForMember: (p: string) => bigint;
}) {
  const ranges: { id: DateRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-5" data-ocid="manager-overview-tab">
      {/* Date range */}
      <div className="flex gap-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onDateRangeChange(r.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              dateRange === r.id
                ? "bg-teal/20 text-teal border border-teal/40"
                : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
          <p className="text-xs text-white/50 mb-1">Total Pool</p>
          <p className="text-2xl font-bold text-teal">
            {centsToUsd(totalPool)}
          </p>
          <p className="text-xs text-white/40 mt-1 capitalize">{dateRange}</p>
        </div>
        <div className="glassmorphism rounded-xl p-4 border border-green-500/30 bg-green-500/5">
          <p className="text-xs text-white/50 mb-1">Active Staff</p>
          <p className="text-2xl font-bold text-green-400">{staffCount}</p>
          <p className="text-xs text-white/40 mt-1">members</p>
        </div>
      </div>

      {/* Top earners */}
      {tipTotals.length > 0 && (
        <div className="glassmorphism rounded-xl p-4 border border-white/10">
          <p className="text-sm font-semibold text-white mb-3">Top Earners</p>
          <div className="space-y-2">
            {tipTotals
              .sort(([, a], [, b]) => (b > a ? 1 : -1))
              .slice(0, 5)
              .map(([principal, amount]) => {
                const member = roster.find(
                  (m) => m.principal.toString() === principal,
                );
                const total = tipForMember(principal);
                const pct =
                  totalPool > BigInt(0)
                    ? Number((total * BigInt(100)) / totalPool)
                    : 0;
                return (
                  <div key={principal} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                      <span className="text-teal text-xs font-bold">
                        {(member?.displayName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <p className="text-xs text-white/80 truncate">
                          {member?.displayName ?? `${principal.slice(0, 8)}…`}
                        </p>
                        <p className="text-xs text-teal font-semibold ml-2 shrink-0">
                          {centsToUsd(amount)}
                        </p>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal to-teal/60 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────────────────────────
function StaffTab({
  roster,
  isLoading,
  tipForMember,
  centsToUsd,
  onAddStaff,
  onRemove,
  dateRange,
}: {
  roster: StaffMember[];
  isLoading: boolean;
  tipForMember: (p: string) => bigint;
  centsToUsd: (n: bigint) => string;
  onAddStaff: () => void;
  onRemove: (m: StaffMember) => void;
  dateRange: DateRange;
}) {
  const { data: pendingInvites = [] } = useGetMyRosterInvites();
  const inviteByPhone = useInviteStaffByPhone();

  const handleResend = (member: StaffMember) => {
    // Re-trigger invite by using the member's displayName as the phone
    // (displayName stores the phone for pending phone-invited members)
    inviteByPhone.mutate(member.displayName, {
      onSuccess: () => toast.success(`Invite resent to ${member.displayName}`),
      onError: () => toast.error("Failed to resend invite"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="manager-staff-tab">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glassmorphism rounded-xl p-4 border border-white/10 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10" />
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

  const activeMembers = roster.filter((m) => m.status === "active");
  const pendingMembers = roster.filter((m) => m.status === "pending");

  return (
    <div className="space-y-4" data-ocid="manager-staff-tab">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          {activeMembers.length} active ·{" "}
          {pendingMembers.length + pendingInvites.length} pending
        </p>
        <Button
          onClick={onAddStaff}
          size="sm"
          className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold"
          data-ocid="add-staff-btn"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Staff
        </Button>
      </div>

      {/* Outgoing invites still pending */}
      {pendingMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-yellow-400/80 uppercase tracking-wider">
            Awaiting Response
          </p>
          {pendingMembers.map((member) => (
            <StaffCard
              key={member.principal.toString()}
              member={member}
              tipAmount={tipForMember(member.principal.toString())}
              centsToUsd={centsToUsd}
              onRemove={onRemove}
              onResend={handleResend}
              dateRange={dateRange}
            />
          ))}
        </div>
      )}

      {/* Active members */}
      {activeMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-400/80 uppercase tracking-wider">
            Active Members
          </p>
          {activeMembers.map((member) => (
            <StaffCard
              key={member.principal.toString()}
              member={member}
              tipAmount={tipForMember(member.principal.toString())}
              centsToUsd={centsToUsd}
              onRemove={onRemove}
              dateRange={dateRange}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {roster.length === 0 && (
        <div className="glassmorphism rounded-xl p-8 border border-white/10 text-center">
          <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/60">
            No staff on roster yet
          </p>
          <p className="text-xs text-white/30 mt-1 mb-4">
            Add staff members to start tracking tips
          </p>
          <Button
            onClick={onAddStaff}
            size="sm"
            className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add First Staff Member
          </Button>
        </div>
      )}
    </div>
  );
}

function StaffCard({
  member,
  tipAmount,
  centsToUsd,
  onRemove,
  onResend,
  dateRange,
}: {
  member: StaffMember;
  tipAmount: bigint;
  centsToUsd: (n: bigint) => string;
  onRemove: (m: StaffMember) => void;
  onResend?: (m: StaffMember) => void;
  dateRange: string;
}) {
  return (
    <div
      className="glassmorphism rounded-xl p-4 border border-white/10 flex items-center gap-3"
      data-ocid={`staff-card-${member.principal.toString().slice(0, 8)}`}
    >
      <div className="h-10 w-10 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0 overflow-hidden">
        {member.photo ? (
          <img
            src={member.photo}
            alt={member.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-teal font-bold text-sm">
            {member.displayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">
            {member.displayName}
          </p>
          {member.status === "pending" ? (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shrink-0">
              <Clock className="h-2.5 w-2.5" />
              Awaiting
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 shrink-0">
              <CheckCircle className="h-2.5 w-2.5" />
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 mt-0.5">
          Joined{" "}
          {new Date(Number(member.joinedAt) / 1_000_000).toLocaleDateString()}
        </p>
        {/* Pending-only actions */}
        {member.status === "pending" && (
          <div className="flex gap-2 mt-2">
            {onResend && (
              <button
                type="button"
                onClick={() => onResend(member)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal transition-colors"
                aria-label={`Resend invite to ${member.displayName}`}
                data-ocid={`resend-invite-${member.principal.toString().slice(0, 8)}`}
              >
                <RefreshCw className="h-3 w-3" />
                Resend
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(member)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
              aria-label={`Cancel invite for ${member.displayName}`}
              data-ocid={`cancel-invite-${member.principal.toString().slice(0, 8)}`}
            >
              <X className="h-3 w-3" />
              Cancel Invite
            </button>
          </div>
        )}
      </div>
      {member.status === "active" && (
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-teal">{centsToUsd(tipAmount)}</p>
          <p className="text-xs text-white/40 capitalize">{dateRange}</p>
        </div>
      )}
      {member.status === "active" && (
        <button
          type="button"
          onClick={() => onRemove(member)}
          className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-all duration-200 shrink-0"
          aria-label={`Remove ${member.displayName}`}
          data-ocid={`remove-staff-${member.principal.toString().slice(0, 8)}`}
        >
          <X className="h-3.5 w-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
}

// ── Payouts Tab ───────────────────────────────────────────────────────────────
function PayoutsTab({
  roster,
  fairShare,
  totalPool,
  customAmounts,
  onCustomAmountChange,
  onDistribute,
  isDistributing,
  payoutHistory,
  isLoading,
  centsToUsd,
}: {
  roster: StaffMember[];
  fairShare: bigint;
  totalPool: bigint;
  customAmounts: Record<string, string>;
  onCustomAmountChange: (principal: string, val: string) => void;
  onDistribute: () => void;
  isDistributing: boolean;
  payoutHistory: PayoutRecord[];
  isLoading: boolean;
  centsToUsd: (n: bigint) => string;
}) {
  const activeStaff = roster.filter((m) => m.status === "active");

  return (
    <div className="space-y-5" data-ocid="manager-payouts-tab">
      {/* Fair split summary */}
      <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Fair Split</p>
          <span className="text-xs text-teal/70 bg-teal/10 px-2 py-0.5 rounded-full">
            Equal Distribution
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/60 mb-1">
          <span>Total pool</span>
          <span className="text-white font-semibold">
            {centsToUsd(totalPool)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-white/60">
          <span>Per person ({activeStaff.length} staff)</span>
          <span className="text-teal font-bold text-lg">
            {centsToUsd(fairShare)}
          </span>
        </div>
      </div>

      {/* Custom distribution */}
      {activeStaff.length > 0 && (
        <div className="glassmorphism rounded-xl p-4 border border-white/10 space-y-3">
          <p className="text-sm font-semibold text-white">
            Custom Distribution
          </p>
          <p className="text-xs text-white/40">
            Leave blank to use equal split amount
          </p>
          {activeStaff.map((member) => (
            <div
              key={member.principal.toString()}
              className="flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                <span className="text-teal text-xs font-bold">
                  {member.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white flex-1 truncate min-w-0">
                {member.displayName}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-white/40 text-sm">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={(Number(fairShare) / 100).toFixed(2)}
                  value={customAmounts[member.principal.toString()] ?? ""}
                  onChange={(e) =>
                    onCustomAmountChange(
                      member.principal.toString(),
                      e.target.value,
                    )
                  }
                  className="w-24 bg-white/5 border-white/20 text-white text-sm h-8 text-right"
                  data-ocid={`payout-amount-${member.principal.toString().slice(0, 8)}`}
                />
              </div>
            </div>
          ))}
          <Button
            onClick={onDistribute}
            disabled={isDistributing || activeStaff.length === 0}
            className="w-full bg-gradient-to-r from-teal/30 to-teal/20 hover:from-teal/40 hover:to-teal/30 border border-teal/40 text-white font-semibold shadow-lg shadow-teal/20"
            data-ocid="distribute-funds-btn"
          >
            {isDistributing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Distribute Funds
          </Button>
        </div>
      )}

      {/* Payout history */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white">Payout History</p>
        {isLoading ? (
          <div className="glassmorphism rounded-xl p-4 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        ) : payoutHistory.length === 0 ? (
          <div className="glassmorphism rounded-xl p-6 border border-white/10 text-center">
            <DollarSign className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-sm text-white/40">No payouts recorded yet</p>
          </div>
        ) : (
          payoutHistory.map((record) => (
            <div
              key={`${record.timestamp}-${record.notes}`}
              className="glassmorphism rounded-xl p-4 border border-white/10"
              data-ocid={`payout-record-${record.timestamp}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {centsToUsd(record.totalAmount)}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{record.notes}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {record.staffCount} recipients ·{" "}
                    {new Date(
                      Number(record.timestamp) / 1_000_000,
                    ).toLocaleDateString()}
                  </p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({
  poolSettings,
  onSetPoolMode,
  isUpdating,
}: {
  poolSettings: TipPoolConfig | null | undefined;
  onSetPoolMode: (enabled: boolean, mode: "equal" | "custom") => void;
  isUpdating: boolean;
}) {
  const enabled = poolSettings?.enabled ?? false;
  const mode = poolSettings?.mode ?? "equal";

  return (
    <div className="space-y-5" data-ocid="manager-settings-tab">
      {/* Tip Pool toggle */}
      <div className="glassmorphism rounded-xl p-5 border border-teal/20">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-semibold text-white">Tip Pooling</p>
            <p className="text-xs text-white/50 mt-0.5">
              Collect and distribute tips across your team
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSetPoolMode(!enabled, mode)}
            disabled={isUpdating}
            className={`relative h-6 w-11 rounded-full transition-all duration-300 ${
              enabled
                ? "bg-teal/60 border-teal/40"
                : "bg-white/10 border-white/20"
            } border shrink-0`}
            aria-label="Toggle tip pooling"
            data-ocid="tip-pool-toggle"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mode selector (only if enabled) */}
      {enabled && (
        <div className="glassmorphism rounded-xl p-5 border border-white/10 space-y-3">
          <p className="text-sm font-semibold text-white">Distribution Mode</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetPoolMode(true, "equal")}
              disabled={isUpdating}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                mode === "equal"
                  ? "border-teal/40 bg-teal/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              data-ocid="pool-mode-equal"
            >
              <p className="text-sm font-semibold text-white">Equal Split</p>
              <p className="text-xs text-white/50 mt-0.5">
                Tips divided evenly among all staff
              </p>
            </button>
            <button
              type="button"
              onClick={() => onSetPoolMode(true, "custom")}
              disabled={isUpdating}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                mode === "custom"
                  ? "border-teal/40 bg-teal/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              data-ocid="pool-mode-custom"
            >
              <p className="text-sm font-semibold text-white">Custom</p>
              <p className="text-xs text-white/50 mt-0.5">
                Set individual amounts per staff member
              </p>
            </button>
          </div>
        </div>
      )}

      {isUpdating && (
        <div className="flex items-center gap-2 text-teal/70 text-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving settings…
        </div>
      )}
    </div>
  );
}

// ── In-app invite acceptance banner (exported for DashboardPage) ──────────────
export function StaffInviteBanner() {
  const { data: invites = [] } = useGetMyRosterInvites();
  const acceptInvite = useAcceptStaffInvite();
  const declineInvite = useDeclineStaffInvite();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = invites.filter((inv) => !dismissed.includes(inv.inviteCode));
  if (visible.length === 0) return null;

  const invite = visible[0];

  const handleAccept = async () => {
    try {
      await acceptInvite.mutateAsync(invite.inviteCode);
      toast.success("You've joined the staff roster!");
    } catch {
      toast.error("Failed to accept invite");
    }
  };

  const handleDecline = async () => {
    try {
      await declineInvite.mutateAsync(invite.inviteCode);
      setDismissed((prev) => [...prev, invite.inviteCode]);
    } catch {
      toast.error("Failed to decline invite");
    }
  };

  return (
    <div
      className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5"
      data-ocid="staff-invite-banner"
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
          <UserCheck className="h-4 w-4 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Staff Roster Invite
          </p>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
            <span className="text-teal font-semibold">
              {invite.managerName}
            </span>{" "}
            has invited you to join their staff roster.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed((prev) => [...prev, invite.inviteCode])}
          className="text-white/30 hover:text-white/60 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleAccept}
          disabled={acceptInvite.isPending}
          size="sm"
          className="flex-1 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold text-xs h-8"
          data-ocid="accept-staff-invite-btn"
        >
          {acceptInvite.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
          )}
          Accept
        </Button>
        <Button
          onClick={handleDecline}
          disabled={declineInvite.isPending}
          size="sm"
          variant="outline"
          className="flex-1 border-white/20 text-white/60 hover:bg-white/10 text-xs h-8"
          data-ocid="decline-staff-invite-btn"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

export type TipPoolConfig = {
  enabled: boolean;
  mode: "equal" | "custom";
};
