/**
 * TMS Analytics Dashboard
 * Comprehensive analytics for transit times, detention, and performance
 */

"use client";

import { useState, useEffect } from "react";
import DetentionDashboard from "@/components/tms/DetentionDashboard";
import TransitTimeAnalytics from "@/components/tms/TransitTimeAnalytics";

export default function TMSAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "detention" | "transit"
  >("overview");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">TMS Analytics</h1>
        <p className="text-gray-600">
          Comprehensive analytics for transport operations
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {(["overview", "detention", "transit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Jobs
              </h3>
              <p className="text-3xl font-bold text-blue-600">-</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Avg Transit Time
              </h3>
              <p className="text-3xl font-bold text-green-600">-</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Total Detention Days
              </h3>
              <p className="text-3xl font-bold text-orange-600">-</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                On-Time Rate
              </h3>
              <p className="text-3xl font-bold text-purple-600">-</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
            <p className="text-gray-600">
              Analytics will be displayed here after data import.
            </p>
          </div>
        </div>
      )}

      {activeTab === "detention" && (
        <DetentionDashboard tenantId="flex-logistics" />
      )}

      {activeTab === "transit" && (
        <TransitTimeAnalytics tenantId="flex-logistics" />
      )}
    </div>
  );
}
