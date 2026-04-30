"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// Quick stats interface
interface SafetyStat {
  label: string;
  value: string | number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  color: string;
  icon: string;
}

// Dummy data for "Wow" factor until real APIs are hooked up
const INITIAL_STATS: SafetyStat[] = [
  {
    label: "Overall Safety Score",
    value: "94%",
    trend: "up",
    trendValue: "+2.4%",
    color: "text-emerald-400",
    icon: "ri-shield-check-fill",
  },
  {
    label: "Active Hazards",
    value: 12,
    trend: "down",
    trendValue: "-3",
    color: "text-amber-400",
    icon: "ri-alert-fill",
  },
  {
    label: "Pending MSDS Reviews",
    value: 5,
    trend: "neutral",
    trendValue: "0",
    color: "text-blue-400",
    icon: "ri-file-text-fill",
  },
  {
    label: "Open Incidents",
    value: 1,
    trend: "down",
    trendValue: "-1",
    color: "text-red-400",
    icon: "ri-alarm-warning-fill",
  },
];

export default function HazalyzeCommandCenter() {
  const [pulse, setPulse] = useState(false);

  // Heartbeat effect
  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${pulse ? "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]" : "bg-emerald-600/50"} transition-all duration-1000`}
              />
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                HAZALYZE COMMAND CENTER
              </h1>
            </div>
            <p className="text-white/40 text-sm font-mono tracking-widest uppercase">
              System Status: Operational • Threat Level: Low
            </p>
          </div>
          <div className="flex gap-4">
            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm font-medium group">
              <i className="ri-openai-fill text-xl group-hover:text-emerald-400 transition-colors"></i>
              AI Safety Officer
            </button>
            <button className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg backdrop-blur-md transition-all flex items-center gap-2 text-sm font-medium text-emerald-400">
              <i className="ri-broadcast-line text-xl animate-pulse"></i>
              Live Monitoring
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm relative group overflow-hidden hover:border-white/20 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-3 rounded-xl bg-white/5 ${stat.color} text-2xl`}
                >
                  <i className={stat.icon}></i>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-white/5 ${
                    stat.trend === "up"
                      ? "text-emerald-400"
                      : stat.trend === "down"
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {stat.trend === "up" && <i className="ri-arrow-up-line"></i>}
                  {stat.trend === "down" && (
                    <i className="ri-arrow-down-line"></i>
                  )}
                  {stat.trendValue}
                </div>
              </div>
              <h3 className="text-white/40 text-sm font-medium mb-1">
                {stat.label}
              </h3>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          {/* Hazard Heatmap (Dummy Visual) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-[#0f131a] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-6 z-10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="ri-map-pin-range-line text-emerald-400"></i>
                Live Hazard Heatmap
              </h3>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-xs text-white/40">Live Feed</span>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="flex-1 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 grid place-content-center">
                <div className="w-[300px] h-[300px] border border-white/10 rounded-full animate-[spin_10s_linear_infinite] opacity-30"></div>
                <div className="w-[200px] h-[200px] border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="text-center">
                  <i className="ri-layout-masonry-line text-4xl text-white/10 mb-2"></i>
                  <p className="text-white/20 text-sm font-mono">
                    WAREHOUSE MAP VISUALIZATION
                  </p>
                  <p className="text-emerald-500/50 text-xs mt-2">
                    Connecting to sensors...
                  </p>
                </div>
              </div>

              {/* Hotspots */}
              <div className="absolute top-[30%] left-[40%]">
                <div className="w-4 h-4 bg-red-500/50 rounded-full animate-ping absolute"></div>
                <div className="w-4 h-4 bg-red-500 rounded-full relative shadow-[0_0_20px_rgba(239,68,68,0.6)] cursor-pointer hover:scale-110 transition-transform"></div>
              </div>
              <div className="absolute top-[60%] right-[30%]">
                <div className="w-4 h-4 bg-amber-500/50 rounded-full animate-ping absolute delay-700"></div>
                <div className="w-4 h-4 bg-amber-500 rounded-full relative shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer hover:scale-110 transition-transform"></div>
              </div>
            </div>
          </motion.div>

          {/* Critical Alerts & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#0f131a] border border-white/10 rounded-2xl p-6 flex flex-col"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <i className="ri-notification-3-line text-blue-400"></i>
              Critical Actions
            </h3>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <div className="p-4 rounded-xl bg-red-500/10 border-l-2 border-red-500 hover:bg-red-500/15 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    High Priority
                  </span>
                  <span className="text-xs text-white/30">2m ago</span>
                </div>
                <h4 className="font-medium text-red-100 group-hover:text-white transition-colors">
                  Incompatible Storage Detected
                </h4>
                <p className="text-sm text-white/50 mt-1">
                  Oxidizers stored near Flammables in Zone B-12.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border-l-2 border-amber-500 hover:bg-amber-500/15 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Review Needed
                  </span>
                  <span className="text-xs text-white/30">15m ago</span>
                </div>
                <h4 className="font-medium text-amber-100 group-hover:text-white transition-colors">
                  New MSDS requires approval
                </h4>
                <p className="text-sm text-white/50 mt-1">
                  Acetone (Sigma Aldrich) uploaded by vendor.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border-l-2 border-blue-500 hover:bg-blue-500/15 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Maintenance
                  </span>
                  <span className="text-xs text-white/30">1h ago</span>
                </div>
                <h4 className="font-medium text-blue-100 group-hover:text-white transition-colors">
                  Eye Wash Station Inspection
                </h4>
                <p className="text-sm text-white/50 mt-1">
                  Routine check due for Sector 4.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <Link
                href="/msds"
                className="block w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-center font-medium transition-colors shadow-lg shadow-emerald-500/20"
              >
                Quick Actions Panel
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
