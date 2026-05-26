import {
  type ExtendedStaffMember,
  KYCStatus,
  Variant_active_inactive_suspended,
  Variant_partTime_fullTime_contractor,
} from "@/backend";
import type {
  ConcessionStand,
  FoodOrder,
  MenuItem,
  UserProfile,
} from "@/backend";
import type {
  PlaidMerchant,
  PointsRule,
  UnifiedStandMerchant,
} from "@/types/fanpoints";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ─── Demo data types ──────────────────────────────────────────────────────────

export interface DemoTransaction {
  id: string;
  type: "received" | "sent" | "deposit" | "split";
  amount: number;
  counterparty: string;
  message: string;
  timestamp: Date;
  professional: boolean;
  status: "completed" | "pending";
}

export interface DemoSpendingLimits {
  weekly: number;
  used: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const DEMO_PROFILE: UserProfile = {
  username: "Alex Johnson",
  email: "alex@demo.com",
  bio: "Open Tip Pay demo account",
  isVerified: true,
  isFirstWalletConnection: false,
  kycStatus: KYCStatus.verified,
  phoneNumber: "+1 (555) 867-5309",
};

/** Demo balance in cents as a bigint (mirrors canister representation) */
export const DEMO_BALANCE_BIGINT: bigint = BigInt(125000);
export const DEMO_SAVINGS_BALANCE: number = 320.0;
export const DEMO_SPENDING_LIMITS: DemoSpendingLimits = {
  weekly: 500,
  used: 180,
};

const now = Date.now();
const mins = (n: number) => n * 60 * 1000;
const hours = (n: number) => n * 60 * mins(1);
const days = (n: number) => n * 24 * hours(1);

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  {
    id: "dt-1",
    type: "received",
    amount: 25.0,
    counterparty: "Maria Garcia",
    message: "Thanks for the amazing haircut! You're the best 💈",
    timestamp: new Date(now - mins(45)),
    professional: true,
    status: "completed",
  },
  {
    id: "dt-2",
    type: "sent",
    amount: 12.5,
    counterparty: "James Williams",
    message: "Lunch split — Thai place on Main St",
    timestamp: new Date(now - hours(3)),
    professional: false,
    status: "completed",
  },
  {
    id: "dt-3",
    type: "deposit",
    amount: 850.0,
    counterparty: "Acme Corp Payroll",
    message: "Direct deposit — bi-weekly paycheck",
    timestamp: new Date(now - days(1)),
    professional: false,
    status: "completed",
  },
  {
    id: "dt-4",
    type: "received",
    amount: 40.0,
    counterparty: "David Chen",
    message: "Great massage session — highly recommend! ⭐",
    timestamp: new Date(now - days(1) - hours(2)),
    professional: true,
    status: "completed",
  },
  {
    id: "dt-5",
    type: "split",
    amount: 18.75,
    counterparty: "Sofia Martinez +2",
    message: "Dinner at Blue Harbor — split 4 ways",
    timestamp: new Date(now - days(2)),
    professional: false,
    status: "completed",
  },
  {
    id: "dt-6",
    type: "sent",
    amount: 5.0,
    counterparty: "Emma Thompson",
    message: "Coffee tip — best barista in town ☕",
    timestamp: new Date(now - days(3)),
    professional: true,
    status: "completed",
  },
  {
    id: "dt-7",
    type: "received",
    amount: 15.0,
    counterparty: "Noah Davis",
    message: "Payment for dog walking this week 🐕",
    timestamp: new Date(now - days(4)),
    professional: true,
    status: "completed",
  },
];

// ─── Food Ordering Demo Data ─────────────────────────────────────────────────

export const DEMO_STANDS: ConcessionStand[] = [
  {
    id: "stand-1",
    name: "Lucas Oil Grill",
    createdAt: BigInt(0),
    section: "Main Concourse",
    description: "",
  },
  {
    id: "stand-2",
    name: "End Zone Bites",
    createdAt: BigInt(0),
    section: "End Zone",
    description: "",
  },
  {
    id: "stand-3",
    name: "Colts Fan Eats",
    createdAt: BigInt(0),
    section: "North Gate",
    description: "",
  },
];

export const DEMO_MENU_ITEMS: Record<string, MenuItem[]> = {
  "stand-1": [
    {
      id: "item-101",
      standId: "stand-1",
      name: "Classic Cheeseburger",
      description: "Juicy beef patty with cheddar, lettuce, and tomato",
      priceInCents: BigInt(1299),
      category: "Food",
      available: true,
    },
    {
      id: "item-102",
      standId: "stand-1",
      name: "Loaded Hot Dog",
      description: "All-beef dog with stadium mustard and onions",
      priceInCents: BigInt(699),
      category: "Food",
      available: true,
    },
    {
      id: "item-103",
      standId: "stand-1",
      name: "Soft Pretzel",
      description: "Giant salted pretzel served with beer cheese dip",
      priceInCents: BigInt(849),
      category: "Food",
      available: true,
    },
  ],
  "stand-2": [
    {
      id: "item-201",
      standId: "stand-2",
      name: "Nachos Supreme",
      description: "Tortilla chips with jalapeños, cheese, and salsa",
      priceInCents: BigInt(1099),
      category: "Food",
      available: true,
    },
    {
      id: "item-202",
      standId: "stand-2",
      name: "BBQ Pulled Pork Sandwich",
      description: "Slow-cooked pork on a brioche bun with slaw",
      priceInCents: BigInt(1399),
      category: "Food",
      available: true,
    },
    {
      id: "item-203",
      standId: "stand-2",
      name: "Garlic Fries",
      description: "Crispy fries tossed in garlic butter and parsley",
      priceInCents: BigInt(599),
      category: "Food",
      available: true,
    },
  ],
  "stand-3": [
    {
      id: "item-301",
      standId: "stand-3",
      name: "Buffalo Wings (6pc)",
      description: "Crispy wings tossed in house buffalo sauce",
      priceInCents: BigInt(1249),
      category: "Food",
      available: true,
    },
    {
      id: "item-302",
      standId: "stand-3",
      name: "Stadium Popcorn",
      description: "Freshly popped with your choice of seasoning",
      priceInCents: BigInt(499),
      category: "Food",
      available: true,
    },
    {
      id: "item-303",
      standId: "stand-3",
      name: "Fountain Drink",
      description: "32oz fountain drink — your choice of flavor",
      priceInCents: BigInt(449),
      category: "Food",
      available: true,
    },
  ],
};

export const DEMO_ACTIVE_ORDER: FoodOrder = {
  id: "order-demo-1",
  // Use raw string literals so this module-level constant is safe to
  // construct before the backend canister has initialized (e.g. /kitchen).
  status: "Preparing" as FoodOrder["status"],
  standId: "stand-1",
  createdAt: BigInt(0),
  deliveryMethod: "Delivery" as FoodOrder["deliveryMethod"],
  updatedAt: BigInt(0),
  totalInCents: BigInt(2148),
  customerId: {
    _isPrincipal: true,
    toText: () => "demo-user",
    toUint8Array: () => new Uint8Array([0]),
    compareTo: () => 0,
  } as unknown as import("@dfinity/principal").Principal,
  items: [
    {
      itemId: "item-101",
      itemName: "Classic Cheeseburger",
      quantity: BigInt(1),
      priceInCents: BigInt(1299),
    },
    {
      itemId: "item-103",
      itemName: "Soft Pretzel",
      quantity: BigInt(1),
      priceInCents: BigInt(849),
    },
  ],
  seatNumber: "Section 114, Row F, Seat 22",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "demoMode";

interface DemoContextValue {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  /** Ephemeral — resets each time demo mode is entered. Controls whether the
   *  intro OnboardingSlides have been shown in the current demo session. */
  demoOnboardingDone: boolean;
  setDemoOnboardingDone: (done: boolean) => void;
}

export const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
  demoOnboardingDone: false,
  setDemoOnboardingDone: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Synchronous lazy initializer — reads localStorage on the FIRST render
  // so demo state is correct before any children paint.
  // This eliminates the useEffect flicker where isDemoMode starts as false
  // then snaps to true after mount (race condition on the login screen).
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  // Ephemeral — reset to false each time demo mode is freshly entered
  const [demoOnboardingDone, setDemoOnboardingDone] = useState(false);

  const enterDemoMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDemoMode(true);
    setDemoOnboardingDone(false); // always re-show slides on fresh demo entry
  }, []);

  const exitDemoMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsDemoMode(false);
    setDemoOnboardingDone(false);
  }, []);

  // Keep state in sync if another tab clears the flag
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setIsDemoMode(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        demoOnboardingDone,
        setDemoOnboardingDone,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode(): DemoContextValue {
  return useContext(DemoContext);
}
// ─── Demo Staff Roster Data ──────────────────────────────────────────────────

export interface DemoStaffEntry {
  id: string;
  displayName: string;
  role: string;
  status: "active" | "pending";
  joinedDaysAgo: number;
}

export const DEMO_STAFF_ROSTER: DemoStaffEntry[] = [
  {
    id: "demo-staff-1",
    displayName: "Marcus Davis",
    role: "Suite Runner",
    status: "active",
    joinedDaysAgo: 45,
  },
  {
    id: "demo-staff-2",
    displayName: "Priya Patel",
    role: "Concession Staff",
    status: "active",
    joinedDaysAgo: 30,
  },
  {
    id: "demo-staff-3",
    displayName: "Tyrone Jackson",
    role: "Valet",
    status: "active",
    joinedDaysAgo: 60,
  },
  {
    id: "demo-staff-4",
    displayName: "Sara Nguyen",
    role: "Usher",
    status: "active",
    joinedDaysAgo: 12,
  },
];

/** Demo tip totals per staff member for each date range.
 *  Keys match DEMO_STAFF_ROSTER ids. Values: [game, week, allTime] in cents. */
export const DEMO_STAFF_TIPS: Record<string, [number, number, number]> = {
  "demo-staff-1": [4750, 18200, 124000],
  "demo-staff-2": [3200, 14600, 98500],
  "demo-staff-3": [5100, 22400, 157000],
  "demo-staff-4": [1850, 9750, 61200],
  "demo-staff-5": [6200, 27100, 189500],
  "demo-staff-6": [2300, 11200, 74000],
};

// ─── Extended Staff Roster (backend-shape) ───────────────────────────────────

export const DEMO_EXTENDED_STAFF: ExtendedStaffMember[] = [
  {
    id: "ext-staff-1",
    name: "Marcus Williams",
    customRole: "Suite Runner",
    employmentType: Variant_partTime_fullTime_contractor.fullTime,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "VIP Suites",
    phone: "+1 (317) 555-0101",
    email: "marcus.williams@colts-staff.com",
    hireDate: BigInt(1693526400000),
    notes: "Top performer, VIP suite level",
    tipsCertified: true,
  } as ExtendedStaffMember & { tipsCertified?: boolean },
  {
    id: "ext-staff-2",
    name: "DeShawn Carter",
    customRole: "Valet",
    employmentType: Variant_partTime_fullTime_contractor.partTime,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "Main Entrance",
    phone: "+1 (317) 555-0102",
    email: "deshawn.carter@colts-staff.com",
    hireDate: BigInt(1696118400000),
    notes: "Main entrance valet lead",
    tipsCertified: true,
  } as ExtendedStaffMember & { tipsCertified?: boolean },
  {
    id: "ext-staff-3",
    name: "Tyler Brooks",
    customRole: "Concession Staff",
    employmentType: Variant_partTime_fullTime_contractor.partTime,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "Section 103",
    phone: "+1 (317) 555-0103",
    email: "tyler.brooks@colts-staff.com",
    hireDate: BigInt(1698796800000),
    notes: "Lucas Oil Grill concessions",
  },
  {
    id: "ext-staff-4",
    name: "Angela Martinez",
    customRole: "Usher",
    employmentType: Variant_partTime_fullTime_contractor.partTime,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "Lower Bowl",
    phone: "+1 (317) 555-0104",
    email: "angela.martinez@colts-staff.com",
    hireDate: BigInt(1701388800000),
    notes: "Lower bowl entrance coordinator",
  },
  {
    id: "ext-staff-5",
    name: "Jordan Reed",
    customRole: "Security",
    employmentType: Variant_partTime_fullTime_contractor.fullTime,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "Gate B",
    phone: "+1 (317) 555-0105",
    email: "jordan.reed@colts-staff.com",
    hireDate: BigInt(1688169600000),
    notes: "Gate B lead security officer",
  },
  {
    id: "ext-staff-6",
    name: "Keisha Thompson",
    customRole: "Event Coordinator",
    employmentType: Variant_partTime_fullTime_contractor.contractor,
    employmentStatus: Variant_active_inactive_suspended.active,
    section: "Field Level",
    phone: "+1 (317) 555-0106",
    email: "keisha.thompson@colts-staff.com",
    hireDate: BigInt(1704067200000),
    notes: "Field level event and hospitality",
  },
];

// ─── Plaid Merchants (per-merchant Fan Point multipliers) ───────────────────────

export const DEMO_PLAID_MERCHANTS: PlaidMerchant[] = [
  {
    id: "merch-1",
    name: "Club Level Grill",
    category: "Food",
    location: "Club Level, Section 224",
    multiplier: 2.5,
    isActive: true,
  },
  {
    id: "merch-2",
    name: "Suite Level Bar",
    category: "Drinks",
    location: "VIP Suite Concourse",
    multiplier: 3.0,
    isActive: true,
  },
  {
    id: "merch-3",
    name: "Colts Pro Shop",
    category: "Merchandise",
    location: "Gate A, Main Concourse",
    multiplier: 2.0,
    isActive: true,
  },
  {
    id: "merch-4",
    name: "End Zone Concessions",
    category: "Food",
    location: "End Zone, Sections 101-110",
    multiplier: 1.5,
    isActive: true,
  },
  {
    id: "merch-5",
    name: "General Concessions",
    category: "Food",
    location: "Main Concourse",
    multiplier: 1.0,
    isActive: true,
  },
  {
    id: "merch-6",
    name: "Stadium Parking — General",
    category: "Parking",
    location: "General Parking Lots A–D",
    multiplier: 0.5,
    isActive: true,
  },
  {
    id: "merch-7",
    name: "Stadium Parking — VIP",
    category: "Parking",
    location: "VIP Parking Garage",
    multiplier: 0.75,
    isActive: true,
  },
  {
    id: "merch-8",
    name: "Gate A Snack Stand",
    category: "Snacks",
    location: "Gate A Entrance",
    multiplier: 1.25,
    isActive: true,
  },
  {
    id: "merch-9",
    name: "Lucas Oil Valet",
    category: "Valet",
    location: "Stadium Entrance",
    multiplier: 1.0,
    isActive: true,
  },
  {
    id: "merch-10",
    name: "VIP Valet Service",
    category: "Valet",
    location: "VIP Entrance",
    multiplier: 1.5,
    isActive: true,
  },
  {
    id: "merch-11",
    name: "Ticketing Kiosk",
    category: "Ticketing",
    location: "Gate A Ticketing",
    multiplier: 0.75,
    isActive: true,
  },
  {
    id: "merch-12",
    name: "Seat Upgrade Kiosk",
    category: "Ticketing",
    location: "Gate C Ticketing",
    multiplier: 1.25,
    isActive: true,
  },
  {
    id: "merch-13",
    name: "Colts Team Store",
    category: "ProShop",
    location: "Main Concourse",
    multiplier: 2.0,
    isActive: true,
  },
  {
    id: "merch-14",
    name: "Colts Pro Shop Express",
    category: "ProShop",
    location: "Upper Deck",
    multiplier: 1.75,
    isActive: true,
  },
  {
    id: "merch-15",
    name: "Stadium Gift Shop",
    category: "Merchandise",
    location: "Gate B",
    multiplier: 1.5,
    isActive: true,
  },
  {
    id: "merch-16",
    name: "Field Level Bar",
    category: "Drinks",
    location: "Field Level",
    multiplier: 2.5,
    isActive: true,
  },
  {
    id: "merch-17",
    name: "Club Level Restaurant",
    category: "Food",
    location: "Club Level",
    multiplier: 2.0,
    isActive: true,
  },
  {
    id: "merch-18",
    name: "Upper Deck Grill",
    category: "Food",
    location: "Upper Deck",
    multiplier: 1.25,
    isActive: true,
  },
  {
    id: "merch-19",
    name: "Halftime Zone Bar",
    category: "Drinks",
    location: "Section 108",
    multiplier: 1.75,
    isActive: true,
  },
  {
    id: "merch-20",
    name: "Event Parking Lot A",
    category: "ParkingUpgrade",
    location: "Lot A",
    multiplier: 0.5,
    isActive: true,
  },
  {
    id: "merch-21",
    name: "Event Parking Lot B (VIP)",
    category: "ParkingUpgrade",
    location: "VIP Lot B",
    multiplier: 1.0,
    isActive: true,
  },
  {
    id: "merch-22",
    name: "Stadium ATM / Services",
    category: "Services",
    location: "Various Locations",
    multiplier: 0.25,
    isActive: true,
  },
];

export const DEMO_UNIFIED_STANDS_MERCHANTS: UnifiedStandMerchant[] = [
  {
    id: "stand-1",
    name: "Lucas Oil Grill",
    section: "Main Concourse",
    category: "Food",
    multiplier: 1.5,
    isActive: true,
  },
  {
    id: "stand-2",
    name: "End Zone Bites",
    section: "End Zone",
    category: "Food",
    multiplier: 1.25,
    isActive: true,
  },
  {
    id: "stand-3",
    name: "Colts Fan Eats",
    section: "North Gate",
    category: "Food",
    multiplier: 1.0,
    isActive: true,
  },
  {
    id: "merch-1",
    name: "Club Level Grill",
    section: "Club Level",
    category: "Food",
    multiplier: 2.5,
    isActive: true,
  },
  {
    id: "merch-2",
    name: "Suite Level Bar",
    section: "Suite Level",
    category: "Drinks",
    multiplier: 3.0,
    isActive: true,
  },
  {
    id: "merch-3",
    name: "Colts Pro Shop",
    section: "Main Gate",
    category: "Merchandise",
    multiplier: 2.0,
    isActive: true,
  },
  {
    id: "merch-5",
    name: "General Concessions",
    section: "General",
    category: "Food",
    multiplier: 1.0,
    isActive: true,
  },
  {
    id: "merch-6",
    name: "Stadium Parking — General",
    section: "Exterior",
    category: "Parking",
    multiplier: 0.5,
    isActive: true,
  },
  {
    id: "merch-7",
    name: "Stadium Parking — VIP",
    section: "VIP Lot",
    category: "Parking",
    multiplier: 0.75,
    isActive: true,
  },
  {
    id: "merch-8",
    name: "Gate A Snack Stand",
    section: "Gate A",
    category: "Snacks",
    multiplier: 1.25,
    isActive: true,
  },
];

// ─── Fan Points Rules ────────────────────────────────────────────────────────

export const DEMO_POINTS_RULES: PointsRule[] = [
  {
    id: "rule-tip",
    name: "Stadium Staff Tip Bonus",
    description: "Earn extra for tipping Colts staff",
    ruleType: "tipMultiplier",
    multiplier: 1.5,
    isActive: true,
    createdAt: BigInt(0),
  },
  {
    id: "rule-food",
    name: "Food Order Points",
    description: "Points for every food order",
    ruleType: "foodMultiplier",
    multiplier: 1.0,
    isActive: true,
    createdAt: BigInt(0),
  },
  {
    id: "rule-payment",
    name: "General Payment Points",
    description: "Points for general payments",
    ruleType: "paymentMultiplier",
    multiplier: 0.75,
    isActive: true,
    createdAt: BigInt(0),
  },
  {
    id: "rule-gameday",
    name: "Game Day Bonus",
    description: "1.25x multiplier on game day transactions",
    ruleType: "gameDayBonus",
    multiplier: 1.25,
    isActive: true,
    createdAt: BigInt(0),
  },
  {
    id: "rule-first",
    name: "First Payment Bonus",
    description: "2x points on your first payment",
    ruleType: "firstPaymentBonus",
    multiplier: 2.0,
    isActive: true,
    createdAt: BigInt(0),
  },
  {
    id: "rule-section-vip",
    name: "VIP Suite Section",
    description: "Fans earn 3x points when tipping staff in VIP Suite",
    ruleType: "sectionMultiplier",
    multiplier: 3.0,
    isActive: true,
    createdAt: BigInt(0),
    sectionName: "VIP Suite",
  },
  {
    id: "rule-section-field",
    name: "Field Level Section",
    description: "Fans earn 2x points when tipping staff in Field Level",
    ruleType: "sectionMultiplier",
    multiplier: 2.0,
    isActive: true,
    createdAt: BigInt(0),
    sectionName: "Field Level",
  },
  {
    id: "rule-section-upper",
    name: "Upper Deck Section",
    description: "Fans earn 1x points when tipping staff in Upper Deck",
    ruleType: "sectionMultiplier",
    multiplier: 1.0,
    isActive: true,
    createdAt: BigInt(0),
    sectionName: "Upper Deck",
  },
];

// ─── Demo Point Transactions (simulated) ─────────────────────────────────────

export interface DemoPointTransaction {
  id: string;
  date: string;
  description: string;
  type: "Tip" | "Food" | "Payment";
  amountDollars: number;
  isGameDay: boolean;
  isFirstPayment: boolean;
  basePoints: number;
  appliedRules: Array<{
    name: string;
    multiplier: number;
    sectionName?: string;
  }>;
  finalPoints: number;
  breakdown: string;
  sectionName?: string;
}

export const DEMO_POINT_TRANSACTIONS: DemoPointTransaction[] = [
  {
    id: "tx-1",
    date: "Nov 3, 2024",
    description: "Tip to Marcus Williams (Suite Runner)",
    type: "Tip",
    amountDollars: 5.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 5.0,
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 9.375,
    breakdown: "Tip ($5.00) × 1.5x Stadium Bonus × 1.25x Game Day = 9.375 pts",
  },
  {
    id: "tx-2",
    date: "Nov 3, 2024",
    description: "Food order — Lucas Oil Grill",
    type: "Food",
    amountDollars: 18.5,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 18.5,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 23.125,
    breakdown:
      "Food Order ($18.50) × 1.0x Food Multiplier × 1.25x Game Day = 23.125 pts",
  },
  {
    id: "tx-3",
    date: "Nov 3, 2024",
    description: "Tip to DeShawn Carter (Valet)",
    type: "Tip",
    amountDollars: 10.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 10.0,
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 18.75,
    breakdown: "Tip ($10.00) × 1.5x Stadium Bonus × 1.25x Game Day = 18.75 pts",
  },
  {
    id: "tx-4",
    date: "Oct 27, 2024",
    description: "Tip to Angela Martinez (Usher)",
    type: "Tip",
    amountDollars: 3.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 3.0,
    appliedRules: [{ name: "Stadium Staff Tip Bonus", multiplier: 1.5 }],
    finalPoints: 4.5,
    breakdown: "Tip ($3.00) × 1.5x Stadium Bonus = 4.5 pts",
  },
  {
    id: "tx-5",
    date: "Oct 20, 2024",
    description: "Payment — Split dinner with friends",
    type: "Payment",
    amountDollars: 25.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 25.0,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 18.75,
    breakdown: "Payment ($25.00) × 0.75x General Payment = 18.75 pts",
  },
  {
    id: "tx-6",
    date: "Oct 13, 2024",
    description: "First ever payment (welcome bonus!)",
    type: "Payment",
    amountDollars: 15.0,
    isGameDay: false,
    isFirstPayment: true,
    basePoints: 15.0,
    appliedRules: [
      { name: "General Payment Points", multiplier: 0.75 },
      { name: "First Payment Bonus", multiplier: 2.0 },
    ],
    finalPoints: 22.5,
    breakdown:
      "First Payment ($15.00) × 0.75x General × 2.0x First-Timer = 22.5 pts",
  },
  {
    id: "tx-7",
    date: "Nov 10, 2024",
    description: "Food order — End Zone Bites",
    type: "Food",
    amountDollars: 22.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 22.0,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 27.5,
    breakdown:
      "Food Order ($22.00) × 1.0x Food Multiplier × 1.25x Game Day = 27.5 pts",
  },
  {
    id: "tx-8",
    date: "Nov 10, 2024",
    description: "Tip to Tyler Brooks (Concession Staff)",
    type: "Tip",
    amountDollars: 4.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 4.0,
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 7.5,
    breakdown: "Tip ($4.00) × 1.5x Stadium Bonus × 1.25x Game Day = 7.5 pts",
  },
  {
    id: "tx-9",
    date: "Nov 17, 2024",
    description: "Food order — Colts Fan Eats",
    type: "Food",
    amountDollars: 14.75,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 14.75,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 18.4375,
    breakdown:
      "Food Order ($14.75) × 1.0x Food Multiplier × 1.25x Game Day = 18.4375 pts",
  },
  {
    id: "tx-10",
    date: "Nov 17, 2024",
    description: "Tip to Jordan Reed (Security)",
    type: "Tip",
    amountDollars: 6.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 6.0,
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 11.25,
    breakdown: "Tip ($6.00) × 1.5x Stadium Bonus × 1.25x Game Day = 11.25 pts",
  },
  {
    id: "tx-11",
    date: "Nov 12, 2024",
    description: "Payment — Coffee shop tip",
    type: "Payment",
    amountDollars: 3.5,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 3.5,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 2.625,
    breakdown: "Payment ($3.50) × 0.75x General Payment = 2.625 pts",
  },
  {
    id: "tx-12",
    date: "Nov 8, 2024",
    description: "Payment — Lunch split with coworkers",
    type: "Payment",
    amountDollars: 12.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 12.0,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 9.0,
    breakdown: "Payment ($12.00) × 0.75x General Payment = 9.0 pts",
  },
  {
    id: "tx-13",
    date: "Nov 6, 2024",
    description: "Tip to Keisha Thompson (Event Coordinator)",
    type: "Tip",
    amountDollars: 8.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 8.0,
    appliedRules: [{ name: "Stadium Staff Tip Bonus", multiplier: 1.5 }],
    finalPoints: 12.0,
    breakdown: "Tip ($8.00) × 1.5x Stadium Bonus = 12.0 pts",
  },
  {
    id: "tx-14",
    date: "Nov 1, 2024",
    description: "Payment — Grocery store run",
    type: "Payment",
    amountDollars: 45.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 45.0,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 33.75,
    breakdown: "Payment ($45.00) × 0.75x General Payment = 33.75 pts",
  },
  {
    id: "tx-15",
    date: "Oct 27, 2024",
    description: "Food order — End Zone Bites (game day)",
    type: "Food",
    amountDollars: 31.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 31.0,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 38.75,
    breakdown:
      "Food Order ($31.00) × 1.0x Food Multiplier × 1.25x Game Day = 38.75 pts",
  },
  {
    id: "tx-16",
    date: "Oct 20, 2024",
    description: "Food order — Lucas Oil Grill (game day)",
    type: "Food",
    amountDollars: 9.5,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 9.5,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 11.875,
    breakdown:
      "Food Order ($9.50) × 1.0x Food Multiplier × 1.25x Game Day = 11.875 pts",
  },
  {
    id: "tx-17",
    date: "Oct 18, 2024",
    description: "Payment — Ride share tip",
    type: "Payment",
    amountDollars: 5.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 5.0,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 3.75,
    breakdown: "Payment ($5.00) × 0.75x General Payment = 3.75 pts",
  },
  {
    id: "tx-18",
    date: "Oct 13, 2024",
    description: "Tip to Marcus Williams (Suite Runner, game day)",
    type: "Tip",
    amountDollars: 20.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 20.0,
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 37.5,
    breakdown: "Tip ($20.00) × 1.5x Stadium Bonus × 1.25x Game Day = 37.5 pts",
  },
  {
    id: "tx-19",
    date: "Oct 10, 2024",
    description: "Payment — Online purchase split",
    type: "Payment",
    amountDollars: 19.99,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 19.99,
    appliedRules: [{ name: "General Payment Points", multiplier: 0.75 }],
    finalPoints: 14.9925,
    breakdown: "Payment ($19.99) × 0.75x General Payment = 14.9925 pts",
  },
  {
    id: "tx-20",
    date: "Oct 6, 2024",
    description: "Food order — Colts Fan Eats (game day)",
    type: "Food",
    amountDollars: 26.5,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 26.5,
    appliedRules: [
      { name: "Food Order Points", multiplier: 1.0 },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 33.125,
    breakdown:
      "Food Order ($26.50) × 1.0x Food Multiplier × 1.25x Game Day = 33.125 pts",
  },
  {
    id: "tx-21",
    date: "Nov 17, 2024",
    description: "Tip to Marcus Williams (VIP Suite Runner, game day)",
    type: "Tip",
    amountDollars: 5.0,
    isGameDay: true,
    isFirstPayment: false,
    basePoints: 5.0,
    sectionName: "VIP Suite",
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      { name: "VIP Suite Section", multiplier: 3.0, sectionName: "VIP Suite" },
      { name: "Game Day Bonus", multiplier: 1.25 },
    ],
    finalPoints: 28.125,
    breakdown:
      "Tip ($5.00) × 1.5x Tip × 3.0x VIP Suite Section × 1.25x Game Day = 28.125 pts",
  },
  {
    id: "tx-22",
    date: "Nov 10, 2024",
    description: "Tip to Keisha Thompson (Field Level Staff)",
    type: "Tip",
    amountDollars: 3.0,
    isGameDay: false,
    isFirstPayment: false,
    basePoints: 3.0,
    sectionName: "Field Level",
    appliedRules: [
      { name: "Stadium Staff Tip Bonus", multiplier: 1.5 },
      {
        name: "Field Level Section",
        multiplier: 2.0,
        sectionName: "Field Level",
      },
    ],
    finalPoints: 9.0,
    breakdown: "Tip ($3.00) × 1.5x Tip × 2.0x Field Level Section = 9.0 pts",
  },
];
