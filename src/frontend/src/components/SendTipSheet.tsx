import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, DollarSign, Info, Loader as Loader2, Wallet, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Variant_fiat_crypto } from "../types/local-backend";
import {
  useCryptoExchangeRates,
  useGetCallerUserProfile,
  useGetPublicProfile,
  useGetPublicProfileByPrincipal,
  useMarkTutorialCompleted,
  useSendTip,
} from "../hooks/useQueries";
import { useWallet } from "../hooks/useWallet";

type PaymentMethod = "balance" | "debit_card" | "credit_card";

interface SendTipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientPrincipal: string | null;
  recipientUsername?: string | null;
  onOpenSecurityFAQ: () => void;
  /** When true, opens the sheet with "Sending as a tip" pre-enabled */
  defaultTipMode?: boolean;
}

const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "balance",
    label: "Balance",
    icon: <DollarSign className="h-3.5 w-3.5" />,
  },
  {
    value: "debit_card",
    label: "Debit",
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  {
    value: "credit_card",
    label: "Credit",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
];

export default function SendTipSheet({
  open,
  onOpenChange,
  recipientPrincipal,
  recipientUsername,
  onOpenSecurityFAQ,
  defaultTipMode = false,
}: SendTipSheetProps) {
  const [paymentType, setPaymentType] = useState<"fiat" | "crypto">("fiat");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("balance");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const [isSendingAsTip, setIsSendingAsTip] = useState(defaultTipMode);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(false);

  // Sync tip mode whenever the sheet opens — respects the defaultTipMode prop
  useEffect(() => {
    if (open) {
      setIsSendingAsTip(defaultTipMode);
      if (!defaultTipMode) setIsProfessional(false);
    }
  }, [open, defaultTipMode]);

  const MAX_MESSAGE_LENGTH = 200;

  const { data: profileByPrincipal } =
    useGetPublicProfileByPrincipal(recipientPrincipal);
  const { data: profileByUsername } = useGetPublicProfile(
    recipientUsername || null,
  );
  const { data: currentUserProfile } = useGetCallerUserProfile();
  const sendTipMutation = useSendTip();
  const { connectMetaMask } = useWallet();
  const { data: exchangeRates } = useCryptoExchangeRates();
  const markTutorialMutation = useMarkTutorialCompleted();

  const recipientProfile = profileByPrincipal || profileByUsername;

  useEffect(() => {
    if (
      open &&
      currentUserProfile?.isFirstWalletConnection &&
      currentUserProfile?.walletAddress
    ) {
      setShowOnboardingTooltip(true);
    }
  }, [open, currentUserProfile]);

  const handleDismissOnboarding = async () => {
    setShowOnboardingTooltip(false);
    try {
      await markTutorialMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to mark tutorial as completed:", error);
    }
  };

  const presetAmounts = [2, 5, 10, 20];

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  // Fee calculation — credit card only
  const amountNum = Number.parseFloat(amount) || 0;
  const showFeeBreakdown =
    paymentType === "fiat" && paymentMethod === "credit_card" && amountNum > 0;
  const creditCardFee = showFeeBreakdown
    ? Math.ceil(amountNum * 100 * 0.03) / 100
    : 0;
  const totalCharged = showFeeBreakdown ? amountNum + creditCardFee : amountNum;

  const handleSendTip = async () => {
    if (!recipientPrincipal && !recipientProfile) {
      toast.error("Recipient not found");
      return;
    }

    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (message.trim() === "") {
      toast.error("A message is required to send money");
      setMessageError(true);
      return;
    }

    try {
      if (paymentType === "fiat") {
        let targetPrincipal = recipientPrincipal;

        if (!targetPrincipal && recipientProfile) {
          toast.error("Unable to send money: recipient not available");
          return;
        }

        if (!targetPrincipal) {
          toast.error("Recipient not found");
          return;
        }

        // TODO: call sendTipWithFee when available (pass paymentMethod for fee calculation)
        await sendTipMutation.mutateAsync({
          toUser: targetPrincipal,
          amount: BigInt(Math.floor(amountNum * 100)),
          message,
          professional: isProfessional,
          currencyType: Variant_fiat_crypto.fiat,
        });

        if ("vibrate" in navigator) {
          navigator.vibrate(200);
        }

        toast.success("Money sent successfully!");
        onOpenChange(false);
        resetForm();
      } else {
        if (!currentUserProfile?.walletAddress) {
          const address = await connectMetaMask();
          if (!address) {
            toast.error("Failed to connect wallet");
            return;
          }
        }

        toast.error(
          "Crypto payments require the recipient to share their wallet address. Please use fiat payment or contact the recipient directly.",
        );
        return;
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to send money";
      console.error("Error sending money:", error);
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setAmount("");
    setMessage("");
    setMessageError(false);
    setIsProfessional(false);
    setIsSendingAsTip(defaultTipMode);
    setPaymentType("fiat");
    setPaymentMethod("balance");
  };

  const getUSDEquivalent = () => {
    if (!exchangeRates || !amount) return null;
    const n = Number.parseFloat(amount);
    if (Number.isNaN(n)) return null;
    return (n * exchangeRates.ethereum.usd).toFixed(2);
  };

  const getButtonText = () => {
    if (sendTipMutation.isPending) {
      return (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Sending...
        </>
      );
    }

    if (paymentType === "crypto") return "Crypto Unavailable";

    if (showFeeBreakdown) {
      return `Send — $${totalCharged.toFixed(2)} total`;
    }

    const amountDisplay = amount || "0";
    return `Send $${amountDisplay}`;
  };

  if (!recipientProfile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] bg-card border-t-2 border-teal/30"
        >
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-teal" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-card border-t-2 border-teal/30 overflow-y-auto"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white text-2xl">
            {defaultTipMode ? "Send Tip" : "Send Money"}
          </SheetTitle>
          <SheetDescription className="text-white/60">
            {defaultTipMode
              ? `Send a tip to ${recipientProfile.username}`
              : `Send money to ${recipientProfile.username}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Recipient Info */}
          <div className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-teal/20">
            <Avatar className="h-16 w-16 border-2 border-teal">
              {recipientProfile.photo ? (
                <AvatarImage
                  src={recipientProfile.photo.getDirectURL()}
                  alt={recipientProfile.username}
                />
              ) : (
                <AvatarFallback className="bg-muted text-foreground text-lg">
                  {recipientProfile.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold text-lg truncate">
                  @{recipientProfile.username}
                </h3>
                {recipientProfile.isVerified && (
                  <img
                    src="/assets/generated/verified-badge-transparent.dim_16x16.png"
                    alt="Verified"
                    className="h-4 w-4 flex-shrink-0"
                  />
                )}
              </div>
              <p className="text-white/60 text-sm truncate">
                {recipientProfile.bio}
              </p>
              {recipientProfile.currentStatus && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-teal text-xs font-medium truncate">
                    {recipientProfile.currentStatus.statusType}
                    {recipientProfile.currentStatus.customStatus &&
                      `: ${recipientProfile.currentStatus.customStatus}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Type Toggle */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-white">Payment Type</Label>
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-teal hover:text-teal/80 transition-colors"
              >
                <img
                  src="/assets/generated/tooltip-icon.dim_24x24.png"
                  alt="Info"
                  className="h-4 w-4 animate-pulse"
                />
              </button>
            </div>

            {showTooltip && (
              <div className="p-4 bg-teal/10 border border-teal/30 rounded-xl text-sm text-white/80 animate-in fade-in slide-in-from-top-2">
                <p className="mb-2">
                  <strong className="text-teal">
                    Crypto Payment Security:
                  </strong>{" "}
                  Your crypto payments are secured with end-to-end encryption
                  and multi-party computation (MPC) for key integrity.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowTooltip(false);
                    onOpenSecurityFAQ();
                  }}
                  className="text-teal hover:underline text-xs"
                >
                  Learn more in Security FAQ →
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setPaymentType("fiat")}
                variant={paymentType === "fiat" ? "default" : "outline"}
                className={`flex-1 ${
                  paymentType === "fiat"
                    ? "bg-teal hover:bg-teal/90 text-foreground"
                    : "bg-card/50 border-teal/30 text-white hover:bg-navy-light"
                }`}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Fiat
              </Button>
              <Button
                onClick={() => setPaymentType("crypto")}
                variant={paymentType === "crypto" ? "default" : "outline"}
                className={`flex-1 ${
                  paymentType === "crypto"
                    ? "bg-teal hover:bg-teal/90 text-foreground"
                    : "bg-card/50 border-teal/30 text-white hover:bg-navy-light"
                }`}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Crypto
              </Button>
            </div>
          </div>

          {/* Crypto Payment Notice */}
          {paymentType === "crypto" && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-500">
                  <p className="font-medium mb-1">
                    Crypto Payments Currently Unavailable
                  </p>
                  <p className="text-xs text-yellow-500/80">
                    For privacy reasons, wallet addresses are not publicly
                    visible. Please use fiat payment or contact the recipient
                    directly to arrange crypto payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fiat Payment Method Selector */}
          {paymentType === "fiat" && (
            <div className="space-y-2">
              <Label className="text-white">Pay with</Label>
              <div className="flex gap-2 p-1 bg-card/40 rounded-xl border border-border">
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-ocid={`send_tip.payment_method.${opt.value}`}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      paymentMethod === opt.value
                        ? "bg-teal text-white shadow-sm shadow-teal/30"
                        : "text-white/60 hover:text-white/80"
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                    {opt.value === "credit_card" && (
                      <span
                        className={`text-[10px] ml-0.5 ${
                          paymentMethod === "credit_card"
                            ? "text-white/80"
                            : "text-white/40"
                        }`}
                      >
                        +3%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount Selection */}
          <div className="space-y-3">
            <Label className="text-white">Amount</Label>
            {paymentType === "fiat" && (
              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    onClick={() => handlePresetAmount(preset)}
                    variant="outline"
                    className="bg-card/50 border-teal/30 text-white hover:bg-teal hover:text-white"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {paymentType === "fiat" ? "$" : "ETH"}
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8 bg-card/50 border-teal/30 text-white placeholder:text-white/40"
                disabled={paymentType === "crypto"}
              />
            </div>
            {paymentType === "crypto" && getUSDEquivalent() && (
              <p className="text-xs text-white/50 italic">
                ≈ ${getUSDEquivalent()} USD
                <br />
                <span className="text-[10px]">
                  Approximate value based on current market rates.
                </span>
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-white">
              Message{" "}
              <span className="text-red-400" aria-hidden="true">
                *
              </span>
            </Label>
            <Textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setMessage(e.target.value);
                  if (e.target.value.trim() !== "") setMessageError(false);
                }
              }}
              placeholder="Add a note..."
              maxLength={MAX_MESSAGE_LENGTH}
              aria-required="true"
              data-ocid="send_tip.message_textarea"
              className={`bg-card/50 text-white placeholder:text-white/40 min-h-[80px] transition-colors duration-200 ${
                messageError
                  ? "border-red-400 focus:border-red-400 border-2"
                  : "border-teal/30"
              }`}
              disabled={paymentType === "crypto"}
            />
            <div className="flex items-center justify-between">
              {messageError ? (
                <p
                  className="text-red-400 text-xs"
                  data-ocid="send_tip.message_error"
                >
                  A message is required
                </p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs ml-auto ${message.length >= MAX_MESSAGE_LENGTH ? "text-red-400" : "text-white/40"}`}
              >
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>
          </div>

          {/* Sending as a Tip toggle — secondary option for service workers */}
          <div className="p-4 bg-card/40 rounded-xl border border-border space-y-3">
            <label
              className="flex items-center gap-3 cursor-pointer"
              htmlFor="sending-as-tip-toggle"
            >
              <Checkbox
                id="sending-as-tip-toggle"
                checked={isSendingAsTip}
                onCheckedChange={(checked) => {
                  setIsSendingAsTip(!!checked);
                  if (!checked) setIsProfessional(false);
                }}
                disabled={paymentType === "crypto"}
                data-ocid="send_tip.sending_as_tip_checkbox"
                className="border-teal/50 data-[state=checked]:bg-teal data-[state=checked]:border-teal"
              />
              <div>
                <span className="text-white/80 text-sm font-medium">
                  Sending as a tip (service industry)
                </span>
                <p className="text-white/40 text-xs">
                  Check this if you're tipping for a service
                </p>
              </div>
            </label>

            {/* Job Completed — only shown when "Sending as a tip" is checked */}
            {isSendingAsTip && (
              <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                {showOnboardingTooltip && (
                  <div className="absolute -top-32 left-0 right-0 z-50 p-4 bg-gradient-to-br from-teal/20 to-teal/10 border-2 border-teal/50 rounded-xl shadow-2xl shadow-teal/30 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={handleDismissOnboarding}
                      className="absolute top-2 right-2 text-white/60 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💼</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium mb-1">
                          New Feature Alert!
                        </p>
                        <p className="text-white/80 text-xs">
                          Use this toggle when receiving professional payments.
                          We'll tag these automatically for your tax exports.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDismissOnboarding}
                      size="sm"
                      className="mt-3 w-full bg-teal hover:bg-teal/90 text-foreground"
                    >
                      Got it
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-card/50 rounded-xl border border-teal/20">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/generated/briefcase-icon.dim_32x32.png"
                      alt="Professional"
                      className="h-6 w-6"
                    />
                    <div>
                      <Label className="text-white font-medium">
                        Job Completed
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mark as a professional service payment
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isProfessional}
                    onCheckedChange={setIsProfessional}
                    disabled={paymentType === "crypto"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fee Breakdown — shown ONLY for credit card, right above send button */}
          {showFeeBreakdown && (
            <div
              data-ocid="send_tip.fee_breakdown"
              className="rounded-xl border border-teal/20 bg-navy-light/30 px-4 py-3 space-y-1.5 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Amount</span>
                <span className="text-white/70">${amountNum.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">
                  Credit card fee <span className="text-white/30">(3%)</span>
                </span>
                <span className="text-amber-400/90">
                  +${creditCardFee.toFixed(2)}
                </span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-white/80">Total charged</span>
                <span className="text-white">${totalCharged.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSendTip}
            data-ocid="send_tip.submit_button"
            disabled={
              sendTipMutation.isPending ||
              !amount ||
              paymentType === "crypto" ||
              message.trim() === ""
            }
            className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-6 text-lg shadow-lg shadow-teal/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
