/**
 * ERPNext Conflict Resolution
 * 
 * Advanced conflict resolution strategies
 * Automatic and manual resolution
 * 
 * @module erpnext
 */

import { erpNextRealtimeSync } from './realtime-sync'
import type { SyncConflict, ConflictResolutionStrategy } from './realtime-sync'

/**
 * Conflict resolution service
 */
export class ConflictResolutionService {
  /**
   * Auto-resolve conflicts based on rules
   */
  async autoResolveConflicts(
    conflicts: SyncConflict[],
    rules: Array<{
      field: string
      strategy: ConflictResolutionStrategy
    }>
  ): Promise<{
    resolved: number
    remaining: SyncConflict[]
  }> {
    let resolved = 0
    const remaining: SyncConflict[] = []

    for (const conflict of conflicts) {
      const rule = rules.find(r => r.field === conflict.field)
      if (rule) {
        try {
          await erpNextRealtimeSync.resolveConflict(conflict.id, rule.strategy)
          resolved++
        } catch (error) {
          console.warn(`Error auto-resolving conflict ${conflict.id}:`, error)
          remaining.push(conflict)
        }
      } else {
        remaining.push(conflict)
      }
    }

    return {
      resolved,
      remaining,
    }
  }

  /**
   * Get conflict resolution recommendations
   */
  getResolutionRecommendations(conflict: SyncConflict): Array<{
    strategy: ConflictResolutionStrategy
    reasoning: string
    confidence: number
  }> {
    const recommendations: Array<{
      strategy: ConflictResolutionStrategy
      reasoning: string
      confidence: number
    }> = []

    // Most recent wins
    if (conflict.blueDXPTimestamp > conflict.erpNextTimestamp) {
      recommendations.push({
        strategy: 'MOST_RECENT',
        reasoning: 'BlueDXP has more recent update',
        confidence: 0.8,
      })
    } else {
      recommendations.push({
        strategy: 'MOST_RECENT',
        reasoning: 'ERPNext has more recent update',
        confidence: 0.8,
      })
    }

    // BlueDXP wins for certain fields
    const blueDXPFields = ['quantumState', 'psychologyState', 'aiInsights']
    if (blueDXPFields.includes(conflict.field)) {
      recommendations.push({
        strategy: 'BLUEDXP_WINS',
        reasoning: 'BlueDXP-specific field',
        confidence: 0.9,
      })
    }

    // ERPNext wins for financial fields
    const erpNextFields = ['amount', 'currency', 'account']
    if (erpNextFields.includes(conflict.field)) {
      recommendations.push({
        strategy: 'ERPNEXT_WINS',
        reasoning: 'Financial field - ERPNext is source of truth',
        confidence: 0.9,
      })
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }
}

// Export singleton
export const conflictResolutionService = new ConflictResolutionService()

