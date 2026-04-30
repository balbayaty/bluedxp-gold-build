"use client";

import { Leaf, Award } from "lucide-react";

interface SustainabilityBadgeProps {
  esgScore: number;
  certifications: string[];
  carbonReduction?: number;
  className?: string;
}

export default function SustainabilityBadge({
  esgScore,
  certifications,
  carbonReduction,
  className = "",
}: SustainabilityBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border ${getScoreColor(esgScore)} ${className}`}
    >
      <Leaf className="w-4 h-4" />
      <span className="text-sm font-semibold">ESG: {esgScore}</span>
      <span className="text-xs opacity-75">{getScoreLabel(esgScore)}</span>
      {certifications.length > 0 && (
        <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-current/20">
          <Award className="w-3 h-3" />
          <span className="text-xs">
            {certifications.length} Certifications
          </span>
        </div>
      )}
      {carbonReduction && carbonReduction > 0 && (
        <span className="text-xs opacity-75 ml-2 pl-2 border-l border-current/20">
          {carbonReduction.toFixed(0)}% CO₂ Reduction
        </span>
      )}
    </div>
  );
}
