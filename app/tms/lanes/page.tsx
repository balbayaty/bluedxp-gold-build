/**
 * TMS Lane Management Page
 * Manage lanes, view performance, and optimize routes
 */

"use client";

import { useState, useEffect } from "react";
import { Lane } from "@/types/tms/transportJob";

export default function TMSLanesPage() {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanes();
  }, []);

  const loadLanes = async () => {
    setLoading(true);
    try {
      // TODO: Implement API endpoint for lanes
      // const response = await fetch('/api/tms/lanes?tenantId=flex-logistics');
      // const data = await response.json();
      // setLanes(data);
    } catch (error) {
      console.error("Error loading lanes:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lane Management</h1>
        <p className="text-gray-600">
          Manage lanes, track performance, and optimize routes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="p-8 text-center">Loading lanes...</div>
        ) : lanes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-4">
              No lanes found. Lanes will be automatically created from imported
              jobs.
            </p>
            <a
              href="/tms/jobs/import"
              className="text-blue-600 hover:underline"
            >
              Import Jobs to Create Lanes
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lane Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Avg Transit Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    On-Time Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lanes.map((lane) => (
                  <tr key={lane.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <a
                        href={`/tms/lanes/${lane.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {lane.name}
                      </a>
                    </td>
                    <td className="px-6 py-4">{lane.origin}</td>
                    <td className="px-6 py-4">{lane.destination}</td>
                    <td className="px-6 py-4">
                      {lane.averageTransitTime
                        ? `${lane.averageTransitTime.toFixed(1)}h`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {lane.onTimeDeliveryRate
                        ? `${lane.onTimeDeliveryRate.toFixed(1)}%`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">{lane.totalJobs || 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          lane.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {lane.isActive ? "Active" : "Inactive"}
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
