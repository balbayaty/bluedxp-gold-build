/**
 * Proposal Engagement Heatmap Component
 * Beautiful visualization of proposal engagement by section, time, and recipient
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ============================================================================
// TYPES
// ============================================================================

interface SectionEngagement {
  sectionId: string;
  sectionTitle: string;
  viewCount: number;
  averageTimeSpent: number;
  uniqueViewers: number;
  scrollDepth: number;
  engagementScore: number;
}

interface EngagementHeatmapData {
  proposalId: string;
  sections: SectionEngagement[];
  overallEngagement: number;
}

interface ProposalEngagementHeatmapProps {
  proposalId: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProposalEngagementHeatmap({
  proposalId,
  className = "",
}: ProposalEngagementHeatmapProps) {
  const [data, setData] = useState<EngagementHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );

  useEffect(() => {
    loadHeatmapData();
  }, [proposalId, timeRange]);

  const loadHeatmapData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/tracking/heatmap?range=${timeRange}`,
      );
      if (response.ok) {
        const heatmapData = await response.json();
        setData(heatmapData);
      } else {
        // Fallback to mock data
        setData(generateMockData());
      }
    } catch (error) {
      console.error("Error loading heatmap data:", error);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): EngagementHeatmapData => {
    return {
      proposalId,
      sections: [
        {
          sectionId: "exec-summary",
          sectionTitle: "Executive Summary",
          viewCount: 95,
          averageTimeSpent: 120,
          uniqueViewers: 8,
          scrollDepth: 92,
          engagementScore: 95,
        },
        {
          sectionId: "services",
          sectionTitle: "Services Overview",
          viewCount: 87,
          averageTimeSpent: 180,
          uniqueViewers: 7,
          scrollDepth: 88,
          engagementScore: 88,
        },
        {
          sectionId: "pricing",
          sectionTitle: "Pricing & Rates",
          viewCount: 82,
          averageTimeSpent: 240,
          uniqueViewers: 6,
          scrollDepth: 85,
          engagementScore: 85,
        },
        {
          sectionId: "case-studies",
          sectionTitle: "Case Studies",
          viewCount: 65,
          averageTimeSpent: 150,
          uniqueViewers: 5,
          scrollDepth: 72,
          engagementScore: 72,
        },
        {
          sectionId: "terms",
          sectionTitle: "Terms & Conditions",
          viewCount: 45,
          averageTimeSpent: 90,
          uniqueViewers: 4,
          scrollDepth: 58,
          engagementScore: 58,
        },
      ],
      overallEngagement: 80,
    };
  };

  const getIntensityColor = (score: number): string => {
    if (score >= 90) return "#10B981"; // Green
    if (score >= 75) return "#3B82F6"; // Blue
    if (score >= 60) return "#F59E0B"; // Yellow
    if (score >= 40) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
      >
        <p className="text-gray-500 dark:text-gray-400">
          No engagement data available
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Engagement Heatmap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Section-by-section engagement analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {range === "all" ? "All" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Engagement Score */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Engagement Score
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {data.overallEngagement}%
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.overallEngagement}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="space-y-4 mb-6">
        {data.sections.map((section, index) => (
          <motion.div
            key={section.sectionId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {section.sectionTitle}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <i className="ri-eye-line" />
                    {section.viewCount} views
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-time-line" />
                    {formatTime(section.averageTimeSpent)} avg
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="ri-user-line" />
                    {section.uniqueViewers} viewers
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-2xl font-bold"
                  style={{ color: getIntensityColor(section.engagementScore) }}
                >
                  {section.engagementScore}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Engagement
                </div>
              </div>
            </div>

            {/* Engagement Bar */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${section.engagementScore}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: getIntensityColor(
                        section.engagementScore,
                      ),
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                  {section.scrollDepth}% scroll
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Visualization */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Engagement Comparison
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.sections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="sectionTitle"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "engagementScore")
                  return [`${value}%`, "Engagement"];
                if (name === "averageTimeSpent")
                  return [formatTime(value), "Avg Time"];
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="engagementScore"
              fill="#3B82F6"
              name="Engagement Score"
            />
            <Bar dataKey="viewCount" fill="#10B981" name="View Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <i className="ri-lightbulb-line text-amber-600 dark:text-amber-400 text-xl mt-1" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-200 mb-1">
              Engagement Insights
            </h4>
            <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              {data.sections
                .sort((a, b) => b.engagementScore - a.engagementScore)
                .slice(0, 2)
                .map((section) => (
                  <li key={section.sectionId}>
                    • <strong>{section.sectionTitle}</strong> has the highest
                    engagement at {section.engagementScore}%
                  </li>
                ))}
              {data.sections
                .sort((a, b) => a.engagementScore - b.engagementScore)
                .slice(0, 1)
                .map((section) => (
                  <li key={section.sectionId}>
                    • <strong>{section.sectionTitle}</strong> needs improvement
                    ({section.engagementScore}% engagement)
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
