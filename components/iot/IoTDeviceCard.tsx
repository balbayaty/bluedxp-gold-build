/**
 * IoT Device Card Component
 * Display individual IoT device information
 */

"use client";

import { motion } from "framer-motion";
import type { IoTDevice } from "@/types/iot";

interface IoTDeviceCardProps {
  device: IoTDevice;
  onClick?: () => void;
}

export default function IoTDeviceCard({ device, onClick }: IoTDeviceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "offline":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "maintenance":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return "text-green-400";
    if (health >= 60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer transition-all ${
        onClick ? "hover:border-cyan-500/50 hover:bg-white/10" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">{device.name}</h3>
          <p className="text-sm text-[#9ca3af]">
            {device.type} • {device.category}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs border ${getStatusColor(device.status.operational)}`}
        >
          {device.status.operational}
        </span>
      </div>

      {device.location && (
        <div className="flex items-center gap-1 text-xs text-[#9ca3af] mb-3">
          <i className="ri-map-pin-line"></i>
          <span>
            {device.location.facility} • {device.location.zone}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-[#9ca3af] mb-1">Health</div>
          <div
            className={`text-lg font-bold ${getHealthColor(device.status.health)}`}
          >
            {device.status.health}%
          </div>
        </div>
        <div>
          <div className="text-xs text-[#9ca3af] mb-1">Protocol</div>
          <div className="text-sm text-white capitalize">
            {device.connectivity.protocol}
          </div>
        </div>
      </div>

      {device.power.batteryLevel !== undefined && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
            <span>Battery</span>
            <span>{device.power.batteryLevel}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                device.power.batteryLevel > 50
                  ? "bg-green-500"
                  : device.power.batteryLevel > 20
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${device.power.batteryLevel}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-xs text-[#6b7280]">
        Last seen: {new Date(device.status.lastSeen).toLocaleString()}
      </div>
    </motion.div>
  );
}
