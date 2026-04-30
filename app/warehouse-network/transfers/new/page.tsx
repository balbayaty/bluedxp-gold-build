"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { ArrowRightLeft, Package, Calendar } from "lucide-react";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

export default function NewTransferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    networkId: "network-1", // Mock - in real app, get from context
    originWarehouseId: "",
    destinationWarehouseId: "",
    materialId: "",
    quantity: 0,
    scheduledDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/warehouse-network/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkId: formData.networkId,
          originWarehouseId: formData.originWarehouseId,
          destinationWarehouseId: formData.destinationWarehouseId,
          materialId: formData.materialId,
          quantity: formData.quantity,
          scheduledDate: formData.scheduledDate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/warehouse-network/transfers`);
      } else {
        alert(result.error || "Failed to create transfer. Please try again.");
      }
    } catch (error) {
      console.error("Failed to create transfer:", error);
      alert("Failed to create transfer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="New Inventory Transfer"
      description="Transfer inventory between warehouses in your network"
      icon="ri-add-circle-line"
    >
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Transfer Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Origin Warehouse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.originWarehouseId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      originWarehouseId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Warehouse ID or Code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <ArrowRightLeft className="w-4 h-4 inline mr-2" />
                  Destination Warehouse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.destinationWarehouseId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destinationWarehouseId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Warehouse ID or Code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Material ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.materialId}
                  onChange={(e) =>
                    setFormData({ ...formData, materialId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Material ID or SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Transfer"}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
