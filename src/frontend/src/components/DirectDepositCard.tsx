import { Card, CardContent } from "@/components/ui/card";
import { Building2, Check, Clock, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useGetDirectDepositAccount,
  useGetPendingDirectDeposits,
} from "../hooks/useQueries";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tsToMs(ts: bigint) {
  return Number(ts) / 1_000_000;
}

function CopyField({
  label,
  value,
  ocid,
}: {
  label: string;
  value: string;
  ocid: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-mono font-semibold text-white tracking-wider truncate">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label}`}
        data-ocid={ocid}
        className="h-8 w-8 flex items-center justify-center rounded-lg bg-teal/10 hover:bg-teal/20 border border-teal/30 text-teal transition-all duration-200 shrink-0"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DirectDepositCardSkeleton() {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-white/10" />
              <div className="h-4 w-28 rounded bg-white/10" />
            </div>
            <div className="h-5 w-12 rounded-full bg-white/10" />
          </div>
          <div className="h-14 rounded-xl bg-white/10" />
          <div className="h-14 rounded-xl bg-white/10" />
          <div className="h-4 rounded bg-white/10 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DirectDepositCard() {
  const { data: account, isLoading: accountLoading } =
    useGetDirectDepositAccount();
  const { data: pending = [] } = useGetPendingDirectDeposits();

  if (accountLoading) return <DirectDepositCardSkeleton />;

  // Find the soonest expected clear date from pending deposits
  const soonestPending =
    pending.length > 0
      ? pending.reduce((a, b) =>
          (a.clearAt ?? BigInt(0)) < (b.clearAt ?? BigInt(0)) ? a : b,
        )
      : null;

  return (
    <Card
      className="border-teal/30 bg-white/5 backdrop-blur-md transition-all duration-300"
      data-ocid="direct-deposit-card"
    >
      <CardContent className="p-5 space-y-4">
        {/* ── Header Row ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal" />
            <span className="font-semibold text-white">Direct Deposit</span>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-teal/20 text-teal border border-teal/30">
            <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
            Active
          </span>
        </div>

        {/* ── Pending banner ── */}
        {pending.length > 0 && soonestPending && (
          <div
            className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5"
            data-ocid="direct-deposit-pending-banner"
          >
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300">
                {pending.length} deposit{pending.length > 1 ? "s" : ""} pending
                clearance
              </p>
              {soonestPending.clearAt && soonestPending.clearAt > BigInt(0) && (
                <p className="text-[10px] text-amber-400/70 mt-0.5">
                  Soonest clears{" "}
                  {new Date(
                    tsToMs(soonestPending.clearAt),
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Account Numbers ── */}
        {account ? (
          <>
            <CopyField
              label="Routing Number"
              value={account.routingNumber}
              ocid="direct-deposit-copy-routing"
            />
            <CopyField
              label="Account Number"
              value={account.accountNumber}
              ocid="direct-deposit-copy-account"
            />
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-white/50">
              Unable to load account details
            </p>
          </div>
        )}

        {/* ── Helper Text ── */}
        <p className="text-[11px] text-white/40 leading-relaxed">
          Share these with your employer to receive payroll directly in Open Tip
          Pay. Deposits typically arrive within 1–2 business days.
        </p>
      </CardContent>
    </Card>
  );
}
