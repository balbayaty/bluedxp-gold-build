/**
 * Transportation Modes - Complete Business Logic
 *
 * Export all mode-specific services:
 * - Air Freight (AWB, volumetric weight, DG validation)
 * - Sea Freight (FCL/LCL, B/L, VGM, demurrage/detention)
 * - Land Freight (FTL/LTL, route optimization)
 * - Rail Freight (railcar management)
 * - Multimodal Orchestration (mode switching, transshipment)
 *
 * All services integrate with platform modules - NO DUPLICATION
 */

export {
  airFreightService,
  type AWB,
  type VolumetricWeightCalculation,
  type DangerousGoodsValidation,
  type FlightSegment,
} from "./airFreightService";
export {
  seaFreightService,
  type BillOfLading,
  type ContainerInfo,
  type VGM,
  type ContainerBooking,
  type LCLConsolidation,
  type DemurrageDetention,
} from "./seaFreightService";
export {
  multimodalOrchestrator,
  type MultimodalRoute,
  type MultimodalSegment,
  type ModeTransition,
} from "./multimodalOrchestrator";

// Land and Rail services to be implemented
// export { landFreightService } from './landFreightService'
// export { railFreightService } from './railFreightService'
