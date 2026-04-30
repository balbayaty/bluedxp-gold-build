/**
 * Compliance Score Widget
 */

"use client";

import React from "react";
import { FiShield, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

interface ComplianceScoreProps {
  score?: number;
  trend?: number;
}

export default function ComplianceScore({
  score = 85,
  trend = 3,
}: ComplianceScoreProps) {
  const getColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center space-x-2">
          <FiShield className="text-cyan-400" />
          <span>Compliance Score</span>
        </h3>
        <div
          className={`flex items-center space-x-1 text-sm ${trend >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {trend >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-32 flex items-center justify-center">
          <div className="relative w-24 h-24">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-800"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                className={getColor(score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getColor(score)}`}>
                {score}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
