import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface SavingsTransaction {
    id: bigint;
    direction: SavingsDirection;
    owner: Principal;
    timestamp: bigint;
    amount: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface VaultStatus {
    unlockPending: boolean;
    locked: boolean;
    hoursRemaining?: number;
    shouldShowAlert: boolean;
}
export interface Dispute {
    id: string;
    status: DisputeStatus;
    submitterPrincipal: Principal;
    createdAt: bigint;
    resolution?: string;
    transactionTimestamp: bigint;
    updatedAt: bigint;
    counterpartyPrincipal: Principal;
    reason: string;
}
export interface Tip {
    toUser: Principal;
    professional: boolean;
    message: string;
    timestamp: bigint;
    fromUser: Principal;
    currencyType: Variant_fiat_crypto;
    amount: bigint;
}
export interface DirectDeposit {
    id: string;
    status: string;
    createdAt: bigint;
    description: string;
    isTest: boolean;
    userPrincipal: Principal;
    clearAt: bigint;
    amount: bigint;
}
export type DeletionStatus = {
    __kind__: "pending";
    pending: {
        scheduledDeletionTime: bigint;
    };
} | {
    __kind__: "not_requested";
    not_requested: null;
} | {
    __kind__: "finalized";
    finalized: null;
};
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface GDPRAuditEvent {
    principal: Principal;
    timestamp: bigint;
    eventType: GDPRAuditEventType;
}
export interface SplitPayment {
    id: string;
    status: SplitPaymentStatus;
    participants: Array<SplitParticipant>;
    initiator: Principal;
    createdAt: bigint;
    description: string;
    totalAmount: bigint;
    settledAt?: bigint;
}
export interface SupportMessage {
    id: bigint;
    read: boolean;
    conversationId: bigint;
    senderPrincipal: Principal;
    message: string;
    timestamp: bigint;
    senderIsAdmin: boolean;
}
export interface SecurityEvent {
    userId: Principal;
    timestamp: bigint;
    details: string;
    eventType: string;
}
export interface RecurringPayment {
    id: bigint;
    owner: Principal;
    lastRunAt?: bigint;
    createdAt: bigint;
    totalRuns: bigint;
    enabled: boolean;
    toUser: Principal;
    message: string;
    nextRunTime: bigint;
    frequency: RecurringFrequency;
    amount: bigint;
}
export interface SmartReceipt {
    month: bigint;
    userId: Principal;
    generatedAt: bigint;
    professionalTips: Array<Tip>;
    year: bigint;
    totalAmount: bigint;
}
export interface DirectDepositAccount {
    status: string;
    routingNumber: string;
    createdAt: bigint;
    accountNumber: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface StaffMember {
    status: StaffMemberStatus;
    principal: Principal;
    joinedAt: bigint;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface CompilationStatus {
    obfuscationLayer: string;
    verificationTimestamp: bigint;
    tooltipNote: string;
}
export interface SplitParticipant {
    status: SplitParticipantStatus;
    principal: Principal;
    nickname: string;
    amount: bigint;
}
export interface SupportConversation {
    id: bigint;
    status: SupportStatus;
    lastMessageAt: bigint;
    subject: string;
    createdAt: bigint;
    userPrincipal: Principal;
}
export interface UserProfile {
    bio: string;
    kycProviderReference?: string;
    username: string;
    kycSubmissionTimestamp?: bigint;
    walletAddress?: string;
    email: string;
    kycStatus: KYCStatus;
    isVerified: boolean;
    isFirstWalletConnection: boolean;
    photo?: ExternalBlob;
    phoneNumber?: string;
    currentStatus?: Status;
}
export type PinCheckResult = {
    __kind__: "verified";
    verified: null;
} | {
    __kind__: "blocked";
    blocked: bigint;
} | {
    __kind__: "incorrect";
    incorrect: bigint;
};
export interface SearchResult {
    bio: string;
    username: string;
    isVerified: boolean;
    photo?: ExternalBlob;
}
export type Time = bigint;
export interface PayoutRecord {
    id: string;
    distributions: Array<[Principal, bigint]>;
    notes: string;
    timestamp: bigint;
    managerPrincipal: Principal;
}
export interface PaymentMethod {
    id: string;
    methodType: PaymentMethodType;
    last4: string;
    bankName?: string;
    accountType?: string;
    addedAt: bigint;
    stripeVerificationStatus: string;
    brand?: string;
}
export interface FraudAlert {
    resolved: boolean;
    userId: Principal;
    timestamp: bigint;
    severity: Variant_low_high_medium;
    reason: string;
}
export interface TwoFactorSettings {
    method?: string;
    backupCodes: Array<string>;
    enabled: boolean;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MoneyRequest {
    id: bigint;
    status: RequestStatus;
    toUser: Principal;
    message: string;
    paidTipId?: bigint;
    timestamp: bigint;
    fromUser: Principal;
    amount: bigint;
}
export interface AIQuery {
    queryText: string;
    userId: Principal;
    response: string;
    timestamp: bigint;
}
export interface BusinessApplication {
    status: BusinessApplicationStatus;
    termsAccepted: boolean;
    createdAt: bigint;
    rejectionReason?: string;
    businessName: string;
    businessType: string;
    description: string;
    updatedAt: bigint;
}
export interface ActiveSession {
    loginTimestamp: bigint;
    deviceName: string;
    sessionId: string;
    location: string;
}
export interface StaffInvite {
    status: StaffInviteStatus;
    method: StaffInviteMethod;
    expiresAt: bigint;
    inviteePrincipal?: Principal;
    createdAt: bigint;
    inviteCode: string;
    managerPrincipal: Principal;
}
export interface VoicePrintData {
    voicePrintHash: string;
    lastVerified?: bigint;
    enrollmentDate: bigint;
}
export interface SpendingLimitView {
    lastMonthReset: bigint;
    monthlyLimit?: bigint;
    lastWeekReset: bigint;
    monthlySpent: bigint;
    lastDayReset: bigint;
    dailyLimit?: bigint;
    dailySpent: bigint;
    weeklyLimit?: bigint;
    weeklySpent: bigint;
}
export interface EncryptionEvent {
    dataType: string;
    timestamp: bigint;
    eventType: string;
}
export interface TipPoolConfig {
    mode: TipPoolMode;
    enabled: boolean;
    customSplits: Array<[Principal, bigint]>;
}
export interface Status {
    customStatus?: string;
    createdAt: bigint;
    tableNumber?: bigint;
    isActive: boolean;
    statusType: string;
}
export interface BiometricSettings {
    biometricType?: string;
    enabled: boolean;
}
export enum BusinessApplicationStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum DisputeStatus {
    resolved = "resolved",
    open = "open",
    rejected = "rejected"
}
export enum GDPRAuditEventType {
    deletion_finalized = "deletion_finalized",
    deletion_requested = "deletion_requested",
    deletion_cancelled = "deletion_cancelled",
    export_requested = "export_requested"
}
export enum KYCStatus {
    notSubmitted = "notSubmitted",
    verified = "verified",
    pending = "pending",
    failed = "failed"
}
export enum PaymentMethodType {
    bankAccount = "bankAccount",
    card = "card"
}
export enum RecurringFrequency {
    monthly = "monthly",
    daily = "daily",
    weekly = "weekly"
}
export enum RequestStatus {
    cancelled = "cancelled",
    pending = "pending",
    paid = "paid",
    declined = "declined"
}
export enum SavingsDirection {
    fromSavings = "fromSavings",
    toSavings = "toSavings"
}
export enum SplitParticipantStatus {
    Paid = "Paid",
    Accepted = "Accepted",
    Declined = "Declined",
    Pending = "Pending"
}
export enum SplitPaymentStatus {
    Active = "Active",
    Cancelled = "Cancelled",
    Settled = "Settled"
}
export enum StaffInviteMethod {
    link = "link",
    phone = "phone"
}
export enum StaffInviteStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum StaffMemberStatus {
    active = "active",
    removed = "removed"
}
export enum SupportStatus {
    resolved = "resolved",
    open = "open",
    waitingForUser = "waitingForUser"
}
export enum TipPoolMode {
    custom = "custom",
    equal = "equal"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_atm_creditCard_instantDeposit_foreign_businessReceive {
    atm = "atm",
    creditCard = "creditCard",
    instantDeposit = "instantDeposit",
    foreign = "foreign",
    businessReceive = "businessReceive"
}
export enum Variant_fiat_crypto {
    fiat = "fiat",
    crypto = "crypto"
}
export enum Variant_low_high_medium {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Variant_ok {
    ok = "ok"
}
export interface backendInterface {
    /**
     * / Staff: accept a roster invite (link-based or phone-based)
     */
    acceptStaffInvite(inviteCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    acknowledgeVaultAlert(): Promise<void>;
    addActiveSession(session: ActiveSession): Promise<void>;
    addPaymentMethod(method: PaymentMethod): Promise<void>;
    addStatus(status: Status): Promise<void>;
    adminCloseSupportTicket(userPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminGetAllSupportConversations(): Promise<Array<[Principal, SupportConversation]>>;
    adminGetSupportMessages(userPrincipal: Principal): Promise<Array<SupportMessage>>;
    adminReplySupportMessage(userPrincipal: Principal, message: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveBusinessApplication(applicant: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserRole(user: Principal, role: UserRole): Promise<void>;
    calculateFee(feeType: Variant_atm_creditCard_instantDeposit_foreign_businessReceive, amount: bigint): Promise<bigint>;
    cancelAccountDeletion(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Cancel a money request as the sender (fromUser).
     * / Only pending requests can be cancelled.
     */
    cancelMoneyRequest(requestId: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelRecurringPayment(id: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Initiator cancels an active split payment.
     */
    cancelSplitPayment(splitId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelVaultUnlock(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearSpendingLimits(): Promise<Variant_ok>;
    /**
     * / Admin-only: immediately complete a pending deposit and credit the user's balance.
     */
    completeDirectDeposit(depositId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createRecurringPayment(toUser: Principal, amount: bigint, message: string, frequency: RecurringFrequency): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Manager: create a roster invite link (expires 72h, good for up to 50 accepts)
     */
    createRosterInviteLink(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Create a split-payment session.
     * / participantShares: list of (principal, amountInCents) — amounts must sum to totalAmount.
     */
    createSplitPayment(totalAmount: bigint, description: string, participantShares: Array<[Principal, bigint]>): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createStripeCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deactivateStatus(): Promise<void>;
    /**
     * / Staff: decline a roster invite
     */
    declineStaffInvite(inviteCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteUserData(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteVoicePrint(): Promise<void>;
    deposit(amount: bigint): Promise<void>;
    depositToSavings(amount: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    exportUserData(): Promise<string>;
    finalizeAccountDeletion(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    finalizeVaultUnlock(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Query: find a user by their registered phone number (privacy-protected)
     */
    findUserByPhone(phone: string): Promise<UserProfile | null>;
    generateInviteCode(): Promise<string>;
    generateSmartReceipt(month: bigint, year: bigint): Promise<SmartReceipt>;
    getAIQueryHistory(user: Principal): Promise<Array<AIQuery>>;
    getAccountDeletionStatus(): Promise<DeletionStatus>;
    getActiveSessions(user: Principal): Promise<Array<ActiveSession>>;
    getAllBusinessApplications(): Promise<Array<[Principal, BusinessApplication]>>;
    getAllFraudAlerts(): Promise<Array<FraudAlert>>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getAllSecurityEvents(): Promise<Array<SecurityEvent>>;
    getAllTips(): Promise<Array<Tip>>;
    /**
     * / Returns whether the App Lock PIN feature is enabled for the caller.
     * / Defaults to false if no preference has been stored (feature is OFF by default).
     */
    getAppLockEnabled(): Promise<boolean>;
    getBalance(user: Principal): Promise<bigint>;
    getBiometricSettings(user: Principal): Promise<BiometricSettings | null>;
    getCallerBusinessApplicationStatus(): Promise<BusinessApplicationStatus | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompilationStatus(): Promise<CompilationStatus>;
    getCurrentStatus(user: Principal): Promise<Status | null>;
    /**
     * / Returns all direct deposits (pending + completed + failed) for the caller.
     * / Lazy evaluation: any pending deposit whose clearAt <= now is auto-completed first.
     */
    getDirectDepositHistory(): Promise<Array<DirectDeposit>>;
    getEncryptionLog(user: Principal): Promise<Array<EncryptionEvent>>;
    getFraudAlerts(user: Principal): Promise<Array<FraudAlert>>;
    getGDPRAuditLog(): Promise<Array<GDPRAuditEvent>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getKYCConfigurationStatus(): Promise<{
        provider: string;
        configured: boolean;
    }>;
    getLegalAndPrivacy(): Promise<{
        terms: string;
        privacy: string;
    }>;
    getManageMyDataAuditLog(): Promise<Array<GDPRAuditEvent>>;
    /**
     * / Manager: get the full roster for the calling manager
     */
    getManagerRoster(): Promise<Array<StaffMember>>;
    getMyBusinessApplication(): Promise<BusinessApplication | null>;
    getMyDisputes(): Promise<Array<Dispute>>;
    getMyRecurringPayments(): Promise<Array<RecurringPayment>>;
    /**
     * / Staff: get all pending invites sent TO the caller
     */
    getMyRosterInvites(): Promise<Array<StaffInvite>>;
    /**
     * / Get or create the caller's virtual direct deposit account.
     * / Routing and account numbers are derived deterministically from the caller's
     * / Principal, so they are stable across calls and canister upgrades.
     */
    getOrCreateDirectDepositAccount(): Promise<DirectDepositAccount>;
    getPaymentMethods(user: Principal): Promise<Array<PaymentMethod>>;
    /**
     * / Manager: get full payout history
     */
    getPayoutHistory(): Promise<Array<PayoutRecord>>;
    getPendingBusinessApplications(): Promise<Array<[Principal, BusinessApplication]>>;
    /**
     * / Returns all pending direct deposits for the caller.
     */
    getPendingDirectDeposits(): Promise<Array<DirectDeposit>>;
    /**
     * / Returns only PENDING money requests addressed to the caller, newest first.
     */
    getPendingRequestsReceived(): Promise<Array<MoneyRequest>>;
    getProfessionalTips(user: Principal): Promise<Array<Tip>>;
    getPublicCurrentStatus(user: Principal): Promise<Status | null>;
    getPublicProfile(username: string): Promise<{
        bio: string;
        username: string;
        isVerified: boolean;
        photo?: ExternalBlob;
        currentStatus?: Status;
    } | null>;
    getPublicProfileByPrincipal(user: Principal): Promise<{
        bio: string;
        username: string;
        isVerified: boolean;
        photo?: ExternalBlob;
        currentStatus?: Status;
    } | null>;
    /**
     * / Returns all money requests sent TO the caller, newest first.
     */
    getRequestsReceived(): Promise<Array<MoneyRequest>>;
    /**
     * / Returns all money requests sent BY the caller, newest first.
     */
    getRequestsSent(): Promise<Array<MoneyRequest>>;
    getSMSConfigurationStatus(): Promise<boolean>;
    getSavingsBalance(): Promise<bigint>;
    getSavingsHistory(): Promise<Array<SavingsTransaction>>;
    getSecurityEvents(user: Principal): Promise<Array<SecurityEvent>>;
    getSmartReceipt(user: Principal, month: bigint, year: bigint): Promise<SmartReceipt | null>;
    getSpendingLimits(): Promise<SpendingLimitView | null>;
    /**
     * / Returns a single split payment by ID (only if caller is initiator or participant).
     */
    getSplitById(splitId: string): Promise<SplitPayment | null>;
    /**
     * / Returns all split payments where caller is the initiator or a participant.
     */
    getSplitPayments(): Promise<Array<SplitPayment>>;
    /**
     * / Manager: get summed tips received per staff member since an optional timestamp, sorted descending
     */
    getStaffTipTotals(since: bigint | null): Promise<Array<[Principal, bigint]>>;
    getStatuses(user: Principal): Promise<Array<Status>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getSupportConversation(): Promise<SupportConversation | null>;
    getSupportMessages(): Promise<Array<SupportMessage>>;
    /**
     * / Manager: get current tip pool settings
     */
    getTipPoolSettings(): Promise<TipPoolConfig>;
    getTips(): Promise<Array<Tip>>;
    getTipsReceived(user: Principal): Promise<Array<Tip>>;
    getTipsSent(user: Principal): Promise<Array<Tip>>;
    getTwoFactorSettings(user: Principal): Promise<TwoFactorSettings | null>;
    getUnreadSupportCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVaultStatus(): Promise<VaultStatus>;
    getVoicePrint(user: Principal): Promise<VoicePrintData | null>;
    hasExistingPin(): Promise<boolean>;
    /**
     * / Manager: invite a staff member by their phone number
     */
    inviteStaffByPhone(phone: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    isCallerAdmin(): Promise<boolean>;
    isKYCConfigured(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    lockVault(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    logAIQuery(queryText: string, response: string): Promise<void>;
    logEncryptionEvent(event: EncryptionEvent): Promise<void>;
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    logoutSession(sessionId: string): Promise<void>;
    markSupportMessagesRead(): Promise<void>;
    markTutorialCompleted(): Promise<void>;
    openSupportTicket(subject: string, firstMessage: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Admin-only: execute all due recurring payments.
     */
    processRecurringPayments(): Promise<void>;
    recordDisputeRequest(transactionTimestamp: bigint, counterpartyPrincipal: Principal, reason: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    recordExportRequest(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Manager: record a payout distribution (does NOT move funds — manager controls external settlement)
     */
    recordPayout(distributions: Array<[Principal, bigint]>, notes: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectBusinessApplication(applicant: Principal, reason: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeActiveSession(sessionId: string): Promise<void>;
    removePaymentMethod(methodId: string): Promise<void>;
    /**
     * / Manager: remove a staff member from the roster
     */
    removeStaffMember(staffPrincipal: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeStatus(index: bigint): Promise<void>;
    removeWalletAddress(): Promise<void>;
    reportFraudAlert(alert: FraudAlert): Promise<void>;
    requestAccountDeletion(): Promise<{
        __kind__: "ok";
        ok: {
            scheduledDeletionTime: bigint;
            confirmationToken: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Create a money request to another user.
     * / A message is REQUIRED — callers cannot request money without explaining what it's for.
     */
    requestMoney(toUser: Principal, amount: bigint, message: string, currencyType: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestVaultUnlock(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resolveDispute(disputeId: string, resolution: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resolveFraudAlert(userId: Principal, timestamp: bigint): Promise<void>;
    /**
     * / Resolve a user Principal by their username or phone number.
     * / Returns the Principal of the matching user, or null if not found.
     * / Used by the split-payment UI to look up real Principals during participant search.
     */
    resolveUserByUsername(usernameOrPhone: string): Promise<Principal | null>;
    /**
     * / Respond to a money request as the recipient (toUser).
     * / accept=true: deducts from caller's balance, credits requester, creates a tip record.
     * / accept=false: marks the request as declined.
     */
    respondToMoneyRequest(requestId: bigint, accept: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Respond to a split payment — participant accepts or declines their share.
     * / On decline: participant's status → #Declined, whole split → #Cancelled, initiator notified.
     * / On accept: participant's status → #Accepted; if ALL accepted, payments are settled immediately.
     */
    respondToSplitPayment(splitId: string, accept: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveVoicePrint(voicePrint: VoicePrintData): Promise<void>;
    saveWalletAddress(walletAddress: string): Promise<{
        __kind__: "error";
        error: string;
    } | {
        __kind__: "success";
        success: boolean;
    }>;
    searchUsers(searchTerm: string): Promise<Array<SearchResult>>;
    sendSupportMessage(message: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendTip(toUser: Principal, amount: bigint, message: string, professional: boolean, currencyType: Variant_fiat_crypto): Promise<void>;
    sendTipWithFee(toUser: Principal, amount: bigint, message: string, professional: boolean, currencyType: Variant_fiat_crypto, paymentMethod: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    /**
     * / Enables or disables the App Lock PIN feature for the caller.
     * / When disabling, the stored PIN data is cleared so a fresh PIN must be
     * / set if the feature is re-enabled later.
     */
    setAppLockEnabled(enabled: boolean): Promise<void>;
    setBiometricSettings(settings: BiometricSettings): Promise<void>;
    setKYCConfiguration(apiKey: string, provider: string): Promise<void>;
    setKYCStatus(user: Principal, status: KYCStatus, providerReference: string | null): Promise<void>;
    setPinHash(salt: Uint8Array, hash: Uint8Array): Promise<void>;
    setSMSConfiguration(accountSid: string, authToken: string, fromPhone: string): Promise<void>;
    setSpendingLimits(daily: bigint | null, weekly: bigint | null, monthly: bigint | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    /**
     * / Manager: enable/disable tip pooling and set distribution mode
     */
    setTipPoolMode(enabled: boolean, mode: TipPoolMode): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setTwoFactorSettings(settings: TwoFactorSettings): Promise<void>;
    setUserVerificationStatus(user: Principal, isVerified: boolean): Promise<void>;
    /**
     * / Admin-only: simulate an incoming direct deposit for a target user.
     * / Creates a pending deposit with clearAt set ~2 business days (48h) in the future.
     */
    simulateDirectDeposit(targetUser: Principal, amount: bigint, description: string, isTest: boolean): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    startWithdrawalOTPChallenge(amount: bigint): Promise<{
        __kind__: "ok";
        ok: {
            expiresIn: bigint;
            challengeId: string;
            phoneSuffix: string;
        };
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitBusinessApplication(businessName: string, businessType: string, description: string, termsAccepted: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitKYC(): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    toggleRecurringPayment(id: bigint, enabled: boolean): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updatePaymentMethodVerificationStatus(methodId: string, status: string): Promise<void>;
    verifyPinHash(salt: Uint8Array, hash: Uint8Array): Promise<PinCheckResult>;
    verifyWithdrawalOTP(challengeId: string, otp: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    withdraw(amount: bigint, verifiedOtpId: string | null): Promise<void>;
    withdrawFromSavings(amount: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    withdrawWithFee(amount: bigint, verifiedOtpId: string | null, withdrawalType: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
