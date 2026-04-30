/**
 * 🚀 USER MANAGEMENT SERVICES
 *
 * Comprehensive user management system exports
 * World's most flexible and capable user management
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

export { userService } from "./userService";
export { tenantService } from "./tenantService";
export { roleService } from "./roleService";
export { permissionService } from "./permissionService";
export { customerHierarchyService } from "./customerHierarchyService";
export { apiKeyService } from "./apiKeyService";
export { usageTrackingService } from "./usageTrackingService";
export { agentAccessService } from "./agentAccessService";
export { aiPermissionService } from "./aiPermissionService";
export { analyticsService } from "./analyticsService";
export { workflowService } from "./workflowService";
export { viewContextService } from "./viewContextService";

// Re-export types
export type {
  CreateUserInput,
  UpdateUserInput,
  UserQuery,
} from "./userService";

export type {
  CreateTenantInput,
  UpdateTenantInput,
  TenantQuotas,
  FeatureFlags,
} from "./tenantService";

export type {
  CreateRoleInput,
  UpdateRoleInput,
  RoleAssignmentOptions,
} from "./roleService";

export type {
  CreateAPIKeyInput,
  UpdateAPIKeyInput,
  RotationSchedule,
  UsageStats,
} from "./apiKeyService";

export type {
  UsageMetric,
  TimeRange,
  UsageStats as UsageStatsType,
  QuotaStatus,
  QuotaUsage,
  UserQuotas,
  CostAllocation,
} from "./usageTrackingService";

export type {
  AgentPermissions,
  AgentLimits,
  AgentUsageData,
} from "./agentAccessService";

export type {
  PermissionRecommendation,
  RiskAssessment,
  ComplianceCheck,
} from "./aiPermissionService";