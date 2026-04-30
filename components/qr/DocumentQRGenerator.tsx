/**
 * Document-to-QR Code Generator Component
 * Convert any document (MSDS, certificates, etc.) to QR codes
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Modal";

interface DocumentQRGeneratorProps {
  documentId: string;
  documentType:
    | "msds"
    | "certificate"
    | "permit"
    | "label"
    | "report"
    | "other";
  documentName?: string;
  onQRGenerated?: (qrCode: string, qrImageUrl?: string) => void;
}

export default function DocumentQRGenerator({
  documentId,
  documentType,
  documentName,
  onQRGenerated,
}: DocumentQRGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [options, setOptions] = useState({
    dynamic: true,
    analytics: true,
    includeFullData: false,
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const endpoint =
        documentType === "msds" ? "/api/qr/msds" : "/api/qr/generate";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msdsId: documentType === "msds" ? documentId : undefined,
          documentId: documentType !== "msds" ? documentId : undefined,
          documentType,
          documentUrl: `/${documentType}/${documentId}`,
          options,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setQrCode(result.qrCode);
        setQrImageUrl(result.qrImageUrl);
        if (onQRGenerated) {
          onQRGenerated(result.qrCode, result.qrImageUrl);
        }
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (qrImageUrl) {
      const link = document.createElement("a");
      link.href = qrImageUrl;
      link.download = `qr-${documentType}-${documentId}.png`;
      link.click();
    }
  };

  const handlePrint = () => {
    if (qrImageUrl) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>QR Code - ${documentName || documentId}</title></head>
            <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <img src="${qrImageUrl}" style="max-width: 300px;" />
                <p style="margin-top: 20px; font-size: 14px;">${documentName || documentId}</p>
                <p style="font-size: 12px; color: #666;">${documentType.toUpperCase()}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition flex items-center gap-2"
      >
        <i className="ri-qr-code-line"></i>
        Generate QR Code
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Generate QR Code: ${documentName || documentId}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.dynamic}
                onChange={(e) =>
                  setOptions({ ...options, dynamic: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-600 text-cyan-500"
              />
              <span className="text-sm text-gray-300">
                Dynamic QR (can be updated without reprinting)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.analytics}
                onChange={(e) =>
                  setOptions({ ...options, analytics: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-600 text-cyan-500"
              />
              <span className="text-sm text-gray-300">
                Track scans and analytics
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.includeFullData}
                onChange={(e) =>
                  setOptions({ ...options, includeFullData: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-600 text-cyan-500"
              />
              <span className="text-sm text-gray-300">
                Include full document data in QR
              </span>
            </label>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Generating QR Code...
              </>
            ) : (
              <>
                <i className="ri-qr-code-line"></i>
                Generate QR Code
              </>
            )}
          </button>

          {/* QR Code Display */}
          {qrImageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-6 rounded-lg bg-gray-800 border border-gray-700 text-center">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="mx-auto mb-4"
                  style={{ maxWidth: "300px" }}
                />
                <p className="text-sm text-gray-400 mb-2">
                  {documentName || documentId}
                </p>
                <p className="text-xs text-gray-500">
                  {documentType.toUpperCase()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition flex items-center justify-center gap-2"
                >
                  <i className="ri-download-line"></i>
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition flex items-center justify-center gap-2"
                >
                  <i className="ri-printer-line"></i>
                  Print
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(qrCode);
                    alert("QR code data copied to clipboard!");
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition flex items-center justify-center gap-2"
                >
                  <i className="ri-file-copy-line"></i>
                </button>
              </div>

              {/* QR Code Data (for debugging) */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                  View QR Code Data
                </summary>
                <pre className="mt-2 p-3 rounded bg-gray-900 text-gray-300 overflow-auto">
                  {JSON.stringify(JSON.parse(qrCode), null, 2)}
                </pre>
              </details>
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
}
