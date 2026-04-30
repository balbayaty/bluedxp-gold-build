/**
 * Mind-Blowing Home Dashboard
 *
 * Revolutionary design with:
 * - Floating 3D navigation menu (like showcase)
 * - Major modules (Hazalyze, Logistics) with expandable sections
 * - 3D icons with perspective effects
 * - Scroll-down expand functionality
 * - No user profile box (integrated seamlessly)
 *
 * 4IR & 5IR Aligned • Integration-First • Connectivity-Centric
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import Link from "next/link";
import GlobalCommandPalette from "@/components/navigation/GlobalCommandPalette";

interface MajorModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
  href: string;
  subModules: {
    name: string;
    icon: string;
    href: string;
    description: string;
  }[];
}

interface SystemStatus {
  integrity: number;
  status: "operational" | "degraded" | "maintenance";
}

const colorMap: Record<
  string,
  {
    bg: string;
    text: string;
    icon: string;
    glow: string;
    border: string;
    indicator: string;
  }
> = {
  emerald: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/50",
    border: "border-emerald-400/50",
    indicator: "bg-emerald-400",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    icon: "text-cyan-400",
    glow: "shadow-cyan-500/50",
    border: "border-cyan-400/50",
    indicator: "bg-cyan-400",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-400",
    glow: "shadow-blue-500/50",
    border: "border-blue-400/50",
    indicator: "bg-blue-400",
  },
  indigo: {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    glow: "shadow-indigo-500/50",
    border: "border-indigo-400/50",
    indicator: "bg-indigo-400",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    icon: "text-purple-400",
    glow: "shadow-purple-500/50",
    border: "border-purple-400/50",
    indicator: "bg-purple-400",
  },
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    icon: "text-pink-400",
    glow: "shadow-pink-500/50",
    border: "border-pink-400/50",
    indicator: "bg-pink-400",
  },
};

export default function MindBlowingHomeDashboard() {
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();
  const router = useRouter();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    integrity: 99.8,
    status: "operational",
  });
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Major modules with expandable sub-modules
  const majorModules: MajorModule[] = [
    {
      id: "hazalyze",
      name: "Hazalyze",
      description: "AI-Powered Intelligence & Analytics",
      icon: "ri-brain-line",
      color: "emerald",
      gradient: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      href: "/intelligence",
      subModules: [
        {
          name: "AI Copilot",
          icon: "ri-robot-line",
          href: "/agents/showcase",
          description: "Intelligent AI Assistant",
        },
        {
          name: "Analytics",
          icon: "ri-bar-chart-box-line",
          href: "/intelligence/analytics",
          description: "Advanced Analytics",
        },
        {
          name: "Data Mining",
          icon: "ri-database-2-line",
          href: "/intelligence/data-mining",
          description: "Data Intelligence",
        },
        {
          name: "Process Mining",
          icon: "ri-flow-chart",
          href: "/intelligence/process-mining",
          description: "Process Intelligence",
        },
      ],
    },
    {
      id: "logistics",
      name: "Logistics",
      description: "End-to-End Supply Chain Management",
      icon: "ri-truck-line",
      color: "cyan",
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-400",
      href: "/transportation",
      subModules: [
        {
          name: "Transportation",
          icon: "ri-truck-line",
          href: "/transportation",
          description: "Fleet & Routes",
        },
        {
          name: "Warehouse",
          icon: "ri-warehouse-line",
          href: "/wms",
          description: "Inventory Management",
        },
        {
          name: "Marketplace",
          icon: "ri-store-3-line",
          href: "/marketplace",
          description: "Service Marketplace",
        },
        {
          name: "Tracking",
          icon: "ri-map-pin-line",
          href: "/tracking",
          description: "Real-time Tracking",
        },
      ],
    },
    {
      id: "compliance",
      name: "Compliance",
      description: "Trade & Regulatory Compliance",
      icon: "ri-shield-check-line",
      color: "blue",
      gradient: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      href: "/compliance",
      subModules: [
        {
          name: "Trade Compliance",
          icon: "ri-global-line",
          href: "/trade-compliance",
          description: "International Trade",
        },
        {
          name: "QHSE",
          icon: "ri-shield-star-line",
          href: "/qhse",
          description: "Quality, Health, Safety",
        },
        {
          name: "ISO IMS",
          icon: "ri-award-line",
          href: "/iso-ims",
          description: "ISO Management",
        },
        {
          name: "MSDS",
          icon: "ri-file-list-3-line",
          href: "/msds",
          description: "Material Safety",
        },
      ],
    },
    {
      id: "operations",
      name: "Operations",
      description: "Operational Excellence & Automation",
      icon: "ri-settings-3-line",
      color: "purple",
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      href: "/workspace",
      subModules: [
        {
          name: "Workspace",
          icon: "ri-layout-grid-line",
          href: "/workspace",
          description: "Unified Workspace",
        },
        {
          name: "Proposals",
          icon: "ri-file-edit-line",
          href: "/proposals",
          description: "RFQ & Proposals",
        },
        {
          name: "MaaS",
          icon: "ri-cloud-line",
          href: "/maas",
          description: "Platform as a Service",
        },
        {
          name: "Facility",
          icon: "ri-building-line",
          href: "/facility",
          description: "Facility Management",
        },
      ],
    },
  ];

  // Track scroll for expand effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcuts
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

  // Fetch system status - DEFERRED to avoid blocking initial render
  useEffect(() => {
    // Defer API call to avoid blocking initial page load
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
          });
        }
      } catch (error) {
        console.error("Failed to fetch system status:", error);
      }
    };

    // Use requestIdleCallback or setTimeout to defer the API call
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          fetchStatus();
        },
        { timeout: 2000 },
      );
    } else {
      setTimeout(fetchStatus, 1000); // 1 second delay to let page render first
    }

    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-[#0a0e14] via-[#0f172a] to-[#1a1f2e] relative overflow-x-hidden"
    >
      {/* Main Content - Scrollable with Expand Effect */}
      <div className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section - Minimal, No User Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              BlueDXP Platform
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-[#9ca3af] max-w-2xl mx-auto"
            >
              Enterprise Intelligence Operating System
            </motion.p>
          </motion.div>

          {/* Major Modules - Expandable Cards */}
          <div className="space-y-6">
            {majorModules.map((module, index) => {
              const isExpanded = expandedModule === module.id;
              const colors = colorMap[module.color] || colorMap.cyan;

              return (
                <motion.div
                  key={module.id}
                  id={`module-${module.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Main Module Card */}
                  <motion.div
                    onClick={() => toggleModule(module.id)}
                    className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-xl cursor-pointer transition-all ${
                      isExpanded
                        ? `${colors.bg} ${colors.border} shadow-2xl ${colors.glow}`
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Glow Effect */}
                    {isExpanded && (
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${colors.glow.replace("shadow-", "from-").replace("/50", "/10")} to-transparent blur-2xl`}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    )}

                    <div className="relative p-6 sm:p-8">
                      <div className="flex items-center justify-between">
                        {/* 3D Icon */}
                        <motion.div
                          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${module.gradient} border ${module.borderColor} flex items-center justify-center shadow-lg relative`}
                          whileHover={{
                            rotateY: 15,
                            rotateX: 5,
                            scale: 1.1,
                            z: 50,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          style={{
                            perspective: "1000px",
                            transformStyle: "preserve-3d",
                          }}
                        >
                          <i
                            className={`${module.icon} ${module.iconColor} text-3xl sm:text-4xl`}
                          ></i>
                          {/* 3D Shadow */}
                          <div
                            className={`absolute inset-0 rounded-2xl ${colors.glow.replace("shadow-", "bg-").replace("/50", "/20")} blur-xl -z-10`}
                          ></div>
                        </motion.div>

                        {/* Module Info */}
                        <div className="flex-1 ml-6 min-w-0">
                          <h2
                            className={`text-2xl sm:text-3xl font-bold mb-2 ${isExpanded ? colors.text : "text-white"}`}
                          >
                            {module.name}
                          </h2>
                          <p
                            className={`text-sm sm:text-base ${isExpanded ? colors.text + "/80" : "text-[#9ca3af]"}`}
                          >
                            {module.description}
                          </p>
                        </div>

                        {/* Expand/Collapse Icon */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className={`${module.iconColor} text-2xl`}
                        >
                          <i className="ri-arrow-down-s-line"></i>
                        </motion.div>
                      </div>

                      {/* Sub-Modules - Expandable */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 pt-6 border-t border-white/10 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {module.subModules.map((subModule, subIndex) => (
                                <motion.div
                                  key={subModule.name}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: subIndex * 0.05 }}
                                  whileHover={{ scale: 1.05, y: -4 }}
                                >
                                  <Link
                                    href={subModule.href}
                                    className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:bg-white/10 transition-all group"
                                  >
                                    <div
                                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${module.gradient} border ${module.borderColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                                    >
                                      <i
                                        className={`${subModule.icon} ${module.iconColor} text-lg`}
                                      ></i>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-1">
                                      {subModule.name}
                                    </h3>
                                    <p className="text-xs text-[#9ca3af] line-clamp-2">
                                      {subModule.description}
                                    </p>
                                  </Link>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating 3D Navigation Menu - Right Side (Like Showcase) */}
      <FloatingModuleNavigation
        modules={majorModules}
        expandedModule={expandedModule}
        onModuleClick={(moduleId) => {
          const foundModule = majorModules.find((m) => m.id === moduleId);
          if (foundModule) {
            toggleModule(moduleId);
            // Scroll to module
            setTimeout(() => {
              const element = document.getElementById(`module-${moduleId}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
          }
        }}
      />

      {/* Global Command Palette */}
      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}

// Floating Module Navigation Component
interface FloatingModuleNavigationProps {
  modules: MajorModule[];
  expandedModule: string | null;
  onModuleClick: (moduleId: string) => void;
}

function FloatingModuleNavigation({
  modules,
  expandedModule,
  onModuleClick,
}: FloatingModuleNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="fixed right-4 bottom-32 z-[9980] hidden lg:block"
      style={{
        maxHeight: "calc(100vh - 250px)",
        pointerEvents: "auto",
      }}
    >
      <motion.div
        className="rounded-2xl backdrop-blur-xl border-2 border-white/10 bg-gray-900/95 shadow-2xl overflow-hidden"
        style={{
          width: isExpanded ? "280px" : "72px",
          maxHeight: "calc(100vh - 200px)",
        }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 hover:border-cyan-500/40 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <i className="ri-compass-3-line text-lg text-cyan-400"></i>
            </div>
            {isExpanded && (
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Modules
                </div>
                <div className="text-xs text-cyan-400/70">
                  {modules.length} Major
                </div>
              </div>
            )}
          </div>
          <motion.i
            className={`ri-arrow-${isExpanded ? "left" : "right"}-s-line text-xl text-cyan-400`}
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          ></motion.i>
        </motion.button>

        {/* 3D Navigation Items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-y-auto custom-scrollbar p-3 space-y-2"
              style={{ maxHeight: "calc(100vh - 300px)" }}
            >
              {modules.map((module, index) => {
                const isActive = expandedModule === module.id;
                const isHovered = hoveredItem === module.id;
                const colors = colorMap[module.color] || colorMap.cyan;

                return (
                  <motion.button
                    key={module.id}
                    onClick={() => onModuleClick(module.id)}
                    onHoverStart={() => setHoveredItem(module.id)}
                    onHoverEnd={() => setHoveredItem(null)}
                    className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group overflow-hidden border-2 ${
                      isActive && colors
                        ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg ${colors.glow}`
                        : "bg-gray-800/30 text-gray-400 border-gray-700/30 hover:bg-gray-700/50 hover:text-white hover:border-gray-600/50"
                    }`}
                    whileHover={{ scale: 1.05, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Active indicator */}
                    {isActive && colors && (
                      <motion.div
                        layoutId={`activeFloating-${module.id}`}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full ${colors.indicator}`}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* 3D Icon */}
                    <motion.div
                      className={`p-2.5 rounded-lg flex-shrink-0 transition-all relative z-10 ${
                        isActive && colors
                          ? `${colors.bg} ${colors.icon} border ${colors.border}`
                          : "bg-gray-800/50 text-gray-400 border border-gray-700/30 group-hover:bg-gray-700/50 group-hover:text-white"
                      }`}
                      whileHover={{ rotateY: 15, rotateX: 5, scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      style={{
                        perspective: "1000px",
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <i className={`${module.icon} text-xl`}></i>
                    </motion.div>

                    {/* Label */}
                    <div className="flex-1 min-w-0 relative z-10 text-left">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isActive && colors ? colors.text : "text-gray-300"
                        }`}
                      >
                        {module.name}
                      </div>
                    </div>

                    {/* Active checkmark */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={`relative z-10 ${colors.icon}`}
                      >
                        <i className="ri-check-line text-lg"></i>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed State */}
        {!isExpanded && (
          <div className="p-2 space-y-2">
            {modules.map((module, index) => {
              const isActive = expandedModule === module.id;
              const colors = colorMap[module.color] || colorMap.cyan;

              return (
                <motion.button
                  key={module.id}
                  onClick={() => onModuleClick(module.id)}
                  className={`relative w-full p-3 rounded-lg transition-all ${
                    isActive && colors
                      ? `${colors.bg} ${colors.icon} border-2 ${colors.border}`
                      : "bg-gray-800/30 text-gray-400 border-2 border-gray-700/30 hover:bg-gray-700/50 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  title={module.name}
                >
                  <i className={`${module.icon} text-xl`}></i>
                  {isActive && (
                    <motion.div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colors.indicator} border-2 border-gray-900`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
