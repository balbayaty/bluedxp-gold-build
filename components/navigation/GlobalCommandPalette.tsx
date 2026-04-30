/**
 * Global Command Palette
 * VS Code / Raycast-style intelligent command palette
 * AI-powered semantic search across entire platform
 * 4IR & 5IR Aligned • World-Class UX
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { globalIntelligentSearchService } from "@/lib/services/search/globalIntelligentSearchService";
import type { SearchResultItem } from "@/lib/services/search/globalIntelligentSearchService";
import type { NavItem } from "@/lib/services/navigation/navigationService";

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  navStructure?: NavItem[];
}

export default function GlobalCommandPalette({
  isOpen,
  onClose,
  navStructure = [],
}: GlobalCommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened - improved timing for better UX
  useEffect(() => {
    if (isOpen) {
      // Use requestAnimationFrame for smoother focus, then setTimeout for DOM readiness
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select(); // Select text for easier replacement
          setQuery("");
          setSelectedIndex(0);
        }, 50); // Reduced from 100ms for faster response
      });
    } else {
      // Clear query when closed
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search
  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      if (query.trim().length === 0) {
        // Show recent/favorites when empty
        const recent = await globalIntelligentSearchService.search("", {
          navStructure,
          limit: 10,
        });
        setResults(recent.results);
        setSearchResult(recent);
        return;
      }

      if (query.trim().length < 2) {
        setResults([]);
        setSearchResult(null);
        return;
      }

      setLoading(true);
      try {
        const result = await globalIntelligentSearchService.search(query, {
          navStructure,
          limit: 20,
        });
        setResults(result.results);
        setSearchResult(result);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 150);
    return () => clearTimeout(debounceTimer);
  }, [query, isOpen, navStructure]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        scrollToSelected();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        scrollToSelected();
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Scroll to selected item
  const scrollToSelected = useCallback(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Handle result selection
  const handleSelectResult = useCallback(
    (result: SearchResultItem) => {
      if (result.href) {
        router.push(result.href);
        onClose();
      } else if (result.action) {
        result.action();
        onClose();
      }
    },
    [router, onClose],
  );

  // Get icon component
  const getIcon = (icon?: string) => {
    if (!icon) return "ri-file-line";
    return icon.startsWith("ri-") ? icon : "ri-file-line";
  };

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups = new Map<string, SearchResultItem[]>();

    results.forEach((result) => {
      const group = result.type;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(result);
    });

    return Array.from(groups.entries());
  }, [results]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          onClick={onClose}
        />

        {/* Command Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-purple-500/10 pointer-events-none" />

          {/* Search Input */}
          <div className="relative p-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <i className="ri-search-line text-xl text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything... (pages, actions, data, knowledge)"
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none"
                autoComplete="off"
              />
              {loading && (
                <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              )}
              {!loading && query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              )}
            </div>

            {/* Intent indicator */}
            {searchResult?.intent && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  {searchResult.intent.primaryIntent}
                </span>
                <span className="text-gray-500">
                  {searchResult.totalResults} results
                </span>
                {searchResult.searchTime && (
                  <span className="text-gray-500">
                    in {searchResult.searchTime}ms
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[60vh] overflow-y-auto custom-scrollbar"
          >
            {results.length === 0 && !loading && query.length >= 2 && (
              <div className="p-8 text-center text-gray-400">
                <i className="ri-search-line text-4xl mb-3 opacity-50" />
                <p>No results found</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </div>
            )}

            {results.length === 0 && !loading && query.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <i className="ri-command-line text-4xl mb-3 opacity-50" />
                <p className="text-sm">Start typing to search...</p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-gray-800 rounded-lg text-xs">
                    ⌘K to open
                  </span>
                  <span className="px-3 py-1 bg-gray-800 rounded-lg text-xs">
                    ↑↓ to navigate
                  </span>
                  <span className="px-3 py-1 bg-gray-800 rounded-lg text-xs">
                    Enter to select
                  </span>
                </div>
              </div>
            )}

            {groupedResults.map(([type, items]) => (
              <div
                key={type}
                className="border-b border-gray-700/30 last:border-0"
              >
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {type === "navigation" && "Navigation"}
                  {type === "action" && "Actions"}
                  {type === "data" && "Data"}
                  {type === "knowledge" && "Knowledge Base"}
                  {type === "recent" && "Recent"}
                  {type === "favorite" && "Favorites"}
                </div>
                {items.map((result, index) => {
                  const globalIndex = results.indexOf(result);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectResult(result)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`relative px-4 py-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 border-l-2 border-cyan-500"
                          : "hover:bg-gray-800/50"
                      }`}
                    >
                      {/* Selection glow */}
                      {isSelected && (
                        <motion.div
                          layoutId="selectedGlow"
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 pointer-events-none"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}

                      <div className="relative flex items-center gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? "bg-cyan-500/20" : "bg-gray-700/50"
                          }`}
                        >
                          <i
                            className={`${getIcon(result.icon)} text-lg ${
                              isSelected ? "text-cyan-400" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium ${
                              isSelected ? "text-white" : "text-gray-200"
                            }`}
                          >
                            {result.title}
                          </div>
                          {result.description && (
                            <div
                              className={`text-sm mt-0.5 truncate ${
                                isSelected ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {result.description}
                            </div>
                          )}
                        </div>
                        {result.category && (
                          <div className="flex-shrink-0 px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-400">
                            {result.category}
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex-shrink-0 text-xs text-gray-500">
                            Enter
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="text-cyan-400">Powered by AI</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
