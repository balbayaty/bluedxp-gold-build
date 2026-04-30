"use client";

/**
 * Smart Header Actions Component
 *
 * A creative, AI-powered header component featuring:
 * - AI Copilot Quick Access (one-click AI assistant)
 * - Quick Actions Menu (context-aware actions)
 * - System Health Indicator (real-time status)
 * - Smart Insights Badge (AI-powered suggestions)
 *
 * 4IR & 5IR Aligned • Enterprise-Grade • Beautiful UX
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

// Configuration - No hardcoded values
const CONFIG = {
  health: {
    endpoint: "/api/system-health/status",
    refreshInterval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds timeout
  },
  insights: {
    endpoint: "/api/copilot/analytics",
    refreshInterval: 60000, // 1 minute
  },
  ui: {
    menuWidth: 280,
    insightsWidth: 320,
  },
} as const;

interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  responseTime?: number;
  uptime?: number;
  overallStatus?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  badge?: string | number;
  category?: "create" | "navigate" | "ai" | "system";
}

interface SmartInsight {
  id: string;
  message: string;
  type: "info" | "warning" | "success" | "ai";
  priority: number;
  timestamp?: Date;
}

interface SmartHeaderActionsProps {
  isDarkMode: boolean;
  onCopilotOpen?: () => void;
}

export default function SmartHeaderActions({
  isDarkMode,
  onCopilotOpen,
}: SmartHeaderActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: "healthy",
  });
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch system health with proper error handling
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.health.timeout);

      const res = await fetch(CONFIG.health.endpoint, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.ok !== false) {
        const status = (data.overallStatus || data.status || "healthy").toLowerCase();
        setSystemHealth({
          status: status === "down" ? "down" : status === "degraded" ? "degraded" : "healthy",
          responseTime: data.responseTime || data.avgResponseTime,
          uptime: data.uptime,
          overallStatus: data.overallStatus || status,
        });
      } else {
        setSystemHealth({ status: "degraded" });
      }
    } catch (error) {
      console.error("[SmartHeaderActions] Failed to fetch system health:", error);
      // Don't set to down on network errors, just keep current state
      if (error instanceof Error && error.name !== "AbortError") {
        setSystemHealth((prev) => ({ ...prev, status: prev.status || "degraded" }));
      }
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Initial health fetch and periodic updates
  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, CONFIG.health.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // Fetch AI-powered insights
  const fetchInsights = useCallback(async () => {
    if (insightsLoading) return;
    
    setInsightsLoading(true);
    try {
      // Try to fetch real insights from copilot analytics
      const res = await fetch(CONFIG.insights.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            pathname,
            moduleId: pathname?.split("/")[1],
            page: pathname?.split("/").pop() || "dashboard",
          },
          type: "header-insights",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insights && Array.isArray(data.insights)) {
          setInsights(data.insights.map((insight: any) => ({
            id: insight.id || `insight-${Date.now()}-${Math.random()}`,
            message: insight.message || insight.text,
            type: insight.type || "info",
            priority: insight.priority || 1,
            timestamp: insight.timestamp ? new Date(insight.timestamp) : new Date(),
          })));
          return;
        }
      }
    } catch (error) {
      console.warn("[SmartHeaderActions] Failed to fetch insights, using fallback:", error);
    }

    // Fallback: Generate context-aware insights based on system state
    const fallbackInsights: SmartInsight[] = [];

    // System performance insight
    if (systemHealth.responseTime && systemHealth.responseTime > 500) {
      fallbackInsights.push({
        id: "perf-warning",
        message: `System response time is elevated (${Math.round(systemHealth.responseTime)}ms)`,
        type: "warning",
        priority: 2,
        timestamp: new Date(),
      });
    }

    // System health insight
    if (systemHealth.status === "healthy") {
      fallbackInsights.push({
        id: "system-healthy",
        message: "All systems operational",
        type: "success",
        priority: 1,
        timestamp: new Date(),
      });
    } else if (systemHealth.status === "degraded") {
      fallbackInsights.push({
        id: "system-degraded",
        message: "System performance may be affected",
        type: "warning",
        priority: 2,
        timestamp: new Date(),
      });
    }

    // Context-aware AI suggestions
    const moduleId = pathname?.split("/")[1] || "";
    if (pathname?.includes("/warehouse") || moduleId === "warehouse") {
      fallbackInsights.push({
        id: "ai-suggestion-warehouse",
        message: "AI suggests optimizing inventory levels",
        type: "ai",
        priority: 3,
        timestamp: new Date(),
      });
    } else if (pathname?.includes("/transportation") || moduleId === "transportation") {
      fallbackInsights.push({
        id: "ai-suggestion-transport",
        message: "AI recommends reviewing route efficiency",
        type: "ai",
        priority: 3,
        timestamp: new Date(),
      });
    } else if (pathname?.includes("/asn") || moduleId === "asn") {
      fallbackInsights.push({
        id: "ai-suggestion-asn",
        message: "AI can help automate ASN processing",
        type: "ai",
        priority: 3,
        timestamp: new Date(),
      });
    }

    setInsights(
      fallbackInsights.sort((a, b) => b.priority - a.priority).slice(0, 3)
    );
    setInsightsLoading(false);
  }, [systemHealth, pathname, insightsLoading]);

  // Fetch insights periodically
  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, CONFIG.insights.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  // Generate context-aware quick actions based on current page
  useEffect(() => {
    const generateQuickActions = (): QuickAction[] => {
      const actions: QuickAction[] = [];
      const moduleId = pathname?.split("/")[1] || "";

      // Context-aware actions based on pathname
      if (pathname?.includes("/warehouse") || moduleId === "warehouse") {
        actions.push(
          {
            id: "create-inbound",
            label: "New Inbound",
            icon: "ri-inbox-line",
            action: () => router.push("/warehouse/inbound/new"),
            category: "create",
          },
          {
            id: "create-outbound",
            label: "New Outbound",
            icon: "ri-send-plane-line",
            action: () => router.push("/warehouse/outbound/new"),
            category: "create",
          },
          {
            id: "inventory-check",
            label: "Inventory Check",
            icon: "ri-file-list-3-line",
            action: () => router.push("/warehouse/inventory"),
            category: "navigate",
          },
        );
      } else if (pathname?.includes("/transportation") || moduleId === "transportation") {
        actions.push(
          {
            id: "create-shipment",
            label: "New Shipment",
            icon: "ri-truck-line",
            action: () => router.push("/transportation/shipments/new"),
            category: "create",
          },
          {
            id: "track-shipment",
            label: "Track Shipment",
            icon: "ri-map-pin-line",
            action: () => router.push("/transportation/tracking"),
            category: "navigate",
          },
        );
      } else if (pathname?.includes("/asn") || moduleId === "asn") {
        actions.push(
          {
            id: "create-asn",
            label: "New ASN",
            icon: "ri-file-add-line",
            action: () => router.push("/asn/new"),
            category: "create",
          },
          {
            id: "import-asn",
            label: "Import ASN",
            icon: "ri-upload-cloud-line",
            action: () => router.push("/asn/import"),
            category: "create",
          },
        );
      }

      // Always available actions
      actions.push(
        {
          id: "ai-copilot",
          label: "AI Copilot",
          icon: "ri-robot-line",
          action: () => {
            if (onCopilotOpen) {
              onCopilotOpen();
            } else {
              // Trigger copilot via custom event
              window.dispatchEvent(new CustomEvent("open-copilot"));
            }
          },
          category: "ai",
        },
        {
          id: "command-palette",
          label: "Command Palette",
          icon: "ri-terminal-box-line",
          action: () => {
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              }),
            );
          },
          category: "ai",
        },
        {
          id: "dashboard",
          label: "Dashboard",
          icon: "ri-dashboard-line",
          action: () => router.push("/dashboard"),
          category: "navigate",
        },
      );

      return actions;
    };

    setQuickActions(generateQuickActions());
  }, [pathname, onCopilotOpen, router]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowQuickActions(false);
        setShowInsights(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const healthColors = {
    healthy: "bg-green-500",
    degraded: "bg-yellow-500",
    down: "bg-red-500",
  };

  const insightColors = {
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    ai: "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div className="flex items-center gap-2" ref={menuRef}>
      {/* System Health Indicator */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          <div
            className={`w-2 h-2 rounded-full ${healthColors[systemHealth.status]} ${
              healthLoading ? "animate-pulse" : ""
            }`}
          />
          {systemHealth.status !== "healthy" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
            />
          )}
        </div>
        <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900/95 backdrop-blur-xl rounded-lg text-xs text-white whitespace-nowrap opacity-0 hover:opacity-100 pointer-events-none transition-opacity z-50">
          System: {systemHealth.status}
          {systemHealth.responseTime && ` (${Math.round(systemHealth.responseTime)}ms)`}
        </div>
      </motion.div>

      {/* Smart Insights Badge */}
      {insights.length > 0 && (
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.button
            onClick={() => setShowInsights(!showInsights)}
            className={`relative px-2.5 py-1.5 rounded-lg border transition-all ${
              isDarkMode
                ? "bg-white/5 border-white/10 hover:border-cyan-500/50"
                : "bg-gray-100/80 border-gray-200 hover:border-cyan-500"
            }`}
          >
            <i className="ri-lightbulb-flash-line text-cyan-400 text-sm" />
            {insights.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
              >
                {insights.length}
              </motion.span>
            )}
            {insightsLoading && (
              <motion.div
                className="absolute inset-0 rounded-lg bg-cyan-500/10"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.button>

          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{ width: CONFIG.ui.insightsWidth }}
                className={`absolute top-full right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl z-50 ${
                  isDarkMode ? "bg-gray-900/95" : "bg-white/95"
                }`}
              >
                <div className={`text-xs font-semibold mb-2 px-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  AI Insights
                </div>
                {insightsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  insights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`mb-2 last:mb-0 px-3 py-2 rounded-lg border text-xs ${insightColors[insight.type]}`}
                    >
                      <div className="flex items-start gap-2">
                        <i
                          className={`${
                            insight.type === "ai"
                              ? "ri-robot-line"
                              : insight.type === "warning"
                                ? "ri-alert-line"
                                : insight.type === "success"
                                  ? "ri-checkbox-circle-line"
                                  : "ri-information-line"
                          } mt-0.5 flex-shrink-0`}
                        />
                        <span className="flex-1">{insight.message}</span>
                      </div>
                      {insight.timestamp && (
                        <div className={`text-[10px] mt-1 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}>
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Quick Actions Menu */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
            isDarkMode
              ? "bg-white/5 border-white/10 hover:border-cyan-500/50 text-white"
              : "bg-gray-100/80 border-gray-200 hover:border-cyan-500 text-gray-700"
          }`}
        >
          <i className="ri-flashlight-line text-cyan-400 text-sm" />
          <span className="text-xs font-medium hidden sm:inline">Quick</span>
        </motion.button>

        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{ width: CONFIG.ui.menuWidth }}
              className={`absolute top-full right-0 mt-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl z-50 ${
                isDarkMode ? "bg-gray-900/95" : "bg-white/95"
              }`}
            >
              <div className={`text-xs font-semibold mb-2 px-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
                Quick Actions
              </div>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    whileHover={{ x: 4 }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      isDarkMode
                        ? "hover:bg-white/10 text-gray-300"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <i
                      className={`${action.icon} text-cyan-400 flex-shrink-0`}
                    />
                    <span className="flex-1">{action.label}</span>
                    {action.badge && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                        {action.badge}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
