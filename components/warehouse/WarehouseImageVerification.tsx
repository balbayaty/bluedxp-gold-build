/**
 * Warehouse Image Verification Component
 * Evidence verification for warehouse operations
 * 4IR & 5IR Aligned • Modern UI • Deep Integration
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { warehouseImageVerificationIntegration } from "@/lib/services/wms/imageVerificationIntegration";
import type { WarehouseImageEvidence } from "@/lib/services/wms/imageVerificationIntegration";

interface WarehouseImageVerificationProps {
  warehouseId: string;
}

export default function WarehouseImageVerification({
  warehouseId,
}: WarehouseImageVerificationProps) {
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<WarehouseImageEvidence | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [warehouseId]);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      const stats =
        await warehouseImageVerificationIntegration.getVerificationStatistics(
          warehouseId,
        );
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (
    operationType: WarehouseImageEvidence["operationType"],
  ) => {
    if (!selectedImage) return;

    setIsVerifying(true);
    try {
      // In production, would upload image first
      const imageUrl = URL.createObjectURL(selectedImage);

      const result =
        await warehouseImageVerificationIntegration.verifyWarehouseImage({
          warehouseId,
          operationType,
          imageUrl,
          description: `Image verification for ${operationType}`,
        });

      setVerificationResult(result);
    } catch (error) {
      console.error("Error verifying image:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="ri-loader-4-line text-4xl text-cyan-400 animate-spin"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <i className="ri-image-line mr-3 text-cyan-400"></i>
            Image Verification & Evidence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-1">Total Verified</p>
              <p className="text-3xl font-bold text-white">
                {statistics.totalVerified}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
              <p className="text-sm text-gray-400 mb-1">Verified</p>
              <p className="text-3xl font-bold text-white">
                {statistics.verifiedCount}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30">
              <p className="text-sm text-gray-400 mb-1">Tampering Detected</p>
              <p className="text-3xl font-bold text-white">
                {statistics.tamperingDetectedCount}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30">
              <p className="text-sm text-gray-400 mb-1">Avg Confidence</p>
              <p className="text-3xl font-bold text-white">
                {(statistics.averageConfidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* By Operation Type */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              By Operation Type
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(statistics.byOperationType).map(
                ([type, count]) => (
                  <div
                    key={type}
                    className="p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-sm text-gray-400">{type}</p>
                    <p className="text-xl font-bold text-white">
                      {count as number}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Image Upload & Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <i className="ri-upload-cloud-2-line mr-2 text-blue-400"></i>
          Verify Warehouse Image
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Select Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
            />
          </div>

          {selectedImage && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border border-white/20"
                />
                <div className="flex-1">
                  <p className="text-white font-medium">{selectedImage.name}</p>
                  <p className="text-sm text-gray-400">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(["RECEIVING", "DAMAGE", "INSPECTION", "SAFETY"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => handleImageUpload(type)}
                      disabled={isVerifying}
                      className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isVerifying ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        `Verify ${type}`
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Verification Result */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="ri-checkbox-circle-line mr-2 text-green-400"></i>
            Verification Result
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <p
                  className={`text-xl font-bold ${
                    verificationResult.verified
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {verificationResult.verified ? "Verified" : "Not Verified"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Confidence</p>
                <p className="text-xl font-bold text-white">
                  {(verificationResult.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {verificationResult.verificationResult && (
              <div className="space-y-3">
                {verificationResult.verificationResult.tamperingDetected && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-red-400 font-medium mb-2">
                      ⚠️ Tampering Detected
                    </p>
                    {verificationResult.verificationResult.tamperingDetails && (
                      <div className="text-sm text-gray-300">
                        <p>
                          Type:{" "}
                          {
                            verificationResult.verificationResult
                              .tamperingDetails.type
                          }
                        </p>
                        <p>
                          Confidence:{" "}
                          {(
                            verificationResult.verificationResult
                              .tamperingDetails.confidence * 100
                          ).toFixed(1)}
                          %
                        </p>
                        {verificationResult.verificationResult.tamperingDetails
                          .location && (
                          <p>
                            Location:{" "}
                            {
                              verificationResult.verificationResult
                                .tamperingDetails.location
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {verificationResult.verificationResult.ocrText && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-blue-400 font-medium mb-2">
                      Extracted Text (OCR)
                    </p>
                    <p className="text-sm text-gray-300">
                      {verificationResult.verificationResult.ocrText}
                    </p>
                  </div>
                )}

                {verificationResult.verificationResult.metadata && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white font-medium mb-2">
                      Image Metadata
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <p>
                        Format:{" "}
                        {verificationResult.verificationResult.metadata.format}
                      </p>
                      <p>
                        Dimensions:{" "}
                        {
                          verificationResult.verificationResult.metadata
                            .dimensions.width
                        }{" "}
                        ×{" "}
                        {
                          verificationResult.verificationResult.metadata
                            .dimensions.height
                        }
                      </p>
                      <p>
                        Color Space:{" "}
                        {
                          verificationResult.verificationResult.metadata
                            .colorSpace
                        }
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  {verificationResult.verificationResult.signatureDetected && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded">
                      <i className="ri-pen-nib-line mr-1"></i>
                      Signature Detected
                    </span>
                  )}
                  {verificationResult.verificationResult.watermarkDetected && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded">
                      <i className="ri-watermark-line mr-1"></i>
                      Watermark Detected
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
