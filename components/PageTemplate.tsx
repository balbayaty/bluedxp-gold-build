"use client";

import { ReactNode, memo, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Tooltip from "./Tooltip";
import CurrencyDisplay from "./CurrencyDisplay";
import { CapabilityBadge } from "@/components/CapabilityBadge";
import { getCapabilityStatusForPath } from "@/lib/services/capabilities/registry";
import { useResolvedCapabilityStatus } from "@/lib/services/capabilities/useResolvedCapabilityStatus";

interface PageTemplateProps {
  title: string;
  description: string;
  shortDescription?: string; // Optional short version for visible text
  icon: string;
  systemInfo?: {
    sap?: string;
    oracle?: string;
    manhattan?: string;
    custom?: string;
  };
  examples?: string[];
  children: ReactNode;
  actions?: ReactNode;
  stats?: Array<{
    label: string;
    value: string | number;
    icon: string;
    tooltip?: string;
    trend?: "up" | "down" | "neutral";
    isCurrency?: boolean;
  }>;
  showDescriptionInline?: boolean; // Whether to show description text inline (default: true)
}

const PageTemplate = memo(function PageTemplate({
  title,
  description,
  shortDescription,
  icon,
  systemInfo,
  examples,
  children,
  actions,
  stats,
  showDescriptionInline = true,
}: PageTemplateProps) {
  const memoizedStats = useMemo(() => stats, [stats]);
  const pathname = usePathname();
  const baseCapability = useMemo(
    () => getCapabilityStatusForPath(pathname || ""),
    [pathname],
  );
  const capability = useResolvedCapabilityStatus(
    pathname || "",
    baseCapability,
  );
  const showTransportationCatalogLink = useMemo(() => {
    const p = (pathname || "").toLowerCase();
    if (!p.startsWith("/transportation")) return false;
    if (p === "/transportation/capabilities") return false;
    return true;
  }, [pathname]);

  return (
    <div
      id="main-content"
      className="p-4 sm:p-6 lg:p-8 w-full max-w-full"
      role="main"
      aria-label={title}
    >
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 lg:mb-8"
      >
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          {/* Title and Description Row */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <i className={`${icon} text-white text-lg sm:text-xl`}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight"
                  id="page-title"
                >
                  {title}
                </h1>
                {capability && (
                  <div className="mt-1">
                    <CapabilityBadge status={capability} />
                  </div>
                )}
              </div>
              <div className="relative">
                <Tooltip
                  content={description}
                  systemInfo={systemInfo}
                  examples={examples}
                  position="bottom"
                >
                  {showDescriptionInline ? (
                    <div className="flex items-start gap-2">
                      <p
                        className="text-[#9ca3af] text-sm sm:text-base leading-relaxed cursor-help max-w-4xl"
                        aria-describedby="page-title"
                      >
                        {shortDescription || description}
                      </p>
                      <i
                        className="ri-information-line text-cyan-400 text-base hover:text-cyan-300 transition-colors flex-shrink-0 cursor-help mt-0.5"
                        aria-label="More information"
                        role="button"
                        tabIndex={0}
                      ></i>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 cursor-help">
                      <i
                        className="ri-information-line text-cyan-400 text-lg hover:text-cyan-300 transition-colors"
                        aria-label="More information"
                        role="button"
                        tabIndex={0}
                      ></i>
                      <span className="text-[#9ca3af] text-sm">
                        Hover for details
                      </span>
                    </div>
                  )}
                </Tooltip>
              </div>
            </div>
          </div>
          {/* Actions Row - Full width scrollable container */}
          {(actions || showTransportationCatalogLink) && (
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
              <div
                className="overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div
                  className="flex items-center gap-2 sm:gap-3 flex-nowrap"
                  style={{ width: "max-content", minWidth: "100%" }}
                >
                  {showTransportationCatalogLink && (
                    <Link
                      href="/transportation/capabilities"
                      className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm flex items-center gap-2"
                    >
                      <i className="ri-radar-line"></i>
                      Capability Catalog
                    </Link>
                  )}
                  {actions}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {memoizedStats && memoizedStats.length > 0 && (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4"
            role="region"
            aria-label="Statistics"
          >
            {memoizedStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-cyan-500/50 transition-all min-h-[100px]"
                role="article"
                aria-label={`${stat.label}: ${stat.value}`}
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <Tooltip content={stat.tooltip || stat.label} position="top">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <i
                        className={`${stat.icon} text-cyan-400 text-lg flex-shrink-0 mt-0.5`}
                        aria-hidden="true"
                      ></i>
                      <span className="text-xs text-[#9ca3af] leading-tight break-words">
                        {stat.label}
                      </span>
                    </div>
                  </Tooltip>
                  {stat.trend && (
                    <i
                      className={`ri-arrow-${
                        stat.trend === "up"
                          ? "up"
                          : stat.trend === "down"
                            ? "down"
                            : "right"
                      }-line text-${
                        stat.trend === "up"
                          ? "green"
                          : stat.trend === "down"
                            ? "red"
                            : "gray"
                      }-400 text-sm flex-shrink-0 mt-0.5`}
                    ></i>
                  )}
                </div>
                <div className="text-2xl font-bold text-white leading-none mt-1">
                  {stat.isCurrency && typeof stat.value === "number" ? (
                    <CurrencyDisplay
                      amount={stat.value}
                      size="lg"
                      variant="highlight"
                    />
                  ) : (
                    stat.value
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
});

PageTemplate.displayName = "PageTemplate";

export default PageTemplate;
