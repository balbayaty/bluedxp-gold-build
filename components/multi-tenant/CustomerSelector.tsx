"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Customer } from "@/types/tenant";
import Tooltip from "@/components/Tooltip";

interface CustomerSelectorProps {
  customers: Customer[];
  onSelectionChange?: (customerIds: string[]) => void;
  allowMultiple?: boolean;
  showAllOption?: boolean;
  className?: string;
}

export default function CustomerSelector({
  customers,
  onSelectionChange,
  allowMultiple = true,
  showAllOption = true,
  className = "",
}: CustomerSelectorProps) {
  const { context, setCustomerFilter } = useViewContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(query) ||
        customer.customerNumber.toLowerCase().includes(query) ||
        customer.serviceTier.toLowerCase().includes(query),
    );
  }, [customers, searchQuery]);

  const selectedCustomers = useMemo(() => {
    if (context.customerFilter.type === "ALL") return [];
    if (context.customerFilter.type === "ASSIGNED")
      return context.customerFilter.customerIds || [];
    return context.customerFilter.customerIds || [];
  }, [context.customerFilter]);

  const handleSelect = (customerId: string) => {
    if (context.customerFilter.type === "ALL" && !allowMultiple) {
      setCustomerFilter("SINGLE", [customerId]);
      onSelectionChange?.([customerId]);
      setIsOpen(false);
      return;
    }

    if (allowMultiple) {
      const currentIds = selectedCustomers;
      const isSelected = currentIds.includes(customerId);

      if (isSelected) {
        const newIds = currentIds.filter((id) => id !== customerId);
        if (newIds.length === 0 && showAllOption) {
          setCustomerFilter("ALL");
          onSelectionChange?.([]);
        } else {
          setCustomerFilter("MULTIPLE", newIds);
          onSelectionChange?.(newIds);
        }
      } else {
        const newIds = [...currentIds, customerId];
        setCustomerFilter("MULTIPLE", newIds);
        onSelectionChange?.(newIds);
      }
    } else {
      setCustomerFilter("SINGLE", [customerId]);
      onSelectionChange?.([customerId]);
      setIsOpen(false);
    }
  };

  const handleSelectAll = () => {
    setCustomerFilter("ALL");
    onSelectionChange?.([]);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (context.customerFilter.type === "ALL") {
      return "All Customers";
    }
    if (context.customerFilter.type === "ASSIGNED") {
      return "Assigned Customers";
    }
    if (selectedCustomers.length === 0) {
      return "Select Customers";
    }
    if (selectedCustomers.length === 1) {
      const customer = customers.find((c) => c.id === selectedCustomers[0]);
      return customer?.customerName || "1 Customer";
    }
    return `${selectedCustomers.length} Customers`;
  };

  const selectedCustomerNames = useMemo(() => {
    return selectedCustomers
      .map((id) => customers.find((c) => c.id === id)?.customerName)
      .filter(Boolean)
      .join(", ");
  }, [selectedCustomers, customers]);

  // Position dropdown relative to button
  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdown = dropdownRef.current;
      dropdown.style.top = `${buttonRect.bottom + 8}px`;
      dropdown.style.left = `${buttonRect.left}px`;
      dropdown.style.width = `${buttonRect.width}px`;
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <Tooltip
        content={selectedCustomerNames || "Select customers to filter data"}
        position="bottom"
      >
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 sm:px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all flex items-center justify-between min-h-[42px] whitespace-nowrap"
          aria-label="Select customers"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <i className="ri-user-3-line text-cyan-400 flex-shrink-0"></i>
            <span className="text-xs sm:text-sm font-medium truncate">
              {getDisplayText()}
            </span>
          </div>
          <i
            className={`ri-arrow-down-s-line transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
          ></i>
        </button>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed z-[1000] bg-[#1f2937] border border-white/10 rounded-lg shadow-xl max-h-96 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-80 overflow-y-auto">
                {showAllOption && (
                  <button
                    onClick={handleSelectAll}
                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 ${
                      context.customerFilter.type === "ALL"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-white"
                    }`}
                  >
                    <i
                      className={`ri-checkbox-${context.customerFilter.type === "ALL" ? "fill" : "line"} text-cyan-400 flex-shrink-0`}
                    ></i>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        All Customers
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        View all customers
                      </div>
                    </div>
                  </button>
                )}

                {filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomers.includes(customer.id);
                  return (
                    <button
                      key={customer.id}
                      onClick={() => handleSelect(customer.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 ${
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "text-white"
                      }`}
                    >
                      <i
                        className={`ri-checkbox-${isSelected ? "fill" : "line"} text-cyan-400 flex-shrink-0`}
                      ></i>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {customer.customerName}
                        </div>
                        <div className="text-xs text-[#9ca3af] truncate">
                          {customer.customerNumber} • {customer.serviceTier} •{" "}
                          {customer.status}
                        </div>
                      </div>
                      {customer.serviceTier === "PLATINUM" && (
                        <i className="ri-vip-crown-line text-yellow-400 flex-shrink-0 ml-2"></i>
                      )}
                    </button>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#9ca3af] text-sm">
                    No customers found
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedCustomers.length > 0 && (
                <div className="p-3 border-t border-white/10 bg-white/5">
                  <div className="text-xs text-[#9ca3af] text-center">
                    {selectedCustomers.length} customer
                    {selectedCustomers.length !== 1 ? "s" : ""} selected
                  </div>
                </div>
              )}
            </motion.div>

            {/* Click outside to close */}
            <div
              className="fixed inset-0 z-[999]"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
