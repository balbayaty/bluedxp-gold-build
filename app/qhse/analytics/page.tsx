/**
 * QHSE Analytics Page - ENHANCED
 * Comprehensive analytics and insights with cross-module links
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiShield,
  FiUsers,
  FiFeather,
  FiFileText,
  FiSearch,
  FiDownload,
} from "react-icons/fi";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

export default function QHSEAnalyticsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QHSE Analytics</h1>
          <p className="text-gray-600 mt-1">Advanced analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/qhse/dashboard"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiBarChart className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Dashboard Overview
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Comprehensive QHSE dashboard with key metrics
            </p>
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <span className="text-sm font-medium">View Dashboard</span>
              <FiActivity className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/qhse/incidents"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiActivity className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Incident Analytics
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Incident trends and analysis
            </p>
            <div className="mt-4 flex items-center gap-2 text-red-600">
              <span className="text-sm font-medium">View Incidents</span>
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/qhse/safety-metrics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiShield className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Safety Performance
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              TRIR, LTIFR, and safety trends
            </p>
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <span className="text-sm font-medium">View Metrics</span>
              <FiBarChart className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/qhse/environmental"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiFeather className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Environmental Trends
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Environmental metrics and trends
            </p>
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <span className="text-sm font-medium">View Environmental</span>
              <FiTrendingDown className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/qhse/training"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiUsers className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Training Analytics
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Training compliance and completion rates
            </p>
            <div className="mt-4 flex items-center gap-2 text-purple-600">
              <span className="text-sm font-medium">View Training</span>
              <FiBarChart className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/qhse/regulatory"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
          >
            <div className="flex items-center gap-3 mb-3">
              <FiFileText className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Analytics
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Regulatory compliance trends
            </p>
            <div className="mt-4 flex items-center gap-2 text-yellow-600">
              <span className="text-sm font-medium">View Compliance</span>
              <FiShield className="w-4 h-4" />
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Advanced Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Advanced Analytics Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiTrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">
                Predictive Analytics
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Machine learning-based risk assessment for incident prevention
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiBarChart className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">
                Custom Report Builder
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Build custom reports with drag-and-drop interface
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiActivity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">
                Real-time Dashboards
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Live updates and real-time monitoring capabilities
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiSearch className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">
                Benchmark Comparisons
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              Compare your metrics against industry benchmarks
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Module Links */}
      <CrossModuleLinks
        title="Quick Navigation"
        links={[
          {
            label: "QHSE Dashboard",
            href: "/qhse/dashboard",
            icon: "ri-dashboard-3-line",
            description: "Overview",
          },
          {
            label: "Incidents",
            href: "/qhse/incidents",
            icon: "ri-error-warning-line",
            description: "View incidents",
          },
          {
            label: "Inspections",
            href: "/qhse/inspections",
            icon: "ri-clipboard-line",
            description: "View inspections",
          },
          {
            label: "Training",
            href: "/qhse/training",
            icon: "ri-graduation-cap-line",
            description: "Training records",
          },
          {
            label: "Advanced Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Full-text search",
          },
          {
            label: "Calendar",
            href: "/qhse/calendar",
            icon: "ri-calendar-line",
            description: "View calendar",
          },
        ]}
      />
    </div>
  );
}
