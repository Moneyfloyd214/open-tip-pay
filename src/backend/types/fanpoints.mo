module {
  /// Rule type variant — what kind of multiplier this rule applies.
  public type PointsRuleType = {
    #tipMultiplier;
    #foodMultiplier;
    #paymentMultiplier;
    #gameDayBonus;
    #firstPaymentBonus;
    #sectionMultiplier;   // applies only when tip recipient is in a matching section
  };

  /// A configurable points rule driving the fractional point engine.
  public type PointsRule = {
    id : Text;
    name : Text;
    description : Text;
    ruleType : PointsRuleType;
    multiplier : Float;
    isActive : Bool;
    createdAt : Int;
    /// Only populated when ruleType is #sectionMultiplier; null for all other types.
    sectionName : ?Text;
  };

  /// Breakdown of how points were calculated for a single transaction.
  public type PointsBreakdown = {
    basePoints : Float;
    appliedRules : [(Text, Float, ?Text)];   // (rule name, multiplier applied, sectionName if section rule)
    finalPoints : Float;
    transactionType : Text;
    amountCents : Nat;
  };

  /// Tracks a tip or payment made by a non-app (guest) user.
  public type GuestPaymentRecord = {
    id : Text;
    recipientId : Principal;
    amount : Nat;            // in cents
    contactInfo : Text;      // phone number or email entered by guest
    contactType : { #phone; #email };
    fanPointsAwarded : Nat;
    timestamp : Int;
    converted : Bool;        // true once the guest creates an account
    convertedUserId : ?Principal;
  };

  /// Per-user Fan Points balance and lifetime stats.
  /// Points fields use Float to support the fractional point engine.
  public type FanPoints = {
    userId : Principal;
    points : Float;
    totalEarned : Float;
    totalRedeemed : Float;
    guestContact : ?Text;    // populated when earned as a guest before account creation
  };

  /// Reward variant describing what kind of reward this is.
  public type RewardType = {
    #discountCode;
    #ticketEntry;
    #concessionCredit;
    #other;
  };

  /// A reward created by an admin; fans spend Fan Points to claim it.
  public type Reward = {
    id : Text;
    title : Text;
    description : Text;
    pointsCost : Nat;
    rewardType : RewardType;
    codeOrValue : Text;          // actual discount code or entry confirmation
    quantity : ?Nat;             // null = unlimited
    quantityRemaining : ?Nat;
    expiresAt : ?Int;
    active : Bool;
    createdBy : Principal;
    teamId : ?Text;              // e.g. "colts" for white-label partner rewards
  };

  /// Parameters for a full reward update — all fields are optional.
  /// Only non-null fields are applied to the stored Reward.
  public type UpdateRewardParams = {
    active : ?Bool;
    title : ?Text;
    description : ?Text;
    pointsCost : ?Nat;
    codeOrValue : ?Text;
    quantity : ?Nat;
    teamId : ?Text;
  };

  /// Immutable record written when a fan redeems a reward.
  public type RedeemedReward = {
    id : Text;
    userId : Principal;
    rewardId : Text;
    rewardTitle : Text;
    codeOrValue : Text;
    redeemedAt : Int;
    emailSent : Bool;            // always false — email not currently enabled
    contactEmail : ?Text;
  };

  /// Maps a staff member to a specific stadium section.
  public type StaffSection = {
    staffId : Principal;
    managerId : Principal;
    sectionName : Text;          // internal key, e.g. "section_103"
    sectionLabel : Text;         // display name, e.g. "Section 103" or "VIP Lounge"
    assignedAt : Int;
  };

  /// Read-only aggregate analytics for a section.
  public type SectionAnalytics = {
    sectionName : Text;
    sectionLabel : Text;
    totalTips : Nat;
    totalAmount : Nat;
    staffCount : Nat;
    topStaffId : ?Principal;
  };
};
