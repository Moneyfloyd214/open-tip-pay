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

let _currentClerkUserId: string | null = null;
export function getCurrentClerkUserId(): string | null {
  return _currentClerkUserId;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const [profile, setProfile] = useState<Profile | null>(null);
  // loading = true only until Clerk tells us its state (isLoaded).
  // Profile is fetched in the background and does NOT block rendering.
  const [clerkReady, setClerkReady] = useState(false);
  const profileFetchedRef = useRef(false);

  const clerkUserId = clerkUser?.id ?? null;

  // Write module-level ref in an effect, never during render
  useEffect(() => {
    _currentClerkUserId = clerkUserId;
  }, [clerkUserId]);

  // Absolute fallback: if Clerk never fires isLoaded in 5s, unblock anyway
  useEffect(() => {
    const t = window.setTimeout(() => setClerkReady(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // As soon as Clerk resolves its loaded state, unblock the UI immediately.
  // Profile loading is fire-and-forget — it updates the context when done
  // but never blocks the initial render.
  useEffect(() => {
    if (!clerkLoaded) return;
    setClerkReady(true);
  }, [clerkLoaded]);

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

  // Background profile fetch — runs after Clerk resolves, never blocks UI
  useEffect(() => {
    if (!clerkLoaded) return;
    if (!clerkUser) {
      setProfile(null);
      profileFetchedRef.current = false;
      return;
    }

    // Don't re-fetch if we already have a profile for this user
    if (profileFetchedRef.current && profile?.id === clerkUser.id) return;

    let cancelled = false;
    profileFetchedRef.current = false;
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    const fullName = clerkUser.fullName ?? clerkUser.username ?? "";

    (async () => {
      try {
        let data = await fetchProfile(clerkUser.id);
        if (!data) {
          data = await upsertProfile(clerkUser.id, email, fullName);
        }
        if (!cancelled) {
          setProfile(data);
          profileFetchedRef.current = true;
        }
      } catch (err) {
        console.warn("[AuthContext] profile load failed:", err);
        if (!cancelled) profileFetchedRef.current = true;
      }
    })();

    return () => { cancelled = true; };
  }, [clerkLoaded, clerkUserId]);

  const signOut = useCallback(async () => {
    await clerkSignOut();
    setProfile(null);
    profileFetchedRef.current = false;
  }, [clerkSignOut]);

  const role = profile?.role;

  const value = useMemo<AuthContextValue>(
    () => ({
      clerkUserId,
      profile,
      loading: !clerkReady,
      isFan: role === "fan",
      isStaff: role === "staff",
      isManager: role === "manager",
      isAdmin: role === "admin",
      signOut,
      refreshProfile,
    }),
    [clerkUserId, profile, clerkReady, role, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
