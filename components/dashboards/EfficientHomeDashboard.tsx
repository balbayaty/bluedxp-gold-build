/**
 * Efficient Home Dashboard
 *
 * Redesigned for maximum efficiency and better UX:
 * - Compact user profile with quick actions
 * - Streamlined navigation with better information density
 * - Integrated system status
 * - Modern, clean design following UI/UX standards
 *
 * 4IR & 5IR Aligned • Integration-First • Connectivity-Centric
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import Link from "next/link";
import GlobalCommandPalette from "@/components/navigation/GlobalCommandPalette";

interface QuickModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  badge?: string;
  color: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}

interface SystemStatus {
  integrity: number;
  status: "operational" | "degraded" | "maintenance";
  lastUpdate: Date;
}

export default function EfficientHomeDashboard() {
  const { user, tenant } = useAuth();
  const { currentCustomer } = useCustomer();
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    integrity: 99.8,
    status: "operational",
    lastUpdate: new Date(),
  });

  // Quick modules - most frequently accessed
  const quickModules: QuickModule[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      description: "Overview & Analytics",
      icon: "ri-dashboard-3-line",
      href: "/dashboards/ultimate",
      color: "cyan",
      gradient: "from-cyan-500/20 to-cyan-600/20",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
    },
    {
      id: "unified-centers",
      name: "Unified Centers",
      description: "Consolidated module experience",
      icon: "ri-layout-grid-line",
      href: "/workspace",
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
    },
    {
      id: "wms",
      name: "Warehouse",
      description: "Inventory & Operations",
      icon: "ri-warehouse-line",
      href: "/wms",
      color: "indigo",
      gradient: "from-indigo-500/20 to-indigo-600/20",
      borderColor: "border-indigo-500/30",
      iconColor: "text-indigo-400",
    },
    {
      id: "tms",
      name: "Transportation",
      description: "Logistics & Fleet",
      icon: "ri-truck-line",
      href: "/transportation",
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
    },
    {
      id: "compliance",
      name: "Compliance",
      description: "Trade & Regulatory",
      icon: "ri-shield-check-line",
      href: "/compliance",
      color: "green",
      gradient: "from-green-500/20 to-green-600/20",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
    },
    {
      id: "ai",
      name: "AI Intelligence",
      description: "Hazalyze & Analytics",
      icon: "ri-brain-line",
      href: "/intelligence",
      color: "pink",
      gradient: "from-pink-500/20 to-pink-600/20",
      borderColor: "border-pink-500/30",
      iconColor: "text-pink-400",
    },
  ];

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen]);

  // Fetch system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/system-health/status");
        if (response.ok) {
          const data = await response.json();
          setSystemStatus({
            integrity: data.overview?.systemHealthScore || 99.8,
            status:
              data.overview?.systemHealthScore > 95
                ? "operational"
                : "degraded",
            lastUpdate: new Date(),
          });
        }
      } catch (error) {
        console.error("Failed to fetch system status:", error);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "degraded":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getRoleDisplay = () => {
    if (!user) return { name: "Guest", role: "GUEST" };
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "Super Administrator",
      SYSTEM_ADMIN: "System Administrator",
      WAREHOUSE_HEAD: "Warehouse Head",
      OPERATIONS_MANAGER: "Operations Manager",
    };
    return {
      name: user.name || "User",
      role: roleMap[user.role] || user.role,
    };
  };

  const userInfo = getRoleDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Compact Header - User Profile + Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* User Info - Compact */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <i className="ri-user-line text-white text-lg sm:text-xl"></i>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0e14]"></div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                  {userInfo.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#9ca3af] truncate">
                  {userInfo.role}
                </p>
              </div>
            </div>

            {/* Quick Actions - Horizontal */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Command Palette Trigger */}
              <motion.button
                onClick={() => setCommandPaletteOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/10 hover:border-cyan-500/50 transition-all"
              >
                <i className="ri-command-line text-cyan-400"></i>
                <span className="hidden sm:inline">Command</span>
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-white/10 text-gray-400 border border-white/5 rounded">
                  ⌘K
                </kbd>
              </motion.button>

              {/* System Status Badge - Compact */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(systemStatus.status)}`}
              >
                <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                <span className="text-xs font-medium hidden sm:inline">
                  {systemStatus.integrity.toFixed(1)}%
                </span>
                <span className="text-xs font-medium sm:hidden">
                  {systemStatus.integrity.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Navigation Modules - Takes 2 columns on large screens */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <i className="ri-apps-2-line text-cyan-400"></i>
                Quick Access
              </h2>
              <Link
                href="/workspace"
                className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                View All
                <i className="ri-arrow-right-line"></i>
              </Link>
            </div>

            {/* Compact Module Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {quickModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={module.href}
                    className="block p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-500/50 hover:bg-white/10 transition-all group"
                  >
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${module.gradient} border ${module.borderColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <i
                        className={`${module.icon} ${module.iconColor} text-lg sm:text-xl`}
                      ></i>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-1 truncate">
                      {module.name}
                    </h3>
                    <p className="text-xs text-[#9ca3af] line-clamp-2">
                      {module.description}
                    </p>
                    {module.badge && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded">
                        {module.badge}
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Status Panel - Compact Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* System Integrity Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                  <i className="ri-shield-check-line text-green-400"></i>
                  System Integrity
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${getStatusColor(systemStatus.status)}`}
                >
                  {systemStatus.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#9ca3af]">
                  <span>Overall Health</span>
                  <span className="text-green-400 font-semibold">
                    {systemStatus.integrity.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.integrity}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* Quick Status Indicators */}
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {systemStatus.status === "operational" ? "✓" : "⚠"}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {new Date(systemStatus.lastUpdate).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1">Last Update</div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-3 flex items-center gap-2">
                <i className="ri-links-line text-cyan-400"></i>
                Quick Links
              </h3>
              <div className="space-y-2">
                {[
                  {
                    name: "Settings",
                    icon: "ri-settings-3-line",
                    href: "/settings",
                  },
                  {
                    name: "System Status",
                    icon: "ri-pulse-line",
                    href: "/system-status",
                  },
                  {
                    name: "Documentation",
                    icon: "ri-book-line",
                    href: "/docs",
                  },
                ].map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <i
                      className={`${link.icon} text-cyan-400 group-hover:text-cyan-300`}
                    ></i>
                    <span className="text-sm text-white group-hover:text-cyan-300 transition-colors">
                      {link.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global Command Palette */}
      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
