import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  DollarSign,
  Handshake,
  QrCode,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

const BENEFITS = [
  {
    icon: Users,
    title: "Manager Portal",
    description:
      "Manage your entire team from one place — staff roster, payouts, and tip pooling in a single dashboard.",
  },
  {
    icon: QrCode,
    title: "Staff QR Codes",
    description:
      "Every staff member gets a personal QR code so customers can tip them instantly — no app required.",
  },
  {
    icon: Zap,
    title: "Tip Pooling",
    description:
      "Automatically split tips fairly among your team with configurable rules and instant payout distribution.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track tip volume by staff member, section, and time period with game-by-game or shift breakdowns.",
  },
  {
    icon: DollarSign,
    title: "Direct Deposit for Staff",
    description:
      "Pay your team directly through the app. Staff receive funds to their Open Tip Pay balance instantly.",
  },
  {
    icon: Briefcase,
    title: "Low Business Fees",
    description:
      "Just 2.6% + $0.15 per transaction. No monthly fees, no hidden costs — only pay when you get paid.",
  },
];

export default function BusinessLandingPage({
  onApply,
}: { onApply: () => void }) {
  return (
    <div className="space-y-6 pb-6" data-ocid="business-landing-page">
      {/* Hero */}
      <div className="text-center space-y-3 pt-2">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-teal/20 border border-teal/30 flex items-center justify-center">
          <Briefcase className="h-7 w-7 text-teal" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Upgrade to Business
        </h2>
        <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
          Unlock professional tools for managing tips, staff, and payments
          across your entire organization.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 gap-3">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="flex items-start gap-3 glassmorphism rounded-xl p-4 border border-teal/15 hover:border-teal/30 transition-all duration-200"
            >
              <div className="h-9 w-9 rounded-lg bg-teal/15 border border-teal/20 flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-teal" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {benefit.title}
                </p>
                <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <Button
        data-ocid="business-landing-apply-btn"
        onClick={onApply}
        className="w-full bg-gradient-to-r from-teal to-teal/80 hover:from-teal/90 hover:to-teal/70 text-navy font-bold text-sm h-11 shadow-lg shadow-teal/30 transition-all duration-300 hover:shadow-teal/50 hover:scale-[1.01]"
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Apply for Business Account
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>

      <p className="text-center text-[11px] text-muted-foreground/50">
        For restaurants, shops, and service businesses. Apply in minutes.
      </p>

      {/* Partner Section */}
      <PartnerWithUsSection />
    </div>
  );
}

// ── PartnerWithUsSection ──────────────────────────────────────────────────────
const ORG_TYPES = [
  "NFL Team",
  "NBA Team",
  "MLB Team",
  "NHL Team",
  "MLS Team",
  "Sports Venue",
  "Stadium / Arena",
  "Enterprise / Corporate",
  "Other",
] as const;

function PartnerWithUsSection() {
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contactName.trim() || !email.trim() || !orgType)
      return;

    const inquiries: object[] = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("partnershipInquiries") ?? "[]",
        ) as object[];
      } catch {
        return [];
      }
    })();

    inquiries.push({
      id: Date.now().toString(),
      orgName: orgName.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      orgType,
      submittedAt: new Date().toISOString(),
      contacted: false,
    });

    localStorage.setItem("partnershipInquiries", JSON.stringify(inquiries));
    setSubmitted(true);
  };

  return (
    <div className="mt-4">
      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-muted/50" />
        <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">
          Large Organizations
        </span>
        <div className="flex-1 h-px bg-muted/50" />
      </div>

      <div className="glassmorphism rounded-2xl p-5 border border-teal/20 bg-teal/3 space-y-4">
        {/* Heading */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center shrink-0">
            <Handshake className="h-5 w-5 text-teal" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              Sports Team or Large Organization?
            </h3>
            <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
              We offer custom white-label partnerships for teams, venues, and
              enterprises. Your fans get a branded experience. Your staff get
              smart tip tracking.
            </p>
          </div>
        </div>

        {submitted ? (
          <div
            className="flex flex-col items-center gap-2 py-4"
            data-ocid="partner-success-state"
          >
            <CheckCircle2 className="h-9 w-9 text-teal" />
            <p className="text-sm font-semibold text-foreground">Thank you!</p>
            <p className="text-xs text-white/55 text-center">
              We'll be in touch within 48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Organization Name
              </Label>
              <Input
                data-ocid="partner-org-name-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Indianapolis Colts"
                required
                className="bg-muted/30 border-border text-white placeholder:text-white/30 h-9 text-sm focus:border-teal/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Contact Name
              </Label>
              <Input
                data-ocid="partner-contact-name-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your full name"
                required
                className="bg-muted/30 border-border text-white placeholder:text-white/30 h-9 text-sm focus:border-teal/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                data-ocid="partner-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourorganization.com"
                required
                className="bg-muted/30 border-border text-white placeholder:text-white/30 h-9 text-sm focus:border-teal/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Organization Type
              </Label>
              <select
                data-ocid="partner-org-type-select"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                required
                className="w-full h-9 rounded-md bg-muted/30 border border-border text-white text-sm px-3 focus:outline-none focus:border-teal/50 transition-colors"
              >
                <option
                  value=""
                  disabled
                  className="bg-background text-white/40"
                >
                  Select organization type…
                </option>
                {ORG_TYPES.map((t) => (
                  <option
                    key={t}
                    value={t}
                    className="bg-background text-foreground"
                  >
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              data-ocid="partner-submit-btn"
              className="w-full bg-gradient-to-r from-teal/80 to-teal/60 hover:from-teal/90 hover:to-teal/70 text-navy font-bold text-sm h-10 shadow-md shadow-teal/20 transition-all duration-300 hover:shadow-teal/40 mt-1"
            >
              <Handshake className="h-4 w-4 mr-2" />
              Submit Partnership Inquiry
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
