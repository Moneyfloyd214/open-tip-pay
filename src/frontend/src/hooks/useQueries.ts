import type { PointsRule, PointsRuleType } from "@/types/fanpoints";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDemoMode } from "../context/DemoContext";
import type {
  ExtendedStaffMember,
  PointsBreakdown,
} from "../types/local-backend";
import type {
  AIQuery,
  ActiveSession,
  BiometricSettings,
  BusinessApplication,
  CompilationStatus,
  EncryptionEvent,
  FraudAlert,
  KYCStatus,
  MoneyRequest,
  PaymentMethod,
  PinCheckResult,
  RequestStatus,
  SearchResult,
  SecurityEvent,
  ShoppingItem,
  SmartReceipt,
  Status,
  StripeConfiguration,
  Tip,
  TwoFactorSettings,
  UserProfile,
  Variant_fiat_crypto,
  VaultStatus,
  VoicePrintData,
} from "../types/local-backend";
import { supabase } from "../lib/supabase";

// ─── User Profile Queries ─────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (!data) return null;
      return {
        username: data.full_name ?? user.email ?? "",
        email: user.email ?? "",
        bio: data.bio ?? "",
        isVerified: false,
        isFirstWalletConnection: false,
        kycStatus: "none" as KYCStatus,
        phoneNumber: data.phone ?? "",
      } satisfies UserProfile;
    },
    staleTime: 60_000,
  });
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_profile: UserProfile) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetUserProfile(_userPrincipal: string | null) {
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", _userPrincipal],
    queryFn: async () => null,
    enabled: !!_userPrincipal,
  });
}

// ─── App Lock PIN Queries ─────────────────────────────────────────────────────

export function useHasExistingPin() {
  return useQuery<boolean>({
    queryKey: ["hasExistingPin"],
    queryFn: async () => false,
  });
}

export function useSetAppLockEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_enabled: boolean) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hasExistingPin"] });
    },
  });
}

export function useSetPinHash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { salt: Uint8Array; hash: Uint8Array }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hasExistingPin"] });
    },
  });
}

export function useVerifyPinHash() {
  return useMutation({
    mutationFn: async (_params: { salt: Uint8Array; hash: Uint8Array }): Promise<PinCheckResult> => {
      return { isValid: false } as PinCheckResult;
    },
  });
}

// ─── KYC Verification ────────────────────────────────────────────────────────

export function useSubmitKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Search Users ─────────────────────────────────────────────────────────────

export function useSearchUsers(searchTerm: string) {
  return useQuery<SearchResult[]>({
    queryKey: ["searchUsers", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${searchTerm.trim()}%`)
        .limit(10);
      return (data ?? []).map((p) => ({
        username: p.full_name ?? "",
        displayName: p.full_name ?? "",
        avatarUrl: p.avatar_url ?? "",
        principal: p.id,
      })) as SearchResult[];
    },
    enabled: searchTerm.trim().length > 0,
    staleTime: 30_000,
  });
}

// ─── Public Profile Queries ───────────────────────────────────────────────────

export function useGetPublicProfile(username: string | null) {
  return useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => null,
    enabled: !!username,
  });
}

export function useGetPublicProfileByPrincipal(_userPrincipal: string | null) {
  return useQuery({
    queryKey: ["publicProfileByPrincipal", _userPrincipal],
    queryFn: async () => null,
    enabled: !!_userPrincipal,
  });
}

// ─── Status Management ────────────────────────────────────────────────────────

export function useAddStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_status: Status) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentStatus"] });
    },
  });
}

export function useDeactivateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentStatus"] });
    },
  });
}

export function useGetCurrentStatus() {
  return useQuery<Status | null>({
    queryKey: ["currentStatus"],
    queryFn: async () => null,
  });
}

// ─── Wallet Management ────────────────────────────────────────────────────────

export function useSaveWalletAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_walletAddress: string) => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useRemoveWalletAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useMarkTutorialCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Payment Methods ──────────────────────────────────────────────────────────

export function useGetPaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods"],
    queryFn: async () => [],
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_method: PaymentMethod) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_methodId: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

export function useUpdatePaymentMethodVerificationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { methodId: string; status: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

// ─── Balance Queries ──────────────────────────────────────────────────────────

export function useGetBalance() {
  return useQuery<bigint>({
    queryKey: ["balance"],
    queryFn: async () => BigInt(0),
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_amount: bigint) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { amount: bigint; verifiedOtpId?: string | null }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// ─── Tip Queries ──────────────────────────────────────────────────────────────

export function useSendTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      toUser: string;
      amount: bigint;
      message: string;
      professional: boolean;
      currencyType: Variant_fiat_crypto;
    }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipsSent"] });
      queryClient.invalidateQueries({ queryKey: ["tipsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useGetTipsSent() {
  return useQuery<Tip[]>({
    queryKey: ["tipsSent"],
    queryFn: async () => [],
  });
}

export function useGetTipsReceived() {
  return useQuery<Tip[]>({
    queryKey: ["tipsReceived"],
    queryFn: async () => [],
  });
}

// ─── Stripe Queries ───────────────────────────────────────────────────────────

export function useIsStripeConfigured() {
  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => false,
  });
}

export function useSetStripeConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_config: StripeConfiguration) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
    },
  });
}

export type CheckoutSession = { id: string; url: string };

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (_items: ShoppingItem[]): Promise<CheckoutSession> => {
      throw new Error("Stripe checkout not configured");
    },
  });
}

// ─── Legal & Privacy ──────────────────────────────────────────────────────────

export function useGetLegalAndPrivacy() {
  return useQuery<{ terms: string; privacy: string }>({
    queryKey: ["legalAndPrivacy"],
    queryFn: async () => ({ terms: "", privacy: "" }),
  });
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      return data?.role === "admin";
    },
    staleTime: 60_000,
  });
}

// ─── Crypto Exchange Rates ────────────────────────────────────────────────────

export interface CryptoExchangeRates {
  ethereum: { usd: number };
  bitcoin: { usd: number };
}

export function useCryptoExchangeRates() {
  return useQuery<CryptoExchangeRates>({
    queryKey: ["cryptoExchangeRates"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd",
      );
      if (!response.ok) throw new Error("Failed to fetch exchange rates");
      return response.json() as Promise<CryptoExchangeRates>;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// ─── Security Center ──────────────────────────────────────────────────────────

export function useGetActiveSessions() {
  return useQuery<ActiveSession[]>({
    queryKey: ["activeSessions"],
    queryFn: async () => [],
  });
}

export function useAddActiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_session: ActiveSession) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
    },
  });
}

export function useGetBiometricSettings() {
  return useQuery<BiometricSettings | null>({
    queryKey: ["biometricSettings"],
    queryFn: async () => null,
  });
}

export function useSetBiometricSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_settings: BiometricSettings) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biometricSettings"] });
    },
  });
}

export function useGetEncryptionLog() {
  return useQuery<EncryptionEvent[]>({
    queryKey: ["encryptionLog"],
    queryFn: async () => [],
  });
}

export function useLogEncryptionEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_event: EncryptionEvent) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encryptionLog"] });
    },
  });
}

export function useGetFraudAlerts() {
  return useQuery<FraudAlert[]>({
    queryKey: ["fraudAlerts"],
    queryFn: async () => [],
  });
}

export function useLogAIQuery() {
  return useMutation({
    mutationFn: async (_params: { queryText: string; response: string }) => {},
  });
}

// ─── Invite/Referral ──────────────────────────────────────────────────────────

export function useGenerateInviteCode() {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      return `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    },
  });
}

// ─── Compilation Status ───────────────────────────────────────────────────────

export function useGetCompilationStatus() {
  return useQuery<CompilationStatus>({
    queryKey: ["compilationStatus"],
    queryFn: async () => ({ status: "ok" } as CompilationStatus),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── 2FA Settings ─────────────────────────────────────────────────────────────

export function useGetTwoFactorSettings() {
  return useQuery<TwoFactorSettings | null>({
    queryKey: ["twoFactorSettings"],
    queryFn: async () => null,
  });
}

export function useSetTwoFactorSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_settings: TwoFactorSettings) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

export function useSetWithdrawalPIN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pin: string) => {
      if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be exactly 4 digits");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

export function useChangeWithdrawalPIN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ currentPin, newPin }: { currentPin: string; newPin: string }) => {
      if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin))
        throw new Error("PIN must be exactly 4 digits");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

export function useStartWithdrawalOTPChallenge() {
  return useMutation({
    mutationFn: async (_params: { amount: bigint }) => ({
      challengeId: "",
      expiresIn: 300,
      phoneSuffix: "",
    }),
  });
}

export function useVerifyWithdrawalOTP() {
  return useMutation({
    mutationFn: async (_params: { challengeId: string; otp: string }): Promise<boolean> => false,
  });
}

// ─── Dispute Resolution ───────────────────────────────────────────────────────

export type DisputeStatus = "Open" | "Under Review" | "Resolved";
export type DisputeReason = "Mistaken Send" | "Wrong Recipient" | "Suspected Scam" | "Other";

export interface Dispute {
  id: string;
  transactionId: string;
  fromUser: string;
  toUser: string;
  reason: DisputeReason;
  description: string;
  timestamp: bigint;
  status: DisputeStatus;
  aiRecommendation?: string;
  amount: bigint;
  currencyType: Variant_fiat_crypto;
}

export function useGetDisputes() {
  return useQuery<Dispute[]>({
    queryKey: ["disputes"],
    queryFn: async () => [],
  });
}

export function useSubmitDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_dispute: Omit<Dispute, "id" | "timestamp" | "status" | "aiRecommendation">) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { disputeId: string; resolution: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { disputeId: string; status: DisputeStatus }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// ─── Vault Lock ───────────────────────────────────────────────────────────────

export function useGetVaultStatus() {
  return useQuery<VaultStatus>({
    queryKey: ["vaultStatus"],
    queryFn: async () => ({ isLocked: false } as VaultStatus),
    refetchInterval: 60_000,
  });
}

export function useLockVault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useRequestVaultUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useFinalizeVaultUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useCancelVaultUnlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => true,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useAcknowledgeVaultAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

// ─── GDPR / Data Control ──────────────────────────────────────────────────────

export interface GDPRAuditEvent {
  eventType: string;
  timestamp: bigint;
}

export interface AccountDeletionStatus {
  status: "not_requested" | "deletion_pending" | "finalized";
  requestedAt?: bigint;
}

export function useExportUserData() {
  return useQuery<unknown>({
    queryKey: ["exportUserData"],
    queryFn: async () => ({}),
    enabled: false,
    retry: false,
    staleTime: 0,
  });
}

export function useRecordExportRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_: undefined) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gdprAuditLog"] });
    },
  });
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_: undefined) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
    },
  });
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_: undefined) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
    },
  });
}

export function useFinalizeAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_: undefined) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
    },
  });
}

export function useGetGDPRAuditLog() {
  return useQuery<GDPRAuditEvent[]>({
    queryKey: ["gdprAuditLog"],
    queryFn: async () => [],
  });
}

export function useGetAccountDeletionStatus() {
  return useQuery<AccountDeletionStatus>({
    queryKey: ["accountDeletionStatus"],
    queryFn: async () => ({ status: "not_requested" }),
    refetchInterval: 60_000,
  });
}

// ─── Business Application ─────────────────────────────────────────────────────

export function useSubmitBusinessApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      businessName: string;
      businessType: string;
      description: string;
      termsAccepted: boolean;
    }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useGetMyBusinessApplication() {
  return useQuery<BusinessApplication | null>({
    queryKey: ["myBusinessApplication"],
    queryFn: async () => null,
  });
}

export function useApproveBusinessApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_applicant: string) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBusinessApplications"] });
      queryClient.invalidateQueries({ queryKey: ["pendingBusinessApplications"] });
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useRejectBusinessApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { applicant: string; reason?: string }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBusinessApplications"] });
      queryClient.invalidateQueries({ queryKey: ["pendingBusinessApplications"] });
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useGetPendingBusinessApplications() {
  return useQuery<[string, BusinessApplication][]>({
    queryKey: ["pendingBusinessApplications"],
    queryFn: async () => [],
  });
}

export function useGetAllBusinessApplications() {
  return useQuery<[string, BusinessApplication][]>({
    queryKey: ["allBusinessApplications"],
    queryFn: async () => [],
  });
}

// ─── Manager Roster Types ─────────────────────────────────────────────────────

export interface StaffMember {
  principal: string;
  displayName: string;
  joinedAt: bigint;
  status: "active" | "pending";
  photo?: string;
}

export interface StaffInvite {
  inviteCode: string;
  managerName: string;
  invitedAt: bigint;
}

// ─── Manager Roster Hooks ─────────────────────────────────────────────────────

export function useCreateRosterInviteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => `${window.location.origin}/invite/${Math.random().toString(36).substring(2, 10)}`,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useFindUserByPhone() {
  return useMutation({
    mutationFn: async (_phone: string) => ({
      __kind__: "err" as const,
      err: "Not available",
    }),
  });
}

export function useInviteStaffByPhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_phone: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useAcceptStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_inviteCode: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRosterInvites"] });
    },
  });
}

export function useDeclineStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_inviteCode: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRosterInvites"] });
    },
  });
}

export function useGetMyRosterInvites() {
  return useQuery<StaffInvite[]>({
    queryKey: ["myRosterInvites"],
    queryFn: async () => [],
    refetchInterval: 60_000,
  });
}

export function useGetManagerRoster() {
  return useQuery<StaffMember[]>({
    queryKey: ["managerRoster"],
    queryFn: async () => [],
  });
}

export function useRemoveStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_staffPrincipal: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useSetTipPoolMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { enabled: boolean; mode: "equal" | "custom" }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipPoolSettings"] });
    },
  });
}

export function useGetTipPoolSettings() {
  return useQuery<{ enabled: boolean; mode: "equal" | "custom" } | null>({
    queryKey: ["tipPoolSettings"],
    queryFn: async () => null,
  });
}

export function useGetStaffTipTotals(_dateRange: string) {
  return useQuery<[string, bigint][]>({
    queryKey: ["staffTipTotals", _dateRange],
    queryFn: async () => [],
  });
}

export interface PayoutRecord {
  totalAmount: bigint;
  staffCount: number;
  timestamp: bigint;
  notes: string;
}

export function useRecordPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { distributions: [string, bigint][]; notes: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payoutHistory"] });
    },
  });
}

export function useGetPayoutHistory() {
  return useQuery<PayoutRecord[]>({
    queryKey: ["payoutHistory"],
    queryFn: async () => [],
  });
}

// ─── SMS Configuration ────────────────────────────────────────────────────────

export interface SMSConfigurationStatus {
  configured: boolean;
  fromPhone: string;
}

export function useGetSMSConfigurationStatus() {
  return useQuery<SMSConfigurationStatus>({
    queryKey: ["smsConfigurationStatus"],
    queryFn: async () => ({ configured: false, fromPhone: "" }),
    staleTime: 60_000,
  });
}

export function useSetSMSConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { accountSid: string; authToken: string; fromPhone: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smsConfigurationStatus"] });
    },
  });
}

// ─── KYC Configuration ───────────────────────────────────────────────────────

export interface KYCConfigurationStatus {
  configured: boolean;
  provider: string;
}

export function useGetKYCConfigurationStatus() {
  return useQuery<KYCConfigurationStatus>({
    queryKey: ["kycConfigurationStatus"],
    queryFn: async () => ({ configured: false, provider: "" }),
    staleTime: 60_000,
  });
}

export function useIsKYCConfigured() {
  return useQuery<boolean>({
    queryKey: ["isKYCConfigured"],
    queryFn: async () => false,
  });
}

export function useSetKYCConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { apiKey: string; provider: string }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycConfigurationStatus"] });
      queryClient.invalidateQueries({ queryKey: ["isKYCConfigured"] });
    },
  });
}

// ─── Direct Deposit ───────────────────────────────────────────────────────────

export interface DirectDepositAccount {
  routingNumber: string;
  accountNumber: string;
  createdAt: bigint;
  status: string;
}

export interface DirectDepositRecord {
  id: string;
  amount: bigint;
  status: "Pending" | "Completed" | "Failed";
  createdAt: bigint;
  clearAt?: bigint;
  completedAt?: bigint;
  targetUser: string;
  isTest: boolean;
}

export function useGetDirectDepositAccount() {
  return useQuery<DirectDepositAccount | null>({
    queryKey: ["directDepositAccount"],
    queryFn: async () => null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetDirectDepositHistory() {
  return useQuery<DirectDepositRecord[]>({
    queryKey: ["directDepositHistory"],
    queryFn: async () => [],
  });
}

export function useGetPendingDirectDeposits() {
  return useQuery<DirectDepositRecord[]>({
    queryKey: ["pendingDirectDeposits"],
    queryFn: async () => [],
    refetchInterval: 60_000,
  });
}

export function useSimulateDirectDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      targetUser: string;
      amount: bigint;
      description?: string;
      isTest: boolean;
    }): Promise<string> => "simulated",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDirectDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["directDepositHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useCompleteDirectDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_depositId: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDirectDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["directDepositHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// ─── Money Request ────────────────────────────────────────────────────────────

export type { MoneyRequest, RequestStatus };

export function useRequestMoney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      toUser: string;
      amount: bigint;
      message: string;
      currencyType: string;
    }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
    },
  });
}

export function useGetRequestsSent() {
  return useQuery<MoneyRequest[]>({
    queryKey: ["requestsSent"],
    queryFn: async () => [],
  });
}

export function useGetRequestsReceived() {
  return useQuery<MoneyRequest[]>({
    queryKey: ["requestsReceived"],
    queryFn: async () => [],
  });
}

export function useGetPendingRequestsReceived() {
  return useQuery<MoneyRequest[]>({
    queryKey: ["pendingRequestsReceived"],
    queryFn: async () => [],
    refetchInterval: 60_000,
  });
}

export function useRespondToMoneyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { requestId: bigint; accept: boolean }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequestsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useCancelMoneyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_requestId: bigint) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
    },
  });
}

// ─── Recurring Payments ───────────────────────────────────────────────────────

export interface RecurringPayment {
  id: bigint;
  toUser: string;
  amount: bigint;
  message: string;
  frequency: { Daily: null } | { Weekly: null } | { Monthly: null } | string;
  enabled: boolean;
  nextRunAt?: bigint;
  createdAt: bigint;
}

export function useGetMyRecurringPayments() {
  return useQuery<RecurringPayment[]>({
    queryKey: ["recurringPayments"],
    queryFn: async () => [],
  });
}

export function useCreateRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      toUser: string;
      amount: bigint;
      message: string;
      frequency: string;
    }) => BigInt(0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
    },
  });
}

export function useCancelRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: bigint) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
    },
  });
}

export function useToggleRecurringPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { id: bigint; enabled: boolean }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
    },
  });
}

// ─── Spending Limits ──────────────────────────────────────────────────────────

export interface SpendingLimitView {
  dailyLimit?: bigint;
  weeklyLimit?: bigint;
  monthlyLimit?: bigint;
  dailySpent?: bigint;
  weeklySpent?: bigint;
  monthlySpent?: bigint;
}

export function useGetSpendingLimits() {
  return useQuery<SpendingLimitView | null>({
    queryKey: ["spendingLimits"],
    queryFn: async () => null,
  });
}

export function useSetSpendingLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      daily: [] | [bigint];
      weekly: [] | [bigint];
      monthly: [] | [bigint];
    }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spendingLimits"] });
    },
  });
}

export function useClearSpendingLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spendingLimits"] });
    },
  });
}

// ─── Savings Pocket ───────────────────────────────────────────────────────────

export interface SavingsTransaction {
  amount: bigint;
  direction: "in" | "out" | string;
  timestamp: bigint;
}

export function useGetSavingsBalance() {
  return useQuery<bigint>({
    queryKey: ["savingsBalance"],
    queryFn: async () => BigInt(0),
  });
}

export function useGetSavingsHistory() {
  return useQuery<SavingsTransaction[]>({
    queryKey: ["savingsHistory"],
    queryFn: async () => [],
  });
}

export function useDepositToSavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_amount: bigint) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsBalance"] });
      queryClient.invalidateQueries({ queryKey: ["savingsHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useWithdrawFromSavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_amount: bigint) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsBalance"] });
      queryClient.invalidateQueries({ queryKey: ["savingsHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// ─── Support Chat ─────────────────────────────────────────────────────────────

export interface SupportMessage {
  message: string;
  timestamp: bigint;
  senderRole: string;
  read: boolean;
}

export interface SupportConversation {
  subject: string;
  status: string;
  createdAt: bigint;
  unreadCount: bigint;
}

export function useOpenSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { subject: string; firstMessage: string }) => BigInt(0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportConversation"] });
      queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
    },
  });
}

export function useSendSupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_message: string) => BigInt(0),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
    },
  });
}

export function useGetSupportConversation() {
  return useQuery<SupportConversation | null>({
    queryKey: ["supportConversation"],
    queryFn: async () => null,
  });
}

export function useGetSupportMessages() {
  return useQuery<SupportMessage[]>({
    queryKey: ["supportMessages"],
    queryFn: async () => [],
  });
}

export function useMarkSupportMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadSupportCount"] });
      queryClient.invalidateQueries({ queryKey: ["supportConversation"] });
    },
  });
}

export function useGetUnreadSupportCount() {
  return useQuery<number>({
    queryKey: ["unreadSupportCount"],
    queryFn: async () => 0,
    refetchInterval: 30_000,
  });
}

export function useAdminGetAllSupportConversations() {
  return useQuery<[string, SupportConversation][]>({
    queryKey: ["adminSupportConversations"],
    queryFn: async () => [],
  });
}

export function useAdminGetSupportMessages(_userPrincipal: string | null) {
  return useQuery<SupportMessage[]>({
    queryKey: ["adminSupportMessages", _userPrincipal],
    queryFn: async () => [],
    enabled: !!_userPrincipal,
  });
}

export function useAdminReplySupportMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { userPrincipal: string; message: string }) => {},
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["adminSupportMessages", vars.userPrincipal] });
    },
  });
}

export function useAdminCloseSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_userPrincipal: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSupportConversations"] });
    },
  });
}

// ─── Split Payment ────────────────────────────────────────────────────────────

export type SplitPaymentStatus = "pending" | "completed" | "cancelled";
export type SplitParticipantStatus = "pending" | "accepted" | "declined";

export interface SplitParticipant {
  userId: string;
  shareAmount: bigint;
  status: SplitParticipantStatus;
}

export interface SplitPayment {
  id: string;
  totalAmount: bigint;
  description: string;
  participants: SplitParticipant[];
  status: SplitPaymentStatus;
  createdAt: bigint;
}

export function useGetSplitPayments() {
  return useQuery({
    queryKey: ["splitPayments"],
    queryFn: async () => [],
  });
}

export function useCreateSplitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      totalAmount: bigint;
      description: string;
      participantShares: Array<[string, bigint]>;
    }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useRespondToSplitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { splitId: string; accept: boolean }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useCancelSplitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_splitId: string) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
    },
  });
}

// ─── Resolve User By Username ─────────────────────────────────────────────────

export function useResolveUserByUsername() {
  return async (_username: string): Promise<string | null> => null;
}

// ─── Fee Calculation ──────────────────────────────────────────────────────────

type FeeType = "creditCard" | "businessReceive" | "instantDeposit" | "atm" | "foreign";

export function useCalculateFee(feeType: FeeType | null, amount: number) {
  return useQuery<number>({
    queryKey: ["calculateFee", feeType, amount],
    queryFn: async () => {
      if (!feeType || amount <= 0) return 0;
      if (feeType === "creditCard") return Math.ceil(amount * 0.03);
      if (feeType === "instantDeposit") return Math.max(25, Math.min(Math.ceil(amount * 0.015), Math.ceil(amount * 0.025)));
      if (feeType === "atm") return 250;
      if (feeType === "foreign") return Math.ceil(amount * 0.03);
      if (feeType === "businessReceive") return Math.ceil(amount * 0.026) + 15;
      return 0;
    },
    enabled: !!feeType && amount > 0,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// ─── Partner Branding ─────────────────────────────────────────────────────────

export function useGetPartnerBranding() {
  return useQuery<null>({
    queryKey: ["partnerBranding"],
    queryFn: async () => null,
  });
}

export function useSetPartnerBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_config: unknown) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerBranding"] });
    },
  });
}

export function useClearPartnerBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerBranding"] });
    },
  });
}

// ─── Fan Points & Rewards ─────────────────────────────────────────────────────

export function useGetMyFanPoints() {
  const { isDemoMode } = useDemoMode();
  return useQuery<import("@/types/fanpoints").FanPoints | null>({
    queryKey: ["myFanPoints"],
    queryFn: async () => null,
    enabled: !isDemoMode,
  });
}

export function useGetMyRedeemedRewards() {
  const { isDemoMode } = useDemoMode();
  return useQuery<import("@/types/fanpoints").RedeemedReward[]>({
    queryKey: ["myRedeemedRewards"],
    queryFn: async () => [],
    enabled: !isDemoMode,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_rewardId: string) => ({
      __kind__: "err" as const,
      err: "Not available",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFanPoints"] });
      queryClient.invalidateQueries({ queryKey: ["myRedeemedRewards"] });
    },
  });
}

export function useRecordGuestPayment() {
  return useMutation({
    mutationFn: async (_params: import("@/types/fanpoints").RecordGuestPaymentParams) => ({
      __kind__: "err" as const,
      err: "Not available",
    }),
  });
}

export function useLinkGuestPaymentsToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_contactInfo: string) => ({ __kind__: "err" as const, err: "Not available" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFanPoints"] });
    },
  });
}

export function useListRewards(teamId?: string) {
  return useQuery<import("@/types/fanpoints").Reward[]>({
    queryKey: ["rewards", teamId ?? "all"],
    queryFn: async () => [],
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: import("@/types/fanpoints").CreateRewardParams) => ({
      __kind__: "err" as const,
      err: "Not available",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { id: string; params: unknown }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

export const useDeleteReward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
};

export function useAssignStaffSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: import("@/types/fanpoints").AssignStaffSectionParams) => ({
      __kind__: "ok" as const,
      ok: null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionAssignments"] });
    },
  });
}

export function useGetSectionAssignments(_managerId: string) {
  return useQuery<import("@/types/fanpoints").StaffSection[]>({
    queryKey: ["sectionAssignments", _managerId],
    queryFn: async () => [],
    enabled: !!_managerId,
  });
}

export function useGetSectionAnalytics(_managerId: string, _since?: number) {
  return useQuery<import("@/types/fanpoints").SectionAnalytics[]>({
    queryKey: ["sectionAnalytics", _managerId, _since ?? 0],
    queryFn: async () => [],
    enabled: !!_managerId,
  });
}

export function useGetStaffAnalytics(_managerId: string, _since?: number) {
  return useQuery<import("@/types/fanpoints").StaffAnalytics[]>({
    queryKey: ["staffAnalytics", _managerId, _since ?? 0],
    queryFn: async () => [],
    enabled: !!_managerId,
  });
}

export function useGetTopStaffPerformers(_managerId: string, _limit: number, _since?: number) {
  return useQuery<import("@/types/fanpoints").StaffAnalytics[]>({
    queryKey: ["topStaffPerformers", _managerId, _limit, _since ?? 0],
    queryFn: async () => [],
    enabled: !!_managerId && _limit > 0,
  });
}

// ─── Food Ordering ────────────────────────────────────────────────────────────

export function useListStands() {
  return useQuery<import("@/types/food-ordering").ConcessionStand[]>({
    queryKey: ["foodStands"],
    queryFn: async () => [],
  });
}

export function useListMenuItems(standId: string) {
  return useQuery<import("@/types/food-ordering").MenuItem[]>({
    queryKey: ["foodMenuItems", standId],
    queryFn: async () => [],
    enabled: !!standId,
  });
}

export function useGetMyOrders() {
  return useQuery<import("@/types/food-ordering").FoodOrder[]>({
    queryKey: ["myFoodOrders"],
    queryFn: async () => [],
    refetchInterval: 4000,
  });
}

export function useGetOrder(orderId: string, enabled: boolean) {
  return useQuery<import("@/types/food-ordering").FoodOrder | null>({
    queryKey: ["foodOrder", orderId],
    queryFn: async () => null,
    enabled: enabled && !!orderId,
    refetchInterval: enabled ? 4000 : false,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      standId: string;
      items: import("@/types/food-ordering").OrderItemInput[];
      seatNumber: string;
      deliveryMethod: import("@/types/food-ordering").DeliveryMethod;
    }) => ({ __kind__: "err" as const, err: "Not available" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFoodOrders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_orderId: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFoodOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { orderId: string; status: import("@/types/food-ordering").OrderStatus }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFoodOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
    },
  });
}

export function useGetActiveOrdersForManager() {
  return useQuery<import("@/types/food-ordering").FoodOrder[]>({
    queryKey: ["activeOrders"],
    queryFn: async () => [],
    refetchInterval: 5000,
  });
}

export function useCreateStand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { name: string; description?: string | null; section?: string | null }) => ({
      __kind__: "err" as const,
      err: "Not available",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodStands"] });
    },
  });
}

export function useUpdateStand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { id: string; name: string; description?: string | null; section?: string | null }) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodStands"] });
    },
  });
}

export function useDeleteStand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodStands"] });
    },
  });
}

export function useAddMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      standId: string;
      name: string;
      priceInCents: bigint;
      description: string;
      category?: string;
      available?: boolean;
    }) => ({ __kind__: "err" as const, err: "Not available" }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["foodMenuItems", vars.standId] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      standId: string;
      name: string;
      priceInCents: bigint;
      description: string;
      category?: string;
      available?: boolean;
    }) => {},
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["foodMenuItems", vars.standId] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { id: string; standId: string }) => {},
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["foodMenuItems", vars.standId] });
    },
  });
}

// ─── Points Rules ─────────────────────────────────────────────────────────────

export function useListPointsRules() {
  return useQuery<PointsRule[]>({
    queryKey: ["pointsRules"],
    queryFn: async () => [],
  });
}

export function useTogglePointsRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: { id: string; active: boolean }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export function useUpdatePointsRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      id: string;
      name: string;
      description: string;
      multiplier: number;
      sectionName?: string | null;
    }) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export interface CreatePointsRuleParams {
  id: string;
  name: string;
  description: string;
  ruleType: PointsRuleType;
  multiplier: number;
  isActive: boolean;
  createdAt: bigint;
  sectionName?: string | null;
}

export function useCreatePointsRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_rule: CreatePointsRuleParams) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pointsRules"] });
    },
  });
}

export function useGetPointsBreakdown(
  amountCents: bigint,
  transactionType: string,
  _isGameDay: boolean,
  _isFirstPayment: boolean,
  _sectionName?: string | null,
) {
  return useQuery<PointsBreakdown | null>({
    queryKey: ["pointsBreakdown", amountCents.toString(), transactionType],
    queryFn: async () => null,
    enabled: amountCents > BigInt(0) && transactionType.length > 0,
  });
}

// ─── Extended Staff ───────────────────────────────────────────────────────────

export function useListExtendedStaff() {
  return useQuery<ExtendedStaffMember[]>({
    queryKey: ["extendedStaff"],
    queryFn: async () => [],
  });
}

export function useUpsertExtendedStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_member: ExtendedStaffMember) => "ok",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extendedStaff"] });
    },
  });
}

export function useRemoveExtendedStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extendedStaff"] });
    },
  });
}

// ─── Tip Split & Check-In ─────────────────────────────────────────────────────

export interface StaffCheckIn {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  standId: string;
  standName: string;
  gameDate: string;
  checkInTime: bigint;
  manualOverride: boolean;
  checkOutTime?: bigint;
  hoursWorked?: number;
}

export interface GameStandAssignment {
  id: string;
  staffId: string;
  staffName: string;
  standId: string;
  standName: string;
  gameDate: string;
  gameStandId: string;
  defaultStandId: string;
  gameStandName: string;
}

export interface TipSplitRole {
  id: string;
  roleName: string;
  pointValue: number;
  isCustom: boolean;
}

export interface TipSplitLineItem {
  staffId: string;
  staffName: string;
  role: string;
  hoursWorked: number;
  rolePoints: number;
  weightedScore: number;
  sharePercent: number;
  payoutAmount: number;
}

export interface TipSplitPayout {
  id: string;
  standId: string;
  standName: string;
  gameDate: string;
  totalPool: number;
  status: string;
  calculations: TipSplitLineItem[];
  approvedBy?: string;
  approvedAt?: number;
}

export function useRecordCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      staffId: string;
      staffName: string;
      role: string;
      standId: string;
      standName: string;
      gameDate: string;
      checkInTime: bigint;
    }): Promise<StaffCheckIn> => ({
      id: `checkin-${params.staffId}-${params.gameDate}`,
      manualOverride: false,
      ...params,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    },
  });
}

export function useRecordCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { checkInId: string; checkOutTime: bigint }): Promise<StaffCheckIn> => ({
      id: params.checkInId,
      staffId: "",
      staffName: "",
      role: "",
      standId: "",
      standName: "",
      gameDate: "",
      checkInTime: BigInt(0),
      manualOverride: false,
      checkOutTime: params.checkOutTime,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    },
  });
}

export function useManualSetHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { checkInId: string; hoursWorked: number; overrideBy: string }): Promise<StaffCheckIn> => ({
      id: params.checkInId,
      staffId: "",
      staffName: "",
      role: "",
      standId: "",
      standName: "",
      gameDate: "",
      checkInTime: BigInt(0),
      manualOverride: true,
      hoursWorked: params.hoursWorked,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkIns"] });
    },
  });
}

export function useGetCheckInsForGame(gameDate: string) {
  return useQuery<StaffCheckIn[]>({
    queryKey: ["checkIns", gameDate],
    queryFn: async () => [],
    enabled: !!gameDate,
  });
}

export function useGetGameStandAssignment(staffId: string, gameDate: string) {
  return useQuery<GameStandAssignment | null>({
    queryKey: ["gameStandAssignment", staffId, gameDate],
    queryFn: async () => null,
    enabled: !!staffId && !!gameDate,
  });
}

export function useSetGameStandAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      staffId: string;
      staffName: string;
      standId: string;
      standName: string;
      gameDate: string;
      gameStandId: string;
      defaultStandId: string;
      gameStandName: string;
    }): Promise<GameStandAssignment> => ({
      id: `gsa-${params.staffId}-${params.gameDate}`,
      ...params,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gameStandAssignment"] });
    },
  });
}

export function useGetTipSplitRoles() {
  return useQuery<TipSplitRole[]>({
    queryKey: ["tipSplitRoles"],
    queryFn: async () => [
      { id: "role-1", roleName: "Head Bartender", pointValue: 3, isCustom: false },
      { id: "role-2", roleName: "Bartender", pointValue: 2, isCustom: false },
      { id: "role-3", roleName: "Barback", pointValue: 1, isCustom: false },
      { id: "role-4", roleName: "Concession Worker", pointValue: 1, isCustom: false },
      { id: "role-5", roleName: "Suite Runner", pointValue: 2, isCustom: false },
    ],
  });
}

export function useUpsertTipSplitRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: TipSplitRole): Promise<TipSplitRole> => role,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipSplitRoles"] });
    },
  });
}

export function useRemoveTipSplitRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_roleId: string): Promise<void> => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipSplitRoles"] });
    },
  });
}

export function useCalculateTipSplit() {
  return useMutation({
    mutationFn: async (params: {
      standId: string;
      standName: string;
      gameDate: string;
      totalPool: number;
    }): Promise<TipSplitPayout> => ({
      id: `split-${params.standId}-${params.gameDate}`,
      standId: params.standId,
      standName: params.standName,
      gameDate: params.gameDate,
      totalPool: params.totalPool,
      status: "pending",
      calculations: [],
    }),
  });
}

export function useApproveTipSplitPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      payoutId: string;
      approvedBy: string;
      approvedAt: number;
    }): Promise<TipSplitPayout> => ({
      id: params.payoutId,
      standId: "",
      standName: "",
      gameDate: "",
      totalPool: 0,
      status: "approved",
      calculations: [],
      approvedBy: params.approvedBy,
      approvedAt: params.approvedAt,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipSplitPayouts"] });
    },
  });
}

export function useGetTipSplitPayouts(standId: string, gameDate: string) {
  return useQuery<TipSplitPayout[]>({
    queryKey: ["tipSplitPayouts", standId, gameDate],
    queryFn: async () => [],
    enabled: !!standId && !!gameDate,
  });
}
