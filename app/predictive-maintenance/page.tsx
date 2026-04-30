"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { predictMaintenance } from "@/lib/services/ml/predictive-maintenance";

export default function PredictiveMaintenancePage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load equipment and predictions
      // const equipmentData = await getEquipmentList()
      // setEquipment(equipmentData)
      // Generate predictions for each equipment
      // const preds = await Promise.all(equipmentData.map(eq => predictMaintenance(eq)))
      // setPredictions(preds)
    } catch (error) {
      console.error("Error loading maintenance data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Predictive Maintenance"
      description="AI-Powered Maintenance Planning & Predictions"
      icon="ri-tools-line"
      stats={[
        {
          label: "Active Predictions",
          value: predictions.length,
          icon: "ri-tools-line",
          trend: "up" as const,
        },
        {
          label: "Equipment Monitored",
          value: equipment.length,
          icon: "ri-settings-3-line",
          trend: "neutral" as const,
        },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          {loading ? (
            <div className="text-center py-12 text-[#9ca3af]">
              Loading maintenance predictions...
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-tools-line text-4xl mb-3 opacity-50"></i>
              <p>No maintenance predictions available</p>
              <p className="text-sm mt-2">
                Predictions will be generated based on equipment data and sensor
                readings
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <div
                  key={prediction.equipmentId}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">
                        {prediction.equipmentName}
                      </h4>
                      <p className="text-sm text-[#9ca3af] mt-1">
                        {prediction.recommendedAction || "No action required"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded text-xs ${
                        prediction.riskLevel === "high"
                          ? "bg-red-500/20 text-red-400"
                          : prediction.riskLevel === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {prediction.riskLevel}
                    </span>
                  </div>
                  {prediction.predictedDate && (
                    <div className="mt-2 text-xs text-[#6b7280]">
                      Predicted maintenance:{" "}
                      {new Date(prediction.predictedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
