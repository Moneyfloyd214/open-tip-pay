import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { User, Check, Wallet, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { clerkUserId, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [cryptoWallet, setCryptoWallet] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setCryptoWallet(profile.crypto_wallet_address ?? "");
    }
  }, [profile]);

  async function saveProfile() {
    if (!clerkUserId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        crypto_wallet_address: cryptoWallet.trim(),
      })
      .eq("id", clerkUserId);
    setSaving(false);
    if (error) { toast.error("Failed to save profile."); return; }
    toast.success("Profile updated.");
    refreshProfile();
  }

  const initials = (profile?.full_name || profile?.email || "?")
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const stripeStatus = profile?.stripe_connect_status ?? "not_connected";
  const STRIPE_COLORS: Record<string, string> = {
    active:        "bg-teal/20 text-teal",
    pending:       "bg-amber-500/20 text-amber-400",
    not_connected: "bg-white/10 text-muted-foreground",
  };

  return (
    <AppShell title="Profile" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/20 border-2 border-teal/30 text-2xl font-bold text-teal">
            {initials}
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-foreground">{profile?.full_name || profile?.email}</p>
            <p className="text-xs text-muted-foreground">Member since {memberSince}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-teal/20 px-2.5 py-0.5 text-[11px] font-semibold text-teal capitalize">
              {profile?.role ?? "fan"}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div className="glassmorphism rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-semibold text-foreground">Personal Info</h2>
          </div>

          {[
            { label: "Full Name",    value: fullName,    set: setFullName,    placeholder: "Your name" },
            { label: "Phone",        value: phone,       set: setPhone,       placeholder: "+1 555 000 0000" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block text-xs text-muted-foreground font-semibold">{label}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth"
              />
            </div>
          ))}

          <div>
            <label className="mb-1 block text-xs text-muted-foreground font-semibold">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little about you"
              rows={2}
              maxLength={160}
              className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none transition-smooth resize-none"
            />
          </div>
        </div>

        {/* Stripe status */}
        <div className="glassmorphism rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Stripe Connect</p>
              <p className="text-xs text-muted-foreground">For receiving payouts</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STRIPE_COLORS[stripeStatus]}`}>
                {stripeStatus.replace("_", " ")}
              </span>
              {stripeStatus !== "active" && (
                <button className="flex items-center gap-1 text-xs text-teal hover:text-teal-light transition-smooth">
                  Setup <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Crypto wallet */}
        <div className="glassmorphism rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-semibold text-foreground">Crypto Wallet</h2>
          </div>
          <input
            type="text"
            value={cryptoWallet}
            onChange={(e) => setCryptoWallet(e.target.value)}
            placeholder="0x… or wallet address"
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none font-mono text-xs transition-smooth"
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 glow-teal-hero"
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </div>
    </AppShell>
  );
}
