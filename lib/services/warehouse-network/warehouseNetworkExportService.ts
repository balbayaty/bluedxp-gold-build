/**
 * Warehouse Network Export Service
 * Export warehouse network data to various formats
 */

import { exportService } from "@/lib/services/export/exportService";
import type {
  ExportFormat,
  ExportResult,
} from "@/lib/services/export/exportService";
import { warehouseNetworkService } from "./warehouseNetworkService";
import type {
  WarehouseNetwork,
  NetworkInventoryTransfer,
  NetworkRoute,
} from "./warehouseNetworkService";

/**
 * Export networks
 */
export async function exportNetworks(
  networks: WarehouseNetwork[],
  format: ExportFormat = "xlsx",
): Promise<ExportResult> {
  const data = networks.map((network) => ({
    "Network ID": network.id,
    Name: network.name,
    Provider: network.providerName,
    "Total Warehouses": network.warehouses.length,
    "Total Capacity": network.networkMetrics.totalCapacity,
    Utilization: `${network.networkMetrics.totalUtilization}%`,
    "On-Time Performance": `${network.networkMetrics.onTimePerformance}%`,
    Status: network.status,
    Regions: network.coverage.regions.join(", "),
    Countries: network.coverage.countries.join(", "),
    "Created At": network.createdAt,
  }));

  return exportService.export({
    format,
    filename: `warehouse-networks-${new Date().toISOString().split("T")[0]}`,
    title: "Warehouse Networks",
    description: `Exported ${networks.length} warehouse networks`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export transfers
 */
export async function exportTransfers(
  transfers: NetworkInventoryTransfer[],
  format: ExportFormat = "xlsx",
): Promise<ExportResult> {
  const data = transfers.map((transfer) => ({
    "Transfer Number": transfer.transferNumber,
    "Network ID": transfer.networkId,
    "Origin Warehouse": transfer.originWarehouseId,
    "Destination Warehouse": transfer.destinationWarehouseId,
    "Material ID": transfer.materialId,
    Quantity: transfer.quantity,
    Status: transfer.status,
    "Scheduled Date": transfer.scheduledDate,
    "Actual Date": transfer.actualDate || "N/A",
    Carrier: transfer.carrierId || "N/A",
    "Tracking Number": transfer.trackingNumber || "N/A",
    "Created At": transfer.createdAt,
  }));

  return exportService.export({
    format,
    filename: `network-transfers-${new Date().toISOString().split("T")[0]}`,
    title: "Network Transfers",
    description: `Exported ${transfers.length} network transfers`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export routes
 */
export async function exportRoutes(
  routes: NetworkRoute[],
  format: ExportFormat = "csv",
): Promise<ExportResult> {
  const data = routes.map((route) => ({
    "Route ID": route.id,
    "Network ID": route.networkId,
    Origin: route.originWarehouseId,
    Destination: route.destinationWarehouseId,
    Type: route.routeType,
    "Distance (km)": route.distance || "N/A",
    "Transit Time (hours)": route.estimatedTransitTime || "N/A",
    Frequency: route.frequency,
    "Cost (SAR)": route.cost || "N/A",
    Status: route.status,
  }));

  return exportService.export({
    format,
    filename: `network-routes-${new Date().toISOString().split("T")[0]}`,
    title: "Network Routes",
    description: `Exported ${routes.length} network routes`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Export network analytics report
 */
export async function exportNetworkAnalytics(
  networkId: string,
  format: ExportFormat = "pdf",
): Promise<ExportResult> {
  const network = await warehouseNetworkService.getNetwork(networkId);
  if (!network) {
    throw new Error("Network not found");
  }

  const analytics =
    await warehouseNetworkService.getNetworkAnalytics(networkId);
  const transfers =
    await warehouseNetworkService.getNetworkTransfers(networkId);
  const routes = await warehouseNetworkService.getNetworkRoutes(networkId);

  const data = {
    Network: network.name,
    Analytics: {
      "Total Warehouses": analytics.totalWarehouses,
      "Total Capacity": `${analytics.totalCapacity} m³`,
      "Total Utilization": `${analytics.totalUtilization}%`,
      "Active Transfers": analytics.activeTransfers,
      "Completed Transfers": analytics.completedTransfers,
      "Average Transit Time": `${analytics.averageTransitTime} hours`,
    },
    Transfers: transfers.slice(0, 100).map((t) => ({
      "Transfer Number": t.transferNumber,
      Status: t.status,
      Quantity: t.quantity,
      "Scheduled Date": t.scheduledDate,
    })),
    Routes: routes.map((r) => ({
      Route: `${r.originWarehouseId} → ${r.destinationWarehouseId}`,
      Type: r.routeType,
      Distance: r.distance || "N/A",
      Status: r.status,
    })),
  };

  return exportService.export({
    format,
    filename: `network-analytics-${networkId}-${new Date().toISOString().split("T")[0]}`,
    title: `Network Analytics Report - ${network.name}`,
    description: `Analytics report for ${network.name}`,
    data,
    includeHeaders: true,
    includeTimestamp: true,
  });
}

/**
 * Warehouse Network Export Service Export
 */
export const warehouseNetworkExportService = {
  exportNetworks,
  exportTransfers,
  exportRoutes,
  exportNetworkAnalytics,
};
