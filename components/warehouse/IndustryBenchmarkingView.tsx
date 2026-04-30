/**
 * Industry Benchmarking View Component
 * Performance comparison against industry standards
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { industryBenchmarkingService } from "@/lib/services/wms/industryBenchmarkingService";
import type {
  WarehouseBenchmark,
  BenchmarkComparison,
} from "@/lib/services/wms/industryBenchmarkingService";

interface IndustryBenchmarkingViewProps {
  warehouseId: string;
}

export default function IndustryBenchmarkingView({
  warehouseId,
}: IndustryBenchmarkingViewProps) {
  const [benchmark, setBenchmark] = useState<WarehouseBenchmark | null>(null);
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBenchmark();
  }, [warehouseId]);

  const loadBenchmark = async () => {
    setIsLoading(true);
    try {
      const [benchmarkData, comparisonData] = await Promise.all([
        industryBenchmarkingService.generateBenchmark(warehouseId),
        industryBenchmarkingService.getComparison(warehouseId),
      ]);
      setBenchmark(benchmarkData);
      setComparison(comparisonData);
    } catch (error) {
      console.error("Error loading benchmark:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      {benchmark && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <i className="ri-trophy-line mr-3 text-cyan-400"></i>
            Industry Benchmarking
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-1">Overall Score</p>
              <p className="text-4xl font-bold text-white">
                {benchmark.overallScore.toFixed(1)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Ranking</p>
              <p className="text-2xl font-bold text-white">
                {benchmark.ranking.replace("_", " ")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
              <p className="text-sm text-gray-400 mb-1">Benchmarks</p>
              <p className="text-2xl font-bold text-white">
                {benchmark.benchmarks.length}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Benchmark Details */}
      {benchmark && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-3">
            {benchmark.benchmarks.map((bm, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{bm.metric}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      bm.performance === "TOP_10_PERCENT"
                        ? "bg-green-500/20 text-green-400"
                        : bm.performance === "TOP_QUARTILE"
                          ? "bg-blue-500/20 text-blue-400"
                          : bm.performance === "ABOVE_AVERAGE"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : bm.performance === "AVERAGE"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {bm.performance.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Your Value</p>
                    <p className="text-white font-bold">
                      {bm.value.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Industry Avg</p>
                    <p className="text-white">
                      {bm.industryAverage.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Top 10%</p>
                    <p className="text-white">
                      {bm.industryTop10Percent.toFixed(1)}
                    </p>
                  </div>
                </div>
                {bm.gap > 0 && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Gap to top 10%: {bm.gap.toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
