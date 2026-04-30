/**
 * Universal QR Code Generator Component
 * Reusable QR code generator for all integration points
 * World's Most Intelligent QR Code Generator
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QRCodeData } from "@/types/qr";
import { generateUniversalQR } from "@/app/actions/qr/qrActions";

interface UniversalQRGeneratorProps {
  entityId: string;
  entityType: QRCodeData["type"];
  entityName?: string;
  documentType?: QRCodeData["documentType"];
  documentUrl?: string;
  module?: string;
  templateId?: string;
  onQRGenerated?: (qrCode: string, qrImageUrl?: string, qrId: string) => void;
  showAdvanced?: boolean;
  className?: string;
}

export default function UniversalQRGenerator({
  entityId,
  entityType,
  entityName,
  documentType,
  documentUrl,
  module,
  templateId,
  onQRGenerated,
  showAdvanced = false,
  className = "",
}: UniversalQRGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrId, setQrId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    templateId || null,
  );
  const [useTemplate, setUseTemplate] = useState(!!templateId);

  /**
   * Generate QR code
   */
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateUniversalQR({
        entityId,
        entityType,
        entityName,
        documentType,
        documentUrl,
        module,
        templateId:
          useTemplate && selectedTemplate ? selectedTemplate : undefined,
      });

      if (!result.success || !result.qrCode) {
        throw new Error(result.error || "Failed to generate QR code");
      }

      setQrCode(result.qrCode);
      setQrImageUrl(result.qrImageUrl || null);
      setQrId(result.qrId || null);

      onQRGenerated?.(result.qrCode, result.qrImageUrl, result.qrId!);
    } catch (err: any) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download QR code
   */
  const handleDownload = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `qr-${entityId}-${Date.now()}.png`;
    link.click();
  };

  /**
   * Print QR code
   */
  const handlePrint = () => {
    if (!qrImageUrl) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${entityName || entityId}</title>
            <style>
              body { text-align: center; padding: 20px; font-family: Arial, sans-serif; }
              img { max-width: 300px; }
            </style>
          </head>
          <body>
            <h2>${entityName || entityId}</h2>
            <p>${entityType.toUpperCase()}</p>
            <img src="${qrImageUrl}" alt="QR Code" />
            <p style="margin-top: 20px;">Scan to access</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  /**
   * Copy QR code data
   */
  const handleCopy = () => {
    if (!qrCode) return;

    navigator.clipboard.writeText(qrCode);
    alert("QR code data copied to clipboard!");
  };

  return (
    <div className={`universal-qr-generator ${className}`}>
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <i className="ri-qr-code-line text-cyan-400"></i>
            QR Code Generator
          </h3>
          {entityName && (
            <span className="text-sm text-gray-400">{entityName}</span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            <i className="ri-error-warning-line mr-2"></i>
            {error}
          </div>
        )}

        {/* QR Code Display */}
        {qrImageUrl && qrId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <div className="bg-white p-6 rounded-lg text-center">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="mx-auto mb-4"
                style={{ maxWidth: "300px" }}
              />
              <p className="text-sm text-gray-600 font-mono">{qrId}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <i className="ri-download-line"></i>
                Download
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <i className="ri-printer-line"></i>
                Print
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                <i className="ri-file-copy-line"></i>
              </button>
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        {!qrCode && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin"></i>
                Generating...
              </>
            ) : (
              <>
                <i className="ri-qr-code-line"></i>
                Generate QR Code
              </>
            )}
          </button>
        )}

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Use Template</span>
              </label>

              {useTemplate && (
                <div className="ml-6">
                  <select
                    value={selectedTemplate || ""}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                  >
                    <option value="">Select Template</option>
                    {/* Templates will be loaded dynamically */}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            <i className="ri-information-line mr-1"></i>
            QR code is dynamic and can be updated without reprinting. Analytics
            are enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
