"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wmsInventoryIntegration } from "@/lib/services/wms/inventoryIntegration";
import type { RealTimeInventoryData } from "@/lib/services/wms/inventoryIntegration";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";

interface InventoryScannerProps {
  skuId: string;
  skuCode: string;
  onScanComplete?: (data: RealTimeInventoryData) => void;
}

export default function InventoryScanner({
  skuId,
  skuCode,
  onScanComplete,
}: InventoryScannerProps) {
  const notifications = useNotifications();
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<"RFID" | "BARCODE">("BARCODE");
  const [scanValue, setScanValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<RealTimeInventoryData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanning]);

  const handleScan = async () => {
    if (!scanValue.trim() || !location.trim()) {
      notifications.warning(
        NotificationPatterns.validationError(
          "Please enter scan value and location",
        ).title,
        NotificationPatterns.validationError(
          "Please enter scan value and location",
        ).message,
        NotificationPatterns.validationError(
          "Please enter scan value and location",
        ),
      );
      return;
    }

    setProcessing(true);
    try {
      const result = await wmsInventoryIntegration.updateInventoryFromScan(
        skuId,
        {
          quantity,
          location,
          batchNumber: batchNumber || undefined,
          serialNumber: serialNumber || undefined,
          scanType,
        },
      );

      setLastScan(result);
      setScanValue("");
      setQuantity(1);
      setBatchNumber("");
      setSerialNumber("");

      if (onScanComplete) {
        onScanComplete(result);
      }

      // Auto-focus back to scanner
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error processing scan:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Please try again.";
      notifications.error("Scan Failed", errorMsg, {
        duration: 5000,
        actions: [
          { label: "Retry", action: () => handleScan(), variant: "primary" },
        ],
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && scanning) {
      handleScan();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Inventory Scanner</h3>
        <button
          onClick={() => setScanning(!scanning)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            scanning
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-cyan-600 hover:bg-cyan-700 text-white"
          }`}
        >
          {scanning ? (
            <>
              <i className="ri-stop-circle-line mr-1"></i>
              Stop Scanning
            </>
          ) : (
            <>
              <i className="ri-scan-line mr-1"></i>
              Start Scanning
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setScanType("BARCODE")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scanType === "BARCODE"
                    ? "bg-cyan-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <i className="ri-barcode-line mr-2"></i>
                Barcode
              </button>
              <button
                onClick={() => setScanType("RFID")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scanType === "RFID"
                    ? "bg-cyan-600 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <i className="ri-rfid-line mr-2"></i>
                RFID
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {scanType === "RFID" ? "RFID Tag" : "Barcode"}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  scanType === "RFID" ? "Scan RFID tag..." : "Scan barcode..."
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="A-01-02-03"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Batch Number (Optional)
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="BATCH-001"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN-001"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={processing || !scanValue.trim() || !location.trim()}
              className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              {processing ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="ri-check-line mr-2"></i>
                  Process Scan
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {lastScan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-checkbox-circle-line text-green-400"></i>
            <span className="text-sm font-medium text-green-400">
              Last Scan Successful
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div>
              Current Stock:{" "}
              <span className="text-white font-medium">
                {lastScan.currentStock}
              </span>
            </div>
            <div>
              Available:{" "}
              <span className="text-white font-medium">
                {lastScan.availableStock}
              </span>
            </div>
            <div>
              Location:{" "}
              <span className="text-white font-medium">
                {lastScan.location || "N/A"}
              </span>
            </div>
            <div>
              Updated:{" "}
              <span className="text-white font-medium">
                {new Date(lastScan.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
