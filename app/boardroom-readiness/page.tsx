/**
 * Boardroom Readiness Dashboard
 * Feature completeness, test coverage, and auditability score
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiCheckboxCircleLine,
  RiFileChartLine,
  RiShieldCheckLine,
  RiBarChartLine,
} from "react-icons/ri";

interface ReadinessMetrics {
  featureCompleteness: {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
    percentage: number;
  };
  testCoverage: {
    total: number;
    covered: number;
    percentage: number;
  };
  auditability: {
    score: number;
    factors: {
      eventLogging: number;
      evidenceTracking: number;
      complianceTags: number;
      documentation: number;
    };
  };
  security: {
    score: number;
    factors: {
      authentication: number;
      authorization: number;
      encryption: number;
      inputValidation: number;
    };
  };
}

export default function BoardroomReadinessPage() {
  const [metrics, setMetrics] = useState<ReadinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const response = await fetch("/api/boardroom-readiness/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>No metrics available</div>
      </div>
    );
  }

  const overallScore = Math.round(
    (metrics.featureCompleteness.percentage +
      metrics.testCoverage.percentage +
      metrics.auditability.score +
      metrics.security.score) /
      4,
  );

  const scoreColor =
    overallScore >= 80
      ? "text-green-400"
      : overallScore >= 60
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Boardroom Readiness Dashboard
          </h1>
          <p className="text-gray-400">
            Comprehensive platform readiness metrics for executive review
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-center">
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>
            {overallScore}%
          </div>
          <div className="text-xl text-gray-400">Overall Readiness Score</div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Feature Completeness */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiCheckboxCircleLine className="text-cyan-400 text-2xl" />
              <h3 className="text-lg font-semibold">Feature Completeness</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics.featureCompleteness.percentage}%
            </div>
            <div className="text-sm text-gray-400">
              {metrics.featureCompleteness.implemented} /{" "}
              {metrics.featureCompleteness.total} features
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div
                className="bg-cyan-400 h-2 rounded-full"
                style={{ width: `${metrics.featureCompleteness.percentage}%` }}
              />
            </div>
          </div>

          {/* Test Coverage */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiFileChartLine className="text-green-400 text-2xl" />
              <h3 className="text-lg font-semibold">Test Coverage</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics.testCoverage.percentage}%
            </div>
            <div className="text-sm text-gray-400">
              {metrics.testCoverage.covered} / {metrics.testCoverage.total}{" "}
              tests
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div
                className="bg-green-400 h-2 rounded-full"
                style={{ width: `${metrics.testCoverage.percentage}%` }}
              />
            </div>
          </div>

          {/* Auditability */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiShieldCheckLine className="text-purple-400 text-2xl" />
              <h3 className="text-lg font-semibold">Auditability</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics.auditability.score}%
            </div>
            <div className="text-sm text-gray-400">Evidence-grade tracking</div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div
                className="bg-purple-400 h-2 rounded-full"
                style={{ width: `${metrics.auditability.score}%` }}
              />
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiShieldCheckLine className="text-red-400 text-2xl" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            <div className="text-3xl font-bold mb-2">
              {metrics.security.score}%
            </div>
            <div className="text-sm text-gray-400">Security posture</div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-4">
              <div
                className="bg-red-400 h-2 rounded-full"
                style={{ width: `${metrics.security.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auditability Factors */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Auditability Factors</h3>
            <div className="space-y-3">
              {Object.entries(metrics.auditability.factors).map(
                ([factor, score]) => (
                  <div key={factor}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400 capitalize">
                        {factor.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-sm font-semibold">{score}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-purple-400 h-1.5 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Security Factors */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Security Factors</h3>
            <div className="space-y-3">
              {Object.entries(metrics.security.factors).map(
                ([factor, score]) => (
                  <div key={factor}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400 capitalize">
                        {factor.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="text-sm font-semibold">{score}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
