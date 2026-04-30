/**
 * Cost Accounting Page
 * Professional cost center management and cost allocation
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiCalculatorLine,
  RiAddLine,
  RiFileDownloadLine,
} from "react-icons/ri";

export default function CostAccountingPage() {
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      // This would call the cost accounting API
      // For now, mock data
      setCostCenters([]);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiCalculatorLine className="text-cyan-400" />
              Cost Accounting
            </h1>
            <p className="text-gray-400 mt-1">
              Cost centers and cost allocation
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Cost Center
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading cost centers...
            </div>
          </div>
        ) : costCenters.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No cost centers found</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-gray-400">Cost centers will be displayed here</p>
          </div>
        )}
      </div>
    </div>
  );
}
