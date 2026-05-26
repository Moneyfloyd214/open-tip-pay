import { r as reactExports, j as jsxRuntimeExports } from "./index-DrIOJRxg.js";
import { g as createLucideIcon, u as useDemoMode, h as useBranding, n as useUpdateOrderStatus, o as useGetActiveOrdersForManager, j as DEMO_ACTIVE_ORDER, m as DEMO_STANDS, R as RefreshCw, L as LogOut, O as OrderStatus, l as ue } from "./App-BuPOeQmh.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  [
    "path",
    {
      d: "M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z",
      key: "1qvrer"
    }
  ],
  ["path", { d: "M6 17h12", key: "1jwigz" }]
];
const ChefHat = createLucideIcon("chef-hat", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "m9 10 2 2 4-4", key: "1gnqz4" }],
  ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" }],
  ["path", { d: "M12 17v4", key: "1riwvh" }],
  ["path", { d: "M8 21h8", key: "1ev6f3" }]
];
const MonitorCheck = createLucideIcon("monitor-check", __iconNode);
const KDS_STANDS = [
  { id: "stand-1", name: "Lucas Oil Grill", pin: "1111" },
  { id: "stand-2", name: "End Zone Bites", pin: "2222" },
  { id: "stand-3", name: "Colts Fan Eats", pin: "3333" }
];
const activeStandIds = (() => {
  try {
    const raw = localStorage.getItem("demo_active_stands");
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
})();
const VISIBLE_KDS_STANDS = activeStandIds ? KDS_STANDS.filter((s) => activeStandIds.has(s.id)) : KDS_STANDS;
const SESSION_KEY = "kds_session";
const SESSION_TTL_MS = 4 * 60 * 60 * 1e3;
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}
function saveSession(standId) {
  const session = {
    standId,
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
const DEMO_EXTRA_ORDERS = [
  {
    id: "order-demo-2",
    status: "Placed",
    standId: "stand-2",
    createdAt: BigInt(Date.now() - 2 * 60 * 1e3),
    updatedAt: BigInt(Date.now() - 2 * 60 * 1e3),
    deliveryMethod: "Pickup",
    totalInCents: BigInt(1699),
    customerId: {
      _isPrincipal: true,
      toText: () => "demo-user-2",
      toUint8Array: () => new Uint8Array([1]),
      compareTo: () => 0
    },
    items: [
      {
        itemId: "item-201",
        itemName: "Nachos Supreme",
        quantity: BigInt(1),
        priceInCents: BigInt(1099)
      },
      {
        itemId: "item-203",
        itemName: "Garlic Fries",
        quantity: BigInt(1),
        priceInCents: BigInt(599)
      }
    ],
    seatNumber: "Section 114, Row F, Seat 8"
  },
  {
    id: "order-demo-3",
    status: "ReadyForPickup",
    standId: "stand-3",
    createdAt: BigInt(Date.now() - 8 * 60 * 1e3),
    updatedAt: BigInt(Date.now() - 3 * 60 * 1e3),
    deliveryMethod: "Delivery",
    totalInCents: BigInt(1748),
    customerId: {
      _isPrincipal: true,
      toText: () => "demo-user-3",
      toUint8Array: () => new Uint8Array([2]),
      compareTo: () => 0
    },
    items: [
      {
        itemId: "item-301",
        itemName: "Buffalo Wings (6pc)",
        quantity: BigInt(1),
        priceInCents: BigInt(1249)
      },
      {
        itemId: "item-303",
        itemName: "Fountain Drink",
        quantity: BigInt(2),
        priceInCents: BigInt(449)
      }
    ],
    seatNumber: "Section 118, Row 12, Seat 3"
  }
];
const STATUS_CONFIG = {
  placed: {
    label: "Placed",
    badge: "bg-yellow-500/25 text-yellow-300 border border-yellow-500/40",
    border: "border-yellow-500/50",
    next: "preparing",
    nextLabel: "Start Preparing"
  },
  preparing: {
    label: "Preparing",
    badge: "bg-orange-500/25 text-orange-300 border border-orange-500/40",
    border: "border-orange-500/50",
    next: "readyForPickup",
    nextLabel: "Mark Ready"
  },
  readyForPickup: {
    label: "Ready",
    badge: "bg-teal/25 text-teal border border-teal/40",
    border: "border-teal/50",
    next: "onTheWay",
    nextLabel: "Out for Delivery"
  },
  onTheWay: {
    label: "On the Way",
    badge: "bg-teal/25 text-teal border border-teal/40",
    border: "border-teal/50",
    next: void 0,
    nextLabel: void 0
  }
};
const ACTIVE_STATUSES = /* @__PURE__ */ new Set([
  "Placed",
  "Preparing",
  "ReadyForPickup",
  "OnTheWay"
]);
function getStatusKey(status) {
  if (status === OrderStatus.Placed) return "placed";
  if (status === OrderStatus.Preparing) return "preparing";
  if (status === OrderStatus.ReadyForPickup) return "readyForPickup";
  if (status === OrderStatus.OnTheWay) return "onTheWay";
  if (status === OrderStatus.Completed) return "completed";
  return "cancelled";
}
function getNextOrderStatus(key) {
  if (key === "placed") return OrderStatus.Preparing;
  if (key === "preparing") return OrderStatus.ReadyForPickup;
  if (key === "readyForPickup") return OrderStatus.OnTheWay;
  return null;
}
function formatTime(createdAt) {
  const ms = Number(createdAt);
  if (ms === 0) {
    return "Just now";
  }
  return new Date(ms / 1e6).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}
function OrderCard({
  order,
  index,
  onAdvance,
  isUpdating
}) {
  const statusKey = getStatusKey(order.status);
  const config = STATUS_CONFIG[statusKey];
  const nextStatus = getNextOrderStatus(statusKey);
  const isDelivery = order.deliveryMethod === "Delivery";
  const total = order.items.reduce(
    (sum, item) => sum + Number(
      item.priceInCents ?? item.priceCents ?? BigInt(0)
    ) * Number(item.quantity),
    0
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      "data-ocid": `kds.order.${index + 1}`,
      className: `bg-muted/30 backdrop-blur-xl border-2 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${(config == null ? void 0 : config.border) ?? "border-border"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "p",
              {
                className: "font-black text-white tracking-wide",
                style: { fontSize: "22px", lineHeight: 1.2 },
                children: [
                  "📍 ",
                  order.seatNumber
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/50 text-sm mt-1", children: [
              "Order #",
              order.id.slice(-4).toUpperCase(),
              " ·",
              " ",
              formatTime(order.createdAt)
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-2 shrink-0", children: [
            config && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: `rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${config.badge}`,
                children: config.label
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                "data-ocid": `kds.delivery_badge.${index + 1}`,
                className: `rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${isDelivery ? "bg-blue-500/20 text-blue-300 border-blue-500/40" : "bg-purple-500/20 text-purple-300 border-purple-500/40"}`,
                children: isDelivery ? "Delivery" : "Pickup"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: order.items.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/20 font-black text-teal",
              style: { fontSize: "18px" },
              children: [
                Number(item.quantity),
                "×"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "text-white font-semibold",
              style: { fontSize: "18px" },
              children: item.itemName
            }
          )
        ] }, item.itemId ?? i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/50 text-sm", children: [
            "Total: $",
            (total / 100).toFixed(2)
          ] }),
          nextStatus !== null && (config == null ? void 0 : config.nextLabel) && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-ocid": `kds.advance_button.${index + 1}`,
              disabled: isUpdating,
              onClick: () => onAdvance(order.id, nextStatus),
              className: "rounded-xl bg-teal px-5 py-2.5 font-bold text-navy shadow-lg shadow-teal/30 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-dark active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
              style: { fontSize: "16px" },
              children: config.nextLabel
            }
          ),
          !nextStatus && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-teal/70 text-sm font-semibold", children: "Awaiting pickup ✓" })
        ] })
      ]
    }
  );
}
function PINScreen({ onUnlock }) {
  const [selectedStand, setSelectedStand] = reactExports.useState(null);
  const [pin, setPin] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const inputRef = reactExports.useRef(null);
  const { brandName, poweredByText } = useBranding();
  reactExports.useEffect(() => {
    if (selectedStand && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedStand]);
  const handlePINDigit = (digit) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => {
        if (selectedStand && next === selectedStand.pin) {
          onUnlock(selectedStand.id);
        } else {
          setError("Incorrect PIN. Please try again.");
          setPin("");
        }
      }, 150);
    }
  };
  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };
  if (!selectedStand) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "pointer-events-none fixed inset-0 overflow-hidden",
          "aria-hidden": "true",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 w-full max-w-sm space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40 shadow-lg shadow-teal/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MonitorCheck, { className: "h-8 w-8 text-teal" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black text-white mt-4", children: brandName }),
          poweredByText && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-white/40", children: poweredByText }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-sm mt-2", children: "Kitchen Display System" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-sm text-center font-semibold uppercase tracking-wider", children: "Select your stand" }),
          VISIBLE_KDS_STANDS.map((stand) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              "data-ocid": `kds.stand_select.${stand.id}`,
              onClick: () => {
                setSelectedStand(stand);
                setPin("");
                setError("");
              },
              className: "w-full rounded-2xl bg-muted/30 backdrop-blur-xl border border-border hover:border-teal/40 hover:bg-teal/5 px-5 py-4 text-left transition-all duration-200 group",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-bold text-lg", children: stand.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-sm mt-0.5", children: "Tap to enter PIN" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-5 w-5 text-white/30 group-hover:text-teal transition-colors duration-200" })
              ] })
            },
            stand.id
          ))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-white/25 text-xs", children: "Session expires after 4 hours of inactivity" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "pointer-events-none fixed inset-0 overflow-hidden",
        "aria-hidden": "true",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-teal/10 blur-[120px]" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 w-full max-w-xs space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/20 border border-teal/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-8 w-8 text-teal" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl font-black text-white mt-4", children: selectedStand.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-sm", children: "Enter your 4-digit PIN" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center gap-4", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: `h-4 w-4 rounded-full transition-all duration-200 ${i < pin.length ? "bg-teal shadow-lg shadow-teal/50" : "bg-white/20"}`
        },
        i
      )) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-red-400 text-sm font-semibold animate-pulse", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": `kds.pin_digit.${d}`,
            onClick: () => handlePINDigit(d),
            className: "rounded-2xl bg-muted/30 border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-white font-bold text-2xl transition-all duration-150 active:scale-95",
            children: d
          },
          d
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": "kds.pin_back",
            onClick: () => {
              setSelectedStand(null);
              setPin("");
              setError("");
            },
            className: "rounded-2xl bg-muted/30 border border-border hover:border-white/30 py-5 text-white/50 font-semibold text-sm transition-all duration-150 active:scale-95",
            children: "‹ Back"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": "kds.pin_digit.0",
            onClick: () => handlePINDigit("0"),
            className: "rounded-2xl bg-muted/30 border border-border hover:border-teal/40 hover:bg-teal/10 py-5 text-white font-bold text-2xl transition-all duration-150 active:scale-95",
            children: "0"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            "data-ocid": "kds.pin_backspace",
            onClick: handleBackspace,
            className: "rounded-2xl bg-muted/30 border border-border hover:border-white/30 py-5 text-white/50 font-bold text-xl transition-all duration-150 active:scale-95",
            children: "⌫"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: inputRef,
          type: "text",
          inputMode: "none",
          className: "sr-only",
          "aria-label": "PIN entry",
          value: pin,
          readOnly: true
        }
      )
    ] })
  ] });
}
function KDSDisplay({
  standId,
  onLogout
}) {
  var _a;
  const { isDemoMode } = useDemoMode();
  const { brandName, poweredByText } = useBranding();
  const updateStatus = useUpdateOrderStatus();
  const [updatingId, setUpdatingId] = reactExports.useState(null);
  const {
    data: liveOrders = [],
    isRefetching,
    refetch
  } = useGetActiveOrdersForManager();
  const allOrders = reactExports.useMemo(() => {
    if (isDemoMode) {
      return [DEMO_ACTIVE_ORDER, ...DEMO_EXTRA_ORDERS];
    }
    return liveOrders.filter((o) => o.standId === standId);
  }, [isDemoMode, liveOrders, standId]);
  const activeOrders = reactExports.useMemo(
    () => allOrders.filter((o) => ACTIVE_STATUSES.has(getStatusKey(o.status))),
    [allOrders]
  );
  const stand = KDS_STANDS.find((s) => s.id === standId);
  const standName = isDemoMode ? ((_a = DEMO_STANDS.find((s) => s.id === standId)) == null ? void 0 : _a.name) ?? "Kitchen Display" : (stand == null ? void 0 : stand.name) ?? "Kitchen Display";
  const handleAdvance = async (orderId, nextSt) => {
    setUpdatingId(orderId);
    try {
      if (!isDemoMode) {
        await updateStatus.mutateAsync({ orderId, status: nextSt });
      }
      ue.success("Order updated!", { duration: 2e3 });
    } catch {
      ue.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };
  reactExports.useEffect(() => {
    if (isDemoMode) return;
    const interval = setInterval(() => {
      refetch();
    }, 3e3);
    return () => clearInterval(interval);
  }, [isDemoMode, refetch]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "pointer-events-none fixed inset-0 overflow-hidden",
        "aria-hidden": "true",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-teal/8 blur-[160px]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-teal/5 blur-[120px]" })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 bg-muted/30 backdrop-blur-xl border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-6 py-4 max-w-[1600px] mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/20 border border-teal/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-5 w-5 text-teal" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-2 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-black text-lg truncate", children: brandName }),
            poweredByText && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/35 text-xs hidden sm:inline", children: poweredByText })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/50 text-sm truncate", children: [
            standName,
            " · Kitchen Display"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          "data-ocid": "kds.order_count_badge",
          className: "flex items-center gap-2 rounded-xl bg-teal/15 border border-teal/30 px-4 py-2",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "text-2xl font-black text-teal",
                style: { fontSize: "24px" },
                children: activeOrders.length
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/60 text-sm font-semibold", children: [
              "active ",
              activeOrders.length === 1 ? "order" : "orders"
            ] })
          ]
        }
      ),
      isRefetching && /* @__PURE__ */ jsxRuntimeExports.jsx(
        RefreshCw,
        {
          className: "h-4 w-4 text-teal/60 animate-spin",
          "aria-label": "Refreshing"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          "data-ocid": "kds.logout_button",
          onClick: onLogout,
          className: "flex items-center gap-2 rounded-xl bg-muted/30 border border-border hover:border-red-500/40 hover:bg-red-500/10 px-4 py-2 text-white/60 hover:text-red-400 transition-all duration-200 text-sm font-semibold",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Exit" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 pt-6 pb-3 max-w-[1600px] mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "h1",
        {
          className: "font-black text-teal uppercase tracking-widest",
          style: { fontSize: "clamp(28px, 5vw, 48px)" },
          children: "Active Orders"
        }
      ),
      isDemoMode && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-yellow-400/70 text-sm mt-1", children: "Demo mode · All stands shown" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "px-6 pb-10 max-w-[1600px] mx-auto", children: activeOrders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        "data-ocid": "kds.empty_state",
        className: "flex flex-col items-center justify-center py-32 gap-6 text-center",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-20 w-20 items-center justify-center rounded-2xl bg-teal/10 border border-teal/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChefHat, { className: "h-10 w-10 text-teal/50" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 font-bold text-2xl", children: "No active orders" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/30 text-base mt-2", children: "Waiting for new orders — auto-refreshes every 3 seconds" })
          ] })
        ]
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "grid gap-5",
        style: {
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))"
        },
        children: activeOrders.map((order, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          OrderCard,
          {
            order,
            index: i,
            onAdvance: handleAdvance,
            isUpdating: updatingId === order.id
          },
          order.id
        ))
      }
    ) })
  ] });
}
function KitchenDisplayPage() {
  const { isDemoMode } = useDemoMode();
  const [session, setSession] = reactExports.useState(() => {
    if (isDemoMode)
      return { standId: "stand-1", expiresAt: Date.now() + SESSION_TTL_MS };
    return loadSession();
  });
  const handleUnlock = (standId) => {
    const newSession = saveSession(standId);
    setSession(newSession);
  };
  const handleLogout = () => {
    clearSession();
    setSession(null);
  };
  if (!session) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PINScreen, { onUnlock: handleUnlock });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(KDSDisplay, { standId: session.standId, onLogout: handleLogout });
}
export {
  KitchenDisplayPage as default
};
