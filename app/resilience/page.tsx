/**
 * Resilience Monitoring Dashboard
 *
 * Comprehensive monitoring for resilience services:
 * - Dead Letter Queue monitoring
 * - Bulkhead & Circuit Breaker metrics
 * - Chaos Engineering experiments
 * - System health overview
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ResilienceMetrics {
  deadLetterQueue: {
    totalMessages: number;
    unprocessed: number;
    retried: number;
    failed: number;
    averageRetryCount: number;
  };
  circuitBreaker: {
    totalCircuits: number;
    open: number;
    halfOpen: number;
    closed: number;
    failureRate: number;
  };
  bulkhead: {
    totalBulkheads: number;
    activeRequests: number;
    queuedRequests: number;
    rejectedRequests: number;
    utilizationRate: number;
  };
  chaosEngineering: {
    totalExperiments: number;
    activeExperiments: number;
    passedExperiments: number;
    failedExperiments: number;
    lastExperimentTime?: string;
  };
}

function ResilienceDashboard() {
  const { hasModuleAccess } = useAuth();
  const [metrics, setMetrics] = useState<ResilienceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds

  const hasAccess = hasModuleAccess("admin", "admin");

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, hasAccess]);

  const loadMetrics = async () => {
    try {
      setError(null);
      // In production, this would call actual API endpoints
      // For now, use mock data
      const mockMetrics: ResilienceMetrics = {
        deadLetterQueue: {
          totalMessages: 127,
          unprocessed: 5,
          retried: 98,
          failed: 24,
          averageRetryCount: 2.3,
        },
        circuitBreaker: {
          totalCircuits: 45,
          open: 2,
          halfOpen: 3,
          closed: 40,
          failureRate: 4.4,
        },
        bulkhead: {
          totalBulkheads: 12,
          activeRequests: 34,
          queuedRequests: 8,
          rejectedRequests: 2,
          utilizationRate: 68.5,
        },
        chaosEngineering: {
          totalExperiments: 28,
          activeExperiments: 1,
          passedExperiments: 23,
          failedExperiments: 4,
          lastExperimentTime: new Date().toISOString(),
        },
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view resilience monitoring"
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
              You need administrator permissions to view resilience monitoring.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (loading) {
    return (
      <PageTemplate
        title="Resilience Monitoring"
        description="System resilience and health monitoring"
        icon="ri-shield-check-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading metrics...
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (error) {
    return (
      <PageTemplate
        title="Resilience Monitoring"
        description="System resilience and health monitoring"
        icon="ri-shield-check-line"
      >
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Error Loading Metrics
          </h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={loadMetrics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Resilience Monitoring"
      description="System resilience and health monitoring"
      icon="ri-shield-check-line"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={loadMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="ri-refresh-line" />
              Refresh
            </button>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={10000}>10s refresh</option>
              <option value={30000}>30s refresh</option>
              <option value={60000}>1m refresh</option>
              <option value={300000}>5m refresh</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dead Letter Queue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <i className="ri-inbox-archive-line text-2xl text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Dead Letter Queue
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Failed messages
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Messages
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.deadLetterQueue.totalMessages}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Unprocessed
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {metrics?.deadLetterQueue.unprocessed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Retried
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.deadLetterQueue.retried}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics?.deadLetterQueue.failed}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Circuit Breaker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <i className="ri-flashlight-line text-2xl text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Circuit Breaker
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Circuit states
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Circuits
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.circuitBreaker.totalCircuits}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Open
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics?.circuitBreaker.open}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Half-Open
                </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {metrics?.circuitBreaker.halfOpen}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Closed
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.circuitBreaker.closed}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Bulkhead */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <i className="ri-building-line text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Bulkhead
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Request isolation
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Requests
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.bulkhead.activeRequests}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Queued
                </span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {metrics?.bulkhead.queuedRequests}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Rejected
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics?.bulkhead.rejectedRequests}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Utilization
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {metrics?.bulkhead.utilizationRate}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Chaos Engineering */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <i className="ri-skull-line text-2xl text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Chaos Engineering
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Experiments
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Experiments
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {metrics?.chaosEngineering.totalExperiments}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {metrics?.chaosEngineering.activeExperiments}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Passed
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.chaosEngineering.passedExperiments}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {metrics?.chaosEngineering.failedExperiments}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* System Health Overview */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <i className="ri-heart-pulse-line text-2xl text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Health Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Overall system health: <strong>Good</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {metrics?.circuitBreaker.open} circuits open (monitoring)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Resilience patterns active
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function ResiliencePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Resilience Monitoring"
          description="System resilience and health monitoring"
          icon="ri-shield-check-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <ResilienceDashboard />
    </ErrorBoundary>
  );
}
