"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiRefreshCw,
  FiMaximize2,
  FiPlay,
  FiPause,
  FiMinimize2,
} from "react-icons/fi";
import dynamic from "next/dynamic";

const UltimateConsolidatedDashboard = dynamic(
  () => import("@/components/dashboards/UltimateConsolidatedDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-slate-400">Loading Dashboard...</div>
        </div>
      </div>
    ),
  },
);

export default function LiveDashboardPreview() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setRefreshKey((prev) => prev + 1);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  return (
    <div className={`relative ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Live Dashboard Preview
          </h3>
          <p className="text-sm text-slate-400">
            {isPlaying
              ? "Real-time data updates every 10 seconds"
              : "Updates paused"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <FiPause className="w-5 h-5 text-white" />
            ) : (
              <FiPlay className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <FiMinimize2 className="w-5 h-5 text-white" />
            ) : (
              <FiMaximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Container */}
      <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
        <div
          className={`overflow-auto ${isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[600px]"}`}
        >
          <UltimateConsolidatedDashboard
            key={refreshKey}
            tenantId="demo"
            userId="demo-user"
            userRole="SYSTEM_ADMIN"
            enabledModules={[]}
            initialLayout="executive-overview"
          />
        </div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
      >
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> This is a live preview. In your actual
          dashboard, you can customize layouts, add widgets, and configure
          real-time updates based on your role and permissions.
        </p>
      </motion.div>
    </div>
  );
}
