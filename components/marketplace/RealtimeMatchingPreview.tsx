/**
 * Real-Time Matching Preview Component
 * Shows live matching results as user fills the form
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Star,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { aiMatchingService } from "@/lib/services/marketplace/aiMatchingService";
import type { ServiceRequirement } from "@/types/marketplace-requirements";

interface RealtimeMatchingPreviewProps {
  requirement: Partial<ServiceRequirement>;
  category: string;
  onMatchSelect?: (matchId: string) => void;
}

export default function RealtimeMatchingPreview({
  requirement,
  category,
  onMatchSelect,
}: RealtimeMatchingPreviewProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null,
  );

  const hasMinimumData = useMemo(() => {
    // Check if we have minimum data for matching
    return (
      requirement.category &&
      (requirement.location?.address || requirement.location?.city) &&
      requirement.timeline?.startDate
    );
  }, [requirement]);

  useEffect(() => {
    if (!hasMinimumData) {
      setMatches([]);
      return;
    }

    // Debounce matching calls
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      performMatching();
    }, 1000); // Wait 1 second after user stops typing

    setDebounceTimer(timer);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [requirement, hasMinimumData]);

  const performMatching = async () => {
    setIsLoading(true);
    try {
      const result = await aiMatchingService.findMatches(
        requirement as ServiceRequirement,
      );
      setMatches(result.matches.slice(0, 5)); // Show top 5 matches
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Matching error:", error);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getMatchScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-orange-100 dark:bg-orange-900/20";
  };

  if (!hasMinimumData) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm">
            Fill in location and timeline to see matching providers
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-slate-800 dark:text-slate-200">
            Live Matching Results
          </h4>
        </div>
        {lastUpdate && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Finding best matches...
            </span>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              No matches found. Try adjusting your requirements.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => (
            <motion.div
              key={match.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onMatchSelect?.(match.id)}
              className="p-4 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {match.providerName || match.name || "Provider"}
                    </h5>
                    {match.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {match.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {match.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{match.location}</span>
                      </div>
                    )}
                    {match.priceRange && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {match.priceRange.min} - {match.priceRange.max}{" "}
                          {match.priceRange.currency}
                        </span>
                      </div>
                    )}
                    {match.estimatedTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{match.estimatedTime}</span>
                      </div>
                    )}
                  </div>

                  {match.reasons && match.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.reasons
                        .slice(0, 3)
                        .map((reason: string, rIdx: number) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {reason}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`px-3 py-1.5 rounded-lg font-bold ${getMatchScoreBg(
                      match.matchScore || 0,
                    )} ${getMatchScoreColor(match.matchScore || 0)}`}
                  >
                    {Math.round(match.matchScore || 0)}%
                  </div>
                  {match.verified && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {matches.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
          <button
            onClick={performMatching}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            View All Matches →
          </button>
        </div>
      )}
    </motion.div>
  );
}
