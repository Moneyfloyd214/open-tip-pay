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

// Module-level ref for non-reactive access (used by useQueries.ts)
let _currentUserId: string | null = null;
export function getCurrentClerkUserId(): string | null {
  return _currentUserId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef(false);

  // Keep module-level ref in sync
  useEffect(() => {
    _currentUserId = userId;
  }, [userId]);

  const fetchProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) console.warn("[AuthContext] fetchProfile error:", error.message);
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const data = await fetchProfile(userId);
    setProfile(data);
  }, [userId, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
    profileFetchedRef.current = false;
  }, []);

  // Listen to Supabase auth state — this is the sole source of truth for userId
  useEffect(() => {
    let cancelled = false;

    // Get the initial session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setProfile(null);
        profileFetchedRef.current = false;
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Background profile fetch — runs whenever userId changes, never blocks UI
  useEffect(() => {
    if (!userId) return;
    if (profileFetchedRef.current && profile?.id === userId) return;

    let cancelled = false;
    profileFetchedRef.current = false;

    (async () => {
      try {
        let data = await fetchProfile(userId);
        if (!data) {
          // New user — create a minimal profile row
          await supabase.from("profiles").upsert(
            { id: userId, role: "fan", onboarding_complete: false },
            { onConflict: "id", ignoreDuplicates: true }
          );
          data = await fetchProfile(userId);
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
  }, [userId, fetchProfile]);

  const role = profile?.role;

  const value = useMemo<AuthContextValue>(
    () => ({
      clerkUserId: userId,
      profile,
      loading,
      isFan: role === "fan",
      isStaff: role === "staff",
      isManager: role === "manager",
      isAdmin: role === "admin",
      signOut,
      refreshProfile,
    }),
    [userId, profile, loading, role, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
