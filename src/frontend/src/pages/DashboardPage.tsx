import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@dfinity/principal";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownLeft,
  Bell,
  Briefcase,
  CheckCircle,
  ChevronRight,
  FileText,
  Loader2,
  LogOut,
  QrCode,
  Scissors,
  Shield,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import AIAssistant from "../components/AIAssistant";
import ActiveOrderCard from "../components/ActiveOrderCard";
import AdminPanel from "../components/AdminPanel";
import BalanceCard from "../components/BalanceCard";
import BusinessOnboarding from "../components/BusinessOnboarding";
import BusinessUpgradeCard from "../components/BusinessUpgradeCard";
import DashboardPaymentMethods from "../components/DashboardPaymentMethods";
import DirectDepositCard from "../components/DirectDepositCard";
import FoodOrderSheet from "../components/FoodOrderSheet";
import Header from "../components/Header";
import InviteFriendsSheet from "../components/InviteFriendsSheet";
import ManagerDashboard, {
  StaffInviteBanner,
} from "../components/ManagerDashboard";
import MyQRCodeSheet from "../components/MyQRCodeSheet";
import MyTipLinkCard from "../components/MyTipLinkCard";
import { PlaidCardLinking } from "../components/PlaidCardLinking";
import QuickActionsCard from "../components/QuickActionsCard";
import RequestMoneySheet from "../components/RequestMoneySheet";
import SavingsPocketCard from "../components/SavingsPocketCard";
import ScanToPaySheet from "../components/ScanToPaySheet";
import SearchBar from "../components/SearchBar";
import SendTipSheet from "../components/SendTipSheet";
import SettingsSheet from "../components/SettingsSheet";
import SplitPaymentSheet from "../components/SplitPaymentSheet";
import StatusBadgeManager from "../components/StatusBadgeManager";
import { SupportChatButton } from "../components/SupportChat";
import TaxReportExport from "../components/TaxReportExport";
import TransactionHistory from "../components/TransactionHistory";
import VaultLockCard from "../components/VaultLockCard";
import WalletCard from "../components/WalletCard";
import {
  DEMO_BALANCE_BIGINT,
  DEMO_POINT_TRANSACTIONS,
  DEMO_PROFILE,
  useDemoMode,
} from "../context/DemoContext";
import {
  useGetBalance,
  useGetCallerUserProfile,
  useGetMyFanPoints,
  useGetPendingRequestsReceived,
  useIsCallerAdmin,
} from "../hooks/useQueries";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [sendTipOpen, setSendTipOpen] = useState(false);
  const [sendTipDefaultMode, setSendTipDefaultMode] = useState(false);
  const [requestMoneyOpen, setRequestMoneyOpen] = useState(false);
  const [splitPaymentOpen, setSplitPaymentOpen] = useState(false);
  const [taxReportOpen, setTaxReportOpen] = useState(false);
  const [statusManagerOpen, setStatusManagerOpen] = useState(false);
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false);
  const [managerDashboardOpen, setManagerDashboardOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [businessOnboardingOpen, setBusinessOnboardingOpen] = useState(false);
  const [myQRCodeOpen, setMyQRCodeOpen] = useState(false);
  const [foodOrderOpen, setFoodOrderOpen] = useState(false);
  const [recipientPrincipal, setRecipientPrincipal] =
    useState<Principal | null>(null);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState("security");
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  const { isDemoMode, exitDemoMode } = useDemoMode();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Real data hooks — disabled when in demo mode (enabled flag = false)
  const { data: realProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const { data: realBalance, isLoading: balanceLoading } = useGetBalance();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: pendingRequests } = useGetPendingRequestsReceived();
  const { data: fanPoints, isLoading: fanPointsLoading } = useGetMyFanPoints();

  // Use mock data in demo mode, real data otherwise
  const userProfile = isDemoMode ? DEMO_PROFILE : realProfile;
  const balance = isDemoMode ? DEMO_BALANCE_BIGINT : realBalance;

  const pendingCount = pendingRequests?.length ?? 0;
  const greeting = getGreeting();
  const displayName = userProfile?.username ?? "there";

  const demoFanPointsTotal = DEMO_POINT_TRANSACTIONS.reduce(
    (sum, tx) => sum + tx.finalPoints,
    0,
  );

  const handleScanSuccess = (principal: Principal) => {
    setRecipientPrincipal(principal);
    setScanOpen(false);
    setSendTipDefaultMode(false);
    setSendTipOpen(true);
  };

  const handleNFCSuccess = (principal: Principal) => {
    setRecipientPrincipal(principal);
    setSendTipDefaultMode(false);
    setSendTipOpen(true);
  };

  const handleSelectUser = (username: string) => {
    setSelectedUsername(username);
    setSendTipDefaultMode(false);
    setTimeout(() => {
      setSendTipOpen(true);
    }, 100);
  };

  const handleSelectUserForRequest = (username: string) => {
    setSelectedUsername(username);
    setTimeout(() => {
      setRequestMoneyOpen(true);
    }, 100);
  };

  const handleOpenSecurityFAQ = () => {
    setSettingsDefaultTab("security");
    setSettingsOpen(true);
    setTimeout(() => {
      const faqElement = document.getElementById("security-faq");
      if (faqElement) {
        faqElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  };

  const handleOpenBusinessSettings = () => {
    setSettingsDefaultTab("business");
    setSettingsOpen(true);
  };

  const _handleOpenDisputeCenter = () => {
    setSettingsDefaultTab("disputes");
    setSettingsOpen(true);
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemoMode();
      return;
    }
    await clear();
    queryClient.clear();
  };

  const handleSendTipClose = (open: boolean) => {
    setSendTipOpen(open);
    if (!open) {
      setSelectedUsername(null);
      setRecipientPrincipal(null);
      setSendTipDefaultMode(false);
    }
  };

  const handleRequestMoneyClose = () => {
    setRequestMoneyOpen(false);
    setSelectedUsername(null);
    setRecipientPrincipal(null);
  };

  if (!isDemoMode && (profileLoading || balanceLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-teal" />
          <p className="text-muted-foreground text-sm">
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (managerDashboardOpen) {
    return <ManagerDashboard onClose={() => setManagerDashboardOpen(false)} />;
  }

  if (adminPanelOpen) {
    return <AdminPanel onClose={() => setAdminPanelOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient CSS orbs — no JS, no layout jitter */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="orb-1 absolute top-[-8%] left-[20%] w-[420px] h-[420px] bg-teal/[0.12] rounded-full blur-[90px]" />
        <div className="orb-2 absolute bottom-[10%] right-[15%] w-[360px] h-[360px] bg-teal/[0.08] rounded-full blur-[100px]" />
        <div className="orb-3 absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-teal/[0.05] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 fade-in-up">
        <Header
          userProfile={userProfile}
          onSettingsClick={() => setSettingsOpen(true)}
          onLogout={handleLogout}
        />

        <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div
              data-ocid="demo.banner"
              className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400/20">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-300">
                    Demo Mode — Sample Data
                  </p>
                  <p className="truncate text-xs text-amber-400/70">
                    Explore all features. No real payments are made.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                data-ocid="demo.exit_button"
                onClick={exitDemoMode}
                className="flex-shrink-0 border-amber-400/40 bg-amber-400/10 text-amber-300 text-xs hover:bg-amber-400/20 hover:border-amber-400/70"
              >
                <LogOut className="mr-1.5 h-3 w-3" />
                Exit Demo
              </Button>
            </div>
          )}

          {/* Greeting */}
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold text-foreground">
              {greeting}, {displayName}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your money below.
            </p>
          </div>

          <SearchBar onSelectUser={handleSelectUser} />

          {/* Staff invite banner */}
          <StaffInviteBanner />

          {/* Pending money requests notification banner */}
          {pendingCount > 0 && (
            <button
              type="button"
              data-ocid="pending_requests.banner"
              onClick={() => {
                const el = document.getElementById("transaction-history");
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="w-full flex items-center gap-3 p-4 bg-teal/10 border border-teal/40 rounded-xl text-left hover:bg-teal/15 transition-colors duration-200"
            >
              <div className="relative flex-shrink-0">
                <Bell className="h-5 w-5 text-teal" />
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-teal text-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm">
                  {pendingCount === 1
                    ? "1 pending money request"
                    : `${pendingCount} pending money requests`}
                </p>
                <p className="text-muted-foreground text-xs">
                  Tap to review and respond
                </p>
              </div>
            </button>
          )}

          {/* Admin Panel shortcut */}
          {isAdmin && (
            <Button
              data-ocid="admin-panel-open-btn"
              onClick={() => setAdminPanelOpen(true)}
              className="w-full bg-teal/10 hover:bg-teal/20 border border-teal/40 text-teal font-semibold shadow-lg shadow-teal/10 transition-all duration-200 hover:shadow-teal/25 hover:scale-[1.01]"
              size="lg"
              variant="outline"
            >
              <Shield className="mr-2 h-5 w-5" />
              Admin Panel
            </Button>
          )}

          {/* Manager Portal quick access — admin and demo mode */}
          {(isAdmin || isDemoMode) && (
            <Button
              data-ocid="dashboard.manager_portal_button"
              onClick={() => setManagerDashboardOpen(true)}
              className="w-full bg-gradient-to-r from-green-500/20 to-green-500/10 hover:from-green-500/30 hover:to-green-500/20 border border-green-500/40 text-green-300 font-semibold shadow-lg shadow-green-500/10 transition-all duration-200 hover:shadow-green-500/25 hover:scale-[1.01]"
              size="lg"
              variant="outline"
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Manager Portal
            </Button>
          )}

          {/* Admin Access banner — inline below Manager Portal */}
          {isAdmin && (
            <div
              data-ocid="admin-access-banner"
              className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal/20 flex items-center justify-center shrink-0 glow-teal">
                  <CheckCircle className="h-5 w-5 text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Admin Access
                  </p>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                    You have full access to the Manager Portal as admin.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Balance */}
          <BalanceCard balance={balance || BigInt(0)} />

          {/* Fan Points widget */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/rewards";
            }}
            data-ocid="fan_points.card"
            className="flex items-center gap-3 p-4 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/15 hover:border-amber-400/50 transition-all duration-200 cursor-pointer text-left w-full"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/20">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Fan Points
              </p>
              {fanPointsLoading && !isDemoMode ? (
                <Skeleton className="h-5 w-20 mt-0.5 bg-muted/50" />
              ) : (
                <p className="text-lg font-bold text-amber-300">
                  {isDemoMode
                    ? demoFanPointsTotal.toFixed(3)
                    : fanPoints?.points !== undefined
                      ? Number(fanPoints.points).toLocaleString()
                      : "0"}
                  <span className="text-xs text-amber-400/70 font-normal ml-1">
                    pts
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-sm font-semibold text-teal">
                View Rewards
              </span>
              <ChevronRight className="h-4 w-4 text-teal" />
            </div>
          </button>

          {/* Quick Actions — 2×2 grid (directly below balance) */}
          <div className="space-y-2">
            <p className="section-header">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                data-ocid="dashboard.send_money_button"
                onClick={() => {
                  setSendTipDefaultMode(false);
                  setSendTipOpen(true);
                }}
                className="w-full bg-teal hover:bg-teal-dark text-navy font-bold shadow-lg shadow-teal/30 py-5 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-teal/50"
                size="lg"
              >
                Send Money
              </Button>
              <Button
                data-ocid="dashboard.send_tip_button"
                onClick={() => {
                  setSendTipDefaultMode(true);
                  setSendTipOpen(true);
                }}
                className="w-full glassmorphism hover:bg-teal/20 border border-teal/50 text-foreground font-semibold py-5 text-base transition-all duration-200 hover:scale-[1.02] hover:border-teal/70"
                size="lg"
                variant="outline"
              >
                <Sparkles className="mr-2 h-4 w-4 text-teal" />
                Send Tip
              </Button>
              <Button
                data-ocid="dashboard.request_money_button"
                onClick={() => {
                  setSelectedUsername(null);
                  setRecipientPrincipal(null);
                  setRequestMoneyOpen(true);
                }}
                className="w-full glassmorphism hover:bg-card border border-border hover:border-teal/40 text-foreground font-semibold py-5 text-base transition-all duration-200 hover:scale-[1.02] relative"
                size="lg"
                variant="outline"
              >
                <ArrowDownLeft className="mr-2 h-4 w-4 text-teal" />
                Request
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-teal text-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Button>
              <Button
                data-ocid="dashboard.split_bill_button"
                onClick={() => setSplitPaymentOpen(true)}
                className="w-full glassmorphism hover:bg-card border border-border hover:border-teal/40 text-foreground font-semibold py-5 text-base transition-all duration-200 hover:scale-[1.02]"
                size="lg"
                variant="outline"
              >
                <Scissors className="mr-2 h-4 w-4 text-teal" />
                Split
              </Button>
              <Button
                data-ocid="dashboard.my_qr_code_button"
                onClick={() => setMyQRCodeOpen(true)}
                className="w-full col-span-2 glassmorphism hover:bg-teal/10 border border-teal/30 hover:border-teal/60 text-teal font-semibold py-5 text-base transition-all duration-200 hover:scale-[1.01]"
                size="lg"
                variant="outline"
              >
                <QrCode className="mr-2 h-4 w-4" />
                My QR Code
              </Button>
            </div>
          </div>

          <VaultLockCard />
          <SavingsPocketCard />
          <DirectDepositCard />
          <BusinessUpgradeCard
            onOpenBusinessSettings={handleOpenBusinessSettings}
            onOpenManagerDashboard={() => setManagerDashboardOpen(true)}
            onStartOnboarding={() => setBusinessOnboardingOpen(true)}
          />

          {/* Wallet section */}
          <div className="space-y-2">
            <p className="section-header">Your Wallet</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardPaymentMethods />
              <WalletCard onOpenSecurityFAQ={handleOpenSecurityFAQ} />
            </div>
          </div>

          {/* Linked Card for Fan Points — standalone section between Wallet and Payment Link */}
          <div className="space-y-2">
            <p className="section-header">Linked Card for Fan Points</p>
            <PlaidCardLinking />
          </div>

          <MyTipLinkCard username={userProfile?.username || "User"} />

          <ActiveOrderCard onViewOrder={() => setFoodOrderOpen(true)} />

          <QuickActionsCard
            onScanClick={() => setScanOpen(true)}
            onNFCSuccess={handleNFCSuccess}
            onOrderFoodClick={() => setFoodOrderOpen(true)}
          />

          <Button
            onClick={() => setInviteFriendsOpen(true)}
            data-ocid="invite_friends.button"
            className="w-full bg-gradient-to-r from-teal/20 to-teal/10 hover:from-teal/30 hover:to-teal/20 border border-teal/40 text-foreground font-bold shadow-lg shadow-teal/20 transition-all duration-200 hover:shadow-teal/40 hover:scale-[1.01] py-6 text-base"
            size="lg"
          >
            <UserPlus className="mr-3 h-5 w-5 text-teal" />
            Invite Friends to Open Tip Pay
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setTaxReportOpen(true)}
              className="w-full glassmorphism hover:bg-card border border-border hover:border-teal/30 text-foreground font-semibold shadow-md transition-all duration-200"
              size="lg"
            >
              <FileText className="mr-2 h-5 w-5 text-teal" />
              Export for Tax Season
            </Button>
            <Button
              onClick={() => setStatusManagerOpen(true)}
              className="w-full glassmorphism hover:bg-card border border-border hover:border-teal/30 text-foreground font-semibold shadow-md transition-all duration-200"
              size="lg"
            >
              <Activity className="mr-2 h-5 w-5 text-teal" />
              Manage Status
            </Button>
          </div>

          {/* Recent Activity */}
          <div className="space-y-2" id="transaction-history">
            <p className="section-header">Recent Activity</p>
            <TransactionHistory onRequestUser={handleSelectUserForRequest} />
          </div>

          {/* Branding footer */}
          <div className="pt-4 pb-8 text-center">
            <p className="text-xs text-muted-foreground/40">
              © {new Date().getFullYear()} Open Tip Pay ·{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground/60 transition-colors"
              >
                Built with caffeine.ai
              </a>
            </p>
          </div>
        </main>

        <AIAssistant />
        <SupportChatButton className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-2xl shadow-lg shadow-black/30" />

        <SettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          defaultTab={settingsDefaultTab}
        />

        <ScanToPaySheet
          open={scanOpen}
          onOpenChange={setScanOpen}
          onScanSuccess={handleScanSuccess}
        />

        <SendTipSheet
          open={sendTipOpen}
          onOpenChange={handleSendTipClose}
          recipientPrincipal={recipientPrincipal}
          recipientUsername={selectedUsername}
          onOpenSecurityFAQ={handleOpenSecurityFAQ}
          defaultTipMode={sendTipDefaultMode}
        />

        <RequestMoneySheet
          isOpen={requestMoneyOpen}
          onClose={handleRequestMoneyClose}
          recipientPrincipal={recipientPrincipal}
          recipientUsername={selectedUsername}
        />

        <SplitPaymentSheet
          isOpen={splitPaymentOpen}
          onClose={() => setSplitPaymentOpen(false)}
        />

        <TaxReportExport open={taxReportOpen} onOpenChange={setTaxReportOpen} />

        <StatusBadgeManager
          open={statusManagerOpen}
          onOpenChange={setStatusManagerOpen}
        />

        <InviteFriendsSheet
          open={inviteFriendsOpen}
          onOpenChange={setInviteFriendsOpen}
        />

        <BusinessOnboarding
          open={businessOnboardingOpen}
          onClose={() => setBusinessOnboardingOpen(false)}
          onOpenManagerPortal={() => setManagerDashboardOpen(true)}
        />

        <MyQRCodeSheet
          open={myQRCodeOpen}
          onClose={() => setMyQRCodeOpen(false)}
        />

        <FoodOrderSheet open={foodOrderOpen} onOpenChange={setFoodOrderOpen} />
      </div>
    </div>
  );
}
