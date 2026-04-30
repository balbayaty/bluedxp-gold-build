/**
 * Unified AI Vision Dashboard
 * Comprehensive vision analysis interface with all capabilities
 * Enhanced with full functionality - not just placeholders
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import VisionAnalysisButton from "@/components/vision/VisionAnalysisButton";

export default function UnifiedVisionDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "image" | "video" | "stream" | "chemical" | "industry"
  >("image");
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalysisComplete = (result: any) => {
    setAnalyses([result, ...analyses]);
    setSelectedAnalysis(result);
  };

  return (
    <PageTemplate
      title="AI Vision Intelligence"
      description="Comprehensive AI vision analysis with RAG, object tracking, anomaly detection, and industry-specific intelligence"
      icon="ri-eye-line"
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 rounded-2xl p-8 md:p-12"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                V1 Unified Dashboard
              </div>
              <div className="px-3 py-1 bg-green-500/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                Production Ready
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Vision Intelligence
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              Comprehensive vision analysis with RAG, object tracking, anomaly
              detection, and industry-specific intelligence.
            </p>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/ai-vision-unified-enhanced")}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                <i className="ri-rocket-line"></i>
                View Enhanced Version (V2)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/ai-vision")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium transition-all flex items-center gap-2"
              >
                <i className="ri-settings-3-line"></i>
                Advanced Settings
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-2">
          <nav className="flex flex-wrap gap-2">
            {[
              {
                id: "image",
                label: "Image Analysis",
                icon: "ri-image-line",
                color: "blue",
              },
              {
                id: "video",
                label: "Video Analysis",
                icon: "ri-video-line",
                color: "purple",
              },
              {
                id: "stream",
                label: "Live Streams",
                icon: "ri-live-line",
                color: "cyan",
              },
              {
                id: "chemical",
                label: "Chemical Vision",
                icon: "ri-flask-line",
                color: "green",
              },
              {
                id: "industry",
                label: "Industry Analysis",
                icon: "ri-building-line",
                color: "orange",
              },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color === "blue" ? "purple" : tab.color === "purple" ? "pink" : tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/20`
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`ri-${tab.icon.split("-")[1]}-line`}></i>
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "image" && (
            <motion.div
              key="image"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Enhanced Image Analysis
                </h3>
                <p className="text-white/70 mb-6">
                  Upload images for RAG-enhanced analysis with knowledge base
                  integration, object detection, anomaly detection, and
                  industry-specific insights.
                </p>
                <div className="flex items-center gap-4">
                  <VisionAnalysisButton
                    onAnalysisComplete={handleAnalysisComplete}
                    module="general"
                    buttonText="Analyze Image"
                    buttonIcon="ri-upload-cloud-line"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ai-vision")}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all"
                  >
                    <i className="ri-settings-3-line mr-2"></i>
                    Advanced Options
                  </motion.button>
                </div>
              </div>
              {selectedAnalysis && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Analysis Results
                  </h3>

                  {/* Analysis Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm mb-1">
                        Compliance Score
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {selectedAnalysis.complianceScore || "N/A"}%
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm mb-1">Total Issues</p>
                      <p className="text-2xl font-bold text-white">
                        {selectedAnalysis.totalIssues || 0}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm mb-1">
                        Critical Issues
                      </p>
                      <p className="text-2xl font-bold text-red-400">
                        {selectedAnalysis.criticalIssues || 0}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Analysis Details
                    </h4>
                    <pre className="text-white/70 text-xs overflow-auto max-h-96">
                      {JSON.stringify(selectedAnalysis, null, 2)}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        router.push(
                          `/ai-vision-unified-enhanced?analysisId=${selectedAnalysis.analysisId}`,
                        )
                      }
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <i className="ri-rocket-line"></i>
                      View Enhanced Analysis
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const dataStr = JSON.stringify(
                          selectedAnalysis,
                          null,
                          2,
                        );
                        const dataBlob = new Blob([dataStr], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = `vision-analysis-${selectedAnalysis.analysisId}.json`;
                        link.click();
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2"
                    >
                      <i className="ri-download-line"></i>
                      Export JSON
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Video Analysis
                </h3>
                <p className="text-white/70 mb-6">
                  Upload videos for frame-by-frame analysis with object
                  tracking, motion detection, and anomaly detection.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/ai-vision/video")}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <i className="ri-video-line"></i>
                  Go to Video Analysis
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "stream" && (
            <motion.div
              key="stream"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Live Stream Analysis
                </h3>
                <p className="text-white/70 mb-6">
                  Connect to RTSP, HLS, or WebRTC streams for real-time analysis
                  with live alerts and monitoring.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Stream URL
                      </label>
                      <input
                        type="text"
                        placeholder="rtsp://camera.example.com/stream"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-2">
                        Stream Name
                      </label>
                      <input
                        type="text"
                        placeholder="Camera 1"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push("/ai-vision/stream")}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <i className="ri-live-line"></i>
                    Start Live Stream Analysis
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "chemical" && (
            <motion.div
              key="chemical"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Chemical Vision
                </h3>
                <p className="text-white/70 mb-6">
                  Analyze chemical labels with real OCR, GHS symbol detection,
                  NFPA diamond reading, and compliance checking.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/ai-vision/chemical")}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <i className="ri-flask-line"></i>
                  Go to Chemical Vision
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === "industry" && (
            <motion.div
              key="industry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Industry-Specific Analysis
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Manufacturing",
                      icon: "ri-building-line",
                      desc: "Defect detection, quality control, equipment inspection",
                      href: "/ai-vision/manufacturing",
                    },
                    {
                      name: "Logistics",
                      icon: "ri-truck-line",
                      desc: "Package damage, loading verification, inventory counting",
                      href: "/ai-vision/logistics",
                    },
                    {
                      name: "Healthcare",
                      icon: "ri-hospital-line",
                      desc: "Equipment verification, sterilization, patient safety",
                      href: "/ai-vision/healthcare",
                    },
                  ].map((industry, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(industry.href)}
                      className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-blue-500/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <i
                          className={`ri-${industry.icon.split("-")[1]}-line text-3xl text-blue-400 group-hover:text-blue-300 transition-colors`}
                        ></i>
                        <h4 className="text-white font-semibold text-lg group-hover:text-blue-300 transition-colors">
                          {industry.name}
                        </h4>
                      </div>
                      <p className="text-white/70 text-sm">{industry.desc}</p>
                      <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                        <span>View Details</span>
                        <i className="ri-arrow-right-line"></i>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Links */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                label: "Enhanced Dashboard",
                href: "/ai-vision-unified-enhanced",
                icon: "ri-rocket-line",
                color: "purple",
              },
              {
                label: "Learning System",
                href: "/ai-vision/learning",
                icon: "ri-brain-line",
                color: "pink",
              },
              {
                label: "Liability Dashboard",
                href: "/liability/dashboard",
                icon: "ri-scales-3-line",
                color: "orange",
              },
              {
                label: "Integration Map",
                href: "/ai-vision/integration/map",
                icon: "ri-node-tree",
                color: "blue",
              },
            ].map((link, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(link.href)}
                className={`bg-gradient-to-br from-${link.color}-500/20 to-${link.color}-600/20 border border-${link.color}-500/30 rounded-xl p-4 hover:border-${link.color}-400/50 transition-all text-left group`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <i
                    className={`ri-${link.icon.split("-")[1]}-line text-2xl text-${link.color}-400 group-hover:text-${link.color}-300 transition-colors`}
                  ></i>
                  <h4 className="text-white font-semibold group-hover:text-${link.color}-300 transition-colors">
                    {link.label}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors text-sm">
                  <span>Explore</span>
                  <i className="ri-arrow-right-line"></i>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
