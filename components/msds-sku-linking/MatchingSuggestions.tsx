"use client";

/**
 * Matching Suggestions Component
 * Shows intelligent matching suggestions for MSDS-SKU linking
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MSDSDocument } from "@/types/chemical";
import { SKU } from "@/types/sku";
import LinkButton from "./LinkButton";
import LinkStatusBadge from "./LinkStatusBadge";

interface MatchingSuggestion {
  msdsId: string;
  skuId: string;
  strategy: string;
  confidenceScore: number;
  matchedFields: Array<{
    field: string;
    msdsValue: string;
    skuValue: string;
    matchType: string;
    confidence: number;
  }>;
}

interface MatchingSuggestionsProps {
  msds?: MSDSDocument;
  sku?: SKU;
  customerId?: string;
  onLinkCreated?: () => void;
}

export default function MatchingSuggestions({
  msds,
  sku,
  customerId,
  onLinkCreated,
}: MatchingSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MatchingSuggestion[]>([]);
  const [matches, setMatches] = useState<MatchingSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ((msds || sku) && customerId) {
      loadSuggestions();
    }
  }, [msds?.id, sku?.id, customerId]);

  const loadSuggestions = async () => {
    if (!msds && !sku) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/msds-sku-linking/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msdsId: msds?.id,
          skuId: sku?.id,
          customerId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMatches(data.data.matches || []);
        setSuggestions(data.data.suggestions || []);
      } else {
        setError(data.error || "Failed to load suggestions");
      }
    } catch (err) {
      setError("Failed to load matching suggestions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-2">Finding matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const allSuggestions = [...matches, ...suggestions];

  if (allSuggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="ri-search-line text-4xl mb-2"></i>
        <p>No matching suggestions found</p>
        <p className="text-xs mt-1">Try manual linking instead</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <i className="ri-star-line text-yellow-400"></i>
            High Confidence Matches ({matches.length})
          </h4>
          <div className="space-y-2">
            {matches.map((match, index) => (
              <SuggestionCard
                key={`match-${index}`}
                suggestion={match}
                msds={msds}
                sku={sku}
                customerId={customerId}
                onLinkCreated={onLinkCreated}
                isHighConfidence
              />
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <i className="ri-lightbulb-line text-cyan-400"></i>
            Suggestions ({suggestions.length})
          </h4>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <SuggestionCard
                key={`suggestion-${index}`}
                suggestion={suggestion}
                msds={msds}
                sku={sku}
                customerId={customerId}
                onLinkCreated={onLinkCreated}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  suggestion,
  msds,
  sku,
  customerId,
  onLinkCreated,
  isHighConfidence = false,
}: {
  suggestion: MatchingSuggestion;
  msds?: MSDSDocument;
  sku?: SKU;
  customerId?: string;
  onLinkCreated?: () => void;
  isHighConfidence?: boolean;
}) {
  const confidenceColor =
    suggestion.confidenceScore >= 80
      ? "text-green-400"
      : suggestion.confidenceScore >= 60
        ? "text-yellow-400"
        : "text-orange-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-white/5 border rounded-lg p-4 ${
        isHighConfidence ? "border-yellow-500/30" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {msds ? (
              <Link
                href={`/wms/skus/${suggestion.skuId}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                SKU {suggestion.skuId}
              </Link>
            ) : (
              <Link
                href={`/chemical/msds/${suggestion.msdsId}`}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                MSDS {suggestion.msdsId}
              </Link>
            )}
            <span className={`text-sm font-semibold ${confidenceColor}`}>
              {suggestion.confidenceScore}%
            </span>
            <span className="text-xs text-gray-400">{suggestion.strategy}</span>
          </div>
          {suggestion.matchedFields.length > 0 && (
            <div className="text-xs text-gray-400 space-y-1">
              {suggestion.matchedFields.slice(0, 3).map((field, idx) => (
                <div key={idx}>
                  <span className="text-gray-500">{field.field}:</span>{" "}
                  <span className="text-white">
                    {field.msdsValue || field.skuValue}
                  </span>
                  <span className="ml-2 text-gray-600">
                    ({field.matchType})
                  </span>
                </div>
              ))}
              {suggestion.matchedFields.length > 3 && (
                <div className="text-gray-600">
                  +{suggestion.matchedFields.length - 3} more fields
                </div>
              )}
            </div>
          )}
        </div>
        <LinkButton
          msdsId={msds?.id || suggestion.msdsId}
          skuId={sku?.id || suggestion.skuId}
          customerId={customerId}
          variant="icon"
          size="sm"
          onLinkCreated={onLinkCreated}
        />
      </div>
    </motion.div>
  );
}
