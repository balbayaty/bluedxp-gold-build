/**
 * 🔒 MODULE ISOLATION
 * Module isolation and sandboxing for security and stability
 * 
 * Features:
 * - Module sandboxing
 * - Resource isolation
 * - Permission management
 * - Isolation policies
 * 
 * Source: Adapted from chemcheck-analysis/lib/module-isolation.ts
 * Architecture: Deep layer integration with Module Registry and security
 */

import { moduleRegistry, type ModuleDefinition } from './registry'
import { eventBus } from '@/lib/services/event-bus'

// ============================================================================
// MODULE ISOLATION TYPES
// ============================================================================

export interface IsolationPolicy {
  moduleId: string
  sandboxed: boolean
  resourceLimits: {
    memory: number // MB
    cpu: number // percentage
    storage: number // MB
    network: number // requests per minute
  }
  permissions: {
    fileSystem: 'read' | 'write' | 'none'
    network: 'internal' | 'external' | 'none'
    database: 'read' | 'write' | 'none'
    api: string[] // Allowed API endpoints
  }
  allowedModules: string[] // Modules this module can communicate with
}

export interface IsolationStatus {
  moduleId: string
  isolated: boolean
  resourceUsage: {
    memory: number
    cpu: number
    storage: number
    network: number
  }
  violations: Array<{
    type: 'memory' | 'cpu' | 'storage' | 'network' | 'permission'
    description: string
    timestamp: Date
  }>
}

// ============================================================================
// MODULE ISOLATION SERVICE
// ============================================================================

export class ModuleIsolation {
  private static instance: ModuleIsolation
  private policies: Map<string, IsolationPolicy> = new Map()
  private statuses: Map<string, IsolationStatus> = new Map()

  private constructor() {
    this.initializeIsolation()
  }

  public static getInstance(): ModuleIsolation {
    if (!ModuleIsolation.instance) {
      ModuleIsolation.instance = new ModuleIsolation()
    }
    return ModuleIsolation.instance
  }

  private async initializeIsolation(): Promise<void> {
    console.log('🔒 Initializing Module Isolation...')
    
    await eventBus.publish({
      type: 'module.isolation.initialized',
      data: {
        timestamp: new Date(),
        service: 'ModuleIsolation',
      },
    })
  }

  /**
   * Create isolation policy for module
   */
  async createIsolationPolicy(
    moduleId: string,
    policy: Omit<IsolationPolicy, 'moduleId'>
  ): Promise<IsolationPolicy> {
    const fullPolicy: IsolationPolicy = {
      moduleId,
      ...policy,
    }

    this.policies.set(moduleId, fullPolicy)

    // Initialize status
    this.statuses.set(moduleId, {
      moduleId,
      isolated: policy.sandboxed,
      resourceUsage: {
        memory: 0,
        cpu: 0,
        storage: 0,
        network: 0,
      },
      violations: [],
    })

    await eventBus.publish({
      type: 'module.isolation.policy.created',
      data: {
        moduleId,
        sandboxed: policy.sandboxed,
        timestamp: new Date(),
      },
    })

    return fullPolicy
  }

  /**
   * Check if module can access resource
   */
  async canAccessResource(
    moduleId: string,
    resourceType: 'fileSystem' | 'network' | 'database' | 'api',
    resource: string
  ): Promise<boolean> {
    const policy = this.policies.get(moduleId)
    if (!policy) return true // No policy = allow

    if (!policy.sandboxed) return true // Not sandboxed = allow

    const permission = policy.permissions[resourceType]
    
    if (resourceType === 'fileSystem') {
      return permission !== 'none'
    }
    
    if (resourceType === 'network') {
      return permission !== 'none'
    }
    
    if (resourceType === 'database') {
      return permission !== 'none'
    }
    
    if (resourceType === 'api') {
      return policy.permissions.api.includes(resource) || policy.permissions.api.includes('*')
    }

    return false
  }

  /**
   * Check if module can communicate with another module
   */
  async canCommunicateWith(
    fromModule: string,
    toModule: string
  ): Promise<boolean> {
    const policy = this.policies.get(fromModule)
    if (!policy) return true

    if (!policy.sandboxed) return true

    return policy.allowedModules.includes(toModule) || policy.allowedModules.includes('*')
  }

  /**
   * Record resource usage
   */
  async recordResourceUsage(
    moduleId: string,
    resourceType: 'memory' | 'cpu' | 'storage' | 'network',
    amount: number
  ): Promise<void> {
    const status = this.statuses.get(moduleId)
    if (!status) return

    status.resourceUsage[resourceType] = amount

    // Check against limits
    const policy = this.policies.get(moduleId)
    if (policy && policy.sandboxed) {
      const limit = policy.resourceLimits[resourceType]
      if (amount > limit) {
        status.violations.push({
          type: resourceType,
          description: `Resource usage (${amount}) exceeds limit (${limit})`,
          timestamp: new Date(),
        })

        await eventBus.publish({
          type: 'module.isolation.violation',
          data: {
            moduleId,
            violationType: resourceType,
            usage: amount,
            limit,
            timestamp: new Date(),
          },
        })
      }
    }
  }

  /**
   * Get isolation policy
   */
  getIsolationPolicy(moduleId: string): IsolationPolicy | null {
    return this.policies.get(moduleId) || null
  }

  /**
   * Get isolation status
   */
  getIsolationStatus(moduleId: string): IsolationStatus | null {
    return this.statuses.get(moduleId) || null
  }
}

// Singleton instance
export const moduleIsolation = ModuleIsolation.getInstance()





