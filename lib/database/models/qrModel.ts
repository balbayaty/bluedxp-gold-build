/**
 * QR Code Database Model
 * Production-ready data access layer for QR codes and analytics
 */

import { prisma } from '@/lib/services/database/prismaClient'
import { QRCodeSchema, QRScanEventSchema } from '../schema'

export class QRCodeModel {
  // DatabaseClient is no longer needed with Prisma
  constructor(private db?: any) { }

  /**
   * Create QR code
   */
  async create(qrCode: Omit<QRCodeSchema, 'id' | 'metadata' | 'analytics'> & { id?: string }): Promise<QRCodeSchema> {
    const id = qrCode.id || `qr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const now = new Date()

    const qrData = {
      id,
      ...qrCode,
      analytics: {
        totalScans: 0,
        uniqueScans: 0,
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: qrCode.metadata?.createdBy || 'system',
      }
    }

    try {
      const result = await prisma.qRCode.create({
        data: {
          id: qrData.id,
          qrId: qrData.qrId,
          documentId: qrData.documentId,
          containerId: qrData.containerId,
          chemicalId: qrData.chemicalId,
          documentType: qrData.documentType,
          qrData: qrData.qrData as any,
          qrImageUrl: qrData.qrImageUrl,
          isDynamic: qrData.isDynamic,
          version: qrData.version,
          analytics: qrData.analytics as any,
          metadata: qrData.metadata as any,
        }
      })

      return this.mapPrismaToSchema(result)
    } catch (error) {
      console.error('Failed to create QR code:', error)
      throw error
    }
  }

  /**
   * Get QR code by ID
   */
  async getById(id: string): Promise<QRCodeSchema | null> {
    const result = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { id: id },
          { qrId: id }
        ]
      }
    })

    return result ? this.mapPrismaToSchema(result) : null
  }

  /**
   * Update QR code
   */
  async update(id: string, updates: Partial<QRCodeSchema>): Promise<QRCodeSchema | null> {
    const existing = await this.getById(id)
    if (!existing) return null

    const updatedMetadata = {
      ...(existing.metadata || {}),
      ...(updates.metadata || {}),
      updatedAt: new Date(),
    }

    const result = await prisma.qRCode.update({
      where: { id: existing.id }, // Use the resolved primary ID from getById
      data: {
        qrData: updates.qrData ? (updates.qrData as any) : undefined,
        qrImageUrl: updates.qrImageUrl,
        isDynamic: updates.isDynamic,
        version: { increment: 1 },
        analytics: updates.analytics ? (updates.analytics as any) : undefined,
        metadata: updatedMetadata as any,
      }
    })

    return this.mapPrismaToSchema(result)
  }

  /**
   * Track QR scan event
   */
  async trackScan(qrId: string, scanData: Omit<QRScanEventSchema, 'id' | 'qrId' | 'timestamp' | 'metadata'>): Promise<QRScanEventSchema> {
    const id = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // 1. Create Scan Event
    // Note: We need to resolve the FK `qrId` which we mapped to the business logic `qrId` column in schema.

    const scanEvent = await prisma.qRScanEvent.create({
      data: {
        id,
        qrId, // This maps to the `qr_id` column which references `QRCode.qrId`
        location: scanData.location,
        device: scanData.device,
        userAgent: scanData.userAgent,
        ipAddress: scanData.ipAddress,
        userId: scanData.userId,
        metadata: { createdAt: new Date() } as any
      }
    })

    // 2. Update Analytics
    const qrCode = await prisma.qRCode.findUnique({ where: { qrId } })
    if (qrCode) {
      const currentAnalytics = (qrCode.analytics as any) || { totalScans: 0 }
      const newAnalytics = {
        ...currentAnalytics,
        totalScans: (currentAnalytics.totalScans || 0) + 1,
        lastScanned: new Date().toISOString(),
        firstScanned: currentAnalytics.firstScanned || new Date().toISOString()
      }

      await prisma.qRCode.update({
        where: { qrId },
        data: { analytics: newAnalytics }
      })
    }

    return {
      id: scanEvent.id,
      qrId: scanEvent.qrId,
      timestamp: scanEvent.timestamp,
      location: scanEvent.location || undefined,
      device: scanEvent.device || undefined,
      userAgent: scanEvent.userAgent || undefined,
      ipAddress: scanEvent.ipAddress || undefined,
      userId: scanEvent.userId || undefined,
      metadata: scanEvent.metadata as any
    }
  }

  /**
   * Get scan events for QR code
   */
  async getScanEvents(qrId: string, limit?: number): Promise<QRScanEventSchema[]> {
    const events = await prisma.qRScanEvent.findMany({
      where: { qrId },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    return events.map(e => ({
      id: e.id,
      qrId: e.qrId,
      timestamp: e.timestamp,
      location: e.location || undefined,
      device: e.device || undefined,
      userAgent: e.userAgent || undefined,
      ipAddress: e.ipAddress || undefined,
      userId: e.userId || undefined,
      metadata: e.metadata as any
    }))
  }

  /**
   * Get QR analytics
   */
  async getAnalytics(qrId: string): Promise<{
    totalScans: number
    uniqueScans: number
    scanHistory: QRScanEventSchema[]
    locations: Record<string, number>
    devices: Record<string, number>
    lastScanned?: Date
    firstScanned?: Date
  } | null> {
    const qrCode = await this.getById(qrId)
    if (!qrCode) return null

    const scanEvents = await this.getScanEvents(qrId, 1000)

    // Calculate unique scans
    const uniqueUsers = new Set(scanEvents.filter(e => e.userId).map(e => e.userId))
    const uniqueScans = uniqueUsers.size

    // Calculate locations
    const locations: Record<string, number> = {}
    scanEvents.forEach(event => {
      if (event.location) {
        locations[event.location] = (locations[event.location] || 0) + 1
      }
    })

    // Calculate devices
    const devices: Record<string, number> = {}
    scanEvents.forEach(event => {
      if (event.device) {
        devices[event.device] = (devices[event.device] || 0) + 1
      }
    })

    const analytics = qrCode.analytics as any

    return {
      totalScans: analytics.totalScans || 0,
      uniqueScans,
      scanHistory: scanEvents,
      locations,
      devices,
      lastScanned: analytics.lastScanned ? new Date(analytics.lastScanned) : undefined,
      firstScanned: analytics.firstScanned ? new Date(analytics.firstScanned) : undefined,
    }
  }

  private mapPrismaToSchema(record: any): QRCodeSchema {
    return {
      id: record.id,
      qrId: record.qrId,
      documentId: record.documentId,
      containerId: record.containerId,
      chemicalId: record.chemicalId,
      documentType: record.documentType,
      qrData: record.qrData,
      qrImageUrl: record.qrImageUrl,
      isDynamic: record.isDynamic,
      version: record.version,
      analytics: record.analytics,
      metadata: record.metadata
    }
  }
}











