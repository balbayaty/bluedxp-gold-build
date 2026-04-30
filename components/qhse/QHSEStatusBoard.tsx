/**
 * Enhanced QHSE Status Board Component
 * Comprehensive QHSE status visualization
 * Much more comprehensive than source apps
 */

"use client";

import { useEffect, useState } from "react";
import type { QHSEDashboard } from "@/types/qhse";

interface QHSEStatusBoardProps {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  autoRefresh?: boolean;
}

export default function QHSEStatusBoard({
  tenantId,
  customerId,
  warehouseId,
  autoRefresh = true,
}: QHSEStatusBoardProps) {
  const [dashboard, setDashboard] = useState<QHSEDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboard, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [tenantId, customerId, warehouseId, autoRefresh]);

  const fetchDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append("tenantId", tenantId);
      if (customerId) params.append("customerId", customerId);
      if (warehouseId) params.append("warehouseId", warehouseId);

      const response = await fetch(
        `/api/qhse/reports?type=dashboard&${params.toString()}`,
      );
      const data = await response.json();

      if (data.success) {
        setDashboard(data.data);
      }
    } catch (error) {
      console.error("Error fetching QHSE dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-4 text-center text-gray-500">
        No QHSE data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Safety Metrics */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">TRIR</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboard.safety.trir.toFixed(2)}
            </p>
          </div>
          <i className="ri-shield-check-line text-3xl text-red-500 opacity-50"></i>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">LTIFR</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboard.safety.ltifr.toFixed(2)}
            </p>
          </div>
          <i className="ri-error-warning-line text-3xl text-orange-500 opacity-50"></i>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Compliance</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {dashboard.compliance.overallScore}%
            </p>
          </div>
          <i className="ri-shield-star-line text-3xl text-blue-500 opacity-50"></i>
        </div>
      </div>

      {/* Environmental */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Recycling Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {dashboard.environmental.recyclingRate.toFixed(1)}%
            </p>
          </div>
          <i className="ri-leaf-line text-3xl text-green-500 opacity-50"></i>
        </div>
      </div>
    </div>
  );
}
