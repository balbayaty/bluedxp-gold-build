"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { mlModelRegistry } from "@/lib/services/ml-registry";
import type {
  MLModel,
  ModelType,
  ModelStatus,
  TrainingJob,
  ABTest,
} from "@/lib/services/ml-registry";
import { format } from "date-fns";
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
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MLRegistryPage() {
  const [models, setModels] = useState<MLModel[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [abTests, setABTests] = useState<ABTest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [selectedJob, setSelectedJob] = useState<TrainingJob | null>(null);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [viewMode, setViewMode] = useState<
    "models" | "training" | "abtests" | "stats"
  >("models");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const [modelsData, jobsData, testsData, statsData] = await Promise.all([
        mlModelRegistry.listModels().catch((err) => {
          console.error("[ML Registry] Error loading models:", err);
          return [];
        }),
        mlModelRegistry.listTrainingJobs().catch((err) => {
          console.error("[ML Registry] Error loading training jobs:", err);
          return [];
        }),
        Promise.resolve([]), // AB tests would come from registry
        mlModelRegistry.getStatistics().catch((err) => {
          console.error("[ML Registry] Error loading statistics:", err);
          return {
            totalModels: 0,
            deployedModels: 0,
            activeTrainingJobs: 0,
            activeABTests: 0,
            modelsByType: {},
            modelsByStatus: {},
          };
        }),
      ]);

      // Validate data
      setModels(Array.isArray(modelsData) ? modelsData : []);
      setTrainingJobs(Array.isArray(jobsData) ? jobsData : []);
      setABTests(Array.isArray(testsData) ? testsData : []);
      setStats(
        statsData || {
          totalModels: 0,
          deployedModels: 0,
          activeTrainingJobs: 0,
          activeABTests: 0,
          modelsByType: {},
          modelsByStatus: {},
        },
      );
    } catch (error: any) {
      console.error("[ML Registry] Fatal error loading data:", error);
      setError(
        error.message ||
          "Failed to load ML registry data. Please refresh the page or contact support if the issue persists.",
      );
      // Set empty defaults to prevent crashes
      setModels([]);
      setTrainingJobs([]);
      setABTests([]);
      setStats({
        totalModels: 0,
        deployedModels: 0,
        activeTrainingJobs: 0,
        activeABTests: 0,
        modelsByType: {},
        modelsByStatus: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const pageStats = useMemo(
    () =>
      stats
        ? [
            {
              label: "Total Models",
              value: stats.totalModels,
              icon: "ri-brain-line",
              trend: "up" as const,
            },
            {
              label: "Deployed Models",
              value: stats.deployedModels,
              icon: "ri-rocket-line",
              trend: "up" as const,
            },
            {
              label: "Active Training",
              value: stats.activeTrainingJobs,
              icon: "ri-loader-4-line",
              trend: "neutral" as const,
            },
            {
              label: "A/B Tests",
              value: stats.activeABTests,
              icon: "ri-test-tube-line",
              trend: "neutral" as const,
            },
          ]
        : [],
    [stats],
  );

  const modelsByType = useMemo(() => {
    if (!stats?.modelsByType) return [];
    return Object.entries(stats.modelsByType).map(([type, count]) => ({
      type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
    }));
  }, [stats]);

  const modelsByStatus = useMemo(() => {
    if (!stats?.modelsByStatus) return [];
    return Object.entries(stats.modelsByStatus).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  }, [stats]);

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <ErrorBoundary>
      <PageTemplate
        title="ML Model Registry"
        description="Machine Learning model management, training pipeline, versioning, and A/B testing"
        icon="ri-brain-line"
        systemInfo={{
          sap: "ML Model Registry, AI/ML Management",
          oracle: "Machine Learning Operations",
          manhattan: "ML Model Management",
        }}
        examples={[
          "Model versioning and management",
          "Training pipeline orchestration",
          "A/B testing and model comparison",
          "Model deployment and monitoring",
          "Performance metrics tracking",
          "Automated retraining",
        ]}
        stats={pageStats}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {(["models", "training", "abtests", "stats"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? "bg-cyan-500 text-white"
                        : "text-[#9ca3af] hover:text-white"
                    }`}
                  >
                    <i
                      className={`ri-${mode === "models" ? "brain-line" : mode === "training" ? "loader-4-line" : mode === "abtests" ? "test-tube-line" : "bar-chart-line"} mr-1`}
                    ></i>
                    {mode === "models"
                      ? "Models"
                      : mode === "training"
                        ? "Training"
                        : mode === "abtests"
                          ? "A/B Tests"
                          : "Statistics"}
                  </button>
                ),
              )}
            </div>
            <button
              onClick={() => setShowModelModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <i className="ri-add-line"></i>
              Register Model
            </button>
          </div>
        }
      >
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <i className="ri-error-warning-line text-2xl text-red-400 flex-shrink-0 mt-1"></i>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Error Loading Data
                </h3>
                <p className="text-[#9ca3af] mb-4">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={loadData}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <i className="ri-refresh-line"></i>
                    Retry
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {/* Models View */}
            {viewMode === "models" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model, index) => (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {model.name}
                          </h3>
                          <p className="text-sm text-[#9ca3af] mb-2">
                            {model.description}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                              {model.type.replace("_", " ")}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                model.status === "deployed"
                                  ? "bg-green-500/20 text-green-400"
                                  : model.status === "ready"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : model.status === "training"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {model.status}
                            </span>
                            <span className="text-xs px-2 py-1 bg-white/10 text-white rounded">
                              v{model.version}
                            </span>
                          </div>
                        </div>
                      </div>
                      {model.metrics && (
                        <div className="space-y-2 pt-4 border-t border-white/10">
                          {model.metrics.accuracy && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#9ca3af]">Accuracy</span>
                              <span className="text-white font-medium">
                                {(model.metrics.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {model.metrics.f1Score && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#9ca3af]">F1 Score</span>
                              <span className="text-white font-medium">
                                {(model.metrics.f1Score * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {model.deployment.isDeployed && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="text-xs text-[#9ca3af]">
                            <i className="ri-rocket-line mr-1"></i>
                            Deployed to {model.deployment.environment}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {models.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-brain-line text-6xl text-gray-500 mb-4"></i>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Models Registered
                    </h3>
                    <p className="text-[#9ca3af] mb-6">
                      Get started by registering your first ML model
                    </p>
                    <button
                      onClick={() => setShowModelModal(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Register Model
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Training Jobs View */}
            {viewMode === "training" && (
              <div className="space-y-4">
                {trainingJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Training Job: {job.id}
                        </h3>
                        <p className="text-sm text-[#9ca3af]">
                          Model: {job.modelId}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          job.status === "running"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : job.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    {job.status === "running" && job.progress && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-[#9ca3af]">Progress</span>
                          <span className="text-white font-medium">
                            {job.progress.percentComplete.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                            style={{
                              width: `${job.progress.percentComplete}%`,
                            }}
                          />
                        </div>
                        {job.progress.currentEpoch && (
                          <div className="text-xs text-[#9ca3af] mt-2">
                            Epoch {job.progress.currentEpoch} /{" "}
                            {job.progress.totalEpochs}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
                {trainingJobs.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-loader-4-line text-6xl text-gray-500 mb-4"></i>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Training Jobs
                    </h3>
                    <p className="text-[#9ca3af]">
                      Training jobs will appear here when models are being
                      trained
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Statistics View */}
            {viewMode === "stats" && stats && (
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Models by Type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={modelsByType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {modelsByType.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Models by Status
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelsByStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            )}

            {/* A/B Tests View */}
            {viewMode === "abtests" && (
              <div className="space-y-4">
                {abTests.map((test, index) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {test.name}
                        </h3>
                        <p className="text-sm text-[#9ca3af]">
                          {test.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          test.status === "running"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : test.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                    {test.results && (
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-sm text-[#9ca3af] mb-2">
                            Control Model
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {test.controlModelId}
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                          <div className="text-sm text-[#9ca3af] mb-2">
                            Treatment Model
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {test.treatmentModelId}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {abTests.length === 0 && (
                  <div className="text-center py-12">
                    <i className="ri-test-tube-line text-6xl text-gray-500 mb-4"></i>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No A/B Tests
                    </h3>
                    <p className="text-[#9ca3af]">
                      A/B tests will appear here when comparing model versions
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Model Details Modal */}
            <Modal
              isOpen={showModelModal}
              onClose={() => {
                setShowModelModal(false);
                setSelectedModel(null);
              }}
              title={selectedModel ? "Model Details" : "Register New Model"}
              size="lg"
            >
              {selectedModel ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-[#9ca3af] mb-1">Name</div>
                      <div className="text-white font-medium">
                        {selectedModel.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-[#9ca3af] mb-1">Type</div>
                      <div className="text-white font-medium">
                        {selectedModel.type}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-[#9ca3af] mb-1">Version</div>
                      <div className="text-white font-medium">
                        {selectedModel.version}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                      <div className="text-white font-medium">
                        {selectedModel.status}
                      </div>
                    </div>
                  </div>
                  {selectedModel.metrics && (
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-white font-medium mb-3">
                        Performance Metrics
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedModel.metrics.accuracy && (
                          <div>
                            <div className="text-sm text-[#9ca3af] mb-1">
                              Accuracy
                            </div>
                            <div className="text-white font-medium">
                              {(selectedModel.metrics.accuracy * 100).toFixed(
                                2,
                              )}
                              %
                            </div>
                          </div>
                        )}
                        {selectedModel.metrics.f1Score && (
                          <div>
                            <div className="text-sm text-[#9ca3af] mb-1">
                              F1 Score
                            </div>
                            <div className="text-white font-medium">
                              {(selectedModel.metrics.f1Score * 100).toFixed(2)}
                              %
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#9ca3af]">
                    Model registration form would go here
                  </p>
                </div>
              )}
            </Modal>
          </>
        )}
      </PageTemplate>
    </ErrorBoundary>
  );
}
