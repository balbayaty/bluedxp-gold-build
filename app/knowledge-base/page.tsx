"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { KnowledgeEntry, KnowledgeStats } from "@/types/knowledgeBase";
import { PremiumLoader, SkeletonCard } from "@/components/loading";

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allEntries = await knowledgeBaseService.search({
        query: "",
        limit: 100,
      });
      setEntries(allEntries.map((r) => r.entry));
      const statsData = await knowledgeBaseService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading knowledge base:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    return entries.filter(
      (e) =>
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.keywords?.some((k) =>
          k.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [entries, searchQuery]);

  const pageStats = useMemo(
    () =>
      stats
        ? [
            {
              label: "Total Entries",
              value: stats.totalEntries,
              icon: "ri-book-open-line",
              trend: "up" as const,
            },
            {
              label: "Verified",
              value: `${stats.verifiedPercentage.toFixed(1)}%`,
              icon: "ri-checkbox-circle-line",
              trend: "neutral" as const,
            },
            {
              label: "Avg Confidence",
              value: `${stats.averageConfidence.toFixed(0)}%`,
              icon: "ri-bar-chart-line",
              trend: "up" as const,
            },
          ]
        : [],
    [stats],
  );

  return (
    <PageTemplate
      title="Knowledge Base"
      description="AI-Powered Knowledge Management with Vector Embeddings & Semantic Search"
      icon="ri-book-open-line"
      stats={pageStats}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
            <input
              type="text"
              placeholder="Search knowledge base..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Knowledge Entries
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <PremiumLoader
                message="Loading knowledge base..."
                size="md"
                variant="default"
              />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-book-open-line text-4xl mb-3 opacity-50"></i>
              <p>No knowledge entries found</p>
              <p className="text-sm mt-2">
                Knowledge will be automatically added as the system learns
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">
                        {entry.summary || entry.content.substring(0, 100)}
                      </h4>
                      <p className="text-sm text-[#9ca3af] mt-1 line-clamp-2">
                        {entry.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          entry.verified
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {entry.verified ? "Verified" : "Unverified"}
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        {entry.confidence}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-[#6b7280]">
                    <span className="capitalize">{entry.type}</span>
                    <span>•</span>
                    <span className="capitalize">{entry.category}</span>
                    <span>•</span>
                    <span>{entry.usageCount} uses</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
