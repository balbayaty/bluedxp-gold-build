"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import {
  ArrowRightLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";
import type { NetworkInventoryTransfer } from "@/lib/services/warehouse-network";

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<NetworkInventoryTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      // In a real app, get network ID from context or params
      const networkId = "network-1"; // Mock
      const response = await fetch(
        `/api/warehouse-network/transfers?networkId=${networkId}`,
      );
      const result = await response.json();
      if (result.success) {
        setTransfers(result.data);
      }
    } catch (error) {
      console.error("Failed to load transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: NetworkInventoryTransfer["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: NetworkInventoryTransfer["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "IN_TRANSIT":
        return <ArrowRightLeft className="w-4 h-4" />;
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTransfers =
    filter === "ALL" ? transfers : transfers.filter((t) => t.status === filter);

  return (
    <PageTemplate
      title="Inventory Transfers"
      description="Manage inventory transfers between warehouse networks"
      icon="ri-exchange-line"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "ALL"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("PENDING")}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "PENDING"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("IN_TRANSIT")}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "IN_TRANSIT"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                In Transit
              </button>
              <button
                onClick={() => setFilter("DELIVERED")}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === "DELIVERED"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Delivered
              </button>
            </div>
            <button
              onClick={() => router.push("/warehouse-network/transfers/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              New Transfer
            </button>
          </div>
        </div>

        {/* Transfers List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ArrowRightLeft className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No transfers found
            </h3>
            <p className="text-slate-500 mb-6">
              Create your first inventory transfer
            </p>
            <button
              onClick={() => router.push("/warehouse-network/transfers/new")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              New Transfer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1">
                      {transfer.transferNumber}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Material: {transfer.materialId} • Quantity:{" "}
                      {transfer.quantity}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 ${getStatusColor(transfer.status)}`}
                  >
                    {getStatusIcon(transfer.status)}
                    <span>{transfer.status.replace(/_/g, " ")}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Origin</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {transfer.originWarehouseId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Destination</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {transfer.destinationWarehouseId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Scheduled</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(transfer.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
