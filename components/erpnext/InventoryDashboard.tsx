/**
 * ERPNext Inventory Dashboard Component
 *
 * Real-time inventory overview with ERPNext sync
 *
 * Migrated from: flex-vision-erpnext/src/components/InventoryDashboard.tsx
 * Integrated with: WMS Module, ERPNext Adapter
 */

"use client";

import { useState, useEffect } from "react";
import { Package, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";
import { eventBus } from "@/lib/services/event-store";

interface InventoryItem {
  id: string;
  material?: {
    materialName: string;
    unit?: string;
  };
  warehouse: string;
  actualQty: number;
}

export default function InventoryDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/erpnext/inventory");
      const data = await response.json();
      setInventory(data.inventory || []);
      if (data.lastSync) {
        setLastSync(new Date(data.lastSync));
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromERPNext = async () => {
    setLoading(true);
    try {
      const inventoryData = await enhancedERPNextClient.getInventory();

      await eventBus.publish("erpnext.inventory.synced", {
        recordCount: inventoryData?.data?.length || 0,
        timestamp: new Date(),
      });

      setLastSync(new Date());
      fetchInventory();
    } catch (error) {
      console.error("Failed to sync inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedInventory = inventory.reduce(
    (acc, item) => {
      const materialName = item.material?.materialName || "Unknown";
      if (!acc[materialName]) {
        acc[materialName] = {
          material: item.material,
          warehouses: [],
          totalQty: 0,
        };
      }
      acc[materialName].warehouses.push({
        warehouse: item.warehouse,
        qty: item.actualQty,
      });
      acc[materialName].totalQty += item.actualQty;
      return acc;
    },
    {} as Record<
      string,
      {
        material?: { materialName: string; unit?: string };
        warehouses: Array<{ warehouse: string; qty: number }>;
        totalQty: number;
      }
    >,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventory Overview</CardTitle>
              {lastSync && (
                <p className="text-sm text-gray-500 mt-1">
                  Last synced: {lastSync.toLocaleString()}
                </p>
              )}
            </div>
            <Button onClick={syncFromERPNext} disabled={loading}>
              <RefreshCw
                size={18}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sync from ERPNext
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(groupedInventory).map(([materialName, data]) => (
                <Card key={materialName}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <Package size={18} />
                          {materialName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Total: {data.totalQty}{" "}
                          {data.material?.unit || "units"}
                        </p>
                      </div>
                      <Badge
                        className={
                          data.totalQty > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {data.totalQty > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {data.warehouses.map((wh, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-gray-50 rounded p-2"
                        >
                          <span className="text-sm text-gray-600">
                            {wh.warehouse}
                          </span>
                          <span className="text-sm font-medium">
                            {wh.qty} {data.material?.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
