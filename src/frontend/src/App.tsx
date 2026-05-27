import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import GuestPaymentPage from "./pages/GuestPaymentPage";
import { Loader as Loader2 } from "lucide-react";

function Router() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  // Guest tip page — always accessible
  if (path.startsWith("/tip/")) {
    return <GuestPaymentPage />;
  }

  // Auth routes
  if (!user) {
    return <LoginPage />;
  }

  // Authenticated: show dashboard
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  );
}
