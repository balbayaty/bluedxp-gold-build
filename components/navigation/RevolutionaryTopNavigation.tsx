/**
 * Revolutionary Top Navigation Bar
 * Beautiful, intelligent, contextual navigation
 * Matches sidebar design • Working tabs • Smart breadcrumbs
 * 4IR & 5IR Aligned • World-Class UX
 */

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import GlobalCommandPalette from "./GlobalCommandPalette";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useShowcase } from "@/contexts/ShowcaseContext";
import CustomerLogo from "../customer/CustomerLogo";
import DualCustomerLogo from "../customer/DualCustomerLogo";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import NotificationCenter from "../NotificationCenter";
import SmartHeaderActions from "./SmartHeaderActions";
import HeaderCopilot from "./HeaderCopilot";
import UserProfileMenu from "./UserProfileMenu";
import type { NavItem } from "@/lib/services/navigation/navigationService";

interface RevolutionaryTopNavigationProps {
  isDarkMode: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  navStructure: NavItem[];
  user: any;
  tenant: any;
}

export default function RevolutionaryTopNavigation({
  isDarkMode,
  onToggleSidebar,
  sidebarOpen,
  navStructure,
  user,
  tenant,
}: RevolutionaryTopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentCustomer } = useCustomer();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get showcase context for showcase sections
  const showcaseContext = useShowcase();
  const isShowcasePage = pathname === "/showcase";
  const activeShowcaseSection = isShowcasePage
    ? showcaseContext.activeSection
    : null;

  // Showcase sections - shown in top nav when on showcase page
  const showcaseSections = useMemo(
    () => [
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
      {
        id: "aivision",
        label: "AI Vision",
        icon: "ri-eye-line",
        color: "indigo",
      },
      {
        id: "3d",
        label: "3D Warehouse",
        icon: "ri-warehouse-line",
        color: "teal",
      },
      {
        id: "workflow",
        label: "Workflows",
        icon: "ri-flow-chart",
        color: "rose",
      },
      {
        id: "architecture",
        label: "Architecture",
        icon: "ri-node-tree",
        color: "violet",
      },
    ],
    [],
  );

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
      }
    },
    [isShowcasePage, showcaseContext],
  );

  // Scroll spy for showcase sections
  useEffect(() => {
    if (!isShowcasePage) return;

    const handleScroll = () => {
      const sections = showcaseSections.map((s) => s.id);
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            if (showcaseContext.setActiveSection) {
              showcaseContext.setActiveSection(sectionId);
            }
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isShowcasePage, showcaseSections, showcaseContext]);

  // Track scroll for dynamic header
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find nav item by path - MUST be defined before useMemo that uses it
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
        setShowSearchBar(false);
        setSearchQuery("");
      }
      if (e.key === "/" && !commandPaletteOpen) {
        const activeElement = document.activeElement;
        const isTyping =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.getAttribute("contenteditable") === "true");
        if (!isTyping) {
          e.preventDefault();
          // Directly open command palette for better UX
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen]);

  // Get breadcrumbs from current path
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [
      { label: "Home", href: "/" },
    ];

    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const navItem = findNavItemByPath(navStructure, currentPath);
      crumbs.push({
        label:
          navItem?.name ||
          part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
        href: currentPath,
      });
    });

    return crumbs;
  }, [pathname, navStructure, findNavItemByPath]);

  // Check if path is active
  const isActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    },
    [pathname],
  );

  const headerOpacity = Math.min(scrollY / 100, 1);
  const headerBlur = Math.min(scrollY / 5, 20);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          isDarkMode
            ? "bg-gradient-to-b from-gray-900/98 via-gray-800/95 to-gray-900/98"
            : "bg-gradient-to-b from-white/98 via-gray-50/95 to-white/98"
        } backdrop-blur-xl border-b ${
          isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
        }`}
        style={{
          backgroundColor: isDarkMode
            ? `rgba(17, 24, 39, ${0.98 + headerOpacity * 0.02})`
            : `rgba(255, 255, 255, ${0.98 + headerOpacity * 0.02})`,
          backdropFilter: `blur(${headerBlur}px)`,
          boxShadow:
            scrollY > 50
              ? `0 10px 40px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"}`
              : "none",
        }}
      >
        {/* Top Row: Logo, Search, Actions */}
        <div className="px-3 sm:px-4 md:px-6 w-full">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Logo & Sidebar Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
              <motion.button
                onClick={onToggleSidebar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
                aria-label="Toggle sidebar"
              >
                <i
                  className={
                    sidebarOpen
                      ? "ri-arrow-left-s-line text-lg"
                      : "ri-menu-line text-lg"
                  }
                ></i>
              </motion.button>

              <Link
                href="/"
                className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group min-w-0"
              >
                <motion.div
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex-shrink-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-cyan-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                  <img
                    src="/bluedxp-logo.svg"
                    alt="BlueDXP"
                    className="h-7 sm:h-8 w-auto object-contain relative z-10"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </motion.div>

                {currentCustomer && (
                  <>
                    <div
                      className={`h-6 w-px flex-shrink-0 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}
                    />
                    <div className="flex-shrink-0">
                      {currentCustomer.subCustomers &&
                      currentCustomer.subCustomers.length > 0 ? (
                        <DualCustomerLogo
                          primaryCustomer={currentCustomer}
                          subCustomer={currentCustomer.subCustomers[0]}
                          size="sm"
                          variant="side-by-side"
                        />
                      ) : currentCustomer.logo ? (
                        <CustomerLogo
                          logo={currentCustomer.logo}
                          customerName={currentCustomer.customerName}
                          size="sm"
                          variant="compact"
                        />
                      ) : (
                        <div
                          className={`h-6 px-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded text-white text-xs font-bold flex items-center whitespace-nowrap`}
                        >
                          {currentCustomer.customerName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Link>
            </div>

            {/* Center: Intelligent Search Bar */}
            <div className="flex-1 max-w-md mx-2 sm:mx-3 hidden md:flex items-center min-w-0">
              <AnimatePresence>
                {showSearchBar ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full"
                  >
                    <div
                      className={`relative rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-800/80 border-cyan-500/50 backdrop-blur-xl"
                          : "bg-white/80 border-cyan-500 backdrop-blur-xl"
                      } shadow-lg`}
                    >
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 text-sm" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setCommandPaletteOpen(true)}
                        placeholder="Search... (⌘K)"
                        className={`w-full pl-8 pr-8 py-1.5 bg-transparent ${
                          isDarkMode
                            ? "text-white placeholder-gray-500"
                            : "text-gray-900 placeholder-gray-400"
                        } outline-none text-xs`}
                      />
                      <button
                        onClick={() => {
                          setShowSearchBar(false);
                          setSearchQuery("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors z-10"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      // Directly open command palette on single click for better UX
                      setCommandPaletteOpen(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                      isDarkMode
                        ? "bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-gray-800/50"
                        : "bg-gray-50/80 border-gray-200 text-gray-500 hover:border-cyan-500 hover:text-cyan-600 hover:bg-white/80"
                    } transition-all group min-w-0 backdrop-blur-sm cursor-pointer`}
                  >
                    <i className="ri-search-line text-sm flex-shrink-0" />
                    <span className="flex-1 text-left text-xs truncate">
                      Search...
                    </span>
                    <div className="hidden sm:flex items-center gap-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <kbd
                        className={`px-1 py-0.5 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                      >
                        ⌘
                      </kbd>
                      <kbd
                        className={`px-1 py-0.5 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                      >
                        K
                      </kbd>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              <motion.button
                onClick={() => setCommandPaletteOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`md:hidden ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg`}
                aria-label="Search"
              >
                <i className="ri-search-line text-lg"></i>
              </motion.button>

              {/* Smart Header Actions - Quick Actions, System Health, Insights */}
              <SmartHeaderActions isDarkMode={isDarkMode} />

              {/* Embedded AI Copilot - Always Accessible */}
              <HeaderCopilot
                isDarkMode={isDarkMode}
                tenantId={tenant?.id || currentCustomer?.tenantId}
                userId={user?.id}
              />

              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              <motion.button
                whileHover={{ scale: 1.05, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const event = new CustomEvent("toggle-theme");
                  window.dispatchEvent(event);
                }}
                className={`${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
                aria-label="Toggle theme"
              >
                <i
                  className={
                    isDarkMode ? "ri-sun-line text-lg" : "ri-moon-line text-lg"
                  }
                ></i>
              </motion.button>

              <div className="flex-shrink-0">
                <NotificationCenter
                  userId={user?.id}
                  tenantId={tenant?.id || currentCustomer?.tenantId}
                />
              </div>

              {/* User Profile Menu - ChatGPT/Anthropic style */}
              <UserProfileMenu
                isDarkMode={isDarkMode}
                user={user}
                tenant={tenant}
              />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Global Command Palette */}
      <GlobalCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => {
          setCommandPaletteOpen(false);
          setShowSearchBar(false);
          setSearchQuery("");
        }}
        navStructure={navStructure}
      />
    </>
  );
}
