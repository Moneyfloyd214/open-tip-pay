import type { ConcessionStand, MenuItem } from "@/types/food-ordering";
import { DeliveryMethod, OrderStatus } from "@/types/food-ordering";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ArrowLeft, CircleCheck as CheckCircle2, Minus, Plus, ShoppingCart, Trash2, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBranding } from "../context/BrandingContext";
import {
  DEMO_ACTIVE_ORDER,
  DEMO_MENU_ITEMS,
  DEMO_STANDS,
  useDemoMode,
} from "../context/DemoContext";
import {
  useCancelOrder,
  useGetOrder,
  useListMenuItems,
  useListStands,
  usePlaceOrder,
} from "../hooks/useQueries";
import { useFoodOrderStore } from "../store/foodOrderStore";

type Screen =
  | "browse"
  | "menu"
  | "cart"
  | "checkout"
  | "confirmation"
  | "tracking";

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: "placed", label: "Placed" },
  { key: "preparing", label: "Preparing" },
  { key: "readyForPickup", label: "Ready" },
  { key: "onTheWay", label: "On the Way" },
];

function statusIndex(s: OrderStatus): number {
  switch (s) {
    case OrderStatus.Placed:
      return 0;
    case OrderStatus.Preparing:
      return 1;
    case OrderStatus.ReadyForPickup:
      return 2;
    case OrderStatus.OnTheWay:
      return 3;
    default:
      return 4;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function FoodOrderSheet({ open, onOpenChange }: Props) {
  const { isDemoMode } = useDemoMode();
  const { brandName } = useBranding();
  const [screen, setScreen] = useState<Screen>("browse");
  const [selectedStand, setSelectedStand] = useState<ConcessionStand | null>(
    null,
  );
  const [confirmOrderId, setConfirmOrderId] = useState("");
  const [sectionNumber, setSectionNumber] = useState("");
  const [rowNumber, setRowNumber] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [seatValidationError, setSeatValidationError] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    DeliveryMethod.Delivery,
  );
  const [trackingOrderId, setTrackingOrderId] = useState("");

  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart } =
    useFoodOrderStore();

  // Real mode data
  const { data: realStands = [] } = useListStands();
  const { data: realMenuItems = [] } = useListMenuItems(
    selectedStand?.id ?? "",
  );
  const placeOrder = usePlaceOrder();
  const cancelOrder = useCancelOrder();
  const { data: trackedOrder } = useGetOrder(
    trackingOrderId,
    screen === "tracking" && !isDemoMode && !!trackingOrderId,
  );

  const stands: ConcessionStand[] = (() => {
    try {
      const raw = localStorage.getItem("demo_active_stands");
      const activeSet: Set<string> | null = raw
        ? new Set(JSON.parse(raw) as string[])
        : null;
      if (isDemoMode) {
        return activeSet
          ? DEMO_STANDS.filter((s) => activeSet.has(s.id))
          : DEMO_STANDS;
      }
      return activeSet
        ? realStands.filter((s) => activeSet.has(s.id))
        : realStands;
    } catch {
      return isDemoMode ? DEMO_STANDS : realStands;
    }
  })();
  const menuItems: MenuItem[] = isDemoMode
    ? (DEMO_MENU_ITEMS[selectedStand?.id ?? ""] ?? [])
    : realMenuItems;

  const subtotalCents = cartItems.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0,
  );

  const fullSeatLocation =
    sectionNumber.trim() && rowNumber.trim() && seatNumber.trim()
      ? `Section ${sectionNumber.trim()}, Row ${rowNumber.trim()}, Seat ${seatNumber.trim()}`
      : "";

  const handleClose = () => {
    setScreen("browse");
    setSelectedStand(null);
    setConfirmOrderId("");
    setSectionNumber("");
    setRowNumber("");
    setSeatNumber("");
    setSeatValidationError(false);
    setTrackingOrderId("");
    clearCart();
    onOpenChange(false);
  };

  const handlePlaceOrder = async () => {
    if (!fullSeatLocation || !selectedStand) {
      setSeatValidationError(true);
      return;
    }
    setSeatValidationError(false);
    if (isDemoMode) {
      const mockId = `order-demo-${Date.now()}`;
      setConfirmOrderId(mockId);
      clearCart();
      setScreen("confirmation");
      return;
    }
    try {
      const result = await placeOrder.mutateAsync({
        standId: selectedStand.id,
        items: cartItems.map((c) => ({
          itemId: c.menuItemId,
          itemName: c.itemName,
          quantity: BigInt(c.quantity),
          priceInCents: BigInt(c.priceCents),
        })),
        seatNumber: fullSeatLocation,
        deliveryMethod,
      });
      setConfirmOrderId(result?.id ?? "");
      clearCart();
      setScreen("confirmation");
    } catch {
      /* errors shown by React Query */
    }
  };

  const handleCancelOrder = async () => {
    const oid = trackingOrderId || confirmOrderId;
    if (!oid) return;
    if (!isDemoMode) {
      await cancelOrder.mutateAsync(oid).catch(() => {});
    }
    handleClose();
  };

  const trackingStatus = isDemoMode
    ? DEMO_ACTIVE_ORDER.status
    : (trackedOrder?.status ?? OrderStatus.Placed);

  const prevTrackingStatus = useRef<OrderStatus | null>(null);
  useEffect(() => {
    if (screen !== "tracking") return;
    const current = trackingStatus;
    const prev = prevTrackingStatus.current;
    if (prev !== null && prev !== current) {
      if (current === OrderStatus.Preparing) {
        toast.success("Your order is being prepared!");
      } else if (current === OrderStatus.ReadyForPickup) {
        toast.success("Your order is ready for pickup!");
      } else if (current === OrderStatus.OnTheWay) {
        toast.success("Your order is on the way!");
      } else if (current === OrderStatus.Completed) {
        toast.success("Order delivered! Enjoy your food!");
      }
    }
    prevTrackingStatus.current = current;
  }, [trackingStatus, screen]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[92vh] bg-background border-t border-border p-0 flex flex-col"
      >
        {/* BROWSE */}
        {screen === "browse" && (
          <>
            <SheetHeader className="p-5 pb-3 border-b border-border">
              <SheetTitle className="text-white flex items-center gap-2">
                <Utensils className="h-5 w-5 text-cyan-400" />
                <span>Order Food</span>
                <span className="text-xs text-white/40 font-normal ml-1">
                  via {brandName}
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-white/50 text-sm">
                Skip the line — order from your seat
              </p>
              {stands.map((stand) => (
                <div
                  key={stand.id}
                  className="bg-muted/30 backdrop-blur-xl border border-border rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
                      <Utensils className="h-5 w-5 text-cyan-400" />
                    </div>
                    <p className="text-white font-semibold truncate">
                      {stand.name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedStand(stand);
                      setScreen("menu");
                    }}
                    className="flex-shrink-0 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-semibold"
                    variant="outline"
                    data-ocid={`food.stand.${stands.indexOf(stand) + 1}.view_button`}
                  >
                    View Menu
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* MENU */}
        {screen === "menu" && selectedStand && (
          <>
            <SheetHeader className="p-5 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setScreen("browse")}
                  className="text-white/60 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-white">
                  {selectedStand.name}
                </SheetTitle>
                {cartItems.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => setScreen("cart")}
                    className="ml-auto bg-cyan-400 hover:bg-cyan-300 text-black font-bold"
                    data-ocid="food.view_cart_button"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Cart ({cartItems.reduce((s, i) => s + i.quantity, 0)})
                  </Button>
                )}
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {menuItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-muted/30 backdrop-blur-xl border border-border rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{item.name}</p>
                      <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <p className="text-cyan-400 font-bold text-lg flex-shrink-0">
                      ${(Number(item.priceInCents) / 100).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      addToCart({
                        menuItemId: item.id,
                        itemName: item.name,
                        priceCents: Number(item.priceInCents),
                      })
                    }
                    className="w-full bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-semibold"
                    variant="outline"
                    data-ocid={`food.menu_item.${idx + 1}.add_button`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* CART */}
        {screen === "cart" && (
          <>
            <SheetHeader className="p-5 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setScreen("menu")}
                  className="text-white/60 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-white">Your Cart</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 && (
                <p className="text-white/40 text-center py-10">
                  Your cart is empty
                </p>
              )}
              {cartItems.map((item, idx) => (
                <div
                  key={item.menuItemId}
                  className="bg-muted/30 backdrop-blur-xl border border-border rounded-2xl p-4 flex items-center gap-3"
                  data-ocid={`food.cart_item.${idx + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {item.itemName}
                    </p>
                    <p className="text-cyan-400 text-sm">
                      ${(item.priceCents / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg border border-white/20 text-white/60 hover:text-white"
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity - 1)
                      }
                      data-ocid={`food.cart_item.${idx + 1}.minus_button`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-white font-bold w-5 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg border border-white/20 text-white/60 hover:text-white"
                      onClick={() =>
                        updateQuantity(item.menuItemId, item.quantity + 1)
                      }
                      data-ocid={`food.cart_item.${idx + 1}.plus_button`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg border border-red-400/30 text-red-400/60 hover:text-red-400"
                      onClick={() => removeFromCart(item.menuItemId)}
                      data-ocid={`food.cart_item.${idx + 1}.delete_button`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-border space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-bold">
                  ${(subtotalCents / 100).toFixed(2)}
                </span>
              </div>
              <Button
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-5"
                disabled={cartItems.length === 0}
                onClick={() => setScreen("checkout")}
                data-ocid="food.checkout_button"
              >
                Checkout
              </Button>
            </div>
          </>
        )}

        {/* CHECKOUT */}
        {screen === "checkout" && (
          <>
            <SheetHeader className="p-5 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setScreen("cart")}
                  className="text-white/60 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-white">Checkout</SheetTitle>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-3">
                <span className="text-white/60 text-sm font-medium block">
                  Seat Location
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="seat-section-input"
                      className="text-white/40 text-xs"
                    >
                      Section
                    </label>
                    <Input
                      id="seat-section-input"
                      value={sectionNumber}
                      onChange={(e) => {
                        setSectionNumber(e.target.value);
                        setSeatValidationError(false);
                      }}
                      placeholder="103"
                      className={`bg-muted/30 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/60 ${
                        seatValidationError && !sectionNumber.trim()
                          ? "border-red-400/60"
                          : ""
                      }`}
                      data-ocid="food.seat_section_input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="seat-row-input"
                      className="text-white/40 text-xs"
                    >
                      Row
                    </label>
                    <Input
                      id="seat-row-input"
                      value={rowNumber}
                      onChange={(e) => {
                        setRowNumber(e.target.value);
                        setSeatValidationError(false);
                      }}
                      placeholder="5"
                      className={`bg-muted/30 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/60 ${
                        seatValidationError && !rowNumber.trim()
                          ? "border-red-400/60"
                          : ""
                      }`}
                      data-ocid="food.seat_row_input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="seat-number-input"
                      className="text-white/40 text-xs"
                    >
                      Seat
                    </label>
                    <Input
                      id="seat-number-input"
                      value={seatNumber}
                      onChange={(e) => {
                        setSeatNumber(e.target.value);
                        setSeatValidationError(false);
                      }}
                      placeholder="12"
                      className={`bg-muted/30 border-white/20 text-white placeholder:text-white/30 focus:border-cyan-400/60 ${
                        seatValidationError && !seatNumber.trim()
                          ? "border-red-400/60"
                          : ""
                      }`}
                      data-ocid="food.seat_number_input"
                    />
                  </div>
                </div>
                {seatValidationError && (
                  <p
                    className="text-red-400 text-xs"
                    data-ocid="food.seat_location.field_error"
                  >
                    Please enter your section, row, and seat number.
                  </p>
                )}
                {fullSeatLocation && (
                  <p className="text-white/40 text-xs">📍 {fullSeatLocation}</p>
                )}
              </div>
              <div className="space-y-2">
                <span className="text-white/60 text-sm font-medium block">
                  Fulfillment
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeliveryMethod(DeliveryMethod.Delivery)}
                    className={`border font-semibold ${
                      deliveryMethod === DeliveryMethod.Delivery
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                        : "border-white/20 bg-muted/30 text-muted-foreground"
                    }`}
                    data-ocid="food.delivery_toggle"
                  >
                    Delivery
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeliveryMethod(DeliveryMethod.Pickup)}
                    className={`border font-semibold ${
                      deliveryMethod === DeliveryMethod.Pickup
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                        : "border-white/20 bg-muted/30 text-muted-foreground"
                    }`}
                    data-ocid="food.pickup_toggle"
                  >
                    Pickup
                  </Button>
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wide">
                  Order Summary
                </p>
                {cartItems.map((i) => (
                  <div
                    key={i.menuItemId}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-white/70">
                      {i.itemName} ×{i.quantity}
                    </span>
                    <span className="text-white">
                      ${((i.priceCents * i.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-cyan-400">
                    ${(subtotalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border">
              <Button
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold py-5"
                disabled={placeOrder.isPending}
                onClick={handlePlaceOrder}
                data-ocid="food.place_order_button"
              >
                {placeOrder.isPending ? "Placing Order…" : "Place Order"}
              </Button>
            </div>
          </>
        )}

        {/* CONFIRMATION */}
        {screen === "confirmation" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
            <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Order Placed!
              </h2>
              <p className="text-white/50 text-sm">
                Order #{confirmOrderId.slice(-8).toUpperCase()}
              </p>
              {fullSeatLocation && (
                <p className="text-white/50 text-sm">📍 {fullSeatLocation}</p>
              )}
              <p className="text-white/40 text-xs mt-1">
                ⏱ 15–20 min estimated wait
              </p>
            </div>
            <Button
              className="w-full max-w-xs bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-semibold"
              variant="outline"
              onClick={() => {
                setTrackingOrderId(confirmOrderId);
                setScreen("tracking");
              }}
              data-ocid="food.track_order_button"
            >
              Track Order
            </Button>
          </div>
        )}

        {/* TRACKING */}
        {screen === "tracking" && (
          <>
            <SheetHeader className="p-5 pb-3 border-b border-border">
              <SheetTitle className="text-white">Order Status</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex flex-col p-6 gap-8">
              {/* Stepper */}
              <div className="flex items-start justify-between">
                {STATUS_STEPS.map((step, idx) => {
                  const active = statusIndex(trackingStatus);
                  const done = idx <= active;
                  const current = idx === active;
                  return (
                    <div
                      key={step.key}
                      className="relative flex flex-col items-center gap-2 flex-1"
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          done
                            ? current
                              ? "bg-cyan-400 text-black ring-2 ring-cyan-400/40"
                              : "bg-cyan-400/60 text-black"
                            : "bg-white/10 text-white/30"
                        }`}
                        data-ocid={`food.tracking_step.${idx + 1}`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-xs text-center leading-tight ${
                          done ? "text-white" : "text-white/30"
                        }`}
                      >
                        {step.label}
                      </span>
                      {/* connector line */}
                      {idx < STATUS_STEPS.length - 1 && (
                        <div
                          className={`absolute hidden sm:block h-0.5 w-full ${
                            idx < active ? "bg-cyan-400/60" : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center space-y-1">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                  Current Status
                </p>
                <p className="text-cyan-400 font-bold text-lg">
                  {String(trackingStatus)}
                </p>
                {fullSeatLocation && (
                  <p className="text-white/40 text-xs">📍 {fullSeatLocation}</p>
                )}
              </div>
              {(trackingStatus === OrderStatus.Placed ||
                (isDemoMode &&
                  DEMO_ACTIVE_ORDER.status === OrderStatus.Placed)) && (
                <Button
                  variant="outline"
                  className="border-red-400/40 text-red-400 hover:bg-red-400/10"
                  onClick={handleCancelOrder}
                  data-ocid="food.cancel_order_button"
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
