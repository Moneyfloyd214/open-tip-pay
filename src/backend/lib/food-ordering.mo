import Types "../types/food-ordering";
import Map "mo:core/Map";

module {
  public type ConcessionStand = Types.ConcessionStand;
  public type MenuItem = Types.MenuItem;
  public type FoodOrder = Types.FoodOrder;
  public type OrderStatus = Types.OrderStatus;
  public type DeliveryMethod = Types.DeliveryMethod;
  public type OrderItem = Types.OrderItem;
  public type OrderItemInput = Types.OrderItemInput;

  // ── Stand helpers ──────────────────────────────────────────────────────────

  public func createStand(
    stands : Map.Map<Text, ConcessionStand>,
    id : Text,
    name : Text,
    description : Text,
    section : Text,
    createdAt : Int,
  ) : ConcessionStand {
    let stand : ConcessionStand = {
      id;
      name;
      description;
      section;
      createdAt;
    };
    stands.add(id, stand);
    stand;
  };

  public func updateStand(
    stands : Map.Map<Text, ConcessionStand>,
    id : Text,
    name : Text,
    description : Text,
    section : Text,
  ) : ?ConcessionStand {
    switch (stands.get(id)) {
      case null null;
      case (?existing) {
        let updated : ConcessionStand = { existing with name; description; section };
        stands.add(id, updated);
        ?updated;
      };
    };
  };

  /// Returns true when the stand can be safely deleted (no active orders).
  public func canDeleteStand(
    orders : Map.Map<Text, FoodOrder>,
    standId : Text,
  ) : Bool {
    for ((_, order) in orders.entries()) {
      if (order.standId == standId and isActiveStatus(order.status)) {
        return false;
      };
    };
    true;
  };

  public func listStands(stands : Map.Map<Text, ConcessionStand>) : [ConcessionStand] {
    var result : [ConcessionStand] = [];
    for ((_, stand) in stands.entries()) {
      result := result.concat([stand]);
    };
    result;
  };

  // ── Menu item helpers ──────────────────────────────────────────────────────

  public func addMenuItem(
    items : Map.Map<Text, MenuItem>,
    id : Text,
    standId : Text,
    name : Text,
    description : Text,
    priceInCents : Nat,
    category : Text,
    available : Bool,
  ) : MenuItem {
    let item : MenuItem = {
      id;
      standId;
      name;
      description;
      priceInCents;
      category;
      available;
    };
    items.add(id, item);
    item;
  };

  public func updateMenuItem(
    items : Map.Map<Text, MenuItem>,
    id : Text,
    name : Text,
    description : Text,
    priceInCents : Nat,
    category : Text,
    available : Bool,
  ) : ?MenuItem {
    switch (items.get(id)) {
      case null null;
      case (?existing) {
        let updated : MenuItem = { existing with name; description; priceInCents; category; available };
        items.add(id, updated);
        ?updated;
      };
    };
  };

  public func listMenuItems(
    items : Map.Map<Text, MenuItem>,
    standId : Text,
  ) : [MenuItem] {
    var result : [MenuItem] = [];
    for ((_, item) in items.entries()) {
      if (item.standId == standId) {
        result := result.concat([item]);
      };
    };
    result;
  };

  // ── Order helpers ──────────────────────────────────────────────────────────

  /// Resolve OrderItemInputs to OrderItems using the menu map; returns null if any item is not found.
  public func resolveItems(
    menuItemsMap : Map.Map<Text, MenuItem>,
    inputs : [OrderItemInput],
  ) : ?[OrderItem] {
    var resolved : [OrderItem] = [];
    for (input in inputs.vals()) {
      switch (menuItemsMap.get(input.itemId)) {
        case null { return null };
        case (?menuItem) {
          let oi : OrderItem = {
            itemId = input.itemId;
            itemName = menuItem.name;
            quantity = input.quantity;
            priceInCents = menuItem.priceInCents;
          };
          resolved := resolved.concat([oi]);
        };
      };
    };
    ?resolved;
  };

  public func calcTotal(items : [OrderItem]) : Nat {
    var total : Nat = 0;
    for (item in items.vals()) {
      total += item.priceInCents * item.quantity;
    };
    total;
  };

  public func buildOrder(
    id : Text,
    customerId : Principal,
    standId : Text,
    orderItems : [OrderItem],
    totalInCents : Nat,
    seatNumber : Text,
    deliveryMethod : DeliveryMethod,
    now : Int,
  ) : FoodOrder {
    {
      id;
      customerId;
      standId;
      items = orderItems;
      totalInCents;
      seatNumber;
      deliveryMethod;
      status = #Placed;
      createdAt = now;
      updatedAt = now;
    };
  };

  public func setOrderStatus(
    order : FoodOrder,
    status : OrderStatus,
    now : Int,
  ) : FoodOrder {
    { order with status; updatedAt = now };
  };

  public func getMyOrders(
    orders : Map.Map<Text, FoodOrder>,
    caller : Principal,
  ) : [FoodOrder] {
    var result : [FoodOrder] = [];
    for ((_, order) in orders.entries()) {
      if (order.customerId == caller) {
        result := result.concat([order]);
      };
    };
    result;
  };

  public func getActiveOrdersForManager(
    orders : Map.Map<Text, FoodOrder>,
  ) : [FoodOrder] {
    var result : [FoodOrder] = [];
    for ((_, order) in orders.entries()) {
      if (isActiveStatus(order.status)) {
        result := result.concat([order]);
      };
    };
    result;
  };

  /// Returns true when the order is in a placed state (eligible for cancellation).
  public func isPlaced(order : FoodOrder) : Bool {
    switch (order.status) {
      case (#Placed) true;
      case _ false;
    };
  };

  public func isActiveStatus(status : OrderStatus) : Bool {
    switch (status) {
      case (#Placed or #Preparing or #ReadyForPickup or #OnTheWay) true;
      case (#Completed or #Cancelled) false;
    };
  };
};
