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
  Building2,
  Calculator,
  CheckCircle,
  ChevronDown,
  Loader2,
  Lock,
  Receipt,
  Wifi,
} from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";
import { DEMO_STANDS, useDemoMode } from "../../context/DemoContext";
import {
  useApproveTipSplitPayout,
  useCalculateTipSplit,
} from "../../hooks/useQueries";

interface StandConfig {
  volunteerOrg?: boolean;
  orgName?: string;
  payoutDest?: string;
  salesPct?: number;
}

const GAME_DATE_DEFAULT = "2025-01-15";

interface SplitResult {
  staffId: string;
  name: string;
  role: string;
  hoursWorked: number;
  rolePoints: number;
  weightedScore: number;
  sharePercent: number;
  payout: number;
}

// ── PosTicket type (mirrors AdminPanel's definition) ────────────────────────
type PosTicket = {
  id: string;
  timestamp: string;
  standName: string;
  standId: string;
  saleTotal: number;
  tipAmount: number;
  category: "food" | "alcohol";
  employeeRef: string;
};

// Demo ticket seeds for each of the 3 primary stands (shown when POS tab was never opened)
const DEMO_TICKET_SEEDS: PosTicket[] = [
  // Lucas Oil Grill (stand-1)
  {
    id: "demo-1-1",
    timestamp: "6:45 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 38.5,
    tipAmount: 7.0,
    category: "food",
    employeeRef: "EMP-001",
  },
  {
    id: "demo-1-2",
    timestamp: "7:02 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 72.0,
    tipAmount: 14.0,
    category: "alcohol",
    employeeRef: "EMP-002",
  },
  {
    id: "demo-1-3",
    timestamp: "7:18 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 24.0,
    tipAmount: 4.5,
    category: "food",
    employeeRef: "EMP-001",
  },
  {
    id: "demo-1-4",
    timestamp: "7:35 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 56.75,
    tipAmount: 10.0,
    category: "alcohol",
    employeeRef: "EMP-003",
  },
  {
    id: "demo-1-5",
    timestamp: "7:52 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 18.5,
    tipAmount: 3.5,
    category: "food",
    employeeRef: "EMP-002",
  },
  {
    id: "demo-1-6",
    timestamp: "8:09 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 92.0,
    tipAmount: 18.0,
    category: "alcohol",
    employeeRef: "EMP-003",
  },
  {
    id: "demo-1-7",
    timestamp: "8:24 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 31.0,
    tipAmount: 6.0,
    category: "food",
    employeeRef: "EMP-001",
  },
  {
    id: "demo-1-8",
    timestamp: "8:41 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 44.0,
    tipAmount: 8.5,
    category: "food",
    employeeRef: "EMP-002",
  },
  // End Zone Bites (stand-3)
  {
    id: "demo-3-1",
    timestamp: "6:52 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 19.75,
    tipAmount: 3.5,
    category: "food",
    employeeRef: "EMP-004",
  },
  {
    id: "demo-3-2",
    timestamp: "7:11 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 27.5,
    tipAmount: 5.0,
    category: "food",
    employeeRef: "EMP-005",
  },
  {
    id: "demo-3-3",
    timestamp: "7:28 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 41.0,
    tipAmount: 7.5,
    category: "food",
    employeeRef: "EMP-004",
  },
  {
    id: "demo-3-4",
    timestamp: "7:44 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 15.25,
    tipAmount: 2.75,
    category: "food",
    employeeRef: "EMP-005",
  },
  {
    id: "demo-3-5",
    timestamp: "8:03 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 33.0,
    tipAmount: 6.0,
    category: "food",
    employeeRef: "EMP-004",
  },
  {
    id: "demo-3-6",
    timestamp: "8:20 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 22.5,
    tipAmount: 4.0,
    category: "food",
    employeeRef: "EMP-005",
  },
  // Colts Fan Eats (stand-4) — mapping stand-4 which appears in DEMO_POOLS
  {
    id: "demo-4-1",
    timestamp: "6:58 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 29.0,
    tipAmount: 5.5,
    category: "food",
    employeeRef: "EMP-006",
  },
  {
    id: "demo-4-2",
    timestamp: "7:16 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 48.5,
    tipAmount: 9.0,
    category: "food",
    employeeRef: "EMP-007",
  },
  {
    id: "demo-4-3",
    timestamp: "7:33 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 16.75,
    tipAmount: 3.0,
    category: "food",
    employeeRef: "EMP-006",
  },
  {
    id: "demo-4-4",
    timestamp: "7:55 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 62.0,
    tipAmount: 11.5,
    category: "food",
    employeeRef: "EMP-007",
  },
  {
    id: "demo-4-5",
    timestamp: "8:18 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 37.25,
    tipAmount: 7.0,
    category: "food",
    employeeRef: "EMP-006",
  },
  {
    id: "demo-4-6",
    timestamp: "8:35 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 21.5,
    tipAmount: 4.0,
    category: "food",
    employeeRef: "EMP-007",
  },
];

// Demo tip pools per stand
const DEMO_POOLS: Record<string, number> = {
  "stand-1": 300,
  "stand-4": 245,
  "stand-2": 180,
  "stand-5": 120,
};

function calcDemoSplit(standId: string, totalPool: number): SplitResult[] {
  if (standId === "stand-1") {
    return [
      {
        staffId: "staff-1",
        name: "Marcus Johnson",
        role: "Head Bartender",
        hoursWorked: 8,
        rolePoints: 3,
        weightedScore: 24,
        sharePercent: (24 / 46) * 100,
        payout: totalPool * (24 / 46),
      },
      {
        staffId: "staff-2",
        name: "Jade Williams",
        role: "Bartender",
        hoursWorked: 8,
        rolePoints: 2,
        weightedScore: 16,
        sharePercent: (16 / 46) * 100,
        payout: totalPool * (16 / 46),
      },
      {
        staffId: "staff-3",
        name: "DeShawn Carter",
        role: "Barback",
        hoursWorked: 6,
        rolePoints: 1,
        weightedScore: 6,
        sharePercent: (6 / 46) * 100,
        payout: totalPool * (6 / 46),
      },
    ];
  }
  if (standId === "stand-4") {
    return [
      {
        staffId: "staff-4",
        name: "Sarah Mitchell",
        role: "Concession Worker",
        hoursWorked: 8,
        rolePoints: 1,
        weightedScore: 8,
        sharePercent: 100,
        payout: totalPool,
      },
    ];
  }
  if (standId === "stand-2") {
    return [
      {
        staffId: "staff-5",
        name: "Mike Thompson",
        role: "Suite Runner",
        hoursWorked: 6,
        rolePoints: 2,
        weightedScore: 12,
        sharePercent: 100,
        payout: totalPool,
      },
    ];
  }
  if (standId === "stand-5") {
    return [
      {
        staffId: "staff-6",
        name: "Tanya Rivera",
        role: "Concession Worker",
        hoursWorked: 5,
        rolePoints: 1,
        weightedScore: 5,
        sharePercent: 100,
        payout: totalPool,
      },
    ];
  }
  return [];
}

export default function TipSplitSection() {
  const { isDemoMode } = useDemoMode();
  const [gameDate, setGameDate] = useState(GAME_DATE_DEFAULT);
  const [standId, setStandId] = useState("stand-1");
  const [poolInput, setPoolInput] = useState("300");
  const [cashTips, setCashTips] = useState("45.00");
  const [alcoholPool, setAlcoholPool] = useState("180");
  const [foodPool, setFoodPool] = useState("120");
  // Initialize split results immediately for demo mode — no useEffect race condition
  const [splitResults, setSplitResults] = useState<SplitResult[] | null>(() =>
    isDemoMode ? calcDemoSplit("stand-1", 345) : null,
  );
  const [alcoholResults, setAlcoholResults] = useState<SplitResult[] | null>(
    null,
  );
  const [foodResults, setFoodResults] = useState<SplitResult[] | null>(null);
  const [isCalc, setIsCalc] = useState(false);
  const [approved, setApproved] = useState(false);
  const [lastSplitCashTips, setLastSplitCashTips] = useState(
    isDemoMode ? 45 : 0,
  );
  const [lastSplitDigitalTips, setLastSplitDigitalTips] = useState(
    isDemoMode ? 300 : 0,
  );
  const [posAutoFilled, setPosAutoFilled] = useState(false);
  const [posTickets, setPosTickets] = useState<PosTicket[]>([]);
  const [ticketBreakdownExpanded, setTicketBreakdownExpanded] = useState(true);

  // Re-seed split results synchronously before paint when demo mode activates after context loads
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only seed — adding splitResults would cause infinite re-render
  useLayoutEffect(() => {
    if (isDemoMode && (!splitResults || splitResults.length === 0)) {
      setSplitResults(calcDemoSplit("stand-1", 345));
      setLastSplitDigitalTips((prev) => (prev > 0 ? prev : 300));
      setLastSplitCashTips((prev) => (prev > 0 ? prev : 45));
    }
  }, [isDemoMode]);

  // Read POS pool and tickets from localStorage for selected stand
  useEffect(() => {
    // Pools
    const rawPools = localStorage.getItem("pos_stand_tip_pools");
    if (rawPools) {
      try {
        const pools = JSON.parse(rawPools) as Record<string, number>;
        const posTips = pools[standId];
        if (posTips && posTips > 0) {
          setPoolInput(posTips.toFixed(2));
          setPosAutoFilled(true);
        } else {
          setPosAutoFilled(false);
        }
      } catch {
        setPosAutoFilled(false);
      }
    } else {
      setPosAutoFilled(false);
    }
    // Tickets
    const rawTickets = localStorage.getItem("pos_stand_tickets");
    if (rawTickets) {
      try {
        const allTickets = JSON.parse(rawTickets) as PosTicket[];
        const filtered = allTickets.filter((t) => t.standId === standId);
        if (filtered.length > 0) {
          setPosTickets(filtered);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    // Fall back to demo seeds if demo mode or no real data
    const seeds = DEMO_TICKET_SEEDS.filter((t) => t.standId === standId);
    setPosTickets(isDemoMode || seeds.length > 0 ? seeds : []);
  }, [standId, isDemoMode]);

  // Stadium variables read from localStorage
  const [volunteerConfig, setVolunteerConfig] = useState<StandConfig | null>(
    null,
  );
  const [salesCategoryEnabled, setSalesCategoryEnabled] = useState(false);
  const [alcoholCutoffActive, setAlcoholCutoffActive] = useState(false);
  const [tipsCertifiedStaff, setTipsCertifiedStaff] = useState<string[]>([
    "Marcus Thompson",
    "Jade Williams",
  ]);

  const calculateSplit = useCalculateTipSplit();
  const approvePayout = useApproveTipSplitPayout();

  const allStands = DEMO_STANDS;

  // Read localStorage configs on mount and when standId changes
  useEffect(() => {
    const raw = localStorage.getItem("standConfig");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, StandConfig>;
        const name = allStands.find((s) => s.id === standId)?.name ?? "";
        setVolunteerConfig(parsed[name] ?? null);
      } catch {
        setVolunteerConfig(null);
      }
    } else {
      setVolunteerConfig(null);
    }
    const catEnabled =
      localStorage.getItem("salesCategorySplitEnabled") === "true";
    setSalesCategoryEnabled(catEnabled);
    const cutoff = localStorage.getItem("alcoholCutoffActive") === "true";
    setAlcoholCutoffActive(cutoff);
    const certified = localStorage.getItem("tipsCertifiedStaff");
    if (certified) {
      try {
        setTipsCertifiedStaff(JSON.parse(certified) as string[]);
      } catch {
        /* keep default */
      }
    }
  }, [standId, allStands]);

  const handleStandChange = (id: string) => {
    setStandId(id);
    // In demo mode seed the split immediately so the table is visible without tapping Calculate
    if (isDemoMode) {
      const demoTotal = (DEMO_POOLS[id] ?? 300) + 45;
      setSplitResults(calcDemoSplit(id, demoTotal));
    } else {
      setSplitResults(null);
    }
    setAlcoholResults(null);
    setFoodResults(null);
    setApproved(false);
    setCashTips("45.00");
    // Check POS pools first
    const rawPools = localStorage.getItem("pos_stand_tip_pools");
    if (rawPools) {
      try {
        const pools = JSON.parse(rawPools) as Record<string, number>;
        const posTips = pools[id];
        if (posTips && posTips > 0) {
          setPoolInput(posTips.toFixed(2));
          setPosAutoFilled(true);
          if (id === "stand-1") {
            setAlcoholPool("180");
            setFoodPool("120");
          } else {
            setAlcoholPool(String(Math.round(posTips * 0.6)));
            setFoodPool(String(Math.round(posTips * 0.4)));
          }
          return;
        }
      } catch {
        /* ignore */
      }
    }
    setPosAutoFilled(false);
    const demoPool = DEMO_POOLS[id];
    if (demoPool) {
      setPoolInput(String(demoPool));
      // Pre-fill dual pools for Lucas Oil Grill (stand-1)
      if (id === "stand-1") {
        setAlcoholPool("180");
        setFoodPool("120");
      } else {
        setAlcoholPool(String(Math.round(demoPool * 0.6)));
        setFoodPool(String(Math.round(demoPool * 0.4)));
      }
    }
  };

  const handleCalculate = async () => {
    setIsCalc(true);
    setSplitResults(null);
    setAlcoholResults(null);
    setFoodResults(null);
    setApproved(false);

    if (salesCategoryEnabled) {
      const alc = Number.parseFloat(alcoholCutoffActive ? "0" : alcoholPool);
      const food = Number.parseFloat(foodPool);
      if (Number.isNaN(food) || food < 0) {
        toast.error("Enter a valid food tips pool amount");
        setIsCalc(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 600));
      const allStaff = calcDemoSplit(standId, alc + food);
      const alcStaff = allStaff.filter((s) =>
        tipsCertifiedStaff.includes(s.name),
      );
      const foodStaff = allStaff.filter(
        (s) => !tipsCertifiedStaff.includes(s.name),
      );
      const totalAlcScore = alcStaff.reduce(
        (sum, s) => sum + s.weightedScore,
        0,
      );
      const totalFoodScore = foodStaff.reduce(
        (sum, s) => sum + s.weightedScore,
        0,
      );
      setAlcoholResults(
        alcStaff.map((s) => ({
          ...s,
          sharePercent:
            totalAlcScore > 0 ? (s.weightedScore / totalAlcScore) * 100 : 0,
          payout:
            totalAlcScore > 0 ? alc * (s.weightedScore / totalAlcScore) : 0,
        })),
      );
      setFoodResults(
        foodStaff.length > 0
          ? foodStaff.map((s) => ({
              ...s,
              sharePercent:
                totalFoodScore > 0
                  ? (s.weightedScore / totalFoodScore) * 100
                  : 100 / foodStaff.length,
              payout:
                totalFoodScore > 0
                  ? food * (s.weightedScore / totalFoodScore)
                  : food / foodStaff.length,
            }))
          : allStaff.map((s) => ({
              ...s,
              sharePercent: 100 / allStaff.length,
              payout: food / allStaff.length,
            })),
      );
      setIsCalc(false);
      return;
    }

    const digital = Number.parseFloat(poolInput) || 0;
    const cash = Number.parseFloat(cashTips) || 0;
    const total = digital + cash;
    if (total <= 0) {
      toast.error("Enter a valid pool amount");
      setIsCalc(false);
      return;
    }

    setLastSplitDigitalTips(digital);
    setLastSplitCashTips(cash);

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 600));
      setSplitResults(calcDemoSplit(standId, total));
      setIsCalc(false);
      return;
    }

    try {
      await calculateSplit.mutateAsync({
        standId,
        standName: standName,
        gameDate,
        totalPool: total,
      });
      setSplitResults(calcDemoSplit(standId, total));
    } catch {
      toast.error("Failed to calculate split");
    }
    setIsCalc(false);
  };

  const handleApprove = async () => {
    if (isDemoMode) {
      setApproved(true);
      toast.success("Payout approved and sent to staff!");
      return;
    }
    try {
      await approvePayout.mutateAsync({
        payoutId: `${standId}-${gameDate}`,
        approvedBy: "manager",
        approvedAt: Date.now(),
      });
      setApproved(true);
      toast.success("Payout approved!");
    } catch {
      toast.error("Failed to approve payout");
    }
  };

  const standName = allStands.find((s) => s.id === standId)?.name ?? standId;

  return (
    <div
      className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-5"
      data-ocid="tip-split-section"
    >
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="h-5 w-5 text-teal" />
        <p className="text-sm font-bold text-foreground">Automated Tip Split</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="tip-split-date"
            className="text-xs font-semibold text-muted-foreground mb-1.5 block"
          >
            Game Date
          </label>
          <input
            id="tip-split-date"
            type="date"
            value={gameDate}
            onChange={(e) => {
              setGameDate(e.target.value);
              setSplitResults(null);
              setAlcoholResults(null);
              setFoodResults(null);
              setApproved(false);
            }}
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            data-ocid="tip-split-date"
          />
        </div>
        <div>
          <label
            htmlFor="tip-split-stand"
            className="text-xs font-semibold text-muted-foreground mb-1.5 block"
          >
            Stand
          </label>
          <div className="relative">
            <select
              id="tip-split-stand"
              value={standId}
              onChange={(e) => handleStandChange(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground appearance-none pr-8"
              data-ocid="tip-split-stand"
            >
              {allStands.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Pool input — single or dual based on salesCategoryEnabled */}
        {!salesCategoryEnabled ? (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label
                htmlFor="tip-split-pool-input"
                className="text-xs font-semibold text-muted-foreground"
              >
                Digital Tips — POS &amp; In-App ($)
              </label>
              {posAutoFilled && (
                <span
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400"
                  data-ocid="pos-auto-filled-badge"
                >
                  <Wifi className="h-3 w-3" />
                  Auto-filled from POS
                </span>
              )}
            </div>
            <Input
              id="tip-split-pool-input"
              type="number"
              min="0"
              step="0.01"
              value={poolInput}
              onChange={(e) => {
                setPoolInput(e.target.value);
                setPosAutoFilled(false);
                setSplitResults(null);
                setApproved(false);
              }}
              className="bg-muted/30 border-border text-foreground"
              data-ocid="tip-split-pool-input"
            />
          </div>
        ) : null}
      </div>

      {/* Cash Tips input — always visible */}
      {!salesCategoryEnabled && (
        <div>
          <label
            htmlFor="tip-split-cash-input"
            className="text-xs font-semibold text-muted-foreground mb-1.5 block"
          >
            Cash Tips Collected at Stand ($)
          </label>
          <Input
            id="tip-split-cash-input"
            type="number"
            min="0"
            step="0.01"
            value={cashTips}
            onChange={(e) => {
              setCashTips(e.target.value);
              setSplitResults(null);
              setApproved(false);
            }}
            placeholder="e.g. 45.00"
            className="bg-muted/30 border-border text-foreground"
            data-ocid="tip-split-cash-input"
          />
          {/* Blended total preview */}
          {((Number.parseFloat(poolInput) || 0) > 0 ||
            (Number.parseFloat(cashTips) || 0) > 0) && (
            <div
              className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/20 border border-border/40 rounded-lg px-3 py-2"
              data-ocid="blended-total-preview"
            >
              <span className="text-muted-foreground/70">Digital:</span>
              <span className="text-foreground font-bold">
                ${(Number.parseFloat(poolInput) || 0).toFixed(2)}
              </span>
              <span className="text-muted-foreground/40 mx-0.5">+</span>
              <span className="text-muted-foreground/70">Cash:</span>
              <span className="text-foreground font-bold">
                ${(Number.parseFloat(cashTips) || 0).toFixed(2)}
              </span>
              <span className="text-muted-foreground/40 mx-0.5">=</span>
              <span className="text-muted-foreground/70">Blended:</span>
              <span className="text-teal font-bold">
                $
                {(
                  (Number.parseFloat(poolInput) || 0) +
                  (Number.parseFloat(cashTips) || 0)
                ).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dual pool inputs when Sales Category Split is enabled */}
      {salesCategoryEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="tip-split-alcohol-pool"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Alcohol Tips Pool ($)
            </label>
            <div className="relative">
              <Input
                id="tip-split-alcohol-pool"
                type="number"
                min="0"
                step="0.01"
                value={alcoholCutoffActive ? "" : alcoholPool}
                disabled={alcoholCutoffActive}
                onChange={(e) => {
                  setAlcoholPool(e.target.value);
                  setAlcoholResults(null);
                  setApproved(false);
                }}
                placeholder={alcoholCutoffActive ? "Locked" : "e.g. 180"}
                className="bg-muted/30 border-border text-foreground disabled:opacity-60 disabled:cursor-not-allowed pl-8"
                data-ocid="tip-split-alcohol-pool-input"
              />
              <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-400/70" />
            </div>
            {alcoholCutoffActive && (
              <p className="text-[11px] text-amber-400/80 mt-1 flex items-center gap-1">
                <Lock className="h-3 w-3 shrink-0" />
                Locked — 3rd Quarter cutoff is active
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="tip-split-food-pool"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              Food Tips Pool ($)
            </label>
            <Input
              id="tip-split-food-pool"
              type="number"
              min="0"
              step="0.01"
              value={foodPool}
              onChange={(e) => {
                setFoodPool(e.target.value);
                setFoodResults(null);
                setApproved(false);
              }}
              className="bg-muted/30 border-border text-foreground"
              data-ocid="tip-split-food-pool-input"
            />
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleCalculate}
        disabled={isCalc}
        className="w-full bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30 font-semibold"
        data-ocid="tip-split-calculate-btn"
      >
        {isCalc ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Calculator className="h-4 w-4 mr-2" />
        )}
        Calculate Split
      </Button>

      {/* POS Ticket Breakdown */}
      {standId && (
        <PosTicketBreakdown
          tickets={posTickets}
          expanded={ticketBreakdownExpanded}
          onToggle={() => setTicketBreakdownExpanded((v) => !v)}
          standName={standName}
          gameDate={gameDate}
        />
      )}

      {/* Volunteer Org Bypass Card */}
      {volunteerConfig?.volunteerOrg && (
        <div
          className="border border-teal/40 bg-teal/5 rounded-xl p-4 space-y-2"
          data-ocid="volunteer-org-card"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal shrink-0" />
            <p className="text-sm font-bold text-teal">
              All tips routed to organization account
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">
                Organization:
              </span>
              <span className="text-foreground font-semibold">
                {volunteerConfig.orgName}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-28 shrink-0">
                Payout Dest:
              </span>
              <span className="text-foreground font-semibold">
                {volunteerConfig.payoutDest}
              </span>
            </div>
            {volunteerConfig.salesPct !== undefined && (
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground w-28 shrink-0">
                  Pool Routing:
                </span>
                <span className="text-teal font-bold">
                  {volunteerConfig.salesPct}% of tips
                </span>
              </div>
            )}
            {splitResults && splitResults.length > 0 && (
              <div className="flex items-start gap-2 mt-1 pt-1 border-t border-teal/20">
                <span className="text-muted-foreground w-28 shrink-0">
                  Total Amount:
                </span>
                <span className="text-teal font-bold text-sm">
                  ${Number.parseFloat(poolInput).toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/60 italic">
            No individual staff splits for volunteer-operated stands
          </p>
        </div>
      )}

      {/* Standard single-pool results */}
      {!volunteerConfig?.volunteerOrg &&
        splitResults &&
        splitResults.length > 0 && (
          <SplitResultTable
            label={`${standName} · ${gameDate}`}
            rows={splitResults}
            approved={approved}
            onApprove={handleApprove}
            digitalTips={lastSplitDigitalTips}
            cashTips={lastSplitCashTips}
          />
        )}

      {/* Dual-pool results */}
      {!volunteerConfig?.volunteerOrg &&
        (alcoholResults !== null || foodResults !== null) && (
          <div className="space-y-4">
            {/* Alcohol split */}
            {alcoholResults !== null && !alcoholCutoffActive && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/30">
                    🍺 Alcohol Split — TIPS Certified Only
                  </span>
                </div>
                <SplitResultTable
                  label={`Alcohol Pool · ${alcoholPool}`}
                  rows={alcoholResults}
                  approved={false}
                  onApprove={() => {}}
                  hideApprove
                />
              </div>
            )}
            {alcoholCutoffActive && (
              <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <Lock className="h-4 w-4 shrink-0" />
                Alcohol tip pool locked — 3rd Quarter cutoff active. No alcohol
                payouts for this period.
              </div>
            )}
            {/* Food split */}
            {foodResults !== null && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal/15 text-teal border border-teal/30">
                    🍔 Food Split — All Food Staff
                  </span>
                </div>
                <SplitResultTable
                  label={`Food Pool · ${foodPool}`}
                  rows={foodResults}
                  approved={approved}
                  onApprove={handleApprove}
                />
              </div>
            )}
          </div>
        )}

      {splitResults && splitResults.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground/60">
          No staff checked in for this stand on this date.
        </div>
      )}
    </div>
  );
}

// ── POS Ticket Breakdown sub-component ────────────────────────────────
function PosTicketBreakdown({
  tickets,
  expanded,
  onToggle,
  standName,
  gameDate,
}: {
  tickets: PosTicket[];
  expanded: boolean;
  onToggle: () => void;
  standName: string;
  gameDate: string;
}) {
  type TicketFilter = "all" | "alcohol" | "food";
  const [filter, setFilter] = useState<TicketFilter>("all");

  const filteredTickets =
    filter === "all" ? tickets : tickets.filter((t) => t.category === filter);

  const filteredTotal = filteredTickets.reduce(
    (sum, t) => sum + t.tipAmount,
    0,
  );
  const allTotal = tickets.reduce((sum, t) => sum + t.tipAmount, 0);

  function formatTime(ts: string): string {
    return ts;
  }

  function formatTicketId(id: string): string {
    const num = id.replace(/\D+/g, "").padStart(4, "0");
    return `#TKT-${num.slice(-4)}`;
  }

  function handleExportPdf() {
    const filterLabel =
      filter === "all"
        ? "All"
        : filter === "alcohol"
          ? "Alcohol Only"
          : "Food Only";

    const rows = filteredTickets
      .map(
        (t, idx) =>
          `<tr class="${idx % 2 === 0 ? "even" : "odd"}">
            <td>${formatTicketId(t.id)}</td>
            <td><span class="badge ${t.category}">${t.category === "alcohol" ? "Alcohol" : "Food"}</span></td>
            <td>${formatTime(t.timestamp)}</td>
            <td>${t.employeeRef}</td>
            <td class="num">$${t.saleTotal.toFixed(2)}</td>
            <td class="num tip">$${t.tipAmount.toFixed(2)}</td>
          </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>POS Ticket Breakdown — ${standName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; padding: 24px; }
  h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
  .meta span { margin-right: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { border-bottom: 2px solid #111; }
  th { text-align: left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #333; }
  th.num, td.num { text-align: right; }
  td { padding: 6px 8px; border-bottom: 1px solid #ddd; vertical-align: middle; }
  tr.even td { background: #f7f7f7; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #ccc; }
  .badge.alcohol { background: #fff8e7; border-color: #d4a017; color: #7a5400; }
  .badge.food { background: #e6faf9; border-color: #2a9d8f; color: #145c54; }
  .total-row td { border-top: 2px solid #111; border-bottom: none; font-weight: 700; font-size: 13px; padding-top: 10px; }
  .tip { font-weight: 600; }
  .footer { font-size: 10px; color: #888; margin-top: 8px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>POS Ticket Breakdown — ${standName}</h1>
  <div class="meta">
    <span>📅 Game Date: <strong>${gameDate}</strong></span>
    <span>🔍 Filter: <strong>${filterLabel}</strong></span>
    <span>🎟 Tickets: <strong>${filteredTickets.length}</strong></span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Ticket #</th>
        <th>Category</th>
        <th>Time</th>
        <th>Employee</th>
        <th class="num">Sale Total</th>
        <th class="num">Tip Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="5" style="text-align:right">Total Tips (${filterLabel})</td>
        <td class="num">$${filteredTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Generated by Open Tip Pay · ${new Date().toLocaleString()}</div>
</body>
</html>`;

    const printWin = window.open("", "_blank", "width=820,height=600");
    if (!printWin) {
      // Fallback: inject a temporary hidden iframe
      const iframe = document.createElement("iframe");
      iframe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;border:none;visibility:hidden;";
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }
      setTimeout(() => document.body.removeChild(iframe), 2000);
      return;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    // Small delay so styles render before print dialog opens
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 350);
  }

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-150 border ${
      active
        ? "bg-teal/20 border-teal/60 text-teal"
        : "bg-transparent border-border/40 text-muted-foreground hover:border-teal/30 hover:text-teal/80"
    }`;

  if (tickets.length === 0) {
    return (
      <div
        className="border border-border/40 rounded-xl p-4 bg-muted/5"
        data-ocid="pos-ticket-breakdown-empty"
      >
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">
            POS Ticket Breakdown
          </p>
        </div>
        <p className="text-xs text-muted-foreground/50 italic pl-6">
          No POS ticket data available for this stand.
        </p>
      </div>
    );
  }

  return (
    <div
      className="border border-border/50 rounded-xl overflow-hidden bg-muted/5"
      data-ocid="pos-ticket-breakdown"
    >
      {/* Header — clickable to toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/10 transition-colors duration-150"
        data-ocid="pos-ticket-breakdown-toggle"
      >
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-teal shrink-0" />
          <span className="text-xs font-semibold text-foreground">
            POS Ticket Breakdown
          </span>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* ── Filter controls ── */}
          <div
            className="flex items-center gap-2 pt-1"
            data-ocid="pos-ticket-filter"
          >
            <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider shrink-0">
              Filter:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={filterBtnClass(filter === "all")}
                data-ocid="pos-ticket-filter.all"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("alcohol")}
                className={filterBtnClass(filter === "alcohol")}
                data-ocid="pos-ticket-filter.alcohol"
              >
                🍺 Alcohol Only
              </button>
              <button
                type="button"
                onClick={() => setFilter("food")}
                className={filterBtnClass(filter === "food")}
                data-ocid="pos-ticket-filter.food"
              >
                🍔 Food Only
              </button>
            </div>
            {filter !== "all" && (
              <span className="ml-auto text-[10px] text-muted-foreground/50">
                {filteredTickets.length} of {tickets.length} shown
              </span>
            )}
          </div>

          {/* Scrollable ticket list */}
          <div
            className="space-y-1.5 overflow-y-auto"
            style={{ maxHeight: "320px", scrollbarWidth: "thin" }}
            data-ocid="pos-ticket-breakdown-list"
          >
            {filteredTickets.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 italic text-center py-4">
                No {filter} tickets for this stand.
              </p>
            ) : (
              filteredTickets.map((ticket, idx) => (
                <div
                  key={ticket.id}
                  className="flex items-center gap-2 bg-muted/10 border border-border/40 rounded-lg px-3 py-2 hover:bg-muted/20 transition-colors duration-150 text-xs"
                  data-ocid={`pos-ticket-breakdown.item.${idx + 1}`}
                >
                  {/* Ticket # */}
                  <span className="font-mono text-muted-foreground/70 shrink-0 w-20">
                    {formatTicketId(ticket.id)}
                  </span>

                  {/* Category badge */}
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      ticket.category === "alcohol"
                        ? "bg-amber-500/15 text-amber-400 border border-amber-400/30"
                        : "bg-teal/15 text-teal border border-teal/30"
                    }`}
                  >
                    {ticket.category === "alcohol" ? "Alcohol" : "Food"}
                  </span>

                  {/* Time */}
                  <span className="text-muted-foreground/60 shrink-0">
                    {formatTime(ticket.timestamp)}
                  </span>

                  {/* Employee ref */}
                  <span className="text-muted-foreground/70 shrink-0">
                    {ticket.employeeRef}
                  </span>

                  {/* Spacer */}
                  <span className="flex-1 min-w-0" />

                  {/* Sale total */}
                  <span className="text-muted-foreground shrink-0">
                    ${ticket.saleTotal.toFixed(2)}
                  </span>

                  {/* Tip amount */}
                  <span className="font-bold text-teal shrink-0 w-14 text-right">
                    +${ticket.tipAmount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Summary line + Export PDF */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted-foreground">
                {filter === "all"
                  ? "Total tips"
                  : `${filter === "alcohol" ? "Alcohol" : "Food"} tips`}{" "}
                from {filteredTickets.length} ticket
                {filteredTickets.length !== 1 ? "s" : ""}:
              </span>
              <span className="text-sm font-bold text-teal">
                ${filteredTotal.toFixed(2)}
              </span>
            </div>
            {filter !== "all" && (
              <p className="text-[10px] text-muted-foreground/40 italic px-1">
                All tickets total: ${allTotal.toFixed(2)}
              </p>
            )}
            <Button
              type="button"
              onClick={handleExportPdf}
              className="w-full bg-transparent border border-border/50 text-muted-foreground hover:border-teal/40 hover:text-teal hover:bg-teal/5 font-semibold text-xs h-8"
              data-ocid="pos-ticket-export-pdf-btn"
            >
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              Export PDF (
              {filter === "all"
                ? "All"
                : filter === "alcohol"
                  ? "Alcohol Only"
                  : "Food Only"}
              )
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared result table sub-component ─────────────────────────────────────────

function SplitResultTable({
  label,
  rows,
  approved,
  onApprove,
  hideApprove = false,
  digitalTips = 0,
  cashTips = 0,
}: {
  label: string;
  rows: SplitResult[];
  approved: boolean;
  onApprove: () => void;
  hideApprove?: boolean;
  digitalTips?: number;
  cashTips?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
          {rows.length} staff
        </span>
      </div>

      <div className="hidden sm:grid grid-cols-6 gap-2 text-[10px] font-semibold text-muted-foreground/60 uppercase px-1">
        <span className="col-span-2">Staff</span>
        <span className="text-center">Hrs</span>
        <span className="text-center">Pts</span>
        <span className="text-center">Share</span>
        <span className="text-right">Payout</span>
      </div>

      {rows.map((row, i) => (
        <div
          key={row.staffId}
          className="bg-muted/10 border border-border/50 rounded-lg p-3"
          data-ocid={`tip-split-result.${i + 1}`}
        >
          <div className="sm:hidden space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {row.name}
              </p>
              <span className="text-sm font-bold text-teal">
                ${row.payout.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{row.role}</span>
              <span>{row.hoursWorked}h</span>
              <span>
                {row.rolePoints}pts → {row.weightedScore}weighted
              </span>
              <span className="text-teal">{row.sharePercent.toFixed(1)}%</span>
            </div>
          </div>
          <div className="hidden sm:grid grid-cols-6 gap-2 items-center">
            <div className="col-span-2">
              <p className="text-sm font-semibold text-foreground">
                {row.name}
              </p>
              <p className="text-xs text-muted-foreground">{row.role}</p>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {row.hoursWorked}h
            </p>
            <p className="text-sm text-center text-muted-foreground">
              {row.rolePoints}×{row.hoursWorked}={row.weightedScore}
            </p>
            <p className="text-sm text-center text-teal">
              {row.sharePercent.toFixed(1)}%
            </p>
            <p className="text-sm text-right font-bold text-teal">
              ${row.payout.toFixed(2)}
            </p>
          </div>
        </div>
      ))}

      {/* Blended breakdown above approve */}
      {(digitalTips > 0 || cashTips > 0) && (
        <div
          className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/20 border border-border/40 rounded-lg px-3 py-2.5"
          data-ocid="blended-split-breakdown"
        >
          <div>
            <p className="text-muted-foreground/60 mb-0.5">Digital Tips</p>
            <p className="font-bold text-foreground">
              ${digitalTips.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground/60 mb-0.5">Cash Tips</p>
            <p className="font-bold text-foreground">${cashTips.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground/60 mb-0.5">Blended Total</p>
            <p className="font-bold text-teal">
              ${(digitalTips + cashTips).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/50 italic">
        Splits only staff checked in for this stand on this game date
      </p>

      {!hideApprove && (
        <div className="space-y-3 pt-1">
          {approved ? (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Payout approved — funds sent to staff balances
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              {rows.length > 0 && (
                <Button
                  type="button"
                  onClick={onApprove}
                  className="flex-1 bg-teal hover:bg-teal/90 text-background font-bold shadow-lg shadow-teal/30 border-0"
                  data-ocid="tip-split-approve-btn"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Payout
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
