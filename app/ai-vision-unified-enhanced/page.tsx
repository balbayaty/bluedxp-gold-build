/**
 * Enhanced Unified AI Vision Dashboard
 * Combines V1 (existing) and V2 (new) features in one beautiful interface
 * Shows how everything integrates together
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import InteractiveAnalysisDashboard from "@/components/vision/enhanced/InteractiveAnalysisDashboard";
import DamagePhotoViewer3D from "@/components/vision/enhanced/DamagePhotoViewer3D";
import LiabilityVisualizer from "@/components/vision/enhanced/LiabilityVisualizer";
import LearningProgressTracker from "@/components/vision/enhanced/LearningProgressTracker";
import VisionAnalysisCard from "@/components/vision/enhanced/VisionAnalysisCard";
import PatternRecognitionChart from "@/components/vision/enhanced/PatternRecognitionChart";
import PredictiveInsightsDashboard from "@/components/vision/enhanced/PredictiveInsightsDashboard";

export default function EnhancedUnifiedVisionDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "analyze"
    | "learning"
    | "liability"
    | "integration"
    | "v1-features"
    | "predictive"
  >("overview");
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "ri-home-line", color: "cyan" },
    { id: "analyze", label: "Analyze", icon: "ri-magic-line", color: "purple" },
    {
      id: "learning",
      label: "Self-Learning",
      icon: "ri-brain-line",
      color: "pink",
    },
    {
      id: "liability",
      label: "Liability",
      icon: "ri-scales-3-line",
      color: "orange",
    },
    {
      id: "predictive",
      label: "Predictive",
      icon: "ri-line-chart-line",
      color: "indigo",
    },
    {
      id: "integration",
      label: "Integration",
      icon: "ri-node-tree",
      color: "blue",
    },
    {
      id: "v1-features",
      label: "V1 Features",
      icon: "ri-eye-line",
      color: "green",
    },
  ];

  return (
    <PageTemplate
      title="🚀 Enhanced AI Vision Intelligence"
      description="Unified dashboard combining V1 (existing) and V2 (enhanced) AI vision capabilities with self-learning, liability assessment, and cross-module integration"
      icon="ri-magic-line"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                V1 + V2 Integrated
              </div>
              <div className="px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                Production Ready
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Enhanced AI Vision System
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              All your existing AI vision tools, enhanced with self-learning,
              liability assessment, cross-module integration, and beautiful 3D
              visualization.
            </p>
          </div>
        </motion.div>

        {/* Architecture Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <i className="ri-information-line text-2xl text-cyan-400"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                How V1 and V2 Work Together
              </h3>
              <p className="text-white/80 text-sm mb-3">
                V2 (Enhanced) uses V1 (Existing) services internally, adding
                learning, liability, and integration layers. Both systems work
                together seamlessly - V1 provides the base analysis, V2 adds
                intelligence on top.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 mb-1">V1 Services (Existing)</p>
                  <ul className="text-white/80 space-y-1">
                    <li>• Base Vision Analysis</li>
                    <li>• Enhanced Vision (RAG)</li>
                    <li>• Chemical Vision</li>
                    <li>• Video Analysis</li>
                    <li>• Streaming Vision</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 mb-1">V2 Enhancements (New)</p>
                  <ul className="text-white/80 space-y-1">
                    <li>• Self-Learning System</li>
                    <li>• Liability Engine</li>
                    <li>• Cross-Module Integration</li>
                    <li>• 3D Visualization</li>
                    <li>• Interactive Dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color === "cyan" ? "blue" : tab.color === "purple" ? "pink" : tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/20`
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`ri-${tab.icon.split("-")[1]}-line`}></i>
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Dashboard */}
              <InteractiveAnalysisDashboard
                analysisData={{
                  totalAnalyses: 1247,
                  anomaliesDetected: 89,
                  qualityScore: 94,
                  complianceRate: 97,
                  processingTime: 2.3,
                  successRate: 98,
                }}
                realTimeUpdates={true}
              />
            </motion.div>
          )}

          {activeTab === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analysis Cards Grid */}
              {analyses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyses.slice(0, 6).map((analysis) => (
                    <VisionAnalysisCard
                      key={analysis.analysisId}
                      analysis={analysis}
                      onViewDetails={(id) => {
                        const found = analyses.find((a) => a.analysisId === id);
                        setSelectedAnalysis(found || null);
                      }}
                      compact={true}
                    />
                  ))}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 cursor-pointer"
                  onClick={() => router.push("/ai-vision-demo")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <i className="ri-magic-line text-purple-400"></i>
                      V2 Enhanced Analysis
                    </h3>
                    <i className="ri-arrow-right-line text-purple-400"></i>
                  </div>
                  <ul className="space-y-2 text-white/80 mb-4">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-purple-400 mt-0.5"></i>
                      <span>Self-learning pattern matching</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-purple-400 mt-0.5"></i>
                      <span>Automatic liability assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-purple-400 mt-0.5"></i>
                      <span>Cross-module action triggers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-purple-400 mt-0.5"></i>
                      <span>3D visualization</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-purple-300 text-sm font-medium">
                      Try it now →
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 cursor-pointer"
                  onClick={() => router.push("/ai-vision-unified")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <i className="ri-eye-line text-green-400"></i>
                      V1 Base Analysis
                    </h3>
                    <i className="ri-arrow-right-line text-green-400"></i>
                  </div>
                  <ul className="space-y-2 text-white/80 mb-4">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span>GPT-4 / Claude Vision</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span>RAG-enhanced analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span>Object detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                      <span>Quality & safety issues</span>
                    </li>
                  </ul>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-green-300 text-sm font-medium">
                      View all features →
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  How They Work Together
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      step: 1,
                      title: "V2 Calls V1",
                      desc: "Uses enhancedVisionService for base analysis",
                      href: "/ai-vision-unified",
                    },
                    {
                      step: 2,
                      title: "Pattern Matching",
                      desc: "Adds learning and pattern recognition",
                      href: "/ai-vision/learning",
                    },
                    {
                      step: 3,
                      title: "Liability & Actions",
                      desc: "Calculates liability and triggers actions",
                      href: "/liability/dashboard",
                    },
                    {
                      step: 4,
                      title: "Enhanced Results",
                      desc: "User sees complete analysis with 3D view",
                      href: "/ai-vision-demo",
                    },
                  ].map((item) => (
                    <motion.button
                      key={item.step}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => router.push(item.href)}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all text-left group"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0 group-hover:bg-purple-500/30">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-purple-300 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-white/70 text-sm">{item.desc}</p>
                      </div>
                      <i className="ri-arrow-right-line text-white/40 group-hover:text-purple-400 transition-colors"></i>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "v1-features" && (
            <motion.div
              key="v1-features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-green-400"></i>
                  All V1 Features Still Available
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Image Analysis",
                      icon: "ri-image-line",
                      desc: "Base vision analysis with GPT-4/Claude",
                      href: "/ai-vision-unified",
                    },
                    {
                      name: "Video Analysis",
                      icon: "ri-video-line",
                      desc: "Frame-by-frame video processing",
                      href: "/ai-vision/video",
                    },
                    {
                      name: "Live Streaming",
                      icon: "ri-live-line",
                      desc: "Real-time RTSP/HLS/WebRTC streams",
                      href: "/ai-vision/stream",
                    },
                    {
                      name: "Chemical Vision",
                      icon: "ri-flask-line",
                      desc: "OCR, GHS symbols, NFPA diamonds",
                      href: "/ai-vision/chemical",
                    },
                    {
                      name: "Manufacturing",
                      icon: "ri-building-line",
                      desc: "Defect detection, quality control",
                      href: "/ai-vision/manufacturing",
                    },
                    {
                      name: "Logistics",
                      icon: "ri-truck-line",
                      desc: "Package damage, loading verification",
                      href: "/ai-vision/logistics",
                    },
                    {
                      name: "Healthcare",
                      icon: "ri-hospital-line",
                      desc: "Equipment verification, sterilization",
                      href: "/ai-vision/healthcare",
                    },
                    {
                      name: "Object Tracking",
                      icon: "ri-focus-3-line",
                      desc: "Track objects across frames",
                      href: "/ai-vision/tracking",
                    },
                    {
                      name: "Anomaly Detection",
                      icon: "ri-alert-line",
                      desc: "Detect unusual patterns",
                      href: "/ai-vision/anomalies",
                    },
                    {
                      name: "Scene Understanding",
                      icon: "ri-landscape-line",
                      desc: "Spatial relationships, context",
                      href: "/ai-vision/scene",
                    },
                  ].map((feature, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(feature.href)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-green-500/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <i
                            className={`ri-${feature.icon.split("-")[1]}-line text-2xl text-green-400 group-hover:text-green-300 transition-colors`}
                          ></i>
                          <h4 className="text-white font-semibold group-hover:text-green-300 transition-colors">
                            {feature.name}
                          </h4>
                        </div>
                        <i className="ri-arrow-right-line text-white/40 group-hover:text-green-400 transition-colors"></i>
                      </div>
                      <p className="text-white/70 text-sm">{feature.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "learning" && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Learning Progress Tracker */}
              <LearningProgressTracker timeframe="30d" />

              {/* Pattern Recognition Chart */}
              {selectedAnalysis && (
                <PatternRecognitionChart
                  patterns={[]}
                  currentAnalysis={{
                    detectedFeatures: [],
                    matchedPatterns: [],
                  }}
                />
              )}
              <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <i className="ri-graduation-cap-line text-pink-400"></i>
                    Self-Learning System
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ai-vision/learning")}
                    className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <i className="ri-arrow-right-line"></i>
                    Deep Dive
                  </motion.button>
                </div>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/ai-vision/learning/patterns")}
                  >
                    <p className="text-white/60 text-sm mb-1">
                      Patterns Learned
                    </p>
                    <p className="text-3xl font-bold text-white">47</p>
                    <p className="text-green-400 text-sm mt-1">
                      +12 this month
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-pink-400 text-xs">
                      <span>View All Patterns</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/ai-vision/learning/accuracy")}
                  >
                    <p className="text-white/60 text-sm mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-white">94%</p>
                    <p className="text-green-400 text-sm mt-1">
                      +8% improvement
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-pink-400 text-xs">
                      <span>View Trends</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/ai-vision/learning/rules")}
                  >
                    <p className="text-white/60 text-sm mb-1">
                      Rules Generated
                    </p>
                    <p className="text-3xl font-bold text-white">23</p>
                    <p className="text-green-400 text-sm mt-1">
                      Auto-generated
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-pink-400 text-xs">
                      <span>View Rules</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                </div>
                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Integration with V1
                  </h4>
                  <p className="text-white/80 mb-4">
                    The self-learning system uses V1's enhancedVisionService for
                    base analysis, then adds pattern matching, learning, and
                    rule generation on top.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        router.push("/ai-vision/learning/how-it-works")
                      }
                      className="bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg p-4 text-left transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <i className="ri-question-line text-2xl text-pink-400"></i>
                        <h5 className="text-white font-semibold">
                          How It Works
                        </h5>
                      </div>
                      <p className="text-white/70 text-sm">
                        Step-by-step explanation of the learning process
                      </p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        router.push("/ai-vision/learning/feedback")
                      }
                      className="bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-lg p-4 text-left transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <i className="ri-feedback-line text-2xl text-pink-400"></i>
                        <h5 className="text-white font-semibold">
                          Provide Feedback
                        </h5>
                      </div>
                      <p className="text-white/70 text-sm">
                        Help the system learn and improve accuracy
                      </p>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "liability" && (
            <motion.div
              key="liability"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <i className="ri-scales-3-line text-orange-400"></i>
                    Liability Engine
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/liability/dashboard")}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <i className="ri-arrow-right-line"></i>
                    Full Dashboard
                  </motion.button>
                </div>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/liability/assessments")}
                  >
                    <p className="text-white/60 text-sm mb-1">
                      Total Assessments
                    </p>
                    <p className="text-3xl font-bold text-white">234</p>
                    <p className="text-green-400 text-sm mt-1">
                      +18 this month
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-orange-400 text-xs">
                      <span>View All</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/liability/claims")}
                  >
                    <p className="text-white/60 text-sm mb-1">
                      Insurance Claims
                    </p>
                    <p className="text-3xl font-bold text-white">AED 125K</p>
                    <p className="text-green-400 text-sm mt-1">
                      Total claimable
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-orange-400 text-xs">
                      <span>View Claims</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer"
                    onClick={() => router.push("/liability/rules")}
                  >
                    <p className="text-white/60 text-sm mb-1">
                      Liability Rules
                    </p>
                    <p className="text-3xl font-bold text-white">42</p>
                    <p className="text-green-400 text-sm mt-1">Active rules</p>
                    <div className="mt-3 flex items-center gap-2 text-orange-400 text-xs">
                      <span>Manage Rules</span>
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </motion.div>
                </div>
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    How It Works with V1
                  </h4>
                  <div className="space-y-3">
                    {[
                      {
                        step: 1,
                        title: "V1 Analysis",
                        desc: "Gets base damage analysis from V1's enhancedVisionService",
                        href: "/ai-vision-unified",
                      },
                      {
                        step: 2,
                        title: "V2 Pattern Matching",
                        desc: "Matches against learned patterns to identify root cause",
                        href: "/ai-vision/learning/patterns",
                      },
                      {
                        step: 3,
                        title: "Liability Rules",
                        desc: "Applies liability rules based on damage type, location, equipment",
                        href: "/liability/rules",
                      },
                      {
                        step: 4,
                        title: "Assessment",
                        desc: "Determines fault, calculates claims, checks compliance",
                        href: "/liability/assessments",
                      },
                    ].map((item) => (
                      <motion.button
                        key={item.step}
                        whileHover={{ scale: 1.02, x: 4 }}
                        onClick={() => router.push(item.href)}
                        className="w-full flex items-start gap-3 bg-white/5 hover:bg-white/10 rounded-lg p-4 border border-white/10 hover:border-orange-500/50 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0 group-hover:bg-orange-500/30">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium group-hover:text-orange-300 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-white/70 text-sm">{item.desc}</p>
                        </div>
                        <i className="ri-arrow-right-line text-white/40 group-hover:text-orange-400 transition-colors"></i>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/liability/calculator")}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-calculator-line text-2xl text-orange-400"></i>
                      <h5 className="text-white font-semibold">
                        Liability Calculator
                      </h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Calculate fault and claimable amounts
                    </p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/liability/compliance")}
                    className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-shield-check-line text-2xl text-orange-400"></i>
                      <h5 className="text-white font-semibold">
                        Compliance Checker
                      </h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Verify legal compliance requirements
                    </p>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "predictive" && (
            <motion.div
              key="predictive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <i className="ri-line-chart-line text-indigo-400"></i>
                    Predictive Analytics
                  </h3>
                  <div className="px-3 py-1 bg-indigo-500/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    AI-Powered Predictions
                  </div>
                </div>
                <p className="text-white/80 mb-6">
                  Get ahead of issues with AI-powered trend forecasting, risk
                  prediction, and proactive insights.
                </p>
              </div>

              {/* Predictive Insights Dashboard */}
              <PredictiveInsightsDashboard timeframe="30d" />
            </motion.div>
          )}

          {activeTab === "integration" && (
            <motion.div
              key="integration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <i className="ri-node-tree text-blue-400"></i>
                    Cross-Module Integration
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ai-vision/integration/map")}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <i className="ri-map-line"></i>
                    View Map
                  </motion.button>
                </div>
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    One Photo Triggers Multiple Actions
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        module: "ISO-IMS",
                        action: "Auto-create NCR",
                        icon: "ri-file-list-line",
                        href: "/ncr-management",
                      },
                      {
                        module: "QHSE",
                        action: "Auto-create Incident",
                        icon: "ri-alert-line",
                        href: "/incident-report",
                      },
                      {
                        module: "ISO-IMS",
                        action: "Auto-create CAPA",
                        icon: "ri-tools-line",
                        href: "/capa-management",
                      },
                      {
                        module: "WMS",
                        action: "Update Inventory",
                        icon: "ri-box-3-line",
                        href: "/inventory",
                      },
                      {
                        module: "Customer",
                        action: "Notify Customer",
                        icon: "ri-customer-service-line",
                        href: "/customer-portal",
                      },
                      {
                        module: "TMS",
                        action: "Update Carrier Score",
                        icon: "ri-truck-line",
                        href: "/carriers",
                      },
                      {
                        module: "Knowledge",
                        action: "Store for Learning",
                        icon: "ri-database-line",
                        href: "/knowledge-base",
                      },
                      {
                        module: "Insurance",
                        action: "Generate Claim",
                        icon: "ri-file-paper-line",
                        href: "/liability/claims",
                      },
                    ].map((item, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(item.href)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-white/10 hover:border-blue-500/50 transition-all group text-left"
                      >
                        <i
                          className={`${item.icon} text-2xl text-blue-400 group-hover:text-blue-300 transition-colors`}
                        ></i>
                        <div className="flex-1">
                          <p className="text-white font-medium group-hover:text-blue-300 transition-colors">
                            {item.module}
                          </p>
                          <p className="text-white/70 text-sm">{item.action}</p>
                        </div>
                        <i className="ri-arrow-right-line text-white/40 group-hover:text-blue-400 transition-colors"></i>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push("/ai-vision/integration/workflows")
                    }
                    className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-flow-chart-line text-2xl text-blue-400"></i>
                      <h5 className="text-white font-semibold">Workflows</h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Configure automation workflows
                    </p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push("/ai-vision/integration/actions")
                    }
                    className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-play-list-line text-2xl text-blue-400"></i>
                      <h5 className="text-white font-semibold">
                        Action History
                      </h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      View all triggered actions
                    </p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push("/ai-vision/integration/settings")
                    }
                    className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <i className="ri-settings-3-line text-2xl text-blue-400"></i>
                      <h5 className="text-white font-semibold">Settings</h5>
                    </div>
                    <p className="text-white/70 text-sm">
                      Configure integration rules
                    </p>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Integration Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <i className="ri-flow-chart text-cyan-400"></i>
            Complete Integration Flow
          </h3>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "User Uploads Photo",
                desc: "On damage page, incident page, or any module",
              },
              {
                step: 2,
                title: "V2 Calls V1",
                desc: "selfLearningVisionService uses enhancedVisionService for base analysis",
              },
              {
                step: 3,
                title: "V1 Returns Analysis",
                desc: "Standard vision analysis with objects, issues, compliance",
              },
              {
                step: 4,
                title: "V2 Adds Learning",
                desc: "Pattern matching, learning, rule generation",
              },
              {
                step: 5,
                title: "V2 Calculates Liability",
                desc: "Fault determination, financial impact, insurance",
              },
              {
                step: 6,
                title: "V2 Triggers Actions",
                desc: "Auto-creates NCRs, Incidents, CAPAs, updates inventory",
              },
              {
                step: 7,
                title: "User Sees Results",
                desc: "Enhanced UI with 3D viewer, patterns, liability, actions",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 pt-2">
                  <h4 className="text-white font-semibold mb-1">
                    {item.title}
                  </h4>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
                {item.step < 7 && (
                  <div className="pt-2">
                    <i className="ri-arrow-down-s-line text-cyan-400 text-xl"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTemplate>
  );
}
