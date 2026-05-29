// Local type definitions replacing the ICP canister backend types.
// These mirror the shape used across the frontend without any Dfinity dependencies.

export type KYCStatus = "none" | "pending" | "verified" | "rejected";

export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  isVerified: boolean;
  isFirstWalletConnection: boolean;
  kycStatus: KYCStatus;
  phoneNumber: string;
}

export interface SearchResult {
  username: string;
  displayName: string;
  avatarUrl: string;
  principal: string;
}

export interface Status {
  text: string;
  emoji: string;
  expiresAt?: bigint;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export interface Tip {
  id: string;
  fromUser: string;
  toUser: string;
  amount: bigint;
  message: string;
  professional: boolean;
  timestamp: bigint;
  currencyType: Variant_fiat_crypto;
}

export type Variant_fiat_crypto = "fiat" | "crypto";
export const Variant_fiat_crypto = { fiat: "fiat" as Variant_fiat_crypto, crypto: "crypto" as Variant_fiat_crypto };

export interface StripeConfiguration {
  publishableKey: string;
  secretKey: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ActiveSession {
  sessionId: string;
  deviceName: string;
  lastSeen: bigint;
  ipAddress: string;
}

export interface BiometricSettings {
  enabled: boolean;
  type: string;
}

export interface EncryptionEvent {
  eventType: string;
  timestamp: bigint;
  details: string;
}

export interface FraudAlert {
  id: string;
  severity: string;
  message: string;
  timestamp: bigint;
}

export interface SecurityEvent {
  id: string;
  type: string;
  timestamp: bigint;
  details: string;
}

export type CompilationStatus = { status: "ok" | "error"; message?: string };

export interface TwoFactorSettings {
  enabled: boolean;
  method: string;
  phoneNumber?: string;
}

export interface PinCheckResult {
  isValid: boolean;
}

export interface MoneyRequest {
  id: bigint;
  fromUser: string;
  toUser: string;
  amount: bigint;
  message: string;
  currencyType: string;
  status: RequestStatus;
  createdAt: bigint;
}

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface VaultStatus {
  isLocked: boolean;
  unlockRequestAt?: bigint;
  lockedAt?: bigint;
  hasAlert?: boolean;
}

export interface BusinessApplication {
  businessName: string;
  businessType: string;
  description: string;
  termsAccepted: boolean;
  status: "pending" | "approved" | "rejected";
  submittedAt: bigint;
}

export interface SmartReceipt {
  id: string;
  month: number;
  year: number;
  totalIncome: bigint;
  transactions: unknown[];
}

export interface VoicePrintData {
  enrolled: boolean;
  enrolledAt?: bigint;
}

export interface AIQuery {
  queryText: string;
  response: string;
  timestamp: bigint;
}

// ─── Extended Staff Member ────────────────────────────────────────────────────

export interface ExtendedStaffMember {
  id: string;
  name: string;
  customRole: string;
  employmentType: string;
  employmentStatus: string;
  section: string;
  phone: string;
  email: string;
  hireDate: bigint;
  notes: string;
}

// ─── Points Breakdown ─────────────────────────────────────────────────────────

export interface PointsBreakdown {
  basePoints: number;
  appliedRules: Array<[string, number, string?]>;
  finalPoints: number;
  transactionType: string;
  amountCents: bigint;
}

// ─── Variant helpers (previously enum-like constructs in backend.ts) ──────────

export const KYCStatus = {
  none: "none" as KYCStatus,
  pending: "pending" as KYCStatus,
  verified: "verified" as KYCStatus,
  rejected: "rejected" as KYCStatus,
};

export const Variant_active_inactive_suspended = {
  active: "active",
  inactive: "inactive",
  suspended: "suspended",
} as const;

export const Variant_partTime_fullTime_contractor = {
  partTime: "partTime",
  fullTime: "fullTime",
  contractor: "contractor",
} as const;

export const SplitPaymentStatus = {
  pending: "pending",
  completed: "completed",
  cancelled: "cancelled",
  Active: "Active",
  Settled: "Settled",
  Cancelled: "Cancelled",
} as const;

export const SplitParticipantStatus = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
} as const;

export type UpdateRewardParams = {
  active: boolean;
};

export interface PartnerBrandingConfig {
  partnerName: string;
  primaryColor: string;
  secondaryColor: string;
  partnerLogoUrl: string;
  isActive: boolean;
}

export const BusinessApplicationStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;
export type BusinessApplicationStatus = (typeof BusinessApplicationStatus)[keyof typeof BusinessApplicationStatus];

export const PaymentMethodType = {
  card: "card",
  bankAccount: "bankAccount",
  crypto: "crypto",
} as const;
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];
