import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Time "mo:core/Time";
import TipSplitTypes "../types/tip-split";

/// Stateless module exposing the hours-tracking, stand-assignment, and
/// automated tip-split engine API.
/// All state is injected as parameters.
module {

  // ─── Default role seeding ─────────────────────────────────────────────────

  let defaultRoles : [TipSplitTypes.TipSplitRole] = [
    { id = "role-head-bartender"; roleName = "Head Bartender"; pointValue = 3.0; isCustom = false },
    { id = "role-bartender";      roleName = "Bartender";      pointValue = 2.0; isCustom = false },
    { id = "role-barback";        roleName = "Barback";        pointValue = 1.0; isCustom = false },
    { id = "role-concession";     roleName = "Concession Worker"; pointValue = 1.0; isCustom = false },
    { id = "role-suite-runner";   roleName = "Suite Runner";   pointValue = 2.0; isCustom = false },
  ];

  func seedDefaultRoles(roles : Map.Map<Text, TipSplitTypes.TipSplitRole>) {
    for (r in defaultRoles.vals()) {
      roles.add(r.id, r);
    };
  };

  // ─── Check-in / Check-out ─────────────────────────────────────────────────

  /// Record a staff member checking in to a stand for a game.
  public func recordCheckIn(
    checkIns : Map.Map<Text, TipSplitTypes.StaffCheckIn>,
    isManagerOrAdmin : Bool,
    staffId : Text,
    staffName : Text,
    role : Text,
    standId : Text,
    standName : Text,
    gameDate : Text,
    checkInTime : Int,
  ) : { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    let id = staffId # "-" # gameDate # "-" # checkInTime.toText();
    let checkIn : TipSplitTypes.StaffCheckIn = {
      id;
      staffId;
      staffName;
      role;
      standId;
      standName;
      gameDate;
      checkInTime;
      checkOutTime = null;
      hoursWorked = null;
      manualOverride = false;
      overrideBy = null;
    };
    checkIns.add(id, checkIn);
    #ok(checkIn);
  };

  /// Record a staff member checking out of their shift.
  public func recordCheckOut(
    checkIns : Map.Map<Text, TipSplitTypes.StaffCheckIn>,
    isManagerOrAdmin : Bool,
    checkInId : Text,
    checkOutTime : Int,
  ) : { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    switch (checkIns.get(checkInId)) {
      case null { #err("Check-in record not found: " # checkInId) };
      case (?existing) {
        let hoursWorked = (checkOutTime - existing.checkInTime).toFloat() / 3600000000000.0;
        let updated : TipSplitTypes.StaffCheckIn = {
          existing with
          checkOutTime = ?checkOutTime;
          hoursWorked = ?hoursWorked;
        };
        checkIns.add(checkInId, updated);
        #ok(updated);
      };
    };
  };

  /// Manually set hours worked for a staff member's check-in record.
  public func manualSetHours(
    checkIns : Map.Map<Text, TipSplitTypes.StaffCheckIn>,
    isManagerOrAdmin : Bool,
    checkInId : Text,
    hoursWorked : Float,
    overrideBy : Text,
  ) : { #ok : TipSplitTypes.StaffCheckIn; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    switch (checkIns.get(checkInId)) {
      case null { #err("Check-in record not found: " # checkInId) };
      case (?existing) {
        let updated : TipSplitTypes.StaffCheckIn = {
          existing with
          hoursWorked = ?hoursWorked;
          manualOverride = true;
          overrideBy = ?overrideBy;
        };
        checkIns.add(checkInId, updated);
        #ok(updated);
      };
    };
  };

  /// Return all check-in records for a given game date, sorted by checkInTime.
  public func getCheckInsForGame(
    checkIns : Map.Map<Text, TipSplitTypes.StaffCheckIn>,
    isManagerOrAdmin : Bool,
    gameDate : Text,
  ) : [TipSplitTypes.StaffCheckIn] {
    ignore isManagerOrAdmin;
    let filtered = checkIns.values().filter(func(c : TipSplitTypes.StaffCheckIn) : Bool {
      c.gameDate == gameDate
    });
    let arr = filtered.toArray();
    arr.sort<TipSplitTypes.StaffCheckIn>(func(a, b) {
      Int.compare(a.checkInTime, b.checkInTime)
    });
  };

  // ─── Per-Game Stand Assignment ────────────────────────────────────────────

  /// Return the stand assignment for a specific staff member on a given game date.
  public func getGameStandAssignment(
    assignments : Map.Map<Text, TipSplitTypes.GameStandAssignment>,
    staffId : Text,
    gameDate : Text,
  ) : ?TipSplitTypes.GameStandAssignment {
    assignments.get(staffId # "|" # gameDate);
  };

  /// Create or update the stand assignment for a staff member on a game date.
  public func setGameStandAssignment(
    assignments : Map.Map<Text, TipSplitTypes.GameStandAssignment>,
    isManagerOrAdmin : Bool,
    assignment : TipSplitTypes.GameStandAssignment,
  ) : { #ok : TipSplitTypes.GameStandAssignment; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    let key = assignment.staffId # "|" # assignment.gameDate;
    // Generate a stable id from the key if the provided id is empty
    let stored : TipSplitTypes.GameStandAssignment = if (assignment.id == "") {
      { assignment with id = key }
    } else { assignment };
    assignments.add(key, stored);
    #ok(stored);
  };

  // ─── Tip-Split Role Management ────────────────────────────────────────────

  /// Return all tip-split role definitions.
  /// Seeds 5 default roles the first time the map is empty.
  public func getTipSplitRoles(
    roles : Map.Map<Text, TipSplitTypes.TipSplitRole>,
  ) : [TipSplitTypes.TipSplitRole] {
    if (roles.size() == 0) {
      seedDefaultRoles(roles);
    };
    roles.values().toArray();
  };

  /// Create or update a tip-split role definition.
  public func upsertTipSplitRole(
    roles : Map.Map<Text, TipSplitTypes.TipSplitRole>,
    isManagerOrAdmin : Bool,
    role : TipSplitTypes.TipSplitRole,
  ) : { #ok : TipSplitTypes.TipSplitRole; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    // Generate an id if not provided
    let stored : TipSplitTypes.TipSplitRole = if (role.id == "") {
      { role with id = "role-custom-" # Time.now().toText() }
    } else { role };
    roles.add(stored.id, stored);
    #ok(stored);
  };

  /// Remove a tip-split role definition by id.
  public func removeTipSplitRole(
    roles : Map.Map<Text, TipSplitTypes.TipSplitRole>,
    isManagerOrAdmin : Bool,
    roleId : Text,
  ) : { #ok; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    switch (roles.get(roleId)) {
      case null { #err("Role not found: " # roleId) };
      case (?_) {
        roles.remove(roleId);
        #ok;
      };
    };
  };

  // ─── Tip-Split Engine ─────────────────────────────────────────────────────

  /// Calculate the tip split for a stand on a specific game date.
  /// Uses role weights × hours worked to produce per-staff payout amounts.
  public func calculateTipSplit(
    checkIns : Map.Map<Text, TipSplitTypes.StaffCheckIn>,
    roles : Map.Map<Text, TipSplitTypes.TipSplitRole>,
    assignments : Map.Map<Text, TipSplitTypes.GameStandAssignment>,
    payouts : Map.Map<Text, TipSplitTypes.TipSplitPayout>,
    isManagerOrAdmin : Bool,
    standId : Text,
    gameDate : Text,
    totalPool : Float,
  ) : { #ok : TipSplitTypes.TipSplitPayout; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    // Seed default roles if needed
    if (roles.size() == 0) { seedDefaultRoles(roles) };

    // Collect relevant check-ins: staff whose effective stand for this game matches standId
    let relevantCheckIns = checkIns.values().filter(func(c : TipSplitTypes.StaffCheckIn) : Bool {
      if (c.gameDate != gameDate) return false;
      // Check if there's a per-game override for this staff member
      switch (assignments.get(c.staffId # "|" # gameDate)) {
        case (?assign) { assign.gameStandId == standId };
        case null { c.standId == standId };
      };
    });

    let checkInArr = relevantCheckIns.toArray();

    if (checkInArr.size() == 0) {
      return #err("No check-ins found for stand " # standId # " on " # gameDate);
    };

    // Build role lookup by name (case-insensitive)
    func getRolePoints(roleName : Text) : Float {
      let lower = roleName.toLower();
      let found = roles.values().find(func(r : TipSplitTypes.TipSplitRole) : Bool {
        r.roleName.toLower() == lower
      });
      switch (found) {
        case (?r) { r.pointValue };
        case null { 1.0 };
      };
    };

    // Compute weighted scores
    let calcs = checkInArr.map(
      func(c : TipSplitTypes.StaffCheckIn) : TipSplitTypes.TipSplitCalculation {
        let hours = switch (c.hoursWorked) { case (?h) h; case null 0.0 };
        let rolePoints = getRolePoints(c.role);
        let weighted = rolePoints * hours;
        {
          staffId = c.staffId;
          staffName = c.staffName;
          role = c.role;
          hoursWorked = hours;
          rolePoints;
          weightedScore = weighted;
          sharePercent = 0.0; // filled after totalWeight known
          payoutAmount = 0.0;  // filled after totalWeight known
        };
      }
    );

    let totalWeight = calcs.foldLeft(
      0.0, func(acc, c) { acc + c.weightedScore }
    );

    let finalCalcs : [TipSplitTypes.TipSplitCalculation] = if (totalWeight == 0.0) {
      // Equal split fallback
      let n = calcs.size().toFloat();
      calcs.map<TipSplitTypes.TipSplitCalculation, TipSplitTypes.TipSplitCalculation>(
        func(c) {
          { c with
            sharePercent = 100.0 / n;
            payoutAmount = totalPool / n;
          }
        }
      );
    } else {
      calcs.map<TipSplitTypes.TipSplitCalculation, TipSplitTypes.TipSplitCalculation>(
        func(c) {
          let share = c.weightedScore / totalWeight;
          { c with
            sharePercent = share * 100.0;
            payoutAmount = totalPool * share;
          };
        }
      );
    };

    let payoutId = standId # "-" # gameDate # "-" # Time.now().toText();
    // Derive stand name from first check-in
    let standName = checkInArr[0].standName;
    let payout : TipSplitTypes.TipSplitPayout = {
      id = payoutId;
      standId;
      standName;
      gameDate;
      totalPool;
      calculations = finalCalcs;
      approvedBy = null;
      approvedAt = null;
      status = "pending";
    };
    payouts.add(payoutId, payout);
    #ok(payout);
  };

  /// Approve a calculated tip-split payout, locking it for disbursement.
  public func approveTipSplitPayout(
    payouts : Map.Map<Text, TipSplitTypes.TipSplitPayout>,
    isManagerOrAdmin : Bool,
    payoutId : Text,
    approvedBy : Text,
    approvedAt : Int,
  ) : { #ok : TipSplitTypes.TipSplitPayout; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Not authorized");
    };
    switch (payouts.get(payoutId)) {
      case null { #err("Payout not found: " # payoutId) };
      case (?existing) {
        let updated : TipSplitTypes.TipSplitPayout = {
          existing with
          status = "approved";
          approvedBy = ?approvedBy;
          approvedAt = ?approvedAt;
        };
        payouts.add(payoutId, updated);
        #ok(updated);
      };
    };
  };

  /// Return all tip-split payout records, optionally filtered by stand or game date.
  public func getTipSplitPayouts(
    payouts : Map.Map<Text, TipSplitTypes.TipSplitPayout>,
    isManagerOrAdmin : Bool,
    standId : ?Text,
    gameDate : ?Text,
  ) : [TipSplitTypes.TipSplitPayout] {
    ignore isManagerOrAdmin;
    let filtered = payouts.values().filter(func(p : TipSplitTypes.TipSplitPayout) : Bool {
      let standMatch = switch (standId) {
        case null { true };
        case (?sid) { p.standId == sid };
      };
      let dateMatch = switch (gameDate) {
        case null { true };
        case (?d) { p.gameDate == d };
      };
      standMatch and dateMatch;
    });
    filtered.toArray();
  };
};
