import Debug "mo:core/Debug";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/fanpoints";
import Int "mo:core/Int";
import Float "mo:core/Float";

module {
  /// Compute how many Fan Points to award for a given cent amount.
  /// 1 Fan Point per 10 cents (i.e. $1 = 10 points).
  public func pointsForAmount(amount : Nat) : Nat {
    (amount / 100) * 10;
  };

  /// Generate a unique ID string using a counter seed.
  public func generateId(prefix : Text, seed : Nat) : Text {
    let t = Int.abs(Time.now()) % 1_000_000_000;
    prefix # "-" # seed.toText() # "-" # t.toText();
  };

  /// Find a FanPoints record for a given principal, or return null.
  public func getFanPoints(
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    userId : Principal,
  ) : ?Types.FanPoints {
    fanPointsMap.get(userId);
  };

  /// Upsert Fan Points — add `delta` earned points to the user's record.
  public func awardPoints(
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    userId : Principal,
    delta : Nat,
    guestContact : ?Text,
  ) : Types.FanPoints {
    let existing : Types.FanPoints = switch (fanPointsMap.get(userId)) {
      case (?fp) { fp };
      case (null) { { userId; points = 0; totalEarned = 0; totalRedeemed = 0; guestContact = null } };
    };
    let deltaF = delta.toFloat();
    let updated : Types.FanPoints = {
      existing with
      points = existing.points + deltaF;
      totalEarned = existing.totalEarned + deltaF;
      guestContact = switch (existing.guestContact) {
        case (?c) { ?c };
        case (null) { guestContact };
      };
    };
    fanPointsMap.add(userId, updated);
    updated;
  };

  /// Deduct `cost` points when redeeming a reward. Returns the updated record
  /// or an error Text if points are insufficient.
  public func deductPoints(
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    userId : Principal,
    cost : Nat,
  ) : { #ok : Types.FanPoints; #err : Text } {
    let existing : Types.FanPoints = switch (fanPointsMap.get(userId)) {
      case (?fp) { fp };
      case (null) { { userId; points = 0; totalEarned = 0; totalRedeemed = 0; guestContact = null } };
    };
    let costF = cost.toFloat();
    if (existing.points < costF) {
      return #err("Insufficient Fan Points: have " # existing.points.toText() # ", need " # cost.toText());
    };
    let updated : Types.FanPoints = {
      existing with
      points = existing.points - costF;
      totalRedeemed = existing.totalRedeemed + costF;
    };
    fanPointsMap.add(userId, updated);
    #ok(updated);
  };

  /// Link all guest payment records whose contactInfo matches to the given user,
  /// award any unlinked points, and return the total points credited.
  public func linkGuestPayments(
    guestRecords : List.List<Types.GuestPaymentRecord>,
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    contactInfo : Text,
    newUserId : Principal,
  ) : Nat {
    var totalPoints : Nat = 0;
    guestRecords.mapInPlace(
      func(rec : Types.GuestPaymentRecord) : Types.GuestPaymentRecord {
        if (not rec.converted and rec.contactInfo == contactInfo) {
          totalPoints += rec.fanPointsAwarded;
          { rec with converted = true; convertedUserId = ?newUserId };
        } else {
          rec;
        };
      }
    );
    if (totalPoints > 0) {
      ignore awardPoints(fanPointsMap, newUserId, totalPoints, ?contactInfo);
    };
    totalPoints;
  };

  /// Validate that a Reward is still claimable (active, not expired, has stock).
  public func validateRewardClaimable(reward : Types.Reward) : { #ok; #err : Text } {
    if (not reward.active) {
      return #err("Reward is not active");
    };
    switch (reward.expiresAt) {
      case (?exp) {
        if (Time.now() > exp) {
          return #err("Reward has expired");
        };
      };
      case (null) {};
    };
    switch (reward.quantityRemaining) {
      case (?qty) {
        if (qty == 0) {
          return #err("Reward is out of stock");
        };
      };
      case (null) {};
    };
    #ok;
  };

  /// Decrement the quantityRemaining of a reward by 1, or leave unchanged if unlimited.
  public func consumeRewardStock(reward : Types.Reward) : Types.Reward {
    switch (reward.quantityRemaining) {
      case (?qty) {
        { reward with quantityRemaining = ?(if (qty > 0) { qty - 1 } else { 0 }) };
      };
      case (null) { reward };
    };
  };

  /// Build a SectionAnalytics aggregate from the roster, section assignments, and tip list.
  public func buildSectionAnalytics(
    sectionAssignments : Map.Map<Principal, Types.StaffSection>,
    tips : List.List<{ fromUser : Principal; toUser : Principal; amount : Nat; timestamp : Int }>,
    managerId : Principal,
    since : ?Int,
  ) : [Types.SectionAnalytics] {
    let cutoff : Int = switch (since) { case (?ts) { ts }; case (null) { 0 } };
    // Collect sections owned by this manager
    let sectionMap = Map.empty<Text, { var totalTips : Nat; var totalAmount : Nat; var staffCount : Nat; sectionLabel : Text; var topStaffId : ?Principal; var topAmount : Nat }>();
    for ((staffId, sec) in sectionAssignments.entries()) {
      if (Principal.equal(sec.managerId, managerId)) {
        switch (sectionMap.get(sec.sectionName)) {
          case (null) {
            sectionMap.add(sec.sectionName, { var totalTips = 0; var totalAmount = 0; var staffCount = 1; sectionLabel = sec.sectionLabel; var topStaffId : ?Principal = null; var topAmount = 0 });
          };
          case (?entry) {
            entry.staffCount += 1;
          };
        };
      };
    };
    // Aggregate tips
    let tipsArr = tips.toArray();
    for (tip in tipsArr.values()) {
      if (tip.timestamp >= cutoff) {
        switch (sectionAssignments.get(tip.toUser)) {
          case (?sec) {
            if (Principal.equal(sec.managerId, managerId)) {
              switch (sectionMap.get(sec.sectionName)) {
                case (?entry) {
                  entry.totalTips += 1;
                  entry.totalAmount += tip.amount;
                  if (tip.amount > entry.topAmount) {
                    entry.topAmount := tip.amount;
                    entry.topStaffId := ?tip.toUser;
                  };
                };
                case (null) {};
              };
            };
          };
          case (null) {};
        };
      };
    };
    // Build result
    let result = List.empty<Types.SectionAnalytics>();
    for ((sectionName, entry) in sectionMap.entries()) {
      result.add({
        sectionName;
        sectionLabel = entry.sectionLabel;
        totalTips = entry.totalTips;
        totalAmount = entry.totalAmount;
        staffCount = entry.staffCount;
        topStaffId = entry.topStaffId;
      });
    };
    result.toArray();
  };

  /// Calculate a full fractional point breakdown for a given transaction
  /// without persisting any state — used for live preview and testing.
  /// Calculate a full fractional point breakdown for a given transaction
  /// without persisting any state — used for live preview and testing.
  /// recipientSection: the stadium section of the tip recipient (if known).
  /// #sectionMultiplier rules only fire when their sectionName matches recipientSection.
  public func calculatePoints(
    amountCents : Nat,
    transactionType : Text,
    isGameDay : Bool,
    isFirstPayment : Bool,
    rules : [Types.PointsRule],
    recipientSection : ?Text,
  ) : Types.PointsBreakdown {
    let basePoints : Float = amountCents.toFloat() / 100.0;
    var multiplier : Float = 1.0;
    var appliedRules : [(Text, Float, ?Text)] = [];
    for (rule in rules.values()) {
      if (rule.isActive) {
        let matches = switch (rule.ruleType) {
          case (#tipMultiplier) { transactionType == "tip" };
          case (#foodMultiplier) { transactionType == "food" };
          case (#paymentMultiplier) { transactionType == "payment" };
          case (#gameDayBonus) { isGameDay };
          case (#firstPaymentBonus) { isFirstPayment };
          case (#sectionMultiplier) {
            // Only applies when recipient's section matches this rule's sectionName
            switch (recipientSection, rule.sectionName) {
              case (?rs, ?rn) { rs == rn };
              case (_, _) { false };
            };
          };
        };
        if (matches) {
          multiplier := multiplier * rule.multiplier;
          appliedRules := appliedRules.concat([(rule.name, rule.multiplier, rule.sectionName)]);
        };
      };
    };
    let finalPoints = basePoints * multiplier;
    {
      basePoints = basePoints;
      appliedRules = appliedRules;
      finalPoints = finalPoints;
      transactionType = transactionType;
      amountCents = amountCents;
    }
  };

  /// Build per-staff analytics for a manager's roster.
  public func buildStaffAnalytics(
    staffIds : [Principal],
    sectionAssignments : Map.Map<Principal, Types.StaffSection>,
    tips : List.List<{ fromUser : Principal; toUser : Principal; amount : Nat; timestamp : Int }>,
    since : ?Int,
  ) : [{ staffId : Principal; totalTips : Nat; totalAmount : Nat; sectionName : ?Text }] {
    let cutoff : Int = switch (since) { case (?ts) { ts }; case (null) { 0 } };
    let tipsArr = tips.toArray();
    staffIds.map<Principal, { staffId : Principal; totalTips : Nat; totalAmount : Nat; sectionName : ?Text }>(
      func(staffId : Principal) : { staffId : Principal; totalTips : Nat; totalAmount : Nat; sectionName : ?Text } {
        var totalTips : Nat = 0;
        var totalAmount : Nat = 0;
        for (tip in tipsArr.values()) {
          if (Principal.equal(tip.toUser, staffId) and tip.timestamp >= cutoff) {
            totalTips += 1;
            totalAmount += tip.amount;
          };
        };
        let sectionName : ?Text = switch (sectionAssignments.get(staffId)) {
          case (?sec) { ?sec.sectionName };
          case (null) { null };
        };
        { staffId; totalTips; totalAmount; sectionName };
      }
    );
  };
};
