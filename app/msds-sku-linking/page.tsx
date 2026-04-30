"use client";

/**
 * MSDS-SKU Linking Management Page
 * Main page for managing all MSDS-SKU links
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import LinkButton from "@/components/msds-sku-linking/LinkButton";
import LinkStatusBadge from "@/components/msds-sku-linking/LinkStatusBadge";
import LinkCreationForm from "@/components/msds-sku-linking/LinkCreationForm";
import {
  MSDSSKULink,
  MSDSSKULinkStatus,
  MatchingStrategy,
} from "@/types/msdsSkuLinking";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/utils/apiFetch";

export default function MSDSSKULinkingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [links, setLinks] = useState<MSDSSKULink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<MSDSSKULink | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedStrategy !== "ALL")
        params.append("matchingStrategy", selectedStrategy);
      if (searchQuery) params.append("search", searchQuery);

      const response = await apiFetch(
        `/api/msds-sku-linking/links?${params.toString()}`,
      );
      const data = await response.json();

      if (data.success) {
        setLinks(data.data.links || []);
      }
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedStrategy, searchQuery]);

  useEffect(() => {
    if (isLoading || !user) return;
    loadLinks();
  }, [isLoading, user, loadLinks]);

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          link.msdsId.toLowerCase().includes(query) ||
          link.skuId.toLowerCase().includes(query) ||
          link.customerId.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [links, searchQuery]);

  const stats = useMemo(() => {
    const total = links.length;
    const approved = links.filter((l) => l.status === "APPROVED").length;
    const pending = links.filter((l) => l.status === "PENDING").length;
    const rejected = links.filter((l) => l.status === "REJECTED").length;

    return [
      {
        label: "Total Links",
        value: total,
        icon: "ri-link",
        trend: "up" as const,
      },
      {
        label: "Approved",
        value: approved,
        icon: "ri-checkbox-circle-line",
        trend: "up" as const,
      },
      {
        label: "Pending",
        value: pending,
        icon: "ri-time-line",
        trend: "neutral" as const,
      },
      {
        label: "Rejected",
        value: rejected,
        icon: "ri-close-circle-line",
        trend: "down" as const,
      },
    ];
  }, [links]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] text-white p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <i className="ri-lock-line text-cyan-400 text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold mb-2">Login required</h1>
          <p className="text-sm text-white/70 mb-5">
            MSDS-SKU Linking is protected. Please sign in to continue.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-medium transition"
            >
              Go to Login
            </Link>
            <button
              onClick={() => router.refresh()}
              className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (linkId: string) => {
    try {
      const response = await fetch(
        `/api/msds-sku-linking/links/${linkId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvedBy: "admin" }),
        },
      );

      if (response.ok) {
        loadLinks();
      }
    } catch (error) {
      console.error("Error approving link:", error);
    }
  };

  const handleReject = async (linkId: string) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;

    try {
      const response = await fetch(
        `/api/msds-sku-linking/links/${linkId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectedBy: "admin",
            rejectionReason: reason,
          }),
        },
      );

      if (response.ok) {
        loadLinks();
      }
    } catch (error) {
      console.error("Error rejecting link:", error);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      const response = await fetch(`/api/msds-sku-linking/links/${linkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadLinks();
      }
    } catch (error) {
      console.error("Error deleting link:", error);
    }
  };

  return (
    <PageTemplate
      title="MSDS-SKU Linking"
      description="Manage links between MSDS documents and SKUs with intelligent matching"
      icon="ri-link"
      stats={stats}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors"
        >
          <i className="ri-add-line mr-2"></i>
          Create Link
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CONDITIONAL">Conditional</option>
        </select>
        <select
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Strategies</option>
          <option value="CAS_NUMBER">CAS Number</option>
          <option value="PRODUCT_NAME">Product Name</option>
          <option value="UN_NUMBER">UN Number</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      {/* Links Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading links...</p>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    MSDS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Strategy
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Confidence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLinks.map((link, index) => (
                  <motion.tr
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          router.push(`/chemical/msds/${link.msdsId}`)
                        }
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        {link.msdsId}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/wms/skus/${link.skuId}`)}
                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                      >
                        {link.skuId}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {link.customerId}
                    </td>
                    <td className="px-6 py-4">
                      <LinkStatusBadge status={link.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {link.matchingStrategy}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          link.confidenceScore >= 80
                            ? "text-green-400"
                            : link.confidenceScore >= 60
                              ? "text-yellow-400"
                              : "text-orange-400"
                        }`}
                      >
                        {link.confidenceScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {format(new Date(link.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedLink(link);
                            setShowDetailModal(true);
                          }}
                          className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          title="View Details"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {link.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(link.id)}
                              className="p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                              title="Approve"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => handleReject(link.id)}
                              className="p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                              title="Reject"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="p-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/30 transition-colors"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create MSDS-SKU Link"
          size="lg"
        >
          <LinkCreationForm
            onSuccess={() => {
              setShowCreateModal(false);
              loadLinks();
            }}
            onCancel={() => setShowCreateModal(false)}
          />
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLink && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLink(null);
          }}
          title="Link Details"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">MSDS ID</div>
                <button
                  onClick={() =>
                    router.push(`/chemical/msds/${selectedLink.msdsId}`)
                  }
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {selectedLink.msdsId}
                </button>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">SKU ID</div>
                <button
                  onClick={() => router.push(`/wms/skus/${selectedLink.skuId}`)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {selectedLink.skuId}
                </button>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <LinkStatusBadge status={selectedLink.status} />
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Confidence</div>
                <div className="text-white font-medium">
                  {selectedLink.confidenceScore}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Strategy</div>
                <div className="text-white">
                  {selectedLink.matchingStrategy}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Customer</div>
                <div className="text-white">{selectedLink.customerId}</div>
              </div>
            </div>
            {selectedLink.notes && (
              <div>
                <div className="text-sm text-gray-400 mb-1">Notes</div>
                <div className="text-white bg-white/5 rounded-lg p-3">
                  {selectedLink.notes}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
