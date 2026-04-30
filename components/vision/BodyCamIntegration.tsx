/**
 * Body Camera Integration Component
 * Real-time video feed from body-worn cameras
 * Supports multiple camera types: DMSS, Axis, Hikvision, etc.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface BodyCamera {
  id: string;
  name: string;
  type: "DMSS" | "AXIS" | "HIKVISION" | "GENERIC" | "WEBCAM";
  status: "online" | "offline" | "recording" | "error";
  streamUrl?: string;
  assignedTo?: string;
  location?: string;
  batteryLevel?: number;
  storageUsed?: number;
  lastActive?: string;
  capabilities?: {
    nightVision: boolean;
    audioRecording: boolean;
    gps: boolean;
    wifi: boolean;
    "4g": boolean;
  };
}

interface BodyCamIntegrationProps {
  onCapture?: (imageData: string, cameraId: string) => void;
  onAnalyze?: (imageData: string, cameraId: string) => void;
}

// Mock camera data
const mockCameras: BodyCamera[] = [
  {
    id: "cam-001",
    name: "Safety Officer 1",
    type: "DMSS",
    status: "online",
    assignedTo: "John Smith",
    location: "Warehouse A",
    batteryLevel: 85,
    storageUsed: 45,
    capabilities: {
      nightVision: true,
      audioRecording: true,
      gps: true,
      wifi: true,
      "4g": true,
    },
  },
  {
    id: "cam-002",
    name: "Quality Inspector",
    type: "AXIS",
    status: "recording",
    assignedTo: "Sarah Johnson",
    location: "Loading Dock",
    batteryLevel: 62,
    storageUsed: 78,
    capabilities: {
      nightVision: true,
      audioRecording: true,
      gps: false,
      wifi: true,
      "4g": false,
    },
  },
  {
    id: "cam-003",
    name: "Hazmat Handler",
    type: "HIKVISION",
    status: "online",
    assignedTo: "Mike Wilson",
    location: "Chemical Storage",
    batteryLevel: 95,
    storageUsed: 23,
    capabilities: {
      nightVision: true,
      audioRecording: true,
      gps: true,
      wifi: true,
      "4g": true,
    },
  },
  {
    id: "cam-004",
    name: "Forklift Operator",
    type: "GENERIC",
    status: "offline",
    assignedTo: "David Lee",
    location: "Zone B",
    batteryLevel: 12,
    storageUsed: 92,
    lastActive: "2024-01-15T14:30:00Z",
    capabilities: {
      nightVision: false,
      audioRecording: true,
      gps: false,
      wifi: true,
      "4g": false,
    },
  },
];

export default function BodyCamIntegration({
  onCapture,
  onAnalyze,
}: BodyCamIntegrationProps) {
  const [cameras, setCameras] = useState<BodyCamera[]>(mockCameras);
  const [selectedCamera, setSelectedCamera] = useState<BodyCamera | null>(null);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "single">("grid");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedImages, setCapturedImages] = useState<
    { id: string; data: string; timestamp: string; cameraId: string }[]
  >([]);
  const [streamActive, setStreamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get status color
  const getStatusColor = (status: BodyCamera["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "recording":
        return "bg-red-500 animate-pulse";
      case "offline":
        return "bg-gray-500";
      case "error":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Start webcam stream
  const startWebcamStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  }, []);

  // Stop webcam stream
  const stopWebcamStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  }, []);

  // Capture image from video
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.9);

      const capture = {
        id: `capture-${Date.now()}`,
        data: imageData,
        timestamp: new Date().toISOString(),
        cameraId: selectedCamera?.id || "webcam",
      };

      setCapturedImages((prev) => [capture, ...prev].slice(0, 10));

      if (onCapture) {
        onCapture(imageData, selectedCamera?.id || "webcam");
      }
    }
  }, [selectedCamera, onCapture]);

  // Analyze captured image
  const analyzeImage = useCallback(
    (imageData: string, cameraId: string) => {
      if (onAnalyze) {
        onAnalyze(imageData, cameraId);
      }
    },
    [onAnalyze],
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <i className="ri-camera-3-line text-white text-2xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Body Camera Integration
            </h3>
            <p className="text-sm text-gray-400">
              {cameras.filter((c) => c.status !== "offline").length} cameras
              online
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {/* View mode toggle */}
          <div className="flex bg-gray-900 rounded-lg p-1">
            {(["grid", "list", "single"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === mode
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "grid" ? "grid-fill" : mode === "list" ? "list-check" : "fullscreen"}-line`}
                ></i>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddCamera(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Add Camera
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div
        className={`grid gap-4 mb-6 ${
          viewMode === "grid"
            ? "grid-cols-2 lg:grid-cols-4"
            : viewMode === "list"
              ? "grid-cols-1"
              : "grid-cols-1"
        }`}
      >
        {cameras.map((camera) => (
          <motion.div
            key={camera.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedCamera(camera)}
            className={`bg-gray-900 rounded-xl p-4 border cursor-pointer transition-all ${
              selectedCamera?.id === camera.id
                ? "border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`}
                ></div>
                <span className="text-sm font-medium text-white">
                  {camera.name}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  camera.type === "DMSS"
                    ? "bg-blue-900/50 text-blue-400"
                    : camera.type === "AXIS"
                      ? "bg-purple-900/50 text-purple-400"
                      : camera.type === "HIKVISION"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-gray-700 text-gray-400"
                }`}
              >
                {camera.type}
              </span>
            </div>

            {viewMode !== "list" && (
              <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                {camera.status === "online" || camera.status === "recording" ? (
                  <>
                    <div className="text-gray-600">
                      <i className="ri-live-line text-4xl"></i>
                    </div>
                    {camera.status === "recording" && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs text-white">REC</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-600 text-center">
                    <i className="ri-wifi-off-line text-3xl"></i>
                    <p className="text-xs mt-1">Offline</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Assigned to</span>
                <span className="text-white">
                  {camera.assignedTo || "Unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Location</span>
                <span className="text-white">{camera.location || "-"}</span>
              </div>
              {camera.batteryLevel !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Battery</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          camera.batteryLevel > 50
                            ? "bg-green-500"
                            : camera.batteryLevel > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${camera.batteryLevel}%` }}
                      />
                    </div>
                    <span className="text-white text-xs">
                      {camera.batteryLevel}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Camera View */}
      <AnimatePresence>
        {selectedCamera && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(selectedCamera.status)}`}
                ></div>
                {selectedCamera.name}
              </h4>
              <button
                onClick={() => setSelectedCamera(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-gray-400"></i>
              </button>
            </div>

            {/* Video Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                  {streamActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <i className="ri-camera-line text-6xl mb-4"></i>
                      <p>Click "Start Stream" to view live feed</p>
                    </div>
                  )}

                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-2 rounded-full">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white font-medium">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    onClick={
                      streamActive ? stopWebcamStream : startWebcamStream
                    }
                    className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                      streamActive
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <i
                      className={
                        streamActive
                          ? "ri-stop-circle-line"
                          : "ri-play-circle-line"
                      }
                    ></i>
                    {streamActive ? "Stop Stream" : "Start Stream"}
                  </button>

                  {streamActive && (
                    <>
                      <button
                        onClick={captureImage}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        <i className="ri-camera-line"></i>
                        Capture
                      </button>

                      <button
                        onClick={() => {
                          if (isRecording) {
                            setIsRecording(false);
                            setRecordingTime(0);
                          } else {
                            setIsRecording(true);
                          }
                        }}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                          isRecording
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        }`}
                      >
                        <i
                          className={
                            isRecording
                              ? "ri-stop-line"
                              : "ri-record-circle-line"
                          }
                        ></i>
                        {isRecording ? "Stop Recording" : "Record"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Captures & Info */}
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">
                    Camera Info
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white">{selectedCamera.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Assigned To</span>
                      <span className="text-white">
                        {selectedCamera.assignedTo || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white">
                        {selectedCamera.location || "-"}
                      </span>
                    </div>
                    {selectedCamera.capabilities && (
                      <div className="pt-2 border-t border-gray-700">
                        <span className="text-gray-400 text-xs">
                          Capabilities
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedCamera.capabilities.nightVision && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              Night Vision
                            </span>
                          )}
                          {selectedCamera.capabilities.gps && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              GPS
                            </span>
                          )}
                          {selectedCamera.capabilities.wifi && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              WiFi
                            </span>
                          )}
                          {selectedCamera.capabilities["4g"] && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                              4G
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Captures */}
                <div className="bg-gray-800 rounded-xl p-4">
                  <h5 className="text-sm font-medium text-gray-400 mb-3">
                    Recent Captures
                  </h5>
                  {capturedImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {capturedImages.slice(0, 4).map((capture) => (
                        <div
                          key={capture.id}
                          className="relative group cursor-pointer"
                          onClick={() =>
                            analyzeImage(capture.data, capture.cameraId)
                          }
                        >
                          <img
                            src={capture.data}
                            alt="Capture"
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs">Analyze</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No captures yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Camera Modal */}
      <AnimatePresence>
        {showAddCamera && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddCamera(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-6">
                Add Body Camera
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Camera Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Safety Officer 2"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Camera Type
                  </label>
                  <select className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:border-cyan-500 focus:outline-none">
                    <option value="DMSS">DMSS (Dahua)</option>
                    <option value="AXIS">Axis</option>
                    <option value="HIKVISION">Hikvision</option>
                    <option value="GENERIC">Generic RTSP</option>
                    <option value="WEBCAM">Webcam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Stream URL (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="rtsp://..."
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Warehouse A"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddCamera(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Add camera logic
                    setShowAddCamera(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Add Camera
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
