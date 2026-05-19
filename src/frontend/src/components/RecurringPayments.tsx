import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@dfinity/principal";
import {
  CalendarClock,
  Loader2,
  PlusCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCancelRecurringPayment,
  useCreateRecurringPayment,
  useGetMyRecurringPayments,
  useToggleRecurringPayment,
} from "../hooks/useQueries";

type Frequency = "Daily" | "Weekly" | "Monthly";

// ── Setup Sheet ────────────────────────────────────────────────────────────────
interface SetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SetupSheet({ open, onOpenChange }: SetupSheetProps) {
  const [principalText, setPrincipalText] = useState("");
  const [principalError, setPrincipalError] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const create = useCreateRecurringPayment();

  const validatePrincipal = (text: string): Principal | null => {
    if (!text.trim()) return null;
    try {
      return Principal.fromText(text.trim());
    } catch {
      return null;
    }
  };

  const handlePrincipalChange = (v: string) => {
    setPrincipalText(v);
    if (v.trim() && !validatePrincipal(v)) {
      setPrincipalError("Invalid Principal ID format");
    } else {
      setPrincipalError("");
    }
  };

  const handleSubmit = async () => {
    const principal = validatePrincipal(principalText);
    if (!principal) {
      toast.error("Please enter a valid recipient Principal ID");
      return;
    }
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!message.trim()) {
      toast.error("A message is required");
      return;
    }
    try {
      await create.mutateAsync({
        toUser: principal,
        amount: BigInt(amountCents),
        message: message.trim(),
        frequency,
      });
      toast.success("Recurring payment set up!");
      onOpenChange(false);
      setPrincipalText("");
      setPrincipalError("");
      setAmount("");
      setMessage("");
      setFrequency("Weekly");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create recurring payment",
      );
    }
  };

  const canSubmit =
    !!principalText.trim() &&
    !principalError &&
    amount.trim() !== "" &&
    message.trim() !== "" &&
    !create.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-navy-dark/98 backdrop-blur-xl border-t border-teal/20 rounded-t-2xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-teal" />
            Set Up Recurring Payment
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-8">
          {/* Recipient Principal */}
          <div>
            <label
              htmlFor="recurring-principal"
              className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2"
            >
              Recipient Principal ID
            </label>
            <Input
              id="recurring-principal"
              placeholder="e.g. aaaaa-bbbbb-ccccc-ddddd-cai"
              value={principalText}
              onChange={(e) => handlePrincipalChange(e.target.value)}
              className={`bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono text-sm ${principalError ? "border-red-500/50" : ""}`}
              data-ocid="recurring.recipient_input"
            />
            {principalError && (
              <p className="text-xs text-red-400 mt-1">{principalError}</p>
            )}
            <p className="text-[10px] text-white/30 mt-1">
              Ask the recipient to share their Principal ID from their Profile
              page
            </p>
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="recurring-amount"
              className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2"
            >
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">
                $
              </span>
              <Input
                id="recurring-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                data-ocid="recurring.amount_input"
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Frequency
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["Daily", "Weekly", "Monthly"] as Frequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  data-ocid={`recurring.frequency-${f.toLowerCase()}`}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    frequency === f
                      ? "bg-teal/20 border-teal/50 text-teal"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Message <span className="text-red-400">*</span>
            </p>
            <Textarea
              placeholder="What is this payment for?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm"
              data-ocid="recurring.message_textarea"
            />
            <p className="text-[10px] text-white/30 text-right mt-1">
              {message.length}/200
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-5"
            data-ocid="recurring.submit_button"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Create Recurring Payment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RecurringPayments() {
  const { data: payments = [], isLoading } = useGetMyRecurringPayments();
  const toggle = useToggleRecurringPayment();
  const cancel = useCancelRecurringPayment();
  const [setupOpen, setSetupOpen] = useState(false);
  const [cancelingId, setCancelingId] = useState<bigint | null>(null);

  const handleToggle = async (id: bigint, enabled: boolean) => {
    try {
      await toggle.mutateAsync({ id, enabled });
      toast.success(
        enabled ? "Recurring payment enabled" : "Recurring payment paused",
      );
    } catch {
      toast.error("Failed to update recurring payment");
    }
  };

  const handleCancel = async (id: bigint) => {
    setCancelingId(id);
    try {
      await cancel.mutateAsync(id);
      toast.success("Recurring payment cancelled");
    } catch {
      toast.error("Failed to cancel recurring payment");
    } finally {
      setCancelingId(null);
    }
  };

  const frequencyColor: Record<string, string> = {
    Daily: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Weekly: "text-teal bg-teal/10 border-teal/20",
    Monthly: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-white/5 border border-white/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="recurring.section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-white">Recurring Payments</p>
        </div>
        <Button
          size="sm"
          onClick={() => setSetupOpen(true)}
          className="bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal text-xs font-semibold"
          data-ocid="recurring.add_button"
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
          Set Up
        </Button>
      </div>

      {payments.length === 0 ? (
        <div
          className="text-center py-10 glassmorphism rounded-xl border border-white/10"
          data-ocid="recurring.empty_state"
        >
          <CalendarClock className="h-10 w-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white/60">
            No recurring payments yet
          </p>
          <p className="text-xs text-white/30 mt-1 mb-4">
            Automate your regular tips or payments
          </p>
          <Button
            size="sm"
            onClick={() => setSetupOpen(true)}
            className="bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal text-xs"
            data-ocid="recurring.empty_setup_button"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Set Up Recurring Payment
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p, idx) => {
            const isCanceling = cancelingId === p.id;
            const freq =
              typeof p.frequency === "object"
                ? Object.keys(p.frequency)[0]
                : String(p.frequency);
            const freqClass =
              frequencyColor[freq] ??
              "text-white/50 bg-white/5 border-white/10";
            const recipientStr =
              typeof p.toUser === "object"
                ? `${p.toUser.toString().slice(0, 12)}…`
                : `${String(p.toUser).slice(0, 12)}…`;
            const nextRun = p.nextRunAt
              ? new Date(Number(p.nextRunAt) / 1_000_000).toLocaleDateString()
              : "—";

            return (
              <div
                key={String(p.id)}
                className="glassmorphism rounded-xl p-4 border border-white/10 space-y-3"
                data-ocid={`recurring.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">
                        ${(Number(p.amount) / 100).toFixed(2)}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${freqClass}`}
                      >
                        {freq}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-0.5 truncate font-mono">
                      To: {recipientStr}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      Next: {nextRun}
                    </p>
                    {p.message && (
                      <p className="text-xs text-white/50 italic mt-1 truncate">
                        "{p.message}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Switch
                      checked={p.enabled}
                      onCheckedChange={(v) => handleToggle(p.id, v)}
                      data-ocid={`recurring.toggle.${idx + 1}`}
                      className="data-[state=checked]:bg-teal"
                    />
                    <p className="text-[10px] text-white/30">
                      {p.enabled ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={isCanceling}
                  onClick={() => handleCancel(p.id)}
                  className="w-full border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 text-xs h-7"
                  data-ocid={`recurring.delete_button.${idx + 1}`}
                >
                  {isCanceling ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1.5" />
                  )}
                  Cancel Recurring Payment
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <SetupSheet open={setupOpen} onOpenChange={setSetupOpen} />
    </div>
  );
}
