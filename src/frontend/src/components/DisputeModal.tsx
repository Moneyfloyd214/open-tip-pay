import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { TriangleAlert as AlertTriangle, Loader as Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Tip, Variant_fiat_crypto } from "../types/local-backend";
import { type DisputeReason, useSubmitDispute } from "../hooks/useQueries";

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Tip;
}

export default function DisputeModal({
  open,
  onOpenChange,
  transaction,
}: DisputeModalProps) {
  const [reason, setReason] = useState<DisputeReason>("Mistaken Send");
  const [description, setDescription] = useState("");
  const [aiGuidance, setAiGuidance] = useState<string>("");
  const submitDispute = useSubmitDispute();

  const reasons: DisputeReason[] = [
    "Mistaken Send",
    "Wrong Recipient",
    "Suspected Scam",
    "Other",
  ];

  const handleReasonChange = (newReason: DisputeReason) => {
    setReason(newReason);

    // AI-powered guidance based on reason
    switch (newReason) {
      case "Mistaken Send":
        setAiGuidance(
          "This appears to be a mistaken transfer. You may request a reversal within 24 hours if the recipient agrees. Provide details about what went wrong.",
        );
        break;
      case "Wrong Recipient":
        setAiGuidance(
          "If you sent funds to the wrong person, contact them immediately. Include the correct recipient details in your description.",
        );
        break;
      case "Suspected Scam":
        setAiGuidance(
          "Report suspected scams immediately. Provide all evidence and communication details. Our security team will investigate and may freeze the transaction.",
        );
        break;
      case "Other":
        setAiGuidance(
          "Please provide detailed information about your dispute. Our AI will analyze your case and suggest the best course of action.",
        );
        break;
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please provide a description of the dispute");
      return;
    }

    try {
      await submitDispute.mutateAsync({
        transactionId: transaction.timestamp.toString(),
        fromUser: transaction.fromUser,
        toUser: transaction.toUser,
        reason,
        description: description.trim(),
        amount: transaction.amount,
        currencyType: transaction.currencyType,
      });

      toast.success("Dispute submitted successfully", {
        description: "Our team will review your case and get back to you soon.",
      });

      onOpenChange(false);
      setDescription("");
      setReason("Mistaken Send");
    } catch (error) {
      toast.error("Failed to submit dispute", {
        description:
          error instanceof Error ? error.message : "Please try again later",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy-light/95 backdrop-blur-xl border-teal/20 text-white max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/dispute-warning-icon-transparent.dim_24x24.png"
              alt="Dispute"
              className="h-6 w-6"
            />
            <DialogTitle className="text-xl">Dispute Transaction</DialogTitle>
          </div>
          <DialogDescription className="text-white/70">
            Submit a dispute for this transaction. Our AI assistant will guide
            you through the process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Transaction Details */}
          <div className="glassmorphism rounded-lg p-4 space-y-2">
            <p className="text-xs text-white/60">Transaction Details</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Amount:</span>
              <span className="text-sm font-semibold text-white">
                ${(Number(transaction.amount) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Type:</span>
              <span className="text-sm text-white/80">
                {transaction.currencyType === Variant_fiat_crypto.crypto
                  ? "Crypto"
                  : "Fiat"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white">Date:</span>
              <span className="text-sm text-white/80">
                {new Date(
                  Number(transaction.timestamp) / 1000000,
                ).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-white">Reason for Dispute</Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) => handleReasonChange(v as DisputeReason)}
            >
              {reasons.map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={r}
                    id={r}
                    className="border-teal text-teal"
                  />
                  <Label htmlFor={r} className="text-white/90 cursor-pointer">
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* AI Guidance */}
          {aiGuidance && (
            <div className="glassmorphism rounded-lg p-4 border border-teal/30">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-teal mb-1">
                    AI Guidance
                  </p>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {aiGuidance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Describe the Issue
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] bg-navy-dark/50 border-white/10 text-white placeholder:text-white/40 focus:border-teal"
            />
            <p className="text-xs text-white/50">
              Be as specific as possible to help us resolve your dispute
              quickly.
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200">
              Submitting a false dispute may result in account restrictions.
              Only dispute legitimate issues.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/20 text-white hover:bg-white/10"
            disabled={submitDispute.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-teal hover:bg-teal/80"
            disabled={submitDispute.isPending || !description.trim()}
          >
            {submitDispute.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
