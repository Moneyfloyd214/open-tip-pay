
module {
  /// A staff check-in/check-out record for a specific game and stand.
  public type StaffCheckIn = {
    id : Text;
    staffId : Text;
    staffName : Text;
    role : Text;
    standId : Text;
    standName : Text;
    gameDate : Text;
    checkInTime : Int;
    checkOutTime : ?Int;
    hoursWorked : ?Float;
    manualOverride : Bool;
    overrideBy : ?Text;
  };

  /// Records which stand a staff member was assigned to for a specific game,
  /// allowing per-game overrides of their permanent default stand.
  public type GameStandAssignment = {
    id : Text;
    staffId : Text;
    staffName : Text;
    defaultStandId : Text;
    gameStandId : Text;
    gameStandName : Text;
    gameDate : Text;
  };

  /// A role definition used by the automated tip-split engine.
  /// Each role carries a relative point value that determines share weight.
  public type TipSplitRole = {
    id : Text;
    roleName : Text;
    pointValue : Float;
    isCustom : Bool;
  };

  /// Per-staff-member calculation result within a tip-split payout.
  public type TipSplitCalculation = {
    staffId : Text;
    staffName : Text;
    role : Text;
    hoursWorked : Float;
    rolePoints : Float;
    weightedScore : Float;
    sharePercent : Float;
    payoutAmount : Float;
  };

  /// A full automated tip-split payout record for one stand on one game date.
  public type TipSplitPayout = {
    id : Text;
    standId : Text;
    standName : Text;
    gameDate : Text;
    totalPool : Float;
    calculations : [TipSplitCalculation];
    approvedBy : ?Text;
    approvedAt : ?Int;
    status : Text; // "pending" | "approved" | "rejected"
  };
};
