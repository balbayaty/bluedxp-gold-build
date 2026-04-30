/**
 * Transportation Adapter Factory
 * 
 * Manages all transportation adapters and provides unified interface
 */

import { TransportationAdapter, AdapterConfig } from './base/TransportationAdapter'
import { StandaloneAdapter } from './standalone/StandaloneAdapter'
import { ZohoAdapter } from './erp/ZohoAdapter'
import { MaerskAdapter } from './carriers/MaerskAdapter'
import { FedExAdapter } from './carriers/FedExAdapter'
import { WaslTransportationAdapter } from '../wasl/transportationAdapter'

export type AdapterType = 'standalone' | 'zoho' | 'sap' | 'oracle' | 'erpnext' | 'uberfreight' | 'flexport' | 'maersk' | 'fedex' | 'wasl' | string

class TransportationAdapterManager {
  private adapters: Map<string, TransportationAdapter> = new Map()
  private activeAdapter: TransportationAdapter | null = null
  
  /**
   * Register an adapter
   */
  register(id: string, adapter: TransportationAdapter): void {
    this.adapters.set(id, adapter)
  }
  
  /**
   * Get adapter by ID
   */
  getAdapter(id: string): TransportationAdapter | undefined {
    return this.adapters.get(id)
  }
  
  /**
   * Set active adapter
   */
  async setActiveAdapter(id: string): Promise<void> {
    const adapter = this.adapters.get(id)
    if (!adapter) {
      throw new Error(`Adapter ${id} not found`)
    }
    
    const isConnected = await adapter.isConnected()
    if (!isConnected) {
      throw new Error(`Adapter ${id} is not connected`)
    }
    
    this.activeAdapter = adapter
  }
  
  /**
   * Get active adapter
   */
  getActiveAdapter(): TransportationAdapter {
    if (!this.activeAdapter) {
      // Default to standalone
      const standalone = this.adapters.get('standalone')
      if (standalone) {
        this.activeAdapter = standalone
        return standalone
      }
      throw new Error('No active adapter and standalone not available')
    }
    return this.activeAdapter
  }
  
  /**
   * Create adapter instance
   */
  createAdapter(type: AdapterType, config: AdapterConfig): TransportationAdapter {
    switch (type) {
      case 'standalone':
        return new StandaloneAdapter(config)
      case 'zoho':
        return new ZohoAdapter(config)
      case 'maersk':
        return new MaerskAdapter(config)
      case 'fedex':
        return new FedExAdapter(config)
      case 'wasl':
        return new WaslTransportationAdapter({
          appId: config.appId || '',
          appKey: config.appKey || '',
          apiBaseUrl: config.apiUrl,
          environment: config.environment as 'sandbox' | 'production' | undefined,
          timeout: config.timeout,
          retryAttempts: config.retryAttempts,
          enableLogging: config.enableLogging,
          ...config,
        })
      // Add more adapters as needed
      default:
        throw new Error(`Unknown adapter type: ${type}`)
    }
  }
  
  /**
   * Initialize adapters from config
   */
  async initializeAdapters(configs: Record<string, { type: AdapterType; config: AdapterConfig }>): Promise<void> {
    for (const [id, { type, config }] of Object.entries(configs)) {
      if (config.enabled) {
        const adapter = this.createAdapter(type, config)
        this.register(id, adapter)
        
        // Set first enabled adapter as active
        if (!this.activeAdapter) {
          try {
            await this.setActiveAdapter(id)
          } catch (error) {
            console.warn(`Failed to set ${id} as active adapter:`, error)
          }
        }
      }
    }
  }
  
  /**
   * Get all registered adapters
   */
  getAllAdapters(): TransportationAdapter[] {
    return Array.from(this.adapters.values())
  }
  
  /**
   * Get enabled adapters
   */
  async getEnabledAdapters(): Promise<TransportationAdapter[]> {
    const enabled: TransportationAdapter[] = []
    for (const adapter of this.adapters.values()) {
      if (await adapter.isConnected()) {
        enabled.push(adapter)
      }
    }
    return enabled
  }
}

// Singleton instance
export const adapterManager = new TransportationAdapterManager()

// Export convenience functions
export function getTransportationAdapter(id?: string): TransportationAdapter {
  if (id) {
    const adapter = adapterManager.getAdapter(id)
    if (adapter) return adapter
  }
  return adapterManager.getActiveAdapter()
}

export function registerTransportationAdapter(id: string, adapter: TransportationAdapter): void {
  adapterManager.register(id, adapter)
}

export async function setActiveTransportationAdapter(id: string): Promise<void> {
  await adapterManager.setActiveAdapter(id)
}

export { TransportationAdapter, AdapterConfig } from './base/TransportationAdapter'
export { StandaloneAdapter } from './standalone/StandaloneAdapter'
export { ZohoAdapter } from './erp/ZohoAdapter'
export { MaerskAdapter } from './carriers/MaerskAdapter'
export { FedExAdapter } from './carriers/FedExAdapter'
export { WaslTransportationAdapter } from '../wasl/transportationAdapter'


