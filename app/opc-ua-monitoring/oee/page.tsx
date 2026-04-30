/**
 * OPC UA OEE Dashboard
 * Overall Equipment Effectiveness tracking and analytics
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiBarChartLine,
  RiTimeLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

interface OEE {
  machineId: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  totalParts: number;
  goodParts: number;
  rejectedParts: number;
}

export default function OEEDashboardPage() {
  const [oeeData, setOeeData] = useState<OEE[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOEE();
  }, []);

  async function loadOEE() {
    try {
      const response = await fetch("/api/opc-ua-monitoring/oee", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setOeeData(data);
      }
    } catch (error) {
      console.error("Error loading OEE:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">OEE Dashboard</h1>
          <p className="text-gray-400">
            Overall Equipment Effectiveness tracking and analytics
          </p>
        </div>

        {oeeData.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No OEE data available. Connect machines to start tracking.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oeeData.map((oee) => (
              <div
                key={oee.machineId}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Machine {oee.machineId}
                </h3>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">OEE</span>
                    <span className="text-3xl font-bold">{oee.oee}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className="bg-cyan-400 h-3 rounded-full"
                      style={{ width: `${oee.oee}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">
                        Availability
                      </span>
                      <span className="text-sm font-semibold">
                        {oee.availability}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-green-400 h-1.5 rounded-full"
                        style={{ width: `${oee.availability}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Performance</span>
                      <span className="text-sm font-semibold">
                        {oee.performance}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-yellow-400 h-1.5 rounded-full"
                        style={{ width: `${oee.performance}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Quality</span>
                      <span className="text-sm font-semibold">
                        {oee.quality}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-purple-400 h-1.5 rounded-full"
                        style={{ width: `${oee.quality}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-400">Total</div>
                    <div className="text-lg font-bold">{oee.totalParts}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Good</div>
                    <div className="text-lg font-bold text-green-400">
                      {oee.goodParts}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Rejected</div>
                    <div className="text-lg font-bold text-red-400">
                      {oee.rejectedParts}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
