"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
import { createOutboundOrderAction } from "@/app/actions/wms/outboundActions";

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: (order: ASNData) => void;
}

export default function CreateOrderModal({
  onClose,
  onSuccess,
}: CreateOrderModalProps) {
  const [formData, setFormData] = useState({
    documentNumber: "",
    customerNumber: "",
    customerName: "",
    destination: "",
    expectedDeliveryDate: "",
    preferredDeliveryDate: "",
    preferredDeliveryTime: "",
    deliveryCity: "",
    deliveryAddress: "",
    deliveryPostalCode: "",
    deliveryCountry: "",
    deliveryInstructions: "",
    projectName: "",
    shipmentClassification:
      "WAREHOUSE_ONLY" as ASNData["shipmentClassification"],
    totalQuantity: "",
    totalWeight: "",
    totalItems: "",
    remarks: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // We cast the mapped result back to ASNData for the UI,
      // though ideally we should fetch the fresh object or use the returned one
      const result = await createOutboundOrderAction(formData);

      if (result.success && result.data) {
        const newOrder: ASNData = {
          id: result.data.id,
          documentNumber: result.data.shipmentNumber,
          customerNumber: formData.customerNumber,
          customerName: formData.customerName,
          status: "CREATED",
          processType: "OUTBOUND",
          destination: formData.destination,
          expectedDeliveryDate: formData.expectedDeliveryDate,
          shipmentClassification: formData.shipmentClassification,
          totalQuantity: parseFloat(formData.totalQuantity) || 0,
          totalWeight: parseFloat(formData.totalWeight) || 0,
          items: [],
          carrier: "",
          priority: "NORMAL",
          // Default / placeholders
          entity: "tenant-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onSuccess(newOrder);
      } else {
        console.error("Failed to create order", result.error);
      }
    } catch (error) {
      console.error("Error submitting order", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between sticky top-0 bg-[#1f2937] z-10">
          <h3 className="text-xl font-bold text-white">
            Create Outbound Order
          </h3>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Order Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., ORD-2024-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Customer
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="Customer Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Customer Number
                </label>
                <input
                  type="text"
                  value={formData.customerNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, customerNumber: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., CUST-01"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Project Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Project Alpha"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">Destination</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Destination Name
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., Warehouse B, Customer Site"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="Full delivery address"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.deliveryCity}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryCity: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.deliveryPostalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryPostalCode: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">
              Shipping Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedDeliveryDate: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Shipment Type
                </label>
                <select
                  value={formData.shipmentClassification}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shipmentClassification: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                >
                  <option value="WAREHOUSE_ONLY">Warehouse Only</option>
                  <option value="DOMESTIC_FREIGHT">Domestic Freight</option>
                  <option value="INTERNATIONAL_FREIGHT">
                    International Freight
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Quantity
                </label>
                <input
                  type="number"
                  value={formData.totalQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, totalQuantity: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Total Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.totalWeight}
                  onChange={(e) =>
                    setFormData({ ...formData, totalWeight: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#374151]">
            <h4 className="text-lg font-semibold text-white">
              Delivery Preferences
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Preferred Delivery Date
                </label>
                <input
                  type="date"
                  value={formData.preferredDeliveryDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferredDeliveryDate: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Preferred Delivery Time
                </label>
                <input
                  type="text"
                  value={formData.preferredDeliveryTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferredDeliveryTime: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="e.g., 09:00-12:00"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Delivery Instructions
                </label>
                <textarea
                  value={formData.deliveryInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryInstructions: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[80px]"
                  placeholder="Any special delivery instructions..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData({ ...formData, remarks: e.target.value })
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[80px]"
                  placeholder="Additional remarks or notes..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[#374151]">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Order
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
