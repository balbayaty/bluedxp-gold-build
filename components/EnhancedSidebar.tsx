"use client";

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleId, FeatureId } from "@/types/user";
import { JobStatusWidget } from "@/components/jobs/JobStatusWidget";

interface NavItem {
  name: string;
  href?: string;
  icon: string;
  description?: string;
  badge?: string | number;
  comingSoon?: boolean;
  children?: NavItem[];
  moduleId?: ModuleId;
  featureId?: FeatureId;
  requiredAccess?: "full" | "partial" | "read_only";
}

interface EnhancedSidebarProps {
  navStructure: NavItem[];
  isDarkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  expandedMenus: Set<string>;
  setExpandedMenus: (
    menus: Set<string> | ((prev: Set<string>) => Set<string>),
  ) => void;
  filteredNavStructure: NavItem[];
  appMode: "logistics" | "hazalyze";
  setAppMode: (mode: "logistics" | "hazalyze") => void;
}

const EnhancedSidebar = memo(function EnhancedSidebar({
  navStructure,
  isDarkMode,
  sidebarOpen,
  setSidebarOpen,
  expandedMenus,
  setExpandedMenus,
  filteredNavStructure,
  appMode,
  setAppMode,
}: EnhancedSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(true); // Full width expansion
  const [isWideMode, setIsWideMode] = useState(false); // Extra wide mode
  const [recentItems, setRecentItems] = useState<NavItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("nav-favorites");
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    const savedRecent = localStorage.getItem("nav-recent");
    if (savedRecent) {
      setRecentItems(JSON.parse(savedRecent));
    }
  }, []);

  // Track recent items - DEBOUNCED to avoid blocking navigation
  useEffect(() => {
    const currentItem = findNavItemByPath(filteredNavStructure, pathname);
    if (currentItem && currentItem.href) {
      // Update state immediately for UI responsiveness (non-blocking)
      setRecentItems((prev) => {
        const filtered = prev.filter((item) => item.href !== currentItem.href);
        const updated = [currentItem, ...filtered].slice(0, 5);

        // Defer localStorage write to avoid blocking navigation
        // Use requestIdleCallback for better performance
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => {
            try {
              localStorage.setItem("nav-recent", JSON.stringify(updated));
            } catch (e) {
              // Ignore storage errors
            }
          });
        } else {
          setTimeout(() => {
            try {
              localStorage.setItem("nav-recent", JSON.stringify(updated));
            } catch (e) {
              // Ignore storage errors
            }
          }, 0);
        }

        return updated;
      });
    }
  }, [pathname, filteredNavStructure]); // findNavItemByPath is stable (useCallback with empty deps)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to close search
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  // IMPROVED: Enhanced fuzzy search with scoring
  const calculateSearchScore = useCallback(
    (text: string, query: string): number => {
      const lowerText = text.toLowerCase().trim();
      const lowerQuery = query.toLowerCase().trim();

      if (!lowerQuery) return 0;

      // Exact match - highest score
      if (lowerText === lowerQuery) return 100;

      // Starts with query - very high score
      if (lowerText.startsWith(lowerQuery)) return 90;

      // Contains query as whole word - high score
      const words = lowerText.split(/\s+/);
      if (words.some((word) => word.startsWith(lowerQuery))) return 80;

      // Contains query anywhere - medium score
      if (lowerText.includes(lowerQuery)) return 70;

      // Fuzzy match (characters in order) - lower score
      let textIndex = 0;
      let matchCount = 0;
      for (let i = 0; i < lowerQuery.length; i++) {
        const char = lowerQuery[i];
        const foundIndex = lowerText.indexOf(char, textIndex);
        if (foundIndex === -1) return 0;
        textIndex = foundIndex + 1;
        matchCount++;
      }

      // Calculate score based on how close characters are
      const proximity = textIndex - matchCount;
      return Math.max(30, 60 - proximity * 5);
    },
    [],
  );

  // IMPROVED: Flatten with parent context
  const flattenNavItemsWithContext = useCallback(
    (
      items: NavItem[],
      parentPath: string[] = [],
    ): Array<NavItem & { parentPath: string[] }> => {
      const result: Array<NavItem & { parentPath: string[] }> = [];
      items.forEach((item) => {
        if (item.href) {
          result.push({ ...item, parentPath });
        }
        if (item.children) {
          const newParentPath = item.href
            ? [...parentPath, item.name]
            : parentPath;
          result.push(
            ...flattenNavItemsWithContext(item.children, newParentPath),
          );
        }
      });
      return result;
    },
    [],
  );

  // OPTIMIZED: Memoized find function
  const findNavItemByPath = useCallback(
    (items: NavItem[], path: string): NavItem | null => {
      for (const item of items) {
        if (item.href === path) return item;
        if (item.children) {
          const found = findNavItemByPath(item.children, path);
          if (found) return found;
        }
      }
      return null;
    },
    [],
  );

  // IMPROVED: Enhanced search results with scoring and highlighting
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.trim();
    const allItems = flattenNavItemsWithContext(filteredNavStructure);

    // Calculate scores for all items
    const scoredItems = allItems.map((item) => {
      const nameScore = calculateSearchScore(item.name, query);
      const descScore = item.description
        ? calculateSearchScore(item.description, query)
        : 0;
      const hrefScore = item.href ? calculateSearchScore(item.href, query) : 0;
      const parentScore =
        item.parentPath.length > 0
          ? item.parentPath.reduce(
              (sum, parent) => sum + calculateSearchScore(parent, query),
              0,
            ) / item.parentPath.length
          : 0;

      // Weighted score: name is most important, then description, then href, then parent
      const totalScore =
        nameScore * 0.5 + descScore * 0.3 + hrefScore * 0.1 + parentScore * 0.1;

      return {
        item,
        score: totalScore,
        matchType:
          nameScore > 0 ? "name" : descScore > 0 ? "description" : "other",
      };
    });

    // Filter items with score > 0 and sort by score
    return scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // Increased limit for better results
      .map(({ item }) => item);
  }, [
    searchQuery,
    filteredNavStructure,
    flattenNavItemsWithContext,
    calculateSearchScore,
  ]);

  // OPTIMIZED: Memoized toggle functions
  const toggleMenu = useCallback((menuName: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuName)) {
        newSet.delete(menuName);
      } else {
        newSet.add(menuName);
      }
      return newSet;
    });
  }, []);

  const toggleFavorite = useCallback((item: NavItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.href) return;

    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item.href!)) {
        newSet.delete(item.href!);
      } else {
        newSet.add(item.href!);
      }
      localStorage.setItem("nav-favorites", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  // OPTIMIZED: Memoized check functions
  const isActive = useCallback((href: string) => pathname === href, [pathname]);
  const isMenuExpanded = useCallback(
    (name: string) => expandedMenus.has(name),
    [expandedMenus],
  );

  const hasActiveChild = useCallback(
    (item: NavItem): boolean => {
      if (item.href && isActive(item.href)) return true;
      if (item.children) {
        return item.children.some((child) => hasActiveChild(child));
      }
      return false;
    },
    [isActive],
  );

  // Render nav item
  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.name);
    const active = item.href ? isActive(item.href) : false;
    const hasActive = hasActiveChild(item);
    const isFavorite = item.href ? favorites.has(item.href) : false;
    const indent = level * 20;

    return (
      <div key={item.name} className="mb-1">
        {hasChildren ? (
          <>
            <motion.button
              onClick={() => toggleMenu(item.name)}
              onHoverStart={() => setHoveredItem(item.name)}
              onHoverEnd={() => setHoveredItem(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                hasActive
                  ? `${isDarkMode ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-white" : "bg-blue-50 text-blue-700"} border-l-4 border-blue-500`
                  : `${isDarkMode ? "text-[#9ca3af] hover:bg-[#374151]/50 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
              }`}
              style={{ paddingLeft: `${16 + indent}px` }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/10 to-blue-500/0"
                initial={{ x: "-100%" }}
                animate={{ x: hoveredItem === item.name ? "100%" : "-100%" }}
                transition={{ duration: 0.6 }}
              />

              <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                <motion.div
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <i
                    className={`${item.icon} text-lg flex-shrink-0 ${hasActive ? "text-blue-400" : isDarkMode ? "text-[#6b7280] group-hover:text-white" : "text-gray-400 group-hover:text-gray-700"}`}
                  ></i>
                </motion.div>
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={`text-sm font-semibold truncate ${hasActive ? (isDarkMode ? "text-white" : "text-blue-700") : isDarkMode ? "text-[#9ca3af] group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`}
                  >
                    {item.name}
                  </div>
                  {item.description && (
                    <div
                      className={`text-xs mt-0.5 truncate ${hasActive ? (isDarkMode ? "text-blue-200" : "text-blue-500") : isDarkMode ? "text-[#6b7280] group-hover:text-[#9ca3af]" : "text-gray-400 group-hover:text-gray-500"}`}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full flex-shrink-0 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <motion.i
                className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-sm transition-transform flex-shrink-0 ml-2 relative z-10 ${
                  hasActive
                    ? "text-blue-300"
                    : isDarkMode
                      ? "text-[#6b7280] group-hover:text-white"
                      : "text-gray-400 group-hover:text-gray-700"
                }`}
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              ></motion.i>
            </motion.button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 pt-1 space-y-1">
                    {item.children?.map((child) =>
                      renderNavItem(child, level + 1),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <Link
            href={item.href || "#"}
            prefetch={true}
            onMouseEnter={() => setHoveredItem(item.href || "")}
            onMouseLeave={() => setHoveredItem(null)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
              active
                ? `${isDarkMode ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white" : "bg-blue-600 text-white"} shadow-lg shadow-blue-500/30`
                : `${isDarkMode ? "text-[#9ca3af] hover:bg-[#374151]/50 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
            }`}
            style={{ paddingLeft: `${16 + indent}px` }}
          >
            {/* Active indicator */}
            {active && (
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            {/* Hover glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/10 to-blue-500/0"
              initial={{ x: "-100%" }}
              animate={{ x: hoveredItem === item.href ? "100%" : "-100%" }}
              transition={{ duration: 0.6 }}
            />

            <i
              className={`${item.icon} text-lg flex-shrink-0 relative z-10 ${active ? "text-white" : isDarkMode ? "text-[#6b7280] group-hover:text-white" : "text-gray-400 group-hover:text-gray-700"}`}
            ></i>
            <div className="flex-1 min-w-0 relative z-10">
              <div
                className={`text-sm font-medium truncate ${active ? "text-white" : isDarkMode ? "text-[#9ca3af] group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`}
              >
                {item.name}
              </div>
              {item.description && (
                <div
                  className={`text-xs mt-0.5 truncate ${active ? "text-blue-100" : isDarkMode ? "text-[#6b7280] group-hover:text-[#9ca3af]" : "text-gray-400 group-hover:text-gray-500"}`}
                >
                  {item.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 relative z-10">
              {item.href && (
                <button
                  onClick={(e) => toggleFavorite(item, e)}
                  className={`p-1 rounded-lg transition-colors ${
                    isFavorite
                      ? "text-yellow-400 hover:text-yellow-300"
                      : isDarkMode
                        ? "text-[#6b7280] hover:text-yellow-400 opacity-0 group-hover:opacity-100"
                        : "text-gray-400 hover:text-yellow-500 opacity-0 group-hover:opacity-100"
                  }`}
                  title={
                    isFavorite ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <i
                    className={`ri-star-${isFavorite ? "fill" : "line"} text-sm`}
                  ></i>
                </button>
              )}
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                    active ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        )}
      </div>
    );
  };

  // OPTIMIZED: Get favorite items with memoized function
  const favoriteItems = useMemo(() => {
    const allItems = flattenNavItemsWithContext(filteredNavStructure);
    return allItems.filter((item) => item.href && favorites.has(item.href));
  }, [favorites, filteredNavStructure, flattenNavItemsWithContext]);

  return (
    <motion.aside
      initial={{ x: -320, opacity: 0 }}
      animate={{
        x: sidebarOpen ? 0 : isWideMode ? -480 : -320,
        opacity: sidebarOpen ? 1 : 0,
        width: sidebarOpen
          ? isWideMode
            ? "480px"
            : isExpanded
              ? "320px"
              : "280px"
          : "0px",
      }}
      exit={{ x: isWideMode ? -480 : -320, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`fixed lg:sticky left-0 top-16 lg:top-0 z-50 ${
        isDarkMode
          ? "bg-gradient-to-b from-[#1f2937] via-[#1a1f2e] to-[#111827] border-[#374151]"
          : "bg-white border-gray-200"
      } border-r flex flex-col h-[calc(100vh-64px)] lg:h-[100vh] shadow-2xl`}
      style={{
        width: sidebarOpen
          ? isWideMode
            ? "480px"
            : isExpanded
              ? "320px"
              : "280px"
          : "0px",
      }}
    >
      {/* Sidebar Header with Search */}
      <div
        className={`p-4 border-b ${isDarkMode ? "border-[#374151]" : "border-gray-200"} flex-shrink-0 space-y-3 bg-gradient-to-r from-cyan-500/10 to-blue-600/10`}
      >
        {/* App Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-2">
          <button
            onClick={() => setAppMode("logistics")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === "logistics"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="ri-truck-line"></i>
            Logistics
          </button>
          <button
            onClick={() => setAppMode("hazalyze")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              appMode === "hazalyze"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <i className="ri-flask-line"></i>
            Hazalyze
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${
                appMode === "hazalyze"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30"
                  : "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30"
              }`}
            >
              <i className="ri-user-line text-white text-base"></i>
            </motion.div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-sm font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {user?.name || "System User"}
              </div>
              <div
                className={`text-xs truncate ${isDarkMode ? "text-[#6b7280]" : "text-gray-500"}`}
              >
                {user?.role || "ADMIN"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => setIsWideMode(!isWideMode)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`${isDarkMode ? "text-[#9ca3af] hover:text-white hover:bg-[#374151]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
              title={isWideMode ? "Normal Width" : "Wide Mode"}
            >
              <i
                className={`ri-${isWideMode ? "layout-column-line" : "layout-row-line"} text-lg`}
              ></i>
            </motion.button>
            <motion.button
              onClick={() => setSidebarOpen(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`${isDarkMode ? "text-[#9ca3af] hover:text-white hover:bg-[#374151]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
              title="Collapse Sidebar"
            >
              <i className="ri-arrow-left-s-line text-lg"></i>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Intelligent Search */}
        <div className="relative">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <i
                className={`ri-search-line text-base transition-colors ${
                  searchQuery
                    ? isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : isDarkMode
                      ? "text-[#6b7280]"
                      : "text-gray-400"
                }`}
              ></i>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search navigation... (⌘K)"
              className={`w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? "bg-[#111827] border-2 border-[#374151] text-white placeholder-[#6b7280] focus:border-blue-500 focus:bg-[#0f172a] focus:shadow-lg focus:shadow-blue-500/20"
                  : "bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10"
              } focus:outline-none transition-all`}
            />
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  isDarkMode
                    ? "text-[#6b7280] hover:text-white hover:bg-[#374151]"
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-200"
                }`}
                title="Clear search"
              >
                <i className="ri-close-line text-base"></i>
              </motion.button>
            )}
            {searchQuery && (
              <div
                className={`absolute right-10 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-xs font-semibold ${
                  isDarkMode
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-blue-50 text-blue-600 border border-blue-200"
                }`}
              >
                {searchResults.length}
              </div>
            )}
          </div>

          {/* Enhanced Search Results Dropdown */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border-2 ${
                  isDarkMode
                    ? "bg-[#1f2937] border-[#374151] shadow-blue-500/10"
                    : "bg-white border-gray-200 shadow-gray-900/10"
                } max-h-[32rem] overflow-hidden z-50 backdrop-blur-xl`}
              >
                {searchResults.length > 0 ? (
                  <div className="overflow-y-auto max-h-[32rem] custom-scrollbar">
                    <div className="p-2 space-y-1">
                      {searchResults.map((item, index) => {
                        const highlightText = (text: string, query: string) => {
                          if (!query) return text;
                          const regex = new RegExp(
                            `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                            "gi",
                          );
                          const parts = text.split(regex);
                          return parts.map((part, i) =>
                            regex.test(part) ? (
                              <span
                                key={i}
                                className={`font-bold ${
                                  isDarkMode
                                    ? "text-blue-400 bg-blue-500/20"
                                    : "text-blue-600 bg-blue-50"
                                } px-0.5 rounded`}
                              >
                                {part}
                              </span>
                            ) : (
                              part
                            ),
                          );
                        };

                        return (
                          <motion.div
                            key={item.href || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                          >
                            <Link
                              href={item.href || "#"}
                              prefetch={true}
                              onClick={() => setSearchQuery("")}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group relative overflow-hidden ${
                                isDarkMode
                                  ? "hover:bg-gradient-to-r hover:from-blue-600/20 hover:to-cyan-600/10 text-white border border-transparent hover:border-blue-500/30"
                                  : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 text-gray-900 border border-transparent hover:border-blue-200"
                              }`}
                            >
                              {/* Hover glow effect */}
                              <motion.div
                                className={`absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/5 to-blue-500/0`}
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.5 }}
                              />

                              <div
                                className={`p-2 rounded-lg ${
                                  isDarkMode
                                    ? "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20"
                                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                                } transition-colors relative z-10`}
                              >
                                <i className={`${item.icon} text-lg`}></i>
                              </div>
                              <div className="flex-1 min-w-0 relative z-10">
                                <div className="text-sm font-semibold truncate mb-0.5">
                                  {highlightText(item.name, searchQuery)}
                                </div>
                                {item.description && (
                                  <div
                                    className={`text-xs truncate ${
                                      isDarkMode
                                        ? "text-[#6b7280] group-hover:text-[#9ca3af]"
                                        : "text-gray-500 group-hover:text-gray-600"
                                    }`}
                                  >
                                    {highlightText(
                                      item.description,
                                      searchQuery,
                                    )}
                                  </div>
                                )}
                                {item.href && (
                                  <div
                                    className={`text-xs mt-0.5 truncate font-mono ${
                                      isDarkMode
                                        ? "text-[#4b5563]"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {item.href}
                                  </div>
                                )}
                              </div>
                              {item.badge && (
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 relative z-10 ${
                                    isDarkMode
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-blue-100 text-blue-600 border border-blue-200"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-8 text-center ${
                      isDarkMode ? "text-[#6b7280]" : "text-gray-500"
                    }`}
                  >
                    <i className="ri-search-line text-4xl mb-3 block opacity-50"></i>
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar min-h-0">
        <AnimatePresence mode="wait">
          {searchQuery ? (
            // Enhanced Search Results View
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  isDarkMode
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-blue-50 border border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`ri-search-line ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                  ></i>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    Search Results
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    isDarkMode
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {searchResults.length}
                </span>
              </div>
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((item, index) => (
                    <motion.div
                      key={item.href || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      {renderNavItem(item)}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-8 text-center rounded-xl ${
                    isDarkMode
                      ? "bg-[#111827] border border-[#374151]"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <i
                    className={`ri-search-line text-4xl mb-3 block ${
                      isDarkMode ? "text-[#4b5563]" : "text-gray-300"
                    }`}
                  ></i>
                  <p
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-[#6b7280]" : "text-gray-500"
                    }`}
                  >
                    No results found
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isDarkMode ? "text-[#4b5563]" : "text-gray-400"
                    }`}
                  >
                    Try a different search term
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            // Normal Navigation View
            <motion.div
              key="nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Favorites Section */}
              {favoriteItems.length > 0 && (
                <div className="mb-4">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider px-2 py-2 flex items-center gap-2 ${isDarkMode ? "text-[#6b7280]" : "text-gray-500"}`}
                  >
                    <i className="ri-star-fill text-yellow-400"></i>
                    Favorites
                  </div>
                  <div className="space-y-1">
                    {favoriteItems.map((item) => renderNavItem(item))}
                  </div>
                </div>
              )}

              {/* Recent Items */}
              {recentItems.length > 0 && (
                <div className="mb-4">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wider px-2 py-2 flex items-center gap-2 ${isDarkMode ? "text-[#6b7280]" : "text-gray-500"}`}
                  >
                    <i className="ri-time-line text-blue-400"></i>
                    Recent
                  </div>
                  <div className="space-y-1">
                    {recentItems.map((item) => renderNavItem(item))}
                  </div>
                </div>
              )}

              {/* Main Navigation */}
              <div className="space-y-1">
                {filteredNavStructure.map((item) => renderNavItem(item))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className={`p-4 border-t ${isDarkMode ? "border-[#374151] bg-[#111827]" : "border-gray-200 bg-gray-50"} flex-shrink-0 space-y-2`}
      >
        <div
          className={`text-xs ${isDarkMode ? "text-[#6b7280]" : "text-gray-500"} mb-1`}
        >
          System Version
        </div>
        <div
          className={`text-sm font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          BlueDXP v2.0
        </div>
        <div
          className={`text-xs truncate ${isDarkMode ? "text-[#6b7280]" : "text-gray-500"}`}
        >
          WMS Enterprise Edition
        </div>

        {/* Job Status Widget */}
        <JobStatusWidget />

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center justify-center gap-2 ${
            isDarkMode
              ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30"
              : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          } border px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mt-3`}
        >
          <i className="ri-logout-box-r-line text-base"></i>
          <span className="truncate">Logout</span>
        </motion.button>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#1f2937" : "#f3f4f6"};
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#4b5563" : "#9ca3af"};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#6b7280" : "#6b7280"};
        }
      `}</style>
    </motion.aside>
  );
});

EnhancedSidebar.displayName = "EnhancedSidebar";

export default EnhancedSidebar;
