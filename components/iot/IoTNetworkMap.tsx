/**
 * IoT Network Map Component
 * Visualize IoT device network topology
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { IoTDevice } from "@/types/iot";
import { AdvancedIoTManager } from "@/lib/services/iot/iotManager";

export default function IoTNetworkMap() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
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

  const gateways = devices.filter((d) => d.type === "gateway");
  const sensors = devices.filter((d) => d.type === "sensor");
  const edgeDevices = devices.filter((d) => d.type === "edge_compute");

  if (loading) {
    return (
      <div className="text-center py-12 text-[#9ca3af]">
        Loading network map...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Gateways</div>
          <div className="text-2xl font-bold text-cyan-400">
            {gateways.length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Sensors</div>
          <div className="text-2xl font-bold text-green-400">
            {sensors.length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-sm text-[#9ca3af] mb-1">Edge Devices</div>
          <div className="text-2xl font-bold text-amber-400">
            {edgeDevices.length}
          </div>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Network Topology
        </h3>
        <div className="relative min-h-[400px] bg-[#0a0a0f] rounded-lg p-8">
          {/* Gateways */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            {gateways.map((gateway, index) => (
              <motion.div
                key={gateway.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedDevice(gateway)}
                className={`absolute w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center cursor-pointer border-2 ${
                  selectedDevice?.id === gateway.id
                    ? "border-yellow-400"
                    : "border-transparent"
                }`}
                style={{
                  left: `${(index - gateways.length / 2) * 100}px`,
                }}
              >
                <i className="ri-router-line text-white text-xl"></i>
              </motion.div>
            ))}
          </div>

          {/* Sensors */}
          <div className="absolute bottom-4 left-0 right-0">
            <div className="flex justify-center gap-4 flex-wrap">
              {sensors.slice(0, 10).map((sensor, index) => (
                <motion.div
                  key={sensor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedDevice(sensor)}
                  className={`w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer border-2 ${
                    selectedDevice?.id === sensor.id
                      ? "border-yellow-400"
                      : "border-transparent"
                  }`}
                >
                  <i className="ri-sensor-line text-white"></i>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {gateways.map((gateway, gIndex) =>
              sensors
                .slice(0, 3)
                .map((sensor, sIndex) => (
                  <line
                    key={`${gateway.id}-${sensor.id}`}
                    x1={`${50 + (gIndex - gateways.length / 2) * 6.25}%`}
                    y1="10%"
                    x2={`${10 + sIndex * 10}%`}
                    y2="80%"
                    stroke="rgba(6, 182, 212, 0.3)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                )),
            )}
          </svg>
        </div>
      </div>

      {/* Selected Device Info */}
      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">
            {selectedDevice.name}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Type</div>
              <div className="text-white">{selectedDevice.type}</div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Protocol</div>
              <div className="text-white capitalize">
                {selectedDevice.connectivity.protocol}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Status</div>
              <div className="text-white capitalize">
                {selectedDevice.status.operational}
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-1">Health</div>
              <div className="text-white">{selectedDevice.status.health}%</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
