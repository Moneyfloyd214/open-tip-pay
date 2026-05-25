import { r as reactExports, j as jsxRuntimeExports } from "./index-DgPXBAnq.js";
import { R as RewardType, u as useDemoMode, a as useGetMyFanPoints, b as useListRewards, c as useGetMyRedeemedRewards, d as useRedeemReward, D as DEMO_PLAID_MERCHANTS, e as DEMO_POINTS_RULES, f as DEMO_POINT_TRANSACTIONS } from "./App-BpOiggIL.js";
const DEMO_REWARDS = [
  {
    id: "reward-1",
    title: "10% Colts Pro Shop Discount",
    description: "Save 10% on any merchandise at the Colts Pro Shop — valid this season",
    pointsCost: BigInt(250),
    rewardType: RewardType.discountCode,
    codeOrValue: "COLTS-SHOP-10",
    quantity: BigInt(100),
    quantityRemaining: BigInt(100),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  },
  {
    id: "reward-2",
    title: "Free Large Pepsi",
    description: "Complimentary large Pepsi at any Lucas Oil concession stand — sponsored by Pepsi",
    pointsCost: BigInt(150),
    rewardType: RewardType.concessionCredit,
    codeOrValue: "PEPSI-FREE-2026",
    quantity: BigInt(500),
    quantityRemaining: BigInt(500),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  },
  {
    id: "reward-3",
    title: "Free Hot Dog + Chips Combo",
    description: "One free hot dog and chips combo at any general concession stand",
    pointsCost: BigInt(200),
    rewardType: RewardType.concessionCredit,
    codeOrValue: "HOTDOG-COMBO",
    quantity: BigInt(300),
    quantityRemaining: BigInt(300),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  },
  {
    id: "reward-4",
    title: "Suite Level Upgrade Entry",
    description: "Enter to win a suite-level seat upgrade for an upcoming Colts home game",
    pointsCost: BigInt(800),
    rewardType: RewardType.ticketEntry,
    codeOrValue: "SUITE-UPGRADE",
    quantity: BigInt(20),
    quantityRemaining: BigInt(20),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  },
  {
    id: "reward-5",
    title: "Signed Colts Jersey Giveaway",
    description: "Enter for a chance to win an officially signed Colts player jersey",
    pointsCost: BigInt(1200),
    rewardType: RewardType.ticketEntry,
    codeOrValue: "JERSEY-WIN-2026",
    quantity: BigInt(10),
    quantityRemaining: BigInt(10),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  },
  {
    id: "reward-6",
    title: "VIP Field Experience Entry",
    description: "Enter to win an exclusive pre-game field access pass for one Colts home game",
    pointsCost: BigInt(2e3),
    rewardType: RewardType.other,
    codeOrValue: "VIP-FIELD-PASS",
    quantity: BigInt(5),
    quantityRemaining: BigInt(5),
    expiresAt: void 0,
    active: true,
    createdBy: { _isPrincipal: true, toText: () => "aaaaa-aa", toUint8Array: () => new Uint8Array([0]), compareTo: () => 0 },
    teamId: "colts"
  }
];
BigInt(Date.now()) * BigInt(1e6);
function FanPointsPage() {
  const { isDemoMode } = useDemoMode();
  const { data: fanPoints, isLoading: fanPointsLoading } = useGetMyFanPoints();
  const { data: rewardsRaw, isLoading: rewardsLoading } = useListRewards();
  const rewards = Array.isArray(rewardsRaw) ? rewardsRaw : isDemoMode ? DEMO_REWARDS : [];
  const { data: redeemedRaw, isLoading: redeemedLoading } = useGetMyRedeemedRewards();
  const redeemedRewards = Array.isArray(redeemedRaw) ? redeemedRaw : [];
  const redeemReward = useRedeemReward();
  const [selectedReward, setSelectedReward] = reactExports.useState(null);
  const [redeemedCode, setRedeemedCode] = reactExports.useState(null);
  const [redeemedRewardTitle, setRedeemedRewardTitle] = reactExports.useState(
    null
  );
  const [redeemedRewardType, setRedeemedRewardType] = reactExports.useState(
    null
  );
  const [copiedId, setCopiedId] = reactExports.useState(null);
  const [showEarnInfo, setShowEarnInfo] = reactExports.useState(false);
  const [demoPointsDeducted, setDemoPointsDeducted] = reactExports.useState(0);
  const [plaidTransactions, setPlaidTransactions] = reactExports.useState([]);
  const [plaidBonus, setPlaidBonus] = reactExports.useState(0);
  const intervalRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (localStorage.getItem("plaid_demo_connected") !== "true") return;
    const activeMerchants = DEMO_PLAID_MERCHANTS.filter((m) => m.isActive);
    const seedTransactions = [
      {
        id: "seed_1",
        merchantName: "Club Level Grill",
        amount: 14.5,
        multiplier: 2,
        pts: Number.parseFloat((14.5 * 2 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 12e4).toLocaleTimeString()
      },
      {
        id: "seed_2",
        merchantName: "End Zone Concessions",
        amount: 8.99,
        multiplier: 1.5,
        pts: Number.parseFloat((8.99 * 1.5 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 6e4).toLocaleTimeString()
      },
      {
        id: "seed_3",
        merchantName: "Gate A Snack Stand",
        amount: 5.49,
        multiplier: 1.25,
        pts: Number.parseFloat((5.49 * 1.25 * 1.25).toFixed(3)),
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      }
    ];
    const seedBonus = seedTransactions.reduce(
      (sum, tx) => Number.parseFloat((sum + tx.pts).toFixed(3)),
      0
    );
    setPlaidTransactions(seedTransactions);
    setPlaidBonus(seedBonus);
    if (activeMerchants.length === 0) return;
    intervalRef.current = setInterval(() => {
      const merchant = activeMerchants[Math.floor(Math.random() * activeMerchants.length)];
      const amount = Number.parseFloat((Math.random() * 25 + 3.99).toFixed(2));
      const pts = Number.parseFloat(
        (amount * merchant.multiplier * 1.25).toFixed(3)
      );
      const tx = {
        id: Date.now().toString(),
        merchantName: merchant.name,
        amount,
        multiplier: merchant.multiplier,
        pts,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
      };
      setPlaidTransactions((prev) => [tx, ...prev].slice(0, 20));
      setPlaidBonus((prev) => Number.parseFloat((prev + pts).toFixed(3)));
    }, 3e4);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  const isBackendLoading = !isDemoMode && (fanPointsLoading || rewardsLoading || redeemedLoading);
  const basePoints = isDemoMode ? 127.625 : (fanPoints == null ? void 0 : fanPoints.points) ?? 0;
  const points = Number.parseFloat(
    (basePoints + plaidBonus - demoPointsDeducted).toFixed(3)
  );
  const totalEarned = isDemoMode ? 342.875 : (fanPoints == null ? void 0 : fanPoints.totalEarned) ?? 0;
  const totalRedeemed = isDemoMode ? 215.25 : (fanPoints == null ? void 0 : fanPoints.totalRedeemed) ?? 0;
  const recentTransactions = isDemoMode ? [...DEMO_POINT_TRANSACTIONS].slice(-10).reverse() : [];
  const handleRedeem = async () => {
    if (!selectedReward) return;
    const costNum = Number(selectedReward.pointsCost);
    try {
      const result = await redeemReward.mutateAsync(selectedReward.id);
      if (result && typeof result === "object" && "ok" in result) {
        const ok = result.ok;
        setRedeemedCode(ok.codeOrValue);
        setRedeemedRewardTitle(selectedReward.title);
        setRedeemedRewardType(selectedReward.rewardType);
        if (isDemoMode) {
          setDemoPointsDeducted(
            (prev) => Number.parseFloat((prev + costNum).toFixed(3))
          );
        }
        setSelectedReward(null);
      }
    } catch (e) {
      console.error("Redeem failed", e);
    }
  };
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).catch(() => {
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2e3);
  };
  const rewardTypeIcon = (reward) => {
    const title = reward.title.toLowerCase();
    if (reward.rewardType === "discountCode") return "👕";
    if (reward.rewardType === "concessionCredit") {
      if (title.includes("pepsi") || title.includes("drink") || title.includes("beverage"))
        return "🥤";
      return "🌭";
    }
    if (reward.rewardType === "ticketEntry") {
      if (title.includes("suite") || title.includes("upgrade") || title.includes("ticket"))
        return "🏟️";
      return "🏆";
    }
    return "⭐";
  };
  if (isBackendLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "min-h-screen bg-background flex flex-col items-center justify-center gap-4",
        "data-ocid": "fan_points.loading_state",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex h-10 w-10 items-center justify-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-2 border-[#00e5cc]/15" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-2 border-transparent border-t-[#00e5cc] animate-spin" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-sm", children: "Loading Fan Points…" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "min-h-screen bg-background p-4 pb-24",
      "data-ocid": "fan_points.page",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-lg mx-auto space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-6 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#f59e0b]", children: "⭐" }),
            " Fan Points"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "bg-muted/30 backdrop-blur-md border border-[#f59e0b]/30 rounded-2xl p-6 relative overflow-hidden",
              style: { boxShadow: "0 0 30px rgba(245,158,11,0.15)" },
              "data-ocid": "fanpoints.card",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-sm mb-1", children: "Your Points Balance" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-5xl font-bold text-[#f59e0b]", children: points.toFixed(3) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/40 text-xs mt-3", children: [
                  "Total earned: ",
                  totalEarned.toFixed(3),
                  " · Total redeemed:",
                  " ",
                  totalRedeemed.toFixed(3)
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 inline-block bg-[#00e5cc]/10 border border-[#00e5cc]/30 rounded-full px-3 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#00e5cc] text-xs font-medium", children: "Earn points on every payment" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/30 backdrop-blur-md border border-border rounded-xl overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setShowEarnInfo(!showEarnInfo),
                className: "w-full flex items-center justify-between px-5 py-4 text-white font-semibold",
                "data-ocid": "fanpoints.earn-info-toggle",
                children: [
                  "How to Earn Points",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/40", children: showEarnInfo ? "&#9650;" : "&#9660;" })
                ]
              }
            ),
            showEarnInfo && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-5 pb-4 space-y-2 border-t border-border", children: isDemoMode ? DEMO_POINTS_RULES.filter((r) => r.isActive).map((rule) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#f59e0b] text-lg", children: "⭐" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 text-sm block", children: rule.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/50 text-xs", children: [
                  rule.description,
                  " — ",
                  rule.multiplier,
                  "x multiplier"
                ] })
              ] })
            ] }, rule.id)) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#f59e0b] text-lg", children: "💰" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 text-sm", children: "$1 sent = 10 Fan Points" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#f59e0b] text-lg", children: "📱" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 text-sm", children: "Scan any stadium QR code to earn bonus points" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 py-2 opacity-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "⬇️" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 text-sm", children: "Download the app for 50 bonus points (coming soon)" })
              ] })
            ] }) })
          ] }),
          plaidTransactions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "fanpoints.linked-card-activity.section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-white font-semibold text-lg mb-3 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400", children: "●" }),
              " Linked Card Activity"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: plaidTransactions.map((tx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "bg-muted/30 border border-green-500/20 rounded-xl p-3",
                "data-ocid": `fanpoints.linked-card-activity.item.${tx.id}`,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 text-sm font-medium truncate", children: tx.merchantName }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-0.5 flex-wrap", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/40 text-xs", children: [
                        "$",
                        tx.amount.toFixed(2)
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-400/70 text-xs", children: [
                        tx.multiplier,
                        "x multiplier"
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/30 text-xs", children: tx.timestamp })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-green-400 font-bold text-sm shrink-0", children: [
                    "+",
                    tx.pts.toFixed(3),
                    " pts"
                  ] })
                ] })
              },
              tx.id
            )) })
          ] }),
          recentTransactions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "fanpoints.earned-history.section", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-semibold text-lg mb-3", children: "How You Earned These Points" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: recentTransactions.map((tx) => {
              const badgeClass = tx.type === "Tip" ? "bg-[#00e5cc]/20 text-[#00e5cc]" : tx.type === "Food" ? "bg-amber-500/20 text-amber-400" : "bg-purple-500/20 text-purple-400";
              return /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "bg-muted/30 border border-border rounded-xl p-3",
                  "data-ocid": `fanpoints.earned-history.item.${tx.id}`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/40 text-xs shrink-0", children: tx.date }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "span",
                          {
                            className: `text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`,
                            children: tx.type
                          }
                        ),
                        tx.isGameDay && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded-full shrink-0", children: "🏈 Game Day" }),
                        tx.isFirstPayment && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0", children: "⭐ First Payment" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 text-sm mt-1 truncate", children: tx.description }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[#00e5cc]/80 text-xs mt-1", children: tx.breakdown }),
                      tx.sectionName && (() => {
                        const sectionRule = tx.appliedRules.find(
                          (r) => r.sectionName === tx.sectionName
                        );
                        return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-block mt-1 text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded-full", children: [
                          tx.sectionName,
                          " Section",
                          sectionRule ? ` — ${sectionRule.multiplier}x` : ""
                        ] });
                      })()
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[#00e5cc] font-bold text-sm", children: [
                      "+",
                      tx.finalPoints.toFixed(3),
                      " pts"
                    ] }) })
                  ] })
                },
                tx.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-bold text-lg mb-3", children: "Available Rewards" }),
            rewards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "bg-muted/30 border border-border rounded-xl p-8 text-center",
                "data-ocid": "fanpoints.rewards.empty_state",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40", children: "No rewards available yet" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/20 text-sm mt-1", children: "Check back after the next game!" })
                ]
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "fanpoints.rewards.list", children: rewards.map((reward, idx) => {
              const costNum = Number(reward.pointsCost);
              const displayState = (() => {
                if (!reward.active) return "unavailable";
                if (reward.quantityRemaining !== void 0 && reward.quantityRemaining !== null && reward.quantityRemaining === 0n)
                  return "soldout";
                return "available";
              })();
              const canRedeem = points >= costNum && displayState === "available";
              const pointsNeeded = costNum - points;
              const qtyLeft = reward.quantityRemaining != null ? Number(reward.quantityRemaining) : null;
              const isLowStock = qtyLeft != null && qtyLeft > 0 && qtyLeft < 50;
              const isSponsored = reward.title.toLowerCase().includes("pepsi");
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `bg-muted/30 backdrop-blur-md border rounded-xl p-4 flex items-start gap-4 transition-all ${displayState !== "available" ? "border-border opacity-70" : canRedeem ? "border-[#00e5cc]/30 hover:border-[#00e5cc]/60" : "border-border"}`,
                  "data-ocid": `fanpoints.rewards.item.${idx + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl mt-0.5", children: rewardTypeIcon(reward) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 flex-wrap", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white font-semibold text-sm leading-snug", children: reward.title }),
                        isSponsored && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[#00e5cc] text-[10px] font-bold border border-[#00e5cc]/50 px-1.5 py-0.5 rounded-full uppercase tracking-wide", children: "Sponsored" }),
                        displayState === "soldout" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-amber-400 text-[10px] font-bold bg-amber-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide", children: "Sold Out" }),
                        displayState === "unavailable" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-white/40 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide", children: "Unavailable" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-xs mt-1 line-clamp-2", children: reward.description }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-2 flex-wrap", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "bg-[#00e5cc]/15 text-[#00e5cc] text-xs font-bold px-2.5 py-1 rounded-full", children: [
                          costNum.toLocaleString(),
                          " pts"
                        ] }),
                        qtyLeft != null && qtyLeft > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "span",
                          {
                            className: `text-xs px-2 py-0.5 rounded-full font-medium ${isLowStock ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/40"}`,
                            children: [
                              qtyLeft,
                              " left"
                            ]
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "shrink-0 flex flex-col items-end gap-1 mt-0.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => displayState === "available" && setSelectedReward(reward),
                          disabled: !canRedeem,
                          "data-ocid": `fanpoints.rewards.redeem_button.${idx + 1}`,
                          className: `px-4 py-2 rounded-xl text-sm font-bold transition-all ${canRedeem ? "bg-[#00e5cc] text-[#0a0e1a] hover:bg-[#00e5cc]/90 shadow-[0_0_12px_rgba(0,229,204,0.3)]" : displayState !== "available" ? "bg-muted/30 text-white/20 cursor-not-allowed opacity-50" : "bg-muted/30 text-white/20 cursor-not-allowed"}`,
                          children: displayState === "soldout" ? "Sold Out" : displayState === "unavailable" ? "Unavailable" : "Redeem"
                        }
                      ),
                      displayState === "available" && !canRedeem && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-white/30 text-[10px] text-right", children: [
                        "Need ",
                        pointsNeeded.toFixed(1),
                        " more pts"
                      ] })
                    ] })
                  ]
                },
                reward.id
              );
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-bold text-lg mb-3", children: "My Redeemed Rewards" }),
            redeemedRewards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "bg-muted/30 border border-border rounded-xl p-6 text-center",
                "data-ocid": "fanpoints.redeemed.empty_state",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-sm", children: "No rewards redeemed yet" })
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", "data-ocid": "fanpoints.redeemed.list", children: redeemedRewards.map((rr, idx) => {
              const redeemedDate = new Date(
                Number(rr.redeemedAt) / 1e6
              );
              const friendlyDate = redeemedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              });
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "bg-muted/30 border border-[#00e5cc]/20 rounded-xl p-4",
                  "data-ocid": `fanpoints.redeemed.item.${idx + 1}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-semibold text-sm", children: rr.rewardTitle }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/30 text-xs shrink-0 ml-2", children: friendlyDate })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-[#0a0e1a] border border-[#00e5cc]/40 rounded-lg px-3 py-2.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[#00e5cc] text-base font-mono font-bold flex-1 tracking-wider", children: rr.codeOrValue }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => copyToClipboard(rr.codeOrValue, rr.id),
                          "data-ocid": `fanpoints.redeemed.copy_button.${idx + 1}`,
                          className: "shrink-0 flex items-center gap-1 text-[#00e5cc]/70 hover:text-[#00e5cc] transition-colors text-xs font-medium",
                          "aria-label": "Copy code",
                          children: copiedId === rr.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(
                              "svg",
                              {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                strokeWidth: 2.5,
                                "aria-hidden": "true",
                                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                  "path",
                                  {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    d: "M5 13l4 4L19 7"
                                  }
                                )
                              }
                            ),
                            "Copied!"
                          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(
                              "svg",
                              {
                                className: "w-3.5 h-3.5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                strokeWidth: 2,
                                "aria-hidden": "true",
                                children: [
                                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                                    "rect",
                                    {
                                      x: "9",
                                      y: "9",
                                      width: "13",
                                      height: "13",
                                      rx: "2",
                                      ry: "2"
                                    }
                                  ),
                                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
                                ]
                              }
                            ),
                            "Copy"
                          ] })
                        }
                      )
                    ] })
                  ]
                },
                rr.id
              );
            }) })
          ] })
        ] }),
        selectedReward && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4",
            "data-ocid": "fanpoints.confirm-redeem.dialog",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white font-bold text-lg", children: "Confirm Redemption" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white/70", children: [
                "Redeem",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-white", children: selectedReward.title }),
                " for",
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-[#f59e0b]", children: [
                  Number(selectedReward.pointsCost).toLocaleString(),
                  " points"
                ] }),
                "?"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSelectedReward(null),
                    "data-ocid": "fanpoints.confirm-redeem.cancel_button",
                    className: "flex-1 border border-white/20 text-white/70 py-3 rounded-xl",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleRedeem,
                    disabled: redeemReward.isPending,
                    "data-ocid": "fanpoints.confirm-redeem.confirm_button",
                    className: "flex-1 bg-[#00e5cc] text-[#0a0e1a] font-bold py-3 rounded-xl",
                    children: redeemReward.isPending ? "Processing..." : "Confirm"
                  }
                )
              ] })
            ] })
          }
        ),
        redeemedCode && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4",
            "data-ocid": "fanpoints.reward-unlocked.dialog",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "bg-card border border-[#00e5cc]/30 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center",
                style: { boxShadow: "0 0 40px rgba(0,229,204,0.15)" },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-[#00e5cc]/15 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-8 h-8 text-[#00e5cc]",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      stroke: "currentColor",
                      strokeWidth: 2.5,
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          d: "M5 13l4 4L19 7"
                        }
                      )
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white font-bold text-xl", children: "Reward Unlocked! 🎉" }),
                    redeemedRewardTitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-sm mt-1", children: redeemedRewardTitle })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#0a0e1a] border border-[#00e5cc]/50 rounded-xl p-4 text-left", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/40 text-xs mb-2 uppercase tracking-wider", children: "Your code" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[#00e5cc] text-2xl font-mono font-bold block tracking-widest", children: redeemedCode }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => copyToClipboard(redeemedCode, "success"),
                        "data-ocid": "fanpoints.reward-unlocked.copy_button",
                        className: "mt-3 flex items-center gap-1.5 text-[#00e5cc]/70 hover:text-[#00e5cc] text-sm transition-colors",
                        children: copiedId === "success" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            "svg",
                            {
                              className: "w-4 h-4",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              stroke: "currentColor",
                              strokeWidth: 2.5,
                              "aria-hidden": "true",
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                                "path",
                                {
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                  d: "M5 13l4 4L19 7"
                                }
                              )
                            }
                          ),
                          "Copied!"
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "svg",
                            {
                              className: "w-4 h-4",
                              fill: "none",
                              viewBox: "0 0 24 24",
                              stroke: "currentColor",
                              strokeWidth: 2,
                              "aria-hidden": "true",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
                              ]
                            }
                          ),
                          "Tap to copy"
                        ] })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-2.5 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[#f59e0b]/90 text-xs", children: redeemedRewardType === "ticketEntry" ? "🏆 Your entry has been recorded — winner announced after the game" : "🎫 Show this code at the register or gate — valid for one use only" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setRedeemedCode(null);
                        setRedeemedRewardTitle(null);
                        setRedeemedRewardType(null);
                      },
                      "data-ocid": "fanpoints.reward-unlocked.close_button",
                      className: "w-full bg-[#00e5cc]/10 border border-[#00e5cc]/30 text-[#00e5cc] font-semibold py-3 rounded-xl hover:bg-[#00e5cc]/20 transition-colors",
                      children: "Done"
                    }
                  )
                ]
              }
            )
          }
        )
      ]
    }
  );
}
export {
  FanPointsPage,
  FanPointsPage as default
};
