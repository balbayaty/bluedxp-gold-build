"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { format as formatDate } from "date-fns";
import { apiFetch } from "@/utils/apiFetch";
import type { ETW } from "@/types/etw";

export default function ETWPage() {
  const router = useRouter();
  const [etws, setEtws] = useState<ETW[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<string>("ALL");
  const [selectedETW, setSelectedETW] = useState<ETW | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const filteredETWs = useMemo(() => {
    return etws.filter((etw) => {
      const matchesSearch =
        (etw.etwNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (etw.references?.shipmentNumber || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (etw.references?.customerReference || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || etw.status === selectedStatus;
      const matchesScope =
        selectedScope === "ALL" || etw.scope === selectedScope;
      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [etws, searchQuery, selectedStatus, selectedScope]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await apiFetch("/api/etw");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json().catch(() => {
          throw new Error("Invalid JSON response from server");
        });
        if (!mounted) return;
        if (data.success) {
          setEtws(Array.isArray(data.data) ? data.data : []);
        } else {
          setLoadError(data.error || "Failed to load ETWs");
        }
      } catch (e) {
        if (!mounted) return;
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("[ETW Page] Load error:", e);
        setLoadError(errorMessage || "An unexpected error occurred");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    PENDING: "bg-yellow-500",
    IN_PROGRESS: "bg-blue-500",
    IN_TRANSIT: "bg-indigo-500",
    AT_BORDER: "bg-orange-500",
    AT_PORT: "bg-purple-500",
    CUSTOMS_CLEARANCE: "bg-pink-500",
    OUT_FOR_DELIVERY: "bg-cyan-500",
    DELIVERED: "bg-green-500",
    EXCEPTION: "bg-red-500",
    CANCELLED: "bg-gray-700",
    COMPLETED: "bg-green-600",
  };

  return (
    <PageTemplate
      title="e-Waybills (ETW)"
      description="Flex Smart e-Waybill management with evidence-grade chain-of-custody"
      actions={
        <button
          onClick={() => router.push("/etw/create")}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          Create e-Waybill
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Search ETW number, shipment, customer reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[300px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="EXCEPTION">Exception</option>
        </select>
        <select
          value={selectedScope}
          onChange={(e) => setSelectedScope(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="ALL">All Scopes</option>
          <option value="LOCAL">Local</option>
          <option value="INTERCITY">Inter-city</option>
          <option value="CROSS_BORDER">Cross-border</option>
          <option value="MULTIMODAL">Multimodal</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 text-gray-400">Loading ETWs...</div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-red-400">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <i className="ri-error-warning-line text-2xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 mb-2">
                Unable to Load e-Waybills
              </h3>
              <p className="text-sm mb-4">{loadError}</p>
              <button
                onClick={() => {
                  setLoadError(null);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                <i className="ri-refresh-line mr-2"></i>
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETW Table */}
      {!isLoading && !loadError && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ETW Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Origin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredETWs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <i className="ri-file-paper-2-line text-4xl text-gray-600"></i>
                      <p className="text-gray-400 text-lg font-medium">
                        {searchQuery ||
                        selectedStatus !== "ALL" ||
                        selectedScope !== "ALL"
                          ? "No ETWs match your filters"
                          : "No e-Waybills yet"}
                      </p>
                      {!searchQuery &&
                        selectedStatus === "ALL" &&
                        selectedScope === "ALL" && (
                          <button
                            onClick={() => router.push("/etw/create")}
                            className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <i className="ri-add-circle-line mr-2"></i>
                            Create Your First e-Waybill
                          </button>
                        )}
                      {(searchQuery ||
                        selectedStatus !== "ALL" ||
                        selectedScope !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedStatus("ALL");
                            setSelectedScope("ALL");
                          }}
                          className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                        >
                          <i className="ri-filter-off-line mr-2"></i>
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredETWs.map((etw) => (
                  <tr key={etw.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-mono">
                      {etw.etwNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[etw.status] || "bg-gray-500"} text-white`}
                      >
                        {etw.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {etw.scope}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {etw.mode}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {etw.route.origin.name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {etw.route.destination.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {formatDate(new Date(etw.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedETW(etw);
                          setShowViewModal(true);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 mr-4"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/etw/${etw.id}`)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedETW && (
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedETW(null);
          }}
          title={`ETW: ${selectedETW.etwNumber}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Status</label>
              <p className="text-white">{selectedETW.status}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Scope</label>
              <p className="text-white">{selectedETW.scope}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Mode</label>
              <p className="text-white">{selectedETW.mode}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Origin</label>
              <p className="text-white">{selectedETW.route.origin.name}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Destination</label>
              <p className="text-white">{selectedETW.route.destination.name}</p>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  router.push(`/etw/${selectedETW.id}`);
                  setShowViewModal(false);
                }}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                View Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}
