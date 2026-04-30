/**
 * 🏢 CUSTOMER HIERARCHY SELECTOR
 * 
 * Select customers and sub-customers with hierarchical structure
 * Supports multi-level customer relationships
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerHierarchy } from "@/types/userManagement";

export interface CustomerHierarchySelectorProps {
  selectedCustomers: string[];
  onChange: (customerIds: string[]) => void;
  multiSelect?: boolean;
  readOnly?: boolean;
  className?: string;
}

const CustomerHierarchySelector: React.FC<CustomerHierarchySelectorProps> = ({
  selectedCustomers,
  onChange,
  multiSelect = true,
  readOnly = false,
  className = "",
}) => {
  const [customers, setCustomers] = useState<CustomerHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch from real Customer API
      const response = await fetch("/api/customers");
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform customers to hierarchy format
        const customerList = Array.isArray(data) ? data : (data.data || data.customers || []);
        
        // Build hierarchy from flat list
        const hierarchyMap = new Map<string, CustomerHierarchy>();
        const rootCustomers: CustomerHierarchy[] = [];
        
        // First pass: create all nodes
        for (const customer of customerList) {
          const node: CustomerHierarchy = {
            id: customer.id,
            name: customer.name || customer.companyName || `Customer ${customer.id}`,
            parentId: customer.parentId || undefined,
            level: customer.parentId ? 1 : 0,
            children: [],
          };
          hierarchyMap.set(customer.id, node);
        }
        
        // Second pass: build hierarchy
        for (const [id, node] of hierarchyMap) {
          if (node.parentId && hierarchyMap.has(node.parentId)) {
            const parent = hierarchyMap.get(node.parentId)!;
            parent.children = parent.children || [];
            parent.children.push(node);
          } else {
            rootCustomers.push(node);
          }
        }
        
        setCustomers(rootCustomers);
      } else {
        // Fallback: try WMS customers endpoint
        const wmsResponse = await fetch("/api/wms/customers");
        if (wmsResponse.ok) {
          const wmsData = await wmsResponse.json();
          const wmsCustomers = Array.isArray(wmsData) ? wmsData : (wmsData.data || []);
          
          const customers: CustomerHierarchy[] = wmsCustomers.map((c: any) => ({
            id: c.id,
            name: c.name || c.companyName || `Customer ${c.id}`,
            level: 0,
          }));
          
          setCustomers(customers);
        } else {
          console.warn("Could not fetch customers from API, using empty list");
          setCustomers([]);
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (customerId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleSelection = (customerId: string) => {
    if (readOnly) return;

    if (multiSelect) {
      const newSelection = selectedCustomers.includes(customerId)
        ? selectedCustomers.filter((id) => id !== customerId)
        : [...selectedCustomers, customerId];
      onChange(newSelection);
    } else {
      onChange([customerId]);
    }
  };

  const isSelected = (customerId: string) => selectedCustomers.includes(customerId);

  const renderCustomer = (customer: CustomerHierarchy, depth: number = 0) => {
    const hasChildren = customer.children && customer.children.length > 0;
    const isExpanded = expandedNodes.has(customer.id);
    const selected = isSelected(customer.id);

    return (
      <div key={customer.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all
            hover:bg-white/5
            ${selected ? "bg-green-500/10 border border-green-500/30" : ""}
          `}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(customer.id);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <i
                className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-[#9ca3af]`}
              ></i>
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          {/* Checkbox */}
          <button
            onClick={() => toggleSelection(customer.id)}
            disabled={readOnly}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${
                selected
                  ? "bg-green-500 border-green-500"
                  : "border-white/20 hover:border-white/40"
              }
              ${readOnly ? "cursor-default opacity-50" : "cursor-pointer"}
            `}
          >
            {selected && <i className="ri-check-line text-white text-sm"></i>}
          </button>

          {/* Customer Info */}
          <div
            className="flex-1 flex items-center gap-2"
            onClick={() => toggleSelection(customer.id)}
          >
            <i className="ri-building-line text-cyan-400"></i>
            <span className="text-sm text-white font-medium">
              {customer.name}
            </span>
            {customer.level > 0 && (
              <span className="text-xs text-[#9ca3af]">(Sub-customer)</span>
            )}
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {customer.children!.map((child) =>
                renderCustomer(child, depth + 1)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const filteredCustomers = searchQuery
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <i className="ri-loader-4-line animate-spin text-2xl text-cyan-400"></i>
        <p className="text-sm text-[#9ca3af] mt-2">Loading customers...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
        <input
          type="text"
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Selected Count */}
      {selectedCustomers.length > 0 && (
        <div className="text-xs text-[#9ca3af]">
          {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? "s" : ""} selected
        </div>
      )}

      {/* Customer List */}
      <div className="max-h-96 overflow-y-auto custom-scrollbar bg-white/5 border border-white/10 rounded-lg p-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-building-line text-4xl text-[#6b7280] mb-2"></i>
            <p className="text-sm text-[#9ca3af]">No customers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => renderCustomer(customer))
        )}
      </div>
    </div>
  );
};

export default CustomerHierarchySelector;
