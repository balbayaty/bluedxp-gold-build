/**
 * Pattern Recognition Chart
 * Visual chart showing pattern recognition and matching
 * From UI/UX mocks - ensures all visualized features are implemented
 */

"use client";

import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PatternRecognitionChartProps {
  patterns: Array<{
    id: string;
    name: string;
    confidence: number;
    accuracy: number;
    occurrenceCount: number;
    matchedFeatures: string[];
  }>;
  currentAnalysis?: {
    detectedFeatures: string[];
    matchedPatterns: string[];
  };
}

export default function PatternRecognitionChart({
  patterns,
  currentAnalysis,
}: PatternRecognitionChartProps) {
  // Prepare radar chart data
  const radarData = patterns.map((pattern) => ({
    pattern: pattern.name,
    confidence: pattern.confidence,
    accuracy: pattern.accuracy,
    frequency: Math.min(100, pattern.occurrenceCount * 10),
    matchRate: pattern.matchedFeatures.length > 0 ? 85 : 50,
  }));

  // Feature matching visualization
  const featureMatchData =
    currentAnalysis?.detectedFeatures?.map((feature) => {
      const matched =
        currentAnalysis?.matchedPatterns?.includes(feature) || false;
      return {
        feature,
        matched,
        confidence: matched ? 90 : 30,
      };
    }) || [];

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">
            Pattern Recognition Radar
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="pattern" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Confidence"
                dataKey="confidence"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Radar
                name="Accuracy"
                dataKey="accuracy"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Feature Matching */}
      {featureMatchData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Feature Matching</h4>
          <div className="space-y-3">
            {featureMatchData.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.matched ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <span className="font-medium text-gray-900">
                    {item.feature}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                  {item.matched && (
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Matched
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern List */}
      {patterns.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Recognized Patterns</h4>
          <div className="space-y-3">
            {patterns.map((pattern, idx) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-900">
                    {pattern.name}
                  </h5>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {pattern.confidence}%
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {pattern.accuracy}%
                      </div>
                      <div className="text-xs text-gray-500">Accuracy</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Seen {pattern.occurrenceCount} times</span>
                  {pattern.matchedFeatures.length > 0 && (
                    <>
                      <span>•</span>
                      <span>
                        {pattern.matchedFeatures.length} features matched
                      </span>
                    </>
                  )}
                </div>
                {pattern.matchedFeatures.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pattern.matchedFeatures.map((feature, fIdx) => (
                      <span
                        key={fIdx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
