/**
 * Warehouse Safety View Component
 * QHSE integration for warehouse safety
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseQHSEIntegration } from "@/lib/services/wms/qhseIntegration";
import type { WarehouseSafetyMetrics } from "@/lib/services/wms/qhseIntegration";

interface WarehouseSafetyViewProps {
  warehouseId: string;
}

export default function WarehouseSafetyView({
  warehouseId,
}: WarehouseSafetyViewProps) {
  const [metrics, setMetrics] = useState<WarehouseSafetyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSafetyData();
  }, [warehouseId]);

  const loadSafetyData = async () => {
    setIsLoading(true);
    try {
      const period = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };
      const data = await warehouseQHSEIntegration.getSafetyMetrics(
        warehouseId,
        period,
      );
      setMetrics(data);
    } catch (error) {
      console.error("Error loading safety data:", error);
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

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Safety Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-shield-check-line mr-3 text-cyan-400"></i>
          Safety & Compliance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">Compliance Score</p>
            <p className="text-3xl font-bold text-white">
              {metrics.compliance.score}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
            <p className="text-sm text-gray-400 mb-1">Incidents</p>
            <p className="text-3xl font-bold text-white">
              {metrics.incidents.total}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30">
            <p className="text-sm text-gray-400 mb-1">Inspections</p>
            <p className="text-3xl font-bold text-white">
              {metrics.inspections.total}
            </p>
            <p className="text-sm text-green-400 mt-1">
              {metrics.inspections.passed} passed
            </p>
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Certifications
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.compliance.certifications.map((cert, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>

        {/* Incidents Breakdown */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Incidents by Type
          </h3>
          <div className="space-y-2">
            {Object.entries(metrics.incidents.byType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="text-gray-300">{type}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspections Status */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Inspection Status
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400">Passed</p>
              <p className="text-2xl font-bold text-white">
                {metrics.inspections.passed}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-white">
                {metrics.inspections.failed}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-white">
                {metrics.inspections.pending}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
