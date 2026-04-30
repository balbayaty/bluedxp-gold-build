"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AIDetection {
  id: string;
  type: "SAFETY" | "QUALITY" | "COMPLIANCE" | "ANOMALY";
  description: string;
  confidence: number;
  location: string;
  timestamp: Date;
  status: "ACTIVE" | "RESOLVED";
}

export default function AIVisionIntegration() {
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [liveFeed, setLiveFeed] = useState(true);

  useEffect(() => {
    const initialDetections: AIDetection[] = [
      {
        id: "1",
        type: "SAFETY",
        description: "PPE compliance detected",
        confidence: 98.5,
        location: "Warehouse A - Zone 1",
        timestamp: new Date(),
        status: "ACTIVE",
      },
      {
        id: "2",
        type: "QUALITY",
        description: "Package damage detected",
        confidence: 92.3,
        location: "Receiving Dock 2",
        timestamp: new Date(),
        status: "ACTIVE",
      },
      {
        id: "3",
        type: "COMPLIANCE",
        description: "Chemical storage compliance verified",
        confidence: 100,
        location: "Hazmat Storage - Section B",
        timestamp: new Date(),
        status: "RESOLVED",
      },
    ];
    setDetections(initialDetections);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SAFETY":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "QUALITY":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "COMPLIANCE":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "ANOMALY":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Vision Integration
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Real-time computer vision for safety, quality, and compliance
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Live Feed Simulation */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <i className="ri-camera-line text-cyan-400"></i>
                Live Camera Feed
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${liveFeed ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm text-[#9ca3af]">
                  {liveFeed ? "Live" : "Offline"}
                </span>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* Simulated Camera Feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-30"></div>
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 border-4 border-cyan-400 rounded-full mx-auto mb-4"
                ></motion.div>
                <div className="text-white font-semibold">AI Vision Active</div>
                <div className="text-sm text-[#9ca3af]">
                  Real-time detection enabled
                </div>
              </div>

              {/* Detection Overlays */}
              {detections
                .filter((d) => d.status === "ACTIVE")
                .map((detection) => (
                  <motion.div
                    key={detection.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          detection.type === "SAFETY"
                            ? "bg-yellow-400"
                            : detection.type === "QUALITY"
                              ? "bg-red-400"
                              : "bg-green-400"
                        }`}
                      ></div>
                      <span className="text-xs text-white font-medium">
                        {detection.type}
                      </span>
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {detection.description}
                    </div>
                    <div className="text-xs text-cyan-400 mt-1">
                      {detection.confidence.toFixed(1)}% confidence
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>

          {/* Detection List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <i className="ri-radar-line text-cyan-400"></i>
              Recent Detections
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {detections.map((detection, index) => (
                <motion.div
                  key={detection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(detection.type)}`}
                      >
                        {detection.type}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          detection.status === "ACTIVE"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {detection.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#9ca3af]">
                      {detection.confidence.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-sm text-white mb-1">
                    {detection.description}
                  </div>
                  <div className="text-xs text-[#9ca3af]">
                    {detection.location}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {new Date(detection.timestamp).toLocaleTimeString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 grid md:grid-cols-4 gap-6"
        >
          {[
            {
              icon: "ri-shield-check-line",
              label: "Safety Compliance",
              value: "98.5%",
            },
            {
              icon: "ri-quality-line",
              label: "Quality Detection",
              value: "95.2%",
            },
            {
              icon: "ri-eye-line",
              label: "Real-time Monitoring",
              value: "24/7",
            },
            { icon: "ri-brain-line", label: "AI Accuracy", value: "96.8%" },
          ].map((capability, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
            >
              <i
                className={`${capability.icon} text-4xl text-cyan-400 mb-4`}
              ></i>
              <div className="text-3xl font-bold text-white mb-2">
                {capability.value}
              </div>
              <div className="text-sm text-[#9ca3af]">{capability.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
