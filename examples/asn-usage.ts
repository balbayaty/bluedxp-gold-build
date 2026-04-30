/**
 * ASN Module Usage Examples
 * Examples of how to use the ASN module programmatically
 */

import { getAsnService } from '@/lib/services/asn'
import { getPredictiveAsnService } from '@/lib/services/asn'
import { getAsnAnalyticsService } from '@/lib/services/asn'
import type { CreateASNRequest } from '@/types/asn'

// ============================================================================
// Example 1: Create an ASN
// ============================================================================

async function createASNExample() {
  const asnService = getAsnService()
  
  const request: CreateASNRequest = {
    supplierId: 'supplier-1',
    warehouseId: 'warehouse-1',
    expectedArrivalDate: new Date('2025-02-01'),
    priority: 'normal',
    source: 'api',
    items: [
      {
        lineNumber: 1,
        sku: 'SKU-001',
        description: 'Sample Product',
        quantity: 100,
        unitPrice: 50,
        unitOfMeasure: 'PCS',
      },
      {
        lineNumber: 2,
        sku: 'SKU-002',
        description: 'Another Product',
        quantity: 50,
        unitPrice: 75,
        unitOfMeasure: 'PCS',
      },
    ],
    metadata: {
      orderNumber: 'ORD-12345',
      purchaseOrder: 'PO-67890',
    },
    notes: 'Sample ASN created via API',
  }

  const asn = await asnService.createAsn(
    request,
    'user-id',
    'tenant-id'
  )

  console.log('Created ASN:', asn.asnNumber)
  return asn
}

// ============================================================================
// Example 2: Get Predictions
// ============================================================================

async function getPredictionsExample(asnId: string) {
  const predictiveService = getPredictiveAsnService()

  // Get arrival prediction
  const arrivalPrediction = await predictiveService.predictArrival(
    asnId,
    'tenant-id'
  )

  console.log('Predicted Arrival:', arrivalPrediction.predictedArrival)
  console.log('Confidence:', arrivalPrediction.confidence)

  // Get exception probability
  const exceptionProbability = await predictiveService.predictExceptionProbability(
    asnId,
    'tenant-id'
  )

  console.log('Exception Probability:', exceptionProbability)

  // Get quality score
  const qualityScore = await predictiveService.predictQualityScore(
    asnId,
    'tenant-id'
  )

  console.log('Quality Score:', qualityScore)
}

// ============================================================================
// Example 3: Get Analytics
// ============================================================================

async function getAnalyticsExample() {
  const analyticsService = getAsnAnalyticsService()

  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 30)
  const periodEnd = new Date()

  const analytics = await analyticsService.getAnalytics(
    periodStart,
    periodEnd,
    'tenant-id'
  )

  console.log('Total ASNs:', analytics.totalAsns)
  console.log('On-Time Rate:', analytics.onTimeArrivalRate)
  console.log('Exception Rate:', analytics.exceptionRate)
  console.log('Top Suppliers:', analytics.topSuppliers)
}

// ============================================================================
// Example 4: Get Dashboard Data
// ============================================================================

async function getDashboardExample() {
  const analyticsService = getAsnAnalyticsService()

  // Executive dashboard
  const executive = await analyticsService.getExecutiveDashboard(
    'tenant-id',
    30
  )

  console.log('Executive Summary:', executive.summary)
  console.log('Alerts:', executive.alerts)

  // Operational dashboard
  const operational = await analyticsService.getOperationalDashboard(
    'tenant-id'
  )

  console.log('Pending Queue:', operational.queue.pending.length)
  console.log('Today Expected:', operational.today.expected.length)

  // Analytical dashboard
  const analytical = await analyticsService.getAnalyticalDashboard(
    'tenant-id',
    30
  )

  console.log('Insights:', analytical.insights)
  console.log('Recommendations:', analytical.recommendations)
}

// ============================================================================
// Example 5: List and Filter ASNs
// ============================================================================

async function listASNsExample() {
  const asnService = getAsnService()

  // List pending ASNs
  const pending = await asnService.listAsns(
    {
      status: ['pending'],
      page: 1,
      limit: 20,
      sortBy: 'expectedArrivalDate',
      sortOrder: 'asc',
    },
    'tenant-id'
  )

  console.log('Pending ASNs:', pending.data.length)
  console.log('Total:', pending.pagination.total)

  // Search ASNs
  const searchResults = await asnService.listAsns(
    {
      search: 'ASN-2025',
      page: 1,
      limit: 20,
    },
    'tenant-id'
  )

  console.log('Search Results:', searchResults.data.length)

  // Filter by supplier
  const supplierASNs = await asnService.listAsns(
    {
      supplierId: 'supplier-1',
      page: 1,
      limit: 20,
    },
    'tenant-id'
  )

  console.log('Supplier ASNs:', supplierASNs.data.length)
}

// ============================================================================
// Example 6: Update ASN Status
// ============================================================================

async function updateStatusExample(asnId: string) {
  const asnService = getAsnService()

  // Update to receiving
  await asnService.updateStatus(
    asnId,
    'receiving',
    'user-id',
    'tenant-id'
  )

  // Update to received
  await asnService.updateStatus(
    asnId,
    'received',
    'user-id',
    'tenant-id'
  )

  // Complete
  await asnService.updateStatus(
    asnId,
    'completed',
    'user-id',
    'tenant-id'
  )
}

// ============================================================================
// Example 7: Handle Exceptions
// ============================================================================

async function handleExceptionsExample(asnId: string) {
  const { getExceptionPredictionService } = await import('@/lib/services/asn')
  const exceptionService = getExceptionPredictionService()

  // Detect exceptions
  const exceptions = await exceptionService.detectExceptions(
    asnId,
    'tenant-id'
  )

  console.log('Detected Exceptions:', exceptions.length)

  // Predict exceptions
  const predictions = await exceptionService.predictExceptions(
    asnId,
    'tenant-id'
  )

  console.log('Exception Predictions:', predictions)
}

// ============================================================================
// Example 8: Batch Operations
// ============================================================================

async function batchOperationsExample() {
  const predictiveService = getPredictiveAsnService()

  const asnIds = ['asn-1', 'asn-2', 'asn-3', 'asn-4', 'asn-5']

  // Batch predict
  const predictions = await predictiveService.batchPredict(
    asnIds,
    'tenant-id'
  )

  console.log('Batch Predictions:', predictions.size)
  
  for (const [asnId, prediction] of predictions) {
    console.log(`${asnId}: ${prediction.predictedArrival}`)
  }
}

// ============================================================================
// Export all examples
// ============================================================================

export {
  createASNExample,
  getPredictionsExample,
  getAnalyticsExample,
  getDashboardExample,
  listASNsExample,
  updateStatusExample,
  handleExceptionsExample,
  batchOperationsExample,
}


