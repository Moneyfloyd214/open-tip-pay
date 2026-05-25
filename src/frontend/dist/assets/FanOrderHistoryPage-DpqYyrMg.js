import { j as jsxRuntimeExports, r as reactExports } from "./index-DgPXBAnq.js";
import { g as createLucideIcon, h as useBranding, u as useDemoMode, i as useGetMyOrders, j as DEMO_ACTIVE_ORDER, k as DeliveryMethod, O as OrderStatus, A as ArrowLeft, S as ShoppingBag, l as ue, m as DEMO_STANDS } from "./App-BpOiggIL.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
      key: "1a0edw"
    }
  ],
  ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }]
];
const Package = createLucideIcon("package", __iconNode);
const standNames = {
  "stand-1": "Lucas Oil Grill",
  "stand-2": "End Zone Bites",
  "stand-3": "Colts Fan Eats"
};
function getStandName(standId) {
  const demo = DEMO_STANDS.find((s) => s.id === standId);
  return (demo == null ? void 0 : demo.name) ?? standNames[standId] ?? standId;
}
function formatDate(ts) {
  const ms = Number(ts) < 1e13 ? Number(ts) * 1e3 : Number(ts);
  const d = new Date(ms > 0 ? ms : Date.now());
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).replace(",", " ·");
}
function calcTotal(items) {
  return items.reduce(
    (sum, i) => sum + Number(i.priceInCents) * Number(i.quantity),
    0
  );
}
function StatusBadge({ status }) {
  const cfg = {
    [OrderStatus.Completed]: {
      label: "Completed",
      cls: "bg-green-500/20 text-green-400 border border-green-500/30"
    },
    [OrderStatus.Cancelled]: {
      label: "Cancelled",
      cls: "bg-red-500/20 text-red-400 border border-red-500/30"
    },
    [OrderStatus.Placed]: {
      label: "Placed",
      cls: "bg-teal/20 text-teal border border-teal/30"
    },
    [OrderStatus.Preparing]: {
      label: "Preparing",
      cls: "bg-teal/20 text-teal border border-teal/30"
    },
    [OrderStatus.ReadyForPickup]: {
      label: "Ready for Pickup",
      cls: "bg-teal/20 text-teal border border-teal/30"
    },
    [OrderStatus.OnTheWay]: {
      label: "On the Way",
      cls: "bg-teal/20 text-teal border border-teal/30"
    }
  };
  const { label, cls } = cfg[status] ?? {
    label: String(status),
    cls: "bg-white/10 text-white/60 border border-border"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`, children: label });
}
const DEMO_HISTORY_ORDERS = [
  {
    id: "order-demo-2",
    status: OrderStatus.Completed,
    standId: "stand-1",
    seatNumber: "107A",
    deliveryMethod: DeliveryMethod.Delivery,
    createdAt: BigInt(Date.now() - 1e3 * 60 * 90),
    updatedAt: BigInt(Date.now() - 1e3 * 60 * 60),
    totalInCents: BigInt(1798),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-101",
        itemName: "Colts BBQ Brisket Sandwich",
        quantity: BigInt(1),
        priceInCents: BigInt(1099)
      },
      {
        itemId: "item-102",
        itemName: "Loaded Colts Nachos",
        quantity: BigInt(1),
        priceInCents: BigInt(699)
      }
    ]
  },
  {
    id: "order-demo-3",
    status: OrderStatus.Cancelled,
    standId: "stand-2",
    seatNumber: "221C",
    deliveryMethod: DeliveryMethod.Pickup,
    createdAt: BigInt(Date.now() - 1e3 * 60 * 60 * 3),
    updatedAt: BigInt(Date.now() - 1e3 * 60 * 60 * 3),
    totalInCents: BigInt(849),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-201",
        itemName: "End Zone Chili Dog",
        quantity: BigInt(1),
        priceInCents: BigInt(849)
      }
    ]
  },
  {
    id: "order-demo-4",
    status: OrderStatus.Completed,
    standId: "stand-3",
    seatNumber: "315B",
    deliveryMethod: DeliveryMethod.Delivery,
    createdAt: BigInt(Date.now() - 1e3 * 60 * 60 * 24),
    updatedAt: BigInt(Date.now() - 1e3 * 60 * 60 * 23),
    totalInCents: BigInt(2398),
    customerId: DEMO_ACTIVE_ORDER.customerId,
    items: [
      {
        itemId: "item-301",
        itemName: "Horseshoe Basket",
        quantity: BigInt(1),
        priceInCents: BigInt(999)
      },
      {
        itemId: "item-302",
        itemName: "Colts Fan Cheese Fries",
        quantity: BigInt(1),
        priceInCents: BigInt(649)
      },
      {
        itemId: "item-303",
        itemName: "Lucas Oil Lemonade (32 oz)",
        quantity: BigInt(1),
        priceInCents: BigInt(750)
      }
    ]
  }
];
function OrderCard({ order, index }) {
  const [expanded, setExpanded] = reactExports.useState(false);
  const statusKey = typeof order.status === "object" ? Object.keys(order.status)[0] : order.status;
  const deliveryKey = typeof order.deliveryMethod === "object" ? Object.keys(order.deliveryMethod)[0] : String(order.deliveryMethod);
  const total = calcTotal(order.items);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "bg-muted/30 backdrop-blur-xl border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:border-teal/20",
      "data-ocid": `order_history.item.${index + 1}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: "w-full text-left p-4 flex items-start justify-between gap-3",
            onClick: () => setExpanded((v) => !v),
            "data-ocid": `order_history.item.${index + 1}.toggle`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white text-sm", children: getStandName(order.standId) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: statusKey })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-xs", children: formatDate(order.createdAt) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/70 text-xs", children: [
                  order.items.length,
                  " item",
                  order.items.length !== 1 ? "s" : "",
                  " ·  ",
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-teal font-semibold", children: [
                    "$",
                    (total / 100).toFixed(2)
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 mt-1 text-white/40 text-lg leading-none select-none", children: expanded ? "▲" : "▼" })
            ]
          }
        ),
        expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 space-y-3 border-t border-border pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 text-xs text-white/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Seat ",
              order.seatNumber
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: deliveryKey === "delivery" ? "Seat Delivery" : "Pickup" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            order.items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex justify-between text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/80 min-w-0 truncate pr-2", children: [
                    item.itemName,
                    " × ",
                    Number(item.quantity)
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/60 shrink-0", children: [
                    "$",
                    (Number(item.priceInCents) * Number(item.quantity) / 100).toFixed(2)
                  ] })
                ]
              },
              item.itemId ?? i
            )),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm font-semibold pt-1.5 border-t border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-teal", children: [
                "$",
                (total / 100).toFixed(2)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "w-full mt-1 py-2 rounded-xl bg-teal/10 border border-teal/20 text-teal text-sm font-semibold hover:bg-teal/20 transition-colors",
              onClick: () => ue.info("Reorder coming soon!"),
              "data-ocid": `order_history.item.${index + 1}.reorder_button`,
              children: "Reorder"
            }
          )
        ] })
      ]
    }
  );
}
function FanOrderHistoryPage() {
  const { brandName, poweredByText } = useBranding();
  const { isDemoMode } = useDemoMode();
  const { data: liveOrders = [], isLoading } = useGetMyOrders();
  const rawOrders = isDemoMode ? [DEMO_ACTIVE_ORDER, ...DEMO_HISTORY_ORDERS] : liveOrders;
  const orders = [...rawOrders].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "pointer-events-none fixed inset-0 overflow-hidden",
        "aria-hidden": "true",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-teal/8 blur-[100px]" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 max-w-lg mx-auto px-4 pt-safe-top", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-4 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => window.history.back(),
            className: "flex items-center justify-center w-10 h-10 rounded-full bg-muted/30 hover:bg-white/10 text-white/70 hover:text-white transition-colors",
            "aria-label": "Back",
            "data-ocid": "order_history.back_button",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-5 w-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-white font-bold text-lg leading-tight", children: "Order History" }),
          poweredByText && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-teal/70 text-xs truncate", children: [
            brandName,
            " · ",
            poweredByText
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-5 w-5 text-teal/60" })
      ] }),
      isLoading && !isDemoMode ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" }) }) : orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "flex flex-col items-center justify-center py-24 gap-4 text-center",
          "data-ocid": "order_history.empty_state",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "h-8 w-8 text-white/30" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-semibold text-base", children: "No orders yet" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/45 text-sm mt-1", children: [
                "Tap ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-teal", children: "Order Food" }),
                " on your dashboard to get started"
              ] })
            ] })
          ]
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 pb-10", children: orders.map((order, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(OrderCard, { order, index: i }, order.id)) })
    ] })
  ] });
}
export {
  FanOrderHistoryPage as default
};
