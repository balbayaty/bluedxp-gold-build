/**
 * Warehouse Camera View Component
 * Supports RTSP, HLS, and other video stream formats
 * Adapted from chemcheck-ai for Hazalyze Platform
 */

"use client";

import React, { useState } from "react";
import ReactPlayer from "react-player";
import { motion } from "framer-motion";

export interface Camera {
  id: string;
  name: string;
  streamUrl: string; // RTSP, HLS, or other stream URLs
  type?: "rtsp" | "hls" | "webrtc" | "http";
  status?: "online" | "offline" | "error";
  location?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  cameras: Camera[];
}

interface WarehouseCameraViewProps {
  warehouse: Warehouse | null;
  onCapture?: (cameraId: string, imageData: string) => void;
  showControls?: boolean;
  autoPlay?: boolean;
}

const WarehouseCameraView: React.FC<WarehouseCameraViewProps> = ({
  warehouse,
  onCapture,
  showControls = true,
  autoPlay = true,
}) => {
  const [streamErrors, setStreamErrors] = useState<Record<string, boolean>>({});
  const [buffering, setBuffering] = useState<Record<string, boolean>>({});

  if (!warehouse) {
    return (
      <div className="p-6 bg-gray-800 border border-gray-700 rounded-xl text-center">
        <i className="ri-camera-line text-4xl text-gray-500 mb-3"></i>
        <p className="text-gray-400">
          Select a warehouse to view its camera feeds
        </p>
      </div>
    );
  }

  const handleStreamError = (cameraId: string, error: any) => {
    console.error(`Error playing video for ${cameraId}:`, error);
    setStreamErrors((prev) => ({ ...prev, [cameraId]: true }));
  };

  const handleBuffer = (cameraId: string) => {
    setBuffering((prev) => ({ ...prev, [cameraId]: true }));
  };

  const handleBufferEnd = (cameraId: string) => {
    setBuffering((prev) => ({ ...prev, [cameraId]: false }));
  };

  const handleCapture = async (cameraId: string, streamUrl: string) => {
    if (onCapture) {
      // For RTSP streams, we'd need a backend proxy to capture frames
      // For now, we'll use a placeholder
      try {
        const response = await fetch(
          `/api/camera-proxy?deviceId=${cameraId}&action=capture`,
        );
        const data = await response.json();
        if (data.imageData) {
          onCapture(cameraId, data.imageData);
        }
      } catch (error) {
        console.error("Capture error:", error);
      }
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{warehouse.name}</h2>
        <p className="text-sm text-gray-400">{warehouse.location}</p>
      </div>

      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <i className="ri-video-line text-cyan-400"></i>
        Live Camera Feeds
      </h3>

      {warehouse.cameras && warehouse.cameras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouse.cameras.map((camera) => {
            const hasError = streamErrors[camera.id];
            const isBuffering = buffering[camera.id];

            return (
              <motion.div
                key={camera.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-700"
              >
                <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        camera.status === "online"
                          ? "bg-green-400"
                          : camera.status === "offline"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                      }`}
                    ></div>
                    <p className="text-sm font-semibold text-white">
                      {camera.name}
                    </p>
                  </div>
                  {onCapture && (
                    <button
                      onClick={() => handleCapture(camera.id, camera.streamUrl)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <i className="ri-camera-fill"></i>
                      Capture
                    </button>
                  )}
                </div>

                <div className="relative aspect-video bg-black">
                  {hasError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                      <i className="ri-error-warning-line text-4xl text-red-400 mb-2"></i>
                      <p className="text-sm">Stream unavailable</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {camera.streamUrl}
                      </p>
                    </div>
                  ) : ReactPlayer.canPlay(camera.streamUrl) ? (
                    <>
                      {isBuffering && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                        </div>
                      )}
                      <ReactPlayer
                        url={camera.streamUrl}
                        playing={autoPlay}
                        controls={showControls}
                        width="100%"
                        height="100%"
                        className="react-player"
                        config={{
                          file: {
                            attributes: {
                              controlsList: "nodownload",
                            },
                          },
                          rtsp: {
                            // RTSP specific config
                          },
                        }}
                        onError={(e) => handleStreamError(camera.id, e)}
                        onBuffer={() => handleBuffer(camera.id)}
                        onBufferEnd={() => handleBufferEnd(camera.id)}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                      <i className="ri-alert-line text-4xl text-yellow-400 mb-2"></i>
                      <p className="text-sm">Unsupported stream format</p>
                      <p className="text-xs text-gray-400 mt-1 break-all text-center">
                        {camera.streamUrl}
                      </p>
                    </div>
                  )}
                </div>

                {camera.location && (
                  <div className="p-2 bg-gray-800 text-xs text-gray-400">
                    <i className="ri-map-pin-line mr-1"></i>
                    {camera.location}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
          <i className="ri-camera-off-line text-5xl text-gray-500 mb-3"></i>
          <p className="text-gray-400">
            No cameras configured for this warehouse
          </p>
        </div>
      )}
    </div>
  );
};

export default WarehouseCameraView;
