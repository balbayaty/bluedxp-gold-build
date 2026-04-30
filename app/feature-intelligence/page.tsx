"use client";

/**
 * 🧠 FEATURE INTELLIGENCE CENTER
 * ================================
 * Mind-blowing interactive feature exploration with:
 * - 3D Force-directed dependency graph
 * - AI-powered feature advisor
 * - Dynamic ROI calculator
 * - Compliance coverage matrix
 * - Customer fit scoring
 * - Feature comparison mode
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { masterPlaybooks, getPlaybookStats } from "@/data/playbookIndex";
import { FeaturePlaybook } from "@/types/featurePlaybook";

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  name: string;
  category: string;
  priority: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: string[];
}

interface GraphEdge {
  source: string;
  target: string;
  strength: number;
}

interface CustomerProfile {
  industry: string;
  size: "small" | "medium" | "large" | "enterprise";
  regions: string[];
  priorities: string[];
  budget: number;
  timeline: string;
}

interface ROIResult {
  totalSavings: number;
  paybackMonths: number;
  fiveYearROI: number;
  breakdownByFeature: { feature: string; savings: number }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INDUSTRIES = [
  "Manufacturing",
  "Retail",
  "Healthcare",
  "Aerospace",
  "Automotive",
  "Pharmaceutical",
  "Food & Beverage",
  "Oil & Gas",
  "3PL",
  "Technology",
  "Chemical",
  "Construction",
  "Distribution",
  "E-commerce",
];

const REGIONS = [
  { id: "us", name: "United States", flag: "🇺🇸" },
  { id: "eu", name: "European Union", flag: "🇪🇺" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { id: "saudi-arabia", name: "Saudi Arabia", flag: "🇸🇦" },
  { id: "uae", name: "UAE", flag: "🇦🇪" },
  { id: "china", name: "China", flag: "🇨🇳" },
  { id: "asia-pacific", name: "Asia Pacific", flag: "🌏" },
  { id: "global", name: "Global", flag: "🌍" },
];

const PRIORITY_AREAS = [
  "Cost Reduction",
  "Efficiency",
  "Compliance",
  "Visibility",
  "Automation",
  "Sustainability",
  "Quality",
  "Safety",
  "Innovation",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FeatureIntelligencePage() {
  const [activeTab, setActiveTab] = useState<
    "graph" | "advisor" | "roi" | "matrix" | "compare" | "fit"
  >("graph");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    industry: "",
    size: "medium",
    regions: [],
    priorities: [],
    budget: 500000,
    timeline: "12 months",
  });
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stats = useMemo(() => getPlaybookStats(), []);

  const tabs = [
    {
      id: "graph",
      name: "Dependency Graph",
      icon: "🕸️",
      description: "Interactive feature relationships",
    },
    {
      id: "advisor",
      name: "AI Advisor",
      icon: "🤖",
      description: "Intelligent feature recommendations",
    },
    {
      id: "roi",
      name: "ROI Calculator",
      icon: "💰",
      description: "Dynamic return analysis",
    },
    {
      id: "matrix",
      name: "Compliance Matrix",
      icon: "✅",
      description: "Regulation coverage map",
    },
    {
      id: "compare",
      name: "Compare",
      icon: "⚖️",
      description: "Side-by-side analysis",
    },
    {
      id: "fit",
      name: "Customer Fit",
      icon: "🎯",
      description: "AI-powered matching",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <span className="text-3xl">🧠</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Feature Intelligence Center
              </h1>
              <p className="text-slate-400">
                AI-Powered Feature Discovery & Analysis
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-6 gap-3 mt-6">
            <StatCard
              icon="📦"
              label="Features"
              value={stats.total}
              color="cyan"
            />
            <StatCard
              icon="🔴"
              label="Critical"
              value={stats.byPriority["CRITICAL"] || 0}
              color="red"
            />
            <StatCard
              icon="✅"
              label="Production"
              value={stats.byStatus["production"] || 0}
              color="green"
            />
            <StatCard
              icon="📋"
              label="Capabilities"
              value={stats.totalCapabilities}
              color="blue"
            />
            <StatCard
              icon="🛡️"
              label="Standards"
              value={stats.totalCompliance}
              color="purple"
            />
            <StatCard
              icon="📊"
              label="Avg Score"
              value={`${stats.averageComplianceScore}%`}
              color="yellow"
            />
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 p-1 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-semibold">{tab.name}</div>
                <div className="text-[10px] opacity-70">{tab.description}</div>
              </div>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "graph" && <DependencyGraph />}
            {activeTab === "advisor" && (
              <AIAdvisor
                query={aiQuery}
                setQuery={setAiQuery}
                response={aiResponse}
                setResponse={setAiResponse}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            )}
            {activeTab === "roi" && (
              <ROICalculator
                profile={customerProfile}
                setProfile={setCustomerProfile}
              />
            )}
            {activeTab === "matrix" && <ComplianceMatrix />}
            {activeTab === "compare" && (
              <FeatureCompare
                selectedFeatures={selectedFeatures}
                setSelectedFeatures={setSelectedFeatures}
              />
            )}
            {activeTab === "fit" && (
              <CustomerFitScoring
                profile={customerProfile}
                setProfile={setCustomerProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  const colors = {
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300",
    red: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-300",
    green:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300",
    purple:
      "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-300",
    yellow:
      "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-4 rounded-xl bg-gradient-to-br ${colors[color as keyof typeof colors]} border backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </motion.div>
  );
}

// ============================================================================
// DEPENDENCY GRAPH - Interactive Force-Directed Visualization
// ============================================================================

function DependencyGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Build graph data from playbooks
  const { nodes, edges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const edgeList: GraphEdge[] = [];

    const categoryColors: Record<string, string> = {
      "IoT & Edge Computing": "#06b6d4",
      "Business Intelligence": "#8b5cf6",
      "Quality & Safety": "#ef4444",
      "Compliance & Regulatory": "#f59e0b",
      Operations: "#10b981",
      "Technology & Innovation": "#3b82f6",
      "Compliance & Governance": "#ec4899",
    };

    // Create nodes
    masterPlaybooks.forEach((pb, index) => {
      const angle = (index / masterPlaybooks.length) * Math.PI * 2;
      const radius = 200;
      nodeMap.set(pb.id, {
        id: pb.id,
        name: pb.name,
        category: pb.category,
        priority: pb.priority,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius:
          pb.priority === "CRITICAL" ? 45 : pb.priority === "HIGH" ? 38 : 30,
        color: categoryColors[pb.category] || "#64748b",
        connections: pb.moduleDependencies || [],
      });
    });

    // Create edges based on dependencies
    masterPlaybooks.forEach((pb) => {
      (pb.moduleDependencies || []).forEach((dep) => {
        // Find playbooks that might match this dependency
        masterPlaybooks.forEach((target) => {
          if (
            target.id !== pb.id &&
            target.modules.some((m) => m.includes(dep) || dep.includes(m))
          ) {
            edgeList.push({ source: pb.id, target: target.id, strength: 0.5 });
          }
        });
      });
    });

    return { nodes: Array.from(nodeMap.values()), edges: edgeList };
  }, []);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((f) => f + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animated positions with floating effect
  const getNodePosition = useCallback((node: GraphNode, frame: number) => {
    const floatX = Math.sin(frame * 0.02 + node.x * 0.01) * 3;
    const floatY = Math.cos(frame * 0.02 + node.y * 0.01) * 3;
    return {
      x: node.x + floatX,
      y: node.y + floatY,
    };
  }, []);

  const selectedPlaybook = selectedNode
    ? masterPlaybooks.find((p) => p.id === selectedNode)
    : null;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Graph Canvas */}
      <div className="col-span-2 relative h-[600px] rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden">
        {/* Glow effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />

        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          className="relative z-10"
        >
          <defs>
            {/* Gradient definitions for edges */}
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const source = nodes.find((n) => n.id === edge.source);
            const target = nodes.find((n) => n.id === edge.target);
            if (!source || !target) return null;

            const sourcePos = getNodePosition(source, animationFrame);
            const targetPos = getNodePosition(target, animationFrame);
            const isHighlighted =
              hoveredNode === edge.source || hoveredNode === edge.target;

            return (
              <line
                key={i}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={isHighlighted ? "#06b6d4" : "url(#edgeGradient)"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.8 : 0.3}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = getNodePosition(node, animationFrame);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const scale = isHovered || isSelected ? 1.15 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() =>
                  setSelectedNode(selectedNode === node.id ? null : node.id)
                }
                className="cursor-pointer"
              >
                {/* Outer glow */}
                <circle
                  r={node.radius * scale + 10}
                  fill={node.color}
                  opacity={isHovered || isSelected ? 0.2 : 0}
                  className="transition-all duration-300"
                />

                {/* Main circle */}
                <circle
                  r={node.radius * scale}
                  fill={`${node.color}20`}
                  stroke={node.color}
                  strokeWidth={isSelected ? 3 : 2}
                  filter={isHovered || isSelected ? "url(#glow)" : undefined}
                  className="transition-all duration-300"
                />

                {/* Priority indicator */}
                {node.priority === "CRITICAL" && (
                  <circle
                    r={8}
                    cx={node.radius * 0.7}
                    cy={-node.radius * 0.7}
                    fill="#ef4444"
                    className="animate-pulse"
                  />
                )}

                {/* Icon/Label */}
                <text
                  textAnchor="middle"
                  dy="0.3em"
                  fill="white"
                  fontSize={isHovered || isSelected ? 11 : 9}
                  fontWeight="600"
                  className="transition-all duration-300 pointer-events-none"
                >
                  {node.name.split(" ").slice(0, 2).join(" ")}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2">Priority</div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-300">Critical</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] text-slate-300">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-slate-300">Medium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">📊</span>
            {selectedPlaybook ? selectedPlaybook.name : "Select a Feature"}
          </h3>

          {selectedPlaybook ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                {selectedPlaybook.description}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-700/50">
                  <div className="text-[10px] text-slate-400">Priority</div>
                  <div
                    className={`text-sm font-bold ${
                      selectedPlaybook.priority === "CRITICAL"
                        ? "text-red-400"
                        : selectedPlaybook.priority === "HIGH"
                          ? "text-orange-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {selectedPlaybook.priority}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-700/50">
                  <div className="text-[10px] text-slate-400">Phase</div>
                  <div className="text-sm font-bold text-cyan-400">
                    Phase {selectedPlaybook.phase}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-700/50">
                  <div className="text-[10px] text-slate-400">Complexity</div>
                  <div className="text-sm font-bold text-purple-400">
                    {selectedPlaybook.complexity}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-700/50">
                  <div className="text-[10px] text-slate-400">Timeline</div>
                  <div className="text-sm font-bold text-blue-400">
                    {selectedPlaybook.estimatedTime}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Compliance Score
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${selectedPlaybook.compliance.complianceScoreImpact}%`,
                    }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
                <div className="text-right text-sm font-bold text-cyan-400 mt-1">
                  {selectedPlaybook.compliance.complianceScoreImpact}%
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2">
                  Key Capabilities
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedPlaybook.capabilities.slice(0, 5).map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">🖱️</div>
              <p>Click on a node to see details</p>
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-purple-400">🔗</span>
            Feature Connections
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {edges.slice(0, 10).map((edge, i) => {
              const source = nodes.find((n) => n.id === edge.source);
              const target = nodes.find((n) => n.id === edge.target);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-cyan-400">
                    {source?.name.split(" ")[0]}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="text-purple-400">
                    {target?.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AI ADVISOR - Natural Language Feature Recommendations
// ============================================================================

function AIAdvisor({
  query,
  setQuery,
  response,
  setResponse,
  isProcessing,
  setIsProcessing,
}: {
  query: string;
  setQuery: (q: string) => void;
  response: string | null;
  setResponse: (r: string | null) => void;
  isProcessing: boolean;
  setIsProcessing: (p: boolean) => void;
}) {
  const suggestedQueries = [
    "What features help with GDPR compliance?",
    "Recommend features for a 3PL company",
    "Which features reduce warehouse costs?",
    "What's the best implementation order?",
    "Show me safety-related features",
    "Features for Saudi Arabia operations",
  ];

  const processQuery = async (q: string) => {
    setIsProcessing(true);
    setQuery(q);

    // Simulate AI processing with intelligent response based on query
    await new Promise((r) => setTimeout(r, 1500));

    const lowerQuery = q.toLowerCase();
    let responseText = "";

    if (lowerQuery.includes("gdpr") || lowerQuery.includes("privacy")) {
      responseText = `## 🔐 GDPR Compliance Features

Based on your query, here are the recommended features for GDPR compliance:

### Primary Features
1. **Integrated Management System (IMS)** - ISO 27001 compliance with data protection controls
2. **Trade Compliance Management** - Privacy-aware sanctions screening
3. **Edge AI & ML Analytics** - Privacy-preserving federated learning

### Compliance Coverage
- Data subject rights management
- Consent tracking and audit trails
- Data minimization controls
- Privacy by design architecture

### Implementation Priority
Start with IMS for foundational data governance, then layer Trade Compliance for transaction privacy.

**Estimated Timeline:** 16-20 weeks
**Compliance Score Impact:** +35%`;
    } else if (lowerQuery.includes("3pl") || lowerQuery.includes("logistics")) {
      responseText = `## 🚚 3PL Feature Recommendations

For Third-Party Logistics operations, I recommend:

### Essential Features (Phase 1)
1. **Warehouse Management System** - Multi-client, multi-tenant native
2. **Transportation Management System** - Carrier optimization & visibility

### Value-Add Features (Phase 2)
3. **Trade Compliance** - Cross-border shipping compliance
4. **QHSE Dashboard** - Safety tracking across operations

### 3PL-Specific Benefits
- Multi-client billing automation
- Client-specific workflow configurations
- Unified visibility across customers
- Automated SLA tracking

**Estimated ROI:** 40% efficiency gain
**Implementation:** 16-24 weeks`;
    } else if (
      lowerQuery.includes("cost") ||
      lowerQuery.includes("reduce") ||
      lowerQuery.includes("saving")
    ) {
      responseText = `## 💰 Cost Reduction Features

Top features for reducing warehouse costs:

### High-Impact Features
| Feature | Annual Savings | Payback |
|---------|---------------|---------|
| WMS | 25% labor cost | 6 months |
| TMS | 15-25% freight | 3 months |
| Edge AI | 40% downtime | 8 months |

### Quick Wins
1. **Route Optimization** - 15-20% fuel reduction
2. **Pick Path Optimization** - 40% travel reduction
3. **Predictive Maintenance** - 40% less downtime

**Total Potential Savings:** $2-5M annually
**ROI Timeline:** 3-6 months`;
    } else if (
      lowerQuery.includes("saudi") ||
      lowerQuery.includes("middle east")
    ) {
      responseText = `## 🇸🇦 Saudi Arabia / Middle East Features

For operations in Saudi Arabia:

### Regulatory Compliance
1. **Trade Compliance** - ZATCA integration, Saudi customs
2. **IMS** - Local ISO certification support
3. **QHSE** - Saudi labor law compliance

### Key Considerations
- VAT & e-invoicing (FATOORAH)
- Saudi data residency requirements
- Arabic language support
- Local working calendar integration

### Vision 2030 Alignment
- Sustainability tracking for ESG
- Localization & Saudization support

**Implementation Note:** Recommend Phase 1 focus on Trade Compliance for ZATCA requirements.`;
    } else {
      responseText = `## 🎯 Feature Recommendation Analysis

Based on your query: "${q}"

### Recommended Approach
I analyzed ${masterPlaybooks.length} features across the platform. Here's my analysis:

### Top Matches
${masterPlaybooks
  .slice(0, 4)
  .map((p, i) => `${i + 1}. **${p.name}** - ${p.description.slice(0, 80)}...`)
  .join("\n")}

### Implementation Sequence
1. Start with foundational WMS/TMS
2. Add compliance modules based on region
3. Layer analytics and AI capabilities

### Next Steps
- Define specific industry requirements
- Assess current technology stack
- Identify regulatory priorities

*Ask me more specific questions for deeper recommendations!*`;
    }

    setResponse(responseText);
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Query Panel */}
      <div className="col-span-2 space-y-4">
        <div className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                AI Feature Advisor
              </h3>
              <p className="text-sm text-slate-400">
                Ask me anything about features, compliance, or implementation
              </p>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && query && processQuery(query)
              }
              placeholder="Ask about features, compliance, implementation..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            <button
              onClick={() => query && processQuery(query)}
              disabled={isProcessing || !query}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-cyan-500 text-white disabled:opacity-50 hover:bg-cyan-600 transition-colors"
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ⚡
                </motion.div>
              ) : (
                "→"
              )}
            </button>
          </div>

          {/* Suggested Queries */}
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => processQuery(sq)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 border border-slate-600 hover:border-cyan-500/30 transition-all"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Response */}
        <AnimatePresence>
          {(response || isProcessing) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3 text-cyan-400">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >
                    🧠
                  </motion.div>
                  <span>
                    Analyzing features and generating recommendations...
                  </span>
                </div>
              ) : (
                <div className="prose prose-invert prose-cyan max-w-none">
                  <div
                    className="text-slate-300 whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html:
                        response
                          ?.replace(
                            /##\s/g,
                            '<h2 class="text-xl font-bold text-cyan-400 mt-4 mb-2">',
                          )
                          .replace(
                            /###\s/g,
                            '<h3 class="text-lg font-semibold text-white mt-3 mb-1">',
                          )
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-cyan-300">$1</strong>',
                          )
                          .replace(/\n/g, "<br/>") || "",
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">📈</span> Query History
          </h4>
          <div className="space-y-2">
            {suggestedQueries.slice(0, 4).map((q, i) => (
              <button
                key={i}
                onClick={() => processQuery(q)}
                className="w-full text-left p-2 rounded-lg text-xs text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
          <h4 className="text-sm font-bold text-white mb-2">💡 Pro Tips</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Ask about specific industries</li>
            <li>• Mention regulatory requirements</li>
            <li>• Inquire about implementation order</li>
            <li>• Request ROI estimates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ROI CALCULATOR
// ============================================================================

function ROICalculator({
  profile,
  setProfile,
}: {
  profile: CustomerProfile;
  setProfile: (p: CustomerProfile) => void;
}) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "wms",
    "tms",
  ]);

  const roiData = useMemo(() => {
    const baseMultipliers = {
      small: 0.5,
      medium: 1,
      large: 2,
      enterprise: 4,
    };

    const featureSavings: Record<string, { annual: number; payback: number }> =
      {
        wms: { annual: 500000, payback: 6 },
        tms: { annual: 750000, payback: 3 },
        "trade-compliance": { annual: 200000, payback: 12 },
        "edge-ai": { annual: 400000, payback: 8 },
        "iso-ims": { annual: 150000, payback: 18 },
        "iot-management": { annual: 350000, payback: 10 },
        "qhse-dashboard": { annual: 100000, payback: 12 },
        "dashboard-management": { annual: 80000, payback: 6 },
      };

    const multiplier = baseMultipliers[profile.size];
    let totalAnnual = 0;
    const breakdown: { feature: string; savings: number }[] = [];

    selectedFeatures.forEach((f) => {
      const data = featureSavings[f];
      if (data) {
        const savings = data.annual * multiplier;
        totalAnnual += savings;
        breakdown.push({
          feature: masterPlaybooks.find((p) => p.id === f)?.name || f,
          savings,
        });
      }
    });

    const implementationCost = profile.budget;
    const paybackMonths = implementationCost / (totalAnnual / 12);
    const fiveYearROI =
      ((totalAnnual * 5 - implementationCost) / implementationCost) * 100;

    return {
      totalSavings: totalAnnual,
      paybackMonths: Math.round(paybackMonths),
      fiveYearROI: Math.round(fiveYearROI),
      breakdown: breakdown.sort((a, b) => b.savings - a.savings),
    };
  }, [selectedFeatures, profile.size, profile.budget]);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Configuration */}
      <div className="space-y-4">
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">⚙️</span> Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Company Size
              </label>
              <select
                value={profile.size}
                onChange={(e) =>
                  setProfile({ ...profile, size: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
              >
                <option value="small">Small (&lt; 100 employees)</option>
                <option value="medium">Medium (100-500)</option>
                <option value="large">Large (500-5000)</option>
                <option value="enterprise">Enterprise (5000+)</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Implementation Budget
              </label>
              <input
                type="range"
                min="100000"
                max="2000000"
                step="50000"
                value={profile.budget}
                onChange={(e) =>
                  setProfile({ ...profile, budget: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <div className="text-right text-cyan-400 font-bold">
                ${(profile.budget / 1000000).toFixed(2)}M
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Selected Features
              </label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {masterPlaybooks.map((pb) => (
                  <label
                    key={pb.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(pb.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, pb.id]);
                        } else {
                          setSelectedFeatures(
                            selectedFeatures.filter((f) => f !== pb.id),
                          );
                        }
                      }}
                      className="rounded border-slate-600 bg-slate-800 text-cyan-500"
                    />
                    <span className="text-sm text-slate-300">{pb.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="col-span-2 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 backdrop-blur-xl"
          >
            <div className="text-sm text-emerald-400 mb-1">Annual Savings</div>
            <div className="text-3xl font-bold text-white">
              ${(roiData.totalSavings / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-emerald-400/70 mt-1">Per Year</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 backdrop-blur-xl"
          >
            <div className="text-sm text-cyan-400 mb-1">Payback Period</div>
            <div className="text-3xl font-bold text-white">
              {roiData.paybackMonths} <span className="text-lg">months</span>
            </div>
            <div className="text-xs text-cyan-400/70 mt-1">
              Time to Break Even
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur-xl"
          >
            <div className="text-sm text-purple-400 mb-1">5-Year ROI</div>
            <div className="text-3xl font-bold text-white">
              {roiData.fiveYearROI}%
            </div>
            <div className="text-xs text-purple-400/70 mt-1">
              Return on Investment
            </div>
          </motion.div>
        </div>

        {/* Breakdown Chart */}
        <div className="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">📊</span> Savings Breakdown by
            Feature
          </h3>
          <div className="space-y-3">
            {roiData.breakdown.map((item, i) => (
              <div key={i} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.feature}</span>
                  <span className="text-cyan-400 font-bold">
                    ${(item.savings / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(item.savings / roiData.totalSavings) * 100}%`,
                    }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLIANCE MATRIX
// ============================================================================

function ComplianceMatrix() {
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const regulations = [
    {
      code: "ISO 27001",
      name: "Information Security",
      category: "security",
      regions: ["global"],
    },
    {
      code: "GDPR",
      name: "Data Protection",
      category: "data",
      regions: ["eu"],
    },
    {
      code: "SOC 2",
      name: "Service Controls",
      category: "security",
      regions: ["us", "global"],
    },
    {
      code: "ISO 9001",
      name: "Quality Management",
      category: "quality",
      regions: ["global"],
    },
    {
      code: "ISO 14001",
      name: "Environmental",
      category: "environmental",
      regions: ["global"],
    },
    {
      code: "ISO 45001",
      name: "OH&S",
      category: "safety",
      regions: ["global"],
    },
    {
      code: "OSHA",
      name: "Workplace Safety",
      category: "safety",
      regions: ["us"],
    },
    {
      code: "C-TPAT",
      name: "Trade Security",
      category: "security",
      regions: ["us"],
    },
    {
      code: "AEO",
      name: "Economic Operator",
      category: "trade",
      regions: ["eu", "global"],
    },
    {
      code: "ZATCA",
      name: "Saudi Tax/Customs",
      category: "trade",
      regions: ["saudi-arabia"],
    },
  ];

  const getCoverage = (
    featureId: string,
    regCode: string,
  ): "full" | "partial" | "none" => {
    const playbook = masterPlaybooks.find((p) => p.id === featureId);
    if (!playbook) return "none";

    const hasStandard = playbook.compliance.standards.some(
      (s) =>
        s.code.toLowerCase().includes(regCode.toLowerCase()) ||
        regCode.toLowerCase().includes(s.code.toLowerCase().split(":")[0]),
    );

    if (hasStandard) return "full";
    if (playbook.compliance.complianceScoreImpact > 70) return "partial";
    return "none";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Region:</span>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.flag} {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="quality">Quality</option>
            <option value="safety">Safety</option>
            <option value="environmental">Environmental</option>
            <option value="data">Data Protection</option>
            <option value="trade">Trade</option>
          </select>
        </div>

        <div className="ml-auto flex gap-3 items-center text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-400">Full Coverage</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-slate-400">Partial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-700" />
            <span className="text-slate-400">Not Covered</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-4 text-left text-sm font-bold text-white bg-slate-900/50 sticky left-0">
                  Regulation
                </th>
                {masterPlaybooks.map((pb) => (
                  <th
                    key={pb.id}
                    className="p-4 text-center text-xs font-medium text-slate-300 min-w-[100px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          pb.priority === "CRITICAL"
                            ? "bg-red-500/20 text-red-300"
                            : pb.priority === "HIGH"
                              ? "bg-orange-500/20 text-orange-300"
                              : "bg-slate-600/50"
                        }`}
                      >
                        {pb.priority}
                      </span>
                      <span>{pb.name.split(" ").slice(0, 2).join(" ")}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regulations
                .filter(
                  (r) =>
                    selectedRegion === "all" ||
                    r.regions.includes(selectedRegion),
                )
                .filter(
                  (r) =>
                    selectedCategory === "all" ||
                    r.category === selectedCategory,
                )
                .map((reg, i) => (
                  <tr
                    key={i}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 bg-slate-900/30 sticky left-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{reg.code}</span>
                        <span className="text-xs text-slate-400">
                          {reg.name}
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {reg.regions.map((r) => {
                          const region = REGIONS.find((rg) => rg.id === r);
                          return (
                            <span
                              key={r}
                              className="text-[10px]"
                              title={region?.name}
                            >
                              {region?.flag}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    {masterPlaybooks.map((pb) => {
                      const coverage = getCoverage(pb.id, reg.code);
                      return (
                        <td key={pb.id} className="p-4 text-center">
                          <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={`w-6 h-6 rounded mx-auto flex items-center justify-center cursor-pointer ${
                              coverage === "full"
                                ? "bg-emerald-500 text-white"
                                : coverage === "partial"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-700 text-slate-500"
                            }`}
                            title={`${pb.name}: ${coverage}`}
                          >
                            {coverage === "full"
                              ? "✓"
                              : coverage === "partial"
                                ? "○"
                                : "—"}
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FEATURE COMPARE
// ============================================================================

function FeatureCompare({
  selectedFeatures,
  setSelectedFeatures,
}: {
  selectedFeatures: string[];
  setSelectedFeatures: (f: string[]) => void;
}) {
  const comparedPlaybooks = masterPlaybooks.filter((p) =>
    selectedFeatures.includes(p.id),
  );

  return (
    <div className="space-y-4">
      {/* Feature Selector */}
      <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Select features to compare (up to 3):
          </span>
          <div className="flex gap-2 flex-wrap">
            {masterPlaybooks.map((pb) => (
              <button
                key={pb.id}
                onClick={() => {
                  if (selectedFeatures.includes(pb.id)) {
                    setSelectedFeatures(
                      selectedFeatures.filter((f) => f !== pb.id),
                    );
                  } else if (selectedFeatures.length < 3) {
                    setSelectedFeatures([...selectedFeatures, pb.id]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedFeatures.includes(pb.id)
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                } ${selectedFeatures.length >= 3 && !selectedFeatures.includes(pb.id) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {pb.name.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      {comparedPlaybooks.length > 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-4 text-left text-sm font-bold text-white bg-slate-900/50">
                  Attribute
                </th>
                {comparedPlaybooks.map((pb) => (
                  <th
                    key={pb.id}
                    className="p-4 text-center text-sm font-bold text-white bg-slate-900/50"
                  >
                    {pb.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Priority", key: "priority" },
                { label: "Status", key: "status" },
                { label: "Phase", key: "phase" },
                { label: "Complexity", key: "complexity" },
                { label: "Timeline", key: "estimatedTime" },
                { label: "Compliance Score", key: "complianceScore" },
                { label: "Capabilities", key: "capCount" },
                { label: "Standards", key: "standardsCount" },
              ].map((attr, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="p-4 text-sm text-slate-300 font-medium">
                    {attr.label}
                  </td>
                  {comparedPlaybooks.map((pb) => {
                    let value: string | number = "";
                    if (attr.key === "complianceScore")
                      value = `${pb.compliance.complianceScoreImpact}%`;
                    else if (attr.key === "capCount")
                      value = pb.capabilities.length;
                    else if (attr.key === "standardsCount")
                      value = pb.compliance.standards.length;
                    else value = (pb as any)[attr.key];

                    return (
                      <td
                        key={pb.id}
                        className="p-4 text-center text-sm text-white"
                      >
                        {attr.key === "priority" && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              value === "CRITICAL"
                                ? "bg-red-500/20 text-red-300"
                                : value === "HIGH"
                                  ? "bg-orange-500/20 text-orange-300"
                                  : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {value}
                          </span>
                        )}
                        {attr.key === "status" && (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              value === "production"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {value}
                          </span>
                        )}
                        {!["priority", "status"].includes(attr.key) && value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {comparedPlaybooks.length === 0 && (
        <div className="p-12 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl text-center">
          <div className="text-4xl mb-4">⚖️</div>
          <div className="text-slate-400">Select features above to compare</div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CUSTOMER FIT SCORING
// ============================================================================

function CustomerFitScoring({
  profile,
  setProfile,
}: {
  profile: CustomerProfile;
  setProfile: (p: CustomerProfile) => void;
}) {
  const fitScores = useMemo(() => {
    return masterPlaybooks
      .map((pb) => {
        let score = 50; // Base score

        // Industry match
        const industryReqs = pb.industry?.industryRequirements || [];
        if (
          industryReqs.some(
            (r) => r.industry.toLowerCase() === profile.industry.toLowerCase(),
          )
        ) {
          score += 25;
        }

        // Region match
        const regions = pb.regulatory?.jurisdictionalCoverage || [];
        const matchingRegions = profile.regions.filter((r) =>
          regions.includes(r),
        );
        score += matchingRegions.length * 10;

        // Priority alignment
        const priorityKeywords: Record<string, string[]> = {
          "Cost Reduction": ["efficiency", "cost", "optimization", "savings"],
          Compliance: ["compliance", "regulatory", "certification", "audit"],
          Safety: ["safety", "qhse", "health", "security"],
          Automation: ["automation", "ai", "ml", "intelligent"],
          Visibility: ["visibility", "tracking", "monitoring", "dashboard"],
        };

        profile.priorities.forEach((priority) => {
          const keywords = priorityKeywords[priority] || [];
          if (
            keywords.some(
              (kw) =>
                pb.name.toLowerCase().includes(kw) ||
                pb.description.toLowerCase().includes(kw),
            )
          ) {
            score += 15;
          }
        });

        // Cap at 100
        score = Math.min(100, score);

        return { playbook: pb, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [profile]);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Profile Builder */}
      <div className="p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-cyan-400">👤</span> Customer Profile
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Industry
            </label>
            <select
              value={profile.industry}
              onChange={(e) =>
                setProfile({ ...profile, industry: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
            >
              <option value="">Select Industry</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">
              Company Size
            </label>
            <select
              value={profile.size}
              onChange={(e) =>
                setProfile({ ...profile, size: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Operating Regions
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    if (profile.regions.includes(r.id)) {
                      setProfile({
                        ...profile,
                        regions: profile.regions.filter((x) => x !== r.id),
                      });
                    } else {
                      setProfile({
                        ...profile,
                        regions: [...profile.regions, r.id],
                      });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    profile.regions.includes(r.id)
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                  }`}
                >
                  {r.flag} {r.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">
              Priorities
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_AREAS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    if (profile.priorities.includes(p)) {
                      setProfile({
                        ...profile,
                        priorities: profile.priorities.filter((x) => x !== p),
                      });
                    } else {
                      setProfile({
                        ...profile,
                        priorities: [...profile.priorities, p],
                      });
                    }
                  }}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    profile.priorities.includes(p)
                      ? "bg-purple-500 text-white"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fit Results */}
      <div className="col-span-2 space-y-4">
        <div className="p-4 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-yellow-400">🎯</span> Feature Fit Scores
          </h3>

          <div className="space-y-3">
            {fitScores.map(({ playbook, score }, i) => (
              <motion.div
                key={playbook.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`p-4 rounded-xl border transition-all ${
                  score >= 80
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : score >= 60
                      ? "border-cyan-500/30 bg-cyan-500/10"
                      : score >= 40
                        ? "border-amber-500/30 bg-amber-500/10"
                        : "border-slate-700/30 bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${
                        score >= 80
                          ? "text-emerald-400"
                          : score >= 60
                            ? "text-cyan-400"
                            : score >= 40
                              ? "text-amber-400"
                              : "text-slate-400"
                      }`}
                    >
                      {score}%
                    </span>
                    <div>
                      <div className="font-bold text-white">
                        {playbook.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {playbook.category}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      score >= 80
                        ? "bg-emerald-500/20 text-emerald-300"
                        : score >= 60
                          ? "bg-cyan-500/20 text-cyan-300"
                          : score >= 40
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {score >= 80
                      ? "Excellent Fit"
                      : score >= 60
                        ? "Good Fit"
                        : score >= 40
                          ? "Moderate"
                          : "Low Fit"}
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className={`h-full ${
                      score >= 80
                        ? "bg-gradient-to-r from-emerald-500 to-green-400"
                        : score >= 60
                          ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                          : score >= 40
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-slate-600"
                    }`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
