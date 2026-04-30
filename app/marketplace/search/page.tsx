/**
 * Enhanced Intelligent Search Interface
 * Semantic search with intent understanding and entity extraction
 * World-class UX with real-time suggestions and results
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Filter,
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Lightbulb,
  Target,
  Zap,
  Globe,
  Package,
  Truck,
  Building2,
} from "lucide-react";
import { intelligentSearchService } from "@/lib/services/marketplace/intelligentSearchService";
import { marketplaceService } from "@/lib/services/marketplace/marketplaceService";

export default function IntelligentSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [intent, setIntent] = useState<any>(null);
  const [entities, setEntities] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    if (query.length > 2) {
      performSearch();
    } else {
      setSearchResults(null);
      setIntent(null);
      setEntities(null);
    }
  }, [query, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const result = await intelligentSearchService.search({
        query,
        filters,
      });
      setSearchResults(result);
      setIntent(result.intent);
      setEntities(result.entities);
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const intentIcon = useMemo(() => {
    if (!intent) return Search;
    const icons: Record<string, any> = {
      FIND_SERVICE: Search,
      COMPARE: TrendingUp,
      GET_QUOTE: DollarSign,
      LEARN_MORE: Lightbulb,
      BOOK_NOW: CheckCircle2,
    };
    return icons[intent.type] || Search;
  }, [intent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <HeaderSection />

        {/* Search Bar */}
        <SearchBarSection
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          loading={loading}
          suggestions={suggestions}
        />

        {/* Intent & Entities */}
        {(intent || entities) && (
          <IntentEntitiesSection
            intent={intent}
            entities={entities}
            intentIcon={intentIcon}
          />
        )}

        {/* Filters */}
        <FiltersSection
          show={showFilters}
          filters={filters}
          onFiltersChange={setFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {/* Search Results */}
        <SearchResultsSection
          results={searchResults}
          loading={loading}
          onResultClick={(id) => router.push(`/marketplace/listings/${id}`)}
        />

        {/* Related Categories */}
        {searchResults?.relatedCategories && (
          <RelatedCategoriesSection
            categories={searchResults.relatedCategories}
          />
        )}
      </div>
    </div>
  );
}

function HeaderSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 text-center"
    >
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3 mb-2">
        <Sparkles className="w-10 h-10 text-blue-600" />
        Intelligent Search
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        AI-powered semantic search with intent understanding
      </p>
    </motion.div>
  );
}

function SearchBarSection({
  query,
  onQueryChange,
  onSearch,
  loading,
  suggestions,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (q: string) => void;
  loading: boolean;
  suggestions: string[];
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="relative max-w-3xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              onQueryChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search for services... (e.g., 'cold storage in Riyadh', 'express delivery to Jeddah')"
            className="w-full pl-12 pr-32 py-4 text-lg bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && query && (
            <button
              onClick={() => onSearch(query)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onQueryChange(suggestion);
                    onSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-6 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                >
                  <Search className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">
                    {suggestion}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function IntentEntitiesSection({
  intent,
  entities,
  intentIcon: IntentIcon,
}: {
  intent: any;
  entities: any;
  intentIcon: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Intent Card */}
      {intent && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <IntentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Detected Intent
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                {intent.type?.toLowerCase().replace("_", " ")}
              </p>
            </div>
            {intent.confidence && (
              <div className="ml-auto">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                  {intent.confidence}% confidence
                </span>
              </div>
            )}
          </div>
          {intent.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {intent.description}
            </p>
          )}
        </div>
      )}

      {/* Entities Card */}
      {entities && Object.keys(entities).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            Extracted Information
          </h3>
          <div className="space-y-3">
            {entities.serviceType && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Service:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {entities.serviceType}
                </span>
              </div>
            )}
            {entities.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Location:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {entities.location}
                </span>
              </div>
            )}
            {entities.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Budget:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {entities.budget}
                </span>
              </div>
            )}
            {entities.urgency && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Urgency:
                </span>
                <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                  {entities.urgency.toLowerCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FiltersSection({
  show,
  filters,
  onFiltersChange,
  onToggle,
}: {
  show: boolean;
  filters: any;
  onFiltersChange: (f: any) => void;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: show ? "auto" : 0 }}
      className="mb-8 overflow-hidden"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h3>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={filters.category || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">All Categories</option>
              <option value="STORAGE">Storage</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="FREIGHT">Freight</option>
              <option value="CROSSDOCKING">Cross-Docking</option>
              <option value="CONSULTING">Consulting</option>
              <option value="MANPOWER">Manpower</option>
              <option value="TRANSLATION">Translation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Location
            </label>
            <input
              type="text"
              value={filters.location || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, location: e.target.value })
              }
              placeholder="City or region"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Min Price
            </label>
            <input
              type="number"
              value={filters.minPrice || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, minPrice: e.target.value })
              }
              placeholder="0"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Max Price
            </label>
            <input
              type="number"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, maxPrice: e.target.value })
              }
              placeholder="No limit"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SearchResultsSection({
  results,
  loading,
  onResultClick,
}: {
  results: any;
  loading: boolean;
  onResultClick: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Searching...</p>
      </div>
    );
  }

  if (!results || !results.results || results.results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No Results Found
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your search query or filters
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Search Results ({results.results.length})
        </h2>
        {results.confidence && (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
            {results.confidence}% Match Confidence
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.results.map((result: any, idx: number) => (
          <motion.div
            key={result.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onResultClick(result.id)}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                  {result.title || "Service Listing"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {result.description || "No description available"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              {result.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{result.location}</span>
                </div>
              )}
              {result.price && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{result.price}</span>
                </div>
              )}
            </div>
            {result.matchScore && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Match Score
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {result.matchScore}%
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function RelatedCategoriesSection({ categories }: { categories: string[] }) {
  const categoryIcons: Record<string, any> = {
    STORAGE: Building2,
    TRANSPORTATION: Truck,
    FREIGHT: Package,
    CROSSDOCKING: Network,
    CONSULTING: Users,
    MANPOWER: Users,
    TRANSLATION: Globe,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
        Related Categories
      </h3>
      <div className="flex flex-wrap gap-3">
        {categories.map((category, idx) => {
          const Icon = categoryIcons[category] || Package;
          return (
            <button
              key={idx}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {category.replace("_", " ")}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
