/**
 * Transportation Module - Example Usage
 * 
 * Comprehensive examples for using all transportation services
 */

import {
  comprehensiveShipmentService,
  routeComparisonService,
  pricingIntelligenceService,
  co2EmissionsService,
  transitTimePredictionService,
  aiInsightsService,
  loadMatchingService,
  transportationIoTIntegrationService,
  freightAuditService,
  financialManagementService,
  carrierNetworkService,
  transportationComplianceService,
  transportationPredictiveAnalyticsService,
  transportationBlockchainService,
  fleetManagementService,
  erpWmsIntegrationService,
  transportationWebhookService,
  transportationRealtimeService,
} from '@/lib/services/transportation'
import { elmRabetAdapter } from '@/lib/adapters/government/elmRabetAdapter'
import type { Shipment } from '@/types/tms'

// ============================================================================
// Example 1: Create Comprehensive Shipment
// ============================================================================

export async function exampleCreateShipment() {
  const shipment = await comprehensiveShipmentService.createShipment({
    origin: {
      address: {
        street: '123 Main St',
        city: 'Riyadh',
        state: 'Riyadh Province',
        postalCode: '11564',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 24.7136,
        lng: 46.6753,
      },
    },
    destination: {
      address: {
        street: '456 King St',
        city: 'Jeddah',
        state: 'Makkah Province',
        postalCode: '21432',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 21.4858,
        lng: 39.1925,
      },
    },
    type: 'FCL',
    mode: 'SEA',
    cargo: {
      items: [
        {
          description: 'Electronics',
          quantity: 100,
          weight: 5000,
          volume: 20,
          value: 100000,
          currency: 'USD',
        },
      ],
      totalWeight: 5000,
      totalVolume: 20,
      totalValue: 100000,
      currency: 'USD',
    },
    createdBy: 'user-123',
    options: {
      generateRouteComparison: true,
      generatePricingIntelligence: true,
      calculateEmissions: true,
      predictTransitTime: true,
      generateAIInsights: true,
      linkToJourney: true,
      linkToLifecycle: true,
    },
  })

  console.log('Shipment created:', shipment)
  return shipment
}

// ============================================================================
// Example 2: Compare Routes
// ============================================================================

export async function exampleCompareRoutes() {
  const comparison = await routeComparisonService.compareRoutes({
    origin: {
      address: {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 24.7136,
        lng: 46.6753,
      },
    },
    destination: {
      address: {
        city: 'Jeddah',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 21.4858,
        lng: 39.1925,
      },
    },
    mode: 'LAND',
    cargo: {
      weight: 5000,
      volume: 20,
      type: 'FTL',
    },
    priorities: {
      cost: 0.4,
      time: 0.3,
      emissions: 0.2,
      reliability: 0.1,
    },
  })

  console.log('Recommended route:', comparison.recommended)
  console.log('All options:', comparison.options)
  return comparison
}

// ============================================================================
// Example 3: Get Pricing Intelligence
// ============================================================================

export async function exampleGetPricingIntelligence() {
  const pricing = await pricingIntelligenceService.getPricingIntelligence({
    origin: {
      address: {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
    },
    destination: {
      address: {
        city: 'Jeddah',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
    },
    mode: 'SEA',
    cargo: {
      weight: 20000,
      volume: 50,
      type: 'FCL',
    },
    pickupDate: new Date('2025-02-01'),
  })

  console.log('Market rate:', pricing.marketRate)
  console.log('Savings:', pricing.savings)
  console.log('Recommendations:', pricing.recommendations)
  return pricing
}

// ============================================================================
// Example 4: Calculate CO2 Emissions
// ============================================================================

export async function exampleCalculateEmissions() {
  const emissions = await co2EmissionsService.calculateEmissions({
    route: {
      origin: {
        address: {
          city: 'Riyadh',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
        coordinates: {
          lat: 24.7136,
          lng: 46.6753,
        },
      },
      destination: {
        address: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
        coordinates: {
          lat: 21.4858,
          lng: 39.1925,
        },
      },
      distance: 950,
      mode: 'LAND',
    },
    cargo: {
      weight: 5000,
      volume: 20,
    },
    vehicle: {
      type: 'TRUCK',
      fuelType: 'DIESEL',
      loadFactor: 0.85,
    },
  })

  console.log('Total CO2e:', emissions.totalCO2e)
  console.log('Offset options:', emissions.offsetOptions)
  return emissions
}

// ============================================================================
// Example 5: Predict Transit Time
// ============================================================================

export async function examplePredictTransitTime() {
  const prediction = await transitTimePredictionService.predictTransitTime({
    route: {
      origin: {
        address: {
          city: 'Riyadh',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
        coordinates: {
          lat: 24.7136,
          lng: 46.6753,
        },
      },
      destination: {
        address: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
        coordinates: {
          lat: 21.4858,
          lng: 39.1925,
        },
      },
      distance: 950,
      mode: 'LAND',
    },
    cargo: {
      type: 'FTL',
      hazmat: false,
    },
    pickupDate: new Date('2025-02-01'),
    carrierId: 'carrier-123',
  })

  console.log('Estimated transit time:', prediction.estimated)
  console.log('Confidence:', prediction.confidence)
  console.log('Risk factors:', prediction.riskFactors)
  return prediction
}

// ============================================================================
// Example 6: Get AI Insights
// ============================================================================

export async function exampleGetAIInsights() {
  const insights = await aiInsightsService.generateInsights({
    shipment: {
      id: 'shipment-123',
      mode: 'SEA',
      type: 'FCL',
      origin: {
        address: {
          city: 'Riyadh',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
      },
      destination: {
        address: {
          city: 'Jeddah',
          country: 'Saudi Arabia',
          countryCode: 'SA',
        },
      },
    },
    includeCategories: ['COST', 'ROUTE', 'TIMING'],
  })

  console.log('Recommendations:', insights.recommendations)
  console.log('Risk factors:', insights.riskFactors)
  console.log('Optimization suggestions:', insights.optimizationSuggestions)
  return insights
}

// ============================================================================
// Example 7: Load Matching
// ============================================================================

export async function exampleLoadMatching() {
  const matches = await loadMatchingService.findMatches({
    origin: {
      address: {
        city: 'Riyadh',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 24.7136,
        lng: 46.6753,
      },
    },
    destination: {
      address: {
        city: 'Jeddah',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: {
        lat: 21.4858,
        lng: 39.1925,
      },
    },
    cargo: {
      weight: 5000,
      volume: 20,
      type: 'FTL',
    },
    mode: 'LAND',
    pickupDate: new Date('2025-02-01'),
    preferences: {
      maxPrice: 10000,
      minReliability: 90,
    },
  })

  console.log('Top match:', matches.topMatch)
  console.log('All matches:', matches.matches)
  console.log('Recommendations:', matches.recommendations)
  return matches
}

// ============================================================================
// Example 8: IoT Integration (Dual: Direct + Government)
// ============================================================================

export async function exampleIoTIntegration() {
  // Initialize IoT integration
  await transportationIoTIntegrationService.initialize({
    integrationType: 'BOTH',
    directProviders: [
      {
        provider: 'SensorNet',
        apiKey: 'xxx',
        apiUrl: 'https://api.sensornet.com',
        certified: true,
      },
    ],
    governmentIntegration: {
      country: 'Saudi Arabia',
      provider: 'ELM',
      config: {
        apiUrl: 'https://api.elm.sa',
        apiKey: 'xxx',
        organizationId: 'xxx',
      },
    },
  })

  // Get sensor data
  const sensorData = await transportationIoTIntegrationService.getSensorData('shipment-123')
  console.log('Sensor data:', sensorData)

  // Monitor shipment
  const shipment = await comprehensiveShipmentService.getShipment('shipment-123')
  if (shipment) {
    await transportationIoTIntegrationService.monitorShipment(shipment)
  }

  return sensorData
}

// ============================================================================
// Example 9: ELM/Rabet.sa Integration
// ============================================================================

export async function exampleELMIntegration() {
  // Initialize ELM adapter
  elmRabetAdapter.initialize({
    apiUrl: 'https://api.elm.sa',
    apiKey: 'xxx',
    organizationId: 'xxx',
    region: 'SAUDI_ARABIA',
  })

  // Get truck data
  const truckData = await elmRabetAdapter.getTruckData('truck-123')
  console.log('Truck data:', truckData)

  // Get shipment tracking
  const tracking = await elmRabetAdapter.getShipmentTracking('shipment-123')
  console.log('Tracking events:', tracking)

  // Get sensor data
  const sensorData = await elmRabetAdapter.getSensorData('truck-123', {
    from: new Date('2025-01-01'),
    to: new Date('2025-01-27'),
  })
  console.log('Historical sensor data:', sensorData)

  return truckData
}

// ============================================================================
// Example 10: Freight Audit
// ============================================================================

export async function exampleFreightAudit() {
  const auditResult = await freightAuditService.auditInvoice({
    id: 'invoice-123',
    invoiceNumber: 'INV-001',
    carrierId: 'carrier-123',
    carrierName: 'ABC Logistics',
    shipmentId: 'shipment-123',
    invoiceDate: new Date('2025-01-27'),
    dueDate: new Date('2025-02-10'),
    lineItems: [
      {
        description: 'Base Rate',
        rate: 100,
        amount: 5000,
        type: 'BASE_RATE',
      },
    ],
    subtotal: 5000,
    taxes: 750,
    total: 5750,
    currency: 'USD',
    status: 'PENDING',
    documents: [],
  })

  console.log('Audit valid:', auditResult.valid)
  console.log('Issues found:', auditResult.issues.length)
  console.log('Potential savings:', auditResult.savings)
  console.log('Recommendations:', auditResult.recommendations)

  return auditResult
}

// ============================================================================
// Example 11: Financial Management
// ============================================================================

export async function exampleFinancialManagement() {
  // Process payment
  const payment = await financialManagementService.processPayment({
    invoiceId: 'invoice-123',
    shipmentId: 'shipment-123',
    amount: 5750,
    currency: 'USD',
    carrierId: 'carrier-123',
    paymentMethod: 'ACH',
    scheduledDate: new Date('2025-02-10'),
  })

  console.log('Payment processed:', payment)

  // Reconcile invoice
  const reconciliation = await financialManagementService.reconcileInvoice(
    'invoice-123',
    'shipment-123'
  )
  console.log('Reconciliation:', reconciliation)

  // Get financial analytics
  const analytics = await financialManagementService.getFinancialAnalytics(
    {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-27'),
    },
    {
      carrierId: 'carrier-123',
    }
  )
  console.log('Financial analytics:', analytics)

  return { payment, reconciliation, analytics }
}

// ============================================================================
// Example 12: Carrier Network Management
// ============================================================================

export async function exampleCarrierNetwork() {
  // Create carrier segment
  const segmentId = await carrierNetworkService.createSegment({
    name: 'Premium Carriers',
    criteria: {
      minRating: 4.5,
      minOnTimeRate: 95,
      region: ['Saudi Arabia'],
    },
    description: 'Top-performing carriers in Saudi Arabia',
  })
  console.log('Segment created:', segmentId)

  // Rate carrier
  const rating = await carrierNetworkService.rateCarrier('carrier-123')
  console.log('Carrier rating:', rating)

  // Analyze network coverage
  const coverage = await carrierNetworkService.analyzeNetworkCoverage('Saudi Arabia')
  console.log('Network coverage:', coverage)

  return { segmentId, rating, coverage }
}

// ============================================================================
// Example 13: Compliance
// ============================================================================

export async function exampleCompliance() {
  // Get hours of service
  const hos = await transportationComplianceService.getHoursOfService(
    'driver-123',
    new Date('2025-01-27')
  )
  console.log('Hours of service:', hos)

  // Check shipment compliance
  const shipment = await comprehensiveShipmentService.getShipment('shipment-123')
  if (shipment) {
    const compliance = await transportationComplianceService.checkCompliance(shipment)
    console.log('Compliance status:', compliance.overallStatus)
    console.log('Violations:', compliance.violations)
  }

  return hos
}

// ============================================================================
// Example 14: Predictive Analytics
// ============================================================================

export async function examplePredictiveAnalytics() {
  // Forecast demand
  const demandForecast = await transportationPredictiveAnalyticsService.forecastDemand(
    'LAND',
    'Saudi Arabia',
    {
      from: new Date('2025-02-01'),
      to: new Date('2025-02-28'),
    }
  )
  console.log('Demand forecast:', demandForecast)

  // Predict disruptions
  const shipment = await comprehensiveShipmentService.getShipment('shipment-123')
  if (shipment) {
    const disruptions = await transportationPredictiveAnalyticsService.predictDisruptions(
      shipment
    )
    console.log('Predicted disruptions:', disruptions)
  }

  // Predict carrier performance
  const carrierPerformance = await transportationPredictiveAnalyticsService.predictCarrierPerformance(
    'carrier-123'
  )
  console.log('Carrier performance prediction:', carrierPerformance)

  return { demandForecast, carrierPerformance }
}

// ============================================================================
// Example 15: Blockchain
// ============================================================================

export async function exampleBlockchain() {
  // Record transaction
  const transaction = await transportationBlockchainService.recordTransaction(
    'shipment-123',
    'SHIPMENT_CREATED',
    {
      shipmentNumber: 'SH-2025-001',
      status: 'DRAFT',
    }
  )
  console.log('Transaction recorded:', transaction)

  // Create smart contract
  const contractId = await transportationBlockchainService.createSmartContract(
    'shipment-123',
    'AUTOMATED_PAYMENT',
    {
      condition: 'DELIVERED',
      action: 'PROCESS_PAYMENT',
      parameters: {
        amount: 5750,
        currency: 'USD',
      },
    }
  )
  console.log('Smart contract created:', contractId)

  // Get traceability
  const traceability = await transportationBlockchainService.getTraceability('shipment-123')
  console.log('Traceability:', traceability)

  return { transaction, contractId, traceability }
}

// ============================================================================
// Example 16: Fleet Management
// ============================================================================

export async function exampleFleetManagement() {
  // Optimize fleet assignment
  const shipments = [
    await comprehensiveShipmentService.getShipment('shipment-123'),
  ].filter(Boolean) as Shipment[]

  const optimization = await fleetManagementService.optimizeFleetAssignment(shipments)
  console.log('Fleet optimization:', optimization)

  // Schedule maintenance
  const maintenanceId = await fleetManagementService.scheduleMaintenance('vehicle-123', {
    type: 'ROUTINE',
    description: 'Oil change and inspection',
    scheduledDate: new Date('2025-02-15'),
    estimatedDuration: 2,
    estimatedCost: 500,
    currency: 'USD',
  })
  console.log('Maintenance scheduled:', maintenanceId)

  // Get predictive maintenance
  const predictiveMaintenance = await fleetManagementService.getPredictiveMaintenance()
  console.log('Predictive maintenance recommendations:', predictiveMaintenance)

  return { optimization, maintenanceId, predictiveMaintenance }
}

// ============================================================================
// Example 17: ERP/WMS Integration
// ============================================================================

export async function exampleERPWMSIntegration() {
  // Configure ERP
  erpWmsIntegrationService.configureERP({
    provider: 'SAP',
    apiUrl: 'https://api.sap.com',
    apiKey: 'xxx',
    enabled: true,
  })

  // Sync shipment to ERP
  const shipment = await comprehensiveShipmentService.getShipment('shipment-123')
  if (shipment) {
    const sync = await erpWmsIntegrationService.syncToERP(shipment, 'SAP')
    console.log('ERP sync:', sync)
  }

  // Enable real-time sync
  if (shipment) {
    await erpWmsIntegrationService.enableRealTimeSync('shipment-123', [
      { type: 'ERP', provider: 'SAP' },
      { type: 'WMS', provider: 'WarehousePro' },
    ])
    console.log('Real-time sync enabled')
  }

  return sync
}

// ============================================================================
// Example 18: Webhooks
// ============================================================================

export async function exampleWebhooks() {
  // Subscribe to webhook events
  const subscriptionId = await transportationWebhookService.subscribe(
    'https://example.com/webhook',
    ['shipment.created', 'shipment.status.changed', 'iot.alert.triggered'],
    'webhook-secret'
  )
  console.log('Webhook subscription:', subscriptionId)

  // List subscriptions
  const subscriptions = await transportationWebhookService.getSubscriptions()
  console.log('All subscriptions:', subscriptions)

  return subscriptionId
}

// ============================================================================
// Example 19: Real-Time Updates
// ============================================================================

export async function exampleRealtimeUpdates() {
  // Subscribe to real-time updates
  const subscriptionId = await transportationRealtimeService.subscribe(
    'connection-123',
    ['shipment-123'],
    ['SHIPMENT_STATUS', 'LOCATION_UPDATE', 'SENSOR_DATA']
  )
  console.log('Real-time subscription:', subscriptionId)

  // Register connection (in production, this would be a WebSocket/SSE connection)
  transportationRealtimeService.registerConnection('connection-123', {
    send: (data: any) => {
      console.log('Sending real-time update:', data)
    },
  })

  return subscriptionId
}

// ============================================================================
// Example 20: Complete Workflow
// ============================================================================

export async function exampleCompleteWorkflow() {
  // 1. Create shipment with all intelligence
  const shipment = await exampleCreateShipment()

  // 2. Compare routes
  const routeComparison = await exampleCompareRoutes()

  // 3. Get pricing intelligence
  const pricing = await exampleGetPricingIntelligence()

  // 4. Calculate emissions
  const emissions = await exampleCalculateEmissions()

  // 5. Predict transit time
  const transitTime = await examplePredictTransitTime()

  // 6. Get AI insights
  const insights = await exampleGetAIInsights()

  // 7. Find load matches
  const matches = await exampleLoadMatching()

  // 8. Initialize IoT monitoring
  await exampleIoTIntegration()

  // 9. Audit freight invoice
  const audit = await exampleFreightAudit()

  // 10. Process payment
  const payment = await exampleFinancialManagement()

  console.log('Complete workflow executed successfully!')
  return {
    shipment,
    routeComparison,
    pricing,
    emissions,
    transitTime,
    insights,
    matches,
    audit,
    payment,
  }
}






