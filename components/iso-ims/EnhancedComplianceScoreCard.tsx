/**
 * Enhanced Compliance Score Card
 *
 * World-Class Visualization with:
 * - Animated progress bars
 * - Multi-standard breakdown
 * - Factor analysis visualization
 * - Trend charts with smooth animations
 * - Expandable sections
 * - Real-time updates
 * - Deep drill-down
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RiShieldCheckLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiTrendingUpLine,
  RiTrendingDownLine,
  RiEyeLine,
  RiDownloadLine,
  RiShareLine,
} from "react-icons/ri";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ComplianceScore } from "@/lib/services/iso-ims/complianceEngine";

interface EnhancedComplianceScoreCardProps {
  score: ComplianceScore;
  onDrillDown?: (standard: string) => void;
  showTrends?: boolean;
  showBreakdown?: boolean;
  showFactors?: boolean;
  realTime?: boolean;
}

export default function EnhancedComplianceScoreCard({
  score,
  onDrillDown,
  showTrends = true,
  showBreakdown = true,
  showFactors = true,
  realTime = false,
}: EnhancedComplianceScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string | null>(null);

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 90)
      return {
        gradient: "from-green-500 to-emerald-600",
        color: "text-green-600",
      };
    if (scoreValue >= 75)
      return { gradient: "from-blue-500 to-cyan-600", color: "text-blue-600" };
    if (scoreValue >= 60)
      return {
        gradient: "from-yellow-500 to-orange-600",
        color: "text-yellow-600",
      };
    return { gradient: "from-red-500 to-pink-600", color: "text-red-600" };
  };

  const scoreColor = getScoreColor(score.overall);

  // Prepare trend data
  const trendData = score.trends.map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: t.score,
  }));

  // Prepare standard breakdown data
  const standardData = Object.entries(score.byStandard).map(
    ([standard, score]) => ({
      standard,
      score,
      status:
        score >= 90
          ? "COMPLIANT"
          : score >= 70
            ? "PARTIALLY_COMPLIANT"
            : "NON_COMPLIANT",
    }),
  );

  // Prepare factor data
  const factorData = score.factors.map((f) => ({
    factor: f.factor,
    impact: f.impact,
    status: f.status,
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RiShieldCheckLine className="h-6 w-6" />
              Compliance Score
            </CardTitle>
            <CardDescription>
              Real-time compliance monitoring across all standards
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {realTime && (
              <Badge variant="outline" className="animate-pulse">
                Live
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Main Score Display */}
          <div className="flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div
                className="text-6xl font-bold bg-gradient-to-r bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${scoreColor.gradient.includes("green") ? "#10b981, #059669" : scoreColor.gradient.includes("blue") ? "#3b82f6, #06b6d4" : scoreColor.gradient.includes("yellow") ? "#eab308, #f97316" : "#ef4444, #ec4899"})`,
                }}
              >
                {score.overall.toFixed(1)}%
              </div>
              <div className="absolute -top-2 -right-2">
                {score.trends.length > 1 &&
                  (score.trends[score.trends.length - 1].score >
                  score.trends[score.trends.length - 2].score ? (
                    <RiTrendingUpLine className="h-6 w-6 text-green-500" />
                  ) : (
                    <RiTrendingDownLine className="h-6 w-6 text-red-500" />
                  ))}
              </div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Compliance</span>
              <span className={scoreColor.color}>
                {score.overall.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score.overall}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${scoreColor.gradient} rounded-full`}
              />
            </div>
          </div>

          {/* Category Breakdown */}
          {showBreakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(score.byCategory).map(([category, score]) => (
                <motion.div
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => onDrillDown?.(category)}
                >
                  <div className="text-sm text-gray-600 capitalize">
                    {category}
                  </div>
                  <div className="text-2xl font-bold">{score}%</div>
                  <div className="h-2 bg-gray-200 rounded-full mt-2">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Trend Chart */}
          {showTrends && trendData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient
                      id="scoreGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expandable Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Standards Breakdown */}
                {standardData.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Standards Breakdown
                    </h3>
                    <div className="space-y-2">
                      {standardData.map((std) => (
                        <div
                          key={std.standard}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedStandard(std.standard);
                            onDrillDown?.(std.standard);
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{std.standard}</div>
                            <div className="text-sm text-gray-600">
                              {std.status}
                            </div>
                          </div>
                          <div className="text-2xl font-bold">{std.score}%</div>
                          <RiEyeLine className="h-5 w-5 text-gray-400 ml-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Factors Analysis */}
                {showFactors && factorData.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Key Factors</h3>
                    <div className="space-y-2">
                      {factorData.map((factor) => (
                        <div
                          key={factor.factor}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{factor.factor}</div>
                            <div className="text-sm text-gray-600">
                              Impact: {factor.impact}%
                            </div>
                          </div>
                          <Badge
                            variant={
                              factor.status === "GOOD"
                                ? "default"
                                : factor.status === "WARNING"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {factor.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDrillDown?.("overall")}
            >
              <RiEyeLine className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button variant="outline" size="sm">
              <RiDownloadLine className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <RiShareLine className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
