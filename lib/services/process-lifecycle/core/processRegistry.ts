/**
 * Process Registry
 * Central registry for all process definitions across the platform
 * Enables discovery and coordination of processes
 */

import type { ProcessDefinition } from "@/types/process-lifecycle";

// ============================================================================
// PROCESS REGISTRY
// ============================================================================

class ProcessRegistry {
  private processes: Map<string, ProcessDefinition> = new Map();

  /**
   * Register a process definition
   */
  registerProcess(definition: ProcessDefinition): void {
    this.processes.set(definition.entityType, definition);
  }

  /**
   * Get process definition by entity type
   */
  getProcessDefinition(entityType: string): ProcessDefinition | null {
    return this.processes.get(entityType) || null;
  }

  /**
   * Get all process definitions
   */
  getAllProcessDefinitions(): ProcessDefinition[] {
    return Array.from(this.processes.values());
  }

  /**
   * Get processes by module
   */
  getProcessesByModule(module: string): ProcessDefinition[] {
    return Array.from(this.processes.values()).filter(
      (p) => p.module === module,
    );
  }

  /**
   * Check if process is registered
   */
  isProcessRegistered(entityType: string): boolean {
    return this.processes.has(entityType);
  }

  /**
   * Get cross-module links for an entity type
   */
  getCrossModuleLinks(
    entityType: string,
  ): ProcessDefinition["crossModuleLinks"] {
    const process = this.getProcessDefinition(entityType);
    return process?.crossModuleLinks || [];
  }
}

// ============================================================================
// EXPORTED INSTANCE
// ============================================================================

export const processRegistry = new ProcessRegistry();

export default processRegistry;
