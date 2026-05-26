import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Globe,
  MonitorSmartphone,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerInquiry {
  id: string;
  orgName: string;
  contactName: string;
  email: string;
  orgType: string;
  message: string;
  timestamp: string;
  status: "pending";
}

interface FormState {
  orgName: string;
  contactName: string;
  email: string;
  orgType: string;
  message: string;
}

interface FormErrors {
  orgName?: string;
  contactName?: string;
  email?: string;
  orgType?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ORG_TYPES = [
  "NFL Team",
  "NBA Team",
  "MLB Team",
  "NHL Team",
  "MLS Team",
  "Arena / Venue",
  "Corporate Event",
  "Other",
];

const BENEFITS = [
  {
    icon: Globe,
    title: "White-Label Branding",
    description:
      "Your logo, your colors, your name — everywhere. Fans see 'Colts Tip Pay powered by Open Tip Pay', not a generic app.",
  },
  {
    icon: Star,
    title: "Fan Points Loyalty Engine",
    description:
      "Fractional point engine with section multipliers, merchant bonuses, and card-linked rewards. Turn every transaction into loyalty.",
  },
  {
    icon: Zap,
    title: "Instant Tipping Infrastructure",
    description:
      "Staff QR badge tipping, stand pool collection, automated split engine. Tips reach staff wallets in real time.",
  },
  {
    icon: ShoppingCart,
    title: "In-Seat Food Ordering",
    description:
      "Fans browse the digital menu, pay, and track their order by seat. Kitchen display + delivery routing included.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Live operations dashboard: sales per stand, peak times, staffing alerts, and multi-game benchmark comparisons.",
  },
  {
    icon: Cpu,
    title: "POS Integration",
    description:
      "Connects to Toast, Square, and SkyTab. Tips auto-populate from register closings — no manager data entry needed.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "We Brand It For You",
    description:
      "We configure the app with your team's name, colors, and logo in under a week. Every screen reflects your brand identity.",
    icon: Sparkles,
  },
  {
    number: "02",
    title: "Your Fans & Staff Use It",
    description:
      "Fans tip staff via QR codes, order food in-seat, earn points everywhere they spend. Staff check in, track earnings, get paid.",
    icon: MonitorSmartphone,
  },
  {
    number: "03",
    title: "You Get Data & Payouts",
    description:
      "Real-time ops dashboard, game-by-game analytics, automated payouts, and compliance-ready exports. Full visibility, zero overhead.",
    icon: TrendingUp,
  },
];

const COLTS_STATS = [
  { value: "$48,200", label: "Tips Processed Last Game" },
  { value: "127,400", label: "Fan Points Earned" },
  { value: "3,840", label: "In-Seat Orders" },
  { value: "94%", label: "Staff Satisfaction Rate" },
];

// ─── Nav ──────────────────────────────────────────────────────────────────────
function PartnerNav({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "frosted-glass border-b border-teal/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 group"
          aria-label="Open Tip Pay home"
        >
          <img
            src="/assets/generated/opentip-logo.dim_200x200.png"
            alt="Open Tip Pay"
            className="h-8 w-8 rounded-xl shadow-md ring-1 ring-teal/20 transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-sm font-bold text-foreground sm:text-base">
            Open Tip Pay
          </span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-teal sm:inline-block"
            data-ocid="partner.back_to_app_link"
          >
            ← Back to App
          </a>
          <button
            type="button"
            onClick={onGetStarted}
            className="partner-cta-button px-4 py-2 text-sm"
            data-ocid="partner.nav_get_started_button"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({
  onExplore,
  onContact,
}: { onExplore: () => void; onContact: () => void }) {
  return (
    <section
      className="partner-hero-bg relative flex min-h-screen items-center justify-center overflow-hidden pt-16"
      data-ocid="partner.hero_section"
    >
      {/* Background image */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "url('/assets/generated/partner-hero-bg.dim_1200x600.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
        }}
        aria-hidden="true"
      />
      {/* Ambient orbs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-teal/8 blur-[120px]" />
        <div className="absolute -right-32 bottom-20 h-80 w-80 rounded-full bg-teal/6 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/5 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-teal">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal" />
          White-Label Sports Payments
        </div>

        {/* Headline */}
        <h1 className="fade-in-up mb-6 text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Power Your Stadium
          <br />
          <span className="text-teal">With White-Label Payments</span>
        </h1>

        {/* Subheading */}
        <p className="fade-in-up mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Give your fans, staff, and operations team a fully branded payment and
          loyalty platform — tipping, food ordering, Fan Points, and real-time
          analytics — all powered by Open Tip Pay under your name.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onExplore}
            className="partner-cta-button w-full px-8 py-3.5 text-base font-bold sm:w-auto"
            data-ocid="partner.hero_explore_button"
          >
            Explore Partnership
            <ChevronRight className="ml-1 inline-block h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onContact}
            className="w-full rounded-lg border border-teal/30 bg-teal/5 px-8 py-3.5 text-base font-semibold text-teal transition-all duration-200 hover:border-teal/50 hover:bg-teal/10 sm:w-auto"
            data-ocid="partner.hero_contact_button"
          >
            Contact Us
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { stat: "3×", label: "Faster Staff Payouts" },
            { stat: "48%", label: "More Fan Engagement" },
            { stat: "Real-Time", label: "Analytics Dashboard" },
            { stat: "Zero", label: "POS Manual Entry" },
          ].map((item) => (
            <div key={item.label} className="partner-highlight text-center">
              <div className="partner-highlight-stat">{item.stat}</div>
              <div className="partner-highlight-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────
function BenefitsSection() {
  return (
    <section
      className="relative bg-background py-20"
      id="benefits"
      data-ocid="partner.benefits_section"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="section-header mb-3">Why Partner</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Unlock the Power of Open Tip Pay
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything a modern stadium needs — branded, deployed, and running
            in weeks.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className="partner-benefit-card"
                data-ocid={`partner.benefit_card.${benefit.title.toLowerCase().replace(/\s+/g, "_")}`}
              >
                <div className="partner-benefit-icon">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="partner-benefit-title">{benefit.title}</h3>
                <p className="partner-benefit-description">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section
      className="relative py-20"
      style={{ background: "rgba(26, 43, 60, 0.2)" }}
      id="how-it-works"
      data-ocid="partner.how_it_works_section"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="section-header mb-3">How It Works</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Up and Running in Weeks,
            <span className="text-teal"> Not Months</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                {/* Connector line (desktop only) */}
                {i < STEPS.length - 1 && (
                  <div
                    className="pointer-events-none absolute left-[calc(50%+4rem)] top-8 hidden h-px w-[calc(100%_-_2rem)] bg-gradient-to-r from-teal/40 to-transparent md:block"
                    aria-hidden="true"
                  />
                )}
                <div className="mb-5 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-teal/30 bg-teal/10 shadow-lg shadow-teal/10">
                      <Icon className="h-7 w-7 text-teal" aria-hidden="true" />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[10px] font-black text-navy">
                      {step.number}
                    </span>
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Colts Showcase ───────────────────────────────────────────────────────────
function ColtsShowcaseSection() {
  return (
    <section
      className="relative bg-background py-20"
      id="showcase"
      data-ocid="partner.showcase_section"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="section-header mb-3">Live Example</p>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            See It In Action:
            <span className="text-teal"> Colts Tip Pay</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Already running at Lucas Oil Stadium — powered by Open Tip Pay.
          </p>
        </div>

        {/* Colts brand showcase card */}
        <div className="overflow-hidden rounded-2xl border border-teal/20 glassmorphism">
          {/* Header bar */}
          <div
            className="flex items-center gap-4 border-b border-white/10 px-6 py-4"
            style={{ background: "rgba(0, 36, 94, 0.6)" }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl font-black"
              style={{ background: "rgba(255, 255, 255, 0.08)" }}
              aria-hidden="true"
            >
              🐴
            </div>
            <div>
              <p className="font-bold text-foreground">Colts Tip Pay</p>
              <p className="text-xs text-muted-foreground">
                powered by Open Tip Pay
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-0.5 text-xs font-semibold text-success">
                <Activity className="h-2.5 w-2.5" aria-hidden="true" />
                Live
              </span>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-xs font-semibold text-gold">
                NFL · Lucas Oil
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px bg-white/5 md:grid-cols-4">
            {COLTS_STATS.map((s) => (
              <div
                key={s.label}
                className="bg-navy px-5 py-6 text-center"
                data-ocid={`partner.colts_stat.${s.label.toLowerCase().replace(/\s+/g, "_")}`}
              >
                <div className="text-2xl font-black text-teal sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 px-6 py-5">
            {[
              "Fan Points Engine",
              "QR Badge Tipping",
              "In-Seat Ordering",
              "Real-Time Analytics",
              "POS Integration",
              "Volunteer Org Routing",
              "Blended Payouts",
              "3rd Quarter Cutoff",
            ].map((feat) => (
              <span
                key={feat}
                className="flex items-center gap-1 rounded-full border border-teal/20 bg-teal/8 px-3 py-1 text-xs font-medium text-teal"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                {feat}
              </span>
            ))}
          </div>

          {/* Mini dashboard mockup */}
          <div className="grid grid-cols-1 gap-4 border-t border-white/5 p-6 sm:grid-cols-3">
            <div className="col-span-1 rounded-xl border border-white/8 bg-navy-light p-4 sm:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-teal/70">
                Live Stand Performance
              </p>
              <div className="space-y-2">
                {[
                  { stand: "Club Level Bar", amount: "$12,400", pct: 92 },
                  { stand: "Lucas Oil Grill", amount: "$9,800", pct: 76 },
                  { stand: "End Zone Bites", amount: "$7,200", pct: 58 },
                  { stand: "Colts Fan Eats", amount: "$5,100", pct: 42 },
                ].map((row) => (
                  <div key={row.stand} className="flex items-center gap-3">
                    <span className="w-32 truncate text-xs text-muted-foreground">
                      {row.stand}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-2 rounded-full bg-teal"
                        style={{ width: `${row.pct}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-bold text-foreground">
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gold/20 bg-navy-light p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gold/70">
                Fan Points Earned
              </p>
              <div className="space-y-2">
                {[
                  { label: "Card-Linked", pts: "84,200" },
                  { label: "In-App Tips", pts: "28,400" },
                  { label: "Food Orders", pts: "14,800" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="text-sm font-bold text-gold">
                      {row.pts}
                    </span>
                  </div>
                ))}
                <div className="mt-3 rounded-lg border border-gold/20 bg-gold/5 p-2 text-center">
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="text-lg font-black text-gold">127,400 pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card-link callout */}
        <div className="mt-6 rounded-xl border border-teal/20 bg-teal/5 p-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal/30 bg-teal/10">
              <Activity className="h-5 w-5 text-teal" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                Fans Earn Points Everywhere in the Stadium
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Link a card once — earn Fan Points at concessions, valet,
                parking, the pro shop, ticketing upgrades, and every other
                vendor. No app required at point of purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Inquiry Form ─────────────────────────────────────────────────────────────
function InquiryFormSection({
  formRef,
}: { formRef: React.RefObject<HTMLElement | null> }) {
  const [form, setForm] = useState<FormState>({
    orgName: "",
    contactName: "",
    email: "",
    orgType: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.orgName.trim()) e.orgName = "Organization name is required";
    if (!form.contactName.trim()) e.contactName = "Contact name is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }
    if (!form.orgType) e.orgType = "Please select an organization type";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const inquiry: PartnerInquiry = {
      id: `partner-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orgName: form.orgName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      orgType: form.orgType,
      message: form.message.trim(),
      timestamp: new Date().toISOString(),
      status: "pending",
    };
    try {
      const existing: PartnerInquiry[] = JSON.parse(
        localStorage.getItem("partnershipInquiries") ?? "[]",
      );
      localStorage.setItem(
        "partnershipInquiries",
        JSON.stringify([...existing, inquiry]),
      );
    } catch {
      // localStorage unavailable — graceful degradation
    }
    setSubmitted(true);
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    onBlur: () => setErrors((prev) => ({ ...prev, [key]: undefined })),
  });

  return (
    <section
      ref={formRef as React.RefObject<HTMLElement>}
      id="inquiry-form"
      className="relative py-20"
      style={{ background: "rgba(26, 43, 60, 0.25)" }}
      data-ocid="partner.form_section"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {!submitted ? (
          <>
            <div className="mb-10 text-center">
              <p className="section-header mb-3">Get In Touch</p>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Ready to Partner
                <span className="text-teal"> With Us?</span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Tell us about your organization and we'll reach out within 24
                hours.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="partner-cta-container space-y-5"
              data-ocid="partner.inquiry_form"
            >
              {/* Org Name */}
              <div>
                <label htmlFor="orgName" className="partner-form-label">
                  Organization Name <span className="text-teal">*</span>
                </label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="e.g. Indianapolis Colts"
                  className="partner-form-input"
                  autoComplete="organization"
                  data-ocid="partner.org_name_input"
                  aria-describedby={
                    errors.orgName ? "orgName-error" : undefined
                  }
                  aria-invalid={!!errors.orgName}
                  {...field("orgName")}
                />
                {errors.orgName && (
                  <p
                    id="orgName-error"
                    className="mt-1 text-xs text-destructive"
                    data-ocid="partner.org_name_field_error"
                  >
                    {errors.orgName}
                  </p>
                )}
              </div>

              {/* Contact Name */}
              <div>
                <label htmlFor="contactName" className="partner-form-label">
                  Contact Name <span className="text-teal">*</span>
                </label>
                <input
                  id="contactName"
                  type="text"
                  placeholder="Your full name"
                  className="partner-form-input"
                  autoComplete="name"
                  data-ocid="partner.contact_name_input"
                  aria-describedby={
                    errors.contactName ? "contactName-error" : undefined
                  }
                  aria-invalid={!!errors.contactName}
                  {...field("contactName")}
                />
                {errors.contactName && (
                  <p
                    id="contactName-error"
                    className="mt-1 text-xs text-destructive"
                    data-ocid="partner.contact_name_field_error"
                  >
                    {errors.contactName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="partner-form-label">
                  Email Address <span className="text-teal">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@yourorg.com"
                  className="partner-form-input"
                  autoComplete="email"
                  data-ocid="partner.email_input"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                  {...field("email")}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    className="mt-1 text-xs text-destructive"
                    data-ocid="partner.email_field_error"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Org Type */}
              <div>
                <label htmlFor="orgType" className="partner-form-label">
                  Organization Type <span className="text-teal">*</span>
                </label>
                <select
                  id="orgType"
                  className="partner-form-input"
                  data-ocid="partner.org_type_select"
                  aria-describedby={
                    errors.orgType ? "orgType-error" : undefined
                  }
                  aria-invalid={!!errors.orgType}
                  {...field("orgType")}
                >
                  <option value="" disabled>
                    Select your organization type
                  </option>
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.orgType && (
                  <p
                    id="orgType-error"
                    className="mt-1 text-xs text-destructive"
                    data-ocid="partner.org_type_field_error"
                  >
                    {errors.orgType}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="partner-form-label">
                  Message{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your venue, fan base, or what you're looking for…"
                  className="partner-form-input resize-none"
                  data-ocid="partner.message_textarea"
                  {...field("message")}
                />
              </div>

              <button
                type="submit"
                className="partner-cta-button w-full py-3.5 text-base font-bold"
                data-ocid="partner.submit_button"
              >
                Submit Partnership Inquiry
              </button>
            </form>
          </>
        ) : (
          <div
            className="partner-cta-container text-center"
            data-ocid="partner.form_success_state"
          >
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <CheckCircle2
                className="h-8 w-8 text-success"
                aria-hidden="true"
              />
            </div>
            <h3 className="partner-cta-title">We Got Your Inquiry!</h3>
            <p className="partner-cta-subtitle">
              Thanks,{" "}
              <strong className="text-foreground">{form.contactName}</strong>!
              Someone from the Open Tip Pay partnerships team will reach out to
              <strong className="text-teal"> {form.email}</strong> within 24
              hours.
            </p>
            <div className="mb-6 rounded-xl border border-teal/20 bg-teal/5 px-6 py-4 text-left">
              <p className="mb-2 text-sm font-bold text-foreground">
                What to expect next:
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-teal"
                    aria-hidden="true"
                  />
                  A brief discovery call to understand your needs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-teal"
                    aria-hidden="true"
                  />
                  A custom demo with your branding applied
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-teal"
                    aria-hidden="true"
                  />
                  A deployment timeline and pricing proposal
                </li>
              </ul>
            </div>
            <a
              href="/"
              className="partner-cta-button inline-block"
              data-ocid="partner.success_back_to_app_link"
            >
              Explore the Live Demo →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function PartnerFooter() {
  return (
    <footer
      className="border-t border-white/8 bg-navy py-8"
      data-ocid="partner.footer"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Open Tip Pay. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/" className="transition-colors hover:text-teal">
            Back to App
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-teal"
          >
            Built with caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PartnerWithUsPage() {
  const formRef = useRef<HTMLElement | null>(null);
  const benefitsRef = useRef<HTMLElement | null>(null);

  // Force dark mode on this standalone public page
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const scrollToBenefits = () =>
    benefitsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-ocid="partner.page"
    >
      <PartnerNav onGetStarted={scrollToForm} />

      <main>
        <HeroSection onExplore={scrollToBenefits} onContact={scrollToForm} />

        <div ref={benefitsRef as React.RefObject<HTMLDivElement>}>
          <BenefitsSection />
        </div>

        <HowItWorksSection />
        <ColtsShowcaseSection />

        <InquiryFormSection formRef={formRef} />
      </main>

      <PartnerFooter />
    </div>
  );
}
