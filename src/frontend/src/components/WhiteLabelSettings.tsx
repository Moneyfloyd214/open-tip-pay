import type { PartnerBrandingConfig } from "@/types/local-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Globe,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useClearPartnerBranding,
  useGetPartnerBranding,
  useSetPartnerBranding,
} from "../hooks/useQueries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  partnerName: string;
  partnerLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = {
  partnerName: "Indianapolis Colts",
  partnerLogoUrl: "",
  primaryColor: "#002C5F",
  secondaryColor: "#FFFFFF",
  isActive: true,
};

// ─── Presets ──────────────────────────────────────────────────────────────────

interface Preset {
  id: string;
  label: string;
  subtitle: string;
  form: Omit<FormState, "partnerLogoUrl"> & { partnerLogoUrl: string };
}

const PRESETS: Preset[] = [
  {
    id: "indianapolis-colts",
    label: "Indianapolis Colts",
    subtitle: "Colts Tip Pay powered by Open Tip Pay",
    form: {
      partnerName: "Indianapolis Colts",
      partnerLogoUrl: "",
      primaryColor: "#002C5F",
      secondaryColor: "#FFFFFF",
      isActive: true,
    },
  },
];

// ─── Live preview ─────────────────────────────────────────────────────────────

function BrandingPreview({ form }: { form: FormState }) {
  const displayBrandName = form.partnerName
    ? `${form.partnerName} Tip Pay`
    : "Your Team Tip Pay";

  return (
    <div
      data-ocid="whitelabel.preview"
      className="glassmorphism rounded-xl border border-white/10 p-5 space-y-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-3.5 w-3.5 text-teal" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Live Preview
        </span>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        {form.partnerLogoUrl ? (
          <img
            src={form.partnerLogoUrl}
            alt="Partner logo"
            className="h-14 w-14 rounded-xl object-contain bg-white/5 border border-white/10 p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Globe className="h-6 w-6 text-white/20" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-white font-bold text-lg leading-tight truncate">
            {displayBrandName}
          </p>
          {form.isActive && (
            <p className="text-xs mt-0.5" style={{ color: form.primaryColor }}>
              powered by Open Tip Pay
            </p>
          )}
          {!form.isActive && (
            <p className="text-xs text-white/30 mt-0.5">
              Enable to activate co-branding
            </p>
          )}
        </div>
      </div>

      {/* Color swatches */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full border border-white/20 shrink-0"
            style={{ background: form.primaryColor }}
          />
          <span className="text-xs text-white/50">Primary</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full border border-white/20 shrink-0"
            style={{ background: form.secondaryColor }}
          />
          <span className="text-xs text-white/50">Secondary</span>
        </div>
      </div>

      {/* Status badge */}
      <div>
        {form.isActive ? (
          <Badge className="bg-teal/20 text-teal border border-teal/30 text-xs">
            Co-branding active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-white/30 border-white/10 text-xs"
          >
            Inactive — using Open Tip Pay defaults
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Color field ──────────────────────────────────────────────────────────────

function ColorField({
  label,
  value,
  ocid,
  onChange,
}: {
  label: string;
  value: string;
  ocid: string;
  onChange: (v: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-sm">{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          className="h-10 w-10 rounded-lg border border-white/20 cursor-pointer shrink-0 transition-transform hover:scale-105"
          style={{ background: value }}
          aria-label={`Pick ${label}`}
          data-ocid={ocid}
        />
        <input
          ref={pickerRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#20C997"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm h-10"
          maxLength={7}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WhiteLabelSettings() {
  const { data: currentBranding, isLoading } = useGetPartnerBranding();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const setMutation = useSetPartnerBranding();
  const clearMutation = useClearPartnerBranding();

  // Populate form from existing config — must be before any early return
  useEffect(() => {
    if (currentBranding) {
      setForm({
        partnerName: currentBranding.partnerName,
        partnerLogoUrl: currentBranding.partnerLogoUrl,
        primaryColor: currentBranding.primaryColor || "#20C997",
        secondaryColor: currentBranding.secondaryColor || "#1a9e76",
        isActive: currentBranding.isActive,
      });
    }
  }, [currentBranding]);

  if (isLoading) {
    return (
      <div className="space-y-4" data-ocid="whitelabel.loading_state">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glassmorphism rounded-xl h-20 animate-pulse border border-white/10"
          />
        ))}
      </div>
    );
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await setMutation.mutateAsync({
        partnerName: form.partnerName,
        partnerLogoUrl: form.partnerLogoUrl,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        isActive: form.isActive,
      });
      toast.success("Partner branding saved");
    } catch {
      toast.error("Failed to save branding. Please try again.");
    }
  };

  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync();
      setForm(DEFAULT_FORM);
      toast.success("Branding reset to Open Tip Pay defaults");
    } catch {
      toast.error("Failed to reset branding. Please try again.");
    }
  };

  const isBusy = setMutation.isPending || clearMutation.isPending;
  const canSave = form.partnerName.trim().length > 0;

  return (
    <div className="space-y-6" data-ocid="whitelabel.panel">
      {/* Header */}
      <div className="glassmorphism rounded-2xl border border-teal/20 p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
            <Palette className="h-4 w-4 text-teal" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              White-Label Branding
            </h3>
            <p className="text-xs text-white/40">
              Co-brand Open Tip Pay for a sports team or organization
            </p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="glassmorphism rounded-2xl border border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-teal" />
          <span className="text-sm font-semibold text-white/70">
            Quick Presets
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-ocid={`whitelabel.preset.${preset.id}`}
              onClick={() => setForm({ ...preset.form })}
              className="flex flex-col items-start gap-0.5 rounded-xl bg-white/5 hover:bg-teal/10 border border-white/10 hover:border-teal/30 px-4 py-3 text-left transition-colors"
            >
              <span className="text-sm font-semibold text-white">
                {preset.label}
              </span>
              <span className="text-xs text-white/40">{preset.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form + Preview side-by-side on wider screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="glassmorphism rounded-2xl border border-white/10 p-5 space-y-5">
          {/* Partner Name */}
          <div className="space-y-1.5">
            <Label htmlFor="wl-partner-name" className="text-white/70 text-sm">
              Partner Name
            </Label>
            <Input
              id="wl-partner-name"
              data-ocid="whitelabel.partner_name_input"
              placeholder="Indianapolis Colts"
              value={form.partnerName}
              onChange={(e) => set("partnerName", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10"
              maxLength={60}
            />
            <p className="text-xs text-white/30">
              Displayed as &ldquo;
              <span className="text-white/50">
                {form.partnerName || "Team Name"} Tip Pay
              </span>
              &rdquo;
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5">
            <Label htmlFor="wl-logo-url" className="text-white/70 text-sm">
              Logo URL
            </Label>
            <Input
              id="wl-logo-url"
              data-ocid="whitelabel.logo_url_input"
              placeholder="https://example.com/logo.png"
              value={form.partnerLogoUrl}
              onChange={(e) => set("partnerLogoUrl", e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 font-mono text-sm"
            />
            {form.partnerLogoUrl && (
              <img
                src={form.partnerLogoUrl}
                alt="Logo preview"
                className="mt-2 h-10 rounded-lg object-contain bg-white/5 border border-white/10 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </div>

          {/* Colors */}
          <ColorField
            label="Primary Color"
            value={form.primaryColor}
            ocid="whitelabel.primary_color"
            onChange={(v) => set("primaryColor", v)}
          />
          <ColorField
            label="Secondary Color"
            value={form.secondaryColor}
            ocid="whitelabel.secondary_color"
            onChange={(v) => set("secondaryColor", v)}
          />

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                Enable partner branding
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Activates co-branded UI across the app
              </p>
            </div>
            <Switch
              data-ocid="whitelabel.active_toggle"
              checked={form.isActive}
              onCheckedChange={(v) => set("isActive", v)}
              aria-label="Enable partner branding"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              data-ocid="whitelabel.save_button"
              onClick={handleSave}
              disabled={isBusy || !canSave}
              className="flex-1 bg-teal hover:bg-teal/90 text-navy-dark font-semibold h-10 gap-2"
            >
              {setMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-navy-dark/40 border-t-navy-dark animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Branding
                </span>
              )}
            </Button>
            <Button
              type="button"
              data-ocid="whitelabel.reset_button"
              onClick={handleClear}
              disabled={isBusy}
              variant="outline"
              className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-10 gap-2"
            >
              {clearMutation.isPending ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Reset
            </Button>
          </div>
        </div>

        {/* Preview */}
        <BrandingPreview form={form} />
      </div>
    </div>
  );
}
