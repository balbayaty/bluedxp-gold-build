"use client";

/**
 * Interactive Route Map - Enterprise Grade
 * Professional journey visualization with real-time tracking aesthetic
 * Dark theme, animated, with emissions overlay
 *
 * Industry-grade nomenclature aligned with IATA, FIATA & WCO standards
 * Features: Multi-route selection, BCP details, trade programs, live status
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SA_KW_TRADE_LANES,
  SA_KW_BORDER_CROSSINGS,
  GCC_COUNTRIES,
  TradeLane,
  TradeLaneRoute,
  BorderCrossingPoint,
} from "@/types/trade-lanes";

interface InteractiveRouteMapProps {
  showEmissions?: boolean;
  height?: number;
  onTouchpointClick?: (touchpoint: Touchpoint) => void;
  laneCode?: string;
}

interface Touchpoint {
  id: string;
  name: string;
  shortName: string;
  category: "Origin" | "Transport" | "Customs" | "Destination";
  avgHours: number;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "DELAYED";
  position: { x: number; y: number };
  emissions?: number;
  bottleneckRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description?: string;
  bcpId?: string; // Link to BCP data
}

interface RouteSegment {
  id: string;
  from: string;
  to: string;
  mode: "TRUCK" | "SHIP" | "AIR" | "RAIL";
  distance: number;
  duration: number;
  emissions: number;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
}

// Route configurations for different routes
const routeConfigs: Record<
  string,
  { touchpoints: Touchpoint[]; segments: RouteSegment[] }
> = {
  "SA-KW-001-A": {
    touchpoints: [
      {
        id: "origin",
        name: "POL: Shipper Facility Gate",
        shortName: "POL",
        category: "Origin",
        avgHours: 1.89,
        status: "COMPLETED",
        position: { x: 50, y: 200 },
        emissions: 0,
        bottleneckRisk: "LOW",
        description:
          "Point of Loading - Inbound gate processing & queue management",
      },
      {
        id: "loading",
        name: "Loading Bay Operations (LBO)",
        shortName: "LBO",
        category: "Origin",
        avgHours: 6.54,
        status: "COMPLETED",
        position: { x: 150, y: 160 },
        emissions: 0.1,
        bottleneckRisk: "MEDIUM",
        description: "Cargo stuffing, weight verification & seal application",
      },
      {
        id: "documentation",
        name: "Export Documentation Hub (EDH)",
        shortName: "EDH",
        category: "Origin",
        avgHours: 5.28,
        status: "COMPLETED",
        position: { x: 250, y: 200 },
        emissions: 0,
        bottleneckRisk: "MEDIUM",
        description: "B/L, COA, COO, MSDS verification & stamp procurement",
      },
      {
        id: "transit1",
        name: "Linehaul: Origin → Export BCP",
        shortName: "LH-EXP",
        category: "Transport",
        avgHours: 11.05,
        status: "IN_PROGRESS",
        position: { x: 380, y: 140 },
        emissions: 1.35,
        bottleneckRisk: "LOW",
        description: "Road freight transit to Border Crossing Point (BCP)",
      },
      {
        id: "saudi-customs",
        name: "Export BCP: Al Khafji",
        shortName: "SA-KHF",
        category: "Customs",
        avgHours: 7.21,
        status: "PENDING",
        position: { x: 500, y: 180 },
        emissions: 0.15,
        bottleneckRisk: "MEDIUM",
        description: "Saudi Customs - Export declaration & inspection",
        bcpId: "bcp-sa-khafji",
      },
      {
        id: "kuwait-customs",
        name: "Import BCP: Nuwaiseeb",
        shortName: "KW-NWS",
        category: "Customs",
        avgHours: 55.43,
        status: "DELAYED",
        position: { x: 620, y: 200 },
        emissions: 0.5,
        bottleneckRisk: "CRITICAL",
        description: "Kuwait Customs - 5hr daily ops ⚠️",
        bcpId: "bcp-kw-nuwaiseeb",
      },
      {
        id: "transit2",
        name: "Linehaul: Import BCP → POD",
        shortName: "LH-POD",
        category: "Transport",
        avgHours: 2.37,
        status: "PENDING",
        position: { x: 750, y: 160 },
        emissions: 0.45,
        bottleneckRisk: "LOW",
        description: "Final mile delivery to Point of Destination",
      },
      {
        id: "destination",
        name: "POD: Consignee Receiving Dock",
        shortName: "POD",
        category: "Destination",
        avgHours: 8.83,
        status: "PENDING",
        position: { x: 870, y: 200 },
        emissions: 0,
        bottleneckRisk: "MEDIUM",
        description: "Cargo destuffing, GRN issuance & inventory receipt",
      },
    ],
    segments: [
      {
        id: "s1",
        from: "origin",
        to: "loading",
        mode: "TRUCK",
        distance: 0.5,
        duration: 0.5,
        emissions: 0.01,
        status: "COMPLETED",
      },
      {
        id: "s2",
        from: "loading",
        to: "documentation",
        mode: "TRUCK",
        distance: 0.2,
        duration: 0.3,
        emissions: 0.005,
        status: "COMPLETED",
      },
      {
        id: "s3",
        from: "documentation",
        to: "transit1",
        mode: "TRUCK",
        distance: 200,
        duration: 4,
        emissions: 0.6,
        status: "IN_PROGRESS",
      },
      {
        id: "s4",
        from: "transit1",
        to: "saudi-customs",
        mode: "TRUCK",
        distance: 200,
        duration: 4,
        emissions: 0.6,
        status: "PENDING",
      },
      {
        id: "s5",
        from: "saudi-customs",
        to: "kuwait-customs",
        mode: "TRUCK",
        distance: 15,
        duration: 0.5,
        emissions: 0.05,
        status: "PENDING",
      },
      {
        id: "s6",
        from: "kuwait-customs",
        to: "transit2",
        mode: "TRUCK",
        distance: 30,
        duration: 1,
        emissions: 0.1,
        status: "PENDING",
      },
      {
        id: "s7",
        from: "transit2",
        to: "destination",
        mode: "TRUCK",
        distance: 20,
        duration: 0.5,
        emissions: 0.07,
        status: "PENDING",
      },
    ],
  },
  "SA-KW-001-B": {
    touchpoints: [
      {
        id: "origin",
        name: "POL: Shipper Facility Gate",
        shortName: "POL",
        category: "Origin",
        avgHours: 1.89,
        status: "COMPLETED",
        position: { x: 50, y: 200 },
        emissions: 0,
        bottleneckRisk: "LOW",
        description: "Point of Loading - Inbound gate processing",
      },
      {
        id: "loading",
        name: "Loading Bay Operations (LBO)",
        shortName: "LBO",
        category: "Origin",
        avgHours: 6.54,
        status: "COMPLETED",
        position: { x: 150, y: 160 },
        emissions: 0.1,
        bottleneckRisk: "MEDIUM",
        description: "Cargo stuffing & seal application",
      },
      {
        id: "documentation",
        name: "Export Documentation Hub (EDH)",
        shortName: "EDH",
        category: "Origin",
        avgHours: 5.28,
        status: "COMPLETED",
        position: { x: 250, y: 200 },
        emissions: 0,
        bottleneckRisk: "MEDIUM",
        description: "Document verification & stamping",
      },
      {
        id: "transit1",
        name: "Linehaul: Origin → Hafar Al-Batin",
        shortName: "LH-HAB",
        category: "Transport",
        avgHours: 14.0,
        status: "IN_PROGRESS",
        position: { x: 350, y: 130 },
        emissions: 1.8,
        bottleneckRisk: "LOW",
        description: "Desert route via Riyadh bypass",
      },
      {
        id: "rest-stop",
        name: "Hafar Al-Batin Rest Stop",
        shortName: "HAB",
        category: "Transport",
        avgHours: 1.0,
        status: "PENDING",
        position: { x: 450, y: 160 },
        emissions: 0.05,
        bottleneckRisk: "LOW",
        description: "Driver rest & refuel point",
      },
      {
        id: "saudi-customs",
        name: "Export BCP: Al Salmi (SA)",
        shortName: "SA-SLM",
        category: "Customs",
        avgHours: 6.0,
        status: "PENDING",
        position: { x: 550, y: 180 },
        emissions: 0.15,
        bottleneckRisk: "LOW",
        description: "Saudi Customs - Al Salmi crossing",
        bcpId: "bcp-sa-salmi",
      },
      {
        id: "kuwait-customs",
        name: "Import BCP: Al Salmi (KW)",
        shortName: "KW-SLM",
        category: "Customs",
        avgHours: 24.0,
        status: "PENDING",
        position: { x: 650, y: 200 },
        emissions: 0.3,
        bottleneckRisk: "MEDIUM",
        description: "Kuwait Customs - 10hr daily ops",
        bcpId: "bcp-kw-salmi",
      },
      {
        id: "transit2",
        name: "Linehaul: Al Salmi → POD",
        shortName: "LH-POD",
        category: "Transport",
        avgHours: 3.5,
        status: "PENDING",
        position: { x: 760, y: 160 },
        emissions: 0.55,
        bottleneckRisk: "LOW",
        description: "Final delivery via Highway 70",
      },
      {
        id: "destination",
        name: "POD: Consignee Receiving Dock",
        shortName: "POD",
        category: "Destination",
        avgHours: 8.83,
        status: "PENDING",
        position: { x: 870, y: 200 },
        emissions: 0,
        bottleneckRisk: "MEDIUM",
        description: "Cargo destuffing & GRN issuance",
      },
    ],
    segments: [
      {
        id: "s1",
        from: "origin",
        to: "loading",
        mode: "TRUCK",
        distance: 0.5,
        duration: 0.5,
        emissions: 0.01,
        status: "COMPLETED",
      },
      {
        id: "s2",
        from: "loading",
        to: "documentation",
        mode: "TRUCK",
        distance: 0.2,
        duration: 0.3,
        emissions: 0.005,
        status: "COMPLETED",
      },
      {
        id: "s3",
        from: "documentation",
        to: "transit1",
        mode: "TRUCK",
        distance: 350,
        duration: 6,
        emissions: 1.0,
        status: "IN_PROGRESS",
      },
      {
        id: "s4",
        from: "transit1",
        to: "rest-stop",
        mode: "TRUCK",
        distance: 200,
        duration: 3,
        emissions: 0.6,
        status: "PENDING",
      },
      {
        id: "s5",
        from: "rest-stop",
        to: "saudi-customs",
        mode: "TRUCK",
        distance: 180,
        duration: 3,
        emissions: 0.5,
        status: "PENDING",
      },
      {
        id: "s6",
        from: "saudi-customs",
        to: "kuwait-customs",
        mode: "TRUCK",
        distance: 3,
        duration: 0.25,
        emissions: 0.01,
        status: "PENDING",
      },
      {
        id: "s7",
        from: "kuwait-customs",
        to: "transit2",
        mode: "TRUCK",
        distance: 80,
        duration: 1.5,
        emissions: 0.25,
        status: "PENDING",
      },
      {
        id: "s8",
        from: "transit2",
        to: "destination",
        mode: "TRUCK",
        distance: 60,
        duration: 1,
        emissions: 0.2,
        status: "PENDING",
      },
    ],
  },
};

const categoryColors = {
  Origin: {
    primary: "#6366F1",
    secondary: "#818CF8",
    bg: "rgba(99, 102, 241, 0.2)",
    gradient: "from-indigo-500 to-purple-500",
  },
  Transport: {
    primary: "#10B981",
    secondary: "#34D399",
    bg: "rgba(16, 185, 129, 0.2)",
    gradient: "from-emerald-500 to-teal-500",
  },
  Customs: {
    primary: "#F59E0B",
    secondary: "#FBBF24",
    bg: "rgba(245, 158, 11, 0.2)",
    gradient: "from-amber-500 to-orange-500",
  },
  Destination: {
    primary: "#F97316",
    secondary: "#FB923C",
    bg: "rgba(249, 115, 22, 0.2)",
    gradient: "from-orange-500 to-red-500",
  },
};

const terminologyGlossary = [
  {
    abbr: "POL",
    term: "Point of Loading",
    desc: "Origin facility where cargo is loaded",
  },
  {
    abbr: "POD",
    term: "Point of Destination",
    desc: "Final delivery location",
  },
  {
    abbr: "BCP",
    term: "Border Crossing Point",
    desc: "Customs checkpoint at international borders",
  },
  {
    abbr: "LBO",
    term: "Loading Bay Operations",
    desc: "Cargo stuffing and staging area",
  },
  {
    abbr: "EDH",
    term: "Export Documentation Hub",
    desc: "Document processing center",
  },
  {
    abbr: "LH",
    term: "Linehaul",
    desc: "Main transport leg between origin and destination",
  },
  {
    abbr: "COA",
    term: "Certificate of Analysis",
    desc: "Product quality certification",
  },
  {
    abbr: "COO",
    term: "Certificate of Origin",
    desc: "Country of manufacture certification",
  },
  {
    abbr: "GRN",
    term: "Goods Received Note",
    desc: "Delivery acceptance document",
  },
  {
    abbr: "B/L",
    term: "Bill of Lading",
    desc: "Transport contract and receipt",
  },
  {
    abbr: "SFDA",
    term: "Saudi FDA Registration",
    desc: "Food/drug regulatory approval",
  },
  {
    abbr: "SABER",
    term: "Saudi Product Safety",
    desc: "Conformity assessment certificate",
  },
];

const statusColors = {
  COMPLETED: "#22C55E",
  IN_PROGRESS: "#3B82F6",
  PENDING: "#6B7280",
  DELAYED: "#EF4444",
};

const riskColors = {
  LOW: "#22C55E",
  MEDIUM: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

// Get current time to show BCP status
function getBCPLiveStatus(bcp: BorderCrossingPoint): {
  isOpen: boolean;
  statusText: string;
  nextOpen?: string;
} {
  const now = new Date();
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const currentDay = days[now.getDay()];
  const schedule = bcp.operatingHours[currentDay];

  // Check if schedule exists and is an object with open/close times (not null or string)
  if (!schedule || typeof schedule === "string") {
    return { isOpen: false, statusText: "Closed Today", nextOpen: "Tomorrow" };
  }

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const isOpen = currentTime >= schedule.open && currentTime < schedule.close;

  if (isOpen) {
    return { isOpen: true, statusText: `Open until ${schedule.close}` };
  } else if (currentTime < schedule.open) {
    return { isOpen: false, statusText: "Closed", nextOpen: schedule.open };
  } else {
    return { isOpen: false, statusText: "Closed for today" };
  }
}

export default function InteractiveRouteMap({
  showEmissions = true,
  height = 520,
  onTouchpointClick,
}: InteractiveRouteMapProps) {
  // State
  const [selectedLane] = useState<TradeLane>(SA_KW_TRADE_LANES[0]);
  const [selectedRouteCode, setSelectedRouteCode] =
    useState<string>("SA-KW-001-A");
  const [selectedTouchpoint, setSelectedTouchpoint] =
    useState<Touchpoint | null>(null);
  const [hoveredTouchpoint, setHoveredTouchpoint] = useState<string | null>(
    null,
  );
  const [showEmissionsOverlay, setShowEmissionsOverlay] =
    useState(showEmissions);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showBCPPanel, setShowBCPPanel] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "none" | "glossary" | "bcp" | "programs"
  >("none");

  // Get current route config
  const currentConfig =
    routeConfigs[selectedRouteCode] || routeConfigs["SA-KW-001-A"];
  const touchpoints = currentConfig.touchpoints;
  const segments = currentConfig.segments;

  // Get selected route details
  const selectedRoute =
    selectedLane.routes.find((r) => r.code === selectedRouteCode) ||
    selectedLane.routes[0];

  // Get BCPs for current route
  const routeBCPs = useMemo(() => {
    const bcpIds = touchpoints.filter((t) => t.bcpId).map((t) => t.bcpId);
    return SA_KW_BORDER_CROSSINGS.filter((bcp) => bcpIds.includes(bcp.id));
  }, [touchpoints]);

  // Animate the route progress
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimationProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const totalTime = touchpoints.reduce((sum, tp) => sum + tp.avgHours, 0);
    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalEmissions = segments.reduce(
      (sum, seg) => sum + seg.emissions,
      0,
    );
    const customsTime = touchpoints
      .filter((tp) => tp.category === "Customs")
      .reduce((sum, tp) => sum + tp.avgHours, 0);
    const criticalCount = touchpoints.filter(
      (tp) => tp.bottleneckRisk === "CRITICAL",
    ).length;
    return {
      totalTime,
      totalDistance,
      totalEmissions,
      customsTime,
      criticalCount,
    };
  }, [touchpoints, segments]);

  // Get point position in SVG coords
  const getPointCoords = (id: string) => {
    const point = touchpoints.find((p) => p.id === id);
    return point ? point.position : { x: 0, y: 0 };
  };

  // Create curved path between points
  const createCurvedPath = (
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) => {
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 30;
    return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#0a0f1a] rounded-2xl overflow-hidden border border-white/10 ${isFullscreen ? "fixed inset-4 z-50" : ""}`}
      style={{ height: isFullscreen ? "calc(100vh - 32px)" : height }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header - Trade Lane Info */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#0a0f1a] via-[#0a0f1a]/95 to-transparent pb-8 pt-4 px-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Lane & Route Info */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Lane Code Badge */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-[#0f172a] border border-cyan-500/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <i className="ri-route-line text-cyan-400"></i>
                <span className="text-sm font-mono text-cyan-400 font-bold tracking-wider">
                  {selectedLane.code}
                </span>
              </div>
            </div>

            {/* Countries */}
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇸🇦</span>
                <span className="text-white font-semibold">
                  {GCC_COUNTRIES[selectedLane.originCountry]?.name}
                </span>
              </div>
              <i className="ri-arrow-right-line text-cyan-400"></i>
              <div className="flex items-center gap-2">
                <span className="text-lg">🇰🇼</span>
                <span className="text-white font-semibold">
                  {GCC_COUNTRIES[selectedLane.destinationCountry]?.name}
                </span>
              </div>
            </div>

            {/* Route Selector */}
            <div className="relative">
              <select
                value={selectedRouteCode}
                onChange={(e) => setSelectedRouteCode(e.target.value)}
                className="appearance-none bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 pr-10 text-sm text-white font-medium cursor-pointer hover:border-cyan-500/50 transition-colors focus:outline-none focus:border-cyan-500"
              >
                {selectedLane.routes.map((route) => (
                  <option
                    key={route.code}
                    value={route.code}
                    className="bg-[#1f2937] text-white"
                  >
                    {route.code} - {route.name.split(" via ")[1] || "Primary"}
                    {route.isDefault ? " ★" : ""}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"></i>
            </div>

            {/* Route Tags */}
            <div className="flex items-center gap-2">
              {selectedRoute.isDefault && (
                <span className="px-2 py-1 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Primary Route
                </span>
              )}
              <span
                className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  selectedRoute.riskLevel === "HIGH" ||
                  selectedRoute.riskLevel === "CRITICAL"
                    ? "bg-red-500/20 border border-red-500/30 text-red-400"
                    : selectedRoute.riskLevel === "MEDIUM"
                      ? "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                      : "bg-green-500/20 border border-green-500/30 text-green-400"
                }`}
              >
                {selectedRoute.riskLevel} Risk
              </span>
              <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {selectedRoute.reliabilityScore}% Reliable
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* BCP Panel Toggle */}
            <button
              onClick={() =>
                setActivePanel(activePanel === "bcp" ? "none" : "bcp")
              }
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                activePanel === "bcp"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-white/5 backdrop-blur-xl border-white/10 text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-building-2-line"></i>
              <span className="hidden sm:inline">Border Posts</span>
            </button>

            {/* Trade Programs */}
            <button
              onClick={() =>
                setActivePanel(activePanel === "programs" ? "none" : "programs")
              }
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                activePanel === "programs"
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                  : "bg-white/5 backdrop-blur-xl border-white/10 text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-award-line"></i>
              <span className="hidden sm:inline">Programs</span>
            </button>

            {/* Solution Intelligence - Opens comprehensive panel */}
            <button
              onClick={() => {
                // This will be handled by parent component
                if (typeof window !== "undefined") {
                  const event = new CustomEvent("openSolutionIntelligence", {
                    detail: { laneCode: selectedLane?.code || "SA-KW-001" },
                  });
                  window.dispatchEvent(event);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-xl text-sm font-medium text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
            >
              <i className="ri-lightbulb-flash-line"></i>
              <span className="hidden sm:inline">Solution Intelligence</span>
            </button>

            {/* Glossary Toggle */}
            <button
              onClick={() =>
                setActivePanel(activePanel === "glossary" ? "none" : "glossary")
              }
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                activePanel === "glossary"
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                  : "bg-white/5 backdrop-blur-xl border-white/10 text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-book-2-line"></i>
            </button>

            {/* Emissions Toggle */}
            <button
              onClick={() => setShowEmissionsOverlay(!showEmissionsOverlay)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${
                showEmissionsOverlay
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  : "bg-white/5 backdrop-blur-xl border-white/10 text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className="ri-leaf-line"></i>
              <span className="hidden sm:inline">CO₂</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-sm font-medium text-[#9ca3af] hover:text-white transition-all"
            >
              <i
                className={`ri-${isFullscreen ? "fullscreen-exit" : "fullscreen"}-line`}
              ></i>
            </button>

            {/* Export */}
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all">
              <i className="ri-download-line"></i>
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Map */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 960 380"
        className="relative z-10 pt-20"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gradient definitions */}
        <defs>
          {/* Route path gradients */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="25%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          {/* Animated dash for in-progress */}
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#3B82F6">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#06B6D4">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>

          {/* Point glow filters */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter
            id="strongGlow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Draw route segments */}
        {segments.map((segment) => {
          const from = getPointCoords(segment.from);
          const to = getPointCoords(segment.to);
          const path = createCurvedPath(from, to);
          const isActive = segment.status === "IN_PROGRESS";

          return (
            <g key={segment.id}>
              {/* Background path */}
              <path
                d={path}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Main path */}
              <path
                d={path}
                fill="none"
                stroke={statusColors[segment.status]}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={segment.status === "PENDING" ? "8,8" : "none"}
                opacity={segment.status === "PENDING" ? 0.5 : 1}
                filter={isActive ? "url(#glow)" : "none"}
              />
              {/* Animated progress for active segment */}
              {isActive && (
                <path
                  d={path}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="20,200"
                  strokeDashoffset={-animationProgress * 4}
                />
              )}
              {/* Distance label */}
              {segment.distance > 10 && (
                <text
                  x={(from.x + to.x) / 2}
                  y={Math.min(from.y, to.y) - 40}
                  fill="#6b7280"
                  fontSize="10"
                  textAnchor="middle"
                  className="select-none"
                >
                  {segment.distance} km
                </text>
              )}
            </g>
          );
        })}

        {/* Draw touchpoints */}
        {touchpoints.map((point, index) => {
          const isHovered = hoveredTouchpoint === point.id;
          const isSelected = selectedTouchpoint?.id === point.id;
          const isBCP = point.bcpId;
          const bcp = isBCP
            ? SA_KW_BORDER_CROSSINGS.find((b) => b.id === point.bcpId)
            : null;
          const bcpStatus = bcp ? getBCPLiveStatus(bcp) : null;

          return (
            <g
              key={point.id}
              className="cursor-pointer"
              onClick={() => {
                setSelectedTouchpoint(point);
                onTouchpointClick?.(point);
              }}
              onMouseEnter={() => setHoveredTouchpoint(point.id)}
              onMouseLeave={() => setHoveredTouchpoint(null)}
            >
              {/* Outer glow ring for critical/delayed */}
              {(point.bottleneckRisk === "CRITICAL" ||
                point.status === "DELAYED") && (
                <motion.circle
                  cx={point.position.x}
                  cy={point.position.y}
                  r={22}
                  fill="none"
                  stroke={riskColors.CRITICAL}
                  strokeWidth="2"
                  opacity={0.5}
                  animate={{ r: [20, 28, 20], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* BCP live status indicator */}
              {isBCP && bcpStatus && (
                <motion.circle
                  cx={point.position.x + 18}
                  cy={point.position.y - 18}
                  r={6}
                  fill={bcpStatus.isOpen ? "#22C55E" : "#EF4444"}
                  stroke="#0a0f1a"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              )}

              {/* Main point circle */}
              <motion.circle
                cx={point.position.x}
                cy={point.position.y}
                r={isHovered || isSelected ? 16 : 12}
                fill={categoryColors[point.category].bg}
                stroke={categoryColors[point.category].primary}
                strokeWidth={isHovered || isSelected ? 3 : 2}
                filter={
                  isHovered || isSelected ? "url(#strongGlow)" : "url(#glow)"
                }
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
              />

              {/* Inner status circle */}
              <circle
                cx={point.position.x}
                cy={point.position.y}
                r={6}
                fill={statusColors[point.status]}
              />

              {/* Short name label */}
              <motion.g
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                {/* Label background */}
                <rect
                  x={point.position.x - 25}
                  y={point.position.y + 18}
                  width={50}
                  height={18}
                  rx={4}
                  fill="#1a1f2e"
                  stroke={categoryColors[point.category].primary}
                  strokeWidth={0.5}
                  opacity={0.9}
                />
                {/* Label text */}
                <text
                  x={point.position.x}
                  y={point.position.y + 30}
                  fill={categoryColors[point.category].secondary}
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  className="select-none font-mono"
                >
                  {point.shortName}
                </text>
              </motion.g>

              {/* Hours badge */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0.7 }}
              >
                <text
                  x={point.position.x}
                  y={point.position.y - 24}
                  fill={
                    point.bottleneckRisk === "CRITICAL"
                      ? riskColors.CRITICAL
                      : "#9ca3af"
                  }
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  className="select-none"
                >
                  {point.avgHours.toFixed(1)}h
                </text>
              </motion.g>
            </g>
          );
        })}
      </svg>

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/95 to-transparent pt-8 pb-4 px-4">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="bg-[#1a1f2e]/90 backdrop-blur-xl border border-white/10 rounded-xl px-6 py-3 flex items-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totals.totalTime.toFixed(1)}
                <span className="text-sm text-[#9ca3af] ml-1">hrs</span>
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                Total Time
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totals.totalDistance.toFixed(0)}
                <span className="text-sm text-[#9ca3af] ml-1">km</span>
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                Distance
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {totals.totalEmissions.toFixed(2)}
                <span className="text-sm ml-1">MT</span>
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                CO₂ Emissions
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {totals.criticalCount}
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                Critical
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {((totals.customsTime / totals.totalTime) * 100).toFixed(0)}
                <span className="text-sm ml-0.5">%</span>
              </div>
              <div className="text-[10px] text-[#6b7280] uppercase tracking-wider">
                Customs Time
              </div>
            </div>
          </div>

          {/* Legend - Compact */}
          <div className="bg-[#1a1f2e]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex items-center gap-4">
            {Object.entries(categoryColors).map(([category, colors]) => (
              <div key={category} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
                <span className="text-[10px] text-[#9ca3af]">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Touchpoint Detail Panel */}
      <AnimatePresence>
        {selectedTouchpoint && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-28 right-4 w-80 bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-2xl"
          >
            <div
              className="p-4 border-b border-white/10"
              style={{
                backgroundColor: categoryColors[selectedTouchpoint.category].bg,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-black/20 rounded text-xs font-mono text-white">
                      {selectedTouchpoint.shortName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedTouchpoint.status === "COMPLETED"
                          ? "bg-green-500/20 text-green-400"
                          : selectedTouchpoint.status === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-400"
                            : selectedTouchpoint.status === "DELAYED"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {selectedTouchpoint.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">
                    {selectedTouchpoint.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTouchpoint(null)}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Time & Risk */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#6b7280] mb-1">
                    Avg. Dwell Time
                  </div>
                  <div className="text-xl font-bold text-white">
                    {selectedTouchpoint.avgHours.toFixed(2)}h
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#6b7280] mb-1">
                    Bottleneck Risk
                  </div>
                  <div
                    className={`text-xl font-bold`}
                    style={{
                      color: riskColors[selectedTouchpoint.bottleneckRisk],
                    }}
                  >
                    {selectedTouchpoint.bottleneckRisk}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-[#6b7280] mb-1">Description</div>
                <p className="text-sm text-[#9ca3af]">
                  {selectedTouchpoint.description}
                </p>
              </div>

              {/* BCP Details if applicable */}
              {selectedTouchpoint.bcpId &&
                (() => {
                  const bcp = SA_KW_BORDER_CROSSINGS.find(
                    (b) => b.id === selectedTouchpoint.bcpId,
                  );
                  if (!bcp) return null;
                  const status = getBCPLiveStatus(bcp);

                  return (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <i className="ri-building-2-line text-amber-400"></i>
                          <span className="text-xs font-medium text-amber-400">
                            Border Crossing Point
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            status.isOpen
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? "bg-green-400" : "bg-red-400"}`}
                          ></div>
                          {status.statusText}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-[#9ca3af]">
                        <div className="flex justify-between">
                          <span>Code:</span>
                          <span className="font-mono text-white">
                            {bcp.code}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Capacity:</span>
                          <span className="text-white">
                            {bcp.maxVehicleCapacity} vehicles
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg. Processing:</span>
                          <span className="text-white">
                            {bcp.averageProcessingTime.import ||
                              bcp.averageProcessingTime.export}
                            h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reliability:</span>
                          <span
                            className={
                              bcp.reliabilityScore < 60
                                ? "text-red-400"
                                : bcp.reliabilityScore < 80
                                  ? "text-amber-400"
                                  : "text-green-400"
                            }
                          >
                            {bcp.reliabilityScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {/* Emissions */}
              {showEmissionsOverlay &&
                selectedTouchpoint.emissions !== undefined &&
                selectedTouchpoint.emissions > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <i className="ri-leaf-line text-emerald-400"></i>
                      <span className="text-xs text-emerald-400">
                        CO₂ Emissions: {selectedTouchpoint.emissions.toFixed(2)}{" "}
                        MT
                      </span>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BCP Panel */}
      <AnimatePresence>
        {activePanel === "bcp" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-28 left-4 w-96 bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-40 shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-building-2-line text-amber-400"></i>
                  <h4 className="text-sm font-semibold text-white">
                    Border Crossing Points
                  </h4>
                </div>
                <button
                  onClick={() => setActivePanel("none")}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">
                Real-time status & operating hours
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-3">
              {routeBCPs.map((bcp) => {
                const status = getBCPLiveStatus(bcp);
                return (
                  <div
                    key={bcp.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {bcp.country === "SA" ? "🇸🇦" : "🇰🇼"}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                            {bcp.code}
                          </span>
                        </div>
                        <h5 className="text-white font-medium">{bcp.name}</h5>
                        <p className="text-xs text-[#6b7280]">
                          {bcp.nameLocal}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
                          status.isOpen
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full animate-pulse ${status.isOpen ? "bg-green-400" : "bg-red-400"}`}
                        ></div>
                        {status.isOpen ? "OPEN" : "CLOSED"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[10px] text-[#6b7280] uppercase">
                          Avg. Time
                        </div>
                        <div className="text-sm font-bold text-white">
                          {(
                            bcp.averageProcessingTime.import ||
                            bcp.averageProcessingTime.export
                          ).toFixed(1)}
                          h
                        </div>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2">
                        <div className="text-[10px] text-[#6b7280] uppercase">
                          Reliability
                        </div>
                        <div
                          className={`text-sm font-bold ${
                            bcp.reliabilityScore < 60
                              ? "text-red-400"
                              : bcp.reliabilityScore < 80
                                ? "text-amber-400"
                                : "text-green-400"
                          }`}
                        >
                          {bcp.reliabilityScore}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[#9ca3af]">
                        <span>Daily Hours:</span>
                        <span className="text-white">{status.statusText}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#9ca3af]">
                        <span>Congestion:</span>
                        <span
                          className={`font-medium ${
                            bcp.congestionLevel === "CRITICAL"
                              ? "text-red-400"
                              : bcp.congestionLevel === "HIGH"
                                ? "text-orange-400"
                                : bcp.congestionLevel === "MEDIUM"
                                  ? "text-amber-400"
                                  : "text-green-400"
                          }`}
                        >
                          {bcp.congestionLevel}
                        </span>
                      </div>
                      {bcp.notes && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                          <i className="ri-alert-line mr-1"></i>
                          {bcp.notes.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Programs Panel */}
      <AnimatePresence>
        {activePanel === "programs" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-28 left-4 w-96 bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-40 shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-award-line text-purple-400"></i>
                  <h4 className="text-sm font-semibold text-white">
                    Available Trade Programs
                  </h4>
                </div>
                <button
                  onClick={() => setActivePanel("none")}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">
                Programs for expedited clearance on this lane
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto p-3 space-y-3">
              {selectedLane.availablePrograms.map((program) => (
                <div
                  key={program.programId}
                  className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="text-white font-medium text-sm">
                        {program.name}
                      </h5>
                      <p className="text-xs text-[#6b7280]">
                        {program.authority}
                      </p>
                    </div>
                    <i className="ri-medal-line text-2xl text-purple-400"></i>
                  </div>
                  <p className="text-xs text-[#9ca3af] mb-3">
                    {program.benefitSummary}
                  </p>
                  <div className="flex items-center gap-3">
                    {program.timeReduction && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                        <i className="ri-time-line"></i>-{program.timeReduction}
                        % Time
                      </div>
                    )}
                    {program.costReduction && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
                        <i className="ri-money-dollar-circle-line"></i>-
                        {program.costReduction}% Cost
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossary Panel */}
      <AnimatePresence>
        {activePanel === "glossary" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-28 left-4 w-80 bg-[#1a1f2e]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-40 shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ri-book-2-line text-cyan-400"></i>
                  <h4 className="text-sm font-semibold text-white">
                    Industry Terminology
                  </h4>
                </div>
                <button
                  onClick={() => setActivePanel("none")}
                  className="text-[#9ca3af] hover:text-white transition-colors"
                >
                  <i className="ri-close-line"></i>
                </button>
              </div>
              <p className="text-xs text-[#9ca3af] mt-1">
                Standard logistics & trade compliance acronyms
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
              {terminologyGlossary.map((item) => (
                <div
                  key={item.abbr}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 whitespace-nowrap">
                    {item.abbr}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">
                      {item.term}
                    </p>
                    <p className="text-xs text-[#6b7280]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10 bg-white/5">
              <p className="text-xs text-[#6b7280] text-center">
                <i className="ri-information-line mr-1"></i>
                Based on IATA, FIATA & WCO standards
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
