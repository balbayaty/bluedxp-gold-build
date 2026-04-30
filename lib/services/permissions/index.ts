/**
 * 🔐 PERMISSION SERVICES INDEX
 * 
 * Comprehensive permission management services
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

// Module Registry - Complete list of all modules, features, tabs, fields
export {
  COMPLETE_MODULE_REGISTRY,
  getAllModules,
  getModuleById,
  getPremiumModules,
  getModulesByCategory,
  getTotalTabCount,
  getAllSensitiveFields,
} from "./moduleRegistry";

export type {
  ModuleDefinition,
  FeatureDefinition,
  TabDefinition,
  FieldDefinition,
} from "./moduleRegistry";

// Permission Event Service - Event bus integration
export {
  permissionEventService,
  PERMISSION_EVENTS,
} from "./permissionEventService";

export type {
  PermissionGrantedEvent,
  PermissionRevokedEvent,
  PermissionsBulkUpdateEvent,
  RoleAssignedEvent,
  AccessDeniedEvent,
  SecurityAnomalyEvent,
} from "./permissionEventService";
