import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Lock,
  Shield,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useStartWithdrawalOTPChallenge,
  useVerifyWithdrawalOTP,
} from "../hooks/useQueries";

type WithdrawalType = "standard" | "instant";

interface Withdrawal2FAVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: bigint;
  withdrawalType?: WithdrawalType;
  onVerified: (challengeId: string) => void;
  onCancel: () => void;
}

function calcInstantFee(amountDollars: number): number {
  return Math.max(0.25, amountDollars * 0.015);
}

export default function Withdrawal2FAVerificationDialog({
  open,
  onOpenChange,
  amount,
  withdrawalType = "standard",
  onVerified,
  onCancel,
}: Withdrawal2FAVerificationDialogProps) {
  const [step, setStep] = useState<"pin" | "otp">("pin");
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [phoneSuffix, setPhoneSuffix] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const startChallenge = useStartWithdrawalOTPChallenge();
  const verifyOTP = useVerifyWithdrawalOTP();

  const amountDollars = Number(amount) / 100;
  const instantFee = calcInstantFee(amountDollars);
  const instantReceive = Math.max(0, amountDollars - instantFee);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep("pin");
      setPin("");
      setOtp("");
      setChallengeId(null);
      setPhoneSuffix(null);
      setTimeRemaining(0);
    }
  }, [open]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (step !== "otp" || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          toast.error("OTP expired. Please try again.");
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timeRemaining]);

  // Close dialog when time runs out
  useEffect(() => {
    if (step === "otp" && timeRemaining === 0 && challengeId !== null) {
      onCancel();
      onOpenChange(false);
    }
  }, [timeRemaining, step, challengeId, onCancel, onOpenChange]);

  const handleSubmitPIN = async () => {
    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    try {
      const challenge = await startChallenge.mutateAsync({ amount });
      setChallengeId(challenge.challengeId);
      setPhoneSuffix(challenge.phoneSuffix);
      setTimeRemaining(challenge.expiresIn);
      setStep("otp");
      toast.success(`Verification code sent to ...${challenge.phoneSuffix}`);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Failed to start verification. Please try again.";
      toast.error(msg);
      setPin("");
    }
  };

  const handleSubmitOTP = async () => {
    if (!/^\d{6}$/.test(otp) && !/^\d{4}$/.test(otp)) {
      toast.error("Please enter the complete OTP code");
      return;
    }

    if (!challengeId) {
      toast.error("No active challenge. Please restart verification.");
      return;
    }

    try {
      const verified = await verifyOTP.mutateAsync({ challengeId, otp });

      if (verified) {
        toast.success("2FA verification successful!");
        onVerified(challengeId);
        onOpenChange(false);
      } else {
        toast.error("Invalid OTP. Please try again.");
        setOtp("");
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "OTP verification failed.";

      if (
        msg.toLowerCase().includes("locked") ||
        msg.toLowerCase().includes("15 minutes")
      ) {
        toast.error(
          "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.",
        );
        onCancel();
        onOpenChange(false);
        return;
      }

      toast.error(msg);
      setOtp("");
    }
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-teal/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal" />
            2FA Withdrawal Verification
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {step === "pin"
              ? "Enter your 4-digit security PIN to initiate verification."
              : `Enter the SMS code sent to your phone ending in ...${phoneSuffix ?? "????"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Withdrawal Type Summary Banner */}
          <div
            data-ocid="withdrawal.2fa.fee_summary"
            className={`flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs ${
              withdrawalType === "instant"
                ? "bg-teal/10 border-teal/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            <Info
              className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                withdrawalType === "instant" ? "text-teal" : "text-emerald-400"
              }`}
            />
            {withdrawalType === "instant" ? (
              <div className="space-y-0.5 flex-1">
                <p className="text-teal font-medium">Instant withdrawal</p>
                <p className="text-white/50">
                  ~${instantFee.toFixed(2)} fee applied · You receive{" "}
                  <span className="text-white/80 font-medium">
                    ${instantReceive.toFixed(2)}
                  </span>
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 flex-1">
                <p className="text-emerald-400 font-medium">
                  Standard withdrawal — Free
                </p>
                <p className="text-white/50">
                  Arrives in 1–3 business days · No fee
                </p>
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="glassmorphism p-4 rounded-lg border border-teal/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Withdrawal Amount:</span>
              <span className="text-lg font-bold text-white">
                ${amountDollars.toFixed(2)}
              </span>
            </div>
          </div>

          {/* PIN Step */}
          {step === "pin" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-navy-dark/50 border border-white/10">
                <Lock className="h-4 w-4 text-teal" />
                <p className="text-xs text-white/80">
                  Step 1 of 2: Enter your security PIN
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm text-white">
                  Security PIN
                </Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="bg-navy-dark/50 border-white/10 text-white text-center text-2xl tracking-widest"
                  autoFocus
                  data-ocid="withdrawal-2fa-pin-input"
                />
              </div>

              {startChallenge.isError && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-red-500">
                    Invalid PIN. Please try again.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/10 border border-teal/30">
                <CheckCircle className="h-4 w-4 text-teal" />
                <p className="text-xs text-teal">
                  PIN verified! Now enter your SMS code.
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-navy-dark/50 border border-white/10">
                <Smartphone className="h-4 w-4 text-teal" />
                <p className="text-xs text-white/80">
                  Step 2 of 2: SMS code sent to{" "}
                  <span className="text-white font-medium">
                    ...{phoneSuffix ?? "????"}
                  </span>
                </p>
              </div>

              {timeRemaining > 0 && (
                <div className="flex items-center justify-center gap-2 p-2 rounded bg-navy-dark/50">
                  <Clock className="h-4 w-4 text-teal" />
                  <span className="text-sm text-white font-mono">
                    Code expires in: {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm text-white">
                  SMS Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="······"
                  className="bg-navy-dark/50 border-white/10 text-white text-center text-2xl tracking-widest"
                  autoFocus
                  data-ocid="withdrawal-2fa-otp-input"
                />
              </div>

              {verifyOTP.isError && (
                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-xs text-red-500">
                    {verifyOTP.error instanceof Error
                      ? verifyOTP.error.message
                      : "Invalid code. Please try again."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
            disabled={startChallenge.isPending || verifyOTP.isPending}
            data-ocid="withdrawal-2fa-cancel"
          >
            Cancel
          </Button>

          {step === "pin" ? (
            <Button
              onClick={handleSubmitPIN}
              disabled={pin.length !== 4 || startChallenge.isPending}
              className="bg-teal hover:bg-teal-dark text-white"
              data-ocid="withdrawal-2fa-pin-submit"
            >
              {startChallenge.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending SMS...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmitOTP}
              disabled={otp.length < 4 || verifyOTP.isPending}
              className="bg-teal hover:bg-teal-dark text-white"
              data-ocid="withdrawal-2fa-otp-submit"
            >
              {verifyOTP.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify & Withdraw"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
