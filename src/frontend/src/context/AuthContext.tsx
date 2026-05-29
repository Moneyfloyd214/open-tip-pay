import { useUser, useClerk } from "@clerk/clerk-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "fan" | "staff" | "manager" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  phone: string;
  bio: string;
  stripe_connect_account_id: string;
  stripe_connect_status: "not_connected" | "pending" | "active";
  is_active: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextValue {
  clerkUserId: string | null;
  profile: Profile | null;
  loading: boolean;
  isFan: boolean;
  isStaff: boolean;
  isManager: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Stable module-level ref — written once per sign-in, never during render
let _currentClerkUserId: string | null = null;
export function getCurrentClerkUserId(): string | null {
  return _currentClerkUserId;
}

// ── Inner component so Clerk hooks are isolated from the Provider's render ───
// This prevents the pattern where useUser()/useClerk() re-firing inside the
// context provider causes the provider itself to re-render its children,
// which re-reads context, which triggers Clerk again — the infinite loop.
function AuthProviderInner({ children }: { children: ReactNode }) {
  // useUser / useClerk are safe here: this component only re-renders when
  // Clerk's own state changes, and it does NOT provide a context value itself.
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const resolvedRef = useRef(false);

  // Stable userId string — only changes when the actual user changes
  const clerkUserId = clerkUser?.id ?? null;

  // Write to module ref inside an effect, never during render
  useEffect(() => {
    _currentClerkUserId = clerkUserId;
  }, [clerkUserId]);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) console.warn("[AuthContext] fetchProfile error:", error.message);
    return data as Profile | null;
  }, []);

  const upsertProfile = useCallback(
    async (userId: string, email: string, fullName: string): Promise<Profile | null> => {
      const { error } = await supabase.from("profiles").upsert(
        { id: userId, email, full_name: fullName, role: "fan", onboarding_complete: false },
        { onConflict: "id", ignoreDuplicates: true }
      );
      if (error) console.warn("[AuthContext] upsertProfile error:", error.message);
      return fetchProfile(userId);
    },
    [fetchProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (!clerkUserId) return;
    const data = await fetchProfile(clerkUserId);
    setProfile(data);
  }, [clerkUserId, fetchProfile]);

  // Hard 4s deadline — unblocks the UI no matter what
  useEffect(() => {
    const deadline = window.setTimeout(() => {
      if (!resolvedRef.current) {
        console.warn("[AuthContext] hard deadline — unblocking UI");
        resolvedRef.current = true;
        setReady(true);
      }
    }, 4000);
    return () => clearTimeout(deadline);
  }, []);

  // Main auth effect — runs only when Clerk's loaded state or user ID changes
  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkUser) {
      setProfile(null);
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        setReady(true);
      }
      return;
    }

    let cancelled = false;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    const fullName = clerkUser.fullName ?? clerkUser.username ?? "";

    const perFetchTimeout = window.setTimeout(() => {
      if (!cancelled && !resolvedRef.current) {
        console.warn("[AuthContext] profile fetch timed out");
        resolvedRef.current = true;
        setReady(true);
      }
    }, 3000);

    (async () => {
      try {
        let data = await fetchProfile(clerkUser.id);
        if (!data) {
          data = await upsertProfile(clerkUser.id, email, fullName);
        }
        if (!cancelled) setProfile(data);
      } catch (err) {
        console.warn("[AuthContext] profile load failed:", err);
      } finally {
        clearTimeout(perFetchTimeout);
        if (!cancelled && !resolvedRef.current) {
          resolvedRef.current = true;
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(perFetchTimeout);
    };
  }, [clerkLoaded, clerkUserId]); // clerkUserId string — stable primitive, not object ref

  const signOut = useCallback(async () => {
    await clerkSignOut();
    setProfile(null);
  }, [clerkSignOut]);

  const role = profile?.role;

  // Memoize the context value so consumers only re-render when something
  // actually changes — not on every Clerk internal tick
  const value = useMemo<AuthContextValue>(
    () => ({
      clerkUserId,
      profile,
      loading: !ready,
      isFan: role === "fan",
      isStaff: role === "staff",
      isManager: role === "manager",
      isAdmin: role === "admin",
      signOut,
      refreshProfile,
    }),
    [clerkUserId, profile, ready, role, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Public provider — wraps the inner component ──────────────────────────────
// ClerkProvider must already be an ancestor (handled in main.tsx).
export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
