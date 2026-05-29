import { useUser, useClerk } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const clerkUserId = clerkUser?.id ?? null;
  _currentClerkUserId = clerkUserId;

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) console.warn("[AuthContext] fetchProfile error:", error.message);
    return data as Profile | null;
  }

  async function upsertProfile(userId: string, email: string, fullName: string): Promise<Profile | null> {
    const { error } = await supabase.from("profiles").upsert(
      { id: userId, email, full_name: fullName, role: "fan", onboarding_complete: false },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (error) console.warn("[AuthContext] upsertProfile error:", error.message);
    return fetchProfile(userId);
  }

  async function refreshProfile() {
    if (!clerkUserId) return;
    const data = await fetchProfile(clerkUserId);
    setProfile(data);
  }

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    const fullName = clerkUser.fullName ?? clerkUser.username ?? "";

    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        console.warn("[AuthContext] profile load timed out — rendering without profile");
        setProfileLoading(false);
      }
    }, 5000);

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
        clearTimeout(timeout);
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [clerkLoaded, clerkUser?.id]);

  async function signOut() {
    await clerkSignOut();
    setProfile(null);
  }

  const loading = !clerkLoaded || profileLoading;
  const role = profile?.role;

  return (
    <AuthContext.Provider
      value={{
        clerkUserId,
        profile,
        loading,
        isFan: role === "fan",
        isStaff: role === "staff",
        isManager: role === "manager",
        isAdmin: role === "admin",
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
