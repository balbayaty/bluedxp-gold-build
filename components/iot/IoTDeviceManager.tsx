/**
 * IoT Device Manager Component
 * Manage and display IoT devices
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import IoTDeviceCard from "./IoTDeviceCard";
import type { IoTDevice } from "@/types/iot";
import { AdvancedIoTManager } from "@/lib/services/iot/iotManager";

interface IoTDeviceManagerProps {
  onDeviceSelect?: (device: IoTDevice) => void;
}

export default function IoTDeviceManager({
  onDeviceSelect,
}: IoTDeviceManagerProps) {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [manager] = useState(() => new AdvancedIoTManager());

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const allDevices = await manager.getAllDevices();
      setDevices(allDevices);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "online" && device.status.operational === "online") ||
      (filter === "offline" && device.status.operational === "offline");

    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDiscover = async () => {
    setLoading(true);
    try {
      const result = await manager.discoverDevices();
      await loadDevices();
    } catch (error) {
      console.error("Error discovering devices:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]"></i>
            <input
              type="text"
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "all"
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/5 text-[#9ca3af] border border-white/10 hover:bg-white/10"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("online")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "online"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-[#9ca3af] border border-white/10 hover:bg-white/10"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setFilter("offline")}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === "offline"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-[#9ca3af] border border-white/10 hover:bg-white/10"
              }`}
            >
              Offline
            </button>
          </div>
        </div>
        <button
          onClick={handleDiscover}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <i className="ri-radar-line"></i>
          Discover Devices
        </button>
      </div>

      {/* Device Grid */}
      {loading ? (
        <div className="text-center py-12 text-[#9ca3af]">
          Loading devices...
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12 text-[#9ca3af]">
          <i className="ri-sensor-line text-4xl mb-3 opacity-50"></i>
          <p>No devices found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or discover new devices
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <IoTDeviceCard
              key={device.id}
              device={device}
              onClick={() => onDeviceSelect?.(device)}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Total Devices</div>
          <div className="text-2xl font-bold text-white">{devices.length}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Online</div>
          <div className="text-2xl font-bold text-green-400">
            {devices.filter((d) => d.status.operational === "online").length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Offline</div>
          <div className="text-2xl font-bold text-red-400">
            {devices.filter((d) => d.status.operational === "offline").length}
          </div>
        </div>
      </div>
    </div>
  );
}
