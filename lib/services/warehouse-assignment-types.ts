export interface MSDSStorageRequirements {
  // Temperature Requirements
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  storageTemperature?: string;

  // Hazard Information
  hazardClass?: string;
  unNumber?: string;
  packingGroup?: string;

  // Physical Properties
  state?: "SOLID" | "LIQUID" | "GAS";
  isFlammable?: boolean;
  isOxidizer?: boolean;
  isCorrosive?: boolean;
  isToxic?: boolean;

  // Volume/Quantity
  estimatedMonthlyVolume?: number; // in m3
  palletCount?: number;
}

export interface WarehouseAssignmentRecommendation {
  warehouseId: string;
  warehouseName: string;
  score: number; // 0-100

  // Detailed scoring breakdown
  breakdown: {
    compliance: number; // Hazard/Safety compatibility
    space: number; // Capacity availability
    commercial: number; // Rates and contract status
    distance?: number; // Distance from port/customer (optional)
  };

  // Specific areas within warehouse that match
  matchingAreas: string[];

  // Explanation
  reasons: string[];
  warnings?: string[];

  // Geo
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface WarehouseAssignmentConfig {
  minScore?: number;
  maxResults?: number;
  prioritizeOwned?: boolean;
  weightFactors?: {
    compliance: number;
    space: number;
    commercial: number;
    distance: number;
  };
}

export interface FilteredWarehouseDiagnostic {
  warehouseId: string;
  warehouseName: string;
  reason: string;
  score?: number;
  details?: string[];
}
