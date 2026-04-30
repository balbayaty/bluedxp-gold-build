/**
 * Showcase Navigation Tabs
 * Beautiful, contextual navigation tabs for showcase page
 * Matches revolutionary navigation design
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useShowcase } from "@/contexts/ShowcaseContext";

interface ShowcaseNavigationTabsProps {
  isDarkMode: boolean;
}

export default function ShowcaseNavigationTabs({
  isDarkMode,
}: ShowcaseNavigationTabsProps) {
  const pathname = usePathname();
  const { activeSection, setActiveSection } = useShowcase();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const showcaseTabs = [
    { id: "hero", label: "Hero", icon: "ri-home-line", href: "/showcase#hero" },
    {
      id: "orchestration",
      label: "3D System",
      icon: "ri-stack-line",
      href: "/showcase#orchestration",
    },
    {
      id: "metrics",
      label: "Metrics",
      icon: "ri-bar-chart-line",
      href: "/showcase#metrics",
    },
    {
      id: "video",
      label: "Videos",
      icon: "ri-video-line",
      href: "/showcase#video",
    },
    {
      id: "compliance",
      label: "Compliance",
      icon: "ri-shield-check-line",
      href: "/showcase#compliance",
    },
    {
      id: "stakeholders",
      label: "Stakeholders",
      icon: "ri-user-line",
      href: "/showcase#stakeholders",
    },
    {
      id: "aivision",
      label: "AI Vision",
      icon: "ri-eye-line",
      href: "/showcase#aivision",
    },
    {
      id: "3d",
      label: "3D Warehouse",
      icon: "ri-warehouse-line",
      href: "/showcase#3d",
    },
    {
      id: "workflow",
      label: "Workflows",
      icon: "ri-flow-chart",
      href: "/showcase#workflow",
    },
    {
      id: "architecture",
      label: "Architecture",
      icon: "ri-node-tree",
      href: "/showcase#architecture",
    },
  ];

  // Scroll spy for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = showcaseTabs.map((tab) => tab.id);
      const scrollPosition = window.scrollY + 200;

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
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setActiveSection, showcaseTabs, activeSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 112; // Account for fixed nav height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (pathname !== "/showcase") return null;

  return (
    <div
      className={`flex items-center gap-1 overflow-x-auto custom-scrollbar flex-1 min-w-0 px-2`}
    >
      {showcaseTabs.map((tab) => {
        const active = activeSection === tab.id;
        const isHovered = hoveredTab === tab.id;

        return (
          <motion.div
            key={tab.id}
            onHoverStart={() => setHoveredTab(tab.id)}
            onHoverEnd={() => setHoveredTab(null)}
            className="relative flex-shrink-0"
          >
            <motion.button
              onClick={() => scrollToSection(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all relative group ${
                active
                  ? isDarkMode
                    ? "text-cyan-400"
                    : "text-blue-600"
                  : isDarkMode
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="activeShowcaseTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                    isDarkMode ? "bg-cyan-400" : "bg-blue-600"
                  }`}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Hover glow */}
              {isHovered && !active && (
                <motion.div
                  className={`absolute inset-0 rounded-lg ${
                    isDarkMode ? "bg-gray-800/50" : "bg-gray-100/50"
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}

              <i
                className={`${tab.icon} text-base flex-shrink-0 relative z-10`}
              ></i>
              <span className="hidden sm:inline whitespace-nowrap relative z-10">
                {tab.label}
              </span>
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
