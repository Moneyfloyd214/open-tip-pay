import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useAppLock } from "../hooks/useAppLock";
import { useHasExistingPin } from "../hooks/useQueries";
import AppLockScreen from "./AppLockScreen";
import AppLockSetupScreen from "./AppLockSetupScreen";

interface AppLockGateProps {
  children: React.ReactNode;
}

export default function AppLockGate({ children }: AppLockGateProps) {
  const {
    data: hasPin,
    isLoading: checkingPin,
    isFetched,
  } = useHasExistingPin();
  const { isLocked, unlock, logout } = useAppLock();

  // Show loading while checking PIN status
  if (checkingPin || !isFetched) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal mx-auto mb-4" />
          <p className="text-white/70">Initializing security...</p>
        </div>
      </div>
    );
  }

  // Show setup screen if no PIN exists
  if (!hasPin) {
    return <AppLockSetupScreen onSetupComplete={unlock} />;
  }

  // Show lock screen if locked
  if (isLocked) {
    return <AppLockScreen onUnlock={unlock} onLogout={logout} />;
  }

  // Show authenticated content
  return <>{children}</>;
}
