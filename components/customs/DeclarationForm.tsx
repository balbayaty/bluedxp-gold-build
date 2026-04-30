/**
 * Declaration Form Component
 * Modern, intuitive form with auto-fill and validation
 */

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiX,
  FiPlus,
  FiTrash2,
  FiSave,
} from "react-icons/fi";

interface DeclarationFormProps {
  onSave?: (declaration: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function DeclarationForm({
  onSave,
  onCancel,
  initialData,
}: DeclarationFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      country: "",
      type: "IMPORT",
      importer: { name: "", country: "", address: {} },
      exporter: { name: "", country: "", address: {} },
      products: [],
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate
      const validationErrors: Record<string, string> = {};
      if (!formData.country) validationErrors.country = "Country is required";
      if (!formData.importer.name)
        validationErrors.importer = "Importer name is required";
      if (!formData.exporter.name)
        validationErrors.exporter = "Exporter name is required";
      if (formData.products.length === 0)
        validationErrors.products = "At least one product is required";

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }

      // Save
      if (onSave) {
        await onSave(formData);
      }
    } catch (error) {
      console.error("Failed to save declaration:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <FiFileText className="text-cyan-400" />
          <span>Customs Declaration</span>
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Country & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <select
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="">Select Country</option>
              <option value="EG">Egypt</option>
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="QA">Qatar</option>
              <option value="BH">Bahrain</option>
              <option value="OM">Oman</option>
              <option value="JO">Jordan</option>
            </select>
            {errors.country && (
              <p className="text-red-400 text-sm mt-1">{errors.country}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="IMPORT">Import</option>
              <option value="EXPORT">Export</option>
              <option value="TRANSIT">Transit</option>
              <option value="TIR">TIR</option>
            </select>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Importer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.importer.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      importer: { ...formData.importer, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.importer.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      importer: {
                        ...formData.importer,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Exporter</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.exporter.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exporter: { ...formData.exporter, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.exporter.country}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exporter: {
                        ...formData.exporter,
                        country: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Products</h3>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  products: [
                    ...formData.products,
                    {
                      id: `prod-${Date.now()}`,
                      hsCode: "",
                      description: "",
                      quantity: 0,
                      unitValue: 0,
                    },
                  ],
                })
              }
              className="flex items-center space-x-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
          <div className="space-y-3">
            {formData.products.map((product: any, index: number) => (
              <div
                key={product.id || index}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="HS Code"
                    value={product.hsCode}
                    onChange={(e) => {
                      const newProducts = [...formData.products];
                      newProducts[index].hsCode = e.target.value;
                      setFormData({ ...formData, products: newProducts });
                    }}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={product.description}
                    onChange={(e) => {
                      const newProducts = [...formData.products];
                      newProducts[index].description = e.target.value;
                      setFormData({ ...formData, products: newProducts });
                    }}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={product.quantity}
                    onChange={(e) => {
                      const newProducts = [...formData.products];
                      newProducts[index].quantity = parseFloat(e.target.value);
                      setFormData({ ...formData, products: newProducts });
                    }}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Unit Value"
                      value={product.unitValue}
                      onChange={(e) => {
                        const newProducts = [...formData.products];
                        newProducts[index].unitValue = parseFloat(
                          e.target.value,
                        );
                        setFormData({ ...formData, products: newProducts });
                      }}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newProducts = formData.products.filter(
                          (_: any, i: number) => i !== index,
                        );
                        setFormData({ ...formData, products: newProducts });
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.products && (
            <p className="text-red-400 text-sm mt-2">{errors.products}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Declaration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
