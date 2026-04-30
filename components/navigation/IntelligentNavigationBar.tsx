/**
 * Intelligent Navigation Bar
 * World-class navigation with integrated AI-powered search
 * Context-aware, predictive, and beautiful
 * 4IR & 5IR Aligned • Human-Centric Design
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import GlobalCommandPalette from "./GlobalCommandPalette";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import CustomerLogo from "../customer/CustomerLogo";
import DualCustomerLogo from "../customer/DualCustomerLogo";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import NotificationCenter from "../NotificationCenter";
import SmartHeaderActions from "./SmartHeaderActions";
import HeaderCopilot from "./HeaderCopilot";
import type { NavItem } from "@/lib/services/navigation/navigationService";

interface IntelligentNavigationBarProps {
  isDarkMode: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  navStructure: NavItem[];
  user: any;
  tenant: any;
}

export default function IntelligentNavigationBar({
  isDarkMode,
  onToggleSidebar,
  sidebarOpen,
  navStructure,
  user,
  tenant,
}: IntelligentNavigationBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentCustomer } = useCustomer();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track scroll for dynamic header
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Escape to close
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen]);

  // Focus search on / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !commandPaletteOpen) {
        const activeElement = document.activeElement;
        const isTyping =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.getAttribute("contenteditable") === "true");

        if (!isTyping) {
          e.preventDefault();
          setShowSearchBar(true);
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen]);

  const headerOpacity = Math.min(scrollY / 100, 1);
  const headerBlur = Math.min(scrollY / 5, 20);

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${
          isDarkMode ? "bg-gray-900/95" : "bg-white/95"
        } backdrop-blur-xl border-b ${
          isDarkMode ? "border-gray-700/50" : "border-gray-200/50"
        }`}
        style={{
          backgroundColor: isDarkMode
            ? `rgba(17, 24, 39, ${0.95 + headerOpacity * 0.05})`
            : `rgba(255, 255, 255, ${0.95 + headerOpacity * 0.05})`,
          backdropFilter: `blur(${headerBlur}px)`,
          boxShadow:
            scrollY > 50
              ? `0 10px 40px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"}`
              : "none",
        }}
      >
        <div className="px-3 sm:px-4 md:px-6 w-full max-w-full">
          <div className="flex items-center justify-between h-16 max-w-full gap-2">
            {/* Left: Logo & Sidebar Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
              <motion.button
                onClick={onToggleSidebar}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
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
                  {/* Glow effect on hover */}
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
            <div className="flex-1 max-w-2xl mx-2 sm:mx-4 hidden md:flex items-center min-w-0">
              <AnimatePresence>
                {showSearchBar ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full"
                  >
                    <div
                      className={`relative rounded-xl border-2 ${
                        isDarkMode
                          ? "bg-gray-800/50 border-cyan-500/50"
                          : "bg-white border-cyan-500"
                      } shadow-lg`}
                    >
                      <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setCommandPaletteOpen(true)}
                        placeholder="Search anything... (⌘K)"
                        className={`w-full pl-10 pr-10 py-2.5 bg-transparent ${
                          isDarkMode
                            ? "text-white placeholder-gray-500"
                            : "text-gray-900 placeholder-gray-400"
                        } outline-none text-sm`}
                      />
                      <button
                        onClick={() => {
                          setShowSearchBar(false);
                          setSearchQuery("");
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-white transition-colors z-10"
                      >
                        <i className="ri-close-line text-sm" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSearchBar(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border ${
                      isDarkMode
                        ? "bg-gray-800/30 border-gray-700/50 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-cyan-500 hover:text-cyan-600"
                    } transition-all group min-w-0`}
                  >
                    <i className="ri-search-line text-base sm:text-lg flex-shrink-0" />
                    <span className="flex-1 text-left text-xs sm:text-sm truncate">
                      Search anything...
                    </span>
                    <div className="hidden sm:flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <kbd
                        className={`px-1.5 py-0.5 rounded ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-200"
                        }`}
                      >
                        ⌘
                      </kbd>
                      <kbd
                        className={`px-1.5 py-0.5 rounded ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-200"
                        }`}
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
              {/* Mobile Search Button */}
              <motion.button
                onClick={() => setCommandPaletteOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`md:hidden ${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg`}
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

              {/* Language */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const event = new CustomEvent("toggle-theme");
                  window.dispatchEvent(event);
                }}
                className={`${isDarkMode ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-colors p-2 rounded-lg flex-shrink-0`}
                aria-label="Toggle theme"
              >
                <i
                  className={
                    isDarkMode ? "ri-sun-line text-lg" : "ri-moon-line text-lg"
                  }
                ></i>
              </motion.button>

              {/* Notifications */}
              <div className="flex-shrink-0">
                <NotificationCenter
                  userId={user?.id}
                  tenantId={tenant?.id || currentCustomer?.tenantId}
                />
              </div>
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
