/**
 * Supplier Selector Component for ISO IMS
 * Intelligent supplier selection with search and filtering
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Supplier {
  name: string;
  supplier_name: string;
  supplier_type?: string;
  territory?: string;
}

interface SupplierSelectorProps {
  value: string;
  onChange: (supplierName: string) => void;
  label: string;
  required?: boolean;
  isDark?: boolean;
  placeholder?: string;
}

export default function SupplierSelector({
  value,
  onChange,
  label,
  required = false,
  isDark = true,
  placeholder = "Select supplier...",
}: SupplierSelectorProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/erpnext/suppliers");
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || data.data || []);
      } else {
        // Mock data fallback
        setSuppliers([
          {
            name: "SUP-001",
            supplier_name: "ABC Chemical Suppliers",
            supplier_type: "Raw Material",
            territory: "Saudi Arabia",
          },
          {
            name: "SUP-002",
            supplier_name: "XYZ Logistics Partners",
            supplier_type: "Service Provider",
            territory: "UAE",
          },
          {
            name: "SUP-003",
            supplier_name: "Global Packaging Solutions",
            supplier_type: "Packaging",
            territory: "Kuwait",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      // Mock data fallback
      setSuppliers([
        {
          name: "SUP-001",
          supplier_name: "ABC Chemical Suppliers",
          supplier_type: "Raw Material",
          territory: "Saudi Arabia",
        },
        {
          name: "SUP-002",
          supplier_name: "XYZ Logistics Partners",
          supplier_type: "Service Provider",
          territory: "UAE",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.supplier_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.supplier_type?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedSupplier = suppliers.find(
    (s) => s.name === value || s.supplier_name === value,
  );

  return (
    <div className="w-full">
      <label
        className={`block text-sm font-semibold mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className={`w-full px-4 py-3 rounded-lg text-left flex items-center justify-between ${
            isDark
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-gray-900 border-gray-300"
          } border-2 focus:border-blue-500 focus:outline-none`}
        >
          <div className="flex items-center gap-2">
            <i className="ri-building-line text-gray-400"></i>
            <span>
              {selectedSupplier
                ? `${selectedSupplier.supplier_name} (${selectedSupplier.name})`
                : placeholder}
            </span>
          </div>
          <i className="ri-arrow-down-s-line text-gray-400"></i>
        </button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute z-50 mt-2 w-full rounded-lg shadow-2xl ${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } border max-h-96 overflow-hidden`}
              >
                {/* Search */}
                <div className="p-3 border-b border-gray-700">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search suppliers..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                        isDark
                          ? "bg-gray-700 text-white"
                          : "bg-gray-50 text-gray-900"
                      } focus:outline-none`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Supplier List */}
                <div className="overflow-y-auto max-h-72">
                  {loading && (
                    <div className="p-4 text-center text-gray-500">
                      Loading suppliers...
                    </div>
                  )}

                  {!loading && filteredSuppliers.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No suppliers found
                    </div>
                  )}

                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.name}
                      type="button"
                      onClick={() => {
                        onChange(supplier.name);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                        value === supplier.name
                          ? isDark
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-blue-50 text-blue-700"
                          : isDark
                            ? "hover:bg-gray-700 text-white"
                            : "hover:bg-gray-50 text-gray-900"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">
                          {supplier.supplier_name}
                        </div>
                        <div
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {supplier.name}{" "}
                          {supplier.supplier_type &&
                            `• ${supplier.supplier_type}`}{" "}
                          {supplier.territory && `• ${supplier.territory}`}
                        </div>
                      </div>
                      {value === supplier.name && (
                        <i className="ri-check-line text-blue-500"></i>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Click outside to close */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {required && !value && (
        <p className="text-xs mt-1 text-red-500">This field is required</p>
      )}
    </div>
  );
}
