import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Loader2,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { GDPRAuditEvent } from "../hooks/useQueries";
import {
  useCancelAccountDeletion,
  useExportUserData,
  useGetAccountDeletionStatus,
  useGetGDPRAuditLog,
  useRecordExportRequest,
  useRequestAccountDeletion,
} from "../hooks/useQueries";

// ─── Countdown Timer ────────────────────────────────────────────────────────
function DeletionCountdown({
  deletionRequestedAt,
}: { deletionRequestedAt: bigint }) {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const requestedMs = Number(deletionRequestedAt / BigInt(1_000_000));
  const expiryMs = requestedMs + THIRTY_DAYS_MS;
  const nowMs = Date.now();
  const remainingMs = Math.max(0, expiryMs - nowMs);

  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="grid grid-cols-3 gap-2 my-3">
      {[
        { value: days, label: "Days" },
        { value: hours, label: "Hours" },
        { value: minutes, label: "Min" },
      ].map(({ value, label }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/30 rounded-lg py-2 px-1"
        >
          <span className="text-xl font-bold text-amber-400 font-mono">
            {String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-amber-400/70 uppercase tracking-wide">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Audit Log Entry ─────────────────────────────────────────────────────────
const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  export_requested: { label: "Data Export Requested", color: "text-teal" },
  deletion_requested: {
    label: "Account Deletion Requested",
    color: "text-red-400",
  },
  deletion_cancelled: { label: "Deletion Cancelled", color: "text-green-400" },
  deletion_finalized: { label: "Account Deleted", color: "text-red-500" },
};

function AuditEntry({ event }: { event: GDPRAuditEvent }) {
  const info = EVENT_LABELS[event.eventType] ?? {
    label: event.eventType,
    color: "text-white/70",
  };
  const tsMs = Number(event.timestamp / BigInt(1_000_000));
  const date = new Date(tsMs);

  return (
    <div className="flex items-start gap-3 py-2.5">
      <Clock className="h-3.5 w-3.5 text-white/40 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${info.color}`}>{info.label}</p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          at{" "}
          {date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ManageMyData() {
  const [confirmText, setConfirmText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: deletionStatus, refetch: refetchStatus } =
    useGetAccountDeletionStatus();
  const { data: auditLog = [] } = useGetGDPRAuditLog();
  const { refetch: fetchExportData } = useExportUserData();

  const recordExport = useRecordExportRequest();
  const requestDeletion = useRequestAccountDeletion();
  const cancelDeletion = useCancelAccountDeletion();

  // ── Export Handler ─────────────────────────────────────────────────────────
  async function handleExport() {
    setIsExporting(true);
    try {
      await recordExport.mutateAsync(undefined);
    } catch (err: unknown) {
      const errMsg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : String(err);
      if (
        errMsg.toLowerCase().includes("rate") ||
        errMsg.toLowerCase().includes("limit")
      ) {
        toast.error(
          "Export limit reached. You can request up to 3 exports per 24 hours.",
        );
        setIsExporting(false);
        return;
      }
    }

    try {
      const result = await fetchExportData();
      const exportData = result.data;
      const json = JSON.stringify(
        exportData,
        (_k, v) => (typeof v === "bigint" ? v.toString() : v),
        2,
      );
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `opentip-data-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Your data export has been downloaded.");
    } catch {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  // ── Delete Request Handler ─────────────────────────────────────────────────
  async function handleRequestDeletion() {
    if (confirmText !== "DELETE") return;
    try {
      await requestDeletion.mutateAsync(undefined);
      await refetchStatus();
      setShowDeleteDialog(false);
      setConfirmText("");
      toast.success("Account deletion requested. You have 30 days to cancel.");
    } catch {
      toast.error("Failed to request deletion. Please try again.");
    }
  }

  // ── Cancel Deletion Handler ────────────────────────────────────────────────
  async function handleCancelDeletion() {
    try {
      await cancelDeletion.mutateAsync(undefined);
      await refetchStatus();
      toast.success("Account deletion cancelled. Your account is safe.");
    } catch {
      toast.error("Failed to cancel deletion. Please try again.");
    }
  }

  const status = deletionStatus?.status ?? "not_requested";
  const deletionRequestedAt = deletionStatus?.requestedAt;

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-5 pr-4 pb-6">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal" />
          <h3 className="text-sm font-semibold text-white">Manage My Data</h3>
          <Badge className="ml-auto text-[10px] bg-teal/10 text-teal border-teal/30">
            GDPR · CCPA
          </Badge>
        </div>

        {/* ── Export Section ─────────────────────────────────────────────── */}
        <Card className="glassmorphism border-teal/20 bg-transparent">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <FileDown className="h-4 w-4 text-teal" />
              Export My Data
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <p className="text-xs text-white/60 leading-relaxed">
              Download a copy of all your Open Tip Pay data including your
              profile, transaction history, KYC records, and more. This is your
              right under{" "}
              <span className="text-teal font-medium">GDPR Article 20</span>.
            </p>
            <div className="flex items-center gap-2 bg-teal/5 border border-teal/20 rounded-md px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-teal/70 shrink-0" />
              <p className="text-[11px] text-white/50">
                Limited to 3 export requests per 24-hour period.
              </p>
            </div>
            <Button
              data-ocid="export-data-btn"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-teal/20 hover:bg-teal/30 text-teal border border-teal/30 text-xs h-9 transition-all duration-200"
              variant="outline"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Generating export…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Download My Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator className="bg-white/10" />

        {/* ── Delete Account Section ─────────────────────────────────────── */}
        <Card
          className={`glassmorphism border-red-500/20 bg-transparent ${
            status === "deletion_pending" ? "border-amber-500/30" : ""
          }`}
        >
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-400" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {status === "not_requested" && (
              <>
                <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-300/80 leading-relaxed">
                    This will permanently delete your account and{" "}
                    <span className="font-semibold text-red-300">
                      ALL associated data
                    </span>{" "}
                    after a 30-day waiting period. You can cancel at any time
                    before the 30 days are up. This action{" "}
                    <span className="font-semibold text-red-300">
                      cannot be undone
                    </span>{" "}
                    after the waiting period ends.
                  </p>
                </div>
                <Button
                  data-ocid="request-deletion-btn"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-9 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Request Account Deletion
                </Button>
              </>
            )}

            {status === "deletion_pending" && (
              <>
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-md px-3 py-2.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Your account is scheduled for deletion. After the timer
                    expires, all your data will be{" "}
                    <span className="font-semibold text-amber-300">
                      permanently erased
                    </span>
                    . Cancel at any time to keep your account.
                  </p>
                </div>

                {deletionRequestedAt !== undefined && (
                  <DeletionCountdown
                    deletionRequestedAt={deletionRequestedAt}
                  />
                )}

                <Button
                  data-ocid="cancel-deletion-btn"
                  onClick={handleCancelDeletion}
                  disabled={cancelDeletion.isPending}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs h-9 transition-all duration-200"
                  variant="outline"
                >
                  {cancelDeletion.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Cancelling…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                      Cancel Deletion — Keep My Account
                    </>
                  )}
                </Button>
              </>
            )}

            {status === "finalized" && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">
                  Your account has been permanently deleted.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-white/10" />

        {/* ── Audit Log Section ──────────────────────────────────────────── */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-white/80 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-white/40" />
            Privacy Activity Log
          </h4>
          <Card className="glassmorphism border-white/10 bg-transparent">
            <CardContent className="px-4 py-2">
              {auditLog.length === 0 ? (
                <div
                  data-ocid="gdpr-audit-empty"
                  className="flex flex-col items-center gap-2 py-5 text-center"
                >
                  <CheckCircle2 className="h-6 w-6 text-teal/40" />
                  <p className="text-xs text-white/40">
                    No privacy events recorded yet.
                  </p>
                </div>
              ) : (
                <div
                  data-ocid="gdpr-audit-log"
                  className="divide-y divide-white/5"
                >
                  {auditLog.map((event: GDPRAuditEvent) => (
                    <AuditEntry
                      key={`${event.eventType}-${event.timestamp.toString()}`}
                      event={event}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(o) => {
          setShowDeleteDialog(o);
          if (!o) setConfirmText("");
        }}
      >
        <DialogContent
          className="bg-navy-light/95 backdrop-blur-xl border-red-500/30 max-w-sm"
          data-ocid="delete-confirm-dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-400" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs leading-relaxed">
              This will start a 30-day deletion countdown. After that period,
              your account and all data will be permanently erased and cannot be
              recovered.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300/80">
                Type{" "}
                <span className="font-bold text-red-300 font-mono">DELETE</span>{" "}
                in the box below to confirm.
              </p>
            </div>
            <Input
              data-ocid="delete-confirm-input"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="Type DELETE to confirm"
              className="bg-navy-dark/50 border-red-500/30 text-white placeholder:text-white/30 text-sm font-mono tracking-widest text-center"
              maxLength={6}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setConfirmText("");
              }}
              className="text-white/60 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              data-ocid="delete-confirm-submit"
              variant="outline"
              disabled={confirmText !== "DELETE" || requestDeletion.isPending}
              onClick={handleRequestDeletion}
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs disabled:opacity-40"
            >
              {requestDeletion.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                "Confirm Deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
