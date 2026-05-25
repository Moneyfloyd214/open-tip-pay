import { Heart, Shield, Users, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { useBranding } from "../context/BrandingContext";

interface Slide {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    id: "slide-welcome",
    icon: <Wallet className="h-12 w-12" />,
    title: "Welcome to Open Tip Pay",
    subtitle:
      "The faster way to send money, pay friends, and reward great service — all in one app.",
    cta: "Get Started",
  },
  {
    id: "slide-sendmoney",
    icon: <Zap className="h-12 w-12" />,
    title: "Send Money in Seconds",
    subtitle:
      "Pay friends, split bills, or send cash to anyone — no bank visit, no delays, no cash needed.",
    cta: "Next",
  },
  {
    id: "slide-service",
    icon: <Heart className="h-12 w-12" />,
    title: "Reward Great Service",
    subtitle:
      "Scan a QR code and tip your server, driver, or vendor in one tap — even if you don't carry cash.",
    cta: "Next",
  },
  {
    id: "slide-everyone",
    icon: <Users className="h-12 w-12" />,
    title: "For People. For Business. For Teams.",
    subtitle:
      "Whether you're splitting dinner, paying staff, or managing a business — Open Tip Pay handles it all.",
    cta: "Next",
  },
  {
    id: "slide-security",
    icon: <Shield className="h-12 w-12" />,
    title: "Your Money is Protected",
    subtitle:
      "Bank-level encryption, Vault Lock, and two-factor security keep every dollar safe.",
    cta: "Get My Account",
  },
];

interface OnboardingSlidesProps {
  onComplete: () => void;
}

export default function OnboardingSlides({
  onComplete,
}: OnboardingSlidesProps) {
  const { brandName, poweredByText } = useBranding();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const goTo = (index: number, dir: "forward" | "back" = "forward") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 220);
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1, "forward");
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Dynamically override slide 0 title with partner brand name
  const slides = SLIDES.map((s, i) =>
    i === 0 ? { ...s, title: `Welcome to ${brandName}` } : s,
  );
  const slide = slides[current];

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10"
      data-ocid="onboarding.slides"
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/4 translate-y-1/4 rounded-full bg-teal/5 blur-[80px]" />
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute right-5 top-5 z-20 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground/80"
        data-ocid="onboarding.skip_button"
        aria-label="Skip onboarding"
      >
        Skip
      </button>

      {/* Slide card */}
      <div
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating
            ? `translateX(${direction === "forward" ? "-20px" : "20px"})`
            : "translateX(0)",
          transition: "opacity 220ms ease, transform 220ms ease",
        }}
      >
        {/* Branding header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-bold tracking-tight text-teal">
            {brandName}
          </span>
          {poweredByText ? (
            <span className="text-xs font-medium text-muted-foreground/60">
              {poweredByText}
            </span>
          ) : null}
        </div>

        {/* Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-teal/20 bg-teal/10 shadow-lg shadow-teal/10 text-teal">
          {slide.icon}
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold leading-snug text-foreground">
            {slide.title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {slide.subtitle}
          </p>
        </div>

        {/* Dot indicators */}
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Slide progress"
          data-ocid="onboarding.dot_indicators"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              onClick={() => goTo(i, i > current ? "forward" : "back")}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                background:
                  i === current ? "oklch(var(--teal))" : "oklch(1 0 0 / 20%)",
              }}
              data-ocid={`onboarding.dot.${i + 1}`}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-2xl bg-teal px-6 py-4 text-base font-bold text-navy shadow-lg shadow-teal/25 transition-all duration-200 hover:scale-[1.02] hover:bg-teal-dark active:scale-[0.98]"
          data-ocid="onboarding.cta_button"
        >
          {slide.cta}
        </button>
      </div>
    </div>
  );
}
