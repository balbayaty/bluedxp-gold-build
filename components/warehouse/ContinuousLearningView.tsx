/**
 * Continuous Learning View Component
 * Self-improving ML models
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { continuousLearningService } from "@/lib/services/wms/continuousLearningService";
import type {
  LearningModel,
  LearningMetrics,
} from "@/lib/services/wms/continuousLearningService";

interface ContinuousLearningViewProps {
  warehouseId: string;
}

export default function ContinuousLearningView({
  warehouseId,
}: ContinuousLearningViewProps) {
  const [models, setModels] = useState<LearningModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<LearningModel | null>(
    null,
  );
  const [metrics, setMetrics] = useState<LearningMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const modelList = await continuousLearningService.getAllModels();
      setModels(modelList);
      if (modelList.length > 0) {
        setSelectedModel(modelList[0]);
        const modelMetrics = await continuousLearningService.getMetrics(
          modelList[0].id,
        );
        setMetrics(modelMetrics);
      }
    } catch (error) {
      console.error("Error loading models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="ri-brain-line mr-3 text-cyan-400"></i>
          Continuous Learning Models
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => {
                setSelectedModel(model);
                continuousLearningService.getMetrics(model.id).then(setMetrics);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedModel?.id === model.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-white/5 border-white/10 hover:border-cyan-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{model.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    model.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : model.status === "TRAINING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {model.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">v{model.version}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Accuracy</span>
                <span className="text-white font-bold">
                  {model.performance.accuracy.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedModel.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-white">
                {selectedModel.performance.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Precision</p>
              <p className="text-2xl font-bold text-white">
                {selectedModel.performance.precision.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Recall</p>
              <p className="text-2xl font-bold text-white">
                {selectedModel.performance.recall.toFixed(1)}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">F1 Score</p>
              <p className="text-2xl font-bold text-white">
                {selectedModel.performance.f1Score.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
