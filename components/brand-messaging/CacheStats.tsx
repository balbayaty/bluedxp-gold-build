"use client";

import React, { useState, useEffect } from "react";

export const CacheStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/brand-messaging/generate");
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cachePercentage = (stats.size / stats.maxSize) * 100;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Cache Statistics</h2>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-slate-400 mb-2">Cache Size</div>
          <div className="text-3xl font-bold text-white">{stats.size}</div>
          <div className="text-xs text-slate-500 mt-1">
            of {stats.maxSize} max
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-2">Cache Usage</div>
          <div className="text-3xl font-bold text-white">
            {cachePercentage.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${cachePercentage}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-sm text-slate-400 mb-2">Hit Rate</div>
          <div className="text-3xl font-bold text-white">
            {stats.hitRate ? `${(stats.hitRate * 100).toFixed(1)}%` : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};
