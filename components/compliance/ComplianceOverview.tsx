"use client";

import { motion } from "framer-motion";
import { ComplianceDashboard } from "@/types/compliance";

interface ComplianceOverviewProps {
  dashboard: ComplianceDashboard;
}

export default function ComplianceOverview({
  dashboard,
}: ComplianceOverviewProps) {
  const cards = [
    {
      title: "Overall Compliance Score",
      value: `${dashboard.overallComplianceScore.toFixed(1)}%`,
      icon: "ri-shield-check-line",
      color:
        dashboard.overallComplianceScore >= 90
          ? "green"
          : dashboard.overallComplianceScore >= 70
            ? "yellow"
            : "red",
      subtitle:
        dashboard.overallComplianceScore >= 90
          ? "Excellent"
          : dashboard.overallComplianceScore >= 70
            ? "Needs Attention"
            : "Critical",
    },
    {
      title: "Compliant Requirements",
      value: dashboard.compliantRequirements.toString(),
      subtitle: `of ${dashboard.totalRequirements} total`,
      icon: "ri-checkbox-circle-line",
      color: "green",
    },
    {
      title: "Non-Compliant",
      value: dashboard.nonCompliantRequirements.toString(),
      icon: "ri-close-circle-line",
      color: "red",
      subtitle: "Requires action",
    },
    {
      title: "At Risk",
      value: dashboard.atRiskRequirements.toString(),
      icon: "ri-alert-line",
      color: "yellow",
      subtitle: "Monitor closely",
    },
    {
      title: "Pending Review",
      value: dashboard.pendingReview.toString(),
      icon: "ri-time-line",
      color: "blue",
      subtitle: "Awaiting review",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          bg: "bg-green-500/20",
          border: "border-green-500/30",
          text: "text-green-400",
          icon: "text-green-400",
          glow: "shadow-green-500/20",
        };
      case "yellow":
        return {
          bg: "bg-yellow-500/20",
          border: "border-yellow-500/30",
          text: "text-yellow-400",
          icon: "text-yellow-400",
          glow: "shadow-yellow-500/20",
        };
      case "red":
        return {
          bg: "bg-red-500/20",
          border: "border-red-500/30",
          text: "text-red-400",
          icon: "text-red-400",
          glow: "shadow-red-500/20",
        };
      case "blue":
        return {
          bg: "bg-cyan-500/20",
          border: "border-cyan-500/30",
          text: "text-cyan-400",
          icon: "text-cyan-400",
          glow: "shadow-cyan-500/20",
        };
      default:
        return {
          bg: "bg-white/5",
          border: "border-white/10",
          text: "text-white",
          icon: "text-[#9ca3af]",
          glow: "",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const colors = getColorClasses(card.color);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${colors.bg} backdrop-blur-xl border ${colors.border} rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 ${colors.glow} shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#9ca3af]">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold ${colors.text} mt-2`}>
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-[#6b7280] mt-1">{card.subtitle}</p>
                )}
              </div>
              <div
                className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}
              >
                <i className={`${card.icon} text-xl ${colors.icon}`}></i>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
