import { Badge } from "@/components/ui/badge";
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
  AlertCircle,
  ArrowUpRight,
  Clock,
  DollarSign,
  Info,
  Lock,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { KYCStatus } from "../backend";
import {
  useGetCallerUserProfile,
  useGetTwoFactorSettings,
  useGetVaultStatus,
  useWithdraw,
} from "../hooks/useQueries";
import Withdrawal2FAVerificationDialog from "./Withdrawal2FAVerificationDialog";

type WithdrawalType = "standard" | "instant";

interface BalanceCardProps {
  balance: bigint;
}

function calcInstantFee(amountDollars: number): number {
  return Math.max(0.25, amountDollars * 0.015);
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  const balanceInDollars = Number(balance) / 100;
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: twoFactorSettings } = useGetTwoFactorSettings();
  const { data: vaultStatus } = useGetVaultStatus();
  const withdraw = useWithdraw();

  const [showKYCWarning, setShowKYCWarning] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [withdrawalType, setWithdrawalType] =
    useState<WithdrawalType>("standard");
  const [pendingWithdrawal, setPendingWithdrawal] = useState<bigint | null>(
    null,
  );

  const vaultLocked = vaultStatus?.locked ?? false;
  const instantFee = calcInstantFee(balanceInDollars);
  const instantReceive = balanceInDollars - instantFee;

  const handleWithdraw = async () => {
    if (vaultLocked) {
      toast.error("Vault is locked. Request unlock first to withdraw funds.");
      return;
    }

    if (balanceInDollars > 200) {
      const kycStatus = userProfile?.kycStatus || KYCStatus.notSubmitted;
      if (kycStatus !== KYCStatus.verified) {
        setShowKYCWarning(true);
        return;
      }
    }

    setShowTypeSelector(true);
  };

  const handleTypeConfirm = async () => {
    setShowTypeSelector(false);

    if (balanceInDollars > 50) {
      const is2FAEnabled = twoFactorSettings?.enabled || false;
      if (!is2FAEnabled) {
        toast.error(
          "2FA required for withdrawals over $50. Please enable 2FA in Security Settings.",
        );
        return;
      }
      setPendingWithdrawal(balance);
      setShow2FADialog(true);
      return;
    }

    await executeWithdrawal(balance);
  };

  const executeWithdrawal = async (
    amount: bigint,
    verifiedOtpId?: string | null,
  ) => {
    try {
      await withdraw.mutateAsync({ amount, verifiedOtpId });
      const typeLabel = withdrawalType === "instant" ? "Instant" : "Standard";
      toast.success(`${typeLabel} withdrawal initiated successfully!`);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to process withdrawal";
      if (msg.includes("2FA required") || msg.includes("2FA")) {
        toast.error(
          "2FA verification required. Please enable 2FA in Security Settings.",
        );
      } else {
        toast.error(msg);
      }
    }
  };

  const handle2FAVerified = async (challengeId: string) => {
    if (pendingWithdrawal) {
      await executeWithdrawal(pendingWithdrawal, challengeId);
      setPendingWithdrawal(null);
    }
  };

  const handle2FACancel = () => {
    setPendingWithdrawal(null);
    setWithdrawalType("standard");
    toast.info("Withdrawal cancelled");
  };

  const handleTypeSelectorCancel = () => {
    setShowTypeSelector(false);
    setWithdrawalType("standard");
  };

  const getKYCWarningMessage = () => {
    const kycStatus = userProfile?.kycStatus || KYCStatus.notSubmitted;
    switch (kycStatus) {
      case KYCStatus.pending:
        return "Your KYC verification is pending. Please wait for approval to withdraw amounts over $200.";
      case KYCStatus.failed:
        return "Your KYC verification failed. Please complete verification to withdraw amounts over $200.";
      default:
        return "KYC verification is required to withdraw amounts over $200. Please complete verification in Security Settings.";
    }
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden border-white/10 transition-all duration-300 ${
          vaultLocked
            ? "bg-amber-950/30 ring-1 ring-amber-400/40 shadow-amber-900/20"
            : "glassmorphism shadow-teal/10"
        }`}
        data-ocid="balance-card"
      >
        {/* Decorative glow behind balance */}
        {!vaultLocked && (
          <div
            className="pointer-events-none absolute right-4 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-teal/15 blur-2xl"
            aria-hidden="true"
          />
        )}

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              {/* Label */}
              <p
                className={`text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                  vaultLocked ? "text-amber-400/80" : "text-muted-foreground"
                }`}
              >
                Available Balance
              </p>

              {/* Hero amount */}
              <div className="flex items-baseline gap-1">
                {vaultLocked ? (
                  <Lock className="h-5 w-5 text-amber-400 mb-0.5 flex-shrink-0" />
                ) : (
                  <DollarSign className="h-7 w-7 text-teal flex-shrink-0" />
                )}
                <span
                  className={`text-5xl font-bold tabular-nums tracking-tight transition-colors duration-300 ${
                    vaultLocked ? "text-amber-300" : "text-foreground"
                  }`}
                >
                  {balanceInDollars.toFixed(2)}
                </span>
              </div>

              {vaultLocked ? (
                <p className="flex items-center gap-1 text-xs text-amber-400/70 mt-1">
                  <Lock className="h-3 w-3" />
                  Vault secured — withdrawals frozen
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/50">
                  USD · Updated just now
                </p>
              )}
            </div>

            {/* Withdraw button */}
            <div className="relative group flex-shrink-0">
              <Button
                onClick={handleWithdraw}
                disabled={
                  withdraw.isPending || balanceInDollars === 0 || vaultLocked
                }
                className={`transition-all duration-200 font-semibold shadow-lg ${
                  vaultLocked
                    ? "bg-amber-500/20 border border-amber-400/30 text-amber-300 cursor-not-allowed opacity-70"
                    : "bg-teal hover:bg-teal-dark text-foreground hover:scale-[1.02] shadow-teal/30"
                }`}
                data-ocid="withdraw-btn"
              >
                {withdraw.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing…
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="mr-1.5 h-4 w-4" />
                    Withdraw
                  </>
                )}
              </Button>
              {vaultLocked && (
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                  <div className="bg-card border border-amber-400/30 text-amber-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    Vault is locked. Request unlock first.
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Type Selector Dialog */}
      <Dialog open={showTypeSelector} onOpenChange={handleTypeSelectorCancel}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-teal" />
              Choose Withdrawal Speed
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select how quickly you want your funds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="glassmorphism p-3 rounded-lg border border-teal/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Withdrawal Amount:
                </span>
                <span className="text-base font-bold text-foreground">
                  ${balanceInDollars.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Standard Option */}
            <button
              type="button"
              data-ocid="withdrawal.type.standard"
              onClick={() => setWithdrawalType("standard")}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                withdrawalType === "standard"
                  ? "border-teal bg-teal/10"
                  : "border-border bg-muted/40 hover:border-border/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${withdrawalType === "standard" ? "text-teal" : "text-white/50"}`}
                  />
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Standard
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      1–3 business days
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2 flex-shrink-0">
                  FREE
                </Badge>
              </div>
              {withdrawalType === "standard" && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="text-foreground font-semibold">
                    ${balanceInDollars.toFixed(2)}
                  </span>
                </div>
              )}
            </button>

            {/* Instant Option */}
            <button
              type="button"
              data-ocid="withdrawal.type.instant"
              onClick={() => setWithdrawalType("instant")}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                withdrawalType === "instant"
                  ? "border-teal bg-teal/10"
                  : "border-border bg-muted/40 hover:border-border/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Zap
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${withdrawalType === "instant" ? "text-teal" : "text-white/50"}`}
                  />
                  <div>
                    <p className="text-foreground font-medium text-sm">
                      Instant
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Arrives immediately
                    </p>
                  </div>
                </div>
                <Badge className="bg-teal/20 text-teal border-teal/30 text-xs px-2 flex-shrink-0">
                  ~1.5% fee
                </Badge>
              </div>
              {withdrawalType === "instant" && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground/80">
                      ${balanceInDollars.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Instant fee{" "}
                      <span className="text-muted-foreground/50">
                        (~1.5%, min $0.25)
                      </span>
                    </span>
                    <span className="text-amber-400/90">
                      −${instantFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-border">
                    <span className="text-foreground/80">You receive</span>
                    <span className="text-foreground">
                      ${Math.max(0, instantReceive).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </button>

            <div className="flex items-start gap-2 px-1">
              <Info className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                Fees are shown before confirmation, just like your bank.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              onClick={handleTypeSelectorCancel}
              variant="outline"
              className="border-border text-foreground hover:bg-muted/30"
              data-ocid="withdrawal.type.cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTypeConfirm}
              className="bg-teal hover:bg-teal-dark text-foreground"
              data-ocid="withdrawal.type.confirm"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Warning Dialog */}
      <Dialog open={showKYCWarning} onOpenChange={setShowKYCWarning}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              KYC Verification Required
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {getKYCWarningMessage()}
            </DialogDescription>
          </DialogHeader>
          <div className="glassmorphism p-4 rounded-lg border border-teal/30">
            <div className="flex items-start gap-3">
              <img
                src="/assets/generated/kyc-verification-icon-transparent.dim_32x32.png"
                alt=""
                className="h-8 w-8 mt-1"
              />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Complete KYC Verification
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Navigate to Security Settings → KYC Verification to complete
                  your identity verification.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowKYCWarning(false)}
              variant="outline"
              className="border-teal/30 text-foreground hover:bg-teal/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Verification Dialog */}
      {pendingWithdrawal && (
        <Withdrawal2FAVerificationDialog
          open={show2FADialog}
          onOpenChange={setShow2FADialog}
          amount={pendingWithdrawal}
          withdrawalType={withdrawalType}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      )}
    </>
  );
}
