import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, Edit2, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DEMO_STANDS, useDemoMode } from "../../context/DemoContext";
import { useSetGameStandAssignment } from "../../hooks/useQueries";

const GAME_DATE_DEFAULT = "2025-01-15";

interface RosterEntry {
  id: string;
  name: string;
  role: string;
  defaultStand: string;
  defaultStandId: string;
  gameStand?: string;
  gameStandId?: string;
  hasOverride: boolean;
}

const DEMO_ROSTER: RosterEntry[] = [
  {
    id: "staff-1",
    name: "Marcus Johnson",
    role: "Head Bartender",
    defaultStand: "Lucas Oil Grill",
    defaultStandId: "stand-1",
    hasOverride: false,
  },
  {
    id: "staff-2",
    name: "Jade Williams",
    role: "Bartender",
    defaultStand: "Lucas Oil Grill",
    defaultStandId: "stand-1",
    hasOverride: false,
  },
  {
    id: "staff-3",
    name: "DeShawn Carter",
    role: "Barback",
    defaultStand: "Lucas Oil Grill",
    defaultStandId: "stand-1",
    hasOverride: false,
  },
  {
    id: "staff-4",
    name: "Sarah Mitchell",
    role: "Concession Worker",
    defaultStand: "Club Level Grill",
    defaultStandId: "stand-4",
    hasOverride: false,
  },
  {
    id: "staff-5",
    name: "Mike Thompson",
    role: "Suite Runner",
    defaultStand: "End Zone Bites",
    defaultStandId: "stand-2",
    hasOverride: false,
  },
  {
    id: "staff-6",
    name: "Tanya Rivera",
    role: "Concession Worker",
    defaultStand: "Suite Level Bar",
    defaultStandId: "stand-5",
    hasOverride: false,
  },
];

export default function GameRosterTab() {
  const { isDemoMode } = useDemoMode();
  const [gameDate, setGameDate] = useState(GAME_DATE_DEFAULT);
  const [roster, setRoster] = useState<RosterEntry[]>(DEMO_ROSTER);
  const [editTarget, setEditTarget] = useState<RosterEntry | null>(null);
  const [selectedStandId, setSelectedStandId] = useState("");

  const setAssignment = useSetGameStandAssignment();

  const allStands = DEMO_STANDS;

  const handleSaveAssignment = async () => {
    if (!editTarget || !selectedStandId) return;
    const stand = allStands.find((s) => s.id === selectedStandId);
    if (!stand) return;

    if (isDemoMode) {
      setRoster((prev) =>
        prev.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                gameStand: stand.name,
                gameStandId: stand.id,
                hasOverride: stand.id !== r.defaultStandId,
              }
            : r,
        ),
      );
      toast.success(
        `${editTarget.name} assigned to ${stand.name} for this game`,
      );
      setEditTarget(null);
      setSelectedStandId("");
      return;
    }

    try {
      await setAssignment.mutateAsync({
        staffId: editTarget.id,
        staffName: editTarget.name,
        standId: stand.id,
        standName: stand.name,
        gameDate,
        gameStandId: stand.id,
        defaultStandId: editTarget.defaultStandId,
        gameStandName: stand.name,
      });
      setRoster((prev) =>
        prev.map((r) =>
          r.id === editTarget.id
            ? {
                ...r,
                gameStand: stand.name,
                gameStandId: stand.id,
                hasOverride: stand.id !== r.defaultStandId,
              }
            : r,
        ),
      );
      toast.success(`${editTarget.name} assigned to ${stand.name}`);
    } catch {
      toast.error("Failed to save assignment");
    }
    setEditTarget(null);
    setSelectedStandId("");
  };

  return (
    <div className="space-y-5" data-ocid="manager-game-roster-tab">
      {/* Game date selector */}
      <div className="glassmorphism rounded-xl p-4 border border-teal/30 bg-teal/5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-teal shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground mb-1">
              Game Date
            </p>
            <input
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-full"
              data-ocid="game-roster-date"
            />
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-muted-foreground">Overrides</p>
            <p className="text-lg font-bold text-teal">
              {roster.filter((r) => r.hasOverride).length}
            </p>
          </div>
        </div>
      </div>

      {/* Staff roster */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Staff Stand Assignments
        </p>
        <p className="text-xs text-muted-foreground/60">
          Edit to reassign a staff member to a different stand for this game
          only.
        </p>
        {roster.map((entry, index) => {
          const currentStand = entry.gameStand ?? entry.defaultStand;
          return (
            <div
              key={entry.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
              data-ocid={`game-roster-row.${index + 1}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-teal">
                    {entry.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.name}
                    </p>
                    {entry.hasOverride && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                        Game Override
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.role}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground/60">
                      Default:
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.defaultStand}
                    </span>
                    {entry.hasOverride && (
                      <>
                        <span className="text-xs text-muted-foreground/40">
                          →
                        </span>
                        <span className="text-xs text-amber-300 font-semibold">
                          {currentStand}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(entry);
                    setSelectedStandId(
                      entry.gameStandId ?? entry.defaultStandId,
                    );
                  }}
                  className="h-8 w-8 rounded-lg bg-muted/30 border border-border flex items-center justify-center hover:bg-muted/50 transition-all shrink-0"
                  aria-label="Edit stand assignment"
                  data-ocid={`game-roster-edit.${index + 1}`}
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit stand modal */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setSelectedStandId("");
          }
        }}
      >
        <DialogContent className="bg-card/95 backdrop-blur-xl border-teal/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-teal" /> Change Stand for This
              Game
            </DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/20 rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground">
                  {editTarget.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {editTarget.role} · Default: {editTarget.defaultStand}
                </p>
              </div>
              <div>
                <label
                  htmlFor="game-roster-stand-select"
                  className="text-xs font-semibold text-muted-foreground mb-1.5 block"
                >
                  Stand for This Game
                </label>
                <select
                  id="game-roster-stand-select"
                  value={selectedStandId}
                  onChange={(e) => setSelectedStandId(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  data-ocid="game-roster-stand-select"
                >
                  <option value="">Select a stand...</option>
                  {allStands.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <span className="text-amber-400 text-xs mt-0.5">⚠</span>
                <p className="text-xs text-amber-300/80">
                  This change applies to this game only — permanent assignment
                  unchanged.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setSelectedStandId("");
              }}
              className="border-border text-muted-foreground"
              data-ocid="game-roster-cancel"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAssignment}
              disabled={!selectedStandId}
              className="bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30"
              data-ocid="game-roster-save"
            >
              Save for This Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
