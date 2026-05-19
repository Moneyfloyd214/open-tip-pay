import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
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
} from "../backend";

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

// App Lock PIN Queries
export function useHasExistingPin() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["hasExistingPin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasExistingPin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSetAppLockEnabled() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setAppLockEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hasExistingPin"] });
    },
  });
}

export function useSetPinHash() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      salt,
      hash,
    }: { salt: Uint8Array; hash: Uint8Array }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setPinHash(salt, hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hasExistingPin"] });
    },
  });
}

export function useVerifyPinHash() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({
      salt,
      hash,
    }: { salt: Uint8Array; hash: Uint8Array }): Promise<PinCheckResult> => {
      if (!actor) throw new Error("Actor not available");
      return actor.verifyPinHash(salt, hash);
    },
  });
}

// KYC Verification
export function useSubmitKYC() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.submitKYC();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Search Users
export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<SearchResult[]>({
    queryKey: ["searchUsers", searchTerm],
    queryFn: async () => {
      if (!actor || !searchTerm || searchTerm.trim().length === 0) return [];
      return actor.searchUsers(searchTerm.trim());
    },
    enabled: !!actor && !actorFetching && searchTerm.trim().length > 0,
    staleTime: 30000,
  });
}

// Public Profile Queries
export function useGetPublicProfile(username: string | null) {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      return actor.getPublicProfile(username);
    },
    enabled: !!actor && !actorFetching && !!username,
  });
}

export function useGetPublicProfileByPrincipal(
  userPrincipal: Principal | null,
) {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery({
    queryKey: ["publicProfileByPrincipal", userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getPublicProfileByPrincipal(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

// Status Management
export function useAddStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: Status) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addStatus(status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentStatus"] });
    },
  });
}

export function useDeactivateStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.deactivateStatus();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentStatus"] });
    },
  });
}

export function useGetCurrentStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<Status | null>({
    queryKey: ["currentStatus", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCurrentStatus(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 30000,
  });
}

// Wallet Management
export function useSaveWalletAddress() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletAddress: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.saveWalletAddress(walletAddress);
      if (result.__kind__ === "error") {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useRemoveWalletAddress() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.removeWalletAddress();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useMarkTutorialCompleted() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.markTutorialCompleted();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Payment Methods Management
export function useGetPaymentMethods() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getPaymentMethods(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddPaymentMethod() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (method: PaymentMethod) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addPaymentMethod(method);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

export function useRemovePaymentMethod() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.removePaymentMethod(methodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

export function useUpdatePaymentMethodVerificationStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      methodId,
      status,
    }: { methodId: string; status: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updatePaymentMethodVerificationStatus(methodId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
  });
}

// Balance Queries
export function useGetBalance() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ["balance", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      return actor.getBalance(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useDeposit() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deposit(amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useWithdraw() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      verifiedOtpId,
    }: { amount: bigint; verifiedOtpId?: string | null }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.withdraw(amount, verifiedOtpId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// Tip Queries
export function useSendTip() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toUser,
      amount,
      message,
      professional,
      currencyType,
    }: {
      toUser: Principal;
      amount: bigint;
      message: string;
      professional: boolean;
      currencyType: Variant_fiat_crypto;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.sendTip(toUser, amount, message, professional, currencyType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipsSent"] });
      queryClient.invalidateQueries({ queryKey: ["tipsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useGetTipsSent() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<Tip[]>({
    queryKey: ["tipsSent", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getTipsSent(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetTipsReceived() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<Tip[]>({
    queryKey: ["tipsReceived", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getTipsReceived(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// Stripe Queries
export function useIsStripeConfigured() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error("Actor not available");
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/#/payment-success`;
      const cancelUrl = `${baseUrl}/#/payment-failure`;
      const result = await actor.createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      );
      const session = JSON.parse(result) as CheckoutSession;
      return session;
    },
  });
}

// Legal & Privacy
export function useGetLegalAndPrivacy() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<{ terms: string; privacy: string }>({
    queryKey: ["legalAndPrivacy"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getLegalAndPrivacy();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Cryptocurrency Exchange Rate Queries
export interface CryptoExchangeRates {
  ethereum: { usd: number };
  bitcoin: { usd: number };
}

export function useCryptoExchangeRates() {
  return useQuery<CryptoExchangeRates>({
    queryKey: ["cryptoExchangeRates"],
    queryFn: async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd",
        );

        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();
        return data as CryptoExchangeRates;
      } catch (error) {
        console.error("Error fetching crypto exchange rates:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Security Center Queries
export function useGetActiveSessions() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<ActiveSession[]>({
    queryKey: ["activeSessions", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getActiveSessions(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useAddActiveSession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: ActiveSession) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addActiveSession(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
    },
  });
}

export function useGetBiometricSettings() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<BiometricSettings | null>({
    queryKey: ["biometricSettings", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getBiometricSettings(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSetBiometricSettings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: BiometricSettings) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setBiometricSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["biometricSettings"] });
    },
  });
}

export function useGetEncryptionLog() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<EncryptionEvent[]>({
    queryKey: ["encryptionLog", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getEncryptionLog(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useLogEncryptionEvent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: EncryptionEvent) => {
      if (!actor) throw new Error("Actor not available");
      await actor.logEncryptionEvent(event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encryptionLog"] });
    },
  });
}

export function useGetFraudAlerts() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<FraudAlert[]>({
    queryKey: ["fraudAlerts", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getFraudAlerts(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useLogAIQuery() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({
      queryText,
      response,
    }: { queryText: string; response: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.logAIQuery(queryText, response);
    },
  });
}

// Invite/Referral System
export function useGenerateInviteCode() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateInviteCode();
    },
  });
}

// Compilation Status Query
export function useGetCompilationStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<CompilationStatus>({
    queryKey: ["compilationStatus"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCompilationStatus();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// 2FA Settings Queries
export function useGetTwoFactorSettings() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<TwoFactorSettings | null>({
    queryKey: ["twoFactorSettings", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getTwoFactorSettings(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSetTwoFactorSettings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: TwoFactorSettings) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setTwoFactorSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

// 2FA PIN Management (placeholder for backend implementation)
export function useSetWithdrawalPIN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pin: string) => {
      if (!/^\d{4}$/.test(pin)) {
        throw new Error("PIN must be exactly 4 digits");
      }
      console.log("Setting withdrawal PIN (mock):", pin.replace(/./g, "*"));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

export function useChangeWithdrawalPIN() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentPin,
      newPin,
    }: { currentPin: string; newPin: string }) => {
      if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
        throw new Error("PIN must be exactly 4 digits");
      }
      console.log("Changing withdrawal PIN (mock)");
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twoFactorSettings"] });
    },
  });
}

// 2FA OTP Challenge — wired to real backend
export function useStartWithdrawalOTPChallenge() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!actor) throw new Error("Actor not available");

      const result = await actor.startWithdrawalOTPChallenge(amount);

      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }

      const { challengeId, expiresIn, phoneSuffix } = result.ok;
      return {
        challengeId,
        expiresIn: Number(expiresIn),
        phoneSuffix,
      };
    },
  });
}

export function useVerifyWithdrawalOTP() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async ({
      challengeId,
      otp,
    }: { challengeId: string; otp: string }): Promise<boolean> => {
      if (!actor) throw new Error("Actor not available");

      const result = await actor.verifyWithdrawalOTP(challengeId, otp);

      if (result.__kind__ === "err") {
        throw new Error(result.err);
      }

      return result.ok;
    },
  });
}

// Dispute Resolution Types and Hooks
export type DisputeStatus = "Open" | "Under Review" | "Resolved";

export type DisputeReason =
  | "Mistaken Send"
  | "Wrong Recipient"
  | "Suspected Scam"
  | "Other";

export interface Dispute {
  id: string;
  transactionId: string;
  fromUser: Principal;
  toUser: Principal;
  reason: DisputeReason;
  description: string;
  timestamp: bigint;
  status: DisputeStatus;
  aiRecommendation?: string;
  amount: bigint;
  currencyType: Variant_fiat_crypto;
}

export function useGetDisputes() {
  const { identity } = useInternetIdentity();

  return useQuery<Dispute[]>({
    queryKey: ["disputes", identity?.getPrincipal().toString()],
    queryFn: async () => {
      return [];
    },
    enabled: !!identity,
  });
}

export function useSubmitDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      dispute: Omit<
        Dispute,
        "id" | "timestamp" | "status" | "aiRecommendation"
      >,
    ) => {
      console.log("Submitting dispute:", dispute);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["tipsSent"] });
      queryClient.invalidateQueries({ queryKey: ["tipsReceived"] });
    },
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      disputeId,
      resolution,
    }: { disputeId: string; resolution: string }) => {
      console.log("Resolving dispute:", disputeId, resolution);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// Vault Lock Hooks
export function useGetVaultStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<VaultStatus>({
    queryKey: ["vaultStatus", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getVaultStatus();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 60000,
  });
}

export function useLockVault() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.lockVault();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useRequestVaultUnlock() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.requestVaultUnlock();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useFinalizeVaultUnlock() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.finalizeVaultUnlock();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useCancelVaultUnlock() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.cancelVaultUnlock();
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useAcknowledgeVaultAlert() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.acknowledgeVaultAlert();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaultStatus"] });
    },
  });
}

export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      disputeId,
      status,
    }: { disputeId: string; status: DisputeStatus }) => {
      console.log("Updating dispute status:", disputeId, status);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
}

// ─── GDPR / CCPA Data Control Hooks ──────────────────────────────────────────

export interface GDPRAuditEvent {
  eventType: string;
  timestamp: bigint;
}

export interface AccountDeletionStatus {
  status: "not_requested" | "deletion_pending" | "finalized";
  requestedAt?: bigint;
}

/** Manually triggered — disabled by default. Call refetch() to trigger. */
export function useExportUserData() {
  const { actor } = useActor(createActor);

  return useQuery<unknown>({
    queryKey: ["exportUserData"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as { exportUserData: () => Promise<unknown> }
      ).exportUserData();
    },
    enabled: false,
    retry: false,
    staleTime: 0,
  });
}

export function useRecordExportRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: undefined) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as { recordExportRequest: () => Promise<void> }
      ).recordExportRequest();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gdprAuditLog"] });
    },
  });
}

export function useRequestAccountDeletion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: undefined) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as { requestAccountDeletion: () => Promise<void> }
      ).requestAccountDeletion();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["gdprAuditLog"] });
    },
  });
}

export function useCancelAccountDeletion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: undefined) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as { cancelAccountDeletion: () => Promise<void> }
      ).cancelAccountDeletion();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["gdprAuditLog"] });
    },
  });
}

export function useFinalizeAccountDeletion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_: undefined) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as { finalizeAccountDeletion: () => Promise<void> }
      ).finalizeAccountDeletion();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accountDeletionStatus"] });
      queryClient.invalidateQueries({ queryKey: ["gdprAuditLog"] });
    },
  });
}

export function useGetGDPRAuditLog() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<GDPRAuditEvent[]>({
    queryKey: ["gdprAuditLog", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as { getGDPRAuditLog: () => Promise<GDPRAuditEvent[]> }
      ).getGDPRAuditLog();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetAccountDeletionStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<AccountDeletionStatus>({
    queryKey: ["accountDeletionStatus", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return { status: "not_requested" } as AccountDeletionStatus;
      return (
        actor as unknown as {
          getAccountDeletionStatus: () => Promise<AccountDeletionStatus>;
        }
      ).getAccountDeletionStatus();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 60000,
  });
}

// ─── Business Application Hooks ───────────────────────────────────────────────

export function useSubmitBusinessApplication() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      businessName,
      businessType,
      description,
      termsAccepted,
    }: {
      businessName: string;
      businessType: string;
      description: string;
      termsAccepted: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.submitBusinessApplication(
        businessName,
        businessType,
        description,
        termsAccepted,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useGetMyBusinessApplication() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<BusinessApplication | null>({
    queryKey: ["myBusinessApplication", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyBusinessApplication();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useApproveBusinessApplication() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicant: Principal) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.approveBusinessApplication(applicant);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBusinessApplications"] });
      queryClient.invalidateQueries({
        queryKey: ["pendingBusinessApplications"],
      });
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useRejectBusinessApplication() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicant,
      reason,
    }: {
      applicant: Principal;
      reason?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.rejectBusinessApplication(
        applicant,
        reason ?? null,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allBusinessApplications"] });
      queryClient.invalidateQueries({
        queryKey: ["pendingBusinessApplications"],
      });
      queryClient.invalidateQueries({ queryKey: ["myBusinessApplication"] });
    },
  });
}

export function useGetPendingBusinessApplications() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<[Principal, BusinessApplication][]>({
    queryKey: ["pendingBusinessApplications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingBusinessApplications();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllBusinessApplications() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<[Principal, BusinessApplication][]>({
    queryKey: ["allBusinessApplications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBusinessApplications();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── Manager Roster Types ─────────────────────────────────────────────────────

export interface StaffMember {
  principal: Principal;
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
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as {
          createRosterInviteLink: () => Promise<string>;
        }
      ).createRosterInviteLink();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useFindUserByPhone() {
  const { actor } = useActor(createActor);

  return useMutation({
    mutationFn: async (
      phone: string,
    ): Promise<
      | { __kind__: "ok"; ok: { username: string } }
      | { __kind__: "err"; err: string }
    > => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          findUserByPhone: (
            phone: string,
          ) => Promise<
            | { __kind__: "ok"; ok: { username: string } }
            | { __kind__: "err"; err: string }
          >;
        }
      ).findUserByPhone(phone);
      return result;
    },
  });
}

export function useInviteStaffByPhone() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phone: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          inviteStaffByPhone: (
            phone: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).inviteStaffByPhone(phone);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useAcceptStaffInvite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          acceptStaffInvite: (
            code: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).acceptStaffInvite(inviteCode);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRosterInvites"] });
    },
  });
}

export function useDeclineStaffInvite() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          declineStaffInvite: (
            code: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).declineStaffInvite(inviteCode);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myRosterInvites"] });
    },
  });
}

export function useGetMyRosterInvites() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<StaffInvite[]>({
    queryKey: ["myRosterInvites", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getMyRosterInvites: () => Promise<StaffInvite[]>;
        }
      ).getMyRosterInvites();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 60000,
  });
}

export function useGetManagerRoster() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<StaffMember[]>({
    queryKey: ["managerRoster", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getManagerRoster: () => Promise<StaffMember[]>;
        }
      ).getManagerRoster();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useRemoveStaffMember() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          removeStaffMember: (
            p: Principal,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).removeStaffMember(staffPrincipal);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managerRoster"] });
    },
  });
}

export function useSetTipPoolMode() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enabled,
      mode,
    }: { enabled: boolean; mode: "equal" | "custom" }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          setTipPoolMode: (
            enabled: boolean,
            mode: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).setTipPoolMode(enabled, mode);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipPoolSettings"] });
    },
  });
}

export function useGetTipPoolSettings() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<{ enabled: boolean; mode: "equal" | "custom" } | null>({
    queryKey: ["tipPoolSettings", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return (
        actor as unknown as {
          getTipPoolSettings: () => Promise<{
            enabled: boolean;
            mode: "equal" | "custom";
          } | null>;
        }
      ).getTipPoolSettings();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetStaffTipTotals(dateRange: string) {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  const durationMs =
    dateRange === "today"
      ? BigInt(86400000)
      : dateRange === "week"
        ? BigInt(604800000)
        : BigInt(2592000000);
  const since: bigint | null =
    dateRange === "all"
      ? null
      : BigInt(Date.now()) * BigInt(1_000_000) - durationMs * BigInt(1_000_000);

  return useQuery<[string, bigint][]>({
    queryKey: [
      "staffTipTotals",
      identity?.getPrincipal().toString(),
      dateRange,
    ],
    queryFn: async () => {
      if (!actor) return [];
      const result = await (
        actor as unknown as {
          getStaffTipTotals: (
            since: bigint | null,
          ) => Promise<[string, bigint][]>;
        }
      ).getStaffTipTotals(since);
      return result;
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export interface PayoutRecord {
  totalAmount: bigint;
  staffCount: number;
  timestamp: bigint;
  notes: string;
}

export function useRecordPayout() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      distributions,
      notes,
    }: { distributions: [string, bigint][]; notes: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          recordPayout: (
            distributions: [string, bigint][],
            notes: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).recordPayout(distributions, notes);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payoutHistory"] });
    },
  });
}

export function useGetPayoutHistory() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<PayoutRecord[]>({
    queryKey: ["payoutHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getPayoutHistory: () => Promise<PayoutRecord[]>;
        }
      ).getPayoutHistory();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// ─── SMS Configuration Hooks ──────────────────────────────────────────────────

export interface SMSConfigurationStatus {
  configured: boolean;
  fromPhone: string;
}

export function useGetSMSConfigurationStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<SMSConfigurationStatus>({
    queryKey: ["smsConfigurationStatus"],
    queryFn: async () => {
      if (!actor) return { configured: false, fromPhone: "" };
      return (
        actor as unknown as {
          getSMSConfigurationStatus: () => Promise<SMSConfigurationStatus>;
        }
      ).getSMSConfigurationStatus();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60000,
  });
}

export function useSetSMSConfiguration() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      accountSid,
      authToken,
      fromPhone,
    }: { accountSid: string; authToken: string; fromPhone: string }) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as {
          setSMSConfiguration: (
            accountSid: string,
            authToken: string,
            fromPhone: string,
          ) => Promise<void>;
        }
      ).setSMSConfiguration(accountSid, authToken, fromPhone);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smsConfigurationStatus"] });
    },
  });
}

// ─── KYC Configuration Hooks ──────────────────────────────────────────────────

export interface KYCConfigurationStatus {
  configured: boolean;
  provider: string;
}

export function useGetKYCConfigurationStatus() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<KYCConfigurationStatus>({
    queryKey: ["kycConfigurationStatus"],
    queryFn: async () => {
      if (!actor) return { configured: false, provider: "" };
      return (
        actor as unknown as {
          getKYCConfigurationStatus: () => Promise<KYCConfigurationStatus>;
        }
      ).getKYCConfigurationStatus();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60000,
  });
}

export function useIsKYCConfigured() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<boolean>({
    queryKey: ["isKYCConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return (
        actor as unknown as {
          isKYCConfigured: () => Promise<boolean>;
        }
      ).isKYCConfigured();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetKYCConfiguration() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      apiKey,
      provider,
    }: { apiKey: string; provider: string }) => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as {
          setKYCConfiguration: (
            apiKey: string,
            provider: string,
          ) => Promise<void>;
        }
      ).setKYCConfiguration(apiKey, provider);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kycConfigurationStatus"] });
      queryClient.invalidateQueries({ queryKey: ["isKYCConfigured"] });
    },
  });
}

// ─── Direct Deposit Types ─────────────────────────────────────────────────────

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

// ─── Direct Deposit Hooks ─────────────────────────────────────────────────────

export function useGetDirectDepositAccount() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<DirectDepositAccount | null>({
    queryKey: ["directDepositAccount", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return (
        actor as unknown as {
          getOrCreateDirectDepositAccount: () => Promise<DirectDepositAccount | null>;
        }
      ).getOrCreateDirectDepositAccount();
    },
    enabled: !!actor && !actorFetching && !!identity,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetDirectDepositHistory() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<DirectDepositRecord[]>({
    queryKey: ["directDepositHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getDirectDepositHistory: () => Promise<DirectDepositRecord[]>;
        }
      ).getDirectDepositHistory();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetPendingDirectDeposits() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<DirectDepositRecord[]>({
    queryKey: ["pendingDirectDeposits", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getPendingDirectDeposits: () => Promise<DirectDepositRecord[]>;
        }
      ).getPendingDirectDeposits();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 60000,
  });
}

export function useSimulateDirectDeposit() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUser,
      amount,
      description,
      isTest,
    }: {
      targetUser: string;
      amount: bigint;
      description?: string;
      isTest: boolean;
    }): Promise<string> => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@dfinity/principal");
      const principal = Principal.fromText(targetUser);
      const result = await (
        actor as unknown as {
          simulateDirectDeposit: (
            targetUser: ReturnType<typeof Principal.fromText>,
            amount: bigint,
            description: string,
            isTest: boolean,
          ) => Promise<{ "#ok": [string] } | { "#err": [string] }>;
        }
      ).simulateDirectDeposit(
        principal,
        amount,
        description ?? (isTest ? "Test deposit" : ""),
        isTest,
      );
      if ("#err" in result) throw new Error(result["#err"][0]);
      return result["#ok"][0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDirectDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["directDepositHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useCompleteDirectDeposit() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositId: string) => {
      if (!actor) throw new Error("Actor not available");
      return (
        actor as unknown as {
          completeDirectDeposit: (depositId: string) => Promise<void>;
        }
      ).completeDirectDeposit(depositId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingDirectDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["directDepositHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

// Re-export MoneyRequest and RequestStatus for use in components
export type { MoneyRequest, RequestStatus };

// ─── Money Request Hooks ──────────────────────────────────────────────────────

export function useRequestMoney() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toUser,
      amount,
      message,
      currencyType,
    }: {
      toUser: Principal;
      amount: bigint;
      message: string;
      currencyType: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.requestMoney(
        toUser,
        amount,
        message,
        currencyType,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useGetRequestsSent() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<MoneyRequest[]>({
    queryKey: ["requestsSent", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRequestsSent();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetRequestsReceived() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<MoneyRequest[]>({
    queryKey: ["requestsReceived", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRequestsReceived();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetPendingRequestsReceived() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<MoneyRequest[]>({
    queryKey: ["pendingRequestsReceived", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRequestsReceived();
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 60000,
  });
}

export function useRespondToMoneyRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      accept,
    }: { requestId: bigint; accept: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.respondToMoneyRequest(requestId, accept);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequestsReceived"] });
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["tipsReceived"] });
    },
  });
}

export function useCancelMoneyRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.cancelMoneyRequest(requestId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requestsSent"] });
    },
  });
}

// ─── Recurring Payments ───────────────────────────────────────────────────────

export interface RecurringPayment {
  id: bigint;
  toUser: Principal;
  amount: bigint;
  message: string;
  frequency: { Daily: null } | { Weekly: null } | { Monthly: null } | string;
  enabled: boolean;
  nextRunAt?: bigint;
  createdAt: bigint;
}

export function useGetMyRecurringPayments() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<RecurringPayment[]>({
    queryKey: ["recurringPayments", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getMyRecurringPayments: () => Promise<RecurringPayment[]>;
        }
      ).getMyRecurringPayments();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateRecurringPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      toUser,
      amount,
      message,
      frequency,
    }: {
      toUser: Principal;
      amount: bigint;
      message: string;
      frequency: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          createRecurringPayment: (
            toUser: Principal,
            amount: bigint,
            message: string,
            frequency: string,
          ) => Promise<
            { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }
          >;
        }
      ).createRecurringPayment(toUser, amount, message, frequency);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
    },
  });
}

export function useCancelRecurringPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          cancelRecurringPayment: (
            id: bigint,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).cancelRecurringPayment(id);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
    },
  });
}

export function useToggleRecurringPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: bigint; enabled: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          toggleRecurringPayment: (
            id: bigint,
            enabled: boolean,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).toggleRecurringPayment(id, enabled);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
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
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<SpendingLimitView | null>({
    queryKey: ["spendingLimits", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return (
        actor as unknown as {
          getSpendingLimits: () => Promise<SpendingLimitView | null>;
        }
      ).getSpendingLimits();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useSetSpendingLimits() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      daily,
      weekly,
      monthly,
    }: {
      daily: [] | [bigint];
      weekly: [] | [bigint];
      monthly: [] | [bigint];
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          setSpendingLimits: (
            daily: [] | [bigint],
            weekly: [] | [bigint],
            monthly: [] | [bigint],
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).setSpendingLimits(daily, weekly, monthly);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spendingLimits"] });
    },
  });
}

export function useClearSpendingLimits() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await (
        actor as unknown as { clearSpendingLimits: () => Promise<void> }
      ).clearSpendingLimits();
    },
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
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<bigint>({
    queryKey: ["savingsBalance", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return (
        actor as unknown as { getSavingsBalance: () => Promise<bigint> }
      ).getSavingsBalance();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetSavingsHistory() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<SavingsTransaction[]>({
    queryKey: ["savingsHistory", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getSavingsHistory: () => Promise<SavingsTransaction[]>;
        }
      ).getSavingsHistory();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useDepositToSavings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          depositToSavings: (
            amount: bigint,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).depositToSavings(amount);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsBalance"] });
      queryClient.invalidateQueries({ queryKey: ["savingsHistory"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useWithdrawFromSavings() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          withdrawFromSavings: (
            amount: bigint,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).withdrawFromSavings(amount);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
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
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subject,
      firstMessage,
    }: { subject: string; firstMessage: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          openSupportTicket: (
            subject: string,
            firstMessage: string,
          ) => Promise<
            { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }
          >;
        }
      ).openSupportTicket(subject, firstMessage);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportConversation"] });
      queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
    },
  });
}

export function useSendSupportMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          sendSupportMessage: (
            message: string,
          ) => Promise<
            { __kind__: "ok"; ok: bigint } | { __kind__: "err"; err: string }
          >;
        }
      ).sendSupportMessage(message);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportMessages"] });
    },
  });
}

export function useGetSupportConversation() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<SupportConversation | null>({
    queryKey: ["supportConversation", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      return (
        actor as unknown as {
          getSupportConversation: () => Promise<SupportConversation | null>;
        }
      ).getSupportConversation();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetSupportMessages() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<SupportMessage[]>({
    queryKey: ["supportMessages", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          getSupportMessages: () => Promise<SupportMessage[]>;
        }
      ).getSupportMessages();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useMarkSupportMessagesRead() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      await (
        actor as unknown as { markSupportMessagesRead: () => Promise<void> }
      ).markSupportMessagesRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unreadSupportCount"] });
      queryClient.invalidateQueries({ queryKey: ["supportConversation"] });
    },
  });
}

export function useGetUnreadSupportCount() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery<number>({
    queryKey: ["unreadSupportCount", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await (
        actor as unknown as { getUnreadSupportCount: () => Promise<bigint> }
      ).getUnreadSupportCount();
      return Number(count);
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 30_000,
  });
}

export function useAdminGetAllSupportConversations() {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<[Principal, SupportConversation][]>({
    queryKey: ["adminSupportConversations"],
    queryFn: async () => {
      if (!actor) return [];
      return (
        actor as unknown as {
          adminGetAllSupportConversations: () => Promise<
            [Principal, SupportConversation][]
          >;
        }
      ).adminGetAllSupportConversations();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminGetSupportMessages(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor(createActor);

  return useQuery<SupportMessage[]>({
    queryKey: ["adminSupportMessages", userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      return (
        actor as unknown as {
          adminGetSupportMessages: (p: Principal) => Promise<SupportMessage[]>;
        }
      ).adminGetSupportMessages(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

export function useAdminReplySupportMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userPrincipal,
      message,
    }: { userPrincipal: Principal; message: string }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          adminReplySupportMessage: (
            p: Principal,
            message: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).adminReplySupportMessage(userPrincipal, message);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["adminSupportMessages", vars.userPrincipal.toString()],
      });
    },
  });
}

export function useAdminCloseSupportTicket() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      const result = await (
        actor as unknown as {
          adminCloseSupportTicket: (
            p: Principal,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).adminCloseSupportTicket(userPrincipal);
      if (result.__kind__ === "err") throw new Error(result.err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["adminSupportConversations"],
      });
    },
  });
}

// ─── Split Payment Hooks ──────────────────────────────────────────────────────

export type {
  SplitPayment,
  SplitParticipant,
} from "../backend";
export { SplitPaymentStatus, SplitParticipantStatus } from "../backend";

export function useGetSplitPayments() {
  const { actor, isFetching: actorFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["splitPayments", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSplitPayments();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateSplitPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      totalAmount,
      description,
      participantShares,
    }: {
      totalAmount: bigint;
      description: string;
      participantShares: Array<[Principal, bigint]>;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.createSplitPayment(
        totalAmount,
        description,
        participantShares,
      );
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useRespondToSplitPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      splitId,
      accept,
    }: { splitId: string; accept: boolean }) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.respondToSplitPayment(splitId, accept);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

export function useCancelSplitPayment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (splitId: string) => {
      if (!actor) throw new Error("Actor not available");
      const result = await actor.cancelSplitPayment(splitId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splitPayments"] });
    },
  });
}

// ─── Resolve User By Username ─────────────────────────────────────────────────

/**
 * Returns a stable function that resolves a username/phone to its Principal.
 * Calls actor.resolveUserByUsername(username) — new backend method.
 * Returns null if the user is not found or the actor is not ready.
 */
export function useResolveUserByUsername() {
  const { actor } = useActor(createActor);

  return async (username: string): Promise<Principal | null> => {
    if (!actor) return null;
    const result = await (
      actor as unknown as {
        resolveUserByUsername: (username: string) => Promise<[] | [Principal]>;
      }
    ).resolveUserByUsername(username);
    // Motoko ?Principal returns [] | [Principal]
    return result.length > 0 ? (result[0] as Principal) : null;
  };
}

// ─── Fee Calculation Hook (local implementation — backend calculateFee coming soon) ───

type FeeType =
  | "creditCard"
  | "businessReceive"
  | "instantDeposit"
  | "atm"
  | "foreign";

/**
 * Calculate platform fees in cents.
 * Backend calculateFee function is being added — using local calculation for now.
 * TODO: wire to actor.calculateFee(feeType, amount) when backend engineer adds it.
 */
export function useCalculateFee(
  feeType: FeeType | null,
  amount: number, // in cents
) {
  return useQuery<number>({
    queryKey: ["calculateFee", feeType, amount],
    queryFn: async () => {
      if (!feeType || amount <= 0) return 0;
      // Local calculation until backend provides calculateFee
      if (feeType === "creditCard") return Math.ceil(amount * 0.03);
      if (feeType === "instantDeposit")
        return Math.max(
          25,
          Math.min(Math.ceil(amount * 0.015), Math.ceil(amount * 0.025)),
        );
      if (feeType === "atm") return 250; // $2.50 in cents
      if (feeType === "foreign") return Math.ceil(amount * 0.03);
      if (feeType === "businessReceive") return Math.ceil(amount * 0.026) + 15;
      return 0;
    },
    enabled: !!feeType && amount > 0,
    staleTime: Number.POSITIVE_INFINITY, // fee rules don't change at runtime
  });
}
