"use client";

import { useState, useEffect } from "react";
import Tooltip from "@/components/Tooltip";
import { useCustomer } from "@/contexts/CustomerContext";

interface SKUAnalyticsBadgeProps {
  skuId: string;
  compact?: boolean;
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
}

interface AnalyticsData {
  classification?: {
    abcClass: "A" | "B" | "C";
    xyzClass: "X" | "Y" | "Z";
    combinedClass: string;
  };
  forecast?: {
    predictedDemand: number;
    confidenceLevel: number;
  };
}

export default function SKUAnalyticsBadge({
  skuId,
  compact = false,
  tenantId: propTenantId,
  customerId: propCustomerId,
  warehouseId: propWarehouseId,
}: SKUAnalyticsBadgeProps) {
  const { currentCustomer } = useCustomer();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Get tenant/customer/warehouse from props or context
  const tenantId = propTenantId;
  const customerId = propCustomerId || currentCustomer?.id;
  const warehouseId = propWarehouseId;

  useEffect(() => {
    loadAnalytics();
  }, [skuId, tenantId, customerId, warehouseId]);

  const loadAnalytics = async () => {
    try {
      // Build query params with proper segregation
      const params = new URLSearchParams({ skuId, type: "classification" });
      if (tenantId) params.append("tenantId", tenantId);
      if (customerId) params.append("customerId", customerId);
      if (warehouseId) params.append("warehouseId", warehouseId);

      const forecastParams = new URLSearchParams({ skuId, type: "forecast" });
      if (tenantId) forecastParams.append("tenantId", tenantId);
      if (customerId) forecastParams.append("customerId", customerId);
      if (warehouseId) forecastParams.append("warehouseId", warehouseId);

      // Fetch both classification and forecast for comprehensive display
      const [classificationRes, forecastRes] = await Promise.all([
        fetch(`/api/wms/sku/analytics?${params.toString()}`),
        fetch(`/api/wms/sku/analytics?${forecastParams.toString()}`).catch(
          () => null,
        ),
      ]);

      const classificationResult = await classificationRes.json();
      const forecastResult = forecastRes ? await forecastRes.json() : null;

      if (classificationResult.success && classificationResult.data) {
        setAnalytics({
          classification: classificationResult.data.classification || undefined,
          forecast:
            forecastResult?.success && forecastResult.data?.forecast
              ? {
                  predictedDemand: forecastResult.data.forecast.predictedDemand,
                  confidenceLevel: forecastResult.data.forecast.confidenceLevel,
                }
              : undefined,
        });
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1">
        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics?.classification) {
    return null;
  }

  const { abcClass, xyzClass, combinedClass } = analytics.classification;

  // Color coding for ABC classes
  const abcColors = {
    A: "bg-red-500/20 text-red-400 border-red-500/30",
    B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    C: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  // Color coding for XYZ classes
  const xyzColors = {
    X: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Y: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Z: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  };

  if (compact) {
    return (
      <Tooltip
        content={
          <div className="text-xs">
            <div>ABC: {abcClass} (Value-based)</div>
            <div>XYZ: {xyzClass} (Variability-based)</div>
            <div>Combined: {combinedClass}</div>
            {analytics.forecast && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div>
                  Forecast:{" "}
                  {analytics.forecast.predictedDemand.toLocaleString()}
                </div>
                <div>Confidence: {analytics.forecast.confidenceLevel}%</div>
              </div>
            )}
          </div>
        }
        position="top"
      >
        <div className="inline-flex items-center gap-1">
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium border ${abcColors[abcClass]}`}
          >
            {abcClass}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium border ${xyzColors[xyzClass]}`}
          >
            {xyzClass}
          </span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip
        content={`ABC Class ${abcClass}: ${abcClass === "A" ? "High Value" : abcClass === "B" ? "Medium Value" : "Low Value"}`}
        position="top"
      >
        <span
          className={`px-2 py-1 rounded text-xs font-medium border ${abcColors[abcClass]}`}
        >
          ABC: {abcClass}
        </span>
      </Tooltip>
      <Tooltip
        content={`XYZ Class ${xyzClass}: ${xyzClass === "X" ? "Low Variability" : xyzClass === "Y" ? "Medium Variability" : "High Variability"}`}
        position="top"
      >
        <span
          className={`px-2 py-1 rounded text-xs font-medium border ${xyzColors[xyzClass]}`}
        >
          XYZ: {xyzClass}
        </span>
      </Tooltip>
      <Tooltip
        content={`Combined Classification: ${combinedClass}`}
        position="top"
      >
        <span className="px-2 py-1 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          {combinedClass}
        </span>
      </Tooltip>
      {analytics.forecast && (
        <Tooltip
          content={
            <div className="text-xs">
              <div>
                Predicted Demand:{" "}
                {analytics.forecast.predictedDemand.toLocaleString()}
              </div>
              <div>Confidence: {analytics.forecast.confidenceLevel}%</div>
            </div>
          }
          position="top"
        >
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <i className="ri-line-chart-line mr-1"></i>
            {analytics.forecast.predictedDemand.toLocaleString()}
          </span>
        </Tooltip>
      )}
    </div>
  );
}
