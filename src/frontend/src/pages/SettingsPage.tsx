import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { Bell, CreditCard, Calendar, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

type PayoutSchedule = "instant" | "daily" | "weekly" | "monthly";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [notifs, setNotifs] = useState({ tips: true, payouts: true, security: true, marketing: false });
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule>("daily");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const prefs = profile.notification_prefs as Record<string, boolean> | null;
      if (prefs) setNotifs({ tips: prefs.tips ?? true, payouts: prefs.payouts ?? true, security: prefs.security ?? true, marketing: prefs.marketing ?? false });
      if (profile.payout_schedule) setPayoutSchedule(profile.payout_schedule as PayoutSchedule);
    }
  }, [profile]);

  async function saveSettings() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: notifs, payout_schedule: payoutSchedule })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save settings."); return; }
    toast.success("Settings saved.");
    refreshProfile();
  }

  const PAYOUT_OPTS: { value: PayoutSchedule; label: string; desc: string }[] = [
    { value: "instant", label: "Instant",  desc: "Transfer within minutes" },
    { value: "daily",   label: "Daily",    desc: "End of each day" },
    { value: "weekly",  label: "Weekly",   desc: "Every Monday" },
    { value: "monthly", label: "Monthly",  desc: "1st of each month" },
  ];

  const NOTIF_ITEMS: { key: keyof typeof notifs; label: string; desc: string }[] = [
    { key: "tips",       label: "New Tips",          desc: "When you receive a tip" },
    { key: "payouts",    label: "Payout Updates",    desc: "When funds are transferred" },
    { key: "security",   label: "Security Alerts",   desc: "Login and 2FA events" },
    { key: "marketing",  label: "Promotions",        desc: "Product news and offers" },
  ];

  return (
    <AppShell title="Settings" showBack>
      <div className="space-y-5 fade-in-up">
        {/* Notifications */}
        <div className="glassmorphism rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
            <Bell className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="divide-y divide-border/20">
            {NOTIF_ITEMS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                  className={`relative h-6 w-11 rounded-full transition-smooth ${notifs[key] ? "bg-teal" : "bg-white/10"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${notifs[key] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payout Schedule */}
        <div className="glassmorphism rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3">
            <Calendar className="h-4 w-4 text-teal" />
            <h2 className="text-sm font-semibold text-foreground">Payout Schedule</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {PAYOUT_OPTS.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setPayoutSchedule(value)}
                className={`rounded-xl p-3 text-left transition-smooth border ${
                  payoutSchedule === value
                    ? "border-teal bg-teal/10"
                    : "border-border bg-black/10 hover:border-teal/30"
                }`}
              >
                <p className={`text-sm font-semibold ${payoutSchedule === value ? "text-teal" : "text-foreground"}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods Link */}
        <button
          onClick={() => { window.location.href = "/profile"; }}
          className="w-full glassmorphism rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-teal/40 transition-smooth"
        >
          <CreditCard className="h-4 w-4 text-teal" />
          <span className="text-sm font-semibold text-foreground">Payment Methods</span>
          <span className="ml-auto text-muted-foreground text-sm">›</span>
        </button>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-4 text-sm font-bold text-white hover:bg-teal-light transition-smooth disabled:opacity-40 glow-teal-hero"
        >
          <Check className="h-4 w-4" />
          {saving ? "Saving…" : "Save Settings"}
        </button>

        {/* Danger Zone */}
        <div className="glassmorphism rounded-2xl overflow-hidden border border-destructive/20">
          <div className="px-5 py-4 border-b border-destructive/20">
            <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
          </div>
          <div className="p-5">
            <button
              onClick={() => toast.error("Contact support to delete your account.")}
              className="flex items-center gap-2 rounded-xl border border-destructive/40 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-smooth"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
