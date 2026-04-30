/**
 * QR Code Badge Component
 * Quick QR code generation badge for list views
 * Shows QR icon and generates QR on click
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeData } from "@/types/qr";
import { generateUniversalQR } from "@/app/actions/qr/qrActions";

interface QRCodeBadgeProps {
  entityId: string;
  entityType: QRCodeData["type"];
  entityName?: string;
  documentType?: QRCodeData["documentType"];
  documentUrl?: string;
  module?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function QRCodeBadge({
  entityId,
  entityType,
  entityName,
  documentType,
  documentUrl,
  module,
  size = "sm",
  className = "",
}: QRCodeBadgeProps) {
  const [showQR, setShowQR] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (showQR && qrImageUrl) {
      setShowQR(false);
      return;
    }

    setLoading(true);
    try {
      const result = await generateUniversalQR({
        entityId,
        entityType,
        entityName,
        documentType,
        documentUrl,
        module,
      });

      if (result.success && result.qrImageUrl) {
        setQrImageUrl(result.qrImageUrl);
        setShowQR(true);
      } else {
        console.error("Failed to generate QR:", result.error);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `qr-${entityId}-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          rounded-lg
          bg-cyan-500/20 hover:bg-cyan-500/30
          border border-cyan-500/30
          text-cyan-400
          transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title="Generate QR Code"
      >
        {loading ? (
          <i className="ri-loader-4-line animate-spin"></i>
        ) : showQR ? (
          <i className="ri-close-line"></i>
        ) : (
          <i className="ri-qr-code-line"></i>
        )}
      </button>

      {/* QR Code Popup */}
      <AnimatePresence>
        {showQR && qrImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute right-0 top-full mt-2 z-50 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl"
            style={{ minWidth: "200px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-2">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="mx-auto mb-2"
                style={{ maxWidth: "150px" }}
              />
              {entityName && (
                <p className="text-xs text-gray-400 mb-1">{entityName}</p>
              )}
              <p className="text-xs text-gray-500 font-mono">{entityId}</p>
            </div>
            <button
              onClick={handleDownload}
              className="w-full px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs transition"
            >
              <i className="ri-download-line mr-1"></i>
              Download
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
