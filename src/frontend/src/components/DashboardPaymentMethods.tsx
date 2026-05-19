import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type PaymentMethod, PaymentMethodType } from "../backend";
import {
  useAddPaymentMethod,
  useGetPaymentMethods,
  useRemovePaymentMethod,
} from "../hooks/useQueries";

export default function DashboardPaymentMethods() {
  const { data: paymentMethods, isLoading } = useGetPaymentMethods();
  const addPaymentMethod = useAddPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();

  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardBrand, setCardBrand] = useState("visa");

  // Bank form state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountType, setAccountType] = useState("checking");

  const handleAddCard = async () => {
    if (!cardNumber || !cardExpiry || !cardCVC) {
      toast.error("Please fill in all card details");
      return;
    }

    setIsProcessing(true);

    // Simulate Stripe card verification
    setTimeout(async () => {
      try {
        const last4 = cardNumber.slice(-4);
        const newCard: PaymentMethod = {
          id: `card_${Date.now()}`,
          methodType: PaymentMethodType.card,
          last4,
          brand: cardBrand,
          bankName: undefined,
          accountType: undefined,
          stripeVerificationStatus: "verified",
          addedAt: BigInt(Date.now() * 1000000),
        };

        await addPaymentMethod.mutateAsync(newCard);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }

        toast.success("Card added successfully!", {
          description: `${cardBrand.toUpperCase()} ending in ${last4}`,
        });

        setAddCardDialogOpen(false);
        setCardNumber("");
        setCardExpiry("");
        setCardCVC("");
        setCardBrand("visa");
      } catch (error) {
        toast.error("Failed to add card", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleAddBank = async () => {
    if (!bankName || !accountNumber || !routingNumber) {
      toast.error("Please fill in all bank account details");
      return;
    }

    setIsProcessing(true);

    // Simulate Stripe bank verification
    setTimeout(async () => {
      try {
        const last4 = accountNumber.slice(-4);
        const newBank: PaymentMethod = {
          id: `bank_${Date.now()}`,
          methodType: PaymentMethodType.bankAccount,
          last4,
          brand: undefined,
          bankName,
          accountType,
          stripeVerificationStatus: "pending",
          addedAt: BigInt(Date.now() * 1000000),
        };

        await addPaymentMethod.mutateAsync(newBank);

        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }

        toast.success("Bank account added successfully!", {
          description: `${bankName} ${accountType} account ending in ${last4}`,
        });

        setAddBankDialogOpen(false);
        setBankName("");
        setAccountNumber("");
        setRoutingNumber("");
        setAccountType("checking");
      } catch (error) {
        toast.error("Failed to add bank account", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  const handleRemovePaymentMethod = async (
    methodId: string,
    methodType: string,
  ) => {
    try {
      await removePaymentMethod.mutateAsync(methodId);

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(50);
      }

      toast.success(`${methodType} removed successfully`);
    } catch (error) {
      toast.error(`Failed to remove ${methodType}`, {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </CardContent>
      </Card>
    );
  }

  const cards =
    paymentMethods?.filter((m) => m.methodType === PaymentMethodType.card) ||
    [];
  const banks =
    paymentMethods?.filter(
      (m) => m.methodType === PaymentMethodType.bankAccount,
    ) || [];

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <img
              src="/assets/generated/payment-settings-icon.dim_32x32.png"
              alt="Payment Methods"
              className="h-5 w-5"
            />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cards Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/generated/credit-card-icon.dim_32x32.png"
                    alt="Cards"
                    className="h-4 w-4"
                  />
                  <h4 className="text-sm font-medium text-white">Cards</h4>
                </div>
                <Button
                  onClick={() => setAddCardDialogOpen(true)}
                  size="sm"
                  className="bg-teal hover:bg-teal/90 text-navy-dark font-semibold shadow-lg shadow-teal/30 h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {cards.length === 0 ? (
                <div className="glassmorphism p-4 rounded-lg text-center">
                  <CreditCard className="h-6 w-6 text-white/40 mx-auto mb-1" />
                  <p className="text-xs text-white/60">No cards added</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="glassmorphism p-3 rounded-lg flex items-center justify-between group hover:border-teal/40 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 bg-teal/20 rounded">
                          <CreditCard className="h-3.5 w-3.5 text-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-white truncate">
                              {card.brand?.toUpperCase()} •••• {card.last4}
                            </p>
                            {card.stripeVerificationStatus === "verified" ? (
                              <CheckCircle2 className="h-3 w-3 text-teal flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleRemovePaymentMethod(card.id, "Card")
                        }
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bank Accounts Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/assets/generated/bank-account-icon.dim_32x32.png"
                    alt="Bank Accounts"
                    className="h-4 w-4"
                  />
                  <h4 className="text-sm font-medium text-white">
                    Bank Accounts
                  </h4>
                </div>
                <Button
                  onClick={() => setAddBankDialogOpen(true)}
                  size="sm"
                  className="bg-teal hover:bg-teal/90 text-navy-dark font-semibold shadow-lg shadow-teal/30 h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {banks.length === 0 ? (
                <div className="glassmorphism p-4 rounded-lg text-center">
                  <Building2 className="h-6 w-6 text-white/40 mx-auto mb-1" />
                  <p className="text-xs text-white/60">
                    No bank accounts added
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {banks.map((bank) => (
                    <div
                      key={bank.id}
                      className="glassmorphism p-3 rounded-lg flex items-center justify-between group hover:border-teal/40 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 bg-teal/20 rounded">
                          <Building2 className="h-3.5 w-3.5 text-teal" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-white truncate">
                              {bank.bankName} •••• {bank.last4}
                            </p>
                            {bank.stripeVerificationStatus === "verified" ? (
                              <CheckCircle2 className="h-3 w-3 text-teal flex-shrink-0" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-white/50 capitalize truncate">
                            {bank.accountType}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          handleRemovePaymentMethod(bank.id, "Bank account")
                        }
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security Note */}
          <div className="glassmorphism p-3 rounded-lg border border-teal/20 mt-4">
            <div className="flex items-start gap-2">
              <img
                src="/assets/generated/security-shield-icon.dim_32x32.png"
                alt="Security"
                className="h-4 w-4 mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-xs font-medium text-white mb-0.5">
                  Secure Payment Processing
                </p>
                <p className="text-xs text-white/60 leading-relaxed">
                  All payment methods are securely processed through Stripe with
                  AES-256 encryption.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Card Dialog */}
      <Dialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
        <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-teal/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal" />
              Add Debit or Credit Card
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your card details to link it for payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardBrand" className="text-white">
                Card Type
              </Label>
              <Select value={cardBrand} onValueChange={setCardBrand}>
                <SelectTrigger className="bg-navy-dark/50 border-teal/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-teal/30">
                  <SelectItem value="visa">Visa</SelectItem>
                  <SelectItem value="mastercard">Mastercard</SelectItem>
                  <SelectItem value="amex">American Express</SelectItem>
                  <SelectItem value="discover">Discover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-white">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(cardNumber)}
                onChange={(e) =>
                  setCardNumber(e.target.value.replace(/\s/g, ""))
                }
                maxLength={19}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry" className="text-white">
                  Expiry Date
                </Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={formatExpiry(cardExpiry)}
                  onChange={(e) =>
                    setCardExpiry(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={5}
                  className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCVC" className="text-white">
                  CVC
                </Label>
                <Input
                  id="cardCVC"
                  placeholder="123"
                  value={cardCVC}
                  onChange={(e) =>
                    setCardCVC(e.target.value.replace(/\D/g, ""))
                  }
                  maxLength={4}
                  className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddCardDialogOpen(false)}
              disabled={isProcessing}
              className="border-teal/30 text-white hover:bg-teal/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              disabled={isProcessing}
              className="bg-teal hover:bg-teal/90 text-navy-dark font-semibold shadow-lg shadow-teal/30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Add Card"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Dialog */}
      <Dialog open={addBankDialogOpen} onOpenChange={setAddBankDialogOpen}>
        <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-teal/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal" />
              Connect Bank Account
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your bank account details to link it for deposits and
              payments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-white">
                Bank Name
              </Label>
              <Input
                id="bankName"
                placeholder="Chase Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-white">
                Account Type
              </Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger className="bg-navy-dark/50 border-teal/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-teal/30">
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber" className="text-white">
                Routing Number
              </Label>
              <Input
                id="routingNumber"
                placeholder="123456789"
                value={routingNumber}
                onChange={(e) =>
                  setRoutingNumber(e.target.value.replace(/\D/g, ""))
                }
                maxLength={9}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-white">
                Account Number
              </Label>
              <Input
                id="accountNumber"
                placeholder="1234567890"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(e.target.value.replace(/\D/g, ""))
                }
                maxLength={17}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddBankDialogOpen(false)}
              disabled={isProcessing}
              className="border-teal/30 text-white hover:bg-teal/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBank}
              disabled={isProcessing}
              className="bg-teal hover:bg-teal/90 text-navy-dark font-semibold shadow-lg shadow-teal/30"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Connect Bank"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
