/**
 * QR Code Test Data Generator
 * Generate comprehensive test data for QR code visualization
 */

import { QRCodeData, QRTemplate, BulkQROperation } from '@/types/qr'
import { documentQRService } from '@/lib/services/qr/documentQRService'
import { qrTemplateService } from '@/lib/services/qr/qrTemplateService'

export interface QRTestData {
  qrCodes: Array<{
    id: string
    qrData: QRCodeData
    qrImageUrl?: string
    analytics: {
      totalScans: number
      uniqueScans: number
      lastScanned?: string
    }
  }>
  templates: QRTemplate[]
  bulkOperations: BulkQROperation[]
}

/**
 * Generate test QR codes for various entity types
 */
export async function generateQRTestData(): Promise<QRTestData> {
  const qrCodes = []
  const templates = []
  const bulkOperations = []

  // Initialize default templates
  await qrTemplateService.initializeDefaultTemplates('test-user')
  const allTemplates = await qrTemplateService.listTemplates({ isPublic: true })
  templates.push(...allTemplates)

  // Generate QR codes for different entity types
  const entityTypes = [
    { type: 'damage', id: 'DR-2024-001', name: 'Damage Report - Container Leak', module: 'damage' },
    { type: 'incident', id: 'INC-2024-045', name: 'Safety Incident - Chemical Spill', module: 'qhse' },
    { type: 'shipment', id: 'SH-2024-1234', name: 'Shipment - Dubai to Riyadh', module: 'tms' },
    { type: 'work-order', id: 'WO-2024-789', name: 'Work Order - HVAC Maintenance', module: 'facility' },
    { type: 'msds', id: 'MSDS-2024-567', name: 'MSDS - Acetic Acid', module: 'chemical' },
    { type: 'certificate', id: 'CERT-2024-890', name: 'Certificate - ISO 9001', module: 'compliance' },
    { type: 'asset', id: 'AST-2024-234', name: 'Asset - Forklift #12', module: 'facility' },
    { type: 'container', id: 'CNT-2024-456', name: 'Container - Chemical Storage', module: 'wms' },
    { type: 'task', id: 'TASK-2024-111', name: 'Task - Safety Inspection', module: 'qhse' },
    { type: 'ncr', id: 'NCR-2024-222', name: 'NCR - Quality Issue', module: 'iso-ims' },
  ]

  for (const entity of entityTypes) {
    try {
      const result = await documentQRService.generateDocumentQR({
        documentId: entity.id,
        documentType: entity.type === 'msds' ? 'msds' : entity.type === 'certificate' ? 'certificate' : 'other',
        documentUrl: `/${entity.module}/${entity.id}`,
        dynamic: true,
        analytics: true,
        customData: {
          entityType: entity.type,
          entityName: entity.name,
          module: entity.module
        }
      })

      // Generate mock analytics
      const totalScans = Math.floor(Math.random() * 100) + 1
      const uniqueScans = Math.floor(totalScans * 0.7)
      const lastScanned = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()

      qrCodes.push({
        id: result.qrData.id,
        qrData: result.qrData,
        qrImageUrl: result.qrImageUrl,
        analytics: {
          totalScans,
          uniqueScans,
          lastScanned
        }
      })
    } catch (error) {
      console.error(`Error generating QR for ${entity.type}:`, error)
    }
  }

  // Generate bulk operation test data
  const bulkOp: BulkQROperation = {
    id: 'bulk-op-001',
    type: 'generate',
    status: 'completed',
    items: qrCodes.slice(0, 5).map((qr, idx) => ({
      id: qr.id,
      data: qr,
      status: 'success' as const
    })),
    totalItems: 5,
    processedItems: 5,
    failedItems: 0,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    createdBy: 'test-user'
  }
  bulkOperations.push(bulkOp)

  return {
    qrCodes,
    templates,
    bulkOperations
  }
}

/**
 * Generate QR code analytics test data
 */
export function generateQRAnalyticsTestData() {
  return {
    totalQRCodes: 150,
    totalScans: 12450,
    uniqueScans: 8920,
    scansToday: 234,
    scansThisWeek: 1456,
    scansThisMonth: 5234,
    topScanned: [
      { qrId: 'qr-msds-001', documentType: 'msds', scans: 456, name: 'MSDS - Acetic Acid' },
      { qrId: 'qr-shipment-002', documentType: 'shipment', scans: 389, name: 'Shipment - Dubai to Riyadh' },
      { qrId: 'qr-container-003', documentType: 'container', scans: 312, name: 'Container - Chemical Storage' },
      { qrId: 'qr-asset-004', documentType: 'asset', scans: 278, name: 'Asset - Forklift #12' },
      { qrId: 'qr-incident-005', documentType: 'incident', scans: 234, name: 'Safety Incident Report' },
    ],
    scansByModule: {
      wms: 3456,
      tms: 2890,
      qhse: 2123,
      facility: 1876,
      compliance: 1456,
      chemical: 1049
    },
    scansByLocation: {
      'Warehouse A': 3456,
      'Warehouse B': 2890,
      'Office': 1234,
      'Factory Floor': 1876,
      'Loading Dock': 1456
    },
    scansByDevice: {
      mobile: 8234,
      tablet: 2345,
      desktop: 1871
    },
    scansByTime: {
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        scans: Math.floor(Math.random() * 50) + 10
      })),
      daily: Array.from({ length: 7 }, (_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        scans: Math.floor(Math.random() * 200) + 100
      }))
    }
  }
}

/**
 * Generate scan event test data
 */
export function generateScanEventTestData(count: number = 50) {
  const locations = ['Warehouse A', 'Warehouse B', 'Office', 'Factory Floor', 'Loading Dock']
  const devices = ['iPhone 14', 'Samsung Galaxy S23', 'iPad Pro', 'Android Tablet', 'Desktop']
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    'Mozilla/5.0 (Linux; Android 13)',
    'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `scan-${i + 1}`,
    qrId: `qr-${Math.floor(Math.random() * 10) + 1}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: locations[Math.floor(Math.random() * locations.length)],
    device: devices[Math.floor(Math.random() * devices.length)],
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    userId: `user-${Math.floor(Math.random() * 20) + 1}`
  }))
}






