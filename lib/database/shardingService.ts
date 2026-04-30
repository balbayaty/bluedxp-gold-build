/**
 * Database Sharding Service
 * 
 * Provides:
 * - Shard selection based on tenant/data
 * - Read replica selection
 * - Shard migration
 * - Replication lag monitoring
 */

import { prisma } from '@/lib/services/database/prismaClient'

export interface Shard {
  id: string
  name: string
  host: string
  port: number
  database: string
  type: 'primary' | 'replica'
  region?: string
  capacity: number // max tenants/data size
  currentLoad: number
  status: 'active' | 'maintenance' | 'failed'
}

export interface ShardAssignment {
  tenantId: string
  shardId: string
  assignedAt: Date
  migratedAt?: Date
}

export interface ReplicationLag {
  replicaId: string
  lagSeconds: number
  lagBytes: number
  lastChecked: Date
}

class DatabaseShardingService {
  private shards: Map<string, Shard> = new Map()
  private assignments: Map<string, ShardAssignment> = new Map()
  private readReplicas: Shard[] = []

  /**
   * Initialize shards
   */
  async initializeShards(shards: Shard[]): Promise<void> {
    for (const shard of shards) {
      this.shards.set(shard.id, shard)
      
      if (shard.type === 'replica') {
        this.readReplicas.push(shard)
      }
    }
  }

  /**
   * Select shard for tenant
   */
  async selectShard(tenantId: string): Promise<Shard> {
    // Check if tenant already assigned
    const existing = this.assignments.get(tenantId)
    if (existing) {
      const shard = this.shards.get(existing.shardId)
      if (shard && shard.status === 'active') {
        return shard
      }
    }

    // Select best shard (least loaded, active)
    const availableShards = Array.from(this.shards.values())
      .filter((s) => s.type === 'primary' && s.status === 'active')
      .sort((a, b) => a.currentLoad - b.currentLoad)

    if (availableShards.length === 0) {
      throw new Error('No available shards')
    }

    const selectedShard = availableShards[0]

    // Assign tenant to shard
    this.assignments.set(tenantId, {
      tenantId,
      shardId: selectedShard.id,
      assignedAt: new Date(),
    })

    // Update shard load
    selectedShard.currentLoad++

    return selectedShard
  }

  /**
   * Select read replica
   */
  async selectReadReplica(region?: string): Promise<Shard> {
    // Filter by region if specified
    let replicas = this.readReplicas.filter((r) => r.status === 'active')
    
    if (region) {
      replicas = replicas.filter((r) => r.region === region)
    }

    if (replicas.length === 0) {
      // Fallback to primary if no replicas
      const primaries = Array.from(this.shards.values())
        .filter((s) => s.type === 'primary' && s.status === 'active')
      
      if (primaries.length === 0) {
        throw new Error('No available database connections')
      }
      
      return primaries[0]
    }

    // Select replica with least lag
    const lagReports = await Promise.all(
      replicas.map(async (replica) => {
        const lag = await this.checkReplicationLag(replica.id)
        return { replica, lag: lag.lagSeconds }
      })
    )

    lagReports.sort((a, b) => a.lag - b.lag)
    return lagReports[0].replica
  }

  /**
   * Get database connection for tenant (with read replica support)
   */
  async getConnection(tenantId: string, readOnly: boolean = false): Promise<string> {
    if (readOnly) {
      const replica = await this.selectReadReplica()
      return this.buildConnectionString(replica)
    }

    const shard = await this.selectShard(tenantId)
    return this.buildConnectionString(shard)
  }

  /**
   * Migrate shard
   */
  async migrateShard(
    fromShardId: string,
    toShardId: string,
    tenantIds: string[]
  ): Promise<void> {
    const fromShard = this.shards.get(fromShardId)
    const toShard = this.shards.get(toShardId)

    if (!fromShard || !toShard) {
      throw new Error('Invalid shard IDs')
    }

    if (toShard.status !== 'active') {
      throw new Error('Target shard is not active')
    }

    // Mark target shard as maintenance
    toShard.status = 'maintenance'

    try {
      // Migrate data for each tenant
      for (const tenantId of tenantIds) {
        await this.migrateTenantData(tenantId, fromShard, toShard)
        
        // Update assignment
        this.assignments.set(tenantId, {
          tenantId,
          shardId: toShardId,
          assignedAt: new Date(),
          migratedAt: new Date(),
        })
      }

      // Update shard loads
      fromShard.currentLoad -= tenantIds.length
      toShard.currentLoad += tenantIds.length
      toShard.status = 'active'
    } catch (error) {
      toShard.status = 'active'
      throw error
    }
  }

  /**
   * Check replication lag
   */
  async checkReplicationLag(replicaId: string): Promise<ReplicationLag> {
    const replica = this.shards.get(replicaId)
    if (!replica || replica.type !== 'replica') {
      throw new Error(`Replica ${replicaId} not found`)
    }

    try {
      // In production, query PostgreSQL replication lag
      // SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
      
      // For now, return mock data
      const lagSeconds = Math.random() * 5 // 0-5 seconds
      const lagBytes = Math.random() * 1024 * 1024 // 0-1MB

      return {
        replicaId,
        lagSeconds,
        lagBytes,
        lastChecked: new Date(),
      }
    } catch (error: any) {
      throw new Error(`Failed to check replication lag: ${error.message}`)
    }
  }

  /**
   * Get shard statistics
   */
  async getShardStats(): Promise<Array<{
    shard: Shard
    tenantCount: number
    loadPercentage: number
  }>> {
    const stats: Array<{
      shard: Shard
      tenantCount: number
      loadPercentage: number
    }> = []

    for (const shard of this.shards.values()) {
      const tenantCount = Array.from(this.assignments.values())
        .filter((a) => a.shardId === shard.id).length

      const loadPercentage = (shard.currentLoad / shard.capacity) * 100

      stats.push({
        shard,
        tenantCount,
        loadPercentage,
      })
    }

    return stats
  }

  // Private helper methods

  private buildConnectionString(shard: Shard): string {
    return `postgresql://${shard.host}:${shard.port}/${shard.database}`
  }

  private async migrateTenantData(
    tenantId: string,
    fromShard: Shard,
    toShard: Shard
  ): Promise<void> {
    // In production, this would:
    // 1. Export data from source shard
    // 2. Import data to target shard
    // 3. Verify data integrity
    // 4. Update routing

    console.log(`Migrating tenant ${tenantId} from ${fromShard.id} to ${toShard.id}`)
    
    // This is a placeholder - actual migration would use pg_dump/pg_restore
    // or a specialized migration tool
  }
}

export const databaseShardingService = new DatabaseShardingService()

// Initialize default shards (from environment)
if (process.env.DATABASE_SHARDS) {
  const shards = JSON.parse(process.env.DATABASE_SHARDS) as Shard[]
  databaseShardingService.initializeShards(shards)
}


