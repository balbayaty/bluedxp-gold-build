"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load HazalyzeCopilot - only load when user interacts
// Use a more robust import that handles chunk loading errors
// RE-ENABLED: Copilot widget with conversation memory fixes applied
const HazalyzeCopilot = dynamic(
  () =>
    import("./HazalyzeCopilot")
      .then((mod) => mod)
      .catch((err) => {
        console.error("[Layout] Failed to load HazalyzeCopilot:", err);
        return { default: () => null };
      }),
  {
    ssr: false,
    loading: () => null, // Don't show loading state for copilot
  },
);

import { CurrencyBadge, CurrencySelector } from "./CurrencyDisplay";
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp";
import LanguageSwitcher from "./i18n/LanguageSwitcher";
import PremiumLoadingScreen from "./PremiumLoadingScreen";
// Components loaded dynamically to avoid SSR issues and prevent blocking app startup
const NotificationCenter = dynamic(
  () =>
    import("./NotificationCenter")
      .then((mod) => mod)
      .catch((err) => {
        console.error("Failed to load NotificationCenter:", err);
        // Return a fallback component that gracefully handles the error
        return {
          default: () => (
            <div className="relative">
              <button
                className="relative p-2 rounded-lg hover:bg-white/5 transition-colors opacity-50"
                aria-label="Notifications unavailable"
                disabled
                title="Notifications temporarily unavailable"
              >
                <i className="ri-notification-3-line text-xl text-gray-300"></i>
              </button>
            </div>
          ),
        };
      }),
  {
    ssr: false,
    loading: () => null, // Don't show loading state for notification center
  },
);
const NotificationToastWrapper = dynamic(
  () =>
    import("./NotificationToastWrapper")
      .then((mod) => mod)
      .catch((err) => {
        console.error("Failed to load NotificationToastWrapper:", err);
        return { default: () => null };
      }),
  {
    ssr: false,
    loading: () => null,
  },
);
const NotificationDemoButton = dynamic(
  () =>
    import("./NotificationDemoButton")
      .then((mod) => mod)
      .catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null,
  },
);
const NotificationAutoGenerator = dynamic(
  () =>
    import("./NotificationAutoGenerator")
      .then((mod) => mod)
      .catch(() => ({ default: () => null })),
  {
    ssr: false,
    loading: () => null,
  },
);
const IntelligentToastContainer = dynamic(
  () =>
    import("./accessibility/IntelligentToast")
      .then((mod) => ({ default: mod.IntelligentToastContainer }))
      .catch((err) => {
        console.error("Failed to load IntelligentToastContainer:", err);
        // Return a fallback component that gracefully handles the error
        return {
          default: () => null, // Return null to render nothing if component fails to load
        };
      }),
  {
    ssr: false,
    loading: () => null, // Don't show loading state
  },
);
const AccessibilityQuickAccess = dynamic(
  () =>
    import("./accessibility/AccessibilityQuickAccess")
      .then((mod) => ({ default: mod.default }))
      .catch((err) => {
        console.error("Failed to load AccessibilityQuickAccess chunk:", err);
        // Return a fallback component that gracefully handles the error
        return {
          default: () => null, // Return null to render nothing if component fails to load
        };
      }),
  {
    ssr: false,
    loading: () => null, // Don't show loading state
  },
);
import { ColorBlindFilters } from "@/contexts/AccessibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { ViewContextProvider } from "@/contexts/ViewContextProvider";
import { filterNavigationByPermissions } from "@/utils/navigationPermissions";
import { ModuleId, FeatureId } from "@/types/user";
import CustomerLogo from "./customer/CustomerLogo";
import DualCustomerLogo from "./customer/DualCustomerLogo";
import EnhancedSidebar from "./EnhancedSidebar";
import Enhanced3DSidebar from "./navigation/Enhanced3DSidebar";
// Lazy load heavy navigation components to improve initial page load
const NeuralSidebar = dynamic(
  () =>
    import("./navigation/NeuralSidebar").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: true, // Keep SSR for SEO and initial render
    loading: () => (
      <div className="fixed left-0 top-0 bottom-0 w-20 lg:w-80 bg-[#1f2937] border-r border-[#374151] z-30">
        <div className="p-4">
          <div className="h-8 bg-[#374151] rounded animate-pulse"></div>
        </div>
      </div>
    ),
  },
);
// Lazy load RevolutionaryTopNavigation with robust error handling
const RevolutionaryTopNavigation = dynamic(
  () => {
    return import("./navigation/RevolutionaryTopNavigation")
      .then((mod) => {
        // Handle both named export and default export
        const Component = mod.RevolutionaryTopNavigation || mod.default;
        if (!Component) {
          console.warn(
            "RevolutionaryTopNavigation: No component found in module",
          );
          return { default: () => null };
        }
        return { default: Component };
      })
      .catch((err) => {
        console.error("Failed to load RevolutionaryTopNavigation chunk:", err);
        console.error("Error details:", {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
        });
        // Return a fallback component that shows a simple navigation bar
        return {
          default: ({ isDarkMode, onToggleSidebar, sidebarOpen }: any) => {
            if (process.env.NODE_ENV === "development") {
              console.warn(
                "RevolutionaryTopNavigation: Using fallback navigation",
              );
            }
            return (
              <nav
                className={`fixed top-0 left-0 right-0 z-[60] h-16 ${
                  isDarkMode
                    ? "bg-gray-900 border-gray-700"
                    : "bg-white border-gray-200"
                } border-b flex items-center justify-between px-4`}
              >
                <button
                  onClick={onToggleSidebar}
                  className={`${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} p-2 rounded-lg`}
                >
                  <i
                    className={
                      sidebarOpen
                        ? "ri-arrow-left-s-line text-lg"
                        : "ri-menu-line text-lg"
                    }
                  ></i>
                </button>
                <div className="text-sm text-red-500">
                  Navigation loading error - please refresh
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Refresh
                </button>
              </nav>
            );
          },
        };
      });
  },
  {
    ssr: false, // Disable SSR to avoid chunk loading issues
    loading: () => (
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-[#374151] z-40">
        <div className="h-full flex items-center justify-between px-4">
          <div className="h-8 w-32 bg-[#374151] rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-[#374151] rounded animate-pulse"></div>
        </div>
      </div>
    ),
  },
);
import {
  getDefaultNavigationStructure,
  getHazalyzeNavigation,
} from "@/lib/services/navigation/defaultNavigation";
import type { NavItem } from "@/lib/services/navigation/navigationService";

type ModuleListResponse = {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    routes: Array<{ path: string; title: string; icon?: string }>;
  }>;
};

function collectHrefs(items: NavItem[]): Set<string> {
  const hrefs = new Set<string>();
  const walk = (arr: NavItem[]) => {
    for (const item of arr) {
      if (item.href) hrefs.add(item.href);
      if (item.children?.length) walk(item.children);
    }
  };
  walk(items);
  return hrefs;
}

function normalizeIcon(icon?: string): string {
  if (!icon) return "ri-file-line";
  return icon.startsWith("ri-") ? icon : "ri-file-line";
}

function buildAutoModulesNav(
  modules: ModuleListResponse["data"],
  existingHrefs: Set<string>,
): NavItem | null {
  console.log(
    `[Layout] buildAutoModulesNav: ${modules.length} modules, ${existingHrefs.size} existing hrefs`,
  );
  console.log(
    `[Layout] Module IDs:`,
    modules.map((m) => `${m.id} (${m.name})`).join(", "),
  );

  if (modules.length === 0) {
    console.error(
      "[Layout] ERROR: No modules received in buildAutoModulesNav!",
    );
    return null;
  }

  const moduleItems: NavItem[] = modules
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => {
      const allRoutes = m.routes || [];
      const filteredRoutes = allRoutes
        // Don't show dynamic routes in sidebar (not clickable without params)
        .filter((r) => !r.path.includes("["))
        // Show all routes, even if they exist in default nav (mark duplicates)
        .map((r) => ({
          name: r.title || r.path,
          href: r.path,
          icon: normalizeIcon(r.icon),
          description: existingHrefs.has(r.path)
            ? `${r.path} (also in main nav)`
            : r.path,
          moduleId: m.id as unknown as ModuleId,
          badge: existingHrefs.has(r.path) ? "DUP" : undefined,
        }));

      if (allRoutes.length > 0 && filteredRoutes.length === 0) {
        console.log(
          `[Layout] Module "${m.name}" has ${allRoutes.length} routes but all are dynamic (contain '[')`,
        );
      }

      return {
        name: m.name,
        icon: "ri-apps-line",
        description: m.description || `${m.name} module`,
        badge:
          filteredRoutes.length > 0
            ? "AUTO"
            : filteredRoutes.length === 0 && allRoutes.length > 0
              ? "DYNAMIC"
              : "NO_ROUTES",
        moduleId: m.id as unknown as ModuleId,
        children:
          filteredRoutes.length > 0
            ? filteredRoutes
            : [
                // If no static routes, show a placeholder so module is still visible
                {
                  name: "No static routes available",
                  href: "#",
                  icon: "ri-information-line",
                  description:
                    "This module has no static routes (may have dynamic routes only)",
                  moduleId: m.id as unknown as ModuleId,
                  badge: "INFO",
                },
              ],
      };
    })
    // Show ALL modules, even if they have no routes (so user knows they exist)
    // This is a development tool to see all registered modules
    // Only filter out if module is completely invalid
    .filter((m) => {
      // Keep all modules - don't filter based on routes
      // This allows developers to see all modules in the registry
      if (!m || !m.moduleId) {
        console.warn(`[Layout] Filtering out invalid module item:`, m);
        return false;
      }
      return true;
    });

  console.log(
    `[Layout] buildAutoModulesNav result: ${moduleItems.length} modules`,
  );

  if (moduleItems.length === 0) {
    console.warn("[Layout] No modules to display in auto nav");
    return null;
  }

  return {
    name: "All Modules (Auto)",
    icon: "ri-grid-line",
    description: "Auto-generated from Module Registry - All registered modules",
    badge: "DEV",
    children: moduleItems,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentCustomer } = useCustomer();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const { user, tenant, isLoading, isHydrated } = useAuth();
  const [autoModules, setAutoModules] = useState<
    ModuleListResponse["data"] | null
  >(null);
  const [autoModulesError, setAutoModulesError] = useState<string | null>(null);

  // Auto-open sidebar on desktop, close on mobile
  // But respect user preference and showcase page requirements
  // OPTIMIZED: Defer localStorage operations to avoid blocking navigation
  useEffect(() => {
    const isShowcase = pathname === "/showcase";
    const isDesktop = window.innerWidth >= 1024;

    if (isDesktop) {
      // On showcase page, always keep sidebar open
      if (isShowcase) {
        setSidebarOpen(true);
        // Defer localStorage write
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => {
            localStorage.setItem("sidebar-open", "true");
          });
        } else {
          setTimeout(() => localStorage.setItem("sidebar-open", "true"), 0);
        }
      } else {
        // On other pages, check localStorage first, then default to open
        const savedState = localStorage.getItem("sidebar-open");
        if (savedState !== null) {
          setSidebarOpen(savedState === "true");
        } else {
          setSidebarOpen(true);
        }
      }
    } else {
      // On mobile, always start closed
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Handle resize - but don't override showcase page requirement
  // OPTIMIZED: Debounced resize handler to avoid excessive updates
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const isDesktop = window.innerWidth >= 1024;
        const isShowcase = pathname === "/showcase";

        if (isDesktop && isShowcase) {
          // Always keep open on showcase desktop
          setSidebarOpen(true);
          // Defer localStorage write
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(() => {
              localStorage.setItem("sidebar-open", "true");
            });
          } else {
            setTimeout(() => localStorage.setItem("sidebar-open", "true"), 0);
          }
        } else if (isDesktop) {
          // On other desktop pages, respect saved state
          const savedState = localStorage.getItem("sidebar-open");
          if (savedState !== null) {
            setSidebarOpen(savedState === "true");
          }
        } else {
          // On mobile, close sidebar
          setSidebarOpen(false);
        }
      }, 150); // Debounce resize events
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("hazalyze-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("hazalyze-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Listen for theme toggle events from navigation bar
  useEffect(() => {
    const handleThemeToggle = () => {
      setIsDarkMode(!isDarkMode);
    };
    window.addEventListener("toggle-theme", handleThemeToggle);
    return () => window.removeEventListener("toggle-theme", handleThemeToggle);
  }, [isDarkMode]);

  // Load enabled modules + routes (server-derived) so we can show *everything* during dev.
  // OPTIMIZED: Defer this fetch to avoid blocking initial render with improved caching
  useEffect(() => {
    let cancelled = false;
    const cacheKey = "bluedxp:modules:list:v2"; // Bump version to clear old cache

    // Clear old cache versions on first load to ensure fresh data
    if (typeof window !== "undefined") {
      try {
        ["bluedxp:modules:list:v1", "bluedxp:modules:list"].forEach(
          (oldKey) => {
            sessionStorage.removeItem(oldKey);
          },
        );
        console.log("[Layout] Cleared old module list cache");
      } catch {
        // ignore
      }
    }

    // Very short cache in development, longer in production
    // But always refresh to ensure we see all modules
    const cacheTtlMs =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? 30 * 1000 // 30 seconds in development (very short for debugging)
        : 5 * 60 * 1000; // 5 minutes in production

    const readCache = (): ModuleListResponse["data"] | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { ts?: unknown; data?: unknown };
        const ts = typeof parsed.ts === "number" ? parsed.ts : 0;
        if (!ts || Date.now() - ts > cacheTtlMs) {
          console.log(
            "[Layout] Cache expired or invalid, will fetch fresh data",
          );
          return null;
        }
        if (!Array.isArray(parsed.data)) return null;
        const cachedCount = (parsed.data as ModuleListResponse["data"]).length;
        console.log(
          `[Layout] Using cached module list: ${cachedCount} modules`,
        );
        return parsed.data as ModuleListResponse["data"];
      } catch {
        return null;
      }
    };

    const writeCache = (data: ModuleListResponse["data"]) => {
      if (typeof window === "undefined") return;
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), data }),
        );
      } catch {
        // ignore storage quota errors
      }
    };

    const cached = readCache();
    if (cached) {
      setAutoModules(cached);
      setAutoModulesError(null);
      // If cache is still fresh, skip fetch entirely
      const cacheAge =
        Date.now() -
        (sessionStorage.getItem(cacheKey)
          ? JSON.parse(sessionStorage.getItem(cacheKey) || "{}").ts || 0
          : 0);
      if (cacheAge < cacheTtlMs) {
        console.log(
          `[Layout] Cache is fresh (${Math.round(cacheAge / 1000)}s old), skipping fetch`,
        );
        return; // Skip fetch if cache is fresh
      }
    }

    // CRITICAL: Defer fetch to avoid blocking initial render
    // Use requestIdleCallback if available, otherwise setTimeout
    const fetchModules = async () => {
      if (cancelled) return;
      const controller = new AbortController();
      try {
        // Force fresh fetch - no cache for module list to ensure we get latest
        const res = await fetch("/api/modules/list", {
          credentials: "include",
          signal: controller.signal,
          cache: "no-store", // Always fetch fresh
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        const json = (await res.json()) as ModuleListResponse;
        if (cancelled) return;

        console.log("[Layout] Module list response:", {
          success: json?.success,
          count: json?.data?.length,
          modules: json?.data?.map(
            (m: { id: string; name: string; routes: unknown[] }) => ({
              id: m.id,
              name: m.name,
              routes: m.routes?.length || 0,
            }),
          ),
        });

        if (json?.success && Array.isArray(json.data)) {
          console.log(
            `[Layout] Setting ${json.data.length} modules in auto nav`,
          );
          console.log(
            `[Layout] Module names:`,
            json.data
              .map((m: { name: string; id: string }) => `${m.name} (${m.id})`)
              .join(", "),
          );
          if (json.data.length === 0) {
            console.error(
              "[Layout] ERROR: API returned 0 modules! This indicates a registration issue.",
            );
            console.error(
              "[Layout] Check server logs for module registration errors",
            );
          } else if (json.data.length === 1) {
            console.warn(
              `[Layout] WARNING: Only 1 module returned! Expected ${json.data.length}+ modules.`,
            );
            console.warn(
              `[Layout] This might be a caching issue or module registration problem.`,
            );
          }
          setAutoModules(json.data);
          setAutoModulesError(null);
          writeCache(json.data);
        } else {
          console.warn("[Layout] Module list response invalid:", json);
          // Only show an error if we don't already have cached data.
          if (!cached) {
            setAutoModules(null);
            setAutoModulesError("Module list unavailable");
          }
        }
      } catch (e) {
        if (cancelled) return;
        // Don't log errors if we have cached data - it's not critical
        if (!cached) {
          console.error("[Layout] Failed to fetch modules:", e);
          setAutoModules(null);
          setAutoModulesError("Failed to load module list");
        }
      }
    };

    // Defer fetch to avoid blocking initial render - use longer delay if cache exists
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(fetchModules, { timeout: cached ? 5000 : 2000 });
    } else {
      setTimeout(fetchModules, cached ? 500 : 100); // Longer delay if we have cache
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const [appMode, setAppMode] = useState<"logistics" | "hazalyze">("logistics");

  // Load app mode from localStorage and handle URL-based mode switching
  // OPTIMIZED: Use useMemo to avoid unnecessary recalculations
  const detectedAppMode = useMemo(() => {
    if (
      pathname?.startsWith("/hazalyze") ||
      pathname?.startsWith("/msds") ||
      pathname?.startsWith("/qhse") ||
      pathname?.startsWith("/iso-ims") ||
      pathname?.startsWith("/chemical")
    ) {
      return "hazalyze" as const;
    }
    return "logistics" as const;
  }, [pathname]);

  useEffect(() => {
    // Only update if mode actually changed
    if (detectedAppMode !== appMode) {
      setAppMode(detectedAppMode);
    }
  }, [detectedAppMode, appMode]);

  // Persist app mode changes - deferred to avoid blocking
  useEffect(() => {
    // Defer localStorage write to avoid blocking navigation
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => {
        localStorage.setItem("hazalyze-app-mode", appMode);
      });
    } else {
      setTimeout(() => {
        localStorage.setItem("hazalyze-app-mode", appMode);
      }, 0);
    }
  }, [appMode]);

  // Load navigation structure - database-driven with fallback to default
  // Using useMemo to cache and only recalculate when dependencies change
  const navStructure: NavItem[] = useMemo(() => {
    // For now, use default structure (database integration can be added later)
    // The service supports database loading but we'll use default for UI/UX preservation
    const base =
      appMode === "hazalyze"
        ? getHazalyzeNavigation()
        : getDefaultNavigationStructure();
    const existingHrefs = collectHrefs(base);

    console.log(
      `[Layout] Navigation structure (${appMode}): ${base.length} base items, ${existingHrefs.size} existing hrefs`,
    );

    // Auto modules are added to both apps for now, or filtered if needed
    const autoNav = autoModules
      ? buildAutoModulesNav(autoModules, existingHrefs)
      : null;
    if (!autoNav) {
      console.log("[Layout] No auto-generated nav, using base navigation only");
      return base;
    }

    console.log(
      `[Layout] Adding auto-generated nav with ${autoNav.children?.length || 0} modules`,
    );
    return [...base, autoNav];
  }, [autoModules, appMode]); // Include auto module routes during development

  // Filter navigation based on permissions
  const filteredNavStructure = useMemo(() => {
    if (!user) return navStructure;
    return filterNavigationByPermissions(navStructure, user);
  }, [user, navStructure]);

  const toggleMenu = (menuName: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuName)) {
      newExpanded.delete(menuName);
    } else {
      newExpanded.add(menuName);
    }
    setExpandedMenus(newExpanded);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  const isMenuExpanded = (menuName: string) => {
    return expandedMenus.has(menuName);
  };

  const hasActiveChild = (item: NavItem): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => hasActiveChild(child));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = isMenuExpanded(item.name);
    const active = item.href ? isActive(item.href) : false;
    const hasActive = hasActiveChild(item);
    const indent = level * 16;

    return (
      <div key={item.name} className="mb-0.5">
        {hasChildren ? (
          <>
            <button
              onClick={() => toggleMenu(item.name)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group ${
                hasActive
                  ? `${isDarkMode ? "bg-blue-600/20 text-white" : "bg-blue-50 text-blue-700"} border-l-2 border-blue-500`
                  : `${isDarkMode ? "text-[#9ca3af] hover:bg-[#374151] hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
              }`}
              style={{ paddingLeft: `${16 + indent}px` }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <i
                  className={`${item.icon} text-lg flex-shrink-0 ${hasActive ? "text-blue-400" : isDarkMode ? "text-[#6b7280] group-hover:text-white" : "text-gray-400 group-hover:text-gray-700"}`}
                ></i>
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className={`text-sm font-medium truncate ${hasActive ? (isDarkMode ? "text-white" : "text-blue-700") : isDarkMode ? "text-[#9ca3af] group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`}
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
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full flex-shrink-0">
                    {item.badge}
                  </span>
                )}
                {item.comingSoon && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full flex-shrink-0 border border-amber-500/30">
                    COMING SOON
                  </span>
                )}
              </div>
              <i
                className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-sm transition-transform flex-shrink-0 ml-2 ${
                  hasActive
                    ? "text-blue-300"
                    : isDarkMode
                      ? "text-[#6b7280] group-hover:text-white"
                      : "text-gray-400 group-hover:text-gray-700"
                }`}
              ></i>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`ml-4 border-l ${isDarkMode ? "border-[#374151]" : "border-gray-200"} pl-2 mt-0.5`}
                  >
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
            prefetch={active || level === 0 ? true : undefined} // Only prefetch active links or top-level items
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
              active
                ? `${isDarkMode ? "bg-blue-600 text-white" : "bg-blue-600 text-white"} shadow-lg`
                : `${isDarkMode ? "text-[#9ca3af] hover:bg-[#374151] hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
            }`}
            style={{ paddingLeft: `${16 + indent}px` }}
          >
            <i
              className={`${item.icon} text-lg flex-shrink-0 ${active ? "text-white" : isDarkMode ? "text-[#6b7280] group-hover:text-white" : "text-gray-400 group-hover:text-gray-700"}`}
            ></i>
            <div className="flex-1 min-w-0">
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
            {item.badge && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                  active ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                }`}
              >
                {item.badge}
              </span>
            )}
            {item.comingSoon && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 border ${
                  active
                    ? "bg-amber-500/30 text-amber-300 border-amber-400/50"
                    : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}
              >
                COMING SOON
              </span>
            )}
          </Link>
        )}
      </div>
    );
  };

  // Auto-expand menus with active children on mount
  useEffect(() => {
    const initialExpanded = new Set<string>();
    navStructure.forEach((item) => {
      if (hasActiveChild(item)) {
        initialExpanded.add(item.name);
      }
    });
    if (initialExpanded.size > 0) {
      setExpandedMenus(initialExpanded);
    }
  }, [pathname]);

  // Skip layout for landing, login, home, premium, ultimate, and demo pages
  if (
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname === "/home" ||
    pathname === "/premium" ||
    pathname === "/ultimate" ||
    pathname === "/gcc-compliance" ||
    pathname?.startsWith("/bluedxp-")
  ) {
    return <>{children}</>;
  }

  // REMOVED: No more blocking loading screens!
  // The app will show content immediately and handle auth state per-page
  // This prevents the "stuck at 15%" issue

  // If not hydrated yet, show a minimal non-blocking loading indicator
  // but still render the main layout structure
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-white/70 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // If user isn't authenticated, redirect to login (don't show blocking screen)
  if (!user && !isLoading) {
    // Auto-redirect to login after hydration
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-white/70 text-sm">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <ViewContextProvider user={user}>
      <div
        className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-[#111827]" : "bg-gray-50"}`}
      >
        {/* Revolutionary Top Navigation */}
        <RevolutionaryTopNavigation
          isDarkMode={isDarkMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          navStructure={filteredNavStructure}
          user={user}
          tenant={tenant}
        />

        <div className="flex relative">
          {/* Mobile Overlay - Only on mobile, not on showcase desktop */}
          {sidebarOpen && pathname !== "/showcase" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                // Only close on mobile
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
          )}

          {/* Enhanced 3D Navigation System */}
          <Enhanced3DSidebar
            navStructure={filteredNavStructure}
            isDarkMode={isDarkMode}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            user={user}
          />

          {/* Main Content */}
          <main
            className={`flex-1 ${isDarkMode ? "bg-[#111827]" : "bg-gray-50"} min-h-screen w-full overflow-x-hidden pt-28 transition-all duration-500`}
            style={{ marginLeft: sidebarOpen ? "320px" : "120px" }}
          >
            <div className="w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>

        {/* BlueDXP Copilot - AI Assistant */}
        <HazalyzeCopilot />

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp />

        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isDarkMode ? "#1f2937" : "#f3f4f6"};
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? "#4b5563" : "#9ca3af"};
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? "#6b7280" : "#6b7280"};
          }
        `}</style>

        {/* Accessibility: Intelligent Toast Notifications */}
        <IntelligentToastContainer />

        {/* Real-time Notification Toasts */}
        <NotificationToastWrapper
          userId={user?.id}
          tenantId={tenant?.id || currentCustomer?.tenantId}
        />

        {/* Auto-generate demo notifications in development */}
        <NotificationAutoGenerator
          userId={user?.id}
          tenantId={tenant?.id || currentCustomer?.tenantId}
        />

        {/* Accessibility: Color Blind Filter SVGs */}
        <ColorBlindFilters />

        {/* Accessibility: Quick Access Floating Button */}
        <AccessibilityQuickAccess />

        {/* Skip Link for Keyboard Navigation */}
        <a href="#main-content" className="skip-link" tabIndex={0}>
          Skip to main content
        </a>

        {/* Screen Reader Announcements */}
        <div
          id="a11y-announcer"
          className="a11y-announcer"
          aria-live="polite"
          aria-atomic="true"
        />
      </div>
    </ViewContextProvider>
  );
}
