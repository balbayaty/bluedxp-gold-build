/**
 * Detention Dashboard Component
 * Shows detention tracking, alerts, and analytics
 */

"use client";

import { useState, useEffect } from "react";
import { DetentionRecord } from "@/types/tms/transportJob";

interface DetentionDashboardProps {
  jobId?: string;
  tenantId: string;
}

export default function DetentionDashboard({
  jobId,
  tenantId,
}: DetentionDashboardProps) {
  const [detentions, setDetentions] = useState<DetentionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDays, setTotalDays] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    loadDetentions();
  }, [jobId, tenantId]);

  const loadDetentions = async () => {
    setLoading(true);
    try {
      const url = jobId
        ? `/api/tms/jobs/${jobId}/detention?tenantId=${tenantId}`
        : `/api/tms/detention/analytics?tenantId=${tenantId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setDetentions(data);
        setTotalDays(data.reduce((sum, d) => sum + d.detentionDays, 0));
        setTotalCost(data.reduce((sum, d) => sum + (d.detentionCost || 0), 0));
      }
    } catch (error) {
      console.error("Error loading detentions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading detention data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Detention Days
          </h3>
          <p className="text-2xl font-bold text-blue-600">{totalDays}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Detention Cost
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {totalCost.toFixed(2)} SAR
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Active Detentions
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            {detentions.filter((d) => d.status === "active").length}
          </p>
        </div>
      </div>

      {/* Detention Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detention Records</h2>
        </div>
        {detentions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No detention records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Free Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Detention Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detentions.map((detention) => (
                  <tr key={detention.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {detention.detentionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">{detention.location || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(detention.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {detention.endDate
                        ? new Date(detention.endDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">{detention.freeTimeDays} days</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-semibold ${
                          detention.detentionDays > 7
                            ? "text-red-600"
                            : detention.detentionDays > 3
                              ? "text-orange-600"
                              : "text-gray-600"
                        }`}
                      >
                        {detention.detentionDays} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {detention.detentionCost
                        ? `${detention.detentionCost.toFixed(2)} SAR`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          detention.status === "active"
                            ? "bg-yellow-100 text-yellow-800"
                            : detention.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {detention.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
