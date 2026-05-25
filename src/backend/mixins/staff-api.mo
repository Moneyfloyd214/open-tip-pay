import Map "mo:core/Map";
import StaffTypes "../types/staff";
import List "mo:core/List";

/// Stateless module exposing extended staff roster management stubs.
/// All state is injected as parameters; business logic will be filled in
/// by the develop pass.
module {

  // ─── Extended Staff Roster ────────────────────────────────────────────────────

  /// Create or update an extended staff member record.
  /// Returns the upserted ExtendedStaffMember on success.
  public func upsertExtendedStaff(
    extendedStaffMap : Map.Map<Text, StaffTypes.ExtendedStaffMember>,
    isManagerOrAdmin : Bool,
    member : StaffTypes.ExtendedStaffMember,
  ) : { #ok : StaffTypes.ExtendedStaffMember; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Unauthorized: Only managers or admins can manage staff");
    };
    if (member.id == "") { return #err("Staff id must not be empty") };
    if (member.name == "") { return #err("Staff name must not be empty") };
    extendedStaffMap.add(member.id, member);
    #ok(member);
  };

  /// Return the extended staff member record for a given id, or null.
  public func getExtendedStaff(
    extendedStaffMap : Map.Map<Text, StaffTypes.ExtendedStaffMember>,
    id : Text,
  ) : ?StaffTypes.ExtendedStaffMember {
    extendedStaffMap.get(id);
  };

  /// Return all extended staff member records.
  /// Return all extended staff member records.
  public func listExtendedStaff(
    extendedStaffMap : Map.Map<Text, StaffTypes.ExtendedStaffMember>,
    isManagerOrAdmin : Bool,
  ) : [StaffTypes.ExtendedStaffMember] {
    if (not isManagerOrAdmin) { return [] };
    let result = List.empty<StaffTypes.ExtendedStaffMember>();
    for ((_id, member) in extendedStaffMap.entries()) {
      result.add(member);
    };
    result.toArray();
  };

  /// Remove an extended staff member record by id.
  public func removeExtendedStaff(
    extendedStaffMap : Map.Map<Text, StaffTypes.ExtendedStaffMember>,
    isManagerOrAdmin : Bool,
    id : Text,
  ) : { #ok; #err : Text } {
    if (not isManagerOrAdmin) {
      return #err("Unauthorized: Only managers or admins can remove staff");
    };
    switch (extendedStaffMap.get(id)) {
      case (null) { #err("Staff member not found") };
      case (?_) {
        extendedStaffMap.remove(id);
        #ok;
      };
    };
  };
};
