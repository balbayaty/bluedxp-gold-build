"use client";

/**
 * ASN Feature Showcase
 * Interactive showcase of all ASN module features
 * This is the "surprise" component - visually stunning and comprehensive
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const features = [
  {
    id: "api",
    title: "Complete API",
    description: "Full CRUD operations with 10+ endpoints",
    icon: "ri-api-line",
    color: "from-blue-500 to-cyan-500",
    details: [
      "GET /api/asn - List all ASNs",
      "POST /api/asn - Create new ASN",
      "GET /api/asn/[id] - Get ASN details",
      "PUT /api/asn/[id] - Update ASN",
      "POST /api/asn/[id]/status - Update status",
      "GET /api/asn/analytics - Get analytics",
      "GET /api/asn/[id]/insights - AI insights",
      "POST /api/asn/export - Export data",
      "GET /api/asn/realtime - Real-time updates",
      "GET /api/asn/[id]/knowledge - Knowledge articles",
      "GET /api/asn/[id]/evidence - Evidence tracking",
    ],
  },
  {
    id: "ai",
    title: "AI-Powered Intelligence",
    description: "Predictions, anomalies, and recommendations",
    icon: "ri-brain-line",
    color: "from-purple-500 to-pink-500",
    details: [
      "Delay prediction with probability scoring",
      "Anomaly detection (timing, quantity, process)",
      "Optimization recommendations",
      "Risk assessment and scoring",
      "Predictive analytics",
      "Context-aware insights",
    ],
  },
  {
    id: "analytics",
    title: "Advanced Analytics",
    description: "Comprehensive metrics and insights",
    icon: "ri-bar-chart-box-line",
    color: "from-green-500 to-emerald-500",
    details: [
      "30-day trend analysis",
      "Bottleneck identification",
      "Vendor performance comparison",
      "SLA compliance metrics",
      "On-time delivery tracking",
      "Process efficiency analysis",
    ],
  },
  {
    id: "realtime",
    title: "Real-Time Updates",
    description: "Live tracking with Server-Sent Events",
    icon: "ri-radar-line",
    color: "from-yellow-500 to-orange-500",
    details: [
      "Server-Sent Events (SSE)",
      "Event bus integration",
      "Live status updates",
      "Automatic notifications",
      "WebSocket ready",
      "Multi-client support",
    ],
  },
  {
    id: "notifications",
    title: "Smart Notifications",
    description: "Automatic notifications for all events",
    icon: "ri-notification-line",
    color: "from-indigo-500 to-blue-500",
    details: [
      "Email notifications",
      "SMS alerts",
      "In-app notifications",
      "SLA breach alerts",
      "Status change notifications",
      "Custom notification rules",
    ],
  },
  {
    id: "export",
    title: "Multi-Format Export",
    description: "Export data in multiple formats",
    icon: "ri-file-download-line",
    color: "from-pink-500 to-rose-500",
    details: [
      "Excel export (.xlsx)",
      "PDF reports",
      "CSV data export",
      "Custom column selection",
      "Filtered exports",
      "Individual ASN detail export",
    ],
  },
  {
    id: "copilot",
    title: "HazalyzeCopilot Integration",
    description: "AI assistant for ASN operations",
    icon: "ri-robot-line",
    color: "from-cyan-500 to-teal-500",
    details: [
      "Context-aware assistance",
      "Smart question suggestions",
      "Action handling",
      "Intelligent prompts",
      "Status-based help",
      "Process guidance",
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge Base",
    description: "Context-aware help and documentation",
    icon: "ri-book-open-line",
    color: "from-orange-500 to-red-500",
    details: [
      "5 default knowledge articles",
      "Context-aware suggestions",
      "Full-text search",
      "Custom article creation",
      "Troubleshooting guides",
      "Best practices",
    ],
  },
  {
    id: "evidence",
    title: "Evidence & Lineage",
    description: "Complete audit trail and compliance",
    icon: "ri-shield-check-line",
    color: "from-red-500 to-pink-500",
    details: [
      "Document lineage tracking",
      "Chain of custody",
      "Integrity verification",
      "Evidence creation",
      "Audit trail",
      "Compliance tracking",
    ],
  },
];

export default function ASNFeatureShowcase() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#0F172A] p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4"
        >
          Hazalyze ASN Module
        </motion.h1>
        <p className="text-2xl text-gray-400 mb-2">
          Enterprise-Grade Advanced Shipping Notice Management
        </p>
        <p className="text-lg text-gray-500">
          Fully Integrated • AI-Powered • Compliance-Ready
        </p>
      </motion.div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() =>
              setSelectedFeature(
                selectedFeature === feature.id ? null : feature.id,
              )
            }
            className={`bg-gradient-to-br ${feature.color} rounded-xl p-6 cursor-pointer transform transition-all hover:scale-105 shadow-xl border border-white/10`}
          >
            <div className="flex items-start justify-between mb-4">
              <i className={`${feature.icon} text-white text-4xl`}></i>
              <motion.div
                animate={{ rotate: selectedFeature === feature.id ? 180 : 0 }}
                className="text-white"
              >
                <i className="ri-arrow-down-s-line text-2xl"></i>
              </motion.div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              {feature.title}
            </h3>
            <p className="text-white/80 text-sm mb-4">{feature.description}</p>

            <AnimatePresence>
              {selectedFeature === feature.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/10 rounded-lg p-4 mt-4">
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li
                          key={i}
                          className="text-white/90 text-sm flex items-start gap-2"
                        >
                          <i className="ri-check-line text-green-300 mt-1"></i>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Implementation Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 mb-12"
      >
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Implementation Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatBox number="9" label="Service Files" icon="ri-file-code-line" />
          <StatBox number="10+" label="API Endpoints" icon="ri-router-line" />
          <StatBox
            number="3"
            label="Phases Complete"
            icon="ri-checkbox-circle-line"
          />
          <StatBox
            number="100%"
            label="Platform Integration"
            icon="ri-link-m"
          />
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/asn/dashboard"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            <i className="ri-dashboard-line mr-2"></i>
            View Dashboard
          </Link>
          <Link
            href="/process-lifecycle/lifecycle?entityType=ASN"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <i className="ri-flow-chart-line mr-2"></i>
            View Lifecycle
          </Link>
          <Link
            href="/process-lifecycle/analytics?entityType=ASN"
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
          >
            <i className="ri-bar-chart-line mr-2"></i>
            View Analytics
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function StatBox({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="text-center">
      <i className={`${icon} text-4xl text-blue-400 mb-2`}></i>
      <div className="text-3xl font-bold text-white mb-1">{number}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}
