import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/food-ordering";
import FoodOrderingLib "../lib/food-ordering";

mixin (
  concessionStands : Map.Map<Text, Types.ConcessionStand>,
  menuItems : Map.Map<Text, Types.MenuItem>,
  foodOrders : Map.Map<Text, Types.FoodOrder>,
  accessControlState : AccessControl.AccessControlState,
  state : { var nextFoodOrderSeq : Nat },
) {

  // ── Stand management (admin only) ─────────────────────────────────────────

  public shared ({ caller }) func createStand(
    name : Text,
    description : Text,
    section : Text,
  ) : async { #ok : Types.ConcessionStand; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    let id = "stand-" # state.nextFoodOrderSeq.toText();
    state.nextFoodOrderSeq += 1;
    let stand = FoodOrderingLib.createStand(concessionStands, id, name, description, section, Time.now());
    #ok(stand);
  };

  public shared ({ caller }) func updateStand(
    id : Text,
    name : Text,
    description : Text,
    section : Text,
  ) : async { #ok : Types.ConcessionStand; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    switch (FoodOrderingLib.updateStand(concessionStands, id, name, description, section)) {
      case null #err("Stand not found");
      case (?updated) #ok(updated);
    };
  };

  public shared ({ caller }) func deleteStand(
    id : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    if (not FoodOrderingLib.canDeleteStand(foodOrders, id)) {
      return #err("Cannot delete stand with active orders");
    };
    concessionStands.remove(id);
    #ok(());
  };

  public query func listStands() : async [Types.ConcessionStand] {
    FoodOrderingLib.listStands(concessionStands);
  };

  // ── Menu item management (admin only) ─────────────────────────────────────

  public shared ({ caller }) func addMenuItem(
    standId : Text,
    name : Text,
    description : Text,
    priceInCents : Nat,
    category : Text,
    available : Bool,
  ) : async { #ok : Types.MenuItem; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    if (concessionStands.get(standId) == null) {
      return #err("Stand not found");
    };
    let id = "item-" # state.nextFoodOrderSeq.toText();
    state.nextFoodOrderSeq += 1;
    let item = FoodOrderingLib.addMenuItem(menuItems, id, standId, name, description, priceInCents, category, available);
    #ok(item);
  };

  public shared ({ caller }) func updateMenuItem(
    itemId : Text,
    name : Text,
    description : Text,
    priceInCents : Nat,
    category : Text,
    available : Bool,
  ) : async { #ok : Types.MenuItem; #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    switch (FoodOrderingLib.updateMenuItem(menuItems, itemId, name, description, priceInCents, category, available)) {
      case null #err("Menu item not found");
      case (?updated) #ok(updated);
    };
  };

  public shared ({ caller }) func deleteMenuItem(
    itemId : Text,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: admin only");
    };
    menuItems.remove(itemId);
    #ok(());
  };

  public query func listMenuItems(standId : Text) : async [Types.MenuItem] {
    FoodOrderingLib.listMenuItems(menuItems, standId);
  };

  // ── Fan order flow ─────────────────────────────────────────────────────────

  public shared ({ caller }) func placeOrder(
    standId : Text,
    items : [Types.OrderItemInput],
    seatNumber : Text,
    deliveryMethod : Types.DeliveryMethod,
  ) : async { #ok : Types.FoodOrder; #err : Text } {
    if (concessionStands.get(standId) == null) {
      return #err("Stand not found");
    };
    if (items.size() == 0) {
      return #err("Order must contain at least one item");
    };
    let resolvedItems = switch (FoodOrderingLib.resolveItems(menuItems, items)) {
      case null { return #err("One or more menu items not found") };
      case (?ri) ri;
    };
    let total = FoodOrderingLib.calcTotal(resolvedItems);
    let id = "order-" # state.nextFoodOrderSeq.toText();
    state.nextFoodOrderSeq += 1;
    let order = FoodOrderingLib.buildOrder(id, caller, standId, resolvedItems, total, seatNumber, deliveryMethod, Time.now());
    foodOrders.add(id, order);
    #ok(order);
  };

  public query func getOrder(orderId : Text) : async ?Types.FoodOrder {
    foodOrders.get(orderId);
  };

  public shared query ({ caller }) func getMyOrders() : async [Types.FoodOrder] {
    FoodOrderingLib.getMyOrders(foodOrders, caller);
  };

  public shared ({ caller }) func cancelOrder(
    orderId : Text,
  ) : async { #ok : (); #err : Text } {
    switch (foodOrders.get(orderId)) {
      case null #err("Order not found");
      case (?order) {
        if (not (order.customerId == caller or AccessControl.isAdmin(accessControlState, caller))) {
          return #err("Unauthorized: only the order owner or admin can cancel");
        };
        if (not FoodOrderingLib.isPlaced(order)) {
          return #err("Only placed orders can be cancelled");
        };
        let updated = FoodOrderingLib.setOrderStatus(order, #Cancelled, Time.now());
        foodOrders.add(orderId, updated);
        #ok(());
      };
    };
  };

  // ── Manager / admin order management ──────────────────────────────────────

  public shared ({ caller }) func updateOrderStatus(
    orderId : Text,
    status : Types.OrderStatus,
  ) : async { #ok : (); #err : Text } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Unauthorized: manager or admin only");
    };
    switch (foodOrders.get(orderId)) {
      case null #err("Order not found");
      case (?order) {
        let updated = FoodOrderingLib.setOrderStatus(order, status, Time.now());
        foodOrders.add(orderId, updated);
        #ok(());
      };
    };
  };

  public shared query ({ caller }) func getActiveOrdersForManager() : async [Types.FoodOrder] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return [];
    };
    FoodOrderingLib.getActiveOrdersForManager(foodOrders);
  };
};
