import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit2,
  Timer,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDemoMode } from "../../context/DemoContext";
import {
  useManualSetHours,
  useRecordCheckIn,
  useRecordCheckOut,
} from "../../hooks/useQueries";

const GAME_DATE_DEFAULT = "2025-01-15";

const GAME_PHASES = [
  "Pre-Game",
  "1st Quarter",
  "2nd Quarter",
  "Halftime",
  "3rd Quarter",
  "4th Quarter",
] as const;
type GamePhase = (typeof GAME_PHASES)[number];

interface StaffCheckInEntry {
  id: string;
  name: string;
  role: string;
  stand: string;
  standId: string;
  checkedIn: boolean;
  checkInTime?: string;
  hoursWorked?: number;
  checkInPhase?: GamePhase;
}

const DEMO_CHECKINS: StaffCheckInEntry[] = [
  {
    id: "staff-1",
    name: "Marcus Johnson",
    role: "Head Bartender",
    stand: "Lucas Oil Grill",
    standId: "stand-1",
    checkedIn: true,
    checkInTime: "11:30 AM",
    hoursWorked: 8,
  },
  {
    id: "staff-2",
    name: "Jade Williams",
    role: "Bartender",
    stand: "Lucas Oil Grill",
    standId: "stand-1",
    checkedIn: true,
    checkInTime: "11:45 AM",
    hoursWorked: 8,
  },
  {
    id: "staff-3",
    name: "DeShawn Carter",
    role: "Barback",
    stand: "Lucas Oil Grill",
    standId: "stand-1",
    checkedIn: true,
    checkInTime: "12:00 PM",
    hoursWorked: 6,
  },
  {
    id: "staff-4",
    name: "Sarah Mitchell",
    role: "Concession Worker",
    stand: "Club Level Grill",
    standId: "stand-4",
    checkedIn: true,
    checkInTime: "11:30 AM",
    hoursWorked: 8,
  },
  {
    id: "staff-5",
    name: "Mike Thompson",
    role: "Suite Runner",
    stand: "End Zone Bites",
    standId: "stand-2",
    checkedIn: false,
  },
  {
    id: "staff-6",
    name: "Tanya Rivera",
    role: "Concession Worker",
    stand: "Suite Level Bar",
    standId: "stand-5",
    checkedIn: false,
  },
];

function initDemoLocalStorage() {
  if (!localStorage.getItem("gamePhase")) {
    localStorage.setItem("gamePhase", "4th Quarter");
  }
  if (!localStorage.getItem("alcoholCutoffActive")) {
    localStorage.setItem("alcoholCutoffActive", "true");
  }
}

export default function CheckInTab() {
  const { isDemoMode } = useDemoMode();
  const [gameDate, setGameDate] = useState(GAME_DATE_DEFAULT);
  const [staff, setStaff] = useState<StaffCheckInEntry[]>(DEMO_CHECKINS);
  const [editTarget, setEditTarget] = useState<StaffCheckInEntry | null>(null);
  const [hoursInput, setHoursInput] = useState("");

  // Game Phase state — init from localStorage
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(() => {
    initDemoLocalStorage();
    return (localStorage.getItem("gamePhase") as GamePhase) ?? "4th Quarter";
  });
  const [alcoholCutoffActive, setAlcoholCutoffActive] = useState(() => {
    return localStorage.getItem("alcoholCutoffActive") === "true";
  });

  // 3rd Quarter auto-cutoff timer
  const [timerMinutes, setTimerMinutes] = useState("15");
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordCheckIn = useRecordCheckIn();
  const recordCheckOut = useRecordCheckOut();
  const manualSetHours = useManualSetHours();

  const currentPhaseIndex = GAME_PHASES.indexOf(currentPhase);

  const advancePhase = () => {
    if (currentPhaseIndex >= GAME_PHASES.length - 1) return;
    const next = GAME_PHASES[currentPhaseIndex + 1];
    setCurrentPhase(next);
    localStorage.setItem("gamePhase", next);
    // Trigger alcohol cutoff when advancing past 3rd Quarter
    if (next === "4th Quarter") {
      setAlcoholCutoffActive(true);
      localStorage.setItem("alcoholCutoffActive", "true");
      toast.error("🚫 3rd Quarter ended — Alcohol sales cutoff is now ACTIVE");
    } else {
      toast.success(`Advanced to ${next}`);
    }
  };

  const startTimer = () => {
    const mins = Number.parseInt(timerMinutes, 10);
    if (Number.isNaN(mins) || mins <= 0) {
      toast.error("Enter a valid number of minutes");
      return;
    }
    setTimerSecondsLeft(mins * 60);
    setTimerActive(true);
    toast.success(`Timer started — ${mins}m until alcohol cutoff`);
  };

  // Countdown effect — use ref for advancePhase to avoid stale closure
  const advancePhaseRef = useRef(advancePhase);
  useEffect(() => {
    advancePhaseRef.current = advancePhase;
  });

  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          advancePhaseRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCheckIn = async (entry: StaffCheckInEntry) => {
    const phase = currentPhase;
    if (isDemoMode) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === entry.id
            ? {
                ...s,
                checkedIn: true,
                checkInTime: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                checkInPhase: phase,
              }
            : s,
        ),
      );
      toast.success(`${entry.name} checked in (${phase})`);
      return;
    }
    try {
      await recordCheckIn.mutateAsync({
        staffId: entry.id,
        staffName: entry.name,
        role: entry.role,
        standId: entry.standId,
        standName: entry.stand,
        gameDate,
        checkInTime: BigInt(Date.now()),
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === entry.id
            ? {
                ...s,
                checkedIn: true,
                checkInTime: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                checkInPhase: phase,
              }
            : s,
        ),
      );
      toast.success(`${entry.name} checked in (${phase})`);
    } catch {
      toast.error("Check-in failed");
    }
  };

  const handleCheckOut = async (entry: StaffCheckInEntry) => {
    if (isDemoMode) {
      setStaff((prev) =>
        prev.map((s) => (s.id === entry.id ? { ...s, checkedIn: false } : s)),
      );
      toast.success(`${entry.name} checked out`);
      return;
    }
    try {
      await recordCheckOut.mutateAsync({
        checkInId: entry.id,
        checkOutTime: BigInt(Date.now()),
      });
      setStaff((prev) =>
        prev.map((s) => (s.id === entry.id ? { ...s, checkedIn: false } : s)),
      );
      toast.success(`${entry.name} checked out`);
    } catch {
      toast.error("Check-out failed");
    }
  };

  const handleSaveHours = async () => {
    if (!editTarget || !hoursInput) return;
    const hours = Number.parseFloat(hoursInput);
    if (Number.isNaN(hours) || hours < 0) {
      toast.error("Enter a valid number of hours");
      return;
    }
    if (isDemoMode) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editTarget.id ? { ...s, hoursWorked: hours } : s,
        ),
      );
      toast.success(`Hours updated for ${editTarget.name}`);
      setEditTarget(null);
      setHoursInput("");
      return;
    }
    try {
      await manualSetHours.mutateAsync({
        checkInId: editTarget.id,
        hoursWorked: hours,
        overrideBy: "manager",
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === editTarget.id ? { ...s, hoursWorked: hours } : s,
        ),
      );
      toast.success(`Hours updated for ${editTarget.name}`);
    } catch {
      toast.error("Failed to update hours");
    }
    setEditTarget(null);
    setHoursInput("");
  };

  // Group by stand for summary
  const standGroups = staff.reduce<Record<string, StaffCheckInEntry[]>>(
    (acc, s) => {
      if (!acc[s.stand]) acc[s.stand] = [];
      acc[s.stand].push(s);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-5" data-ocid="manager-checkin-tab">
      {/* Alcohol Cutoff Alert Banner */}
      {(alcoholCutoffActive || currentPhase === "4th Quarter") && (
        <div
          className="flex items-start gap-3 bg-red-500/15 border border-red-500/40 rounded-xl px-4 py-3"
          data-ocid="alcohol-cutoff-alert"
        >
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm font-semibold text-red-300">
            🚫 Alcohol Sales Cutoff Active — 3rd Quarter has ended. Alcohol tip
            tracking is locked for this game.
          </p>
        </div>
      )}

      {/* Game Phase Control */}
      <div
        className="glassmorphism rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-4"
        data-ocid="game-phase-control"
      >
        <div className="flex items-center gap-2 mb-1">
          <Timer className="h-4 w-4 text-teal shrink-0" />
          <p className="text-sm font-bold text-foreground">
            Game Phase Control
          </p>
          <span className="ml-auto text-xs font-semibold text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded-full">
            {currentPhase}
          </span>
        </div>

        {/* Phase chips */}
        <div className="flex flex-wrap gap-2">
          {GAME_PHASES.map((phase, idx) => {
            const isActive = phase === currentPhase;
            const isCompleted = idx < currentPhaseIndex;
            const _isUpcoming = idx > currentPhaseIndex;
            return (
              <div
                key={phase}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all select-none ${
                  isActive
                    ? "bg-teal/20 border-teal/50 text-teal ring-1 ring-teal/30"
                    : isCompleted
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-muted/20 border-border/50 text-muted-foreground/50"
                }`}
                data-ocid={`phase-chip-${phase.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              >
                {isCompleted && (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                )}
                {phase}
              </div>
            );
          })}
        </div>

        {/* Advance button */}
        {currentPhaseIndex < GAME_PHASES.length - 1 && (
          <Button
            type="button"
            onClick={advancePhase}
            className="w-full bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30 font-semibold flex items-center justify-center gap-2"
            data-ocid="advance-phase-btn"
          >
            <ChevronRight className="h-4 w-4" />
            Advance to {GAME_PHASES[currentPhaseIndex + 1]}
          </Button>
        )}
        {currentPhaseIndex >= GAME_PHASES.length - 1 && (
          <div className="text-center text-xs text-muted-foreground py-1">
            ✓ Game complete — all phases finished
          </div>
        )}

        {/* 3rd Quarter Auto-Cutoff Timer — only visible during 3rd Quarter */}
        {currentPhase === "3rd Quarter" && (
          <div
            className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-3"
            data-ocid="q3-cutoff-timer-section"
          >
            <div className="flex items-center gap-2">
              <Timer className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs font-bold text-amber-300">
                3rd Quarter Auto-Cutoff Timer
              </p>
            </div>
            {timerActive ? (
              <div className="text-center">
                <p className="text-2xl font-mono font-bold text-amber-300">
                  {formatCountdown(timerSecondsLeft)}
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Alcohol cutoff activates automatically when timer reaches 0
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="cutoff-timer-minutes"
                    className="text-xs text-muted-foreground mb-1 block"
                  >
                    Minutes until cutoff
                  </label>
                  <Input
                    id="cutoff-timer-minutes"
                    type="number"
                    min="1"
                    max="60"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    className="bg-muted/30 border-amber-500/30 text-foreground h-8 text-sm"
                    data-ocid="cutoff-timer-input"
                  />
                </div>
                <Button
                  type="button"
                  onClick={startTimer}
                  className="mt-5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold h-8 px-3"
                  data-ocid="start-cutoff-timer-btn"
                >
                  Start Timer
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game date selector */}
      <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-teal shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground mb-1">
              Game Date
            </p>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-full"
              data-ocid="checkin-game-date"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Staff Checked In</p>
            <p className="text-lg font-bold text-teal">
              {staff.filter((s) => s.checkedIn).length}/{staff.length}
            </p>
          </div>
        </div>
      </div>

      {/* Staff check-in list */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-teal" /> Staff Status
        </p>
        {staff.map((entry, index) => (
          <div
            key={entry.id}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
            data-ocid={`checkin-staff-row.${index + 1}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 ${
                  entry.checkedIn
                    ? "bg-teal/20 border-teal/40"
                    : "bg-muted/20 border-border"
                }`}
              >
                <span
                  className={`text-xs font-bold ${entry.checkedIn ? "text-teal" : "text-muted-foreground"}`}
                >
                  {entry.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.name}
                  </p>
                  {entry.checkedIn ? (
                    <span className="text-[10px] bg-teal/20 text-teal border border-teal/30 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      IN
                    </span>
                  ) : (
                    <span className="text-[10px] bg-muted/30 text-muted-foreground border border-border px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      OUT
                    </span>
                  )}
                  {/* 4th Quarter / General Duties label */}
                  {entry.checkedIn && entry.checkInPhase === "4th Quarter" && (
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                      4Q / General Duties
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.role} · {entry.stand}
                </p>
                {entry.checkedIn && entry.checkInTime && (
                  <p className="text-xs text-teal/70 mt-0.5">
                    Checked in at {entry.checkInTime}
                    {entry.checkInPhase &&
                      entry.checkInPhase !== "4th Quarter" && (
                        <span className="text-muted-foreground/60 ml-1">
                          ({entry.checkInPhase})
                        </span>
                      )}
                  </p>
                )}
                {entry.hoursWorked !== undefined && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {entry.hoursWorked}h worked
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(entry);
                    setHoursInput(String(entry.hoursWorked ?? ""));
                  }}
                  className="h-7 w-7 rounded-lg bg-muted/30 border border-border flex items-center justify-center hover:bg-muted/50 transition-all"
                  aria-label="Edit hours"
                  data-ocid={`checkin-edit-hours.${index + 1}`}
                >
                  <Edit2 className="h-3 w-3 text-muted-foreground" />
                </button>
                {entry.checkedIn ? (
                  <button
                    type="button"
                    onClick={() => handleCheckOut(entry)}
                    className="h-7 px-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all flex items-center gap-1"
                    data-ocid={`checkin-checkout-btn.${index + 1}`}
                  >
                    <XCircle className="h-3 w-3" /> Out
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCheckIn(entry)}
                    className="h-7 px-2.5 rounded-lg bg-teal/20 border border-teal/30 text-teal text-xs font-semibold hover:bg-teal/30 transition-all flex items-center gap-1"
                    data-ocid={`checkin-checkin-btn.${index + 1}`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> In
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* End-of-game summary */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          End-of-Game Summary
        </p>
        {Object.entries(standGroups).map(([standName, members]) => (
          <div
            key={standName}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
          >
            <p className="text-xs font-bold text-teal mb-3">{standName}</p>
            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground truncate flex-1 min-w-0">
                    {m.name}
                  </span>
                  <span className="text-muted-foreground ml-2 shrink-0">
                    {m.role}
                  </span>
                  <span className="text-teal font-semibold ml-4 shrink-0">
                    {m.hoursWorked !== undefined ? `${m.hoursWorked}h` : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t border-border mt-2 text-xs">
              <span className="text-muted-foreground">Total hours</span>
              <span className="text-teal font-bold">
                {members.reduce((sum, m) => sum + (m.hoursWorked ?? 0), 0)}h
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Hours Override Modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setHoursInput("");
          }
        }}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-teal" /> Manual Hours Override
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">
                  {editTarget.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editTarget.role} · {editTarget.stand}
                </p>
              </div>
              <div>
                <label
                  htmlFor="manual-hours-input"
                  className="text-xs font-semibold text-muted-foreground mb-1.5 block"
                >
                  Hours Worked
                </label>
                <Input
                  id="manual-hours-input"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="e.g. 7.5"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                  className="bg-muted/30 border-border text-foreground"
                  data-ocid="manual-hours-input"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setHoursInput("");
              }}
              className="border-border text-muted-foreground"
              data-ocid="manual-hours-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveHours}
              className="bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30"
              data-ocid="manual-hours-save"
            >
              Save Hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
