/**
 * Content Block Picker Component
 * Beautiful UI for browsing and inserting content blocks into proposals
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContentBlock } from "@/lib/services/proposals/contentBlockLibrary";

interface ContentBlockPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (block: ContentBlock) => void;
  currentCategory?: string;
}

export default function ContentBlockPicker({
  isOpen,
  onClose,
  onSelect,
  currentCategory,
}: ContentBlockPickerProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<ContentBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadContentBlocks();
    }
  }, [isOpen]);

  useEffect(() => {
    filterBlocks();
  }, [blocks, searchQuery, selectedCategory, selectedType]);

  const loadContentBlocks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL")
        params.append("category", selectedCategory);
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (searchQuery) params.append("q", searchQuery);
      params.append("status", "APPROVED"); // Only show approved blocks

      const res = await fetch(
        `/api/proposals/content-blocks?${params.toString()}`,
      );
      const data = await res.json();

      if (data.success) {
        setBlocks(data.data.blocks || []);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error loading content blocks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterBlocks = () => {
    let filtered = [...blocks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (block) =>
          block.title.toLowerCase().includes(query) ||
          block.content.toLowerCase().includes(query) ||
          block.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          block.keywords.some((keyword) =>
            keyword.toLowerCase().includes(query),
          ),
      );
    }

    // Filter by category
    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(
        (block) => block.category === selectedCategory,
      );
    }

    // Filter by type
    if (selectedType !== "ALL") {
      filtered = filtered.filter((block) => block.type === selectedType);
    }

    setFilteredBlocks(filtered);
  };

  const categories = [
    "ALL",
    ...Array.from(new Set(blocks.map((b) => b.category))),
  ];
  const types = ["ALL", "TEXT", "PRICING", "TABLE", "LIST", "CUSTOM"];

  const handleSelect = (block: ContentBlock) => {
    onSelect(block);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Content Block Library
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose a reusable content block to insert into your proposal
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-2xl text-gray-400" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "ALL" ? "All Categories" : cat.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === "ALL" ? "All Types" : type}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            {stats && (
              <div className="flex gap-4 mt-4 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">
                    {stats.totalBlocks || 0}
                  </span>{" "}
                  total blocks
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">
                    {stats.approvedBlocks || 0}
                  </span>{" "}
                  approved
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{filteredBlocks.length}</span>{" "}
                  matching
                </span>
              </div>
            )}
          </div>

          {/* Content Blocks Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div className="text-center py-12">
                <i className="ri-file-search-line text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No content blocks found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {searchQuery ||
                  selectedCategory !== "ALL" ||
                  selectedType !== "ALL"
                    ? "Try adjusting your filters"
                    : "Create your first content block to get started"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBlocks.map((block) => (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleSelect(block)}
                  >
                    {/* Block Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {block.title}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            {block.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {block.category.replace(/_/g, " ")}
                        </p>
                      </div>
                      {block.status === "APPROVED" && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                          Approved
                        </span>
                      )}
                    </div>

                    {/* Block Content Preview */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                      {block.content}
                    </p>

                    {/* Tags */}
                    {block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {block.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {block.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                            +{block.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Usage Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <span>
                        <i className="ri-file-copy-line mr-1" />
                        Used {block.usageCount} times
                      </span>
                      <span>v{block.version}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a block to insert it into your proposal
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
