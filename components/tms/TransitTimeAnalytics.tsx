/**
 * Transit Time Analytics Component
 * Shows transit time analysis, predictions, and performance metrics
 */

"use client";

import { useState, useEffect } from "react";
import { TransitTimeRecord } from "@/types/tms/transportJob";

interface TransitTimeAnalyticsProps {
  jobId?: string;
  tenantId: string;
}

export default function TransitTimeAnalytics({
  jobId,
  tenantId,
}: TransitTimeAnalyticsProps) {
  const [transitTimes, setTransitTimes] = useState<TransitTimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    averageTransitTime: 0,
    onTimeRate: 0,
    totalDelays: 0,
  });

  useEffect(() => {
    loadTransitTimes();
  }, [jobId, tenantId]);

  const loadTransitTimes = async () => {
    setLoading(true);
    try {
      if (jobId) {
        const response = await fetch(
          `/api/tms/jobs/${jobId}/transit-time?tenantId=${tenantId}`,
        );
        const data = await response.json();
        setTransitTimes(Array.isArray(data) ? data : []);

        if (data.length > 0) {
          const avg =
            data.reduce(
              (sum: number, t: TransitTimeRecord) => sum + t.actualTransitTime,
              0,
            ) / data.length;
          const onTime = data.filter((t: TransitTimeRecord) => t.onTime).length;
          const delays = data.filter(
            (t: TransitTimeRecord) => t.delay && t.delay > 0,
          ).length;

          setAnalytics({
            averageTransitTime: avg,
            onTimeRate: (onTime / data.length) * 100,
            totalDelays: delays,
          });
        }
      }
    } catch (error) {
      console.error("Error loading transit times:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading transit time data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Average Transit Time
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {analytics.averageTransitTime.toFixed(1)} hours
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            On-Time Rate
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {analytics.onTimeRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Total Delays
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {analytics.totalDelays}
          </p>
        </div>
      </div>

      {/* Transit Time Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Transit Time Segments</h2>
        </div>
        {transitTimes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transit time records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Segment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Planned Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actual Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Delay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transitTimes.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {record.segmentName || record.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">{record.origin}</td>
                    <td className="px-6 py-4">{record.destination}</td>
                    <td className="px-6 py-4">
                      {record.plannedTransitTime
                        ? `${record.plannedTransitTime.toFixed(1)}h`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {record.actualTransitTime.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4">
                      {record.delay ? (
                        <span
                          className={`font-semibold ${
                            record.delay > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {record.delay > 0 ? "+" : ""}
                          {record.delay.toFixed(1)}h
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          record.onTime
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.onTime ? "On Time" : "Delayed"}
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
