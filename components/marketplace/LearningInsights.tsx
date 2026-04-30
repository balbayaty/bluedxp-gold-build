/**
 * Learning & Feedback Components
 * Comprehensive feedback collection, learning insights, and improvement metrics
 * World-class UX with full drill-downs
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  BarChart3,
  Sparkles,
  Send,
  Star,
  MessageSquare,
  X,
  Download,
  Share2,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";
import { learningFeedbackService } from "@/lib/services/marketplace/learningFeedbackService";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface LearningInsightsProps {
  requirementId?: string;
  bookingId?: string;
  matchedProviderId?: string;
  matchedServiceId?: string;
  onFeedbackSubmitted?: () => void;
}

export default function LearningInsights({
  requirementId,
  bookingId,
  matchedProviderId,
  matchedServiceId,
  onFeedbackSubmitted,
}: LearningInsightsProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState({
    customerSatisfaction: 0,
    accuracy: 0,
    outcome: "SUCCESS" as "SUCCESS" | "PARTIAL" | "FAILURE",
    missingInformation: [] as string[],
    suggestions: "",
    notes: "",
  });

  useEffect(() => {
    if (requirementId) {
      loadInsights();
    }
  }, [requirementId]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const result = await learningFeedbackService.getInsights(requirementId!);
      setInsights(result);
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!requirementId || !matchedProviderId || !matchedServiceId) return;

    try {
      await learningFeedbackService.submitFeedback({
        requirementId,
        bookingId,
        matchedProviderId,
        matchedServiceId,
        customerSatisfaction: feedback.customerSatisfaction,
        accuracy: feedback.accuracy,
        outcome: feedback.outcome,
        missingInformation: feedback.missingInformation,
        suggestions: feedback.suggestions ? [feedback.suggestions] : [],
        notes: feedback.notes,
      });
      setShowFeedbackForm(false);
      setFeedback({
        customerSatisfaction: 0,
        accuracy: 0,
        outcome: "SUCCESS",
        missingInformation: [],
        suggestions: "",
        notes: "",
      });
      await loadInsights();
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Form Toggle */}
      {requirementId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Help Us Improve
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Share your feedback to help us improve matching accuracy
              </p>
            </div>
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              {showFeedbackForm ? "Close" : "Submit Feedback"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Feedback Form */}
      <AnimatePresence>
        {showFeedbackForm && (
          <FeedbackForm
            feedback={feedback}
            onFeedbackChange={setFeedback}
            onSubmit={handleSubmitFeedback}
            onClose={() => setShowFeedbackForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Learning Insights */}
      {insights && (
        <>
          <InsightsOverviewSection insights={insights} />
          <MissingFieldsAnalysisSection
            analysis={insights.missingFieldsAnalysis}
          />
          <MatchingPatternsSection patterns={insights.matchingPatterns} />
          <SatisfactionPatternsSection
            patterns={insights.satisfactionPatterns}
          />
          <ImprovementMetricsSection metrics={insights.improvementMetrics} />
          <RecommendationsSection recommendations={insights.recommendations} />
        </>
      )}

      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading insights...
          </p>
        </div>
      )}
    </div>
  );
}

function FeedbackForm({
  feedback,
  onFeedbackChange,
  onSubmit,
  onClose,
}: {
  feedback: any;
  onFeedbackChange: (f: any) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Feedback Form
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Satisfaction Rating */}
        <div>
          <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
            Overall Satisfaction (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  onFeedbackChange({
                    ...feedback,
                    customerSatisfaction: rating,
                  })
                }
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  feedback.customerSatisfaction >= rating
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
        </div>

        {/* Accuracy Rating */}
        <div>
          <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">
            Match Accuracy (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  onFeedbackChange({ ...feedback, accuracy: rating })
                }
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  feedback.accuracy >= rating
                    ? "bg-blue-400 text-blue-900"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                }`}
              >
                <Target className="w-6 h-6" />
              </button>
            ))}
          </div>
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Outcome
          </label>
          <select
            value={feedback.outcome}
            onChange={(e) =>
              onFeedbackChange({ ...feedback, outcome: e.target.value })
            }
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          >
            <option value="SUCCESS">Success</option>
            <option value="PARTIAL">Partial Success</option>
            <option value="FAILURE">Failure</option>
          </select>
        </div>

        {/* Missing Information */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Missing Information (select all that apply)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Location details",
              "Capacity requirements",
              "Timeline",
              "Budget",
              "Special requirements",
              "Compliance needs",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
              >
                <input
                  type="checkbox"
                  checked={feedback.missingInformation.includes(item)}
                  onChange={(e) => {
                    const newMissing = e.target.checked
                      ? [...feedback.missingInformation, item]
                      : feedback.missingInformation.filter(
                          (i: string) => i !== item,
                        );
                    onFeedbackChange({
                      ...feedback,
                      missingInformation: newMissing,
                    });
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Suggestions for Improvement
          </label>
          <textarea
            value={feedback.suggestions}
            onChange={(e) =>
              onFeedbackChange({ ...feedback, suggestions: e.target.value })
            }
            rows={3}
            placeholder="What could we do better?"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Additional Notes
          </label>
          <textarea
            value={feedback.notes}
            onChange={(e) =>
              onFeedbackChange({ ...feedback, notes: e.target.value })
            }
            rows={3}
            placeholder="Any other comments..."
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Submit Feedback
        </button>
      </div>
    </motion.div>
  );
}

function InsightsOverviewSection({ insights }: { insights: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-yellow-500" />
        Learning Insights Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Total Feedback
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {insights.totalFeedback || 0}
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Avg Satisfaction
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {insights.averageSatisfaction?.toFixed(1) || "0.0"}/5
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Avg Accuracy
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {insights.averageAccuracy?.toFixed(1) || "0.0"}/5
          </p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Success Rate
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {insights.successRate || 0}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function MissingFieldsAnalysisSection({ analysis }: { analysis: any }) {
  if (!analysis || !analysis.commonMissingFields) return null;

  const data = analysis.commonMissingFields.map((f: any) => ({
    field: f.field,
    frequency: f.frequency,
    impact: f.impact,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Missing Fields Analysis
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="field" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="frequency" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

function MatchingPatternsSection({ patterns }: { patterns: any }) {
  if (!patterns) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Matching Patterns
      </h2>
      <div className="space-y-4">
        {patterns.topPatterns?.map((pattern: any, idx: number) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {pattern.pattern}
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                {pattern.successRate}% success
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {pattern.description}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SatisfactionPatternsSection({ patterns }: { patterns: any }) {
  if (!patterns) return null;

  const data =
    patterns.satisfactionByCategory?.map((p: any) => ({
      category: p.category,
      satisfaction: p.averageSatisfaction,
    })) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Satisfaction Patterns
      </h2>
      {data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" stroke="#64748b" />
            <YAxis stroke="#64748b" domain={[0, 5]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="satisfaction" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

function ImprovementMetricsSection({ metrics }: { metrics: any }) {
  if (!metrics) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Improvement Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Matching Accuracy
            </h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{metrics.matchingAccuracyImprovement || 0}%
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Satisfaction
            </h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            +{metrics.satisfactionImprovement || 0}%
          </p>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Response Time
            </h3>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            -{metrics.responseTimeImprovement || 0}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function RecommendationsSection({
  recommendations,
}: {
  recommendations: any[];
}) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Recommendations
      </h2>
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {rec.title}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {rec.description}
            </p>
            {rec.expectedImpact && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Expected Impact:{" "}
                <span className="font-medium">{rec.expectedImpact}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
