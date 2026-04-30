/**
 * QHSE Advanced Search Page
 * Full-text search across all QHSE data
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiSearch, FiFilter, FiSave, FiX } from "react-icons/fi";
import type { SearchResultItem } from "@/lib/services/qhse/search/qhseSearchService";

export default function QHSESearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    types: [] as string[],
    status: [] as string[],
    severity: [] as string[],
  });

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("q", query);
      if (filters.types.length > 0)
        params.append("types", filters.types.join(","));
      if (filters.status.length > 0)
        params.append("status", filters.status.join(","));
      if (filters.severity.length > 0)
        params.append("severity", filters.severity.join(","));

      const response = await fetch(`/api/qhse/search?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setResults(data.data.results || []);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
        <p className="text-gray-600 mt-1">Search across all QHSE data</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search incidents, inspections, training..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            <FiSearch className="w-5 h-5" />
            Search
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <FiFilter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <FiSave className="w-4 h-4" />
            Save Search
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {results.length} Results
            </h2>
          </div>
          {results.map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md cursor-pointer"
              onClick={() => (window.location.href = result.link)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {result.title}
                  </h3>
                  {result.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {result.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {result.type}
                    </span>
                    {result.metadata.status && (
                      <span>Status: {result.metadata.status}</span>
                    )}
                    {result.metadata.severity && (
                      <span>Severity: {result.metadata.severity}</span>
                    )}
                    <span>Relevance: {result.relevance}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center p-8 text-gray-500">
          <FiSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No results found</p>
        </div>
      )}
    </div>
  );
}
