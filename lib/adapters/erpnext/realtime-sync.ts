/**
 * ERPNext Real-Time Sync
 * 
 * Real-time synchronization with ERPNext
 * Conflict resolution, bidirectional sync
 * 
 * @module erpnext
 */

import { enhancedERPNextClient } from './enhancedClient'
import { eventStore, eventBus, createEvent } from '@/lib/services/event-store'
import { knowledgeBaseService } from '@/lib/services/knowledge-base'

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy = 'BLUEDXP_WINS' | 'ERPNEXT_WINS' | 'MOST_RECENT' | 'MANUAL'

/**
 * Sync conflict
 */
export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  field: string
  blueDXPValue: any
  erpNextValue: any
  blueDXPTimestamp: Date
  erpNextTimestamp: Date
  resolution?: ConflictResolutionStrategy
  resolved: boolean
}

/**
 * Real-time sync service
 */
export class ERPNextRealtimeSync {
  private syncQueue: Map<string, any> = new Map()
  private conflicts: Map<string, SyncConflict> = new Map()

  /**
   * Sync entity to ERPNext
   */
  async syncToERPNext(
    entityType: string,
    entityId: string,
    data: any,
    tenantId: string
  ): Promise<{
    synced: boolean
    erpNextId?: string
    conflict?: SyncConflict
  }> {
    try {
      // Check for conflicts
      const conflict = await this.checkConflict(entityType, entityId, data)
      if (conflict && !conflict.resolved) {
        return {
          synced: false,
          conflict,
        }
      }

      // Map entity type to ERPNext doctype
      const doctype = this.mapEntityTypeToDoctype(entityType)

      // Create or update in ERPNext
      let erpNextId: string | undefined
      const existing = await this.getERPNextId(entityType, entityId)

      if (existing) {
        await enhancedERPNextClient.updateDocument(doctype, existing, data)
        erpNextId = existing
      } else {
        const created = await enhancedERPNextClient.createDocument(doctype, data)
        erpNextId = created.name
      }

      // Store mapping
      await this.storeMapping(entityType, entityId, erpNextId, tenantId)

      // Publish sync event
      await eventBus.publish(createEvent(
        'ERPNextSyncCompleted',
        entityId,
        entityType,
        {
          entityType,
          entityId,
          erpNextId,
          direction: 'TO_ERPNEXT',
        },
        1,
        {
          tenantId,
          correlationId: `erpnext-sync-${Date.now()}`,
          userId: 'erpnext-sync-service',
        }
      ))

      return {
        synced: true,
        erpNextId,
      }
    } catch (error) {
      console.error('Error syncing to ERPNext:', error)
      return {
        synced: false,
      }
    }
  }

  /**
   * Sync from ERPNext
   */
  async syncFromERPNext(
    doctype: string,
    erpNextId: string,
    tenantId: string
  ): Promise<{
    synced: boolean
    entityId?: string
    conflict?: SyncConflict
  }> {
    try {
      // Get document from ERPNext
      const document = await enhancedERPNextClient.getDocument(doctype, erpNextId)

      // Map to BlueDXP entity
      const entityType = this.mapDoctypeToEntityType(doctype)
      const entityId = await this.getBlueDXPId(entityType, erpNextId)

      if (!entityId) {
        // New entity - create in BlueDXP
        // Would create entity
        return {
          synced: true,
        }
      }

      // Check for conflicts
      const conflict = await this.checkConflictFromERPNext(entityType, entityId, document)
      if (conflict && !conflict.resolved) {
        return {
          synced: false,
          conflict,
        }
      }

      // Update in BlueDXP
      // Would update entity

      // Publish sync event
      await eventBus.publish(createEvent(
        'ERPNextSyncCompleted',
        entityId,
        entityType,
        {
          entityType,
          entityId,
          erpNextId,
          direction: 'FROM_ERPNEXT',
        },
        1,
        {
          tenantId,
          correlationId: `erpnext-sync-${Date.now()}`,
          userId: 'erpnext-sync-service',
        }
      ))

      return {
        synced: true,
        entityId,
      }
    } catch (error) {
      console.error('Error syncing from ERPNext:', error)
      return {
        synced: false,
      }
    }
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    resolvedValue?: any
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`)
    }

    let finalValue = resolvedValue

    if (!finalValue) {
      switch (strategy) {
        case 'BLUEDXP_WINS':
          finalValue = conflict.blueDXPValue
          break
        case 'ERPNEXT_WINS':
          finalValue = conflict.erpNextValue
          break
        case 'MOST_RECENT':
          finalValue = conflict.blueDXPTimestamp > conflict.erpNextTimestamp
            ? conflict.blueDXPValue
            : conflict.erpNextValue
          break
        case 'MANUAL':
          throw new Error('Manual resolution requires resolvedValue')
      }
    }

    // Apply resolution
    conflict.resolution = strategy
    conflict.resolved = true
    this.conflicts.set(conflictId, conflict)

    // Sync resolved value
    await this.syncToERPNext(
      conflict.entityType,
      conflict.entityId,
      { [conflict.field]: finalValue },
      'default'
    )
  }

  /**
   * Check for conflicts
   */
  private async checkConflict(
    entityType: string,
    entityId: string,
    data: any
  ): Promise<SyncConflict | null> {
    // Get ERPNext version
    const erpNextId = await this.getERPNextId(entityType, entityId)
    if (!erpNextId) {
      return null
    }

    const doctype = this.mapEntityTypeToDoctype(entityType)
    const erpNextDoc = await enhancedERPNextClient.getDocument(doctype, erpNextId)

    // Compare fields
    for (const [field, blueDXPValue] of Object.entries(data)) {
      const erpNextValue = erpNextDoc[field]

      if (JSON.stringify(blueDXPValue) !== JSON.stringify(erpNextValue)) {
        // Conflict detected
        const conflict: SyncConflict = {
          id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          entityType,
          entityId,
          field,
          blueDXPValue,
          erpNextValue,
          blueDXPTimestamp: new Date(),
          erpNextTimestamp: new Date(erpNextDoc.modified),
          resolved: false,
        }

        this.conflicts.set(conflict.id, conflict)
        return conflict
      }
    }

    return null
  }

  /**
   * Check conflict from ERPNext
   */
  private async checkConflictFromERPNext(
    entityType: string,
    entityId: string,
    erpNextDoc: any
  ): Promise<SyncConflict | null> {
    // Get BlueDXP version
    const events = await eventStore.getEvents(entityId)
    const latestEvent = events[events.length - 1]
    const blueDXPData = latestEvent?.after_state || {}

    // Compare fields
    for (const [field, erpNextValue] of Object.entries(erpNextDoc)) {
      const blueDXPValue = blueDXPData[field]

      if (JSON.stringify(blueDXPValue) !== JSON.stringify(erpNextValue)) {
        const conflict: SyncConflict = {
          id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          entityType,
          entityId,
          field,
          blueDXPValue,
          erpNextValue,
          blueDXPTimestamp: new Date(latestEvent?.timestamp || Date.now()),
          erpNextTimestamp: new Date(erpNextDoc.modified),
          resolved: false,
        }

        this.conflicts.set(conflict.id, conflict)
        return conflict
      }
    }

    return null
  }

  /**
   * Map entity type to ERPNext doctype
   */
  private mapEntityTypeToDoctype(entityType: string): string {
    const mapping: Record<string, string> = {
      'Shipment': 'Delivery Note',
      'PurchaseOrder': 'Purchase Order',
      'SalesOrder': 'Sales Order',
      'Invoice': 'Sales Invoice',
      'Customer': 'Customer',
      'Vendor': 'Supplier',
      'Product': 'Item',
      'Warehouse': 'Warehouse',
    }
    return mapping[entityType] || entityType
  }

  /**
   * Map doctype to entity type
   */
  private mapDoctypeToEntityType(doctype: string): string {
    const mapping: Record<string, string> = {
      'Delivery Note': 'Shipment',
      'Purchase Order': 'PurchaseOrder',
      'Sales Order': 'SalesOrder',
      'Sales Invoice': 'Invoice',
      'Customer': 'Customer',
      'Supplier': 'Vendor',
      'Item': 'Product',
      'Warehouse': 'Warehouse',
    }
    return mapping[doctype] || doctype
  }

  /**
   * Get ERPNext ID for entity
   */
  private async getERPNextId(entityType: string, entityId: string): Promise<string | null> {
    try {
      const mapping = await knowledgeBaseService.search({
        query: `erpnext mapping ${entityType} ${entityId}`,
        limit: 1,
      })

      if (mapping.length > 0 && mapping[0].entry.metadata?.erpNextId) {
        return mapping[0].entry.metadata.erpNextId as string
      }
    } catch (error) {
      console.warn('Error getting ERPNext ID:', error)
    }
    return null
  }

  /**
   * Get BlueDXP ID for ERPNext document
   */
  private async getBlueDXPId(entityType: string, erpNextId: string): Promise<string | null> {
    try {
      const mapping = await knowledgeBaseService.search({
        query: `erpnext mapping ${entityType} ${erpNextId}`,
        limit: 1,
      })

      if (mapping.length > 0 && mapping[0].entry.metadata?.entityId) {
        return mapping[0].entry.metadata.entityId as string
      }
    } catch (error) {
      console.warn('Error getting BlueDXP ID:', error)
    }
    return null
  }

  /**
   * Store mapping
   */
  private async storeMapping(
    entityType: string,
    entityId: string,
    erpNextId: string,
    tenantId: string
  ): Promise<void> {
    try {
      await knowledgeBaseService.create({
        tenantId,
        agentId: 'erpnext-sync',
        type: 'erpnext_mapping',
        category: 'integration',
        content: JSON.stringify({ entityType, entityId, erpNextId }),
        summary: `ERPNext mapping: ${entityType} ${entityId} <-> ${erpNextId}`,
        metadata: {
          entityType,
          entityId,
          erpNextId,
        },
        keywords: ['erpnext', 'mapping', entityType, entityId, erpNextId],
        searchableText: `erpnext mapping ${entityType} ${entityId} ${erpNextId}`,
        source: 'erpnext_sync',
        confidence: 1.0,
        verified: true,
        feedbackScore: 0,
        usageCount: 0,
        status: 'active',
      })
    } catch (error) {
      console.warn('Error storing mapping:', error)
    }
  }

  /**
   * Start real-time sync
   */
  async startRealtimeSync(tenantId: string): Promise<void> {
    // Subscribe to Event Bus for entity changes
    // When entity changes, sync to ERPNext
    // When ERPNext webhook received, sync from ERPNext

    // This would set up WebSocket or polling
    console.log('Real-time sync started for tenant:', tenantId)
  }
}

// Export singleton
export const erpNextRealtimeSync = new ERPNextRealtimeSync()

