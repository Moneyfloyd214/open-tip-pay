import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Check,
  CheckCircle,
  Copy,
  Laptop,
  Shield,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

const RECOVERY_WORDS = [
  "solar",
  "bridge",
  "lamp",
  "frost",
  "cargo",
  "veil",
  "orbit",
  "creek",
  "drift",
  "amber",
  "torch",
  "glade",
];

interface RecoverySetupPageProps {
  onComplete: () => void;
}

export default function RecoverySetupPage({
  onComplete,
}: RecoverySetupPageProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmed, setConfirmed] = useState(false);
  const [showBackupInfo, setShowBackupInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPhrase = async () => {
    const phrase = RECOVERY_WORDS.join(" ");
    try {
      await navigator.clipboard.writeText(phrase);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = phrase;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStep1Continue = () => {
    if (!confirmed) return;
    setStep(2);
  };

  const handleAddDevice = () => {
    setShowBackupInfo(true);
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDoneBackup = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-5 py-8 overflow-y-auto">
      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-0 h-[350px] w-[350px] rounded-full bg-teal/8 blur-[90px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-teal/6 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <img
            src="/assets/generated/opentip-logo.dim_200x200.png"
            alt="Open Tip Pay"
            className="h-12 w-12 rounded-2xl shadow-xl ring-2 ring-teal/30"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <p className="text-base font-bold text-white tracking-wide">
            Open Tip Pay
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest">
            Step {step} of 2
          </p>
          <div className="flex w-32 gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-teal" />
            <div
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 2 ? "bg-teal" : "bg-white/15"}`}
            />
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div
            className="glassmorphism rounded-2xl border border-teal/25 p-5 flex flex-col gap-5"
            data-ocid="recovery.step1.card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 shrink-0">
                <Shield className="h-5 w-5 text-teal" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Protect Your Account
                </h1>
                <p className="text-xs text-white/55 mt-0.5">
                  Save your recovery phrase
                </p>
              </div>
            </div>

            {/* Recovery phrase grid */}
            <div
              className="rounded-xl border border-teal/30 bg-card/80 p-4"
              data-ocid="recovery.phrase_box"
            >
              <div className="grid grid-cols-3 gap-2">
                {RECOVERY_WORDS.map((word, i) => (
                  <div
                    key={word}
                    className="flex items-center gap-1.5 rounded-lg bg-teal/10 px-2.5 py-1.5 border border-teal/20"
                  >
                    <span className="text-[10px] font-mono text-teal/60 w-4 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy phrase button */}
            <Button
              type="button"
              className={`w-full h-11 text-sm font-semibold rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 ${
                copied
                  ? "border-teal bg-teal/20 text-teal"
                  : "border-teal/40 bg-teal/10 text-teal hover:bg-teal/20 hover:border-teal/60 active:scale-95"
              }`}
              onClick={handleCopyPhrase}
              data-ocid="recovery.copy_phrase_button"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Phrase
                </>
              )}
            </Button>

            {/* Required warning message */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <p className="text-xs text-amber-300 leading-relaxed">
                Copy and save in phone or write it down — if you lose your
                phone, this is the only way to get back into your account.
              </p>
            </div>

            {/* Confirmation checkbox */}
            <div
              className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 cursor-pointer"
              onClick={() => setConfirmed((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setConfirmed((v) => !v);
              }}
              data-ocid="recovery.confirm_checkbox"
            >
              <Checkbox
                id="recovery-confirm"
                checked={confirmed}
                onCheckedChange={(val) => setConfirmed(!!val)}
                className="mt-0.5 border-teal/50 data-[state=checked]:bg-teal data-[state=checked]:border-teal shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor="recovery-confirm"
                className="text-xs text-white/80 leading-relaxed cursor-pointer select-none"
              >
                I've written down my recovery phrase and stored it safely
              </label>
            </div>

            {/* Continue button — disabled until confirmed */}
            <Button
              className={`w-full h-12 text-sm font-bold rounded-xl transition-all duration-200 ${
                confirmed
                  ? "bg-teal text-navy shadow-lg shadow-teal/30 hover:bg-teal/90 hover:scale-[1.02] active:scale-95"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
              disabled={!confirmed}
              onClick={handleStep1Continue}
              data-ocid="recovery.step1.continue_button"
            >
              {confirmed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Continue
                </span>
              ) : (
                "Continue"
              )}
            </Button>

            <p className="text-center text-[11px] text-white/30">
              You must confirm before continuing
            </p>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div
            className="glassmorphism rounded-2xl border border-teal/25 p-5 flex flex-col gap-5"
            data-ocid="recovery.step2.card"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 shrink-0">
                <Laptop className="h-5 w-5 text-teal" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Add a Backup Device
                </h1>
                <p className="text-xs text-white/55 mt-0.5">
                  Extra protection for your account
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-white/75 leading-relaxed">
                Add your laptop or tablet as a backup way to sign in. If you
                ever lose your phone, you can recover your account from another
                device.
              </p>
            </div>

            {/* Backup device info panel */}
            {showBackupInfo && (
              <div
                className="rounded-xl border border-teal/30 bg-teal/10 p-4"
                data-ocid="recovery.backup_info"
              >
                <div className="flex items-start gap-3">
                  <Smartphone className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-teal">
                      To add a backup device:
                    </p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Open Open Tip Pay on your other device and sign in with
                      the same Internet Identity. Both devices will then be
                      linked.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {!showBackupInfo ? (
                <Button
                  className="w-full h-12 text-sm font-bold rounded-xl bg-teal text-navy shadow-lg shadow-teal/30 hover:bg-teal/90 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  onClick={handleAddDevice}
                  data-ocid="recovery.add_device_button"
                >
                  <Laptop className="h-4 w-4 mr-2" />
                  Add Backup Device
                </Button>
              ) : (
                <Button
                  className="w-full h-12 text-sm font-bold rounded-xl bg-teal text-navy shadow-lg shadow-teal/30 hover:bg-teal/90 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  onClick={handleDoneBackup}
                  data-ocid="recovery.done_button"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Done — Go to Dashboard
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full h-11 text-sm rounded-xl border-white/20 text-white/60 bg-transparent hover:bg-muted/30 hover:text-white/80 transition-all duration-200"
                onClick={handleSkip}
                data-ocid="recovery.skip_button"
              >
                Skip for now
              </Button>
            </div>

            <p className="text-center text-[11px] text-white/30">
              You can add a backup device later in Settings → Security
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
