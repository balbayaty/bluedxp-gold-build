/**
 * ERPNext Integration
 * 
 * Main export file
 * 
 * @module erpnext
 */

export * from './api'
export * from './enhancedClient'
export * from './realtime-sync'
export * from './conflict-resolution'

export { erpNextAPI } from './api'
export { enhancedERPNextClient } from './enhancedClient'
export { erpNextRealtimeSync } from './realtime-sync'
export { conflictResolutionService } from './conflict-resolution'

