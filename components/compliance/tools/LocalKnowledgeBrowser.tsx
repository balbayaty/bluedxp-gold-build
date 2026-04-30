"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LocalKnowledgeEntry,
  LocalRegulation,
} from "@/types/compliance-hierarchy";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";
import { ComplianceCategory } from "@/types/compliance";

interface LocalKnowledgeBrowserProps {
  authorityId?: string;
}

export default function LocalKnowledgeBrowser({
  authorityId,
}: LocalKnowledgeBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState<string | null>(
    authorityId || null,
  );
  const [selectedCategory, setSelectedCategory] = useState<
    ComplianceCategory | ""
  >("");
  const [knowledgeEntries, setKnowledgeEntries] = useState<
    LocalKnowledgeEntry[]
  >([]);
  const [regulations, setRegulations] = useState<LocalRegulation[]>([]);
  const [authorities, setAuthorities] = useState<RegulatoryAuthorityNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"knowledge" | "regulations">("knowledge");

  useEffect(() => {
    loadAuthorities();
    if (selectedAuthority) {
      loadKnowledge();
    }
  }, [selectedAuthority, selectedCategory]);

  const loadAuthorities = () => {
    const roots = authorityHierarchyService.getRootNodes();
    setAuthorities(roots);
  };

  const loadKnowledge = async () => {
    if (!selectedAuthority) return;

    try {
      setLoading(true);

      if (view === "knowledge") {
        const results = await authorityHierarchyService.searchLocalKnowledge({
          query: searchQuery || "*",
          authorityId: selectedAuthority,
          category: selectedCategory || undefined,
          limit: 50,
        });
        setKnowledgeEntries(results);
      } else {
        const results = await authorityHierarchyService.searchLocalRegulations(
          searchQuery || "*",
          {
            authorityId: selectedAuthority,
            category: selectedCategory || undefined,
          },
        );
        setRegulations(results);
      }
    } catch (error) {
      console.error("Error loading knowledge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadKnowledge();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Local Knowledge Browser
        </h2>
        <p className="text-gray-400">
          Browse deep local knowledge and regulations by authority
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search local knowledge, regulations..."
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            <i className="ri-search-line mr-2"></i>
            Search
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Regulatory Authority
            </label>
            <select
              value={selectedAuthority || ""}
              onChange={(e) => setSelectedAuthority(e.target.value || null)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Authorities</option>
              {authorities.map((auth) => (
                <option key={auth.id} value={auth.id}>
                  {auth.name} ({auth.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as ComplianceCategory | "")
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Categories</option>
              <option value="DATA_SECURITY">Data Security</option>
              <option value="DATA_PRIVACY">Data Privacy</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="WAREHOUSING">Warehousing</option>
              <option value="CUSTOMS">Customs</option>
              <option value="PRODUCT_SAFETY">Product Safety</option>
              <option value="FOOD_DRUG">Food & Drug</option>
              <option value="CYBERSECURITY">Cybersecurity</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView("knowledge")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === "knowledge"
                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-book-open-line mr-2"></i>
            Knowledge Base
          </button>
          <button
            onClick={() => setView("regulations")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === "regulations"
                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            <i className="ri-file-text-line mr-2"></i>
            Regulations
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {view === "knowledge" ? (
            <>
              {knowledgeEntries.length > 0 ? (
                knowledgeEntries.map((entry) => (
                  <KnowledgeEntryCard key={entry.id} entry={entry} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No knowledge entries found. Try adjusting your search
                  criteria.
                </div>
              )}
            </>
          ) : (
            <>
              {regulations.length > 0 ? (
                regulations.map((regulation) => (
                  <RegulationCard key={regulation.id} regulation={regulation} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No regulations found. Try adjusting your search criteria.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Knowledge Entry Card
interface KnowledgeEntryCardProps {
  entry: LocalKnowledgeEntry;
}

function KnowledgeEntryCard({ entry }: KnowledgeEntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
              {entry.type}
            </span>
            {entry.verified && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                Verified
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-3">{entry.summary}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Confidence: {entry.confidence}%</span>
            <span>Usage: {entry.usageCount}</span>
            {entry.lastAccessed && (
              <span>
                Last accessed:{" "}
                {new Date(entry.lastAccessed).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white"
        >
          <i
            className={`ri-arrow-${expanded ? "up" : "down"}-s-line text-xl`}
          ></i>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">
              {entry.content}
            </div>
          </div>
          {entry.keywords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Regulation Card
interface RegulationCardProps {
  regulation: LocalRegulation;
}

function RegulationCard({ regulation }: RegulationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white">
              {regulation.title}
            </h3>
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
              {regulation.regulationCode}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                regulation.priority === "CRITICAL"
                  ? "bg-red-500/20 text-red-400"
                  : regulation.priority === "HIGH"
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {regulation.priority}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-3">{regulation.summary}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              Effective:{" "}
              {new Date(regulation.effectiveDate).toLocaleDateString()}
            </span>
            {regulation.expiryDate && (
              <span>
                Expires: {new Date(regulation.expiryDate).toLocaleDateString()}
              </span>
            )}
            <span>Requirements: {regulation.requirements.length}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white"
        >
          <i
            className={`ri-arrow-${expanded ? "up" : "down"}-s-line text-xl`}
          ></i>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Key Points</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
              {regulation.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          {regulation.requirements.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Requirements</h4>
              <div className="space-y-2">
                {regulation.requirements.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">
                        {req.section} {req.subsection && `• ${req.subsection}`}
                      </span>
                      {req.mandatory && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{req.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {regulation.bestPractices.length > 0 && (
            <div>
              <h4 className="text-white font-medium mb-2">Best Practices</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                {regulation.bestPractices.map((practice, idx) => (
                  <li key={idx}>{practice}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
