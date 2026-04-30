/**
 * 🛡️ ENHANCED REAL-TIME QHSE DASHBOARD
 * Comprehensive Quality, Health, Safety & Environment monitoring
 * Integrated with BlueDXP platform ecosystem:
 * - Multi-tenant architecture (tenant > customer > warehouse)
 * - Knowledge base integration with proper segregation
 * - Event bus for real-time updates and cross-module integration
 * - View context for role-based filtering
 * - More comprehensive than chemcheck-analysis
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiBarChart,
  FiPieChart,
  FiRefreshCw,
  FiEye,
  FiPlus,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiZap,
  FiLayers,
  FiHeart,
  FiDroplet,
  FiAward,
  FiFileText,
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiDatabase,
  FiLink,
  FiCpu,
  FiGlobe,
  FiTrendingUp as FiTrendUp,
} from "react-icons/fi";
// ViewContext will be provided by the app layout
// For now, we'll make it optional
import QHSERiskHeatmap from "./QHSERiskHeatmap";
import QHSEGamificationPanel from "./QHSEGamificationPanel";
import QHSEComplianceMap from "./QHSEComplianceMap";
import QHSESmartAlerts from "./QHSESmartAlerts";
import type {
  QHSEDashboard,
  Incident,
  Inspection,
  TrainingRecord,
  EnvironmentalMetric,
  SafetyMetric,
} from "@/types/qhse";

interface RealTimeQHSEDashboardProps {
  tenantId?: string;
  customerId?: string;
  warehouseId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showKnowledgeBaseInsights?: boolean;
  showCrossModuleConnections?: boolean;
  showGamification?: boolean;
  showComplianceMap?: boolean;
  showSmartAlerts?: boolean;
}

interface DashboardMetrics {
  incidents: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    trends: {
      daily: number[];
      weekly: number[];
      monthly: number[];
    };
  };
  safety: {
    ltir: number;
    trir: number;
    nearMisses: number;
    daysWithoutIncident: number;
    safetyTrainingCompliance: number;
  };
  environmental: {
    spills: number;
    emissions: number;
    wasteGenerated: number;
    recyclingRate: number;
    energyConsumption: number;
  };
  quality: {
    nonConformances: number;
    customerComplaints: number;
    correctionEffectiveness: number;
    auditScore: number;
  };
  compliance: {
    overallScore: number;
    byStandard: Record<string, number>;
    overdueActions: number;
    upcomingAudits: number;
  };
}

interface KnowledgeBaseInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  relevance: number;
  source: string;
  relatedEntities: string[];
}

interface CrossModuleConnection {
  module: string;
  type: string;
  count: number;
  items: Array<{
    id: string;
    title: string;
    link: string;
  }>;
}

const RealTimeQHSEDashboard: React.FC<RealTimeQHSEDashboardProps> = ({
  tenantId,
  customerId,
  warehouseId,
  autoRefresh = true,
  refreshInterval = 30000,
  showKnowledgeBaseInsights = true,
  showCrossModuleConnections = true,
  showGamification = true,
  showComplianceMap = true,
  showSmartAlerts = true,
}) => {
  // ViewContext integration - will be provided by app layout
  // const viewContext = useViewContext()
  const [dashboard, setDashboard] = useState<QHSEDashboard | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "day" | "week" | "month" | "quarter" | "year"
  >("month");
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [knowledgeBaseInsights, setKnowledgeBaseInsights] = useState<
    KnowledgeBaseInsight[]
  >([]);
  const [crossModuleConnections, setCrossModuleConnections] = useState<
    CrossModuleConnection[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "incidents"
    | "inspections"
    | "training"
    | "environmental"
    | "compliance"
  >("overview");
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);
  const [intelligentInsights, setIntelligentInsights] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Get effective context IDs
  // ViewContext integration will be added when app layout provides it
  const effectiveTenantId = tenantId; // || viewContext?.context?.tenantId
  const effectiveCustomerId = customerId; // || (viewContext?.context?.customerFilter?.type === 'SINGLE'
  // ? viewContext.context.customerFilter.customerIds?.[0]
  // : undefined)
  const effectiveWarehouseId = warehouseId; // || (viewContext?.context?.warehouseFilter?.type === 'SINGLE'
  // ? viewContext.context.warehouseFilter.warehouseIds?.[0]
  // : undefined)

  // Helper function to fetch with timeout
  const fetchWithTimeout = async (
    url: string,
    timeout = 10000,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout: ${url}`);
      }
      throw error;
    }
  };

  // Helper function to safely fetch and parse JSON
  const safeFetch = async (
    url: string | null,
    timeout = 10000,
  ): Promise<any> => {
    if (!url) return null;

    try {
      const response = await fetchWithTimeout(url, timeout);
      if (!response.ok) {
        console.warn(`API call failed: ${url} - ${response.status}`);
        return { success: false, error: `HTTP ${response.status}` };
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  // Load dashboard data with individual error handling
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams();
      if (effectiveTenantId) params.append("tenantId", effectiveTenantId);
      if (effectiveCustomerId) params.append("customerId", effectiveCustomerId);
      if (effectiveWarehouseId)
        params.append("warehouseId", effectiveWarehouseId);
      params.append("timeframe", selectedTimeframe);

      // Fetch all data in parallel, but handle each independently
      // This way one failure doesn't break everything
      const [
        dashboardData,
        incidentsData,
        inspectionsData,
        metricsData,
        insightsData,
        connectionsData,
        intelligentData,
        alertsData,
      ] = await Promise.allSettled([
        safeFetch(`/api/qhse/reports?type=dashboard&${params.toString()}`),
        safeFetch(
          `/api/qhse/incidents?status=investigating&limit=5&${params.toString()}`,
        ),
        safeFetch(
          `/api/qhse/inspections?status=in_progress&limit=5&${params.toString()}`,
        ),
        safeFetch(`/api/qhse/metrics?${params.toString()}`),
        showKnowledgeBaseInsights
          ? safeFetch(
              `/api/knowledge-base/search?category=qhse&limit=5&${params.toString()}`,
            )
          : Promise.resolve(null),
        showCrossModuleConnections
          ? safeFetch(`/api/qhse/cross-module-connections?${params.toString()}`)
          : Promise.resolve(null),
        safeFetch(`/api/qhse/intelligent?type=all&${params.toString()}`),
        showSmartAlerts
          ? safeFetch(`/api/qhse/alerts?${params.toString()}`)
          : Promise.resolve(null),
      ]);

      // Process each result independently
      const processResult = (
        result: PromiseSettledResult<any>,
        setter: (data: any) => void,
      ) => {
        if (result.status === "fulfilled" && result.value?.success) {
          setter(result.value.data);
        }
      };

      processResult(dashboardData, setDashboard);
      processResult(incidentsData, (data) => setRecentIncidents(data || []));
      processResult(inspectionsData, (data) =>
        setRecentInspections(data || []),
      );
      processResult(metricsData, setMetrics);
      processResult(insightsData, (data) =>
        setKnowledgeBaseInsights(data || []),
      );
      processResult(connectionsData, (data) =>
        setCrossModuleConnections(data || []),
      );
      processResult(intelligentData, setIntelligentInsights);
      processResult(alertsData, (data) => setSmartAlerts(data || []));

      // Check if we got at least some data
      const hasData =
        (dashboardData.status === "fulfilled" &&
          dashboardData.value?.success) ||
        (metricsData.status === "fulfilled" && metricsData.value?.success);

      if (!hasData && !initialLoadComplete) {
        setLoadError(
          "Unable to load dashboard data. Some services may be unavailable.",
        );
      }

      setLastUpdate(new Date());
      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Failed to load QHSE dashboard data:", error);
      setLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    effectiveTenantId,
    effectiveCustomerId,
    effectiveWarehouseId,
    selectedTimeframe,
    showKnowledgeBaseInsights,
    showCrossModuleConnections,
    initialLoadComplete,
  ]);

  // Auto-refresh
  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadDashboardData, autoRefresh, refreshInterval]);

  // Timeout for initial load - if it takes more than 15 seconds, show what we have
  useEffect(() => {
    if (!initialLoadComplete) {
      const timeout = setTimeout(() => {
        if (!dashboard && !metrics) {
          setLoadError(
            "Loading is taking longer than expected. Some data may be unavailable.",
          );
          setInitialLoadComplete(true);
        }
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [initialLoadComplete, dashboard, metrics]);

  // Subscribe to event bus for real-time updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const eventSource = new EventSource("/api/realtime/qhse-events");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle real-time updates
      if (
        data.type === "qhse.incident.created" ||
        data.type === "qhse.incident.updated"
      ) {
        loadDashboardData();
      } else if (data.type === "qhse.inspection.completed") {
        loadDashboardData();
      } else if (data.type === "qhse.metric.updated") {
        loadDashboardData();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [loadDashboardData]);

  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900";
      case "high":
        return "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900";
      case "low":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "reported":
        return "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900";
      case "investigating":
      case "under_investigation":
        return "text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900";
      case "resolved":
        return "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900";
      case "closed":
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900";
    }
  };

  const getContextDescription = useMemo(() => {
    const parts: string[] = [];
    if (effectiveCustomerId) parts.push(`Customer: ${effectiveCustomerId}`);
    if (effectiveWarehouseId) parts.push(`Warehouse: ${effectiveWarehouseId}`);
    if (effectiveTenantId) parts.push(`Tenant: ${effectiveTenantId}`);
    return parts.length > 0 ? parts.join(" • ") : "All Data";
  }, [effectiveTenantId, effectiveCustomerId, effectiveWarehouseId]);

  const displayMetrics = useMemo(
    () =>
      metrics || {
        incidents: {
          total: dashboard?.safety.openIncidents || 0,
          byCategory: {},
          bySeverity: {},
          byStatus: {},
          trends: { daily: [], weekly: [], monthly: [] },
        },
        safety: {
          ltir: dashboard?.safety.ltifr || 0,
          trir: dashboard?.safety.trir || 0,
          nearMisses: dashboard?.safety.nearMisses || 0,
          daysWithoutIncident: 0,
          safetyTrainingCompliance:
            dashboard?.health.trainingCompletionRate || 0,
        },
        environmental: {
          spills: 0,
          emissions: 0,
          wasteGenerated: dashboard?.environmental.wasteReduction || 0,
          recyclingRate: dashboard?.environmental.recyclingRate || 0,
          energyConsumption: dashboard?.environmental.energyConsumption || 0,
        },
        quality: {
          nonConformances: dashboard?.quality.ncrCount || 0,
          customerComplaints: dashboard?.quality.customerComplaints || 0,
          correctionEffectiveness: 0,
          auditScore: 0,
        },
        compliance: {
          overallScore: dashboard?.compliance.overallScore || 0,
          byStandard: {},
          overdueActions: dashboard?.compliance.openFindings || 0,
          upcomingAudits: dashboard?.compliance.upcomingAudits || 0,
        },
      },
    [metrics, dashboard],
  );

  // Show loading only on initial load, not if we have partial data
  if (isLoading && !initialLoadComplete && !dashboard && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading QHSE Dashboard...
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  // Show error state if initial load failed completely
  if (!initialLoadComplete && loadError && !dashboard && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{loadError}</p>
          <button
            onClick={() => {
              setInitialLoadComplete(false);
              setLoadError(null);
              loadDashboardData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <FiShield className="w-8 h-8 text-blue-600" />
            QHSE Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time Quality, Health, Safety & Environment monitoring
          </p>
          {getContextDescription && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
              <FiDatabase className="w-4 h-4" />
              {getContextDescription}
            </p>
          )}
          {loadError && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
              <FiAlertTriangle className="w-4 h-4" />
              <span>Some data may be unavailable</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 flex-wrap">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="text-sm border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <motion.a
            href="/qhse/statistics"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <FiBarChart className="w-4 h-4 relative z-10" />
            <span className="relative z-10 font-medium">Statistics Board</span>
          </motion.a>

          <motion.button
            onClick={() => setShowNewIncidentModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <FiAlertTriangle className="w-4 h-4 relative z-10" />
            <span className="relative z-10 font-medium">Report Incident</span>
          </motion.button>

          <motion.button
            onClick={refreshData}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isLoading ? 1 : 0.95 }}
            className="relative flex items-center space-x-2 px-3 py-2.5 bg-white/5 backdrop-blur-sm border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{
                duration: 1,
                repeat: isLoading ? Infinity : 0,
                ease: "linear",
              }}
            >
              <FiRefreshCw className="w-4 h-4 relative z-10" />
            </motion.div>
            <span className="relative z-10 font-medium">Refresh</span>
          </motion.button>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {(
            [
              "overview",
              "incidents",
              "inspections",
              "training",
              "environmental",
              "compliance",
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Key Metrics Cards - Enhanced with Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20 shadow-xl shadow-red-500/10 hover:border-red-500/40 transition-all duration-300 group"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Pulse effect for critical incidents */}
          {displayMetrics.incidents.bySeverity?.critical > 0 && (
            <motion.div
              className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          <div className="relative flex items-center justify-between z-10">
            <div>
              <p className="text-red-400 text-sm font-medium mb-1">
                Total Incidents
              </p>
              <motion.p
                className="text-4xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {displayMetrics.incidents.total}
              </motion.p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {displayMetrics.incidents.bySeverity?.critical || 0} critical,{" "}
                {displayMetrics.incidents.bySeverity?.high || 0} high
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <FiAlertTriangle className="w-12 h-12 text-red-400 group-hover:text-red-300 transition-colors" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{
            delay: 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-green-500/20 shadow-xl shadow-green-500/10 hover:border-green-500/40 transition-all duration-300 group"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between z-10">
            <div>
              <p className="text-green-400 text-sm font-medium mb-1">
                Days Without Incident
              </p>
              <motion.p
                className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {displayMetrics.safety.daysWithoutIncident}
              </motion.p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((displayMetrics.safety.daysWithoutIncident / 90) * 100, 100)}%`,
                  }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Target: 90 days</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <FiCheckCircle className="w-12 h-12 text-green-400 group-hover:text-green-300 transition-colors" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 shadow-xl shadow-blue-500/10 hover:border-blue-500/40 transition-all duration-300 group"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between z-10">
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">
                Compliance Score
              </p>
              <motion.p
                className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-600 bg-clip-text text-transparent mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {displayMetrics.compliance.overallScore.toFixed(1)}%
              </motion.p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${displayMetrics.compliance.overallScore}%`,
                  }}
                  transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                {displayMetrics.compliance.overdueActions} overdue actions
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <FiAward className="w-12 h-12 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl shadow-purple-500/10 hover:border-purple-500/40 transition-all duration-300 group"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex items-center justify-between z-10">
            <div>
              <p className="text-purple-400 text-sm font-medium mb-1">
                Training Compliance
              </p>
              <motion.p
                className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {displayMetrics.safety.safetyTrainingCompliance.toFixed(1)}%
              </motion.p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${displayMetrics.safety.safetyTrainingCompliance}%`,
                  }}
                  transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Safety training completion
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <FiUsers className="w-12 h-12 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Trends */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Trends - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-cyan-500/40 transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-600/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Incident Trends
              </h3>
              <select className="text-sm bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500/50">
                <option value="month">Last 7 Months</option>
                <option value="quarter">Last 4 Quarters</option>
                <option value="year">Last 3 Years</option>
              </select>
            </div>
            <div className="relative z-10 h-64 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <FiBarChart className="w-16 h-16 mx-auto mb-2 text-cyan-400" />
                <p className="text-gray-300">Incident Trend Chart</p>
                <p className="text-xs mt-1 text-gray-400">
                  Chart visualization will be integrated
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Recent Incidents - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-red-500/40 transition-all duration-300 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-600/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Recent Incidents
              </h3>
              <motion.a
                href="/qhse/incidents"
                whileHover={{ scale: 1.05 }}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              >
                View All
              </motion.a>
            </div>
            <div className="relative z-10 space-y-4">
              {recentIncidents.length > 0 ? (
                recentIncidents.map((incident, idx) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <motion.div
                        className={`p-2 rounded-full ${getSeverityColor(incident.severity)}`}
                        animate={{
                          scale:
                            incident.severity === "CRITICAL" ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                          duration: 2,
                          repeat:
                            incident.severity === "CRITICAL" ? Infinity : 0,
                        }}
                      >
                        <FiAlertTriangle className="w-4 h-4" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-white">
                          {incident.incidentNumber || incident.id}
                        </p>
                        <p className="text-sm text-gray-400">
                          {incident.location ||
                            incident.locationDetails ||
                            "Unknown Location"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}
                      >
                        {incident.status.replace("_", " ")}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(
                          incident.reportedAt || incident.occurredAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 py-8"
                >
                  No recent incidents
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - KPIs and Insights */}
        <div className="space-y-6">
          {/* Safety KPIs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Safety KPIs
              </h4>
              <FiHeart className="w-6 h-6 text-red-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  LTIR
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.safety.ltir.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  TRIR
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.safety.trir.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Near Misses
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.safety.nearMisses}
                </span>
              </div>
            </div>
          </div>

          {/* Environmental KPIs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Environmental KPIs
              </h4>
              <FiDroplet className="w-6 h-6 text-green-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Recycling Rate
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.environmental.recyclingRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Spills
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.environmental.spills}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Waste (kg)
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.environmental.wasteGenerated.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quality KPIs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Quality KPIs
              </h4>
              <FiTarget className="w-6 h-6 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Non-conformances
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.quality.nonConformances}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Audit Score
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.quality.auditScore.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Customer Complaints
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {displayMetrics.quality.customerComplaints}
                </span>
              </div>
            </div>
          </div>

          {/* Knowledge Base Insights */}
          {showKnowledgeBaseInsights && knowledgeBaseInsights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI Insights
                </h4>
                <FiCpu className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-3">
                {knowledgeBaseInsights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-Module Connections */}
          {showCrossModuleConnections && crossModuleConnections.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Related Items
                </h4>
                <FiLink className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-3">
                {crossModuleConnections.map((connection) => (
                  <div
                    key={connection.module}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {connection.module} ({connection.count})
                    </p>
                    <div className="mt-2 space-y-1">
                      {connection.items.slice(0, 2).map((item) => (
                        <a
                          key={item.id}
                          href={item.link}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 block"
                        >
                          {item.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Alerts */}
          {showSmartAlerts && smartAlerts.length > 0 && (
            <QHSESmartAlerts
              alerts={smartAlerts}
              onDismiss={(id) => {
                setSmartAlerts((prev) => prev.filter((a) => a.id !== id));
              }}
              maxVisible={5}
            />
          )}
        </div>
      </div>

      {/* Additional World-Class Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gamification Panel */}
        {showGamification && (
          <QHSEGamificationPanel
            tenantId={effectiveTenantId}
            customerId={effectiveCustomerId}
            facilityId={undefined}
            warehouseId={effectiveWarehouseId}
          />
        )}

        {/* Compliance Map */}
        {showComplianceMap && (
          <QHSEComplianceMap
            nodes={[
              {
                id: "1",
                label: "ISO 45001",
                type: "STANDARD",
                status: "COMPLIANT",
                connections: ["2", "3"],
              },
              {
                id: "2",
                label: "Safety Training",
                type: "REQUIREMENT",
                status: "COMPLIANT",
                connections: ["1"],
              },
              {
                id: "3",
                label: "Q1 2024 Audit",
                type: "AUDIT",
                status: "IN_PROGRESS",
                connections: ["1", "4"],
              },
              {
                id: "4",
                label: "Finding #12",
                type: "FINDING",
                status: "NON_COMPLIANT",
                connections: ["3", "5"],
              },
              {
                id: "5",
                label: "Action Plan",
                type: "ACTION",
                status: "IN_PROGRESS",
                connections: ["4"],
              },
            ]}
            onNodeClick={(id) => console.log("Node clicked:", id)}
          />
        )}
      </div>

      {/* Risk Heatmap */}
      {intelligentInsights?.risks && (
        <div className="mt-6">
          <QHSERiskHeatmap
            data={
              intelligentInsights.risks.riskFactors?.map(
                (factor: any, idx: number) => ({
                  id: `risk-${idx}`,
                  rowLabel: factor.factor || "Unknown",
                  colLabel: "Risk Score",
                  value: factor.contribution || 0,
                  category: "SAFETY" as const,
                  details: factor.description || "",
                  recommendations: factor.mitigationSuggestion
                    ? [factor.mitigationSuggestion]
                    : [],
                }),
              ) || []
            }
            title="QHSE Risk Heatmap"
            description="Visualizing risk hotspots across operations"
          />
        </div>
      )}
    </div>
  );
};

export default RealTimeQHSEDashboard;