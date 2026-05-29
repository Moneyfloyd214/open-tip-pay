import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Shield, Lock, FingerprintPattern as Fingerprint, TriangleAlert as AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

export default function SecurityPage() {
  const { clerkUserId, profile, refreshProfile } = useAuth();
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setTwoFaEnabled(profile.two_fa_enabled ?? false);
      setVaultLocked(profile.vault_locked ?? false);
    }
  }, [profile]);

  async function toggleTwoFa() {
    const next = !twoFaEnabled;
    setTwoFaEnabled(next);
    const { error } = await supabase
      .from("profiles")
      .update({ two_fa_enabled: next })
      .eq("id", clerkUserId!);
    if (error) { setTwoFaEnabled(!next); toast.error("Failed to update 2FA."); return; }
    toast.success(`2FA ${next ? "enabled" : "disabled"}.`);
    refreshProfile();
  }

  async function toggleVault() {
    const next = !vaultLocked;
    setVaultLocked(next);
    const { error } = await supabase
      .from("profiles")
      .update({ vault_locked: next })
      .eq("id", clerkUserId!);
    if (error) { setVaultLocked(!next); toast.error("Failed to update vault."); return; }
    toast.success(`Vault ${next ? "locked" : "unlocked"}.`);
    refreshProfile();
  }

  async function savePin() {
    if (pin.length !== 4) { toast.error("PIN must be 4 digits."); return; }
    if (pin !== confirmPin) { toast.error("PINs don't match."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ pin_hash: pin })
      .eq("id", clerkUserId!);
    setSaving(false);
    if (error) { toast.error("Failed to save PIN."); return; }
    toast.success("PIN saved.");
    setPin("");
    setConfirmPin("");
  }

  return (
    <AppShell title="Security" showBack>
      <div className="space-y-4 fade-in-up">
        {/* 2FA */}
        <div className="glassmorphism rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
                <Shield className="h-5 w-5 text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Two-Factor Auth</p>
                <p className="text-xs text-muted-foreground">Require 2FA for withdrawals</p>
              </div>
            </div>
            <button
              onClick={toggleTwoFa}
              className={`relative h-6 w-11 rounded-full transition-smooth ${twoFaEnabled ? "bg-teal" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${twoFaEnabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Vault Lock */}
        <div className="glassmorphism rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                <Lock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Vault Lock</p>
                <p className="text-xs text-muted-foreground">Lock withdrawals entirely</p>
              </div>
            </div>
            <button
              onClick={toggleVault}
              className={`relative h-6 w-11 rounded-full transition-smooth ${vaultLocked ? "bg-amber-500" : "bg-white/10"}`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${vaultLocked ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          {vaultLocked && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">Vault is locked. No withdrawals can be processed.</p>
            </div>
          )}
        </div>

        {/* App PIN */}
        <div className="glassmorphism rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <Fingerprint className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">App PIN</p>
              <p className="text-xs text-muted-foreground">4-digit PIN for app access</p>
            </div>
          </div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="New PIN (4 digits)"
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none text-center tracking-[0.5em] transition-smooth"
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Confirm PIN"
            className="w-full rounded-xl border border-border bg-black/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-teal focus:outline-none text-center tracking-[0.5em] transition-smooth"
          />
          <button
            onClick={savePin}
            disabled={pin.length !== 4 || saving}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-3 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            {saving ? "Saving…" : "Set PIN"}
          </button>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground/60 px-4">
          Security settings help protect your earnings. Enable 2FA and vault lock for maximum protection.
        </p>
      </div>
    </AppShell>
  );
}
