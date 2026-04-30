/**
 * Arabic NLP Engine Page
 *
 * Comprehensive Arabic-Native NLP interface with sentiment & intent analysis
 *
 * Features:
 * - Real-time Arabic text analysis
 * - Sentiment analysis with commitment levels
 * - Intent detection (14 business intent types)
 * - Dialect recognition (Gulf dialects)
 * - Cultural context analysis
 * - Inshallah uncertainty detection
 * - Analysis history
 * - Export capabilities
 *
 * @module app/ai/arabic-nlp
 */

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArabicNLPAnalysisCard } from "@/components/arabic-nlp/ArabicNLPAnalysisCard";
import { useArabicNLP } from "@/hooks/useArabicNLP";
import { arabicNLPService } from "@/lib/services/nlp/arabic-nlp";
import type {
  ArabicNLPAnalysis,
  AnalysisOptions,
} from "@/lib/services/nlp/arabic-nlp/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";

interface AnalysisHistoryItem {
  id: string;
  text: string;
  timestamp: Date;
  analysis: ArabicNLPAnalysis;
}

export default function ArabicNLPPage() {
  const { analysis, loading, error, analyze, reset } = useArabicNLP();
  const [inputText, setInputText] = useState("");
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    | "analyze"
    | "history"
    | "examples"
    | "analytics"
    | "integrations"
    | "batch"
    | "compare"
  >("analyze");
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(false);
  const [batchTexts, setBatchTexts] = useState<string[]>([""]);
  const [batchResults, setBatchResults] = useState<
    Array<{
      text: string;
      analysis: ArabicNLPAnalysis | null;
      loading: boolean;
      error: Error | null;
    }>
  >([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonTexts, setComparisonTexts] = useState<[string, string]>([
    "",
    "",
  ]);
  const [comparisonAnalyses, setComparisonAnalyses] = useState<
    [ArabicNLPAnalysis | null, ArabicNLPAnalysis | null]
  >([null, null]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState<AnalysisOptions>({
    includeCulturalContext: true,
    includeInshallah: true,
    includeEntities: true,
    includeIntent: true,
    includeSentiment: true,
  });
  const lastAnalyzedTextRef = useRef<string>("");

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("arabic-nlp-history");
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        );
      }
    } catch (err) {
      console.error("Error loading analysis history:", err);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (text: string, analysis: ArabicNLPAnalysis) => {
    const newItem: AnalysisHistoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      analysis,
    };
    const updatedHistory = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    try {
      localStorage.setItem(
        "arabic-nlp-history",
        JSON.stringify(updatedHistory),
      );
    } catch (err) {
      console.error("Error saving analysis history:", err);
    }
  };

  // Save to history when analysis completes
  useEffect(() => {
    if (
      analysis &&
      inputText.trim() &&
      inputText !== lastAnalyzedTextRef.current
    ) {
      lastAnalyzedTextRef.current = inputText;
      // Check if this analysis is already in history (avoid duplicates)
      setHistory((prevHistory) => {
        const isDuplicate = prevHistory.some(
          (item) =>
            item.text === inputText &&
            Math.abs(item.timestamp.getTime() - new Date().getTime()) < 5000,
        );
        if (!isDuplicate) {
          const newItem: AnalysisHistoryItem = {
            id: Date.now().toString(),
            text: inputText,
            timestamp: new Date(),
            analysis,
          };
          const updatedHistory = [newItem, ...prevHistory].slice(0, 50); // Keep last 50
          try {
            localStorage.setItem(
              "arabic-nlp-history",
              JSON.stringify(updatedHistory),
            );
          } catch (err) {
            console.error("Error saving analysis history:", err);
          }
          return updatedHistory;
        }
        return prevHistory;
      });
    }
  }, [analysis, inputText]); // Trigger when analysis or inputText changes

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      return;
    }

    try {
      await analyze(inputText, analysisOptions);
    } catch (err) {
      console.error("Analysis error:", err);
    }
  };

  // Real-time analysis as you type (debounced)
  useEffect(() => {
    if (realTimeAnalysis && inputText.trim().length > 10) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await analyze(inputText, analysisOptions);
        } catch (err) {
          console.error("Real-time analysis error:", err);
        }
      }, 1000); // 1 second debounce
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputText, realTimeAnalysis, analyze, analysisOptions]);

  // Batch processing
  const handleBatchAnalyze = async () => {
    const textsToAnalyze = batchTexts.filter((t) => t.trim());
    if (textsToAnalyze.length === 0) return;

    setBatchResults(
      textsToAnalyze.map((text) => ({
        text,
        analysis: null,
        loading: true,
        error: null,
      })),
    );

    for (let i = 0; i < textsToAnalyze.length; i++) {
      try {
        const result = await arabicNLPService.analyze(
          textsToAnalyze[i],
          analysisOptions,
        );
        setBatchResults((prev) => {
          const updated = [...prev];
          updated[i] = {
            text: textsToAnalyze[i],
            analysis: result,
            loading: false,
            error: null,
          };
          return updated;
        });
      } catch (err) {
        setBatchResults((prev) => {
          const updated = [...prev];
          updated[i] = {
            text: textsToAnalyze[i],
            analysis: null,
            loading: false,
            error: err instanceof Error ? err : new Error("Analysis failed"),
          };
          return updated;
        });
      }
    }
  };

  // Comparison mode
  const handleCompare = async () => {
    if (!comparisonTexts[0].trim() || !comparisonTexts[1].trim()) return;

    try {
      const [result1, result2] = await Promise.all([
        arabicNLPService.analyze(comparisonTexts[0], analysisOptions),
        arabicNLPService.analyze(comparisonTexts[1], analysisOptions),
      ]);
      setComparisonAnalyses([result1, result2]);
    } catch (err) {
      console.error("Comparison error:", err);
    }
  };

  // Chart data for analytics
  const chartData = useMemo(() => {
    if (history.length === 0) return null;

    // Sentiment timeline
    const sentimentTimeline = history
      .slice(-20) // Last 20 analyses
      .map((item, idx) => ({
        index: idx + 1,
        positive: item.analysis.sentiment.sentiment === "positive" ? 1 : 0,
        negative: item.analysis.sentiment.sentiment === "negative" ? 1 : 0,
        neutral: item.analysis.sentiment.sentiment === "neutral" ? 1 : 0,
        confidence: item.analysis.overallConfidence * 100,
        date: item.timestamp.toLocaleDateString(),
      }));

    // Intent distribution for pie chart
    const intentDistribution = Object.entries(
      history.reduce(
        (acc, item) => {
          const intent = item.analysis.intent.intent;
          acc[intent] = (acc[intent] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    ).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

    // Confidence trend
    const confidenceTrend = history.slice(-30).map((item, idx) => ({
      index: idx + 1,
      confidence: item.analysis.overallConfidence * 100,
      sentiment: item.analysis.sentiment.confidence * 100,
      intent: item.analysis.intent.confidence * 100,
    }));

    return { sentimentTimeline, intentDistribution, confidenceTrend };
  }, [history]);

  const handleClear = () => {
    setInputText("");
    reset();
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("arabic-nlp-history");
  };

  const loadFromHistory = (item: AnalysisHistoryItem) => {
    setInputText(item.text);
    // The analysis will be loaded from the history item
  };

  const exampleTexts = [
    {
      title: "Business Inquiry",
      text: "السلام عليكم، أريد معرفة حالة الشحنة رقم 12345. متى ستصل؟",
      description: "Customer asking about shipment status",
    },
    {
      title: "Complaint",
      text: "الشحنة تأخرت كثيراً وأنا غير راضٍ عن الخدمة. أريد استرداد المبلغ.",
      description: "Customer complaint with refund request",
    },
    {
      title: "Order Request",
      text: "أريد طلب 50 كرتون من المنتج رقم ABC123. إن شاء الله يكون متوفر.",
      description: "Order request with Inshallah expression",
    },
    {
      title: "Urgent Request",
      text: "مطلوب بشكل عاجل! الشحنة مهمة جداً ويجب تسليمها اليوم.",
      description: "Urgent delivery request",
    },
    {
      title: "Thank You",
      text: "شكراً جزيلاً على الخدمة الممتازة. أنتم الأفضل في السوق.",
      description: "Positive feedback and appreciation",
    },
  ];

  const loadExample = (text: string) => {
    setInputText(text);
    setActiveTab("analyze");
  };

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i className="ri-translate-2 text-blue-600"></i>
              Arabic NLP Engine
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Arabic-Native NLP with Sentiment & Intent Analysis
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Direct Arabic text analysis • Gulf dialect support • 86% accuracy
              target
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <i className="ri-close-line mr-2"></i>
              Clear
            </button>
            {analysis && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(analysis, null, 2);
                    const dataBlob = new Blob([dataStr], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `arabic-nlp-analysis-${Date.now()}.json`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Export as JSON"
                >
                  <i className="ri-download-line mr-2"></i>
                  JSON
                </button>
                <button
                  onClick={() => {
                    // Export as CSV
                    const csvRows = [
                      ["Field", "Value"],
                      ["Text", analysis.text],
                      ["Language", analysis.language],
                      ["Dialect", analysis.dialect],
                      ["Sentiment", analysis.sentiment.sentiment],
                      [
                        "Sentiment Confidence",
                        (analysis.sentiment.confidence * 100).toFixed(2) + "%",
                      ],
                      ["Intent", analysis.intent.intent],
                      [
                        "Intent Confidence",
                        (analysis.intent.confidence * 100).toFixed(2) + "%",
                      ],
                      [
                        "Overall Confidence",
                        (analysis.overallConfidence * 100).toFixed(2) + "%",
                      ],
                      [
                        "Quality Score",
                        (analysis.qualityScore * 100).toFixed(2) + "%",
                      ],
                      ["Processing Time", analysis.processingTime + "ms"],
                    ];
                    const csvContent = csvRows
                      .map((row) => row.join(","))
                      .join("\n");
                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `arabic-nlp-analysis-${Date.now()}.csv`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export as CSV"
                >
                  <i className="ri-file-excel-line mr-2"></i>
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("analyze")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "analyze"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-file-search-line mr-2"></i>
              Analyze Text
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-history-line mr-2"></i>
              History ({history.length})
            </button>
            <button
              onClick={() => setActiveTab("examples")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "examples"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-book-open-line mr-2"></i>
              Examples
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "analytics"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-bar-chart-line mr-2"></i>
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "integrations"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-plug-line mr-2"></i>
              Integrations
            </button>
            <button
              onClick={() => setActiveTab("batch")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "batch"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-file-list-3-line mr-2"></i>
              Batch
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "compare"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              <i className="ri-scales-3-line mr-2"></i>
              Compare
            </button>
          </nav>
        </div>

        {/* Analyze Tab */}
        {activeTab === "analyze" && (
          <div className="space-y-6">
            {/* Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Analysis Options
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeSentiment}
                    onChange={(e) =>
                      setAnalysisOptions({
                        ...analysisOptions,
                        includeSentiment: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Sentiment Analysis
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeIntent}
                    onChange={(e) =>
                      setAnalysisOptions({
                        ...analysisOptions,
                        includeIntent: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Intent Detection
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeEntities}
                    onChange={(e) =>
                      setAnalysisOptions({
                        ...analysisOptions,
                        includeEntities: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Dialect Detection
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeCulturalContext}
                    onChange={(e) =>
                      setAnalysisOptions({
                        ...analysisOptions,
                        includeCulturalContext: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Cultural Context
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analysisOptions.includeInshallah}
                    onChange={(e) =>
                      setAnalysisOptions({
                        ...analysisOptions,
                        includeInshallah: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Inshallah Analysis
                  </span>
                </label>
              </div>
            </div>

            {/* Real-time Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={realTimeAnalysis}
                  onChange={(e) => setRealTimeAnalysis(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Real-time Analysis
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically analyze as you type (1 second delay)
                  </p>
                </div>
              </label>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arabic Text Input
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="أدخل النص العربي للتحليل..."
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-right"
                rows={6}
                dir="rtl"
              />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {inputText.length} characters
                  {realTimeAnalysis && inputText.length > 10 && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      <i className="ri-pulse-line mr-1"></i>
                      Real-time active
                    </span>
                  )}
                </span>
                <button
                  onClick={handleAnalyze}
                  disabled={(!inputText.trim() || loading) && !realTimeAnalysis}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="ri-search-line"></i>
                      {realTimeAnalysis ? "Manual Analyze" : "Analyze Text"}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                  <i className="ri-error-warning-line"></i>
                  <span className="font-medium">Error:</span>
                  <span>{error.message}</span>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ArabicNLPAnalysisCard
                  text={inputText}
                  analysis={analysis}
                  loading={loading}
                  error={error}
                  showDetails={true}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                />
              </motion.div>
            )}

            {/* Quick Stats with Visual Gauges */}
            {analysis && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Language
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {analysis.language.toUpperCase()}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${analysis.languageConfidence * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {(analysis.languageConfidence * 100).toFixed(0)}%
                      confidence
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Sentiment
                  </div>
                  <div
                    className={`text-lg font-semibold capitalize mt-1 ${
                      analysis.sentiment.sentiment === "positive"
                        ? "text-green-600"
                        : analysis.sentiment.sentiment === "negative"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {analysis.sentiment.sentiment}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          analysis.sentiment.sentiment === "positive"
                            ? "bg-green-600"
                            : analysis.sentiment.sentiment === "negative"
                              ? "bg-red-600"
                              : "bg-gray-600"
                        }`}
                        style={{
                          width: `${analysis.sentiment.confidence * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {(analysis.sentiment.confidence * 100).toFixed(0)}%
                      confidence
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Intent
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {analysis.intent.intent.replace(/_/g, " ")}
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${analysis.intent.confidence * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {(analysis.intent.confidence * 100).toFixed(0)}%
                      confidence
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Overall Confidence
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {(analysis.overallConfidence * 100).toFixed(0)}%
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full transition-all"
                        style={{
                          width: `${analysis.overallConfidence * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Quality: {(analysis.qualityScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                <i className="ri-history-line text-6xl text-gray-400 mb-4"></i>
                <p className="text-gray-500 dark:text-gray-400">
                  No analysis history yet
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Start analyzing Arabic text to build your history
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Analysis History
                  </h3>
                  <button
                    onClick={handleClearHistory}
                    className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <i className="ri-delete-bin-line mr-2"></i>
                    Clear History
                  </button>
                </div>
                <div className="space-y-3">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p
                            className="text-sm text-gray-900 dark:text-white font-medium mb-2"
                            dir="rtl"
                          >
                            {item.text.substring(0, 100)}
                            {item.text.length > 100 ? "..." : ""}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              <i className="ri-time-line mr-1"></i>
                              {item.timestamp.toLocaleString()}
                            </span>
                            <span>
                              <i className="ri-emotion-line mr-1"></i>
                              {item.analysis.sentiment.sentiment}
                            </span>
                            <span>
                              <i className="ri-focus-3-line mr-1"></i>
                              {item.analysis.intent.intent}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadFromHistory(item);
                            setActiveTab("analyze");
                          }}
                          className="ml-4 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <i className="ri-refresh-line mr-1"></i>
                          Reload
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === "examples" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Example Arabic Texts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any example to load it into the analyzer
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exampleTexts.map((example, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => loadExample(example.text)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {example.title}
                    </h4>
                    <i className="ri-arrow-left-line text-gray-400"></i>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {example.description}
                  </p>
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded border-r-4 border-blue-500"
                    dir="rtl"
                  >
                    {example.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics & Statistics
            </h3>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Analyses
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {history.length}
                </div>
                <div className="text-xs text-gray-400 mt-1">All time</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Target Accuracy
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-1">86%</div>
                <div className="text-xs text-gray-400 mt-1">
                  vs 71% baseline
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Improvement
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  +15%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  points above baseline
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Avg Confidence
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {history.length > 0
                    ? Math.round(
                        (history.reduce(
                          (sum, item) => sum + item.analysis.overallConfidence,
                          0,
                        ) /
                          history.length) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Overall confidence
                </div>
              </div>
            </div>

            {/* Interactive Charts */}
            {chartData && (
              <>
                {/* Sentiment Timeline Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Sentiment Timeline (Last 20 Analyses)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData.sentimentTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="index" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="positive"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Positive"
                      />
                      <Area
                        type="monotone"
                        dataKey="negative"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                        name="Negative"
                      />
                      <Area
                        type="monotone"
                        dataKey="neutral"
                        stackId="1"
                        stroke="#6b7280"
                        fill="#6b7280"
                        fillOpacity={0.6}
                        name="Neutral"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Intent Distribution Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Intent Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData.intentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.intentDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#3b82f6",
                                "#10b981",
                                "#f59e0b",
                                "#ef4444",
                                "#8b5cf6",
                                "#ec4899",
                              ][index % 6]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Confidence Trend Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Confidence Trends (Last 30 Analyses)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.confidenceTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="index" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", r: 4 }}
                        name="Overall Confidence"
                      />
                      <Line
                        type="monotone"
                        dataKey="sentiment"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 4 }}
                        name="Sentiment Confidence"
                      />
                      <Line
                        type="monotone"
                        dataKey="intent"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", r: 4 }}
                        name="Intent Confidence"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* Intent Distribution (Fallback if no charts) */}
            {history.length > 0 && !chartData && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Intent Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(
                    history.reduce(
                      (acc, item) => {
                        const intent = item.analysis.intent.intent;
                        acc[intent] = (acc[intent] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([intent, count]) => (
                      <div key={intent} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {intent.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {count} (
                              {Math.round((count / history.length) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(count / history.length) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sentiment Distribution */}
            {history.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Sentiment Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["positive", "negative", "neutral", "mixed"].map(
                    (sentiment) => {
                      const count = history.filter(
                        (item) =>
                          item.analysis.sentiment.sentiment === sentiment,
                      ).length;
                      const percentage =
                        history.length > 0 ? (count / history.length) * 100 : 0;
                      return (
                        <div key={sentiment} className="text-center">
                          <div
                            className={`text-3xl font-bold mb-2 ${
                              sentiment === "positive"
                                ? "text-green-600"
                                : sentiment === "negative"
                                  ? "text-red-600"
                                  : sentiment === "neutral"
                                    ? "text-gray-600"
                                    : "text-yellow-600"
                            }`}
                          >
                            {count}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {sentiment}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* Dialect Distribution */}
            {history.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Dialect Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(
                    history.reduce(
                      (acc, item) => {
                        const dialect = item.analysis.dialect;
                        acc[dialect] = (acc[dialect] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([dialect, count]) => (
                      <div
                        key={dialect}
                        className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize mt-1">
                          {dialect}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Integrations
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Arabic NLP Engine integrates seamlessly with multiple BlueDXP
              services
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cargo Psychology Integration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <i className="ri-brain-line text-2xl text-blue-600"></i>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    Cargo Psychology
                  </h4>
                  <span className="ml-auto px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Automatic sentiment analysis for psychology signals,
                  commitment level mapping, and Inshallah uncertainty detection.
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Sentiment analysis integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Commitment level mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Inshallah analysis</span>
                  </div>
                </div>
              </div>

              {/* Event Store Integration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <i className="ri-database-line text-2xl text-blue-600"></i>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    Event Store
                  </h4>
                  <span className="ml-auto px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  All analyses are stored as events with full audit trail and
                  learning from outcomes.
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Event sourcing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Full audit trail</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Learning from outcomes</span>
                  </div>
                </div>
              </div>

              {/* Knowledge Base Integration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <i className="ri-book-open-line text-2xl text-blue-600"></i>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    Knowledge Base
                  </h4>
                  <span className="ml-auto px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Learning signals stored for pattern recognition, historical
                  analysis, and accuracy improvement.
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Learning signals storage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Pattern recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>Historical analysis</span>
                  </div>
                </div>
              </div>

              {/* MCP Tools Integration */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <i className="ri-robot-line text-2xl text-blue-600"></i>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    MCP Tools
                  </h4>
                  <span className="ml-auto px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  AI agents can analyze Arabic text, detect intent, and analyze
                  Inshallah usage via MCP tools.
                </p>
                <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>analyze_arabic_text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>detect_arabic_intent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-checkbox-circle-line text-green-600"></i>
                    <span>analyze_inshallah</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Analysis Speed
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    &lt; 300ms
                  </div>
                  <div className="text-xs text-gray-400">Pattern-based</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    With LLM
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    &lt; 2000ms
                  </div>
                  <div className="text-xs text-gray-400">LLM-enhanced</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Intent Detection
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    &lt; 100ms
                  </div>
                  <div className="text-xs text-gray-400">Pattern-based</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Sentiment Analysis
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    &lt; 50ms
                  </div>
                  <div className="text-xs text-gray-400">Real-time</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
