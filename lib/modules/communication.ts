/**
 * 📡 MODULE COMMUNICATION
 * Inter-module communication and event routing
 * 
 * Features:
 * - Module-to-module messaging
 * - Event routing between modules
 * - Module API discovery
 * - Communication protocols
 * 
 * Source: Adapted from chemcheck-analysis/lib/modules/ModuleCommunication.ts
 * Architecture: Deep layer integration with Event Bus and Module Registry
 */

import { moduleRegistry, type ModuleDefinition } from './registry'
import { eventBus } from '@/lib/services/event-bus'

// ============================================================================
// MODULE COMMUNICATION TYPES
// ============================================================================

export interface ModuleMessage {
  id: string
  fromModule: string
  toModule: string
  type: 'request' | 'response' | 'event' | 'notification'
  payload: Record<string, any>
  timestamp: Date
  correlationId?: string
}

export interface ModuleAPI {
  moduleId: string
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  parameters?: Record<string, any>
  response?: Record<string, any>
  requiresAuth: boolean
}

export interface CommunicationProtocol {
  name: string
  type: 'http' | 'websocket' | 'event_bus' | 'message_queue'
  config: Record<string, any>
}

// ============================================================================
// MODULE COMMUNICATION SERVICE
// ============================================================================

export class ModuleCommunication {
  private static instance: ModuleCommunication
  private messages: Map<string, ModuleMessage> = new Map()
  private moduleAPIs: Map<string, ModuleAPI[]> = new Map()
  private protocols: Map<string, CommunicationProtocol> = new Map()

  private constructor() {
    this.initializeCommunication()
  }

  public static getInstance(): ModuleCommunication {
    if (!ModuleCommunication.instance) {
      ModuleCommunication.instance = new ModuleCommunication()
    }
    return ModuleCommunication.instance
  }

  private async initializeCommunication(): Promise<void> {
    console.log('📡 Initializing Module Communication...')
    
    // Register default protocol (Event Bus)
    this.protocols.set('event_bus', {
      name: 'Event Bus',
      type: 'event_bus',
      config: {},
    })
    
    await eventBus.publish({
      type: 'module.communication.initialized',
      data: {
        timestamp: new Date(),
        service: 'ModuleCommunication',
      },
    })
  }

  /**
   * Send message between modules
   */
  async sendMessage(
    fromModule: string,
    toModule: string,
    type: ModuleMessage['type'],
    payload: Record<string, any>
  ): Promise<ModuleMessage> {
    const message: ModuleMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      fromModule,
      toModule,
      type,
      payload,
      timestamp: new Date(),
    }

    this.messages.set(message.id, message)

    // Route via Event Bus
    await eventBus.publish({
      type: `module.${toModule}.message`,
      data: {
        messageId: message.id,
        fromModule,
        type,
        payload,
        timestamp: new Date(),
      },
    })

    await eventBus.publish({
      type: 'module.message.sent',
      data: {
        messageId: message.id,
        fromModule,
        toModule,
        type,
        timestamp: new Date(),
      },
    })

    return message
  }

  /**
   * Register module API
   */
  registerModuleAPI(api: ModuleAPI): void {
    if (!this.moduleAPIs.has(api.moduleId)) {
      this.moduleAPIs.set(api.moduleId, [])
    }
    this.moduleAPIs.get(api.moduleId)!.push(api)
  }

  /**
   * Discover module APIs
   */
  async discoverModuleAPIs(moduleId: string): Promise<ModuleAPI[]> {
    const moduleDef = moduleRegistry.getModule(moduleId)
    if (!moduleDef) return []

    // Get APIs from module definition
    const apis = moduleDef.apis || []
    
    // Also check registered APIs
    const registeredAPIs = this.moduleAPIs.get(moduleId) || []

    return [...apis, ...registeredAPIs]
  }

  /**
   * Get all module APIs
   */
  getAllModuleAPIs(): ModuleAPI[] {
    const allAPIs: ModuleAPI[] = []
    
    for (const [moduleId, apis] of this.moduleAPIs.entries()) {
      allAPIs.push(...apis)
    }

    // Also get from module definitions
    const enabledModules = moduleRegistry.getEnabledModules()
    for (const moduleDef of enabledModules) {
      if (moduleDef.apis) {
        allAPIs.push(...moduleDef.apis.map(api => ({
          ...api,
          moduleId: moduleDef.id,
        })))
      }
    }

    return allAPIs
  }

  /**
   * Get messages for module
   */
  getMessagesForModule(moduleId: string, type?: ModuleMessage['type']): ModuleMessage[] {
    let messages = Array.from(this.messages.values()).filter(
      msg => msg.toModule === moduleId || msg.fromModule === moduleId
    )

    if (type) {
      messages = messages.filter(msg => msg.type === type)
    }

    return messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

// Singleton instance
export const moduleCommunication = ModuleCommunication.getInstance()





