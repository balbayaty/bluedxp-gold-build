/**
 * Warehouse Network Types
 *
 * Types for multi-warehouse network management
 *
 * @module warehouse-network
 */

// ============================================================================
// WAREHOUSE NETWORK TYPES
// ============================================================================

/**
 * Warehouse in network
 */
export interface NetworkWarehouse {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: {
    total: number;
    available: number;
    reserved: number;
  };
  capabilities: string[];
  tenantId: string;
}

/**
 * Network optimization result
 */
export interface NetworkOptimization {
  recommendedWarehouse: string;
  reasoning: string;
  costSavings: number;
  timeSavings: number; // hours
  recommendations: string[];
}

/**
 * Cross-docking operation
 */
export interface CrossDockingOperation {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  shipmentId: string;
  scheduledDate: Date;
  status: "PENDING" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
}

/**
 * Inventory balance
 */
export interface InventoryBalance {
  productId: string;
  byWarehouse: Record<string, { quantity: number; available: number }>;
  totalQuantity: number;
  recommendedTransfer?: {
    from: string;
    to: string;
    quantity: number;
    reason: string;
  };
}
