/**
 * TIR Carnet Management Component
 * Modern interface for TIR carnet lifecycle
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiTruck,
  FiPlus,
  FiEdit,
  FiEye,
  FiCheckCircle,
  FiAlertCircle,
  FiMapPin,
  FiClock,
  FiShield,
} from "react-icons/fi";

export default function TIRManagement() {
  const [carnets, setCarnets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCarnets();
  }, []);

  const loadCarnets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customs/tir/carnets");
      const data = await response.json();
      setCarnets(data.carnets || []);
    } catch (error) {
      console.error("Failed to load carnets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <FiTruck className="text-cyan-400" />
            <span>TIR Carnet Management</span>
          </h2>
          <p className="text-gray-400 mt-1">
            Manage TIR carnets and border crossings
          </p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2">
          <FiPlus className="w-5 h-5" />
          <span>Issue New Carnet</span>
        </button>
      </div>

      {/* Carnets List */}
      <div className="grid grid-cols-1 gap-4">
        {carnets.map((carnet, index) => (
          <CarnetCard key={carnet.id || index} carnet={carnet} />
        ))}
        {carnets.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
            <FiTruck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No TIR carnets found</p>
            <p className="text-sm text-gray-500 mt-2">
              Issue a new carnet to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CarnetCard({ carnet }: { carnet: any }) {
  const statusColors = {
    ISSUED: "bg-blue-500",
    ACTIVE: "bg-green-500",
    IN_TRANSIT: "bg-yellow-500",
    COMPLETED: "bg-cyan-500",
    CLOSED: "bg-gray-500",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${statusColors[carnet.status as keyof typeof statusColors] || "bg-gray-500"}`}
            ></div>
            <h3 className="text-lg font-semibold">{carnet.carnetNumber}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                carnet.status === "ACTIVE" || carnet.status === "IN_TRANSIT"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {carnet.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Origin</p>
              <p className="font-medium">{carnet.originCountry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Destination</p>
              <p className="font-medium">{carnet.destinationCountry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Borders</p>
              <p className="font-medium flex items-center space-x-1">
                <FiMapPin className="w-4 h-4" />
                <span>{carnet.borders?.length || 0}</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Guarantee</p>
              <p className="font-medium flex items-center space-x-1">
                <FiShield className="w-4 h-4" />
                <span>{carnet.guarantee?.status || "N/A"}</span>
              </p>
            </div>
          </div>

          {/* Border Progress */}
          {carnet.borders && carnet.borders.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Border Progress</span>
                <span className="text-cyan-400">
                  {
                    carnet.borders.filter((b: any) => b.status === "COMPLETED")
                      .length
                  }{" "}
                  / {carnet.borders.length}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(carnet.borders.filter((b: any) => b.status === "COMPLETED").length / carnet.borders.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <FiEye className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <FiEdit className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
