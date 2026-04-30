/**
 * CRM Sales Forecast Page
 * ML-powered sales forecasting
 */

"use client";

import { useEffect, useState } from "react";
import { RiLineChartLine, RiArrowUpLine } from "react-icons/ri";
import type { SalesForecast } from "@/types/crm";

export default function CRMForecastPage() {
  const [forecast, setForecast] = useState<SalesForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      const response = await fetch(
        "/api/crm/forecast?tenantId=default&forecastType=PIPELINE",
      );
      const data = await response.json();
      if (data.success) {
        setForecast(data.data);
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiLineChartLine className="text-purple-400" />
              Sales Forecast
            </h1>
            <p className="text-gray-400 mt-1">ML-powered sales forecasting</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Generating forecast...
            </div>
          </div>
        ) : forecast ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Total Pipeline</p>
              <p className="text-3xl font-bold">
                {formatCurrency(forecast.totalPipeline)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Weighted Pipeline</p>
              <p className="text-3xl font-bold text-purple-400">
                {formatCurrency(forecast.weightedPipeline)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Confidence</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <RiArrowUpLine className="text-green-400" />
                {forecast.confidence}%
              </p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-400">No forecast data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
