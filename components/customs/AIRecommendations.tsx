/**
 * AI-Powered Recommendations Component
 * Provides intelligent suggestions for customs operations
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiZap,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiChevronRight,
} from "react-icons/fi";

interface Recommendation {
  id: string;
  type: "warning" | "opportunity" | "suggestion" | "alert";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action?: string;
  impact?: string;
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Try to fetch from AI service API
      const response = await fetch("/api/customs/ai/recommendations");
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } else {
        // Fallback: Generate recommendations based on current state
        // In production, this would use AI/ML service
        const recommendations: Recommendation[] = [];

        // Check for common issues and generate recommendations
        // This is a simplified version - real implementation would use AI

        setRecommendations(recommendations);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
      // Set empty array on error
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return FiAlertCircle;
      case "opportunity":
        return FiZap;
      case "suggestion":
        return FiInfo;
      case "alert":
        return FiAlertCircle;
      default:
        return FiInfo;
    }
  };

  const getColor = (type: string, priority: string) => {
    if (type === "warning" || type === "alert") {
      return priority === "high"
        ? "text-red-400 bg-red-500/20"
        : "text-yellow-400 bg-yellow-500/20";
    }
    if (type === "opportunity") {
      return "text-green-400 bg-green-500/20";
    }
    return "text-blue-400 bg-blue-500/20";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <FiZap className="text-cyan-400" />
          <span>AI Recommendations</span>
        </h3>
        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="text-sm text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {recommendations.map((rec) => {
            const Icon = getIcon(rec.type);
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-lg border ${getColor(rec.type, rec.priority)} border-current/30`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        {rec.priority === "high" && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                            HIGH
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-90 mb-2">
                        {rec.description}
                      </p>
                      {rec.impact && (
                        <p className="text-xs opacity-75 mb-2">
                          <strong>Impact:</strong> {rec.impact}
                        </p>
                      )}
                      {rec.action && (
                        <button className="text-sm font-medium flex items-center space-x-1 hover:underline">
                          <span>{rec.action}</span>
                          <FiChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <FiCheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recommendations at this time</p>
          </div>
        )}
      </div>
    </div>
  );
}
