/**
 * Real-Time Warehouse Dashboard Page
 * Live streaming warehouse operations dashboard
 * Integrated with BlueDXP platform architecture
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import RealTimeWarehouseDashboard from "@/components/dashboards/RealTimeWarehouseDashboard";
import { useCustomer } from "@/contexts/CustomerContext";
import { useViewContext } from "@/contexts/ViewContextProvider";
import { useAuth } from "@/contexts/AuthContext";
import { generateMultiTenantWarehouses } from "@/utils/mockDataGenerators";
import type { Warehouse } from "@/types/tenant";

export default function RealTimeWarehouseDashboardPage() {
  const searchParams = useSearchParams();
  const { currentCustomer } = useCustomer();
  const { context } = useViewContext();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load warehouses
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        // Generate warehouses for demo/development
        const generated = generateMultiTenantWarehouses(
          5,
          user?.tenantId || "tenant-1",
        );
        setWarehouses(generated);
      } catch (error) {
        console.error("Error loading warehouses:", error);
      } finally {
        setLoading(false);
      }
    };
    loadWarehouses();
  }, [user?.tenantId]);

  // Get warehouse ID from multiple sources (priority order):
  // 1. URL parameter
  // 2. ViewContext warehouse filter (if single warehouse)
  // 3. User's assigned warehouses (if single)
  // 4. First available warehouse from list
  const warehouseIdFromUrl = searchParams.get("warehouseId");
  const warehouseIdFromContext =
    context.warehouseFilter.type === "SINGLE"
      ? context.warehouseFilter.warehouseIds?.[0]
      : undefined;
  const warehouseIdFromUser =
    user?.assignedWarehouses?.length === 1
      ? user.assignedWarehouses[0]
      : undefined;

  // Filter warehouses based on context
  const availableWarehouses = useMemo(() => {
    let filtered = warehouses;

    // Filter by user assignments if available
    if (user?.assignedWarehouses && user.assignedWarehouses.length > 0) {
      filtered = filtered.filter((w) =>
        user.assignedWarehouses?.includes(w.id),
      );
    }

    // Filter by view context
    if (
      context.warehouseFilter.type === "SINGLE" ||
      context.warehouseFilter.type === "MULTIPLE"
    ) {
      filtered = filtered.filter((w) =>
        context.warehouseFilter.warehouseIds?.includes(w.id),
      );
    } else if (
      context.warehouseFilter.type === "ASSIGNED" &&
      user?.assignedWarehouses
    ) {
      filtered = filtered.filter((w) =>
        user.assignedWarehouses?.includes(w.id),
      );
    }

    return filtered;
  }, [warehouses, context.warehouseFilter, user?.assignedWarehouses]);

  // Get warehouse ID with fallback
  const warehouseId =
    warehouseIdFromUrl ||
    warehouseIdFromContext ||
    warehouseIdFromUser ||
    availableWarehouses[0]?.id ||
    warehouses[0]?.id ||
    "WH-001"; // Final fallback for demo

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111827]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <RealTimeWarehouseDashboard
      warehouseId={warehouseId}
      customerId={currentCustomer?.id}
      tenantId={user?.tenantId}
      autoRefresh={true}
      refreshInterval={5000}
    />
  );
}
