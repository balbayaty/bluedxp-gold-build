/**
 * Warehouse Workforce View Component
 * Workforce management and analytics
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseHRIntegration } from "@/lib/services/wms/hrIntegration";
import type { WarehouseWorkforce } from "@/lib/services/wms/hrIntegration";

interface WarehouseWorkforceViewProps {
  warehouseId: string;
}

export default function WarehouseWorkforceView({
  warehouseId,
}: WarehouseWorkforceViewProps) {
  const [workforce, setWorkforce] = useState<WarehouseWorkforce | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkforceData();
  }, [warehouseId]);

  const loadWorkforceData = async () => {
    setIsLoading(true);
    try {
      const data = await warehouseHRIntegration.getWorkforce(warehouseId);
      setWorkforce(data);
    } catch (error) {
      console.error("Error loading workforce data:", error);
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

  if (!workforce) return null;

  return (
    <div className="space-y-6">
      {/* Workforce Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-team-line mr-3 text-cyan-400"></i>
          Workforce Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
            <p className="text-sm text-gray-400 mb-1">Total Employees</p>
            <p className="text-3xl font-bold text-white">
              {workforce.totalEmployees}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
            <p className="text-sm text-gray-400 mb-1">On Duty</p>
            <p className="text-3xl font-bold text-white">{workforce.onDuty}</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
            <p className="text-sm text-gray-400 mb-1">On Break</p>
            <p className="text-3xl font-bold text-white">{workforce.onBreak}</p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/30">
            <p className="text-sm text-gray-400 mb-1">Off Duty</p>
            <p className="text-3xl font-bold text-white">{workforce.offDuty}</p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Productivity</p>
            <p className="text-2xl font-bold text-white">
              {workforce.performance.averageProductivity}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-white">
              {workforce.performance.averageAccuracy}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-400 mb-1">Attendance</p>
            <p className="text-2xl font-bold text-white">
              {workforce.performance.attendanceRate}%
            </p>
          </div>
        </div>

        {/* By Department */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            By Department
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(workforce.byDepartment).map(([dept, count]) => (
              <div
                key={dept}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-gray-400">{dept}</p>
                <p className="text-xl font-bold text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* By Skill */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">By Skill</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(workforce.bySkill).map(([skill, count]) => (
              <div
                key={skill}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <p className="text-sm text-gray-400">{skill}</p>
                <p className="text-xl font-bold text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
