/**
 * Floating 3D Navigation Widget for Showcase
 * Beautiful, interactive, toggleable navigation widget
 * 3D perspective effects • Color-coded sections • Smooth animations
 * 4IR & 5IR Aligned • World-Class UX
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShowcase } from "@/contexts/ShowcaseContext";

interface FloatingNavigationProps {
  isDarkMode: boolean;
  sidebarOpen: boolean;
}

const showcaseSections = [
  { id: "hero", label: "Hero", icon: "ri-home-line", color: "cyan" },
  {
    id: "orchestration",
    label: "3D System",
    icon: "ri-stack-line",
    color: "blue",
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: "ri-bar-chart-line",
    color: "purple",
  },
  { id: "video", label: "Videos", icon: "ri-video-line", color: "pink" },
  {
    id: "compliance",
    label: "Compliance",
    icon: "ri-shield-check-line",
    color: "green",
  },
  {
    id: "stakeholders",
    label: "Stakeholders",
    icon: "ri-user-line",
    color: "orange",
  },
  { id: "aivision", label: "AI Vision", icon: "ri-eye-line", color: "indigo" },
  { id: "3d", label: "3D Warehouse", icon: "ri-warehouse-line", color: "teal" },
  { id: "workflow", label: "Workflows", icon: "ri-flow-chart", color: "rose" },
  {
    id: "architecture",
    label: "Architecture",
    icon: "ri-node-tree",
    color: "violet",
  },
];

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
  green: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    icon: "text-green-400",
    glow: "shadow-green-500/50",
    border: "border-green-400/50",
    indicator: "bg-green-400",
  },
  orange: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    icon: "text-orange-400",
    glow: "shadow-orange-500/50",
    border: "border-orange-400/50",
    indicator: "bg-orange-400",
  },
  indigo: {
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    icon: "text-indigo-400",
    glow: "shadow-indigo-500/50",
    border: "border-indigo-400/50",
    indicator: "bg-indigo-400",
  },
  teal: {
    bg: "bg-teal-500/20",
    text: "text-teal-400",
    icon: "text-teal-400",
    glow: "shadow-teal-500/50",
    border: "border-teal-400/50",
    indicator: "bg-teal-400",
  },
  rose: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    icon: "text-rose-400",
    glow: "shadow-rose-500/50",
    border: "border-rose-400/50",
    indicator: "bg-rose-400",
  },
  violet: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    icon: "text-violet-400",
    glow: "shadow-violet-500/50",
    border: "border-violet-400/50",
    indicator: "bg-violet-400",
  },
};

export default function FloatingNavigation({
  isDarkMode,
  sidebarOpen,
}: FloatingNavigationProps) {
  const { activeSection, setActiveSection } = useShowcase();
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      const sections = showcaseSections.map((s) => s.id);

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [setActiveSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 112;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(sectionId);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 ${isExpanded ? "px-2" : "px-1"}`}
    >
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 transition-all ${
          isDarkMode
            ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40"
            : "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 hover:border-blue-300"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${isDarkMode ? "bg-cyan-500/20" : "bg-blue-100"}`}
          >
            <i
              className={`ri-compass-3-line text-sm ${isDarkMode ? "text-cyan-400" : "text-blue-600"}`}
            ></i>
          </div>
          {isExpanded && (
            <div>
              <div
                className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-cyan-300" : "text-blue-700"}`}
              >
                Showcase Navigation
              </div>
              <div
                className={`text-[10px] ${isDarkMode ? "text-cyan-400/70" : "text-blue-600/70"}`}
              >
                {showcaseSections.length} Sections
              </div>
            </div>
          )}
        </div>
        <motion.i
          className={`ri-arrow-${isExpanded ? "up" : "down"}-s-line text-lg ${
            isDarkMode ? "text-cyan-400" : "text-blue-600"
          }`}
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
            className="space-y-1.5 overflow-hidden"
          >
            {showcaseSections.map((section, index) => {
              const active = activeSection === section.id;
              const isHovered = hoveredItem === section.id;
              const colors = colorMap[section.color] || colorMap.cyan;

              return (
                <motion.button
                  key={section.id}
                  data-showcase-button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollToSection(section.id);
                  }}
                  onHoverStart={() => setHoveredItem(section.id)}
                  onHoverEnd={() => setHoveredItem(null)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group overflow-hidden border-2 ${
                    active && colors
                      ? `${colors.bg} ${colors.text} ${colors.border} shadow-lg ${colors.glow}`
                      : isDarkMode
                        ? "bg-gray-800/30 text-gray-400 border-gray-700/30 hover:bg-gray-700/50 hover:text-white hover:border-gray-600/50"
                        : "bg-gray-100/50 text-gray-500 border-gray-200/30 hover:bg-gray-200/70 hover:text-gray-700 hover:border-gray-300/50"
                  }`}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {/* Active indicator */}
                  {active && colors && (
                    <motion.div
                      layoutId={`activeFloatingNav-${section.id}`}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${colors.indicator}`}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Active glow effect */}
                  {active && colors && (
                    <motion.div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${colors.glow.replace("shadow-", "from-").replace("/50", "/10")} to-transparent blur-xl`}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* 3D Icon with perspective */}
                  <motion.div
                    className={`p-2 rounded-lg flex-shrink-0 transition-all relative z-10 ${
                      active && colors
                        ? `${colors.bg} ${colors.icon} border ${colors.border}`
                        : isDarkMode
                          ? "bg-gray-800/50 text-gray-400 border border-gray-700/30 group-hover:bg-gray-700/50 group-hover:text-white group-hover:border-gray-600/50"
                          : "bg-gray-100 text-gray-500 border border-gray-200/30 group-hover:bg-gray-200 group-hover:text-gray-700 group-hover:border-gray-300/50"
                    }`}
                    whileHover={{ rotateY: 15, rotateX: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{ perspective: "1000px" }}
                  >
                    <i className={`${section.icon} text-lg`}></i>
                  </motion.div>

                  {/* Label */}
                  <div className="flex-1 min-w-0 relative z-10 text-left">
                    <div
                      className={`text-sm font-semibold truncate ${
                        active && colors
                          ? colors.text
                          : active
                            ? "text-white"
                            : isDarkMode
                              ? "text-gray-300"
                              : "text-gray-700"
                      }`}
                    >
                      {section.label}
                    </div>
                  </div>

                  {/* Active checkmark */}
                  {active && (
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
    </motion.div>
  );
}
