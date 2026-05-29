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

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as Profile | null);
  }

  async function upsertProfile(userId: string, email: string, fullName: string) {
    await supabase.from("profiles").upsert(
      { id: userId, email, full_name: fullName, role: "fan", onboarding_complete: false },
      { onConflict: "id", ignoreDuplicates: true }
    );
    await fetchProfile(userId);
  }

  async function refreshProfile() {
    if (clerkUserId) await fetchProfile(clerkUserId);
  }

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!clerkUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    const fullName = clerkUser.fullName ?? clerkUser.username ?? "";

    supabase
      .from("profiles")
      .select("*")
      .eq("id", clerkUser.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
          setProfileLoading(false);
        } else {
          upsertProfile(clerkUser.id, email, fullName).finally(() =>
            setProfileLoading(false)
          );
        }
      });
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
