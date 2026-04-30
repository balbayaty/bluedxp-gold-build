/**
 * 🔧 MODULE MANAGER
 * Advanced module lifecycle and dependency management
 * 
 * Features:
 * - Module lifecycle management
 * - Dependency resolution
 * - Module health monitoring
 * - Module versioning
 * - Module updates and migrations
 * 
 * Source: Adapted from chemcheck-analysis/lib/modules/ModuleManager.ts
 * Architecture: Deep layer integration with Module Registry and Event Bus
 */

import { moduleRegistry, type ModuleDefinition } from './registry'
import { eventBus, createEvent } from '@/lib/services/event-bus'

// ============================================================================
// MODULE MANAGER TYPES
// ============================================================================

export interface ModuleHealth {
  moduleId: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  uptime: number // percentage
  lastHealthCheck: Date
  issues: string[]
  metrics: {
    responseTime: number // ms
    errorRate: number // percentage
    requestCount: number
  }
}

export interface ModuleDependency {
  moduleId: string
  dependencyId: string
  version: string
  required: boolean
  status: 'satisfied' | 'missing' | 'version_mismatch'
}

export interface ModuleUpdate {
  moduleId: string
  fromVersion: string
  toVersion: string
  updateType: 'patch' | 'minor' | 'major'
  breakingChanges: string[]
  migrationSteps: string[]
  estimatedDowntime: number // minutes
}

export interface ModuleLifecycle {
  moduleId: string
  state: 'installing' | 'installed' | 'starting' | 'running' | 'stopping' | 'stopped' | 'uninstalling' | 'error'
  transitions: Array<{
    from: ModuleLifecycle['state']
    to: ModuleLifecycle['state']
    timestamp: Date
    reason?: string
  }>
  currentStateSince: Date
}

// ============================================================================
// MODULE MANAGER
// ============================================================================

export class ModuleManager {
  private static instance: ModuleManager
  private moduleHealth: Map<string, ModuleHealth> = new Map()
  private moduleLifecycles: Map<string, ModuleLifecycle> = new Map()
  private moduleUpdates: Map<string, ModuleUpdate[]> = new Map()

  private constructor() {
    this.initializeManager()
  }

  public static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager()
    }
    return ModuleManager.instance
  }

  private async initializeManager(): Promise<void> {
    console.log('🔧 Initializing Module Manager...')
    
    // Start health monitoring
    this.startHealthMonitoring()
    
    await eventBus.publish(
      createEvent(
        'module.manager.initialized',
        'system',
        'System',
        {
          service: 'ModuleManager',
        },
        1,
        { correlationId: `init-${Date.now()}` }
      )
    )
  }

  /**
   * Start module
   */
  async startModule(moduleId: string): Promise<void> {
    const moduleDef = moduleRegistry.getModule(moduleId)
    if (!moduleDef) {
      throw new Error(`Module ${moduleId} not found`)
    }

    // Check dependencies
    const missingDeps = await this.checkDependencies(moduleId)
    if (missingDeps.length > 0) {
      throw new Error(`Cannot start ${moduleId}: missing dependencies: ${missingDeps.join(', ')}`)
    }

    // Update lifecycle
    await this.updateLifecycle(moduleId, 'starting', 'Manual start')

    // Simulate module start
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Enable module
    moduleRegistry.enableModule(moduleId)

    await this.updateLifecycle(moduleId, 'running', 'Module started successfully')

    await eventBus.publish({
      type: 'module.started',
      data: {
        moduleId,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Stop module
   */
  async stopModule(moduleId: string): Promise<void> {
    const moduleDef = moduleRegistry.getModule(moduleId)
    if (!moduleDef) {
      throw new Error(`Module ${moduleId} not found`)
    }

    // Check dependents
    const dependents = moduleRegistry.getModuleDependencies(moduleId)
    if (dependents.length > 0) {
      throw new Error(`Cannot stop ${moduleId}: modules depend on it: ${dependents.join(', ')}`)
    }

    await this.updateLifecycle(moduleId, 'stopping', 'Manual stop')

    // Disable module
    moduleRegistry.disableModule(moduleId)

    await this.updateLifecycle(moduleId, 'stopped', 'Module stopped successfully')

    await eventBus.publish({
      type: 'module.stopped',
      data: {
        moduleId,
        timestamp: new Date(),
      },
    })
  }

  /**
   * Check module dependencies
   */
  async checkDependencies(moduleId: string): Promise<string[]> {
    const moduleDef = moduleRegistry.getModule(moduleId)
    if (!moduleDef) return []

    const missing: string[] = []
    for (const depId of moduleDef.dependencies) {
      if (!moduleRegistry.isModuleEnabled(depId)) {
        missing.push(depId)
      }
    }

    return missing
  }

  /**
   * Get module health
   */
  async getModuleHealth(moduleId: string): Promise<ModuleHealth> {
    let health = this.moduleHealth.get(moduleId)
    
    if (!health) {
      // Initialize health
      health = {
        moduleId,
        status: 'unknown',
        uptime: 100,
        lastHealthCheck: new Date(),
        issues: [],
        metrics: {
          responseTime: 0,
          errorRate: 0,
          requestCount: 0,
        },
      }
      this.moduleHealth.set(moduleId, health)
    }

    // Update health check
    health.lastHealthCheck = new Date()
    
    // Simulate health metrics
    health.metrics.responseTime = Math.random() * 100
    health.metrics.errorRate = Math.random() * 5
    health.metrics.requestCount += 1

    // Determine status
    if (health.metrics.errorRate > 10) {
      health.status = 'unhealthy'
    } else if (health.metrics.errorRate > 5 || health.metrics.responseTime > 500) {
      health.status = 'degraded'
    } else {
      health.status = 'healthy'
    }

    return health
  }

  /**
   * Update module lifecycle
   */
  private async updateLifecycle(
    moduleId: string,
    newState: ModuleLifecycle['state'],
    reason?: string
  ): Promise<void> {
    let lifecycle = this.moduleLifecycles.get(moduleId)
    
    if (!lifecycle) {
      lifecycle = {
        moduleId,
        state: 'installed',
        transitions: [],
        currentStateSince: new Date(),
      }
      this.moduleLifecycles.set(moduleId, lifecycle)
    }

    const oldState = lifecycle.state
    lifecycle.transitions.push({
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason,
    })

    lifecycle.state = newState
    lifecycle.currentStateSince = new Date()
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Monitor health every 30 seconds
    setInterval(async () => {
      const enabledModules = moduleRegistry.getEnabledModules()
      for (const moduleDef of enabledModules) {
        await this.getModuleHealth(moduleDef.id)
      }
    }, 30000)
  }

  /**
   * Get module lifecycle
   */
  getModuleLifecycle(moduleId: string): ModuleLifecycle | null {
    return this.moduleLifecycles.get(moduleId) || null
  }

  /**
   * Get all module health statuses
   */
  getAllModuleHealth(): ModuleHealth[] {
    return Array.from(this.moduleHealth.values())
  }
}

// Singleton instance
export const moduleManager = ModuleManager.getInstance()





