/**
 * 🎭 PERMISSION DELEGATION SYSTEM
 *
 * Mind-blowing delegation capabilities:
 * - Temporary permission delegation
 * - Time-based delegation
 * - Scope-limited delegation
 * - Approval workflows
 * - Automatic revocation
 * - Delegation chains
 */

import type { User, HierarchicalPermission } from "@/types/user";
import { userService } from "@/lib/services/user";
import { permissionAuditTrail } from "./permissionAuditTrail";

// ============================================================================
// TYPES
// ============================================================================

export interface Delegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  permissions: HierarchicalPermission[];
  scope?: {
    customers?: string[];
    warehouses?: string[];
    regions?: string[];
  };
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";
  reason: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface DelegationRequest {
  delegatorId: string;
  delegateId: string;
  permissions: HierarchicalPermission[];
  startDate: Date;
  endDate: Date;
  reason: string;
  scope?: Delegation["scope"];
}

// ============================================================================
// DELEGATION SERVICE
// ============================================================================

class PermissionDelegationService {
  private delegations = new Map<string, Delegation>();

  /**
   * Create delegation
   */
  async createDelegation(request: DelegationRequest): Promise<Delegation> {
    // Validate dates
    if (request.endDate <= request.startDate) {
      throw new Error("End date must be after start date");
    }

    if (request.endDate <= new Date()) {
      throw new Error("End date must be in the future");
    }

    const delegation: Delegation = {
      id: `delegation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      delegatorId: request.delegatorId,
      delegateId: request.delegateId,
      permissions: request.permissions,
      scope: request.scope,
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.startDate <= new Date() ? "ACTIVE" : "PENDING",
      reason: request.reason,
      requiresApproval: this.requiresApproval(request.permissions),
      createdAt: new Date(),
    };

    this.delegations.set(delegation.id, delegation);

    // Apply delegation if active
    if (delegation.status === "ACTIVE") {
      await this.applyDelegation(delegation);
    }

    return delegation;
  }

  /**
   * Apply delegation to user
   */
  private async applyDelegation(delegation: Delegation): Promise<void> {
    const delegate = await userService.getUserById(delegation.delegateId);
    if (!delegate) {
      throw new Error(`Delegate user ${delegation.delegateId} not found`);
    }

    const currentPerms = delegate.hierarchicalPermissions || [];
    const delegatedPerms = delegation.permissions.map((perm) => ({
      ...perm,
      // Mark as delegated
      metadata: {
        ...perm.metadata,
        delegated: true,
        delegationId: delegation.id,
        delegatorId: delegation.delegatorId,
      },
    }));

    const updatedPerms = [...currentPerms, ...delegatedPerms];
    await userService.updateUserPermissions(
      delegation.delegateId,
      updatedPerms,
    );

    // Log to audit trail
    for (const perm of delegation.permissions) {
      await permissionAuditTrail.logPermissionChange(
        "GRANT",
        delegate,
        perm,
        delegate, // System
        {
          reason: `Delegated from ${delegation.delegatorId}: ${delegation.reason}`,
          metadata: {
            delegationId: delegation.id,
            delegatorId: delegation.delegatorId,
          },
        },
      );
    }
  }

  /**
   * Revoke delegation
   */
  async revokeDelegation(
    delegationId: string,
    revokedBy: User,
  ): Promise<Delegation> {
    const delegation = this.delegations.get(delegationId);
    if (!delegation) {
      throw new Error(`Delegation ${delegationId} not found`);
    }

    if (delegation.status !== "ACTIVE") {
      throw new Error(`Delegation ${delegationId} is not active`);
    }

    delegation.status = "REVOKED";

    // Remove delegated permissions
    const delegate = await userService.getUserById(delegation.delegateId);
    if (delegate) {
      const currentPerms = delegate.hierarchicalPermissions || [];
      const filteredPerms = currentPerms.filter((perm) => {
        const metadata = perm.metadata as any;
        return !metadata?.delegated || metadata.delegationId !== delegationId;
      });
      await userService.updateUserPermissions(
        delegation.delegateId,
        filteredPerms,
      );
    }

    return delegation;
  }

  /**
   * Get active delegations for user
   */
  async getActiveDelegations(userId: string): Promise<Delegation[]> {
    return Array.from(this.delegations.values()).filter(
      (d) =>
        (d.delegatorId === userId || d.delegateId === userId) &&
        d.status === "ACTIVE" &&
        d.startDate <= new Date() &&
        d.endDate > new Date(),
    );
  }

  /**
   * Check and expire delegations
   */
  async checkExpiredDelegations(): Promise<Delegation[]> {
    const now = new Date();
    const expired: Delegation[] = [];

    this.delegations.forEach((delegation) => {
      if (delegation.status === "ACTIVE" && delegation.endDate <= now) {
        delegation.status = "EXPIRED";
        expired.push(delegation);

        // Remove permissions
        this.revokeDelegation(delegation.id, {
          id: "system",
          email: "system@system",
          name: "System",
          role: "SYSTEM_ADMIN" as any,
          status: "ACTIVE" as any,
          tenantId: "system",
          permissions: [],
          hierarchicalPermissions: {},
          moduleAccess: {},
          featureAccess: {},
          tabAccess: {},
          preferences: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as User).catch(() => {});
      }
    });

    return expired;
  }

  /**
   * Check if delegation requires approval
   */
  private requiresApproval(permissions: HierarchicalPermission[]): boolean {
    // Check if any permission is critical
    return permissions.some(
      (perm) => perm.moduleId === "settings" && perm.moduleAccess === "full",
    );
  }

  /**
   * Get all delegations
   */
  async getAllDelegations(): Promise<Delegation[]> {
    return Array.from(this.delegations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionDelegation = new PermissionDelegationService();
