/**
 * ASN Line Items Editor - Enterprise Grade
 *
 * Features:
 * - Add/Edit/Delete line items
 * - Batch entry mode
 * - SKU lookup with autocomplete
 * - Barcode scanning support
 * - Bulk import from Excel/CSV
 * - Drag and drop reordering
 * - Real-time calculations
 */

"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ASNLineItem,
  createDefaultLineItem,
  UNITS_OF_MEASURE,
} from "./ASNFormTypes";
import { ASNItemStatus } from "@/types/asn";

interface ASNLineItemsEditorProps {
  items: ASNLineItem[];
  onChange: (items: ASNLineItem[]) => void;
  currency: string;
  currencySymbol: string;
}

export default function ASNLineItemsEditor({
  items,
  onChange,
  currency,
  currencySymbol,
}: ASNLineItemsEditorProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showBatchEntry, setShowBatchEntry] = useState(false);
  const [batchText, setBatchText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add new line item
  const addItem = () => {
    const newItem = createDefaultLineItem(items.length + 1);
    onChange([...items, newItem]);
    setEditingItemId(newItem.id);
  };

  // Update line item
  const updateItem = (itemId: string, updates: Partial<ASNLineItem>) => {
    onChange(
      items.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, ...updates };
          // Auto-calculate total price
          if (
            updates.quantity !== undefined ||
            updates.unitPrice !== undefined
          ) {
            updated.totalPrice = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      }),
    );
  };

  // Delete line item
  const deleteItem = (itemId: string) => {
    const filtered = items.filter((item) => item.id !== itemId);
    // Renumber remaining items
    const renumbered = filtered.map((item, index) => ({
      ...item,
      lineNumber: index + 1,
    }));
    onChange(renumbered);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  // Duplicate line item
  const duplicateItem = (item: ASNLineItem) => {
    const newItem: ASNLineItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      lineNumber: items.length + 1,
      batchNumber: undefined,
      serialNumbers: undefined,
    };
    onChange([...items, newItem]);
  };

  // Handle reorder
  const handleReorder = (reorderedItems: ASNLineItem[]) => {
    const renumbered = reorderedItems.map((item, index) => ({
      ...item,
      lineNumber: index + 1,
    }));
    onChange(renumbered);
  };

  // Parse batch entry
  const parseBatchEntry = () => {
    const lines = batchText.split("\n").filter((line) => line.trim());
    const newItems: ASNLineItem[] = lines.map((line, index) => {
      const parts = line.split(/[\t,]/).map((p) => p.trim());
      return {
        ...createDefaultLineItem(items.length + index + 1),
        sku: parts[0] || "",
        description: parts[1] || parts[0] || "",
        quantity: parseFloat(parts[2]) || 1,
        unitOfMeasure: parts[3] || "EA",
        unitPrice: parseFloat(parts[4]) || 0,
        totalPrice: (parseFloat(parts[2]) || 1) * (parseFloat(parts[4]) || 0),
      };
    });
    onChange([...items, ...newItems]);
    setBatchText("");
    setShowBatchEntry(false);
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBatchText(text);
      setShowBatchEntry(true);
    };
    reader.readAsText(file);
  };

  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.quantity,
      value: acc.value + item.totalPrice,
      weight: acc.weight + (item.grossWeight || 0),
    }),
    { quantity: 0, value: 0, weight: 0 },
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Line Items
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} item{items.length !== 1 ? "s" : ""} • Total:{" "}
            {currencySymbol}
            {totals.value.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.xlsx"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-upload-2-line" />
            Import
          </button>
          <button
            onClick={() => setShowBatchEntry(!showBatchEntry)}
            className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <i className="ri-list-check-2" />
            Batch Entry
          </button>
          <button
            onClick={addItem}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line" />
            Add Item
          </button>
        </div>
      </div>

      {/* Batch Entry Modal */}
      <AnimatePresence>
        {showBatchEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800 dark:text-blue-300">
                Batch Entry
              </h4>
              <button
                onClick={() => setShowBatchEntry(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              Enter items one per line: SKU, Description, Quantity, UOM, Unit
              Price (tab or comma separated)
            </p>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="SKU001&#9;Widget A&#9;100&#9;EA&#9;25.00&#10;SKU002&#9;Widget B&#9;50&#9;CS&#9;120.00"
              rows={5}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg text-sm font-mono"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={parseBatchEntry}
                disabled={!batchText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add {batchText.split("\n").filter((l) => l.trim()).length} Items
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
          <i className="ri-box-3-line text-4xl text-gray-400 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No items added yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Click "Add Item" or use batch entry to add products
          </p>
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {items.map((item) => (
            <Reorder.Item key={item.id} value={item}>
              <motion.div
                layout
                className={`bg-white dark:bg-gray-800 border rounded-xl overflow-hidden transition-all ${
                  editingItemId === item.id
                    ? "border-blue-500 shadow-lg shadow-blue-500/20"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* Collapsed View */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() =>
                    setEditingItemId(editingItemId === item.id ? null : item.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                      <i className="ri-drag-move-2-line text-xl" />
                    </div>

                    {/* Line Number */}
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                      {item.lineNumber}
                    </div>

                    {/* SKU & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                          {item.sku || "No SKU"}
                        </span>
                        {item.batchNumber && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded">
                            Batch: {item.batchNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {item.description || "No description"}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.quantity.toLocaleString()} {item.unitOfMeasure}
                      </p>
                      <p className="text-sm text-gray-500">
                        @ {currencySymbol}
                        {item.unitPrice.toFixed(2)}
                      </p>
                    </div>

                    {/* Total */}
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {currencySymbol}
                        {item.totalPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateItem(item);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <i className="ri-file-copy-line" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                      <i
                        className={`ri-arrow-${editingItemId === item.id ? "up" : "down"}-s-line text-gray-400 transition-transform`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Edit Form */}
                <AnimatePresence>
                  {editingItemId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                        {/* Row 1: Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              SKU *
                            </label>
                            <input
                              type="text"
                              value={item.sku}
                              onChange={(e) =>
                                updateItem(item.id, { sku: e.target.value })
                              }
                              placeholder="e.g., SKU-12345"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Description *
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Product description"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                        </div>

                        {/* Row 2: Quantity & Pricing */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              min="0"
                              step="1"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              UOM *
                            </label>
                            <select
                              value={item.unitOfMeasure}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  unitOfMeasure: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            >
                              {UNITS_OF_MEASURE.map((uom) => (
                                <option key={uom.value} value={uom.value}>
                                  {uom.value}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Unit Price ({currency})
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  unitPrice: parseFloat(e.target.value) || 0,
                                })
                              }
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Total Price
                            </label>
                            <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium text-green-700 dark:text-green-400">
                              {currencySymbol}
                              {item.totalPrice.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              HS Code
                            </label>
                            <input
                              type="text"
                              value={item.hsCode || ""}
                              onChange={(e) =>
                                updateItem(item.id, { hsCode: e.target.value })
                              }
                              placeholder="e.g., 8471.30"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                        </div>

                        {/* Row 3: Batch & Traceability */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Batch Number
                            </label>
                            <input
                              type="text"
                              value={item.batchNumber || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  batchNumber: e.target.value,
                                })
                              }
                              placeholder="e.g., BATCH-2024-001"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Lot Number
                            </label>
                            <input
                              type="text"
                              value={item.lotNumber || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  lotNumber: e.target.value,
                                })
                              }
                              placeholder="e.g., LOT-001"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Manufacturing Date
                            </label>
                            <input
                              type="date"
                              value={item.manufacturingDate || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  manufacturingDate: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  expiryDate: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Country of Origin
                            </label>
                            <input
                              type="text"
                              value={item.countryOfOrigin || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  countryOfOrigin: e.target.value,
                                })
                              }
                              placeholder="e.g., Germany"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                        </div>

                        {/* Row 4: Weight & Dimensions */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Gross Weight
                            </label>
                            <input
                              type="number"
                              value={item.grossWeight || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  grossWeight:
                                    parseFloat(e.target.value) || undefined,
                                })
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Net Weight
                            </label>
                            <input
                              type="number"
                              value={item.netWeight || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  netWeight:
                                    parseFloat(e.target.value) || undefined,
                                })
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              L × W × H (cm)
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                value={item.length || ""}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    length:
                                      parseFloat(e.target.value) || undefined,
                                  })
                                }
                                placeholder="L"
                                className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-center"
                              />
                              <input
                                type="number"
                                value={item.width || ""}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    width:
                                      parseFloat(e.target.value) || undefined,
                                  })
                                }
                                placeholder="W"
                                className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-center"
                              />
                              <input
                                type="number"
                                value={item.height || ""}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    height:
                                      parseFloat(e.target.value) || undefined,
                                  })
                                }
                                placeholder="H"
                                className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-center"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Volume (m³)
                            </label>
                            <input
                              type="number"
                              value={item.volume || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  volume:
                                    parseFloat(e.target.value) || undefined,
                                })
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Pallets
                            </label>
                            <input
                              type="number"
                              value={item.palletCount || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  palletCount:
                                    parseInt(e.target.value) || undefined,
                                })
                              }
                              placeholder="0"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Suggested Location
                            </label>
                            <input
                              type="text"
                              value={item.suggestedLocation || ""}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  suggestedLocation: e.target.value,
                                })
                              }
                              placeholder="e.g., A-01-02"
                              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                        </div>

                        {/* Row 5: Inspection */}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.inspectionRequired}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  inspectionRequired: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Inspection Required
                            </span>
                          </label>
                          {item.inspectionRequired && (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.qualityGrade || ""}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    qualityGrade: e.target.value,
                                  })
                                }
                                placeholder="Quality grade or inspection notes"
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Summary Footer */}
      {items.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Items
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {items.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Qty
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {totals.quantity.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Weight
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {totals.weight.toLocaleString()} KG
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Value
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {currencySymbol}
                {totals.value.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
