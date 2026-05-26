import { useEffect, useRef, useState } from "react";
import {
  DEMO_PLAID_MERCHANTS,
  DEMO_POINTS_RULES,
  DEMO_POINT_TRANSACTIONS,
  useDemoMode,
} from "../context/DemoContext";
import {
  useGetMyFanPoints,
  useGetMyRedeemedRewards,
  useListRewards,
  useRedeemReward,
} from "../hooks/useQueries";
import { DEMO_REWARDS } from "../mocks/backend";
import type { Reward } from "../types/fanpoints";

export function FanPointsPage() {
  const { isDemoMode } = useDemoMode();
  const { data: fanPoints, isLoading: fanPointsLoading } = useGetMyFanPoints();
  const { data: rewardsRaw, isLoading: rewardsLoading } =
    useListRewards(undefined);
  const rewards: Reward[] = Array.isArray(rewardsRaw)
    ? (rewardsRaw as Reward[])
    : isDemoMode
      ? (DEMO_REWARDS as unknown as Reward[])
      : [];
  const { data: redeemedRaw, isLoading: redeemedLoading } =
    useGetMyRedeemedRewards();
  const redeemedRewards = Array.isArray(redeemedRaw) ? redeemedRaw : [];
  const redeemReward = useRedeemReward();

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [redeemedRewardTitle, setRedeemedRewardTitle] = useState<string | null>(
    null,
  );
  const [redeemedRewardType, setRedeemedRewardType] = useState<string | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEarnInfo, setShowEarnInfo] = useState(false);
  const [demoPointsDeducted, setDemoPointsDeducted] = useState(0);

  type PlaidTransaction = {
    id: string;
    merchantName: string;
    amount: number;
    multiplier: number;
    pts: number;
    timestamp: string;
  };

  const [plaidTransactions, setPlaidTransactions] = useState<
    PlaidTransaction[]
  >([]);
  const [plaidBonus, setPlaidBonus] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (localStorage.getItem("plaid_demo_connected") !== "true") return;
    const activeMerchants = DEMO_PLAID_MERCHANTS.filter((m) => m.isActive);

    // Seed 3 initial transactions immediately so the Linked Card Activity
    // section is visible on first load without waiting 30 seconds.
    const seedTransactions: PlaidTransaction[] = [
      {
        id: "seed_1",
        merchantName: "Lucas Oil Valet",
        amount: 25.0,
        multiplier: 1.0,
        pts: Number.parseFloat((25.0 * 1.0 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      },
      {
        id: "seed_2",
        merchantName: "Seat Upgrade Kiosk",
        amount: 45.0,
        multiplier: 1.25,
        pts: Number.parseFloat((45.0 * 1.25 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 480000).toLocaleTimeString(),
      },
      {
        id: "seed_3",
        merchantName: "Colts Team Store",
        amount: 68.99,
        multiplier: 2.0,
        pts: Number.parseFloat((68.99 * 2.0 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 360000).toLocaleTimeString(),
      },
      {
        id: "seed_4",
        merchantName: "Field Level Bar",
        amount: 18.5,
        multiplier: 2.5,
        pts: Number.parseFloat((18.5 * 2.5 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 240000).toLocaleTimeString(),
      },
      {
        id: "seed_5",
        merchantName: "Club Level Restaurant",
        amount: 32.0,
        multiplier: 2.0,
        pts: Number.parseFloat((32.0 * 2.0 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      },
      {
        id: "seed_6",
        merchantName: "Event Parking Lot B (VIP)",
        amount: 40.0,
        multiplier: 1.0,
        pts: Number.parseFloat((40.0 * 1.0 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      },
      {
        id: "seed_7",
        merchantName: "End Zone Concessions",
        amount: 8.99,
        multiplier: 1.5,
        pts: Number.parseFloat((8.99 * 1.5 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 90000).toLocaleTimeString(),
      },
      {
        id: "seed_8",
        merchantName: "Halftime Zone Bar",
        amount: 14.0,
        multiplier: 1.75,
        pts: Number.parseFloat((14.0 * 1.75 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
      },
      {
        id: "seed_9",
        merchantName: "Stadium Gift Shop",
        amount: 22.5,
        multiplier: 1.5,
        pts: Number.parseFloat((22.5 * 1.5 * 1.25).toFixed(3)),
        timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      },
      {
        id: "seed_10",
        merchantName: "Gate A Snack Stand",
        amount: 5.49,
        multiplier: 1.25,
        pts: Number.parseFloat((5.49 * 1.25 * 1.25).toFixed(3)),
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
    const seedBonus = seedTransactions.reduce(
      (sum, tx) => Number.parseFloat((sum + tx.pts).toFixed(3)),
      0,
    );
    setPlaidTransactions(seedTransactions);
    setPlaidBonus(seedBonus);

    if (activeMerchants.length === 0) return;
    intervalRef.current = setInterval(() => {
      const merchant =
        activeMerchants[Math.floor(Math.random() * activeMerchants.length)];
      const amount = Number.parseFloat((Math.random() * 25 + 3.99).toFixed(2));
      const pts = Number.parseFloat(
        (amount * merchant.multiplier * 1.25).toFixed(3),
      );
      const tx: PlaidTransaction = {
        id: Date.now().toString(),
        merchantName: merchant.name,
        amount,
        multiplier: merchant.multiplier,
        pts,
        timestamp: new Date().toLocaleTimeString(),
      };
      setPlaidTransactions((prev) => [tx, ...prev].slice(0, 20));
      setPlaidBonus((prev) => Number.parseFloat((prev + pts).toFixed(3)));
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isBackendLoading =
    !isDemoMode && (fanPointsLoading || rewardsLoading || redeemedLoading);

  const basePoints = isDemoMode ? 127.625 : (fanPoints?.points ?? 0);
  const points = Number.parseFloat(
    (basePoints + plaidBonus - demoPointsDeducted).toFixed(3),
  );
  const totalEarned = isDemoMode ? 342.875 : (fanPoints?.totalEarned ?? 0);
  const totalRedeemed = isDemoMode ? 215.25 : (fanPoints?.totalRedeemed ?? 0);
  const recentTransactions = isDemoMode
    ? [...DEMO_POINT_TRANSACTIONS].slice(-10).reverse()
    : [];

  const handleRedeem = async () => {
    if (!selectedReward) return;
    const costNum = Number(selectedReward.pointsCost);
    try {
      const result = await redeemReward.mutateAsync(selectedReward.id);
      if (result && typeof result === "object" && "ok" in result) {
        const ok = (result as { ok: { codeOrValue: string } }).ok;
        setRedeemedCode(ok.codeOrValue);
        setRedeemedRewardTitle(selectedReward.title);
        setRedeemedRewardType(selectedReward.rewardType);
        if (isDemoMode) {
          setDemoPointsDeducted((prev) =>
            Number.parseFloat((prev + costNum).toFixed(3)),
          );
        }
        setSelectedReward(null);
      }
    } catch (e) {
      console.error("Redeem failed", e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const rewardTypeIcon = (reward: Reward) => {
    const title = reward.title.toLowerCase();
    if (reward.rewardType === "discountCode") return "👕";
    if (reward.rewardType === "concessionCredit") {
      if (
        title.includes("pepsi") ||
        title.includes("drink") ||
        title.includes("beverage")
      )
        return "🥤";
      return "🌭";
    }
    if (reward.rewardType === "ticketEntry") {
      if (
        title.includes("suite") ||
        title.includes("upgrade") ||
        title.includes("ticket")
      )
        return "🏟️";
      return "🏆";
    }
    return "⭐";
  };

  if (isBackendLoading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
        data-ocid="fan_points.loading_state"
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#00e5cc]/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00e5cc] animate-spin" />
        </div>
        <p className="text-white/50 text-sm">Loading Fan Points…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background p-4 pb-24"
      data-ocid="fan_points.page"
    >
      <div className="max-w-lg mx-auto space-y-5">
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-[#f59e0b]">&#11088;</span> Fan Points
          </h1>
        </div>

        <div
          className="bg-muted/30 backdrop-blur-md border border-[#f59e0b]/30 rounded-2xl p-6 relative overflow-hidden"
          style={{ boxShadow: "0 0 30px rgba(245,158,11,0.15)" }}
          data-ocid="fanpoints.card"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/5 rounded-full -translate-y-8 translate-x-8 pointer-events-none" />
          <p className="text-white/50 text-sm mb-1">Your Points Balance</p>
          <p className="text-5xl font-bold text-[#f59e0b]">
            {points.toFixed(3)}
          </p>
          <p className="text-white/40 text-xs mt-3">
            Total earned: {totalEarned.toFixed(3)} &middot; Total redeemed:{" "}
            {totalRedeemed.toFixed(3)}
          </p>
          <div className="mt-3 inline-block bg-[#00e5cc]/10 border border-[#00e5cc]/30 rounded-full px-3 py-1">
            <span className="text-[#00e5cc] text-xs font-medium">
              Earn points on every payment
            </span>
          </div>
        </div>

        <div className="bg-muted/30 backdrop-blur-md border border-border rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEarnInfo(!showEarnInfo)}
            className="w-full flex items-center justify-between px-5 py-4 text-white font-semibold"
            data-ocid="fanpoints.earn-info-toggle"
          >
            How to Earn Points
            <span className="text-white/40">
              {showEarnInfo ? "&#9650;" : "&#9660;"}
            </span>
          </button>
          {showEarnInfo && (
            <div className="px-5 pb-4 space-y-2 border-t border-border">
              {isDemoMode ? (
                DEMO_POINTS_RULES.filter((r) => r.isActive).map((rule) => (
                  <div key={rule.id} className="flex items-center gap-3 py-2">
                    <span className="text-[#f59e0b] text-lg">&#11088;</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white/80 text-sm block">
                        {rule.name}
                      </span>
                      <span className="text-white/50 text-xs">
                        {rule.description} — {rule.multiplier}x multiplier
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[#f59e0b] text-lg">&#128176;</span>
                    <span className="text-white/80 text-sm">
                      $1 sent = 10 Fan Points
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[#f59e0b] text-lg">&#128241;</span>
                    <span className="text-white/80 text-sm">
                      Scan any stadium QR code to earn bonus points
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2 opacity-50">
                    <span className="text-lg">&#11015;&#65039;</span>
                    <span className="text-white/80 text-sm">
                      Download the app for 50 bonus points (coming soon)
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {plaidTransactions.length > 0 && (
          <div data-ocid="fanpoints.linked-card-activity.section">
            <h2 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-green-400">&#9679;</span> Linked Card
              Activity
            </h2>
            <div className="space-y-2">
              {plaidTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-muted/30 border border-green-500/20 rounded-xl p-3"
                  data-ocid={`fanpoints.linked-card-activity.item.${tx.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">
                        {tx.merchantName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-white/40 text-xs">
                          ${tx.amount.toFixed(2)}
                        </span>
                        <span className="text-green-400/70 text-xs">
                          {tx.multiplier}x multiplier
                        </span>
                        <span className="text-white/30 text-xs">
                          {tx.timestamp}
                        </span>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-sm shrink-0">
                      +{tx.pts.toFixed(3)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentTransactions.length > 0 && (
          <div data-ocid="fanpoints.earned-history.section">
            <h2 className="text-white font-semibold text-lg mb-3">
              How You Earned These Points
            </h2>
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const badgeClass =
                  tx.type === "Tip"
                    ? "bg-[#00e5cc]/20 text-[#00e5cc]"
                    : tx.type === "Food"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-purple-500/20 text-purple-400";
                return (
                  <div
                    key={tx.id}
                    className="bg-muted/30 border border-border rounded-xl p-3"
                    data-ocid={`fanpoints.earned-history.item.${tx.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white/40 text-xs shrink-0">
                            {tx.date}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${badgeClass}`}
                          >
                            {tx.type}
                          </span>
                          {tx.isGameDay && (
                            <span className="text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded-full shrink-0">
                              🏈 Game Day
                            </span>
                          )}
                          {tx.isFirstPayment && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">
                              ⭐ First Payment
                            </span>
                          )}
                        </div>
                        <p className="text-white/80 text-sm mt-1 truncate">
                          {tx.description}
                        </p>
                        <p className="text-[#00e5cc]/80 text-xs mt-1">
                          {tx.breakdown}
                        </p>
                        {tx.sectionName &&
                          (() => {
                            const sectionRule = tx.appliedRules.find(
                              (r) => r.sectionName === tx.sectionName,
                            );
                            return (
                              <span className="inline-block mt-1 text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-0.5 rounded-full">
                                {tx.sectionName} Section
                                {sectionRule
                                  ? ` — ${sectionRule.multiplier}x`
                                  : ""}
                              </span>
                            );
                          })()}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[#00e5cc] font-bold text-sm">
                          +{tx.finalPoints.toFixed(3)} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-white font-bold text-lg mb-3">
            Available Rewards
          </h2>
          {rewards.length === 0 ? (
            <div
              className="bg-muted/30 border border-border rounded-xl p-8 text-center"
              data-ocid="fanpoints.rewards.empty_state"
            >
              <p className="text-white/40">No rewards available yet</p>
              <p className="text-white/20 text-sm mt-1">
                Check back after the next game!
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="fanpoints.rewards.list">
              {rewards.map((reward, idx) => {
                const costNum = Number(reward.pointsCost);
                const displayState = (() => {
                  if (!reward.active) return "unavailable";
                  if (
                    reward.quantityRemaining !== undefined &&
                    reward.quantityRemaining !== null &&
                    reward.quantityRemaining === 0n
                  )
                    return "soldout";
                  return "available";
                })();
                const canRedeem =
                  points >= costNum && displayState === "available";
                const pointsNeeded = costNum - points;
                const qtyLeft =
                  reward.quantityRemaining != null
                    ? Number(reward.quantityRemaining)
                    : null;
                const isLowStock =
                  qtyLeft != null && qtyLeft > 0 && qtyLeft < 50;
                const isSponsored = reward.title
                  .toLowerCase()
                  .includes("pepsi");
                return (
                  <div
                    key={reward.id}
                    className={`bg-muted/30 backdrop-blur-md border rounded-xl p-4 flex items-start gap-4 transition-all ${
                      displayState !== "available"
                        ? "border-border opacity-70"
                        : canRedeem
                          ? "border-[#00e5cc]/30 hover:border-[#00e5cc]/60"
                          : "border-border"
                    }`}
                    data-ocid={`fanpoints.rewards.item.${idx + 1}`}
                  >
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-2xl mt-0.5">
                      {rewardTypeIcon(reward)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="text-white font-semibold text-sm leading-snug">
                          {reward.title}
                        </h3>
                        {isSponsored && (
                          <span className="shrink-0 text-[#00e5cc] text-[10px] font-bold border border-[#00e5cc]/50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Sponsored
                          </span>
                        )}
                        {displayState === "soldout" && (
                          <span className="shrink-0 text-amber-400 text-[10px] font-bold bg-amber-900/30 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Sold Out
                          </span>
                        )}
                        {displayState === "unavailable" && (
                          <span className="shrink-0 text-white/40 text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">
                        {reward.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="bg-[#00e5cc]/15 text-[#00e5cc] text-xs font-bold px-2.5 py-1 rounded-full">
                          {costNum.toLocaleString()} pts
                        </span>
                        {qtyLeft != null && qtyLeft > 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isLowStock
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-white/10 text-white/40"
                            }`}
                          >
                            {qtyLeft} left
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          displayState === "available" &&
                          setSelectedReward(reward)
                        }
                        disabled={!canRedeem}
                        data-ocid={`fanpoints.rewards.redeem_button.${idx + 1}`}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          canRedeem
                            ? "bg-[#00e5cc] text-[#0a0e1a] hover:bg-[#00e5cc]/90 shadow-[0_0_12px_rgba(0,229,204,0.3)]"
                            : displayState !== "available"
                              ? "bg-muted/30 text-white/20 cursor-not-allowed opacity-50"
                              : "bg-muted/30 text-white/20 cursor-not-allowed"
                        }`}
                      >
                        {displayState === "soldout"
                          ? "Sold Out"
                          : displayState === "unavailable"
                            ? "Unavailable"
                            : "Redeem"}
                      </button>
                      {displayState === "available" && !canRedeem && (
                        <span className="text-white/30 text-[10px] text-right">
                          Need {pointsNeeded.toFixed(1)} more pts
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-white font-bold text-lg mb-3">
            My Redeemed Rewards
          </h2>
          {redeemedRewards.length === 0 ? (
            <div
              className="bg-muted/30 border border-border rounded-xl p-6 text-center"
              data-ocid="fanpoints.redeemed.empty_state"
            >
              <p className="text-white/40 text-sm">No rewards redeemed yet</p>
            </div>
          ) : (
            <div className="space-y-3" data-ocid="fanpoints.redeemed.list">
              {(
                redeemedRewards as Array<{
                  id: string;
                  rewardTitle: string;
                  redeemedAt: bigint;
                  codeOrValue: string;
                }>
              ).map((rr, idx) => {
                const redeemedDate = new Date(
                  Number(rr.redeemedAt) / 1_000_000,
                );
                const friendlyDate = redeemedDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <div
                    key={rr.id}
                    className="bg-muted/30 border border-[#00e5cc]/20 rounded-xl p-4"
                    data-ocid={`fanpoints.redeemed.item.${idx + 1}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-semibold text-sm">
                        {rr.rewardTitle}
                      </span>
                      <span className="text-white/30 text-xs shrink-0 ml-2">
                        {friendlyDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#0a0e1a] border border-[#00e5cc]/40 rounded-lg px-3 py-2.5">
                      <code className="text-[#00e5cc] text-base font-mono font-bold flex-1 tracking-wider">
                        {rr.codeOrValue}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(rr.codeOrValue, rr.id)}
                        data-ocid={`fanpoints.redeemed.copy_button.${idx + 1}`}
                        className="shrink-0 flex items-center gap-1 text-[#00e5cc]/70 hover:text-[#00e5cc] transition-colors text-xs font-medium"
                        aria-label="Copy code"
                      >
                        {copiedId === rr.id ? (
                          <>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              aria-hidden="true"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="13"
                                height="13"
                                rx="2"
                                ry="2"
                              />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedReward && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          data-ocid="fanpoints.confirm-redeem.dialog"
        >
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-bold text-lg">Confirm Redemption</h3>
            <p className="text-white/70">
              Redeem{" "}
              <strong className="text-white">{selectedReward.title}</strong> for{" "}
              <strong className="text-[#f59e0b]">
                {Number(selectedReward.pointsCost).toLocaleString()} points
              </strong>
              ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedReward(null)}
                data-ocid="fanpoints.confirm-redeem.cancel_button"
                className="flex-1 border border-white/20 text-white/70 py-3 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRedeem}
                disabled={redeemReward.isPending}
                data-ocid="fanpoints.confirm-redeem.confirm_button"
                className="flex-1 bg-[#00e5cc] text-[#0a0e1a] font-bold py-3 rounded-xl"
              >
                {redeemReward.isPending ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {redeemedCode && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          data-ocid="fanpoints.reward-unlocked.dialog"
        >
          <div
            className="bg-card border border-[#00e5cc]/30 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center"
            style={{ boxShadow: "0 0 40px rgba(0,229,204,0.15)" }}
          >
            <div className="w-16 h-16 bg-[#00e5cc]/15 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-[#00e5cc]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">
                Reward Unlocked! 🎉
              </h3>
              {redeemedRewardTitle && (
                <p className="text-white/60 text-sm mt-1">
                  {redeemedRewardTitle}
                </p>
              )}
            </div>
            <div className="bg-[#0a0e1a] border border-[#00e5cc]/50 rounded-xl p-4 text-left">
              <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">
                Your code
              </p>
              <code className="text-[#00e5cc] text-2xl font-mono font-bold block tracking-widest">
                {redeemedCode}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(redeemedCode, "success")}
                data-ocid="fanpoints.reward-unlocked.copy_button"
                className="mt-3 flex items-center gap-1.5 text-[#00e5cc]/70 hover:text-[#00e5cc] text-sm transition-colors"
              >
                {copiedId === "success" ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Tap to copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg px-3 py-2.5 text-left">
              <p className="text-[#f59e0b]/90 text-xs">
                {redeemedRewardType === "ticketEntry"
                  ? "🏆 Your entry has been recorded — winner announced after the game"
                  : "🎫 Show this code at the register or gate — valid for one use only"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRedeemedCode(null);
                setRedeemedRewardTitle(null);
                setRedeemedRewardType(null);
              }}
              data-ocid="fanpoints.reward-unlocked.close_button"
              className="w-full bg-[#00e5cc]/10 border border-[#00e5cc]/30 text-[#00e5cc] font-semibold py-3 rounded-xl hover:bg-[#00e5cc]/20 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FanPointsPage;
