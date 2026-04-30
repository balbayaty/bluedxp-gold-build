/**
 * Test Script for WMS AI Analytics
 * Tests all analytics endpoints and functionality
 */

import { aiAnalyticsService } from '../lib/services/wms/aiAnalyticsService'
import { skuService } from '../lib/services/wms/skuService'
import { inventoryService } from '../lib/services/wms/inventoryService'

async function testAnalytics() {
  console.log('🧪 Testing WMS AI Analytics...\n')

  try {
    // Get a test SKU
    const allSKUs = await skuService.searchSKUs({}, 1, 1)
    if (allSKUs.items.length === 0) {
      console.log('❌ No SKUs found. Please create a SKU first.')
      return
    }

    const testSKU = allSKUs.items[0]
    const skuId = testSKU.id
    console.log(`📦 Testing with SKU: ${testSKU.skuCode} (${skuId})\n`)

    const options = {
      tenantId: 'test-tenant',
      customerId: 'test-customer',
      warehouseId: 'WH-001',
    }

    // Test 1: Demand Forecasting
    console.log('1️⃣ Testing Demand Forecasting...')
    try {
      const forecast = await aiAnalyticsService.forecastDemand(skuId, 'MONTHLY', options)
      console.log('✅ Forecast:', {
        predictedDemand: forecast.predictedDemand,
        confidenceLevel: forecast.confidenceLevel,
        lowerBound: forecast.lowerBound,
        upperBound: forecast.upperBound,
        period: forecast.forecastPeriod,
      })
    } catch (error) {
      console.log('❌ Forecast Error:', error instanceof Error ? error.message : error)
    }

    // Test 2: ABC/XYZ Classification
    console.log('\n2️⃣ Testing ABC/XYZ Classification...')
    try {
      const classification = await aiAnalyticsService.classifyABCXYZ(skuId, options)
      console.log('✅ Classification:', {
        abcClass: classification.abcClass,
        xyzClass: classification.xyzClass,
        combinedClass: classification.combinedClass,
        value: classification.value,
        variability: classification.variability.toFixed(2),
        recommendations: classification.recommendations.length,
      })
    } catch (error) {
      console.log('❌ Classification Error:', error instanceof Error ? error.message : error)
    }

    // Test 3: Safety Stock Optimization
    console.log('\n3️⃣ Testing Safety Stock Optimization...')
    try {
      const safetyStock = await aiAnalyticsService.optimizeSafetyStock(skuId, options)
      console.log('✅ Safety Stock:', {
        current: safetyStock.currentSafetyStock,
        optimal: safetyStock.optimalSafetyStock,
        recommended: safetyStock.recommendedSafetyStock,
        method: safetyStock.calculationMethod,
        demandVariability: safetyStock.factors.demandVariability.toFixed(2),
      })
    } catch (error) {
      console.log('❌ Safety Stock Error:', error instanceof Error ? error.message : error)
    }

    // Test 4: Reorder Point Optimization
    console.log('\n4️⃣ Testing Reorder Point Optimization...')
    try {
      const reorderPoint = await aiAnalyticsService.optimizeReorderPoint(skuId, options)
      console.log('✅ Reorder Point:', {
        current: reorderPoint.currentReorderPoint,
        optimal: reorderPoint.optimalReorderPoint,
        recommended: reorderPoint.recommendedReorderPoint,
        method: reorderPoint.calculationMethod,
        averageDemand: reorderPoint.factors.averageDemand.toFixed(2),
        leadTime: reorderPoint.factors.leadTime,
      })
    } catch (error) {
      console.log('❌ Reorder Point Error:', error instanceof Error ? error.message : error)
    }

    // Test 5: Inventory Optimization
    console.log('\n5️⃣ Testing Inventory Optimization...')
    try {
      const optimization = await aiAnalyticsService.optimizeInventory(skuId, options)
      console.log('✅ Optimization:', {
        currentStock: optimization.currentStock,
        optimalStock: optimization.optimalStock,
        recommendedAction: optimization.recommendedAction,
        recommendedQuantity: optimization.recommendedQuantity,
        serviceLevel: optimization.expectedImpact.serviceLevel,
        stockoutRisk: optimization.expectedImpact.stockoutRisk,
      })
    } catch (error) {
      console.log('❌ Optimization Error:', error instanceof Error ? error.message : error)
    }

    // Test 6: Anomaly Detection
    console.log('\n6️⃣ Testing Anomaly Detection...')
    try {
      const anomalies = await aiAnalyticsService.detectAnomalies(skuId, options)
      console.log('✅ Anomalies:', {
        count: anomalies.anomalies.length,
        details: anomalies.anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          description: a.description.substring(0, 50) + '...',
        })),
      })
    } catch (error) {
      console.log('❌ Anomaly Detection Error:', error instanceof Error ? error.message : error)
    }

    // Test 7: Batch Operations
    console.log('\n7️⃣ Testing Batch Operations...')
    try {
      const skuIds = allSKUs.items.slice(0, 3).map(s => s.id)
      const forecasts = await aiAnalyticsService.forecastDemandBatch(skuIds, 'MONTHLY', options)
      const classifications = await aiAnalyticsService.classifyABCXYZBatch(skuIds, options)
      console.log('✅ Batch Operations:', {
        forecasts: forecasts.length,
        classifications: classifications.length,
      })
    } catch (error) {
      console.log('❌ Batch Operations Error:', error instanceof Error ? error.message : error)
    }

    console.log('\n✅ All tests completed!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run tests
testAnalytics().catch(console.error)









