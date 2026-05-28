import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CircleCheck as CheckCircle2, Loader as Loader2, Percent, Plus, Scissors, Search, SquareSplitVertical as SplitSquareVertical, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCreateSplitPayment,
  useResolveUserByUsername,
  useSearchUsers,
} from "../hooks/useQueries";
import UserNotFound from "./UserNotFound";

type SplitMode = "equal" | "percentage" | "exact";
type Step = "amount" | "participants" | "shares" | "confirm" | "success";

interface Participant {
  username: string;
  photo?: { getDirectURL: () => string };
  isVerified: boolean;
  // Real principal resolved from backend during add — never anonymous
  principal: string | null;
}

interface ParticipantShare {
  username: string;
  photo?: { getDirectURL: () => string };
  isVerified: boolean;
  principal: string;
  share: number; // cents (exact) or percentage (percentage mode) or 0 (equal — computed)
}

interface SplitPaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_DESC_LENGTH = 200;

export default function SplitPaymentSheet({
  isOpen,
  onClose,
}: SplitPaymentSheetProps) {
  const [step, setStep] = useState<Step>("amount");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [descError, setDescError] = useState(false);

  // Participant search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Split config
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [shares, setShares] = useState<ParticipantShare[]>([]);

  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchUsers(searchTerm);
  const createSplit = useCreateSplitPayment();
  const resolveUserByUsername = useResolveUserByUsername();

  const showDropdown = searchFocused && searchTerm.length > 0;
  const showUserNotFound =
    showDropdown && !searchLoading && searchResults.length === 0;

  const totalAmountCents = Math.round(
    (Number.parseFloat(totalAmount) || 0) * 100,
  );

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setStep("amount");
      setTotalAmount("");
      setDescription("");
      setDescError(false);
      setSearchTerm("");
      setSearchFocused(false);
      setParticipants([]);
      setShares([]);
      setSplitMode("equal");
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleClose = () => {
    onClose();
  };

  // ── Step 1: Amount → 2: Participants ──────────────────────────────────────

  const handleAmountNext = () => {
    const amt = Number.parseFloat(totalAmount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid total amount");
      return;
    }
    if (description.trim() === "") {
      setDescError(true);
      toast.error("A description is required");
      return;
    }
    setStep("participants");
  };

  // ── Step 2: Participants → 3: Shares ─────────────────────────────────────

  const handleAddParticipant = async (result: {
    username: string;
    photo?: { getDirectURL: () => string };
    isVerified: boolean;
  }) => {
    if (participants.some((p) => p.username === result.username)) {
      toast.error("Already added");
      return;
    }
    // Resolve real principal before storing — prevents anonymous placeholder
    const principal = await resolveUserByUsername(result.username);
    if (!principal) {
      toast.error(`Could not resolve user @${result.username}`);
      return;
    }
    setParticipants((prev) => [
      ...prev,
      {
        username: result.username,
        photo: result.photo,
        isVerified: result.isVerified,
        principal,
      },
    ]);
    setSearchTerm("");
    setSearchFocused(false);
  };

  const handleRemoveParticipant = (username: string) => {
    setParticipants((prev) => prev.filter((p) => p.username !== username));
  };

  const handleParticipantsNext = () => {
    if (participants.length === 0) {
      toast.error("Add at least one participant");
      return;
    }
    // Verify all participants have resolved principals
    const unresolved = participants.filter((p) => !p.principal);
    if (unresolved.length > 0) {
      toast.error(
        `Could not resolve: ${unresolved.map((p) => `@${p.username}`).join(", ")}`,
      );
      return;
    }
    // Build initial shares — carry resolved principal forward
    const perPerson = Math.floor(totalAmountCents / (participants.length + 1)); // +1 for initiator
    const initialShares: ParticipantShare[] = participants.map((p) => ({
      username: p.username,
      photo: p.photo,
      isVerified: p.isVerified,
      principal: p.principal as string, // safe: checked above
      share:
        splitMode === "percentage"
          ? Math.floor(100 / (participants.length + 1))
          : perPerson,
    }));
    setShares(initialShares);
    setStep("shares");
  };

  // ── Step 3: Shares ────────────────────────────────────────────────────────

  const totalPercentage = shares.reduce((s, p) => s + (p.share || 0), 0);
  const totalExact = shares.reduce((s, p) => s + (p.share || 0), 0);

  const equalShare = Math.floor(totalAmountCents / (shares.length + 1));
  const equalRemainder = totalAmountCents - equalShare * (shares.length + 1);

  const computedShares: number[] =
    splitMode === "equal"
      ? shares.map((_, i) => equalShare + (i === 0 ? equalRemainder : 0))
      : shares.map((p) =>
          splitMode === "percentage"
            ? Math.floor((totalAmountCents * p.share) / 100)
            : p.share,
        );

  const handleShareChange = (index: number, value: string) => {
    const num = Math.max(0, Number.parseFloat(value) || 0);
    setShares((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              share:
                splitMode === "exact" ? Math.round(num * 100) : Math.round(num),
            }
          : p,
      ),
    );
  };

  const sharesValid = () => {
    if (splitMode === "equal") return true;
    if (splitMode === "percentage") return totalPercentage <= 100;
    // exact: sum of participant shares must not exceed total
    return totalExact <= totalAmountCents;
  };

  const handleSharesNext = () => {
    if (!sharesValid()) {
      if (splitMode === "percentage") {
        toast.error("Participant percentages cannot exceed 100%");
      } else {
        toast.error("Participant shares exceed the total amount");
      }
      return;
    }
    setStep("confirm");
  };

  // ── Step 4: Confirm → Submit ──────────────────────────────────────────────

  const handleSubmit = async () => {
    try {
      // All principals are resolved during participant add — no anonymous fallback needed
      const participantShares: Array<[string, bigint]> = computedShares.map(
        (shareCents, i) => [shares[i].principal, BigInt(shareCents)],
      );

      await createSplit.mutateAsync({
        totalAmount: BigInt(totalAmountCents),
        description: description.trim(),
        participantShares,
      });

      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      setStep("success");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create split payment",
      );
    }
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[92vh] bg-card border-t-2 border-teal/30 overflow-y-auto"
      >
        {/* ── Step: Amount + Description ── */}
        {step === "amount" && (
          <>
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-teal/20 flex items-center justify-center">
                  <Scissors className="h-4 w-4 text-teal" />
                </div>
                <SheetTitle className="text-white text-2xl">
                  Split a Bill
                </SheetTitle>
              </div>
              <SheetDescription className="text-white/60">
                Divide a bill among your group
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white">Total Bill Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg font-semibold">
                    $
                  </span>
                  <Input
                    data-ocid="split_payment.amount_input"
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="pl-8 text-xl font-bold bg-card/50 border-teal/30 text-white placeholder:text-white/40 h-14"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">
                  Description / Note{" "}
                  <span className="text-red-400" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Textarea
                  data-ocid="split_payment.description_textarea"
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESC_LENGTH) {
                      setDescription(e.target.value);
                      if (e.target.value.trim()) setDescError(false);
                    }
                  }}
                  placeholder="Dinner at restaurant, vacation rental, etc. (required)"
                  className={`bg-card/50 text-white placeholder:text-white/40 min-h-[80px] transition-colors duration-200 ${
                    descError ? "border-red-400 border-2" : "border-teal/30"
                  }`}
                  aria-required="true"
                />
                <div className="flex justify-between items-center">
                  {descError && (
                    <p
                      data-ocid="split_payment.description_field_error"
                      className="text-red-400 text-xs"
                    >
                      Description is required
                    </p>
                  )}
                  <p
                    className={`text-xs ml-auto ${
                      description.length >= MAX_DESC_LENGTH
                        ? "text-red-400"
                        : "text-white/40"
                    }`}
                  >
                    {description.length}/{MAX_DESC_LENGTH}
                  </p>
                </div>
              </div>

              <Button
                data-ocid="split_payment.amount_next_button"
                onClick={handleAmountNext}
                disabled={
                  !totalAmount ||
                  Number.parseFloat(totalAmount) <= 0 ||
                  description.trim() === ""
                }
                className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-6 text-lg shadow-lg shadow-teal/30 disabled:opacity-40"
              >
                Next: Add People
              </Button>
            </div>
          </>
        )}

        {/* ── Step: Add Participants ── */}
        {step === "participants" && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white text-2xl">
                Add Participants
              </SheetTitle>
              <SheetDescription className="text-white/60">
                Search for people to split{" "}
                <span className="text-teal font-semibold">
                  {formatCents(totalAmountCents)}
                </span>{" "}
                with
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              {/* Search */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal/70 pointer-events-none" />
                  <Input
                    data-ocid="split_payment.search_input"
                    type="text"
                    placeholder="Search by @username or phone number…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="w-full pl-12 pr-10 py-6 text-base bg-card/50 border-2 border-teal/30 rounded-2xl text-white placeholder:text-white/50 focus:border-teal focus:ring-2 focus:ring-teal/50 transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSearchFocused(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-72 overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-teal/30 rounded-2xl shadow-2xl shadow-teal/20 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-teal" />
                      </div>
                    ) : showUserNotFound ? (
                      <UserNotFound searchTerm={searchTerm} />
                    ) : (
                      <div className="py-2">
                        {searchResults.map((result) => {
                          const alreadyAdded = participants.some(
                            (p) => p.username === result.username,
                          );
                          return (
                            <button
                              type="button"
                              key={result.username}
                              data-ocid={`split_payment.search_result.${result.username}`}
                              onClick={() =>
                                !alreadyAdded && handleAddParticipant(result)
                              }
                              disabled={alreadyAdded}
                              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-teal/10 transition-colors duration-200 border-b border-white/5 last:border-b-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Avatar className="h-10 w-10 border-2 border-teal/50 flex-shrink-0">
                                {result.photo ? (
                                  <AvatarImage
                                    src={result.photo.getDirectURL()}
                                    alt={result.username}
                                  />
                                ) : (
                                  <AvatarFallback className="bg-muted text-foreground text-xs">
                                    {result.username
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-semibold text-white truncate">
                                  @{result.username}
                                </p>
                                {result.bio && (
                                  <p className="text-xs text-white/60 truncate">
                                    {result.bio}
                                  </p>
                                )}
                              </div>
                              {alreadyAdded ? (
                                <Badge className="bg-teal/20 text-teal border-teal/30 text-xs">
                                  Added
                                </Badge>
                              ) : (
                                <Plus className="h-4 w-4 text-teal flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Added participants */}
              {participants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Added ({participants.length})
                  </p>
                  <div className="space-y-2">
                    {participants.map((p, i) => (
                      <div
                        key={p.username}
                        data-ocid={`split_payment.participant.${i + 1}`}
                        className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-teal/10"
                      >
                        <Avatar className="h-9 w-9 border border-teal/40 flex-shrink-0">
                          {p.photo ? (
                            <AvatarImage
                              src={p.photo.getDirectURL()}
                              alt={p.username}
                            />
                          ) : (
                            <AvatarFallback className="bg-muted text-foreground text-xs">
                              {p.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="flex-1 text-white font-medium truncate">
                          @{p.username}
                        </span>
                        <button
                          type="button"
                          data-ocid={`split_payment.remove_participant.${i + 1}`}
                          onClick={() => handleRemoveParticipant(p.username)}
                          className="text-white/40 hover:text-red-400 transition-colors p-1"
                          aria-label={`Remove @${p.username}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Running split preview */}
              {participants.length > 0 && (
                <div className="p-3 bg-teal/5 border border-teal/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <SplitSquareVertical className="h-4 w-4 text-teal" />
                    Split {participants.length + 1} ways (including you)
                  </div>
                  <span className="text-teal font-semibold text-sm">
                    ≈{" "}
                    {formatCents(
                      Math.floor(totalAmountCents / (participants.length + 1)),
                    )}{" "}
                    each
                  </span>
                </div>
              )}

              {participants.length === 0 && (
                <p className="text-center text-white/40 text-sm pt-4">
                  Search and add at least one person
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("amount")}
                  className="flex-1 border-white/20 text-white/60 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  data-ocid="split_payment.participants_next_button"
                  onClick={handleParticipantsNext}
                  disabled={participants.length === 0}
                  className="flex-1 bg-teal hover:bg-teal/90 text-white font-semibold shadow-lg shadow-teal/30 disabled:opacity-40"
                >
                  Next: Set Shares
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: Split Mode + Shares ── */}
        {step === "shares" && (
          <>
            <SheetHeader className="mb-5">
              <SheetTitle className="text-white text-2xl">
                How to Split?
              </SheetTitle>
              <SheetDescription className="text-white/60">
                Total:{" "}
                <span className="text-teal font-semibold">
                  {formatCents(totalAmountCents)}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {/* Mode tabs */}
              <Tabs
                value={splitMode}
                onValueChange={(v) => setSplitMode(v as SplitMode)}
              >
                <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                  <TabsTrigger
                    value="equal"
                    data-ocid="split_payment.mode_equal_tab"
                    className="data-[state=active]:bg-teal text-xs"
                  >
                    Equal
                  </TabsTrigger>
                  <TabsTrigger
                    value="percentage"
                    data-ocid="split_payment.mode_percentage_tab"
                    className="data-[state=active]:bg-teal text-xs"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    Percentage
                  </TabsTrigger>
                  <TabsTrigger
                    value="exact"
                    data-ocid="split_payment.mode_exact_tab"
                    className="data-[state=active]:bg-teal text-xs"
                  >
                    Exact
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Equal mode info */}
              {splitMode === "equal" && (
                <div className="p-4 bg-teal/5 border border-teal/20 rounded-xl text-center">
                  <p className="text-white/70 text-sm">
                    Divided equally among {shares.length + 1} people (including
                    you)
                  </p>
                  <p className="text-teal text-2xl font-bold mt-1">
                    {formatCents(equalShare)} each
                  </p>
                  {equalRemainder > 0 && (
                    <p className="text-white/40 text-xs mt-1">
                      +{formatCents(equalRemainder)} added to first participant
                      to cover remainder
                    </p>
                  )}
                </div>
              )}

              {/* Per-participant inputs */}
              {splitMode !== "equal" && (
                <div className="space-y-3">
                  {shares.map((p, i) => (
                    <div
                      key={p.username}
                      data-ocid={`split_payment.share_input.${i + 1}`}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                    >
                      <Avatar className="h-8 w-8 border border-teal/40 flex-shrink-0">
                        {p.photo ? (
                          <AvatarImage
                            src={p.photo.getDirectURL()}
                            alt={p.username}
                          />
                        ) : (
                          <AvatarFallback className="bg-muted text-foreground text-xs">
                            {p.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="flex-1 text-white text-sm font-medium truncate min-w-0">
                        @{p.username}
                      </span>
                      <div className="relative w-28 flex-shrink-0">
                        {splitMode === "exact" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                            $
                          </span>
                        )}
                        <Input
                          type="number"
                          value={
                            splitMode === "exact"
                              ? (p.share / 100).toFixed(2)
                              : p.share
                          }
                          onChange={(e) => handleShareChange(i, e.target.value)}
                          min={0}
                          step={splitMode === "exact" ? "0.01" : "1"}
                          max={splitMode === "percentage" ? 100 : undefined}
                          className={`${splitMode === "exact" ? "pl-7" : "pl-3"} pr-2 h-9 bg-card/50 border-teal/30 text-white text-sm`}
                        />
                        {splitMode === "percentage" && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 text-xs">
                            %
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Totals + validation */}
                  <div
                    className={`flex justify-between items-center p-3 rounded-xl border ${
                      sharesValid()
                        ? "bg-teal/5 border-teal/20"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <span className="text-sm text-white/70">
                      {splitMode === "percentage"
                        ? "Participant total"
                        : "Participant subtotal"}
                    </span>
                    <span
                      className={`font-semibold text-sm ${
                        sharesValid() ? "text-teal" : "text-red-400"
                      }`}
                    >
                      {splitMode === "percentage"
                        ? `${totalPercentage}% / 100%`
                        : `${formatCents(totalExact)} / ${formatCents(totalAmountCents)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("participants")}
                  className="flex-1 border-white/20 text-white/60 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  data-ocid="split_payment.shares_next_button"
                  onClick={handleSharesNext}
                  disabled={!sharesValid()}
                  className="flex-1 bg-teal hover:bg-teal/90 text-white font-semibold shadow-lg shadow-teal/30 disabled:opacity-40"
                >
                  Review Split
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: Confirmation ── */}
        {step === "confirm" && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white text-2xl">
                Confirm Split
              </SheetTitle>
              <SheetDescription className="text-white/60">
                Review the split before sending requests
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {/* Summary card */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-teal/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-semibold">{description}</p>
                    <p className="text-white/50 text-sm mt-0.5">
                      {splitMode === "equal"
                        ? "Split equally"
                        : splitMode === "percentage"
                          ? "Split by percentage"
                          : "Split by exact amount"}
                    </p>
                  </div>
                  <span className="text-teal font-bold text-xl">
                    {formatCents(totalAmountCents)}
                  </span>
                </div>
              </div>

              {/* Per-person breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Each person owes
                </p>
                {shares.map((p, i) => (
                  <div
                    key={p.username}
                    data-ocid={`split_payment.confirm_item.${i + 1}`}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                  >
                    <Avatar className="h-9 w-9 border border-teal/40 flex-shrink-0">
                      {p.photo ? (
                        <AvatarImage
                          src={p.photo.getDirectURL()}
                          alt={p.username}
                        />
                      ) : (
                        <AvatarFallback className="bg-muted text-foreground text-xs">
                          {p.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="flex-1 text-white text-sm font-medium truncate min-w-0">
                      @{p.username}
                    </span>
                    <span className="text-teal font-semibold">
                      {formatCents(computedShares[i])}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-3 p-3 bg-teal/10 rounded-xl border border-teal/20">
                  <div className="h-9 w-9 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal text-xs font-bold">You</span>
                  </div>
                  <span className="flex-1 text-white text-sm font-medium">
                    Your share
                  </span>
                  <span className="text-teal font-semibold">
                    {formatCents(
                      totalAmountCents -
                        computedShares.reduce((s, c) => s + c, 0),
                    )}
                  </span>
                </div>
              </div>

              {createSplit.isError && (
                <div
                  data-ocid="split_payment.error_state"
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  {createSplit.error instanceof Error
                    ? createSplit.error.message
                    : "Failed to create split. Please try again."}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("shares")}
                  className="flex-1 border-white/20 text-white/60 hover:bg-white/5"
                >
                  Back
                </Button>
                <Button
                  data-ocid="split_payment.submit_button"
                  onClick={handleSubmit}
                  disabled={createSplit.isPending}
                  className="flex-1 bg-teal hover:bg-teal/90 text-white font-semibold shadow-lg shadow-teal/30 disabled:opacity-40"
                >
                  {createSplit.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                      <span
                        data-ocid="split_payment.loading_state"
                        className="sr-only"
                      />
                    </>
                  ) : (
                    "Send Split Requests"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-10">
            <div className="w-20 h-20 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center shadow-lg shadow-teal/30">
              <CheckCircle2 className="h-10 w-10 text-teal" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Split Created!
              </h2>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                Payment requests have been sent to{" "}
                <span className="text-teal font-medium">
                  {shares.length} participant
                  {shares.length !== 1 ? "s" : ""}
                </span>
                . Track it in the Splits tab.
              </p>
            </div>
            <div
              data-ocid="split_payment.success_state"
              className="p-4 bg-teal/5 border border-teal/20 rounded-2xl w-full max-w-xs text-center"
            >
              <p className="text-white/60 text-xs">Total</p>
              <p className="text-teal font-bold text-3xl mt-1">
                {formatCents(totalAmountCents)}
              </p>
              <p className="text-white/50 text-xs mt-1 line-clamp-1">
                {description}
              </p>
            </div>
            <Button
              data-ocid="split_payment.done_button"
              onClick={handleClose}
              className="w-full max-w-xs bg-teal hover:bg-teal/90 text-white font-semibold py-6 text-lg shadow-lg shadow-teal/30"
            >
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
