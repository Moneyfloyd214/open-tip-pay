import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  Lock,
  Shield,
  ShieldOff,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useAcknowledgeVaultAlert,
  useCancelVaultUnlock,
  useFinalizeVaultUnlock,
  useGetVaultStatus,
  useLockVault,
  useRequestVaultUnlock,
} from "../hooks/useQueries";

export default function VaultLockCard() {
  const { data: vaultStatus, isLoading } = useGetVaultStatus();
  const lockVault = useLockVault();
  const requestUnlock = useRequestVaultUnlock();
  const finalizeUnlock = useFinalizeVaultUnlock();
  const cancelUnlock = useCancelVaultUnlock();
  const acknowledgeAlert = useAcknowledgeVaultAlert();

  const [showConfirmLock, setShowConfirmLock] = useState(false);
  const [showConfirmRequestUnlock, setShowConfirmRequestUnlock] =
    useState(false);
  const [showBiometricDialog, setShowBiometricDialog] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(false);

  // Derived state
  const locked = vaultStatus?.locked ?? false;
  const unlockPending = vaultStatus?.unlockPending ?? false;
  const hoursRemaining = vaultStatus?.hoursRemaining ?? 0;
  const shouldShowAlert = vaultStatus?.shouldShowAlert ?? false;
  const readyToFinalize = unlockPending && hoursRemaining <= 0;

  const handleLock = async () => {
    try {
      await lockVault.mutateAsync();
      setShowConfirmLock(false);
      toast.success("🔒 Vault locked. All outgoing transactions are frozen.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to lock vault");
    }
  };

  const handleRequestUnlock = async () => {
    try {
      await requestUnlock.mutateAsync();
      setShowConfirmRequestUnlock(false);
      toast.info(
        "⏳ 24-hour cooldown started. Your vault will unlock after the waiting period.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to request unlock");
    }
  };

  const handleCancelUnlock = async () => {
    try {
      await cancelUnlock.mutateAsync();
      toast.success("✅ Unlock cancelled. Your vault remains secured.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel unlock");
    }
  };

  const handleStartFinalize = () => {
    setShowBiometricDialog(true);
  };

  const handleBiometricConfirm = async () => {
    setBiometricChecking(true);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await finalizeUnlock.mutateAsync();
      setShowBiometricDialog(false);
      toast.success("🔓 Vault unlocked! Transactions are now active.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to finalize unlock");
    } finally {
      setBiometricChecking(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert.mutateAsync();
      toast.info("Alert dismissed.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to acknowledge alert",
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted/50" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted/50 rounded w-1/3" />
              <div className="h-3 bg-muted/50 rounded w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine card styling based on state
  const cardClass = readyToFinalize
    ? "border-emerald-500/40 bg-white/5 backdrop-blur-md shadow-emerald-500/10 shadow-lg ring-1 ring-emerald-500/20"
    : locked
      ? "border-amber-500/40 bg-white/5 backdrop-blur-md shadow-amber-500/20 shadow-lg ring-1 ring-amber-400/20"
      : "border-teal/30 bg-white/5 backdrop-blur-md";

  return (
    <>
      {/* Vault Alert Banner */}
      {unlockPending && shouldShowAlert && (
        <VaultAlertBanner
          hoursRemaining={hoursRemaining}
          onSecureAccount={handleCancelUnlock}
          onDismiss={handleAcknowledge}
          isCancelling={cancelUnlock.isPending}
          isAcknowledging={acknowledgeAlert.isPending}
        />
      )}

      <Card
        className={`transition-all duration-300 ${cardClass}`}
        data-ocid="vault-lock-card"
      >
        <CardContent className="p-5 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {locked ? (
                <Shield className="h-5 w-5 text-amber-400" />
              ) : (
                <Shield className="h-5 w-5 text-teal" />
              )}
              <span className="font-semibold text-foreground">Vault Lock</span>
            </div>
            <StatusBadge
              locked={locked}
              unlockPending={unlockPending}
              readyToFinalize={readyToFinalize}
            />
          </div>

          {/* Body */}
          {readyToFinalize ? (
            /* READY TO FINALIZE */
            <div className="space-y-3">
              <p className="text-sm text-emerald-300">
                Cooldown complete! Confirm your identity to unlock the vault.
              </p>
              <Button
                onClick={handleStartFinalize}
                disabled={finalizeUnlock.isPending}
                className="w-full bg-teal hover:bg-teal/90 text-white font-semibold"
                data-ocid="vault-finalize-btn"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Finalize Unlock
              </Button>
              <Button
                onClick={handleCancelUnlock}
                disabled={cancelUnlock.isPending}
                variant="outline"
                size="sm"
                className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
                data-ocid="vault-cancel-btn"
              >
                Cancel Unlock
              </Button>
            </div>
          ) : unlockPending ? (
            /* UNLOCK PENDING */
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-300">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {hoursRemaining > 0
                    ? `${Math.floor(hoursRemaining)}h ${Math.round((hoursRemaining % 1) * 60)}m remaining`
                    : "Cooldown finishing..."}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your vault is scheduled to unlock. If this wasn't you, secure
                your account immediately.
              </p>

              {shouldShowAlert && (
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleAcknowledge}
                    disabled={acknowledgeAlert.isPending}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-amber-400/30 text-amber-300 hover:bg-amber-400/10 text-xs"
                    data-ocid="vault-ack-btn"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Got it
                  </Button>
                  <Button
                    onClick={handleCancelUnlock}
                    disabled={cancelUnlock.isPending}
                    size="sm"
                    className="flex-1 bg-red-600/80 hover:bg-red-600 text-white text-xs"
                    data-ocid="vault-secure-btn"
                  >
                    Cancel Unlock
                  </Button>
                </div>
              )}

              {!shouldShowAlert && (
                <Button
                  onClick={handleCancelUnlock}
                  disabled={cancelUnlock.isPending}
                  variant="outline"
                  className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
                  data-ocid="vault-cancel-btn"
                >
                  Cancel Unlock
                </Button>
              )}
            </div>
          ) : locked ? (
            /* LOCKED */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                All outgoing transactions are frozen. Incoming tips remain
                active.
              </p>
              <Button
                onClick={() => setShowConfirmRequestUnlock(true)}
                variant="outline"
                className="w-full border-teal/40 text-teal hover:bg-teal/10"
                data-ocid="vault-request-unlock-btn"
              >
                <Unlock className="mr-2 h-4 w-4" />
                Request Unlock
              </Button>
            </div>
          ) : (
            /* UNLOCKED */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your vault is open. All transactions are active.
              </p>
              <Button
                onClick={() => setShowConfirmLock(true)}
                disabled={lockVault.isPending}
                className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-semibold transition-all duration-200"
                data-ocid="vault-lock-btn"
              >
                <Lock className="mr-2 h-4 w-4" />
                {lockVault.isPending ? "Locking..." : "Lock Vault"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Lock Dialog */}
      <Dialog open={showConfirmLock} onOpenChange={setShowConfirmLock}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-amber-400/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-400" />
              Lock Your Vault?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will immediately freeze all outgoing transactions and P2P
              sends. Incoming tips will still work. Unlocking requires a 24-hour
              cooldown.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmLock(false)}
              className="border-border text-foreground hover:bg-muted/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLock}
              disabled={lockVault.isPending}
              className="bg-amber-500/80 hover:bg-amber-500 text-white"
              data-ocid="vault-confirm-lock-btn"
            >
              {lockVault.isPending ? "Locking..." : "Lock Vault"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Request Unlock Dialog */}
      <Dialog
        open={showConfirmRequestUnlock}
        onOpenChange={setShowConfirmRequestUnlock}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-teal" />
              Request Vault Unlock?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A 24-hour cooldown period will begin. You'll receive security
              alerts during this time. After 24 hours, you'll need to confirm
              your identity with biometrics to complete the unlock.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmRequestUnlock(false)}
              className="border-border text-foreground hover:bg-muted/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestUnlock}
              disabled={requestUnlock.isPending}
              className="bg-teal hover:bg-teal/90 text-white"
              data-ocid="vault-confirm-unlock-btn"
            >
              {requestUnlock.isPending
                ? "Processing..."
                : "Start 24-Hour Cooldown"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Biometric Finalize Dialog */}
      <Dialog open={showBiometricDialog} onOpenChange={setShowBiometricDialog}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-emerald-400" />
              Confirm Your Identity
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Use biometrics to finalize the vault unlock.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 gap-4">
            {biometricChecking ? (
              <>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-emerald-500/40 flex items-center justify-center">
                    <Fingerprint className="h-8 w-8 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-30" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Verifying biometrics...
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Fingerprint className="h-8 w-8 text-emerald-400" />
                </div>
                <p className="text-sm text-white/70 text-center">
                  Place your finger on the sensor or look at the camera to
                  confirm
                </p>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBiometricDialog(false)}
              disabled={biometricChecking}
              className="border-border text-foreground hover:bg-muted/20"
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleBiometricConfirm}
              disabled={biometricChecking}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              data-ocid="vault-biometric-confirm-btn"
            >
              {biometricChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Verifying...
                </div>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Confirm with Biometrics
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Status Badge sub-component
function StatusBadge({
  locked,
  unlockPending,
  readyToFinalize,
}: {
  locked: boolean;
  unlockPending: boolean;
  readyToFinalize: boolean;
}) {
  if (readyToFinalize) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="h-3 w-3" />
        READY
      </span>
    );
  }
  if (unlockPending) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
        <AlertTriangle className="h-3 w-3" />
        PENDING
      </span>
    );
  }
  if (locked) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
        <Lock className="h-3 w-3" />
        SECURED
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      <Unlock className="h-3 w-3" />
      UNLOCKED
    </span>
  );
}

// Vault Alert Banner sub-component
function VaultAlertBanner({
  hoursRemaining,
  onSecureAccount,
  onDismiss,
  isCancelling,
  isAcknowledging,
}: {
  hoursRemaining: number;
  onSecureAccount: () => void;
  onDismiss: () => void;
  isCancelling: boolean;
  isAcknowledging: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      } bg-amber-500/15 border border-amber-400/30 backdrop-blur-sm rounded-xl p-4`}
      data-ocid="vault-alert-banner"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-200 font-medium">
            Vault unlock in progress
          </p>
          <p className="text-xs text-amber-300/70 mt-0.5">
            {hoursRemaining > 0
              ? `Your funds are scheduled to unlock in ${Math.floor(hoursRemaining)}h ${Math.round((hoursRemaining % 1) * 60)}m.`
              : "Cooldown complete — confirm identity to unlock."}{" "}
            If this wasn't you, secure your account now.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          disabled={isAcknowledging}
          className="text-foreground/60 hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={onSecureAccount}
          disabled={isCancelling}
          className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1 h-auto"
          data-ocid="vault-banner-secure-btn"
        >
          Secure Account
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onDismiss}
          disabled={isAcknowledging}
          className="border-amber-400/30 text-amber-300 hover:bg-amber-400/10 text-xs px-3 py-1 h-auto"
          data-ocid="vault-banner-dismiss-btn"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}
