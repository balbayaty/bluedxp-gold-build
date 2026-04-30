/**
 * AI Vision Enhancement Demo Page
 * Mind-blowing interactive demo showcasing all new features
 * Non-breaking: Standalone demo page
 */

"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import DamagePhotoViewer3D from "@/components/vision/enhanced/DamagePhotoViewer3D";
import InteractiveAnalysisDashboard from "@/components/vision/enhanced/InteractiveAnalysisDashboard";

export default function AIVisionDemo() {
  const [selectedTab, setSelectedTab] = useState<
    | "overview"
    | "analyze"
    | "learning"
    | "liability"
    | "integration"
    | "dashboard"
  >("overview");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedPhoto) {
      alert("Please upload a photo first");
      return;
    }

    setAnalyzing(true);

    // Simulate analysis (replace with actual API call)
    setTimeout(() => {
      setAnalysisResult({
        visionAnalysis: {
          analysis: {
            description:
              "Damage detected: Crushed corner on cardboard box. Severity: Major. Likely caused by forklift handling.",
            qualityIssues: [
              {
                type: "damage",
                severity: "major",
                confidence: 92,
                location: { x: 20, y: 30, width: 25, height: 30 },
              },
            ],
            detectedObjects: [
              {
                object: "Cardboard Box",
                confidence: 95,
                boundingBox: { x: 10, y: 10, width: 80, height: 80 },
              },
              {
                object: "Forklift",
                confidence: 78,
                boundingBox: { x: 0, y: 0, width: 15, height: 20 },
              },
            ],
          },
          patternMatches: [
            {
              pattern: {
                id: "pattern-1",
                name: "Forklift Corner Damage",
                description:
                  "Crushed corner damage in loading dock area, typically caused by forklift handling",
                confidence: 85,
                occurrenceCount: 12,
              },
              matchScore: 88,
              matchedFeatures: [
                "damageType:crush",
                "area:loading_dock",
                "equipment:forklift",
              ],
              confidence: 92,
              suggestedAction:
                "High confidence match: Forklift Corner Damage. Apply prevention: Review forklift operator training and loading procedures.",
            },
          ],
          preventionSuggestions: [
            "Review loading dock procedures and equipment handling",
            "Provide additional forklift operator training",
            "Review forklift maintenance schedule",
            "Consider using corner protectors for fragile items",
          ],
          learningMetadata: {
            patternsMatched: 1,
            confidenceBoost: 15,
            newPatternDetected: false,
          },
        },
        liability: {
          assessmentId: "liability-123",
          primaryFault: "warehouse",
          faultPercentage: {
            warehouse: 75,
            carrier: 15,
            supplier: 5,
            customer: 0,
            third_party: 5,
            shared: 0,
            undetermined: 0,
          },
          financialImpact: {
            totalValue: 5000,
            claimableAmount: 1250,
            deductible: 62.5,
            netClaim: 1187.5,
            currency: "AED",
          },
          insurance: {
            claimable: true,
            claimStatus: "not_submitted",
          },
          compliance: {
            compliant: true,
            violations: [],
            requiredActions: ["Document incident for compliance"],
            regulatoryRequirements: [
              "Document all damage incidents",
              "Maintain insurance coverage",
            ],
          },
        },
        integration: {
          integrationId: "integration-123",
          actions: [
            { type: "create_ncr", module: "iso-ims", status: "success" },
            {
              type: "calculate_liability",
              module: "liability",
              status: "success",
            },
            { type: "update_inventory", module: "wms", status: "success" },
            {
              type: "store_knowledge",
              module: "knowledge-base",
              status: "success",
            },
          ],
          executedActions: [
            {
              action: { type: "create_ncr", module: "iso-ims" },
              status: "success",
            },
            {
              action: { type: "calculate_liability", module: "liability" },
              status: "success",
            },
            {
              action: { type: "update_inventory", module: "wms" },
              status: "success",
            },
            {
              action: { type: "store_knowledge", module: "knowledge-base" },
              status: "success",
            },
          ],
          recommendations: [
            "Review damage prevention procedures",
            "Consider additional training for handling staff",
            "Review forklift maintenance schedule",
          ],
        },
      });
      setAnalyzing(false);
      setSelectedTab("analyze");
    }, 2000);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "ri-home-line" },
    { id: "analyze", label: "Analyze Photo", icon: "ri-magic-line" },
    { id: "learning", label: "Self-Learning", icon: "ri-brain-line" },
    { id: "liability", label: "Liability", icon: "ri-scales-3-line" },
    { id: "integration", label: "Integration", icon: "ri-node-tree" },
    { id: "dashboard", label: "Dashboard", icon: "ri-dashboard-line" },
  ];

  return (
    <PageTemplate
      title="🚀 AI Vision Enhancement Demo"
      description="Experience the mind-blowing AI vision system with self-learning, liability assessment, and cross-module integration"
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Mind-Blowing AI Vision System
            </h1>
            <p className="text-xl text-white/90 mb-6 max-w-2xl">
              Self-learning vision analysis that gets smarter with every photo.
              Automatic liability assessment, cross-module integration, and
              beautiful 3D visualization.
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
              >
                <i className="ri-brain-line mr-2"></i>
                Self-Learning
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
              >
                <i className="ri-scales-3-line mr-2"></i>
                Liability Engine
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
              >
                <i className="ri-node-tree mr-2"></i>
                Cross-Module
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
              >
                <i className="ri-3d-line mr-2"></i>
                3D Visualization
              </motion.div>
            </div>
          </div>
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
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
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedTab === tab.id
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
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
          {selectedTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <i className="ri-brain-line text-3xl text-cyan-400"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Self-Learning System
                      </h3>
                      <p className="text-white/70 text-sm">
                        Gets smarter with every photo
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                      <span>Learns damage patterns automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                      <span>Generates rules from patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                      <span>Improves accuracy over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                      <span>Suggests prevention measures</span>
                    </li>
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <i className="ri-scales-3-line text-3xl text-orange-400"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Liability Engine
                      </h3>
                      <p className="text-white/70 text-sm">
                        Automatic fault determination
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-orange-400 mt-0.5"></i>
                      <span>Determines fault automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-orange-400 mt-0.5"></i>
                      <span>Calculates insurance claims</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-orange-400 mt-0.5"></i>
                      <span>Checks legal compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-orange-400 mt-0.5"></i>
                      <span>Assesses financial impact</span>
                    </li>
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <i className="ri-node-tree text-3xl text-blue-400"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Cross-Module Integration
                      </h3>
                      <p className="text-white/70 text-sm">
                        One photo, multiple actions
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-blue-400 mt-0.5"></i>
                      <span>Auto-creates NCRs, Incidents, CAPAs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-blue-400 mt-0.5"></i>
                      <span>Updates inventory automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-blue-400 mt-0.5"></i>
                      <span>Notifies stakeholders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-blue-400 mt-0.5"></i>
                      <span>Updates carrier/supplier scores</span>
                    </li>
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-pink-500/20 rounded-lg">
                      <i className="ri-3d-line text-3xl text-pink-400"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        3D Visualization
                      </h3>
                      <p className="text-white/70 text-sm">
                        Interactive photo viewer
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-white/80">
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-pink-400 mt-0.5"></i>
                      <span>3D rotation and zoom</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-pink-400 mt-0.5"></i>
                      <span>Damage heatmap overlay</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-pink-400 mt-0.5"></i>
                      <span>Object annotations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="ri-checkbox-circle-line text-pink-400 mt-0.5"></i>
                      <span>Real-time analysis display</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          )}

          {selectedTab === "analyze" && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Photo Upload */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Upload Damage Photo
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 border-2 border-dashed border-white/20 rounded-xl hover:border-cyan-500/50 transition-colors text-white/60 hover:text-white"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <i className="ri-upload-cloud-line text-4xl"></i>
                        <span>Click to upload or drag and drop</span>
                        <span className="text-sm">
                          PNG, JPG, GIF up to 10MB
                        </span>
                      </div>
                    </motion.button>
                  </div>
                  {uploadedPhoto && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full md:w-64 h-64 rounded-xl overflow-hidden border border-white/10"
                    >
                      <img
                        src={uploadedPhoto}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}
                </div>
                {uploadedPhoto && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <i className="ri-magic-line"></i>
                        Analyze with AI
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Analysis Results */}
              {analysisResult && (
                <div className="space-y-4">
                  {/* Pattern Matches */}
                  {analysisResult.visionAnalysis?.patternMatches?.length >
                    0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <i className="ri-brain-line text-cyan-400"></i>
                        Learned Patterns Matched
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.visionAnalysis.patternMatches.map(
                          (match: any, idx: number) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-white/5 rounded-lg p-4 border border-white/10"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">
                                  {match.pattern.name}
                                </span>
                                <span className="text-cyan-400 font-semibold">
                                  {Math.round(match.matchScore)}% match
                                </span>
                              </div>
                              <p className="text-white/70 text-sm mb-2">
                                {match.pattern.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <span>
                                  Occurrences: {match.pattern.occurrenceCount}
                                </span>
                                <span>•</span>
                                <span>
                                  Confidence: {match.pattern.confidence}%
                                </span>
                              </div>
                              <p className="text-cyan-400 text-sm mt-2">
                                {match.suggestedAction}
                              </p>
                            </motion.div>
                          ),
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Prevention Suggestions */}
                  {analysisResult.visionAnalysis?.preventionSuggestions
                    ?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
                    >
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <i className="ri-lightbulb-line text-green-400"></i>
                        Prevention Suggestions
                      </h4>
                      <ul className="space-y-2">
                        {analysisResult.visionAnalysis.preventionSuggestions.map(
                          (suggestion: string, idx: number) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-start gap-2 text-white/80"
                            >
                              <i className="ri-checkbox-circle-line text-green-400 mt-0.5"></i>
                              <span>{suggestion}</span>
                            </motion.li>
                          ),
                        )}
                      </ul>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === "learning" && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <i className="ri-graduation-cap-line text-purple-400"></i>
                  Self-Learning System
                </h3>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/60 text-sm mb-1">
                      Patterns Learned
                    </p>
                    <p className="text-3xl font-bold text-white">47</p>
                    <p className="text-green-400 text-sm mt-1">
                      +12 this month
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/60 text-sm mb-1">Accuracy</p>
                    <p className="text-3xl font-bold text-white">94%</p>
                    <p className="text-green-400 text-sm mt-1">
                      +8% improvement
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/60 text-sm mb-1">
                      Rules Generated
                    </p>
                    <p className="text-3xl font-bold text-white">23</p>
                    <p className="text-green-400 text-sm mt-1">
                      Auto-generated
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">
                    How It Works
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        step: 1,
                        title: "Analyze Photo",
                        desc: "AI analyzes damage photo and extracts features",
                      },
                      {
                        step: 2,
                        title: "Match Patterns",
                        desc: "Compares against learned patterns in knowledge base",
                      },
                      {
                        step: 3,
                        title: "Learn New",
                        desc: "If no match, creates new pattern for future reference",
                      },
                      {
                        step: 4,
                        title: "Generate Rules",
                        desc: "After 5+ occurrences, auto-generates prevention rules",
                      },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                            {item.step}
                          </div>
                          <h5 className="text-white font-semibold">
                            {item.title}
                          </h5>
                        </div>
                        <p className="text-white/70 text-sm">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "liability" && analysisResult?.liability && (
            <motion.div
              key="liability"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <i className="ri-scales-3-line text-orange-400"></i>
                  Liability Assessment
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-white/60 text-sm mb-2">Primary Fault</p>
                    <p className="text-3xl font-bold text-white capitalize">
                      {analysisResult.liability.primaryFault.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm mb-4">
                      Fault Distribution
                    </p>
                    <div className="space-y-3">
                      {Object.entries(analysisResult.liability.faultPercentage)
                        .filter(([, percentage]) => Number(percentage) > 0)
                        .map(([party, percentage]) => (
                          <div key={party}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white capitalize">
                                {party.replace("_", " ")}
                              </span>
                              <span className="text-white font-semibold">
                                {Number(percentage)}%
                              </span>
                            </div>
                            <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Number(percentage)}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                              ></motion.div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {analysisResult.liability.financialImpact && (
                    <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/60 text-sm mb-1">
                          Total Value
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {analysisResult.liability.financialImpact.currency}{" "}
                          {analysisResult.liability.financialImpact.totalValue.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/60 text-sm mb-1">
                          Claimable Amount
                        </p>
                        <p className="text-2xl font-bold text-green-400">
                          {analysisResult.liability.financialImpact.currency}{" "}
                          {analysisResult.liability.financialImpact.claimableAmount.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-white/60 text-sm mb-1">Net Claim</p>
                        <p className="text-2xl font-bold text-white">
                          {analysisResult.liability.financialImpact.currency}{" "}
                          {analysisResult.liability.financialImpact.netClaim.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "integration" && analysisResult?.integration && (
            <motion.div
              key="integration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <i className="ri-node-tree text-blue-400"></i>
                  Cross-Module Integration
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-white/60 text-sm mb-4">
                      Actions Executed
                    </p>
                    <div className="space-y-3">
                      {analysisResult.integration.executedActions
                        .filter((a: any) => a.status === "success")
                        .map((action: any, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-4 bg-white/5 rounded-lg p-4 border border-white/10"
                          >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium capitalize">
                                {action.action.type.replace("_", " ")}
                              </p>
                              <p className="text-white/60 text-sm">
                                {action.action.module}
                              </p>
                            </div>
                            <div className="text-green-400">
                              <i className="ri-arrow-right-line"></i>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                  {analysisResult.integration.recommendations?.length > 0 && (
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-white/60 text-sm mb-4">
                        Recommendations
                      </p>
                      <ul className="space-y-2">
                        {analysisResult.integration.recommendations.map(
                          (rec: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-white/80"
                            >
                              <i className="ri-arrow-right-s-line text-blue-400 mt-0.5"></i>
                              <span>{rec}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
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
        </AnimatePresence>

        {/* 3D Viewer Section */}
        {uploadedPhoto && analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <i className="ri-3d-line text-cyan-400"></i>
              3D Photo Viewer
            </h3>
            <div className="h-[600px] rounded-xl overflow-hidden">
              <DamagePhotoViewer3D
                photos={[
                  {
                    id: "demo-photo",
                    damageRecordId: "demo-123",
                    photoUrl: uploadedPhoto,
                    thumbnailUrl: uploadedPhoto,
                    caption: "Damage Photo",
                    takenAt: new Date().toISOString(),
                  },
                ]}
                damageAnalysis={analysisResult.visionAnalysis?.analysis}
                showAnnotations={true}
                showHeatmap={true}
              />
            </div>
          </motion.div>
        )}
      </div>
    </PageTemplate>
  );
}
