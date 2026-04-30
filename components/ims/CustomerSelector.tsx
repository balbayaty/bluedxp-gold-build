/**
 * Customer Selector Component for ISO IMS
 * Intelligent customer selection with search and filtering
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Customer {
  name: string;
  customer_name: string;
  customer_type?: string;
  territory?: string;
  customer_group?: string;
}

interface CustomerSelectorProps {
  value: string;
  onChange: (customerName: string) => void;
  label: string;
  required?: boolean;
  isDark?: boolean;
  placeholder?: string;
}

export default function CustomerSelector({
  value,
  onChange,
  label,
  required = false,
  isDark = true,
  placeholder = "Select customer...",
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/erpnext/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || data.data || []);
      } else {
        // Mock data fallback
        setCustomers([
          {
            name: "CUST-001",
            customer_name: "ABC Manufacturing Co.",
            customer_type: "Manufacturing",
            territory: "Saudi Arabia",
          },
          {
            name: "CUST-002",
            customer_name: "XYZ Trading LLC",
            customer_type: "Trading",
            territory: "UAE",
          },
          {
            name: "CUST-003",
            customer_name: "Global Distribution Ltd.",
            customer_type: "Distribution",
            territory: "Kuwait",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      // Mock data fallback
      setCustomers([
        {
          name: "CUST-001",
          customer_name: "ABC Manufacturing Co.",
          customer_type: "Manufacturing",
          territory: "Saudi Arabia",
        },
        {
          name: "CUST-002",
          customer_name: "XYZ Trading LLC",
          customer_type: "Trading",
          territory: "UAE",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customer_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customer_type?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedCustomer = customers.find(
    (c) => c.name === value || c.customer_name === value,
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
            <i className="ri-user-line text-gray-400"></i>
            <span>
              {selectedCustomer
                ? `${selectedCustomer.customer_name} (${selectedCustomer.name})`
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
                      placeholder="Search customers..."
                      className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                        isDark
                          ? "bg-gray-700 text-white"
                          : "bg-gray-50 text-gray-900"
                      } focus:outline-none`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Customer List */}
                <div className="overflow-y-auto max-h-72">
                  {loading && (
                    <div className="p-4 text-center text-gray-500">
                      Loading customers...
                    </div>
                  )}

                  {!loading && filteredCustomers.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No customers found
                    </div>
                  )}

                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.name}
                      type="button"
                      onClick={() => {
                        onChange(customer.name);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                        value === customer.name
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
                          {customer.customer_name}
                        </div>
                        <div
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {customer.name}{" "}
                          {customer.customer_type &&
                            `• ${customer.customer_type}`}{" "}
                          {customer.territory && `• ${customer.territory}`}
                        </div>
                      </div>
                      {value === customer.name && (
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
