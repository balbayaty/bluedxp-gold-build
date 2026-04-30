"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Route, ArrowRight, Clock, DollarSign } from "lucide-react";
import type { NetworkRoute } from "@/lib/services/warehouse-network";

export default function NewRoutePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const networkId = searchParams.get("networkId") || "network-1";

  const [formData, setFormData] = useState({
    networkId,
    originWarehouseId: "",
    destinationWarehouseId: "",
    routeType: "TRANSFER" as NetworkRoute["routeType"],
    distance: 0,
    estimatedTransitTime: 0,
    frequency: "DAILY" as NetworkRoute["frequency"],
    cost: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/warehouse-network/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          networkId: formData.networkId,
          originWarehouseId: formData.originWarehouseId,
          destinationWarehouseId: formData.destinationWarehouseId,
          routeType: formData.routeType,
          distance: formData.distance || undefined,
          estimatedTransitTime: formData.estimatedTransitTime || undefined,
          frequency: formData.frequency,
          cost: formData.cost || undefined,
          status: "ACTIVE",
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create route");
      }

      router.push(`/warehouse-network/routes`);
    } catch (error) {
      console.error("Failed to create route:", error);
      alert("Failed to create route. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="Create Network Route"
      description="Add a new route between warehouses"
      icon="ri-add-circle-line"
    >
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Route Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                  Route Type *
                </label>
                <select
                  required
                  value={formData.routeType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      routeType: e.target.value as NetworkRoute["routeType"],
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TRANSFER">Transfer</option>
                  <option value="DISTRIBUTION">Distribution</option>
                  <option value="CONSOLIDATION">Consolidation</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.distance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distance: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Transit Time (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedTransitTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedTransitTime: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Frequency *
                </label>
                <select
                  required
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as NetworkRoute["frequency"],
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="ON_DEMAND">On Demand</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cost (SAR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: Number(e.target.value) })
                  }
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
              {submitting ? "Creating..." : "Create Route"}
            </button>
          </div>
        </form>
      </div>
    </PageTemplate>
  );
}
