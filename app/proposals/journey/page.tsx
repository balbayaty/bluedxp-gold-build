/**
 * Journey Analysis Page
 * Comprehensive logistics journey touchpoint analysis and optimization
 */

"use client";

import { useMemo, useEffect, useState } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { logger } from "@/lib/services/observability/logger";
import { apiFetch } from "@/utils/apiFetch";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Dynamic import for the route map component
const InteractiveRouteMap = dynamic(
  () => import("@/components/proposals/InteractiveRouteMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-slate-800 rounded-xl animate-pulse" />
    ),
  },
);

// Dynamic import for Journey Intelligence Panel
const JourneyIntelligencePanel = dynamic(
  () => import("@/components/trade-compliance/JourneyIntelligencePanel"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-white/5 rounded-2xl animate-pulse" />
    ),
  },
);

// Dynamic import for Solution Intelligence Panel
const SolutionIntelligencePanel = dynamic(
  () => import("@/components/trade-compliance/SolutionIntelligencePanel"),
  { ssr: false },
);

interface Touchpoint {
  id: number;
  name: string;
  avgHours: number;
  percentage: number;
  category: "Origin" | "Transport" | "Customs" | "Destination";
  minTime: number;
  maxTime: number;
  bottleneckRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  optimizationPotential: number;
  keyIssues: string;
  recommendations: string;
}

const CATEGORY_COLORS = {
  Origin: "#6366F1",
  Transport: "#10B981",
  Customs: "#F59E0B",
  Destination: "#F97316",
};

const RISK_COLORS = {
  LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type LaneKey = "saudi-kuwait" | "saudi-uae" | "uae-qatar" | "gcc-multimodal";

type LaneConfig = {
  label: string;
  origin: {
    city: string;
    country: string;
    countryCode: string;
    lat?: number;
    lng?: number;
  };
  destination: {
    city: string;
    country: string;
    countryCode: string;
    lat?: number;
    lng?: number;
  };
  mode: "ROAD" | "SEA" | "AIR" | "RAIL" | "MULTIMODAL";
};

const LANE_CONFIG: Record<LaneKey, LaneConfig> = {
  "saudi-kuwait": {
    label: "Saudi Arabia → Kuwait",
    origin: {
      city: "Riyadh",
      country: "Saudi Arabia",
      countryCode: "SA",
      lat: 24.7136,
      lng: 46.6753,
    },
    destination: {
      city: "Kuwait City",
      country: "Kuwait",
      countryCode: "KW",
      lat: 29.3759,
      lng: 47.9774,
    },
    mode: "ROAD",
  },
  "saudi-uae": {
    label: "Saudi Arabia → UAE",
    origin: {
      city: "Riyadh",
      country: "Saudi Arabia",
      countryCode: "SA",
      lat: 24.7136,
      lng: 46.6753,
    },
    destination: {
      city: "Dubai",
      country: "United Arab Emirates",
      countryCode: "AE",
      lat: 25.2048,
      lng: 55.2708,
    },
    mode: "ROAD",
  },
  "uae-qatar": {
    label: "UAE → Qatar",
    origin: {
      city: "Dubai",
      country: "United Arab Emirates",
      countryCode: "AE",
      lat: 25.2048,
      lng: 55.2708,
    },
    destination: {
      city: "Doha",
      country: "Qatar",
      countryCode: "QA",
      lat: 25.2854,
      lng: 51.531,
    },
    mode: "ROAD",
  },
  "gcc-multimodal": {
    label: "GCC Multimodal",
    origin: {
      city: "Dammam",
      country: "Saudi Arabia",
      countryCode: "SA",
      lat: 26.4207,
      lng: 50.0888,
    },
    destination: {
      city: "Muscat",
      country: "Oman",
      countryCode: "OM",
      lat: 23.588,
      lng: 58.3829,
    },
    mode: "MULTIMODAL",
  },
};

type JourneyAnalysisApiResponse = {
  analysis: {
    id: string;
    shipmentId: string;
    journeyName: string;
    touchpoints: Array<{
      id: string;
      sequence: number;
      type: string;
      name: string;
      status: string;
      processingTime?: number;
      dwellTime?: number;
      handlingType?: string;
      customsStatus?: string;
      location: {
        address: { city: string; country: string; countryCode: string };
        coordinates?: { lat: number; lng: number };
      };
    }>;
    bottlenecks?: Array<{
      touchpointId: string;
      touchpointName: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      avgDelayHours: number;
      recommendations: string[];
    }>;
    insights?: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      recommendations: string[];
      estimatedSavings?: { time?: number; cost?: number; co2?: number };
    }>;
  };
};

export default function JourneyAnalysis() {
  const { hasModuleAccess } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<LaneKey>("saudi-kuwait");
  const [selectedTouchpoint, setSelectedTouchpoint] =
    useState<Touchpoint | null>(null);
  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [showSolutionIntelligence, setShowSolutionIntelligence] =
    useState(false);
  const [solutionLaneCode, setSolutionLaneCode] = useState("SA-KW-001");
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  // Listen for Solution Intelligence Panel open event
  useEffect(() => {
    const handleOpenSolutionIntelligence = (event: CustomEvent) => {
      setSolutionLaneCode(event.detail.laneCode || "SA-KW-001");
      setShowSolutionIntelligence(true);
    };

    window.addEventListener(
      "openSolutionIntelligence",
      handleOpenSolutionIntelligence as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openSolutionIntelligence",
        handleOpenSolutionIntelligence as EventListener,
      );
    };
  }, []);

  // Load dynamic touchpoints from the Transportation Journey Analysis engine (lane-agnostic)
  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    const lane = LANE_CONFIG[selectedRoute];
    const shipmentId = `lane:${selectedRoute}:${Date.now()}`;

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      setSelectedTouchpoint(null);
      try {
        const res = await apiFetch("/api/transportation/journey-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "analyze",
            shipmentId,
            mode: lane.mode,
            origin: {
              name: lane.origin.city,
              type: "FACILITY",
              address: {
                street: "",
                city: lane.origin.city,
                country: lane.origin.country,
                countryCode: lane.origin.countryCode,
                postalCode: "",
              },
              coordinates:
                lane.origin.lat && lane.origin.lng
                  ? { lat: lane.origin.lat, lng: lane.origin.lng }
                  : undefined,
            },
            destination: {
              name: lane.destination.city,
              type: "FACILITY",
              address: {
                street: "",
                city: lane.destination.city,
                country: lane.destination.country,
                countryCode: lane.destination.countryCode,
                postalCode: "",
              },
              coordinates:
                lane.destination.lat && lane.destination.lng
                  ? { lat: lane.destination.lat, lng: lane.destination.lng }
                  : undefined,
            },
            includeRootCauseAnalysis: false,
            includeOptimization: true,
            includePredictions: true,
          }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || `Failed to analyze lane (${res.status})`);
        }

        const data = (await res.json()) as JourneyAnalysisApiResponse;
        const analysis = data.analysis;

        const tpDuration = (
          tp: JourneyAnalysisApiResponse["analysis"]["touchpoints"][number],
        ) =>
          tp.processingTime ??
          tp.dwellTime ??
          (tp.type.includes("CUSTOMS") ? 24 : 4);

        const total =
          analysis.touchpoints.reduce((sum, tp) => sum + tpDuration(tp), 0) ||
          1;

        const bottleneckByTouchpointId = new Map(
          (analysis.bottlenecks || []).map((b) => [b.touchpointId, b]),
        );

        const inferred: Touchpoint[] = analysis.touchpoints.map((tp, idx) => {
          const hours = tpDuration(tp);
          const pct = (hours / total) * 100;
          const b = bottleneckByTouchpointId.get(tp.id);

          const category: Touchpoint["category"] = tp.type.includes("CUSTOMS")
            ? "Customs"
            : idx === 0
              ? "Origin"
              : idx === analysis.touchpoints.length - 1
                ? "Destination"
                : "Transport";

          const risk: Touchpoint["bottleneckRisk"] =
            b?.severity ||
            (tp.type.includes("CUSTOMS")
              ? "HIGH"
              : category === "Transport"
                ? "LOW"
                : "MEDIUM");

          const recommendations =
            b?.recommendations?.join("; ") ||
            (analysis.insights?.[0]?.recommendations?.join("; ") ??
              "Review touchpoint operations and documentation readiness.");

          const keyIssues = tp.type.includes("CUSTOMS")
            ? `Customs touchpoint (${tp.customsStatus || "PENDING"})`
            : tp.handlingType
              ? `Handling: ${tp.handlingType}`
              : "Operational variability and scheduling.";

          const optimizationPotential =
            typeof analysis.insights?.[0]?.estimatedSavings?.time === "number"
              ? Math.max(
                  0,
                  analysis.insights[0].estimatedSavings.time /
                    Math.max(1, analysis.touchpoints.length),
                )
              : risk === "CRITICAL"
                ? Math.max(6, hours * 0.25)
                : risk === "HIGH"
                  ? Math.max(2, hours * 0.15)
                  : Math.max(0.5, hours * 0.05);

          return {
            id: idx + 1,
            name: tp.name,
            avgHours: hours,
            percentage: pct,
            category,
            minTime: Math.max(0, hours * 0.7),
            maxTime: hours * 1.4,
            bottleneckRisk: risk,
            optimizationPotential,
            keyIssues,
            recommendations,
          };
        });

        setTouchpoints(inferred);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setLoadError(err.message);
        setTouchpoints([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [selectedRoute, hasAccess]);

  // Convert touchpoints to bottleneck format for intelligence panel
  const bottlenecks = useMemo(
    () =>
      touchpoints.map((tp) => ({
        id: tp.id.toString(),
        touchpoint: tp.name,
        avgHours: tp.avgHours,
        category: tp.category,
        severity: tp.bottleneckRisk,
      })),
    [],
  );

  const totalJourneyTime = useMemo(() =>
    touchpoints.reduce((sum, tp) => sum + tp.avgHours, 0),
  );

  const categoryData = useMemo(() => {
    const byCategory = touchpoints.reduce(
      (acc, tp) => {
        if (!acc[tp.category]) {
          acc[tp.category] = { hours: 0, count: 0 };
        }
        acc[tp.category].hours += tp.avgHours;
        acc[tp.category].count += 1;
        return acc;
      },
      {} as Record<string, { hours: number; count: number }>,
    );

    return Object.entries(byCategory).map(([category, data]) => ({
      name: category,
      value: data.hours,
      percentage: ((data.hours / totalJourneyTime) * 100).toFixed(1),
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }));
  }, [totalJourneyTime, touchpoints]);

  const optimizationOpportunities = useMemo(
    () => [
      {
        title: "Extend Kuwait Customs Hours",
        impact: "High",
        savings: "24.5 hours",
        category: "QUICK_WIN",
        description: "Negotiate with authorities for extended processing hours",
      },
      {
        title: "Scheduled Arrival Windows",
        impact: "Medium",
        savings: "7 hours",
        category: "QUICK_WIN",
        description: "Coordinate arrivals within warehouse operating hours",
      },
      {
        title: "Digital Documentation",
        impact: "Medium",
        savings: "2.5 hours",
        category: "MEDIUM_TERM",
        description: "Implement pre-clearance and digital document submission",
      },
      {
        title: "Trusted Shipper Program",
        impact: "Medium",
        savings: "2 hours",
        category: "LONG_TERM",
        description: "Establish AEO status for expedited customs clearance",
      },
    ],
    [],
  );

  // CO2 Emissions Data
  const emissionsData = useMemo(
    () => ({
      totalCO2: 2.45,
      bySegment: [
        { segment: "Origin to Saudi Customs", co2: 1.35 },
        { segment: "Border Crossing", co2: 0.15 },
        { segment: "Kuwait to Destination", co2: 0.45 },
        { segment: "Idle/Waiting", co2: 0.5 },
      ],
      reduction: 18,
      greenInitiatives: [
        "Route optimization",
        "Euro 6 vehicles",
        "Driver training",
      ],
      comparison: {
        current: 2.45,
        baseline: 2.99,
        target: 2.0,
      },
    }),
    [],
  );

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view journey analysis"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to view journey analysis.
              Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Journey Analysis (Lane Dashboard)"
        description="Lane-level journey optimization dashboard powered by the dynamic Journey Analysis engine."
        icon="ri-route-line"
      >
        <div className="space-y-6">
          {/* Data source banner */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-sm text-cyan-100">
                <span className="font-semibold">Data source:</span> generated
                dynamically from the Transportation Journey Analysis engine
                (lane-agnostic).
              </div>
              {loading ? (
                <div className="text-sm text-cyan-200">
                  Loading lane analysis…
                </div>
              ) : (
                <div className="text-xs text-cyan-200/80">
                  Tip: use Transportation → Journey Analysis (Dynamic) for
                  shipment-level analysis.
                </div>
              )}
            </div>
            {loadError && (
              <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                Failed to load lane analysis: {loadError}
              </div>
            )}
          </div>

          {/* Route Selection & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                <i className="ri-route-line mr-1 text-cyan-400"></i>
                Select Route
              </label>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value as LaneKey)}
                className="w-full px-4 py-2.5 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="saudi-kuwait" className="bg-[#1f2937]">
                  {LANE_CONFIG["saudi-kuwait"].label}
                </option>
                <option value="saudi-uae" className="bg-[#1f2937]">
                  {LANE_CONFIG["saudi-uae"].label}
                </option>
                <option value="uae-qatar" className="bg-[#1f2937]">
                  {LANE_CONFIG["uae-qatar"].label}
                </option>
                <option value="gcc-multimodal" className="bg-[#1f2937]">
                  {LANE_CONFIG["gcc-multimodal"].label}
                </option>
              </select>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Total Journey Time</p>
              <p className="text-3xl font-bold">
                {totalJourneyTime.toFixed(1)}h
              </p>
              <p className="text-sm opacity-80">
                {(totalJourneyTime / 24).toFixed(1)} days
              </p>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Critical Bottlenecks</p>
              <p className="text-3xl font-bold">
                {
                  touchpoints.filter((t) => t.bottleneckRisk === "CRITICAL")
                    .length
                }
              </p>
              <p className="text-sm opacity-80">
                {touchpoints.filter((t) => t.bottleneckRisk === "HIGH").length}{" "}
                high risk
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
              <p className="text-sm opacity-80">Optimization Potential</p>
              <p className="text-3xl font-bold">
                {touchpoints
                  .reduce((sum, t) => sum + t.optimizationPotential, 0)
                  .toFixed(1)}
                h
              </p>
              <p className="text-sm opacity-80">
                {(
                  (touchpoints.reduce(
                    (sum, t) => sum + t.optimizationPotential,
                    0,
                  ) /
                    totalJourneyTime) *
                  100
                ).toFixed(0)}
                % reduction
              </p>
            </div>
          </div>

          {/* AI Intelligence CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                  <i className="ri-brain-line text-2xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    AI-Powered Customs Intelligence
                  </h3>
                  <p className="text-[#9ca3af] text-sm max-w-2xl">
                    Unlock deep insights on your{" "}
                    <strong className="text-white">lane bottlenecks</strong>.
                    Get AEO program recommendations, certificate optimization,
                    regulatory updates, and ROI analysis for trade facilitation
                    programs.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                      Root Cause Analysis
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                      AEO Programs
                    </span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                      Certificates
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      ROI Calculator
                    </span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      Regulatory Updates
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIntelligencePanel(true)}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-cyan-500/30 flex items-center gap-3 whitespace-nowrap"
              >
                <i className="ri-lightbulb-flash-line text-xl"></i>
                Analyze & Optimize
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </motion.div>

          {/* Interactive Route Map - Full Width Professional View */}
          <InteractiveRouteMap
            showEmissions={true}
            height={520}
            onTouchpointClick={(tp) => {
              logger.debug("Touchpoint clicked", undefined, {
                module: "proposals",
                service: "journey",
                touchpointId: tp.id,
              });
            }}
          />

          {/* Sustainability & Emissions Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Emissions Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <i className="ri-leaf-line text-2xl text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">CO₂ Emissions</h3>
                  <p className="text-sm text-[#9ca3af]">Per journey analysis</p>
                </div>
              </div>

              <div className="text-center py-4">
                <p className="text-5xl font-bold text-white">
                  {emissionsData.totalCO2}
                </p>
                <p className="text-[#9ca3af] mt-1">Metric Tons CO₂</p>
              </div>

              <div className="space-y-3 mt-4">
                {emissionsData.bySegment.map((seg, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#9ca3af]">{seg.segment}</span>
                    <span className="font-medium text-white">{seg.co2} MT</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Emissions Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-line-chart-line text-cyan-400"></i>
                Reduction Progress
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#9ca3af]">Current vs Baseline</span>
                    <span className="font-bold text-green-400">
                      -{emissionsData.reduction}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${100 - emissionsData.reduction}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center mt-6">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-lg font-bold text-[#6b7280] line-through">
                      {emissionsData.comparison.baseline}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-1">Baseline</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-lg font-bold text-green-400">
                      {emissionsData.comparison.current}
                    </p>
                    <p className="text-xs text-green-400 mt-1">Current</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                    <p className="text-lg font-bold text-cyan-400">
                      {emissionsData.comparison.target}
                    </p>
                    <p className="text-xs text-cyan-400 mt-1">Target</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-[#9ca3af]">
                  <i className="ri-arrow-down-line text-green-400"></i>
                  <span>On track to meet 2025 targets</span>
                </div>
              </div>
            </motion.div>

            {/* Green Initiatives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-plant-line text-green-400"></i>
                Green Initiatives
              </h3>

              <div className="space-y-3">
                {emissionsData.greenInitiatives.map((initiative, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20"
                  >
                    <i className="ri-checkbox-circle-fill text-green-400" />
                    <span className="text-sm text-green-400">{initiative}</span>
                  </motion.div>
                ))}
                <div className="flex items-center gap-3 p-3 border border-dashed border-white/20 rounded-lg text-[#6b7280] hover:text-white hover:border-cyan-500/50 transition-colors cursor-pointer">
                  <i className="ri-add-circle-line" />
                  <span className="text-sm">Add new initiative</span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                <i className="ri-file-chart-line" />
                Generate ESG Report
              </button>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Touchpoint Time Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-bar-chart-horizontal-line text-cyan-400"></i>
                Time Distribution by Touchpoint
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={touchpoints} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      type="number"
                      unit="h"
                      tick={{ fill: "#9ca3af", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fill: "#9ca3af", fontSize: 10 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(2)} hours`,
                        "Average Time",
                      ]}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                      labelStyle={{ color: "#9ca3af" }}
                    />
                    <Bar
                      dataKey="avgHours"
                      fill="url(#barGradient)"
                      radius={[0, 8, 8, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-pie-chart-2-line text-cyan-400"></i>
                Time by Category
              </h3>
              <div className="h-80 flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `${value.toFixed(1)} hours`,
                        "Time",
                      ]}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {categoryData.map((cat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></div>
                      <div>
                        <p className="font-medium text-white">{cat.name}</p>
                        <p className="text-sm text-[#9ca3af]">
                          {cat.value.toFixed(1)}h ({cat.percentage}%)
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Touchpoint Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <i className="ri-list-check-2 text-cyan-400"></i>
                Touchpoint Analysis
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                Click on any touchpoint to view detailed analysis
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Touchpoint
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Avg Time
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Range
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Risk
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Savings
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {touchpoints.map((tp, index) => (
                    <motion.tr
                      key={tp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => setSelectedTouchpoint(tp)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: CATEGORY_COLORS[tp.category],
                            }}
                          ></div>
                          <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {tp.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[tp.category]}20`,
                            color: CATEGORY_COLORS[tp.category],
                          }}
                        >
                          {tp.category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-white font-semibold">
                          {tp.avgHours.toFixed(2)}h
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {tp.percentage.toFixed(1)}% of total
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#9ca3af]">
                        {tp.minTime.toFixed(1)} - {tp.maxTime.toFixed(1)}h
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            tp.bottleneckRisk === "CRITICAL"
                              ? "bg-red-500/20 text-red-400"
                              : tp.bottleneckRisk === "HIGH"
                                ? "bg-orange-500/20 text-orange-400"
                                : tp.bottleneckRisk === "MEDIUM"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {tp.bottleneckRisk}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-green-400">
                          {tp.optimizationPotential.toFixed(1)}h
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="p-2 hover:bg-cyan-500/20 rounded-lg text-[#9ca3af] hover:text-cyan-400 transition-colors">
                          <i className="ri-arrow-right-s-line text-lg" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Optimization Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i className="ri-rocket-2-line text-cyan-400"></i>
              Optimization Opportunities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {optimizationOpportunities.map((opp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer ${
                    opp.category === "QUICK_WIN"
                      ? "border-green-500/30 bg-green-500/10 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
                      : opp.category === "MEDIUM_TERM"
                        ? "border-blue-500/30 bg-blue-500/10 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
                        : "border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        opp.category === "QUICK_WIN"
                          ? "bg-green-500/20 text-green-400"
                          : opp.category === "MEDIUM_TERM"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      <i
                        className={`mr-1 ${
                          opp.category === "QUICK_WIN"
                            ? "ri-flashlight-line"
                            : opp.category === "MEDIUM_TERM"
                              ? "ri-time-line"
                              : "ri-calendar-line"
                        }`}
                      ></i>
                      {opp.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        opp.impact === "High"
                          ? "text-red-400"
                          : opp.impact === "Medium"
                            ? "text-yellow-400"
                            : "text-green-400"
                      }`}
                    >
                      {opp.impact}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white mb-2">{opp.title}</h4>
                  <p className="text-sm text-[#9ca3af] mb-4 line-clamp-2">
                    {opp.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <i className="ri-timer-flash-line text-green-400" />
                      <span className="text-sm font-bold text-green-400">
                        Save {opp.savings}
                      </span>
                    </div>
                    <i className="ri-arrow-right-line text-[#6b7280]"></i>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selected Touchpoint Detail Modal */}
          {selectedTouchpoint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedTouchpoint(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-[#1f2937] backdrop-blur-xl rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedTouchpoint.name}
                    </h3>
                    <span
                      className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[selectedTouchpoint.category]}20`,
                        color: CATEGORY_COLORS[selectedTouchpoint.category],
                      }}
                    >
                      {selectedTouchpoint.category}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTouchpoint(null)}
                    className="p-2 hover:bg-white/10 rounded-lg text-[#9ca3af] hover:text-white transition-colors"
                  >
                    <i className="ri-close-line text-xl" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-2xl font-bold text-white">
                      {selectedTouchpoint.avgHours.toFixed(2)}h
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">Average</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-2xl font-bold text-white">
                      {selectedTouchpoint.minTime.toFixed(1)}h
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">Minimum</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-2xl font-bold text-white">
                      {selectedTouchpoint.maxTime.toFixed(1)}h
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">Maximum</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <i className="ri-error-warning-line text-yellow-400"></i>
                      Key Issues
                    </h4>
                    <p className="text-sm text-[#9ca3af]">
                      {selectedTouchpoint.keyIssues}
                    </p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                      <i className="ri-lightbulb-line text-cyan-400"></i>
                      Recommendations
                    </h4>
                    <p className="text-sm text-[#9ca3af]">
                      {selectedTouchpoint.recommendations}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <span className="text-sm text-green-400">
                      Optimization Potential
                    </span>
                    <span className="text-lg font-bold text-green-400">
                      {selectedTouchpoint.optimizationPotential.toFixed(1)}{" "}
                      hours
                    </span>
                  </div>

                  {/* Link to Intelligence Panel */}
                  <button
                    onClick={() => {
                      setSelectedTouchpoint(null);
                      setShowIntelligencePanel(true);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-brain-line"></i>
                    Deep Analysis with AI Intelligence
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Journey Intelligence Panel Modal */}
          <AnimatePresence>
            {showIntelligencePanel && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
                onClick={() => setShowIntelligencePanel(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="w-full max-w-6xl my-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <JourneyIntelligencePanel
                    originCountry={
                      LANE_CONFIG[selectedRoute].origin.countryCode
                    }
                    destinationCountry={
                      LANE_CONFIG[selectedRoute].destination.countryCode
                    }
                    bottlenecks={bottlenecks}
                    productCategory="CHEMICALS"
                    annualShipments={100}
                    averageShipmentValue={50000}
                    onClose={() => setShowIntelligencePanel(false)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Solution Intelligence Panel */}
          <AnimatePresence>
            {showSolutionIntelligence && (
              <SolutionIntelligencePanel
                laneCode={solutionLaneCode}
                onClose={() => setShowSolutionIntelligence(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
