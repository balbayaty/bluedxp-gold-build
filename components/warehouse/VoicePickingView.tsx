/**
 * Voice Picking View Component
 * Hands-free voice-directed picking workflows
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { voicePickingService } from "@/lib/services/wms/voicePickingService";
import type {
  VoicePickingSession,
  VoiceCommand,
  VoicePickingDevice,
} from "@/lib/services/wms/voicePickingService";

interface VoicePickingViewProps {
  warehouseId: string;
}

export default function VoicePickingView({
  warehouseId,
}: VoicePickingViewProps) {
  const [sessions, setSessions] = useState<VoicePickingSession[]>([]);
  const [devices, setDevices] = useState<VoicePickingDevice[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<VoicePickingSession | null>(null);
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadDevices();
  }, [warehouseId]);

  const loadDevices = async () => {
    // Mock devices for now
    setDevices([
      {
        id: "device-1",
        deviceId: "VOICE-001",
        model: "VUFOX VX-500",
        manufacturer: "VUFOX",
        status: "CONNECTED",
        batteryLevel: 85,
        firmwareVersion: "2.1.0",
        lastSeen: new Date(),
        assignedTo: "picker-001",
      },
    ]);
  };

  const startSession = async () => {
    try {
      const session = await voicePickingService.startSession(
        "picker-001",
        warehouseId,
        "task-001",
        "VOICE-001",
        "en",
      );
      setSessions([...sessions, session]);
      setSelectedSession(session);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const processVoiceCommand = async (text: string) => {
    if (!selectedSession) return;

    try {
      const command = await voicePickingService.processCommand(
        selectedSession.id,
        text,
        0.95,
      );
      setCommands([...commands, command]);
    } catch (error) {
      console.error("Error processing command:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Devices Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
          <i className="ri-mic-line mr-3 text-cyan-400"></i>
          Voice Picking Devices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium">{device.deviceId}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    device.status === "CONNECTED"
                      ? "bg-green-500/20 text-green-400"
                      : device.status === "ERROR"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {device.status}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{device.model}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Battery</span>
                <span className="text-white font-medium">
                  {device.batteryLevel}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <i className="ri-file-list-3-line mr-2 text-blue-400"></i>
            Active Sessions
          </h3>
          <button
            onClick={startSession}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2"
          >
            <i className="ri-play-line"></i>
            <span>Start Session</span>
          </button>
        </div>

        {selectedSession && (
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium">
                Session: {selectedSession.id}
              </p>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  selectedSession.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400"
                    : selectedSession.status === "PAUSED"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : selectedSession.status === "COMPLETED"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {selectedSession.status}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div>
                <span className="text-gray-400">Progress: </span>
                <span className="text-white font-medium">
                  {selectedSession.progress.percentage.toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-gray-400">Items: </span>
                <span className="text-white font-medium">
                  {selectedSession.progress.completedItems}/
                  {selectedSession.progress.totalItems}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Voice Input */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
                isListening
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-cyan-600 text-white hover:bg-cyan-700"
              }`}
            >
              <i className={`ri-${isListening ? "stop" : "mic"}-line`}></i>
              <span>{isListening ? "Stop Listening" : "Start Listening"}</span>
            </button>
            {isListening && (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="h-3 w-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Listening...</span>
              </div>
            )}
          </div>

          {/* Command History */}
          {commands.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">
                Recent Commands
              </h4>
              {commands.slice(-5).map((cmd, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm">{cmd.recognizedText}</p>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        cmd.intent === "PICK"
                          ? "bg-green-500/20 text-green-400"
                          : cmd.intent === "CONFIRM"
                            ? "bg-blue-500/20 text-blue-400"
                            : cmd.intent === "ERROR"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {cmd.intent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
