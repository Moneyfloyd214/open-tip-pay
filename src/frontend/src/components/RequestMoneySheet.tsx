import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownLeft, CircleCheck as CheckCircle2, Loader as Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetPublicProfile,
  useGetPublicProfileByPrincipal,
  useRequestMoney,
  useSearchUsers,
} from "../hooks/useQueries";
import UserNotFound from "./UserNotFound";

const PRESET_AMOUNTS = [5, 10, 25, 50];
const MAX_NOTE_LENGTH = 200;

interface RequestMoneySheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipientPrincipal: string | null;
  recipientUsername?: string | null;
}

type Step = "search" | "form" | "success";

export default function RequestMoneySheet({
  isOpen,
  onClose,
  recipientPrincipal,
  recipientUsername,
}: RequestMoneySheetProps) {
  // Step state — start on "search" if no recipient is pre-set
  const hasPresetRecipient = !!(recipientPrincipal || recipientUsername);
  const [step, setStep] = useState<Step>(
    hasPresetRecipient ? "form" : "search",
  );

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Locally selected recipient (from inline search)
  const [localUsername, setLocalUsername] = useState<string | null>(
    recipientUsername ?? null,
  );

  // Form state
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState(false);

  // Queries
  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchUsers(searchTerm);
  const { data: profileByPrincipal } =
    useGetPublicProfileByPrincipal(recipientPrincipal);
  const { data: profileByLocalUsername } = useGetPublicProfile(localUsername);
  const requestMoneyMutation = useRequestMoney();

  // The resolved recipient profile — prefer principal, then local search pick
  const recipientProfile = profileByPrincipal || profileByLocalUsername;

  // The principal to use for submitting — principal from props has priority
  const effectivePrincipal: string | null = recipientPrincipal ?? null;

  // Sync step when the sheet opens / recipient props change
  useEffect(() => {
    if (isOpen) {
      const hasRecipient = !!(recipientPrincipal || recipientUsername);
      setStep(hasRecipient ? "form" : "search");
      setLocalUsername(recipientUsername ?? null);
      // Reset form state on open
      setAmount("");
      setNote("");
      setNoteError(false);
      setSearchTerm("");
    }
  }, [isOpen, recipientPrincipal, recipientUsername]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetAll = () => {
    setStep("search");
    setSearchTerm("");
    setSearchFocused(false);
    setLocalUsername(null);
    setAmount("");
    setNote("");
    setNoteError(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // User selects someone from inline search results
  const handleSelectSearchResult = (username: string) => {
    setLocalUsername(username);
    setSearchTerm("");
    setSearchFocused(false);
    setStep("form");
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleSendRequest = async () => {
    const amountNum = Number.parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (note.trim() === "") {
      setNoteError(true);
      toast.error("A note is required to send a request");
      return;
    }

    // We need a principal to call the backend. If we only have a username,
    // we cannot submit (profile lookup doesn't expose the principal).
    if (!effectivePrincipal) {
      toast.error(
        "Unable to send request: recipient principal not available. Please search and select a user.",
      );
      return;
    }

    try {
      await requestMoneyMutation.mutateAsync({
        toUser: effectivePrincipal,
        amount: BigInt(Math.floor(amountNum * 100)),
        message: note,
        currencyType: "fiat",
      });

      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      setStep("success");
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to send request";
      toast.error(msg);
    }
  };

  const canSubmit =
    !!effectivePrincipal &&
    Number.parseFloat(amount) > 0 &&
    note.trim() !== "" &&
    !requestMoneyMutation.isPending;

  const showSearchDropdown = searchFocused && searchTerm.length > 0;
  const showUserNotFound =
    showSearchDropdown && !searchLoading && searchResults.length === 0;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-card border-t-2 border-teal/30 overflow-y-auto"
      >
        {/* ── Step: Search ── */}
        {step === "search" && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white text-2xl">
                Request Money
              </SheetTitle>
              <SheetDescription className="text-white/60">
                Search for someone to request money from
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              {/* Inline search */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal/70 pointer-events-none" />
                  <Input
                    data-ocid="request_money.search_input"
                    type="text"
                    placeholder="Search by @username or phone number…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    className="w-full pl-12 pr-10 py-6 text-base bg-card/50 border-2 border-teal/30 rounded-2xl text-white placeholder:text-white/50 focus:border-teal focus:ring-2 focus:ring-teal/50 transition-all duration-300"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSearchFocused(false);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Search results dropdown */}
                {showSearchDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-card/95 backdrop-blur-xl border-2 border-teal/30 rounded-2xl shadow-2xl shadow-teal/20 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-teal" />
                      </div>
                    ) : showUserNotFound ? (
                      <UserNotFound searchTerm={searchTerm} />
                    ) : (
                      <div className="py-2">
                        {searchResults.map((result) => (
                          <button
                            type="button"
                            key={result.username}
                            data-ocid={`request_money.search_result.${result.username}`}
                            onClick={() =>
                              handleSelectSearchResult(result.username)
                            }
                            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-teal/10 transition-colors duration-200 border-b border-white/5 last:border-b-0"
                          >
                            <Avatar className="h-12 w-12 border-2 border-teal/50 flex-shrink-0">
                              {result.photo ? (
                                <AvatarImage
                                  src={result.photo.getDirectURL()}
                                  alt={result.username}
                                />
                              ) : (
                                <AvatarFallback className="bg-muted text-foreground text-sm">
                                  {result.username
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white truncate">
                                  @{result.username}
                                </p>
                                {result.isVerified && (
                                  <img
                                    src="/assets/generated/verified-badge-transparent.dim_16x16.png"
                                    alt="Verified"
                                    className="h-4 w-4 flex-shrink-0"
                                  />
                                )}
                              </div>
                              {result.bio && (
                                <p className="text-sm text-white/60 line-clamp-1 mt-0.5 truncate">
                                  {result.bio}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-center text-white/40 text-sm pt-4">
                Type a username or phone number to find someone
              </p>
            </div>
          </>
        )}

        {/* ── Step: Form ── */}
        {step === "form" && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-white text-2xl">
                Request Money
              </SheetTitle>
              <SheetDescription className="text-white/60">
                {recipientProfile
                  ? `Send a payment request to @${recipientProfile.username}`
                  : "Fill in the details below"}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Recipient Card — show when profile resolved, or skeleton */}
              {recipientProfile ? (
                <div className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-teal/20">
                  {/* Change recipient button */}
                  {!hasPresetRecipient && (
                    <button
                      type="button"
                      data-ocid="request_money.change_recipient_button"
                      onClick={() => {
                        setStep("search");
                        setLocalUsername(null);
                        setAmount("");
                        setNote("");
                        setNoteError(false);
                      }}
                      className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                      aria-label="Change recipient"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <Avatar className="h-16 w-16 border-2 border-teal flex-shrink-0">
                    {recipientProfile.photo ? (
                      <AvatarImage
                        src={recipientProfile.photo.getDirectURL()}
                        alt={recipientProfile.username}
                      />
                    ) : (
                      <AvatarFallback className="bg-muted text-foreground text-lg">
                        {recipientProfile.username
                          .substring(0, 2)
                          .toUpperCase()}
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
                    {recipientProfile.bio && (
                      <p className="text-white/60 text-sm truncate">
                        {recipientProfile.bio}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Profile is still resolving — show a subtle loading card */
                <div className="flex items-center gap-4 p-4 bg-card/50 rounded-xl border border-teal/20">
                  <div className="h-16 w-16 rounded-full bg-teal/10 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-teal/10 animate-pulse rounded" />
                    <div className="h-3 w-48 bg-teal/10 animate-pulse rounded" />
                  </div>
                </div>
              )}

              {/* Note about principal requirement when only username selected */}
              {!effectivePrincipal && localUsername && (
                <div
                  data-ocid="request_money.no_principal_warning"
                  className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm"
                >
                  Sending requests by username only is not yet supported. Please
                  use the dashboard search bar to find this user by their full
                  profile.
                </div>
              )}

              {/* Amount Selection */}
              <div className="space-y-3">
                <Label className="text-white">Amount</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      data-ocid={`request_money.preset_amount.${preset}`}
                      onClick={() => handlePresetAmount(preset)}
                      variant="outline"
                      className={`transition-all duration-200 ${
                        amount === preset.toString()
                          ? "bg-teal border-teal text-white shadow-md shadow-teal/30"
                          : "bg-card/50 border-teal/30 text-white hover:bg-teal hover:text-white hover:border-teal"
                      }`}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    data-ocid="request_money.amount_input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 bg-card/50 border-teal/30 text-white placeholder:text-white/40"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Note — Required */}
              <div className="space-y-2">
                <Label className="text-white">
                  Note / Reason{" "}
                  <span className="text-red-400" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Textarea
                  data-ocid="request_money.note_textarea"
                  value={note}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_NOTE_LENGTH) {
                      setNote(e.target.value);
                      if (e.target.value.trim() !== "") setNoteError(false);
                    }
                  }}
                  placeholder="What's this request for? (required)"
                  maxLength={MAX_NOTE_LENGTH}
                  aria-required="true"
                  className={`bg-card/50 text-white placeholder:text-white/40 min-h-[90px] transition-colors duration-200 ${
                    noteError
                      ? "border-red-400 focus:border-red-400 border-2"
                      : "border-teal/30"
                  }`}
                />
                <div className="flex items-center justify-between">
                  {noteError ? (
                    <p
                      data-ocid="request_money.note_field_error"
                      className="text-red-400 text-xs"
                    >
                      A note is required
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    className={`text-xs ml-auto ${
                      note.length >= MAX_NOTE_LENGTH
                        ? "text-red-400"
                        : "text-white/40"
                    }`}
                  >
                    {note.length}/{MAX_NOTE_LENGTH}
                  </p>
                </div>
              </div>

              {/* Backend Error */}
              {requestMoneyMutation.isError && (
                <div
                  data-ocid="request_money.error_state"
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  {requestMoneyMutation.error instanceof Error
                    ? requestMoneyMutation.error.message
                    : "Failed to send request. Please try again."}
                </div>
              )}

              {/* Send Button */}
              <Button
                data-ocid="request_money.submit_button"
                onClick={handleSendRequest}
                disabled={!canSubmit}
                className="w-full bg-teal hover:bg-teal/90 text-white font-semibold py-6 text-lg shadow-lg shadow-teal/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                {requestMoneyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Request…
                    <span
                      data-ocid="request_money.loading_state"
                      className="sr-only"
                    />
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="mr-2 h-5 w-5" />
                    Send Request
                    {Number.parseFloat(amount) > 0
                      ? ` for $${Number.parseFloat(amount).toFixed(2)}`
                      : ""}
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-10">
            <div className="w-20 h-20 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center shadow-lg shadow-teal/30">
              <CheckCircle2 className="h-10 w-10 text-teal" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Request Sent!
              </h2>
              <p className="text-white/60 text-sm">
                Your money request was sent to{" "}
                <span className="text-teal font-medium">
                  @{recipientProfile?.username ?? localUsername}
                </span>
                . They'll be notified shortly.
              </p>
            </div>
            <Button
              data-ocid="request_money.done_button"
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
