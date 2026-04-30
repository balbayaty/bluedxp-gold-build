/**
 * Create Trade Compliance Record Page
 * Form to create a new trade compliance record
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CreateTradeComplianceRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tradeDirection: "IMPORT" as "IMPORT" | "EXPORT" | "RE_EXPORT" | "TRANSIT",
    tradeType: "COMMERCIAL" as
      | "COMMERCIAL"
      | "PERSONAL"
      | "SAMPLE"
      | "RETURN"
      | "REPAIR",
    originCountry: "",
    destinationCountry: "",
    productCategory: "",
    productDescription: "",
    hsCode: "",
    quantity: "",
    unitValue: "",
    totalValue: "",
    shipmentMode: "AIR" as "AIR" | "SEA" | "LAND" | "RAIL" | "COURIER",
    expectedShipDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/trade-compliance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/trade-compliance/records");
      } else {
        alert(data.error || "Failed to create record. Please try again.");
      }
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Failed to create record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Following UI/UX Standards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#9ca3af] hover:text-white mb-4 transition-colors"
          >
            <i className="ri-arrow-left-line"></i>
            Back
          </button>
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
              <i className="ri-file-add-line text-white text-lg sm:text-xl"></i>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                Create Trade Compliance Record
              </h1>
              <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
                Start a new import/export trade compliance record with
                ML-powered requirement prediction
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 sm:mb-6 flex items-start gap-3"
        >
          <i className="ri-information-line text-blue-400 text-xl flex-shrink-0 mt-0.5"></i>
          <div className="text-sm text-blue-400">
            <p className="font-medium mb-1">ML-Powered Predictions</p>
            <p>
              Our system will automatically predict required licenses,
              documents, and compliance requirements based on your inputs.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Trade Direction & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Trade Direction *
              </label>
              <select
                name="tradeDirection"
                value={formData.tradeDirection}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="IMPORT">Import</option>
                <option value="EXPORT">Export</option>
                <option value="RE_EXPORT">Re-Export</option>
                <option value="TRANSIT">Transit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Trade Type *
              </label>
              <select
                name="tradeType"
                value={formData.tradeType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="COMMERCIAL">Commercial</option>
                <option value="PERSONAL">Personal</option>
                <option value="SAMPLE">Sample</option>
                <option value="RETURN">Return</option>
                <option value="REPAIR">Repair</option>
              </select>
            </div>
          </div>

          {/* Countries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Origin Country *
              </label>
              <input
                type="text"
                name="originCountry"
                value={formData.originCountry}
                onChange={handleChange}
                required
                placeholder="e.g., CN, US, SA"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Destination Country *
              </label>
              <input
                type="text"
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleChange}
                required
                placeholder="e.g., SA, AE, KW"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Product Information */}
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Product Category *
            </label>
            <select
              name="productCategory"
              value={formData.productCategory}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">Select category</option>
              <option value="CHEMICALS">Chemicals</option>
              <option value="FOOD">Food</option>
              <option value="MEDICINE">Medicine</option>
              <option value="ELECTRONICS">Electronics</option>
              <option value="MACHINERY">Machinery</option>
              <option value="TEXTILES">Textiles</option>
              <option value="AUTOMOTIVE">Automotive</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="AGRICULTURE">Agriculture</option>
              <option value="COSMETICS">Cosmetics</option>
              <option value="TOYS">Toys</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Product Description *
            </label>
            <textarea
              name="productDescription"
              value={formData.productDescription}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe the product in detail..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                HS Code
              </label>
              <input
                type="text"
                name="hsCode"
                value={formData.hsCode}
                onChange={handleChange}
                placeholder="e.g., 1234.56.78"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Shipment Mode *
              </label>
              <select
                name="shipmentMode"
                value={formData.shipmentMode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="AIR">Air</option>
                <option value="SEA">Sea</option>
                <option value="LAND">Land</option>
                <option value="RAIL">Rail</option>
                <option value="COURIER">Courier</option>
              </select>
            </div>
          </div>

          {/* Quantity & Value */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Unit Value *
              </label>
              <input
                type="number"
                name="unitValue"
                value={formData.unitValue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                Total Value *
              </label>
              <input
                type="number"
                name="totalValue"
                value={formData.totalValue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Expected Ship Date
            </label>
            <input
              type="date"
              name="expectedShipDate"
              value={formData.expectedShipDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Any additional information..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 sm:px-6 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 sm:px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <i className="ri-save-line"></i>
              {loading ? "Creating..." : "Create Record"}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
