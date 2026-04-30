/**
 * 🔑 PERMISSION COMPONENTS INDEX
 * 
 * Permission management components
 * 
 * BlueDXP Platform
 */

// Permission Managers
export { default as PermissionManager } from "./PermissionManager";
export { default as DeepPermissionTree } from "./DeepPermissionTree";

// Advanced Restrictions (Time, Location, Device)
export { default as AdvancedRestrictions } from "./AdvancedRestrictions";
export type { 
  TimeRestriction, 
  LocationRestriction, 
  DeviceRestriction, 
  ConditionalRestriction,
  AdvancedRestrictionsValue 
} from "./AdvancedRestrictions";

// AI Recommendations
export { default as AIPermissionRecommendations } from "./AIPermissionRecommendations";

// Search & Filter
export { default as PermissionSearch } from "./PermissionSearch";
