/**
 * Enhanced 3D Sidebar Navigation
 *
 * Revolutionary side navigation with:
 * - 3D icons with perspective effects
 * - Expandable scroll sections
 * - Smooth animations
 * - Color-coded modules
 * - Floating menu concept integration
 *
 * 4IR & 5IR Aligned • Integration-First • Connectivity-Centric
 */

"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useSpring } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SidebarInsightsWidget from "./SidebarInsightsWidget";

interface NavItem {
  name: string;
  href?: string;
  icon: string;
  description?: string;
  badge?: string | number;
  children?: NavItem[];
  color?: string;
}

interface Enhanced3DSidebarProps {
  navStructure: NavItem[];
  isDarkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: any;
}

const colorMap: Record<
  string,
  { bg: string; text: string; icon: string; glow: string; border: string }
> = {
  cyan: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    icon: "text-cyan-400",
    glow: "shadow-cyan-500/50",
    border: "border-cyan-400/50",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-400",
    glow: "shadow-blue-500/50",
    border: "border-blue-400/50",
  },
  indigo: {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    glow: "shadow-indigo-500/50",
    border: "border-indigo-400/50",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    icon: "text-purple-400",
    glow: "shadow-purple-500/50",
    border: "border-purple-400/50",
  },
  emerald: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    glow: "shadow-emerald-500/50",
    border: "border-emerald-400/50",
  },
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    icon: "text-pink-400",
    glow: "shadow-pink-500/50",
    border: "border-pink-400/50",
  },
};

export default function Enhanced3DSidebar({
  navStructure,
  isDarkMode,
  sidebarOpen,
  setSidebarOpen,
  user,
}: Enhanced3DSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Spring animation for sidebar width
  const sidebarWidth = useSpring(sidebarOpen ? 280 : 88, {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    sidebarWidth.set(sidebarOpen ? 280 : 88);
  }, [sidebarOpen, sidebarWidth]);

  // Check if route is active
  const isActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    },
    [pathname],
  );

  // Toggle expand
  const toggleExpand = useCallback((itemName: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  }, []);

  // Auto-expand active items
  useEffect(() => {
    const findAndExpandActive = (items: NavItem[]) => {
      items.forEach((item) => {
        if (item.href && isActive(item.href)) {
          // Find parent and expand it
          const parent = navStructure.find((p) =>
            p.children?.some(
              (c) => c.href === item.href || c.name === item.name,
            ),
          );
          if (parent) {
            setExpandedItems((prev) => new Set([...prev, parent.name]));
          }
        }
        if (item.children) {
          findAndExpandActive(item.children);
        }
      });
    };
    findAndExpandActive(navStructure);
  }, [pathname, navStructure, isActive]);

  // Get module color
  const getModuleColor = (item: NavItem): string => {
    if (item.color) return item.color;
    // Auto-assign colors based on module name
    const name = item.name.toLowerCase();
    if (
      name.includes("hazalyze") ||
      name.includes("ai") ||
      name.includes("intelligence")
    )
      return "emerald";
    if (
      name.includes("logistics") ||
      name.includes("transport") ||
      name.includes("warehouse")
    )
      return "cyan";
    if (name.includes("compliance") || name.includes("qhse")) return "blue";
    if (name.includes("operations") || name.includes("workspace"))
      return "purple";
    return "cyan";
  };

  // Render nav item with 3D effects
  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.name);
    const active = item.href ? isActive(item.href) : false;
    const isHovered = hoveredItem === item.name;
    const moduleColor = getModuleColor(item);
    const colors = colorMap[moduleColor] || colorMap.cyan;

    return (
      <div key={item.name} className="mb-1">
        {hasChildren ? (
          <motion.button
            onClick={() => toggleExpand(item.name)}
            onHoverStart={() => setHoveredItem(item.name)}
            onHoverEnd={() => setHoveredItem(null)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
              active || isExpanded
                ? `${colors.bg} ${colors.text} ${colors.border} border-l-4`
                : isDarkMode
                  ? "text-[#9ca3af] hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"
            }`}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Hover glow */}
            {isHovered && (
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-${moduleColor}-500/10 to-transparent`}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
              />
            )}

            {/* 3D Icon */}
            <motion.div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative ${
                active || isExpanded
                  ? `${colors.bg} ${colors.icon} border ${colors.border}`
                  : isDarkMode
                    ? "bg-white/5 text-gray-400 border border-white/10"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
              whileHover={{
                rotateY: 15,
                rotateX: 5,
                scale: 1.1,
                z: 50,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
            >
              <i className={`${item.icon} text-lg`}></i>
              {/* 3D Shadow */}
              {(active || isExpanded) && (
                <motion.div
                  className={`absolute inset-0 rounded-lg ${colors.glow.replace("shadow-", "bg-").replace("/50", "/20")} blur-md -z-10`}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Label */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-w-0 ml-3 text-left relative z-10"
              >
                <div
                  className={`text-sm font-semibold truncate ${
                    active || isExpanded
                      ? colors.text
                      : isDarkMode
                        ? "text-white"
                        : "text-gray-900"
                  }`}
                >
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-[#9ca3af] truncate mt-0.5">
                    {item.description}
                  </div>
                )}
              </motion.div>
            )}

            {/* Expand Icon */}
            {sidebarOpen && (
              <motion.i
                className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-lg ${
                  active || isExpanded ? colors.text : "text-gray-400"
                }`}
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              />
            )}

            {/* Badge */}
            {item.badge && sidebarOpen && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
              >
                {item.badge}
              </span>
            )}
          </motion.button>
        ) : (
          <Link
            href={item.href || "#"}
            onMouseEnter={() => setHoveredItem(item.name)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
              active
                ? `${colors.bg} ${colors.text} ${colors.border} border-l-4`
                : isDarkMode
                  ? "text-[#9ca3af] hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"
            }`}
          >
            {/* 3D Icon */}
            <motion.div
              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative ${
                active
                  ? `${colors.bg} ${colors.icon} border ${colors.border}`
                  : isDarkMode
                    ? "bg-white/5 text-gray-400 border border-white/10"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}
              whileHover={{
                rotateY: 15,
                rotateX: 5,
                scale: 1.1,
                z: 50,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
            >
              <i className={`${item.icon} text-lg`}></i>
              {/* 3D Shadow */}
              {active && (
                <motion.div
                  className={`absolute inset-0 rounded-lg ${colors.glow.replace("shadow-", "bg-").replace("/50", "/20")} blur-md -z-10`}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            {/* Label */}
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 min-w-0 text-left relative z-10"
              >
                <div
                  className={`text-sm font-semibold truncate ${
                    active
                      ? colors.text
                      : isDarkMode
                        ? "text-white"
                        : "text-gray-900"
                  }`}
                >
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-[#9ca3af] truncate mt-0.5">
                    {item.description}
                  </div>
                )}
              </motion.div>
            )}

            {/* Badge */}
            {item.badge && sidebarOpen && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text}`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )}

        {/* Children - Expandable */}
        <AnimatePresence>
          {hasChildren && isExpanded && sidebarOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-6 mt-1 space-y-1 overflow-hidden"
            >
              {item.children?.map((child) => {
                const childActive = isActive(child.href);
                const childColors = colorMap[getModuleColor(child)] || colors;

                return (
                  <Link
                    key={child.name}
                    href={child.href || "#"}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      childActive
                        ? `${childColors.bg} ${childColors.text}`
                        : isDarkMode
                          ? "text-gray-500 hover:text-white hover:bg-white/5"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        childActive
                          ? `${childColors.text.replace("text-", "bg-")} scale-125`
                          : "bg-gray-600 opacity-30"
                      }`}
                    />
                    <span className="truncate">{child.name}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.aside
      ref={sidebarRef}
      style={{ width: sidebarWidth }}
      className="fixed left-0 top-0 h-full z-50 pointer-events-none"
    >
      <motion.div
        className={`h-full bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl overflow-hidden flex flex-col pointer-events-auto ${
          isDarkMode ? "" : "bg-white/95 border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <i className="ri-apps-2-line text-white text-lg"></i>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">BlueDXP</div>
                  <div className="text-xs text-[#9ca3af]">Platform</div>
                </div>
              </motion.div>
            )}
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <i
                className={`ri-${sidebarOpen ? "menu-unfold" : "menu-fold"}-line text-cyan-400 text-lg`}
              ></i>
            </motion.button>
          </div>
        </div>

        {/* Navigation Items - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="space-y-1">
            {navStructure.map((item) => renderNavItem(item))}
          </div>
        </div>

        {/* Footer - Intelligent Rotating Insights Widget */}
        <SidebarInsightsWidget 
          sidebarOpen={sidebarOpen} 
          isDarkMode={isDarkMode} 
        />
      </motion.div>
    </motion.aside>
  );
}
