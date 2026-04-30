/**
 * Template Marketplace
 * Browse, search, and download community proposal templates
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function TemplateMarketplacePage() {
  const { hasModuleAccess } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const [filters, setFilters] = useState({
    category: "",
    search: "",
    sortBy: "popular",
    pricing: "" as "FREE" | "PREMIUM" | "SUBSCRIPTION" | "",
    featured: false,
  });

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    loadTemplates();
  }, [filters, hasAccess]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.search) params.append("search", filters.search);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.pricing) params.append("pricing", filters.pricing);
      if (filters.featured) params.append("featured", "true");

      const res = await fetch(`/api/proposals/templates/marketplace?${params}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (templateId: string) => {
    try {
      const res = await fetch("/api/proposals/templates/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download",
          templateId,
          userId: "current-user",
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to proposal builder with template
        window.location.href = `/proposals/universal/new?template=${templateId}`;
      }
    } catch (error) {
      console.error("Error downloading template:", error);
    }
  };

  if (!hasAccess) {
    return (
      <ProposalErrorBoundary>
        <PageTemplate
          title="Access Denied"
          description="You do not have permission to access the template marketplace"
          icon="ri-error-warning-line"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You do not have the required permissions to access the template
                marketplace. Please contact your administrator.
              </p>
            </div>
          </div>
        </PageTemplate>
      </ProposalErrorBoundary>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Template Marketplace"
        description="Browse and download professional proposal templates from the community"
      >
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Search templates..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="WAREHOUSING">Warehousing</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="CUSTOMS">Customs</option>
                  <option value="COMPLETE">Complete Solution</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="downloads">Most Downloads</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pricing
                </label>
                <select
                  value={filters.pricing}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      pricing: e.target.value as any,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All</option>
                  <option value="FREE">Free</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                >
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Preview */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                    {template.preview?.thumbnail ? (
                      <img
                        src={template.preview.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <i className="ri-file-text-line text-6xl opacity-50" />
                      </div>
                    )}
                    {template.featured && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-semibold">
                        Featured
                      </div>
                    )}
                    {template.verified && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">
                        <i className="ri-verified-badge-line mr-1" />
                        Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <i className="ri-star-fill text-sm" />
                        <span className="text-sm font-medium">
                          {template.stats.averageRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span>
                        <i className="ri-download-line mr-1" />
                        {template.stats.downloads}
                      </span>
                      <span>
                        <i className="ri-user-line mr-1" />
                        {template.stats.usageCount}
                      </span>
                      <span>
                        <i className="ri-star-line mr-1" />
                        {template.stats.ratings}
                      </span>
                    </div>

                    {/* Author & Pricing */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                          {template.author.name[0]}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {template.author.name}
                        </span>
                      </div>
                      <div>
                        {template.pricing.type === "FREE" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">
                            Free
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-semibold">
                            {template.pricing.currency} {template.pricing.price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleDownload(template.id)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                    >
                      <i className="ri-download-line mr-2" />
                      Download Template
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && templates.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-inbox-line text-6xl text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No templates found
              </p>
            </div>
          )}
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
