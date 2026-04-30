/**
 * Warehouse Knowledge Base Component
 * Self-learning warehouse knowledge interface
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseKnowledgeBaseIntegration } from "@/lib/services/wms/knowledgeBaseIntegration";
import type { WarehouseKnowledge } from "@/lib/services/wms/knowledgeBaseIntegration";

interface WarehouseKnowledgeBaseProps {
  warehouseId: string;
}

export default function WarehouseKnowledgeBase({
  warehouseId,
}: WarehouseKnowledgeBaseProps) {
  const [knowledge, setKnowledge] = useState<WarehouseKnowledge[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery) {
      searchKnowledge();
    }
  }, [searchQuery, selectedCategory]);

  const searchKnowledge = async () => {
    setIsLoading(true);
    try {
      const results = await warehouseKnowledgeBaseIntegration.searchKnowledge({
        warehouseId,
        query: searchQuery,
        category:
          selectedCategory !== "ALL" ? (selectedCategory as any) : undefined,
        limit: 20,
      });
      setKnowledge(results);
    } catch (error) {
      console.error("Error searching knowledge:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: Array<{ value: string; label: string }> = [
    { value: "ALL", label: "All Categories" },
    { value: "RECEIVING", label: "Receiving" },
    { value: "PUTAWAY", label: "Putaway" },
    { value: "PICKING", label: "Picking" },
    { value: "SHIPPING", label: "Shipping" },
    { value: "INVENTORY", label: "Inventory" },
    { value: "SAFETY", label: "Safety" },
    { value: "OPTIMIZATION", label: "Optimization" },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <i className="ri-book-open-line mr-3 text-cyan-400"></i>
          Warehouse Knowledge Base
        </h2>

        <div className="flex space-x-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search warehouse knowledge..."
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <i className="ri-loader-4-line text-2xl text-cyan-400 animate-spin"></i>
          </div>
        )}
      </motion.div>

      {/* Knowledge Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {knowledge.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-white font-medium">{item.title}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                    {item.type}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Effectiveness</div>
                <div className="text-white font-bold">
                  {item.effectiveness}%
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-2">
              {item.content.substring(0, 200)}...
            </p>
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
              <span>Used {item.usageCount} times</span>
              {item.lastUsed && (
                <span>
                  Last used: {new Date(item.lastUsed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}

        {knowledge.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <i className="ri-book-open-line text-4xl mb-4"></i>
            <p>No knowledge found. Try a different search query.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
