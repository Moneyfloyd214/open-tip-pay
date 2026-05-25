// ─── Fan Points & Rewards Type Definitions ──────────────────────────────────
// Mirrors the backend Motoko types for Fan Points, Rewards, and Analytics.

export type RewardType =
  | "discountCode"
  | "ticketEntry"
  | "concessionCredit"
  | "other";

export interface FanPoints {
  userId: string; // Principal as string
  points: number; // float, 3 decimal precision
  totalEarned: number;
  totalRedeemed: number;
  guestContact: string | null;
}

// ─── Fractional Points Engine ─────────────────────────────────────────────────

export type PointsRuleType =
  | "tipMultiplier"
  | "foodMultiplier"
  | "paymentMultiplier"
  | "gameDayBonus"
  | "firstPaymentBonus"
  | "sectionMultiplier";

export interface PointsRule {
  id: string;
  name: string;
  description: string;
  ruleType: PointsRuleType;
  multiplier: number;
  isActive: boolean;
  createdAt: bigint;
  sectionName?: string;
}

export interface PointsBreakdown {
  basePoints: number;
  appliedRules: Array<[string, number, string?]>;
  finalPoints: number;
  transactionType: string;
  amountCents: bigint;
}

export interface DemoPointTransaction {
  id: string;
  type: "tip" | "food" | "payment";
  amountCents: number;
  description: string;
  isGameDay: boolean;
  isFirstPayment: boolean;
  timestamp: Date;
  breakdown: PointsBreakdown;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: bigint;
  rewardType: RewardType;
  codeOrValue: string;
  quantity: bigint | null;
  quantityRemaining: bigint | null;
  expiresAt: bigint | null;
  active: boolean;
  createdBy: string; // Principal as string
  teamId: string | null;
}

export interface RedeemedReward {
  id: string;
  userId: string; // Principal as string
  rewardId: string;
  rewardTitle: string;
  codeOrValue: string;
  redeemedAt: bigint;
  emailSent: boolean;
  contactEmail: string | null;
}

export interface StaffSection {
  staffId: string; // Principal as string
  managerId: string; // Principal as string
  sectionName: string;
  sectionLabel: string;
  assignedAt: bigint;
}

export interface SectionAnalytics {
  sectionName: string;
  sectionLabel: string;
  totalTips: bigint;
  totalAmount: bigint;
  staffCount: bigint;
  topStaffId: string | null; // Principal as string
}

export interface StaffAnalytics {
  staffId: string; // Principal as string
  totalTips: bigint;
  totalAmount: bigint;
  sectionName: string;
  sectionLabel: string;
}

export interface GuestPaymentRecord {
  id: string;
  recipientId: string; // Principal as string
  amount: bigint;
  contactInfo: string;
  contactType: "phone" | "email";
  fanPointsAwarded: bigint;
  timestamp: bigint;
  converted: boolean;
  convertedUserId: string | null; // Principal as string
}

// ─── Plaid Merchant (per-merchant point multipliers) ──────────────────────────

export type MerchantCategory =
  | "Food"
  | "Drinks"
  | "Merchandise"
  | "Parking"
  | "Snacks";

export interface PlaidMerchant {
  id: string;
  name: string;
  category: MerchantCategory;
  location: string;
  multiplier: number;
  isActive: boolean;
}

export interface UnifiedStandMerchant {
  id: string;
  name: string;
  section: string;
  category: MerchantCategory;
  multiplier: number;
  isActive: boolean;
  createdAt?: bigint;
}

export interface CreateRewardParams {
  title: string;
  description: string;
  pointsCost: bigint;
  rewardType: RewardType;
  codeOrValue: string;
  quantity: bigint | null;
  expiresAt: bigint | null;
  teamId: string | null;
}

export interface RecordGuestPaymentParams {
  recipientId: string;
  amount: bigint;
  contactInfo: string;
  contactType: "phone" | "email";
}

export interface AssignStaffSectionParams {
  staffId: string;
  sectionName: string;
  sectionLabel: string;
}
