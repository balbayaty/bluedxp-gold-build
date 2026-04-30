"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ArchitectureNode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category:
    | "frontend"
    | "backend"
    | "modules"
    | "intelligence"
    | "infrastructure"
    | "integration";
  children?: string[];
  stats?: { label: string; value: string }[];
}

const architectureData: ArchitectureNode[] = [
  {
    id: "frontend",
    title: "Frontend Layer",
    description: "Next.js 14, React 18, TypeScript, Tailwind CSS",
    icon: "ri-code-s-slash-line",
    color: "from-cyan-500 to-blue-600",
    category: "frontend",
    stats: [
      { label: "Pages", value: "83+" },
      { label: "Components", value: "47+" },
      { label: "Views", value: "4 Types" },
    ],
    children: ["ui", "animations", "visualizations"],
  },
  {
    id: "backend",
    title: "Backend Layer",
    description: "Node.js, Next.js API, Context API",
    icon: "ri-database-line",
    color: "from-purple-500 to-pink-600",
    category: "backend",
    stats: [
      { label: "API Routes", value: "Multiple" },
      { label: "Contexts", value: "2+" },
      { label: "State Management", value: "Context API" },
    ],
  },
  {
    id: "modules",
    title: "Core Modules",
    description: "83+ Pages across 10 major categories",
    icon: "ri-stack-line",
    color: "from-green-500 to-emerald-600",
    category: "modules",
    stats: [
      { label: "Warehouse Ops", value: "15+" },
      { label: "Inventory", value: "8+" },
      { label: "Orders", value: "4+" },
      { label: "Quality", value: "4+" },
    ],
    children: ["warehouse", "inventory", "orders", "quality", "transport"],
  },
  {
    id: "intelligence",
    title: "AI Intelligence",
    description: "6 AI-powered orchestration modules",
    icon: "ri-brain-line",
    color: "from-yellow-500 to-orange-600",
    category: "intelligence",
    stats: [
      { label: "Process Mining", value: "✅" },
      { label: "Root Cause", value: "✅" },
      { label: "Predictive", value: "✅" },
      { label: "Compliance", value: "✅" },
    ],
    children: ["process-mining", "rca", "predictive", "compliance"],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    description: "Multi-tenant, RBAC, Real-time",
    icon: "ri-cloud-line",
    color: "from-indigo-500 to-purple-600",
    category: "infrastructure",
    stats: [
      { label: "User Roles", value: "11" },
      { label: "Multi-Tenant", value: "✅" },
      { label: "Real-Time", value: "✅" },
    ],
  },
  {
    id: "integration",
    title: "Integrations",
    description: "ERP, EDI, APIs, IoT, Carriers",
    icon: "ri-links-line",
    color: "from-red-500 to-rose-600",
    category: "integration",
    stats: [
      { label: "Data Sources", value: "20+" },
      { label: "ERP Systems", value: "✅" },
      { label: "Carriers", value: "✅" },
    ],
  },
];

const moduleCategories = [
  {
    id: "warehouse",
    title: "Warehouse Operations",
    icon: "ri-box-3-line",
    modules: [
      "Inbound",
      "Outbound",
      "Putaway",
      "Picking",
      "Cycle Counting",
      "Task Management",
    ],
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "inventory",
    title: "Inventory Management",
    icon: "ri-database-line",
    modules: [
      "Stock Overview",
      "Batch Tracking",
      "Serial Numbers",
      "ABC Analysis",
      "Valuation",
    ],
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "orders",
    title: "Order Management",
    icon: "ri-shopping-cart-line",
    modules: [
      "Purchase Orders",
      "Sales Orders",
      "Wave Planning",
      "Load Planning",
    ],
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "quality",
    title: "Quality Management",
    icon: "ri-checkbox-circle-line",
    modules: ["Inspection Lots", "NCR", "Damage Reports", "Certificates"],
    color: "from-yellow-500 to-orange-600",
  },
  {
    id: "transport",
    title: "Transportation",
    icon: "ri-truck-line",
    modules: ["Carriers", "Shipments", "Routes", "POD"],
    color: "from-indigo-500 to-purple-600",
  },
];

const intelligenceModules = [
  {
    id: "process-mining",
    title: "Process Mining",
    description: "Real-time process discovery and analysis",
    icon: "ri-flow-chart-line",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "rca",
    title: "Root Cause Analysis",
    description: "Automated RCA using AI/ML",
    icon: "ri-node-tree",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "predictive",
    title: "Predictive Analytics",
    description: "ML-powered predictions and insights",
    icon: "ri-bar-chart-line",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "compliance",
    title: "Autonomous Compliance",
    description: "Self-monitoring compliance system",
    icon: "ri-shield-check-line",
    color: "from-yellow-500 to-orange-600",
  },
];

export default function ArchitectureMindMap() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    "overview" | "modules" | "intelligence" | "tech-stack"
  >("overview");

  return (
    <div className="min-h-screen bg-black py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            Platform Architecture
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Complete system overview: Tech stack, modules, capabilities, and
            infrastructure
          </p>
        </motion.div>

        {/* View Mode Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center gap-4 mb-12 flex-wrap"
        >
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "modules", label: "Modules", icon: "ri-stack-line" },
            {
              id: "intelligence",
              label: "AI Intelligence",
              icon: "ri-brain-line",
            },
            {
              id: "tech-stack",
              label: "Tech Stack",
              icon: "ri-code-s-slash-line",
            },
          ].map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${
                viewMode === mode.id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50"
                  : "bg-white/5 backdrop-blur-xl border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <i className={`${mode.icon} text-xl`}></i>
              <span className="font-medium">{mode.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Overview View */}
        <AnimatePresence mode="wait">
          {viewMode === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {architectureData.map((node, index) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedNode(node.id)}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer transition-all hover:border-cyan-500/50 ${
                    selectedNode === node.id ? "ring-2 ring-cyan-500" : ""
                  }`}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${node.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <i className={`${node.icon} text-2xl text-white`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {node.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {node.description}
                  </p>
                  {node.stats && (
                    <div className="space-y-2">
                      {node.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-500 text-sm">
                            {stat.label}
                          </span>
                          <span className="text-cyan-400 font-semibold">
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Modules View */}
          {viewMode === "modules" && (
            <motion.div
              key="modules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {moduleCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                    >
                      <i className={`${category.icon} text-2xl text-white`}></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {category.title}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {category.modules.map((module) => (
                      <motion.div
                        key={module}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-all"
                        whileHover={{ scale: 1.05, y: -4 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                          <span className="text-white font-medium">
                            {module}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Intelligence View */}
          {viewMode === "intelligence" && (
            <motion.div
              key="intelligence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {intelligenceModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20`}
                  >
                    <i className={`${module.icon} text-3xl text-white`}></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {module.title}
                  </h3>
                  <p className="text-gray-400 mb-6">{module.description}</p>
                  <div className="flex items-center gap-2 text-cyan-400">
                    <i className="ri-robot-line text-xl"></i>
                    <span className="font-semibold">AI-Powered</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tech Stack View */}
          {viewMode === "tech-stack" && (
            <motion.div
              key="tech-stack"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Frontend Stack */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <i className="ri-code-s-slash-line text-2xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Frontend Stack
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Next.js 14", desc: "Framework" },
                    { name: "React 18", desc: "UI Library" },
                    { name: "TypeScript", desc: "Type Safety" },
                    { name: "Tailwind CSS", desc: "Styling" },
                    { name: "Framer Motion", desc: "Animations" },
                    { name: "Three.js", desc: "3D Graphics" },
                    { name: "Recharts", desc: "Charts" },
                    { name: "Remix Icons", desc: "Icons" },
                  ].map((tech) => (
                    <motion.div
                      key={tech.name}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-all"
                      whileHover={{ scale: 1.05, y: -4 }}
                    >
                      <div className="font-semibold text-white mb-1">
                        {tech.name}
                      </div>
                      <div className="text-gray-400 text-sm">{tech.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Backend Stack */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                    <i className="ri-database-line text-2xl text-white"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Backend Stack
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: "Node.js", desc: "Runtime" },
                    { name: "Next.js API", desc: "API Routes" },
                    { name: "Context API", desc: "State Management" },
                    { name: "TypeScript", desc: "Type Safety" },
                  ].map((tech) => (
                    <motion.div
                      key={tech.name}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-all"
                      whileHover={{ scale: 1.05, y: -4 }}
                    >
                      <div className="font-semibold text-white mb-1">
                        {tech.name}
                      </div>
                      <div className="text-gray-400 text-sm">{tech.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <i className="ri-file-chart-line text-cyan-400"></i>
                  Platform Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Total Pages",
                      value: "83+",
                      icon: "ri-file-list-3-line",
                    },
                    {
                      label: "Components",
                      value: "47+",
                      icon: "ri-stack-line",
                    },
                    {
                      label: "User Roles",
                      value: "11",
                      icon: "ri-user-settings-line",
                    },
                    {
                      label: "Data Sources",
                      value: "20+",
                      icon: "ri-global-line",
                    },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center">
                      <i
                        className={`${metric.icon} text-4xl text-cyan-400 mx-auto mb-2 block`}
                      ></i>
                      <div className="text-3xl font-bold text-white mb-1">
                        {metric.value}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <i className="ri-file-list-3-line text-cyan-400"></i>
            Documentation Files
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: "Architecture Mind Map",
                file: "ARCHITECTURE_MINDMAP.md",
              },
              {
                name: "Visual Diagrams",
                file: "VISUAL_ARCHITECTURE_DIAGRAM.md",
              },
              { name: "Quick Reference", file: "QUICK_REFERENCE_GUIDE.md" },
            ].map((doc) => (
              <motion.div
                key={doc.name}
                className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer"
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <div className="font-semibold text-white mb-1">{doc.name}</div>
                <div className="text-gray-400 text-sm">{doc.file}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
