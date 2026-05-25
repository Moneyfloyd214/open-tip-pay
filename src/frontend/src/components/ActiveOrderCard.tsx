import type { FoodOrder } from "@/backend";
import { OrderStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import {
  DEMO_ACTIVE_ORDER,
  DEMO_STANDS,
  useDemoMode,
} from "../context/DemoContext";
import { useGetMyOrders } from "../hooks/useQueries";

interface Props {
  onViewOrder: () => void;
}

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.Placed:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case OrderStatus.Preparing:
      return "bg-amber-400/20 text-amber-300 border-amber-400/30";
    case OrderStatus.ReadyForPickup:
      return "bg-green-500/20 text-green-300 border-green-500/30";
    case OrderStatus.OnTheWay:
      return "bg-cyan-400/20 text-cyan-300 border-cyan-400/30";
    default:
      return "bg-white/10 text-white/50 border-white/20";
  }
}

const DONE_STATUSES: OrderStatus[] = [
  OrderStatus.Completed,
  OrderStatus.Cancelled,
];

export default function ActiveOrderCard({ onViewOrder }: Props) {
  const { isDemoMode } = useDemoMode();
  const { data: myOrders = [] } = useGetMyOrders();

  let activeOrder: FoodOrder | null = null;

  if (isDemoMode) {
    activeOrder = DEMO_ACTIVE_ORDER;
  } else {
    activeOrder =
      myOrders.find((o) => !DONE_STATUSES.includes(o.status)) ?? null;
  }

  if (!activeOrder) return null;

  const standName = isDemoMode
    ? (DEMO_STANDS.find((s) => s.id === activeOrder!.standId)?.name ??
      "Your Order")
    : "Your Order";

  return (
    <div
      className="bg-white/5 backdrop-blur-xl border border-cyan-400/25 rounded-2xl p-4 flex items-center gap-3"
      data-ocid="food.active_order_card"
    >
      <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
        <Utensils className="h-5 w-5 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{standName}</p>
        <Badge
          className={`text-[10px] px-2 py-0 mt-1 border ${statusBadgeClass(
            activeOrder.status,
          )}`}
        >
          {String(activeOrder.status)}
        </Badge>
      </div>
      <Button
        size="sm"
        onClick={onViewOrder}
        className="flex-shrink-0 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/40 text-cyan-400 font-semibold"
        variant="outline"
        data-ocid="food.active_order.view_button"
      >
        View Order
      </Button>
    </div>
  );
}
