/**
 * Mobile Warehouse Scanner Component
 * Barcode/QR scanning for warehouse operations
 * Uses existing quaggaService - NO DUPLICATION
 * 4IR & 5IR Aligned • Mobile-First • Offline-Capable
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { quaggaService } from "@/lib/services/barcode/quaggaService";
import type { ScanResult } from "@/lib/services/barcode/quaggaService";
import { offlineService } from "@/lib/services/pwa/offlineService";

interface MobileWarehouseScannerProps {
  warehouseId: string;
  scanMode?: "barcode" | "qr" | "both";
  onScan?: (result: ScanResult, context: string) => void;
  context?: "receiving" | "picking" | "inventory" | "putaway" | "cycle_count";
  autoProcess?: boolean;
}

export default function MobileWarehouseScanner({
  warehouseId,
  scanMode = "both",
  onScan,
  context = "inventory",
  autoProcess = false,
}: MobileWarehouseScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<
    Array<ScanResult & { timestamp: Date; context: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check offline status
    setIsOffline(!offlineService.isOnline());
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) {
      setError("Video element not available");
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const initialized = await quaggaService.initialize();
      if (!initialized) {
        setError("Barcode scanner not available. Please install QuaggaJS.");
        setIsScanning(false);
        return;
      }

      await quaggaService.startScanning(
        videoRef.current,
        (result: ScanResult) => {
          setScanResult(result);
          const scanWithContext = { ...result, timestamp: new Date(), context };
          setScanHistory((prev) => [scanWithContext, ...prev.slice(0, 9)]); // Keep last 10

          // Auto-process if enabled
          if (autoProcess) {
            handleAutoProcess(result);
          }

          // Callback
          onScan?.(result, context);
        },
        {
          readers:
            scanMode === "barcode"
              ? ["code_128_reader", "ean_reader", "upc_reader"]
              : scanMode === "qr"
                ? ["qr_reader"]
                : ["code_128_reader", "ean_reader", "upc_reader", "qr_reader"],
        },
      );
    } catch (error) {
      console.error("Error starting scanner:", error);
      setError("Failed to start scanner");
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    quaggaService.stopScanning();
    setIsScanning(false);
  };

  const handleAutoProcess = async (result: ScanResult) => {
    try {
      // Save to offline storage if offline
      if (isOffline) {
        await offlineService.saveOfflineData({
          type: "create",
          entityType: "warehouse_scan",
          entityId: result.code,
          data: {
            warehouseId,
            code: result.code,
            format: result.format,
            context,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        // Process immediately if online
        await fetch(`/api/warehouse/${warehouseId}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: result.code,
            format: result.format,
            context,
            confidence: result.confidence,
          }),
        });
      }
    } catch (error) {
      console.error("Error processing scan:", error);
    }
  };

  const handleManualProcess = async (result: ScanResult) => {
    await handleAutoProcess(result);
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isScanning ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
          ></div>
          <span className="text-sm text-white">
            {isScanning ? "Scanning..." : "Ready to scan"}
          </span>
        </div>
        {isOffline && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <i className="ri-wifi-off-line"></i>
            <span>Offline Mode</span>
          </div>
        )}
      </div>

      {/* Video Preview */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <i className="ri-qr-scan-2-line text-6xl mb-4 opacity-60"></i>
              <p className="text-sm opacity-70">
                Camera preview will appear when scanning starts
              </p>
            </div>
          </div>
        )}

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-cyan-400 rounded-lg w-64 h-64 animate-pulse">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-qr-scan-2-line"></i>
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-stop-circle-line"></i>
            Stop Scanning
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          <i className="ri-error-warning-line mr-2"></i>
          {error}
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-lg bg-green-500/20 border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-medium">Scan Successful!</span>
            <span className="text-xs text-[#9ca3af]">{scanResult.format}</span>
          </div>
          <div className="text-white font-mono text-lg mb-2">
            {scanResult.code}
          </div>
          <div className="text-xs text-[#9ca3af] mb-3">
            Confidence: {Math.round(scanResult.confidence * 100)}%
          </div>
          {!autoProcess && (
            <button
              onClick={() => handleManualProcess(scanResult)}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Process Scan
            </button>
          )}
        </motion.div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white">Recent Scans</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {scanHistory.map((scan, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-white/5 border border-white/10 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono">{scan.code}</span>
                  <span className="text-xs text-[#9ca3af]">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  {scan.context} • {scan.format} •{" "}
                  {Math.round(scan.confidence * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
