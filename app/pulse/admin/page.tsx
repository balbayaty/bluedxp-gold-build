/**
 * Pulse Admin Dashboard
 */

"use client";

import { useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import { useRouter } from "next/navigation";

export default function PulseAdminPage() {
  const router = useRouter();

  return (
    <PageTemplate
      title="Pulse Admin"
      description="Manage Pulse module settings and configurations"
      icon="ri-settings-line"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          onClick={() => router.push("/pulse/admin/rulesets")}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="text-lg font-semibold mb-1">Rulesets</h3>
          <p className="text-sm text-gray-600">
            Configure scoring rules and caps
          </p>
        </div>

        <div
          onClick={() => router.push("/pulse/admin/missions")}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="text-lg font-semibold mb-1">Missions</h3>
          <p className="text-sm text-gray-600">Create and manage missions</p>
        </div>

        <div
          onClick={() => router.push("/pulse/admin/rewards")}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">🎁</div>
          <h3 className="text-lg font-semibold mb-1">Rewards</h3>
          <p className="text-sm text-gray-600">Manage rewards catalog</p>
        </div>

        <div
          onClick={() => router.push("/pulse/admin/redemptions")}
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-3xl mb-2">🛒</div>
          <h3 className="text-lg font-semibold mb-1">Redemptions</h3>
          <p className="text-sm text-gray-600">Approve pending redemptions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-lg font-semibold mb-1">Scoreboards</h3>
          <p className="text-sm text-gray-600">View company scoreboards</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-2">📈</div>
          <h3 className="text-lg font-semibold mb-1">Analytics</h3>
          <p className="text-sm text-gray-600">
            Engagement trends and insights
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}
