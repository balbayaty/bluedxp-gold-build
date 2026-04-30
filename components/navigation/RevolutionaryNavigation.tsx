/**
 * Revolutionary Navigation System
 * Ultra-minimal, AI-powered, contextual navigation
 * Floating panels, gesture support, adaptive learning
 * 4IR & 5IR Aligned • World-Class UX
 */

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useShowcase } from "@/contexts/ShowcaseContext";
import type { NavItem } from "@/lib/services/navigation/navigationService";
import { globalIntelligentSearchService } from "@/lib/services/search/globalIntelligentSearchService";

interface RevolutionaryNavigationProps {
  navStructure: NavItem[];
  isDarkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  appMode: "logistics" | "hazalyze";
  setAppMode: (mode: "logistics" | "hazalyze") => void;
  user: any;
}

export default function RevolutionaryNavigation({
  navStructure,
  isDarkMode,
  sidebarOpen,
  setSidebarOpen,
  appMode,
  setAppMode,
  user,
}: RevolutionaryNavigationProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [contextualItems, setContextualItems] = useState<NavItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentItems, setRecentItems] = useState<NavItem[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  // Load favorites and recent items
  useEffect(() => {
    const savedFavorites = localStorage.getItem("nav-favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
    const savedRecent = localStorage.getItem("nav-recent");
    if (savedRecent) {
      setRecentItems(JSON.parse(savedRecent).slice(0, 5));
    }
  }, []);

  // Flatten navigation structure - MUST be defined before useEffects that use it
  const flattenedNav = useMemo(() => {
    const flatten = (
      items: NavItem[],
      level = 0,
    ): Array<NavItem & { level: number }> => {
      const result: Array<NavItem & { level: number }> = [];
      items.forEach((item) => {
        if (item.href) {
          result.push({ ...item, level });
        }
        if (item.children) {
          result.push(...flatten(item.children, level + 1));
        }
      });
      return result;
    };
    return flatten(navStructure);
  }, [navStructure]);

  // Get contextual navigation items based on current page
  useEffect(() => {
    const getContextualItems = async () => {
      try {
        // Get related items based on current path
        const currentItem = flattenedNav.find(
          (item) => item.href && pathname?.startsWith(item.href),
        );
        if (currentItem) {
          // Find siblings and related items
          const related = flattenedNav
            .filter((item) => {
              if (!item.href || item.href === currentItem.href) return false;
              // Same parent or similar path
              const currentPath = currentItem.href
                .split("/")
                .slice(0, -1)
                .join("/");
              const itemPath = item.href.split("/").slice(0, -1).join("/");
              return (
                currentPath === itemPath || item.href.startsWith(currentPath)
              );
            })
            .slice(0, 5);
          setContextualItems(related.length > 0 ? related : recentItems);
        } else {
          setContextualItems(recentItems);
        }
      } catch {
        setContextualItems(recentItems);
      }
    };
    getContextualItems();
  }, [pathname, flattenedNav, recentItems]);

  // Showcase sections - shown when on showcase page
  const showcaseSections = useMemo(
    () => [
      {
        id: "hero",
        label: "Hero",
        icon: "ri-home-line",
        color: "cyan",
        href: "/showcase#hero",
      },
      {
        id: "orchestration",
        label: "3D System",
        icon: "ri-stack-line",
        color: "blue",
        href: "/showcase#orchestration",
      },
      {
        id: "metrics",
        label: "Metrics",
        icon: "ri-bar-chart-line",
        color: "purple",
        href: "/showcase#metrics",
      },
      {
        id: "video",
        label: "Videos",
        icon: "ri-video-line",
        color: "pink",
        href: "/showcase#video",
      },
      {
        id: "compliance",
        label: "Compliance",
        icon: "ri-shield-check-line",
        color: "green",
        href: "/showcase#compliance",
      },
      {
        id: "stakeholders",
        label: "Stakeholders",
        icon: "ri-user-line",
        color: "orange",
        href: "/showcase#stakeholders",
      },
      {
        id: "aivision",
        label: "AI Vision",
        icon: "ri-eye-line",
        color: "indigo",
        href: "/showcase#aivision",
      },
      {
        id: "3d",
        label: "3D Warehouse",
        icon: "ri-warehouse-line",
        color: "teal",
        href: "/showcase#3d",
      },
      {
        id: "workflow",
        label: "Workflows",
        icon: "ri-flow-chart",
        color: "rose",
        href: "/showcase#workflow",
      },
      {
        id: "architecture",
        label: "Architecture",
        icon: "ri-node-tree",
        color: "violet",
        href: "/showcase#architecture",
      },
    ],
    [],
  );

  // Get showcase context (safe - returns defaults if not available)
  const showcaseContext = useShowcase();
  const isShowcasePage = pathname === "/showcase";
  const activeShowcaseSection = isShowcasePage
    ? showcaseContext.activeSection
    : null;

  // Get top-level items (main navigation) - always show regular navigation
  const topLevelItems = useMemo(() => {
    return navStructure
      .filter(
        (item) => item.href || (item.children && item.children.length > 0),
      )
      .slice(0, 8); // Limit to 8 main items
  }, [navStructure]);

  // Convert showcase sections to NavItem format for sidebar rendering
  const showcaseNavItems = useMemo(() => {
    if (!isShowcasePage) return [];
    return showcaseSections.map((section) => ({
      name: section.label,
      href: section.href,
      icon: section.icon,
      description: `Navigate to ${section.label} section`,
      color: section.color,
      id: section.id,
      isShowcaseSection: true,
    })) as any[];
  }, [isShowcasePage, showcaseSections]);

  // Create a wrapper for setSidebarOpen that prevents closing on showcase page
  const safeSetSidebarOpen = useCallback(
    (open: boolean) => {
      // On showcase page desktop, prevent closing
      if (isShowcasePage && window.innerWidth >= 1024 && !open) {
        return; // Don't allow closing on showcase desktop
      }
      setSidebarOpen(open);
      // Save to localStorage (desktop only)
      if (window.innerWidth >= 1024) {
        localStorage.setItem("sidebar-open", open.toString());
      }
    },
    [isShowcasePage, setSidebarOpen],
  );

  // Gesture support - swipe to open/close (but respect showcase page)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.touches[0]?.clientX || e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && !sidebarOpen) {
          // Swipe left to open
          safeSetSidebarOpen(true);
        } else if (diff < 0 && sidebarOpen) {
          // Swipe right to close (but not on showcase desktop)
          safeSetSidebarOpen(false);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sidebarOpen, safeSetSidebarOpen]);

  // Auto-expand sidebar on showcase page (desktop only)
  useEffect(() => {
    if (isShowcasePage && window.innerWidth >= 1024) {
      // Force sidebar open on showcase page
      safeSetSidebarOpen(true);
    }
  }, [isShowcasePage, safeSetSidebarOpen]);

  // Scroll to showcase section
  const scrollToShowcaseSection = useCallback(
    (sectionId: string) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 112; // Account for fixed nav height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        // Update context
        if (isShowcasePage && showcaseContext.setActiveSection) {
          showcaseContext.setActiveSection(sectionId);
        }
        // Keep sidebar open on desktop when clicking showcase sections
        if (isShowcasePage && window.innerWidth >= 1024) {
          safeSetSidebarOpen(true);
        }
      }
    },
    [isShowcasePage, showcaseContext, safeSetSidebarOpen],
  );

  // Check if item is active
  const isActive = useCallback(
    (href?: string, itemId?: string) => {
      if (!href) return false;
      // For showcase sections, check if section ID matches active section
      if (isShowcasePage && itemId && activeShowcaseSection) {
        return itemId === activeShowcaseSection;
      }
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    },
    [pathname, isShowcasePage, activeShowcaseSection],
  );

  // Toggle favorite
  const toggleFavorite = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      localStorage.setItem("nav-favorites", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  return (
    <>
      {/* Minimal Icon Bar */}
      <motion.div
        ref={sidebarRef}
        data-sidebar
        initial={false}
        animate={{
          width: sidebarOpen ? "280px" : "72px",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`fixed lg:sticky left-0 top-16 lg:top-0 z-50 ${
          isDarkMode
            ? "bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95"
            : "bg-white/95"
        } backdrop-blur-xl border-r ${
          isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
        } h-[calc(100vh-64px)] lg:h-screen shadow-2xl flex flex-col overflow-hidden`}
        onMouseEnter={() => {
          // Auto-expand on hover if collapsed (desktop only, but always open on showcase)
          if (window.innerWidth >= 1024) {
            if (isShowcasePage) {
              safeSetSidebarOpen(true); // Always ensure open on showcase
            } else if (!sidebarOpen) {
              safeSetSidebarOpen(true); // Auto-expand on other pages
            }
          }
        }}
      >
        {/* Header - App Switcher */}
        <div
          className={`p-3 border-b ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"} flex-shrink-0`}
        >
          <div
            className={`flex ${sidebarOpen ? "gap-2" : "flex-col gap-2"} rounded-xl p-1 ${
              isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
            }`}
          >
            <motion.button
              onClick={() => setAppMode("logistics")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                appMode === "logistics"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : isDarkMode
                    ? "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <i className="ri-truck-line text-base"></i>
              {sidebarOpen && <span>Logistics</span>}
            </motion.button>
            <motion.button
              onClick={() => setAppMode("hazalyze")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                appMode === "hazalyze"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : isDarkMode
                    ? "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <i className="ri-flask-line text-base"></i>
              {sidebarOpen && <span>Hazalyze</span>}
            </motion.button>
          </div>
        </div>

        {/* Main Navigation Icons */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          <div className="space-y-1 px-2">
            {/* Regular Navigation Items - Always visible */}
            {topLevelItems.map((item, index) => {
              const active = isActive(item.href);
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedItem === item.name;
              const isHovered = hoveredItem === item.name;

              return (
                <div key={item.name} className="relative">
                  {/* Main Navigation Item */}
                  <motion.div
                    onHoverStart={() => setHoveredItem(item.name)}
                    onHoverEnd={() => {
                      setHoveredItem(null);
                      if (!isExpanded) {
                        setTimeout(() => setExpandedItem(null), 200);
                      }
                    }}
                    onMouseEnter={() => {
                      if (hasChildren && sidebarOpen) {
                        setExpandedItem(item.name);
                      }
                    }}
                    className="relative"
                  >
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                          active
                            ? isDarkMode
                              ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-white"
                              : "bg-blue-50 text-blue-700"
                            : isDarkMode
                              ? "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {/* Active indicator */}
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                              isDarkMode ? "bg-cyan-400" : "bg-blue-600"
                            }`}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}

                        {/* Hover glow */}
                        {isHovered && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/10 to-blue-500/0"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              repeatDelay: 1,
                            }}
                          />
                        )}

                        <div
                          className={`p-2 rounded-lg flex-shrink-0 ${
                            active
                              ? isDarkMode
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-blue-100 text-blue-600"
                              : isDarkMode
                                ? "bg-gray-800/50 text-gray-400 group-hover:bg-gray-700/50 group-hover:text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                          } transition-all relative z-10`}
                        >
                          <i className={`${item.icon} text-lg`}></i>
                        </div>
                        {sidebarOpen && (
                          <div className="flex-1 min-w-0 relative z-10">
                            <div
                              className={`text-sm font-medium truncate ${
                                active
                                  ? "text-white"
                                  : isDarkMode
                                    ? "text-gray-300"
                                    : "text-gray-700"
                              }`}
                            >
                              {item.name}
                            </div>
                            {item.description && (
                              <div
                                className={`text-xs truncate mt-0.5 ${
                                  active
                                    ? "text-blue-200"
                                    : isDarkMode
                                      ? "text-gray-500"
                                      : "text-gray-500"
                                }`}
                              >
                                {item.description}
                              </div>
                            )}
                          </div>
                        )}
                        {item.badge && sidebarOpen && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                              isDarkMode
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${
                          isDarkMode
                            ? "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isDarkMode ? "bg-gray-800/50" : "bg-gray-100"
                          }`}
                        >
                          <i className={`${item.icon} text-lg`}></i>
                        </div>
                        {sidebarOpen && (
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {item.name}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Floating Sub-Navigation Panel */}
                    {hasChildren && isExpanded && sidebarOpen && (
                      <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 300,
                        }}
                        className={`absolute left-full ml-2 top-0 w-64 rounded-2xl shadow-2xl border-2 ${
                          isDarkMode
                            ? "bg-gray-800/95 border-gray-700/50 backdrop-blur-xl"
                            : "bg-white/95 border-gray-200/50 backdrop-blur-xl"
                        } p-2 z-[100]`}
                        onMouseEnter={() => setExpandedItem(item.name)}
                        onMouseLeave={() => setExpandedItem(null)}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl pointer-events-none" />

                        <div className="relative z-10">
                          <div
                            className={`px-3 py-2 mb-2 border-b ${
                              isDarkMode ? "border-gray-700" : "border-gray-200"
                            }`}
                          >
                            <div className="text-sm font-semibold text-white">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                            {item.children?.map((child, childIndex) => {
                              const childActive = isActive(child.href);
                              return (
                                <Link
                                  key={child.href || childIndex}
                                  href={child.href || "#"}
                                  onClick={() => setExpandedItem(null)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                                    childActive
                                      ? isDarkMode
                                        ? "bg-blue-600/30 text-white"
                                        : "bg-blue-50 text-blue-700"
                                      : isDarkMode
                                        ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                  }`}
                                >
                                  <i className={`${child.icon} text-base`}></i>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {child.name}
                                    </div>
                                    {child.description && (
                                      <div className="text-xs text-gray-500 truncate mt-0.5">
                                        {child.description}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contextual Suggestions / Recent Items */}
        {sidebarOpen &&
          (contextualItems.length > 0 || recentItems.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 border-t ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"} flex-shrink-0`}
            >
              <div
                className={`text-xs font-semibold mb-2 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {contextualItems.length > 0 ? "CONTEXTUAL" : "RECENT"}
              </div>
              <div className="space-y-1">
                {(contextualItems.length > 0 ? contextualItems : recentItems)
                  .slice(0, 3)
                  .map((item, index) => (
                    <Link
                      key={item.href || index}
                      href={item.href || "#"}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isDarkMode
                          ? "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <i className={`${item.icon} text-sm`}></i>
                      <span className="truncate flex-1">{item.name}</span>
                    </Link>
                  ))}
              </div>
            </motion.div>
          )}

        {/* Toggle Button - Hide on showcase page since we want it always open */}
        {!isShowcasePage && (
          <div
            className={`p-3 border-t ${isDarkMode ? "border-gray-700/50" : "border-gray-200/50"} flex-shrink-0`}
          >
            <motion.button
              onClick={() => {
                const newState = !sidebarOpen;
                safeSetSidebarOpen(newState);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl ${
                isDarkMode
                  ? "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              } transition-all`}
            >
              <i
                className={`ri-${sidebarOpen ? "arrow-left" : "arrow-right"}-s-line text-lg`}
              ></i>
              {sidebarOpen && (
                <span className="text-sm font-medium">Collapse</span>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Overlay for mobile - Don't close on showcase page when clicking buttons */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            // Only close on mobile, and not if clicking showcase buttons
            const target = e.target as HTMLElement;
            if (
              window.innerWidth < 1024 &&
              !target.closest("[data-showcase-button]")
            ) {
              safeSetSidebarOpen(false);
            }
          }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
    </>
  );
}
