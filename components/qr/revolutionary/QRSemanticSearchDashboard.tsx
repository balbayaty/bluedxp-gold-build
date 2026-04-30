"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function QRSemanticSearchDashboard() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = async () => {
    if (!query) return;

    setIsSearching(true);
    setResults([]);
    try {
      const res = await fetch("/api/qr/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          options: { limit: 10 },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const exampleQueries = [
    "Find QR codes for chemicals in Riyadh",
    "Show me MSDS QR codes",
    "QR codes related to compliance",
    "Find QR codes scanned in the last week",
  ];

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-search-line text-pink-400"></i>
          Semantic Search
        </h2>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && search()}
            placeholder="Search QR codes using natural language..."
            className="flex-1 px-4 py-3 bg-gray-900 rounded-lg border border-gray-700 focus:border-pink-500 focus:outline-none"
          />
          <button
            onClick={search}
            disabled={isSearching}
            className="px-6 py-3 bg-pink-500 rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Example Queries */}
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(example);
                search();
              }}
              className="px-3 py-1 bg-gray-900/50 rounded text-sm hover:bg-gray-900 transition"
            >
              {example}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <h3 className="font-bold mb-4">Search Results ({results.length})</h3>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <motion.div
                key={result.qrId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-pink-500 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono font-bold">{result.qrId}</div>
                  <div className="text-pink-400 font-bold">
                    {(result.relevance * 100).toFixed(0)}% match
                  </div>
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  {result.summary}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div>Module: {result.context.module}</div>
                  <div>Type: {result.context.documentType}</div>
                  {result.context.location && (
                    <div>Location: {result.context.location}</div>
                  )}
                </div>
                {result.actions && result.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {result.actions.map((action: any, actionIdx: number) => (
                      <button
                        key={actionIdx}
                        className="px-3 py-1 bg-pink-500/20 rounded text-sm hover:bg-pink-500/30 transition"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
