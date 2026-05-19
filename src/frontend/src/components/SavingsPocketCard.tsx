import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowDownLeft, ArrowUpRight, Loader2, PiggyBank } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDepositToSavings,
  useGetSavingsBalance,
  useGetSavingsHistory,
  useWithdrawFromSavings,
} from "../hooks/useQueries";

// ── Transfer Sheet ─────────────────────────────────────────────────────────────
interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: "deposit" | "withdraw";
  currentBalance: bigint;
}

function TransferSheet({
  open,
  onOpenChange,
  direction,
  currentBalance,
}: TransferSheetProps) {
  const [amount, setAmount] = useState("");
  const deposit = useDepositToSavings();
  const withdraw = useWithdrawFromSavings();

  const isPending = deposit.isPending || withdraw.isPending;
  const isDeposit = direction === "deposit";
  const maxAmount = Number(currentBalance) / 100;

  const handleSubmit = async () => {
    const cents = Math.round(Number.parseFloat(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      if (isDeposit) {
        await deposit.mutateAsync(BigInt(cents));
        toast.success(`$${(cents / 100).toFixed(2)} moved to Savings`);
      } else {
        await withdraw.mutateAsync(BigInt(cents));
        toast.success(`$${(cents / 100).toFixed(2)} moved to your Wallet`);
      }
      onOpenChange(false);
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-navy-dark/98 backdrop-blur-xl border-t border-teal/20 rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            {isDeposit ? (
              <ArrowUpRight className="h-5 w-5 text-teal" />
            ) : (
              <ArrowDownLeft className="h-5 w-5 text-teal" />
            )}
            {isDeposit ? "Move to Savings" : "Move to Wallet"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          <div>
            <p className="text-xs text-white/40 mb-1.5">
              {isDeposit
                ? `Available in wallet: $${maxAmount.toFixed(2)}`
                : `Available in savings: $${(Number(currentBalance) / 100).toFixed(2)}`}
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">
                $
              </span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14"
                data-ocid="savings.amount_input"
                autoFocus
              />
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white/70 hover:bg-teal/10 hover:border-teal/30 hover:text-teal transition-all"
              >
                ${v}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!amount.trim() || isPending}
            className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-5"
            data-ocid="savings.transfer_submit_button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isDeposit ? (
              <ArrowUpRight className="h-4 w-4 mr-2" />
            ) : (
              <ArrowDownLeft className="h-4 w-4 mr-2" />
            )}
            {isDeposit ? "Move to Savings" : "Move to Wallet"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SavingsPocketCard() {
  const { data: savingsBalance = BigInt(0), isLoading: balanceLoading } =
    useGetSavingsBalance();
  const { data: history = [], isLoading: historyLoading } =
    useGetSavingsHistory();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const recent = history.slice(0, 8);

  return (
    <div
      className="glassmorphism rounded-2xl border border-white/10 overflow-hidden"
      data-ocid="savings.card"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-teal/10 to-teal/5 border-b border-teal/20 p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-teal/20 border border-teal/30 flex items-center justify-center">
            <PiggyBank className="h-6 w-6 text-teal" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Savings Pocket
            </p>
            {balanceLoading ? (
              <div className="h-7 w-28 bg-white/10 rounded-lg animate-pulse mt-1" />
            ) : (
              <p className="text-2xl font-bold text-teal leading-tight">
                ${(Number(savingsBalance) / 100).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            onClick={() => setDepositOpen(true)}
            className="bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold text-sm transition-all duration-200"
            data-ocid="savings.deposit_button"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Move to Savings
          </Button>
          <Button
            onClick={() => setWithdrawOpen(true)}
            variant="outline"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold text-sm"
            data-ocid="savings.withdraw_button"
          >
            <ArrowDownLeft className="h-4 w-4 mr-2" />
            Move to Wallet
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
          Recent Moves
        </p>

        {historyLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-6" data-ocid="savings.empty_state">
            <PiggyBank className="h-8 w-8 text-white/15 mx-auto mb-2" />
            <p className="text-xs text-white/30">No savings history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((item, idx) => {
              const isIn =
                item.direction === "in" || String(item.direction) === "in";
              const ts = new Date(Number(item.timestamp) / 1_000_000);
              return (
                <div
                  key={`${item.timestamp}-${idx}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors"
                  data-ocid={`savings.history.item.${idx + 1}`}
                >
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      isIn
                        ? "bg-teal/15 text-teal"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {isIn ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">
                      {isIn ? "Moved to savings" : "Moved to wallet"}
                    </p>
                    <p className="text-[10px] text-white/30">
                      {ts.toLocaleDateString()}{" "}
                      {ts.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-bold shrink-0 ${isIn ? "text-teal" : "text-white/70"}`}
                  >
                    {isIn ? "+" : "-"}${(Number(item.amount) / 100).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransferSheet
        open={depositOpen}
        onOpenChange={setDepositOpen}
        direction="deposit"
        currentBalance={savingsBalance}
      />
      <TransferSheet
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        direction="withdraw"
        currentBalance={savingsBalance}
      />
    </div>
  );
}
