/**
 * OPC UA Machine Monitoring Dashboard
 * Real-time injection molding machine monitoring with OEE tracking
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiCpuLine,
  RiServerLine,
  RiBarChartLine,
  RiAlertLine,
} from "react-icons/ri";

interface Machine {
  id: string;
  name: string;
  status: "online" | "offline" | "error";
  oee?: number;
  activeAlarms?: number;
}

export default function OPCUAMonitoringPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMachines();
    // Poll for updates every 5 seconds
    const interval = setInterval(loadMachines, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadMachines() {
    try {
      const response = await fetch("/api/opc-ua-monitoring/machines", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error("Error loading machines:", error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    online: "bg-green-500/20 text-green-400 border-green-400/50",
    offline: "bg-gray-500/20 text-gray-400 border-gray-400/50",
    error: "bg-red-500/20 text-red-400 border-red-400/50",
  };

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
          <h1 className="text-3xl font-bold mb-2">OPC UA Machine Monitoring</h1>
          <p className="text-gray-400">
            Real-time injection molding machine monitoring with EUROMAP-77
            integration
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <RiServerLine className="text-cyan-400 text-2xl" />
              <h3 className="text-lg font-semibold">Total Machines</h3>
            </div>
            <div className="text-3xl font-bold">{machines.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <RiCpuLine className="text-green-400 text-2xl" />
              <h3 className="text-lg font-semibold">Online</h3>
            </div>
            <div className="text-3xl font-bold">
              {machines.filter((m) => m.status === "online").length}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <RiBarChartLine className="text-cyan-400 text-2xl" />
              <h3 className="text-lg font-semibold">Avg OEE</h3>
            </div>
            <div className="text-3xl font-bold">
              {machines.length > 0
                ? Math.round(
                    machines.reduce((sum, m) => sum + (m.oee || 0), 0) /
                      machines.length,
                  )
                : 0}
              %
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <RiAlertLine className="text-yellow-400 text-2xl" />
              <h3 className="text-lg font-semibold">Active Alarms</h3>
            </div>
            <div className="text-3xl font-bold">
              {machines.reduce((sum, m) => sum + (m.activeAlarms || 0), 0)}
            </div>
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className={`bg-white/5 border rounded-2xl p-6 ${statusColors[machine.status]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{machine.name}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${statusColors[machine.status]}`}
                >
                  {machine.status.toUpperCase()}
                </span>
              </div>
              {machine.oee !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">OEE</span>
                    <span className="text-xl font-bold">{machine.oee}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-cyan-400 h-2 rounded-full"
                      style={{ width: `${machine.oee}%` }}
                    />
                  </div>
                </div>
              )}
              {machine.activeAlarms !== undefined &&
                machine.activeAlarms > 0 && (
                  <div className="text-sm text-yellow-400">
                    {machine.activeAlarms} active alarm
                    {machine.activeAlarms !== 1 ? "s" : ""}
                  </div>
                )}
              <a
                href={`/opc-ua-monitoring/machines/${machine.id}`}
                className="mt-4 inline-block text-cyan-400 hover:text-cyan-300 text-sm"
              >
                View Details →
              </a>
            </div>
          ))}
        </div>

        {machines.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No machines registered.{" "}
            <a href="/opc-ua-monitoring/machines" className="text-cyan-400">
              Register a machine
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
