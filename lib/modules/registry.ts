/**
 * Module Registry - Plugin Architecture
 * 
 * Enables standalone and integrated module modes
 * Zero tech debt - flexible and adaptive
 */

export interface ModuleWidget {
  id: string
  name: string
  description: string
  component: string // Component path
  size: 'small' | 'medium' | 'large' | 'full'
  position?: { x: number; y: number }
  config?: Record<string, any>
  permissions?: string[]
}

export interface ModuleAPI {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  requiresAuth: boolean
  roles?: string[]
  rateLimit?: {
    requests: number
    window: number // seconds
  }
}

export interface ModuleSettings {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  default?: any
}

export interface ModuleDefinition {
  id: string
  name: string
  description: string
  version?: string
  category?: string
  standalone?: boolean // Can work independently
  dependencies?: string[] // Module IDs this depends on
  routes?: ModuleRoute[]
  components?: string[] // Component paths
  services?: unknown // Service paths or richer service descriptors (legacy modules)
  widgets?: ModuleWidget[] // Widget system
  apis?: ModuleAPI[] // API management
  settings?: ModuleSettings[] // Settings management
  featureFlags?: Record<string, boolean> // Feature flags
  enabled?: boolean
  config?: Record<string, any>
  // Allow legacy/extended module descriptors without breaking the registry.
  // This keeps the platform integration-first and prevents brittle typings.
  [key: string]: unknown
}

export interface ModuleRoute {
  path: string
  component: string
  title?: string
  name?: string
  icon?: string
  requiresAuth?: boolean
  roles?: string[]
  permissions?: string[]
  [key: string]: unknown
}

class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map()
  private enabledModules: Set<string> = new Set()

  /**
   * Register a module
   */
  register(moduleDef: ModuleDefinition): void {
    const normalized: ModuleDefinition = {
      ...moduleDef,
      version: moduleDef.version || '1.0.0',
      category: moduleDef.category || 'other',
      standalone: moduleDef.standalone ?? true,
      dependencies: moduleDef.dependencies || [],
      routes: (moduleDef.routes || []).map((r: ModuleRoute) => ({
        ...r,
        // Ensure routes are usable even if a legacy module uses `name` instead of `title`
        title: r.title || r.name || 'Untitled',
        requiresAuth: r.requiresAuth ?? true,
      })),
      components: (moduleDef.components as string[] | undefined) || [],
      enabled: moduleDef.enabled ?? true,
    }

    this.modules.set(normalized.id, normalized)
    if (normalized.enabled) {
      this.enabledModules.add(normalized.id)
    }
  }

  /**
   * Get module by ID
   */
  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.get(id)
  }

  /**
   * Check if module is enabled
   */
  isModuleEnabled(id: string): boolean {
    return this.enabledModules.has(id)
  }

  /**
   * Enable a module
   */
  enableModule(id: string): void {
    const moduleDef = this.modules.get(id)
    if (moduleDef) {
      // Check dependencies
      const missingDeps = moduleDef.dependencies.filter(dep => !this.isModuleEnabled(dep))
      if (missingDeps.length > 0) {
        throw new Error(`Cannot enable ${id}: missing dependencies: ${missingDeps.join(', ')}`)
      }
      this.enabledModules.add(id)
    }
  }

  /**
   * Disable a module
   */
  disableModule(id: string): void {
    // Check if other modules depend on this one
    const dependents = Array.from(this.modules.values())
      .filter(m => m.dependencies.includes(id) && this.isModuleEnabled(m.id))
      .map(m => m.id)
    
    if (dependents.length > 0) {
      throw new Error(`Cannot disable ${id}: modules depend on it: ${dependents.join(', ')}`)
    }
    
    this.enabledModules.delete(id)
  }

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values())
  }

  /**
   * Get all enabled modules
   */
  getEnabledModules(): ModuleDefinition[] {
    return Array.from(this.enabledModules)
      .map(id => this.modules.get(id)!)
      .filter(Boolean)
  }

  /**
   * Get all modules by category
   */
  getModulesByCategory(category: ModuleDefinition['category']): ModuleDefinition[] {
    return Array.from(this.modules.values())
      .filter(m => m.category === category)
  }

  /**
   * Get all routes from enabled modules
   */
  getAllRoutes(): ModuleRoute[] {
    return this.getEnabledModules()
      .flatMap(m => m.routes)
  }

  /**
   * Get module dependencies (recursive)
   */
  getModuleDependencies(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return []
    visited.add(id)
    
    const moduleDef = this.modules.get(id)
    if (!moduleDef) return []
    
    const deps: string[] = []
    for (const depId of moduleDef.dependencies) {
      deps.push(depId)
      deps.push(...this.getModuleDependencies(depId, visited))
    }
    
    return Array.from(new Set(deps))
  }

  /**
   * Get all widgets from enabled modules
   */
  getAllWidgets(): ModuleWidget[] {
    return this.getEnabledModules()
      .flatMap(m => m.widgets || [])
  }

  /**
   * Get widgets by module
   */
  getModuleWidgets(moduleId: string): ModuleWidget[] {
    const moduleDef = this.modules.get(moduleId)
    return moduleDef?.widgets || []
  }

  /**
   * Get all APIs from enabled modules
   */
  getAllAPIs(): ModuleAPI[] {
    return this.getEnabledModules()
      .flatMap(m => m.apis || [])
  }

  /**
   * Get APIs by module
   */
  getModuleAPIs(moduleId: string): ModuleAPI[] {
    const moduleDef = this.modules.get(moduleId)
    return moduleDef?.apis || []
  }

  /**
   * Get module settings
   */
  getModuleSettings(moduleId: string): ModuleSettings[] {
    const moduleDef = this.modules.get(moduleId)
    return moduleDef?.settings || []
  }

  /**
   * Update module setting
   */
  updateModuleSetting(moduleId: string, key: string, value: any): void {
    const moduleDef = this.modules.get(moduleId)
    if (!moduleDef) return

    if (!moduleDef.config) {
      moduleDef.config = {}
    }
    moduleDef.config[key] = value

    // Update setting if it exists
    if (moduleDef.settings) {
      const setting = moduleDef.settings.find(s => s.key === key)
      if (setting) {
        setting.value = value
      }
    }
  }

  /**
   * Get module feature flags
   */
  getModuleFeatureFlags(moduleId: string): Record<string, boolean> {
    const moduleDef = this.modules.get(moduleId)
    return moduleDef?.featureFlags || {}
  }

  /**
   * Check if module feature is enabled
   */
  isFeatureEnabled(moduleId: string, feature: string): boolean {
    const moduleDef = this.modules.get(moduleId)
    if (!moduleDef || !moduleDef.enabled) return false
    if (!moduleDef.featureFlags) return true // Default to enabled if no flags
    return moduleDef.featureFlags[feature] !== false
  }

  /**
   * Toggle module feature flag
   */
  toggleFeatureFlag(moduleId: string, feature: string, enabled: boolean): void {
    const moduleDef = this.modules.get(moduleId)
    if (!moduleDef) return

    if (!moduleDef.featureFlags) {
      moduleDef.featureFlags = {}
    }
    moduleDef.featureFlags[feature] = enabled
  }
}

// Singleton instance
export const moduleRegistry = new ModuleRegistry()

// Export convenience functions
export function registerModule(moduleDef: ModuleDefinition): void {
  moduleRegistry.register(moduleDef)
}

export function isModuleEnabled(id: string): boolean {
  return moduleRegistry.isModuleEnabled(id)
}

export function enableModule(id: string): void {
  moduleRegistry.enableModule(id)
}

export function disableModule(id: string): void {
  moduleRegistry.disableModule(id)
}

export function getEnabledModules(): ModuleDefinition[] {
  return moduleRegistry.getEnabledModules()
}

export function getAllModules(): ModuleDefinition[] {
  return moduleRegistry.getAllModules()
}

export function getAllRoutes(): ModuleRoute[] {
  return moduleRegistry.getAllRoutes()
}

export function getModule(id: string): ModuleDefinition | undefined {
  return moduleRegistry.getModule(id)
}

