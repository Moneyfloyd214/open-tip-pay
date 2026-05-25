import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, CheckCircle, Info, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useChangeWithdrawalPIN,
  useGetTwoFactorSettings,
  useSetTwoFactorSettings,
  useSetWithdrawalPIN,
} from "../hooks/useQueries";

export default function Withdrawal2FASettingsCard() {
  const { data: twoFactorSettings, isLoading } = useGetTwoFactorSettings();
  const setTwoFactorSettings = useSetTwoFactorSettings();
  const setWithdrawalPIN = useSetWithdrawalPIN();
  const changeWithdrawalPIN = useChangeWithdrawalPIN();

  const [showPINSetup, setShowPINSetup] = useState(false);
  const [showPINChange, setShowPINChange] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  const isEnabled = twoFactorSettings?.enabled || false;
  const hasPIN = twoFactorSettings?.method === "PIN+OTP";

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled && !hasPIN) {
      setShowPINSetup(true);
      return;
    }

    try {
      await setTwoFactorSettings.mutateAsync({
        enabled,
        method: hasPIN ? "PIN+OTP" : undefined,
        backupCodes: twoFactorSettings?.backupCodes || [],
      });
      toast.success(
        enabled ? "2FA enabled successfully" : "2FA disabled successfully",
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update 2FA settings");
    }
  };

  const handleSetPIN = async () => {
    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    try {
      await setWithdrawalPIN.mutateAsync(pin);
      await setTwoFactorSettings.mutateAsync({
        enabled: true,
        method: "PIN+OTP",
        backupCodes: twoFactorSettings?.backupCodes || [],
      });

      toast.success("Withdrawal PIN set successfully! 2FA is now enabled.");
      setShowPINSetup(false);
      setPin("");
      setConfirmPin("");
    } catch (error: any) {
      toast.error(error.message || "Failed to set PIN");
    }
  };

  const handleChangePIN = async () => {
    // Validate PINs
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error("New PINs do not match");
      return;
    }

    if (currentPin === newPin) {
      toast.error("New PIN must be different from current PIN");
      return;
    }

    try {
      await changeWithdrawalPIN.mutateAsync({ currentPin, newPin });
      toast.success("Withdrawal PIN changed successfully!");
      setShowPINChange(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmNewPin("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change PIN");
    }
  };

  if (isLoading) {
    return (
      <Card className="glassmorphism border-teal/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glassmorphism border-teal/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5 text-teal" />
          Withdrawal 2FA Security (PIN + OTP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 2FA Status */}
        <div
          className={`p-3 rounded-lg border ${isEnabled ? "bg-teal/10 border-teal/30" : "bg-yellow-500/10 border-yellow-500/30"}`}
        >
          <div className="flex items-center gap-2">
            {isEnabled ? (
              <>
                <CheckCircle className="h-4 w-4 text-teal" />
                <p className="text-xs text-teal font-medium">
                  2FA Withdrawal Security Active
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-yellow-500 font-medium">
                  2FA Withdrawal Security Disabled
                </p>
              </>
            )}
          </div>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-teal" />
            <div>
              <p className="text-sm text-white font-medium">
                Enable 2FA for Withdrawals
              </p>
              <p className="text-xs text-white/60">
                Require PIN + OTP for high-value withdrawals
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={setTwoFactorSettings.isPending}
          />
        </div>

        {/* PIN Setup Section */}
        {!hasPIN && showPINSetup && (
          <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-teal/30">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal" />
              <h4 className="text-sm font-semibold text-foreground">
                Set Your 4-Digit Security PIN
              </h4>
            </div>
            <p className="text-xs text-white/60">
              This PIN will be required for withdrawals over $50 and all crypto
              transfers.
            </p>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-xs text-foreground">
                Enter PIN (4 digits)
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="bg-muted/50 border-border text-white text-center text-lg tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin" className="text-xs text-foreground">
                Confirm PIN
              </Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                placeholder="••••"
                className="bg-muted/50 border-border text-white text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSetPIN}
                disabled={
                  setWithdrawalPIN.isPending ||
                  pin.length !== 4 ||
                  confirmPin.length !== 4
                }
                className="flex-1 bg-teal hover:bg-teal-dark text-foreground"
              >
                {setWithdrawalPIN.isPending
                  ? "Setting PIN..."
                  : "Set PIN & Enable 2FA"}
              </Button>
              <Button
                onClick={() => {
                  setShowPINSetup(false);
                  setPin("");
                  setConfirmPin("");
                }}
                variant="outline"
                className="border-border text-white hover:bg-white/5"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* PIN Management */}
        {hasPIN && (
          <div className="space-y-3">
            <Separator className="bg-white/10" />

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-teal" />
                <div>
                  <p className="text-sm text-white font-medium">
                    Security PIN Configured
                  </p>
                  <p className="text-xs text-white/60">
                    Your 4-digit PIN is set and active
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-teal/30 text-teal text-xs"
              >
                Active
              </Badge>
            </div>

            {!showPINChange ? (
              <Button
                onClick={() => setShowPINChange(true)}
                variant="outline"
                className="w-full border-teal/30 text-teal hover:bg-teal/10"
              >
                Change PIN
              </Button>
            ) : (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-teal/30">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-teal" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Change Your Security PIN
                  </h4>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="currentPin"
                    className="text-xs text-foreground"
                  >
                    Current PIN
                  </Label>
                  <Input
                    id="currentPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={currentPin}
                    onChange={(e) =>
                      setCurrentPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    className="bg-muted/50 border-border text-white text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPin" className="text-xs text-foreground">
                    New PIN (4 digits)
                  </Label>
                  <Input
                    id="newPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    className="bg-muted/50 border-border text-white text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmNewPin"
                    className="text-xs text-foreground"
                  >
                    Confirm New PIN
                  </Label>
                  <Input
                    id="confirmNewPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={(e) =>
                      setConfirmNewPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="••••"
                    className="bg-muted/50 border-border text-white text-center text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePIN}
                    disabled={
                      changeWithdrawalPIN.isPending ||
                      currentPin.length !== 4 ||
                      newPin.length !== 4 ||
                      confirmNewPin.length !== 4
                    }
                    className="flex-1 bg-teal hover:bg-teal-dark text-foreground"
                  >
                    {changeWithdrawalPIN.isPending
                      ? "Changing PIN..."
                      : "Change PIN"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPINChange(false);
                      setCurrentPin("");
                      setNewPin("");
                      setConfirmNewPin("");
                    }}
                    variant="outline"
                    className="border-border text-white hover:bg-white/5"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Information Section */}
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-teal/10 border border-teal/30">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-teal mt-0.5 cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="glassmorphism border-teal/30 max-w-xs"
                >
                  <p className="text-xs text-white/90">
                    2FA adds an extra layer of security by requiring both your
                    PIN and a one-time code for withdrawals.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="space-y-1">
              <p className="text-xs text-teal font-medium">
                How 2FA Withdrawal Security Works
              </p>
              <ul className="text-xs text-teal/80 space-y-1 list-disc list-inside">
                <li>Required for withdrawals over $50</li>
                <li>Mandatory for all crypto transfers</li>
                <li>Enter your 4-digit PIN first</li>
                <li>Receive a one-time code (OTP) in-app</li>
                <li>Enter the OTP to complete withdrawal</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 text-xs text-white/60">
            <p className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-teal" />
              PIN is stored securely with salted hash encryption
            </p>
            <p className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-teal" />
              OTP codes expire after 5 minutes for security
            </p>
            <p className="flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-teal" />
              All 2FA events are logged in Security Event Log
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
