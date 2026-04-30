/**
 * TMS V2 Seed Data
 * Creates demo shipments to showcase all features
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTMSData() {
  console.log('🌱 Seeding TMS V2 data...\n')
  
  const tenantId = 'tenant-1'
  
  // Clean existing TMS data
  console.log('🧹 Cleaning existing TMS data...')
  await prisma.stateTransition.deleteMany({ where: { tenantId } })
  await prisma.sanctionsScreening.deleteMany({ where: { tenantId } })
  await prisma.hSCodeClassification.deleteMany({ where: { tenantId } })
  await prisma.dutyCalculation.deleteMany({ where: { tenantId } })
  await prisma.crossBorderRoute.deleteMany({ where: { tenantId } })
  await prisma.vGM.deleteMany({ where: { tenantId } })
  await prisma.container.deleteMany({ where: { tenantId } })
  await prisma.billOfLading.deleteMany({ where: { tenantId } })
  await prisma.aWB.deleteMany({ where: { tenantId } })
  await prisma.shipment.deleteMany({ where: { tenantId } })
  console.log('✅ Cleaned\n')
  
  // ============================================================================
  // DEMO 1: Air Freight (Dubai → New York)
  // ============================================================================
  console.log('✈️  Creating air freight demo shipment...')
  const airShipment = await prisma.shipment.create({
    data: {
      id: 'SH-AIR-DEMO-001',
      shipmentNumber: 'SH-AIR-001',
      trackingNumber: 'TRK-AIR-001',
      type: 'AIR_EXPRESS',
      mode: 'AIR',
      status: 'IN_TRANSIT',
      priority: 'HIGH',
      serviceLevel: 'EXPRESS',
      
      // Parties
      consignorName: 'Dubai Electronics LLC',
      consignorContact: '+971-4-1234567',
      consigneeName: 'New York Imports Inc',
      consigneeContact: '+1-212-5556789',
      customerId: 'CUST-001',
      
      // Locations
      origin: {
        id: 'DXB',
        name: 'Dubai International Airport',
        type: 'AIRPORT',
        address: {
          street: 'Airport Road',
          city: 'Dubai',
          state: 'Dubai',
          postalCode: '00000',
          country: 'United Arab Emirates',
          countryCode: 'AE'
        },
        airportCode: 'DXB'
      },
      destination: {
        id: 'JFK',
        name: 'JFK International Airport',
        type: 'AIRPORT',
        address: {
          street: 'JFK Airport',
          city: 'New York',
          state: 'NY',
          postalCode: '11430',
          country: 'United States',
          countryCode: 'US'
        },
        airportCode: 'JFK'
      },
      
      // Cargo
      items: [
        {
          id: 'ITEM-1',
          sku: 'LAPTOP-XPS',
          description: 'Dell XPS Laptops',
          quantity: 50,
          unit: 'PCS',
          weight: 2.5,
          volume: 0.015,
          value: 1200,
          currency: 'USD',
          hsCode: '8471.30.01',
          dimensions: { length: 40, width: 30, height: 5, unit: 'CM' }
        }
      ],
      totalWeight: 125, // kg
      totalVolume: 0.75, // m³
      totalValue: 60000, // USD
      currency: 'USD',
      totalPieces: 50,
      
      // Carrier
      carrierId: 'CARRIER-EK',
      carrierName: 'Emirates SkyCargo',
      carrierCode: '176',
      bookingNumber: 'BKG-AIR-20250104001',
      awbNumber: '176-12345678',
      flightNumber: 'EK201',
      
      // Dates
      pickupDate: new Date('2025-01-05T08:00:00Z'),
      estimatedDelivery: new Date('2025-01-06T06:00:00Z'),
      actualPickup: new Date('2025-01-05T08:30:00Z'),
      bookingDate: new Date('2025-01-04T14:00:00Z'),
      
      // Incoterms
      incoterms: 'CIF',
      
      // Air Freight Details
      airFreightDetails: {
        awbNumber: '176-12345678',
        flightNumber: 'EK201',
        airline: 'Emirates SkyCargo',
        departureAirport: 'DXB',
        arrivalAirport: 'JFK',
        chargeableWeight: 166.67, // Volumetric weight (higher)
        volumetricWeight: 166.67,
        specialHandling: []
      },
      
      // Pricing Intelligence
      pricingIntelligence: {
        marketRate: 1650,
        yourRate: 1530,
        savings: 120,
        savingsPercentage: 7.3,
        rateTrend: 'DOWN'
      },
      
      // Transit Time
      transitTime: {
        estimated: 22,
        scheduled: 22
      },
      
      // Tracking Events
      trackingEvents: [
        {
          id: 'EVT-1',
          timestamp: new Date('2025-01-05T08:30:00Z'),
          status: 'PICKED_UP',
          description: 'Cargo picked up from shipper',
          source: 'CARRIER'
        },
        {
          id: 'EVT-2',
          timestamp: new Date('2025-01-05T14:00:00Z'),
          status: 'IN_TRANSIT',
          description: 'Departed Dubai on EK201',
          location: { name: 'Dubai International Airport' },
          source: 'CARRIER'
        }
      ],
      
      documents: [],
      exceptions: [],
      alerts: [],
      
      createdBy: 'demo-user',
      tenantId
    }
  })
  console.log(`✅ Created: ${airShipment.shipmentNumber}\n`)
  
  // ============================================================================
  // DEMO 2: Sea Freight (Shanghai → Jeddah via Dubai) - MULTIMODAL
  // ============================================================================
  console.log('🚢 Creating multimodal sea freight demo shipment...')
  const seaShipment = await prisma.shipment.create({
    data: {
      id: 'SH-SEA-DEMO-001',
      shipmentNumber: 'SH-SEA-001',
      trackingNumber: 'TRK-SEA-001',
      type: 'FCL',
      mode: 'MULTIMODAL',
      status: 'BOOKED',
      priority: 'NORMAL',
      serviceLevel: 'STANDARD',
      
      // Parties
      consignorName: 'Shanghai Manufacturing Co.',
      consignorContact: '+86-21-12345678',
      consigneeName: 'Jeddah Trading LLC',
      consigneeContact: '+966-12-3456789',
      customerId: 'CUST-002',
      
      // Locations
      origin: {
        id: 'CNSHA',
        name: 'Port of Shanghai',
        type: 'PORT',
        address: {
          street: 'Port Area',
          city: 'Shanghai',
          postalCode: '200000',
          country: 'China',
          countryCode: 'CN'
        },
        portCode: 'CNSHA'
      },
      destination: {
        id: 'SAJED',
        name: 'Port of Jeddah',
        type: 'PORT',
        address: {
          street: 'Port Area',
          city: 'Jeddah',
          postalCode: '21424',
          country: 'Saudi Arabia',
          countryCode: 'SA'
        },
        portCode: 'SAJED'
      },
      
      // Cargo
      items: [
        {
          id: 'ITEM-2',
          sku: 'MACH-IND-500',
          description: 'Industrial Machinery - CNC Machine',
          quantity: 1,
          unit: 'SET',
          weight: 18000,
          volume: 65,
          value: 150000,
          currency: 'USD',
          hsCode: '8479.89.99',
          countryOfOrigin: 'CN'
        }
      ],
      totalWeight: 18000,
      totalVolume: 65,
      totalValue: 150000,
      currency: 'USD',
      totalContainers: 1,
      
      // Carrier
      carrierId: 'CARRIER-MSC',
      carrierName: 'MSC',
      carrierCode: 'MSCU',
      bookingNumber: 'BKG-SEA-20250104001',
      confirmationNumber: 'CONF-20250104001',
      blNumber: 'MSCU123456789',
      containerNumber: 'MSCU1234567',
      vesselName: 'MSC OSCAR',
      vesselIMO: 'IMO9778077',
      voyageNumber: 'V123W',
      
      // Dates
      pickupDate: new Date('2025-01-10T00:00:00Z'),
      estimatedDelivery: new Date('2025-01-30T00:00:00Z'),
      bookingDate: new Date('2025-01-04T10:00:00Z'),
      
      // Incoterms
      incoterms: 'CIF',
      
      // FCL Details
      fclDetails: {
        containerType: '40FT_HC',
        containerCount: 1,
        sealNumber: 'SEAL-12345',
        grossWeight: 20000,
        utilization: 85,
        cubeUtilization: 82
      },
      
      // Pricing
      freightCharges: {
        baseRate: 2000,
        currency: 'USD',
        thc: 150,
        baf: 200,
        subtotal: 2350,
        taxes: 0,
        total: 2350
      },
      
      // Transit Time
      transitTime: {
        estimated: 480, // 20 days
        scheduled: 480
      },
      
      trackingEvents: [
        {
          id: 'EVT-1',
          timestamp: new Date('2025-01-04T10:00:00Z'),
          status: 'BOOKED',
          description: 'Booking confirmed with MSC',
          source: 'CARRIER'
        }
      ],
      
      documents: [],
      exceptions: [],
      alerts: [],
      
      createdBy: 'demo-user',
      tenantId
    }
  })
  console.log(`✅ Created: ${seaShipment.shipmentNumber}\n`)
  
  // ============================================================================
  // Create Cross-Border Route for Sea Shipment
  // ============================================================================
  console.log('🌍 Creating cross-border route (China → UAE → KSA)...')
  const crossBorderRoute = await prisma.crossBorderRoute.create({
    data: {
      id: 'CBR-001',
      shipmentId: seaShipment.id,
      originCountry: 'China',
      destinationCountry: 'Saudi Arabia',
      transitCountries: [
        {
          country: 'United Arab Emirates',
          countryCode: 'AE',
          entryPort: { name: 'Jebel Ali Port', portCode: 'AEJEA' },
          exitPort: { name: 'Jebel Ali Port', portCode: 'AEJEA' },
          requiresCustoms: true,
          requiresTransitBond: false,
          requiresVisa: false
        }
      ],
      totalCountriesCrossed: 3,
      totalBorderCrossings: 2,
      estimatedTotalCustomsTime: 16,
      complexity: 'MODERATE',
      tenantId
    }
  })
  console.log(`✅ Created cross-border route with ${crossBorderRoute.totalCountriesCrossed} countries\n`)
  
  // ============================================================================
  // Create Duty Calculations
  // ============================================================================
  console.log('💰 Creating duty calculations...')
  const dutyUAE = await prisma.dutyCalculation.create({
    data: {
      id: 'DUTY-UAE-001',
      shipmentId: seaShipment.id,
      crossBorderRouteId: crossBorderRoute.id,
      country: 'United Arab Emirates',
      hsCode: '8479.89.99',
      customsValue: 150000,
      currency: 'USD',
      dutyRate: 0, // UAE has 0% for most items
      dutyAmount: 0,
      vatGSTRate: 5, // UAE VAT
      vatGSTAmount: 7500,
      totalDutyTax: 7500,
      calculatedAt: new Date(),
      tenantId
    }
  })
  
  const dutySA = await prisma.dutyCalculation.create({
    data: {
      id: 'DUTY-SA-001',
      shipmentId: seaShipment.id,
      crossBorderRouteId: crossBorderRoute.id,
      country: 'Saudi Arabia',
      hsCode: '8479.89.99',
      customsValue: 150000,
      currency: 'USD',
      dutyRate: 0, // 0% due to GCC-FTA!
      dutyAmount: 0,
      vatGSTRate: 15, // Saudi VAT
      vatGSTAmount: 22500,
      totalDutyTax: 22500,
      ftaApplied: {
        agreement: 'GCC Free Trade Agreement',
        originalRate: 5,
        reducedRate: 0,
        savings: 7500
      },
      calculatedAt: new Date(),
      tenantId
    }
  })
  console.log(`✅ Created duty calculations (FTA saved $7,500!)\n`)
  
  // ============================================================================
  // Create Container & VGM
  // ============================================================================
  console.log('📦 Creating container and VGM...')
  const container = await prisma.container.create({
    data: {
      id: 'CONT-001',
      containerNumber: 'MSCU1234567',
      containerType: '40FT_HC',
      sealNumber: 'SEAL-12345',
      shipmentId: seaShipment.id,
      isEmpty: false,
      status: 'STUFFED',
      tenantId
    }
  })
  
  const vgm = await prisma.vGM.create({
    data: {
      id: 'VGM-001',
      containerNumber: container.containerNumber,
      method: 'METHOD_1',
      grossMass: 20000,
      verifiedBy: 'BlueDXP System',
      verifiedAt: new Date(),
      submittedToTerminal: true,
      submissionReference: 'VGM-SUBMIT-001',
      certified: true,
      containerId: container.id,
      tenantId
    }
  })
  console.log(`✅ Created container ${container.containerNumber} with VGM ${vgm.grossMass}kg\n`)
  
  // ============================================================================
  // Create Bill of Lading
  // ============================================================================
  console.log('📄 Creating Bill of Lading...')
  const billOfLading = await prisma.billOfLading.create({
    data: {
      id: 'BL-001',
      blNumber: 'MSCU123456789',
      type: 'MASTER',
      shipmentId: seaShipment.id,
      shippingLineSCAC: 'MSCU',
      shippingLineName: 'Mediterranean Shipping Company',
      shipper: {
        name: 'Shanghai Manufacturing Co.',
        address: 'Shanghai, China',
        contact: '+86-21-12345678'
      },
      consignee: {
        name: 'Jeddah Trading LLC',
        address: 'Jeddah, Saudi Arabia',
        contact: '+966-12-3456789'
      },
      notifyParty: {
        name: 'Jeddah Trading LLC',
        address: 'Jeddah, Saudi Arabia',
        contact: '+966-12-3456789'
      },
      vessel: {
        name: 'MSC OSCAR',
        imoNumber: 'IMO9778077',
        voyageNumber: 'V123W'
      },
      containers: [
        {
          containerNumber: 'MSCU1234567',
          type: '40FT_HC',
          sealNumber: 'SEAL-12345'
        }
      ],
      cargo: {
        description: '1 SET Industrial Machinery - CNC Machine',
        packageType: 'CONTAINER',
        packageCount: 1,
        grossWeight: 18000,
        volume: 65
      },
      freightPayable: 'PREPAID',
      placeOfReceipt: 'Shanghai',
      placeOfDelivery: 'Jeddah',
      charges: {
        freight: 2000,
        thc: 150,
        baf: 200,
        currency: 'USD'
      },
      status: 'ISSUED',
      generatedAt: new Date(),
      tenantId
    }
  })
  console.log(`✅ Created B/L: ${billOfLading.blNumber}\n`)
  
  // ============================================================================
  // Create Multimodal Segments (Sea + Land)
  // ============================================================================
  console.log('🔄 Creating multimodal segments...')
  const segment1 = await prisma.multimodalSegment.create({
    data: {
      id: 'SEG-001',
      segmentId: 'SEG-SEA-001',
      shipmentId: seaShipment.id,
      sequence: 1,
      mode: 'SEA',
      origin: {
        name: 'Port of Shanghai',
        portCode: 'CNSHA',
        country: 'China'
      },
      destination: {
        name: 'Port of Jebel Ali',
        portCode: 'AEJEA',
        country: 'United Arab Emirates'
      },
      carrier: {
        id: 'CARRIER-MSC',
        name: 'MSC'
      },
      estimatedDeparture: new Date('2025-01-10T00:00:00Z'),
      estimatedArrival: new Date('2025-01-24T00:00:00Z'),
      distance: 6500,
      duration: 336, // 14 days
      cost: 2000,
      carbonFootprint: 650,
      status: 'PLANNED',
      seaDetails: {
        vesselName: 'MSC OSCAR',
        voyageNumber: 'V123W',
        containerNumber: 'MSCU1234567'
      },
      transshipmentRequired: true,
      transshipmentPoint: {
        name: 'Jebel Ali Port',
        portCode: 'AEJEA'
      },
      transshipmentDuration: 6,
      tenantId
    }
  })
  
  const segment2 = await prisma.multimodalSegment.create({
    data: {
      id: 'SEG-002',
      segmentId: 'SEG-LAND-001',
      shipmentId: seaShipment.id,
      sequence: 2,
      mode: 'LAND',
      origin: {
        name: 'Jebel Ali Port',
        portCode: 'AEJEA',
        country: 'United Arab Emirates'
      },
      destination: {
        name: 'Port of Jeddah',
        portCode: 'SAJED',
        country: 'Saudi Arabia'
      },
      estimatedDeparture: new Date('2025-01-24T06:00:00Z'),
      estimatedArrival: new Date('2025-01-25T18:00:00Z'),
      distance: 1400,
      duration: 36,
      cost: 800,
      carbonFootprint: 280,
      status: 'PLANNED',
      landDetails: {
        truckNumber: 'TRK-UAE-1234',
        vehicleType: 'TRAILER'
      },
      transshipmentRequired: false,
      tenantId
    }
  })
  console.log(`✅ Created ${2} multimodal segments (Sea + Land)\n`)
  
  // ============================================================================
  // Create State Transitions
  // ============================================================================
  console.log('🔄 Creating state transition logs...')
  await prisma.stateTransition.create({
    data: {
      id: 'ST-001',
      shipmentId: seaShipment.id,
      fromState: 'DRAFT',
      toState: 'BOOKED',
      success: true,
      automationsExecuted: [
        'generate_transport_documents',
        'screen_sanctions',
        'create_customs_declaration_draft'
      ],
      userId: 'demo-user',
      tenantId,
      timestamp: new Date()
    }
  })
  console.log(`✅ Created state transition log\n`)
  
  // ============================================================================
  // Create Sanctions Screening
  // ============================================================================
  console.log('🛡️  Creating sanctions screening log...')
  await prisma.sanctionsScreening.create({
    data: {
      id: 'SANC-001',
      shipmentId: seaShipment.id,
      passed: true,
      screenedEntities: [
        {
          entity: { type: 'CONSIGNOR', name: 'Shanghai Manufacturing Co.', country: 'CN' },
          screened: true,
          lists: ['OFAC_SDN', 'UN_1267', 'EU_SANCTIONS'],
          result: 'CLEAR'
        },
        {
          entity: { type: 'CONSIGNEE', name: 'Jeddah Trading LLC', country: 'SA' },
          screened: true,
          lists: ['OFAC_SDN', 'UN_1267', 'EU_SANCTIONS', 'SAUDI_SANCTIONS'],
          result: 'CLEAR'
        }
      ],
      lists: ['OFAC', 'UN', 'EU', 'HMT', 'SAUDI'],
      tenantId
    }
  })
  console.log(`✅ Sanctions screening passed (all entities clear)\n`)
  
  // ============================================================================
  // Create HS Code Classification
  // ============================================================================
  console.log('🏷️  Creating HS code classification...')
  await prisma.hSCodeClassification.create({
    data: {
      id: 'HSC-001',
      shipmentId: seaShipment.id,
      hsCode: '8479.89.99',
      description: 'Industrial Machinery - CNC Machine',
      confidence: 0.95,
      chapter: '84',
      heading: '8479',
      subheading: '847989',
      tariffCode: '8479.89.99',
      countrySpecific: [
        { country: 'CN', localHSCode: '8479.89.99' },
        { country: 'AE', localHSCode: '8479.89.99' },
        { country: 'SA', localHSCode: '8479.89.99' }
      ],
      verified: true,
      verificationSource: 'WCO_DATABASE',
      classifiedBy: 'AI',
      tenantId
    }
  })
  console.log(`✅ HS code classified: 8479.89.99 (95% confidence)\n`)
  
  // ============================================================================
  // Summary
  // ============================================================================
  console.log('═'.repeat(80))
  console.log('✅ TMS V2 DATABASE SEEDING COMPLETE!')
  console.log('═'.repeat(80))
  console.log('')
  console.log('Created:')
  console.log('  ✅ 2 Shipments (Air + Sea/Multimodal)')
  console.log('  ✅ 1 Cross-Border Route (3 countries)')
  console.log('  ✅ 2 Duty Calculations (with FTA savings)')
  console.log('  ✅ 1 Container + VGM')
  console.log('  ✅ 1 Bill of Lading')
  console.log('  ✅ 2 Multimodal Segments')
  console.log('  ✅ 1 State Transition')
  console.log('  ✅ 1 Sanctions Screening')
  console.log('  ✅ 1 HS Code Classification')
  console.log('')
  console.log('💰 FTA Savings Demonstrated: $7,500 (GCC-FTA UAE→KSA)')
  console.log('')
  console.log('🌐 View in Control Tower:')
  console.log('   http://localhost:3002/transportation/control-tower-v2')
  console.log('')
  console.log('═'.repeat(80))
}

seedTMSData()
  .then(() => {
    console.log('\n✅ Seed complete!\n')
    return prisma.$disconnect()
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    return prisma.$disconnect()
  })
