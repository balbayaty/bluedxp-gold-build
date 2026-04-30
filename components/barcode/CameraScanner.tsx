/**
 * Camera-Based Barcode Scanner Component
 * Real-time barcode/QR code detection using device camera
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
  scanType?: "barcode" | "qr" | "both";
}

export default function CameraScanner({
  onScan,
  onClose,
  isOpen,
  scanType = "both",
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setScanning(true);
        startScanning();
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError(err.message || "Failed to access camera");
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    // Stop QuaggaJS if running
    try {
      const { quaggaService } =
        await import("@/lib/services/barcode/quaggaService");
      await quaggaService.stopScanning();
    } catch (error) {
      // QuaggaJS not available, continue
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const startScanning = async () => {
    // Try to use QuaggaJS for real-time scanning
    try {
      const { quaggaService } =
        await import("@/lib/services/barcode/quaggaService");

      if (videoRef.current) {
        const started = await quaggaService.startScanning(
          videoRef.current,
          (result) => {
            if (result.code && result.code !== lastScanned) {
              setLastScanned(result.code);
              onScan(result.code);
            }
          },
          {
            readers:
              scanType === "qr"
                ? ["qr_reader"]
                : scanType === "barcode"
                  ? ["code_128_reader", "ean_reader"]
                  : ["qr_reader", "code_128_reader", "ean_reader"],
          },
        );

        if (started) {
          // QuaggaJS is handling scanning
          return;
        }
      }
    } catch (error) {
      console.log("QuaggaJS not available - using canvas fallback");
    }

    // Fallback: Canvas-based scanning (manual detection)
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Try to detect barcode/QR code
          detectBarcode(canvas);
        }
      }
    }, 500); // Scan every 500ms
  };

  const detectBarcode = async (canvas: HTMLCanvasElement) => {
    try {
      // Try to use QuaggaJS if available
      try {
        const { quaggaService } =
          await import("@/lib/services/barcode/quaggaService");

        const imageBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });

        if (imageBlob) {
          const imageFile = new File([imageBlob], "scan.png", {
            type: "image/png",
          });
          const result = await quaggaService.scanFromImage(imageFile);

          if (result && result.code && result.code !== lastScanned) {
            setLastScanned(result.code);
            onScan(result.code);
          }
        }
      } catch (quaggaError) {
        // QuaggaJS not available, fall back to manual input
        console.log("QuaggaJS not available - using manual input");
      }
    } catch (error) {
      console.error("Barcode detection error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              Scan Barcode/QR Code
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-xs text-gray-400 mt-1">
                Make sure camera permissions are granted
              </p>
            </div>
          )}

          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-cyan-400 rounded-lg w-64 h-64">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
                </div>
              </div>
            )}
          </div>

          {lastScanned && (
            <div className="mb-4 p-3 rounded-lg bg-green-900/20 border border-green-500/30">
              <p className="text-sm text-green-400">
                Last scanned: {lastScanned}
              </p>
            </div>
          )}

          {/* Manual input fallback */}
          <div className="space-y-3">
            <p className="text-sm text-gray-400 text-center">
              Or enter barcode manually:
            </p>
            <input
              type="text"
              placeholder="Enter barcode/QR code"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-cyan-500 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  onScan(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={stopCamera}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
            >
              Stop Camera
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
