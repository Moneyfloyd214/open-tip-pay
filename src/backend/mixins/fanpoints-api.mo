import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Types "../types/fanpoints";
import FanPointsLib "../lib/fanpoints";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

/// Plain module providing Fan Points, guest payments, rewards, section assignment,
/// and analytics logic. All state is passed as parameters so this module is
/// stateless and can be called directly from main.mo.
module {

  // Minimal tip record type used for analytics — structural supertype of main.mo's Tip.
  public type TipEntry = {
    fromUser : Principal;
    toUser : Principal;
    amount : Nat;
    timestamp : Int;
  };

  // ─── Fan Points ──────────────────────────────────────────────────────────────

  /// Record a payment made by a guest (non-app user) and award Fan Points.
  /// The guest provides phone or email to enable later account linkage.
  /// Record a payment made by a guest (non-app user) and award Fan Points.
  /// The guest provides phone or email to enable later account linkage.
  /// sectionName: optional stadium section of the recipient (for section multiplier rules).
  public func recordGuestPayment(
    guestPaymentRecords : List.List<Types.GuestPaymentRecord>,
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    recipientId : Principal,
    amount : Nat,
    contactInfo : Text,
    contactType : { #phone; #email },
    nextId : { var nextGuestRecordId : Nat },
    sectionName : ?Text,
  ) : { #ok : { guestRecordId : Text; fanPointsAwarded : Nat }; #err : Text } {
    if (contactInfo == "") {
      return #err("Contact info must not be empty");
    };
    let pts = FanPointsLib.pointsForAmount(amount);
    let id = FanPointsLib.generateId("guest", nextId.nextGuestRecordId);
    nextId.nextGuestRecordId += 1;
    let record : Types.GuestPaymentRecord = {
      id;
      recipientId;
      amount;
      contactInfo;
      contactType;
      fanPointsAwarded = pts;
      timestamp = Time.now();
      converted = false;
      convertedUserId = null;
    };
    guestPaymentRecords.add(record);
    ignore sectionName; // available for future fractional engine wiring
    // Award points to recipient for receiving the payment
    ignore FanPointsLib.awardPoints(fanPointsMap, recipientId, pts, null);
    #ok({ guestRecordId = id; fanPointsAwarded = pts });
  };

  /// Return the Fan Points record for the caller.
  public func getMyFanPoints(
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    caller : Principal,
  ) : ?Types.FanPoints {
    FanPointsLib.getFanPoints(fanPointsMap, caller);
  };

  /// Return the Fan Points record for any user (admin / public).
  public func getFanPoints(
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    userId : Principal,
  ) : ?Types.FanPoints {
    FanPointsLib.getFanPoints(fanPointsMap, userId);
  };

  /// Link any guest payment records whose contactInfo matches to the calling user,
  /// crediting all accumulated points. Returns the number of points credited.
  public func linkGuestPaymentsToUser(
    guestPaymentRecords : List.List<Types.GuestPaymentRecord>,
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    contactInfo : Text,
    caller : Principal,
  ) : { #ok : Nat; #err : Text } {
    if (contactInfo == "") {
      return #err("Contact info must not be empty");
    };
    let credited = FanPointsLib.linkGuestPayments(guestPaymentRecords, fanPointsMap, contactInfo, caller);
    #ok(credited);
  };

  /// Return all rewards the caller has redeemed.
  public func getMyRedeemedRewards(
    redeemedRewardsMap : Map.Map<Principal, List.List<Types.RedeemedReward>>,
    caller : Principal,
  ) : [Types.RedeemedReward] {
    switch (redeemedRewardsMap.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  /// Redeem a reward by spending Fan Points. Returns the RedeemedReward on success.
  public func redeemReward(
    rewardsMap : Map.Map<Text, Types.Reward>,
    redeemedRewardsMap : Map.Map<Principal, List.List<Types.RedeemedReward>>,
    fanPointsMap : Map.Map<Principal, Types.FanPoints>,
    caller : Principal,
    rewardId : Text,
    nextId : { var nextRedeemedId : Nat },
  ) : { #ok : Types.RedeemedReward; #err : Text } {
    let reward = switch (rewardsMap.get(rewardId)) {
      case (null) { return #err("Reward not found") };
      case (?r) { r };
    };
    switch (FanPointsLib.validateRewardClaimable(reward)) {
      case (#err(msg)) { return #err(msg) };
      case (#ok) {};
    };
    switch (FanPointsLib.deductPoints(fanPointsMap, caller, reward.pointsCost)) {
      case (#err(msg)) { return #err(msg) };
      case (#ok(_)) {};
    };
    let updated = FanPointsLib.consumeRewardStock(reward);
    rewardsMap.add(rewardId, updated);
    let rid = FanPointsLib.generateId("redeemed", nextId.nextRedeemedId);
    nextId.nextRedeemedId += 1;
    let redeemed : Types.RedeemedReward = {
      id = rid;
      userId = caller;
      rewardId;
      rewardTitle = reward.title;
      codeOrValue = reward.codeOrValue;
      redeemedAt = Time.now();
      emailSent = false;
      contactEmail = null;
    };
    let existing = switch (redeemedRewardsMap.get(caller)) {
      case (null) { List.empty<Types.RedeemedReward>() };
      case (?l) { l };
    };
    existing.add(redeemed);
    redeemedRewardsMap.add(caller, existing);
    #ok(redeemed);
  };

  // ─── Rewards management ──────────────────────────────────────────────────────

  /// Create a new reward. Caller must be an admin (checked by main.mo).
  public func createReward(
    rewardsMap : Map.Map<Text, Types.Reward>,
    caller : Principal,
    isAdmin : Bool,
    title : Text,
    description : Text,
    pointsCost : Nat,
    rewardType : Types.RewardType,
    codeOrValue : Text,
    quantity : ?Nat,
    expiresAt : ?Int,
    teamId : ?Text,
    nextId : { var nextRewardId : Nat },
  ) : { #ok : Types.Reward; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can create rewards");
    };
    if (title == "") { return #err("Title must not be empty") };
    let id = FanPointsLib.generateId("reward", nextId.nextRewardId);
    nextId.nextRewardId += 1;
    let reward : Types.Reward = {
      id;
      title;
      description;
      pointsCost;
      rewardType;
      codeOrValue;
      quantity;
      quantityRemaining = quantity;
      expiresAt;
      active = true;
      createdBy = caller;
      teamId;
    };
    rewardsMap.add(id, reward);
    #ok(reward);
  };

  /// Toggle a reward active/inactive. Caller must be an admin (checked by main.mo).
  /// Full update of a reward's mutable fields. Caller must be an admin (checked by main.mo).
  /// Only non-null fields in `params` are applied.
  /// quantity update rule: if new quantity > current quantityRemaining, set quantityRemaining = new quantity;
  /// otherwise keep quantityRemaining unchanged (don't reduce available stock below what's left).
  public func updateReward(
    rewardsMap : Map.Map<Text, Types.Reward>,
    caller : Principal,
    isAdmin : Bool,
    id : Text,
    params : Types.UpdateRewardParams,
  ) : { #ok : Types.Reward; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can update rewards");
    };
    ignore caller;
    switch (rewardsMap.get(id)) {
      case (null) { #err("Reward not found") };
      case (?reward) {
        let newTitle = switch (params.title) { case (?v) { v }; case (null) { reward.title } };
        let newDescription = switch (params.description) { case (?v) { v }; case (null) { reward.description } };
        let newPointsCost = switch (params.pointsCost) { case (?v) { v }; case (null) { reward.pointsCost } };
        let newCodeOrValue = switch (params.codeOrValue) { case (?v) { v }; case (null) { reward.codeOrValue } };
        let newActive = switch (params.active) { case (?v) { v }; case (null) { reward.active } };
        let newTeamId = switch (params.teamId) {
          case (?v) { if (v == "") { null } else { ?v } };
          case (null) { reward.teamId };
        };
        // Quantity update: only expand quantityRemaining, never shrink it
        let (newQuantity, newQuantityRemaining) = switch (params.quantity) {
          case (null) { (reward.quantity, reward.quantityRemaining) };
          case (?newQty) {
            let newQtyOpt : ?Nat = ?newQty;
            let newRemaining : ?Nat = switch (reward.quantityRemaining) {
              case (null) { ?newQty };     // was unlimited → now has a cap, set remaining = quantity
              case (?rem) {
                if (newQty > rem) { ?newQty }   // adding more stock
                else { ?rem };                   // reducing cap but rem still valid, keep rem
              };
            };
            (newQtyOpt, newRemaining);
          };
        };
        let updated : Types.Reward = {
          reward with
          title = newTitle;
          description = newDescription;
          pointsCost = newPointsCost;
          codeOrValue = newCodeOrValue;
          active = newActive;
          teamId = newTeamId;
          quantity = newQuantity;
          quantityRemaining = newQuantityRemaining;
        };
        rewardsMap.add(id, updated);
        #ok(updated);
      };
    };
  };

  /// Permanently delete a reward. Caller must be an admin (checked by main.mo).
  public func deleteReward(
    rewardsMap : Map.Map<Text, Types.Reward>,
    caller : Principal,
    isAdmin : Bool,
    id : Text,
  ) : { #ok : Bool; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can delete rewards");
    };
    ignore caller;
    switch (rewardsMap.get(id)) {
      case (null) { #err("Reward not found") };
      case (?_) {
        rewardsMap.remove(id);
        #ok(true);
      };
    };
  };

  /// List all rewards, optionally filtered by teamId.
  public func listRewards(
    rewardsMap : Map.Map<Text, Types.Reward>,
    teamId : ?Text,
  ) : [Types.Reward] {
    let result = List.empty<Types.Reward>();
    for ((_id, r) in rewardsMap.entries()) {
      let matches = switch (teamId) {
        case (null) { true };
        case (?tid) {
          switch (r.teamId) {
            case (?rtid) { rtid == tid };
            case (null) { false };
          };
        };
      };
      if (matches) { result.add(r) };
    };
    result.toArray();
  };

  /// Return a single reward by ID.
  public func getReward(
    rewardsMap : Map.Map<Text, Types.Reward>,
    id : Text,
  ) : ?Types.Reward {
    rewardsMap.get(id);
  };

  // ─── Section assignment ──────────────────────────────────────────────────────

  /// Assign a staff member to a stadium section. Caller must be a manager (checked by main.mo).
  public func assignStaffSection(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    caller : Principal,
    isManager : Bool,
    staffId : Principal,
    sectionName : Text,
    sectionLabel : Text,
  ) : { #ok : Types.StaffSection; #err : Text } {
    if (not isManager) {
      return #err("Unauthorized: Only managers can assign sections");
    };
    if (sectionName == "") { return #err("Section name must not be empty") };
    let sec : Types.StaffSection = {
      staffId;
      managerId = caller;
      sectionName;
      sectionLabel;
      assignedAt = Time.now();
    };
    sectionAssignmentsMap.add(staffId, sec);
    #ok(sec);
  };

  /// Return the section assignment for a given staff member.
  public func getStaffSection(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    staffId : Principal,
  ) : ?Types.StaffSection {
    sectionAssignmentsMap.get(staffId);
  };

  /// Return all section assignments managed by a specific manager.
  public func getSectionAssignments(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    managerId : Principal,
  ) : [Types.StaffSection] {
    let result = List.empty<Types.StaffSection>();
    for ((_staffId, sec) in sectionAssignmentsMap.entries()) {
      if (Principal.equal(sec.managerId, managerId)) {
        result.add(sec);
      };
    };
    result.toArray();
  };

  // ─── Analytics ───────────────────────────────────────────────────────────────

  /// Aggregate tip volume grouped by stadium section (manager-only).
  public func getSectionAnalytics(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    tips : List.List<TipEntry>,
    managerId : Principal,
    since : ?Int,
  ) : [Types.SectionAnalytics] {
    FanPointsLib.buildSectionAnalytics(sectionAssignmentsMap, tips, managerId, since);
  };

  /// Per-staff tip summary for a manager's roster.
  public func getStaffAnalytics(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    staffRosters : Map.Map<Principal, List.List<{ principal : Principal; joinedAt : Int; status : { #active; #removed } }>>,
    tips : List.List<TipEntry>,
    managerId : Principal,
    since : ?Int,
  ) : [{ staffId : Principal; totalTips : Nat; totalAmount : Nat; sectionName : ?Text }] {
    let roster = switch (staffRosters.get(managerId)) {
      case (null) { return [] };
      case (?r) { r };
    };
    let activeIds = roster.filter(
      func(m : { principal : Principal; joinedAt : Int; status : { #active; #removed } }) : Bool {
        switch (m.status) { case (#active) { true }; case (#removed) { false } };
      }
    ).map(
      func(m : { principal : Principal; joinedAt : Int; status : { #active; #removed } }) : Principal { m.principal }
    ).toArray();
    FanPointsLib.buildStaffAnalytics(activeIds, sectionAssignmentsMap, tips, since);
  };

  /// Return the top-N earners from a manager's roster.
  public func getTopStaffPerformers(
    sectionAssignmentsMap : Map.Map<Principal, Types.StaffSection>,
    staffRosters : Map.Map<Principal, List.List<{ principal : Principal; joinedAt : Int; status : { #active; #removed } }>>,
    tips : List.List<TipEntry>,
    managerId : Principal,
    limit : Nat,
    since : ?Int,
  ) : [{ staffId : Principal; totalAmount : Nat; rank : Nat }] {
    let roster = switch (staffRosters.get(managerId)) {
      case (null) { return [] };
      case (?r) { r };
    };
    let activeIds = roster.filter(
      func(m : { principal : Principal; joinedAt : Int; status : { #active; #removed } }) : Bool {
        switch (m.status) { case (#active) { true }; case (#removed) { false } };
      }
    ).map(
      func(m : { principal : Principal; joinedAt : Int; status : { #active; #removed } }) : Principal { m.principal }
    ).toArray();
    let analytics = FanPointsLib.buildStaffAnalytics(activeIds, sectionAssignmentsMap, tips, since);
    let sorted = analytics.sort(
      func(a, b) = Nat.compare(b.totalAmount, a.totalAmount)
    );
    let n = if (limit < sorted.size()) { limit } else { sorted.size() };
    let ranked = List.empty<{ staffId : Principal; totalAmount : Nat; rank : Nat }>();
    var i : Nat = 0;
    while (i < n) {
      let item = sorted[i];
      ranked.add({ staffId = item.staffId; totalAmount = item.totalAmount; rank = i + 1 });
      i += 1;
    };
    ranked.toArray();
  };
  // ─── Fractional Point Engine ───────────────────────────────────────────────────

  /// Create a new points rule. Caller must be admin (checked by main.mo).
  /// Create a new points rule. Caller must be admin (checked by main.mo).
  /// For #sectionMultiplier rules, supply a non-null sectionName in the rule record.
  public func createPointsRule(
    pointsRulesMap : Map.Map<Text, Types.PointsRule>,
    isAdmin : Bool,
    rule : Types.PointsRule,
  ) : { #ok : Types.PointsRule; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can manage points rules");
    };
    if (rule.id == "") { return #err("Rule id must not be empty") };
    if (rule.name == "") { return #err("Rule name must not be empty") };
    // Validate: #sectionMultiplier rules must supply a sectionName
    switch (rule.ruleType) {
      case (#sectionMultiplier) {
        switch (rule.sectionName) {
          case (null) { return #err("sectionName is required for sectionMultiplier rules") };
          case (?n) { if (n == "") { return #err("sectionName must not be empty") } };
        };
      };
      case (_) {};
    };
    switch (pointsRulesMap.get(rule.id)) {
      case (?_) { return #err("A rule with this id already exists") };
      case (null) {};
    };
    pointsRulesMap.add(rule.id, rule);
    #ok(rule);
  };

  /// Update an existing points rule by id. Caller must be admin.
  /// Update an existing points rule by id. Caller must be admin.
  /// sectionName is only meaningful for #sectionMultiplier rules; pass null for others.
  public func updatePointsRule(
    pointsRulesMap : Map.Map<Text, Types.PointsRule>,
    isAdmin : Bool,
    id : Text,
    name : Text,
    description : Text,
    multiplier : Float,
    sectionName : ?Text,
  ) : { #ok : Types.PointsRule; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can manage points rules");
    };
    switch (pointsRulesMap.get(id)) {
      case (null) { #err("Rule not found") };
      case (?existing) {
        // For sectionMultiplier rules, validate sectionName
        let resolvedSection : ?Text = switch (existing.ruleType) {
          case (#sectionMultiplier) {
            switch (sectionName) {
              case (null) { return #err("sectionName is required for sectionMultiplier rules") };
              case (?n) { if (n == "") { return #err("sectionName must not be empty") }; ?n };
            };
          };
          case (_) { null };
        };
        let updated : Types.PointsRule = {
          existing with
          name;
          description;
          multiplier;
          sectionName = resolvedSection;
        };
        pointsRulesMap.add(id, updated);
        #ok(updated);
      };
    };
  };

  /// Toggle a rule's isActive flag. Caller must be admin.
  public func togglePointsRule(
    pointsRulesMap : Map.Map<Text, Types.PointsRule>,
    isAdmin : Bool,
    id : Text,
    active : Bool,
  ) : { #ok : Types.PointsRule; #err : Text } {
    if (not isAdmin) {
      return #err("Unauthorized: Only admins can manage points rules");
    };
    switch (pointsRulesMap.get(id)) {
      case (null) { #err("Rule not found") };
      case (?existing) {
        let updated : Types.PointsRule = { existing with isActive = active };
        pointsRulesMap.add(id, updated);
        #ok(updated);
      };
    };
  };

  /// Return all configured points rules.
  public func listPointsRules(
    pointsRulesMap : Map.Map<Text, Types.PointsRule>,
  ) : [Types.PointsRule] {
    let result = List.empty<Types.PointsRule>();
    for ((_id, rule) in pointsRulesMap.entries()) {
      result.add(rule);
    };
    result.toArray();
  };

  /// Calculate a full fractional point breakdown for a given transaction
  /// without persisting any state — used for live preview and testing.
  /// Calculate a full fractional point breakdown for a given transaction
  /// without persisting any state — used for live preview and testing.
  /// sectionName: optional stadium section of the recipient (enables #sectionMultiplier rules).
  public func getPointsBreakdown(
    pointsRulesMap : Map.Map<Text, Types.PointsRule>,
    amountCents : Nat,
    transactionType : Text,
    isGameDay : Bool,
    isFirstPayment : Bool,
    sectionName : ?Text,
  ) : Types.PointsBreakdown {
    let rules = List.empty<Types.PointsRule>();
    for ((_id, rule) in pointsRulesMap.entries()) {
      rules.add(rule);
    };
    FanPointsLib.calculatePoints(
      amountCents,
      transactionType,
      isGameDay,
      isFirstPayment,
      rules.toArray(),
      sectionName,
    );
  };
};
