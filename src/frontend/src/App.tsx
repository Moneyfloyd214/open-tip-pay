import { Toaster } from "@/components/ui/sonner";
import {
  InternetIdentityProvider,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import AppLockGate from "./components/AppLockGate";
import { DemoProvider, useDemoMode } from "./context/DemoContext";
import { getAppLockEnabled } from "./hooks/useAppLock";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import RecoverySetupPage from "./pages/RecoverySetupPage";

// ─── Feature Flags ────────────────────────────────────────────────────────────
/** Set to true when ready to enable the recovery phrase + backup device flow
 *  for real users at launch. Set to false to disable it entirely. */
const RECOVERY_SETUP_ENABLED = false;

// ─── Constants ────────────────────────────────────────────────────────────────
/** After this many ms, stop waiting for II init and show LoginPage regardless. */
const II_DEADLINE_MS = 3_000;

/** After this many ms of profile loading, give up and proceed to dashboard. */
const PROFILE_FETCH_TIMEOUT_MS = 2_000;

// ─── Branded loading screen ───────────────────────────────────────────────────
function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-navy-dark">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/10 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <img
          src="/assets/generated/opentip-logo.dim_200x200.png"
          alt="Open Tip Pay"
          className="h-16 w-16 rounded-2xl shadow-2xl ring-2 ring-teal/30"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <p className="text-xl font-bold text-white">Open Tip Pay</p>
          <div className="relative mt-1 flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-teal/15" />
            <div
              className="spin-ring absolute inset-0 rounded-full border-2 border-transparent border-t-teal"
              aria-hidden="true"
            />
          </div>
          <p className="text-sm text-white/55">{message}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Timeout / error recovery screen ─────────────────────────────────────────
function RecoveryScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-7 bg-navy-dark px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/8 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <img
          src="/assets/generated/opentip-logo.dim_200x200.png"
          alt="Open Tip Pay"
          className="h-14 w-14 rounded-2xl shadow-xl ring-1 ring-teal/30"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal/10">
          <ShieldAlert className="h-7 w-7 text-teal" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold text-white">{title}</p>
          <p className="max-w-xs text-sm leading-relaxed text-white/55">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-xl bg-teal px-6 py-3 text-sm font-bold text-navy shadow-lg shadow-teal/30 transition-all duration-200 hover:scale-[1.02] hover:bg-teal-dark active:scale-95"
          data-ocid="app.reload_button"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-xs text-white/35 underline underline-offset-2 hover:text-white/55"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

// ─── Content rendered inside InternetIdentityProvider for authenticated flows ─
// All hooks that call useInternetIdentity() live here, safely inside the provider.
function AuthContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { isDemoMode } = useDemoMode();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
    isError: profileError,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Recovery setup state (persisted in localStorage)
  const [recoverySetupDone, setRecoverySetupDone] = useState(
    () => localStorage.getItem("recoverySetupDone") === "true",
  );

  // Hard II deadline — if still initializing after II_DEADLINE_MS, give up.
  // Also enforce a maximum LoadingScreen duration: after II_DEADLINE_MS the
  // app MUST transition to LoginPage/Dashboard and never stay stuck.
  const [iiDeadlineHit, setIiDeadlineHit] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setIiDeadlineHit(true), II_DEADLINE_MS);
    return () => clearTimeout(id);
  }, []);

  // Profile fetch timeout
  const [profileTimedOut, setProfileTimedOut] = useState(false);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isAuthenticated && profileLoading) {
      profileTimerRef.current = setTimeout(
        () => setProfileTimedOut(true),
        PROFILE_FETCH_TIMEOUT_MS,
      );
    } else {
      if (profileTimerRef.current) {
        clearTimeout(profileTimerRef.current);
        profileTimerRef.current = null;
      }
      setProfileTimedOut(false);
    }
    return () => {
      if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    };
  }, [isAuthenticated, profileLoading]);

  // ── Demo mode: bypass all auth entirely ────────────────────────────────────
  if (isDemoMode) {
    const appLockEnabled = getAppLockEnabled();
    return appLockEnabled ? (
      <AppLockGate>
        <DashboardPage />
      </AppLockGate>
    ) : (
      <DashboardPage />
    );
  }

  // ── II still initializing ──────────────────────────────────────────────────
  if (loginStatus === "initializing" && !iiDeadlineHit) {
    return <LoadingScreen message="Initializing secure session…" />;
  }

  // ── II timed out — show recovery screen ───────────────────────────────────
  if (loginStatus === "initializing" && iiDeadlineHit) {
    return (
      <RecoveryScreen
        title="This is taking longer than expected"
        description="The login service isn't responding. Check your internet connection and try again."
      />
    );
  }

  // ── Not authenticated → login ──────────────────────────────────────────────
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // ── Authenticated but profile loading ─────────────────────────────────────
  if (profileLoading && !profileTimedOut && !profileError) {
    return <LoadingScreen message="Loading your account…" />;
  }

  if (profileError || profileTimedOut) {
    console.warn(
      "[Open Tip Pay] Profile fetch failed or timed out — proceeding to dashboard.",
    );
  }

  // ── Onboarding ─────────────────────────────────────────────────────────────
  const showOnboarding = isFetched && !userProfile && !profileTimedOut;
  if (showOnboarding) {
    return <OnboardingPage />;
  }

  // ── Recovery setup (disabled — re-enable by setting RECOVERY_SETUP_ENABLED) ─
  const showRecoverySetup =
    RECOVERY_SETUP_ENABLED &&
    isFetched &&
    !!userProfile &&
    !recoverySetupDone &&
    !isDemoMode;
  if (showRecoverySetup) {
    return (
      <RecoverySetupPage
        onComplete={() => {
          localStorage.setItem("recoverySetupDone", "true");
          setRecoverySetupDone(true);
        }}
      />
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const appLockEnabled = getAppLockEnabled();
  return appLockEnabled ? (
    <AppLockGate>
      <DashboardPage />
    </AppLockGate>
  ) : (
    <DashboardPage />
  );
}

// ─── II Provider wrapper with error boundary ─────────────────────────────────
// If InternetIdentityProvider itself throws on init, we catch it and render
// the LoginPage directly so the user always sees something.
class IIProviderBoundary extends Component<
  { children: ReactNode },
  { crashed: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(err: Error) {
    console.error("[Open Tip Pay] InternetIdentityProvider crashed:", err);
  }
  render() {
    if (this.state.crashed) {
      // Render LoginPage without II context — demo mode still works
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <LoginPage />
          <Toaster />
        </ThemeProvider>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ─────────────────────────────────────────────────────────────────
// CRITICAL provider nesting:
//   DemoProvider
//   └── IIProviderBoundary        ← catches II init crashes gracefully
//       └── InternetIdentityProvider  ← ALWAYS mounted, never conditional
//           └── ThemeProvider
//               └── AuthContent   ← decides what to show based on state
//
// InternetIdentityProvider is NEVER inside a conditional branch. This guarantees
// that useInternetIdentity() can never be called outside the provider boundary,
// regardless of demo mode, env state, or any other runtime condition.
export default function App() {
  return (
    <DemoProvider>
      <IIProviderBoundary>
        <InternetIdentityProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            <AuthContent />
            <Toaster />
          </ThemeProvider>
        </InternetIdentityProvider>
      </IIProviderBoundary>
    </DemoProvider>
  );
}
