import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type CentAmount = Common.CentAmount;

  /// A concession stand in the stadium.
  public type ConcessionStand = {
    id : Text;
    name : Text;
    description : Text;
    section : Text;
    createdAt : Timestamp;
  };

  /// A food or drink item offered by a concession stand.
  public type MenuItem = {
    id : Text;
    standId : Text;
    name : Text;
    description : Text;
    priceInCents : CentAmount;
    category : Text;
    available : Bool;
  };

  /// Lifecycle state of a food order.
  public type OrderStatus = {
    #Placed;
    #Preparing;
    #ReadyForPickup;
    #OnTheWay;
    #Completed;
    #Cancelled;
  };

  /// How the fan wants to receive their order.
  public type DeliveryMethod = {
    #Delivery;
    #Pickup;
  };

  /// A single line item within an order (as supplied by the caller at order time).
  public type OrderItemInput = {
    itemId : Text;
    quantity : Nat;
  };

  /// A resolved line item stored in the order.
  public type OrderItem = {
    itemId : Text;
    itemName : Text;
    quantity : Nat;
    priceInCents : CentAmount;
  };

  /// A food order placed by a fan.
  public type FoodOrder = {
    id : Text;
    customerId : UserId;
    standId : Text;
    items : [OrderItem];
    totalInCents : CentAmount;
    seatNumber : Text;
    deliveryMethod : DeliveryMethod;
    status : OrderStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };
};
