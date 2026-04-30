"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseWorkflowIntegration } from "@/lib/services/wms/workflowIntegration";
import type {
  WarehouseWorkflow,
  WarehouseWorkflowStats,
  WarehouseWorkflowExecution,
} from "@/lib/services/wms/workflowIntegration";

interface WarehouseWorkflowIntegrationProps {
  warehouseId: string;
}

export default function WarehouseWorkflowIntegration({
  warehouseId,
}: WarehouseWorkflowIntegrationProps) {
  const [stats, setStats] = useState<WarehouseWorkflowStats | null>(null);
  const [executions, setExecutions] = useState<WarehouseWorkflowExecution[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [warehouseId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, executionsData] = await Promise.all([
        warehouseWorkflowIntegration.getStats(warehouseId),
        warehouseWorkflowIntegration.getRecentExecutions(warehouseId, 20),
      ]);
      setStats(statsData);
      setExecutions(executionsData);
    } catch (error) {
      console.error("Error loading workflow data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading workflow integration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Workflows</div>
            <div className="text-2xl font-bold text-white">
              {stats.totalWorkflows}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Active Workflows</div>
            <div className="text-2xl font-bold text-green-400">
              {stats.activeWorkflows}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Total Executions</div>
            <div className="text-2xl font-bold text-cyan-400">
              {stats.totalExecutions}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.totalExecutions > 0
                ? Math.round(
                    (stats.successfulExecutions / stats.totalExecutions) * 100,
                  )
                : 0}
              %
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-white/5 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-flow-chart-line mr-2 text-orange-400"></i>
          Recent Workflow Executions
        </h3>
        <div className="space-y-2">
          {executions.length > 0 ? (
            executions.map((execution) => (
              <div
                key={execution.id}
                className="p-3 rounded bg-black/20 border border-white/5 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="text-white font-medium">
                    Workflow: {execution.workflowId}
                  </div>
                  <div className="text-sm text-gray-400">
                    Record: {execution.recordId}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Started: {new Date(execution.startedAt).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    execution.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : execution.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : execution.status === "running"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {execution.status}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              No workflow executions yet
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
