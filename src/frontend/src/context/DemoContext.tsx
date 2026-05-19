import { KYCStatus } from "@/backend";
import type { UserProfile } from "@/backend";
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

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "demoMode";

interface DemoContextValue {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  isDemoMode: false,
  enterDemoMode: () => {},
  exitDemoMode: () => {},
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Synchronous lazy initializer — reads localStorage on the FIRST render
  // so demo state is correct before any children paint.
  // This eliminates the useEffect flicker where isDemoMode starts as false
  // then snaps to true after mount (race condition on the login screen).
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  const enterDemoMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsDemoMode(false);
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
    <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode(): DemoContextValue {
  return useContext(DemoContext);
}
