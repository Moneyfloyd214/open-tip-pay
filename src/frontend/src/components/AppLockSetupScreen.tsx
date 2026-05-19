import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSetPinHash } from "../hooks/useQueries";

interface AppLockSetupScreenProps {
  onSetupComplete: () => void;
}

async function hashPin(
  pin: string,
): Promise<{ salt: Uint8Array; hash: Uint8Array }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Combine salt and PIN
  const combined = new Uint8Array(salt.length + data.length);
  combined.set(salt);
  combined.set(data, salt.length);

  // Hash the combined data
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  const hash = new Uint8Array(hashBuffer);

  return { salt, hash };
}

export default function AppLockSetupScreen({
  onSetupComplete,
}: AppLockSetupScreenProps) {
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const setPinHash = useSetPinHash();

  const handleDigitClick = (digit: string) => {
    const currentPin = step === "create" ? pin : confirmPin;

    if (currentPin.length < 4) {
      if (step === "create") {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            setStep("confirm");
            setError("");
          }, 200);
        }
      } else {
        const newConfirmPin = confirmPin + digit;
        setConfirmPin(newConfirmPin);
        if (newConfirmPin.length === 4) {
          setTimeout(() => handleSubmit(newConfirmPin), 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setError("");
    if (step === "create") {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleSubmit = async (finalConfirmPin: string) => {
    if (pin !== finalConfirmPin) {
      setError("PINs do not match");
      setConfirmPin("");
      return;
    }

    try {
      const { salt, hash } = await hashPin(pin);
      await setPinHash.mutateAsync({ salt, hash });
      toast.success("App Lock PIN created successfully");
      onSetupComplete();
    } catch (err: any) {
      setError(err.message || "Failed to set PIN");
      setConfirmPin("");
    }
  };

  const handleBack = () => {
    setStep("create");
    setConfirmPin("");
    setError("");
  };

  const currentPin = step === "create" ? pin : confirmPin;
  const isLoading = setPinHash.isPending;

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-teal/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-teal" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === "create" ? "Create App Lock PIN" : "Confirm Your PIN"}
          </h1>
          <p className="text-white/70 text-sm">
            {step === "create"
              ? "Enter a 4-digit PIN to secure your app"
              : "Re-enter your PIN to confirm"}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center gap-4 py-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                currentPin.length > index
                  ? "border-teal bg-teal/20"
                  : "border-white/30 bg-white/5"
              }`}
            >
              {currentPin.length > index && (
                <div className="w-4 h-4 rounded-full bg-teal" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              type="button"
              key={digit}
              onClick={() => handleDigitClick(digit.toString())}
              disabled={isLoading}
              className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-teal/30 text-white text-2xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}

          {/* Back button (only on confirm step) */}
          {step === "confirm" ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-white/20 text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigitClick("0")}
            disabled={isLoading}
            className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-teal/30 text-white text-2xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || currentPin.length === 0}
            className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-white/20 text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
