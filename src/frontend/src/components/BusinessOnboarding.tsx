import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, QrCode, Users, X } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    icon: Users,
    title: "Add Your Staff",
    description:
      "Head to the Manager Portal and open the Staff tab. You can invite team members by sending them a unique invite link or by entering their phone number directly. Once they accept, they appear on your roster and are ready to receive tips.",
  },
  {
    icon: Building2,
    title: "Assign Sections",
    description:
      "Use the Sections tab to define areas of your business — like tables, floors, or stadium zones. Assigning staff to sections lets the Analytics Dashboard show you which areas generate the most tips and who your top performers are.",
  },
  {
    icon: QrCode,
    title: "Your QR Codes",
    description:
      "Every staff member gets a personal QR code automatically once they're added to your roster. Customers scan the code with any phone camera — no app required — and tip instantly via Apple Pay, Google Pay, or card.",
  },
];

interface BusinessOnboardingProps {
  open: boolean;
  onClose: () => void;
  onOpenManagerPortal?: () => void;
}

export default function BusinessOnboarding({
  open,
  onClose,
  onOpenManagerPortal,
}: BusinessOnboardingProps) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const total = STEPS.length;

  const handleDismiss = () => {
    localStorage.setItem("businessOnboardingDone", "true");
    setStep(0);
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem("businessOnboardingDone", "true");
    setStep(0);
    onOpenManagerPortal?.();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleDismiss();
      }}
    >
      <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground text-base font-bold">
              Business Setup
            </DialogTitle>
            <button
              type="button"
              aria-label="Close"
              data-ocid="business-onboarding.close_button"
              onClick={handleDismiss}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-1" data-ocid="business-onboarding.dialog">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 justify-center">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-8 bg-teal"
                    : i < step
                      ? "w-3 bg-teal/40"
                      : "w-3 bg-muted/50"
                }`}
              />
            ))}
            <span className="ml-2 text-[11px] text-muted-foreground">
              {step + 1}/{total}
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-teal/20 border border-teal/30 flex items-center justify-center">
              <Icon className="h-8 w-8 text-teal" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-2 px-2">
            <h3 className="text-lg font-bold text-foreground">
              {current.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-1">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                data-ocid="business-onboarding.back_button"
                className="flex-1 border-border text-muted-foreground hover:bg-muted/50 text-sm h-10"
              >
                Back
              </Button>
            )}
            {isLast ? (
              <Button
                type="button"
                onClick={handleFinish}
                data-ocid="business-onboarding.open_portal_button"
                className="flex-1 bg-gradient-to-r from-teal to-teal/80 hover:from-teal/90 hover:to-teal/70 text-navy font-bold text-sm h-10 shadow-lg shadow-teal/30"
              >
                Open Manager Portal
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                data-ocid="business-onboarding.next_button"
                className="flex-1 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-foreground font-semibold text-sm h-10 transition-all duration-200"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
