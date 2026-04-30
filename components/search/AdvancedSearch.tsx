/**
 * Advanced Search Component
 * Full-text search with filters, saved searches, and history
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  advancedSearchService,
  SearchFilter,
  SavedSearch,
} from "@/lib/services/search/advancedSearchService";

interface AdvancedSearchProps {
  entityType?: string;
  onSearch: (query: string, filters: SearchFilter[]) => void;
  placeholder?: string;
}

export default function AdvancedSearch({
  entityType,
  onSearch,
  placeholder = "Search...",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (entityType) {
      loadSavedSearches();
    }
  }, [entityType]);

  useEffect(() => {
    if (query.length > 2) {
      const suggs = advancedSearchService.getSuggestions(query, entityType);
      setSuggestions(suggs);
    } else {
      setSuggestions([]);
    }
  }, [query, entityType]);

  const loadSavedSearches = () => {
    const saved = advancedSearchService.getSavedSearches(entityType);
    setSavedSearches(saved);
  };

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      {
        field: "",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleUpdateFilter = (
    index: number,
    updates: Partial<SearchFilter>,
  ) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], ...updates };
    setFilters(updated);
  };

  const handleSaveSearch = () => {
    if (!query.trim() && filters.length === 0) return;

    const saved = advancedSearchService.saveSearch({
      name: `Search ${new Date().toLocaleString()}`,
      query,
      filters,
      entityType: entityType || "all",
    });

    loadSavedSearches();
    setShowSaved(false);
  };

  const handleUseSavedSearch = (saved: SavedSearch) => {
    setQuery(saved.query);
    setFilters(saved.filters);
    onSearch(saved.query, saved.filters);
    advancedSearchService.useSavedSearch(saved.id);
    setShowSaved(false);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder={placeholder}
              className="w-full px-4 py-3 pl-10 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 outline-none"
            />
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg transition ${
              filters.length > 0
                ? "bg-cyan-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <i className="ri-filter-line"></i>
            {filters.length > 0 && (
              <span className="ml-1 text-xs">{filters.length}</span>
            )}
          </button>
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="px-4 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            <i className="ri-bookmark-line"></i>
          </button>
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-50"
            >
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition first:rounded-t-lg last:rounded-b-lg"
                >
                  <i className="ri-history-line mr-2 text-gray-500"></i>
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white">Filters</h4>
              <button
                onClick={handleAddFilter}
                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm transition"
              >
                <i className="ri-add-line mr-1"></i>
                Add Filter
              </button>
            </div>

            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={filter.field}
                  onChange={(e) =>
                    handleUpdateFilter(index, { field: e.target.value })
                  }
                  placeholder="Field"
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 outline-none"
                />
                <select
                  value={filter.operator}
                  onChange={(e) =>
                    handleUpdateFilter(index, {
                      operator: e.target.value as any,
                    })
                  }
                  className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 outline-none"
                >
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="between">Between</option>
                  <option value="in">In</option>
                </select>
                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) =>
                    handleUpdateFilter(index, { value: e.target.value })
                  }
                  placeholder="Value"
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:border-cyan-500 outline-none"
                />
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
            ))}

            {filters.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-700">
                <button
                  onClick={handleSaveSearch}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition"
                >
                  <i className="ri-bookmark-line mr-1"></i>
                  Save Search
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Searches */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <h4 className="font-semibold text-white mb-3">Saved Searches</h4>
            {savedSearches.length === 0 ? (
              <p className="text-sm text-gray-400">No saved searches</p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => handleUseSavedSearch(saved)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-left transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {saved.name}
                        </p>
                        <p className="text-xs text-gray-400">{saved.query}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        Used {saved.useCount} times
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
