/**
 * Pricing Intelligence Panel
 *
 * Market rates, trends, forecasts, and recommendations
 */

"use client";

import { motion } from "framer-motion";
import type { PricingIntelligence } from "@/types/tms";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  BarChart3,
} from "lucide-react";

interface PricingIntelligencePanelProps {
  intelligence: PricingIntelligence;
}

export default function PricingIntelligencePanel({
  intelligence,
}: PricingIntelligencePanelProps) {
  const trendIcon =
    intelligence.rateTrend?.direction === "UP"
      ? TrendingUp
      : intelligence.rateTrend?.direction === "DOWN"
        ? TrendingDown
        : Minus;
  const trendColor =
    intelligence.rateTrend?.direction === "UP"
      ? "text-red-500"
      : intelligence.rateTrend?.direction === "DOWN"
        ? "text-green-500"
        : "text-gray-500";

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Pricing Intelligence
      </h3>

      {/* Market Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Market Rate</p>
            <p className="text-3xl font-bold mt-1">
              {intelligence.marketRate?.toFixed(2)}{" "}
              {intelligence.cargo.currency}
            </p>
            {intelligence.marketRateIndex && (
              <p className="text-blue-100 text-sm mt-1">
                Index: {intelligence.marketRateIndex.indexValue?.toFixed(1)}
              </p>
            )}
          </div>
          <DollarSign className="w-12 h-12 opacity-50" />
        </div>
      </motion.div>

      {/* Rate Trend */}
      {intelligence.rateTrend && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rate Trend</p>
              <div className="flex items-center gap-2 mt-1">
                {trendIcon && <trendIcon className={`w-5 h-5 ${trendColor}`} />}
                <span className={`font-semibold ${trendColor}`}>
                  {intelligence.rateTrend.direction}{" "}
                  {Math.abs(intelligence.rateTrend.change || 0).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">
                  ({intelligence.rateTrend.period})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison */}
      {intelligence.comparison && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* vs Market */}
          {intelligence.comparison.vsMarket && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">vs Market Rate</p>
              <p
                className={`text-2xl font-bold ${
                  intelligence.comparison.vsMarket.status === "BELOW"
                    ? "text-green-500"
                    : intelligence.comparison.vsMarket.status === "ABOVE"
                      ? "text-red-500"
                      : "text-gray-500"
                }`}
              >
                {intelligence.comparison.vsMarket.percentage > 0 ? "+" : ""}
                {intelligence.comparison.vsMarket.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {intelligence.comparison.vsMarket.difference > 0 ? "+" : ""}
                {intelligence.comparison.vsMarket.difference.toFixed(2)}{" "}
                difference
              </p>
            </div>
          )}

          {/* vs Benchmark */}
          {intelligence.comparison.vsBenchmark && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">vs Benchmark</p>
              <p
                className={`text-2xl font-bold ${
                  intelligence.comparison.vsBenchmark.percentage < 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {intelligence.comparison.vsBenchmark.percentage > 0 ? "+" : ""}
                {intelligence.comparison.vsBenchmark.percentage.toFixed(1)}%
              </p>
            </div>
          )}

          {/* vs Historical */}
          {intelligence.comparison.vsHistorical && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
              <p className="text-sm text-gray-600 mb-2">
                vs Historical Average
              </p>
              <p
                className={`text-2xl font-bold ${
                  intelligence.comparison.vsHistorical.percentage < 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {intelligence.comparison.vsHistorical.percentage > 0 ? "+" : ""}
                {intelligence.comparison.vsHistorical.percentage.toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {intelligence.recommendations &&
        intelligence.recommendations.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="space-y-2">
              {intelligence.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                    •
                  </span>
                  <div>
                    <p className="font-medium">{rec.action}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {rec.reason}
                    </p>
                    {rec.suggestedRate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Suggested rate: {rec.suggestedRate.toFixed(2)}{" "}
                        {intelligence.cargo.currency}
                      </p>
                    )}
                    {rec.potentialSavings && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Potential savings: {rec.potentialSavings.toFixed(2)}{" "}
                        {intelligence.cargo.currency}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Forecast */}
      {intelligence.forecast && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <h4 className="font-semibold mb-3">Price Forecast</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Next 30 Days</p>
              <p className="text-xl font-bold">
                {intelligence.forecast.next30Days?.toFixed(2)}{" "}
                {intelligence.cargo.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next 90 Days</p>
              <p className="text-xl font-bold">
                {intelligence.forecast.next90Days?.toFixed(2)}{" "}
                {intelligence.cargo.currency}
              </p>
            </div>
          </div>
          {intelligence.forecast.confidence && (
            <p className="text-xs text-gray-500 mt-2">
              Confidence: {(intelligence.forecast.confidence * 100).toFixed(0)}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}
