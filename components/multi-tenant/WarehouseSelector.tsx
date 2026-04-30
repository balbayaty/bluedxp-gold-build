"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { Warehouse } from "@/types/tenant";
import Tooltip from "@/components/Tooltip";

interface WarehouseSelectorProps {
  warehouses: Warehouse[];
  onSelectionChange?: (warehouseIds: string[]) => void;
  allowMultiple?: boolean;
  showAllOption?: boolean;
  className?: string;
}

export default function WarehouseSelector({
  warehouses,
  onSelectionChange,
  allowMultiple = true,
  showAllOption = true,
  className = "",
}: WarehouseSelectorProps) {
  const { context, setWarehouseFilter } = useViewContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWarehouses = useMemo(() => {
    if (!searchQuery) return warehouses;
    const query = searchQuery.toLowerCase();
    return warehouses.filter(
      (warehouse) =>
        warehouse.warehouseName.toLowerCase().includes(query) ||
        warehouse.warehouseCode.toLowerCase().includes(query) ||
        warehouse.type.toLowerCase().includes(query),
    );
  }, [warehouses, searchQuery]);

  const selectedWarehouses = useMemo(() => {
    if (context.warehouseFilter.type === "ALL") return [];
    if (context.warehouseFilter.type === "ASSIGNED")
      return context.warehouseFilter.warehouseIds || [];
    return context.warehouseFilter.warehouseIds || [];
  }, [context.warehouseFilter]);

  const handleSelect = (warehouseId: string) => {
    if (context.warehouseFilter.type === "ALL" && !allowMultiple) {
      setWarehouseFilter("SINGLE", [warehouseId]);
      onSelectionChange?.([warehouseId]);
      setIsOpen(false);
      return;
    }

    if (allowMultiple) {
      const currentIds = selectedWarehouses;
      const isSelected = currentIds.includes(warehouseId);

      if (isSelected) {
        const newIds = currentIds.filter((id) => id !== warehouseId);
        if (newIds.length === 0 && showAllOption) {
          setWarehouseFilter("ALL");
          onSelectionChange?.([]);
        } else {
          setWarehouseFilter("MULTIPLE", newIds);
          onSelectionChange?.(newIds);
        }
      } else {
        const newIds = [...currentIds, warehouseId];
        setWarehouseFilter("MULTIPLE", newIds);
        onSelectionChange?.(newIds);
      }
    } else {
      setWarehouseFilter("SINGLE", [warehouseId]);
      onSelectionChange?.([warehouseId]);
      setIsOpen(false);
    }
  };

  const handleSelectAll = () => {
    setWarehouseFilter("ALL");
    onSelectionChange?.([]);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (context.warehouseFilter.type === "ALL") {
      return "All Warehouses";
    }
    if (context.warehouseFilter.type === "ASSIGNED") {
      return "Assigned Warehouses";
    }
    if (selectedWarehouses.length === 0) {
      return "Select Warehouses";
    }
    if (selectedWarehouses.length === 1) {
      const warehouse = warehouses.find((w) => w.id === selectedWarehouses[0]);
      return warehouse?.warehouseName || "1 Warehouse";
    }
    return `${selectedWarehouses.length} Warehouses`;
  };

  const selectedWarehouseNames = useMemo(() => {
    return selectedWarehouses
      .map((id) => warehouses.find((w) => w.id === id)?.warehouseName)
      .filter(Boolean)
      .join(", ");
  }, [selectedWarehouses, warehouses]);

  return (
    <div className={`relative ${className}`}>
      <Tooltip
        content={selectedWarehouseNames || "Select warehouses to filter data"}
        position="bottom"
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all flex items-center justify-between min-h-[42px]"
          aria-label="Select warehouses"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <i className="ri-warehouse-line text-cyan-400 flex-shrink-0"></i>
            <span className="text-sm font-medium truncate">
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-[#1f2937] border border-white/10 rounded-lg shadow-xl max-h-96 overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
                  <input
                    type="text"
                    placeholder="Search warehouses..."
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
                      context.warehouseFilter.type === "ALL"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-white"
                    }`}
                  >
                    <i
                      className={`ri-checkbox-${context.warehouseFilter.type === "ALL" ? "fill" : "line"} text-cyan-400 flex-shrink-0`}
                    ></i>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        All Warehouses
                      </div>
                      <div className="text-xs text-[#9ca3af]">
                        View all warehouses
                      </div>
                    </div>
                  </button>
                )}

                {filteredWarehouses.map((warehouse) => {
                  const isSelected = selectedWarehouses.includes(warehouse.id);
                  return (
                    <button
                      key={warehouse.id}
                      onClick={() => handleSelect(warehouse.id)}
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
                          {warehouse.warehouseName}
                        </div>
                        <div className="text-xs text-[#9ca3af] truncate">
                          {warehouse.warehouseCode} • {warehouse.type} •{" "}
                          {warehouse.status}
                        </div>
                        <div className="text-xs text-cyan-400 mt-0.5 truncate">
                          {warehouse.currentUtilization.utilizationPercentage.toFixed(
                            1,
                          )}
                          % utilized
                        </div>
                      </div>
                      {warehouse.type === "DEDICATED" && (
                        <i className="ri-lock-line text-yellow-400 flex-shrink-0 ml-2"></i>
                      )}
                    </button>
                  );
                })}

                {filteredWarehouses.length === 0 && (
                  <div className="px-4 py-8 text-center text-[#9ca3af] text-sm">
                    No warehouses found
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedWarehouses.length > 0 && (
                <div className="p-3 border-t border-white/10 bg-white/5">
                  <div className="text-xs text-[#9ca3af] text-center">
                    {selectedWarehouses.length} warehouse
                    {selectedWarehouses.length !== 1 ? "s" : ""} selected
                  </div>
                </div>
              )}
            </motion.div>

            {/* Click outside to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
