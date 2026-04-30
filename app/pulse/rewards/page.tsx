/**
 * Pulse Rewards Page
 * Browse and redeem rewards
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import type { PulseRewardsCatalog, PulseRedemption } from "@/types/pulse";

export default function PulseRewardsPage() {
  const [rewards, setRewards] = useState<PulseRewardsCatalog[]>([]);
  const [redemptions, setRedemptions] = useState<PulseRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ balancePP: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, redemptionsRes, overviewRes] = await Promise.all([
        fetch("/api/pulse/rewards/catalog?active=true", {
          credentials: "include",
        }),
        fetch("/api/pulse/rewards/redemptions", { credentials: "include" }),
        fetch("/api/pulse/overview", { credentials: "include" }),
      ]);

      const rewardsData = await rewardsRes.json();
      const redemptionsData = await redemptionsRes.json();
      const overviewData = await overviewRes.json();

      if (rewardsData.success) setRewards(rewardsData.data);
      if (redemptionsData.success) setRedemptions(redemptionsData.data);
      if (overviewData.success) setBalance(overviewData.data.balance);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    if (!confirm("Are you sure you want to redeem this reward?")) return;

    try {
      const res = await fetch("/api/pulse/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rewardId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Reward redeemed successfully!");
        fetchData();
      } else {
        alert(data.error || "Failed to redeem reward");
      }
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      alert("Failed to redeem reward");
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Rewards"
        description="Redeem your Pulse Points for rewards"
        icon="ri-gift-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Rewards"
      description="Redeem your Pulse Points for rewards"
      icon="ri-gift-line"
    >
      <div className="space-y-6">
        {/* Balance */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Your Balance</div>
          <div className="text-3xl font-bold text-blue-600">
            {balance.balancePP} PP
          </div>
        </div>

        {/* Rewards Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <div key={reward.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">{reward.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {reward.description}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {reward.costPP} PP
                    </div>
                    {reward.monthlyLimitPerUser && (
                      <div className="text-xs text-gray-500">
                        Limit: {reward.monthlyLimitPerUser}/month
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => redeemReward(reward.id)}
                    disabled={balance.balancePP < reward.costPP}
                    className={`px-4 py-2 rounded transition-colors ${
                      balance.balancePP >= reward.costPP
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Redeem
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Redemptions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">My Redemptions</h2>
          {redemptions.length === 0 ? (
            <p className="text-gray-500">No redemptions yet</p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold">
                      Redemption #{redemption.id.slice(0, 8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(redemption.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      redemption.status === "APPROVED"
                        ? "bg-green-100 text-green-600"
                        : redemption.status === "REJECTED"
                          ? "bg-red-100 text-red-600"
                          : redemption.status === "FULFILLED"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {redemption.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
