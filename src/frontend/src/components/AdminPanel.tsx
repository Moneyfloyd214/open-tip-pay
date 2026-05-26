import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { UnifiedStandMerchant } from "@/types/fanpoints";
import type {
  MerchantCategory,
  PlaidMerchant,
  PointsRuleType,
} from "@/types/fanpoints";
import type { Principal } from "@dfinity/principal";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Code2,
  CreditCard,
  Database,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Globe,
  Handshake,
  Lock,
  Mail,
  MessageCircle,
  Monitor,
  Palette,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Store,
  Terminal,
  Trash2,
  UserCog,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useState as useStateAlias,
} from "react";
import { toast } from "sonner";
import {
  DEMO_MENU_ITEMS,
  DEMO_PLAID_MERCHANTS,
  DEMO_POINTS_RULES,
  DEMO_POINT_TRANSACTIONS,
  DEMO_STANDS,
  DEMO_UNIFIED_STANDS_MERCHANTS,
  DemoContext,
  useDemoMode,
} from "../context/DemoContext";
import type { DemoPointTransaction } from "../context/DemoContext";
import {
  useAddMenuItem,
  useAdminCloseSupportTicket,
  useAdminGetAllSupportConversations,
  useAdminGetSupportMessages,
  useAdminReplySupportMessage,
  useApproveBusinessApplication,
  useClearPartnerBranding,
  useCompleteDirectDeposit,
  useCreateReward,
  useCreateStand,
  useDeleteMenuItem,
  useDeleteReward,
  useDeleteStand,
  useGetActiveSessions,
  useGetAllBusinessApplications,
  useGetCompilationStatus,
  useGetEncryptionLog,
  useGetFraudAlerts,
  useGetKYCConfigurationStatus,
  useGetPartnerBranding,
  useGetPendingDirectDeposits,
  useGetSMSConfigurationStatus,
  useGetTipsSent,
  useIsCallerAdmin,
  useIsStripeConfigured,
  useListMenuItems,
  useListRewards,
  useListStands,
  useRejectBusinessApplication,
  useSearchUsers,
  useSetKYCConfiguration,
  useSetPartnerBranding,
  useSetSMSConfiguration,
  useSetStripeConfiguration,
  useSimulateDirectDeposit,
  useUpdateMenuItem,
  useUpdateReward,
} from "../hooks/useQueries";
import WhiteLabelSettings from "./WhiteLabelSettings";

// ── Types ─────────────────────────────────────────────────────────────────────
type AdminTab =
  | "applications"
  | "fraud"
  | "sessions"
  | "audit"
  | "settings"
  | "roles"
  | "directdeposit"
  | "support"
  | "whitelabel"
  | "rewards"
  | "partnerships"
  | "foodmenus"
  | "stands-merchants"
  | "pos-integration"
  | "analytics"
  | "operations";
type AuditFilter = "today" | "week" | "all";

interface AdminPanelProps {
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function tsToMs(ts: bigint) {
  return Number(ts) / 1_000_000;
}

function formatTs(ts: bigint) {
  return new Date(tsToMs(ts)).toLocaleString();
}

function truncatePrincipal(p: Principal | string) {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

// ── Operations Tab ─────────────────────────────────────────────────────────
const DEMO_STANDS_OPS = [
  {
    id: "lucas-oil-grill",
    name: "Lucas Oil Grill",
    baseSales: 1240,
    status: "busy" as const,
  },
  {
    id: "end-zone-bites",
    name: "End Zone Bites",
    baseSales: 890,
    status: "normal" as const,
  },
  {
    id: "colts-fan-eats",
    name: "Colts Fan Eats",
    baseSales: 760,
    status: "normal" as const,
  },
  {
    id: "club-level-bar",
    name: "Club Level Bar",
    baseSales: 1680,
    status: "slammed" as const,
  },
  {
    id: "suite-level-bar",
    name: "Suite Level Bar",
    baseSales: 1420,
    status: "busy" as const,
  },
  {
    id: "vip-lounge",
    name: "VIP Lounge",
    baseSales: 2100,
    status: "slammed" as const,
  },
];

const GAME_PHASES = ["Pre-Game", "Q1", "Q2", "Halftime", "Q3", "Q4"];

// Intensity 0-100 per stand (row) per phase (col)
const PEAK_TIMES_DATA: number[][] = [
  [60, 55, 80, 92, 70, 20], // Lucas Oil Grill
  [45, 50, 75, 88, 65, 18], // End Zone Bites
  [40, 48, 72, 85, 60, 15], // Colts Fan Eats
  [50, 60, 88, 90, 90, 22], // Club Level Bar
  [55, 65, 82, 95, 75, 25], // Suite Level Bar
  [70, 72, 85, 93, 68, 20], // VIP Lounge
];

const PRODUCT_DEMAND: Record<
  string,
  { item: string; orders: number; pct: number }[]
> = {
  "lucas-oil-grill": [
    { item: "Hot Dog Combo", orders: 312, pct: 88 },
    { item: "Loaded Nachos", orders: 245, pct: 69 },
    { item: "Bud Light", orders: 198, pct: 56 },
  ],
  "end-zone-bites": [
    { item: "Chicken Tenders", orders: 278, pct: 82 },
    { item: "Jumbo Pretzel", orders: 210, pct: 62 },
    { item: "Diet Pepsi", orders: 185, pct: 55 },
  ],
  "colts-fan-eats": [
    { item: "Loaded Fries", orders: 260, pct: 79 },
    { item: "Pretzel Bites", orders: 195, pct: 58 },
    { item: "Bottled Water", orders: 172, pct: 51 },
  ],
  "club-level-bar": [
    { item: "Bud Light Draft", orders: 395, pct: 95 },
    { item: "Mixed Drink", orders: 318, pct: 76 },
    { item: "Wine by Glass", orders: 240, pct: 57 },
  ],
  "suite-level-bar": [
    { item: "Mixed Drink", orders: 355, pct: 92 },
    { item: "Craft Beer", orders: 290, pct: 75 },
    { item: "Cheese Plate", orders: 180, pct: 47 },
  ],
  "vip-lounge": [
    { item: "Premium Cocktail", orders: 420, pct: 98 },
    { item: "Wagyu Slider", orders: 310, pct: 72 },
    { item: "Champagne Flute", orders: 265, pct: 62 },
  ],
};

const INITIAL_STAFFING_ALERTS = [
  {
    id: 1,
    stand: "Club Level Bar",
    severity: "high" as const,
    message:
      "High Demand (Q2): Order volume 3x above average. Consider moving 2 staff.",
  },
  {
    id: 2,
    stand: "Lucas Oil Grill",
    severity: "high" as const,
    message: "Halftime Surge: Tip volume $180 in last 10 min. Add 1 cashier.",
  },
  {
    id: 3,
    stand: "End Zone Bites",
    severity: "resolved" as const,
    message: "Volume normalized.",
  },
];

function OperationsTab() {
  const { isDemoMode } = useDemoMode();
  const [liveSales, setLiveSales] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEMO_STANDS_OPS.map((s) => [s.id, s.baseSales])),
  );
  const [alerts, setAlerts] = useState(INITIAL_STAFFING_ALERTS);
  const [selectedStand, setSelectedStand] = useState(DEMO_STANDS_OPS[0].id);

  useEffect(() => {
    if (!isDemoMode) return;
    const interval = setInterval(() => {
      setLiveSales((prev) => {
        const next = { ...prev };
        for (const s of DEMO_STANDS_OPS) {
          next[s.id] = prev[s.id] + Math.floor(Math.random() * 16);
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  const maxSales = Math.max(
    ...DEMO_STANDS_OPS.map((s) => liveSales[s.id] ?? s.baseSales),
  );

  function intensityClass(val: number) {
    if (val <= 30) return "bg-teal-950";
    if (val <= 60) return "bg-teal-700";
    if (val <= 80) return "bg-teal-500";
    return "bg-teal-300 text-black";
  }

  return (
    <div className="space-y-8 p-4" data-ocid="operations-tab">
      {/* Section 1 — Live Sales Volume */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-teal-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Live Sales Volume
          </h2>
          <span className="live-pulse ml-2 h-2 w-2 rounded-full bg-teal-400 inline-block" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEMO_STANDS_OPS.map((stand) => {
            const sales = liveSales[stand.id] ?? stand.baseSales;
            const barPct = Math.round((sales / maxSales) * 100);
            const dotColor =
              stand.status === "slammed"
                ? "bg-red-500"
                : stand.status === "busy"
                  ? "bg-amber-400"
                  : "bg-green-400";
            return (
              <div
                key={stand.id}
                className="data-metric-card rounded-xl p-3 space-y-2"
                data-ocid={`operations-stand-card.${stand.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground truncate pr-1">
                    {stand.name}
                  </span>
                  <span
                    className={`live-pulse h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`}
                  />
                </div>
                <div className="text-xl font-bold text-teal-400">
                  ${sales.toLocaleString()}
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2 — Peak Times Heatmap */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-teal-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Peak Times by Game Phase
          </h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">
                  Stand
                </th>
                {GAME_PHASES.map((phase) => (
                  <th
                    key={phase}
                    className="px-2 py-2 font-medium text-muted-foreground text-center"
                  >
                    {phase}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_STANDS_OPS.map((stand, rowIdx) => (
                <tr
                  key={stand.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-3 py-2 text-foreground font-medium truncate max-w-[128px]">
                    {stand.name}
                  </td>
                  {PEAK_TIMES_DATA[rowIdx].map((intensity, colIdx) => (
                    <td
                      key={`${stand.id}-${colIdx}`}
                      className={`px-2 py-2 text-center font-semibold ${intensityClass(intensity)}`}
                      title={`${intensity}% intensity`}
                    >
                      {intensity}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 — Product Demand */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-teal-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Product Demand
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {DEMO_STANDS_OPS.map((stand) => (
            <button
              key={stand.id}
              type="button"
              onClick={() => setSelectedStand(stand.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedStand === stand.id
                  ? "bg-teal-500 text-black"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-ocid={`operations-demand-tab.${stand.id}`}
            >
              {stand.name}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {(PRODUCT_DEMAND[selectedStand] ?? []).map((item) => (
            <div key={item.item} className="data-metric-card rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {item.item}
                </span>
                <Badge
                  variant="outline"
                  className="text-teal-400 border-teal-600 text-xs"
                >
                  {item.orders} orders
                </Badge>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Staffing Alerts */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Staffing Alerts
          </h2>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div
              className="data-metric-card rounded-xl p-4 text-center text-muted-foreground text-sm"
              data-ocid="operations-alerts-empty"
            >
              No active alerts
            </div>
          )}
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={
                alert.severity === "high"
                  ? "staffing-alert rounded-xl p-4"
                  : "rounded-xl p-4 border border-green-600/40 bg-green-950/20"
              }
              data-ocid={`operations-alert.${alert.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">
                      {alert.stand}
                    </span>
                    {alert.severity === "high" ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                        High Demand
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Normalized
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
                {alert.severity === "high" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                    }
                    data-ocid={`operations-alert-dismiss.${alert.id}`}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Analytics Tab ───────────────────────────────────────────────────────────
const ANALYTICS_GAMES = [
  {
    game: "vs. Ravens",
    date: "Sep 8",
    tipVolume: 4820,
    foodOrders: 6340,
    fanPoints: 1245,
    phase: "regular",
  },
  {
    game: "vs. Titans",
    date: "Sep 22",
    tipVolume: 3950,
    foodOrders: 5180,
    fanPoints: 987,
    phase: "regular",
  },
  {
    game: "vs. Patriots",
    date: "Oct 6",
    tipVolume: 5610,
    foodOrders: 7420,
    fanPoints: 1532,
    phase: "regular",
  },
  {
    game: "vs. Bills",
    date: "Oct 20",
    tipVolume: 6240,
    foodOrders: 8890,
    fanPoints: 1876,
    phase: "playoff",
  },
  {
    game: "vs. Dolphins",
    date: "Nov 3",
    tipVolume: 5030,
    foodOrders: 6700,
    fanPoints: 1394,
    phase: "regular",
  },
];

const ANALYTICS_STANDS = [
  {
    name: "Club Level Grill",
    tips: 9420,
    food: 14200,
    points: 2841,
    trend: "up" as const,
  },
  {
    name: "Suite Level Bar",
    tips: 7650,
    food: 9800,
    points: 2345,
    trend: "up" as const,
  },
  {
    name: "End Zone Bites",
    tips: 4310,
    food: 7100,
    points: 1098,
    trend: "down" as const,
  },
  {
    name: "General Concessions",
    tips: 3280,
    food: 11500,
    points: 876,
    trend: "up" as const,
  },
  {
    name: "Colts Pro Shop",
    tips: 1640,
    food: 4200,
    points: 654,
    trend: "down" as const,
  },
  {
    name: "Stadium Parking",
    tips: 820,
    food: 0,
    points: 198,
    trend: "up" as const,
  },
];

const VENUE_BENCHMARKS = [
  {
    venue: "Lucas Oil Stadium",
    avgTipsPerFan: 4.2,
    avgOrderValue: 22.5,
    pointsPerGame: 1407,
  },
  {
    venue: "Generic Stadium A",
    avgTipsPerFan: 2.1,
    avgOrderValue: 18.0,
    pointsPerGame: 720,
  },
  {
    venue: "Generic Stadium B",
    avgTipsPerFan: 1.85,
    avgOrderValue: 15.5,
    pointsPerGame: 540,
  },
];

type MetricKey = "tipVolume" | "foodOrders" | "fanPoints";
type SeasonFilter = "all" | "regular" | "playoff";

function AnalyticsTab() {
  const [seasonFilter, setSeasonFilter] = useStateAlias<SeasonFilter>("all");
  const [standFilter, setStandFilter] = useStateAlias<string>("all");
  const [metric, setMetric] = useStateAlias<MetricKey>("tipVolume");
  const [sortCol, setSortCol] =
    useStateAlias<keyof (typeof ANALYTICS_STANDS)[0]>("tips");
  const [sortAsc, setSortAsc] = useStateAlias(false);

  const filteredGames = useMemo(
    () =>
      ANALYTICS_GAMES.filter(
        (g) => seasonFilter === "all" || g.phase === seasonFilter,
      ),
    [seasonFilter],
  );

  const metricLabel: Record<MetricKey, string> = {
    tipVolume: "Tip Volume ($)",
    foodOrders: "Food Orders ($)",
    fanPoints: "Fan Points",
  };
  const metricColor: Record<MetricKey, string> = {
    tipVolume: "bg-teal",
    foodOrders: "bg-yellow-400",
    fanPoints: "bg-purple-400",
  };
  const metricTextColor: Record<MetricKey, string> = {
    tipVolume: "text-teal",
    foodOrders: "text-yellow-400",
    fanPoints: "text-purple-400",
  };

  const maxVal = Math.max(...filteredGames.map((g) => g[metric]));

  const totalTips = ANALYTICS_GAMES.reduce((a, g) => a + g.tipVolume, 0);
  const avgTips = Math.round(totalTips / ANALYTICS_GAMES.length);
  const bestStand = ANALYTICS_STANDS.reduce(
    (best, s) => (s.tips > best.tips ? s : best),
    ANALYTICS_STANDS[0],
  );
  const totalPoints = ANALYTICS_GAMES.reduce((a, g) => a + g.fanPoints, 0);

  const sortedStands = useMemo(() => {
    return [...ANALYTICS_STANDS].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === "string" && typeof bv === "string")
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortAsc
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [sortCol, sortAsc]);

  const handleSort = (col: keyof (typeof ANALYTICS_STANDS)[0]) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else {
      setSortCol(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6" data-ocid="analytics-tab">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
          <Activity className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Benchmark / Crossover Data
          </h3>
          <p className="text-sm text-muted-foreground">
            Compare fan spending across games, stands, and venues
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glassmorphism border border-white/10 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Season
          </span>
          <div className="flex gap-1">
            {(["all", "regular", "playoff"] as SeasonFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                data-ocid={`analytics-season-${s}`}
                onClick={() => setSeasonFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  seasonFilter === s
                    ? "bg-teal text-background"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {s === "all"
                  ? "All Games"
                  : s === "regular"
                    ? "Regular Season"
                    : "Playoffs"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Metric
          </span>
          <div className="flex gap-1">
            {(Object.keys(metricLabel) as MetricKey[]).map((m) => (
              <button
                key={m}
                type="button"
                data-ocid={`analytics-metric-${m}`}
                onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
                  metric === m
                    ? `${m === "tipVolume" ? "bg-teal" : m === "foodOrders" ? "bg-yellow-400" : "bg-purple-400"} text-background`
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {metricLabel[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Stand
          </span>
          <select
            value={standFilter}
            onChange={(e) => setStandFilter(e.target.value)}
            data-ocid="analytics-stand-select"
            className="text-xs bg-muted/30 border border-white/10 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-teal/50"
          >
            <option value="all">All Stands</option>
            {ANALYTICS_STANDS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="glassmorphism border border-teal/20 rounded-xl p-4 neon-glow"
          data-ocid="analytics-total-tips-card"
        >
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Total Tip Volume
          </p>
          <p className="text-2xl font-bold text-teal mt-1">
            ${totalTips.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            All {ANALYTICS_GAMES.length} games
          </p>
        </div>
        <div
          className="glassmorphism border border-yellow-400/20 rounded-xl p-4"
          data-ocid="analytics-avg-tips-card"
        >
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Avg Tips / Game
          </p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            ${avgTips.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Per game average
          </p>
        </div>
        <div
          className="glassmorphism border border-teal/20 rounded-xl p-4"
          data-ocid="analytics-best-stand-card"
        >
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Best Stand
          </p>
          <p className="text-base font-bold text-teal mt-1 truncate">
            {bestStand.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            ${bestStand.tips.toLocaleString()} total tips
          </p>
        </div>
        <div
          className="glassmorphism border border-purple-400/20 rounded-xl p-4"
          data-ocid="analytics-total-points-card"
        >
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Total Fan Points
          </p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Points earned
          </p>
        </div>
      </div>

      {/* Game Comparison Chart */}
      <div
        className="glassmorphism border border-white/10 rounded-xl p-5 space-y-4"
        data-ocid="analytics-game-chart"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Game Comparison
          </p>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              metric === "tipVolume"
                ? "text-teal border-teal/30 bg-teal/10"
                : metric === "foodOrders"
                  ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10"
                  : "text-purple-400 border-purple-400/30 bg-purple-400/10"
            }`}
          >
            {metricLabel[metric]}
          </span>
        </div>
        {filteredGames.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No games match this filter.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredGames.map((g, i) => {
              const pct = maxVal > 0 ? (g[metric] / maxVal) * 100 : 0;
              const fmtVal =
                metric === "fanPoints"
                  ? g[metric].toLocaleString()
                  : `${g[metric].toLocaleString()}`;
              return (
                <div
                  key={g.game}
                  className="space-y-1"
                  data-ocid={`analytics-game-bar.${i + 1}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {g.game}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {g.date}
                      </span>
                      {g.phase === "playoff" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 shrink-0">
                          PLAYOFF
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ml-2 ${metricTextColor[metric]}`}
                    >
                      {fmtVal}
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${metricColor[metric]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-Stand Breakdown Table */}
      <div
        className="glassmorphism border border-white/10 rounded-xl p-5 space-y-3"
        data-ocid="analytics-stands-table"
      >
        <p className="text-sm font-semibold text-foreground">
          Per-Stand Breakdown
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {(
                  [
                    ["name", "Stand"],
                    ["tips", "Tips ($)"],
                    ["food", "Food Orders ($)"],
                    ["points", "Fan Points"],
                    ["trend", "Trend"],
                  ] as [keyof (typeof ANALYTICS_STANDS)[0], string][]
                ).map(([col, label]) => (
                  <th
                    key={col}
                    className="text-left py-2 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide select-none"
                    data-ocid={`analytics-sort-${col}`}
                  >
                    <button
                      type="button"
                      className="cursor-pointer hover:text-teal transition-colors bg-transparent border-none p-0 font-semibold text-[11px] uppercase tracking-wide text-muted-foreground hover:text-teal"
                      onClick={() => handleSort(col)}
                    >
                      {label}
                      {sortCol === col ? (sortAsc ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedStands.map((stand, i) => (
                <tr
                  key={stand.name}
                  className="hover:bg-white/5 transition-colors"
                  data-ocid={`analytics-stand-row.${i + 1}`}
                >
                  <td className="py-2.5 px-2 font-semibold text-foreground">
                    {stand.name}
                  </td>
                  <td className="py-2.5 px-2 text-teal font-mono">
                    ${stand.tips.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-yellow-400 font-mono">
                    ${stand.food.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-purple-400 font-mono">
                    {stand.points.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        stand.trend === "up"
                          ? "text-green-400 border-green-400/30 bg-green-400/10"
                          : "text-red-400 border-red-400/30 bg-red-400/10"
                      }`}
                    >
                      {stand.trend === "up" ? "↑" : "↓"}{" "}
                      {stand.trend === "up" ? "Up" : "Down"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Venue Benchmarks */}
      <div
        className="glassmorphism border border-teal/20 rounded-xl p-5 space-y-4"
        data-ocid="analytics-venue-benchmarks"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-teal" />
          <p className="text-sm font-semibold text-foreground">
            Venue Benchmarks
          </p>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/10 border border-teal/30 text-teal">
            Expansion Ready
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Compare Lucas Oil Stadium performance against expansion venues as the
          platform scales.
        </p>
        <div className="space-y-3">
          {VENUE_BENCHMARKS.map((v, i) => (
            <div
              key={v.venue}
              className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3 ${
                v.venue === "Lucas Oil Stadium"
                  ? "border-teal/30 bg-teal/5"
                  : "border-white/10 bg-white/2"
              }`}
              data-ocid={`analytics-venue.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold truncate ${
                    v.venue === "Lucas Oil Stadium"
                      ? "text-teal"
                      : "text-foreground/60"
                  }`}
                >
                  {v.venue === "Lucas Oil Stadium" && (
                    <span className="text-[10px] font-bold mr-1.5 px-1.5 py-0.5 rounded bg-teal/20 border border-teal/40 text-teal align-middle">
                      LIVE
                    </span>
                  )}
                  {v.venue}
                </p>
              </div>
              <div className="flex gap-4 text-xs">
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    Avg Tip/Fan
                  </p>
                  <p
                    className={`font-bold mt-0.5 ${v.venue === "Lucas Oil Stadium" ? "text-teal" : "text-foreground/50"}`}
                  >
                    ${v.avgTipsPerFan.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    Avg Order
                  </p>
                  <p
                    className={`font-bold mt-0.5 ${v.venue === "Lucas Oil Stadium" ? "text-yellow-400" : "text-foreground/50"}`}
                  >
                    ${v.avgOrderValue.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                    Pts/Game
                  </p>
                  <p
                    className={`font-bold mt-0.5 ${v.venue === "Lucas Oil Stadium" ? "text-purple-400" : "text-foreground/50"}`}
                  >
                    {v.pointsPerGame.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Admin Stats Summary ───────────────────────────────────────────────────────
function AdminStatsSummary() {
  const { data: allApps = [] } = useGetAllBusinessApplications();
  const { data: fraudAlerts = [] } = useGetFraudAlerts();
  const { data: tipsSent = [] } = useGetTipsSent();

  const pendingCount = allApps.filter(
    ([, app]) => app.status === "pending",
  ).length;
  const unresolvedFraud = fraudAlerts.filter((a) => !a.resolved).length;

  const stats = [
    {
      label: "Pending Apps",
      value: pendingCount,
      icon: <FileText className="h-4 w-4" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Fraud Alerts",
      value: unresolvedFraud,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
    {
      label: "Tips Sent",
      value: tipsSent.length,
      icon: <Zap className="h-4 w-4" />,
      color: "text-teal",
      bg: "bg-teal/10 border-teal/20",
    },
    {
      label: "Total Apps",
      value: allApps.length,
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div
      className="grid grid-cols-4 gap-2 max-w-4xl mx-auto"
      data-ocid="admin-stats-row"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={`glassmorphism rounded-xl p-2.5 border ${s.bg} flex flex-col items-center text-center`}
        >
          <span className={s.color}>{s.icon}</span>
          <p className={`text-lg font-bold ${s.color} mt-1 leading-none`}>
            {s.value}
          </p>
          <p className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Stands & Merchants Tab ────────────────────────────────────────────────────
function StandsMerchantsTab() {
  const [items, setItems] = React.useState<UnifiedStandMerchant[]>(() => {
    return DEMO_UNIFIED_STANDS_MERCHANTS;
  });
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editItem, setEditItem] = React.useState<UnifiedStandMerchant | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [newItem, setNewItem] = React.useState({
    name: "",
    section: "",
    category: "Food" as MerchantCategory,
    multiplier: 1.0,
  });
  const [calcAmount, setCalcAmount] = React.useState("10");
  const [calcItemId, setCalcItemId] = React.useState("");

  React.useEffect(() => {
    const activeIds = items.filter((i) => i.isActive).map((i) => i.id);
    localStorage.setItem("demo_active_stands", JSON.stringify(activeIds));
  }, [items]);

  const toggleActive = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)),
    );
  };

  const handleAdd = () => {
    if (!newItem.name.trim()) return;
    const added: UnifiedStandMerchant = {
      id: `usm-${Date.now()}`,
      name: newItem.name,
      section: newItem.section,
      category: newItem.category,
      multiplier: newItem.multiplier,
      isActive: true,
    };
    setItems((prev) => [...prev, added]);
    setNewItem({ name: "", section: "", category: "Food", multiplier: 1.0 });
    setShowAddForm(false);
  };

  const handleEdit = () => {
    if (!editItem) return;
    setItems((prev) => prev.map((i) => (i.id === editItem.id ? editItem : i)));
    setEditItem(null);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteConfirm(null);
  };

  const calcItem = items.find((i) => i.id === calcItemId);
  const calcResult =
    calcItem && calcAmount
      ? (Number.parseFloat(calcAmount) * calcItem.multiplier * 1.25).toFixed(4)
      : null;

  const categoryColors: Record<string, string> = {
    Food: "bg-orange-500/20 text-orange-300",
    Drinks: "bg-blue-500/20 text-blue-300",
    Merchandise: "bg-purple-500/20 text-purple-300",
    Parking: "bg-gray-500/20 text-gray-300",
    Snacks: "bg-yellow-500/20 text-yellow-300",
    Valet: "bg-cyan-500/20 text-cyan-300",
    Ticketing: "bg-indigo-500/20 text-indigo-300",
    Entertainment: "bg-pink-500/20 text-pink-300",
    Services: "bg-slate-500/20 text-slate-300",
    ProShop: "bg-teal-500/20 text-teal-300",
    ParkingUpgrade: "bg-emerald-500/20 text-emerald-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Stands & Merchants</h3>
          <p className="text-sm text-white/60">
            Manage all stadium vendors and services. Fans earn points when their
            linked card is used at any active location.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-lg text-teal-300 hover:bg-teal-500/30 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Stand / Merchant
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          <h4 className="text-white font-semibold">New Stand / Merchant</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="usm-add-name"
                className="text-xs text-white/60 mb-1 block"
              >
                Name
              </label>
              <input
                id="usm-add-name"
                type="text"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Club Level Grill"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label
                htmlFor="usm-add-section"
                className="text-xs text-white/60 mb-1 block"
              >
                Section / Location
              </label>
              <input
                id="usm-add-section"
                type="text"
                value={newItem.section}
                onChange={(e) =>
                  setNewItem((p) => ({ ...p, section: e.target.value }))
                }
                placeholder="e.g. Club Level"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label
                htmlFor="usm-add-category"
                className="text-xs text-white/60 mb-1 block"
              >
                Category
              </label>
              <select
                id="usm-add-category"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((p) => ({
                    ...p,
                    category: e.target.value as MerchantCategory,
                  }))
                }
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
              >
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Merchandise">Merchandise</option>
                <option value="Parking">Parking</option>
                <option value="Snacks">Snacks</option>
                <option value="Valet">Valet</option>
                <option value="Ticketing">Ticketing</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Services">Services</option>
                <option value="ProShop">Pro Shop</option>
                <option value="ParkingUpgrade">Parking Upgrade</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="usm-add-mult"
                className="text-xs text-white/60 mb-1 block"
              >
                Fan Points Multiplier
              </label>
              <input
                id="usm-add-mult"
                type="number"
                value={newItem.multiplier}
                onChange={(e) =>
                  setNewItem((p) => ({
                    ...p,
                    multiplier: Number.parseFloat(e.target.value) || 1,
                  }))
                }
                step="0.25"
                min="0.25"
                max="5"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 bg-teal-500 rounded-lg text-white text-sm font-medium hover:bg-teal-400 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-white/10 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">{item.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[item.category] || "bg-white/10 text-white/60"}`}
                >
                  {item.category}
                </span>
                {item.section && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                    {item.section}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-teal-400 font-mono font-bold">
                  {item.multiplier}x pts
                </span>
                <span
                  className={`text-xs ${item.isActive ? "text-green-400" : "text-white/40"}`}
                >
                  {item.isActive
                    ? "Active — visible in ordering & Fan Points"
                    : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleActive(item.id)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.isActive ? "bg-teal-500" : "bg-white/20"}`}
                title={item.isActive ? "Deactivate" : "Activate"}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${item.isActive ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
              <button
                type="button"
                onClick={() => setEditItem({ ...item })}
                className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(item.id)}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-teal-500/20 rounded-xl p-5 space-y-4">
        <h4 className="text-white font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-teal-400" />
          Fan Points Calculator
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="usm-calc-amount"
              className="text-xs text-white/60 mb-1 block"
            >
              Purchase Amount ($)
            </label>
            <input
              id="usm-calc-amount"
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              placeholder="10.00"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label
              htmlFor="usm-calc-merchant"
              className="text-xs text-white/60 mb-1 block"
            >
              Stand / Merchant
            </label>
            <select
              id="usm-calc-merchant"
              value={calcItemId}
              onChange={(e) => setCalcItemId(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
            >
              <option value="">Select a stand...</option>
              {items
                .filter((i) => i.isActive)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.multiplier}x)
                  </option>
                ))}
            </select>
          </div>
        </div>
        {calcResult && calcItem && (
          <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Points earned</p>
            <p className="text-teal-300 font-mono text-lg font-bold">
              {calcResult} pts
            </p>
            <p className="text-xs text-white/50 mt-1">
              ${calcAmount} × {calcItem.multiplier}x ({calcItem.name}) × 1.25x
              game day = {calcResult} pts
            </p>
          </div>
        )}
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h4 className="text-white font-bold text-lg">
              Edit Stand / Merchant
            </h4>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="usm-edit-name"
                  className="text-xs text-white/60 mb-1 block"
                >
                  Name
                </label>
                <input
                  id="usm-edit-name"
                  type="text"
                  value={editItem.name}
                  onChange={(e) =>
                    setEditItem((p) =>
                      p ? { ...p, name: e.target.value } : null,
                    )
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label
                  htmlFor="usm-edit-section"
                  className="text-xs text-white/60 mb-1 block"
                >
                  Section / Location
                </label>
                <input
                  id="usm-edit-section"
                  type="text"
                  value={editItem.section}
                  onChange={(e) =>
                    setEditItem((p) =>
                      p ? { ...p, section: e.target.value } : null,
                    )
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
                />
              </div>
              <div>
                <label
                  htmlFor="usm-edit-category"
                  className="text-xs text-white/60 mb-1 block"
                >
                  Category
                </label>
                <select
                  id="usm-edit-category"
                  value={editItem.category}
                  onChange={(e) =>
                    setEditItem((p) =>
                      p
                        ? { ...p, category: e.target.value as MerchantCategory }
                        : null,
                    )
                  }
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
                >
                  <option value="Food">Food</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Merchandise">Merchandise</option>
                  <option value="Parking">Parking</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="usm-edit-mult"
                  className="text-xs text-white/60 mb-1 block"
                >
                  Fan Points Multiplier
                </label>
                <input
                  id="usm-edit-mult"
                  type="number"
                  value={editItem.multiplier}
                  onChange={(e) =>
                    setEditItem((p) =>
                      p
                        ? {
                            ...p,
                            multiplier: Number.parseFloat(e.target.value) || 1,
                          }
                        : null,
                    )
                  }
                  step="0.25"
                  min="0.25"
                  max="5"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 py-2 bg-teal-500 rounded-lg text-white text-sm font-medium hover:bg-teal-400 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="flex-1 py-2 bg-white/10 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h4 className="text-white font-bold">Remove this stand?</h4>
            <p className="text-sm text-white/60">
              It will be removed from food ordering, the badge generator, and
              Fan Points calculations.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-500 rounded-lg text-white text-sm font-medium hover:bg-red-400 transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-white/10 rounded-lg text-white/70 text-sm hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── POS Integration Tab ─────────────────────────────────────────────────────
const POS_SYSTEMS = ["Toast", "Square", "SkyTab"] as const;
type PosSystem = (typeof POS_SYSTEMS)[number];

const DEMO_STANDS_FOR_POS = [
  { id: "stand-1", name: "Lucas Oil Grill" },
  { id: "stand-2", name: "Club Level Bar" },
  { id: "stand-3", name: "End Zone Bites" },
  { id: "stand-4", name: "Colts Fan Eats" },
];

const DEMO_EMPLOYEE_REFS = [
  "Staff #1",
  "Staff #2",
  "Staff #3",
  "Staff #4",
  "Staff #5",
];

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

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateTicket(): PosTicket {
  const stand =
    DEMO_STANDS_FOR_POS[Math.floor(Math.random() * DEMO_STANDS_FOR_POS.length)];
  const saleTotal = randomBetween(8, 85);
  const tipAmount = randomBetween(2, 15);
  const category = Math.random() > 0.45 ? "food" : "alcohol";
  const employeeRef =
    DEMO_EMPLOYEE_REFS[Math.floor(Math.random() * DEMO_EMPLOYEE_REFS.length)];
  return {
    id: `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    standName: stand.name,
    standId: stand.id,
    saleTotal,
    tipAmount,
    category,
    employeeRef,
  };
}

const SEED_TICKETS: PosTicket[] = [
  {
    id: "seed-1",
    timestamp: "7:22 PM",
    standName: "Lucas Oil Grill",
    standId: "stand-1",
    saleTotal: 42.5,
    tipAmount: 8.0,
    category: "food",
    employeeRef: "Staff #2",
  },
  {
    id: "seed-2",
    timestamp: "7:31 PM",
    standName: "Club Level Bar",
    standId: "stand-2",
    saleTotal: 68.0,
    tipAmount: 12.0,
    category: "alcohol",
    employeeRef: "Staff #1",
  },
  {
    id: "seed-3",
    timestamp: "7:45 PM",
    standName: "End Zone Bites",
    standId: "stand-3",
    saleTotal: 21.75,
    tipAmount: 4.0,
    category: "food",
    employeeRef: "Staff #3",
  },
  {
    id: "seed-4",
    timestamp: "7:58 PM",
    standName: "Colts Fan Eats",
    standId: "stand-4",
    saleTotal: 35.0,
    tipAmount: 6.5,
    category: "food",
    employeeRef: "Staff #4",
  },
  {
    id: "seed-5",
    timestamp: "8:12 PM",
    standName: "Club Level Bar",
    standId: "stand-2",
    saleTotal: 85.0,
    tipAmount: 15.0,
    category: "alcohol",
    employeeRef: "Staff #1",
  },
];

function PosIntegrationTab() {
  const LS_CONFIG = "pos_integration_config";
  const LS_POOLS = "pos_stand_tip_pools";

  const [selectedPOS, setSelectedPOS] = React.useState<PosSystem>(() => {
    try {
      const saved = localStorage.getItem(LS_CONFIG);
      if (saved)
        return (
          (JSON.parse(saved) as { selectedPOS: PosSystem }).selectedPOS ??
          "Toast"
        );
    } catch {
      /* ignore */
    }
    return "Toast";
  });
  const [apiKey, setApiKey] = React.useState(() => {
    try {
      const saved = localStorage.getItem(LS_CONFIG);
      if (saved) return (JSON.parse(saved) as { apiKey: string }).apiKey ?? "";
    } catch {
      /* ignore */
    }
    return "";
  });
  const [demoModeActive, setDemoModeActive] = React.useState(() => {
    try {
      const saved = localStorage.getItem(LS_CONFIG);
      if (saved)
        return (
          (JSON.parse(saved) as { demoModeActive: boolean }).demoModeActive ??
          true
        );
    } catch {
      /* ignore */
    }
    return true;
  });
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [tickets, setTickets] = React.useState<PosTicket[]>(() =>
    demoModeActive ? SEED_TICKETS : [],
  );

  // Persist config
  React.useEffect(() => {
    localStorage.setItem(
      LS_CONFIG,
      JSON.stringify({ selectedPOS, apiKey, demoModeActive }),
    );
  }, [selectedPOS, apiKey, demoModeActive]);

  // Update POS pools and full ticket list in localStorage when tickets change
  React.useEffect(() => {
    if (!demoModeActive) return;
    const pools: Record<string, number> = {};
    for (const t of tickets) {
      pools[t.standId] = (pools[t.standId] ?? 0) + t.tipAmount;
    }
    localStorage.setItem(LS_POOLS, JSON.stringify(pools));
    localStorage.setItem("pos_stand_tickets", JSON.stringify(tickets));
  }, [tickets, demoModeActive]);

  // Auto-generate tickets in demo mode
  React.useEffect(() => {
    if (!demoModeActive) return;
    const interval = setInterval(() => {
      setTickets((prev) => {
        const newTicket = generateTicket();
        return [newTicket, ...prev].slice(0, 10);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [demoModeActive]);

  const handleDemoToggle = (on: boolean) => {
    setDemoModeActive(on);
    if (on) {
      setTickets(SEED_TICKETS);
    } else {
      setTickets([]);
      localStorage.removeItem(LS_POOLS);
    }
  };

  const connectionStatus = demoModeActive
    ? "demo"
    : apiKey.trim()
      ? "connected"
      : "disconnected";

  return (
    <div className="space-y-6" data-ocid="pos-integration-tab">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
          <Wifi className="h-5 w-5 text-teal" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">POS Integration</h3>
          <p className="text-sm text-muted-foreground">
            Connect your point-of-sale system to auto-fill tip pools
          </p>
        </div>
      </div>

      {/* Demo Mode Toggle */}
      <div className="glassmorphism border border-teal/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Demo Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulate live POS tickets without real credentials
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={demoModeActive}
            onClick={() => handleDemoToggle(!demoModeActive)}
            data-ocid="pos-demo-mode-toggle"
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
              demoModeActive ? "bg-teal" : "bg-muted/50 border border-border"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-background shadow-md transition-transform duration-200 ${
                demoModeActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {demoModeActive && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-teal/10 border border-teal/30 rounded-lg">
            <div className="h-2 w-2 rounded-full bg-teal animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-teal">
              Demo Mode Active — simulated POS tickets are flowing
            </p>
          </div>
        )}
      </div>

      {/* POS Config */}
      <div className="glassmorphism border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            POS System Settings
          </p>
          {/* Connection Status Badge */}
          {connectionStatus === "demo" && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal/15 border border-teal/30 text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              Demo Mode Active
            </span>
          )}
          {connectionStatus === "connected" && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Connected
            </span>
          )}
          {connectionStatus === "disconnected" && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
              <XCircle className="h-3.5 w-3.5" />
              Disconnected
            </span>
          )}
        </div>

        {/* POS Selector */}
        <div>
          <label
            htmlFor="pos-system-select"
            className="text-xs font-semibold text-muted-foreground mb-1.5 block"
          >
            POS System
          </label>
          <div className="relative">
            <select
              id="pos-system-select"
              value={selectedPOS}
              onChange={(e) => setSelectedPOS(e.target.value as PosSystem)}
              data-ocid="pos-system-select"
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground appearance-none pr-8 focus:outline-none focus:border-teal/50"
            >
              {POS_SYSTEMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Server className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* API Key — hidden in demo mode */}
        {!demoModeActive && (
          <div>
            <label
              htmlFor="pos-api-key"
              className="text-xs font-semibold text-muted-foreground mb-1.5 block"
            >
              API Key
            </label>
            <div className="relative">
              <Input
                id="pos-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your POS API key"
                data-ocid="pos-api-key-input"
                className="bg-muted/30 border-border text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey((v) => !v)}
                data-ocid="pos-api-key-toggle"
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            disabled={demoModeActive}
            onClick={() => {
              if (demoModeActive) return;
              toast.info(
                `Testing connection to ${selectedPOS}… (placeholder — enter live credentials to connect)`,
              );
            }}
            data-ocid="pos-test-connection-btn"
            className="flex-1 bg-muted/30 border border-border text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </Button>
          <Button
            type="button"
            onClick={() => {
              localStorage.setItem(
                LS_CONFIG,
                JSON.stringify({ selectedPOS, apiKey, demoModeActive }),
              );
              toast.success("POS settings saved");
            }}
            data-ocid="pos-save-settings-btn"
            className="flex-1 bg-teal/20 border border-teal/40 text-teal hover:bg-teal/30 font-semibold"
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Live Feed — demo mode only */}
      {demoModeActive && (
        <div
          className="glassmorphism border border-white/10 rounded-xl p-5 space-y-4"
          data-ocid="pos-live-feed"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
              <p className="text-sm font-semibold text-foreground">
                POS Live Feed
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              {tickets.length} / 10 tickets
            </span>
          </div>

          <div
            className="space-y-2 max-h-[420px] overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {tickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                data-ocid={`pos-ticket.${idx + 1}`}
                className="flex items-start gap-3 bg-muted/10 border border-border/50 rounded-lg p-3 text-xs animate-in fade-in duration-300"
              >
                <div className="shrink-0 mt-0.5">
                  <div
                    className={`h-2 w-2 rounded-full mt-1 ${
                      ticket.category === "alcohol" ? "bg-amber-400" : "bg-teal"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {ticket.standName}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {ticket.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    <span>
                      Sale:{" "}
                      <span className="text-foreground font-medium">
                        ${ticket.saleTotal.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Tip:{" "}
                      <span className="text-teal font-bold">
                        ${ticket.tipAmount.toFixed(2)}
                      </span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-semibold ${
                        ticket.category === "alcohol"
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-teal/15 text-teal"
                      }`}
                    >
                      {ticket.category}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground/70">
                      {ticket.employeeRef}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stand Tip Pool Totals */}
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Accumulated Tip Pools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_STANDS_FOR_POS.map((stand) => {
                const total = tickets
                  .filter((t) => t.standId === stand.id)
                  .reduce((sum, t) => sum + t.tipAmount, 0);
                return (
                  <div
                    key={stand.id}
                    className="flex items-center justify-between bg-muted/10 border border-border/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground truncate mr-2">
                      {stand.name}
                    </span>
                    <span className="text-sm font-bold text-teal shrink-0">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [activeTab, setActiveTab] = useState<AdminTab>("applications");

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-2 border-teal/40 border-t-teal animate-spin" />
          <p className="text-white/50 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glassmorphism rounded-2xl p-8 border border-red-500/20 text-center max-w-sm w-full">
          <ShieldOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Admin privileges required for this panel.
          </p>
          <Button
            onClick={onClose}
            className="w-full bg-muted/30 hover:bg-muted/50 border border-border text-foreground"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "applications",
      label: "Applications",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "fraud",
      label: "Fraud Alerts",
      icon: <ShieldAlert className="h-4 w-4" />,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: <Monitor className="h-4 w-4" />,
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: "roles",
      label: "User Roles",
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      id: "directdeposit",
      label: "Deposits",
      icon: <Building2 className="h-4 w-4" />,
    },
    {
      id: "support",
      label: "Support",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: "whitelabel",
      label: "White-Label",
      icon: <Palette className="h-4 w-4" />,
    },
    {
      id: "rewards",
      label: "Fan Points",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      id: "partnerships",
      label: "Partnerships",
      icon: <Handshake className="h-4 w-4" />,
    },
    {
      id: "foodmenus" as const,
      label: "Food Menus",
      icon: <UtensilsCrossed className="h-4 w-4" />,
    },
    {
      id: "stands-merchants" as const,
      label: "Stands & Merchants",
      icon: <Store className="h-4 w-4" />,
    },
    {
      id: "pos-integration" as const,
      label: "POS Integration",
      icon: <Wifi className="h-4 w-4" />,
    },
    {
      id: "analytics" as const,
      label: "Analytics",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      id: "operations" as const,
      label: "Operations",
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* ── Sticky Header ── */}
        <div className="frosted-glass border-b border-teal/20 px-4 pt-4 pb-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 max-w-4xl mx-auto mb-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border flex items-center justify-center transition-all duration-200"
              aria-label="Close Admin Panel"
              data-ocid="admin-close-btn"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal shrink-0" />
                Admin Panel
              </h1>
              <p className="text-xs text-muted-foreground/50">
                Platform management · Creator only
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center neon-glow">
              <ShieldCheck className="h-4 w-4 text-teal" />
            </div>
          </div>

          {/* Summary stats */}
          <AdminStatsSummary />

          {/* Tab bar */}
          <div
            className="flex gap-1 mt-4 overflow-x-auto"
            role="tablist"
            style={{ scrollbarWidth: "none" }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                data-ocid={`admin-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-teal border-teal bg-teal/10"
                    : "text-white/50 border-transparent hover:text-white/80 hover:bg-muted/30"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "fraud" && <FraudAlertsTab />}
          {activeTab === "sessions" && <SessionsTab />}
          {activeTab === "audit" && <AuditLogTab />}
          {activeTab === "settings" && <AdminSettingsTab />}
          {activeTab === "roles" && <UserRolesTab />}
          {activeTab === "directdeposit" && <DirectDepositAdminTab />}
          {activeTab === "support" && <SupportAdminTab />}
          {activeTab === "whitelabel" && <WhiteLabelSettings />}
          {activeTab === "rewards" && <RewardsTab />}
          {activeTab === "partnerships" && <PartnershipsTab />}
          {activeTab === "foodmenus" && <FoodMenusTab />}
          {activeTab === "stands-merchants" && <StandsMerchantsTab />}
          {activeTab === "pos-integration" && <PosIntegrationTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "operations" && <OperationsTab />}
        </main>
      </div>
    </div>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────
function ApplicationsTab() {
  const { data: allApps = [], isLoading } = useGetAllBusinessApplications();
  const approve = useApproveBusinessApplication();
  const reject = useRejectBusinessApplication();
  const [rejectingPrincipal, setRejectingPrincipal] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  const filtered =
    filter === "all"
      ? allApps
      : allApps.filter(([, app]) => app.status === filter);

  const handleApprove = async (principal: Principal) => {
    try {
      await approve.mutateAsync(principal);
      toast.success("Application approved!");
    } catch {
      toast.error("Failed to approve application");
    }
  };

  const handleReject = async (principal: Principal) => {
    try {
      await reject.mutateAsync({
        applicant: principal,
        reason: rejectionReason.trim() || undefined,
      });
      toast.success("Application rejected.");
      setRejectingPrincipal(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to reject application");
    }
  };

  if (isLoading) return <TabSkeleton rows={3} />;

  return (
    <div className="space-y-4" data-ocid="admin-applications-tab">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-ocid={`app-filter-${f}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              filter === f
                ? "bg-teal/20 text-teal border border-teal/40"
                : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
            }`}
          >
            <Filter className="h-3 w-3" />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground/20" />}
          title="No applications"
          description="Business applications will appear here when submitted."
        />
      )}

      {filtered.map(([principal, app]) => {
        const pid = principal.toString();
        const isRejecting = rejectingPrincipal === pid;

        return (
          <div
            key={pid}
            className="glassmorphism rounded-xl p-5 border border-border space-y-3"
            data-ocid={`app-card-${pid.slice(0, 8)}`}
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-teal/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground truncate">
                    {app.businessName}
                  </p>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {app.businessType}
                </p>
                <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                  {truncatePrincipal(principal)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/50 shrink-0">
                {new Date(tsToMs(app.createdAt)).toLocaleDateString()}
              </p>
            </div>

            {app.description && (
              <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/30 leading-relaxed">
                {app.description}
              </p>
            )}

            {/* Verification Info */}
            {(() => {
              const raw = localStorage.getItem("businessVerificationInfo");
              const info = raw
                ? (() => {
                    try {
                      return JSON.parse(raw) as {
                        ein?: string;
                        licenseNumber?: string;
                        businessName?: string;
                        submittedAt?: number;
                      };
                    } catch {
                      return null;
                    }
                  })()
                : null;
              return (
                <div className="bg-teal/5 border border-teal/20 rounded-lg px-3 py-2.5 space-y-1.5">
                  <p className="text-[10px] font-semibold text-teal/80 uppercase tracking-wider">
                    Verification Info
                  </p>
                  {info?.ein ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          EIN (Self-Reported by Applicant)
                        </span>
                        <span className="text-xs font-mono font-semibold text-teal">
                          {info.ein}
                        </span>
                      </div>
                      {info.licenseNumber && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            License Number
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">
                            {info.licenseNumber}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">
                      Verification info not available (applicant may need to
                      resubmit)
                    </p>
                  )}
                </div>
              );
            })()}

            {app.status === "rejected" && app.rejectionReason && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">{app.rejectionReason}</p>
              </div>
            )}

            {(app.status === "pending" || app.status === "rejected") && (
              <div className="space-y-2">
                {isRejecting ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reason for rejection (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 text-xs resize-none"
                      data-ocid="rejection-reason-input"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReject(principal)}
                        disabled={reject.isPending}
                        size="sm"
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-xs"
                        data-ocid={`confirm-reject-${pid.slice(0, 8)}`}
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setRejectingPrincipal(null);
                          setRejectionReason("");
                        }}
                        size="sm"
                        variant="outline"
                        className="border-border text-muted-foreground hover:bg-muted/50 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {app.status === "pending" && (
                      <Button
                        onClick={() => handleApprove(principal)}
                        disabled={approve.isPending}
                        size="sm"
                        className="flex-1 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold text-xs"
                        data-ocid={`approve-app-${pid.slice(0, 8)}`}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Approve
                      </Button>
                    )}
                    <Button
                      onClick={() => setRejectingPrincipal(pid)}
                      size="sm"
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs"
                      data-ocid={`reject-app-${pid.slice(0, 8)}`}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Fraud Alerts Tab ──────────────────────────────────────────────────────────
function FraudAlertsTab() {
  const { data: alerts = [], isLoading } = useGetFraudAlerts();

  if (isLoading) return <TabSkeleton rows={3} />;

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<ShieldCheck className="h-10 w-10 text-teal/40" />}
        title="No alerts — platform is clean"
        description="Fraud alerts will appear here if suspicious activity is detected."
        teal
      />
    );
  }

  const unresolved = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-5" data-ocid="admin-fraud-tab">
      {unresolved.length > 0 && (
        <section>
          <SectionHeading
            icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
            title="Unresolved Alerts"
            count={unresolved.length}
            countColor="text-red-400"
          />
          <div className="space-y-3 mt-3">
            {unresolved.map((alert) => (
              <FraudAlertCard
                key={`${alert.userId.toString()}-${alert.timestamp}`}
                alert={alert}
              />
            ))}
          </div>
        </section>
      )}
      {resolved.length > 0 && (
        <section>
          <SectionHeading
            icon={<CheckCircle className="h-4 w-4 text-green-400" />}
            title="Resolved"
            count={resolved.length}
            countColor="text-green-400"
          />
          <div className="space-y-3 mt-3">
            {resolved.map((alert) => (
              <FraudAlertCard
                key={`${alert.userId.toString()}-${alert.timestamp}`}
                alert={alert}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FraudAlertCard({
  alert,
}: {
  alert: {
    resolved: boolean;
    userId: Principal;
    timestamp: bigint;
    severity: string;
    reason: string;
  };
}) {
  const severityMap: Record<string, string> = {
    high: "text-red-400 bg-red-500/10 border-red-500/20",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  const severityColor =
    severityMap[alert.severity] ?? "text-white/60 bg-muted/30 border-border";

  return (
    <div
      className={`glassmorphism rounded-xl p-4 border ${
        alert.resolved ? "border-border opacity-60" : "border-red-500/20"
      }`}
      data-ocid={`fraud-alert-${alert.userId.toString().slice(0, 8)}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${severityColor}`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">
              {alert.reason}
            </p>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${severityColor}`}
            >
              {alert.severity}
            </span>
            {alert.resolved && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-green-500/10 border-green-500/20 text-green-400 font-semibold uppercase">
                Resolved
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/50 font-mono mt-1">
            {truncatePrincipal(alert.userId)}
          </p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            {formatTs(alert.timestamp)}
          </p>
        </div>
      </div>
      {!alert.resolved && (
        <Button
          size="sm"
          onClick={() =>
            toast.info("Mark Resolved coming in next backend update")
          }
          className="mt-3 w-full bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal/80 text-xs"
          data-ocid={`resolve-fraud-${alert.userId.toString().slice(0, 8)}`}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Mark Resolved
        </Button>
      )}
    </div>
  );
}

// ── Sessions Tab ──────────────────────────────────────────────────────────────
function SessionsTab() {
  const { data: sessions = [], isLoading } = useGetActiveSessions();

  if (isLoading) return <TabSkeleton rows={3} />;

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Monitor className="h-10 w-10 text-muted-foreground/20" />}
        title="No active sessions"
        description="Sessions will appear here as users authenticate."
      />
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-sessions-tab">
      <SectionHeading
        icon={<Monitor className="h-4 w-4 text-teal" />}
        title="Active Sessions"
        count={sessions.length}
      />
      {sessions.map((session) => (
        <div
          key={session.sessionId}
          className="glassmorphism rounded-xl p-4 border border-border"
          data-ocid={`session-card-${session.sessionId.slice(0, 8)}`}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
              {session.deviceName.toLowerCase().includes("mobile") ||
              session.deviceName.toLowerCase().includes("phone") ? (
                <Smartphone className="h-5 w-5 text-teal/70" />
              ) : (
                <Monitor className="h-5 w-5 text-teal/70" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {session.deviceName || "Unknown device"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.location || "Unknown location"}
              </p>
              <p className="text-xs text-muted-foreground/50 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Logged in {formatTs(session.loginTimestamp)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast.info("Session revoke coming soon")}
              className="shrink-0 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs h-8"
              data-ocid={`revoke-session-${session.sessionId.slice(0, 8)}`}
            >
              Revoke
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const { data: events = [], isLoading } = useGetEncryptionLog();
  const [timeFilter, setTimeFilter] = useState<AuditFilter>("all");

  const now = Date.now();
  const filtered = events.filter((e) => {
    const ms = tsToMs(e.timestamp);
    if (timeFilter === "today") return now - ms < 86_400_000;
    if (timeFilter === "week") return now - ms < 604_800_000;
    return true;
  });

  const eventIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("encrypt")) return <Lock className="h-4 w-4" />;
    if (t.includes("kyc")) return <ShieldCheck className="h-4 w-4" />;
    if (t.includes("withdraw")) return <Database className="h-4 w-4" />;
    if (t.includes("pin")) return <Terminal className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const filterLabels: Record<AuditFilter, string> = {
    today: "Today",
    week: "This Week",
    all: "All Time",
  };

  return (
    <div className="space-y-4" data-ocid="admin-audit-tab">
      <div className="flex gap-2">
        {(["today", "week", "all"] as AuditFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTimeFilter(f)}
            data-ocid={`audit-filter-${f}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              timeFilter === f
                ? "bg-teal/20 text-teal border border-teal/40"
                : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted/50"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {isLoading && <TabSkeleton rows={5} />}

      {!isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<Activity className="h-10 w-10 text-muted-foreground/20" />}
          title="No events in this range"
          description="Security events from the encryption log will appear here."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {[...filtered]
            .sort((a, b) => Number(b.timestamp - a.timestamp))
            .map((event) => (
              <div
                key={`${event.eventType}-${event.timestamp}`}
                className="glassmorphism rounded-xl px-4 py-3 border border-border flex items-start gap-3"
                data-ocid={`audit-event-${event.timestamp}`}
              >
                <div className="h-8 w-8 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0 text-teal/70">
                  {eventIcon(event.eventType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground/90">
                    {event.eventType}
                  </p>
                  <p className="text-xs text-teal/70 mt-0.5">
                    {event.dataType}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {formatTs(event.timestamp)}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 shrink-0 mt-1" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  "data-ocid": dataOcid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  "data-ocid"?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-ocid={dataOcid}
        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50 pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/70 transition-colors"
        aria-label={show ? "Hide value" : "Show value"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function CredentialBadge({
  configured,
  label,
}: { configured: boolean; label?: string }) {
  return configured ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-500/20 text-green-400 border border-green-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
      {label ?? "Connected"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Not Connected
    </span>
  );
}

function AdminSettingsTab() {
  const { data: compilationStatus, isLoading: statusLoading } =
    useGetCompilationStatus();
  const { data: stripeConfigured = false } = useIsStripeConfigured();
  const { data: smsStatus } = useGetSMSConfigurationStatus();
  const { data: kycStatus } = useGetKYCConfigurationStatus();

  const setStripe = useSetStripeConfiguration();
  const setSMS = useSetSMSConfiguration();
  const setKYC = useSetKYCConfiguration();

  // Stripe
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeCountries, setStripeCountries] = useState("US,CA,GB");

  // Twilio
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");

  // KYC
  const [kycApiKey, setKycApiKey] = useState("");
  const [kycProvider, setKycProvider] = useState<"persona" | "onfido">(
    "persona",
  );

  const handleSaveStripe = async () => {
    if (!stripeSecretKey.trim()) {
      toast.error("Stripe secret key is required");
      return;
    }
    try {
      const countryList = stripeCountries
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length === 2);
      await setStripe.mutateAsync({
        secretKey: stripeSecretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success("Stripe credentials saved");
      setStripeSecretKey("");
      setStripeCountries("US,CA,GB");
    } catch {
      toast.error("Failed to save Stripe credentials");
    }
  };

  const handleSaveSMS = async () => {
    if (!twilioSid.trim() || !twilioToken.trim() || !twilioPhone.trim()) {
      toast.error("All Twilio fields are required");
      return;
    }
    try {
      await setSMS.mutateAsync({
        accountSid: twilioSid.trim(),
        authToken: twilioToken.trim(),
        fromPhone: twilioPhone.trim(),
      });
      toast.success("Twilio credentials saved — SMS 2FA is now live");
      setTwilioSid("");
      setTwilioToken("");
      setTwilioPhone("");
    } catch {
      toast.error("Failed to save Twilio credentials");
    }
  };

  const handleSaveKYC = async () => {
    if (!kycApiKey.trim()) {
      toast.error("KYC API key is required");
      return;
    }
    try {
      await setKYC.mutateAsync({
        apiKey: kycApiKey.trim(),
        provider: kycProvider,
      });
      toast.success(`KYC credentials saved — ${kycProvider} is now active`);
      setKycApiKey("");
    } catch {
      toast.error("Failed to save KYC credentials");
    }
  };

  return (
    <div className="space-y-8" data-ocid="admin-settings-tab">
      {/* ── Credentials Section ── */}
      <section>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
          Integration Credentials
        </p>

        {/* Card 1: Stripe */}
        <div className="space-y-4">
          <div
            className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4"
            data-ocid="stripe-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Stripe — Fiat Payments
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    Required to activate card payments, bank linking, and
                    withdrawals.
                  </p>
                </div>
              </div>
              <CredentialBadge configured={stripeConfigured} />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="stripe-secret-key"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Secret Key
                </label>
                <PasswordInput
                  id="stripe-secret-key"
                  value={stripeSecretKey}
                  onChange={setStripeSecretKey}
                  placeholder="sk_live_xxxxxxxxxxxxxxxx"
                  data-ocid="stripe-secret-key"
                />
              </div>
              <div>
                <label
                  htmlFor="stripe-countries"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Allowed Countries{" "}
                  <span className="text-white/30">
                    (comma-separated, e.g. US,CA,GB)
                  </span>
                </label>
                <input
                  id="stripe-countries"
                  type="text"
                  value={stripeCountries}
                  onChange={(e) => setStripeCountries(e.target.value)}
                  placeholder="US,CA,GB"
                  data-ocid="stripe-allowed-countries"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveStripe}
              disabled={setStripe.isPending}
              data-ocid="save-stripe-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setStripe.isPending ? "Saving…" : "Save Stripe Credentials"}
            </button>
          </div>

          {/* Card 2: Twilio */}
          <div
            className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4"
            data-ocid="twilio-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Twilio — SMS 2FA
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    Required to send real one-time codes during withdrawals.
                  </p>
                </div>
              </div>
              <CredentialBadge
                configured={smsStatus?.configured ?? false}
                label={
                  smsStatus?.configured && smsStatus.fromPhone
                    ? `Connected · ${smsStatus.fromPhone}`
                    : undefined
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="twilio-sid"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Account SID
                </label>
                <input
                  id="twilio-sid"
                  type="text"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  data-ocid="twilio-account-sid"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-auth-token"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Auth Token
                </label>
                <PasswordInput
                  id="twilio-auth-token"
                  value={twilioToken}
                  onChange={setTwilioToken}
                  placeholder="••••••••••••••••••••••••••••••••"
                  data-ocid="twilio-auth-token"
                />
              </div>
              <div>
                <label
                  htmlFor="twilio-from-phone"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  From Phone Number
                </label>
                <input
                  id="twilio-from-phone"
                  type="tel"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  placeholder="+1234567890"
                  data-ocid="twilio-from-phone"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSMS}
              disabled={setSMS.isPending}
              data-ocid="save-twilio-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setSMS.isPending ? "Saving…" : "Save Twilio Credentials"}
            </button>
          </div>

          {/* Card 3: KYC */}
          <div
            className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4"
            data-ocid="kyc-credential-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    KYC Verification — Persona / Onfido
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-0.5">
                    Required for identity verification on withdrawals over $200.
                  </p>
                </div>
              </div>
              <CredentialBadge
                configured={kycStatus?.configured ?? false}
                label={
                  kycStatus?.configured && kycStatus.provider
                    ? `Connected · ${kycStatus.provider}`
                    : undefined
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="kyc-api-key"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  API Key
                </label>
                <PasswordInput
                  id="kyc-api-key"
                  value={kycApiKey}
                  onChange={setKycApiKey}
                  placeholder="••••••••••••••••••••••••••••••••"
                  data-ocid="kyc-api-key"
                />
              </div>
              <div>
                <label
                  htmlFor="kyc-provider"
                  className="text-xs text-muted-foreground mb-1.5 block"
                >
                  Provider
                </label>
                <select
                  id="kyc-provider"
                  value={kycProvider}
                  onChange={(e) =>
                    setKycProvider(e.target.value as "persona" | "onfido")
                  }
                  data-ocid="kyc-provider-select"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-teal/50 appearance-none cursor-pointer"
                >
                  <option value="persona" className="bg-[#0f172a]">
                    Persona
                  </option>
                  <option value="onfido" className="bg-[#0f172a]">
                    Onfido
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveKYC}
              disabled={setKYC.isPending}
              data-ocid="save-kyc-btn"
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl px-6 py-3 text-sm transition-colors duration-200"
            >
              {setKYC.isPending ? "Saving…" : "Save KYC Credentials"}
            </button>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 flex items-start gap-2 bg-teal/5 border border-teal/20 rounded-xl px-4 py-3">
          <Lock className="h-4 w-4 text-teal shrink-0 mt-0.5" />
          <p className="text-xs text-teal/80 leading-relaxed">
            Credentials are encrypted and stored securely. They are never
            exposed to end users.
          </p>
        </div>
      </section>

      {/* ── Compilation Status ── */}
      <section>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
          Security Compilation Status
        </p>
        <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
              <Code2 className="h-4 w-4 text-teal" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                Code Obfuscation & Protection
              </p>
              <p className="text-xs text-muted-foreground/50">
                ProGuard (Android) · SwiftShield (iOS)
              </p>
            </div>
          </div>

          {statusLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-muted/30 rounded-lg animate-pulse" />
              <div className="h-8 bg-muted/30 rounded-lg animate-pulse" />
            </div>
          ) : compilationStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 px-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal/70" />
                  <span className="text-xs font-semibold text-foreground/80">
                    Obfuscation Layer
                  </span>
                </div>
                <Badge className="bg-teal/20 text-teal border-teal/30 text-[10px]">
                  {compilationStatus.obfuscationLayer}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 bg-green-500/5 rounded-lg border border-green-500/10">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-400/70" />
                  <span className="text-xs font-semibold text-foreground/80">
                    ProGuard (Android)
                  </span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/20 text-[10px]">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2.5 px-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-400/70" />
                  <span className="text-xs font-semibold text-foreground/80">
                    SwiftShield (iOS)
                  </span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20 text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last verified:{" "}
                {formatTs(compilationStatus.verificationTimestamp)}
              </p>
              {compilationStatus.tooltipNote && (
                <p className="text-xs text-muted-foreground/50 italic bg-muted/30 rounded-lg px-3 py-2 border border-border/30">
                  {compilationStatus.tooltipNote}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 text-center py-4">
              Compilation status unavailable
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ── User Roles Tab ─────────────────────────────────────────────────────────────
function UserRolesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [], isLoading: searching } =
    useSearchUsers(searchQuery);

  const handleRoleAction = (username: string, role: string) => {
    toast.success(`Role update for @${username} → ${role} queued`);
  };

  return (
    <div className="space-y-4" data-ocid="admin-roles-tab">
      <div className="glassmorphism rounded-xl p-4 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-foreground">Search Users</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Search by @username or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50"
            data-ocid="role-search-input"
          />
        </div>
        {searching && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <div className="h-3 w-3 rounded-full border border-teal/60 border-t-transparent animate-spin" />
            Searching…
          </div>
        )}
        {!searching &&
          searchQuery.trim().length > 0 &&
          searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground/50 text-center py-2">
              No users found for "{searchQuery}"
            </p>
          )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.username}
              className="glassmorphism rounded-xl p-4 border border-border"
              data-ocid={`role-card-${result.username}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center shrink-0">
                  <span className="text-teal font-bold text-sm">
                    {result.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      @{result.username}
                    </p>
                    {result.isVerified && (
                      <ShieldCheck className="h-3.5 w-3.5 text-teal shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/50 truncate">
                    {result.bio || "No bio"}
                  </p>
                </div>
                <Badge className="bg-muted/50 text-muted-foreground border-border text-[10px] shrink-0">
                  User
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "Manager")}
                  className="flex-1 bg-teal/10 hover:bg-teal/20 border border-teal/20 text-teal/80 text-xs"
                  data-ocid={`promote-manager-${result.username}`}
                >
                  → Manager
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "Admin")}
                  className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-400 text-xs"
                  data-ocid={`promote-admin-${result.username}`}
                >
                  → Admin
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRoleAction(result.username, "User")}
                  className="flex-1 bg-muted/30 hover:bg-muted/50 border border-border text-muted-foreground text-xs"
                  data-ocid={`demote-user-${result.username}`}
                >
                  Demote
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searchQuery.trim() && (
        <div className="glassmorphism rounded-xl p-6 border border-border text-center">
          <UserCog className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-semibold">
            Search to find a user
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Type a username or phone number above to assign roles.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Support Admin Tab ─────────────────────────────────────────────────────────
function SupportAdminTab() {
  const { data: conversations = [], isLoading } =
    useAdminGetAllSupportConversations();
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null,
  );
  const { data: messages = [], refetch: refetchMessages } =
    useAdminGetSupportMessages(selectedPrincipal);
  const reply = useAdminReplySupportMessage();
  const close = useAdminCloseSupportTicket();
  const [replyText, setReplyText] = useState("");

  const handleReply = async () => {
    if (!selectedPrincipal || !replyText.trim()) return;
    try {
      await reply.mutateAsync({
        userPrincipal: selectedPrincipal,
        message: replyText.trim(),
      });
      toast.success("Reply sent");
      setReplyText("");
      await refetchMessages();
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleClose = async (p: Principal) => {
    try {
      await close.mutateAsync(p);
      toast.success("Ticket closed");
      if (selectedPrincipal?.toString() === p.toString())
        setSelectedPrincipal(null);
    } catch {
      toast.error("Failed to close ticket");
    }
  };

  if (isLoading) return <TabSkeleton rows={3} />;

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-10 w-10 text-teal/30" />}
        title="No support conversations"
        description="User support tickets will appear here when opened."
        teal
      />
    );
  }

  return (
    <div className="space-y-4" data-ocid="admin-support-tab">
      {/* Conversation list */}
      {!selectedPrincipal && (
        <div className="space-y-3">
          <SectionHeading
            icon={<MessageCircle className="h-4 w-4 text-teal" />}
            title="Support Tickets"
            count={conversations.length}
          />
          {conversations.map(([principal, convo]) => {
            const pid = principal.toString();
            const statusMap: Record<string, string> = {
              open: "bg-teal/10 text-teal border-teal/30",
              waiting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
              resolved: "bg-green-500/10 text-green-400 border-green-500/20",
            };
            const statusCls =
              statusMap[convo.status.toLowerCase()] ?? statusMap.open;
            return (
              <button
                key={pid}
                type="button"
                className="w-full text-left glassmorphism rounded-xl p-4 border border-border hover:border-teal/30 transition-colors"
                data-ocid={`admin-support-ticket-${pid.slice(0, 8)}`}
                onClick={() => setSelectedPrincipal(principal)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {convo.subject}
                    </p>
                    <p className="text-xs text-muted-foreground/50 font-mono mt-0.5">
                      {truncatePrincipal(principal)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                      {new Date(
                        Number(convo.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusCls}`}
                    >
                      {convo.status}
                    </span>
                    {Number(convo.unreadCount) > 0 && (
                      <span className="h-4 w-4 bg-teal text-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {Number(convo.unreadCount)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Thread view */}
      {selectedPrincipal && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPrincipal(null)}
              className="border-border text-muted-foreground hover:bg-muted/30 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              All Tickets
            </Button>
            <p className="text-xs text-muted-foreground/50 font-mono truncate flex-1">
              {truncatePrincipal(selectedPrincipal)}
            </p>
            <Button
              size="sm"
              onClick={() => handleClose(selectedPrincipal)}
              disabled={close.isPending}
              className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs"
              data-ocid="admin-support-close-ticket-button"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Close Ticket
            </Button>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg, idx) => {
              const isAdmin = msg.senderRole === "admin";
              const ts = new Date(Number(msg.timestamp) / 1_000_000);
              return (
                <div
                  key={`admin-msg-${String(msg.timestamp)}-${idx}`}
                  className={`flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isAdmin ? "bg-teal text-foreground" : "bg-muted/50 text-foreground/90 border border-border"}`}
                  >
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-white/25 px-1">
                    {isAdmin ? "You (Admin)" : "User"} ·{" "}
                    {ts.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-4">
                No messages yet
              </p>
            )}
          </div>

          {/* Reply input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleReply();
                }
              }}
              className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-teal/50"
              data-ocid="admin-support-reply-input"
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || reply.isPending}
              size="sm"
              className="bg-teal hover:bg-teal/90 text-foreground px-4"
              data-ocid="admin-support-reply-button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Direct Deposit Admin Tab ──────────────────────────────────────────────────

function DirectDepositAdminTab() {
  const { data: pending = [], isLoading: pendingLoading } =
    useGetPendingDirectDeposits();
  const simulate = useSimulateDirectDeposit();
  const complete = useCompleteDirectDeposit();

  const [targetUser, setTargetUser] = useState("");
  const [amount, setAmount] = useState("");
  const [isTest, setIsTest] = useState(true);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);

  function tsToMs(ts: bigint) {
    return Number(ts) / 1_000_000;
  }

  const handleSimulate = async () => {
    if (!targetUser.trim()) {
      toast.error("Enter a user principal");
      return;
    }
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      const result = await simulate.mutateAsync({
        targetUser: targetUser.trim(),
        amount: BigInt(amountCents),
        isTest,
      });
      const depositId =
        typeof result === "object" && result !== null && "id" in result
          ? (result as { id: string }).id
          : "unknown";
      setSimulateResult(
        `Deposit simulated! ID: ${depositId} · $${(amountCents / 100).toFixed(2)}${isTest ? " (test)" : ""}`,
      );
      setTargetUser("");
      setAmount("");
      toast.success("Deposit simulated successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Simulation failed");
    }
  };

  const handleComplete = async (depositId: string) => {
    try {
      await complete.mutateAsync(depositId);
      toast.success("Deposit completed!");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to complete deposit",
      );
    }
  };

  return (
    <div className="space-y-6" data-ocid="admin-directdeposit-tab">
      {/* ── Simulate Section ── */}
      <div className="glassmorphism rounded-xl p-5 border border-teal/20 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal" />
          <p className="text-sm font-bold text-foreground">
            Simulate Direct Deposit
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="dd-target-user"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              Target User (Principal)
            </label>
            <input
              id="dd-target-user"
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="aaaaa-bbbbb-ccccc-ddddd-cai"
              data-ocid="admin-dd-target-input"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
            />
          </div>
          <div>
            <label
              htmlFor="dd-amount"
              className="text-xs text-muted-foreground mb-1.5 block"
            >
              Amount (USD)
            </label>
            <input
              id="dd-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              data-ocid="admin-dd-amount-input"
              className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-teal/50"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isTest}
              onChange={(e) => setIsTest(e.target.checked)}
              data-ocid="admin-dd-test-toggle"
              className="sr-only"
            />
            <div
              role="switch"
              aria-checked={isTest}
              tabIndex={0}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer ${
                isTest ? "bg-teal/60" : "bg-muted/60"
              }`}
              onClick={() => setIsTest((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setIsTest((v) => !v);
              }}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  isTest ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Mark as test deposit
              <span className="text-white/30 ml-1">
                (won't affect real balance)
              </span>
            </span>
          </label>
        </div>

        <Button
          onClick={handleSimulate}
          disabled={simulate.isPending}
          className="w-full bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal font-semibold"
          data-ocid="admin-dd-simulate-btn"
        >
          {simulate.isPending ? "Simulating…" : "Simulate Deposit"}
        </Button>

        {simulateResult && (
          <div
            className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3"
            data-ocid="admin-dd-simulate-success"
          >
            <p className="text-xs text-green-400 font-medium">
              {simulateResult}
            </p>
          </div>
        )}
      </div>

      {/* ── Pending Deposits ── */}
      <div>
        <SectionHeading
          icon={<Clock className="h-4 w-4 text-amber-400" />}
          title="Pending Deposits (All Users)"
          count={pending.length}
          countColor="text-amber-400"
        />

        {pendingLoading && <TabSkeleton rows={3} />}

        {!pendingLoading && pending.length === 0 && (
          <EmptyState
            icon={<Building2 className="h-10 w-10 text-muted-foreground/20" />}
            title="No pending deposits"
            description="Simulated deposits that haven't been completed will appear here."
          />
        )}

        {!pendingLoading && pending.length > 0 && (
          <div className="space-y-3 mt-3">
            {pending.map((dep, idx) => (
              <div
                key={dep.id}
                className="glassmorphism rounded-xl p-4 border border-amber-500/20 space-y-3"
                data-ocid={`admin-dd-pending-item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">
                        ${(Number(dep.amount) / 100).toFixed(2)}
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Pending
                      </span>
                      {dep.isTest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-muted/50 text-muted-foreground/50 border-border">
                          Test
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/50 font-mono truncate">
                      {dep.targetUser}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {new Date(tsToMs(dep.createdAt)).toLocaleString()}
                    </p>
                    {dep.clearAt && dep.clearAt > BigInt(0) && (
                      <p className="text-[10px] text-amber-400/70 mt-0.5">
                        Clears{" "}
                        {new Date(tsToMs(dep.clearAt)).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleComplete(dep.id)}
                    disabled={complete.isPending}
                    className="shrink-0 bg-teal/20 hover:bg-teal/30 border border-teal/40 text-teal text-xs h-8"
                    data-ocid={`admin-dd-complete-btn.${idx + 1}`}
                  >
                    Complete Now
                  </Button>
                </div>
                <p className="text-[10px] text-white/25 font-mono break-all">
                  ID: {dep.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const cls = map[status] ?? "bg-muted/50 text-muted-foreground border-border";
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase ${cls}`}
    >
      {status}
    </span>
  );
}

function SectionHeading({
  icon,
  title,
  count,
  countColor = "text-white/60",
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  countColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <p className="text-sm font-bold text-foreground">{title}</p>
      {count !== undefined && (
        <span className={`text-xs font-semibold ${countColor}`}>({count})</span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  teal,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  teal?: boolean;
}) {
  return (
    <div
      className={`glassmorphism rounded-xl p-8 border ${
        teal ? "border-teal/20" : "border-border"
      } text-center`}
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <p
        className={`text-sm font-semibold ${teal ? "text-teal/80" : "text-white/60"}`}
      >
        {title}
      </p>
      <p className="text-xs text-muted-foreground/50 mt-1 max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
}

function RewardsTab() {
  const { data: allRewardsRaw = [] } = useListRewards(undefined);
  const allRewards = Array.isArray(allRewardsRaw)
    ? (allRewardsRaw as unknown as import("@/types/fanpoints").Reward[])
    : [];
  const createReward = useCreateReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const emptyForm = {
    title: "",
    description: "",
    pointsCost: "250",
    rewardType: "discountCode",
    codeOrValue: "",
    quantity: "",
    teamId: "colts",
  };
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editingReward, setEditingReward] = React.useState<
    import("@/types/fanpoints").Reward | null
  >(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);
  const [addForm, setAddForm] = React.useState(emptyForm);
  const [editForm, setEditForm] = React.useState(emptyForm);

  const getRewardStatus = (r: import("@/types/fanpoints").Reward) => {
    if (!r.active)
      return { label: "Unavailable", color: "text-white/40 bg-white/10" };
    if (
      r.quantityRemaining !== undefined &&
      r.quantityRemaining !== null &&
      r.quantityRemaining === 0n
    ) {
      return { label: "Sold Out", color: "text-amber-400 bg-amber-900/30" };
    }
    return { label: "Active", color: "text-[#00e5cc] bg-[#00e5cc]/10" };
  };

  const getRewardTypeBadge = (rewardType: string) => {
    const map: Record<string, string> = {
      discountCode: "Discount",
      ticketEntry: "Ticket",
      concessionCredit: "Concession",
      other: "Other",
    };
    return map[rewardType] ?? rewardType;
  };

  const handleCreate = async () => {
    await createReward.mutateAsync({
      title: addForm.title,
      description: addForm.description,
      pointsCost: BigInt(Number.parseInt(addForm.pointsCost) || 0),
      rewardType: addForm.rewardType as
        | "discountCode"
        | "ticketEntry"
        | "concessionCredit"
        | "other",
      codeOrValue: addForm.codeOrValue,
      quantity: addForm.quantity
        ? BigInt(Number.parseInt(addForm.quantity))
        : null,
      expiresAt: null,
      teamId: addForm.teamId || null,
    });
    setAddForm(emptyForm);
    setShowAddModal(false);
  };

  const handleEdit = async () => {
    if (!editingReward) return;
    await updateReward.mutateAsync({
      id: editingReward.id,
      params: {
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        pointsCost: editForm.pointsCost
          ? BigInt(Number.parseInt(editForm.pointsCost))
          : undefined,
        codeOrValue: editForm.codeOrValue || undefined,
        quantity: editForm.quantity
          ? BigInt(Number.parseInt(editForm.quantity))
          : undefined,
        teamId: editForm.teamId || undefined,
      },
    });
    setShowEditModal(false);
    setEditingReward(null);
  };

  const handleToggle = (reward: import("@/types/fanpoints").Reward) => {
    updateReward.mutate({ id: reward.id, params: { active: !reward.active } });
  };

  const handleDelete = (id: string) => {
    deleteReward.mutate(id);
    setDeleteConfirm(null);
  };

  const openEdit = (reward: import("@/types/fanpoints").Reward) => {
    setEditingReward(reward);
    setEditForm({
      title: reward.title,
      description: reward.description,
      pointsCost: String(Number(reward.pointsCost)),
      rewardType:
        typeof reward.rewardType === "string"
          ? reward.rewardType
          : (Object.keys(reward.rewardType as object)[0] ?? "discountCode"),
      codeOrValue: reward.codeOrValue,
      quantity: reward.quantity != null ? String(Number(reward.quantity)) : "",
      teamId: reward.teamId ?? "",
    });
    setShowEditModal(true);
  };

  const RewardFormFields = ({
    form,
    setForm,
  }: {
    form: typeof emptyForm;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  }) => (
    <div className="grid grid-cols-1 gap-3">
      <Input
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        placeholder="Reward title"
        className="bg-card border-border text-foreground placeholder-white/40 focus:border-[#00e5cc]"
      />
      <Textarea
        value={form.description}
        onChange={(e) =>
          setForm((p) => ({ ...p, description: e.target.value }))
        }
        placeholder="Description"
        rows={2}
        className="bg-card border-border text-foreground placeholder-white/40 resize-none focus:border-[#00e5cc]"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          value={form.pointsCost}
          onChange={(e) =>
            setForm((p) => ({ ...p, pointsCost: e.target.value }))
          }
          placeholder="Points cost"
          className="bg-card border-border text-foreground"
        />
        <select
          value={form.rewardType}
          onChange={(e) =>
            setForm((p) => ({ ...p, rewardType: e.target.value }))
          }
          className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:border-[#00e5cc] focus:outline-none"
        >
          <option value="discountCode">Discount Code</option>
          <option value="ticketEntry">Ticket Entry</option>
          <option value="concessionCredit">Concession Credit</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Input
        value={form.codeOrValue}
        onChange={(e) =>
          setForm((p) => ({ ...p, codeOrValue: e.target.value }))
        }
        placeholder="Code or value (e.g. COLTS10)"
        className="bg-card border-border text-foreground"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            value={form.quantity}
            onChange={(e) =>
              setForm((p) => ({ ...p, quantity: e.target.value }))
            }
            placeholder="Qty limit (blank = unlimited)"
            className="bg-card border-border text-foreground"
          />
        </div>
        <select
          value={form.teamId}
          onChange={(e) => setForm((p) => ({ ...p, teamId: e.target.value }))}
          className="bg-card border border-border text-foreground rounded-lg px-3 py-2 text-sm focus:border-[#00e5cc] focus:outline-none"
        >
          <option value="">All Teams</option>
          <option value="colts">Colts</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-5" data-ocid="admin.rewards.panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-base">Rewards Management</h3>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00e5cc] text-[#0a0e1a] font-bold rounded-xl text-sm hover:bg-[#00e5cc]/90 transition-colors"
          data-ocid="admin.rewards.add_button"
        >
          + Add New Reward
        </button>
      </div>

      {/* Rewards list */}
      {allRewards.length === 0 ? (
        <div
          className="bg-muted/30 border border-border rounded-xl p-8 text-center"
          data-ocid="admin.rewards.empty_state"
        >
          <p className="text-white/40">No rewards yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="admin.rewards.list">
          {allRewards.map((r, idx) => {
            const status = getRewardStatus(r);
            const qtyRemaining =
              r.quantityRemaining != null ? Number(r.quantityRemaining) : null;
            const qtyTotal = r.quantity != null ? Number(r.quantity) : null;
            const rewardTypeName =
              typeof r.rewardType === "string"
                ? getRewardTypeBadge(r.rewardType)
                : getRewardTypeBadge(
                    Object.keys(r.rewardType as object)[0] ?? "",
                  );
            return (
              <div
                key={r.id}
                className="bg-muted/30 border border-border rounded-xl p-4 space-y-3"
                data-ocid={`admin.rewards.item.${idx + 1}`}
              >
                {/* Top row: title + badges */}
                <div className="flex items-start gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm flex-1 min-w-0">
                    {r.title}
                  </p>
                  <span className="shrink-0 text-[#00e5cc] text-xs font-bold bg-[#00e5cc]/10 px-2 py-0.5 rounded-full">
                    {Number(r.pointsCost).toLocaleString()} pts
                  </span>
                  <span className="shrink-0 text-white/50 text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    {rewardTypeName}
                  </span>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                {/* Quantity + description */}
                <div className="flex items-center gap-3">
                  <p className="text-white/40 text-xs flex-1 min-w-0 line-clamp-1">
                    {r.description}
                  </p>
                  <span className="shrink-0 text-white/40 text-xs">
                    {qtyRemaining != null && qtyTotal != null
                      ? `${qtyRemaining} / ${qtyTotal} remaining`
                      : "Unlimited"}
                  </span>
                </div>
                {/* Action row or delete confirm */}
                {deleteConfirm === r.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-red-400 text-xs flex-1">
                      Are you sure? This cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors"
                      data-ocid={`admin.rewards.confirm_delete.${idx + 1}`}
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 bg-muted/40 text-white/60 border border-border rounded-lg text-xs hover:bg-muted/60 transition-colors"
                      data-ocid={`admin.rewards.cancel_delete.${idx + 1}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="px-3 py-1.5 border border-[#00e5cc]/50 text-[#00e5cc] rounded-lg text-xs font-semibold hover:bg-[#00e5cc]/10 transition-colors"
                      data-ocid={`admin.rewards.edit_button.${idx + 1}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(r)}
                      className="px-3 py-1.5 border border-border text-white/60 rounded-lg text-xs hover:bg-muted/40 transition-colors"
                      data-ocid={`admin.rewards.toggle.${idx + 1}`}
                    >
                      {r.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(r.id)}
                      className="ml-auto px-3 py-1.5 border border-red-500/40 text-red-400 rounded-lg text-xs hover:bg-red-500/10 transition-colors"
                      data-ocid={`admin.rewards.delete_button.${idx + 1}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Reward Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          data-ocid="admin.rewards.add_modal"
        >
          <div className="bg-[#0f1628] border border-border rounded-2xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Add New Reward</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm(emptyForm);
                }}
                className="text-white/40 hover:text-white transition-colors text-lg leading-none"
                data-ocid="admin.rewards.add_modal.close_button"
              >
                ✕
              </button>
            </div>
            <RewardFormFields form={addForm} setForm={setAddForm} />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm(emptyForm);
                }}
                className="flex-1 px-4 py-2.5 border border-border text-white/60 rounded-xl text-sm hover:bg-muted/30 transition-colors"
                data-ocid="admin.rewards.add_modal.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={
                  !addForm.title ||
                  !addForm.codeOrValue ||
                  createReward.isPending
                }
                className="flex-1 px-4 py-2.5 bg-[#00e5cc] text-[#0a0e1a] font-bold rounded-xl text-sm hover:bg-[#00e5cc]/90 disabled:opacity-40 transition-colors"
                data-ocid="admin.rewards.add_modal.submit_button"
              >
                {createReward.isPending ? "Saving..." : "Save Reward"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {showEditModal && editingReward && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          data-ocid="admin.rewards.edit_modal"
        >
          <div className="bg-[#0f1628] border border-border rounded-2xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold">Edit Reward</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReward(null);
                }}
                className="text-white/40 hover:text-white transition-colors text-lg leading-none"
                data-ocid="admin.rewards.edit_modal.close_button"
              >
                ✕
              </button>
            </div>
            <RewardFormFields form={editForm} setForm={setEditForm} />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReward(null);
                }}
                className="flex-1 px-4 py-2.5 border border-border text-white/60 rounded-xl text-sm hover:bg-muted/30 transition-colors"
                data-ocid="admin.rewards.edit_modal.cancel_button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEdit}
                disabled={
                  !editForm.title ||
                  !editForm.codeOrValue ||
                  updateReward.isPending
                }
                className="flex-1 px-4 py-2.5 bg-[#00e5cc] text-[#0a0e1a] font-bold rounded-xl text-sm hover:bg-[#00e5cc]/90 disabled:opacity-40 transition-colors"
                data-ocid="admin.rewards.edit_modal.submit_button"
              >
                {updateReward.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <FractionalEngineSection />
    </div>
  );
}

function FractionalEngineSection() {
  const [activeRules, setActiveRules] = React.useState<Set<string>>(
    () => new Set(DEMO_POINTS_RULES.filter((r) => r.isActive).map((r) => r.id)),
  );
  const [editingRule, setEditingRule] = React.useState<string | null>(null);
  const [editMultiplier, setEditMultiplier] = React.useState("");
  const [localMultipliers, setLocalMultipliers] = React.useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(DEMO_POINTS_RULES.map((r) => [r.id, r.multiplier])),
  );
  const [calcAmount, setCalcAmount] = React.useState("10.00");
  const [calcType, setCalcType] = React.useState<"tip" | "food" | "payment">(
    "tip",
  );
  const [calcGameDay, setCalcGameDay] = React.useState(false);
  const [calcFirst, setCalcFirst] = React.useState(false);
  const [calcSection, setCalcSection] = React.useState<string>("");
  const [calcResult, setCalcResult] = React.useState<{
    basePoints: number;
    appliedRules: [string, number, string?][];
    finalPoints: number;
  } | null>(null);

  // Section multiplier rules (local state, starts from DEMO_POINTS_RULES)
  const [sectionRules, setSectionRules] = React.useState(
    DEMO_POINTS_RULES.filter(
      (r) => (r.ruleType as string) === "sectionMultiplier",
    ),
  );
  const [showSectionForm, setShowSectionForm] = React.useState(false);
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(
    null,
  );
  const [sectionFormName, setSectionFormName] = React.useState("");
  const [sectionFormMult, setSectionFormMult] = React.useState("1.0");

  const globalRules = DEMO_POINTS_RULES.filter(
    (r) => (r.ruleType as string) !== "sectionMultiplier",
  );

  const ruleTypeLabel = (rt: string) => {
    const map: Record<string, string> = {
      tipMultiplier: "Tip Multiplier",
      foodMultiplier: "Food Order",
      paymentMultiplier: "General Payment",
      gameDayBonus: "Game Day Bonus",
      firstPaymentBonus: "First Payment",
      sectionMultiplier: "Section Multiplier",
    };
    return map[rt] ?? rt;
  };

  const toggleRule = (id: string) => {
    setActiveRules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (rule: (typeof DEMO_POINTS_RULES)[0]) => {
    setEditingRule(rule.id);
    setEditMultiplier(String(localMultipliers[rule.id] ?? rule.multiplier));
  };

  const saveEdit = (id: string) => {
    const val = Number.parseFloat(editMultiplier);
    if (!Number.isNaN(val) && val > 0) {
      setLocalMultipliers((prev) => ({ ...prev, [id]: val }));
    }
    setEditingRule(null);
  };

  const openAddSectionForm = () => {
    setEditingSectionId(null);
    setSectionFormName("");
    setSectionFormMult("1.0");
    setShowSectionForm(true);
  };

  const openEditSectionForm = (rule: (typeof sectionRules)[0]) => {
    setEditingSectionId(rule.id);
    setSectionFormName(rule.sectionName ?? "");
    setSectionFormMult(String(rule.multiplier));
    setShowSectionForm(true);
  };

  const saveSectionForm = () => {
    const mult = Number.parseFloat(sectionFormMult);
    if (!sectionFormName.trim() || Number.isNaN(mult) || mult <= 0) return;
    if (editingSectionId) {
      setSectionRules((prev) =>
        prev.map((r) =>
          r.id === editingSectionId
            ? {
                ...r,
                name: `${sectionFormName.trim()} Section`,
                sectionName: sectionFormName.trim(),
                multiplier: mult,
              }
            : r,
        ),
      );
      setLocalMultipliers((prev) => ({ ...prev, [editingSectionId]: mult }));
    } else {
      const newId = `rule-section-${Date.now()}`;
      setSectionRules((prev) => [
        ...prev,
        {
          id: newId,
          name: `${sectionFormName.trim()} Section`,
          description: `Fans earn ${mult}x points when tipping staff in ${sectionFormName.trim()}`,
          ruleType: "sectionMultiplier" as PointsRuleType,
          multiplier: mult,
          isActive: true,
          createdAt: BigInt(0),
          sectionName: sectionFormName.trim(),
        },
      ]);
      setActiveRules((prev) => new Set([...prev, newId]));
      setLocalMultipliers((prev) => ({ ...prev, [newId]: mult }));
    }
    setShowSectionForm(false);
    setEditingSectionId(null);
  };

  const removeSectionRule = (id: string) => {
    setSectionRules((prev) => prev.filter((r) => r.id !== id));
    setActiveRules((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCalculate = () => {
    const base = Number.parseFloat(calcAmount) || 0;
    const appliedRules: [string, number, string?][] = [];
    let points = base;

    const ruleTypeForCalcType = {
      tip: "tipMultiplier",
      food: "foodMultiplier",
      payment: "paymentMultiplier",
    }[calcType];

    for (const rule of globalRules) {
      if (!activeRules.has(rule.id)) continue;
      const rt = rule.ruleType as string;
      const mult = localMultipliers[rule.id] ?? rule.multiplier;
      if (rt === ruleTypeForCalcType) {
        appliedRules.push([rule.name, mult]);
        points *= mult;
      } else if (rt === "gameDayBonus" && calcGameDay) {
        appliedRules.push([rule.name, mult]);
        points *= mult;
      } else if (rt === "firstPaymentBonus" && calcFirst) {
        appliedRules.push([rule.name, mult]);
        points *= mult;
      }
    }

    // Apply section multiplier if selected
    if (calcSection && calcType === "tip") {
      const secRule = sectionRules.find((r) => r.sectionName === calcSection);
      if (secRule && activeRules.has(secRule.id)) {
        const mult = localMultipliers[secRule.id] ?? secRule.multiplier;
        appliedRules.push([`${calcSection} Section Bonus`, mult, calcSection]);
        points *= mult;
      }
    }

    setCalcResult({ basePoints: base, appliedRules, finalPoints: points });
  };

  return (
    <div className="space-y-6 mt-8" data-ocid="admin.fractional_engine.section">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[#00e5cc]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">
            Fractional Points Engine
          </h3>
          <p className="text-white/40 text-xs">
            Live rules — toggle, edit multipliers, and test calculations in real
            time
          </p>
        </div>
      </div>

      {/* Global Rules List */}
      <div className="space-y-2">
        {globalRules.map((rule) => {
          const rt = rule.ruleType as string;
          const isActive = activeRules.has(rule.id);
          const mult = localMultipliers[rule.id] ?? rule.multiplier;
          const isEditing = editingRule === rule.id;
          return (
            <div
              key={rule.id}
              className={`bg-muted/30 border rounded-xl p-3 transition-all duration-200 ${
                isActive ? "border-teal-500/30" : "border-border opacity-60"
              }`}
              data-ocid={`admin.fractional_engine.rule.${rule.id}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">
                      {rule.name}
                    </span>
                    <span className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded">
                      {ruleTypeLabel(rt)}
                    </span>
                    {!isEditing && (
                      <span className="text-xs bg-teal-500/20 text-teal-300 px-2 rounded font-mono">
                        {mult}×
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {rule.description}
                  </p>
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editMultiplier}
                        onChange={(e) => setEditMultiplier(e.target.value)}
                        className="w-24 bg-card border border-teal-500/40 text-foreground text-sm rounded-lg px-2 py-1 focus:border-[#00e5cc] focus:outline-none"
                        data-ocid={`admin.fractional_engine.multiplier_input.${rule.id}`}
                      />
                      <span className="text-white/40 text-xs">×</span>
                      <button
                        type="button"
                        onClick={() => saveEdit(rule.id)}
                        className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-lg hover:bg-teal-500/30 transition-colors"
                        data-ocid={`admin.fractional_engine.save_button.${rule.id}`}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRule(null)}
                        className="text-xs bg-muted/50 text-muted-foreground border border-border px-3 py-1 rounded-lg hover:bg-muted/60 transition-colors"
                        data-ocid={`admin.fractional_engine.cancel_button.${rule.id}`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(rule)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground/50 hover:text-teal-300 transition-colors"
                      aria-label="Edit multiplier"
                      data-ocid={`admin.fractional_engine.edit_button.${rule.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      isActive
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30"
                        : "bg-muted/50 text-muted-foreground/50 border border-border hover:bg-muted/60"
                    }`}
                    data-ocid={`admin.fractional_engine.toggle.${rule.id}`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stadium Section Multipliers */}
      <div
        className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl p-4 space-y-3"
        data-ocid="admin.fractional_engine.section_multipliers"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#f59e0b] text-base">📍</span>
            <div>
              <h4 className="text-white font-semibold text-sm">
                Stadium Section Multipliers
              </h4>
              <p className="text-white/40 text-xs">
                Fans earn bonus points based on which stadium section the staff
                member is in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAddSectionForm}
            className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 px-3 py-1.5 rounded-lg hover:bg-[#f59e0b]/30 transition-colors font-medium shrink-0"
            data-ocid="admin.section_multipliers.add_button"
          >
            + Add Section
          </button>
        </div>

        {sectionRules.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-3">
            No section multipliers yet — add one above
          </p>
        ) : (
          <div className="space-y-2">
            {sectionRules.map((rule) => {
              const isActive = activeRules.has(rule.id);
              const mult = localMultipliers[rule.id] ?? rule.multiplier;
              return (
                <div
                  key={rule.id}
                  className={`bg-white/5 backdrop-blur border rounded-xl p-3 transition-all duration-200 ${
                    isActive
                      ? "border-[#f59e0b]/30"
                      : "border-border opacity-60"
                  }`}
                  data-ocid={`admin.section_multipliers.rule.${rule.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#f59e0b] text-xs font-bold bg-[#f59e0b]/15 px-2 py-0.5 rounded-full">
                          {rule.sectionName}
                        </span>
                        <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b]/80 px-2 rounded font-mono">
                          {mult}×
                        </span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">
                        Fans earn {mult}x points when tipping staff in{" "}
                        {rule.sectionName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditSectionForm(rule)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted/30 hover:bg-[#f59e0b]/20 text-muted-foreground/50 hover:text-[#f59e0b] transition-colors"
                        aria-label="Edit section multiplier"
                        data-ocid={`admin.section_multipliers.edit_button.${rule.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          isActive
                            ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30"
                            : "bg-muted/50 text-muted-foreground/50 border border-border hover:bg-muted/60"
                        }`}
                        data-ocid={`admin.section_multipliers.toggle.${rule.id}`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSectionRule(rule.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/50 hover:text-red-400 transition-colors"
                        aria-label="Remove section multiplier"
                        data-ocid={`admin.section_multipliers.delete_button.${rule.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Section Multiplier Form */}
        {showSectionForm && (
          <div
            className="bg-card border border-[#f59e0b]/30 rounded-xl p-4 space-y-3"
            data-ocid="admin.section_multipliers.form"
          >
            <h5 className="text-white font-medium text-sm">
              {editingSectionId
                ? "Edit Section Multiplier"
                : "Add Section Multiplier"}
            </h5>
            <div>
              <label
                htmlFor="section-name-input"
                className="text-white/50 text-xs block mb-1"
              >
                Section Name
              </label>
              <input
                id="section-name-input"
                type="text"
                placeholder="e.g. VIP Suite, Field Level, Upper Deck"
                value={sectionFormName}
                onChange={(e) => setSectionFormName(e.target.value)}
                className="w-full bg-background border border-[#f59e0b]/30 text-foreground text-sm rounded-lg px-3 py-2 focus:border-[#f59e0b] focus:outline-none transition-colors"
                data-ocid="admin.section_multipliers.form.name_input"
              />
            </div>
            <div>
              <label
                htmlFor="section-mult-input"
                className="text-white/50 text-xs block mb-1"
              >
                Multiplier
              </label>
              <input
                id="section-mult-input"
                type="number"
                step="0.1"
                min="0.1"
                max="10.0"
                value={sectionFormMult}
                onChange={(e) => setSectionFormMult(e.target.value)}
                className="w-full bg-background border border-[#f59e0b]/30 text-foreground text-sm rounded-lg px-3 py-2 focus:border-[#f59e0b] focus:outline-none transition-colors"
                data-ocid="admin.section_multipliers.form.mult_input"
              />
              {sectionFormName && (
                <p className="text-white/30 text-xs mt-1">
                  Fans earn {sectionFormMult}x points when tipping staff in{" "}
                  {sectionFormName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveSectionForm}
                disabled={!sectionFormName.trim()}
                className="flex-1 bg-[#f59e0b] text-[#0a0e1a] font-bold py-2 rounded-lg text-sm hover:bg-[#f59e0b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-ocid="admin.section_multipliers.form.save_button"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSectionForm(false)}
                className="flex-1 border border-border text-white/60 py-2 rounded-lg text-sm hover:bg-muted/30 transition-colors"
                data-ocid="admin.section_multipliers.form.cancel_button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Test Calculator */}
      <div
        className="bg-muted/30 border border-border rounded-xl p-4 space-y-4"
        data-ocid="admin.fractional_engine.calculator"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00e5cc]" />
          <h4 className="text-white font-semibold text-sm">
            Live Test Calculator
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="calc-amount"
              className="text-white/50 text-xs block mb-1"
            >
              Amount
            </label>
            <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden focus-within:border-[#00e5cc] transition-colors">
              <span className="pl-3 text-muted-foreground/50 text-sm">$</span>
              <input
                id="calc-amount"
                type="number"
                step="0.01"
                min="0"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="flex-1 bg-transparent text-foreground text-sm px-2 py-2 focus:outline-none"
                data-ocid="admin.fractional_engine.calc_amount"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="calc-type"
              className="text-white/50 text-xs block mb-1"
            >
              Transaction Type
            </label>
            <select
              id="calc-type"
              value={calcType}
              onChange={(e) =>
                setCalcType(e.target.value as "tip" | "food" | "payment")
              }
              className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-[#00e5cc] focus:outline-none transition-colors"
              data-ocid="admin.fractional_engine.calc_type"
            >
              <option value="tip">Tip to Colts Staff</option>
              <option value="food">Food Order</option>
              <option value="payment">General Payment</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="calc-section"
            className="text-white/50 text-xs block mb-1"
          >
            Stadium Section
          </label>
          <select
            id="calc-section"
            value={calcSection}
            onChange={(e) => setCalcSection(e.target.value)}
            className="w-full bg-card border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:border-[#00e5cc] focus:outline-none transition-colors"
            data-ocid="admin.fractional_engine.calc_section"
          >
            <option value="">None / Not applicable</option>
            {sectionRules
              .filter((r) => activeRules.has(r.id) && r.sectionName)
              .map((r) => (
                <option key={r.id} value={r.sectionName}>
                  {r.sectionName} ({localMultipliers[r.id] ?? r.multiplier}x)
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={calcGameDay}
              onChange={(e) => setCalcGameDay(e.target.checked)}
              className="w-4 h-4 accent-[#00e5cc]"
              data-ocid="admin.fractional_engine.calc_gameday"
            />
            <span className="text-white/70 text-sm">Game Day</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={calcFirst}
              onChange={(e) => setCalcFirst(e.target.checked)}
              className="w-4 h-4 accent-[#00e5cc]"
              data-ocid="admin.fractional_engine.calc_first"
            />
            <span className="text-white/70 text-sm">First-Time Payer</span>
          </label>
        </div>
        <Button
          type="button"
          onClick={handleCalculate}
          className="w-full bg-[#00e5cc] text-[#0a0e1a] font-bold hover:bg-[#00e5cc]/90"
          data-ocid="admin.fractional_engine.calc_button"
        >
          Calculate Points
        </Button>
        {calcResult && (
          <div
            className="bg-background border border-teal-500/30 rounded-xl p-4 space-y-2"
            data-ocid="admin.fractional_engine.calc_result"
          >
            <p className="text-white/60 text-xs">
              Base: ${calcAmount} = {calcResult.basePoints.toFixed(3)} pts
            </p>
            {calcResult.appliedRules.map(([name, mult, secName]) => (
              <p
                key={name}
                className={`text-xs pl-3 border-l ${
                  secName
                    ? "border-[#f59e0b]/40 text-[#f59e0b]/70"
                    : "border-teal-500/30 text-white/50"
                }`}
              >
                × {mult}x{" "}
                <span className={secName ? "text-[#f59e0b]" : "text-white/70"}>
                  {secName ? `${secName} Section Bonus` : name}
                </span>
              </p>
            ))}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-white/50 text-sm">Final Points</span>
              <span className="text-teal-300 text-xl font-bold">
                {calcResult.finalPoints.toFixed(3)} pts
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simulated Transactions */}
      <div
        className="bg-muted/30 border border-border rounded-xl p-4"
        data-ocid="admin.fractional_engine.transactions"
      >
        <div className="mb-3">
          <h4 className="text-white font-semibold text-sm">
            Simulated Transactions — Engine Output
          </h4>
          <p className="text-white/40 text-xs mt-0.5">
            20 demo transactions processed through the fractional rules engine
          </p>
        </div>
        <div className="overflow-x-auto">
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border">
                  <th className="text-white/40 font-medium text-left py-2 pr-3">
                    Date
                  </th>
                  <th className="text-white/40 font-medium text-left py-2 pr-3">
                    Transaction
                  </th>
                  <th className="text-white/40 font-medium text-left py-2 pr-3">
                    Type
                  </th>
                  <th className="text-white/40 font-medium text-right py-2 pr-3">
                    Amount
                  </th>
                  <th className="text-white/40 font-medium text-left py-2 pr-3">
                    Breakdown
                  </th>
                  <th className="text-white/40 font-medium text-right py-2">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {DEMO_POINT_TRANSACTIONS.map((t, idx) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    data-ocid={`admin.fractional_engine.tx.${idx + 1}`}
                  >
                    <td className="text-white/40 py-2 pr-3 whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="text-white/70 py-2 pr-3 max-w-[160px] truncate">
                      {t.description}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          t.type === "Tip"
                            ? "bg-teal-500/20 text-teal-300"
                            : t.type === "Food"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-purple-500/20 text-purple-300"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="text-white/60 py-2 pr-3 text-right whitespace-nowrap">
                      ${t.amountDollars.toFixed(2)}
                    </td>
                    <td
                      className="text-teal-400/80 py-2 pr-3 max-w-[180px] truncate"
                      title={t.breakdown}
                    >
                      {t.breakdown}
                    </td>
                    <td className="text-teal-300 font-bold py-2 text-right whitespace-nowrap">
                      +{t.finalPoints.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => `sk-${i}`).map((id) => (
        <div
          key={id}
          className="glassmorphism rounded-xl p-4 border border-border animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted/50" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/50 rounded w-1/3" />
              <div className="h-3 bg-muted/50 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── PartnershipsTab ───────────────────────────────────────────────────────────────────
const ORG_TYPE_COLORS: Record<string, string> = {
  "NFL Team": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "NBA Team": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "MLB Team": "bg-red-500/20 text-red-400 border-red-500/30",
  "NHL Team": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "MLS Team": "bg-green-500/20 text-green-400 border-green-500/30",
  "Sports Venue": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Stadium / Arena": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Enterprise / Corporate": "bg-teal/20 text-teal border-teal/30",
  Other: "bg-muted/50 text-muted-foreground border-border",
};

interface PartnershipInquiry {
  id: string;
  orgName: string;
  contactName: string;
  email: string;
  orgType: string;
  submittedAt: string;
  contacted: boolean;
}

function PartnershipsTab() {
  const [inquiries, setInquiries] = React.useState<PartnershipInquiry[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("partnershipInquiries") ?? "[]",
      ) as PartnershipInquiry[];
    } catch {
      return [];
    }
  });

  const markContacted = (id: string) => {
    const updated = inquiries.map((inq) =>
      inq.id === id ? { ...inq, contacted: true } : inq,
    );
    setInquiries(updated);
    localStorage.setItem("partnershipInquiries", JSON.stringify(updated));
    toast.success("Marked as contacted.");
  };

  if (inquiries.length === 0) {
    return (
      <div data-ocid="partnerships-tab">
        <EmptyState
          icon={<Handshake className="h-10 w-10 text-muted-foreground/20" />}
          title="No partnership inquiries yet."
          description="Inquiries submitted via the Business page will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="partnerships-tab">
      <p className="text-xs text-muted-foreground/50">
        {inquiries.length} inquir{inquiries.length === 1 ? "y" : "ies"} received
      </p>

      {inquiries.map((inq) => (
        <div
          key={inq.id}
          data-ocid={`partnership-card-${inq.id.slice(-6)}`}
          className={`glassmorphism rounded-xl p-5 border transition-all duration-200 ${
            inq.contacted
              ? "border-border opacity-60"
              : "border-teal/20 hover:border-teal/35"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center shrink-0">
              <Handshake className="h-5 w-5 text-teal/70" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground truncate">
                  {inq.orgName}
                </p>
                {inq.contacted && (
                  <span className="text-[10px] font-semibold bg-muted/50 text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                    Contacted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${
                    ORG_TYPE_COLORS[inq.orgType] ?? ORG_TYPE_COLORS.Other
                  }`}
                >
                  {inq.orgType}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {inq.contactName}
              </p>
              <a
                href={`mailto:${inq.email}`}
                className="text-xs text-teal hover:text-teal/80 transition-colors"
              >
                {inq.email}
              </a>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                {new Date(inq.submittedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {!inq.contacted && (
            <Button
              type="button"
              data-ocid={`partnership-contacted-btn-${inq.id.slice(-6)}`}
              onClick={() => markContacted(inq.id)}
              className="mt-3 w-full h-8 text-xs bg-muted/30 hover:bg-teal/10 border border-border hover:border-teal/30 text-muted-foreground hover:text-teal transition-all duration-200"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Mark as Contacted
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function FoodMenusTab() {
  const { isDemoMode } = useDemoMode();
  const [selectedStandId, setSelectedStandId] = React.useState<string | null>(
    null,
  );
  const [showCreateStand, setShowCreateStand] = React.useState(false);
  const [showAddItem, setShowAddItem] = React.useState(false);
  const [standForm, setStandForm] = React.useState({ name: "" });
  const [itemForm, setItemForm] = React.useState({
    name: "",
    description: "",
    priceDollars: "",
    category: "Food",
    available: true,
  });

  const { data: liveStands = [] } = useListStands();
  const stands = isDemoMode ? DEMO_STANDS : liveStands;

  const { data: liveItems = [] } = useListMenuItems(selectedStandId ?? "");
  const demoItems = selectedStandId
    ? ((DEMO_MENU_ITEMS as Record<string, unknown[]>)[selectedStandId] ?? [])
    : [];
  const items = isDemoMode ? demoItems : liveItems;

  const createStand = useCreateStand();
  const deleteStand = useDeleteStand();
  const addItem = useAddMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const handleCreateStand = async () => {
    if (!standForm.name.trim()) return;
    try {
      await createStand.mutateAsync({ name: standForm.name });
      toast.success("Concession stand created");
      setStandForm({ name: "" });
      setShowCreateStand(false);
    } catch {
      toast.error("Failed to create stand");
    }
  };

  const handleDeleteStand = async (id: string) => {
    if (!window.confirm("Delete this concession stand?")) return;
    try {
      await deleteStand.mutateAsync(id);
      toast.success("Stand deleted");
      if (selectedStandId === id) setSelectedStandId(null);
    } catch {
      toast.error("Failed to delete stand");
    }
  };

  const handleAddItem = async () => {
    if (!selectedStandId || !itemForm.name.trim()) return;
    const priceCents = BigInt(
      Math.round(Number.parseFloat(itemForm.priceDollars || "0") * 100),
    );
    try {
      await addItem.mutateAsync({
        standId: selectedStandId,
        name: itemForm.name,
        priceInCents: priceCents,
        description: itemForm.description,
      });
      toast.success("Menu item added");
      setItemForm({
        name: "",
        description: "",
        priceDollars: "",
        category: "Food",
        available: true,
      });
      setShowAddItem(false);
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleToggleAvailable = async (item: Record<string, unknown>) => {
    try {
      await updateItem.mutateAsync({
        id: item.id as string,
        standId: item.standId as string,
        name: item.name as string,
        priceInCents: BigInt(
          (item.priceInCents as number | bigint) ??
            (item.priceCents as number | bigint) ??
            0,
        ),
        description: (item.description as string) ?? "",
      });
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (item: Record<string, unknown>) => {
    if (!window.confirm("Delete this menu item?")) return;
    try {
      await deleteItem.mutateAsync({
        id: item.id as string,
        standId: item.standId as string,
      });
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left — Stands */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">Concession Stands</h3>
          <button
            type="button"
            onClick={() => setShowCreateStand((v) => !v)}
            className="bg-[#00E5CC]/20 hover:bg-[#00E5CC]/30 text-[#00E5CC] border border-[#00E5CC]/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
          >
            + New Stand
          </button>
        </div>

        {showCreateStand && (
          <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
            <input
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-white/40 focus:outline-none focus:border-[#00E5CC]/50"
              placeholder="Stand name"
              value={standForm.name}
              onChange={(e) =>
                setStandForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateStand}
                disabled={createStand.isPending}
                className="flex-1 bg-[#00E5CC]/20 hover:bg-[#00E5CC]/30 text-[#00E5CC] border border-[#00E5CC]/30 rounded-lg py-1.5 text-xs font-semibold"
              >
                {createStand.isPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateStand(false)}
                className="px-3 bg-muted/30 hover:bg-muted/50 text-muted-foreground border border-border rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(stands as Array<{ id: string; name: string }>).map((stand) => (
            <button
              key={stand.id}
              type="button"
              onClick={() => setSelectedStandId(stand.id)}
              className={`w-full text-left bg-muted/30 backdrop-blur-xl border rounded-xl p-3 cursor-pointer transition-all ${selectedStandId === stand.id ? "border-[#00E5CC]/50 bg-[#00E5CC]/5" : "border-border hover:border-border"}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-white text-sm font-medium">{stand.name}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteStand(stand.id);
                  }}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded border border-red-500/20 hover:bg-red-500/10 transition-all"
                >
                  Delete
                </button>
              </div>
            </button>
          ))}
          {stands.length === 0 && (
            <p className="text-white/40 text-sm text-center py-4">
              No stands yet. Create one above.
            </p>
          )}
        </div>
      </div>

      {/* Right — Menu Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold">
            {selectedStandId ? "Menu Items" : "Select a Stand"}
          </h3>
          {selectedStandId && (
            <button
              type="button"
              onClick={() => setShowAddItem((v) => !v)}
              className="bg-[#00E5CC]/20 hover:bg-[#00E5CC]/30 text-[#00E5CC] border border-[#00E5CC]/30 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
            >
              + Add Item
            </button>
          )}
        </div>

        {showAddItem && selectedStandId && (
          <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
            <input
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-white/40 focus:outline-none focus:border-[#00E5CC]/50"
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <input
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-white/40 focus:outline-none focus:border-[#00E5CC]/50"
              placeholder="Description"
              value={itemForm.description}
              onChange={(e) =>
                setItemForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            <input
              type="number"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-white/40 focus:outline-none focus:border-[#00E5CC]/50"
              placeholder="Price ($)"
              value={itemForm.priceDollars}
              onChange={(e) =>
                setItemForm((f) => ({ ...f, priceDollars: e.target.value }))
              }
            />
            <select
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#00E5CC]/50"
              value={itemForm.category}
              onChange={(e) =>
                setItemForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value="Food">Food</option>
              <option value="Drinks">Drinks</option>
              <option value="Snacks">Snacks</option>
            </select>
            <label className="flex items-center gap-2 text-muted-foreground text-sm">
              <input
                type="checkbox"
                checked={itemForm.available}
                onChange={(e) =>
                  setItemForm((f) => ({ ...f, available: e.target.checked }))
                }
              />
              Available
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddItem}
                disabled={addItem.isPending}
                className="flex-1 bg-[#00E5CC]/20 hover:bg-[#00E5CC]/30 text-[#00E5CC] border border-[#00E5CC]/30 rounded-lg py-1.5 text-xs font-semibold"
              >
                {addItem.isPending ? "Adding…" : "Add Item"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="px-3 bg-muted/30 hover:bg-muted/50 text-muted-foreground border border-border rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!selectedStandId ? (
          <p className="text-white/40 text-sm text-center py-8">
            Click a stand on the left to manage its menu.
          </p>
        ) : (
          <div className="space-y-2">
            {(items as Array<Record<string, unknown>>).map((item) => (
              <div
                key={item.id as string}
                className="bg-muted/30 backdrop-blur-xl border border-border rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {item.name as string}
                    </p>
                    {!!item.description && (
                      <p className="text-white/50 text-xs mt-0.5 truncate">
                        {String(item.description)}
                      </p>
                    )}
                    <p className="text-[#00E5CC] text-xs mt-1">
                      $
                      {(
                        Number(
                          (item.priceCents as bigint | number) ??
                            (item.priceInCents as bigint | number) ??
                            0,
                        ) / 100
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleToggleAvailable(item)}
                      className={`text-xs px-2 py-1 rounded border transition-all ${item.available !== false ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
                    >
                      {item.available !== false ? "Available" : "Unavailable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteItem(item)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition-all"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-white/40 text-sm text-center py-4">
                No items yet. Add one above.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
