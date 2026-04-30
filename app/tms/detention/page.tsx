/**
 * TMS Detention Tracking Page
 * Comprehensive detention management and analytics
 */

"use client";

import DetentionDashboard from "@/components/tms/DetentionDashboard";

export default function TMSDetentionPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Detention Tracking</h1>
        <p className="text-gray-600">
          Monitor and manage detention times and costs
        </p>
      </div>

      <DetentionDashboard tenantId="flex-logistics" />
    </div>
  );
}
