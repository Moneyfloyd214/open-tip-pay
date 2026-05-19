import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useVerifyPinHash } from "../hooks/useQueries";
import { useGetCallerUserProfile } from "../hooks/useQueries";

interface AppLockScreenProps {
  onUnlock: () => void;
  onLogout: () => Promise<void>;
}

async function hashPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);

  // Combine salt and PIN
  const combined = new Uint8Array(salt.length + data.length);
  combined.set(salt);
  combined.set(data, salt.length);

  // Hash the combined data
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hashBuffer);
}

export default function AppLockScreen({
  onUnlock,
  onLogout,
}: AppLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [_attemptsRemaining, setAttemptsRemaining] = useState<number | null>(
    null,
  );
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState<number>(0);
  const [storedSalt, setStoredSalt] = useState<Uint8Array | null>(null);

  const verifyPin = useVerifyPinHash();
  const { data: userProfile } = useGetCallerUserProfile();

  // Generate and store salt on mount
  useEffect(() => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    setStoredSalt(salt);
  }, []);

  // Update block timer
  useEffect(() => {
    if (blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining((prev) => {
          if (prev <= 1000) {
            setIsBlocked(false);
            setError("");
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [blockTimeRemaining]);

  const handleDigitClick = (digit: string) => {
    if (isBlocked || verifyPin.isPending) return;

    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        setTimeout(() => handleVerify(newPin), 200);
      }
    }
  };

  const handleDelete = () => {
    if (isBlocked || verifyPin.isPending) return;
    setPin(pin.slice(0, -1));
    setError("");
  };

  const handleVerify = async (fullPin: string) => {
    if (!storedSalt) {
      setError("System error. Please try again.");
      setPin("");
      return;
    }

    try {
      const hash = await hashPin(fullPin, storedSalt);
      const result = await verifyPin.mutateAsync({ salt: storedSalt, hash });

      if (result.__kind__ === "verified") {
        onUnlock();
      } else if (result.__kind__ === "incorrect") {
        const remaining = Number(result.incorrect);
        setAttemptsRemaining(remaining);
        setError(
          `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        );
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
      } else if (result.__kind__ === "blocked") {
        const blockDuration = Number(result.blocked) / 1_000_000; // Convert nanoseconds to milliseconds
        setIsBlocked(true);
        setBlockTimeRemaining(blockDuration);
        setError("Too many failed attempts. Account locked for 2 hours.");
        setPin("");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    }
  };

  const handleForgotPin = async () => {
    await onLogout();
  };

  const handleSwitchAccount = async () => {
    await onLogout();
  };

  const formatBlockTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {userProfile?.photo ? (
            <div className="flex justify-center">
              <img
                src={userProfile.photo.getDirectURL()}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-teal"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-teal/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-teal" />
              </div>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/70 text-sm">
            {isBlocked
              ? `Locked for ${formatBlockTime(blockTimeRemaining)}`
              : "Enter your 4-digit PIN to continue"}
          </p>
        </div>

        {/* PIN Display */}
        <div
          className={`flex justify-center gap-4 py-8 transition-transform ${shake ? "animate-shake" : ""}`}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${
                pin.length > index
                  ? "border-teal bg-teal/20"
                  : "border-white/30 bg-white/5"
              }`}
            >
              {pin.length > index && (
                <div className="w-4 h-4 rounded-full bg-teal" />
              )}
            </div>
          ))}
        </div>

        {/* Error/Status Message */}
        {error && (
          <div className="text-center">
            <p
              className={`text-sm ${isBlocked ? "text-red-500 font-semibold" : "text-red-400"}`}
            >
              {error}
            </p>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              type="button"
              key={digit}
              onClick={() => handleDigitClick(digit.toString())}
              disabled={isBlocked || verifyPin.isPending}
              className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-teal/30 text-white text-2xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}

          <div />

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigitClick("0")}
            disabled={isBlocked || verifyPin.isPending}
            className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-teal/30 text-white text-2xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBlocked || verifyPin.isPending || pin.length === 0}
            className="h-16 rounded-xl bg-navy-light/50 hover:bg-navy-light border border-white/20 text-white text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyPin.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Delete"
            )}
          </button>
        </div>

        {/* Action Links */}
        <div className="flex justify-between text-sm pt-4">
          <button
            type="button"
            onClick={handleSwitchAccount}
            disabled={verifyPin.isPending}
            className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
          >
            Switch Account
          </button>
          <button
            type="button"
            onClick={handleForgotPin}
            disabled={verifyPin.isPending}
            className="text-teal hover:text-teal-light transition-colors disabled:opacity-50"
          >
            Forgot PIN?
          </button>
        </div>
      </div>
    </div>
  );
}
