/**
 * Service Health Utility
 * Centralized health checking for all services
 */

import { redisService } from '@/lib/services/cache/redisService'
import { kafkaClient } from '@/lib/services/kafka'
import { minioClient } from '@/lib/services/storage'
import { opensearchClient } from '@/lib/services/search'
import { prisma } from '@/lib/services/database/prismaClient'

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled'
  enabled: boolean
  connected: boolean
  details?: Record<string, any>
  error?: string
}

export class ServiceHealthChecker {
  /**
   * Check all services health
   */
  async checkAll(): Promise<ServiceHealth[]> {
    const checks = await Promise.allSettled([
      this.checkRedis(),
      this.checkKafka(),
      this.checkMinIO(),
      this.checkOpenSearch(),
      this.checkDatabase(),
    ])

    return checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          name: ['Redis', 'Kafka', 'MinIO', 'OpenSearch', 'Database'][index],
          status: 'unhealthy' as const,
          enabled: false,
          connected: false,
          error: result.reason?.message || 'Unknown error',
        }
      }
    })
  }

  /**
   * Check Redis health
   */
  async checkRedis(): Promise<ServiceHealth> {
    try {
      const enabled = redisService.isEnabled()
      if (!enabled) {
        return {
          name: 'Redis',
          status: 'disabled',
          enabled: false,
          connected: false,
        }
      }

      const stats = await redisService.getStats()
      return {
        name: 'Redis',
        status: 'healthy',
        enabled: true,
        connected: true,
        details: stats,
      }
    } catch (error: any) {
      return {
        name: 'Redis',
        status: 'unhealthy',
        enabled: true,
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Check Kafka health
   */
  async checkKafka(): Promise<ServiceHealth> {
    try {
      const enabled = kafkaClient.isEnabled()
      if (!enabled) {
        return {
          name: 'Kafka',
          status: 'disabled',
          enabled: false,
          connected: false,
        }
      }

      const connected = await kafkaClient.testConnection()
      return {
        name: 'Kafka',
        status: connected ? 'healthy' : 'degraded',
        enabled: true,
        connected,
      }
    } catch (error: any) {
      return {
        name: 'Kafka',
        status: 'unhealthy',
        enabled: true,
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Check MinIO health
   */
  async checkMinIO(): Promise<ServiceHealth> {
    try {
      const enabled = minioClient.isEnabled()
      return {
        name: 'MinIO',
        status: enabled ? 'healthy' : 'disabled',
        enabled,
        connected: enabled,
      }
    } catch (error: any) {
      return {
        name: 'MinIO',
        status: 'unhealthy',
        enabled: true,
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Check OpenSearch health
   */
  async checkOpenSearch(): Promise<ServiceHealth> {
    try {
      const enabled = opensearchClient.isEnabled()
      return {
        name: 'OpenSearch',
        status: enabled ? 'healthy' : 'disabled',
        enabled,
        connected: enabled,
      }
    } catch (error: any) {
      return {
        name: 'OpenSearch',
        status: 'unhealthy',
        enabled: true,
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Check Database health
   */
  async checkDatabase(): Promise<ServiceHealth> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return {
        name: 'Database',
        status: 'healthy',
        enabled: true,
        connected: true,
      }
    } catch (error: any) {
      return {
        name: 'Database',
        status: 'unhealthy',
        enabled: true,
        connected: false,
        error: error.message,
      }
    }
  }

  /**
   * Get overall health status
   */
  async getOverallHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    services: ServiceHealth[]
    summary: {
      total: number
      healthy: number
      degraded: number
      unhealthy: number
      disabled: number
    }
  }> {
    const services = await this.checkAll()
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length,
      disabled: services.filter(s => s.status === 'disabled').length,
    }

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy'
    } else if (summary.degraded > 0 || summary.healthy < summary.total / 2) {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      services,
      summary,
    }
  }
}

export const serviceHealthChecker = new ServiceHealthChecker()

