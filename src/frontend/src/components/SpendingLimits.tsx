import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gauge, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useClearSpendingLimits,
  useGetSpendingLimits,
  useSetSpendingLimits,
} from "../hooks/useQueries";

// ── Progress Bar ───────────────────────────────────────────────────────────────
function LimitProgress({
  label,
  spent,
  limit,
}: { label: string; spent: number; limit: number }) {
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const statusColor =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-teal";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white/70">{label}</p>
        <p className="text-xs text-white/50">
          <span className="font-semibold text-white">
            ${(spent / 100).toFixed(2)}
          </span>
          {" / "}
          <span>${(limit / 100).toFixed(2)}</span>
        </p>
      </div>
      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-white/30 text-right">
        {pct.toFixed(0)}% used
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SpendingLimits() {
  const { data: limits, isLoading } = useGetSpendingLimits();
  const setLimits = useSetSpendingLimits();
  const clearLimits = useClearSpendingLimits();
  const [editing, setEditing] = useState(false);
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [monthly, setMonthly] = useState("");

  const handleStartEdit = () => {
    if (limits) {
      setDaily(
        limits.dailyLimit ? (Number(limits.dailyLimit) / 100).toFixed(2) : "",
      );
      setWeekly(
        limits.weeklyLimit ? (Number(limits.weeklyLimit) / 100).toFixed(2) : "",
      );
      setMonthly(
        limits.monthlyLimit
          ? (Number(limits.monthlyLimit) / 100).toFixed(2)
          : "",
      );
    }
    setEditing(true);
  };

  const handleSave = async () => {
    const dailyCents = daily.trim()
      ? BigInt(Math.round(Number.parseFloat(daily) * 100))
      : null;
    const weeklyCents = weekly.trim()
      ? BigInt(Math.round(Number.parseFloat(weekly) * 100))
      : null;
    const monthlyCents = monthly.trim()
      ? BigInt(Math.round(Number.parseFloat(monthly) * 100))
      : null;

    if (dailyCents !== null && dailyCents <= BigInt(0)) {
      toast.error("Daily limit must be greater than $0");
      return;
    }
    try {
      await setLimits.mutateAsync({
        daily: dailyCents ? [dailyCents] : [],
        weekly: weeklyCents ? [weeklyCents] : [],
        monthly: monthlyCents ? [monthlyCents] : [],
      });
      toast.success("Spending limits saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save spending limits");
    }
  };

  const handleClear = async () => {
    try {
      await clearLimits.mutateAsync();
      toast.success("Spending limits cleared");
      setEditing(false);
    } catch {
      toast.error("Failed to clear limits");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-16 rounded-xl bg-white/5 border border-white/10" />
        <div className="h-16 rounded-xl bg-white/5 border border-white/10" />
      </div>
    );
  }

  const hasLimits =
    limits && (limits.dailyLimit || limits.weeklyLimit || limits.monthlyLimit);

  return (
    <div className="space-y-4" data-ocid="spending_limits.section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-white">Spending Limits</p>
        </div>
        {!editing && (
          <Button
            size="sm"
            onClick={handleStartEdit}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs"
            data-ocid="spending_limits.edit_button"
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            {hasLimits ? "Edit" : "Set Limits"}
          </Button>
        )}
      </div>

      {!editing ? (
        <>
          {hasLimits ? (
            <div className="glassmorphism rounded-xl p-4 border border-white/10 space-y-4">
              {limits.dailyLimit ? (
                <LimitProgress
                  label="Daily Limit"
                  spent={Number(limits.dailySpent ?? BigInt(0))}
                  limit={Number(limits.dailyLimit)}
                />
              ) : null}
              {limits.weeklyLimit ? (
                <LimitProgress
                  label="Weekly Limit"
                  spent={Number(limits.weeklySpent ?? BigInt(0))}
                  limit={Number(limits.weeklyLimit)}
                />
              ) : null}
              {limits.monthlyLimit ? (
                <LimitProgress
                  label="Monthly Limit"
                  spent={Number(limits.monthlySpent ?? BigInt(0))}
                  limit={Number(limits.monthlyLimit)}
                />
              ) : null}
            </div>
          ) : (
            <div
              className="glassmorphism rounded-xl p-6 border border-white/10 text-center"
              data-ocid="spending_limits.empty_state"
            >
              <Gauge className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/60 font-semibold">
                No spending limits set
              </p>
              <p className="text-xs text-white/30 mt-1">
                Set daily, weekly, or monthly caps to control your spending
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="glassmorphism rounded-xl p-4 border border-teal/20 space-y-4">
          <p className="text-xs text-white/50">
            Leave a field blank to remove that limit.
          </p>

          {[
            {
              label: "Daily Limit",
              id: "limit-daily",
              value: daily,
              set: setDaily,
              ocid: "spending_limits.daily_input",
            },
            {
              label: "Weekly Limit",
              id: "limit-weekly",
              value: weekly,
              set: setWeekly,
              ocid: "spending_limits.weekly_input",
            },
            {
              label: "Monthly Limit",
              id: "limit-monthly",
              value: monthly,
              set: setMonthly,
              ocid: "spending_limits.monthly_input",
            },
          ].map(({ label, id, value, set, ocid }) => (
            <div key={label}>
              <label
                htmlFor={id}
                className="text-xs text-white/50 font-semibold block mb-1.5"
              >
                {label}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">
                  $
                </span>
                <Input
                  id={id}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="No limit"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  data-ocid={ocid}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={setLimits.isPending}
              className="flex-1 bg-teal hover:bg-teal/90 text-white font-semibold text-sm"
              data-ocid="spending_limits.save_button"
            >
              {setLimits.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Limits"
              )}
            </Button>
            <Button
              onClick={() => setEditing(false)}
              variant="outline"
              className="border-white/10 text-white/60 hover:bg-white/5 text-sm"
              data-ocid="spending_limits.cancel_button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {hasLimits && (
            <Button
              onClick={handleClear}
              disabled={clearLimits.isPending}
              variant="outline"
              className="w-full border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 text-xs"
              data-ocid="spending_limits.clear_button"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Clear All Limits
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
