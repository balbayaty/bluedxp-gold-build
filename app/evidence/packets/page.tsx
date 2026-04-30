/**
 * Evidence Packets Page
 *
 * Tamper-Evident Evidence Packets with Merkle Trees
 * Court-ready, chain of custody tracking, contradiction detection
 *
 * @module app/evidence/packets
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import Tooltip from "@/components/Tooltip";
import type {
  EvidencePacket,
  EvidencePacketRequest,
  Actor,
  ClaimType,
} from "@/lib/services/evidence/packet-types";

interface PacketListItem {
  id: string;
  evidenceId: string;
  claim: string;
  claimType: string;
  entityType: string;
  entityId: string;
  verificationStatus: string;
  generatedAt: Date;
  contradictions: number;
  legalHold: boolean;
  events: number;
  documents: number;
  signatures: number;
}

export default function EvidencePacketsPage() {
  const router = useRouter();
  const [packets, setPackets] = useState<PacketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedClaimType, setSelectedClaimType] = useState<string>("ALL");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<EvidencePacket | null>(
    null,
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate modal form state
  const [generateForm, setGenerateForm] = useState<EvidencePacketRequest>({
    entityType: "",
    entityId: "",
    claimType: "delivery_proof" as ClaimType,
    claim: "",
    includeEvents: true,
    includeDocuments: true,
    includeSignatures: true,
  });

  useEffect(() => {
    loadPackets();
  }, []);

  const loadPackets = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data structure
      const response = await fetch("/api/evidence/packets");
      const data = await response.json();

      if (data.success && data.data.packets) {
        setPackets(
          data.data.packets.map((p: EvidencePacket) => ({
            id: p.id,
            evidenceId: p.evidenceId,
            claim: p.claim,
            claimType: p.claimType,
            entityType: p.entityType,
            entityId: p.entityId,
            verificationStatus: p.verificationStatus,
            generatedAt: new Date(p.generatedAt),
            contradictions: p.contradictions.length,
            legalHold: p.legalHold,
            events: p.events.length,
            documents: p.documents.length,
            signatures: p.signatures.length,
          })),
        );
      } else {
        // If no packets, show empty state
        setPackets([]);
      }
    } catch (err) {
      console.error("Error loading packets:", err);
      setError("Failed to load evidence packets");
      setPackets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePacket = async () => {
    if (
      !generateForm.entityType ||
      !generateForm.entityId ||
      !generateForm.claimType
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Get current user info (in real app, from auth context)
      const actor: Actor = {
        id: "current-user",
        name: "Current User",
        tenantId: "default",
        type: "user",
      };

      const response = await fetch("/api/evidence/packets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: generateForm,
          actor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload packets
        await loadPackets();
        setShowGenerateModal(false);
        setGenerateForm({
          entityType: "",
          entityId: "",
          claimType: "delivery_proof" as ClaimType,
          claim: "",
          includeEvents: true,
          includeDocuments: true,
          includeSignatures: true,
        });
      } else {
        setError(data.error || "Failed to generate packet");
      }
    } catch (err) {
      console.error("Error generating packet:", err);
      setError("Failed to generate evidence packet");
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = async (packetId: string) => {
    try {
      const response = await fetch(`/api/evidence/packets/${packetId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPacket(data.data);
        setShowDetailsModal(true);
      } else {
        setError("Failed to load packet details");
      }
    } catch (err) {
      console.error("Error loading packet details:", err);
      setError("Failed to load packet details");
    }
  };

  const handleVerify = async (packetId: string) => {
    try {
      const response = await fetch(`/api/evidence/packets/${packetId}/verify`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Reload packets to update status
        await loadPackets();
        if (selectedPacket && selectedPacket.id === packetId) {
          setSelectedPacket(data.data);
        }
      } else {
        setError("Failed to verify packet");
      }
    } catch (err) {
      console.error("Error verifying packet:", err);
      setError("Failed to verify packet");
    }
  };

  const handleGenerateCourtReady = async (packetId: string) => {
    try {
      const response = await fetch(
        `/api/evidence/packets/${packetId}/court-ready`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (data.success) {
        // Show success message or download
        alert("Court-ready format generated successfully");
      } else {
        setError("Failed to generate court-ready format");
      }
    } catch (err) {
      console.error("Error generating court-ready format:", err);
      setError("Failed to generate court-ready format");
    }
  };

  const filteredPackets = useMemo(() => {
    return packets.filter((packet) => {
      const matchesSearch =
        packet.evidenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        packet.entityId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "ALL" ||
        packet.verificationStatus === selectedStatus;
      const matchesClaimType =
        selectedClaimType === "ALL" || packet.claimType === selectedClaimType;

      return matchesSearch && matchesStatus && matchesClaimType;
    });
  }, [packets, searchQuery, selectedStatus, selectedClaimType]);

  const stats = useMemo(() => {
    const total = packets.length;
    const verified = packets.filter(
      (p) => p.verificationStatus === "verified",
    ).length;
    const disputed = packets.filter(
      (p) => p.verificationStatus === "disputed",
    ).length;
    const withContradictions = packets.filter(
      (p) => p.contradictions > 0,
    ).length;
    const onLegalHold = packets.filter((p) => p.legalHold).length;

    return [
      {
        label: "Total Packets",
        value: total,
        icon: "ri-file-shield-line",
        trend: "up" as const,
      },
      {
        label: "Verified",
        value: verified,
        icon: "ri-checkbox-circle-line",
        trend: "up" as const,
      },
      {
        label: "Disputed",
        value: disputed,
        icon: "ri-alert-line",
        trend: disputed > 0 ? ("down" as const) : ("neutral" as const),
      },
      {
        label: "Legal Hold",
        value: onLegalHold,
        icon: "ri-lock-line",
        trend: "neutral" as const,
      },
    ];
  }, [packets]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "disputed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "court_submitted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getClaimTypeLabel = (claimType: string) => {
    return claimType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <PageTemplate
      title="Evidence Packets"
      description="Tamper-Evident Evidence Packets with Merkle Trees - Court-Ready Documentation"
      icon="ri-file-shield-line"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Evidence Packets
            </h3>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Generate Packet
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
              <input
                type="text"
                placeholder="Search packets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="disputed">Disputed</option>
              <option value="court_submitted">Court Submitted</option>
            </select>

            {/* Claim Type Filter */}
            <select
              value={selectedClaimType}
              onChange={(e) => setSelectedClaimType(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Claim Types</option>
              <option value="delivery_proof">Delivery Proof</option>
              <option value="ownership">Ownership</option>
              <option value="compliance">Compliance</option>
              <option value="quality">Quality</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Packets List */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          {loading ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-loader-4-line animate-spin text-4xl mb-3"></i>
              <p>Loading evidence packets...</p>
            </div>
          ) : filteredPackets.length === 0 ? (
            <div className="text-center py-12 text-[#9ca3af]">
              <i className="ri-file-shield-line text-4xl mb-3 opacity-50"></i>
              <p className="text-lg mb-2">No evidence packets found</p>
              <p className="text-sm">
                Generate a packet to start tracking tamper-evident evidence
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Generate First Packet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPackets.map((packet) => (
                <motion.div
                  key={packet.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-semibold">
                          {packet.evidenceId}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs border ${getStatusColor(packet.verificationStatus)}`}
                        >
                          {packet.verificationStatus}
                        </span>
                        {packet.legalHold && (
                          <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                            Legal Hold
                          </span>
                        )}
                        {packet.contradictions > 0 && (
                          <Tooltip
                            content={`${packet.contradictions} contradictions detected`}
                          >
                            <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              <i className="ri-alert-line"></i>{" "}
                              {packet.contradictions}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-sm text-[#9ca3af] mb-2">
                        {packet.claim}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                        <span>
                          <i className="ri-folder-line mr-1"></i>
                          {packet.entityType}: {packet.entityId}
                        </span>
                        <span>
                          <i className="ri-file-list-line mr-1"></i>
                          {getClaimTypeLabel(packet.claimType)}
                        </span>
                        <span>
                          <i className="ri-calendar-line mr-1"></i>
                          {new Date(packet.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[#6b7280]">
                        <span>{packet.events} events</span>
                        <span>{packet.documents} documents</span>
                        <span>{packet.signatures} signatures</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(packet.id)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-white transition-colors"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        View
                      </button>
                      <button
                        onClick={() => handleVerify(packet.id)}
                        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors"
                      >
                        <i className="ri-shield-check-line mr-1"></i>
                        Verify
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Packet Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          setError(null);
        }}
        title="Generate Evidence Packet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Entity Type <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={generateForm.entityType}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, entityType: e.target.value })
              }
              placeholder="e.g., Shipment, Order, Document"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Entity ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={generateForm.entityId}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, entityId: e.target.value })
              }
              placeholder="e.g., SHIP-12345"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Claim Type <span className="text-red-400">*</span>
            </label>
            <select
              value={generateForm.claimType}
              onChange={(e) =>
                setGenerateForm({
                  ...generateForm,
                  claimType: e.target.value as ClaimType,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="delivery_proof">Delivery Proof</option>
              <option value="ownership">Ownership</option>
              <option value="compliance">Compliance</option>
              <option value="quality">Quality</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Claim Description (Optional)
            </label>
            <textarea
              value={generateForm.claim || ""}
              onChange={(e) =>
                setGenerateForm({ ...generateForm, claim: e.target.value })
              }
              placeholder="Describe what this packet proves..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={generateForm.includeEvents}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    includeEvents: e.target.checked,
                  })
                }
                className="rounded"
              />
              Include Events
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={generateForm.includeDocuments}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    includeDocuments: e.target.checked,
                  })
                }
                className="rounded"
              />
              Include Documents
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={generateForm.includeSignatures}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    includeSignatures: e.target.checked,
                  })
                }
                className="rounded"
              />
              Include Signatures
            </label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setShowGenerateModal(false);
                setError(null);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGeneratePacket}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Generating...
                </>
              ) : (
                "Generate Packet"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Packet Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPacket(null);
        }}
        title={
          selectedPacket
            ? `Packet: ${selectedPacket.evidenceId}`
            : "Packet Details"
        }
        size="large"
      >
        {selectedPacket && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af]">Evidence ID</label>
                <p className="text-white font-mono">
                  {selectedPacket.evidenceId}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af]">Status</label>
                <p
                  className={`inline-block px-2 py-1 rounded text-xs border ${getStatusColor(selectedPacket.verificationStatus)}`}
                >
                  {selectedPacket.verificationStatus}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af]">Entity</label>
                <p className="text-white">
                  {selectedPacket.entityType}: {selectedPacket.entityId}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af]">Generated</label>
                <p className="text-white">
                  {new Date(selectedPacket.generatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Claim */}
            <div>
              <label className="text-xs text-[#9ca3af]">Claim</label>
              <p className="text-white">{selectedPacket.claim}</p>
            </div>

            {/* Integrity */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Integrity Verification
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[#9ca3af]">Merkle Root:</span>
                  <span className="text-white ml-2 break-all">
                    {selectedPacket.merkleRoot.substring(0, 64)}...
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Content Hash:</span>
                  <span className="text-white ml-2 break-all">
                    {selectedPacket.contentHash.substring(0, 64)}...
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleVerify(selectedPacket.id)}
                className="mt-3 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors"
              >
                <i className="ri-shield-check-line mr-1"></i>
                Verify Integrity
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {selectedPacket.events.length}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">Events</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {selectedPacket.documents.length}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">Documents</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {selectedPacket.signatures.length}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">Signatures</div>
              </div>
            </div>

            {/* Contradictions */}
            {selectedPacket.contradictions.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">
                  Contradictions Detected (
                  {selectedPacket.contradictions.length})
                </h4>
                <div className="text-xs text-yellow-300">
                  Contradiction Index:{" "}
                  {(selectedPacket.contradictionIndex * 100).toFixed(1)}%
                </div>
                <ul className="mt-2 space-y-1">
                  {selectedPacket.contradictions.slice(0, 5).map((c, idx) => (
                    <li
                      key={idx}
                      className={`text-xs ${
                        c.severity === "critical"
                          ? "text-red-400"
                          : c.severity === "high"
                            ? "text-orange-400"
                            : "text-yellow-400"
                      }`}
                    >
                      • {c.description} ({c.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => handleGenerateCourtReady(selectedPacket.id)}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-400 text-sm transition-colors"
              >
                <i className="ri-file-download-line mr-2"></i>
                Generate Court-Ready Format
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/truth-timeline/${selectedPacket.entityType}/${selectedPacket.entityId}`,
                  )
                }
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
              >
                <i className="ri-time-line mr-2"></i>
                View Truth Timeline
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
