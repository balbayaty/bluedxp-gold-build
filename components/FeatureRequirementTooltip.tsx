"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WMSFeature,
  FeatureStatus,
  FEATURE_STATUS_CONFIG,
  calculateFeatureReadiness,
  FeatureReadinessAssessment,
} from "@/types/featureRegistry";

interface FeatureRequirementTooltipProps {
  feature: WMSFeature;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  showBadge?: boolean;
  showOnClick?: boolean;
}

type TabType = "requirements" | "metrics" | "benchmark" | "config";

/**
 * Feature Requirement Tooltip Component
 * Shows detailed feature requirements, status, and benchmark info on hover
 */
export default function FeatureRequirementTooltip({
  feature,
  children,
  position = "right",
  showBadge = true,
  showOnClick = false,
}: FeatureRequirementTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("requirements");
  const [readiness, setReadiness] = useState<FeatureReadinessAssessment | null>(
    null,
  );
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);

  const status = FEATURE_STATUS_CONFIG[feature.status];

  useEffect(() => {
    if (isVisible && !readiness) {
      setReadiness(calculateFeatureReadiness(feature));
    }
  }, [isVisible, feature, readiness]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Calculate tooltip position dynamically
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipContentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
      const padding = 12;
      const viewportPadding = 10;

      let x = 0;
      let y = 0;
      let actualPosition = position;

      // Smart positioning: adjust if preferred position doesn't fit
      const spaceRight = window.innerWidth - triggerRect.right;
      const spaceLeft = triggerRect.left;
      const spaceBottom = window.innerHeight - triggerRect.bottom;
      const spaceTop = triggerRect.top;

      // Auto-adjust position if needed
      if (
        position === "right" &&
        spaceRight < tooltipRect.width + padding &&
        spaceLeft > spaceRight
      ) {
        actualPosition = "left";
      } else if (
        position === "left" &&
        spaceLeft < tooltipRect.width + padding &&
        spaceRight > spaceLeft
      ) {
        actualPosition = "right";
      } else if (
        position === "bottom" &&
        spaceBottom < tooltipRect.height + padding &&
        spaceTop > spaceBottom
      ) {
        actualPosition = "top";
      } else if (
        position === "top" &&
        spaceTop < tooltipRect.height + padding &&
        spaceBottom > spaceTop
      ) {
        actualPosition = "bottom";
      }

      switch (actualPosition) {
        case "top":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.top - tooltipRect.height - padding;
          break;
        case "bottom":
          x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          y = triggerRect.bottom + padding;
          break;
        case "left":
          x = triggerRect.left - tooltipRect.width - padding;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
        case "right":
        default:
          x = triggerRect.right + padding;
          y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Keep tooltip within viewport bounds
      x = Math.max(
        viewportPadding,
        Math.min(x, window.innerWidth - tooltipRect.width - viewportPadding),
      );
      y = Math.max(
        viewportPadding,
        Math.min(y, window.innerHeight - tooltipRect.height - viewportPadding),
      );

      setTooltipPosition({ x, y });
    }
  }, [isVisible, position]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      if (triggerRef.current && tooltipContentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipContentRef.current.getBoundingClientRect();
        const padding = 12;
        const viewportPadding = 10;

        let x = 0;
        let y = 0;
        let actualPosition = position;

        // Smart positioning: adjust if preferred position doesn't fit
        const spaceRight = window.innerWidth - triggerRect.right;
        const spaceLeft = triggerRect.left;
        const spaceBottom = window.innerHeight - triggerRect.bottom;
        const spaceTop = triggerRect.top;

        // Auto-adjust position if needed
        if (
          position === "right" &&
          spaceRight < tooltipRect.width + padding &&
          spaceLeft > spaceRight
        ) {
          actualPosition = "left";
        } else if (
          position === "left" &&
          spaceLeft < tooltipRect.width + padding &&
          spaceRight > spaceLeft
        ) {
          actualPosition = "right";
        } else if (
          position === "bottom" &&
          spaceBottom < tooltipRect.height + padding &&
          spaceTop > spaceBottom
        ) {
          actualPosition = "top";
        } else if (
          position === "top" &&
          spaceTop < tooltipRect.height + padding &&
          spaceBottom > spaceTop
        ) {
          actualPosition = "bottom";
        }

        switch (actualPosition) {
          case "top":
            x =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            y = triggerRect.top - tooltipRect.height - padding;
            break;
          case "bottom":
            x =
              triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            y = triggerRect.bottom + padding;
            break;
          case "left":
            x = triggerRect.left - tooltipRect.width - padding;
            y =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
          case "right":
          default:
            x = triggerRect.right + padding;
            y =
              triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
        }

        x = Math.max(
          viewportPadding,
          Math.min(x, window.innerWidth - tooltipRect.width - viewportPadding),
        );
        y = Math.max(
          viewportPadding,
          Math.min(
            y,
            window.innerHeight - tooltipRect.height - viewportPadding,
          ),
        );

        setTooltipPosition({ x, y });
      }
    };

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, position]);

  const showTooltip = () => {
    if (showOnClick) return;
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const hideTooltip = () => {
    if (showOnClick) return;
    // Clear any pending show timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Add a small delay before hiding to allow mouse movement to tooltip
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      hideTimeoutRef.current = null;
    }, 200);
  };

  const keepTooltipOpen = () => {
    // Clear any pending hide timeout when mouse enters tooltip
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const toggleTooltip = () => {
    if (showOnClick) {
      setIsVisible(!isVisible);
    }
  };

  // Click outside to close
  useEffect(() => {
    if (!showOnClick || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        tooltipContentRef.current &&
        !tooltipContentRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOnClick, isVisible]);

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-yellow-400";
    if (score >= 20) return "text-orange-400";
    return "text-red-400";
  };

  const getBenchmarkIcon = (hasFeature: boolean) => {
    return hasFeature
      ? "ri-checkbox-circle-fill text-green-400"
      : "ri-close-circle-fill text-red-400";
  };

  const getMaturityColor = (level: string) => {
    switch (level) {
      case "WORLD_CLASS":
        return "text-purple-400 bg-purple-500/20";
      case "ADVANCED":
        return "text-cyan-400 bg-cyan-500/20";
      case "STANDARD":
        return "text-blue-400 bg-blue-500/20";
      case "BASIC":
        return "text-gray-400 bg-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={toggleTooltip}
      >
        {/* Wrapped content */}
        <div className="relative">
          {children}

          {/* Status Badge */}
          {showBadge && (
            <span
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${status.bgColor} ${status.borderColor} border flex items-center justify-center cursor-help z-10`}
              title={status.label}
            >
              <i className={`${status.icon} text-[10px] ${status.color}`}></i>
            </span>
          )}
        </div>
      </div>

      {/* Tooltip Content - Fixed positioning */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipContentRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[9999] w-[460px] pointer-events-auto"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              opacity:
                tooltipPosition.x === 0 && tooltipPosition.y === 0 ? 0 : 1,
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={keepTooltipOpen}
            onMouseLeave={hideTooltip}
          >
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border-b border-[#1e293b]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-[#9ca3af] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color} flex items-center gap-1.5`}
                  >
                    <i className={status.icon}></i>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              {readiness && (
                <div className="grid grid-cols-5 gap-1 p-3 bg-[#1e293b]/50 border-b border-[#1e293b]">
                  <div className="text-center p-2 rounded-lg bg-[#0f172a]/50">
                    <div
                      className={`text-xl font-bold ${getReadinessColor(readiness.overallScore)}`}
                    >
                      {readiness.overallScore}%
                    </div>
                    <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">
                      Ready
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0f172a]/50">
                    <div className="text-xl font-bold text-white">
                      {feature.metrics.weight}/10
                    </div>
                    <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">
                      Weight
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0f172a]/50">
                    <div className="text-xl font-bold text-cyan-400">
                      {feature.metrics.ease}/10
                    </div>
                    <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">
                      Ease
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0f172a]/50">
                    <div className="text-xl font-bold text-green-400">
                      {feature.metrics.roi}/10
                    </div>
                    <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">
                      ROI
                    </div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[#0f172a]/50">
                    <div
                      className={`text-sm font-bold ${
                        feature.metrics.riskLevel === "LOW"
                          ? "text-green-400"
                          : feature.metrics.riskLevel === "MEDIUM"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {feature.metrics.riskLevel}
                    </div>
                    <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">
                      Risk
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-[#1e293b]">
                {(
                  [
                    "requirements",
                    "config",
                    "benchmark",
                    "metrics",
                  ] as TabType[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                      activeTab === tab
                        ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5"
                        : "text-[#9ca3af] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-[320px] overflow-y-auto custom-scrollbar">
                {/* Requirements Tab */}
                {activeTab === "requirements" && (
                  <div className="space-y-4">
                    {/* Data Requirements */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <i className="ri-database-2-line text-cyan-400"></i>
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                          Data Required
                        </span>
                      </div>
                      <div className="space-y-2">
                        {feature.requirements.data.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-[#1e293b]/50 rounded-lg border border-[#1e293b] hover:border-cyan-500/30 transition-colors"
                          >
                            <div className="mt-0.5">
                              {item.currentStatus === "AVAILABLE" ? (
                                <i className="ri-checkbox-circle-fill text-green-400"></i>
                              ) : item.currentStatus === "PARTIAL" ? (
                                <i className="ri-indeterminate-circle-fill text-yellow-400"></i>
                              ) : (
                                <i className="ri-close-circle-fill text-red-400"></i>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm text-white font-medium">
                                  {item.item}
                                </span>
                                {item.required && (
                                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-medium">
                                    Required
                                  </span>
                                )}
                                {item.mockAvailable && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-medium">
                                    Mock OK
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#9ca3af] leading-relaxed">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-1 mt-1.5">
                                <i className="ri-arrow-right-s-line text-cyan-400 text-xs"></i>
                                <span className="text-xs text-cyan-400/80">
                                  {item.source.replace(/_/g, " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integration Requirements */}
                    {feature.requirements.integrations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <i className="ri-plug-line text-purple-400"></i>
                          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                            Integrations
                          </span>
                        </div>
                        <div className="space-y-2">
                          {feature.requirements.integrations.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 bg-[#1e293b]/50 rounded-lg border border-[#1e293b]"
                            >
                              <div className="mt-0.5">
                                {item.currentStatus === "CONNECTED" ? (
                                  <i className="ri-checkbox-circle-fill text-green-400"></i>
                                ) : item.currentStatus === "CONFIGURED" ? (
                                  <i className="ri-indeterminate-circle-fill text-yellow-400"></i>
                                ) : (
                                  <i className="ri-close-circle-fill text-red-400"></i>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm text-white font-medium">
                                    {item.item}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-[#374151] text-[#9ca3af] rounded text-[10px]">
                                    {item.type}
                                  </span>
                                </div>
                                <p className="text-xs text-[#9ca3af]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hardware Requirements */}
                    {feature.requirements.hardware.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <i className="ri-cpu-line text-orange-400"></i>
                          <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                            Hardware
                          </span>
                        </div>
                        <div className="space-y-2">
                          {feature.requirements.hardware.map((item) => (
                            <div
                              key={item.id}
                              className="p-3 bg-[#1e293b]/50 rounded-lg border border-[#1e293b]"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white font-medium">
                                  {item.item}
                                </span>
                                {item.estimatedCost && (
                                  <span className="text-xs text-green-400">
                                    {item.estimatedCost}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#9ca3af] mb-2">
                                {item.description}
                              </p>
                              {item.alternatives &&
                                item.alternatives.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[10px] text-[#9ca3af]">
                                      Alternatives:
                                    </span>
                                    {item.alternatives.map((alt, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-[#374151] text-[#9ca3af] rounded text-[10px]"
                                      >
                                        {alt}
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Configuration Tab */}
                {activeTab === "config" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="ri-settings-3-line text-purple-400"></i>
                      <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                        Configuration Steps
                      </span>
                    </div>
                    {feature.requirements.configuration.map((step) => (
                      <div
                        key={step.step}
                        className="flex items-start gap-3 p-3 bg-[#1e293b]/50 rounded-lg border border-[#1e293b] hover:border-purple-500/30 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold flex items-center justify-center shrink-0">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white mb-2">
                            {step.action}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <i className="ri-link text-purple-400 text-xs"></i>
                              <span className="text-xs text-purple-400">
                                {step.where}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  step.complexity === "EASY"
                                    ? "bg-green-500/20 text-green-400"
                                    : step.complexity === "MEDIUM"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {step.complexity}
                              </span>
                              <span className="text-[10px] text-[#9ca3af]">
                                {step.estimatedTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Estimated Total */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Estimated Total Effort
                        </span>
                        <span className="text-lg font-bold text-white">
                          {feature.metrics.estimatedEffort}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Tab */}
                {activeTab === "benchmark" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="ri-bar-chart-grouped-line text-green-400"></i>
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                        Industry Comparison
                      </span>
                    </div>
                    {Object.entries(feature.benchmark).map(([system, data]) => (
                      <div
                        key={system}
                        className="p-3 bg-[#1e293b]/50 rounded-lg border border-[#1e293b] hover:border-[#374151] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <i
                              className={getBenchmarkIcon(data.hasFeature)}
                            ></i>
                            <span className="text-sm text-white font-medium capitalize">
                              {system}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${getMaturityColor(data.maturityLevel)}`}
                          >
                            {data.maturityLevel.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-[#9ca3af] mb-2">
                          {data.notes}
                        </p>
                        {data.limitations && data.limitations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {data.limitations.map((lim, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-[10px]"
                              >
                                {lim}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Metrics Tab */}
                {activeTab === "metrics" && readiness && (
                  <div className="space-y-4">
                    {/* Readiness Breakdown */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <i className="ri-pie-chart-line text-cyan-400"></i>
                        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
                          Readiness Breakdown
                        </span>
                      </div>
                      <div className="space-y-3">
                        {[
                          {
                            label: "Data Readiness",
                            value: readiness.dataReadiness,
                            icon: "ri-database-2-line",
                          },
                          {
                            label: "Integration Readiness",
                            value: readiness.integrationReadiness,
                            icon: "ri-plug-line",
                          },
                          {
                            label: "Configuration",
                            value: readiness.configurationReadiness,
                            icon: "ri-settings-3-line",
                          },
                          {
                            label: "Hardware",
                            value: readiness.hardwareReadiness,
                            icon: "ri-cpu-line",
                          },
                        ].map((item) => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <i
                                  className={`${item.icon} text-[#9ca3af] text-xs`}
                                ></i>
                                <span className="text-xs text-[#9ca3af]">
                                  {item.label}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-medium ${getReadinessColor(item.value)}`}
                              >
                                {item.value}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className={`h-full rounded-full ${
                                  item.value >= 80
                                    ? "bg-green-500"
                                    : item.value >= 60
                                      ? "bg-cyan-500"
                                      : item.value >= 40
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time to Production */}
                    <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-lg border border-cyan-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#9ca3af]">
                          Estimated Time to Production
                        </span>
                        <span className="text-lg font-bold text-white">
                          {readiness.estimatedTimeToProduction}
                        </span>
                      </div>
                    </div>

                    {/* Dependencies */}
                    {feature.metrics.dependencies.length > 0 && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-2">
                          Dependencies
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {feature.metrics.dependencies.map((dep) => (
                            <span
                              key={dep}
                              className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs"
                            >
                              <i className="ri-link mr-1"></i>
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {readiness.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs text-[#9ca3af] mb-2">
                          Recommendations
                        </div>
                        <div className="space-y-1.5">
                          {readiness.recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs"
                            >
                              <i className="ri-lightbulb-line text-yellow-400 mt-0.5"></i>
                              <span className="text-[#9ca3af]">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - Examples & Benefits */}
              <div className="p-4 border-t border-[#1e293b] bg-gradient-to-r from-[#1e293b]/50 to-[#0f172a]">
                <div className="grid grid-cols-2 gap-4">
                  {feature.examples.length > 0 && (
                    <div>
                      <div className="text-[10px] text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <i className="ri-lightbulb-line"></i>
                        Examples
                      </div>
                      <ul className="space-y-1">
                        {feature.examples.slice(0, 3).map((ex, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-[#9ca3af] flex items-start gap-1.5"
                          >
                            <i className="ri-arrow-right-s-line text-green-400 mt-0.5"></i>
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feature.benefits.length > 0 && (
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <i className="ri-trophy-line"></i>
                        Benefits
                      </div>
                      <ul className="space-y-1">
                        {feature.benefits.slice(0, 3).map((benefit, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-[#9ca3af] flex items-start gap-1.5"
                          >
                            <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Simple status indicator without full tooltip
 */
export function FeatureStatusIndicator({ status }: { status: FeatureStatus }) {
  const config = FEATURE_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
      title={config.description}
    >
      <i className={config.icon}></i>
      {config.label}
    </span>
  );
}

/**
 * Feature readiness score badge
 */
export function FeatureReadinessBadge({ feature }: { feature: WMSFeature }) {
  const readiness = calculateFeatureReadiness(feature);

  const getColor = (score: number) => {
    if (score >= 80)
      return "bg-green-500/20 text-green-400 border-green-500/30";
    if (score >= 60) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    if (score >= 40)
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getColor(readiness.overallScore)}`}
    >
      {readiness.overallScore}% Ready
    </span>
  );
}
