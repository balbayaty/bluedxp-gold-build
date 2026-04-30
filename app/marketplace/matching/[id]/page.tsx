/**
 * AI Matching Results Page
 * Comprehensive results with full drill-downs, comparisons, and insights
 * World-class UX with every detail accessible
 */

"use client";

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Star,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Filter,
  Download,
  Share2,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Award,
  Shield,
  Truck,
  Package,
  Building2,
  Users,
  Languages,
  Network,
  BarChart3,
  Zap,
  Target,
} from "lucide-react";
import { aiMatchingService } from "@/lib/services/marketplace/aiMatchingService";
import type {
  MatchingResult,
  MatchResult,
} from "@/lib/services/marketplace/aiMatchingService";
import { marketplaceService } from "@/lib/services/marketplace";

export default function MatchingResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["top"]),
  );
  const [sortBy, setSortBy] = useState<"score" | "price" | "rating">("score");
  const [filterRating, setFilterRating] = useState<number>(0);

  useEffect(() => {
    loadResults();
  }, [params.id]);

  const loadResults = async () => {
    try {
      // In real implementation, would fetch requirement and get matches
      // For now, using mock
      setLoading(false);
    } catch (error) {
      console.error("Failed to load results:", error);
      setLoading(false);
    }
  };

  // Memoize sorted matches for performance
  const sortedMatches = useMemo(() => {
    return (
      result?.matches
        ?.filter((m) => m.listing.rating >= filterRating)
        .sort((a, b) => {
          if (sortBy === "score") return b.matchScore - a.matchScore;
          if (sortBy === "price")
            return (a.estimatedPrice || 0) - (b.estimatedPrice || 0);
          return b.listing.rating - a.listing.rating;
        }) || []
    );
  }, [result?.matches, filterRating, sortBy]);

  if (loading) {
    return <LoadingState />;
  }

  if (!result) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <HeaderSection result={result} />

        {/* Completeness & Recommendations */}
        <CompletenessSection
          completeness={result.completeness}
          recommendations={result.recommendations}
        />

        {/* Filters & Sort */}
        <FiltersSection
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterRating={filterRating}
          onFilterRatingChange={setFilterRating}
          totalMatches={result.matches.length}
        />

        {/* Top Match Highlight */}
        {result.topMatch && (
          <TopMatchCard
            match={result.topMatch}
            expanded={expandedSections.has("top")}
            onToggle={() => toggleSection("top")}
            onSelect={() => setSelectedMatch(result.topMatch!.listing.id)}
          />
        )}

        {/* All Matches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {sortedMatches.map((match, index) => (
            <MatchCard
              key={match.listing.id}
              match={match}
              index={index}
              selected={selectedMatch === match.listing.id}
              onSelect={() => setSelectedMatch(match.listing.id)}
              expanded={expandedSections.has(match.listing.id)}
              onToggle={() => toggleSection(match.listing.id)}
            />
          ))}
        </div>

        {/* Selected Match Detail Modal */}
        <AnimatePresence>
          {selectedMatch && (
            <MatchDetailModal
              match={sortedMatches.find((m) => m.listing.id === selectedMatch)}
              onClose={() => setSelectedMatch(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}

function HeaderSection({ result }: { result: MatchingResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            AI-Powered Matching Results
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Found {result.matches.length} matches for your requirements
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CompletenessSection({ completeness, recommendations }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Matching Confidence</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Based on requirement completeness
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {completeness.confidence}%
          </div>
          <div className="text-sm text-slate-500">Confidence</div>
        </div>
      </div>
      {recommendations.improveCompleteness &&
        recommendations.improveCompleteness.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-400">
              Improve Matching:
            </p>
            <ul className="space-y-1">
              {recommendations.improveCompleteness.map(
                (field: string, idx: number) => (
                  <li
                    key={idx}
                    className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {field}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
    </motion.div>
  );
}

function FiltersSection({
  sortBy,
  onSortChange,
  filterRating,
  onFilterRatingChange,
  totalMatches,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-4"
    >
      <div className="flex items-center gap-4">
        <Filter className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-medium">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
        >
          <option value="score">Match Score</option>
          <option value="price">Price</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Min Rating:</span>
        <select
          value={filterRating}
          onChange={(e) => onFilterRatingChange(Number(e.target.value))}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
        >
          <option value={0}>Any</option>
          <option value={3}>3+ Stars</option>
          <option value={4}>4+ Stars</option>
          <option value={4.5}>4.5+ Stars</option>
        </select>
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {totalMatches} matches found
      </div>
    </motion.div>
  );
}

function TopMatchCard({ match, expanded, onToggle, onSelect }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-6 text-white"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold">Top Match</h3>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                {match.matchScore}% Match
              </span>
            </div>
            <p className="text-blue-100">
              {match.listing.title || "Service Listing"}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-4 pt-4 border-t border-white/20"
        >
          <MatchDetails match={match} />
        </motion.div>
      )}
      <button
        onClick={onSelect}
        className="mt-4 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
      >
        View Full Details
      </button>
    </motion.div>
  );
}

function MatchCard({
  match,
  index,
  selected,
  onSelect,
  expanded,
  onToggle,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 transition-all cursor-pointer ${
        selected
          ? "border-blue-500 shadow-blue-500/20"
          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"
      }`}
      onClick={onSelect}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">
              {match.listing.title || "Service"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {match.provider.name}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{match.listing.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Location</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {match.matchScore}%
            </div>
            <div className="text-xs text-slate-500">Match</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Price</div>
            <div className="font-semibold">
              {match.estimatedPrice
                ? `SAR ${match.estimatedPrice.toLocaleString()}`
                : "Quote Based"}
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Confidence</div>
            <div className="font-semibold">{match.confidence}%</div>
          </div>
        </div>

        {match.strengths && match.strengths.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Strengths:
            </p>
            <div className="flex flex-wrap gap-2">
              {match.strengths
                .slice(0, 3)
                .map((strength: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs"
                  >
                    {strength}
                  </span>
                ))}
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {expanded ? "Show Less" : "Show More Details"}
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
            >
              <MatchDetails match={match} compact />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MatchDetails({
  match,
  compact = false,
}: {
  match: MatchResult;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Why This Match</h4>
        <ul className="space-y-1">
          {match.reasons.map((reason, idx) => (
            <li
              key={idx}
              className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {match.strengths && match.strengths.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Key Strengths</h4>
          <div className="flex flex-wrap gap-2">
            {match.strengths.map((strength, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs"
              >
                {strength}
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Provider Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Rating: {match.provider.rating}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span>{match.provider.totalBookings} bookings</span>
                </div>
                {match.provider.verified && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Verified Provider</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact</h4>
              <div className="space-y-2 text-sm">
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <Phone className="w-4 h-4" />
                  Call Provider
                </button>
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                  <Mail className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MatchDetailModal({
  match,
  onClose,
}: {
  match?: MatchResult;
  onClose: () => void;
}) {
  if (!match) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Service Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
          <MatchDetails match={match} />
          <div className="mt-6 flex gap-4">
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
              Book This Service
            </button>
            <button className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              Compare
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading matches...</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your requirements
        </p>
      </div>
    </div>
  );
}
