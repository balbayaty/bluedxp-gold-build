"use client";

/**
 * LLM Providers Management Page
 * View and manage all LLM providers
 */

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface LLMProvider {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  tags: string[];
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    audio: boolean;
  };
  maxContextLength: number;
  supportedModels: string[];
  pricing?: {
    input?: number;
    output?: number;
  };
  status: {
    status: "online" | "offline" | "error";
    lastUsed?: string;
    totalRequests?: number;
    totalTokens?: number;
    latency?: number;
    errorRate?: number;
  };
}

interface ProviderStats {
  totalProviders: number;
  online: number;
  offline: number;
  byCategory: Record<string, number>;
}

export default function LLMProvidersPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
    null,
  );

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/llm/providers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load providers");
      }

      const data = await response.json();
      if (data.success) {
        setProviders(data.providers || []);
        setStats(data.stats || null);
      } else {
        throw new Error(data.error || "Failed to load providers");
      }
    } catch (err: any) {
      console.error("Error loading providers:", err);
      setError(
        err.message ||
          "Failed to load providers. Please make sure you are logged in.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-gray-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Online
          </span>
        );
      case "offline":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Offline
          </span>
        );
      case "error":
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <PageTemplate
      title="LLM Providers"
      description="View and manage all available LLM providers"
      icon="ri-brain-line"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Providers
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalProviders}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Online
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.online}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Offline
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {stats.offline}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400">⚠️</span>
              <div>
                <div className="font-semibold text-red-900 dark:text-red-200">
                  Error
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Make sure you are logged in and have proper permissions.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-4 text-gray-600 dark:text-gray-400">
              Loading providers...
            </div>
          </div>
        )}

        {/* Providers List */}
        {!loading && !error && providers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {providers.map((provider) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {provider.id}
                    </p>
                  </div>
                  {getStatusBadge(provider.status.status)}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {provider.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Category:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {provider.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Models:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {provider.supportedModels.length}
                    </span>
                  </div>

                  {provider.status.totalRequests !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        Requests:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {provider.status.totalRequests.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {provider.capabilities.vision && (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Vision
                    </span>
                  )}
                  {provider.capabilities.streaming && (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Streaming
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && providers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              No providers found
            </div>
          </div>
        )}
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedProvider(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedProvider.name}
              </h2>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedProvider.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Capabilities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.capabilities.streaming && (
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      Streaming
                    </span>
                  )}
                  {selectedProvider.capabilities.functionCalling && (
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      Function Calling
                    </span>
                  )}
                  {selectedProvider.capabilities.vision && (
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                      Vision
                    </span>
                  )}
                  {selectedProvider.capabilities.audio && (
                    <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                      Audio
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Supported Models
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.supportedModels.map((model) => (
                    <span
                      key={model}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {model}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProvider.status && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Status:
                      </span>
                      <span
                        className={`ml-2 font-medium ${getStatusColor(selectedProvider.status.status)}`}
                      >
                        {selectedProvider.status.status}
                      </span>
                    </div>
                    {selectedProvider.status.totalRequests !== undefined && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Requests:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedProvider.status.totalRequests.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedProvider.status.totalTokens !== undefined && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Tokens:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedProvider.status.totalTokens.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedProvider.status.latency !== undefined && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Avg Latency:
                        </span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {selectedProvider.status.latency}ms
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </PageTemplate>
  );
}
