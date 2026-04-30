/**
 * Feature Registry Dashboard
 * View and manage all registered features
 */

"use client";

import { useState, useEffect } from "react";
import {
  FeatureDefinition,
  FeatureDomain,
  FeatureStatus,
} from "@/lib/feature-registry/types";

export default function FeatureRegistryPage() {
  const [features, setFeatures] = useState<FeatureDefinition[]>([]);
  const [completeness, setCompleteness] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<FeatureDomain | "all">(
    "all",
  );
  const [selectedStatus, setSelectedStatus] = useState<FeatureStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadFeatures();
  }, [selectedDomain, selectedStatus, searchQuery]);

  async function loadFeatures() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDomain !== "all") params.append("domain", selectedDomain);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(
        `/api/feature-registry?${params.toString()}`,
      );
      const data = await response.json();

      setFeatures(data.features || []);
      setCompleteness(data.completeness || {});
    } catch (error) {
      console.error("Error loading features:", error);
    } finally {
      setLoading(false);
    }
  }

  const domains: FeatureDomain[] = [
    "wms",
    "tms",
    "qhse",
    "procurement",
    "trade-compliance",
    "truth-engine",
    "hazalyze",
    "maas",
    "compliance",
    "finance",
    "crm",
    "digital-signature",
    "marketplace",
    "warehouse-network",
    "facility-management",
    "project-management",
    "proposals-rfq",
    "hr",
    "iot",
    "business-intelligence",
    "communication",
    "platform",
    "other",
  ];

  const statuses: FeatureStatus[] = [
    "implemented",
    "partial",
    "stub",
    "missing",
    "planned",
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Feature Registry</h1>
        <p className="text-gray-400 mb-8">
          Single source of truth for all features in BlueDXP platform
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Domain</label>
            <select
              value={selectedDomain}
              onChange={(e) =>
                setSelectedDomain(e.target.value as FeatureDomain | "all")
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Domains</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(e.target.value as FeatureStatus | "all")
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
            />
          </div>
        </div>

        {/* Completeness Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(completeness)
            .slice(0, 8)
            .map(([domain, stats]: [string, any]) => (
              <div
                key={domain}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="text-sm text-gray-400 mb-1">
                  {domain.toUpperCase()}
                </div>
                <div className="text-2xl font-bold">
                  {stats.implemented}/{stats.total}
                </div>
                <div className="text-xs text-gray-500">
                  {stats.percentage.toFixed(1)}% complete
                </div>
              </div>
            ))}
        </div>

        {/* Features List */}
        {loading ? (
          <div className="text-center py-12">Loading features...</div>
        ) : (
          <div className="space-y-4">
            {features.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No features found. Run auto-discovery to register features.
              </div>
            ) : (
              features.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {feature.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          feature.status === "implemented"
                            ? "bg-green-500/20 text-green-400"
                            : feature.status === "partial"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : feature.status === "missing"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {feature.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                        {feature.domain}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {feature.apis && feature.apis.length > 0 && (
                      <div>
                        <div className="text-gray-400 mb-1">APIs</div>
                        <div className="text-white">{feature.apis.length}</div>
                      </div>
                    )}
                    {feature.uiSurfaces && feature.uiSurfaces.length > 0 && (
                      <div>
                        <div className="text-gray-400 mb-1">UI Surfaces</div>
                        <div className="text-white">
                          {feature.uiSurfaces.length}
                        </div>
                      </div>
                    )}
                    {feature.entities && feature.entities.length > 0 && (
                      <div>
                        <div className="text-gray-400 mb-1">Entities</div>
                        <div className="text-white">
                          {feature.entities.length}
                        </div>
                      </div>
                    )}
                    {feature.tests && feature.tests.length > 0 && (
                      <div>
                        <div className="text-gray-400 mb-1">Tests</div>
                        <div className="text-white">{feature.tests.length}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
