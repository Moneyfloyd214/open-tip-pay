module {
  /// Full extended staff member record persisted in the backend.
  /// Augments the lightweight StaffMember (principal + joinedAt + status) with
  /// richer HR-style fields needed for roster management, analytics, and the
  /// Colts demo.
  public type ExtendedStaffMember = {
    id : Text;                           // stable text key (usually the member's principal text)
    name : Text;
    customRole : Text;                   // free-text role label (e.g. "Suite Runner")
    employmentType : { #fullTime; #partTime; #contractor };
    employmentStatus : { #active; #inactive; #suspended };
    section : Text;                      // stadium section assignment
    phone : Text;
    email : Text;
    hireDate : Int;                      // nanosecond timestamp
    notes : Text;
  };
};
