import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Loader as Loader2 } from "lucide-react";

// Pages
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import GuestPaymentPage from "./pages/GuestPaymentPage";
import KitchenDisplayPage from "./pages/KitchenDisplayPage";
import PartnerWithUsPage from "./pages/PartnerWithUsPage";

// Dashboard
import RoleDashboard from "./pages/RoleDashboard";

// Wallet
import SendMoneyPage from "./pages/wallet/SendMoneyPage";
import RequestMoneyPage from "./pages/wallet/RequestMoneyPage";
import SplitPaymentPage from "./pages/wallet/SplitPaymentPage";

// Finance & account
import TransactionsPage from "./pages/TransactionsPage";
import TaxCenterPage from "./pages/TaxCenterPage";
import DisputeCenterPage from "./pages/DisputeCenterPage";
import SecurityPage from "./pages/SecurityPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import RewardsPage from "./pages/RewardsPage";
import OrderPage from "./pages/OrderPage";

// Portals (role-gated)
import ManagerPortal from "./portals/ManagerPortal";
import AdminPanel from "./portals/AdminPanel";

/**
 * RBAC Route Table
 *
 * PUBLIC (no auth)
 *   /tip/:slug          GuestPaymentPage
 *   /kitchen            KitchenDisplayPage  (PIN-gated internally)
 *   /partner            PartnerWithUsPage
 *
 * AUTH REQUIRED
 *   /onboarding         OnboardingPage
 *   /dashboard          RoleDashboard       (layout by role)
 *   /wallet/send        SendMoneyPage
 *   /wallet/request     RequestMoneyPage
 *   /wallet/split       SplitPaymentPage
 *   /transactions       TransactionsPage
 *   /finance/tax        TaxCenterPage
 *   /support/dispute    DisputeCenterPage
 *   /security           SecurityPage
 *   /settings           SettingsPage
 *   /profile            ProfilePage
 *   /rewards            RewardsPage
 *   /order              OrderPage
 *
 * ROLE-GATED
 *   /manager            ManagerPortal       (manager | admin)
 *   /admin              AdminPanel          (admin)
 */
function Router() {
  const { user, loading, isManager, isAdmin } = useAuth();
  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  // ── Public routes ──────────────────────────────────────────────────────────
  if (path.startsWith("/tip/")) return <GuestPaymentPage />;
  if (path === "/kitchen")      return <KitchenDisplayPage />;
  if (path === "/partner")      return <PartnerWithUsPage />;

  // ── Unauthenticated → login ────────────────────────────────────────────────
  if (!user) {
    if (path === "/auth/login" || path === "/") return <LoginPage />;
    return <LoginPage />;
  }

  // ── Role-gated portals ─────────────────────────────────────────────────────
  if (path === "/admin") {
    return isAdmin ? <AdminPanel /> : <Unauthorized role="admin" />;
  }
  if (path === "/manager") {
    return isManager || isAdmin ? <ManagerPortal /> : <Unauthorized role="manager" />;
  }

  // ── Authenticated app routes ───────────────────────────────────────────────
  if (path === "/onboarding")       return <OnboardingPage />;
  if (path === "/wallet/send")      return <SendMoneyPage />;
  if (path === "/wallet/request")   return <RequestMoneyPage />;
  if (path === "/wallet/split")     return <SplitPaymentPage />;
  if (path === "/transactions")     return <TransactionsPage />;
  if (path === "/finance/tax")      return <TaxCenterPage />;
  if (path === "/support/dispute")  return <DisputeCenterPage />;
  if (path === "/security")         return <SecurityPage />;
  if (path === "/settings")         return <SettingsPage />;
  if (path === "/profile")          return <ProfilePage />;
  if (path === "/rewards")          return <RewardsPage />;
  if (path === "/order")            return <OrderPage />;

  // Default: role-aware dashboard
  if (isAdmin)   return <AdminPanel />;
  if (isManager) return <ManagerPortal />;
  return <RoleDashboard />;
}

function Unauthorized({ role }: { role: string }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glassmorphism rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 mx-auto text-2xl">🔒</div>
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          This area requires the <span className="font-semibold text-teal capitalize">{role}</span> role.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => window.history.back()} className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">Go Back</button>
          <button onClick={signOut} className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light transition-smooth">Sign Out</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
