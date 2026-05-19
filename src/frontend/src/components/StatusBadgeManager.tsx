import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CheckCircle, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Status } from "../backend";
import {
  useAddStatus,
  useDeactivateStatus,
  useGetCurrentStatus,
} from "../hooks/useQueries";

interface StatusBadgeManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_PRESETS = [
  { type: "serving", label: "Currently Serving", requiresTable: true },
  { type: "delivery", label: "On a Delivery Job", requiresTable: false },
  { type: "available", label: "Available for Service", requiresTable: false },
  { type: "taking_orders", label: "Taking Orders", requiresTable: false },
  { type: "custom", label: "Custom Status", requiresTable: false },
];

export default function StatusBadgeManager({
  open,
  onOpenChange,
}: StatusBadgeManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [tableNumber, setTableNumber] = useState("");

  const { data: currentStatus, refetch } = useGetCurrentStatus();
  const addStatus = useAddStatus();
  const deactivateStatus = useDeactivateStatus();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const handleSetStatus = async () => {
    if (!selectedPreset) {
      toast.error("Please select a status type");
      return;
    }

    const preset = STATUS_PRESETS.find((p) => p.type === selectedPreset);
    if (!preset) return;

    if (preset.type === "custom" && !customStatus.trim()) {
      toast.error("Please enter a custom status");
      return;
    }

    if (preset.requiresTable && !tableNumber.trim()) {
      toast.error("Please enter a table number");
      return;
    }

    try {
      const statusText =
        preset.type === "custom" ? customStatus.trim() : preset.label;
      const fullStatus = preset.requiresTable
        ? `${statusText} at Table ${tableNumber}`
        : statusText;

      const newStatus: Status = {
        statusType: preset.type,
        customStatus:
          preset.type === "custom" ? customStatus.trim() : undefined,
        tableNumber: preset.requiresTable ? BigInt(tableNumber) : undefined,
        createdAt: BigInt(Date.now() * 1000000),
        isActive: true,
      };

      await addStatus.mutateAsync(newStatus);
      toast.success(`Status set: ${fullStatus}`);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }

      setSelectedPreset("");
      setCustomStatus("");
      setTableNumber("");
      refetch();
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to set status");
    }
  };

  const handleDeactivateStatus = async () => {
    try {
      await deactivateStatus.mutateAsync();
      toast.success("Status deactivated");
      refetch();
    } catch (error: any) {
      console.error("Status deactivation error:", error);
      toast.error(error.message || "Failed to deactivate status");
    }
  };

  const getCurrentStatusDisplay = () => {
    if (!currentStatus || !currentStatus.isActive) return null;

    const preset = STATUS_PRESETS.find(
      (p) => p.type === currentStatus.statusType,
    );
    if (!preset) return currentStatus.customStatus || "Active";

    if (preset.type === "custom") {
      return currentStatus.customStatus || "Custom Status";
    }

    if (preset.requiresTable && currentStatus.tableNumber) {
      return `${preset.label} at Table ${currentStatus.tableNumber}`;
    }

    return preset.label;
  };

  const currentStatusDisplay = getCurrentStatusDisplay();
  const selectedPresetData = STATUS_PRESETS.find(
    (p) => p.type === selectedPreset,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-navy-light/95 backdrop-blur-xl border-teal/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <img
              src="/assets/generated/live-status-dot.dim_16x16.png"
              alt="Status"
              className="h-5 w-5"
            />
            Smart Status Badges
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Set your live status to let tippers know what you're doing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status Display */}
          {currentStatus?.isActive && (
            <div className="glassmorphism rounded-lg p-4 border border-teal/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
                  <p className="text-sm font-medium text-white">
                    Current Status
                  </p>
                </div>
                <Button
                  onClick={handleDeactivateStatus}
                  disabled={deactivateStatus.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                >
                  {deactivateStatus.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Badge className="bg-teal/20 text-teal border-teal/50 text-sm">
                {currentStatusDisplay}
              </Badge>
            </div>
          )}

          {/* Status Preset Selection */}
          <div className="space-y-2">
            <Label htmlFor="preset" className="text-white">
              Select Status Type
            </Label>
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger
                id="preset"
                className="bg-navy-dark/50 border-teal/30 text-white"
              >
                <SelectValue placeholder="Choose a status..." />
              </SelectTrigger>
              <SelectContent className="bg-navy-dark border-teal/30">
                {STATUS_PRESETS.map((preset) => (
                  <SelectItem
                    key={preset.type}
                    value={preset.type}
                    className="text-white"
                  >
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table Number Input (conditional) */}
          {selectedPresetData?.requiresTable && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-white">
                Table Number
              </Label>
              <Input
                id="tableNumber"
                type="number"
                placeholder="e.g., 4"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
                min="1"
              />
            </div>
          )}

          {/* Custom Status Input (conditional) */}
          {selectedPreset === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customStatus" className="text-white">
                Custom Status
              </Label>
              <Input
                id="customStatus"
                type="text"
                placeholder="e.g., Preparing your order"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                className="bg-navy-dark/50 border-teal/30 text-white placeholder:text-white/40"
                maxLength={50}
              />
              <p className="text-xs text-white/60">
                {customStatus.length}/50 characters
              </p>
            </div>
          )}

          {/* Set Status Button */}
          <Button
            onClick={handleSetStatus}
            disabled={addStatus.isPending || !selectedPreset}
            className="w-full bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg shadow-teal/30"
            size="lg"
          >
            {addStatus.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting Status...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Set Status
              </>
            )}
          </Button>

          {/* Info Notice */}
          <div className="rounded-lg bg-teal/10 border border-teal/30 p-3">
            <p className="text-xs text-white/80 leading-relaxed">
              💡 <strong>Live Status:</strong> Your status will be visible on
              your public tip profile and auto-refreshes every 30 seconds for
              active presence indication.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
