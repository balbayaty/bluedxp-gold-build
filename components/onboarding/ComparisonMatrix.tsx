"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiStar, FiInfo, FiHelpCircle } from "react-icons/fi";
import type { ComparisonFeature } from "@/types/onboarding";
import Tooltip from "@/components/Tooltip";

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    feature: "4IR/5IR Alignment",
    category: "Architecture",
    description:
      "Alignment with Fourth and Fifth Industrial Revolution standards including IoT, AI, and human-centric collaboration.",
    blueDXP: "Full",
    sap: "Partial",
    oracle: "Partial",
    microsoft: "Partial",
    ibm: "Full",
  },
  {
    feature: "AI-Powered Operations",
    category: "Intelligence",
    description:
      "Direct integration of machine learning and autonomous agents for decision support and process automation.",
    blueDXP: true,
    sap: true,
    oracle: true,
    microsoft: true,
    ibm: true,
  },
  {
    feature: "Multi-Tenant Architecture",
    category: "Architecture",
    description:
      "Secure data isolation for multiple clients/branches while sharing core infrastructure and updates.",
    blueDXP: true,
    sap: true,
    oracle: true,
    microsoft: true,
    ibm: true,
  },
  {
    feature: "Event-Driven Architecture",
    category: "Architecture",
    description:
      "Real-time responsiveness through asynchronous communication between modules, preventing bottlenecks.",
    blueDXP: true,
    sap: true,
    oracle: true,
    microsoft: "Limited",
    ibm: true,
  },
  {
    feature: "Real-Time Analytics",
    category: "Analytics",
    description:
      "Instant visualization and analysis of operational data as it happens, with no batch processing delays.",
    blueDXP: true,
    sap: true,
    oracle: true,
    microsoft: true,
    ibm: true,
  },
  {
    feature: "IoT Integration",
    category: "Integration",
    description:
      "Native support for sensors, RFID, and edge devices without needing third-party middleware.",
    blueDXP: "Native",
    sap: "Add-on",
    oracle: "Add-on",
    microsoft: "Add-on",
    ibm: "Native",
  },
  {
    feature: "Saudi Vision 2030 Alignment",
    category: "Compliance",
    description:
      "Built-in support for regional regulations, local data residency, and national logistics initiatives.",
    blueDXP: true,
    sap: false,
    oracle: false,
    microsoft: false,
    ibm: false,
  },
  {
    feature: "Evidence & Lineage Tracking",
    category: "Compliance",
    description:
      "Complete immutable audit trail showing every change and origin point for data integrity and legal proof.",
    blueDXP: true,
    sap: false,
    oracle: false,
    microsoft: false,
    ibm: "Limited",
  },
  {
    feature: "Quantum-Ready Architecture",
    category: "Future",
    description:
      "Encrypted and structured to be compatible with upcoming quantum computing security and processing needs.",
    blueDXP: true,
    sap: false,
    oracle: false,
    microsoft: false,
    ibm: "Planned",
  },
  {
    feature: "Human-Centric AI (5IR)",
    category: "Intelligence",
    description:
      "AI designed to work alongside humans, explaining its decisions and learning from expert feedback.",
    blueDXP: true,
    sap: false,
    oracle: false,
    microsoft: "Limited",
    ibm: "Limited",
  },
  {
    feature: "Sustainability Metrics",
    category: "ESG",
    description:
      "Real-time tracking of carbon footprint and environmental impact across the entire supply chain.",
    blueDXP: true,
    sap: "Add-on",
    oracle: "Add-on",
    microsoft: "Limited",
    ibm: "Add-on",
  },
  {
    feature: "30+ Integrated Modules",
    category: "Platform",
    description:
      "A single unified codebase where all modules share data natively, eliminating integration complexitiy.",
    blueDXP: true,
    sap: "Separate Products",
    oracle: "Separate Products",
    microsoft: "Separate Products",
    ibm: "Separate Products",
  },
];

const PLATFORMS = [
  { id: "blueDXP", name: "BlueDXP", color: "blue", highlight: true },
  { id: "sap", name: "SAP", color: "slate" },
  { id: "oracle", name: "Oracle", color: "slate" },
  { id: "microsoft", name: "Microsoft", color: "slate" },
  { id: "ibm", name: "IBM", color: "slate" },
];

export default function ComparisonMatrix() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const categories = Array.from(
    new Set(COMPARISON_FEATURES.map((f) => f.category)),
  );

  const filteredFeatures =
    selectedCategory === "all"
      ? COMPARISON_FEATURES
      : COMPARISON_FEATURES.filter((f) => f.category === selectedCategory);

  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <FiCheck className="w-6 h-6 text-green-400 mx-auto" />;
    }
    if (value === false) {
      return <FiX className="w-6 h-6 text-red-400 mx-auto" />;
    }
    return <span className="text-slate-300 text-sm">{value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-slate-800/50 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-semibold sticky left-0 bg-slate-900 z-10">
                  Feature
                </th>
                {PLATFORMS.map((platform) => (
                  <th
                    key={platform.id}
                    className={`p-4 text-center font-semibold ${
                      platform.highlight
                        ? "bg-blue-600/20 text-blue-400 border-x-2 border-blue-500"
                        : "text-slate-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{platform.name}</span>
                      {platform.highlight && (
                        <FiStar className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature, index) => (
                <motion.tr
                  key={feature.feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-4 text-white font-medium sticky left-0 bg-slate-900 z-10 group-hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {feature.feature}
                          {feature.description && (
                            <Tooltip content={feature.description}>
                              <FiHelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400 cursor-help" />
                            </Tooltip>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {feature.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td
                    className={`p-4 text-center border-x-2 border-blue-500 bg-blue-600/10`}
                  >
                    {renderValue(feature.blueDXP)}
                  </td>
                  <td className="p-4 text-center">
                    {renderValue(feature.sap)}
                  </td>
                  <td className="p-4 text-center">
                    {renderValue(feature.oracle)}
                  </td>
                  <td className="p-4 text-center">
                    {renderValue(feature.microsoft)}
                  </td>
                  <td className="p-4 text-center">
                    {renderValue(feature.ibm)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl"
      >
        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <FiInfo className="w-5 h-5" />
          Why BlueDXP Stands Out
        </h3>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Complete 4IR/5IR Alignment:</strong> Built from the ground
              up for the future of industry
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Native Integration:</strong> All 30+ modules work
              seamlessly together, not as separate products
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Regional Expertise:</strong> Built for Saudi Vision 2030
              and Middle East operations
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Future-Ready:</strong> Quantum-ready architecture and
              human-centric AI from day one
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
