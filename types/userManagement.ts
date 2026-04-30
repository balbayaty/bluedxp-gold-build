/**
 * 👥 USER MANAGEMENT TYPES
 * 
 * Comprehensive type definitions for user management system
 * Includes enhanced features like API keys, agents, billing, compliance
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { User, UserRole, HierarchicalPermission, UserDataVisibility } from "./user";

// ============================================================================
// ENHANCED USER
// ============================================================================

export interface EnhancedUser extends User {
  // Basic fields from User already included
  
  // Extended profile information
  phone?: string;
  jobTitle?: string;
  managerId?: string;
  avatar?: string;
  
  // Organization assignments
  assignedCustomers?: string[];
  assignedWarehouses?: string[];
  assignedRegions?: string[];
  
  // Hierarchical permissions
  hierarchicalPermissions?: HierarchicalPermission[];
  
  // Module access
  moduleAccess?: Record<string, "full" | "partial" | "read_only" | "none">;
  featureAccess?: Record<string, "full" | "partial" | "read_only" | "none">;
  tabAccess?: Record<string, "full" | "partial" | "read_only" | "none">;
  
  // Customer data visibility
  customerDataVisibility?: Record<string, UserDataVisibility>;
  
  // API Keys
  apiKeys?: APIKey[];
  
  // Agents
  assignedAgents?: AgentAssignment[];
  
  // Billing
  billingInfo?: UserBillingInfo;
  
  // Compliance
  complianceRecords?: ComplianceRecord[];
  
  // Activity tracking
  lastActivity?: Date | string;
  loginCount?: number;
  activityLog?: ActivityLogEntry[];
}

// ============================================================================
// API KEYS
// ============================================================================

export interface APIKey {
  id: string;
  userId: string;
  name: string;
  key: string; // Hashed in database, full key only shown on creation
  prefix: string; // First 8 characters for identification
  permissions: string[];
  scopes: APIKeyScope[];
  expiresAt?: Date | string;
  lastUsedAt?: Date | string;
  usageCount: number;
  rateLimit?: {
    requests: number;
    window: "minute" | "hour" | "day";
  };
  ipWhitelist?: string[];
  status: "active" | "revoked" | "expired";
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
}

export type APIKeyScope =
  | "read:all"
  | "write:all"
  | "read:inventory"
  | "write:inventory"
  | "read:orders"
  | "write:orders"
  | "read:shipments"
  | "write:shipments"
  | "read:customers"
  | "write:customers"
  | "read:warehouses"
  | "write:warehouses"
  | "read:reports"
  | "admin";

// ============================================================================
// AGENTS
// ============================================================================

export interface AgentAssignment {
  id: string;
  userId: string;
  agentId?: string;
  agentType: AgentType;
  agentName?: string;
  permissions?: string[];
  configuration: Record<string, any>;
  status?: "active" | "inactive" | "suspended";
  isEnabled?: boolean;
  tokenQuota?: number;
  tokensUsed?: number;
  executionCount?: number;
  successRate?: number;
  lastExecution?: Date | string;
  assignedAt?: Date | string;
  assignedBy?: string;
  lastExecutedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type AgentType =
  | "intelligent_orchestrator"
  | "process_mining"
  | "root_cause_analyzer"
  | "predictive_analytics"
  | "compliance_checker"
  | "data_miner"
  | "workflow_automator"
  | "communication_agent"
  | "copilot"
  | "data_analyst"
  | "compliance_officer"
  | "logistics_optimizer"
  | "customer_success"
  | "inventory_manager"
  | "document_processor"
  | "risk_assessor"
  | "custom";

// ============================================================================
// BILLING
// ============================================================================

export interface UserBillingInfo {
  userId: string;
  plan: BillingPlan;
  status: "active" | "suspended" | "cancelled" | "trial";
  billingCycle: "monthly" | "annual";
  
  // Usage tracking
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
  usage: {
    apiCalls: number;
    storage: number; // in GB
    users: number;
    transactions: number;
    agentExecutions: number;
  };
  limits: {
    apiCalls: number;
    storage: number;
    users: number;
    transactions: number;
    agentExecutions: number;
  };
  
  // Billing details
  amount: number;
  currency: string;
  nextBillingDate?: Date | string;
  paymentMethod?: {
    type: "card" | "bank" | "invoice";
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  
  // History
  invoices?: Invoice[];
  payments?: Payment[];
}

export type BillingPlan =
  | "free"
  | "starter"
  | "professional"
  | "enterprise"
  | "custom";

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate: Date | string;
  paidAt?: Date | string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  pdfUrl?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  userId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
  paidAt?: Date | string;
  refundedAt?: Date | string;
  failureReason?: string;
}

// ============================================================================
// COMPLIANCE
// ============================================================================

export interface ComplianceRecord {
  id: string;
  userId: string;
  type: ComplianceType;
  status: "compliant" | "non_compliant" | "pending" | "expired";
  
  // Certification/Training
  certificationName?: string;
  certificationNumber?: string;
  issuedBy?: string;
  issuedAt?: Date | string;
  expiresAt?: Date | string;
  
  // Documentation
  documentUrl?: string;
  documentHash?: string;
  
  // Verification
  verifiedBy?: string;
  verifiedAt?: Date | string;
  
  // Reminders
  reminderSentAt?: Date | string;
  nextReminderAt?: Date | string;
  
  // Audit trail
  createdAt: Date | string;
  updatedAt: Date | string;
  notes?: string;
}

export type ComplianceType =
  | "training"
  | "certification"
  | "background_check"
  | "safety_training"
  | "gdpr_acknowledgment"
  | "security_clearance"
  | "health_check"
  | "license"
  | "insurance"
  | "custom";

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

export interface ActivityLogEntry {
  id: string;
  userId: string;
  timestamp: Date | string;
  action: ActivityAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure" | "warning";
  errorMessage?: string;
}

export type ActivityAction =
  | "login"
  | "logout"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "execute"
  | "configure"
  | "api_call"
  | "agent_execution";

// ============================================================================
// CUSTOMER HIERARCHY
// ============================================================================

export interface CustomerHierarchy {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  children?: CustomerHierarchy[];
  metadata?: Record<string, any>;
}

export interface CustomerAssignment {
  userId: string;
  customerId: string;
  subCustomerId?: string;
  role?: string;
  dataVisibility?: UserDataVisibility;
  permissions?: any[];
  expiresAt?: Date | string;
  assignedAt: Date | string;
  assignedBy?: string;
}

// ============================================================================
// PERMISSIONS MANAGEMENT
// ============================================================================

export interface PermissionChangeRequest {
  userId: string;
  requestedBy: string;
  permissions: HierarchicalPermission[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface PermissionAuditLog {
  id: string;
  userId: string;
  changedBy: string;
  changeType: "grant" | "revoke" | "update";
  permissions: HierarchicalPermission[];
  reason?: string;
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

// ============================================================================
// USER GROUPS & TEAMS
// ============================================================================

export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  type: "team" | "department" | "project" | "custom";
  members: string[]; // User IDs
  permissions?: HierarchicalPermission[];
  metadata?: Record<string, any>;
  createdAt: Date | string;
  createdBy: string;
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency?: string;
  defaultView?: "table" | "grid" | "list";
  defaultLandingPage?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard?: {
    widgets: string[];
    layout: "grid" | "list";
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export type {
  User,
  UserRole,
  HierarchicalPermission,
  UserDataVisibility,
} from "./user";
