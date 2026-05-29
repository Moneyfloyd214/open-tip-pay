import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleAlert as AlertCircle, ArrowDownLeft, ArrowUpRight, Briefcase, ChevronDown, ChevronUp, DollarSign, Loader as Loader2, RefreshCw, Scissors, Users, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import type { MoneyRequest } from "../hooks/useQueries";
import {
  SplitParticipantStatus,
  SplitPaymentStatus,
  type Tip,
  type Variant_fiat_crypto,
} from "../types/local-backend";
import {
  useCancelMoneyRequest,
  useCancelSplitPayment,
  useCryptoExchangeRates,
  useGetRequestsReceived,
  useGetRequestsSent,
  useGetSplitPayments,
  useGetTipsReceived,
  useGetTipsSent,
  useRespondToMoneyRequest,
  useRespondToSplitPayment,
} from "../hooks/useQueries";
import DisputeModal from "./DisputeModal";
import RecurringPayments from "./RecurringPayments";

interface TransactionHistoryProps {
  onRequestUser?: (username: string) => void;
}

export default function TransactionHistory({
  onRequestUser: _onRequestUser,
}: TransactionHistoryProps) {
  const { data: tipsSent, isLoading: sentLoading } = useGetTipsSent();
  const { data: tipsReceived, isLoading: receivedLoading } =
    useGetTipsReceived();
  const { data: requestsSent, isLoading: reqSentLoading } =
    useGetRequestsSent();
  const { data: requestsReceived, isLoading: reqReceivedLoading } =
    useGetRequestsReceived();
  const { data: exchangeRates, isLoading: ratesLoading } =
    useCryptoExchangeRates();
  const { data: splitPayments, isLoading: splitsLoading } =
    useGetSplitPayments();
  const { clerkUserId } = useAuth();
  const myPrincipalStr = clerkUserId ?? "";
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Tip | null>(
    null,
  );

  const handleDisputeClick = (tip: Tip) => {
    setSelectedTransaction(tip);
    setDisputeModalOpen(true);
  };

  const pendingReceived =
    requestsReceived?.filter((r) => r.status === "pending") ?? [];
  const pendingCount = pendingReceived.length;

  const activeSplits =
    splitPayments?.filter((s) => s.status === SplitPaymentStatus.Active) ?? [];
  const completedSplits =
    splitPayments?.filter(
      (s) =>
        s.status === SplitPaymentStatus.Settled ||
        s.status === SplitPaymentStatus.Cancelled,
    ) ?? [];


  return (
    <>
      <Card className="border-border bg-muted/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              <TabsTrigger
                value="received"
                data-ocid="transaction_history.received_tab"
                className="data-[state=active]:bg-teal text-xs"
              >
                Received
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                data-ocid="transaction_history.sent_tab"
                className="data-[state=active]:bg-teal text-xs"
              >
                Sent
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                data-ocid="transaction_history.requests_tab"
                className="data-[state=active]:bg-teal text-xs relative"
              >
                Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-teal text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recurring"
                data-ocid="transaction_history.recurring_tab"
                className="data-[state=active]:bg-teal text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Auto
              </TabsTrigger>
              <TabsTrigger
                value="splits"
                data-ocid="transaction_history.splits_tab"
                className="data-[state=active]:bg-teal text-xs relative"
              >
                <Scissors className="h-3 w-3 mr-1" />
                Splits
                {activeSplits.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-teal text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeSplits.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-4 space-y-3">
              {receivedLoading ? (
                <TransactionSkeleton />
              ) : tipsReceived && tipsReceived.length > 0 ? (
                tipsReceived
                  .slice()
                  .reverse()
                  .map((tip, index) => (
                    <TransactionItem
                      key={`received-${String(tip.timestamp)}-${index}`}
                      tip={tip}
                      type="received"
                      exchangeRates={exchangeRates}
                      ratesLoading={ratesLoading}
                      onDisputeClick={handleDisputeClick}
                    />
                  ))
              ) : (
                <EmptyState message="No tips received yet" />
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-4 space-y-3">
              {sentLoading ? (
                <TransactionSkeleton />
              ) : tipsSent && tipsSent.length > 0 ? (
                tipsSent
                  .slice()
                  .reverse()
                  .map((tip, index) => (
                    <TransactionItem
                      key={`sent-${String(tip.timestamp)}-${index}`}
                      tip={tip}
                      type="sent"
                      exchangeRates={exchangeRates}
                      ratesLoading={ratesLoading}
                      onDisputeClick={handleDisputeClick}
                    />
                  ))
              ) : (
                <EmptyState message="No tips sent yet" />
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-4 space-y-6">
              {reqSentLoading || reqReceivedLoading ? (
                <TransactionSkeleton />
              ) : (
                <>
                  {requestsReceived && requestsReceived.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Requests from Others
                      </p>
                      {requestsReceived
                        .slice()
                        .reverse()
                        .map((req, index) => (
                          <MoneyRequestItem
                            key={`req-received-${String(req.id)}-${index}`}
                            request={req}
                            perspective="received"
                            index={index + 1}
                          />
                        ))}
                    </div>
                  )}

                  {requestsSent && requestsSent.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Your Requests
                      </p>
                      {requestsSent
                        .slice()
                        .reverse()
                        .map((req, index) => (
                          <MoneyRequestItem
                            key={`req-sent-${String(req.id)}-${index}`}
                            request={req}
                            perspective="sent"
                            index={index + 1}
                          />
                        ))}
                    </div>
                  )}

                  {(!requestsReceived || requestsReceived.length === 0) &&
                    (!requestsSent || requestsSent.length === 0) && (
                      <div data-ocid="requests.empty_state">
                        <EmptyState message="No money requests yet" />
                      </div>
                    )}
                </>
              )}
            </TabsContent>

            <TabsContent value="recurring" className="mt-4">
              <RecurringPayments />
            </TabsContent>

            <TabsContent value="splits" className="mt-4 space-y-5">
              {splitsLoading ? (
                <TransactionSkeleton />
              ) : (
                <>
                  {/* Active splits */}
                  {activeSplits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Active
                      </p>
                      {activeSplits.map((split, index) => (
                        <SplitPaymentItem
                          key={split.id}
                          split={split}
                          index={index + 1}
                          myPrincipalStr={myPrincipalStr}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed splits */}
                  {completedSplits.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Completed
                      </p>
                      {completedSplits.map((split, index) => (
                        <SplitPaymentItem
                          key={split.id}
                          split={split}
                          index={activeSplits.length + index + 1}
                          myPrincipalStr={myPrincipalStr}
                        />
                      ))}
                    </div>
                  )}

                  {(!splitPayments || splitPayments.length === 0) && (
                    <div data-ocid="splits.empty_state">
                      <EmptyState message="No split payments yet" />
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedTransaction && (
        <DisputeModal
          open={disputeModalOpen}
          onOpenChange={setDisputeModalOpen}
          transaction={selectedTransaction}
        />
      )}
    </>
  );
}

// ── MoneyRequestItem ──────────────────────────────────────────────────────────

interface MoneyRequestItemProps {
  request: MoneyRequest;
  perspective: "sent" | "received";
  index: number;
}

function MoneyRequestItem({
  request,
  perspective,
  index,
}: MoneyRequestItemProps) {
  const respondMutation = useRespondToMoneyRequest();
  const cancelMutation = useCancelMoneyRequest();

  const amount = Number(request.amount) / 100;
  const date = new Date(Number(request.timestamp) / 1_000_000);
  const status = request.status as string;
  const isPending = status === "pending";

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    paid: { label: "Paid", className: "bg-teal/20 text-teal border-teal/30" },
    declined: {
      label: "Declined",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-muted/50 text-muted-foreground border-border",
    },
  };

  const { label, className } = statusConfig[status] ?? {
    label: status,
    className: "bg-muted/50 text-muted-foreground border-border",
  };

  const handleAccept = async () => {
    try {
      await respondMutation.mutateAsync({
        requestId: request.id,
        accept: true,
      });
      toast.success("Payment sent successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to pay request");
    }
  };

  const handleDecline = async () => {
    try {
      await respondMutation.mutateAsync({
        requestId: request.id,
        accept: false,
      });
      toast.success("Request declined.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to decline request",
      );
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(request.id);
      toast.success("Request cancelled.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel request",
      );
    }
  };

  const isActing = respondMutation.isPending || cancelMutation.isPending;

  return (
    <div
      data-ocid={`${perspective === "received" ? "requests_received" : "requests_sent"}.item.${index}`}
      className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
          perspective === "received" ? "bg-teal/20" : "bg-card/50"
        }`}
      >
        {perspective === "received" ? (
          <ArrowUpRight className="h-5 w-5 text-teal" />
        ) : (
          <ArrowDownLeft className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {perspective === "received" ? "Request from" : "Request to"}{" "}
              <span className="text-teal">
                {perspective === "received"
                  ? `${String(request.fromUser).substring(0, 12)}…`
                  : `${String(request.toUser).substring(0, 12)}…`}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              ${amount.toFixed(2)} · {date.toLocaleDateString()} at{" "}
              {date.getHours().toString().padStart(2, "0")}:
              {date.getMinutes().toString().padStart(2, "0")}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${className}`}
          >
            {label}
          </Badge>
        </div>

        {request.message && (
          <p className="text-xs text-muted-foreground italic">
            "{request.message}"
          </p>
        )}

        {/* Actions */}
        {isPending && perspective === "received" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              data-ocid={`requests_received.pay_button.${index}`}
              onClick={handleAccept}
              disabled={isActing}
              className="h-7 text-xs bg-teal hover:bg-teal/90 text-white shadow-md shadow-teal/20"
            >
              {respondMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Pay Now"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-ocid={`requests_received.decline_button.${index}`}
              onClick={handleDecline}
              disabled={isActing}
              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {respondMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <X className="mr-1 h-3 w-3" />
                  Decline
                </>
              )}
            </Button>
          </div>
        )}

        {isPending && perspective === "sent" && (
          <div className="pt-1">
            <Button
              size="sm"
              variant="outline"
              data-ocid={`requests_sent.cancel_button.${index}`}
              onClick={handleCancel}
              disabled={isActing}
              className="h-7 text-xs border-border text-muted-foreground hover:bg-muted/30 hover:text-foreground/80"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <X className="mr-1 h-3 w-3" />
              )}
              Cancel Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TransactionItem ───────────────────────────────────────────────────────────

interface TransactionItemProps {
  tip: Tip;
  type: "sent" | "received";
  exchangeRates?: { ethereum: { usd: number }; bitcoin: { usd: number } };
  ratesLoading: boolean;
  onDisputeClick: (tip: Tip) => void;
}

function TransactionItem({
  tip,
  type,
  exchangeRates,
  ratesLoading,
  onDisputeClick,
}: TransactionItemProps) {
  const amount = Number(tip.amount) / 100;
  const date = new Date(Number(tip.timestamp) / 1000000);
  const isCrypto = tip.currencyType === Variant_fiat_crypto.crypto;

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  const getApproximateUSD = (): string | null => {
    if (!isCrypto || !exchangeRates || ratesLoading) return null;
    const ethRate = exchangeRates.ethereum.usd;
    const usdValue = amount * ethRate;
    return usdValue.toFixed(2);
  };

  const approximateUSD = getApproximateUSD();

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          type === "received" ? "bg-teal/20" : "bg-card/50"
        }`}
      >
        {tip.professional ? (
          <Briefcase className="h-5 w-5 text-teal" />
        ) : type === "received" ? (
          <ArrowDownLeft className="h-5 w-5 text-teal" />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {type === "received" ? "Received" : "Sent"} ${amount.toFixed(2)}
              </p>
              {isCrypto ? (
                <Wallet className="h-3.5 w-3.5 text-teal" />
              ) : (
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            {isCrypto && approximateUSD && (
              <p className="text-xs text-muted-foreground italic mt-0.5">
                ≈ ${approximateUSD} USD
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {date.toLocaleDateString()} at {formattedTime}
            </p>
          </div>
          {tip.professional && (
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-xs text-teal">
              Professional
            </span>
          )}
        </div>
        {tip.message && (
          <p className="text-xs text-muted-foreground italic">
            "{tip.message}"
          </p>
        )}
        {isCrypto && approximateUSD && (
          <p className="text-[10px] text-muted-foreground/50 italic mt-1">
            Approximate value based on current market rates. Showing the USD
            equivalent.
          </p>
        )}

        {/* Dispute Button - Only show for sent transactions */}
        {type === "sent" && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDisputeClick(tip)}
              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <AlertCircle className="mr-1.5 h-3 w-3" />
              Dispute / Recall
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── SplitPaymentItem ─────────────────────────────────────────────────────────

import type { SplitPayment } from "../hooks/useQueries";

interface SplitPaymentItemProps {
  split: SplitPayment;
  index: number;
  myPrincipalStr: string;
}

function SplitPaymentItem({
  split,
  index,
  myPrincipalStr,
}: SplitPaymentItemProps) {
  const [expanded, setExpanded] = useState(false);
  const respondMutation = useRespondToSplitPayment();
  const cancelMutation = useCancelSplitPayment();

  const isInitiator = split.initiator.toString() === myPrincipalStr;
  const myParticipantEntry = split.participants.find(
    (p) => p.principal.toString() === myPrincipalStr,
  );
  const isParticipant = !!myParticipantEntry && !isInitiator;
  const isActive = split.status === SplitPaymentStatus.Active;

  const totalCents = Number(split.totalAmount);
  const date = new Date(Number(split.createdAt) / 1_000_000);

  const statusConfig: Record<string, { label: string; className: string }> = {
    [SplitPaymentStatus.Active]: {
      label: "Active",
      className: "bg-teal/20 text-teal border-teal/30",
    },
    [SplitPaymentStatus.Settled]: {
      label: "Settled",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    [SplitPaymentStatus.Cancelled]: {
      label: "Cancelled",
      className: "bg-muted/50 text-muted-foreground border-border",
    },
  };

  const participantStatusConfig: Record<
    string,
    { label: string; className: string }
  > = {
    [SplitParticipantStatus.Pending]: {
      label: "Pending",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    [SplitParticipantStatus.Accepted]: {
      label: "Accepted",
      className: "bg-teal/20 text-teal border-teal/30",
    },
    [SplitParticipantStatus.Declined]: {
      label: "Declined",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    [SplitParticipantStatus.Paid]: {
      label: "Paid",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
  };

  const { label: statusLabel, className: statusClass } = statusConfig[
    split.status as string
  ] ?? {
    label: String(split.status),
    className: "bg-muted/50 text-muted-foreground",
  };

  const handleAccept = async () => {
    try {
      await respondMutation.mutateAsync({ splitId: split.id, accept: true });
      toast.success("Split accepted!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept split",
      );
    }
  };

  const handleDecline = async () => {
    try {
      await respondMutation.mutateAsync({ splitId: split.id, accept: false });
      toast.success("Split declined.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to decline split",
      );
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(split.id);
      toast.success("Split cancelled.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel split",
      );
    }
  };

  const isActing = respondMutation.isPending || cancelMutation.isPending;

  return (
    <div
      data-ocid={`splits.item.${index}`}
      className="rounded-xl bg-muted/30 border border-border/50 overflow-hidden"
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors duration-150"
        aria-expanded={expanded}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/20 flex-shrink-0">
          <Scissors className="h-5 w-5 text-teal" />
        </div>

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {split.description}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {split.participants.length} participant
                {split.participants.length !== 1 ? "s" : ""} ·{" "}
                {date.toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-teal font-semibold text-sm">
                ${(totalCents / 100).toFixed(2)}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0.5 ${statusClass}`}
              >
                {statusLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-white/40 flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded participant breakdown */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-3">
          {split.participants.map((p, pi) => {
            const pStatus = participantStatusConfig[p.status as string] ?? {
              label: String(p.status),
              className: "bg-muted/50 text-muted-foreground",
            };
            return (
              <div
                key={`${split.id}-p-${pi}`}
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-7 w-7 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center flex-shrink-0 text-[10px] text-muted-foreground font-semibold">
                  {p.nickname.substring(0, 2).toUpperCase()}
                </div>
                <span className="flex-1 text-foreground/80 truncate min-w-0">
                  {p.nickname || `${p.principal.toString().substring(0, 8)}…`}
                </span>
                <span className="text-muted-foreground text-xs">
                  ${(Number(p.amount) / 100).toFixed(2)}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${pStatus.className}`}
                >
                  {pStatus.label}
                </Badge>
              </div>
            );
          })}

          {/* Action buttons */}
          {isActive && isInitiator && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                data-ocid={`splits.cancel_button.${index}`}
                onClick={handleCancel}
                disabled={isActing}
                className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <X className="mr-1 h-3 w-3" />
                )}
                Cancel Split
              </Button>
            </div>
          )}

          {isActive &&
            isParticipant &&
            myParticipantEntry?.status === SplitParticipantStatus.Pending && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  data-ocid={`splits.accept_button.${index}`}
                  onClick={handleAccept}
                  disabled={isActing}
                  className="h-7 text-xs bg-teal hover:bg-teal/90 text-white shadow-md shadow-teal/20"
                >
                  {respondMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Accept & Pay"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  data-ocid={`splits.decline_button.${index}`}
                  onClick={handleDecline}
                  disabled={isActing}
                  className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {respondMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <X className="mr-1 h-3 w-3" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

// ── TransactionSkeleton ───────────────────────────────────────────────────────

function TransactionSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg bg-muted/30 p-3"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
