/**
 * ICT Hardware Manufacturing Pipeline
 * Track manufacturing progress for ICT products
 */

"use client";

import { useState, useEffect } from "react";

interface Pipeline {
  id: string;
  productId: string;
  stage: string;
  quantity: number;
  completed: number;
  progress: number;
}

export default function ManufacturingPipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPipelines();
  }, []);

  async function loadPipelines() {
    try {
      const response = await fetch(
        "/api/ict-hardware-ecosystem/manufacturing/pipeline",
      );
      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      }
    } catch (error) {
      console.error("Error loading pipelines:", error);
    } finally {
      setLoading(false);
    }
  }

  const stageColors: Record<string, string> = {
    design: "bg-blue-500/20 text-blue-400",
    tooling: "bg-purple-500/20 text-purple-400",
    prototype: "bg-yellow-500/20 text-yellow-400",
    production: "bg-green-500/20 text-green-400",
    quality_control: "bg-cyan-500/20 text-cyan-400",
    packaging: "bg-orange-500/20 text-orange-400",
    shipped: "bg-gray-500/20 text-gray-400",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manufacturing Pipeline</h1>
          <p className="text-gray-400">
            Track ICT hardware manufacturing progress
          </p>
        </div>

        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Product {pipeline.productId}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {pipeline.completed} / {pipeline.quantity} completed
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${stageColors[pipeline.stage] || stageColors.design}`}
                >
                  {pipeline.stage.replace("_", " ").toUpperCase()}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-semibold">
                    {pipeline.progress}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-cyan-400 h-2 rounded-full"
                    style={{ width: `${pipeline.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {pipelines.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No active manufacturing pipelines. Create a pipeline to get
              started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
