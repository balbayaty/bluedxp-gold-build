"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function QRDigitalTwinDashboard() {
  const [twins, setTwins] = useState<any[]>([]);
  const [selectedTwin, setSelectedTwin] = useState<any>(null);
  const [simulation, setSimulation] = useState<any>(null);

  const runSimulation = async (twinId: string) => {
    try {
      const res = await fetch("/api/qr/digital-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run-simulation",
          twinId,
          name: "Scan Forecast",
          type: "scan_forecast",
          parameters: { days: 30 },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulation(data.simulation);
      }
    } catch (error) {
      console.error("Error running simulation:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Digital Twins */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-cpu-line text-cyan-400"></i>
          QR Digital Twins
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { id: "twin-1", qrId: "qr-123", status: "synced", scans: 234 },
            { id: "twin-2", qrId: "qr-456", status: "synced", scans: 156 },
            { id: "twin-3", qrId: "qr-789", status: "drift", scans: 89 },
          ].map((twin) => (
            <motion.div
              key={twin.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedTwin(twin);
                runSimulation(twin.id);
              }}
              className="p-4 rounded-lg border border-gray-700 hover:border-cyan-500 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">{twin.qrId}</div>
                <div
                  className={`w-2 h-2 rounded-full ${
                    twin.status === "synced" ? "bg-green-400" : "bg-yellow-400"
                  }`}
                />
              </div>
              <div className="text-sm text-gray-400">Scans: {twin.scans}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Simulation Results */}
      {simulation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-4">Simulation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Predicted Scans</div>
              <div className="text-2xl font-bold text-cyan-400">
                {simulation.results.predictedScans}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Confidence</div>
              <div className="text-2xl font-bold text-green-400">
                {(simulation.results.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Locations</div>
              <div className="text-2xl font-bold text-blue-400">
                {simulation.results.predictedLocations?.length || 0}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className="text-2xl font-bold text-purple-400 capitalize">
                {simulation.status}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
