/**
 * Evidence Packet Card Component
 *
 * Visual display of evidence packet information
 * Can be used anywhere in the app
 *
 * @module components/evidence
 */

"use client";

import { useEvidencePacket } from "@/hooks/useEvidencePacket";
import { motion } from "framer-motion";
import { useState } from "react";

interface EvidencePacketCardProps {
  packetId?: string;
  entityType?: string;
  entityId?: string;
  showDetails?: boolean;
  className?: string;
}

export function EvidencePacketCard({
  packetId,
  entityType,
  entityId,
  showDetails = false,
  className = "",
}: EvidencePacketCardProps) {
  const { packet, loading, error, verify, generateCourtReady } =
    useEvidencePacket();
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [courtReady, setCourtReady] = useState<any>(null);

  const handleVerify = async () => {
    if (packetId) {
      const result = await verify(packetId);
      setVerificationResult(result);
    }
  };

  const handleGenerateCourtReady = async () => {
    if (packetId) {
      const result = await generateCourtReady(packetId);
      setCourtReady(result);
    }
  };

  if (loading) {
    return (
      <div className={`evidence-packet-loading ${className}`}>
        <div className="animate-pulse">Loading evidence packet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`evidence-packet-error ${className}`}>
        <span className="text-red-500">Error: {error.message}</span>
      </div>
    );
  }

  if (!packet && !packetId) {
    return (
      <div className={`evidence-packet-empty ${className}`}>
        <span className="text-gray-400">No packet selected</span>
      </div>
    );
  }

  return (
    <div className={`evidence-packet-card ${className}`}>
      {packet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Evidence Packet</div>
            <div className="text-lg font-bold">{packet.evidenceId}</div>
            <div className="text-sm text-gray-600">{packet.claim}</div>
          </div>

          {/* Integrity */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Integrity</div>
            <div className="text-xs font-mono break-all">
              <div>Merkle Root: {packet.merkleRoot.substring(0, 32)}...</div>
              <div>Content Hash: {packet.contentHash.substring(0, 32)}...</div>
            </div>
            <button
              onClick={handleVerify}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Verify Integrity
            </button>
            {verificationResult && (
              <div
                className={`mt-2 text-sm ${verificationResult.valid ? "text-green-600" : "text-red-600"}`}
              >
                {verificationResult.valid ? "✓ Valid" : "✗ Invalid"}
                {verificationResult.issues.length > 0 && (
                  <ul className="text-xs mt-1">
                    {verificationResult.issues.map(
                      (issue: string, idx: number) => (
                        <li key={idx}>• {issue}</li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Statistics</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="font-medium">Events</div>
                <div>{packet.events.length}</div>
              </div>
              <div>
                <div className="font-medium">Documents</div>
                <div>{packet.documents.length}</div>
              </div>
              <div>
                <div className="font-medium">Signatures</div>
                <div>{packet.signatures.length}</div>
              </div>
            </div>
          </div>

          {/* Contradictions */}
          {packet.contradictions.length > 0 && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm font-semibold mb-2">Contradictions</div>
              <div className="text-sm">
                <div>Count: {packet.contradictions.length}</div>
                <div>
                  Index: {(packet.contradictionIndex * 100).toFixed(1)}%
                </div>
              </div>
              {showDetails && (
                <ul className="text-xs mt-2 space-y-1">
                  {packet.contradictions.slice(0, 3).map((c, idx) => (
                    <li
                      key={idx}
                      className={`${
                        c.severity === "critical"
                          ? "text-red-600"
                          : c.severity === "high"
                            ? "text-orange-600"
                            : "text-yellow-600"
                      }`}
                    >
                      • {c.description} ({c.severity})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Court Ready */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Court Format</div>
            <button
              onClick={handleGenerateCourtReady}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Generate Court-Ready Format
            </button>
            {courtReady && (
              <div className="mt-2 text-sm text-green-600">
                ✓ Court-ready format generated
              </div>
            )}
          </div>

          {/* Verification Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-semibold mb-2">Verification</div>
            <div
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                packet.verificationStatus === "verified"
                  ? "bg-green-100 text-green-800"
                  : packet.verificationStatus === "disputed"
                    ? "bg-red-100 text-red-800"
                    : packet.verificationStatus === "court_submitted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
              }`}
            >
              {packet.verificationStatus}
            </div>
            {packet.verifiedBy && (
              <div className="text-xs mt-1">
                Verified by: {packet.verifiedBy} at{" "}
                {packet.verifiedAt?.toLocaleString()}
              </div>
            )}
          </div>

          {/* Legal Hold */}
          {packet.legalHold && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm font-semibold text-red-800">
                ⚠ Legal Hold Active
              </div>
              <div className="text-xs text-red-600">
                This packet cannot be deleted or modified
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default EvidencePacketCard;
