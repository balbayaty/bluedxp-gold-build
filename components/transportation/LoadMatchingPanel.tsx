/**
 * Load Matching Panel
 *
 * UI component for displaying load matching results
 */

"use client";

import { motion } from "framer-motion";
import { Truck, MapPin, Clock, DollarSign, Star } from "lucide-react";
import type {
  LoadMatch,
  LoadMatchingResult,
} from "@/lib/services/transportation";

interface LoadMatchingPanelProps {
  result: LoadMatchingResult;
  onSelectMatch?: (match: LoadMatch) => void;
}

export default function LoadMatchingPanel({
  result,
  onSelectMatch,
}: LoadMatchingPanelProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Truck className="w-5 h-5 text-blue-500" />
        Load Matching Results
      </h3>

      {/* Top Match Highlight */}
      {result.topMatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm">Recommended Match</p>
              <p className="text-2xl font-bold mt-1">
                {result.topMatch.carrier.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Match Score</p>
              <p className="text-3xl font-bold">
                {result.topMatch.matchScore}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-blue-100 text-xs">Price</p>
              <p className="text-lg font-semibold">
                {result.topMatch.estimatedPrice.toFixed(2)}{" "}
                {result.request.cargo.value ? "USD" : ""}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-xs">Transit Time</p>
              <p className="text-lg font-semibold">
                {result.topMatch.estimatedTransitTime}h
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-xs">Reliability</p>
              <p className="text-lg font-semibold">
                {result.topMatch.reliability}%
              </p>
            </div>
          </div>

          {onSelectMatch && (
            <button
              onClick={() => onSelectMatch(result.topMatch!)}
              className="mt-4 w-full bg-white text-blue-600 font-semibold py-2 rounded-lg hover:bg-blue-50 transition"
            >
              Select This Carrier
            </button>
          )}
        </motion.div>
      )}

      {/* All Matches */}
      <div className="space-y-4">
        <h4 className="font-semibold">All Matches ({result.matches.length})</h4>
        {result.matches.map((match, index) => (
          <motion.div
            key={match.carrier.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h5 className="font-semibold">{match.carrier.name}</h5>
                  {match.carrier.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm">
                        {match.carrier.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold">
                        {match.estimatedPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Transit</p>
                      <p className="font-semibold">
                        {match.estimatedTransitTime}h
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Reliability</p>
                      <p className="font-semibold">{match.reliability}%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Match Score</p>
                    <p className="font-semibold text-blue-500">
                      {match.matchScore}%
                    </p>
                  </div>
                </div>

                {match.reasons.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">
                      Why this match:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {match.reasons.map((reason, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {match.considerations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-orange-500 mb-1">
                      Considerations:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                      {match.considerations.map((consideration, i) => (
                        <li key={i}>{consideration}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {onSelectMatch && (
                <button
                  onClick={() => onSelectMatch(match)}
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                >
                  Select
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      {result.recommendations &&
        Object.keys(result.recommendations).length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            {result.recommendations.alternativeModes && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Alternative Modes:
                </p>
                <div className="flex gap-2 mt-1">
                  {result.recommendations.alternativeModes.map((mode, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.recommendations.priceOptimization && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Price Optimization:
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside mt-1">
                  {result.recommendations.priceOptimization.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
