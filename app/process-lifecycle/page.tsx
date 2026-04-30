/**
 * Process & Lifecycle Management - Main Dashboard
 * Unified dashboard for all process lifecycle features
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { processAnalyticsService } from "@/lib/services/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ProcessLifecycleDashboard() {
  const [stats, setStats] = useState({
    totalProcesses: 0,
    activeProcesses: 0,
    workflows: 0,
    insights: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const dashboardData = await processAnalyticsService.getDashboardData();
      setStats({
        totalProcesses: dashboardData.overview.totalProcesses,
        activeProcesses: dashboardData.overview.activeProcesses,
        workflows:
          dashboardData.workflows.active + dashboardData.workflows.completed,
        insights: dashboardData.analytics.insights,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Lifecycle Management",
      description: "Track entities through their stages with real-time updates",
      href: "/process-lifecycle/lifecycle",
      icon: "ri-flow-chart-line",
      color: "cyan",
      stats: `${stats.activeProcesses} active`,
    },
    {
      title: "Workflow Automation",
      description: "Create and manage automated workflows with visual builder",
      href: "/process-lifecycle/workflows",
      icon: "ri-node-tree",
      color: "purple",
      stats: `${stats.workflows} workflows`,
    },
    {
      title: "AI Document Processor",
      description:
        "Upload any document and automatically extract & visualize processes",
      href: "/process-lifecycle/document-processor",
      icon: "ri-file-upload-line",
      color: "pink",
      stats: "AI-Powered",
    },
    {
      title: "Unified Journey Intelligence",
      description:
        "Dual-dimensional tracking: Physical Journey (WHERE) + Business Journey (WHAT)",
      href: "/process-lifecycle/unified-journey",
      icon: "ri-global-line",
      color: "indigo",
      stats: "Revolutionary",
    },
    {
      title: "Process Mining",
      description: "Analyze process variants, detect deviations, and optimize",
      href: "/process-lifecycle/process-mining",
      icon: "ri-bar-chart-box-line",
      color: "yellow",
      stats: "Real-time analysis",
    },
    {
      title: "Analytics & AI",
      description:
        "Predictive insights, AI recommendations, and anomaly detection",
      href: "/process-lifecycle/analytics",
      icon: "ri-line-chart-line",
      color: "blue",
      stats: `${stats.insights} insights`,
    },
  ];

  const quickActions = [
    {
      label: "Upload Document",
      href: "/process-lifecycle/document-processor",
      icon: "ri-file-upload-line",
    },
    {
      label: "Create Workflow",
      href: "/process-lifecycle/workflows/builder",
      icon: "ri-add-line",
    },
    {
      label: "View Lifecycles",
      href: "/process-lifecycle/lifecycle",
      icon: "ri-eye-line",
    },
    {
      label: "Process Analysis",
      href: "/process-lifecycle/process-mining",
      icon: "ri-search-line",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={<div className="text-red-400 p-4">Error loading Dashboard</div>}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="ri-dashboard-line text-purple-400"></i>
                Process & Lifecycle Management
              </h1>
              <p className="text-[#9ca3af] text-lg">
                Unified platform for lifecycle tracking, workflow automation,
                process mining, and AI-powered analytics
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            {[
              {
                label: "Total Processes",
                value: stats.totalProcesses,
                icon: "ri-file-list-line",
                color: "blue",
              },
              {
                label: "Active",
                value: stats.activeProcesses,
                icon: "ri-loader-4-line",
                color: "green",
              },
              {
                label: "Workflows",
                value: stats.workflows,
                icon: "ri-node-tree",
                color: "purple",
              },
              {
                label: "AI Insights",
                value: stats.insights,
                icon: "ri-lightbulb-line",
                color: "yellow",
              },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${stat.color}-500/30 transition-all`}
              >
                <div className="flex items-center justify-between mb-2">
                  <i
                    className={`ri-${stat.icon} text-${stat.color}-400 text-xl`}
                  ></i>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-[#9ca3af]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Features Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Link key={feature.href} href={feature.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-${feature.color}-500/30 transition-all cursor-pointer h-full group`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg bg-${feature.color}-500/20 flex items-center justify-center mb-4 group-hover:bg-${feature.color}-500/30 transition-colors`}
                  >
                    <i
                      className={`${feature.icon} text-${feature.color}-400 text-2xl`}
                    ></i>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#9ca3af] mb-3">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#9ca3af]">
                      {feature.stats}
                    </span>
                    <i className="ri-arrow-right-line text-[#9ca3af] group-hover:text-white transition-colors"></i>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-flashlight-line text-purple-400"></i>
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link key={action.href} href={action.href}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                      <i className={`${action.icon} text-purple-400`}></i>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {action.label}
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <i className="ri-information-line text-blue-400 text-xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                About Process & Lifecycle Management
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                This unified module combines lifecycle tracking, workflow
                automation, process mining, and AI-powered analytics into one
                cohesive platform. Track any entity through its stages, automate
                processes with visual workflows, analyze actual vs. ideal
                processes, and get AI-powered insights and recommendations.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white font-medium mb-1">
                    Key Capabilities:
                  </div>
                  <ul className="text-[#9ca3af] space-y-1">
                    <li>• Real-time lifecycle tracking</li>
                    <li>• Visual workflow builder</li>
                    <li>• Process variant discovery</li>
                    <li>• AI-powered insights</li>
                  </ul>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    Integration:
                  </div>
                  <ul className="text-[#9ca3af] space-y-1">
                    <li>• SAP, Oracle, Salesforce</li>
                    <li>• RPA (UiPath, Automation Anywhere)</li>
                    <li>• WebSocket/SSE real-time updates</li>
                    <li>• REST & GraphQL APIs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
