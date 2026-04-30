/**
 * NeuralSidebar Component
 *
 * A futuristic, world-class navigation experience for BlueDXP.
 * Detached floating architecture, advanced glassmorphism,
 * and AI-centric design patterns.
 *
 * 4IR & 5IR Aligned • Human-Centric • Neural UX
 */

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useShowcase } from "@/contexts/ShowcaseContext";
import type { NavItem } from "@/lib/services/navigation/navigationService";
import { JobStatusWidget } from "@/components/jobs/JobStatusWidget";
import { NeuralIcon } from "./NeuralIcon";

interface NeuralSidebarProps {
  navStructure: NavItem[];
  isDarkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  appMode: "logistics" | "hazalyze";
  setAppMode: (mode: "logistics" | "hazalyze") => void;
  user: any;
}

export default function NeuralSidebar({
  navStructure,
  isDarkMode,
  sidebarOpen,
  setSidebarOpen,
  appMode,
  setAppMode,
  user,
}: NeuralSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Spring animations for smooth transitions
  const sidebarWidth = useSpring(sidebarOpen ? 280 : 88, {
    stiffness: 300,
    damping: 30,
  });

  useEffect(() => {
    sidebarWidth.set(sidebarOpen ? 280 : 88);
  }, [sidebarOpen, sidebarWidth]);

  // Get active item
  const isActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    },
    [pathname],
  );

  // Get top-level items
  const mainItems = useMemo(() => {
    return navStructure
      .filter(
        (item) => item.href || (item.children && item.children.length > 0),
      )
      .slice(0, 15);
  }, [navStructure]);

  return (
    <motion.aside
      ref={sidebarRef}
      onMouseEnter={() => setIsHoveringSidebar(true)}
      onMouseLeave={() => {
        setIsHoveringSidebar(false);
        setExpandedItem(null);
      }}
      className={`fixed left-4 top-24 bottom-6 z-[100] flex flex-col gap-4 pointer-events-none transition-all duration-500 ${
        sidebarOpen
          ? "translate-x-0 opacity-100"
          : "lg:translate-x-0 -translate-x-[120%] lg:opacity-100 opacity-0"
      }`}
      initial={false}
      style={{ width: sidebarWidth }}
    >
      {/* Neural Core Hub - Top Section */}
      <motion.div
        className={`pointer-events-auto relative overflow-hidden rounded-[2.5rem] border transition-all duration-500 flex flex-col ${
          isDarkMode
            ? "bg-gray-900/40 backdrop-blur-3xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            : "bg-white/60 backdrop-blur-2xl border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        } ${sidebarOpen ? "p-5" : "p-3"} flex-shrink-0`}
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className={`relative flex-shrink-0 w-14 h-14 rounded-[1.5rem] flex items-center justify-center overflow-hidden border-2 ${
              appMode === "hazalyze"
                ? "bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-600 border-blue-400/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)] opacity-50" />
            <i className="ri-user-smile-line text-white text-3xl drop-shadow-lg relative z-10"></i>
            {/* Pulsing Status Orb */}
            <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-[0_0_10px_rgba(74,222,128,0.5)] z-20">
              <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
            </div>
          </motion.div>

          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <div
                  className={`text-sm font-bold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {user?.name || "Neural Pilot"}
                </div>
                <div
                  className={`text-[10px] font-medium tracking-widest uppercase opacity-50 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {user?.role || "Administrator"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Neural Commands Section (Search-like) */}
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 relative group"
          >
            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div
              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all overflow-hidden ${
                isDarkMode
                  ? "bg-black/40 border-white/10 hover:border-blue-500/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                  : "bg-gray-100/80 border-gray-200 hover:border-blue-300"
              }`}
            >
              {/* Scanline animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full"
                animate={{ translateX: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <i className="ri-command-line text-blue-400 relative z-10"></i>
              <span className="text-xs text-gray-400 font-medium relative z-10">
                Neural Command...
              </span>
              <kbd
                className={`ml-auto px-2 py-0.5 rounded-md text-[9px] font-bold relative z-10 ${isDarkMode ? "bg-white/10 text-gray-400 border border-white/5" : "bg-white text-gray-400 shadow-sm border border-gray-200"}`}
              >
                ⌘K
              </kbd>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Neural Nexus - Main Navigation */}
      <motion.div
        className={`pointer-events-auto flex-1 overflow-hidden rounded-[2.5rem] border transition-all duration-500 flex flex-col ${
          isDarkMode
            ? "bg-gray-900/40 backdrop-blur-3xl border-white/10"
            : "bg-white/60 backdrop-blur-2xl border-gray-200/50"
        } ${sidebarOpen ? "p-4" : "p-3"}`}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="space-y-2">
            {mainItems.map((item, index) => {
              const active = isActive(item.href);
              const isHovered = hoveredItem === item.name;
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItem === item.name;

              return (
                <div key={item.name} className="relative group/nav">
                  <motion.div
                    onHoverStart={() => setHoveredItem(item.name)}
                    onHoverEnd={() => setHoveredItem(null)}
                    onClick={() => {
                      if (hasChildren)
                        setExpandedItem(isExpanded ? null : item.name);
                    }}
                    className="relative"
                    whileHover={{ scale: 1.02, x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Link
                      href={item.href || "#"}
                      className={`flex items-center ${sidebarOpen ? "gap-4 px-4 py-3.5" : "justify-center p-3.5"} rounded-[2rem] transition-all duration-500 relative overflow-hidden group/link ${
                        active
                          ? isDarkMode
                            ? "bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent text-white border border-white/10"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                          : isDarkMode
                            ? "text-gray-400 hover:bg-white/5 hover:text-white"
                            : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600"
                      }`}
                    >
                      {/* Active Background Glow */}
                      {active && (
                        <motion.div
                          layoutId="activeGlow"
                          className="absolute inset-0 bg-blue-500/5 blur-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}

                      {/* Futuristic Neural Icon */}
                      <NeuralIcon
                        icon={item.icon || "ri-checkbox-blank-circle-line"}
                        active={active}
                        isDarkMode={isDarkMode}
                        color={
                          active
                            ? appMode === "hazalyze"
                              ? "emerald"
                              : "blue"
                            : "cyan"
                        }
                        className="group-hover/link:scale-110 group-hover/link:rotate-3 transition-transform duration-500"
                      />

                      {/* Label & Description */}
                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex-1 min-w-0 relative z-10"
                          >
                            <div className="text-sm font-bold tracking-tight">
                              {item.name}
                            </div>
                            {item.description && (
                              <div
                                className={`text-[10px] truncate opacity-50 font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {item.description}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Children Indicator */}
                      {hasChildren && sidebarOpen && (
                        <motion.i
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          className="ri-arrow-right-s-line opacity-30 text-xs"
                        />
                      )}
                    </Link>

                    {/* Nested Items */}
                    <AnimatePresence>
                      {isExpanded && sidebarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mt-1 space-y-1 overflow-hidden"
                        >
                          {item.children?.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href || "#"}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                                isActive(child.href)
                                  ? isDarkMode
                                    ? "bg-blue-500/10 text-blue-400"
                                    : "bg-blue-50 text-blue-700"
                                  : isDarkMode
                                    ? "text-gray-500 hover:text-white hover:bg-white/5"
                                    : "text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                              }`}
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${isActive(child.href) ? "bg-blue-400 scale-125" : "bg-gray-600 opacity-30"}`}
                              />
                              {child.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Quick Access - Enterprise Features */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="text-[10px] font-bold tracking-widest uppercase opacity-40 mb-3 px-2">
                Quick Access
              </div>
              <div className="space-y-1">
                <Link
                  href="/settings/security"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                    pathname?.startsWith("/settings/security")
                      ? isDarkMode
                        ? "bg-green-500/10 text-green-400"
                        : "bg-green-50 text-green-700"
                      : isDarkMode
                        ? "text-gray-500 hover:text-white hover:bg-white/5"
                        : "text-gray-500 hover:text-green-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-shield-keyhole-line text-green-400"></i>
                  Security Settings
                  <span className="ml-auto px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px]">NEW</span>
                </Link>
                <Link
                  href="/settings/users"
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                    pathname?.startsWith("/settings/users")
                      ? isDarkMode
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-cyan-50 text-cyan-700"
                      : isDarkMode
                        ? "text-gray-500 hover:text-white hover:bg-white/5"
                        : "text-gray-500 hover:text-cyan-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-user-settings-line text-cyan-400"></i>
                  User Management
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* System Vitals & Mode Switcher - Bottom Section */}
      <motion.div
        className={`pointer-events-auto overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
          isDarkMode
            ? "bg-gray-900/40 backdrop-blur-3xl border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            : "bg-white/60 backdrop-blur-2xl border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
        } ${sidebarOpen ? "p-5" : "p-3"} flex-shrink-0`}
      >
        {/* Mode Switcher */}
        <div
          className={`flex items-center gap-2 p-1.5 rounded-[2rem] ${isDarkMode ? "bg-black/40 border border-white/5" : "bg-gray-100 border border-gray-200"}`}
        >
          <button
            onClick={() => setAppMode("logistics")}
            className={`flex-1 relative group/mode flex items-center justify-center py-3 rounded-[1.5rem] transition-all duration-500 ${
              appMode === "logistics"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-500 hover:text-blue-400 hover:bg-white/5"
            }`}
            title="Logistics Mode"
          >
            <motion.i
              animate={
                appMode === "logistics"
                  ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                  : {}
              }
              className="ri-truck-line text-xl relative z-10"
            ></motion.i>
            {appMode === "logistics" && (
              <motion.div
                layoutId="modeActive"
                className="absolute inset-0 rounded-[1.5rem] bg-white/20 blur-sm"
              />
            )}
          </button>
          <button
            onClick={() => setAppMode("hazalyze")}
            className={`flex-1 relative group/mode flex items-center justify-center py-3 rounded-[1.5rem] transition-all duration-500 ${
              appMode === "hazalyze"
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                : "text-gray-500 hover:text-emerald-400 hover:bg-white/5"
            }`}
            title="Hazalyze Mode"
          >
            <motion.i
              animate={
                appMode === "hazalyze"
                  ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
                  : {}
              }
              className="ri-flask-line text-xl relative z-10"
            ></motion.i>
            {appMode === "hazalyze" && (
              <motion.div
                layoutId="modeActive"
                className="absolute inset-0 rounded-[1.5rem] bg-white/20 blur-sm"
              />
            )}
          </button>
        </div>

        {/* Collapsed Sidebar Toggle (Floating Pill) */}
        <div className="mt-4 flex items-center justify-center">
          <motion.button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            whileHover={{
              scale: 1.1,
              backgroundColor: isDarkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            }}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isDarkMode
                ? "bg-white/5 text-gray-400"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            <i
              className={`ri-arrow-${sidebarOpen ? "left" : "right"}-s-line text-xl`}
            ></i>
          </motion.button>
        </div>

        {/* System Health Pulse */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase opacity-40">
                <span>System Integrity</span>
                <span className="text-green-400">99.8%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "99.8%" }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                />
              </div>

              <JobStatusWidget />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)"};
          border-radius: 10px;
        }
      `}</style>
    </motion.aside>
  );
}
