/**
 * Comprehensive Warehouse Areas Page
 * World's Most Comprehensive Area/Zone Management
 * BlueDXP Platform - 4IR & 5IR Aligned
 * 
 * INTEGRATED: Uses real API for warehouses/facilities
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import WarehouseAreasManager from "@/components/warehouse/WarehouseAreasManager";

interface Warehouse {
  id: string;
  warehouseName: string;
  name?: string;
  code?: string;
  type?: string;
}

export default function WarehouseAreasPage() {
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get("warehouseId") || "";
  const linkedModuleId = searchParams.get("linkedModuleId") || undefined;
  const linkedEntityId = searchParams.get("linkedEntityId") || undefined;
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [allowStandalone, setAllowStandalone] = useState(true);

  // Fetch warehouses/facilities from real API
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const response = await fetch("/api/facility?type=WAREHOUSE&limit=50");
        const data = await response.json();
        
        if (data.success && data.facilities) {
          const mapped = data.facilities.map((f: any) => ({
            id: f.id,
            warehouseName: f.name || f.code || `Warehouse ${f.id}`,
            name: f.name,
            code: f.code,
            type: f.type,
          }));
          setWarehouses(mapped);
          
          // Set selected warehouse if warehouseId provided
          if (warehouseId) {
            const found = mapped.find((w: Warehouse) => w.id === warehouseId);
            if (found) setSelectedWarehouse(found);
          }
        }
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchWarehouses();
  }, [warehouseId]);

  return (
    <PageTemplate
      title="Warehouse Areas & Zones"
      description="Comprehensive area and zone management with capacity tracking, hazard restrictions, and analytics"
      icon="ri-grid-line"
      systemInfo={{
        sap: "Storage Bin, Storage Type",
        oracle: "Locator, Subinventory",
        manhattan: "Location Master, Zone Management",
      }}
      examples={[
        "Area and zone management",
        "Capacity and utilization tracking",
        "Hazard class restrictions",
        "Import/Export functionality",
        "Real-time analytics",
        "Multi-zone organization",
      ]}
      stats={[
        {
          label: "Selected Warehouse",
          value: selectedWarehouse?.warehouseName || "Standalone Mode",
          icon: "ri-warehouse-line",
          tooltip: "Current warehouse",
          trend: "neutral" as const,
        },
      ]}
      actions={
        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouse?.id || "standalone"}
            onChange={(e) => {
              if (e.target.value === "standalone") {
                setSelectedWarehouse(null);
              } else {
                const wh = warehouses.find((w) => w.id === e.target.value);
                if (wh) setSelectedWarehouse(wh);
              }
            }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-white"
          >
            <option value="standalone">Standalone Areas (No Warehouse)</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.warehouseName}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <WarehouseAreasManager
        warehouseId={selectedWarehouse?.id}
        warehouseName={selectedWarehouse?.warehouseName}
        allowStandalone={allowStandalone}
        linkedModuleId={linkedModuleId}
        linkedEntityId={linkedEntityId}
      />
    </PageTemplate>
  );
}
