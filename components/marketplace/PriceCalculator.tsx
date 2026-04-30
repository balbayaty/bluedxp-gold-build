/**
 * Real-Time Price Estimation Calculator
 * Features: Dynamic pricing, cost breakdown, budget comparison
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { predictivePricingService } from "@/lib/services/marketplace/predictivePricingService";

interface PriceCalculatorProps {
  requirement: any;
  category: string;
  onPriceUpdate?: (price: {
    min: number;
    max: number;
    currency: string;
  }) => void;
}

export default function PriceCalculator({
  requirement,
  category,
  onPriceUpdate,
}: PriceCalculatorProps) {
  const [estimatedPrice, setEstimatedPrice] = useState<{
    min: number;
    max: number;
    currency: string;
    confidence: number;
    breakdown?: any;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [factors, setFactors] = useState<string[]>([]);

  useEffect(() => {
    calculatePrice();
  }, [requirement, category]);

  const calculatePrice = async () => {
    setIsCalculating(true);
    try {
      // Use predictive pricing service
      const result = await predictivePricingService.estimatePrice({
        category,
        requirement: requirement as any,
      });

      setEstimatedPrice({
        min: result.priceRange.min,
        max: result.priceRange.max,
        currency: result.priceRange.currency || "SAR",
        confidence: result.confidence || 75,
        breakdown: result.breakdown,
      });

      setFactors(result.factors || []);

      if (onPriceUpdate) {
        onPriceUpdate({
          min: result.priceRange.min,
          max: result.priceRange.max,
          currency: result.priceRange.currency || "SAR",
        });
      }
    } catch (error) {
      console.error("Price calculation error:", error);
      // Fallback to manual calculation
      const fallbackPrice = calculateFallbackPrice();
      setEstimatedPrice(fallbackPrice);
      if (onPriceUpdate) {
        onPriceUpdate({
          min: fallbackPrice.min,
          max: fallbackPrice.max,
          currency: fallbackPrice.currency,
        });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateFallbackPrice = () => {
    // Simple fallback calculation based on category
    const basePrices: Record<string, { min: number; max: number }> = {
      STORAGE: { min: 500, max: 5000 },
      TRANSPORTATION: { min: 1000, max: 10000 },
      FREIGHT: { min: 2000, max: 20000 },
      CONSULTING: { min: 5000, max: 50000 },
      MANPOWER: { min: 3000, max: 30000 },
      TRANSLATION: { min: 500, max: 5000 },
      CROSSDOCKING: { min: 1000, max: 10000 },
      WAREHOUSE_NETWORK: { min: 10000, max: 100000 },
    };

    const base = basePrices[category] || { min: 1000, max: 10000 };

    // Adjust based on duration, quantity, etc.
    let multiplier = 1;
    if (requirement?.timeline?.duration) {
      multiplier *= Math.max(1, requirement.timeline.duration / 30);
    }
    if (requirement?.budget?.min && requirement?.budget?.max) {
      return {
        min: requirement.budget.min,
        max: requirement.budget.max,
        currency: requirement.budget.currency || "SAR",
        confidence: 50,
      };
    }

    return {
      min: base.min * multiplier,
      max: base.max * multiplier,
      currency: "SAR",
      confidence: 50,
    };
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!estimatedPrice) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Calculator className="w-5 h-5" />
          <span className="text-sm">
            Fill in requirements to see price estimate
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            Estimated Price Range
          </h4>
        </div>
        {isCalculating && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Calculating...
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Price Range */}
        <div className="flex items-baseline gap-3">
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Minimum
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(estimatedPrice.min, estimatedPrice.currency)}
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-slate-400" />
          <div className="flex-1 text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Maximum
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(estimatedPrice.max, estimatedPrice.currency)}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${estimatedPrice.confidence}%` }}
              className={`h-full ${
                estimatedPrice.confidence >= 75
                  ? "bg-green-500"
                  : estimatedPrice.confidence >= 50
                    ? "bg-yellow-500"
                    : "bg-orange-500"
              }`}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {estimatedPrice.confidence}% confidence
          </span>
        </div>

        {/* Price Factors */}
        {factors.length > 0 && (
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Price Factors:
            </p>
            <div className="flex flex-wrap gap-2">
              {factors.map((factor, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-600"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown */}
        {estimatedPrice.breakdown && (
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800 space-y-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Cost Breakdown:
            </p>
            {Object.entries(estimatedPrice.breakdown).map(
              ([key, value]: [string, any]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(value, estimatedPrice.currency)}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        {/* Budget Comparison */}
        {requirement?.budget && (
          <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
            {estimatedPrice.min >= (requirement.budget.min || 0) &&
            estimatedPrice.max <= (requirement.budget.max || Infinity) ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Within budget range</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  May exceed budget - consider adjusting requirements
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
