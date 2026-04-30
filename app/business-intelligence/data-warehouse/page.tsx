/**
 * Data Warehouse Page
 * ETL jobs and data warehouse management
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiDatabaseLine,
  RiRefreshLine,
  RiPlayLine,
  RiPauseLine,
} from "react-icons/ri";
import type { ETLJob, DataWarehouseTable } from "@/types/business-intelligence";

export default function DataWarehousePage() {
  const [tables, setTables] = useState<DataWarehouseTable[]>([]);
  const [etlJobs, setEtlJobs] = useState<ETLJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataWarehouse();
  }, []);

  const fetchDataWarehouse = async () => {
    try {
      const response = await fetch("/api/business-intelligence/data-warehouse");
      const data = await response.json();
      if (data.success) {
        setTables(data.data.tables || []);
        setEtlJobs(data.data.etlJobs || []);
      }
    } catch (error) {
      console.error("Error fetching data warehouse:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ETLJob["status"]) => {
    const colors = {
      ACTIVE: "bg-green-400/20 text-green-400",
      PAUSED: "bg-yellow-400/20 text-yellow-400",
      FAILED: "bg-red-400/20 text-red-400",
    };
    return colors[status] || "bg-gray-400/20 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiDatabaseLine className="text-green-400" />
              Data Warehouse
            </h1>
            <p className="text-gray-400 mt-1">
              ETL jobs and data warehouse management
            </p>
          </div>
          <button
            onClick={fetchDataWarehouse}
            className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-green-400/50 transition-all"
          >
            <RiRefreshLine className="text-xl" />
          </button>
        </div>

        {/* ETL Jobs */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold">ETL Jobs</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-pulse text-gray-400">
                Loading ETL jobs...
              </div>
            </div>
          ) : etlJobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No ETL jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Job Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Source Module
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Destination
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Last Run
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {etlJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold">
                        {job.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {job.source.module}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {job.destination.table}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {job.schedule?.frequency || "Manual"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {job.lastRunAt
                          ? new Date(job.lastRunAt).toLocaleString()
                          : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tables */}
        {tables.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">Data Warehouse Tables</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/50 transition-all"
                  >
                    <h3 className="font-bold mb-2">{table.name}</h3>
                    <p className="text-sm text-gray-400 mb-1">
                      Module: {table.module}
                    </p>
                    <p className="text-sm text-gray-400 mb-1">
                      Records: {table.recordCount.toLocaleString()}
                    </p>
                    {table.lastSyncAt && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(table.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
