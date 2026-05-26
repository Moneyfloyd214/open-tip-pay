import type { ExtendedStaffMember } from "@/backend";
import {
  Variant_active_inactive_suspended,
  Variant_partTime_fullTime_contractor,
} from "@/backend";
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
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Heart,
  IdCard,
  Link2,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  ShoppingBag,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DEMO_ACTIVE_ORDER,
  DEMO_EXTENDED_STAFF,
  DEMO_STAFF_ROSTER,
  DEMO_STAFF_TIPS,
  DEMO_STANDS,
  useDemoMode,
} from "../context/DemoContext";
import {
  useAcceptStaffInvite,
  useAssignStaffSection,
  useCancelOrder,
  useCreateRosterInviteLink,
  useDeclineStaffInvite,
  useFindUserByPhone,
  useGetActiveOrdersForManager,
  useGetManagerRoster,
  useGetMyRosterInvites,
  useGetPayoutHistory,
  useGetSectionAnalytics,
  useGetSectionAssignments,
  useGetStaffAnalytics,
  useGetStaffTipTotals,
  useGetTipPoolSettings,
  useGetTopStaffPerformers,
  useInviteStaffByPhone,
  useListExtendedStaff,
  useListStands,
  useRecordPayout,
  useRemoveExtendedStaff,
  useRemoveStaffMember,
  useSetTipPoolMode,
  useUpdateOrderStatus,
  useUpsertExtendedStaff,
} from "../hooks/useQueries";
import type {
  PayoutRecord,
  StaffInvite,
  StaffMember,
} from "../hooks/useQueries";
import BadgeGenerator from "./BadgeGenerator";
import CheckInTab from "./manager/CheckInTab";
import GameRosterTab from "./manager/GameRosterTab";
import TipSplitRulesSection from "./manager/TipSplitRulesSection";
import TipSplitSection from "./manager/TipSplitSection";

type Tab =
  | "overview"
  | "staff"
  | "payouts"
  | "settings"
  | "sections"
  | "analytics"
  | "orders"
  | "badges"
  | "checkin"
  | "game-roster"
  | "volunteer-orgs";
export type DateRange = "game" | "week" | "all";
type AddStaffMode = "link" | "phone" | "manual";

interface ManagerDashboardProps {
  onClose: () => void;
}

export default function ManagerDashboard({ onClose }: ManagerDashboardProps) {
  const { isDemoMode } = useDemoMode();
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
  // Date filter for staff tip display
  const [_dateFilter, _setDateFilter] = React.useState<"game" | "week" | "all">(
    "week",
  );

  const { data: roster = [] } = useGetManagerRoster();
  const { data: tipTotals = [] } = useGetStaffTipTotals(dateRange);
  const { data: poolSettings } = useGetTipPoolSettings();
  const { data: payoutHistory = [], isLoading: payoutsLoading } =
    useGetPayoutHistory();

  // Merged display roster: demo mode seeded from DEMO_STAFF_ROSTER
  const displayRoster: StaffMember[] = isDemoMode
    ? DEMO_STAFF_ROSTER.map((s) => ({
        principal: s.id as unknown as StaffMember["principal"],
        displayName: s.displayName,
        joinedAt:
          BigInt(Date.now() - s.joinedDaysAgo * 86400 * 1000) *
          BigInt(1_000_000),
        status: s.status as "active" | "pending",
        photo: undefined,
      }))
    : (roster ?? []);

  const createLink = useCreateRosterInviteLink();
  const findByPhone = useFindUserByPhone();
  const inviteByPhone = useInviteStaffByPhone();
  const removeStaff = useRemoveStaffMember();
  const setPoolMode = useSetTipPoolMode();
  const recordPayout = useRecordPayout();

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPool = tipTotals.reduce((sum, [, amt]) => sum + amt, BigInt(0));
  const staffCount = displayRoster.filter((m) => m.status === "active").length;
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
      id: "checkin" as const,
      label: "Check-In",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "game-roster" as const,
      label: "Game Roster",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "payouts",
      label: "Payout Tips",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "sections",
      label: "Sections",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: "orders" as const,
      label: "Orders",
      icon: <ShoppingBag className="h-4 w-4" />,
    },
    {
      id: "badges" as const,
      label: "QR Code Generator",
      icon: <IdCard className="h-4 w-4" />,
    },
    {
      id: "volunteer-orgs" as const,
      label: "Volunteer Orgs",
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
              className="h-9 w-9 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-all duration-200"
              aria-label="Close Manager Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                Manager Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
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
                    : "text-white/50 hover:text-foreground/80 hover:bg-muted/30"
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
          {activeTab === "staff" && <EnhancedStaffTab />}
          {activeTab === "payouts" && (
            <PayoutsTab
              roster={displayRoster}
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
          {activeTab === "sections" && <SectionsTab managerId="" />}
          {activeTab === "analytics" && <AnalyticsTab managerId="" />}
          {activeTab === "orders" && <OrdersTabContent />}
          {activeTab === "badges" && <BadgeGenerator />}
          {activeTab === "checkin" && <CheckInTab />}
          {activeTab === "game-roster" && <GameRosterTab />}
          {activeTab === "volunteer-orgs" && <StandConfigSection />}
        </main>
      </div>

      {/* Add Staff Bottom Sheet */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-md">
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
                  : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
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
                  : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
              }`}
              data-ocid="add-staff-phone-tab"
            >
              <Phone className="h-4 w-4" />
              By Phone
            </button>
            <button
              type="button"
              onClick={() => {
                setAddStaffMode("manual");
                setGeneratedLink(null);
                setPhoneInput("");
                setFoundUser(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                addStaffMode === "manual"
                  ? "bg-teal/20 text-teal border border-teal/40"
                  : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
              }`}
              data-ocid="add-staff-manual-tab"
            >
              <UserCheck className="h-4 w-4" />
              Manually
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
                    <p className="text-xs text-muted-foreground mb-1">
                      Invite link
                    </p>
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
                      className="flex-1 bg-muted/30 hover:bg-muted/50 border border-border text-foreground/80 text-sm"
                      data-ocid="share-invite-link-btn"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1.5" />
                      Share
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedLink(null)}
                    className="w-full border-border text-muted-foreground text-xs"
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
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 flex-1"
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
                    <p className="text-sm font-semibold text-foreground truncate">
                      {foundUser.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
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

          {/* Manual add flow — handled by EnhancedStaffTab modal */}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddStaff(false);
                setGeneratedLink(null);
                setPhoneInput("");
                setFoundUser(null);
                setAddStaffMode("link");
              }}
              className="border-border text-muted-foreground hover:bg-muted/50"
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
        <DialogContent className="bg-card/95 backdrop-blur-xl border-red-500/20 max-w-sm">
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
              className="border-border text-foreground hover:bg-muted/50"
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
    { id: "game", label: "This Game" },
    { id: "week", label: "Week" },
    { id: "all", label: "All Time" },
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
                : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
          <p className="text-xs text-muted-foreground mb-1 font-medium">
            Tip Pool Balance
          </p>
          <p className="text-2xl font-bold text-teal">
            {centsToUsd(totalPool)}
          </p>
          <p className="text-xs text-teal/50 mt-1">
            Click Payouts tab to distribute
          </p>
        </div>
        <div className="glassmorphism rounded-xl p-4 border border-green-500/30 bg-green-500/5">
          <p className="text-xs text-muted-foreground mb-1">Active Staff</p>
          <p className="text-2xl font-bold text-green-400">{staffCount}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">members</p>
        </div>
      </div>

      {/* Top earners */}
      {tipTotals.length > 0 && (
        <div className="glassmorphism rounded-xl p-4 border border-border">
          <p className="text-sm font-semibold text-foreground mb-3">
            Top Earners
          </p>
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
                        <p className="text-xs text-foreground/80 truncate">
                          {member?.displayName ?? `${principal.slice(0, 8)}…`}
                        </p>
                        <p className="text-xs text-teal font-semibold ml-2 shrink-0">
                          {centsToUsd(amount)}
                        </p>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
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

// ── Extended Staff Role Options ───────────────────────────────────────────────
const ROLE_OPTIONS = [
  "Suite Runner",
  "Valet",
  "Concession Staff",
  "Usher",
  "VIP Attendant",
  "Fan Experience",
] as const;

// ── Add Staff Choice Modal ───────────────────────────────────────────────────
function AddStaffChoiceModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (member: ExtendedStaffMember) => void;
}) {
  const { isDemoMode } = useDemoMode();
  const { data: liveStands = [] } = useListStands();
  const upsert = useUpsertExtendedStaff();

  const stands = isDemoMode
    ? DEMO_STANDS.map((s) => s.name)
    : liveStands.map((s: { name: string }) => s.name);

  type ChoiceTab = "manual" | "import";
  const [tab, setTab] = React.useState<ChoiceTab>("manual");

  // ── Manual form state ──────────────────────────────────────────────────────
  const [name, setName] = React.useState("");
  const [rolePreset, setRolePreset] = React.useState("");
  const [customRole, setCustomRole] = React.useState("");
  const [employmentType, setEmploymentType] =
    React.useState<Variant_partTime_fullTime_contractor>(
      Variant_partTime_fullTime_contractor.fullTime,
    );
  const [employmentStatus, setEmploymentStatus] =
    React.useState<Variant_active_inactive_suspended>(
      Variant_active_inactive_suspended.active,
    );
  const [section, setSection] = React.useState("");
  const [standName, setStandName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const finalRole =
    rolePreset === "__custom__" ? customRole.trim() : rolePreset;

  const handleManualSave = async () => {
    if (!name.trim()) return;
    const member: ExtendedStaffMember = {
      id: Date.now().toString(),
      name: name.trim(),
      customRole: finalRole || "General Staff",
      employmentType,
      employmentStatus,
      section: section.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: standName
        ? `Stand: ${standName}${notes ? ` | ${notes.trim()}` : ""}`
        : notes.trim(),
      hireDate: BigInt(Date.now()) * BigInt(1_000_000),
    };
    if (isDemoMode) {
      toast.success(`${member.name} added to roster (demo mode)`);
      onSaved(member);
      onClose();
      return;
    }
    try {
      await upsert.mutateAsync(member);
      toast.success(`${member.name} added to roster`);
      onSaved(member);
      onClose();
    } catch {
      toast.error("Failed to save staff member");
    }
  };

  // ── Import state ──────────────────────────────────────────────────────────
  const [importResult, setImportResult] = React.useState<{
    added: number;
    skipped: { row: number; reason: string }[];
  } | null>(null);

  const handleDownloadTemplate = () => {
    const content =
      "Name,Role,Section,Stand\nMarcus Davis,Suite Runner,VIP Suite,Lucas Oil Grill\nPriya Patel,Concession Staff,End Zone,End Zone Bites";
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error("File appears empty or has no data rows.");
        return;
      }
      const dataRows = lines.slice(1);
      let added = 0;
      const skipped: { row: number; reason: string }[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const cols = dataRows[i].split(",");
        const rowNum = i + 2;
        const rowName = cols[0]?.trim() ?? "";
        if (!rowName) {
          skipped.push({ row: rowNum, reason: "Name is blank" });
          continue;
        }
        const rowRole = cols[1]?.trim() || "General Staff";
        const rowSection = cols[2]?.trim() ?? "";
        const rowStand = cols[3]?.trim() ?? "";
        const standMatch = stands.find(
          (s) => s.toLowerCase() === rowStand.toLowerCase(),
        );
        if (rowStand && !standMatch) {
          skipped.push({
            row: rowNum,
            reason: `Stand "${rowStand}" not found`,
          });
          continue;
        }
        const member: ExtendedStaffMember = {
          id: `import-${Date.now()}-${i}`,
          name: rowName,
          customRole: rowRole,
          employmentType: Variant_partTime_fullTime_contractor.fullTime,
          employmentStatus: Variant_active_inactive_suspended.active,
          section: rowSection,
          phone: "",
          email: "",
          notes: standMatch ? `Stand: ${standMatch}` : "",
          hireDate: BigInt(Date.now()) * BigInt(1_000_000),
        };
        if (isDemoMode) {
          added++;
        } else {
          try {
            await upsert.mutateAsync(member);
            added++;
          } catch {
            skipped.push({ row: rowNum, reason: "Save failed" });
          }
        }
      }
      setImportResult({ added, skipped });
      if (added > 0) {
        toast.success(
          `${added} staff member${added !== 1 ? "s" : ""} imported`,
        );
      }
    };
    reader.readAsText(file);
  };

  const fieldCls =
    "bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground w-full placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal/50";
  const labelCls = "text-xs text-muted-foreground mb-1 block";
  const selectCls =
    "bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground w-full focus:outline-none focus:border-teal/50";

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
      data-ocid="add-staff-choice-modal"
    >
      <div className="bg-gray-900/95 border border-teal/20 rounded-2xl max-w-lg mx-auto p-6 mt-16 mb-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Add Staff Member</h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-colors"
            aria-label="Close"
            data-ocid="add-staff-choice-modal.close_button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-lg border border-border bg-muted/20 p-1 mb-5"
          data-ocid="add-staff-choice-modal.tab"
        >
          <button
            type="button"
            onClick={() => setTab("manual")}
            data-ocid="add-staff-choice-modal.manual-tab"
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              tab === "manual"
                ? "bg-teal/20 text-teal border border-teal/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Add Manually
          </button>
          <button
            type="button"
            onClick={() => setTab("import")}
            data-ocid="add-staff-choice-modal.import-tab"
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              tab === "import"
                ? "bg-teal/20 text-teal border border-teal/40"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Import from File
          </button>
        </div>

        {/* ── Manual Panel ───────────────────────────────────────────────────── */}
        {tab === "manual" && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="choice-staff-name" className={labelCls}>
                Name *
              </label>
              <input
                id="choice-staff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={fieldCls}
                data-ocid="add-staff-choice-modal.name-input"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="choice-staff-role" className={labelCls}>
                Role
              </label>
              <select
                id="choice-staff-role"
                value={rolePreset}
                onChange={(e) => {
                  setRolePreset(e.target.value);
                  if (e.target.value !== "__custom__") setCustomRole("");
                }}
                className={selectCls}
                data-ocid="add-staff-choice-modal.role-select"
              >
                <option value="">Select a role...</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="__custom__">Other (custom)...</option>
              </select>
            </div>
            {rolePreset === "__custom__" && (
              <div>
                <label htmlFor="choice-staff-custom-role" className={labelCls}>
                  Custom Role
                </label>
                <input
                  id="choice-staff-custom-role"
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Security Lead"
                  className={fieldCls}
                  data-ocid="add-staff-choice-modal.custom-role-input"
                />
              </div>
            )}

            {/* Employment Type */}
            <div>
              <label htmlFor="choice-staff-type" className={labelCls}>
                Employment Type
              </label>
              <select
                id="choice-staff-type"
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(
                    e.target.value as Variant_partTime_fullTime_contractor,
                  )
                }
                className={selectCls}
                data-ocid="add-staff-choice-modal.type-select"
              >
                <option value={Variant_partTime_fullTime_contractor.fullTime}>
                  Full-Time
                </option>
                <option value={Variant_partTime_fullTime_contractor.partTime}>
                  Part-Time
                </option>
                <option value={Variant_partTime_fullTime_contractor.contractor}>
                  Contractor
                </option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="choice-staff-status" className={labelCls}>
                Status
              </label>
              <select
                id="choice-staff-status"
                value={employmentStatus}
                onChange={(e) =>
                  setEmploymentStatus(
                    e.target.value as Variant_active_inactive_suspended,
                  )
                }
                className={selectCls}
                data-ocid="add-staff-choice-modal.status-select"
              >
                <option value={Variant_active_inactive_suspended.active}>
                  Active
                </option>
                <option value={Variant_active_inactive_suspended.inactive}>
                  Inactive
                </option>
                <option value={Variant_active_inactive_suspended.suspended}>
                  Suspended
                </option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label htmlFor="choice-staff-section" className={labelCls}>
                Stadium Section
              </label>
              <input
                id="choice-staff-section"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. VIP Suites, Section 103"
                className={fieldCls}
                data-ocid="add-staff-choice-modal.section-input"
              />
            </div>

            {/* Stand */}
            <div>
              <label htmlFor="choice-staff-stand" className={labelCls}>
                Concession Stand (optional)
              </label>
              <select
                id="choice-staff-stand"
                value={standName}
                onChange={(e) => setStandName(e.target.value)}
                className={selectCls}
                data-ocid="add-staff-choice-modal.stand-select"
              >
                <option value="">— No stand assigned —</option>
                {stands.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Phone */}
              <div>
                <label htmlFor="choice-staff-phone" className={labelCls}>
                  Phone
                </label>
                <input
                  id="choice-staff-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (317) 555-0000"
                  className={fieldCls}
                  data-ocid="add-staff-choice-modal.phone-input"
                />
              </div>
              {/* Email */}
              <div>
                <label htmlFor="choice-staff-email" className={labelCls}>
                  Email
                </label>
                <input
                  id="choice-staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={fieldCls}
                  data-ocid="add-staff-choice-modal.email-input"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="choice-staff-notes" className={labelCls}>
                Notes
              </label>
              <textarea
                id="choice-staff-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className={`${fieldCls} resize-none`}
                data-ocid="add-staff-choice-modal.notes-input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-muted/30 hover:bg-muted/50 border border-border text-muted-foreground font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                data-ocid="add-staff-choice-modal.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!name.trim()}
                className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                data-ocid="add-staff-choice-modal.submit_button"
              >
                Add to Roster
              </button>
            </div>
          </div>
        )}

        {/* ── Import Panel ───────────────────────────────────────────────────── */}
        {tab === "import" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/20 border border-border p-4 space-y-1">
              <p className="text-xs font-semibold text-foreground mb-0.5">
                CSV Format
              </p>
              <p className="text-xs text-muted-foreground">
                Columns in order:{" "}
                <span className="text-teal font-mono">
                  Name, Role, Section, Stand
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Stand must match an existing stand name exactly
                (case-insensitive).
              </p>
            </div>

            {/* Template download */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-teal/30 bg-teal/10 text-teal text-sm font-medium hover:bg-teal/20 transition-colors"
              data-ocid="add-staff-choice-modal.download-template-btn"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </button>

            {/* File upload */}
            <div>
              <label htmlFor="staff-import-file" className={labelCls}>
                Upload CSV or XLSX File
              </label>
              <input
                id="staff-import-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-teal/30 file:bg-teal/10 file:text-teal file:text-xs file:font-medium file:cursor-pointer hover:file:bg-teal/20 focus:outline-none"
                data-ocid="add-staff-choice-modal.file-upload"
              />
            </div>

            {/* Import result */}
            {importResult && (
              <div
                className="rounded-xl border border-border bg-muted/20 p-4 space-y-2"
                data-ocid="add-staff-choice-modal.import-result"
              >
                <p className="text-sm font-semibold text-foreground">
                  {importResult.added} staff added.
                  {importResult.skipped.length > 0 && (
                    <span className="text-yellow-400 ml-2">
                      {importResult.skipped.length} row
                      {importResult.skipped.length !== 1 ? "s" : ""} skipped.
                    </span>
                  )}
                </p>
                {importResult.skipped.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {importResult.skipped.map((s) => (
                      <li key={s.row} className="text-xs text-muted-foreground">
                        <span className="text-yellow-400/80 font-mono">
                          Row {s.row}:
                        </span>{" "}
                        {s.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-muted/30 hover:bg-muted/50 border border-border text-muted-foreground font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                data-ocid="add-staff-choice-modal.import-close-btn"
              >
                {importResult ? "Done" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Extended Staff Form Modal ─────────────────────────────────────────────────
function ExtendedStaffFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: ExtendedStaffMember | null;
  onSave: (member: ExtendedStaffMember) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [rolePreset, setRolePreset] = React.useState(() => {
    if (!initial?.customRole) return "";
    if ((ROLE_OPTIONS as readonly string[]).includes(initial.customRole))
      return initial.customRole;
    return "__custom__";
  });
  const [customRole, setCustomRole] = React.useState(() => {
    if (!initial?.customRole) return "";
    if ((ROLE_OPTIONS as readonly string[]).includes(initial.customRole))
      return "";
    return initial.customRole;
  });
  const [employmentType, setEmploymentType] =
    React.useState<Variant_partTime_fullTime_contractor>(
      initial?.employmentType ?? Variant_partTime_fullTime_contractor.fullTime,
    );
  const [employmentStatus, setEmploymentStatus] =
    React.useState<Variant_active_inactive_suspended>(
      initial?.employmentStatus ?? Variant_active_inactive_suspended.active,
    );
  const [section, setSection] = React.useState(initial?.section ?? "");
  const [phone, setPhone] = React.useState(initial?.phone ?? "");
  const [email, setEmail] = React.useState(initial?.email ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [tipsCertified, setTipsCertified] = React.useState(
    (initial as ExtendedStaffMember & { tipsCertified?: boolean })
      ?.tipsCertified ?? false,
  );

  const finalRole =
    rolePreset === "__custom__" ? customRole.trim() : rolePreset;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? Date.now().toString(),
      name: name.trim(),
      customRole: finalRole,
      employmentType,
      employmentStatus,
      section: section.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
      hireDate: initial?.hireDate ?? BigInt(Date.now()) * BigInt(1_000_000),
      ...(tipsCertified ? { tipsCertified: true } : {}),
    } as ExtendedStaffMember & { tipsCertified?: boolean });
  };

  const fieldCls =
    "bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground w-full placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal/50";
  const labelCls = "text-xs text-muted-foreground mb-1 block";
  const selectCls =
    "bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground w-full focus:outline-none focus:border-teal/50";

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto"
      data-ocid="extended-staff-modal"
    >
      <div className="bg-gray-900/90 border border-border rounded-2xl max-w-lg mx-auto p-6 mt-20 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">
            {initial ? "Edit Staff Member" : "Add Staff Member"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-colors"
            aria-label="Close"
            data-ocid="extended-staff-modal-close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="ext-staff-name" className={labelCls}>
              Name *
            </label>
            <input
              id="ext-staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={fieldCls}
              data-ocid="ext-staff-name-input"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="ext-staff-role" className={labelCls}>
              Role
            </label>
            <select
              id="ext-staff-role"
              value={rolePreset}
              onChange={(e) => {
                setRolePreset(e.target.value);
                if (e.target.value !== "__custom__") setCustomRole("");
              }}
              className={selectCls}
              data-ocid="ext-staff-role-select"
            >
              <option value="">Select a role...</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__custom__">Other (custom)...</option>
            </select>
          </div>
          {rolePreset === "__custom__" && (
            <div>
              <label htmlFor="ext-staff-custom-role" className={labelCls}>
                Custom Role
              </label>
              <input
                id="ext-staff-custom-role"
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Security Lead"
                className={fieldCls}
                data-ocid="ext-staff-custom-role-input"
              />
            </div>
          )}

          {/* Employment Type */}
          <div>
            <label htmlFor="ext-staff-type" className={labelCls}>
              Employment Type
            </label>
            <select
              id="ext-staff-type"
              value={employmentType}
              onChange={(e) =>
                setEmploymentType(
                  e.target.value as Variant_partTime_fullTime_contractor,
                )
              }
              className={selectCls}
              data-ocid="ext-staff-type-select"
            >
              <option value={Variant_partTime_fullTime_contractor.fullTime}>
                Full-Time
              </option>
              <option value={Variant_partTime_fullTime_contractor.partTime}>
                Part-Time
              </option>
              <option value={Variant_partTime_fullTime_contractor.contractor}>
                Contractor
              </option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="ext-staff-status" className={labelCls}>
              Status
            </label>
            <select
              id="ext-staff-status"
              value={employmentStatus}
              onChange={(e) =>
                setEmploymentStatus(
                  e.target.value as Variant_active_inactive_suspended,
                )
              }
              className={selectCls}
              data-ocid="ext-staff-status-select"
            >
              <option value={Variant_active_inactive_suspended.active}>
                Active
              </option>
              <option value={Variant_active_inactive_suspended.inactive}>
                Inactive
              </option>
              <option value={Variant_active_inactive_suspended.suspended}>
                Suspended
              </option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label htmlFor="ext-staff-section" className={labelCls}>
              Stadium Section
            </label>
            <input
              id="ext-staff-section"
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. VIP Suites, Section 103"
              className={fieldCls}
              data-ocid="ext-staff-section-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Phone */}
            <div>
              <label htmlFor="ext-staff-phone" className={labelCls}>
                Phone
              </label>
              <input
                id="ext-staff-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (317) 555-0000"
                className={fieldCls}
                data-ocid="ext-staff-phone-input"
              />
            </div>
            {/* Email */}
            <div>
              <label htmlFor="ext-staff-email" className={labelCls}>
                Email
              </label>
              <input
                id="ext-staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={fieldCls}
                data-ocid="ext-staff-email-input"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="ext-staff-notes" className={labelCls}>
              Notes
            </label>
            <textarea
              id="ext-staff-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className={`${fieldCls} resize-none`}
              data-ocid="ext-staff-notes-input"
            />
          </div>

          {/* TIPS Certified */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
            <div className="mt-0.5 shrink-0">
              <input
                id="ext-staff-tips-certified"
                type="checkbox"
                checked={tipsCertified}
                onChange={(e) => setTipsCertified(e.target.checked)}
                className="h-4 w-4 rounded accent-teal-500 cursor-pointer"
                data-ocid="ext-staff-tips-certified-checkbox"
              />
            </div>
            <div>
              <label
                htmlFor="ext-staff-tips-certified"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                TIPS Certified
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Staff is certified to handle alcohol sales (e.g. TIPS trained)
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted/30 hover:bg-muted/50 border border-border text-muted-foreground font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              data-ocid="ext-staff-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              data-ocid="ext-staff-modal-save"
            >
              {initial ? "Save Changes" : "Add to Roster"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Staff Tab ─────────────────────────────────────────────────────────────────
// ── Enhanced Staff Tab ────────────────────────────────────────────────────────
function EnhancedStaffTab() {
  const { isDemoMode } = useDemoMode();
  const { data: backendStaff = [], isLoading } = useListExtendedStaff();
  const upsert = useUpsertExtendedStaff();
  const removeExt = useRemoveExtendedStaff();

  const staff: ExtendedStaffMember[] = isDemoMode
    ? DEMO_EXTENDED_STAFF
    : backendStaff;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = React.useState<"game" | "week" | "all">(
    "week",
  );
  const [showChoiceModal, setShowChoiceModal] = React.useState(false);
  const [editingMember, setEditingMember] =
    React.useState<ExtendedStaffMember | null>(null);
  const [_localAdded, _setLocalAdded] = React.useState<ExtendedStaffMember[]>(
    [],
  );
  const [bulkSection, setBulkSection] = React.useState("");
  const [showBulkInput, setShowBulkInput] = React.useState(false);

  // Demo tip data keyed by id
  const tipIndex = dateFilter === "game" ? 0 : dateFilter === "week" ? 1 : 2;
  const getTipTotal = (id: string): number => {
    const tipData = DEMO_STAFF_TIPS[id];
    return tipData ? tipData[tipIndex] / 100 : 0;
  };

  const filtered = staff.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.customRole.toLowerCase().includes(q) ||
      m.section.toLowerCase().includes(q) ||
      m.employmentStatus.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (member: ExtendedStaffMember) => {
    if (isDemoMode) {
      toast.success(`${member.name} saved (demo mode)`);
      setShowChoiceModal(false);
      setEditingMember(null);
      return;
    }
    try {
      await upsert.mutateAsync(member);
      toast.success(`${member.name} saved`);
      setShowChoiceModal(false);
      setEditingMember(null);
    } catch {
      toast.error("Failed to save staff member");
    }
  };

  const handleRemove = async (member: ExtendedStaffMember) => {
    if (isDemoMode) {
      toast.success(`${member.name} removed (demo mode)`);
      return;
    }
    try {
      await removeExt.mutateAsync(member.id);
      toast.success(`${member.name} removed`);
    } catch {
      toast.error("Failed to remove staff member");
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkSection.trim() || selectedIds.size === 0) return;
    const toUpdate = staff.filter((m) => selectedIds.has(m.id));
    if (!isDemoMode) {
      for (const m of toUpdate) {
        await upsert.mutateAsync({ ...m, section: bulkSection.trim() });
      }
    }
    toast.success(`Assigned ${toUpdate.length} staff to ${bulkSection.trim()}`);
    setSelectedIds(new Set());
    setBulkSection("");
    setShowBulkInput(false);
  };

  const handleExportCsv = () => {
    const headers = [
      "Name",
      "Role",
      "Type",
      "Status",
      "Section",
      "Phone",
      "Email",
      "HireDate",
      "Tips",
    ];
    const rows = filtered.map((m) => [
      m.name,
      m.customRole,
      m.employmentType,
      m.employmentStatus,
      m.section,
      m.phone,
      m.email,
      new Date(Number(m.hireDate) / 1_000_000).toLocaleDateString(),
      `$${getTipTotal(m.id).toFixed(2)}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staff-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !isDemoMode) {
    return (
      <div className="space-y-3" data-ocid="manager-staff-tab">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glassmorphism rounded-xl p-4 border border-border animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/50 rounded w-1/3" />
                <div className="h-3 bg-muted/50 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filterButtons: { label: string; value: "game" | "week" | "all" }[] = [
    { label: "This Game", value: "game" },
    { label: "This Week", value: "week" },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="space-y-4" data-ocid="manager-staff-tab">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {filtered.length} staff member{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border text-muted-foreground text-xs transition-colors"
            data-ocid="staff.export-csv-btn"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <Button
            onClick={() => setShowChoiceModal(true)}
            size="sm"
            className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold"
            data-ocid="add-staff-btn"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by name, role, section, status..."
        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal/50"
        data-ocid="staff.search-input"
      />

      {/* Date filter + bulk actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2" data-ocid="staff.tip-filter">
          {filterButtons.map((fb) => (
            <button
              key={fb.value}
              type="button"
              onClick={() => setDateFilter(fb.value)}
              data-ocid={`staff.filter.${fb.value}`}
              className={`px-3 py-1 rounded text-xs border transition-colors ${
                dateFilter === fb.value
                  ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                  : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">
              {selectedIds.size} selected
            </span>
            {showBulkInput ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={bulkSection}
                  onChange={(e) => setBulkSection(e.target.value)}
                  placeholder="Section name"
                  className="bg-muted/50 border border-border rounded px-2 py-1 text-xs text-foreground w-32 focus:outline-none focus:border-teal/50"
                  data-ocid="staff.bulk-section-input"
                />
                <button
                  type="button"
                  onClick={handleBulkAssign}
                  className="px-2 py-1 rounded bg-teal/20 border border-teal/30 text-teal text-xs"
                  data-ocid="staff.bulk-assign-btn"
                >
                  Assign
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBulkInput(true)}
                className="px-2 py-1 rounded bg-muted/30 border border-border text-muted-foreground text-xs hover:bg-muted/50"
                data-ocid="staff.bulk-section-toggle"
              >
                Assign Section
              </button>
            )}
          </div>
        )}
      </div>

      {/* Staff cards */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((member, idx) => (
            <ExtendedStaffCard
              key={member.id}
              member={member}
              tipTotal={getTipTotal(member.id)}
              isSelected={selectedIds.has(member.id)}
              onSelect={() => toggleSelect(member.id)}
              onEdit={() => setEditingMember(member)}
              onRemove={() => handleRemove(member)}
              data-ocid={`staff.item.${idx + 1}`}
            />
          ))}
        </div>
      ) : (
        <div
          className="glassmorphism rounded-xl p-8 border border-border text-center"
          data-ocid="staff.empty_state"
        >
          <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">
            No staff found
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1 mb-4">
            {searchQuery
              ? "Try a different search"
              : "Add staff members to start tracking tips"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowChoiceModal(true)}
              size="sm"
              className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal"
              data-ocid="staff.empty-add-btn"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Staff Member
            </Button>
          )}
        </div>
      )}

      {/* Add Staff choice modal (new staff only) */}
      {showChoiceModal && (
        <AddStaffChoiceModal
          onClose={() => setShowChoiceModal(false)}
          onSaved={(member) => {
            if (isDemoMode) {
              _setLocalAdded((prev) => [...prev, member]);
            }
            setShowChoiceModal(false);
          }}
        />
      )}

      {/* Edit modal (existing staff only) */}
      {editingMember && (
        <ExtendedStaffFormModal
          initial={editingMember}
          onSave={handleSave}
          onClose={() => {
            setShowChoiceModal(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
}

// ── Extended Staff Card ───────────────────────────────────────────────────────
function ExtendedStaffCard({
  member,
  tipTotal,
  isSelected,
  onSelect,
  onEdit,
  onRemove,
  "data-ocid": dataOcid,
}: {
  member: ExtendedStaffMember;
  tipTotal: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
  "data-ocid"?: string;
}) {
  const hireDateMs = Number(member.hireDate) / 1_000_000;
  const hireFormatted = new Date(hireDateMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const typeBadge = {
    [Variant_partTime_fullTime_contractor.fullTime]: {
      label: "Full-Time",
      cls: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    [Variant_partTime_fullTime_contractor.partTime]: {
      label: "Part-Time",
      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    },
    [Variant_partTime_fullTime_contractor.contractor]: {
      label: "Contractor",
      cls: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    },
  }[member.employmentType];

  const statusBadge = {
    [Variant_active_inactive_suspended.active]: {
      label: "Active",
      cls: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    [Variant_active_inactive_suspended.inactive]: {
      label: "Inactive",
      cls: "bg-muted/50 text-muted-foreground border-border",
    },
    [Variant_active_inactive_suspended.suspended]: {
      label: "Suspended",
      cls: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  }[member.employmentStatus];

  return (
    <div
      className={`bg-muted/30 border rounded-xl p-4 relative transition-colors ${
        isSelected ? "border-teal/40 bg-teal/5" : "border-border"
      }`}
      data-ocid={dataOcid}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={onSelect}
          className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
            isSelected
              ? "bg-teal-500 border-teal-500"
              : "bg-muted/30 border-border hover:border-teal/40"
          }`}
          aria-label={isSelected ? "Deselect" : "Select"}
        >
          {isSelected && <Check className="h-3 w-3 text-black" />}
        </button>

        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
          <span className="text-teal font-bold text-sm">
            {member.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-foreground">{member.name}</p>
            {member.customRole && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                {member.customRole}
              </span>
            )}
            {typeBadge && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${typeBadge.cls}`}
              >
                {typeBadge.label}
              </span>
            )}
            {statusBadge && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.cls}`}
              >
                {statusBadge.label}
              </span>
            )}
            {(member as ExtendedStaffMember & { tipsCertified?: boolean })
              .tipsCertified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/20 text-teal-300 border border-teal-500/30 shrink-0">
                <CheckCircle className="w-3 h-3" /> TIPS Certified
              </span>
            )}
          </div>
          {member.section && (
            <p className="text-xs text-muted-foreground mt-0.5">
              📍 {member.section}
            </p>
          )}
          {member.phone && (
            <p className="text-xs text-muted-foreground/50 truncate">
              {member.phone}
            </p>
          )}
          {member.email && (
            <p className="text-xs text-muted-foreground/50 truncate">
              {member.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            Hired: {hireFormatted}
          </p>
          <p className="text-xs text-teal-400 font-medium mt-0.5">
            ${tipTotal.toFixed(2)} earned
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="h-7 w-7 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-colors"
            aria-label={`Edit ${member.name}`}
            data-ocid={`staff.edit-btn.${member.id}`}
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="h-7 w-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-colors"
            aria-label={`Remove ${member.name}`}
            data-ocid={`staff.delete-btn.${member.id}`}
          >
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>
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
      <TipSplitSection />
      {/* Fair split summary */}
      <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">
            Fair Split Per Staff Member
          </p>
          <span className="text-xs text-teal/70 bg-teal/10 px-2 py-0.5 rounded-full">
            Equal Distribution
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Current Pool Balance</span>
          <span className="text-2xl font-bold text-teal">
            {centsToUsd(totalPool)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-teal/10">
          <span>Per person ({activeStaff.length} staff)</span>
          <span className="text-teal font-bold text-lg">
            {centsToUsd(fairShare)}
          </span>
        </div>
      </div>

      {/* Custom distribution */}
      {activeStaff.length > 0 && (
        <div className="glassmorphism rounded-xl p-4 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Custom Distribution
          </p>
          <p className="text-xs text-muted-foreground/50">
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
              <p className="text-sm text-foreground flex-1 truncate min-w-0">
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
                  className="w-24 bg-muted/30 border-border text-foreground text-sm h-8 text-right"
                  data-ocid={`payout-amount-${member.principal.toString().slice(0, 8)}`}
                />
              </div>
            </div>
          ))}
          <Button
            onClick={onDistribute}
            disabled={isDistributing || activeStaff.length === 0}
            className="w-full bg-gradient-to-r from-teal to-teal/80 hover:from-teal/90 hover:to-teal/70 text-background font-bold shadow-lg shadow-teal/30 h-11 text-base"
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
        <p className="text-sm font-semibold text-foreground">Payout History</p>
        {isLoading ? (
          <div className="glassmorphism rounded-xl p-4 border border-border animate-pulse">
            <div className="h-4 bg-muted/50 rounded w-1/2" />
          </div>
        ) : payoutHistory.length === 0 ? (
          <div className="glassmorphism rounded-xl p-6 border border-border text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground/50">
              No payouts recorded yet
            </p>
          </div>
        ) : (
          payoutHistory.map((record) => (
            <div
              key={`${record.timestamp}-${record.notes}`}
              className="glassmorphism rounded-xl p-4 border border-border"
              data-ocid={`payout-record-${record.timestamp}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {centsToUsd(record.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {record.notes}
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
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
            <p className="text-sm font-semibold text-foreground">Tip Pooling</p>
            <p className="text-xs text-muted-foreground mt-0.5">
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
                : "bg-muted/50 border-border"
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
        <p className="text-xs text-muted-foreground/60 mt-3 leading-relaxed">
          <span className="font-medium text-muted-foreground">
            Tip Pooling:
          </span>{" "}
          Enable to combine all staff tips into a shared pool. Ideal for
          concession stands where the whole crew shares tips equally.
        </p>
      </div>

      {/* Mode selector (only if enabled) */}
      {enabled && (
        <div className="glassmorphism rounded-xl p-5 border border-border space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Distribution Mode
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetPoolMode(true, "equal")}
              disabled={isUpdating}
              className={`p-3 rounded-lg border text-left transition-all duration-200 ${
                mode === "equal"
                  ? "border-teal/40 bg-teal/10"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              }`}
              data-ocid="pool-mode-equal"
            >
              <p className="text-sm font-semibold text-foreground">
                Equal Split
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
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
                  : "border-border bg-muted/30 hover:bg-muted/50"
              }`}
              data-ocid="pool-mode-custom"
            >
              <p className="text-sm font-semibold text-foreground">Custom</p>
              <p className="text-xs text-muted-foreground mt-0.5">
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
      <TipSplitRulesSection />
    </div>
  );
}

// ── Stand Configuration Section ───────────────────────────────────────────────
type StandConfig = {
  volunteerOrg: boolean;
  orgName: string;
  payoutDest: string;
  salesPct: number;
};

type StandConfigs = Record<string, StandConfig>;

const STAND_NAMES = [
  "Lucas Oil Grill",
  "End Zone Bites",
  "Colts Fan Eats",
] as const;

const DEFAULT_STAND_CONFIGS: StandConfigs = {
  "End Zone Bites": {
    volunteerOrg: true,
    orgName: "Colts Charities / United Way",
    payoutDest: "United Way Indianapolis #4821",
    salesPct: 100,
  },
};

function getInitialStandConfigs(): StandConfigs {
  try {
    const stored = localStorage.getItem("standConfig");
    if (stored) return JSON.parse(stored) as StandConfigs;
  } catch (_) {
    /* ignore */
  }
  localStorage.setItem("standConfig", JSON.stringify(DEFAULT_STAND_CONFIGS));
  return DEFAULT_STAND_CONFIGS;
}

function StandConfigSection() {
  const [standConfigs, setStandConfigs] = React.useState<StandConfigs>(
    getInitialStandConfigs,
  );

  React.useEffect(() => {
    // Ensure localStorage is seeded on mount if not already present
    if (!localStorage.getItem("standConfig")) {
      localStorage.setItem(
        "standConfig",
        JSON.stringify(DEFAULT_STAND_CONFIGS),
      );
    }
  }, []);

  const updateConfig = (stand: string, patch: Partial<StandConfig>) => {
    setStandConfigs((prev) => {
      const next = {
        ...prev,
        [stand]: { ...getDefaultForStand(stand), ...prev[stand], ...patch },
      };
      localStorage.setItem("standConfig", JSON.stringify(next));
      return next;
    });
  };

  const getDefaultForStand = (stand: string): StandConfig =>
    DEFAULT_STAND_CONFIGS[stand] ?? {
      volunteerOrg: false,
      orgName: "",
      payoutDest: "",
      salesPct: 100,
    };

  const fieldCls =
    "bg-muted/50 border border-border rounded px-3 py-2 text-sm text-foreground w-full placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal/50";
  const labelCls = "text-xs text-muted-foreground mb-1 block";

  return (
    <div className="glassmorphism rounded-xl p-5 border border-teal/20 space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Stand Configuration
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure tip routing for stands operated by volunteer organizations
          or charities.
        </p>
      </div>

      <div className="space-y-4">
        {STAND_NAMES.map((stand) => {
          const cfg: StandConfig =
            standConfigs[stand] ?? getDefaultForStand(stand);
          return (
            <div
              key={stand}
              className={`rounded-lg border p-4 space-y-3 transition-all ${
                cfg.volunteerOrg
                  ? "border-teal/40 bg-teal/5"
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{stand}</p>
                  {cfg.volunteerOrg && (
                    <p className="text-xs text-teal-400 mt-0.5">
                      Volunteer Organization
                    </p>
                  )}
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    updateConfig(stand, { volunteerOrg: !cfg.volunteerOrg })
                  }
                  className={`relative h-6 w-11 rounded-full transition-all duration-300 ${
                    cfg.volunteerOrg
                      ? "bg-teal/60 border-teal/40"
                      : "bg-muted/50 border-border"
                  } border shrink-0`}
                  aria-label={`Toggle volunteer organization for ${stand}`}
                  data-ocid={`stand-config-${stand.toLowerCase().replace(/\s+/g, "-")}-toggle`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                      cfg.volunteerOrg ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {cfg.volunteerOrg && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label
                      htmlFor={`stand-org-name-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                      className={labelCls}
                    >
                      Organization Name
                    </label>
                    <input
                      id={`stand-org-name-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                      type="text"
                      value={cfg.orgName}
                      onChange={(e) =>
                        updateConfig(stand, { orgName: e.target.value })
                      }
                      placeholder="e.g. Colts Charities / United Way"
                      className={fieldCls}
                      data-ocid={`stand-config-${stand.toLowerCase().replace(/\s+/g, "-")}-org-name`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`stand-payout-dest-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                      className={labelCls}
                    >
                      Payout Destination
                    </label>
                    <input
                      id={`stand-payout-dest-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                      type="text"
                      value={cfg.payoutDest}
                      onChange={(e) =>
                        updateConfig(stand, { payoutDest: e.target.value })
                      }
                      placeholder="e.g. United Way Indianapolis #4821"
                      className={fieldCls}
                      data-ocid={`stand-config-${stand.toLowerCase().replace(/\s+/g, "-")}-payout-dest`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`stand-sales-pct-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                      className={labelCls}
                    >
                      Sales % to Organization
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`stand-sales-pct-${stand.toLowerCase().replace(/\s+/g, "-")}`}
                        type="number"
                        min={0}
                        max={100}
                        value={cfg.salesPct}
                        onChange={(e) =>
                          updateConfig(stand, {
                            salesPct: Math.min(
                              100,
                              Math.max(0, Number(e.target.value)),
                            ),
                          })
                        }
                        className={`${fieldCls} w-24`}
                        data-ocid={`stand-config-${stand.toLowerCase().replace(/\s+/g, "-")}-sales-pct`}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                      {cfg.salesPct === 100 && (
                        <span className="text-xs text-teal-400">
                          100% routed to org
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
          <p className="text-sm font-semibold text-foreground">
            Staff Roster Invite
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
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
          className="flex-1 border-border text-muted-foreground hover:bg-muted/50 text-xs h-8"
          data-ocid="decline-staff-invite-btn"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}

function SectionsTab({ managerId }: { managerId: string }) {
  const { data: roster = [] } = useGetManagerRoster();
  const { data: assignments = [] } = useGetSectionAssignments(managerId);
  const assignSection = useAssignStaffSection();
  const [saving, setSaving] = React.useState<string | null>(null);
  const [sectionMap, setSectionMap] = React.useState<Record<string, string>>(
    {},
  );

  const sectionOptions = [
    "Section 101",
    "Section 102",
    "Section 103",
    "VIP Lounge",
    "Concessions - Level 1",
    "Concessions - Level 2",
    "Valet",
    "Gate A",
    "Gate B",
    "Suites",
    "Press Box",
  ];

  React.useEffect(() => {
    const map: Record<string, string> = {};
    for (const a of assignments as Array<{
      staffId: { toString(): string };
      sectionLabel: string;
    }>) {
      map[a.staffId?.toString()] = a.sectionLabel;
    }
    setSectionMap(map);
  }, [assignments]);

  const handleAssign = async (staffId: string, sectionLabel: string) => {
    setSaving(staffId);
    try {
      await assignSection.mutateAsync({
        staffId,
        sectionName: sectionLabel.toLowerCase().replace(/\s+/g, "-"),
        sectionLabel,
      });
      setSectionMap((prev) => ({ ...prev, [staffId]: sectionLabel }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4" data-ocid="manager.sections.panel">
      <h3 className="text-white font-bold text-lg">Assign Staff to Sections</h3>
      {roster.length === 0 ? (
        <p
          className="text-white/40 text-sm"
          data-ocid="manager.sections.empty_state"
        >
          No staff members yet. Add staff from the Staff tab.
        </p>
      ) : (
        (roster as StaffMember[]).map((member, idx) => {
          const id = member.principal?.toString() ?? "";
          const current = sectionMap[id] ?? "";
          return (
            <div
              key={id}
              className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-4"
              data-ocid={`manager.sections.item.${idx + 1}`}
            >
              <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center text-teal font-bold">
                {(member.displayName ?? "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">
                  {member.displayName ?? id.slice(0, 8)}
                </p>
                {current && (
                  <span className="text-xs bg-[#00e5cc]/10 text-[#00e5cc] px-2 py-0.5 rounded-full">
                    {current}
                  </span>
                )}
              </div>
              <select
                value={current}
                onChange={(e) => handleAssign(id, e.target.value)}
                disabled={saving === id}
                data-ocid={`manager.sections.select.${idx + 1}`}
                className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:border-[#00e5cc] focus:outline-none"
              >
                <option value="">Select section...</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {saving === id && (
                <span className="text-[#00e5cc] text-xs">Saving...</span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function AnalyticsTab({ managerId }: { managerId: string }) {
  const [period, setPeriod] = React.useState<
    "today" | "week" | "month" | "all"
  >("week");
  const since =
    period === "today"
      ? Date.now() - 86400000
      : period === "week"
        ? Date.now() - 604800000
        : period === "month"
          ? Date.now() - 2592000000
          : undefined;
  const { data: sectionData = [] } = useGetSectionAnalytics(managerId, since);
  const { data: topPerformers = [] } = useGetTopStaffPerformers(
    managerId,
    5,
    since,
  );
  const { data: staffData = [] } = useGetStaffAnalytics(managerId, since);

  const rankBadge = (rank: number) => {
    if (rank === 1)
      return <span className="text-[#f59e0b] font-bold">&#129351;</span>;
    if (rank === 2)
      return <span className="text-gray-300 font-bold">&#129352;</span>;
    if (rank === 3)
      return <span className="text-orange-400 font-bold">&#129353;</span>;
    return <span className="text-white/40 text-sm">#{rank}</span>;
  };

  const sampleSections =
    (
      sectionData as unknown as Array<{
        sectionName: string;
        sectionLabel: string;
        totalTips: number;
        totalAmount: number;
        staffCount: number;
      }>
    ).length > 0
      ? (
          sectionData as unknown as Array<{
            sectionName: string;
            sectionLabel: string;
            totalTips: bigint;
            totalAmount: bigint;
            staffCount: bigint;
          }>
        ).map((s) => ({
          ...s,
          totalTips: Number(s.totalTips),
          totalAmount: Number(s.totalAmount),
          staffCount: Number(s.staffCount),
        }))
      : [
          {
            sectionName: "vip-lounge",
            sectionLabel: "VIP Lounge",
            totalTips: 42,
            totalAmount: 38000,
            staffCount: 5,
          },
          {
            sectionName: "section-103",
            sectionLabel: "Section 103",
            totalTips: 31,
            totalAmount: 24500,
            staffCount: 4,
          },
          {
            sectionName: "concessions-l1",
            sectionLabel: "Concessions - Level 1",
            totalTips: 28,
            totalAmount: 19200,
            staffCount: 6,
          },
        ];

  return (
    <div className="space-y-6" data-ocid="manager.analytics.panel">
      <div className="flex gap-2">
        {(["today", "week", "month", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            data-ocid={`manager.analytics.period-${p}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              period === p
                ? "bg-[#00e5cc] text-[#0a0e1a]"
                : "bg-muted/50 text-foreground hover:bg-muted/60"
            }`}
          >
            {p === "all"
              ? "All Time"
              : p === "today"
                ? "Today"
                : p === "week"
                  ? "This Week"
                  : "This Month"}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">Section Performance</h3>
        <div className="space-y-2">
          {[...sampleSections]
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .map((s, i) => (
              <div
                key={s.sectionName}
                className={`bg-muted/30 border rounded-xl p-4 ${i === 0 ? "border-[#f59e0b]/40" : "border-border"}`}
                data-ocid={`manager.analytics.section.${i + 1}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{s.sectionLabel}</p>
                    <p className="text-white/40 text-xs">
                      {s.staffCount} staff &middot; {s.totalTips} tips
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00e5cc] font-bold">
                      ${(s.totalAmount / 100).toFixed(2)}
                    </p>
                    {i === 0 && (
                      <span className="text-[#f59e0b] text-xs">
                        Top Section
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">Top Performers</h3>
        <div className="space-y-2">
          {((
            topPerformers as Array<{
              staffId: { toString(): string };
              totalAmount: bigint | number;
            }>
          ).length > 0
            ? (
                topPerformers as Array<{
                  staffId: { toString(): string };
                  totalAmount: bigint | number;
                }>
              ).map((p) => ({ ...p, totalAmount: Number(p.totalAmount) }))
            : [
                { staffId: { toString: () => "demo1" }, totalAmount: 18500 },
                { staffId: { toString: () => "demo2" }, totalAmount: 14200 },
                { staffId: { toString: () => "demo3" }, totalAmount: 11800 },
              ]
          ).map((p, idx) => (
            <div
              key={p.staffId?.toString()}
              className="bg-muted/30 border border-border rounded-xl p-3 flex items-center gap-3"
              data-ocid={`manager.analytics.performer.${idx + 1}`}
            >
              {rankBadge(idx + 1)}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  {p.staffId?.toString()?.slice(0, 8) ?? "Staff"}
                </p>
              </div>
              <p className="text-[#00e5cc] font-bold text-sm">
                ${(p.totalAmount / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-bold mb-3">Staff Analytics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-left">
                <th className="pb-2 pr-3">Staff</th>
                <th className="pb-2 pr-3">Section</th>
                <th className="pb-2 pr-3">Tips</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {((
                staffData as Array<{
                  staffId: { toString(): string };
                  sectionName: string;
                  totalTips: bigint | number;
                  totalAmount: bigint | number;
                }>
              ).length > 0
                ? (
                    staffData as Array<{
                      staffId: { toString(): string };
                      sectionName: string;
                      totalTips: bigint | number;
                      totalAmount: bigint | number;
                    }>
                  ).map((s) => ({
                    ...s,
                    totalTips: Number(s.totalTips),
                    totalAmount: Number(s.totalAmount),
                  }))
                : [
                    {
                      staffId: { toString: () => "demo1" },
                      sectionName: "VIP Lounge",
                      totalTips: 18,
                      totalAmount: 18500,
                    },
                    {
                      staffId: { toString: () => "demo2" },
                      sectionName: "Section 103",
                      totalTips: 14,
                      totalAmount: 14200,
                    },
                  ]
              ).map((s, idx) => (
                <tr
                  key={s.staffId?.toString()}
                  className="border-t border-white/5"
                  data-ocid={`manager.analytics.staff-row.${idx + 1}`}
                >
                  <td className="py-2 pr-3">
                    {s.staffId?.toString()?.slice(0, 8) ?? "Staff"}
                  </td>
                  <td className="py-2 pr-3 text-[#00e5cc]/80 text-xs">
                    {s.sectionName ?? "-"}
                  </td>
                  <td className="py-2 pr-3">{s.totalTips}</td>
                  <td className="py-2 font-medium text-[#00e5cc]">
                    ${(s.totalAmount / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export type TipPoolConfig = {
  enabled: boolean;
  mode: "equal" | "custom";
};

function OrdersTabContent() {
  const { isDemoMode } = useDemoMode();
  const { data: liveOrders = [], isLoading } = useGetActiveOrdersForManager();
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  const orders = isDemoMode ? [DEMO_ACTIVE_ORDER as any] : liveOrders;

  // KDS banner — shown at top of orders section
  const KdsBanner = (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-teal/10 border border-teal/20 px-4 py-3">
      <div className="min-w-0">
        <p className="text-teal font-semibold text-sm">
          Kitchen Display Screen
        </p>
        <p className="text-white/55 text-xs mt-0.5">
          Share this link with your concession staff
        </p>
      </div>
      <a
        href="/kitchen"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 bg-teal/20 hover:bg-teal/30 border border-teal/30 text-teal text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        data-ocid="manager.orders.open_kds_link"
      >
        Open KDS ↗
      </a>
    </div>
  );

  const statusLabel: Record<string, string> = {
    placed: "Placed",
    preparing: "Preparing",
    readyForPickup: "Ready for Pickup",
    onTheWay: "On the Way",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const nextStatus: Record<string, string> = {
    placed: "preparing",
    preparing: "readyForPickup",
    readyForPickup: "onTheWay",
    onTheWay: "completed",
  };

  const statusColor: Record<string, string> = {
    placed: "bg-yellow-500/20 text-yellow-300",
    preparing: "bg-blue-500/20 text-blue-300",
    readyForPickup: "bg-purple-500/20 text-purple-300",
    onTheWay: "bg-orange-500/20 text-orange-300",
    completed: "bg-green-500/20 text-green-300",
    cancelled: "bg-red-500/20 text-red-300",
  };

  const handleAdvance = async (orderId: string, currentStatus: string) => {
    const next = nextStatus[currentStatus];
    if (!next) return;
    try {
      await updateStatus.mutateAsync({ orderId, status: next as any });
      toast.success(`Order status updated to ${statusLabel[next]}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success("Order cancelled");
    } catch {
      toast.error("Failed to cancel order");
    }
  };

  if (isLoading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#00E5CC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground/50"
        data-ocid="manager.orders.empty_state"
      >
        <p className="text-lg">No active orders</p>
        <p className="text-sm mt-1">
          Orders will appear here as fans place them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {KdsBanner}
      {orders.map((order: any, index: number) => {
        const statusKey =
          typeof order.status === "object"
            ? Object.keys(order.status)[0]
            : String(order.status);
        const deliveryKey =
          typeof order.deliveryMethod === "object"
            ? Object.keys(order.deliveryMethod)[0]
            : String(order.deliveryMethod);
        const canAdvance = statusKey in nextStatus;
        const canCancel = statusKey === "placed" || statusKey === "preparing";
        const total = (order.items ?? []).reduce(
          (
            s: number,
            i: {
              priceCents?: bigint | number;
              priceInCents?: number;
              quantity?: number;
            },
          ) =>
            s +
            Number(i.priceCents ?? i.priceInCents ?? 0) *
              Number(i.quantity ?? 1),
          0,
        );

        return (
          <div
            key={order.id}
            className="bg-muted/30 backdrop-blur-xl border border-border rounded-xl p-4 space-y-3"
            data-ocid={`manager.order.${index + 1}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">
                  Order #{order.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-white/60 text-xs mt-0.5">
                  📍 {order.seatNumber} ·{" "}
                  {deliveryKey === "delivery" ? "Seat Delivery" : "Pickup"}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[statusKey] ?? "bg-muted/50 text-muted-foreground"}`}
              >
                {statusLabel[statusKey] ?? statusKey}
              </span>
            </div>

            <div className="space-y-1">
              {(order.items ?? []).map(
                (item: Record<string, unknown>, i: number) => (
                  <div
                    key={(item.itemId ?? item.id ?? i) as string}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-white/80">
                      {String(item.itemName ?? item.name ?? "")} ×{" "}
                      {String(item.quantity ?? "")}
                    </span>
                    <span className="text-white/60">
                      $
                      {(
                        (Number(item.priceCents ?? item.priceInCents ?? 0) *
                          Number(item.quantity ?? 1)) /
                        100
                      ).toFixed(2)}
                    </span>
                  </div>
                ),
              )}
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border">
                <span className="text-white">Total</span>
                <span className="text-[#00E5CC]">
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {canAdvance && (
                <button
                  type="button"
                  onClick={() => handleAdvance(order.id, statusKey)}
                  disabled={updateStatus.isPending}
                  className="flex-1 bg-[#00E5CC]/20 hover:bg-[#00E5CC]/30 text-[#00E5CC] border border-[#00E5CC]/30 rounded-lg py-2 text-xs font-semibold transition-all"
                  data-ocid={`manager.order.${index + 1}.edit_button`}
                >
                  → {statusLabel[nextStatus[statusKey]]}
                </button>
              )}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => handleCancel(order.id)}
                  disabled={cancelOrder.isPending}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
                  data-ocid={`manager.order.${index + 1}.delete_button`}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
