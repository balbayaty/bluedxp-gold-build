/**
 * Pulse Admin - Redemptions Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import type { PulseRedemption } from "@/types/pulse";

export default function PulseAdminRedemptionsPage() {
  const [redemptions, setRedemptions] = useState<PulseRedemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      const res = await fetch("/api/pulse/admin/redemptions", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setRedemptions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch redemptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveRedemption = async (redemptionId: string, approved: boolean) => {
    try {
      const res = await fetch("/api/pulse/admin/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ redemptionId, approved }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Redemption ${approved ? "approved" : "rejected"} successfully`);
        fetchRedemptions();
      } else {
        alert(data.error || "Failed to process redemption");
      }
    } catch (error) {
      console.error("Failed to process redemption:", error);
      alert("Failed to process redemption");
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Redemptions"
        description="Approve or reject reward redemptions"
        icon="ri-shopping-cart-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Redemptions"
      description="Approve or reject reward redemptions"
      icon="ri-shopping-cart-line"
    >
      <div className="space-y-4">
        {redemptions.length === 0 ? (
          <p className="text-gray-500">No pending redemptions</p>
        ) : (
          redemptions.map((redemption: any) => (
            <div key={redemption.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {redemption.reward?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    User: {redemption.userId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Requested:{" "}
                    {new Date(redemption.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    {redemption.costPP} PP
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveRedemption(redemption.id, true)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => approveRedemption(redemption.id, false)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </PageTemplate>
  );
}
