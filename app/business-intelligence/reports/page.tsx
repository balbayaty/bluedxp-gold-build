/**
 * BI Reports Page
 * Custom reports across all modules
 */

"use client";

import { useEffect, useState } from "react";
import { RiFileChartLine, RiAddLine, RiDownloadLine } from "react-icons/ri";
import type { BIReport } from "@/types/business-intelligence";

export default function BIReportsPage() {
  const [reports, setReports] = useState<BIReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Would fetch reports
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiFileChartLine className="text-green-400" />
              BI Reports
            </h1>
            <p className="text-gray-400 mt-1">
              Custom reports across all modules
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Report
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading reports...
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No reports found</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <p className="text-gray-400">Reports will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
}
