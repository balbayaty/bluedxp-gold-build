/**
 * Country Adapters Management Page
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiLink,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiRefreshCw,
  FiGlobe,
  FiShield,
} from "react-icons/fi";

interface AdapterStatus {
  id: string;
  name: string;
  country: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: Date;
  environment: "sandbox" | "production";
}

export default function AdaptersPage() {
  const [adapters, setAdapters] = useState<AdapterStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdapters();
  }, []);

  const loadAdapters = async () => {
    setLoading(true);
    try {
      // Fetch from adapter registry via API
      const response = await fetch("/api/customs/adapters");
      if (response.ok) {
        const data = await response.json();
        setAdapters(data.adapters || []);
      } else {
        // Fallback: Get from registry directly (client-side)
        // Note: This requires adapter registry to be accessible
        const allAdapters = [
          {
            id: "cargox-egypt",
            name: "CargoX (Egypt ACID)",
            country: "EG",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
          {
            id: "nafeza-egypt",
            name: "NAFEZA (Egypt)",
            country: "EG",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
          {
            id: "fasah-saudi",
            name: "FASAH (Saudi Arabia)",
            country: "SA",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
          {
            id: "dubai-trade-uae",
            name: "Dubai Trade (UAE)",
            country: "AE",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
          {
            id: "asycuda-kuwait",
            name: "ASYCUDA (Kuwait)",
            country: "KW",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
          {
            id: "etir-international",
            name: "ETIR (TIR/ETIR)",
            country: "TIR",
            status: "disconnected" as const,
            environment: "sandbox" as const,
          },
        ];
        setAdapters(allAdapters);
      }
    } catch (error) {
      console.error("Failed to load adapters:", error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (adapterId: string) => {
    try {
      const response = await fetch(`/api/customs/adapters/${adapterId}/test`, {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        loadAdapters();
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <FiLink className="text-cyan-400" />
              <span>Country Adapters</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage customs system integrations
            </p>
          </div>
          <button
            onClick={loadAdapters}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adapters.map((adapter) => (
            <motion.div
              key={adapter.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <FiGlobe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{adapter.name}</h3>
                    <p className="text-sm text-gray-400">{adapter.country}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    adapter.status === "connected"
                      ? "bg-green-500"
                      : adapter.status === "error"
                        ? "bg-red-500"
                        : "bg-gray-500"
                  }`}
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`font-medium ${
                      adapter.status === "connected"
                        ? "text-green-400"
                        : adapter.status === "error"
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {adapter.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Environment</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      adapter.environment === "production"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {adapter.environment.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => testConnection(adapter.id)}
                    className="flex-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    <span>Test</span>
                  </button>
                  <button className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                    <FiSettings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
