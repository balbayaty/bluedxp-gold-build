"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface UsageStats {
  totalGenerated: number;
  todayGenerated: number;
  mostUsedType: string;
  averageQuality: number;
  cacheHitRate: number;
  modulesUsed: string[];
}

export const UsageAnalytics: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from API
    // For now, use mock data
    setTimeout(() => {
      setStats({
        totalGenerated: 127,
        todayGenerated: 8,
        mostUsedType: "module_header",
        averageQuality: 87,
        cacheHitRate: 65,
        modulesUsed: ["wms", "tms", "compliance", "brand-messaging"],
      });
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Usage Analytics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 border border-blue-500/30"
        >
          <div className="text-2xl mb-1">📊</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalGenerated}
          </div>
          <div className="text-xs text-slate-400">Total Generated</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg p-4 border border-green-500/30"
        >
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-bold text-white">
            {stats.todayGenerated}
          </div>
          <div className="text-xs text-slate-400">Today</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30"
        >
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-2xl font-bold text-white">
            {stats.averageQuality}%
          </div>
          <div className="text-xs text-slate-400">Avg Quality</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg p-4 border border-yellow-500/30"
        >
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-bold text-white">
            {stats.cacheHitRate}%
          </div>
          <div className="text-xs text-slate-400">Cache Hits</div>
        </motion.div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-600">
        <div className="text-xs text-slate-400 mb-2">Most Used Type:</div>
        <div className="text-sm text-white font-medium">
          {stats.mostUsedType}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-400 mb-2">Modules Used:</div>
        <div className="flex flex-wrap gap-2">
          {stats.modulesUsed.map((module) => (
            <span
              key={module}
              className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300"
            >
              {module}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
