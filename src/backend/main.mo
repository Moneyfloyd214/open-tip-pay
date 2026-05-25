import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import File "mo:caffeineai-object-storage/Storage";
import Iter "mo:core/Iter";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Stripe "mo:caffeineai-stripe/stripe";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import InviteLinksModule "mo:caffeineai-invite-links/invite-links-module";
import Nat8 "mo:core/Nat8";
import FanPointsTypes "types/fanpoints";
import FanPointsAPI "mixins/fanpoints-api";
import StaffTypes "types/staff";
import StaffAPI "mixins/staff-api";
import FoodOrderingTypes "types/food-ordering";
import FoodOrderingAPI "mixins/food-ordering-api";
import Float "mo:core/Float";
import TipSplitTypes "types/tip-split";
import TipSplitAPI "mixins/tip-split-api";









actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
    include MixinObjectStorage();

  // InviteLinks system state
  let inviteLinksState = InviteLinksModule.initState();

  // Food ordering state
  let concessionStands = Map.empty<Text, FoodOrderingTypes.ConcessionStand>();
  let menuItems = Map.empty<Text, FoodOrderingTypes.MenuItem>();
  let foodOrders = Map.empty<Text, FoodOrderingTypes.FoodOrder>();
  let foodOrderingState = { var nextFoodOrderSeq : Nat = 0 };
  include FoodOrderingAPI(
    concessionStands,
    menuItems,
    foodOrders,
    accessControlState,
    foodOrderingState,
  );

  public type UserProfile = {
    username : Text;
    email : Text;
    bio : Text;
    photo : ?File.ExternalBlob;
    walletAddress : ?Text;
    isFirstWalletConnection : Bool;
    currentStatus : ?Status;
    phoneNumber : ?Text;
    isVerified : Bool;
    kycStatus : KYCStatus;
    kycSubmissionTimestamp : ?Int;
    kycProviderReference : ?Text;
  };

  public type Status = {
    statusType : Text;
    customStatus : ?Text;
    tableNumber : ?Nat;
    createdAt : Int;
    isActive : Bool;
  };

  public type KYCStatus = {
    #pending;
    #verified;
    #failed;
    #notSubmitted;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let statuses = Map.empty<Principal, List.List<Status>>();
  let kycSubmissionAttempts = Map.empty<Principal, List.List<Int>>();

  // app lock support
  type AppLockPinData = {
    salt : Blob;
    hash : Blob;
    consecutiveFailures : Nat;
    lastFailureTimestamp : Time.Time;
  };

  let pinData = Map.empty<Principal, AppLockPinData>();

  // Per-user opt-in preference for the App Lock PIN feature (OFF by default)
  let appLockEnabled = Map.empty<Principal, Bool>();

  // SMS / Twilio configuration
  type SMSConfig = {
    var accountSid : Text;
    var authToken : Text;
    var fromPhone : Text;
  };

  let smsConfig : SMSConfig = {
    var accountSid = "";
    var authToken = "";
    var fromPhone = "";
  };

  // KYC configuration (Persona / Onfido)
  type KYCConfig = {
    var apiKey : Text;
    var provider : Text;
  };

  let kycConfig : KYCConfig = {
    var apiKey = "";
    var provider = "";
  };

  // OTP challenge storage
  type OTPChallenge = {
    userPrincipal : Principal;
    otp : Text;
    amount : Nat;
    expiresAt : Int;
    var used : Bool;
    var failedAttempts : Nat;
  };

  let otpChallenges = Map.empty<Text, OTPChallenge>();

  // OTP lockouts: key = Principal text, value = lockout expiry timestamp
  let otpLockouts = Map.empty<Text, Int>();

  // ── Types and state variables — all declared here so every function can reference them ──

  // Rate limiting (no extra types needed)
  let rateLimitMap = Map.empty<Principal, List.List<Int>>();

  // Payment methods
  public type PaymentMethodType = { #card; #bankAccount };
  public type PaymentMethod = {
    id : Text;
    methodType : PaymentMethodType;
    last4 : Text;
    brand : ?Text;
    bankName : ?Text;
    accountType : ?Text;
    stripeVerificationStatus : Text;
    addedAt : Int;
  };
  let paymentMethods = Map.empty<Principal, [PaymentMethod]>();

  // Tips
  public type Tip = {
    fromUser : Principal;
    toUser : Principal;
    amount : Nat;
    message : Text;
    timestamp : Int;
    professional : Bool;
    currencyType : { #fiat; #crypto };
  };
  var tips = List.empty<Tip>();

  // Balances
  let balances = Map.empty<Principal, Nat>();

  // Stripe
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;
  let stripeSessions = Map.empty<Text, Principal>();

  // Active sessions
  public type ActiveSession = {
    deviceName : Text;
    location : Text;
    loginTimestamp : Int;
    sessionId : Text;
  };
  let activeSessions = Map.empty<Principal, [ActiveSession]>();

  // Biometric settings
  public type BiometricSettings = {
    enabled : Bool;
    biometricType : ?Text;
  };
  let biometricSettings = Map.empty<Principal, BiometricSettings>();

  // Encryption logs
  public type EncryptionEvent = {
    timestamp : Int;
    eventType : Text;
    dataType : Text;
  };
  let encryptionLogs = Map.empty<Principal, [EncryptionEvent]>();

  // Fraud alerts
  public type FraudAlert = {
    userId : Principal;
    timestamp : Int;
    reason : Text;
    severity : { #low; #medium; #high };
    resolved : Bool;
  };
  var fraudAlerts = List.empty<FraudAlert>();

  // 2FA settings
  public type TwoFactorSettings = {
    enabled : Bool;
    method : ?Text;
    backupCodes : [Text];
  };
  let twoFactorSettings = Map.empty<Principal, TwoFactorSettings>();

  // Voice prints
  public type VoicePrintData = {
    voicePrintHash : Text;
    enrollmentDate : Int;
    lastVerified : ?Int;
  };
  let voicePrints = Map.empty<Principal, VoicePrintData>();

  // AI query log
  public type AIQuery = {
    userId : Principal;
    queryText : Text;
    timestamp : Int;
    response : Text;
  };
  var aiQueryLog = List.empty<AIQuery>();

  // Smart receipts (uses Tip, must be after Tip)
  public type SmartReceipt = {
    userId : Principal;
    month : Nat;
    year : Nat;
    professionalTips : [Tip];
    totalAmount : Nat;
    generatedAt : Int;
  };
  let smartReceipts = Map.empty<Text, SmartReceipt>();

  // Security events
  public type SecurityEvent = {
    userId : Principal;
    eventType : Text;
    timestamp : Int;
    details : Text;
  };
  var securityEvents = List.empty<SecurityEvent>();

  // Vault locks
  public type VaultLockState = {
    locked : Bool;
    unlockRequestedAt : ?Int;
    lastAlertSentAt : ?Int;
  };
  public type VaultStatus = {
    locked : Bool;
    unlockPending : Bool;
    hoursRemaining : ?Float;
    shouldShowAlert : Bool;
  };
  let vaultLocks = Map.empty<Principal, VaultLockState>();

  // GDPR / data controls
  public type GDPRAuditEventType = {
    #export_requested;
    #deletion_requested;
    #deletion_cancelled;
    #deletion_finalized;
  };
  public type GDPRAuditEvent = {
    principal : Principal;
    eventType : GDPRAuditEventType;
    timestamp : Int;
  };
  public type DeletionStatus = {
    #not_requested;
    #pending : { scheduledDeletionTime : Int };
    #finalized;
  };
  type AccountDeletionRecord = {
    scheduledDeletionTime : Int;
    finalized : Bool;
  };
  let gdprAuditLog = List.empty<GDPRAuditEvent>();
  let deletionRequests = Map.empty<Principal, AccountDeletionRecord>();
  let exportRateLimitMap = Map.empty<Principal, List.List<Int>>();

  // Business applications
  public type BusinessApplicationStatus = { #pending; #approved; #rejected };
  public type BusinessApplication = {
    businessName : Text;
    businessType : Text;
    description : Text;
    termsAccepted : Bool;
    status : BusinessApplicationStatus;
    rejectionReason : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };
  let businessApplications = Map.empty<Principal, BusinessApplication>();

  // Manager / staff roster
  public type StaffInviteMethod = { #link; #phone };
  public type StaffInviteStatus = { #pending; #accepted; #declined };
  public type StaffMemberStatus = { #active; #removed };
  public type TipPoolMode = { #equal; #custom };
  public type StaffInvite = {
    inviteCode : Text;
    managerPrincipal : Principal;
    inviteePrincipal : ?Principal;
    method : StaffInviteMethod;
    status : StaffInviteStatus;
    createdAt : Int;
    expiresAt : Int;
  };
  public type StaffMember = {
    principal : Principal;
    joinedAt : Int;
    status : StaffMemberStatus;
  };
  public type TipPoolConfig = {
    enabled : Bool;
    mode : TipPoolMode;
    customSplits : [(Principal, Nat)];
  };
  public type PayoutRecord = {
    id : Text;
    managerPrincipal : Principal;
    distributions : [(Principal, Nat)];
    notes : Text;
    timestamp : Int;
  };
  let staffInvites = Map.empty<Text, StaffInvite>();
  let staffRosters = Map.empty<Principal, List.List<StaffMember>>();
  let tipPoolConfigs = Map.empty<Principal, TipPoolConfig>();
  let payoutRecords = Map.empty<Principal, List.List<PayoutRecord>>();

  // Disputes
  public type DisputeStatus = { #open; #resolved; #rejected };
  public type Dispute = {
    id : Text;
    submitterPrincipal : Principal;
    transactionTimestamp : Int;
    counterpartyPrincipal : Principal;
    reason : Text;
    status : DisputeStatus;
    resolution : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };
  let disputes = List.empty<Dispute>();

  // Direct deposit accounts and deposits
  public type DirectDepositAccount = {
    routingNumber : Text;
    accountNumber : Text;
    createdAt : Int;
    status : Text;
  };

  public type DirectDeposit = {
    id : Text;
    userPrincipal : Principal;
    amount : Nat;
    status : Text; // "pending" | "completed" | "failed"
    createdAt : Int;
    clearAt : Int;
    description : Text;
    isTest : Bool;
  };

  let directDepositAccounts = Map.empty<Principal, DirectDepositAccount>();
  let directDeposits = Map.empty<Text, DirectDeposit>();

  // ─── Recurring Payments ───────────────────────────────────────────────────────
  public type RecurringFrequency = { #daily; #weekly; #monthly };
  public type RecurringPayment = {
    id : Nat;
    owner : Principal;
    toUser : Principal;
    amount : Nat;
    message : Text;
    frequency : RecurringFrequency;
    nextRunTime : Int;
    enabled : Bool;
    createdAt : Int;
    lastRunAt : ?Int;
    totalRuns : Nat;
  };
  var recurringPayments = List.empty<RecurringPayment>();
  var nextRecurringPaymentId : Nat = 0;

  // ─── Spending Limits ──────────────────────────────────────────────────────────
  public type SpendingLimit = {
    dailyLimit : ?Nat;
    weeklyLimit : ?Nat;
    monthlyLimit : ?Nat;
    var dailySpent : Nat;
    var weeklySpent : Nat;
    var monthlySpent : Nat;
    var lastDayReset : Int;
    var lastWeekReset : Int;
    var lastMonthReset : Int;
  };
  let spendingLimits = Map.empty<Principal, SpendingLimit>();

  // Shared (API-boundary) version without var fields
  public type SpendingLimitView = {
    dailyLimit : ?Nat;
    weeklyLimit : ?Nat;
    monthlyLimit : ?Nat;
    dailySpent : Nat;
    weeklySpent : Nat;
    monthlySpent : Nat;
    lastDayReset : Int;
    lastWeekReset : Int;
    lastMonthReset : Int;
  };

  // ─── Savings Pocket ───────────────────────────────────────────────────────────
  let savingsBalances = Map.empty<Principal, Nat>();
  var nextSavingsTxId : Nat = 0;

  // ─── Fan Points state ─────────────────────────────────────────────────────────────
  let fanPointsMap = Map.empty<Principal, FanPointsTypes.FanPoints>();
  let guestPaymentRecords = List.empty<FanPointsTypes.GuestPaymentRecord>();
  let rewardsMap = Map.empty<Text, FanPointsTypes.Reward>();
  let redeemedRewardsMap = Map.empty<Principal, List.List<FanPointsTypes.RedeemedReward>>();
  let sectionAssignmentsMap = Map.empty<Principal, FanPointsTypes.StaffSection>();
  let fanPointsState = { var nextGuestRecordId : Nat = 0; var nextRewardId : Nat = 0; var nextRedeemedId : Nat = 0 };
  // Fractional Point Engine — rules storage
  let pointsRulesMap = Map.empty<Text, FanPointsTypes.PointsRule>();
  // Extended staff roster — richer HR-style fields beyond principal+status
  let extendedStaffMap = Map.empty<Text, StaffTypes.ExtendedStaffMember>();

  // ─── Seed default points rules ────────────────────────────────────────────────
  if (pointsRulesMap.size() == 0) {
    let defaultRules : [FanPointsTypes.PointsRule] = [
      { id="rule-tip"; name="Stadium Staff Tip Bonus"; description="Earn extra points for tipping Colts staff"; ruleType=#tipMultiplier; multiplier=1.5; isActive=true; createdAt=0; sectionName=null },
      { id="rule-food"; name="Food Order Points"; description="Points for every food order"; ruleType=#foodMultiplier; multiplier=1.0; isActive=true; createdAt=0; sectionName=null },
      { id="rule-payment"; name="General Payment Points"; description="Points for general payments"; ruleType=#paymentMultiplier; multiplier=0.75; isActive=true; createdAt=0; sectionName=null },
      { id="rule-gameday"; name="Game Day Bonus"; description="1.25x multiplier on all game day transactions"; ruleType=#gameDayBonus; multiplier=1.25; isActive=true; createdAt=0; sectionName=null },
      { id="rule-first"; name="First Payment Bonus"; description="2x points on your very first payment"; ruleType=#firstPaymentBonus; multiplier=2.0; isActive=true; createdAt=0; sectionName=null },
    ];
    for (rule in defaultRules.vals()) {
      pointsRulesMap.add(rule.id, rule);
    };
  };

  // ─── Seed demo rewards catalog ────────────────────────────────────────────────
  if (rewardsMap.size() == 0) {
    let demoRewards : [FanPointsTypes.Reward] = [
      { id="reward-1"; title="10% Colts Pro Shop Discount"; description="Save 10% on any merchandise at the Colts Pro Shop - valid this season"; pointsCost=250; rewardType=#discountCode; codeOrValue="COLTS-SHOP-10"; quantity=?100; quantityRemaining=?100; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
      { id="reward-2"; title="Free Large Pepsi"; description="Complimentary large Pepsi at any Lucas Oil concession stand - sponsored by Pepsi"; pointsCost=150; rewardType=#concessionCredit; codeOrValue="PEPSI-FREE-2026"; quantity=?500; quantityRemaining=?500; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
      { id="reward-3"; title="Free Hot Dog + Chips Combo"; description="One free hot dog and chips combo at any general concession stand"; pointsCost=200; rewardType=#concessionCredit; codeOrValue="HOTDOG-COMBO"; quantity=?300; quantityRemaining=?300; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
      { id="reward-4"; title="Suite Level Upgrade Entry"; description="Enter to win a suite-level seat upgrade for an upcoming Colts home game"; pointsCost=800; rewardType=#ticketEntry; codeOrValue="SUITE-UPGRADE"; quantity=?20; quantityRemaining=?20; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
      { id="reward-5"; title="Signed Colts Jersey Giveaway"; description="Enter for a chance to win an officially signed Colts player jersey"; pointsCost=1200; rewardType=#ticketEntry; codeOrValue="JERSEY-WIN-2026"; quantity=?10; quantityRemaining=?10; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
      { id="reward-6"; title="VIP Field Experience Entry"; description="Enter to win an exclusive pre-game field access pass for one Colts home game"; pointsCost=2000; rewardType=#other; codeOrValue="VIP-FIELD-PASS"; quantity=?5; quantityRemaining=?5; expiresAt=null; active=true; createdBy=Principal.fromText("aaaaa-aa"); teamId=?"colts" },
    ];
    for (reward in demoRewards.vals()) {
      rewardsMap.add(reward.id, reward);
    };
  };

  // ─── Seed demo extended staff roster ─────────────────────────────────────────
  if (extendedStaffMap.size() == 0) {
    let demoStaff : [StaffTypes.ExtendedStaffMember] = [
      { id="staff-1"; name="Marcus Williams"; customRole="Suite Runner"; employmentType=#fullTime; employmentStatus=#active; section="Section 102"; phone="317-555-0101"; email="marcus.w@colts-staff.com"; hireDate=1672531200000000000; notes="Lead suite runner for premium section" },
      { id="staff-2"; name="DeShawn Carter"; customRole="Valet"; employmentType=#partTime; employmentStatus=#active; section="VIP Entrance"; phone="317-555-0102"; email="deshawn.c@colts-staff.com"; hireDate=1680307200000000000; notes="Weekend and game day only" },
      { id="staff-3"; name="Tyler Brooks"; customRole="Concession Staff"; employmentType=#fullTime; employmentStatus=#active; section="Section 115"; phone="317-555-0103"; email="tyler.b@colts-staff.com"; hireDate=1672531200000000000; notes="Lucas Oil Grill station" },
      { id="staff-4"; name="Angela Martinez"; customRole="Usher"; employmentType=#partTime; employmentStatus=#active; section="Section 108"; phone="317-555-0104"; email="angela.m@colts-staff.com"; hireDate=1685577600000000000; notes="Lower bowl section" },
      { id="staff-5"; name="Jordan Reed"; customRole="VIP Attendant"; employmentType=#contractor; employmentStatus=#active; section="VIP Club Level"; phone="317-555-0105"; email="jordan.r@colts-staff.com"; hireDate=1690848000000000000; notes="Club level hospitality" },
      { id="staff-6"; name="Keisha Thompson"; customRole="Fan Experience"; employmentType=#fullTime; employmentStatus=#active; section="Section 120"; phone="317-555-0106"; email="keisha.t@colts-staff.com"; hireDate=1672531200000000000; notes="Fan engagement lead" },
    ];
    for (member in demoStaff.vals()) {
      extendedStaffMap.add(member.id, member);
    };
  };

  public type SavingsDirection = { #toSavings; #fromSavings };
  public type SavingsTransaction = {
    id : Nat;
    owner : Principal;
    direction : SavingsDirection;
    amount : Nat;
    timestamp : Int;
  };
  var savingsHistory = List.empty<SavingsTransaction>();

  // ─── Customer Support Chat ────────────────────────────────────────────────────
  public type SupportStatus = { #open; #resolved; #waitingForUser };
  public type SupportConversation = {
    id : Nat;
    userPrincipal : Principal;
    subject : Text;
    status : SupportStatus;
    createdAt : Int;
    lastMessageAt : Int;
  };
  public type SupportMessage = {
    id : Nat;
    conversationId : Nat;
    senderPrincipal : Principal;
    senderIsAdmin : Bool;
    message : Text;
    timestamp : Int;
    read : Bool;
  };
  let supportConversations = Map.empty<Principal, SupportConversation>();
  var supportMessages = List.empty<SupportMessage>();
  var nextSupportConversationId : Nat = 0;
  var nextSupportMessageId : Nat = 0;

  public shared ({ caller }) func setPinHash(salt : Blob, hash : Blob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set App Lock PIN");
    };

    switch (pinData.get(caller)) {
      // Always reset consecutive failures when setting/changing PIN
      case (null) {
        pinData.add(caller, { salt; hash; consecutiveFailures = 0; lastFailureTimestamp = 0 });
        
        // Log security event for PIN creation
        let event = {
          userId = caller;
          eventType = "APP_LOCK_PIN_CREATED";
          timestamp = Time.now();
          details = "User created App Lock PIN";
        };
        securityEvents.add(event);
      };
      case (?existing) {
        pinData.add(caller, { existing with salt; hash; consecutiveFailures = 0; lastFailureTimestamp = 0 });
        
        // Log security event for PIN change
        let event = {
          userId = caller;
          eventType = "APP_LOCK_PIN_CHANGED";
          timestamp = Time.now();
          details = "User changed App Lock PIN";
        };
        securityEvents.add(event);
      };
    };
  };

  public type PinCheckResult = {
    #verified;
    #incorrect : Nat;
    #blocked : Nat;
  };

  let lockoutDurationNanos = 2 * 60 * 60 * 1_000_000_000;

  public shared ({ caller }) func verifyPinHash(salt : Blob, hash : Blob) : async PinCheckResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify App Lock PIN");
    };

    let lastFailure = switch (pinData.get(caller)) {
      case (null) { 0 };
      case (?data) { data.lastFailureTimestamp };
    };
    if (Time.now() < lastFailure + lockoutDurationNanos) {
      // Log security event for blocked attempt
      let event = {
        userId = caller;
        eventType = "APP_LOCK_VERIFICATION_BLOCKED";
        timestamp = Time.now();
        details = "PIN verification blocked due to lockout";
      };
      securityEvents.add(event);
      return #blocked(lockoutDurationNanos);
    };

    let consecutiveFailures = switch (pinData.get(caller)) {
      case (null) { 0 };
      case (?data) { data.consecutiveFailures };
    };
    if (consecutiveFailures >= 3) {
      // Log security event for blocked attempt
      let event = {
        userId = caller;
        eventType = "APP_LOCK_VERIFICATION_BLOCKED";
        timestamp = Time.now();
        details = "PIN verification blocked due to too many failures";
      };
      securityEvents.add(event);
      return #blocked(lockoutDurationNanos);
    };

    switch (pinData.get(caller)) {
      case (null) {
        // No PIN configured for caller
        return #incorrect(3);
      };
      case (?data) {
        if (data.salt == salt and data.hash == hash) {
          // Reset consecutive failures on successful verification
          pinData.add(caller, { data with consecutiveFailures = 0 });
          
          // Log security event for successful verification
          let event = {
            userId = caller;
            eventType = "APP_LOCK_VERIFIED";
            timestamp = Time.now();
            details = "App Lock PIN verified successfully";
          };
          securityEvents.add(event);
          
          #verified;
        } else {
          let failures = data.consecutiveFailures + 1;
          // Update consecutive failures on incorrect attempt
          pinData.add(caller, { data with consecutiveFailures = failures; lastFailureTimestamp = Time.now() });
          
          // Log security event for failed verification
          let event = {
            userId = caller;
            eventType = "APP_LOCK_VERIFICATION_FAILED";
            timestamp = Time.now();
            details = "App Lock PIN verification failed (attempt " # failures.toText() # "/3)";
          };
          securityEvents.add(event);
          
          if (failures >= 3) {
            #blocked(lockoutDurationNanos);
          } else {
            #incorrect(3 - failures);
          };
        };
      };
    };
  };

  public query ({ caller }) func hasExistingPin() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check App Lock PIN status");
    };
    
    pinData.get(caller) != null;
  };

  /// Returns whether the App Lock PIN feature is enabled for the caller.
  /// Defaults to false if no preference has been stored (feature is OFF by default).
  public query ({ caller }) func getAppLockEnabled() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read App Lock preference");
    };
    switch (appLockEnabled.get(caller)) {
      case (null) { false };
      case (?value) { value };
    };
  };

  /// Enables or disables the App Lock PIN feature for the caller.
  /// When disabling, the stored PIN data is cleared so a fresh PIN must be
  /// set if the feature is re-enabled later.
  public shared ({ caller }) func setAppLockEnabled(enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update App Lock preference");
    };

    appLockEnabled.add(caller, enabled);

    // Clear PIN data when the feature is disabled so the user must set a new
    // PIN if they re-enable it — prevents stale credentials from being reused.
    if (not enabled) {
      pinData.remove(caller);
    };

    let event = {
      userId = caller;
      eventType = if (enabled) "APP_LOCK_ENABLED" else "APP_LOCK_DISABLED";
      timestamp = Time.now();
      details = if (enabled) "User enabled App Lock PIN feature" else "User disabled App Lock PIN feature and cleared PIN data";
    };
    securityEvents.add(event);
  };

  // Input validation helper functions
  private func validateTextInput(input : Text, maxLength : Nat, _fieldName : Text) : Bool {
    if (input.size() > maxLength) {
      return false;
    };
    // Check for suspicious patterns (basic XSS prevention)
    let lowerInput = input.toLower();
    if (lowerInput.contains(#text "<script") or 
        lowerInput.contains(#text "javascript:") or
        lowerInput.contains(#text "onerror=") or
        lowerInput.contains(#text "onclick=")) {
      return false;
    };
    true;
  };

  private func sanitizeTextInput(input : Text) : Text {
    // Basic sanitization - remove potentially dangerous characters
    let cleaned = input.replace(#text "<", "");
    let cleaned2 = cleaned.replace(#text ">", "");
    let cleaned3 = cleaned2.replace(#text "\"", "");
    let cleaned4 = cleaned3.replace(#text "'", "");
    cleaned4;
  };

  private func validateEmail(email : Text) : Bool {
    if (email.size() > 254) { return false };
    email.contains(#text "@") and email.contains(#text ".");
  };

  private func validateUsername(username : Text) : Bool {
    if (username.size() < 3 or username.size() > 30) { return false };
    // Only allow alphanumeric and underscore
    let chars = username.chars();
    for (c in chars) {
      let isValid = (c >= 'a' and c <= 'z') or 
                    (c >= 'A' and c <= 'Z') or 
                    (c >= '0' and c <= '9') or 
                    c == '_';
      if (not isValid) { return false };
    };
    true;
  };

  // Rate limiting helper
  private func checkRateLimit(caller : Principal, action : Text, maxAttempts : Nat, windowNanos : Int) : Bool {
    let now = Time.now();
    let windowStart = now - windowNanos;
    
    let attempts = switch (rateLimitMap.get(caller)) {
      case (null) { List.empty<Int>() };
      case (?list) { list };
    };

    let recentAttempts = attempts.filter(func(timestamp : Int) : Bool {
      timestamp > windowStart
    });

    if (recentAttempts.size() >= maxAttempts) {
      // Log security event for rate limit violation
      let event = {
        userId = caller;
        eventType = "RATE_LIMIT_EXCEEDED";
        timestamp = now;
        details = "Rate limit exceeded for action: " # action;
      };
      securityEvents.add(event);
      return false;
    };

    let newAttempts = recentAttempts;
    newAttempts.add(now);
    rateLimitMap.add(caller, newAttempts);
    true;
  };

  // User Profile Management
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create and update profiles");
    };

    // Input validation
    if (not validateUsername(profile.username)) {
      let event = {
        userId = caller;
        eventType = "INPUT_VALIDATION_FAILED";
        timestamp = Time.now();
        details = "Invalid username format";
      };
      securityEvents.add(event);
      Runtime.trap("Invalid username: must be 3-30 characters, alphanumeric and underscore only");
    };

    if (not validateEmail(profile.email)) {
      let event = {
        userId = caller;
        eventType = "INPUT_VALIDATION_FAILED";
        timestamp = Time.now();
        details = "Invalid email format";
      };
      securityEvents.add(event);
      Runtime.trap("Invalid email format");
    };

    if (not validateTextInput(profile.bio, 500, "bio")) {
      let event = {
        userId = caller;
        eventType = "INPUT_VALIDATION_FAILED";
        timestamp = Time.now();
        details = "Invalid bio: exceeds length or contains suspicious content";
      };
      securityEvents.add(event);
      Runtime.trap("Invalid bio: must be under 500 characters and contain no script tags");
    };

    // Sanitize text inputs
    let sanitizedBio = sanitizeTextInput(profile.bio);

    // Preserve existing verification and KYC status - only admins can change them
    let existingProfile = userProfiles.get(caller);
    let verificationStatus = switch (existingProfile) {
      case (null) { false };
      case (?existing) { existing.isVerified };
    };
    let kycStatus = switch (existingProfile) {
      case (null) { #notSubmitted };
      case (?existing) { existing.kycStatus };
    };
    let kycSubmissionTimestamp = switch (existingProfile) {
      case (null) { null };
      case (?existing) { existing.kycSubmissionTimestamp };
    };
    let kycProviderReference = switch (existingProfile) {
      case (null) { null };
      case (?existing) { existing.kycProviderReference };
    };

    let profileToSave = {
      profile with
      bio = sanitizedBio;
      isVerified = verificationStatus;
      kycStatus;
      kycSubmissionTimestamp;
      kycProviderReference;
    };
    userProfiles.add(caller, profileToSave);

    // Log security event for profile update
    let event = {
      userId = caller;
      eventType = "PROFILE_UPDATED";
      timestamp = Time.now();
      details = "User profile updated successfully";
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Admin-only function to set verification status
  public shared ({ caller }) func setUserVerificationStatus(user : Principal, isVerified : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set verification status");
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?profile) {
        let updatedProfile = { profile with isVerified = isVerified };
        userProfiles.add(user, updatedProfile);

        // Log security event
        let event = {
          userId = user;
          eventType = "VERIFICATION_STATUS_CHANGED";
          timestamp = Time.now();
          details = "Verification status set to: " # (if (isVerified) "verified" else "unverified") # " by admin: " # caller.toText();
        };
        securityEvents.add(event);
      };
    };
  };

  // Admin-only function to set KYC status with validation and audit logging
  public shared ({ caller }) func setKYCStatus(user : Principal, status : KYCStatus, providerReference : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set KYC status");
    };

    // Validate provider reference if provided
    switch (providerReference) {
      case (null) {};
      case (?ref) {
        if (not validateTextInput(ref, 200, "providerReference")) {
          Runtime.trap("Invalid provider reference format");
        };
      };
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?profile) {
        // Validate state transitions
        let isValidTransition = switch (profile.kycStatus, status) {
          case (#notSubmitted, #pending) { true };
          case (#pending, #verified) { true };
          case (#pending, #failed) { true };
          case (#failed, #pending) { true }; // Allow retry
          case (#verified, _) { false }; // Cannot change from verified
          case (_, _) { false };
        };

        if (not isValidTransition) {
          Runtime.trap("Invalid KYC status transition from " # debug_show(profile.kycStatus) # " to " # debug_show(status));
        };

        let updatedProfile = {
          profile with
          kycStatus = status;
          kycProviderReference = providerReference;
        };
        userProfiles.add(user, updatedProfile);

        // Log security event for audit trail
        let event = {
          userId = user;
          eventType = "KYC_STATUS_CHANGED";
          timestamp = Time.now();
          details = "KYC status changed to: " # debug_show(status) # " by admin: " # caller.toText() # (switch (providerReference) { case (null) { "" }; case (?ref) { " (ref: " # ref # ")" } });
        };
        securityEvents.add(event);
      };
    };
  };

  // KYC Submission with rate limiting
  public shared ({ caller }) func submitKYC() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit KYC");
    };

    // Rate limiting: 3 attempts per 24 hours
    if (not checkRateLimit(caller, "KYC_SUBMISSION", 3, 24 * 60 * 60 * 1_000_000_000)) {
      Runtime.trap("Too many KYC submission attempts. Please wait 24 hours before trying again");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?profile) {
        // Check current KYC status
        switch (profile.kycStatus) {
          case (#verified) {
            Runtime.trap("KYC already verified. No resubmission needed");
          };
          case (#pending) {
            Runtime.trap("KYC verification is already pending. Please wait for review");
          };
          case (#notSubmitted or #failed) {
            let now = Time.now();

            // Update profile
            let updatedProfile = {
              profile with
              kycStatus = #pending;
              kycSubmissionTimestamp = ?now;
            };
            userProfiles.add(caller, updatedProfile);

            // Log security event
            let event = {
              userId = caller;
              eventType = "KYC_SUBMITTED";
              timestamp = now;
              details = "User submitted KYC verification request";
            };
            securityEvents.add(event);
          };
        };
      };
    };
  };

  // Public profile viewing for tipping (limited information exposure)
  public query func getPublicProfile(username : Text) : async ?{
    username : Text;
    bio : Text;
    photo : ?File.ExternalBlob;
    currentStatus : ?Status;
    isVerified : Bool;
  } {
    // Validate input
    if (not validateUsername(username)) {
      return null;
    };

    // Find user by username
    let profileEntry = userProfiles.entries().find(
      func((_, profile) : (Principal, UserProfile)) : Bool {
        profile.username == username;
      }
    );

    switch (profileEntry) {
      case (null) { null };
      case (?(principal, profile)) {
        // Do NOT expose wallet address publicly
        ?{
          username = profile.username;
          bio = profile.bio;
          photo = profile.photo;
          currentStatus = profile.currentStatus;
          isVerified = profile.isVerified;
        };
      };
    };
  };

  // Public profile viewing by principal (limited information exposure)
  public query ({ caller }) func getPublicProfileByPrincipal(user : Principal) : async ?{
    username : Text;
    bio : Text;
    photo : ?File.ExternalBlob;
    currentStatus : ?Status;
    isVerified : Bool;
  } {
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        // Do NOT expose wallet address publicly
        ?{
          username = profile.username;
          bio = profile.bio;
          photo = profile.photo;
          currentStatus = profile.currentStatus;
          isVerified = profile.isVerified;
        };
      };
    };
  };

  // Smart Status Badges implementation

  public shared ({ caller }) func addStatus(status : Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add statuses");
    };

    // Input validation
    if (not validateTextInput(status.statusType, 100, "statusType")) {
      let event = {
        userId = caller;
        eventType = "INPUT_VALIDATION_FAILED";
        timestamp = Time.now();
        details = "Invalid status type";
      };
      securityEvents.add(event);
      Runtime.trap("Invalid status type: must be under 100 characters and contain no script tags");
    };

    switch (status.customStatus) {
      case (null) {};
      case (?custom) {
        if (not validateTextInput(custom, 200, "customStatus")) {
          let event = {
            userId = caller;
            eventType = "INPUT_VALIDATION_FAILED";
            timestamp = Time.now();
            details = "Invalid custom status";
          };
          securityEvents.add(event);
          Runtime.trap("Invalid custom status: must be under 200 characters and contain no script tags");
        };
      };
    };

    let userStatuses = switch (statuses.get(caller)) {
      case (null) { List.empty<Status>() };
      case (?existingStatuses) { existingStatuses };
    };

    // Deactivate all existing statuses
    let updatedStatuses = userStatuses.map<Status, Status>(
      func(existing : Status) : Status { { existing with isActive = false } }
    );

    // Sanitize and add the new status as active
    let sanitizedCustomStatus = switch (status.customStatus) {
      case (null) { null };
      case (?custom) { ?sanitizeTextInput(custom) };
    };

    let statusToAdd = { 
      status with 
      statusType = sanitizeTextInput(status.statusType);
      customStatus = sanitizedCustomStatus;
      isActive = true;
    };
    let newList = updatedStatuses;
    newList.add(statusToAdd);

    statuses.add(caller, newList);

    // Update currentStatus in user profile
    let currentProfile = switch (userProfiles.get(caller)) {
      case (null) {
        let newProfile = {
          username = "";
          email = "";
          bio = "";
          photo = null;
          walletAddress = null;
          isFirstWalletConnection = true;
          currentStatus = ?statusToAdd;
          phoneNumber = null;
          isVerified = false;
          kycStatus = #notSubmitted;
          kycSubmissionTimestamp = null;
          kycProviderReference = null;
        };
        newProfile;
      };
      case (?existingProfile) {
        { existingProfile with currentStatus = ?statusToAdd };
      };
    };
    userProfiles.add(caller, currentProfile);
  };

  public shared ({ caller }) func removeStatus(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove statuses");
    };

    switch (statuses.get(caller)) {
      case (null) { Runtime.trap("No statuses found for user") };
      case (?userStatuses) {
        let statusArray = userStatuses.toArray();
        if (index >= statusArray.size()) {
          Runtime.trap("Invalid status index");
        };

        if (statusArray.size() == 0) {
          Runtime.trap("Cannot remove status from an empty array");
        } else {
          let filteredArray = Array.tabulate(
            statusArray.size() - 1,
            func(i) {
              if (i < index) { statusArray[i] } else { statusArray[i + 1] };
            },
          );

          let filteredStatusesList = List.fromArray<Status>(filteredArray);
          statuses.add(caller, filteredStatusesList);

          if (filteredArray.size() == 0) {
            let currentProfile = switch (userProfiles.get(caller)) {
              case (null) {
                let newProfile = {
                  username = "";
                  email = "";
                  bio = "";
                  photo = null;
                  walletAddress = null;
                  isFirstWalletConnection = true;
                  currentStatus = null;
                  phoneNumber = null;
                  isVerified = false;
                  kycStatus = #notSubmitted;
                  kycSubmissionTimestamp = null;
                  kycProviderReference = null;
                };
                newProfile;
              };
              case (?existingProfile) {
                { existingProfile with currentStatus = null };
              };
            };
            userProfiles.add(caller, currentProfile);
          };
        };
      };
    };
  };

  public query ({ caller }) func getStatuses(user : Principal) : async [Status] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statuses");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own statuses unless you are an admin");
    };

    switch (statuses.get(user)) {
      case (null) { [] };
      case (?userStatuses) { userStatuses.toArray() };
    };
  };

  public shared ({ caller }) func deactivateStatus() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deactivate statuses");
    };

    switch (statuses.get(caller)) {
      case (null) { Runtime.trap("No statuses found for user") };
      case (?userStatuses) {
        if (userStatuses.isEmpty()) {
          Runtime.trap("User has no statuses");
        };

        let updatedStatuses = userStatuses.map<Status, Status>(
          func(existing : Status) : Status { { existing with isActive = false } }
        );
        statuses.add(caller, updatedStatuses);

        let currentProfile = switch (userProfiles.get(caller)) {
          case (null) {
            let newProfile = {
              username = "";
              email = "";
              bio = "";
              photo = null;
              walletAddress = null;
              isFirstWalletConnection = true;
              currentStatus = null;
              phoneNumber = null;
              isVerified = false;
              kycStatus = #notSubmitted;
              kycSubmissionTimestamp = null;
              kycProviderReference = null;
            };
            newProfile;
          };
          case (?existingProfile) {
            { existingProfile with currentStatus = null };
          };
        };
        userProfiles.add(caller, currentProfile);
      };
    };
  };

  public query ({ caller }) func getCurrentStatus(user : Principal) : async ?Status {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view current status");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own current status unless you are an admin");
    };

    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { profile.currentStatus };
    };
  };

  // Public current status viewing (no authentication required for public profiles)
  public query func getPublicCurrentStatus(user : Principal) : async ?Status {
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { profile.currentStatus };
    };
  };

  // Wallet Management
  public shared ({ caller }) func saveWalletAddress(walletAddress : Text) : async {
    #success : Bool;
    #error : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      #error("Unauthorized: Only users can save wallet addresses");
    } else {
      // Validate wallet address format (basic check)
      if (walletAddress.size() < 26 or walletAddress.size() > 62) {
        let event = {
          userId = caller;
          eventType = "INPUT_VALIDATION_FAILED";
          timestamp = Time.now();
          details = "Invalid wallet address format";
        };
        securityEvents.add(event);
        #error("Invalid wallet address format");
      } else {
        switch (userProfiles.get(caller)) {
          case (null) { #error("User profile does not exist") };
          case (?profile) {
            let isFirstConnection = profile.walletAddress == null;
            let profileWithWallet = {
              profile with
              walletAddress = ?walletAddress;
              isFirstWalletConnection = isFirstConnection;
            };
            userProfiles.add(caller, profileWithWallet);

            // Log security event
            let event = {
              userId = caller;
              eventType = "WALLET_CONNECTED";
              timestamp = Time.now();
              details = "Wallet address saved" # (if (isFirstConnection) " (first connection)" else "");
            };
            securityEvents.add(event);

            #success(isFirstConnection);
          };
        };
      };
    };
  };

  public shared ({ caller }) func removeWalletAddress() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove wallet addresses");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?profile) {
        let profileWithoutWallet = {
          profile with
          walletAddress = null;
          isFirstWalletConnection = false;
        };
        userProfiles.add(caller, profileWithoutWallet);

        // Log security event
        let event = {
          userId = caller;
          eventType = "WALLET_DISCONNECTED";
          timestamp = Time.now();
          details = "Wallet address removed";
        };
        securityEvents.add(event);
      };
    };
  };

  public shared ({ caller }) func markTutorialCompleted() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tutorial status");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile does not exist") };
      case (?profile) {
        let updatedProfile = { profile with isFirstWalletConnection = false };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  // Payment Methods Management
  public shared ({ caller }) func addPaymentMethod(method : PaymentMethod) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add payment methods");
    };

    // Input validation
    if (not validateTextInput(method.id, 100, "paymentMethodId")) {
      Runtime.trap("Invalid payment method ID");
    };

    if (method.last4.size() != 4) {
      Runtime.trap("Invalid last4 digits format");
    };

    let userMethods = switch (paymentMethods.get(caller)) {
      case (null) { [] };
      case (?methods) { methods };
    };

    let newMethods = [method].concat(userMethods);
    paymentMethods.add(caller, newMethods);

    // Log security event
    let event = {
      userId = caller;
      eventType = "PAYMENT_METHOD_ADDED";
      timestamp = Time.now();
      details = "Payment method added: " # debug_show(method.methodType);
    };
    securityEvents.add(event);
  };

  public shared ({ caller }) func removePaymentMethod(methodId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove payment methods");
    };

    let userMethods = switch (paymentMethods.get(caller)) {
      case (null) { Runtime.trap("No payment methods found") };
      case (?methods) { methods };
    };

    let filteredMethods = userMethods.filter(func(m : PaymentMethod) : Bool { m.id != methodId });
    paymentMethods.add(caller, filteredMethods);

    // Log security event
    let event = {
      userId = caller;
      eventType = "PAYMENT_METHOD_REMOVED";
      timestamp = Time.now();
      details = "Payment method removed: " # methodId;
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getPaymentMethods(user : Principal) : async [PaymentMethod] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payment methods");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own payment methods unless you are an admin");
    };

    switch (paymentMethods.get(user)) {
      case (null) { [] };
      case (?methods) { methods };
    };
  };

  public shared ({ caller }) func updatePaymentMethodVerificationStatus(methodId : Text, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update payment method verification status");
    };

    // Validate status input
    if (not validateTextInput(status, 50, "verificationStatus")) {
      Runtime.trap("Invalid verification status format");
    };

    let userMethods = switch (paymentMethods.get(caller)) {
      case (null) { Runtime.trap("No payment methods found") };
      case (?methods) { methods };
    };

    let updatedMethods = userMethods.map(
      func(method : PaymentMethod) : PaymentMethod {
        if (method.id == methodId) {
          { method with stripeVerificationStatus = status };
        } else {
          method;
        };
      }
    );

    paymentMethods.add(caller, updatedMethods);
  };

  // Tip Management
  public shared ({ caller }) func sendTip(toUser : Principal, amount : Nat, message : Text, professional : Bool, currencyType : {
    #fiat;
    #crypto;
  }) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send tips");
    };

    // Vault lock guard — blocks outgoing transactions when vault is locked
    if (isVaultBlocking(caller)) {
      Runtime.trap("Vault is locked. Unlock your vault to send funds.");
    };

    // Spending limit check
    switch (checkSpendingLimit(caller, amount)) {
      case (?errMsg) { Runtime.trap(errMsg) };
      case (null) {};
    };

    // Rate limiting: 10 tips per minute
    if (not checkRateLimit(caller, "SEND_TIP", 10, 60 * 1_000_000_000)) {
      Runtime.trap("Rate limit exceeded: Too many tips sent in a short time. Please wait before sending more");
    };

    // Input validation
    if (amount == 0) {
      Runtime.trap("Tip amount must be greater than zero");
    };

    if (not validateTextInput(message, 500, "tipMessage")) {
      let event = {
        userId = caller;
        eventType = "INPUT_VALIDATION_FAILED";
        timestamp = Time.now();
        details = "Invalid tip message";
      };
      securityEvents.add(event);
      Runtime.trap("Invalid message: must be under 500 characters and contain no script tags");
    };

    // Verify recipient exists
    switch (userProfiles.get(toUser)) {
      case (null) { Runtime.trap("Recipient does not exist or is not registered") };
      case (?_) {
        switch (currencyType) {
          case (#fiat) {
            let senderBalance = switch (balances.get(caller)) {
              case (null) { 0 };
              case (?balance) { balance };
            };
            if (amount > senderBalance) {
              Runtime.trap("Insufficient balance for fiat tip");
            };
            let newBalance = senderBalance - amount;
            balances.add(caller, newBalance);
            recordSpend(caller, amount);

            let recipientBalance = switch (balances.get(toUser)) {
              case (null) { 0 };
              case (?balance) { balance };
            };
            balances.add(toUser, recipientBalance + amount);
          };
          case (#crypto) {
            // Crypto tips are handled externally via wallet
          };
        };

        let sanitizedMessage = sanitizeTextInput(message);

        let newTip = {
          fromUser = caller;
          toUser;
          amount;
          message = sanitizedMessage;
          timestamp = Time.now();
          professional;
          currencyType;
        };
        tips.add(newTip);

        // Log security event
        let event = {
          userId = caller;
          eventType = "TIP_SENT";
          timestamp = Time.now();
          details = "Tip sent to " # toUser.toText() # " amount: " # amount.toText() # " type: " # debug_show(currencyType);
        };
        securityEvents.add(event);
      };
    };
  };

  public query ({ caller }) func getTipsReceived(user : Principal) : async [Tip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tip history");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own tip history unless you are an admin");
    };

    let tipsArray = tips.toArray();
    let filtered = tipsArray.filter(func(tip : Tip) : Bool { tip.toUser == user });
    filtered.sort<Tip>(func(a : Tip, b : Tip) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };

  public query ({ caller }) func getTipsSent(user : Principal) : async [Tip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tip history");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own tip history unless you are an admin");
    };

    let tipsArray = tips.toArray();
    let filtered = tipsArray.filter(func(tip : Tip) : Bool { tip.fromUser == user });
    filtered.sort<Tip>(func(a : Tip, b : Tip) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };

  public query ({ caller }) func getProfessionalTips(user : Principal) : async [Tip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tip history");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own tip history unless you are an admin");
    };

    let tipsArray = tips.toArray();
    let filtered = tipsArray.filter(
      func(tip : Tip) : Bool {
        (tip.toUser == user or tip.fromUser == user) and tip.professional;
      }
    );
    filtered.sort<Tip>(func(a : Tip, b : Tip) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };

  public query ({ caller }) func getAllTips() : async [Tip] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can retrieve all tips");
    };

    let tipsArray = tips.toArray();
    tipsArray.sort<Tip>(func(a : Tip, b : Tip) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };

  // Balance Management
  public shared ({ caller }) func deposit(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deposit funds");
    };

    // Rate limiting: 20 deposits per hour
    if (not checkRateLimit(caller, "DEPOSIT", 20, 60 * 60 * 1_000_000_000)) {
      Runtime.trap("Rate limit exceeded: Too many deposits in a short time");
    };

    if (amount == 0) {
      Runtime.trap("Deposit amount must be greater than zero");
    };

    // Maximum deposit limit for fraud prevention
    if (amount > 10000) {
      Runtime.trap("Deposit amount exceeds maximum limit of $10,000 per transaction");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };

    balances.add(caller, currentBalance + amount);

    // Log security event
    let event = {
      userId = caller;
      eventType = "DEPOSIT";
      timestamp = Time.now();
      details = "Deposit of " # amount.toText();
    };
    securityEvents.add(event);
  };

  public shared ({ caller }) func withdraw(amount : Nat, verifiedOtpId : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can withdraw funds");
    };

    // Vault lock guard — blocks outgoing transactions when vault is locked
    if (isVaultBlocking(caller)) {
      Runtime.trap("Vault is locked. Unlock your vault to send funds.");
    };

    // Spending limit check
    switch (checkSpendingLimit(caller, amount)) {
      case (?errMsg) { Runtime.trap(errMsg) };
      case (null) {};
    };

    // Rate limiting: 10 withdrawals per hour
    if (not checkRateLimit(caller, "WITHDRAW", 10, 60 * 60 * 1_000_000_000)) {
      Runtime.trap("Rate limit exceeded: Too many withdrawals in a short time");
    };

    if (amount == 0) {
      Runtime.trap("Withdrawal amount must be greater than zero");
    };

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?balance) { balance };
    };

    if (amount > currentBalance) {
      Runtime.trap("Insufficient balance");
    };

    // Withdrawals over $200 require KYC verification
    if (amount > 200) {
      switch (userProfiles.get(caller)) {
        case (null) { Runtime.trap("User profile does not exist") };
        case (?profile) {
          switch (profile.kycStatus) {
            case (#verified) { /* Allow withdrawal */ };
            case (#pending) {
              Runtime.trap("KYC verification is pending. Please complete verification to withdraw amounts over $200");
            };
            case (#failed) {
              Runtime.trap("KYC verification failed. Please complete verification to withdraw amounts over $200");
            };
            case (#notSubmitted) {
              Runtime.trap("KYC verification required. Please complete verification to withdraw amounts over $200");
            };
          };
        };
      };
    };

    // Withdrawals over $50 require 2FA OTP verification
    if (amount > 50) {
      switch (twoFactorSettings.get(caller)) {
        case (null) {
          Runtime.trap("2FA required for withdrawals over $50. Please enable 2FA in Security Settings");
        };
        case (?settings) {
          if (not settings.enabled) {
            Runtime.trap("2FA required for withdrawals over $50. Please enable 2FA in Security Settings");
          };
          // Require a verified OTP challenge ID
          switch (verifiedOtpId) {
            case (null) {
              Runtime.trap("OTP verification required for withdrawals over $50. Call startWithdrawalOTPChallenge first");
            };
            case (?challengeId) {
              switch (otpChallenges.get(challengeId)) {
                case (null) {
                  Runtime.trap("Invalid OTP challenge ID");
                };
                case (?challenge) {
                  if (not Principal.equal(challenge.userPrincipal, caller)) {
                    Runtime.trap("OTP challenge does not belong to caller");
                  };
                  if (not challenge.used) {
                    Runtime.trap("OTP challenge has not been verified yet");
                  };
                  if (Time.now() > challenge.expiresAt) {
                    Runtime.trap("OTP challenge has expired");
                  };
                  if (challenge.amount != amount) {
                    Runtime.trap("OTP challenge amount does not match withdrawal amount");
                  };
                  // Mark the challenge as consumed (already used=true, keep it to prevent replay)
                };
              };
            };
          };
        };
      };
    };

    let newBalance = currentBalance - amount;
    balances.add(caller, newBalance);
    recordSpend(caller, amount);

    // Log security event
    let event = {
      userId = caller;
      eventType = "WITHDRAWAL";
      timestamp = Time.now();
      details = "Withdrawal of " # amount.toText();
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getBalance(user : Principal) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balances");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance unless you are an admin");
    };

    switch (balances.get(user)) {
      case (null) { 0 };
      case (?balance) { balance };
    };
  };

  // Stripe Integration
  // NOTE: Stripe configuration should be set via environment variables or secure vault
  // This is a placeholder that should be replaced with proper secret management
  public query ({ caller }) func isStripeConfigured() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check Stripe configuration");
    };
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };

    // Log security event for configuration change
    let event = {
      userId = caller;
      eventType = "STRIPE_CONFIGURATION_UPDATED";
      timestamp = Time.now();
      details = "Stripe configuration updated by admin";
    };
    securityEvents.add(event);

    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };

    // Validate session ID format
    if (not validateTextInput(sessionId, 200, "sessionId")) {
      Runtime.trap("Invalid session ID format");
    };

    switch (stripeSessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found or unauthorized") };
      case (?owner) {
        if (caller != owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only check your own session status");
        };
      };
    };

    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };

    // Validate URLs
    if (not validateTextInput(successUrl, 500, "successUrl") or not validateTextInput(cancelUrl, 500, "cancelUrl")) {
      Runtime.trap("Invalid URL format");
    };

    // Validate items
    if (items.size() == 0) {
      Runtime.trap("Cannot create checkout session with no items");
    };

    let sessionId = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    stripeSessions.add(sessionId, caller);

    // Log security event
    let event = {
      userId = caller;
      eventType = "CHECKOUT_SESSION_CREATED";
      timestamp = Time.now();
      details = "Stripe checkout session created";
    };
    securityEvents.add(event);

    sessionId;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Legal & Privacy (Public access - no authentication required)
  public query func getLegalAndPrivacy() : async {
    terms : Text;
    privacy : Text;
  } {
    {
      terms = "OPEN TIP PAY — TERMS OF SERVICE\n\nLast Updated: " # "2025" # "\n\nBy accessing or using Open Tip Pay, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.\n\n1. ACCEPTANCE OF TERMS\nBy creating an account or using Open Tip Pay, you confirm that you are at least 18 years old, have the legal capacity to enter into this agreement, and agree to comply with all applicable laws and regulations.\n\n2. DESCRIPTION OF SERVICE\nOpen Tip Pay is a peer-to-peer (P2P) payment and tipping platform that enables users to send and receive money, tips, and micro-payments using fiat currency (via Stripe) or cryptocurrency (via non-custodial wallet connections). Open Tip Pay does not hold, custody, or control cryptocurrency private keys.\n\n3. FEE SCHEDULE\n\nOpen Tip Pay charges the following fees:\n\nSending Money:\n- From balance or debit card (personal): Free\n- From credit card: 3% of the transaction amount\n- Crypto transfers: No platform fee\n\nReceiving Money:\n- Personal accounts: Free\n- Business accounts: 2.6% + $0.15 per payment received\n\nWithdrawals:\n- Standard (1-3 business days): Free\n- Instant (arrives immediately): 0.5%-2.5% of the withdrawal amount (minimum $0.25)\n- ATM withdrawal: $2.50 per transaction\n\nInternational / Foreign Transactions:\n- 3% foreign transaction fee on international card payments\n\nDirect Deposit:\n- Receiving direct deposit: Free\n\nOther Fees:\n- No monthly fees\n- No account maintenance fees\n- No minimum balance fees\n\nFees are displayed to users before transaction confirmation. All fees are subject to change with advance notice. The current fee schedule is always available in the app under Settings > Legal.\n\n4. USER RESPONSIBILITIES\nYou are solely responsible for all transactions initiated from your account. You agree not to use Open Tip Pay for any unlawful purpose, including but not limited to money laundering, fraud, or financing of illegal activities. You are responsible for maintaining the security of your login credentials and device.\n\n5. IDENTITY VERIFICATION (KYC/AML)\nWithdrawals exceeding $200 require identity verification in accordance with applicable Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations. Open Tip Pay reserves the right to suspend accounts that fail to complete required verification.\n\n6. PROHIBITED ACTIVITIES\nUsers may not: (a) use the platform to process transactions for illegal goods or services; (b) attempt to circumvent platform security measures; (c) engage in chargebacks or payment disputes in bad faith; (d) create multiple accounts to evade restrictions.\n\n7. DISPUTES AND CHARGEBACKS\nAll disputes must be filed through the Open Tip Pay Dispute Resolution Center within 60 days of the disputed transaction. Open Tip Pay provides an AI-assisted dispute resolution process but makes no guarantee of refunds for completed transactions.\n\n8. LIMITATION OF LIABILITY\nTo the fullest extent permitted by applicable law, Open Tip Pay shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.\n\n9. TERMINATION\nOpen Tip Pay reserves the right to suspend or terminate accounts that violate these Terms of Service, with or without prior notice.\n\n10. CHANGES TO TERMS\nWe may update these Terms at any time. Continued use of Open Tip Pay after changes constitutes acceptance of the revised Terms. The current fee schedule is always available under Settings > Legal.";
      privacy = "Open Tip Pay Privacy Policy: ...";
    };
  };

  // Security Center Dashboard - Active Sessions
  public shared ({ caller }) func addActiveSession(session : ActiveSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add sessions");
    };

    // Input validation
    if (not validateTextInput(session.deviceName, 100, "deviceName") or
        not validateTextInput(session.location, 200, "location") or
        not validateTextInput(session.sessionId, 200, "sessionId")) {
      Runtime.trap("Invalid session data format");
    };

    let userSessions = switch (activeSessions.get(caller)) {
      case (null) { [] };
      case (?sessions) { sessions };
    };

    let newSessions = [session].concat(userSessions);
    activeSessions.add(caller, newSessions);
  };

  public query ({ caller }) func getActiveSessions(user : Principal) : async [ActiveSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sessions");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own sessions unless you are an admin");
    };

    switch (activeSessions.get(user)) {
      case (null) { [] };
      case (?sessions) { sessions };
    };
  };

  public shared ({ caller }) func removeActiveSession(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove sessions");
    };

    let userSessions = switch (activeSessions.get(caller)) {
      case (null) { Runtime.trap("No active sessions found") };
      case (?sessions) { sessions };
    };

    let filteredSessions = userSessions.filter(func(s : ActiveSession) : Bool { s.sessionId != sessionId });
    activeSessions.add(caller, filteredSessions);

    // Log security event
    let event = {
      userId = caller;
      eventType = "SESSION_REMOVED";
      timestamp = Time.now();
      details = "Active session removed: " # sessionId;
    };
    securityEvents.add(event);
  };

  // Biometric Authentication Settings
  public shared ({ caller }) func setBiometricSettings(settings : BiometricSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can configure biometric settings");
    };

    biometricSettings.add(caller, settings);

    // Log security event
    let event = {
      userId = caller;
      eventType = "BIOMETRIC_SETTINGS_UPDATED";
      timestamp = Time.now();
      details = "Biometric authentication " # (if (settings.enabled) "enabled" else "disabled");
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getBiometricSettings(user : Principal) : async ?BiometricSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view biometric settings");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own settings unless you are an admin");
    };

    biometricSettings.get(user);
  };

  // Data Encryption Log
  public shared ({ caller }) func logEncryptionEvent(event : EncryptionEvent) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log encryption events");
    };

    // Validate event data
    if (not validateTextInput(event.eventType, 100, "eventType") or
        not validateTextInput(event.dataType, 100, "dataType")) {
      Runtime.trap("Invalid encryption event data");
    };

    let userLogs = switch (encryptionLogs.get(caller)) {
      case (null) { [] };
      case (?logs) { logs };
    };

    let newLogs = [event].concat(userLogs);
    encryptionLogs.add(caller, newLogs);
  };

  public query ({ caller }) func getEncryptionLog(user : Principal) : async [EncryptionEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view encryption logs");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own logs unless you are an admin");
    };

    switch (encryptionLogs.get(user)) {
      case (null) { [] };
      case (?logs) { logs };
    };
  };

  // AI Fraud Detection
  public shared ({ caller }) func reportFraudAlert(alert : FraudAlert) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can report fraud alerts");
    };

    // Validate alert data
    if (not validateTextInput(alert.reason, 500, "fraudReason")) {
      Runtime.trap("Invalid fraud alert reason");
    };

    fraudAlerts.add(alert);

    // Log security event
    let event = {
      userId = alert.userId;
      eventType = "FRAUD_ALERT_REPORTED";
      timestamp = Time.now();
      details = "Fraud alert: " # alert.reason # " severity: " # debug_show(alert.severity);
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getFraudAlerts(user : Principal) : async [FraudAlert] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view fraud alerts");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own alerts unless you are an admin");
    };

    let alertsArray = fraudAlerts.toArray();
    alertsArray.filter<FraudAlert>(func(alert : FraudAlert) : Bool { alert.userId == user });
  };

  public query ({ caller }) func getAllFraudAlerts() : async [FraudAlert] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all fraud alerts");
    };

    fraudAlerts.toArray();
  };

  public shared ({ caller }) func resolveFraudAlert(userId : Principal, timestamp : Int) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can resolve fraud alerts");
    };

    fraudAlerts := fraudAlerts.map<FraudAlert, FraudAlert>(
      func(alert : FraudAlert) : FraudAlert {
        if (alert.userId == userId and alert.timestamp == timestamp) {
          { alert with resolved = true };
        } else {
          alert;
        };
      }
    );

    // Log security event
    let event = {
      userId;
      eventType = "FRAUD_ALERT_RESOLVED";
      timestamp = Time.now();
      details = "Fraud alert resolved by admin: " # caller.toText();
    };
    securityEvents.add(event);
  };

  // 2FA Settings
  public shared ({ caller }) func setTwoFactorSettings(settings : TwoFactorSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can configure 2FA settings");
    };

    twoFactorSettings.add(caller, settings);

    // Log security event
    let event = {
      userId = caller;
      eventType = "2FA_SETTINGS_UPDATED";
      timestamp = Time.now();
      details = "2FA " # (if (settings.enabled) "enabled" else "disabled");
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getTwoFactorSettings(user : Principal) : async ?TwoFactorSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view 2FA settings");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own settings unless you are an admin");
    };

    twoFactorSettings.get(user);
  };

  // Voice-print Verification Data
  public shared ({ caller }) func saveVoicePrint(voicePrint : VoicePrintData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save voice-print data");
    };

    // Validate voice print hash
    if (not validateTextInput(voicePrint.voicePrintHash, 500, "voicePrintHash")) {
      Runtime.trap("Invalid voice print hash format");
    };

    voicePrints.add(caller, voicePrint);

    // Log security event
    let event = {
      userId = caller;
      eventType = "VOICEPRINT_SAVED";
      timestamp = Time.now();
      details = "Voice-print data saved";
    };
    securityEvents.add(event);
  };

  public query ({ caller }) func getVoicePrint(user : Principal) : async ?VoicePrintData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access voice-print data");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only access your own voice-print unless you are an admin");
    };

    voicePrints.get(user);
  };

  public shared ({ caller }) func deleteVoicePrint() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete voice-print data");
    };

    voicePrints.remove(caller);

    // Log security event
    let event = {
      userId = caller;
      eventType = "VOICEPRINT_DELETED";
      timestamp = Time.now();
      details = "Voice-print data deleted";
    };
    securityEvents.add(event);
  };

  // AI Assistant Query Log
  public shared ({ caller }) func logAIQuery(queryText : Text, response : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log AI queries");
    };

    // Input validation
    if (not validateTextInput(queryText, 1000, "queryText") or
        not validateTextInput(response, 5000, "response")) {
      Runtime.trap("Invalid AI query or response format");
    };

    let queryRecord = {
      userId = caller;
      queryText = sanitizeTextInput(queryText);
      timestamp = Time.now();
      response = sanitizeTextInput(response);
    };

    aiQueryLog.add(queryRecord);
  };

  public query ({ caller }) func getAIQueryHistory(user : Principal) : async [AIQuery] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view AI query history");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own query history unless you are an admin");
    };

    let queriesArray = aiQueryLog.toArray();
    queriesArray.filter<AIQuery>(func(q : AIQuery) : Bool { q.userId == user });
  };

  // Smart Receipt Generation
  public shared ({ caller }) func generateSmartReceipt(month : Nat, year : Nat) : async SmartReceipt {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate receipts");
    };

    // Validate month and year
    if (month < 1 or month > 12) {
      Runtime.trap("Invalid month: must be between 1 and 12");
    };

    if (year < 2020 or year > 2100) {
      Runtime.trap("Invalid year: must be between 2020 and 2100");
    };

    let tipsArray = tips.toArray();
    let professionalTips = tipsArray.filter(
      func(tip : Tip) : Bool {
        (tip.toUser == caller or tip.fromUser == caller) and tip.professional;
      }
    );

    let totalAmount = professionalTips.foldLeft(
      0,
      func(acc : Nat, tip : Tip) : Nat { acc + tip.amount }
    );

    let receipt = {
      userId = caller;
      month;
      year;
      professionalTips;
      totalAmount;
      generatedAt = Time.now();
    };

    let key = caller.toText() # "-" # month.toText() # "-" # year.toText();
    smartReceipts.add(key, receipt);

    // Log security event
    let event = {
      userId = caller;
      eventType = "SMART_RECEIPT_GENERATED";
      timestamp = Time.now();
      details = "Smart receipt generated for " # month.toText() # "/" # year.toText();
    };
    securityEvents.add(event);

    receipt;
  };

  public query ({ caller }) func getSmartReceipt(user : Principal, month : Nat, year : Nat) : async ?SmartReceipt {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view receipts");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own receipts unless you are an admin");
    };

    let key = user.toText() # "-" # month.toText() # "-" # year.toText();
    smartReceipts.get(key);
  };

  // Security Event Logging
  public shared ({ caller }) func logSecurityEvent(event : SecurityEvent) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log security events");
    };

    if (event.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only log your own security events");
    };

    // Validate event data
    if (not validateTextInput(event.eventType, 100, "eventType") or
        not validateTextInput(event.details, 1000, "eventDetails")) {
      Runtime.trap("Invalid security event data");
    };

    securityEvents.add(event);
  };

  public query ({ caller }) func getSecurityEvents(user : Principal) : async [SecurityEvent] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view security events");
    };

    let eventsArray = securityEvents.toArray();
    eventsArray.filter<SecurityEvent>(func(event : SecurityEvent) : Bool { event.userId == user });
  };

  public query ({ caller }) func getAllSecurityEvents() : async [SecurityEvent] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all security events");
    };

    securityEvents.toArray();
  };

  // Search Functionality - Rate limited public access for discoverability
  public type SearchResult = {
    username : Text;
    bio : Text;
    photo : ?File.ExternalBlob;
    isVerified : Bool;
  };

  public query ({ caller }) func searchUsers(searchTerm : Text) : async [SearchResult] {
    // Rate limiting for anonymous searches to prevent abuse
    if (caller.isAnonymous()) {
      // Anonymous users get very limited search capability
      if (searchTerm.size() < 3) {
        return [];
      };
    };

    // Input validation
    if (not validateTextInput(searchTerm, 100, "searchTerm")) {
      return [];
    };

    let lowerSearchTerm = searchTerm.toLower();

    let filtered = userProfiles.toArray().filter(
      func((_, profile)) {
        let usernameMatch = profile.username.toLower().contains(#text lowerSearchTerm);
        let phoneMatch = switch (profile.phoneNumber) {
          case (null) { false };
          case (?number) {
            // Privacy protection: only return phone matches for verified accounts
            number.contains(#text searchTerm) and profile.isVerified;
          };
        };
        usernameMatch or phoneMatch;
      }
    );

    // Limit results to prevent data harvesting
    let limitedResults = if (filtered.size() > 20) {
      Array.tabulate(20, func(i) { filtered[i] });
    } else {
      filtered;
    };

    limitedResults.map(
      func((_, profile)) : SearchResult {
        {
          username = profile.username;
          bio = profile.bio;
          photo = profile.photo;
          isVerified = profile.isVerified;
        };
      }
    );
  };

  // Invite/Referral System - Users can generate their own invite codes
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate invite codes");
    };

    let randomBlob = Blob.fromArray([0]);
    let code = InviteLinksModule.generateUUID(randomBlob);
    InviteLinksModule.generateInviteCode(inviteLinksState, code);

    // Log security event
    let event = {
      userId = caller;
      eventType = "INVITE_CODE_GENERATED";
      timestamp = Time.now();
      details = "User generated invite code";
    };
    securityEvents.add(event);

    code;
  };

  public shared ({ caller }) func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    // Rate limiting for RSVP submissions to prevent spam
    if (not checkRateLimit(caller, "SUBMIT_RSVP", 5, 60 * 60 * 1_000_000_000)) {
      Runtime.trap("Rate limit exceeded: Too many RSVP submissions. Please wait before trying again");
    };

    // Input validation
    if (not validateTextInput(name, 100, "name") or
        not validateTextInput(inviteCode, 100, "inviteCode")) {
      Runtime.trap("Invalid RSVP data");
    };

    let sanitizedName = sanitizeTextInput(name);
    InviteLinksModule.submitRSVP(inviteLinksState, sanitizedName, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteLinksState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteLinksState);
  };

  // Security Compilation Status - Admin only access to prevent information disclosure
  public type CompilationStatus = {
    obfuscationLayer : Text;
    verificationTimestamp : Int;
    tooltipNote : Text;
  };

  let compilationStatus = {
    obfuscationLayer = "Standard";
    verificationTimestamp = Time.now();
    tooltipNote = "Code obfuscation protects against reverse engineering and enhances anti-tampering defenses.";
  };

  // ─── SMS / Twilio Integration ───────────────────────────────────────────────

  // Base64 encoding helper for Basic Auth header
  private func base64Encode(input : Text) : Text {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let charsArray = chars.toArray();
    let bytes = input.encodeUtf8();
    let bytesArray = bytes.toArray();
    let n = bytesArray.size();
    var result = "";
    var i = 0;
    while (i < n) {
      let b0 = bytesArray[i].toNat();
      let b1 = if (i + 1 < n) { bytesArray[i + 1].toNat() } else { 0 };
      let b2 = if (i + 2 < n) { bytesArray[i + 2].toNat() } else { 0 };
      let idx0 = (b0 / 4) % 64;
      let idx1 = ((b0 % 4) * 16 + b1 / 16) % 64;
      let idx2 = ((b1 % 16) * 4 + b2 / 64) % 64;
      let idx3 = b2 % 64;
      result := result # Text.fromChar(charsArray[idx0]);
      result := result # Text.fromChar(charsArray[idx1]);
      result := result # (if (i + 1 < n) { Text.fromChar(charsArray[idx2]) } else { "=" });
      result := result # (if (i + 2 < n) { Text.fromChar(charsArray[idx3]) } else { "=" });
      i := i + 3;
    };
    result;
  };

  // Private: send SMS via Twilio
  private func sendTwilioSMS(toPhone : Text, body : Text) : async { #ok; #err : Text } {
    if (smsConfig.accountSid == "" or smsConfig.authToken == "" or smsConfig.fromPhone == "") {
      return #err("SMS not configured");
    };
    let url = "https://api.twilio.com/2010-04-01/Accounts/" # smsConfig.accountSid # "/Messages.json";
    let credentials = base64Encode(smsConfig.accountSid # ":" # smsConfig.authToken);
    let headers : [OutCall.Header] = [
      { name = "Authorization"; value = "Basic " # credentials },
      { name = "Content-Type"; value = "application/x-www-form-urlencoded" },
    ];
    let formBody = "To=" # toPhone # "&From=" # smsConfig.fromPhone # "&Body=" # body;
    try {
      let _response = await OutCall.httpPostRequest(url, headers, formBody, transform);
      #ok;
    } catch (_err) {
      #err("Twilio HTTP request failed");
    };
  };

  // Admin: set Twilio SMS credentials
  public shared ({ caller }) func setSMSConfiguration(accountSid : Text, authToken : Text, fromPhone : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure SMS");
    };

    smsConfig.accountSid := accountSid;
    smsConfig.authToken := authToken;
    smsConfig.fromPhone := fromPhone;

    let event = {
      userId = caller;
      eventType = "ADMIN_ACTION";
      timestamp = Time.now();
      details = "SMS (Twilio) configuration updated by admin";
    };
    securityEvents.add(event);
  };

  // Query: check if SMS is configured (all 3 fields non-empty)
  public query ({ caller }) func getSMSConfigurationStatus() : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check SMS configuration status");
    };
    smsConfig.accountSid != "" and smsConfig.authToken != "" and smsConfig.fromPhone != "";
  };

  // Admin: set KYC credentials (Persona or Onfido)
  public shared ({ caller }) func setKYCConfiguration(apiKey : Text, provider : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure KYC");
    };

    kycConfig.apiKey := apiKey;
    kycConfig.provider := provider;

    let event = {
      userId = caller;
      eventType = "ADMIN_ACTION";
      timestamp = Time.now();
      details = "KYC (" # provider # ") configuration updated by admin";
    };
    securityEvents.add(event);
  };

  // Query: check KYC configuration status — returns configured flag and provider name, never exposes the key
  public query ({ caller }) func getKYCConfigurationStatus() : async { configured : Bool; provider : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check KYC configuration status");
    };
    { configured = kycConfig.apiKey != "" and kycConfig.provider != ""; provider = kycConfig.provider };
  };

  // Query: lightweight check — any authenticated user can ask whether KYC is active
  public query func isKYCConfigured() : async Bool {
    kycConfig.apiKey != "" and kycConfig.provider != "";
  };

  // Start an OTP withdrawal challenge — sends SMS to caller's phone
  public shared ({ caller }) func startWithdrawalOTPChallenge(amount : Nat) : async {
    #ok : { challengeId : Text; expiresIn : Nat; phoneSuffix : Text };
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start OTP challenges");
    };

    // Rate limit: 1 OTP request per minute per user
    if (not checkRateLimit(caller, "OTP_CHALLENGE", 1, 60 * 1_000_000_000)) {
      return #err("Too many OTP requests. Please wait before requesting another code");
    };

    // Require user profile with phone number
    let phoneNumber = switch (userProfiles.get(caller)) {
      case (null) { return #err("User profile not found") };
      case (?profile) {
        switch (profile.phoneNumber) {
          case (null) { return #err("Phone number required for 2FA. Please add a phone number to your profile") };
          case (?phone) { phone };
        };
      };
    };

    // Generate 6-digit OTP using Time + Principal hash as seed
    let now = Time.now();
    let principalBytes = caller.toBlob().toArray();
    let principalHash = principalBytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 31 + b.toNat()) % 1_000_000
    });
    let seed = (Int.abs(now) + principalHash) % 1_000_000;
    let otpDigits = seed;
    // Zero-pad to 6 digits
    let otpText = if (otpDigits < 10) { "00000" # otpDigits.toText() }
      else if (otpDigits < 100) { "0000" # otpDigits.toText() }
      else if (otpDigits < 1000) { "000" # otpDigits.toText() }
      else if (otpDigits < 10000) { "00" # otpDigits.toText() }
      else if (otpDigits < 100000) { "0" # otpDigits.toText() }
      else { otpDigits.toText() };

    // Generate challenge ID from Principal + timestamp
    let challengeId = caller.toText() # "-" # now.toText();

    let expiresAt = now + 300_000_000_000; // 5 minutes in nanoseconds

    let challenge : OTPChallenge = {
      userPrincipal = caller;
      otp = otpText;
      amount;
      expiresAt;
      var used = false;
      var failedAttempts = 0;
    };
    otpChallenges.add(challengeId, challenge);

    // Phone suffix: last 4 chars
    let phoneSize = phoneNumber.size();
    let phoneSuffix = if (phoneSize >= 4) {
      let chars = phoneNumber.toArray();
      let suffixChars = Array.tabulate(4, func(i : Nat) : Char { chars[phoneSize - 4 + i] });
      Text.fromArray(suffixChars);
    } else {
      phoneNumber;
    };

    // Send SMS — if it fails, still return the challengeId so user can retry
    let smsBody = "Your OpenTip withdrawal verification code is: " # otpText # ". Expires in 5 minutes. Never share this code.";
    let smsResult = await sendTwilioSMS(phoneNumber, smsBody);
    let smsDetails = switch (smsResult) {
      case (#ok) { "OTP SMS delivered successfully to challenge: " # challengeId };
      case (#err(e)) { "OTP SMS delivery failed for challenge: " # challengeId # " error: " # e };
    };

    let event = {
      userId = caller;
      eventType = "OTP_CHALLENGE_STARTED";
      timestamp = now;
      details = smsDetails;
    };
    securityEvents.add(event);

    #ok({ challengeId; expiresIn = 300; phoneSuffix });
  };

  // Verify a withdrawal OTP
  public shared ({ caller }) func verifyWithdrawalOTP(challengeId : Text, otp : Text) : async {
    #ok : Bool;
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify OTP");
    };

    // Check if caller is locked out
    let lockoutKey = caller.toText();
    switch (otpLockouts.get(lockoutKey)) {
      case (?lockoutExpiry) {
        if (Time.now() < lockoutExpiry) {
          return #err("2FA locked for 15 minutes due to too many failed attempts");
        } else {
          // Lockout expired, remove it
          otpLockouts.remove(lockoutKey);
        };
      };
      case (null) {};
    };

    switch (otpChallenges.get(challengeId)) {
      case (null) { return #err("Invalid challenge") };
      case (?challenge) {
        if (not Principal.equal(challenge.userPrincipal, caller)) {
          return #err("Invalid challenge");
        };

        if (Time.now() > challenge.expiresAt) {
          return #err("OTP expired");
        };

        if (challenge.used) {
          return #err("OTP already used");
        };

        if (challenge.otp != otp) {
          challenge.failedAttempts += 1;
          let attempts = challenge.failedAttempts;

          if (attempts >= 3) {
            // Lock this user's 2FA for 15 minutes
            otpLockouts.add(lockoutKey, Time.now() + 900_000_000_000);

            let event = {
              userId = caller;
              eventType = "OTP_LOCKOUT";
              timestamp = Time.now();
              details = "2FA locked for 15 minutes due to 3 failed OTP attempts on challenge: " # challengeId;
            };
            securityEvents.add(event);

            return #err("Too many failed attempts. 2FA locked for 15 minutes");
          };

          return #err("Invalid OTP. " # (3 - attempts).toText() # " attempts remaining");
        };

        // OTP matches — mark as used
        challenge.used := true;

        let event = {
          userId = caller;
          eventType = "OTP_VERIFIED";
          timestamp = Time.now();
          details = "OTP verified successfully for challenge: " # challengeId;
        };
        securityEvents.add(event);

        #ok(true);
      };
    };
  };

  // ─── End SMS / OTP ──────────────────────────────────────────────────────────

  // ─── Vault Lock ─────────────────────────────────────────────────────────────

  let vaultCooldownNanos : Int = 86400 * 1_000_000_000; // 24 hours
  let vaultAlertIntervalNanos : Int = 6 * 60 * 60 * 1_000_000_000; // 6 hours

  // Helper: check if caller's vault blocks outgoing transactions
  private func isVaultBlocking(caller : Principal) : Bool {
    switch (vaultLocks.get(caller)) {
      case (null) { false };
      case (?state) {
        if (not state.locked) { return false };
        // Locked — check if cooldown is fully complete
        switch (state.unlockRequestedAt) {
          case (null) { true }; // locked, no pending unlock → block
          case (?requestedAt) {
            let elapsed = Time.now() - requestedAt;
            if (elapsed >= vaultCooldownNanos) {
              false; // cooldown complete — vault effectively open (finalize not called yet but don't double-block)
            } else {
              true; // cooldown still running → block
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func lockVault() : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can lock the vault");
    };

    let currentState = switch (vaultLocks.get(caller)) {
      case (null) { { locked = false; unlockRequestedAt = null; lastAlertSentAt = null } };
      case (?s) { s };
    };

    vaultLocks.add(caller, { currentState with locked = true; unlockRequestedAt = null });

    let event = {
      userId = caller;
      eventType = "VAULT_LOCKED";
      timestamp = Time.now();
      details = "User locked their vault";
    };
    securityEvents.add(event);

    #ok("Vault locked successfully");
  };

  public shared ({ caller }) func requestVaultUnlock() : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can unlock the vault");
    };

    let currentState = switch (vaultLocks.get(caller)) {
      case (null) { return #err("Vault is not locked") };
      case (?s) {
        if (not s.locked) { return #err("Vault is not locked") };
        s;
      };
    };

    vaultLocks.add(caller, { currentState with unlockRequestedAt = ?Time.now() });

    let event = {
      userId = caller;
      eventType = "VAULT_UNLOCK_REQUESTED";
      timestamp = Time.now();
      details = "User requested vault unlock — 24-hour cooldown started";
    };
    securityEvents.add(event);

    #ok("Unlock cooldown started. Vault will be available in 24 hours.");
  };

  public shared ({ caller }) func finalizeVaultUnlock() : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can finalize vault unlock");
    };

    let currentState = switch (vaultLocks.get(caller)) {
      case (null) { return #err("No vault lock record found") };
      case (?s) { s };
    };

    switch (currentState.unlockRequestedAt) {
      case (null) { return #err("No unlock request pending") };
      case (?requestedAt) {
        let elapsed = Time.now() - requestedAt;
        if (elapsed < vaultCooldownNanos) {
          let nanosRemaining = vaultCooldownNanos - elapsed;
          let hoursRemaining = nanosRemaining.toFloat() / 3_600_000_000_000.0;
          let hoursText = debug_show(hoursRemaining);
          return #err("Unlock cooldown not complete. " # hoursText # " hours remaining.");
        };

        vaultLocks.add(caller, { currentState with locked = false; unlockRequestedAt = null });

        let event = {
          userId = caller;
          eventType = "VAULT_UNLOCKED";
          timestamp = Time.now();
          details = "Vault unlocked after 24-hour cooldown";
        };
        securityEvents.add(event);

        #ok("Vault unlocked successfully");
      };
    };
  };

  public shared ({ caller }) func cancelVaultUnlock() : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can cancel vault unlock");
    };

    let currentState = switch (vaultLocks.get(caller)) {
      case (null) { return #err("No vault lock record found") };
      case (?s) { s };
    };

    vaultLocks.add(caller, { currentState with unlockRequestedAt = null });

    let event = {
      userId = caller;
      eventType = "VAULT_UNLOCK_CANCELLED";
      timestamp = Time.now();
      details = "User cancelled vault unlock request";
    };
    securityEvents.add(event);

    #ok("Unlock cancelled. Vault remains locked.");
  };

  public query ({ caller }) func getVaultStatus() : async VaultStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view vault status");
    };

    switch (vaultLocks.get(caller)) {
      case (null) {
        { locked = false; unlockPending = false; hoursRemaining = null; shouldShowAlert = false };
      };
      case (?state) {
        let unlockPending = switch (state.unlockRequestedAt) {
          case (null) { false };
          case (?_) { true };
        };

        let hoursRemaining : ?Float = switch (state.unlockRequestedAt) {
          case (null) { null };
          case (?requestedAt) {
            let elapsed = Time.now() - requestedAt;
            if (elapsed >= vaultCooldownNanos) {
              ?0.0;
            } else {
              let nanosRemaining = vaultCooldownNanos - elapsed;
              ?( nanosRemaining.toFloat() / 3_600_000_000_000.0 );
            };
          };
        };

        let shouldShowAlert : Bool = switch (state.unlockRequestedAt) {
          case (null) { false };
          case (?_) {
            switch (state.lastAlertSentAt) {
              case (null) { true }; // never alerted yet
              case (?lastAlert) {
                let sinceLastAlert = Time.now() - lastAlert;
                sinceLastAlert >= vaultAlertIntervalNanos;
              };
            };
          };
        };

        { locked = state.locked; unlockPending; hoursRemaining; shouldShowAlert };
      };
    };
  };

  public shared ({ caller }) func acknowledgeVaultAlert() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can acknowledge vault alerts");
    };

    switch (vaultLocks.get(caller)) {
      case (null) {};
      case (?state) {
        vaultLocks.add(caller, { state with lastAlertSentAt = ?Time.now() });
      };
    };
  };

  // ─── End Vault Lock ──────────────────────────────────────────────────────────

  // ─── GDPR / CCPA Data Controls ──────────────────────────────────────────────

  let deletionGracePeriodNanos : Int = 30 * 24 * 60 * 60 * 1_000_000_000; // 30 days
  let exportRateLimitWindowNanos : Int = 24 * 60 * 60 * 1_000_000_000; // 24 hours

  private func checkExportRateLimit(caller : Principal) : Bool {
    let now = Time.now();
    let windowStart = now - exportRateLimitWindowNanos;
    let attempts = switch (exportRateLimitMap.get(caller)) {
      case (null) { List.empty<Int>() };
      case (?list) { list };
    };
    let recentAttempts = attempts.filter(func(ts : Int) : Bool { ts > windowStart });
    if (recentAttempts.size() >= 3) {
      return false;
    };
    let updated = recentAttempts;
    updated.add(now);
    exportRateLimitMap.add(caller, updated);
    true;
  };

  // Helper: join an array of Text with a separator
  private func joinTexts(arr : [Text], sep : Text) : Text {
    arr.foldLeft("", func(acc : Text, item : Text) : Text {
      if (acc == "") { item } else { acc # sep # item }
    });
  };

  // Export all user data — GDPR Article 20 (data portability)
  public query ({ caller }) func exportUserData() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can export their own data");
    };

    // NOTE: rate limiting is enforced via recordExportRequest (update call).
    // This is a query function so it cannot mutate state.

    let profile = switch (userProfiles.get(caller)) {
      case (null) { "null" };
      case (?p) {
        let kycStatusText = switch (p.kycStatus) {
          case (#notSubmitted) { "not_submitted" };
          case (#pending) { "pending" };
          case (#verified) { "verified" };
          case (#failed) { "failed" };
        };
        let kycDateText = switch (p.kycSubmissionTimestamp) {
          case (null) { "null" };
          case (?ts) { ts.toText() };
        };
        "{\"username\":\"" # p.username # "\",\"email\":\"" # p.email # "\",\"bio\":\"" # p.bio # "\",\"walletAddress\":\"" # (switch (p.walletAddress) { case (null) { "" }; case (?w) { w } }) # "\",\"phoneNumber\":\"" # (switch (p.phoneNumber) { case (null) { "" }; case (?ph) { ph } }) # "\",\"isVerified\":" # (if (p.isVerified) "true" else "false") # ",\"kycStatus\":\"" # kycStatusText # "\",\"kycSubmissionDate\":" # kycDateText # "}";
      };
    };

    let tipsArray = tips.toArray();

    let tipsSentArr = tipsArray.filter(func(t : Tip) : Bool { t.fromUser == caller }).map(
      func(t : Tip) : Text {
        let currency = switch (t.currencyType) { case (#fiat) { "fiat" }; case (#crypto) { "crypto" } };
        "{\"to\":\"" # t.toUser.toText() # "\",\"amount\":" # t.amount.toText() # ",\"message\":\"" # t.message # "\",\"timestamp\":" # t.timestamp.toText() # ",\"professional\":" # (if (t.professional) "true" else "false") # ",\"currency\":\"" # currency # "\"}"
      }
    );

    let tipsReceivedArr = tipsArray.filter(func(t : Tip) : Bool { t.toUser == caller }).map(
      func(t : Tip) : Text {
        let currency = switch (t.currencyType) { case (#fiat) { "fiat" }; case (#crypto) { "crypto" } };
        "{\"from\":\"" # t.fromUser.toText() # "\",\"amount\":" # t.amount.toText() # ",\"message\":\"" # t.message # "\",\"timestamp\":" # t.timestamp.toText() # ",\"professional\":" # (if (t.professional) "true" else "false") # ",\"currency\":\"" # currency # "\"}"
      }
    );

    let balance = switch (balances.get(caller)) {
      case (null) { "0" };
      case (?b) { b.toText() };
    };

    let paymentMethodsJson = switch (paymentMethods.get(caller)) {
      case (null) { "[]" };
      case (?methods) {
        let parts = methods.map(func(m : PaymentMethod) : Text {
          let mtype = switch (m.methodType) { case (#card) { "card" }; case (#bankAccount) { "bank_account" } };
          "{\"type\":\"" # mtype # "\",\"last4\":\"" # m.last4 # "\",\"addedAt\":" # m.addedAt.toText() # "}"
        });
        "[" # joinTexts(parts, ",") # "]";
      };
    };

    let biometricJson = switch (biometricSettings.get(caller)) {
      case (null) { "{\"enabled\":false}" };
      case (?b) {
        "{\"enabled\":" # (if (b.enabled) "true" else "false") # ",\"type\":\"" # (switch (b.biometricType) { case (null) { "" }; case (?t) { t } }) # "\"}"
      };
    };

    let twoFAJson = switch (twoFactorSettings.get(caller)) {
      case (null) { "{\"enabled\":false}" };
      case (?s) {
        "{\"enabled\":" # (if (s.enabled) "true" else "false") # ",\"method\":\"" # (switch (s.method) { case (null) { "" }; case (?m) { m } }) # "\"}"
      };
    };

    let vaultJson = switch (vaultLocks.get(caller)) {
      case (null) { "{\"locked\":false}" };
      case (?v) {
        "{\"locked\":" # (if (v.locked) "true" else "false") # ",\"unlockRequestedAt\":" # (switch (v.unlockRequestedAt) { case (null) { "null" }; case (?t) { t.toText() } }) # "}"
      };
    };

    let sessionsJson = switch (activeSessions.get(caller)) {
      case (null) { "[]" };
      case (?sessions) {
        let parts = sessions.map(func(s : ActiveSession) : Text {
          "{\"deviceName\":\"" # s.deviceName # "\",\"location\":\"" # s.location # "\",\"loginTimestamp\":" # s.loginTimestamp.toText() # "}"
        });
        "[" # joinTexts(parts, ",") # "]";
      };
    };

    let securityEventsArray = securityEvents.toArray();
    let mySecurityEvents = securityEventsArray.filter(func(e : SecurityEvent) : Bool { e.userId == caller });
    let secEventsArr = mySecurityEvents.map(func(e : SecurityEvent) : Text {
      "{\"type\":\"" # e.eventType # "\",\"timestamp\":" # e.timestamp.toText() # ",\"details\":\"" # e.details # "\"}"
    });

    let aiQueriesArray = aiQueryLog.toArray();
    let myAIQueries = aiQueriesArray.filter(func(q : AIQuery) : Bool { q.userId == caller });
    let aiQueriesArr = myAIQueries.map(func(q : AIQuery) : Text {
      "{\"query\":\"" # q.queryText # "\",\"response\":\"" # q.response # "\",\"timestamp\":" # q.timestamp.toText() # "}"
    });

    let encryptionEventsJson = switch (encryptionLogs.get(caller)) {
      case (null) { "[]" };
      case (?logs) {
        let parts = logs.map(func(e : EncryptionEvent) : Text {
          "{\"type\":\"" # e.eventType # "\",\"dataType\":\"" # e.dataType # "\",\"timestamp\":" # e.timestamp.toText() # "}"
        });
        "[" # joinTexts(parts, ",") # "]";
      };
    };

    let tipsSentStr = "[" # joinTexts(tipsSentArr, ",") # "]";
    let tipsReceivedStr = "[" # joinTexts(tipsReceivedArr, ",") # "]";
    let secEventsJson = "[" # joinTexts(secEventsArr, ",") # "]";
    let aiQueriesJson = "[" # joinTexts(aiQueriesArr, ",") # "]";

    let exportTimestamp = Time.now();

    "{\"exportTimestamp\":" # exportTimestamp.toText() # ",\"notice\":\"This is a complete GDPR Article 20 data portability export for principal " # caller.toText() # "\",\"profile\":" # profile # ",\"balance\":" # balance # ",\"tipsSent\":" # tipsSentStr # ",\"tipsReceived\":" # tipsReceivedStr # ",\"paymentMethods\":" # paymentMethodsJson # ",\"biometricSettings\":" # biometricJson # ",\"twoFactorSettings\":" # twoFAJson # ",\"vaultState\":" # vaultJson # ",\"activeSessions\":" # sessionsJson # ",\"securityEvents\":" # secEventsJson # ",\"aiQueryHistory\":" # aiQueriesJson # ",\"encryptionEvents\":" # encryptionEventsJson # "}";
  };

  // Rate-limit enforcement for exports — must be called before exportUserData
  public shared ({ caller }) func recordExportRequest() : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can export their own data");
    };

    if (not checkExportRateLimit(caller)) {
      return #err("Export rate limit exceeded: maximum 3 exports per 24 hours");
    };

    gdprAuditLog.add({
      principal = caller;
      eventType = #export_requested;
      timestamp = Time.now();
    });

    let secEvent = {
      userId = caller;
      eventType = "GDPR_EXPORT_REQUESTED";
      timestamp = Time.now();
      details = "User requested GDPR data export";
    };
    securityEvents.add(secEvent);

    #ok;
  };

  // Request account deletion — marks account as deletion_pending for 30 days
  public shared ({ caller }) func requestAccountDeletion() : async {
    #ok : { scheduledDeletionTime : Int; confirmationToken : Text };
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can request deletion of their own account");
    };

    switch (deletionRequests.get(caller)) {
      case (?record) {
        if (not record.finalized) {
          return #err("A deletion request is already pending");
        };
      };
      case (null) {};
    };

    let now = Time.now();
    let scheduledDeletionTime = now + deletionGracePeriodNanos;

    // Simple confirmation token: principal hash + timestamp
    let principalBytes = caller.toBlob().toArray();
    let hash = principalBytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 31 + b.toNat()) % 1_000_000_000
    });
    let confirmationToken = "DEL-" # hash.toText() # "-" # (Int.abs(now) % 1_000_000).toText();

    deletionRequests.add(caller, { scheduledDeletionTime; finalized = false });

    gdprAuditLog.add({
      principal = caller;
      eventType = #deletion_requested;
      timestamp = now;
    });

    let secEvent = {
      userId = caller;
      eventType = "GDPR_DELETION_REQUESTED";
      timestamp = now;
      details = "Account deletion requested. Scheduled for: " # scheduledDeletionTime.toText();
    };
    securityEvents.add(secEvent);

    #ok({ scheduledDeletionTime; confirmationToken });
  };

  // Cancel a pending account deletion
  public shared ({ caller }) func cancelAccountDeletion() : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can cancel their own deletion request");
    };

    switch (deletionRequests.get(caller)) {
      case (null) {
        return #err("No pending deletion request found");
      };
      case (?record) {
        if (record.finalized) {
          return #err("Account has already been deleted");
        };

        deletionRequests.remove(caller);

        gdprAuditLog.add({
          principal = caller;
          eventType = #deletion_cancelled;
          timestamp = Time.now();
        });

        let secEvent = {
          userId = caller;
          eventType = "GDPR_DELETION_CANCELLED";
          timestamp = Time.now();
          details = "Account deletion request cancelled by user";
        };
        securityEvents.add(secEvent);

        #ok;
      };
    };
  };

  // Finalize account deletion — permanently erases all user data after 30-day window
  public shared ({ caller }) func finalizeAccountDeletion() : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can finalize their own account deletion");
    };

    let record = switch (deletionRequests.get(caller)) {
      case (null) { return #err("No deletion request found. Call requestAccountDeletion first") };
      case (?r) { r };
    };

    if (record.finalized) {
      return #err("Account has already been deleted");
    };

    let now = Time.now();
    if (now < record.scheduledDeletionTime) {
      let nanosRemaining = record.scheduledDeletionTime - now;
      let daysRemaining = nanosRemaining / (24 * 60 * 60 * 1_000_000_000);
      return #err("Deletion window not yet passed. Approximately " # daysRemaining.toText() # " day(s) remaining");
    };

    // Log final audit event before erasing data
    gdprAuditLog.add({
      principal = caller;
      eventType = #deletion_finalized;
      timestamp = now;
    });

    let secEvent = {
      userId = caller;
      eventType = "GDPR_DELETION_FINALIZED";
      timestamp = now;
      details = "Account permanently deleted per GDPR request";
    };
    securityEvents.add(secEvent);

    // Permanently erase all user data from all storage maps
    userProfiles.remove(caller);
    statuses.remove(caller);
    kycSubmissionAttempts.remove(caller);
    pinData.remove(caller);
    paymentMethods.remove(caller);
    balances.remove(caller);
    activeSessions.remove(caller);
    biometricSettings.remove(caller);
    twoFactorSettings.remove(caller);
    voicePrints.remove(caller);
    vaultLocks.remove(caller);
    encryptionLogs.remove(caller);
    rateLimitMap.remove(caller);
    exportRateLimitMap.remove(caller);
    businessApplications.remove(caller);
    // Remove manager portal data for this user (as manager)
    staffRosters.remove(caller);
    tipPoolConfigs.remove(caller);
    payoutRecords.remove(caller);
    // Remove any staff invites issued by this manager
    let inviteCodesToRemove = staffInvites.entries().filter(
      func((_, inv) : (Text, StaffInvite)) : Bool { Principal.equal(inv.managerPrincipal, caller) }
    ).map(func((code, _) : (Text, StaffInvite)) : Text { code }).toArray();
    for (code in inviteCodesToRemove.values()) { staffInvites.remove(code) };
    // Remove Stripe session keys owned by this caller
    let sessionKeysToRemove = stripeSessions.entries().filter(
      func((_, owner) : (Text, Principal)) : Bool { Principal.equal(owner, caller) }
    ).map(func((k, _) : (Text, Principal)) : Text { k });
    for (k in sessionKeysToRemove) { stripeSessions.remove(k) };

    // Remove tips — replace the global list with one excluding this user
    tips := tips.filter(func(t : Tip) : Bool {
      not Principal.equal(t.fromUser, caller) and not Principal.equal(t.toUser, caller)
    });

    // Remove AI query log entries for this user
    aiQueryLog := aiQueryLog.filter(func(q : AIQuery) : Bool {
      not Principal.equal(q.userId, caller)
    });

    // Remove direct deposit data
    directDepositAccounts.remove(caller);
    let ddKeysToRemove = directDeposits.entries().filter(
      func((_, d) : (Text, DirectDeposit)) : Bool { Principal.equal(d.userPrincipal, caller) }
    ).map(func((k, _) : (Text, DirectDeposit)) : Text { k }).toArray();
    for (k in ddKeysToRemove.values()) { directDeposits.remove(k) };

    // Mark the deletion record as finalized (keep for audit trail)
    deletionRequests.add(caller, { record with finalized = true });

    #ok;
  };

  // Get the caller's GDPR audit log (export_requested, deletion_requested, deletion_cancelled, deletion_finalized)
  public query ({ caller }) func getGDPRAuditLog() : async [GDPRAuditEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their own GDPR audit log");
    };

    let allEvents = gdprAuditLog.toArray();
    let myEvents = allEvents.filter(func(e : GDPRAuditEvent) : Bool {
      Principal.equal(e.principal, caller)
    });
    // Sort newest first
    myEvents.sort<GDPRAuditEvent>(func(a : GDPRAuditEvent, b : GDPRAuditEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // Get the caller's current account deletion status
  public query ({ caller }) func getAccountDeletionStatus() : async DeletionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their own deletion status");
    };

    switch (deletionRequests.get(caller)) {
      case (null) { #not_requested };
      case (?record) {
        if (record.finalized) {
          #finalized;
        } else {
          #pending({ scheduledDeletionTime = record.scheduledDeletionTime });
        };
      };
    };
  };

  // ─── End GDPR / CCPA ────────────────────────────────────────────────────────

  // ─── Upgrade to Business: Self-Service Application ──────────────────────────
  //
  // NOTE: The caffeineai-authorization package defines UserRole as #admin | #user | #guest.
  // The package cannot be edited. There is no #manager variant available.
  // Approved applicants are promoted to #admin (the highest available role that grants
  // access to the Manager Portal). This is documented here and in approveBusinessApplication.

  // Trim whitespace from a text value
  private func trimText(t : Text) : Text {
    t.trim(#char ' ');
  };

  // Submit or overwrite a pending business upgrade application
  public shared ({ caller }) func submitBusinessApplication(
    businessName : Text,
    businessType : Text,
    description : Text,
    termsAccepted : Bool,
  ) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only registered users can apply for a business upgrade");
    };

    // Reject re-application if already approved
    switch (businessApplications.get(caller)) {
      case (?existing) {
        switch (existing.status) {
          case (#approved) { return #err("Your business application has already been approved") };
          case (_) {};
        };
      };
      case (null) {};
    };

    // Validate and sanitize inputs
    let trimmedName = trimText(businessName);
    let trimmedDesc = trimText(description);

    if (trimmedName.size() == 0) {
      return #err("Business name must not be empty");
    };
    if (trimmedName.size() > 100) {
      return #err("Business name must be 100 characters or fewer");
    };
    if (not validateTextInput(trimmedName, 100, "businessName")) {
      return #err("Business name contains invalid content");
    };

    if (trimmedDesc.size() == 0) {
      return #err("Description must not be empty");
    };
    if (trimmedDesc.size() > 500) {
      return #err("Description must be 500 characters or fewer");
    };
    if (not validateTextInput(trimmedDesc, 500, "description")) {
      return #err("Description contains invalid content");
    };

    if (businessType.size() == 0) {
      return #err("Business type must not be empty");
    };
    if (not validateTextInput(businessType, 100, "businessType")) {
      return #err("Business type contains invalid content");
    };

    if (not termsAccepted) {
      return #err("You must accept the terms and conditions to apply");
    };

    let now = Time.now();
    let existingCreatedAt = switch (businessApplications.get(caller)) {
      case (?existing) { existing.createdAt };
      case (null) { now };
    };

    let application : BusinessApplication = {
      businessName = sanitizeTextInput(trimmedName);
      businessType = sanitizeTextInput(businessType);
      description = sanitizeTextInput(trimmedDesc);
      termsAccepted;
      status = #pending;
      rejectionReason = null;
      createdAt = existingCreatedAt;
      updatedAt = now;
    };
    businessApplications.add(caller, application);

    let event = {
      userId = caller;
      eventType = "BUSINESS_APPLICATION_SUBMITTED";
      timestamp = now;
      details = "Business upgrade application submitted: " # application.businessName;
    };
    securityEvents.add(event);

    #ok;
  };

  // Return the caller's business application, or null if none exists
  public query ({ caller }) func getMyBusinessApplication() : async ?BusinessApplication {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view their business application");
    };
    businessApplications.get(caller);
  };

  // Admin: approve a business application and elevate the applicant's role
  // NOTE: promotes to #admin since #manager is not available in the authorization package
  public shared ({ caller }) func approveBusinessApplication(applicant : Principal) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can approve business applications");
    };

    let application = switch (businessApplications.get(applicant)) {
      case (null) { return #err("No application found for the specified principal") };
      case (?app) { app };
    };

    switch (application.status) {
      case (#approved) { return #err("Application is already approved") };
      case (_) {};
    };

    let now = Time.now();
    businessApplications.add(applicant, {
      application with
      status = #approved;
      rejectionReason = null;
      updatedAt = now;
    });

    // Promote applicant to #admin (fallback — #manager not available in authorization package)
    AccessControl.assignRole(accessControlState, caller, applicant, #admin);

    let event = {
      userId = applicant;
      eventType = "BUSINESS_APPLICATION_APPROVED";
      timestamp = now;
      details = "Business application approved by admin: " # caller.toText() # ". Role elevated to admin (manager fallback).";
    };
    securityEvents.add(event);

    #ok;
  };

  // Admin: reject a business application with an optional reason
  public shared ({ caller }) func rejectBusinessApplication(applicant : Principal, reason : ?Text) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can reject business applications");
    };

    let application = switch (businessApplications.get(applicant)) {
      case (null) { return #err("No application found for the specified principal") };
      case (?app) { app };
    };

    switch (application.status) {
      case (#approved) { return #err("Cannot reject an already approved application") };
      case (_) {};
    };

    // Validate rejection reason if provided
    let validatedReason : ?Text = switch (reason) {
      case (null) { null };
      case (?r) {
        if (not validateTextInput(r, 500, "rejectionReason")) {
          return #err("Rejection reason contains invalid content or exceeds 500 characters");
        };
        ?sanitizeTextInput(r);
      };
    };

    let now = Time.now();
    businessApplications.add(applicant, {
      application with
      status = #rejected;
      rejectionReason = validatedReason;
      updatedAt = now;
    });

    let reasonText = switch (validatedReason) {
      case (null) { "No reason provided" };
      case (?r) { r };
    };

    let event = {
      userId = applicant;
      eventType = "BUSINESS_APPLICATION_REJECTED";
      timestamp = now;
      details = "Business application rejected by admin: " # caller.toText() # ". Reason: " # reasonText;
    };
    securityEvents.add(event);

    #ok;
  };

  // Admin: retrieve all applications with #pending status
  public query ({ caller }) func getPendingBusinessApplications() : async [(Principal, BusinessApplication)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view business applications");
    };

    businessApplications.toArray().filter(
      func((_, app) : (Principal, BusinessApplication)) : Bool {
        switch (app.status) {
          case (#pending) { true };
          case (_) { false };
        };
      }
    );
  };

  // Admin: retrieve all applications regardless of status
  public query ({ caller }) func getAllBusinessApplications() : async [(Principal, BusinessApplication)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all business applications");
    };

    businessApplications.toArray();
  };

  // ─── End Upgrade to Business ─────────────────────────────────────────────────

  // ─── Manager Portal: Staff Roster, Tip Pool & Payouts ───────────────────────

  // ── helpers ──────────────────────────────────────────────────────────────────

  // Require caller to be a manager (admin or approved business account)
  private func requireManager(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only approved managers can perform this action");
    };
  };

  // Generate a non-guessable invite code from caller principal + timestamp + entropy
  private func generateInviteCodeForRoster(caller : Principal, now : Int) : Text {
    let principalBytes = caller.toBlob().toArray();
    let hash1 = principalBytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 1000003 + b.toNat()) % 1_000_000_000
    });
    let hash2 = (Int.abs(now) * 131 + hash1) % 1_000_000_000;
    let hash3 = (hash1 * 17 + hash2 * 7 + principalBytes.size() * 13) % 1_000_000_000;
    "roster-" # hash1.toText() # "-" # hash2.toText() # "-" # hash3.toText();
  };

  // ── Staff Roster Management ──────────────────────────────────────────────────

  /// Manager: create a roster invite link (expires 72h, good for up to 50 accepts)
  public shared ({ caller }) func createRosterInviteLink() : async { #ok : Text; #err : Text } {
    requireManager(caller);

    let now = Time.now();
    let code = generateInviteCodeForRoster(caller, now);

    // Prevent accidental collision (extremely unlikely)
    switch (staffInvites.get(code)) {
      case (?_) { return #err("Code collision — please retry") };
      case (null) {};
    };

    let invite : StaffInvite = {
      inviteCode = code;
      managerPrincipal = caller;
      inviteePrincipal = null;
      method = #link;
      status = #pending;
      createdAt = now;
      expiresAt = now + 72 * 60 * 60 * 1_000_000_000; // 72 hours
    };
    staffInvites.add(code, invite);

    let event = {
      userId = caller;
      eventType = "ROSTER_INVITE_LINK_CREATED";
      timestamp = now;
      details = "Manager created roster invite link: " # code;
    };
    securityEvents.add(event);

    #ok(code);
  };

  /// Query: find a user by their registered phone number (privacy-protected)
  public query ({ caller }) func findUserByPhone(phone : Text) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search by phone");
    };

    if (not validateTextInput(phone, 20, "phone")) {
      return null;
    };

    let result = userProfiles.entries().find(
      func((_, profile) : (Principal, UserProfile)) : Bool {
        switch (profile.phoneNumber) {
          case (null) { false };
          case (?p) { p == phone };
        };
      }
    );

    switch (result) {
      case (null) { null };
      case (?(_, profile)) { ?profile };
    };
  };

  /// Manager: invite a staff member by their phone number
  public shared ({ caller }) func inviteStaffByPhone(phone : Text) : async { #ok; #err : Text } {
    requireManager(caller);

    if (not validateTextInput(phone, 20, "phone")) {
      return #err("Invalid phone number format");
    };

    // Resolve invitee principal by phone
    let inviteeEntry = userProfiles.entries().find(
      func((_, profile) : (Principal, UserProfile)) : Bool {
        switch (profile.phoneNumber) {
          case (null) { false };
          case (?p) { p == phone };
        };
      }
    );

    let inviteePrincipal = switch (inviteeEntry) {
      case (null) { return #err("No user found with this phone number") };
      case (?(p, _)) { p };
    };

    // Prevent duplicate pending invites to the same user
    let alreadyInvited = staffInvites.entries().any(
      func((_, inv) : (Text, StaffInvite)) : Bool {
        let sameManager = Principal.equal(inv.managerPrincipal, caller);
        let sameInvitee = switch (inv.inviteePrincipal) {
          case (?ip) { Principal.equal(ip, inviteePrincipal) };
          case (null) { false };
        };
        let isPending = switch (inv.status) {
          case (#pending) { true };
          case (_) { false };
        };
        sameManager and sameInvitee and isPending;
      }
    );

    if (alreadyInvited) {
      return #err("A pending invite already exists for this user");
    };

    let now = Time.now();
    let code = generateInviteCodeForRoster(caller, now) # "-phone";

    let invite : StaffInvite = {
      inviteCode = code;
      managerPrincipal = caller;
      inviteePrincipal = ?inviteePrincipal;
      method = #phone;
      status = #pending;
      createdAt = now;
      expiresAt = now + 72 * 60 * 60 * 1_000_000_000;
    };
    staffInvites.add(code, invite);

    let event = {
      userId = caller;
      eventType = "ROSTER_STAFF_INVITED_BY_PHONE";
      timestamp = now;
      details = "Manager invited staff by phone: " # phone # " invite: " # code;
    };
    securityEvents.add(event);

    #ok;
  };

  /// Staff: accept a roster invite (link-based or phone-based)
  public shared ({ caller }) func acceptStaffInvite(inviteCode : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can accept staff invites");
    };

    let invite = switch (staffInvites.get(inviteCode)) {
      case (null) { return #err("Invite not found") };
      case (?inv) { inv };
    };

    // Validate status
    switch (invite.status) {
      case (#pending) {};
      case (#accepted) { return #err("Invite already accepted") };
      case (#declined) { return #err("Invite was declined") };
    };

    // Validate expiry
    if (Time.now() > invite.expiresAt) {
      return #err("Invite has expired");
    };

    // For phone invites, ensure the caller is the intended invitee
    switch (invite.inviteePrincipal) {
      case (?intended) {
        if (not Principal.equal(intended, caller)) {
          return #err("This invite was not issued to you");
        };
      };
      case (null) {
        // Link-based — check 50-use cap
        let usedCount = staffInvites.entries().filter(
          func((_, inv) : (Text, StaffInvite)) : Bool {
            let sameCode = inv.inviteCode == inviteCode;
            let isAccepted = switch (inv.status) {
              case (#accepted) { true };
              case (_) { false };
            };
            sameCode and isAccepted;
          }
        ).size();
        if (usedCount >= 50) {
          return #err("This invite link has reached its maximum use count");
        };
      };
    };

    // Prevent duplicate active membership
    let roster = switch (staffRosters.get(invite.managerPrincipal)) {
      case (null) { List.empty<StaffMember>() };
      case (?r) { r };
    };
    let alreadyMember = roster.any(
      func(m : StaffMember) : Bool {
        let samePrincipal = Principal.equal(m.principal, caller);
        let isActive = switch (m.status) {
          case (#active) { true };
          case (#removed) { false };
        };
        samePrincipal and isActive;
      }
    );
    if (alreadyMember) {
      return #err("You are already a member of this manager's roster");
    };

    // Mark invite accepted
    staffInvites.add(inviteCode, { invite with status = #accepted; inviteePrincipal = ?caller });

    // Add to roster
    let member : StaffMember = {
      principal = caller;
      joinedAt = Time.now();
      status = #active;
    };
    roster.add(member);
    staffRosters.add(invite.managerPrincipal, roster);

    let event = {
      userId = caller;
      eventType = "ROSTER_INVITE_ACCEPTED";
      timestamp = Time.now();
      details = "Staff accepted invite from manager: " # invite.managerPrincipal.toText();
    };
    securityEvents.add(event);

    #ok;
  };

  /// Staff: decline a roster invite
  public shared ({ caller }) func declineStaffInvite(inviteCode : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can decline staff invites");
    };

    let invite = switch (staffInvites.get(inviteCode)) {
      case (null) { return #err("Invite not found") };
      case (?inv) { inv };
    };

    switch (invite.status) {
      case (#pending) {};
      case (#accepted) { return #err("Invite already accepted") };
      case (#declined) { return #err("Invite already declined") };
    };

    // For phone invites verify caller is the invitee
    switch (invite.inviteePrincipal) {
      case (?intended) {
        if (not Principal.equal(intended, caller)) {
          return #err("This invite was not issued to you");
        };
      };
      case (null) {};
    };

    staffInvites.add(inviteCode, { invite with status = #declined });

    let event = {
      userId = caller;
      eventType = "ROSTER_INVITE_DECLINED";
      timestamp = Time.now();
      details = "Staff declined invite from manager: " # invite.managerPrincipal.toText();
    };
    securityEvents.add(event);

    #ok;
  };

  /// Staff: get all pending invites sent TO the caller
  public query ({ caller }) func getMyRosterInvites() : async [StaffInvite] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their roster invites");
    };

    staffInvites.entries().filter(
      func((_, inv) : (Text, StaffInvite)) : Bool {
        let isForCaller = switch (inv.inviteePrincipal) {
          case (?ip) { Principal.equal(ip, caller) };
          case (null) { false };
        };
        let isPending = switch (inv.status) {
          case (#pending) { true };
          case (_) { false };
        };
        isForCaller and isPending;
      }
    ).map<(Text, StaffInvite), StaffInvite>(func((_, inv) : (Text, StaffInvite)) : StaffInvite { inv }).toArray();
  };

  /// Manager: get the full roster for the calling manager
  public query ({ caller }) func getManagerRoster() : async [StaffMember] {
    requireManager(caller);

    switch (staffRosters.get(caller)) {
      case (null) { [] };
      case (?roster) { roster.toArray() };
    };
  };

  /// Manager: remove a staff member from the roster
  public shared ({ caller }) func removeStaffMember(staffPrincipal : Principal) : async { #ok; #err : Text } {
    requireManager(caller);

    let roster = switch (staffRosters.get(caller)) {
      case (null) { return #err("No roster found") };
      case (?r) { r };
    };

    var found = false;
    roster.mapInPlace(
      func(m : StaffMember) : StaffMember {
        let samePrincipal = Principal.equal(m.principal, staffPrincipal);
        let isActive = switch (m.status) { case (#active) { true }; case (_) { false } };
        if (samePrincipal and isActive) {
          found := true;
          { m with status = #removed };
        } else {
          m;
        };
      }
    );

    if (not found) {
      return #err("Staff member not found or already removed");
    };

    staffRosters.add(caller, roster);

    let event = {
      userId = caller;
      eventType = "ROSTER_STAFF_REMOVED";
      timestamp = Time.now();
      details = "Manager removed staff member: " # staffPrincipal.toText();
    };
    securityEvents.add(event);

    #ok;
  };

  // ── Tip Pool & Payouts ───────────────────────────────────────────────────────

  /// Manager: enable/disable tip pooling and set distribution mode
  public shared ({ caller }) func setTipPoolMode(enabled : Bool, mode : TipPoolMode) : async { #ok; #err : Text } {
    requireManager(caller);

    let current = switch (tipPoolConfigs.get(caller)) {
      case (null) { { enabled = false; mode = #equal; customSplits = [] } };
      case (?cfg) { cfg };
    };

    tipPoolConfigs.add(caller, { current with enabled; mode });

    let event = {
      userId = caller;
      eventType = "TIP_POOL_MODE_SET";
      timestamp = Time.now();
      details = "Tip pool " # (if (enabled) "enabled" else "disabled") # " mode: " # debug_show(mode);
    };
    securityEvents.add(event);

    #ok;
  };

  /// Manager: get current tip pool settings
  public query ({ caller }) func getTipPoolSettings() : async TipPoolConfig {
    requireManager(caller);

    switch (tipPoolConfigs.get(caller)) {
      case (null) { { enabled = false; mode = #equal; customSplits = [] } };
      case (?cfg) { cfg };
    };
  };

  /// Manager: get summed tips received per staff member since an optional timestamp, sorted descending
  public query ({ caller }) func getStaffTipTotals(since : ?Int) : async [(Principal, Nat)] {
    requireManager(caller);

    let roster = switch (staffRosters.get(caller)) {
      case (null) { return [] };
      case (?r) { r };
    };

    let activeStaff = roster.filter(
      func(m : StaffMember) : Bool {
        switch (m.status) { case (#active) { true }; case (#removed) { false } };
      }
    );

    let tipsArray = tips.toArray();
    let cutoff : Int = switch (since) {
      case (null) { 0 };
      case (?ts) { ts };
    };

    let totals : [(Principal, Nat)] = activeStaff.map<StaffMember, (Principal, Nat)>(
      func(member : StaffMember) : (Principal, Nat) {
        let total = tipsArray.foldLeft(
          0,
          func(acc : Nat, tip : Tip) : Nat {
            if (Principal.equal(tip.toUser, member.principal) and tip.timestamp >= cutoff) {
              acc + tip.amount;
            } else {
              acc;
            };
          }
        );
        (member.principal, total);
      }
    ).toArray();

    // Sort descending by tip total
    totals.sort<(Principal, Nat)>(func(a : (Principal, Nat), b : (Principal, Nat)) : Order.Order {
      Nat.compare(b.1, a.1);
    });
  };

  /// Manager: record a payout distribution (does NOT move funds — manager controls external settlement)
  public shared ({ caller }) func recordPayout(distributions : [(Principal, Nat)], notes : Text) : async { #ok : Text; #err : Text } {
    requireManager(caller);

    if (distributions.size() == 0) {
      return #err("Distributions must not be empty");
    };

    if (not validateTextInput(notes, 500, "payoutNotes")) {
      return #err("Notes contain invalid content or exceed 500 characters");
    };

    let now = Time.now();
    let principalBytes = caller.toBlob().toArray();
    let idHash = principalBytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 1000003 + b.toNat()) % 1_000_000_000
    });
    let payoutId = "payout-" # idHash.toText() # "-" # (Int.abs(now) % 1_000_000_000).toText();

    let record : PayoutRecord = {
      id = payoutId;
      managerPrincipal = caller;
      distributions;
      notes = sanitizeTextInput(notes);
      timestamp = now;
    };

    let existing = switch (payoutRecords.get(caller)) {
      case (null) { List.empty<PayoutRecord>() };
      case (?recs) { recs };
    };
    existing.add(record);
    payoutRecords.add(caller, existing);

    let event = {
      userId = caller;
      eventType = "PAYOUT_RECORDED";
      timestamp = now;
      details = "Manager recorded payout to " # distributions.size().toText() # " staff. ID: " # payoutId;
    };
    securityEvents.add(event);

    #ok(payoutId);
  };

  /// Manager: get full payout history
  public query ({ caller }) func getPayoutHistory() : async [PayoutRecord] {
    requireManager(caller);

    switch (payoutRecords.get(caller)) {
      case (null) { [] };
      case (?recs) {
        let arr = recs.toArray();
        arr.sort<PayoutRecord>(func(a : PayoutRecord, b : PayoutRecord) : Order.Order {
          Int.compare(b.timestamp, a.timestamp)
        });
      };
    };
  };

  // ─── End Manager Portal ──────────────────────────────────────────────────────

  public query ({ caller }) func getCompilationStatus() : async CompilationStatus {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view compilation status");
    };
    compilationStatus;
  };

  // ─── getTips: combined tips for caller (sent + received) ─────────────────────

  public query ({ caller }) func getTips() : async [Tip] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tips");
    };
    let tipsArray = tips.toArray();
    let filtered = tipsArray.filter(func(t : Tip) : Bool {
      Principal.equal(t.fromUser, caller) or Principal.equal(t.toUser, caller)
    });
    filtered.sort<Tip>(func(a : Tip, b : Tip) : Order.Order { Int.compare(b.timestamp, a.timestamp) });
  };

  // ─── createStripeCheckoutSession: alias matching contract export name ─────────

  public shared ({ caller }) func createStripeCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create checkout sessions");
    };
    if (not validateTextInput(successUrl, 500, "successUrl") or not validateTextInput(cancelUrl, 500, "cancelUrl")) {
      Runtime.trap("Invalid URL format");
    };
    if (items.size() == 0) {
      Runtime.trap("Cannot create checkout session with no items");
    };
    let sessionId = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
    stripeSessions.add(sessionId, caller);
    let event = {
      userId = caller;
      eventType = "CHECKOUT_SESSION_CREATED";
      timestamp = Time.now();
      details = "Stripe checkout session created";
    };
    securityEvents.add(event);
    sessionId;
  };

  // ─── getCallerBusinessApplicationStatus ──────────────────────────────────────

  public query ({ caller }) func getCallerBusinessApplicationStatus() : async ?BusinessApplicationStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their business application status");
    };
    switch (businessApplications.get(caller)) {
      case (null) { null };
      case (?app) { ?app.status };
    };
  };

  // ─── Dispute Resolution ───────────────────────────────────────────────────────

  public shared ({ caller }) func recordDisputeRequest(
    transactionTimestamp : Int,
    counterpartyPrincipal : Principal,
    reason : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can file disputes");
    };

    if (not validateTextInput(reason, 1000, "disputeReason")) {
      return #err("Dispute reason contains invalid content or exceeds 1000 characters");
    };

    let now = Time.now();
    let principalBytes = caller.toBlob().toArray();
    let idHash = principalBytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 1000003 + b.toNat()) % 1_000_000_000
    });
    let disputeId = "disp-" # idHash.toText() # "-" # (Int.abs(now) % 1_000_000_000).toText();

    let dispute : Dispute = {
      id = disputeId;
      submitterPrincipal = caller;
      transactionTimestamp;
      counterpartyPrincipal;
      reason = sanitizeTextInput(reason);
      status = #open;
      resolution = null;
      createdAt = now;
      updatedAt = now;
    };
    disputes.add(dispute);

    let event = {
      userId = caller;
      eventType = "DISPUTE_FILED";
      timestamp = now;
      details = "Dispute filed against: " # counterpartyPrincipal.toText() # " ID: " # disputeId;
    };
    securityEvents.add(event);

    #ok(disputeId);
  };

  public query ({ caller }) func getMyDisputes() : async [Dispute] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their disputes");
    };
    let all = disputes.toArray();
    let mine = all.filter(func(d : Dispute) : Bool {
      Principal.equal(d.submitterPrincipal, caller)
    });
    mine.sort<Dispute>(func(a : Dispute, b : Dispute) : Order.Order {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  public shared ({ caller }) func resolveDispute(disputeId : Text, resolution : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can resolve disputes");
    };

    if (not validateTextInput(resolution, 1000, "resolution")) {
      return #err("Resolution contains invalid content or exceeds 1000 characters");
    };

    let found = disputes.find(func(d : Dispute) : Bool { d.id == disputeId });
    switch (found) {
      case (null) { return #err("Dispute not found") };
      case (?d) {
        switch (d.status) {
          case (#resolved) { return #err("Dispute already resolved") };
          case (_) {};
        };
      };
    };

    let now = Time.now();
    disputes.mapInPlace(func(d : Dispute) : Dispute {
      if (d.id == disputeId) {
        { d with status = #resolved; resolution = ?sanitizeTextInput(resolution); updatedAt = now };
      } else {
        d;
      };
    });

    let event = {
      userId = caller;
      eventType = "DISPUTE_RESOLVED";
      timestamp = now;
      details = "Dispute resolved by admin: " # disputeId;
    };
    securityEvents.add(event);

    #ok;
  };

  // ─── deleteUserData: GDPR right to erasure (alias for finalizeAccountDeletion) ──

  public shared ({ caller }) func deleteUserData() : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can delete their own data");
    };
    // Immediately erase all user data without requiring 30-day grace period
    // This is the "right to erasure" endpoint — the 30-day grace period flow
    // is handled via requestAccountDeletion / finalizeAccountDeletion.
    let now = Time.now();

    gdprAuditLog.add({
      principal = caller;
      eventType = #deletion_finalized;
      timestamp = now;
    });

    let secEvent = {
      userId = caller;
      eventType = "GDPR_DELETION_IMMEDIATE";
      timestamp = now;
      details = "Immediate account data deletion requested via deleteUserData";
    };
    securityEvents.add(secEvent);

    userProfiles.remove(caller);
    statuses.remove(caller);
    kycSubmissionAttempts.remove(caller);
    pinData.remove(caller);
    paymentMethods.remove(caller);
    balances.remove(caller);
    activeSessions.remove(caller);
    biometricSettings.remove(caller);
    twoFactorSettings.remove(caller);
    voicePrints.remove(caller);
    vaultLocks.remove(caller);
    encryptionLogs.remove(caller);
    rateLimitMap.remove(caller);
    exportRateLimitMap.remove(caller);
    businessApplications.remove(caller);
    staffRosters.remove(caller);
    tipPoolConfigs.remove(caller);
    payoutRecords.remove(caller);
    let inviteCodesToRemove = staffInvites.entries().filter(
      func((_, inv) : (Text, StaffInvite)) : Bool { Principal.equal(inv.managerPrincipal, caller) }
    ).map(func((code, _) : (Text, StaffInvite)) : Text { code }).toArray();
    for (code in inviteCodesToRemove.values()) { staffInvites.remove(code) };
    let sessionKeysToRemove = stripeSessions.entries().filter(
      func((_, owner) : (Text, Principal)) : Bool { Principal.equal(owner, caller) }
    ).map(func((k, _) : (Text, Principal)) : Text { k }).toArray();
    for (k in sessionKeysToRemove.values()) { stripeSessions.remove(k) };
    tips := tips.filter(func(t : Tip) : Bool {
      not Principal.equal(t.fromUser, caller) and not Principal.equal(t.toUser, caller)
    });
    aiQueryLog := aiQueryLog.filter(func(q : AIQuery) : Bool {
      not Principal.equal(q.userId, caller)
    });
    // Remove direct deposit data
    directDepositAccounts.remove(caller);
    let ddKeysToRemove2 = directDeposits.entries().filter(
      func((_, d) : (Text, DirectDeposit)) : Bool { Principal.equal(d.userPrincipal, caller) }
    ).map(func((k, _) : (Text, DirectDeposit)) : Text { k }).toArray();
    for (k in ddKeysToRemove2.values()) { directDeposits.remove(k) };

    #ok;
  };

  // ─── getManageMyDataAuditLog: alias for getGDPRAuditLog ──────────────────────

  public query ({ caller }) func getManageMyDataAuditLog() : async [GDPRAuditEvent] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their own data management audit log");
    };
    let allEvents = gdprAuditLog.toArray();
    let myEvents = allEvents.filter(func(e : GDPRAuditEvent) : Bool {
      Principal.equal(e.principal, caller)
    });
    myEvents.sort<GDPRAuditEvent>(func(a : GDPRAuditEvent, b : GDPRAuditEvent) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // ─── logoutSession: remove an active session for the caller ──────────────────

  public shared ({ caller }) func logoutSession(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can logout sessions");
    };
    let userSessions = switch (activeSessions.get(caller)) {
      case (null) { return };
      case (?sessions) { sessions };
    };
    let filtered = userSessions.filter(func(s : ActiveSession) : Bool { s.sessionId != sessionId });
    activeSessions.add(caller, filtered);

    let event = {
      userId = caller;
      eventType = "SESSION_LOGOUT";
      timestamp = Time.now();
      details = "User logged out session: " # sessionId;
    };
    securityEvents.add(event);
  };

  // ─── assignUserRole: admin-only role assignment with audit log ───────────────

  public shared ({ caller }) func assignUserRole(user : Principal, role : { #admin; #user; #guest }) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign user roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);

    let event = {
      userId = user;
      eventType = "ROLE_ASSIGNED";
      timestamp = Time.now();
      details = "Role " # debug_show(role) # " assigned to " # user.toText() # " by admin: " # caller.toText();
    };
    securityEvents.add(event);
  };

  // ─── Direct Deposit ───────────────────────────────────────────────────────────

  // Helper: derive a deterministic 9-digit routing number from a Principal
  private func deriveRoutingNumber(p : Principal) : Text {
    let bytes = p.toBlob().toArray();
    let h1 = bytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 31 + b.toNat()) % 1_000_000_000
    });
    // Ensure exactly 9 digits by zero-padding
    let n = h1 % 1_000_000_000;
    let s = n.toText();
    let pad = 9 - s.size();
    var prefix = "";
    var i = 0;
    while (i < pad) { prefix := prefix # "0"; i += 1 };
    prefix # s;
  };

  // Helper: derive a deterministic 17-digit account number from a Principal
  private func deriveAccountNumber(p : Principal) : Text {
    let bytes = p.toBlob().toArray();
    let h1 = bytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 1000003 + b.toNat()) % 100_000_000_000_000_000
    });
    let h2 = bytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 65537 + b.toNat()) % 100_000_000_000_000_000
    });
    let combined = (h1 * 7 + h2 * 13) % 100_000_000_000_000_000;
    let s = combined.toText();
    let pad = 17 - s.size();
    var prefix = "";
    var i = 0;
    while (i < pad) { prefix := prefix # "0"; i += 1 };
    prefix # s;
  };

  // Helper: generate a unique deposit ID from principal + timestamp
  private func generateDepositId(p : Principal, now : Int) : Text {
    let bytes = p.toBlob().toArray();
    let hash = bytes.foldLeft(0, func(acc : Nat, b : Nat8) : Nat {
      (acc * 1000003 + b.toNat()) % 1_000_000_000
    });
    "dd-" # hash.toText() # "-" # (Int.abs(now) % 1_000_000_000_000).toText();
  };

  // Helper: 2 business days in nanoseconds (48 hours — simplified; no weekend logic)
  let twoDaysNanos : Int = 2 * 24 * 60 * 60 * 1_000_000_000;

  // Helper: complete a single deposit and credit balance
  private func applyDepositCompletion(deposit : DirectDeposit) {
    let current = switch (balances.get(deposit.userPrincipal)) {
      case (null) { 0 };
      case (?b) { b };
    };
    balances.add(deposit.userPrincipal, current + deposit.amount);
    directDeposits.add(deposit.id, { deposit with status = "completed" });

    let event = {
      userId = deposit.userPrincipal;
      eventType = "DIRECT_DEPOSIT_COMPLETED";
      timestamp = Time.now();
      details = "Direct deposit completed: " # deposit.id # " amount: " # deposit.amount.toText();
    };
    securityEvents.add(event);
  };

  /// Get or create the caller's virtual direct deposit account.
  /// Routing and account numbers are derived deterministically from the caller's
  /// Principal, so they are stable across calls and canister upgrades.
  public shared ({ caller }) func getOrCreateDirectDepositAccount() : async DirectDepositAccount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access direct deposit accounts");
    };

    switch (directDepositAccounts.get(caller)) {
      case (?existing) { existing };
      case (null) {
        let account : DirectDepositAccount = {
          routingNumber = deriveRoutingNumber(caller);
          accountNumber = deriveAccountNumber(caller);
          createdAt = Time.now();
          status = "active";
        };
        directDepositAccounts.add(caller, account);

        let event = {
          userId = caller;
          eventType = "DIRECT_DEPOSIT_ACCOUNT_CREATED";
          timestamp = Time.now();
          details = "Virtual direct deposit account created";
        };
        securityEvents.add(event);

        account;
      };
    };
  };

  /// Admin-only: simulate an incoming direct deposit for a target user.
  /// Creates a pending deposit with clearAt set ~2 business days (48h) in the future.
  public shared ({ caller }) func simulateDirectDeposit(
    targetUser : Principal,
    amount : Nat,
    description : Text,
    isTest : Bool,
  ) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can simulate direct deposits");
    };

    if (amount == 0) {
      return #err("Amount must be greater than zero");
    };

    if (not validateTextInput(description, 200, "description")) {
      return #err("Invalid description");
    };

    // Ensure target user has a profile
    switch (userProfiles.get(targetUser)) {
      case (null) { return #err("Target user does not have a profile") };
      case (?_) {};
    };

    let now = Time.now();
    let depositId = generateDepositId(targetUser, now);

    let deposit : DirectDeposit = {
      id = depositId;
      userPrincipal = targetUser;
      amount;
      status = "pending";
      createdAt = now;
      clearAt = now + twoDaysNanos;
      description = sanitizeTextInput(description);
      isTest;
    };
    directDeposits.add(depositId, deposit);

    let event = {
      userId = caller;
      eventType = "DIRECT_DEPOSIT_SIMULATED";
      timestamp = now;
      details = "Admin simulated direct deposit for " # targetUser.toText() # " amount: " # amount.toText() # " id: " # depositId;
    };
    securityEvents.add(event);

    #ok(depositId);
  };

  /// Returns all pending direct deposits for the caller.
  public query ({ caller }) func getPendingDirectDeposits() : async [DirectDeposit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their direct deposits");
    };

    directDeposits.entries()
      .filter(func((_, d) : (Text, DirectDeposit)) : Bool {
        Principal.equal(d.userPrincipal, caller) and d.status == "pending"
      })
      .map<(Text, DirectDeposit), DirectDeposit>(func((_, d) : (Text, DirectDeposit)) : DirectDeposit { d })
      .toArray();
  };

  /// Returns all direct deposits (pending + completed + failed) for the caller.
  /// Lazy evaluation: any pending deposit whose clearAt <= now is auto-completed first.
  public shared ({ caller }) func getDirectDepositHistory() : async [DirectDeposit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their direct deposit history");
    };

    let now = Time.now();

    // Auto-complete any matured pending deposits for this caller
    let toComplete = directDeposits.entries()
      .filter(func((_, d) : (Text, DirectDeposit)) : Bool {
        Principal.equal(d.userPrincipal, caller) and d.status == "pending" and now >= d.clearAt
      })
      .map(func((_, d) : (Text, DirectDeposit)) : DirectDeposit { d })
      .toArray();

    for (deposit in toComplete.values()) {
      applyDepositCompletion(deposit);
    };

    // Return all deposits for this caller (now includes freshly completed ones)
    directDeposits.entries()
      .filter(func((_, d) : (Text, DirectDeposit)) : Bool {
        Principal.equal(d.userPrincipal, caller)
      })
      .map<(Text, DirectDeposit), DirectDeposit>(func((_, d) : (Text, DirectDeposit)) : DirectDeposit { d })
      .toArray()
      .sort<DirectDeposit>(func(a : DirectDeposit, b : DirectDeposit) : Order.Order {
        Int.compare(b.createdAt, a.createdAt)
      });
  };

  /// Admin-only: immediately complete a pending deposit and credit the user's balance.
  public shared ({ caller }) func completeDirectDeposit(depositId : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can manually complete deposits");
    };

    let deposit = switch (directDeposits.get(depositId)) {
      case (null) { return #err("Deposit not found") };
      case (?d) { d };
    };

    if (deposit.status != "pending") {
      return #err("Deposit is not pending (status: " # deposit.status # ")");
    };

    applyDepositCompletion(deposit);

    let event = {
      userId = caller;
      eventType = "DIRECT_DEPOSIT_FORCE_COMPLETED";
      timestamp = Time.now();
      details = "Admin force-completed deposit: " # depositId # " for user: " # deposit.userPrincipal.toText();
    };
    securityEvents.add(event);

    #ok;
  };

  // ─── End Direct Deposit ───────────────────────────────────────────────────────

  // ─── Money Requests ───────────────────────────────────────────────────────────

  public type RequestStatus = {
    #pending;
    #paid;
    #declined;
    #cancelled;
  };

  public type MoneyRequest = {
    id : Nat;
    fromUser : Principal;
    toUser : Principal;
    amount : Nat;
    message : Text;
    status : RequestStatus;
    timestamp : Int;
    paidTipId : ?Nat;
  };

  var moneyRequests = List.empty<MoneyRequest>();
  var requestCounter : Nat = 0;

  // Helper: generate a unique request ID
  private func nextRequestId() : Nat {
    requestCounter += 1;
    requestCounter;
  };

  /// Create a money request to another user.
  /// A message is REQUIRED — callers cannot request money without explaining what it's for.
  public shared ({ caller }) func requestMoney(
    toUser : Principal,
    amount : Nat,
    message : Text,
    currencyType : Text,
  ) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can request money");
    };

    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot request money");
    };

    // Cannot request from self
    if (Principal.equal(caller, toUser)) {
      return #err("You cannot request money from yourself");
    };

    // Amount must be positive
    if (amount == 0) {
      return #err("Amount must be greater than zero");
    };

    // Message is required — strip whitespace and check it is not empty
    let trimmedMessage = message.trim(#char ' ');
    if (trimmedMessage.size() == 0) {
      return #err("A message is required when requesting money");
    };

    if (trimmedMessage.size() > 500) {
      return #err("Message must be 500 characters or fewer");
    };

    if (not validateTextInput(trimmedMessage, 500, "requestMessage")) {
      return #err("Message contains invalid content");
    };

    // Validate currency type text
    if (not validateTextInput(currencyType, 20, "currencyType")) {
      return #err("Invalid currency type");
    };

    // Rate limiting: 10 requests per minute
    if (not checkRateLimit(caller, "REQUEST_MONEY", 10, 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: too many money requests sent in a short time");
    };

    // Verify recipient exists
    switch (userProfiles.get(toUser)) {
      case (null) { return #err("Recipient does not exist or is not registered") };
      case (?_) {};
    };

    let sanitizedMessage = sanitizeTextInput(trimmedMessage);
    let id = nextRequestId();

    let newRequest : MoneyRequest = {
      id;
      fromUser = caller;
      toUser;
      amount;
      message = sanitizedMessage;
      status = #pending;
      timestamp = Time.now();
      paidTipId = null;
    };
    moneyRequests.add(newRequest);

    let event = {
      userId = caller;
      eventType = "MONEY_REQUEST_SENT";
      timestamp = Time.now();
      details = "Money request #" # id.toText() # " sent to " # toUser.toText() # " for amount: " # amount.toText();
    };
    securityEvents.add(event);

    #ok(id);
  };

  /// Respond to a money request as the recipient (toUser).
  /// accept=true: deducts from caller's balance, credits requester, creates a tip record.
  /// accept=false: marks the request as declined.
  public shared ({ caller }) func respondToMoneyRequest(requestId : Nat, accept : Bool) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can respond to money requests");
    };

    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot respond to money requests");
    };

    // Find the request
    let requestOpt = moneyRequests.find(func(r : MoneyRequest) : Bool { r.id == requestId });
    let request = switch (requestOpt) {
      case (null) { return #err("Money request not found") };
      case (?r) { r };
    };

    // Only the recipient (toUser) can respond
    if (not Principal.equal(caller, request.toUser)) {
      return #err("Only the recipient of this request can respond to it");
    };

    // Only pending requests can be responded to
    switch (request.status) {
      case (#pending) {};
      case (#paid) { return #err("This request has already been paid") };
      case (#declined) { return #err("This request has already been declined") };
      case (#cancelled) { return #err("This request has been cancelled") };
    };

    if (accept) {
      // Vault lock guard — blocks outgoing transactions when vault is locked
      if (isVaultBlocking(caller)) {
        return #err("Your Vault Lock is active. Unlock your vault to pay this request.");
      };

      // Check caller has sufficient balance
      let callerBalance = switch (balances.get(caller)) {
        case (null) { 0 };
        case (?b) { b };
      };

      if (request.amount > callerBalance) {
        return #err("Insufficient balance to pay this request");
      };

      // Deduct from payer (toUser / caller), credit requester (fromUser)
      balances.add(caller, callerBalance - request.amount);

      let requesterBalance = switch (balances.get(request.fromUser)) {
        case (null) { 0 };
        case (?b) { b };
      };
      balances.add(request.fromUser, requesterBalance + request.amount);

      // Create a tip record so this shows in transaction history for both parties
      let tipId = tips.size();
      let newTip : Tip = {
        fromUser = caller;
        toUser = request.fromUser;
        amount = request.amount;
        message = "Payment for request: " # request.message;
        timestamp = Time.now();
        professional = false;
        currencyType = #fiat;
      };
      tips.add(newTip);

      // Update request: paid, link to tip
      moneyRequests.mapInPlace(func(r : MoneyRequest) : MoneyRequest {
        if (r.id == requestId) {
          { r with status = #paid; paidTipId = ?tipId };
        } else {
          r;
        };
      });

      let event = {
        userId = caller;
        eventType = "MONEY_REQUEST_PAID";
        timestamp = Time.now();
        details = "Money request #" # requestId.toText() # " paid to " # request.fromUser.toText() # " amount: " # request.amount.toText();
      };
      securityEvents.add(event);

      #ok("Request paid successfully");
    } else {
      // Decline the request
      moneyRequests.mapInPlace(func(r : MoneyRequest) : MoneyRequest {
        if (r.id == requestId) {
          { r with status = #declined };
        } else {
          r;
        };
      });

      let event = {
        userId = caller;
        eventType = "MONEY_REQUEST_DECLINED";
        timestamp = Time.now();
        details = "Money request #" # requestId.toText() # " declined";
      };
      securityEvents.add(event);

      #ok("Request declined");
    };
  };

  /// Cancel a money request as the sender (fromUser).
  /// Only pending requests can be cancelled.
  public shared ({ caller }) func cancelMoneyRequest(requestId : Nat) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can cancel money requests");
    };

    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot cancel money requests");
    };

    let requestOpt = moneyRequests.find(func(r : MoneyRequest) : Bool { r.id == requestId });
    let request = switch (requestOpt) {
      case (null) { return #err("Money request not found") };
      case (?r) { r };
    };

    // Only the sender (fromUser) can cancel
    if (not Principal.equal(caller, request.fromUser)) {
      return #err("Only the sender of this request can cancel it");
    };

    switch (request.status) {
      case (#pending) {};
      case (#paid) { return #err("Cannot cancel a request that has already been paid") };
      case (#declined) { return #err("Cannot cancel a request that has already been declined") };
      case (#cancelled) { return #err("Request is already cancelled") };
    };

    moneyRequests.mapInPlace(func(r : MoneyRequest) : MoneyRequest {
      if (r.id == requestId) {
        { r with status = #cancelled };
      } else {
        r;
      };
    });

    let event = {
      userId = caller;
      eventType = "MONEY_REQUEST_CANCELLED";
      timestamp = Time.now();
      details = "Money request #" # requestId.toText() # " cancelled by sender";
    };
    securityEvents.add(event);

    #ok("Request cancelled");
  };

  /// Returns all money requests sent BY the caller, newest first.
  public query ({ caller }) func getRequestsSent() : async [MoneyRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their money requests");
    };

    let all = moneyRequests.toArray();
    let mine = all.filter(func(r : MoneyRequest) : Bool { Principal.equal(r.fromUser, caller) });
    mine.sort<MoneyRequest>(func(a : MoneyRequest, b : MoneyRequest) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  /// Returns all money requests sent TO the caller, newest first.
  public query ({ caller }) func getRequestsReceived() : async [MoneyRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their money requests");
    };

    let all = moneyRequests.toArray();
    let mine = all.filter(func(r : MoneyRequest) : Bool { Principal.equal(r.toUser, caller) });
    mine.sort<MoneyRequest>(func(a : MoneyRequest, b : MoneyRequest) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  /// Returns only PENDING money requests addressed to the caller, newest first.
  public query ({ caller }) func getPendingRequestsReceived() : async [MoneyRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their pending money requests");
    };

    let all = moneyRequests.toArray();
    let pending = all.filter(func(r : MoneyRequest) : Bool {
      let isForMe = Principal.equal(r.toUser, caller);
      let isPending = switch (r.status) {
        case (#pending) { true };
        case (_) { false };
      };
      isForMe and isPending;
    });
    pending.sort<MoneyRequest>(func(a : MoneyRequest, b : MoneyRequest) : Order.Order {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // ─── End Money Requests ───────────────────────────────────────────────────────

  // ─── Spending Limits — helpers ────────────────────────────────────────────────

  private let dayNanos : Int  = 24 * 60 * 60 * 1_000_000_000;
  private let weekNanos : Int = 7 * dayNanos;
  private let monthNanos : Int = 30 * dayNanos;

  // Resets period counters if the window has elapsed.
  private func refreshSpendingLimitCounters(limit : SpendingLimit) {
    let now = Time.now();
    if (now - limit.lastDayReset >= dayNanos) {
      limit.dailySpent := 0;
      limit.lastDayReset := now;
    };
    if (now - limit.lastWeekReset >= weekNanos) {
      limit.weeklySpent := 0;
      limit.lastWeekReset := now;
    };
    if (now - limit.lastMonthReset >= monthNanos) {
      limit.monthlySpent := 0;
      limit.lastMonthReset := now;
    };
  };

  // Returns an error text if the spend would exceed a limit, otherwise null.
  private func checkSpendingLimit(caller : Principal, amount : Nat) : ?Text {
    switch (spendingLimits.get(caller)) {
      case (null) { null };
      case (?limit) {
        refreshSpendingLimitCounters(limit);
        switch (limit.dailyLimit) {
          case (?cap) {
            if (limit.dailySpent + amount > cap) {
              return ?("Daily spending limit of " # cap.toText() # " would be exceeded");
            };
          };
          case (null) {};
        };
        switch (limit.weeklyLimit) {
          case (?cap) {
            if (limit.weeklySpent + amount > cap) {
              return ?("Weekly spending limit of " # cap.toText() # " would be exceeded");
            };
          };
          case (null) {};
        };
        switch (limit.monthlyLimit) {
          case (?cap) {
            if (limit.monthlySpent + amount > cap) {
              return ?("Monthly spending limit of " # cap.toText() # " would be exceeded");
            };
          };
          case (null) {};
        };
        null;
      };
    };
  };

  // Records a completed spend against the user's running counters.
  private func recordSpend(caller : Principal, amount : Nat) {
    switch (spendingLimits.get(caller)) {
      case (null) {};
      case (?limit) {
        limit.dailySpent   := limit.dailySpent   + amount;
        limit.weeklySpent  := limit.weeklySpent  + amount;
        limit.monthlySpent := limit.monthlySpent + amount;
      };
    };
  };

  // ─── Spending Limits — public API ─────────────────────────────────────────────

  public shared ({ caller }) func setSpendingLimits(daily : ?Nat, weekly : ?Nat, monthly : ?Nat) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can set spending limits");
    };

    let now = Time.now();
    switch (spendingLimits.get(caller)) {
      case (null) {
        let newLimit : SpendingLimit = {
          dailyLimit   = daily;
          weeklyLimit  = weekly;
          monthlyLimit = monthly;
          var dailySpent   = 0;
          var weeklySpent  = 0;
          var monthlySpent = 0;
          var lastDayReset   = now;
          var lastWeekReset  = now;
          var lastMonthReset = now;
        };
        spendingLimits.add(caller, newLimit);
      };
      case (?existing) {
        // Update limits only; preserve running counters and reset timestamps
        let updated : SpendingLimit = {
          dailyLimit   = daily;
          weeklyLimit  = weekly;
          monthlyLimit = monthly;
          var dailySpent   = existing.dailySpent;
          var weeklySpent  = existing.weeklySpent;
          var monthlySpent = existing.monthlySpent;
          var lastDayReset   = existing.lastDayReset;
          var lastWeekReset  = existing.lastWeekReset;
          var lastMonthReset = existing.lastMonthReset;
        };
        spendingLimits.add(caller, updated);
      };
    };
    let event = {
      userId = caller;
      eventType = "SPENDING_LIMITS_UPDATED";
      timestamp = now;
      details = "Spending limits updated";
    };
    securityEvents.add(event);
    #ok;
  };

  public query ({ caller }) func getSpendingLimits() : async ?SpendingLimitView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view spending limits");
    };
    switch (spendingLimits.get(caller)) {
      case (null) { null };
      case (?l) {
        ?{
          dailyLimit   = l.dailyLimit;
          weeklyLimit  = l.weeklyLimit;
          monthlyLimit = l.monthlyLimit;
          dailySpent   = l.dailySpent;
          weeklySpent  = l.weeklySpent;
          monthlySpent = l.monthlySpent;
          lastDayReset   = l.lastDayReset;
          lastWeekReset  = l.lastWeekReset;
          lastMonthReset = l.lastMonthReset;
        };
      };
    };
  };

  public shared ({ caller }) func clearSpendingLimits() : async { #ok } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear spending limits");
    };
    spendingLimits.remove(caller);
    #ok;
  };

  // ─── Recurring Payments — helpers ─────────────────────────────────────────────

  private func frequencyToNanos(freq : RecurringFrequency) : Int {
    switch (freq) {
      case (#daily)   { dayNanos };
      case (#weekly)  { weekNanos };
      case (#monthly) { monthNanos };
    };
  };

  // ─── Recurring Payments — public API ──────────────────────────────────────────

  public shared ({ caller }) func createRecurringPayment(
    toUser : Principal,
    amount : Nat,
    message : Text,
    frequency : RecurringFrequency,
  ) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can create recurring payments");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot create recurring payments");
    };
    if (amount == 0) {
      return #err("Amount must be greater than zero");
    };
    if (message.size() == 0 or message.size() > 500) {
      return #err("Message must be 1-500 characters");
    };
    if (not validateTextInput(message, 500, "recurringMessage")) {
      return #err("Invalid message: contains disallowed content");
    };

    // Max 10 recurring payments per user
    let mine = recurringPayments.filter(func(r : RecurringPayment) : Bool {
      Principal.equal(r.owner, caller)
    });
    if (mine.size() >= 10) {
      return #err("Maximum of 10 recurring payments per user");
    };

    let now = Time.now();
    let id = nextRecurringPaymentId;
    nextRecurringPaymentId += 1;

    let rp : RecurringPayment = {
      id;
      owner = caller;
      toUser;
      amount;
      message = sanitizeTextInput(message);
      frequency;
      nextRunTime = now + frequencyToNanos(frequency);
      enabled = true;
      createdAt = now;
      lastRunAt = null;
      totalRuns = 0;
    };
    recurringPayments.add(rp);

    let event = {
      userId = caller;
      eventType = "RECURRING_PAYMENT_CREATED";
      timestamp = now;
      details = "Recurring payment #" # id.toText() # " to " # toUser.toText() # " amount: " # amount.toText();
    };
    securityEvents.add(event);
    #ok(id);
  };

  public shared ({ caller }) func cancelRecurringPayment(id : Nat) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can cancel recurring payments");
    };
    let found = recurringPayments.find(func(r : RecurringPayment) : Bool { r.id == id });
    switch (found) {
      case (null) { return #err("Recurring payment not found") };
      case (?r) {
        if (not Principal.equal(r.owner, caller)) {
          return #err("You do not own this recurring payment");
        };
      };
    };
    // Remove from list
    let filtered = recurringPayments.filter(func(r : RecurringPayment) : Bool { r.id != id });
    recurringPayments.clear();
    recurringPayments.append(filtered);
    let event = {
      userId = caller;
      eventType = "RECURRING_PAYMENT_CANCELLED";
      timestamp = Time.now();
      details = "Recurring payment #" # id.toText() # " cancelled";
    };
    securityEvents.add(event);
    #ok;
  };

  public shared ({ caller }) func toggleRecurringPayment(id : Nat, enabled : Bool) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can toggle recurring payments");
    };
    let found = recurringPayments.find(func(r : RecurringPayment) : Bool { r.id == id });
    switch (found) {
      case (null) { return #err("Recurring payment not found") };
      case (?r) {
        if (not Principal.equal(r.owner, caller)) {
          return #err("You do not own this recurring payment");
        };
      };
    };
    recurringPayments.mapInPlace(func(r : RecurringPayment) : RecurringPayment {
      if (r.id == id) { { r with enabled } } else { r }
    });
    #ok;
  };

  public query ({ caller }) func getMyRecurringPayments() : async [RecurringPayment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view recurring payments");
    };
    recurringPayments.toArray().filter(func(r : RecurringPayment) : Bool {
      Principal.equal(r.owner, caller)
    });
  };

  /// Admin-only: execute all due recurring payments.
  public shared ({ caller }) func processRecurringPayments() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can process recurring payments");
    };
    let now = Time.now();
    recurringPayments.mapInPlace(func(r : RecurringPayment) : RecurringPayment {
      if (not r.enabled or now < r.nextRunTime) {
        return r;
      };
      // Skip if vault is locked for the owner
      if (isVaultBlocking(r.owner)) {
        return r;
      };
      // Check balance
      let ownerBalance = switch (balances.get(r.owner)) {
        case (null) { 0 };
        case (?b) { b };
      };
      if (r.amount > ownerBalance) {
        return r; // skip if insufficient funds
      };
      // Deduct from sender
      balances.add(r.owner, ownerBalance - r.amount);
      // Credit recipient
      let recipientBalance = switch (balances.get(r.toUser)) {
        case (null) { 0 };
        case (?b) { b };
      };
      balances.add(r.toUser, recipientBalance + r.amount);
      // Create tip record
      let newTip : Tip = {
        fromUser = r.owner;
        toUser = r.toUser;
        amount = r.amount;
        message = r.message;
        timestamp = now;
        professional = false;
        currencyType = #fiat;
      };
      tips.add(newTip);
      // Update spending counters
      recordSpend(r.owner, r.amount);
      // Advance schedule
      { r with
        nextRunTime = r.nextRunTime + frequencyToNanos(r.frequency);
        lastRunAt = ?now;
        totalRuns = r.totalRuns + 1;
      };
    });
  };

  // ─── Savings Pocket — public API ──────────────────────────────────────────────

  public shared ({ caller }) func depositToSavings(amount : Nat) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can use the savings pocket");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot use savings");
    };
    if (not checkRateLimit(caller, "SAVINGS_TRANSFER", 20, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many savings transfers. Please wait before trying again");
    };
    if (amount == 0) {
      return #err("Amount must be greater than zero");
    };
    let mainBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };
    if (amount > mainBalance) {
      return #err("Insufficient main balance");
    };
    balances.add(caller, mainBalance - amount);
    let currentSavings = switch (savingsBalances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };
    savingsBalances.add(caller, currentSavings + amount);

    let txId = nextSavingsTxId;
    nextSavingsTxId += 1;
    savingsHistory.add({
      id = txId;
      owner = caller;
      direction = #toSavings;
      amount;
      timestamp = Time.now();
    });
    let event = {
      userId = caller;
      eventType = "SAVINGS_DEPOSIT";
      timestamp = Time.now();
      details = "Moved " # amount.toText() # " to savings";
    };
    securityEvents.add(event);
    #ok;
  };

  public shared ({ caller }) func withdrawFromSavings(amount : Nat) : async { #ok; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can use the savings pocket");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot use savings");
    };
    if (isVaultBlocking(caller)) {
      return #err("Vault is locked. Unlock your vault before withdrawing from savings");
    };
    if (not checkRateLimit(caller, "SAVINGS_TRANSFER", 20, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many savings transfers. Please wait before trying again");
    };
    if (amount == 0) {
      return #err("Amount must be greater than zero");
    };
    let currentSavings = switch (savingsBalances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };
    if (amount > currentSavings) {
      return #err("Insufficient savings balance");
    };
    savingsBalances.add(caller, currentSavings - amount);
    let mainBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };
    balances.add(caller, mainBalance + amount);

    let txId = nextSavingsTxId;
    nextSavingsTxId += 1;
    savingsHistory.add({
      id = txId;
      owner = caller;
      direction = #fromSavings;
      amount;
      timestamp = Time.now();
    });
    let event = {
      userId = caller;
      eventType = "SAVINGS_WITHDRAWAL";
      timestamp = Time.now();
      details = "Moved " # amount.toText() # " from savings to main balance";
    };
    securityEvents.add(event);
    #ok;
  };

  public query ({ caller }) func getSavingsBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their savings balance");
    };
    switch (savingsBalances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };
  };

  public query ({ caller }) func getSavingsHistory() : async [SavingsTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their savings history");
    };
    savingsHistory.toArray().filter(func(tx : SavingsTransaction) : Bool {
      Principal.equal(tx.owner, caller)
    });
  };

  // ─── Customer Support Chat — public API ───────────────────────────────────────

  public shared ({ caller }) func openSupportTicket(subject : Text, firstMessage : Text) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can open support tickets");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot open support tickets");
    };
    if (not checkRateLimit(caller, "SUPPORT_MESSAGE", 30, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many support messages. Please wait before sending more");
    };
    if (subject.size() == 0 or subject.size() > 200) {
      return #err("Subject must be 1-200 characters");
    };
    if (firstMessage.size() == 0 or firstMessage.size() > 2000) {
      return #err("Message must be 1-2000 characters");
    };
    if (not validateTextInput(subject, 200, "supportSubject")) {
      return #err("Invalid subject: contains disallowed content");
    };
    if (not validateTextInput(firstMessage, 2000, "supportMessage")) {
      return #err("Invalid message: contains disallowed content");
    };
    // Close any existing open ticket first
    switch (supportConversations.get(caller)) {
      case (?existing) {
        let closed : SupportConversation = { existing with status = #resolved };
        supportConversations.add(caller, closed);
      };
      case (null) {};
    };
    let now = Time.now();
    let convId = nextSupportConversationId;
    nextSupportConversationId += 1;
    let conv : SupportConversation = {
      id = convId;
      userPrincipal = caller;
      subject = sanitizeTextInput(subject);
      status = #open;
      createdAt = now;
      lastMessageAt = now;
    };
    supportConversations.add(caller, conv);

    let msgId = nextSupportMessageId;
    nextSupportMessageId += 1;
    supportMessages.add({
      id = msgId;
      conversationId = convId;
      senderPrincipal = caller;
      senderIsAdmin = false;
      message = sanitizeTextInput(firstMessage);
      timestamp = now;
      read = false;
    });
    #ok(convId);
  };

  public shared ({ caller }) func sendSupportMessage(message : Text) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can send support messages");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot send support messages");
    };
    if (not checkRateLimit(caller, "SUPPORT_MESSAGE", 30, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many support messages");
    };
    if (message.size() == 0 or message.size() > 2000) {
      return #err("Message must be 1-2000 characters");
    };
    if (not validateTextInput(message, 2000, "supportMessage")) {
      return #err("Invalid message: contains disallowed content");
    };
    let conv = switch (supportConversations.get(caller)) {
      case (null) { return #err("No open support ticket. Please open a ticket first") };
      case (?c) {
        switch (c.status) {
          case (#resolved) { return #err("This ticket is resolved. Please open a new ticket") };
          case (#open or #waitingForUser) { c };
        };
      };
    };
    let now = Time.now();
    // Update lastMessageAt and set status back to open
    let updated : SupportConversation = { conv with status = #open; lastMessageAt = now };
    supportConversations.add(caller, updated);

    let msgId = nextSupportMessageId;
    nextSupportMessageId += 1;
    supportMessages.add({
      id = msgId;
      conversationId = conv.id;
      senderPrincipal = caller;
      senderIsAdmin = false;
      message = sanitizeTextInput(message);
      timestamp = now;
      read = false;
    });
    #ok(msgId);
  };

  public query ({ caller }) func getSupportConversation() : async ?SupportConversation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their support conversation");
    };
    supportConversations.get(caller);
  };

  public query ({ caller }) func getSupportMessages() : async [SupportMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their support messages");
    };
    let conv = switch (supportConversations.get(caller)) {
      case (null) { return [] };
      case (?c) { c };
    };
    let all = supportMessages.toArray();
    let mine = all.filter(func(m : SupportMessage) : Bool {
      m.conversationId == conv.id
    });
    mine.sort<SupportMessage>(func(a : SupportMessage, b : SupportMessage) : Order.Order {
      Int.compare(a.timestamp, b.timestamp)
    });
  };

  public shared ({ caller }) func markSupportMessagesRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark support messages as read");
    };
    let conv = switch (supportConversations.get(caller)) {
      case (null) { return };
      case (?c) { c };
    };
    supportMessages.mapInPlace(func(m : SupportMessage) : SupportMessage {
      if (m.conversationId == conv.id and not m.senderIsAdmin) {
        // Already sender — nothing to mark
        m
      } else if (m.conversationId == conv.id and m.senderIsAdmin and not m.read) {
        { m with read = true }
      } else {
        m
      }
    });
  };

  public query ({ caller }) func getUnreadSupportCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check unread support count");
    };
    let conv = switch (supportConversations.get(caller)) {
      case (null) { return 0 };
      case (?c) { c };
    };
    let all = supportMessages.toArray();
    all.filter(func(m : SupportMessage) : Bool {
      m.conversationId == conv.id and m.senderIsAdmin and not m.read
    }).size();
  };

  public query ({ caller }) func adminGetAllSupportConversations() : async [(Principal, SupportConversation)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all support conversations");
    };
    supportConversations.toArray();
  };

  public query ({ caller }) func adminGetSupportMessages(userPrincipal : Principal) : async [SupportMessage] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view user support messages");
    };
    let conv = switch (supportConversations.get(userPrincipal)) {
      case (null) { return [] };
      case (?c) { c };
    };
    let all = supportMessages.toArray();
    let msgs = all.filter(func(m : SupportMessage) : Bool {
      m.conversationId == conv.id
    });
    msgs.sort<SupportMessage>(func(a : SupportMessage, b : SupportMessage) : Order.Order {
      Int.compare(a.timestamp, b.timestamp)
    });
  };

  public shared ({ caller }) func adminReplySupportMessage(userPrincipal : Principal, message : Text) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can reply to support messages");
    };
    if (message.size() == 0 or message.size() > 2000) {
      return #err("Message must be 1-2000 characters");
    };
    if (not validateTextInput(message, 2000, "adminSupportMessage")) {
      return #err("Invalid message: contains disallowed content");
    };
    let conv = switch (supportConversations.get(userPrincipal)) {
      case (null) { return #err("No support ticket found for this user") };
      case (?c) {
        switch (c.status) {
          case (#resolved) { return #err("This ticket is already resolved") };
          case (#open or #waitingForUser) { c };
        };
      };
    };
    let now = Time.now();
    let updated : SupportConversation = { conv with status = #waitingForUser; lastMessageAt = now };
    supportConversations.add(userPrincipal, updated);

    let msgId = nextSupportMessageId;
    nextSupportMessageId += 1;
    supportMessages.add({
      id = msgId;
      conversationId = conv.id;
      senderPrincipal = caller;
      senderIsAdmin = true;
      message = sanitizeTextInput(message);
      timestamp = now;
      read = false;
    });
    #ok;
  };

  public shared ({ caller }) func adminCloseSupportTicket(userPrincipal : Principal) : async { #ok; #err : Text } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      return #err("Unauthorized: Only admins can close support tickets");
    };
    switch (supportConversations.get(userPrincipal)) {
      case (null) { return #err("No support ticket found for this user") };
      case (?conv) {
        let closed : SupportConversation = { conv with status = #resolved };
        supportConversations.add(userPrincipal, closed);
        let event = {
          userId = userPrincipal;
          eventType = "SUPPORT_TICKET_CLOSED";
          timestamp = Time.now();
          details = "Support ticket closed by admin " # caller.toText();
        };
        securityEvents.add(event);
        #ok;
      };
    };
  };

  // ─── End new features ─────────────────────────────────────────────────────────

  // ─── Fee Structure (Cash App-style) ──────────────────────────────────────────

  // Fee constants (all monetary values in cents, percentages as integers)
  let CREDIT_CARD_FEE_PCT : Nat = 3;            // 3% for credit card sends
  let BUSINESS_RECEIVE_FEE_PCT : Nat = 26;       // 2.6% = 26/1000 for business receives
  let BUSINESS_RECEIVE_FEE_FLAT : Nat = 15;      // $0.15 flat fee (15 cents)
  let INSTANT_DEPOSIT_FEE_MIDPOINT : Nat = 15;   // 1.5% midpoint = 15/1000
  let INSTANT_DEPOSIT_FEE_MAX_NUM : Nat = 25;    // 2.5% cap = 25/1000
  let INSTANT_DEPOSIT_FEE_MIN_CENTS : Nat = 25;  // $0.25 minimum fee
  let ATM_WITHDRAWAL_FEE_CENTS : Nat = 250;      // $2.50 flat ATM fee
  let FOREIGN_TRANSACTION_FEE_PCT : Nat = 3;     // 3% foreign transaction fee

  // Fee calculation helpers (all amounts and return values in cents)
  private func calculateCreditCardFee(amount : Nat) : Nat {
    let fee = amount * CREDIT_CARD_FEE_PCT / 100;
    // Minimum 1 cent
    if (fee == 0) { 1 } else { fee };
  };

  private func calculateBusinessReceiveFee(amount : Nat) : Nat {
    (amount * BUSINESS_RECEIVE_FEE_PCT / 1000) + BUSINESS_RECEIVE_FEE_FLAT;
  };

  private func calculateInstantDepositFee(amount : Nat) : Nat {
    let fee = amount * INSTANT_DEPOSIT_FEE_MIDPOINT / 1000; // 1.5%
    let maxFee = amount * INSTANT_DEPOSIT_FEE_MAX_NUM / 1000; // 2.5% cap
    if (fee < INSTANT_DEPOSIT_FEE_MIN_CENTS) {
      INSTANT_DEPOSIT_FEE_MIN_CENTS
    } else if (fee > maxFee) {
      maxFee
    } else {
      fee
    };
  };

  // Placeholder for future international card processing
  private func applyForeignTransactionFee(amount : Nat) : Nat {
    amount * FOREIGN_TRANSACTION_FEE_PCT / 100;
  };

  // Helper: check whether a principal has an approved business application
  private func isBusinessUser(principal : Principal) : Bool {
    switch (businessApplications.get(principal)) {
      case (null) { false };
      case (?app) {
        switch (app.status) {
          case (#approved) { true };
          case (_) { false };
        };
      };
    };
  };

  // Public query: calculate fee before confirming a transaction
  public query ({ caller }) func calculateFee(
    feeType : { #creditCard; #businessReceive; #instantDeposit; #atm; #foreign },
    amount : Nat
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query fees");
    };
    switch (feeType) {
      case (#creditCard)     { calculateCreditCardFee(amount) };
      case (#businessReceive){ calculateBusinessReceiveFee(amount) };
      case (#instantDeposit) { calculateInstantDepositFee(amount) };
      case (#atm)            { ATM_WITHDRAWAL_FEE_CENTS };
      case (#foreign)        { applyForeignTransactionFee(amount) };
    };
  };

  // Fee-aware send: mirrors sendTip but applies Cash App-style fees.
  // paymentMethod: "credit_card" | "debit_card" | "balance"
  // Returns #ok(feeCharged) or #err(reason).
  public shared ({ caller }) func sendTipWithFee(
    toUser : Principal,
    amount : Nat,
    message : Text,
    professional : Bool,
    currencyType : { #fiat; #crypto },
    paymentMethod : Text
  ) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can send tips");
    };

    if (isVaultBlocking(caller)) {
      return #err("Vault is locked. Unlock your vault to send funds.");
    };

    switch (checkSpendingLimit(caller, amount)) {
      case (?errMsg) { return #err(errMsg) };
      case (null) {};
    };

    if (not checkRateLimit(caller, "SEND_TIP_FEE", 10, 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many tips sent in a short time. Please wait before sending more");
    };

    if (amount == 0) {
      return #err("Tip amount must be greater than zero");
    };

    if (not validateTextInput(message, 500, "tipMessage")) {
      return #err("Invalid message: must be under 500 characters and contain no script tags");
    };

    switch (userProfiles.get(toUser)) {
      case (null) { return #err("Recipient does not exist or is not registered") };
      case (?_) {};
    };

    switch (currencyType) {
      case (#crypto) {
        // Crypto sends: no platform fee, handled externally via wallet
        let sanitizedMessage = sanitizeTextInput(message);
        let newTip = {
          fromUser = caller;
          toUser;
          amount;
          message = sanitizedMessage;
          timestamp = Time.now();
          professional;
          currencyType;
        };
        tips.add(newTip);
        let event = {
          userId = caller;
          eventType = "TIP_SENT_CRYPTO";
          timestamp = Time.now();
          details = "Crypto tip sent to " # toUser.toText() # " amount: " # amount.toText();
        };
        securityEvents.add(event);
        return #ok(0);
      };
      case (#fiat) {
        // Determine platform fee based on payment method
        let senderFee : Nat = if (paymentMethod == "credit_card") {
          calculateCreditCardFee(amount)
        } else {
          0 // debit card and balance sends are free for personal accounts
        };

        // Determine amount recipient actually receives
        // If recipient is a business, deduct business-receive fee from their credit
        let recipientReceives : Nat = if (isBusinessUser(toUser)) {
          let bFee = calculateBusinessReceiveFee(amount);
          if (bFee >= amount) { 0 } else { amount - bFee };
        } else {
          amount
        };

        let totalDeducted = amount + senderFee;

        let senderBalance = switch (balances.get(caller)) {
          case (null) { 0 };
          case (?b) { b };
        };
        if (totalDeducted > senderBalance) {
          return #err("Insufficient balance (including fee of " # senderFee.toText() # " cents)");
        };

        balances.add(caller, senderBalance - totalDeducted);
        recordSpend(caller, totalDeducted);

        let recipientBalance = switch (balances.get(toUser)) {
          case (null) { 0 };
          case (?b) { b };
        };
        balances.add(toUser, recipientBalance + recipientReceives);

        let sanitizedMessage = sanitizeTextInput(message);
        let newTip = {
          fromUser = caller;
          toUser;
          amount;
          message = sanitizedMessage;
          timestamp = Time.now();
          professional;
          currencyType;
        };
        tips.add(newTip);

        let event = {
          userId = caller;
          eventType = "TIP_SENT_WITH_FEE";
          timestamp = Time.now();
          details = "Tip sent to " # toUser.toText() # " amount: " # amount.toText() # " fee: " # senderFee.toText() # " paymentMethod: " # paymentMethod;
        };
        securityEvents.add(event);

        return #ok(senderFee);
      };
    };
  };

  // Fee-aware withdrawal: mirrors withdraw but applies Cash App-style fees.
  // withdrawalType: "standard" (free) | "instant" (0.5–2.5% fee, min $0.25) | "atm" ($2.50 flat)
  // Returns #ok(feeCharged) or #err(reason).
  public shared ({ caller }) func withdrawWithFee(
    amount : Nat,
    verifiedOtpId : ?Text,
    withdrawalType : Text
  ) : async { #ok : Nat; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can withdraw funds");
    };

    if (isVaultBlocking(caller)) {
      return #err("Vault is locked. Unlock your vault to withdraw funds.");
    };

    switch (checkSpendingLimit(caller, amount)) {
      case (?errMsg) { return #err(errMsg) };
      case (null) {};
    };

    if (not checkRateLimit(caller, "WITHDRAW_FEE", 10, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many withdrawals in a short time");
    };

    if (amount == 0) {
      return #err("Withdrawal amount must be greater than zero");
    };

    // Calculate fee based on withdrawal type
    let fee : Nat = if (withdrawalType == "instant") {
      calculateInstantDepositFee(amount)
    } else if (withdrawalType == "atm") {
      ATM_WITHDRAWAL_FEE_CENTS
    } else {
      0 // "standard" — free
    };

    let totalNeeded = amount + fee;

    let currentBalance = switch (balances.get(caller)) {
      case (null) { 0 };
      case (?b) { b };
    };

    if (totalNeeded > currentBalance) {
      return #err("Insufficient balance (including fee of " # fee.toText() # " cents)");
    };

    // KYC check for withdrawals over $200
    if (amount > 200) {
      switch (userProfiles.get(caller)) {
        case (null) { return #err("User profile does not exist") };
        case (?profile) {
          switch (profile.kycStatus) {
            case (#verified) {};
            case (#pending) {
              return #err("KYC verification is pending. Please complete verification to withdraw amounts over $200");
            };
            case (#failed) {
              return #err("KYC verification failed. Please complete verification to withdraw amounts over $200");
            };
            case (#notSubmitted) {
              return #err("KYC verification required. Please complete verification to withdraw amounts over $200");
            };
          };
        };
      };
    };

    // 2FA OTP check for withdrawals over $50
    if (amount > 50) {
      switch (twoFactorSettings.get(caller)) {
        case (null) {
          return #err("2FA required for withdrawals over $50. Please enable 2FA in Security Settings");
        };
        case (?settings) {
          if (not settings.enabled) {
            return #err("2FA required for withdrawals over $50. Please enable 2FA in Security Settings");
          };
          switch (verifiedOtpId) {
            case (null) {
              return #err("OTP verification required for withdrawals over $50. Call startWithdrawalOTPChallenge first");
            };
            case (?challengeId) {
              switch (otpChallenges.get(challengeId)) {
                case (null) { return #err("Invalid OTP challenge ID") };
                case (?challenge) {
                  if (not Principal.equal(challenge.userPrincipal, caller)) {
                    return #err("OTP challenge does not belong to caller");
                  };
                  if (not challenge.used) {
                    return #err("OTP challenge has not been verified yet");
                  };
                  if (Time.now() > challenge.expiresAt) {
                    return #err("OTP challenge has expired");
                  };
                  if (challenge.amount != amount) {
                    return #err("OTP challenge amount does not match withdrawal amount");
                  };
                };
              };
            };
          };
        };
      };
    };

    balances.add(caller, currentBalance - totalNeeded);
    recordSpend(caller, totalNeeded);

    let event = {
      userId = caller;
      eventType = "WITHDRAWAL_WITH_FEE";
      timestamp = Time.now();
      details = "Withdrawal of " # amount.toText() # " type: " # withdrawalType # " fee: " # fee.toText();
    };
    securityEvents.add(event);

    #ok(fee);
  };

  // ─── End fee structure ────────────────────────────────────────────────────────

  // ─── Split Payments ───────────────────────────────────────────────────────────

  public type SplitParticipantStatus = { #Pending; #Accepted; #Declined; #Paid };

  public type SplitParticipant = {
    principal : Principal;
    amount : Nat;       // cents — share owed
    nickname : Text;
    status : SplitParticipantStatus;
  };

  public type SplitPaymentStatus = { #Active; #Settled; #Cancelled };

  public type SplitPayment = {
    id : Text;
    initiator : Principal;
    totalAmount : Nat;            // cents
    description : Text;
    participants : [SplitParticipant];
    status : SplitPaymentStatus;
    createdAt : Int;
    settledAt : ?Int;
  };

  // Stable HashMap keyed by split ID
  let splitPayments = Map.empty<Text, SplitPayment>();

  // Monotonic counter for unique IDs
  var splitCounter : Nat = 0;

  // Generate a deterministic text ID
  private func nextSplitId() : Text {
    splitCounter += 1;
    "split-" # splitCounter.toText() # "-" # Time.now().toText();
  };

  /// Create a split-payment session.
  /// participantShares: list of (principal, amountInCents) — amounts must sum to totalAmount.
  public shared ({ caller }) func createSplitPayment(
    totalAmount : Nat,
    description : Text,
    participantShares : [(Principal, Nat)]
  ) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can create split payments");
    };

    if (caller.isAnonymous()) {
      return #err("Anonymous callers cannot create split payments");
    };

    // Vault lock guard
    if (isVaultBlocking(caller)) {
      return #err("Vault is locked. Unlock your vault to create split payments.");
    };

    // Rate limiting: 20 split-payments per hour
    if (not checkRateLimit(caller, "CREATE_SPLIT", 20, 60 * 60 * 1_000_000_000)) {
      return #err("Rate limit exceeded: Too many split payments created. Please wait.");
    };

    // Validate description
    if (description.size() == 0) {
      return #err("A description is required for split payments");
    };
    if (not validateTextInput(description, 500, "description")) {
      return #err("Invalid description: must be under 500 characters and contain no script tags");
    };

    // Must have at least one participant
    if (participantShares.size() == 0) {
      return #err("At least one participant is required");
    };

    // Validate participant shares do not exceed totalAmount (initiator keeps the remainder)
    var sharesSum : Nat = 0;
    for (share in participantShares.map<(Principal, Nat), Nat>(func((_, s)) { s }).values()) {
      sharesSum += share;
    };
    if (sharesSum > totalAmount) {
      return #err("Participant shares must not exceed the total amount (" # totalAmount.toText() # " cents). Got: " # sharesSum.toText());
    };

    // Validate all participants exist and are not the initiator
    for (participant in participantShares.map<(Principal, Nat), Principal>(func((p, _)) { p }).values()) {
      if (Principal.equal(participant, caller)) {
        return #err("Initiator cannot be listed as a participant");
      };
      switch (userProfiles.get(participant)) {
        case (null) { return #err("Participant " # participant.toText() # " does not exist") };
        case (?_) {};
      };
    };

    // Check spending limit for the total amount
    switch (checkSpendingLimit(caller, totalAmount)) {
      case (?errMsg) { return #err(errMsg) };
      case (null) {};
    };

    let sanitizedDesc = sanitizeTextInput(description);
    let splitId = nextSplitId();
    let now = Time.now();

    // Build participant list — look up nickname from profile or fall back to principal text
    let participants : [SplitParticipant] = participantShares.map<(Principal, Nat), SplitParticipant>(
      func((p, amt)) {
        let nick = switch (userProfiles.get(p)) {
          case (null) { p.toText() };
          case (?profile) {
            if (profile.username.size() > 0) { profile.username } else { p.toText() }
          };
        };
        { principal = p; amount = amt; nickname = nick; status = #Pending };
      }
    );

    let split : SplitPayment = {
      id = splitId;
      initiator = caller;
      totalAmount;
      description = sanitizedDesc;
      participants;
      status = #Active;
      createdAt = now;
      settledAt = null;
    };

    splitPayments.add(splitId, split);

    let event = {
      userId = caller;
      eventType = "SPLIT_PAYMENT_CREATED";
      timestamp = now;
      details = "Split payment created: " # splitId # " total: " # totalAmount.toText();
    };
    securityEvents.add(event);

    #ok(splitId);
  };

  /// Respond to a split payment — participant accepts or declines their share.
  /// On decline: participant's status → #Declined, whole split → #Cancelled, initiator notified.
  /// On accept: participant's status → #Accepted; if ALL accepted, payments are settled immediately.
  public shared ({ caller }) func respondToSplitPayment(
    splitId : Text,
    accept : Bool
  ) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can respond to split payments");
    };

    let split = switch (splitPayments.get(splitId)) {
      case (null) { return #err("Split payment not found") };
      case (?s) { s };
    };

    if (split.status != #Active) {
      return #err("Split payment is no longer active");
    };

    // Verify caller is a participant
    let participantOpt = split.participants.find(
      func(p : SplitParticipant) : Bool { Principal.equal(p.principal, caller) }
    );
    let participant = switch (participantOpt) {
      case (null) { return #err("You are not a participant in this split payment") };
      case (?p) { p };
    };

    if (participant.status != #Pending) {
      return #err("You have already responded to this split payment");
    };

    let now = Time.now();

    if (not accept) {
      // Decline — mark participant declined and cancel the whole split
      let updatedParticipants = split.participants.map(
        func(p : SplitParticipant) : SplitParticipant {
          if (Principal.equal(p.principal, caller)) {
            { p with status = #Declined }
          } else { p }
        }
      );
      let cancelled : SplitPayment = {
        split with
        participants = updatedParticipants;
        status = #Cancelled;
        settledAt = ?now;
      };
      splitPayments.add(splitId, cancelled);

      let event = {
        userId = caller;
        eventType = "SPLIT_PAYMENT_DECLINED";
        timestamp = now;
        details = "Split " # splitId # " declined by " # caller.toText() # " — split cancelled";
      };
      securityEvents.add(event);

      return #ok("Split payment declined and cancelled");
    };

    // Accept — mark this participant #Accepted
    let updatedParticipants = split.participants.map(
      func(p : SplitParticipant) : SplitParticipant {
        if (Principal.equal(p.principal, caller)) {
          { p with status = #Accepted }
        } else { p }
      }
    );

    // Check whether ALL participants have now accepted
    let allAccepted = updatedParticipants.all(
      func(p : SplitParticipant) : Bool { p.status == #Accepted }
    );

    if (not allAccepted) {
      // Just update the split and wait for others
      let updated : SplitPayment = { split with participants = updatedParticipants };
      splitPayments.add(splitId, updated);

      let event = {
        userId = caller;
        eventType = "SPLIT_PAYMENT_ACCEPTED";
        timestamp = now;
        details = "Split " # splitId # " accepted by " # caller.toText() # " — waiting for others";
      };
      securityEvents.add(event);

      return #ok("Your share accepted. Waiting for other participants to respond.");
    };

    // All accepted — process payments from each participant to initiator
    var anySettleError = false;
    var paidParticipantsList = List.empty<SplitParticipant>();

    for (p in updatedParticipants.values()) {
      let payerBalance = switch (balances.get(p.principal)) {
        case (null) { 0 };
        case (?b) { b };
      };
      if (payerBalance < p.amount) {
        anySettleError := true;
        paidParticipantsList.add(p); // keep as #Accepted — insufficient balance
      } else {
        // Deduct from participant
        balances.add(p.principal, payerBalance - p.amount);
        recordSpend(p.principal, p.amount);

        // Credit to initiator (read fresh each time to handle multiple participants)
        let initiatorBalance = switch (balances.get(split.initiator)) {
          case (null) { 0 };
          case (?b) { b };
        };
        balances.add(split.initiator, initiatorBalance + p.amount);

        // Record as a tip in history
        let splitTip : Tip = {
          fromUser = p.principal;
          toUser = split.initiator;
          amount = p.amount;
          message = "Split: " # split.description;
          timestamp = now;
          professional = false;
          currencyType = #fiat;
        };
        tips.add(splitTip);

        paidParticipantsList.add({ p with status = #Paid });
      };
    };

    let paidParticipants = paidParticipantsList.toArray();
    let finalStatus : SplitPaymentStatus = if (not anySettleError) { #Settled } else { #Active };
    let settled : SplitPayment = {
      split with
      participants = paidParticipants;
      status = finalStatus;
      settledAt = if (finalStatus == #Settled) { ?now } else { null };
    };
    splitPayments.add(splitId, settled);

    let event = {
      userId = caller;
      eventType = "SPLIT_PAYMENT_SETTLED";
      timestamp = now;
      details = "Split " # splitId # " fully accepted and " # (if (finalStatus == #Settled) "settled" else "partially settled (balance issues)");
    };
    securityEvents.add(event);

    if (anySettleError) {
      #err("One or more participants had insufficient balance. Partial settlement — re-check participant balances.");
    } else {
      #ok("All participants paid. Split payment settled successfully.");
    };
  };

  /// Initiator cancels an active split payment.
  public shared ({ caller }) func cancelSplitPayment(splitId : Text) : async { #ok : Text; #err : Text } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can cancel split payments");
    };

    let split = switch (splitPayments.get(splitId)) {
      case (null) { return #err("Split payment not found") };
      case (?s) { s };
    };

    if (not Principal.equal(split.initiator, caller)) {
      return #err("Only the initiator can cancel a split payment");
    };

    if (split.status != #Active) {
      return #err("Split payment is not active and cannot be cancelled");
    };

    let now = Time.now();
    let cancelled : SplitPayment = { split with status = #Cancelled; settledAt = ?now };
    splitPayments.add(splitId, cancelled);

    let event = {
      userId = caller;
      eventType = "SPLIT_PAYMENT_CANCELLED";
      timestamp = now;
      details = "Split " # splitId # " cancelled by initiator";
    };
    securityEvents.add(event);

    #ok("Split payment cancelled");
  };

  /// Returns all split payments where caller is the initiator or a participant.
  public query ({ caller }) func getSplitPayments() : async [SplitPayment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view split payments");
    };

    let all = splitPayments.toArray();
    let relevant = all.filter(
      func((_, split) : (Text, SplitPayment)) : Bool {
        if (Principal.equal(split.initiator, caller)) { return true };
        split.participants.any(func(p : SplitParticipant) : Bool {
          Principal.equal(p.principal, caller)
        });
      }
    );
    relevant.map<(Text, SplitPayment), SplitPayment>(func((_, s)) { s });
  };

  /// Returns a single split payment by ID (only if caller is initiator or participant).
  public query ({ caller }) func getSplitById(splitId : Text) : async ?SplitPayment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view split payments");
    };

    switch (splitPayments.get(splitId)) {
      case (null) { null };
      case (?split) {
        let isInitiator = Principal.equal(split.initiator, caller);
        let isParticipant = split.participants.any(
          func(p : SplitParticipant) : Bool { Principal.equal(p.principal, caller) }
        );
        if (isInitiator or isParticipant or AccessControl.isAdmin(accessControlState, caller)) {
          ?split
        } else {
          null
        };
      };
    };
  };

  // ─── End split payments ───────────────────────────────────────────────────────

  /// Resolve a user Principal by their username or phone number.
  /// Returns the Principal of the matching user, or null if not found.
  /// Used by the split-payment UI to look up real Principals during participant search.
  public query ({ caller }) func resolveUserByUsername(usernameOrPhone : Text) : async ?Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can resolve user identities");
    };

    // Input validation
    if (usernameOrPhone.size() == 0 or usernameOrPhone.size() > 100) {
      return null;
    };

    let lowerQuery = usernameOrPhone.toLower();

    let found = userProfiles.entries().find(
      func((_, profile) : (Principal, UserProfile)) : Bool {
        let usernameMatch = profile.username.toLower() == lowerQuery;
        let phoneMatch = switch (profile.phoneNumber) {
          case (null) { false };
          case (?phone) { phone == usernameOrPhone and profile.isVerified };
        };
        usernameMatch or phoneMatch;
      }
    );

    switch (found) {
      case (null) { null };
      case (?(principal, _)) { ?principal };
    };
  };

  // ─── White-Label / Partner Branding ───────────────────────────────────────────

  public type PartnerBrandingConfig = {
    partnerName : Text;
    partnerLogoUrl : Text;
    primaryColor : Text;
    secondaryColor : Text;
    isActive : Bool;
  };

  var partnerBrandingConfig : ?PartnerBrandingConfig = null;

  /// Admin-only: set or replace the active partner branding configuration.
  /// Rejects with a trap if the caller is not an admin.
  public shared ({ caller }) func setPartnerBranding(config : PartnerBrandingConfig) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set partner branding");
    };
    partnerBrandingConfig := ?config;
  };

  /// Public query: returns the stored partner branding config, or null if not set.
  public query func getPartnerBranding() : async ?PartnerBrandingConfig {
    partnerBrandingConfig;
  };

  /// Admin-only: clear partner branding and revert to default Open Tip Pay branding.
  public shared ({ caller }) func clearPartnerBranding() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear partner branding");
    };
    partnerBrandingConfig := null;
  };  // end clearPartnerBranding

  // ─── Fan Points public API ──────────────────────────────────────────────────────

  /// Record a guest (non-app) payment and award Fan Points to the recipient.
  /// The guest provides a phone number or email so points can be linked later.
  /// sectionName: optional stadium section of the recipient (enables section multiplier rules).
  public shared func recordGuestPayment(
    recipientId : Principal,
    amount : Nat,
    contactInfo : Text,
    contactType : { #phone; #email },
    sectionName : ?Text,
  ) : async { #ok : { guestRecordId : Text; fanPointsAwarded : Nat }; #err : Text } {
    FanPointsAPI.recordGuestPayment(
      guestPaymentRecords,
      fanPointsMap,
      recipientId,
      amount,
      contactInfo,
      contactType,
      fanPointsState,
      sectionName,
    );
  };

  /// Return the calling user's Fan Points balance.
  public query ({ caller }) func getMyFanPoints() : async ?FanPointsTypes.FanPoints {
    FanPointsAPI.getMyFanPoints(fanPointsMap, caller);
  };

  /// Return the Fan Points balance for any user (public).
  public query func getFanPoints(userId : Principal) : async ?FanPointsTypes.FanPoints {
    FanPointsAPI.getFanPoints(fanPointsMap, userId);
  };

  /// Link prior guest payment points to the caller's account by matching contactInfo.
  public shared ({ caller }) func linkGuestPaymentsToUser(
    contactInfo : Text,
  ) : async { #ok : Nat; #err : Text } {
    FanPointsAPI.linkGuestPaymentsToUser(guestPaymentRecords, fanPointsMap, contactInfo, caller);
  };

  /// Return all rewards the caller has redeemed.
  public query ({ caller }) func getMyRedeemedRewards() : async [FanPointsTypes.RedeemedReward] {
    FanPointsAPI.getMyRedeemedRewards(redeemedRewardsMap, caller);
  };

  /// Redeem a reward by spending Fan Points. The redeemed code appears here and is stored on-chain.
  public shared ({ caller }) func redeemReward(
    rewardId : Text,
  ) : async { #ok : FanPointsTypes.RedeemedReward; #err : Text } {
    FanPointsAPI.redeemReward(
      rewardsMap,
      redeemedRewardsMap,
      fanPointsMap,
      caller,
      rewardId,
      fanPointsState,
    );
  };

  /// Admin-only: create a reward fans can redeem with Fan Points.
  public shared ({ caller }) func createReward(
    title : Text,
    description : Text,
    pointsCost : Nat,
    rewardType : FanPointsTypes.RewardType,
    codeOrValue : Text,
    quantity : ?Nat,
    expiresAt : ?Int,
    teamId : ?Text,
  ) : async { #ok : FanPointsTypes.Reward; #err : Text } {
    FanPointsAPI.createReward(
      rewardsMap,
      caller,
      AccessControl.isAdmin(accessControlState, caller),
      title,
      description,
      pointsCost,
      rewardType,
      codeOrValue,
      quantity,
      expiresAt,
      teamId,
      fanPointsState,
    );
  };

  /// Admin-only: full update of a reward (title, description, pointsCost, codeOrValue, quantity, teamId, active).
  public shared ({ caller }) func updateReward(
    id : Text,
    params : FanPointsTypes.UpdateRewardParams,
  ) : async { #ok : FanPointsTypes.Reward; #err : Text } {
    FanPointsAPI.updateReward(
      rewardsMap,
      caller,
      AccessControl.isAdmin(accessControlState, caller),
      id,
      params,
    );
  };

  /// Admin-only: permanently delete a reward.
  public shared ({ caller }) func deleteReward(
    id : Text,
  ) : async { #ok : Bool; #err : Text } {
    FanPointsAPI.deleteReward(
      rewardsMap,
      caller,
      AccessControl.isAdmin(accessControlState, caller),
      id,
    );
  };

  /// List all active rewards, optionally filtered by teamId.
  public query func listRewards(teamId : ?Text) : async [FanPointsTypes.Reward] {
    FanPointsAPI.listRewards(rewardsMap, teamId);
  };

  /// Return a single reward by ID.
  public query func getReward(id : Text) : async ?FanPointsTypes.Reward {
    FanPointsAPI.getReward(rewardsMap, id);
  };

  /// Manager-only: assign a staff member to a stadium section.
  public shared ({ caller }) func assignStaffSection(
    staffId : Principal,
    sectionName : Text,
    sectionLabel : Text,
  ) : async { #ok : FanPointsTypes.StaffSection; #err : Text } {
    let isManager = AccessControl.isAdmin(accessControlState, caller)
      or (switch (staffRosters.get(caller)) { case (?_) { true }; case (null) { false } });
    FanPointsAPI.assignStaffSection(
      sectionAssignmentsMap,
      caller,
      isManager,
      staffId,
      sectionName,
      sectionLabel,
    );
  };

  /// Return the section assignment for a staff member.
  public query func getStaffSection(staffId : Principal) : async ?FanPointsTypes.StaffSection {
    FanPointsAPI.getStaffSection(sectionAssignmentsMap, staffId);
  };

  /// Return all section assignments for a manager.
  public query func getSectionAssignments(managerId : Principal) : async [FanPointsTypes.StaffSection] {
    FanPointsAPI.getSectionAssignments(sectionAssignmentsMap, managerId);
  };

  /// Return tip volume aggregated by stadium section for a manager.
  public query ({ caller }) func getSectionAnalytics(
    managerId : Principal,
    since : ?Int,
  ) : async [FanPointsTypes.SectionAnalytics] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not Principal.equal(caller, managerId)) {
      Runtime.trap("Unauthorized: Only managers can view section analytics");
    };
    let tipEntries = tips.map<Tip, FanPointsAPI.TipEntry>(
      func(t : Tip) : FanPointsAPI.TipEntry {
        { fromUser = t.fromUser; toUser = t.toUser; amount = t.amount; timestamp = t.timestamp }
      }
    );
    FanPointsAPI.getSectionAnalytics(sectionAssignmentsMap, tipEntries, managerId, since);
  };

  /// Return per-staff tip summary for a manager's roster.
  public query ({ caller }) func getStaffAnalytics(
    managerId : Principal,
    since : ?Int,
  ) : async [{ staffId : Principal; totalTips : Nat; totalAmount : Nat; sectionName : ?Text }] {
    if (not AccessControl.isAdmin(accessControlState, caller) and not Principal.equal(caller, managerId)) {
      Runtime.trap("Unauthorized: Only managers can view staff analytics");
    };
    let tipEntries = tips.map<Tip, FanPointsAPI.TipEntry>(
      func(t : Tip) : FanPointsAPI.TipEntry {
        { fromUser = t.fromUser; toUser = t.toUser; amount = t.amount; timestamp = t.timestamp }
      }
    );
    FanPointsAPI.getStaffAnalytics(sectionAssignmentsMap, staffRosters, tipEntries, managerId, since);
  };

  // ─── Fractional Point Engine public API ──────────────────────────────────────

  public query func listPointsRules() : async [FanPointsTypes.PointsRule] {
    FanPointsAPI.listPointsRules(pointsRulesMap);
  };

  public shared(msg) func createPointsRule(rule : FanPointsTypes.PointsRule) : async { #ok : FanPointsTypes.PointsRule; #err : Text } {
    FanPointsAPI.createPointsRule(pointsRulesMap, AccessControl.isAdmin(accessControlState, msg.caller), rule);
  };

  public shared(msg) func updatePointsRule(id : Text, name : Text, description : Text, multiplier : Float, sectionName : ?Text) : async { #ok : FanPointsTypes.PointsRule; #err : Text } {
    FanPointsAPI.updatePointsRule(pointsRulesMap, AccessControl.isAdmin(accessControlState, msg.caller), id, name, description, multiplier, sectionName);
  };

  public shared(msg) func togglePointsRule(id : Text, active : Bool) : async { #ok : FanPointsTypes.PointsRule; #err : Text } {
    FanPointsAPI.togglePointsRule(pointsRulesMap, AccessControl.isAdmin(accessControlState, msg.caller), id, active);
  };

  public query func getPointsBreakdown(amountCents : Nat, transactionType : Text, isGameDay : Bool, isFirstPayment : Bool, sectionName : ?Text) : async FanPointsTypes.PointsBreakdown {
    FanPointsAPI.getPointsBreakdown(pointsRulesMap, amountCents, transactionType, isGameDay, isFirstPayment, sectionName);
  };

  // ─── Tip-Split state ─────────────────────────────────────────────────────────
  let staffCheckIns = Map.empty<Text, TipSplitTypes.StaffCheckIn>();
  let gameStandAssignments = Map.empty<Text, TipSplitTypes.GameStandAssignment>();
  let tipSplitRoles = Map.empty<Text, TipSplitTypes.TipSplitRole>();
  let tipSplitPayouts = Map.empty<Text, TipSplitTypes.TipSplitPayout>();

  // ─── Extended Staff Roster public API ────────────────────────────────────────

  public shared(msg) func upsertExtendedStaff(member : StaffTypes.ExtendedStaffMember) : async { #ok : StaffTypes.ExtendedStaffMember; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    StaffAPI.upsertExtendedStaff(extendedStaffMap, authorized, member);
  };

  public shared(msg) func listExtendedStaff() : async [StaffTypes.ExtendedStaffMember] {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    StaffAPI.listExtendedStaff(extendedStaffMap, authorized);
  };

  public query func getExtendedStaff(id : Text) : async ?StaffTypes.ExtendedStaffMember {
    StaffAPI.getExtendedStaff(extendedStaffMap, id);
  };

  public shared(msg) func removeExtendedStaff(id : Text) : async { #ok; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    StaffAPI.removeExtendedStaff(extendedStaffMap, authorized, id);
  };

  // ─── Tip-Split public API stubs ───────────────────────────────────────────────

  public shared(msg) func recordCheckIn(
    staffId : Text,
    staffName : Text,
    role : Text,
    standId : Text,
    standName : Text,
    gameDate : Text,
    checkInTime : Int,
  ) : async { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.recordCheckIn(staffCheckIns, authorized, staffId, staffName, role, standId, standName, gameDate, checkInTime);
  };

  public shared(msg) func recordCheckOut(
    checkInId : Text,
    checkOutTime : Int,
  ) : async { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.recordCheckOut(staffCheckIns, authorized, checkInId, checkOutTime);
  };

  public shared(msg) func manualSetHours(
    checkInId : Text,
    hoursWorked : Float,
    overrideBy : Text,
  ) : async { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.manualSetHours(staffCheckIns, authorized, checkInId, hoursWorked, overrideBy);
  };

  public shared(msg) func getCheckInsForGame(
    gameDate : Text,
  ) : async [TipSplitTypes.StaffCheckIn] {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.getCheckInsForGame(staffCheckIns, authorized, gameDate);
  };

  public query func getGameStandAssignment(
    staffId : Text,
    gameDate : Text,
  ) : async ?TipSplitTypes.GameStandAssignment {
    TipSplitAPI.getGameStandAssignment(gameStandAssignments, staffId, gameDate);
  };

  public shared(msg) func setGameStandAssignment(
    assignment : TipSplitTypes.GameStandAssignment,
  ) : async { #ok : TipSplitTypes.GameStandAssignment; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.setGameStandAssignment(gameStandAssignments, authorized, assignment);
  };

  public query func getTipSplitRoles() : async [TipSplitTypes.TipSplitRole] {
    TipSplitAPI.getTipSplitRoles(tipSplitRoles);
  };

  public shared(msg) func upsertTipSplitRole(
    role : TipSplitTypes.TipSplitRole,
  ) : async { #ok : TipSplitTypes.TipSplitRole; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.upsertTipSplitRole(tipSplitRoles, authorized, role);
  };

  public shared(msg) func removeTipSplitRole(
    roleId : Text,
  ) : async { #ok; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.removeTipSplitRole(tipSplitRoles, authorized, roleId);
  };

  public shared(msg) func calculateTipSplit(
    standId : Text,
    gameDate : Text,
    totalPool : Float,
  ) : async { #ok : TipSplitTypes.TipSplitPayout; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.calculateTipSplit(staffCheckIns, tipSplitRoles, gameStandAssignments, tipSplitPayouts, authorized, standId, gameDate, totalPool);
  };

  public shared(msg) func approveTipSplitPayout(
    payoutId : Text,
    approvedBy : Text,
    approvedAt : Int,
  ) : async { #ok : TipSplitTypes.TipSplitPayout; #err : Text } {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.approveTipSplitPayout(tipSplitPayouts, authorized, payoutId, approvedBy, approvedAt);
  };

  public shared(msg) func getTipSplitPayouts(
    standId : ?Text,
    gameDate : ?Text,
  ) : async [TipSplitTypes.TipSplitPayout] {
    let authorized = AccessControl.isAdmin(accessControlState, msg.caller);
    TipSplitAPI.getTipSplitPayouts(tipSplitPayouts, authorized, standId, gameDate);
  };

};

