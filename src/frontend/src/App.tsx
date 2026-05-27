import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import FanDashboardPage from "./pages/FanDashboardPage";
import GuestPaymentPage from "./pages/GuestPaymentPage";
import KitchenDisplayPage from "./pages/KitchenDisplayPage";
import PartnerWithUsPage from "./pages/PartnerWithUsPage";
import ManagerPortal from "./portals/ManagerPortal";
import AdminPanel from "./portals/AdminPanel";
import { Loader as Loader2 } from "lucide-react";

/**
 * RBAC Router
 *
 * Route structure:
 *   /tip/:slug  → GuestPaymentPage   (public, no auth required)
 *   /kitchen    → KitchenDisplayPage (public, PIN-gated at stand level)
 *   /partner    → PartnerWithUsPage  (public)
 *   /manager    → ManagerPortal      (role: manager | admin)
 *   /admin      → AdminPanel         (role: admin only)
 *   /           → role-based default:
 *                   fan/staff  → FanDashboardPage
 *                   manager    → ManagerPortal
 *                   admin      → AdminPanel
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

  // Public routes — no auth required
  if (path.startsWith("/tip/")) return <GuestPaymentPage />;
  if (path === "/kitchen")      return <KitchenDisplayPage />;
  if (path === "/partner")      return <PartnerWithUsPage />;

  // Unauthenticated fallback
  if (!user) return <LoginPage />;

  // Portal routes with role guards
  if (path === "/admin") {
    if (!isAdmin) return <Unauthorized requiredRole="admin" />;
    return <AdminPanel />;
  }

  if (path === "/manager") {
    if (!isManager && !isAdmin) return <Unauthorized requiredRole="manager" />;
    return <ManagerPortal />;
  }

  // Default: route by role
  if (isAdmin)   return <AdminPanel />;
  if (isManager) return <ManagerPortal />;
  return <FanDashboardPage />;
}

function Unauthorized({ requiredRole }: { requiredRole: string }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glassmorphism rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20 mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          This area requires the{" "}
          <span className="font-semibold text-teal capitalize">{requiredRole}</span> role.
          Contact your administrator.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.history.back()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
          >
            Go Back
          </button>
          <button
            onClick={signOut}
            className="rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light transition-smooth"
          >
            Sign Out
          </button>
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
