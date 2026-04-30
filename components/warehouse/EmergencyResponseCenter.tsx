"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { EmergencyDrill } from "@/types/warehouse-management";

const drills: EmergencyDrill[] = [
  {
    id: "DRILL-001",
    name: "Evacuation Drill",
    zone: "Zone A",
    lastRun: "2025-06-01",
    nextRun: "2025-09-01",
    status: "scheduled",
  },
  {
    id: "DRILL-002",
    name: "Fire Suppression Test",
    zone: "Zone B",
    lastRun: "2025-05-20",
    nextRun: "2025-08-20",
    status: "scheduled",
  },
  {
    id: "DRILL-003",
    name: "Spill Response Exercise",
    zone: "Zone C",
    lastRun: "2025-07-01",
    nextRun: "2025-10-01",
    status: "scheduled",
  },
];

const EmergencyResponseCenter: React.FC = () => {
  const [statusMsg, setStatusMsg] = useState("");

  const runDrill = async (id: string) => {
    setStatusMsg(`Starting drill ${id}...`);
    setTimeout(
      () => setStatusMsg(`Drill ${id} executed (simulated). Reports saved.`),
      1000,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            Emergency Response & Fire Systems
          </h3>
          <p className="text-sm text-[#9ca3af]">
            Drills scheduling, fire system status, and rapid response
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm flex items-center gap-2 border border-red-500/30">
            <i className="ri-notification-line"></i> Live Alerts:{" "}
            <strong>0</strong>
          </div>
          <div className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm flex items-center gap-2 border border-green-500/30">
            <i className="ri-shield-check-line"></i> Systems:{" "}
            <strong>OK</strong>
          </div>
        </div>
      </div>

      {statusMsg && <div className="text-sm text-[#9ca3af]">{statusMsg}</div>}

      {/* Fire Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h4 className="font-semibold text-white mb-2">Fire Panels</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Panel A (Main)</span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Panel B (Warehouse)</span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af]">Panel C (Office)</span>
              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs">
                Maintenance
              </span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h4 className="font-semibold text-white mb-2">Sensors & Zones</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <i className="ri-radio-button-line text-red-400"></i>
              <span className="text-[#9ca3af]">Heat Sensors:</span>
              <strong className="text-white">128</strong>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-radio-button-line text-blue-400"></i>
              <span className="text-[#9ca3af]">Smoke Sensors:</span>
              <strong className="text-white">96</strong>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-radio-button-line text-purple-400"></i>
              <span className="text-[#9ca3af]">Gas Sensors:</span>
              <strong className="text-white">42</strong>
            </div>
            <div className="flex items-center gap-2">
              <i className="ri-pulse-line text-emerald-400"></i>
              <span className="text-[#9ca3af]">Zones:</span>
              <strong className="text-white">18</strong>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h4 className="font-semibold text-white mb-2">Integration</h4>
          <p className="text-sm text-[#9ca3af] mb-3">
            Planned: Dahua unified integration for panels, sensors, and alarm
            bridges. Webhooks + MQTT for live events.
          </p>
          <button className="mt-3 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1">
            <i className="ri-settings-line"></i> Configure
          </button>
        </motion.div>
      </div>

      {/* Drills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white">
            Fire Drills & Response Exercises
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {drills.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-4 border border-white/10 bg-white/5 hover:border-cyan-500/50 transition-colors"
            >
              <div className="text-sm text-[#9ca3af]">{d.id}</div>
              <div className="font-semibold text-white">{d.name}</div>
              <div className="text-sm text-[#9ca3af]">Zone: {d.zone}</div>
              <div className="text-xs text-[#6b7280]">
                Last: {d.lastRun} • Next: {d.nextRun}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => runDrill(d.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 transition-colors"
                >
                  Run Now
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-white/5 text-[#9ca3af] text-xs hover:bg-white/10 transition-colors border border-white/10">
                  Schedule
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyResponseCenter;
