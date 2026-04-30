// Comprehensive Mock Data Generators for Enterprise WMS
// Covers SAP, Oracle, Manhattan, and Global WMS Systems

import { ASNData, OrderStatus, ASNStatus } from '@/types/asn'
import { format } from 'date-fns'
import { Tenant, Customer, Warehouse } from '@/types/tenant'
import { User, UserRole } from '@/types/user'

// Generate random IDs
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

// Generate random dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Generate random numbers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

// Material Master Data
export const generateMaterialMaster = (count: number = 100) => {
  const materials = [
    'Chemical Compound A', 'Chemical Compound B', 'Raw Material X', 'Raw Material Y',
    'Finished Product 1', 'Finished Product 2', 'Packaging Material', 'Safety Equipment',
    'Cleaning Supplies', 'Maintenance Parts', 'Office Supplies', 'IT Equipment',
    'Pharmaceutical Ingredient', 'Food Additive', 'Cosmetic Base', 'Industrial Solvent',
  ]
  
  const units = ['EA', 'KG', 'L', 'M', 'M2', 'M3', 'PAL', 'BOX', 'BAG', 'DRUM']
  const categories = ['HAZMAT', 'NON-HAZMAT', 'LIQUID', 'SOLID', 'GAS', 'POWDER', 'PHARMACEUTICAL', 'FOOD_GRADE']
  const materialTypes = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE', 'SPARE_PART']
  const lifecycleStatuses = ['DEVELOPMENT', 'ACTIVE', 'PHASE_OUT', 'OBSOLETE']
  
  return Array.from({ length: count }, (_, i) => {
    const basePrice = randomFloat(10, 1000)
    const standardCost = basePrice * (0.8 + Math.random() * 0.4) // 80-120% of base
    const lastCost = basePrice * (0.9 + Math.random() * 0.2) // 90-110% of base
    const avgCost = (standardCost + lastCost) / 2
    const temperatureControlled = Math.random() > 0.8
    const hasTemperatureRange = Math.random() > 0.8
    
    return {
      id: generateId('MAT'),
      materialNumber: `MAT-${String(i + 1).padStart(6, '0')}`,
      materialDescription: materials[randomInt(0, materials.length - 1)] + (i > materials.length ? ` ${Math.floor(i / materials.length)}` : ''),
      category: categories[randomInt(0, categories.length - 1)],
      materialType: materialTypes[randomInt(0, materialTypes.length - 1)],
      baseUnit: units[randomInt(0, units.length - 1)],
      weight: randomFloat(0.1, 1000),
      volume: randomFloat(0.01, 10),
      dimensions: {
        length: randomFloat(0.1, 5),
        width: randomFloat(0.1, 5),
        height: randomFloat(0.1, 5),
        unit: 'M',
      },
      hazardous: Math.random() > 0.7,
      temperatureControlled: temperatureControlled,
      minTemperature: hasTemperatureRange ? randomFloat(-20, 5) : undefined,
      maxTemperature: hasTemperatureRange ? randomFloat(2, 30) : undefined,
      batchManaged: Math.random() > 0.5,
      serialNumberManaged: Math.random() > 0.7,
      shelfLife: randomInt(30, 1095), // 30 days to 3 years
      reorderPoint: randomFloat(50, 500),
      maxStock: randomFloat(500, 5000),
      safetyStock: randomFloat(20, 200),
      leadTime: randomInt(1, 30), // days
      // Costing
      standardCost: parseFloat(standardCost.toFixed(2)),
      lastCost: parseFloat(lastCost.toFixed(2)),
      averageCost: parseFloat(avgCost.toFixed(2)),
      currency: 'SAR',
      // Lifecycle
      lifecycleStatus: lifecycleStatuses[randomInt(0, lifecycleStatuses.length - 1)],
      validFrom: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
      validTo: Math.random() > 0.8 ? randomDate(new Date(), new Date(Date.now() + 365 * 86400000)) : undefined,
      // Specifications
      specifications: {
        color: ['White', 'Clear', 'Yellow', 'Blue', 'Red', 'Green'][randomInt(0, 5)],
        grade: ['A', 'B', 'Premium', 'Standard', 'Industrial'][randomInt(0, 4)],
        purity: Math.random() > 0.5 ? `${randomFloat(90, 100).toFixed(1)}%` : undefined,
        ph: Math.random() > 0.7 ? randomFloat(4, 10).toFixed(1) : undefined,
        viscosity: Math.random() > 0.7 ? `${randomFloat(1, 1000).toFixed(0)} cP` : undefined,
      },
      // Compliance
      complianceStandards: Math.random() > 0.5 ? ['ISO_9001', 'FDA', 'CE'][randomInt(0, 2)] : undefined,
      msdsRequired: Math.random() > 0.6,
      msdsNumber: Math.random() > 0.6 ? `MSDS-${String(i + 1).padStart(6, '0')}` : undefined,
      // Vendor info
      preferredVendor: `VEND-${String(randomInt(1, 20)).padStart(4, '0')}`,
      preferredVendorName: `Vendor ${randomInt(1, 20)}`,
      // Storage
      storageConditions: temperatureControlled ? 'TEMPERATURE_CONTROLLED' : 'AMBIENT',
      storageClass: ['A', 'B', 'C', 'D', 'E'][randomInt(0, 4)],
      // Usage stats
      totalQuantityUsed: randomFloat(1000, 100000),
      lastUsedDate: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
      createdAt: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Vendor Master Data
export const generateVendorMaster = (count: number = 40) => {
  const vendors = [
    'Sika Manufacturing Ltd', 'BASF Corporation', 'Dow Chemical', 'DuPont',
    '3M Company', 'Honeywell International', 'Eastman Chemical', 'Celanese Corporation',
    'Ashland Inc', 'Huntsman Corporation', 'LyondellBasell', 'PPG Industries',
    'ExxonMobil Chemical', 'Shell Chemicals', 'Chevron Phillips', 'SABIC',
  ]
  
  const countries = ['UAE', 'USA', 'Germany', 'China', 'India', 'UK', 'France', 'Japan', 'Saudi Arabia', 'Kuwait']
  const vendorTypes = ['MANUFACTURER', 'DISTRIBUTOR', 'SUPPLIER', 'TRADER', 'IMPORTER']
  const ratingLevels = ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR', 'CRITICAL']
  
  return Array.from({ length: count }, (_, i) => {
    const totalPOs = randomInt(5, 200)
    const totalValue = randomFloat(100000, 10000000)
    const avgPOValue = totalValue / totalPOs
    const onTimeDelivery = randomFloat(70, 100)
    const qualityScore = randomFloat(3.0, 5.0)
    const priceCompetitiveness = randomFloat(3.0, 5.0)
    const overallRating = (onTimeDelivery / 20 + qualityScore + priceCompetitiveness) / 3
    
    let rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'CRITICAL'
    if (overallRating >= 4.5) rating = 'EXCELLENT'
    else if (overallRating >= 4.0) rating = 'GOOD'
    else if (overallRating >= 3.5) rating = 'AVERAGE'
    else if (overallRating >= 3.0) rating = 'POOR'
    else rating = 'CRITICAL'
    
    return {
      id: generateId('VND'),
      vendorNumber: `VND-${String(i + 1).padStart(6, '0')}`,
      vendorName: vendors[randomInt(0, vendors.length - 1)] + (i > vendors.length ? ` ${i}` : ''),
      country: countries[randomInt(0, countries.length - 1)],
      city: `City ${i + 1}`,
      address: `${randomInt(1, 999)} Industrial Street`,
      postalCode: `${randomInt(10000, 99999)}`,
      contactPerson: `Contact ${i + 1}`,
      email: `vendor${i + 1}@example.com`,
      phone: `+971${randomInt(500000000, 599999999)}`,
      paymentTerms: ['NET30', 'NET60', 'NET90', 'IMMEDIATE', 'PREPAID'][randomInt(0, 4)],
      currency: ['SAR', 'USD', 'EUR'][randomInt(0, 2)],
      status: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_APPROVAL'][randomInt(0, 3)],
      vendorType: vendorTypes[randomInt(0, vendorTypes.length - 1)],
      // Performance Metrics
      totalPurchaseOrders: totalPOs,
      totalPurchaseValue: parseFloat(totalValue.toFixed(2)),
      averagePOValue: parseFloat(avgPOValue.toFixed(2)),
      onTimeDeliveryRate: parseFloat(onTimeDelivery.toFixed(1)),
      qualityScore: parseFloat(qualityScore.toFixed(1)),
      priceCompetitiveness: parseFloat(priceCompetitiveness.toFixed(1)),
      overallRating: parseFloat(overallRating.toFixed(1)),
      rating: rating,
      // Compliance
      isoCertified: Math.random() > 0.3,
      isoCertification: Math.random() > 0.3 ? ['ISO_9001', 'ISO_14001', 'ISO_45001'][randomInt(0, 2)] : undefined,
      fdaApproved: Math.random() > 0.7,
      halalCertified: Math.random() > 0.6,
      complianceScore: randomFloat(70, 100),
      // Lead Times
      averageLeadTime: randomInt(7, 45), // days
      minimumLeadTime: randomInt(3, 14), // days
      maximumLeadTime: randomInt(30, 90), // days
      // Additional Info
      taxId: `TAX-${String(i + 1).padStart(10, '0')}`,
      registrationNumber: `REG-${String(i + 1).padStart(8, '0')}`,
      website: `www.${vendors[randomInt(0, vendors.length - 1)].toLowerCase().replace(/\s+/g, '')}.com`,
      lastOrderDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      firstOrderDate: randomDate(new Date(Date.now() - 730 * 86400000), new Date(Date.now() - 30 * 86400000)),
      daysSinceLastOrder: Math.floor((new Date().getTime() - new Date(randomDate(new Date(Date.now() - 30 * 86400000), new Date())).getTime()) / (1000 * 60 * 60 * 24)),
      notes: rating === 'CRITICAL' ? 'Performance issues - Review required' : rating === 'EXCELLENT' ? 'Preferred vendor - Priority sourcing' : undefined,
      createdAt: randomDate(new Date(Date.now() - 730 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Customer Master Data
export const generateCustomerMaster = (count: number = 50) => {
  const customers = [
    'ABC Construction LLC', 'XYZ Manufacturing', 'Global Industries', 'Tech Solutions Inc',
    'Building Materials Co', 'Industrial Supplies Ltd', 'Construction Partners', 'Material Distributors',
    'Supply Chain Solutions', 'Logistics Experts', 'Trade Partners', 'Commercial Builders',
    'Premium Chemicals Ltd', 'Elite Trading Co', 'Prime Materials Inc', 'Advanced Solutions Group',
  ]
  
  const serviceTiers = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'STANDARD']
  const industries = ['CONSTRUCTION', 'MANUFACTURING', 'CHEMICAL', 'PHARMACEUTICAL', 'FOOD_BEVERAGE', 'RETAIL', 'LOGISTICS', 'OTHER']
  
  return Array.from({ length: count }, (_, i) => {
    const tier = serviceTiers[randomInt(0, serviceTiers.length - 1)]
    const totalOrders = randomInt(10, 500)
    const totalValue = randomFloat(50000, 5000000)
    const avgOrderValue = totalValue / totalOrders
    const onTimeDelivery = randomFloat(85, 100)
    const customerSatisfaction = randomFloat(3.5, 5.0)
    const paymentPerformance = randomFloat(80, 100)
    
    return {
      id: generateId('CUST'),
      customerNumber: `CUST-${String(i + 1).padStart(6, '0')}`,
      customerName: customers[randomInt(0, customers.length - 1)] + (i > customers.length ? ` ${i}` : ''),
      country: 'Saudi Arabia',
      city: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina'][randomInt(0, 5)],
      address: `${randomInt(1, 999)} Industrial Area`,
      postalCode: `${randomInt(11564, 12836)}`,
      contactPerson: `Contact ${i + 1}`,
      email: `customer${i + 1}@example.com`,
      phone: `+966${['50', '51', '52', '53', '54'][randomInt(0, 4)]}${randomInt(1000000, 9999999)}`,
      paymentTerms: ['NET30', 'NET60', 'NET90', 'PREPAID', 'CASH_ON_DELIVERY'][randomInt(0, 4)],
      creditLimit: randomFloat(10000, 1000000),
      creditUsed: randomFloat(0, 800000),
      currency: ['SAR', 'USD', 'EUR'][randomInt(0, 2)],
      status: ['ACTIVE', 'INACTIVE', 'SUSPENDED'][randomInt(0, 2)],
      serviceTier: tier,
      industry: industries[randomInt(0, industries.length - 1)],
      // Performance Metrics
      totalOrders,
      totalValue: parseFloat(totalValue.toFixed(2)),
      averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      onTimeDeliveryRate: parseFloat(onTimeDelivery.toFixed(1)),
      customerSatisfactionScore: parseFloat(customerSatisfaction.toFixed(1)),
      paymentPerformance: parseFloat(paymentPerformance.toFixed(1)),
      lastOrderDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      firstOrderDate: randomDate(new Date(Date.now() - 365 * 86400000), new Date(Date.now() - 30 * 86400000)),
      daysSinceLastOrder: Math.floor((new Date().getTime() - new Date(randomDate(new Date(Date.now() - 30 * 86400000), new Date())).getTime()) / (1000 * 60 * 60 * 24)),
      // Service Level Agreements
      slaResponseTime: tier === 'PLATINUM' ? '1 hour' : tier === 'GOLD' ? '4 hours' : tier === 'SILVER' ? '8 hours' : '24 hours',
      slaDeliveryTime: tier === 'PLATINUM' ? 'Same Day' : tier === 'GOLD' ? 'Next Day' : tier === 'SILVER' ? '2-3 Days' : 'Standard',
      prioritySupport: tier === 'PLATINUM' || tier === 'GOLD',
      dedicatedAccountManager: tier === 'PLATINUM',
      // Additional Info
      taxId: `TAX-${String(i + 1).padStart(10, '0')}`,
      registrationNumber: `REG-${String(i + 1).padStart(8, '0')}`,
      website: `www.${customers[randomInt(0, customers.length - 1)].toLowerCase().replace(/\s+/g, '')}.com`,
      notes: tier === 'PLATINUM' ? 'Premium customer - Priority handling required' : undefined,
      createdAt: randomDate(new Date(Date.now() - 730 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Storage Location Data
export const generateStorageLocations = (count: number = 100) => {
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const aisles = Array.from({ length: 20 }, (_, i) => i + 1)
  const racks = Array.from({ length: 10 }, (_, i) => i + 1)
  const levels = [1, 2, 3, 4, 5]
  const locationTypes = ['BULK', 'RACK', 'FLOOR', 'COLD_STORAGE', 'HAZMAT', 'QUARANTINE', 'PICKING', 'STAGING']
  
  return Array.from({ length: count }, (_, i) => {
    const zone = zones[randomInt(0, zones.length - 1)]
    const aisle = aisles[randomInt(0, aisles.length - 1)]
    const rack = racks[randomInt(0, racks.length - 1)]
    const level = levels[randomInt(0, levels.length - 1)]
    const locationType = locationTypes[randomInt(0, locationTypes.length - 1)]
    
    const capacity = randomFloat(10, 1000) // cubic meters or pallets
    const currentStock = randomFloat(0, capacity * 0.95)
    const utilization = (currentStock / capacity) * 100
    const availableCapacity = capacity - currentStock
    
    const maxWeight = randomFloat(1000, 10000) // kg
    const currentWeight = randomFloat(0, maxWeight * 0.9)
    const weightUtilization = (currentWeight / maxWeight) * 100
    
    return {
      id: generateId('LOC'),
      locationCode: `${zone}-${String(aisle).padStart(2, '0')}-${String(rack).padStart(2, '0')}-${level}`,
      zone,
      aisle: String(aisle),
      rack: String(rack),
      level: String(level),
      locationType,
      // Capacity
      capacity: parseFloat(capacity.toFixed(2)),
      currentStock: parseFloat(currentStock.toFixed(2)),
      availableCapacity: parseFloat(availableCapacity.toFixed(2)),
      utilization: parseFloat(utilization.toFixed(1)),
      // Weight Capacity
      maxWeight: parseFloat(maxWeight.toFixed(2)),
      currentWeight: parseFloat(currentWeight.toFixed(2)),
      availableWeight: parseFloat((maxWeight - currentWeight).toFixed(2)),
      weightUtilization: parseFloat(weightUtilization.toFixed(1)),
      // Dimensions
      length: randomFloat(1, 5),
      width: randomFloat(1, 5),
      height: randomFloat(1, 5),
      // Attributes
      temperatureControlled: locationType === 'COLD_STORAGE' || Math.random() > 0.7,
      minTemperature: locationType === 'COLD_STORAGE' ? randomFloat(-20, 5) : undefined,
      maxTemperature: locationType === 'COLD_STORAGE' ? randomFloat(2, 10) : undefined,
      hazardous: locationType === 'HAZMAT' || Math.random() > 0.8,
      requiresEquipment: locationType === 'RACK' || Math.random() > 0.6,
      equipmentType: locationType === 'RACK' ? ['FORKLIFT', 'REACH_TRUCK', 'PALLET_JACK'][randomInt(0, 2)] : undefined,
      // Status
      status: utilization > 90 ? 'FULL' : utilization > 75 ? 'NEAR_FULL' : currentStock > 0 ? 'OCCUPIED' : 'AVAILABLE',
      // Material Count
      materialCount: randomInt(0, 10),
      batchCount: randomInt(0, 5),
      // Last Activity
      lastPutaway: Math.random() > 0.3 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      lastPicking: Math.random() > 0.4 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      lastCycleCount: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 30 * 86400000), new Date()) : undefined,
      // Coordinates
      coordinates: {
        x: aisle * 2.5,
        y: rack * 1.5,
        z: (typeof level === 'string' ? parseInt(level) : level) * 0.5,
      },
      createdAt: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Purchase Order Data
export const generatePurchaseOrders = (count: number = 50): any[] => {
  const statuses: OrderStatus[] = ['CREATED', 'CONFIRMED', 'PICK_RELEASED', 'PICKING', 'PICKED', 'DISPATCHED', 'COMPLETED']
  
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('PO'),
    poNumber: `PO-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
    vendorNumber: `VND-${String(randomInt(1, 30)).padStart(6, '0')}`,
    vendorName: `Vendor ${randomInt(1, 12)}`,
    orderDate: randomDate(new Date(2024, 0, 1), new Date()),
    expectedDeliveryDate: randomDate(new Date(), new Date(2024, 11, 31)),
    status: statuses[randomInt(0, statuses.length - 1)],
    totalValue: randomFloat(1000, 100000),
    currency: 'SAR',
    totalItems: randomInt(1, 50),
    totalQuantity: randomFloat(10, 1000),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)] as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    items: Array.from({ length: randomInt(1, 10) }, () => ({
      materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
      quantity: randomFloat(1, 100),
      unit: 'EA',
      price: randomFloat(10, 1000),
    })),
  }))
}

// Sales Order Data
export const generateSalesOrders = (count: number = 60) => {
  const statuses: OrderStatus[] = ['CREATED', 'CONFIRMED', 'PICK_RELEASED', 'PICKING', 'PICKED', 'DISPATCHED', 'DELIVERED', 'COMPLETED']
  
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('SO'),
    soNumber: `SO-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
    customerNumber: `CUST-${String(randomInt(1, 40)).padStart(6, '0')}`,
    customerName: `Customer ${randomInt(1, 12)}`,
    orderDate: randomDate(new Date(2024, 0, 1), new Date()),
    expectedDeliveryDate: randomDate(new Date(), new Date(2024, 11, 31)),
    status: statuses[randomInt(0, statuses.length - 1)],
    totalValue: randomFloat(1000, 100000),
    currency: 'SAR',
    totalItems: randomInt(1, 50),
    totalQuantity: randomFloat(10, 1000),
    priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)],
    items: Array.from({ length: randomInt(1, 10) }, () => ({
      materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
      quantity: randomFloat(1, 100),
      unit: 'EA',
      price: randomFloat(10, 1000),
    })),
  }))
}

// Inventory Stock Data
export const generateInventoryStock = (count: number = 200) => {
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('STK'),
    materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
    materialDescription: `Material ${randomInt(1, 12)}`,
    storageLocation: `A-${String(randomInt(1, 20)).padStart(2, '0')}-${String(randomInt(1, 10)).padStart(2, '0')}-${randomInt(1, 4)}`,
    quantity: randomFloat(0, 1000),
    reservedQuantity: randomFloat(0, 100),
    availableQuantity: randomFloat(0, 900),
    unit: 'EA',
    batchNumber: `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}`,
    expiryDate: randomDate(new Date(), new Date(2025, 11, 31)),
    valuation: randomFloat(100, 10000),
    currency: 'SAR',
    lastMovementDate: randomDate(new Date(2024, 0, 1), new Date()),
  }))
}

// Cycle Count Data (World-Class Cycle Counting Module)
export const generateCycleCounts = (count: number = 50) => {
  const methods: Array<'ABC_ANALYSIS' | 'RANDOM' | 'LOCATION_BASED' | 'FREQUENCY_BASED' | 'VALUE_BASED' | 'CONTROL_GROUP' | 'BLIND_COUNT' | 'OPEN_COUNT' | 'SPOT_CHECK' | 'CONTINUOUS' | 'AI_OPTIMIZED'> = 
    ['ABC_ANALYSIS', 'RANDOM', 'LOCATION_BASED', 'FREQUENCY_BASED', 'VALUE_BASED', 'CONTROL_GROUP', 'BLIND_COUNT', 'OPEN_COUNT', 'SPOT_CHECK', 'CONTINUOUS', 'AI_OPTIMIZED']
  const statuses: Array<'PLANNED' | 'SCHEDULED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'ADJUSTED' | 'REJECTED'> = 
    ['PLANNED', 'SCHEDULED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REVIEW_REQUIRED', 'ADJUSTED', 'REJECTED']
  
  const zones = ['A', 'B', 'C', 'D', 'E']
  const aisles = Array.from({ length: 20 }, (_, i) => i + 1)
  const racks = Array.from({ length: 10 }, (_, i) => i + 1)
  const shelves = [1, 2, 3, 4]
  
  const materials = generateMaterialMaster(50)
  const locations = Array.from({ length: 100 }, (_, i) => {
    const zone = zones[randomInt(0, zones.length - 1)]
    const aisle = aisles[randomInt(0, aisles.length - 1)]
    const rack = racks[randomInt(0, racks.length - 1)]
    const shelf = shelves[randomInt(0, shelves.length - 1)]
    
    return {
      id: `LOC-${i}`,
      locationCode: `${zone}-${String(aisle).padStart(2, '0')}-${String(rack).padStart(2, '0')}-${shelf}`,
      zone,
      aisle: String(aisle),
      rack: String(rack),
      shelf: String(shelf),
      bin: String(randomInt(1, 10)),
      coordinates: {
        x: aisle * 2.5,
        y: rack * 1.5,
        z: shelf * 0.5,
      },
      accessibility: ['EASY', 'MEDIUM', 'DIFFICULT'][randomInt(0, 2)] as 'EASY' | 'MEDIUM' | 'DIFFICULT',
      requiresEquipment: Math.random() > 0.7,
      equipmentType: Math.random() > 0.7 ? ['FORKLIFT', 'REACH_TRUCK', 'LADDER', 'NONE'][randomInt(0, 3)] as any : undefined,
    }
  })
  
  return Array.from({ length: count }, (_, i) => {
    const method = methods[randomInt(0, methods.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)]
    
    const itemCount = randomInt(1, 20)
    const items = Array.from({ length: itemCount }, (_, j) => {
      const material = materials[randomInt(0, materials.length - 1)]
      const location = locations[randomInt(0, locations.length - 1)]
      const bookQty = randomFloat(0, 1000)
      const countedQty = status === 'COMPLETED' || status === 'ADJUSTED'
        ? bookQty + randomFloat(-50, 50)
        : undefined
      const variance = countedQty !== undefined ? countedQty - bookQty : undefined
      const variancePercentage = variance !== undefined && bookQty > 0
        ? (variance / bookQty) * 100
        : undefined
      const varianceValue = variance !== undefined
        ? variance * material.weight * randomFloat(10, 100) // Approximate value
        : undefined
      
      let varianceSeverity: 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL' = 'NONE'
      if (variancePercentage !== undefined) {
        const absVariance = Math.abs(variancePercentage)
        if (absVariance === 0) varianceSeverity = 'NONE'
        else if (absVariance <= 1) varianceSeverity = 'MINOR'
        else if (absVariance <= 5) varianceSeverity = 'MODERATE'
        else if (absVariance <= 10) varianceSeverity = 'MAJOR'
        else varianceSeverity = 'CRITICAL'
      }
      
      return {
        id: `ITEM-${i}-${j}`,
        materialNumber: material.materialNumber,
        materialDescription: material.materialDescription,
        batchNumber: Math.random() > 0.5 ? `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}` : undefined,
        serialNumber: Math.random() > 0.7 ? `SER-${String(randomInt(1, 1000)).padStart(6, '0')}` : undefined,
        location: location,
        bookQuantity: bookQty,
        countedQuantity: countedQty,
        unit: material.baseUnit,
        unitPrice: randomFloat(10, 1000),
        totalValue: bookQty * randomFloat(10, 1000),
        variance,
        variancePercentage,
        varianceValue,
        varianceSeverity,
        status: status === 'COMPLETED' || status === 'ADJUSTED' 
          ? (Math.random() > 0.1 ? 'VERIFIED' : 'COUNTED')
          : status === 'IN_PROGRESS' 
          ? 'COUNTING' 
          : 'PENDING' as any,
        countedAt: status === 'COMPLETED' || status === 'ADJUSTED' 
          ? randomDate(new Date(Date.now() - 86400000), new Date())
          : undefined,
        countedBy: status !== 'PLANNED' ? `Counter ${randomInt(1, 10)}` : undefined,
        verifiedAt: status === 'COMPLETED' || status === 'ADJUSTED' 
          ? randomDate(new Date(Date.now() - 86400000), new Date())
          : undefined,
        verifiedBy: status === 'COMPLETED' || status === 'ADJUSTED' 
          ? `Verifier ${randomInt(1, 5)}` 
          : undefined,
        barcode: `BC-${String(randomInt(100000, 999999))}`,
        qrCode: `QR-${String(randomInt(100000, 999999))}`,
      }
    })
    
    const countedItems = items.filter(item => item.status === 'COUNTED' || item.status === 'VERIFIED').length
    const completionPercentage = (countedItems / itemCount) * 100
    
    const totalVariance = items.reduce((sum, item) => sum + (item.variance || 0), 0)
    const totalVarianceValue = items.reduce((sum, item) => sum + Math.abs(item.varianceValue || 0), 0)
    const averageVariance = items.length > 0
      ? items.reduce((sum, item) => sum + Math.abs(item.variancePercentage || 0), 0) / items.length
      : 0
    const accuracyRate = items.length > 0
      ? (items.filter(item => item.variancePercentage !== undefined && Math.abs(item.variancePercentage) <= 1).length / items.length) * 100
      : 0
    
    const itemsWithVariance = items.filter(item => item.variance !== undefined && Math.abs(item.variance) > 0.01).length
    const itemsWithinTolerance = items.filter(item => item.variancePercentage !== undefined && Math.abs(item.variancePercentage) <= 1).length
    const itemsOutsideTolerance = itemsWithVariance - itemsWithinTolerance
    
    const assignedAt = status !== 'PLANNED' 
      ? randomDate(new Date(Date.now() - 86400000), new Date())
      : undefined
    const startedAt = status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'ADJUSTED'
      ? randomDate(assignedAt || new Date(Date.now() - 86400000), new Date())
      : undefined
    const completedAt = status === 'COMPLETED' || status === 'ADJUSTED'
      ? randomDate(startedAt || new Date(Date.now() - 86400000), new Date())
      : undefined
    
    const adjustments = items
      .filter(item => item.variance !== undefined && Math.abs(item.variance) > 0.01)
      .map(item => ({
        id: `ADJ-${item.id}`,
        itemId: item.id,
        materialNumber: item.materialNumber,
        location: item.location.locationCode,
        bookQuantity: item.bookQuantity,
        countedQuantity: item.countedQuantity || 0,
        adjustmentQuantity: item.variance || 0,
        adjustmentValue: item.varianceValue || 0,
        reason: 'Variance detected',
        rootCause: ['COUNTING_ERROR', 'DATA_ENTRY_ERROR', 'THEFT', 'DAMAGE', 'LOCATION_ERROR'][randomInt(0, 4)] as any,
        approvedBy: status === 'ADJUSTED' ? `Approver ${randomInt(1, 5)}` : undefined,
        approvedAt: status === 'ADJUSTED' ? randomDate(completedAt || new Date(Date.now() - 86400000), new Date()) : undefined,
        postedAt: status === 'ADJUSTED' ? randomDate(completedAt || new Date(Date.now() - 86400000), new Date()) : undefined,
        status: status === 'ADJUSTED' ? 'POSTED' : 'PENDING' as any,
      }))
    
    const rootCauseAnalysis = items
      .filter(item => item.variance !== undefined && Math.abs(item.variance) > 0.01)
      .slice(0, Math.floor(itemsWithVariance * 0.5)) // Analyze 50% of variances
      .map(item => ({
        id: `RCA-${item.id}`,
        itemId: item.id,
        category: ['COUNTING_ERROR', 'DATA_ENTRY_ERROR', 'THEFT', 'DAMAGE', 'LOCATION_ERROR', 'RECEIVING_ERROR', 'SHIPPING_ERROR'][randomInt(0, 6)] as any,
        description: `Root cause analysis for variance in ${item.materialNumber}`,
        probability: randomFloat(0.5, 1.0),
        evidence: ['Historical pattern', 'Location difficulty', 'Material characteristics'],
        recommendedAction: 'Review counting procedures and location accessibility',
        analyzedAt: completedAt || new Date(),
        analyzedBy: `Analyst ${randomInt(1, 3)}`,
      }))
    
    return {
      id: `CC-${Date.now()}-${i}`,
      countNumber: `CC-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      countType: method as any,
      status: status as any,
      scheduledDate: status === 'SCHEDULED' || status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'ADJUSTED'
        ? randomDate(new Date(Date.now() - 7 * 86400000), new Date())
        : undefined,
      scheduledTime: status === 'SCHEDULED' || status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'ADJUSTED'
        ? `${String(randomInt(8, 17)).padStart(2, '0')}:00`
        : undefined,
      assignedTo: status !== 'PLANNED' ? `COUNTER-${randomInt(1, 10)}` : undefined,
      assignedToName: status !== 'PLANNED' ? `Counter ${randomInt(1, 10)}` : undefined,
      assignedAt,
      startedAt,
      completedAt,
      items,
      totalItems: itemCount,
      countedItems,
      completionPercentage,
      locationScope: {
        type: ['SINGLE', 'ZONE', 'AISLE', 'WAREHOUSE'][randomInt(0, 3)] as any,
        locations: items.map(item => item.location.locationCode),
        zones: Array.from(new Set(items.map(item => item.location.zone))),
      },
      parameters: {
        blindCount: method === 'BLIND_COUNT',
        allowPartialCount: true,
        requireVerification: Math.random() > 0.3,
        tolerancePercentage: 1,
        autoAdjust: Math.random() > 0.5,
        requireApproval: Math.random() > 0.4,
      },
      results: {
        totalVariance,
        totalVarianceValue,
        averageVariance,
        accuracyRate,
        itemsWithVariance,
        itemsWithinTolerance,
        itemsOutsideTolerance,
      },
      adjustments,
      adjustmentStatus: status === 'ADJUSTED' ? 'POSTED' : adjustments.length > 0 ? 'PENDING' : 'PENDING' as any,
      adjustedAt: status === 'ADJUSTED' ? completedAt : undefined,
      adjustedBy: status === 'ADJUSTED' ? `Adjuster ${randomInt(1, 5)}` : undefined,
      rootCauseAnalysis,
      qualityScore: accuracyRate,
      requiresReview: itemsOutsideTolerance > 0 || averageVariance > 5,
      reviewNotes: itemsOutsideTolerance > 0 ? 'High variance detected, requires review' : undefined,
      reviewedBy: status === 'ADJUSTED' ? `Reviewer ${randomInt(1, 3)}` : undefined,
      reviewedAt: status === 'ADJUSTED' ? randomDate(completedAt || new Date(Date.now() - 86400000), new Date()) : undefined,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Counter Data
export const generateCounters = (count: number = 15) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `COUNTER-${i + 1}`,
    name: `Counter ${i + 1}`,
    employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
    currentCount: Math.random() > 0.5 ? `CC-${randomInt(1, 50)}` : undefined,
    status: ['AVAILABLE', 'COUNTING', 'ON_BREAK', 'OFFLINE'][randomInt(0, 3)] as any,
    performance: {
      totalCounts: randomInt(50, 500),
      averageAccuracy: randomFloat(95, 100),
      averageSpeed: randomFloat(20, 100), // items per hour
      totalItemsCounted: randomInt(500, 5000),
      qualityScore: randomFloat(95, 100),
    },
    location: {
      x: randomFloat(0, 100),
      y: randomFloat(0, 100),
      zone: ['A', 'B', 'C', 'D', 'E'][i % 5],
    },
    equipment: Math.random() > 0.5 ? ['SCANNER', 'TABLET'] : ['SCANNER'],
    lastUpdate: new Date(),
  }))
}

// Carrier Data
export const generateCarriers = (count: number = 20) => {
  const carriers = [
    'Wajeeh Transport', 'DHL Logistics', 'Aramex', 'FedEx', 'UPS',
    'TNT Express', 'Schenker', 'Kuehne + Nagel', 'DB Schenker', 'CEVA Logistics',
  ]
  
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('CAR'),
    carrierCode: `CAR-${String(i + 1).padStart(4, '0')}`,
    carrierName: carriers[randomInt(0, carriers.length - 1)] + (i > carriers.length ? ` ${i}` : ''),
    contactPerson: `Contact ${i + 1}`,
    email: `carrier${i + 1}@example.com`,
    phone: `+971${randomInt(500000000, 599999999)}`,
    serviceTypes: ['LOCAL', 'INTERNATIONAL', 'EXPRESS', 'STANDARD'].slice(0, randomInt(1, 4)),
    status: ['ACTIVE', 'INACTIVE'][randomInt(0, 1)],
    rating: randomFloat(3.5, 5.0),
    totalShipments: randomInt(100, 10000),
  }))
}

// Work Center Data
export const generateWorkCenters = (count: number = 15) => {
  const types = ['RECEIVING', 'PUTAWAY', 'PICKING', 'DISPATCHING', 'QC', 'CROSS_DOCK']
  
  return Array.from({ length: count }, (_, i) => ({
    id: generateId('WC'),
    workCenterCode: `WC-${String(i + 1).padStart(4, '0')}`,
    workCenterName: `Work Center ${i + 1}`,
    type: types[randomInt(0, types.length - 1)],
    location: `Zone ${String.fromCharCode(65 + (i % 5))}`,
    capacity: randomInt(1, 10),
    currentLoad: randomInt(0, 10),
    utilization: randomFloat(0, 100),
    status: ['ACTIVE', 'MAINTENANCE', 'IDLE'][randomInt(0, 2)],
    assignedPersonnel: randomInt(1, 5),
  }))
}

// Inspection Lot Data - Multi-stage quality inspections with standards compliance
export const generateInspectionLots = (count: number = 50) => {
  const statuses = ['CREATED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'RELEASED', 'QUARANTINED']
  const inspectionTypes = ['INCOMING', 'IN_PROCESS', 'FINAL', 'SAMPLE', 'RETURN']
  const qualityStandards = ['ISO_9001', 'ISO_14001', 'FDA', 'CE', 'HALAL', 'CUSTOM']
  const inspectionStages = ['VISUAL', 'DIMENSIONAL', 'FUNCTIONAL', 'CHEMICAL', 'MICROBIOLOGICAL', 'PACKAGING']
  
  return Array.from({ length: count }, (_, i) => {
    const status = statuses[randomInt(0, statuses.length - 1)]
    const inspectionType = inspectionTypes[randomInt(0, inspectionTypes.length - 1)]
    const standard = qualityStandards[randomInt(0, qualityStandards.length - 1)]
    const numStages = randomInt(2, 5)
    const stages = inspectionStages.slice(0, numStages).map((stage, idx) => ({
      stageName: stage,
      sequence: idx + 1,
      status: idx === 0 ? 'IN_PROGRESS' : idx < numStages - 1 ? 'PENDING' : 'PENDING',
      passed: idx === 0 ? Math.random() > 0.2 : null,
      inspector: `Inspector ${randomInt(1, 5)}`,
      inspectionDate: idx === 0 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : null,
      notes: idx === 0 ? (Math.random() > 0.2 ? 'All parameters within specification' : 'Minor deviation noted') : null,
    }))
    
    const passed = stages.every(s => s.passed !== false)
    const allCompleted = stages.every(s => s.status !== 'PENDING')
    
    return {
      id: generateId('INSP'),
      inspectionLotNumber: `INSP-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
      materialDescription: `Material ${randomInt(1, 50)}`,
      batchNumber: `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}`,
      quantity: randomFloat(10, 1000),
      unit: 'KG',
      status,
      inspectionType,
      qualityStandard: standard,
      inspector: `Inspector ${randomInt(1, 5)}`,
      inspectionDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      result: passed && allCompleted ? 'PASSED' : !passed ? 'FAILED' : 'IN_PROGRESS',
      stages,
      certificateNumber: passed && allCompleted && Math.random() > 0.3 ? `CERT-${String(i + 1).padStart(6, '0')}` : undefined,
      ncrNumber: !passed ? `NCR-${String(i + 1).padStart(6, '0')}` : undefined,
      vendorNumber: `VEND-${String(randomInt(1, 20)).padStart(4, '0')}`,
      vendorName: `Vendor ${randomInt(1, 20)}`,
      poNumber: `PO-${String(randomInt(1, 100)).padStart(6, '0')}`,
      grNumber: `GR-${String(randomInt(1, 100)).padStart(6, '0')}`,
      location: `WH-${['A', 'B', 'C'][i % 3]}-${String(randomInt(1, 10)).padStart(2, '0')}`,
      quarantineLocation: status === 'QUARANTINED' ? `QUAR-${String(randomInt(1, 5)).padStart(2, '0')}` : undefined,
      qualityScore: passed ? randomFloat(85, 100) : randomFloat(40, 79),
      defectsFound: !passed ? randomInt(1, 5) : 0,
      defectsDescription: !passed ? 'Minor quality issues detected' : undefined,
      requiresReinspection: !passed && Math.random() > 0.5,
      reinspectionDate: !passed && Math.random() > 0.5 ? randomDate(new Date(), new Date(Date.now() + 7 * 86400000)) : undefined,
      releasedDate: status === 'RELEASED' ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      releasedBy: status === 'RELEASED' ? `Quality Manager ${randomInt(1, 3)}` : undefined,
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Picking Task Data (World-Class Picking Module)
export const generatePickingTasks = (count: number = 50) => {
  const strategies: Array<'DISCRETE' | 'BATCH' | 'WAVE' | 'ZONE' | 'CLUSTER' | 'PICK_TO_CART' | 'VOICE' | 'AUTO'> = 
    ['DISCRETE', 'BATCH', 'WAVE', 'ZONE', 'CLUSTER', 'PICK_TO_CART', 'VOICE', 'AUTO']
  const statuses: Array<'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PARTIAL'> = 
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL']
  const priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'> = 
    ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
  
  const zones = ['A', 'B', 'C', 'D', 'E']
  const aisles = Array.from({ length: 20 }, (_, i) => i + 1)
  const racks = Array.from({ length: 10 }, (_, i) => i + 1)
  const shelves = [1, 2, 3, 4]
  
  const locations = Array.from({ length: 100 }, (_, i) => {
    const zone = zones[randomInt(0, zones.length - 1)]
    const aisle = aisles[randomInt(0, aisles.length - 1)]
    const rack = racks[randomInt(0, racks.length - 1)]
    const shelf = shelves[randomInt(0, shelves.length - 1)]
    
    return {
      id: `LOC-${i}`,
      locationCode: `${zone}-${String(aisle).padStart(2, '0')}-${String(rack).padStart(2, '0')}-${shelf}`,
      zone,
      aisle: String(aisle),
      rack: String(rack),
      shelf: String(shelf),
      bin: String(randomInt(1, 10)),
      coordinates: {
        x: aisle * 2.5,
        y: rack * 1.5,
        z: shelf * 0.5,
      },
      distanceFromStart: randomFloat(0, 1000),
      estimatedTravelTime: randomFloat(10, 300),
      accessibility: ['EASY', 'MEDIUM', 'DIFFICULT'][randomInt(0, 2)] as 'EASY' | 'MEDIUM' | 'DIFFICULT',
      requiresEquipment: Math.random() > 0.7,
      equipmentType: Math.random() > 0.7 ? ['FORKLIFT', 'REACH_TRUCK', 'LADDER', 'NONE'][randomInt(0, 3)] as any : undefined,
    }
  })
  
  const materials = generateMaterialMaster(50)
  const orders = generateSalesOrders(30)
  
  return Array.from({ length: count }, (_, i) => {
    const strategy = strategies[randomInt(0, strategies.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)]
    const priority = priorities[randomInt(0, priorities.length - 1)]
    
    const itemCount = randomInt(1, 15)
    const items = Array.from({ length: itemCount }, (_, j) => {
      const material = materials[randomInt(0, materials.length - 1)]
      const fromLoc = locations[randomInt(0, locations.length - 1)]
      
      return {
        id: `ITEM-${i}-${j}`,
        materialNumber: material.materialNumber,
        materialDescription: material.materialDescription,
        batchNumber: Math.random() > 0.5 ? `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}` : undefined,
        serialNumber: Math.random() > 0.7 ? `SER-${String(randomInt(1, 1000)).padStart(6, '0')}` : undefined,
        requiredQuantity: randomFloat(1, 100),
        pickedQuantity: status === 'COMPLETED' ? randomFloat(1, 100) : status === 'PARTIAL' ? randomFloat(1, 50) : 0,
        unit: material.baseUnit,
        fromLocation: fromLoc,
        status: status === 'COMPLETED' ? 'PICKED' : status === 'IN_PROGRESS' ? 'PENDING' : 'PENDING' as any,
        priority: priority as any,
        weight: material.weight,
        volume: material.volume,
        dimensions: {
          length: randomFloat(0.1, 2),
          width: randomFloat(0.1, 2),
          height: randomFloat(0.1, 2),
        },
        hazardous: material.hazardous,
        temperatureControlled: material.temperatureControlled,
        requiresSpecialHandling: Math.random() > 0.8,
        qualityCheckRequired: Math.random() > 0.6,
        qualityStatus: status === 'COMPLETED' ? (Math.random() > 0.1 ? 'PASSED' : 'FAILED') : 'PENDING' as any,
        pickedAt: status === 'COMPLETED' ? randomDate(new Date(Date.now() - 86400000), new Date()) : undefined,
        pickedBy: status !== 'PENDING' ? `Picker ${randomInt(1, 10)}` : undefined,
        barcode: `BC-${String(randomInt(100000, 999999))}`,
        qrCode: `QR-${String(randomInt(100000, 999999))}`,
      }
    })
    
    const pickedItems = items.filter(item => item.status === 'PICKED').length
    const completionPercentage = (pickedItems / itemCount) * 100
    
    // Optimize route
    const itemLocations = items.map(item => item.fromLocation)
    const startLocation = {
      id: 'START',
      locationCode: 'START',
      zone: 'ENTRANCE',
      aisle: '0',
      rack: '0',
      shelf: '0',
      bin: '0',
      coordinates: { x: 0, y: 0, z: 0 },
      distanceFromStart: 0,
      estimatedTravelTime: 0,
      accessibility: 'EASY' as const,
      requiresEquipment: false,
    }
    
    const optimizedRoute = itemLocations.length > 0
      ? Array.from(new Set(itemLocations.map(loc => loc.locationCode))).map(code =>
          itemLocations.find(loc => loc.locationCode === code)!
        )
      : []
    
    const estimatedDistance = optimizedRoute.reduce((sum, loc, idx) => {
      if (idx === 0) return sum + loc.distanceFromStart
      const prev = optimizedRoute[idx - 1]
      const dx = loc.coordinates.x - prev.coordinates.x
      const dy = loc.coordinates.y - prev.coordinates.y
      const dz = loc.coordinates.z - prev.coordinates.z
      return sum + Math.sqrt(dx * dx + dy * dy + dz * dz)
    }, 0)
    
    const estimatedDuration = optimizedRoute.reduce((sum, loc) => sum + loc.estimatedTravelTime, 0)
    
    const qualityChecks = items
      .filter(item => item.qualityCheckRequired)
      .map(item => ({
        id: `QC-${item.id}`,
        itemId: item.id,
        checkType: ['WEIGHT', 'QUANTITY', 'BARCODE', 'IMAGE', 'MANUAL'][randomInt(0, 4)] as any,
        status: item.qualityStatus || 'PENDING',
        expectedValue: item.requiredQuantity,
        actualValue: item.pickedQuantity,
        tolerance: 0.05,
        checkedAt: status === 'COMPLETED' ? randomDate(new Date(Date.now() - 86400000), new Date()) : undefined,
        checkedBy: status === 'COMPLETED' ? `QC-${randomInt(1, 5)}` : undefined,
      }))
    
    const assignedAt = status !== 'PENDING' 
      ? randomDate(new Date(Date.now() - 86400000), new Date())
      : undefined
    const startedAt = status === 'IN_PROGRESS' || status === 'COMPLETED'
      ? randomDate(assignedAt || new Date(Date.now() - 86400000), new Date())
      : undefined
    const completedAt = status === 'COMPLETED'
      ? randomDate(startedAt || new Date(Date.now() - 86400000), new Date())
      : undefined
    
    const actualDuration = completedAt && startedAt
      ? (completedAt.getTime() - startedAt.getTime()) / 1000
      : undefined
    
    const actualDistance = completedAt
      ? estimatedDistance * randomFloat(0.9, 1.1)
      : undefined
    
    const picksPerHour = actualDuration && actualDuration > 0
      ? (pickedItems / (actualDuration / 3600))
      : undefined
    
    const accuracyRate = status === 'COMPLETED'
      ? randomFloat(95, 100)
      : undefined
    
    const errorCount = status === 'COMPLETED'
      ? randomInt(0, 2)
      : 0
    
    const qualityScore = qualityChecks.length > 0
      ? (qualityChecks.filter(qc => qc.status === 'PASSED').length / qualityChecks.length) * 100
      : 100
    
    const carbonFootprint = (estimatedDistance / 1000) * 0.21
    const energyConsumed = (estimatedDistance / 1000) * 0.1
    const stepsTaken = Math.floor(estimatedDistance * 1.2) // Approximate steps
    
    return {
      id: `PICK-${Date.now()}-${i}`,
      taskNumber: `PICK-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      orderNumber: orders[randomInt(0, orders.length - 1)].soNumber,
      orderNumbers: strategy === 'BATCH' || strategy === 'WAVE' 
        ? Array.from({ length: randomInt(2, 5) }, () => orders[randomInt(0, orders.length - 1)].soNumber)
        : undefined,
      strategy: strategy as any,
      status: status as any,
      priority: priority as any,
      assignedTo: status !== 'PENDING' ? `PICKER-${randomInt(1, 10)}` : undefined,
      assignedToName: status !== 'PENDING' ? `Picker ${randomInt(1, 10)}` : undefined,
      assignedAt,
      startedAt,
      completedAt,
      items,
      totalItems: itemCount,
      pickedItems,
      completionPercentage,
      optimizedRoute,
      estimatedDuration,
      actualDuration,
      estimatedDistance,
      actualDistance,
      picksPerHour,
      accuracyRate,
      errorCount,
      qualityScore,
      carbonFootprint,
      energyConsumed,
      stepsTaken,
      qualityChecks,
      overallQualityStatus: qualityScore >= 95 ? 'PASSED' : qualityScore >= 80 ? 'REQUIRES_REVIEW' : 'FAILED' as any,
      equipmentRequired: items.some(item => item.fromLocation.requiresEquipment) 
        ? ['FORKLIFT', 'REACH_TRUCK'] 
        : undefined,
      notes: [],
      issues: [],
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Picker Data
export const generatePickers = (count: number = 15) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `PICKER-${i + 1}`,
    name: `Picker ${i + 1}`,
    employeeId: `EMP-${String(i + 1).padStart(6, '0')}`,
    zone: ['A', 'B', 'C', 'D', 'E'][i % 5],
    currentTask: Math.random() > 0.5 ? `PICK-${randomInt(1, 50)}` : undefined,
    status: ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'][randomInt(0, 3)] as any,
    performance: {
      averagePicksPerHour: randomFloat(50, 150),
      accuracyRate: randomFloat(95, 100),
      totalPicks: randomInt(100, 5000),
      totalDistance: randomFloat(1000, 50000),
      averageQualityScore: randomFloat(95, 100),
    },
    location: {
      x: randomFloat(0, 100),
      y: randomFloat(0, 100),
      zone: ['A', 'B', 'C', 'D', 'E'][i % 5],
    },
    equipment: Math.random() > 0.5 ? ['SCANNER', 'VOICE_DEVICE'] : ['SCANNER'],
    lastUpdate: new Date(),
  }))
}

// ABC Analysis Data - Material Classification (A, B, C categories)
export const generateABCAnalysis = (count: number = 100) => {
  const materials = [
    'Chemical Compound A', 'Chemical Compound B', 'Raw Material X', 'Raw Material Y',
    'Finished Product 1', 'Finished Product 2', 'Packaging Material', 'Safety Equipment',
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const annualValue = randomFloat(1000, 1000000)
    const annualUsage = randomFloat(100, 100000)
    const unitPrice = annualValue / annualUsage
    const category = annualValue > 500000 ? 'A' : annualValue > 100000 ? 'B' : 'C'
    const percentage = (annualValue / 1000000) * 100
    
    return {
      id: generateId('ABC'),
      materialNumber: `MAT-${String(i + 1).padStart(6, '0')}`,
      materialDescription: materials[randomInt(0, materials.length - 1)],
      category,
      annualValue,
      annualUsage,
      unitPrice,
      percentage: parseFloat(percentage.toFixed(2)),
      cumulativePercentage: 0, // Will be calculated
      storageLocation: `WH-${['A', 'B', 'C'][i % 3]}-${String(randomInt(1, 10)).padStart(2, '0')}`,
      reorderPoint: randomFloat(100, 1000),
      safetyStock: randomFloat(50, 500),
      leadTime: randomInt(1, 30),
      lastMovement: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
      movementFrequency: randomInt(1, 100),
      priority: category === 'A' ? 'HIGH' : category === 'B' ? 'MEDIUM' : 'LOW',
    }
  }).sort((a, b) => b.annualValue - a.annualValue).map((item, index, arr) => {
    const cumulative = arr.slice(0, index + 1).reduce((sum, i) => sum + i.annualValue, 0)
    const total = arr.reduce((sum, i) => sum + i.annualValue, 0)
    return {
      ...item,
      cumulativePercentage: parseFloat(((cumulative / total) * 100).toFixed(2)),
    }
  })
}

// Load Planning Data - Truck/Vehicle Load Optimization
export const generateLoadPlans = (count: number = 50) => {
  const truckTypes = ['FLATBED', 'REEFER', 'DRY_VAN', 'BOX_TRUCK', 'CONTAINER']
  const statuses = ['PLANNED', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']
  
  return Array.from({ length: count }, (_, i) => {
    const totalWeight = randomFloat(5000, 25000) // kg
    const totalVolume = randomFloat(20, 80) // m³
    const truckCapacity = randomFloat(10000, 30000) // kg
    const volumeCapacity = randomFloat(50, 120) // m³
    const utilization = (totalWeight / truckCapacity) * 100
    const volumeUtilization = (totalVolume / volumeCapacity) * 100
    
    return {
      id: generateId('LOAD'),
      loadNumber: `LOAD-${String(i + 1).padStart(6, '0')}`,
      truckNumber: `TRUCK-${String(randomInt(1, 50)).padStart(4, '0')}`,
      truckType: truckTypes[randomInt(0, truckTypes.length - 1)],
      driverName: `Driver ${randomInt(1, 20)}`,
      origin: `Warehouse ${['A', 'B', 'C'][i % 3]}`,
      destination: `Customer ${randomInt(1, 30)}`,
      plannedDate: randomDate(new Date(), new Date(Date.now() + 7 * 86400000)),
      status: statuses[randomInt(0, statuses.length - 1)],
      totalWeight,
      totalVolume,
      truckCapacity,
      volumeCapacity,
      weightUtilization: parseFloat(utilization.toFixed(2)),
      volumeUtilization: parseFloat(volumeUtilization.toFixed(2)),
      totalItems: randomInt(10, 100),
      totalOrders: randomInt(1, 10),
      estimatedDistance: randomFloat(50, 500), // km
      estimatedDuration: randomInt(2, 8), // hours
      routeOptimized: Math.random() > 0.3,
      requiresSpecialHandling: Math.random() > 0.7,
      temperatureControlled: Math.random() > 0.6,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
    }
  })
}

// Route Optimization Data - Multi-vehicle route planning and optimization
export const generateRoutes = (count: number = 40) => {
  const shipments = generateShipments(30)
  const carriers = generateCarriers(10)
  const statuses = ['PLANNED', 'OPTIMIZING', 'OPTIMIZED', 'ACTIVE', 'COMPLETED', 'CANCELLED']
  const optimizationTypes = ['DISTANCE', 'TIME', 'COST', 'MULTI_OBJECTIVE']
  
  return Array.from({ length: count }, (_, i) => {
    const shipment = shipments[Math.floor(Math.random() * shipments.length)]
    const carrier = carriers[Math.floor(Math.random() * carriers.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const optimizationType = optimizationTypes[Math.floor(Math.random() * optimizationTypes.length)]
    
    // Route waypoints (origin, stops, destination)
    const numStops = randomInt(2, 8)
    const waypoints = Array.from({ length: numStops }, (_, idx) => ({
      sequence: idx + 1,
      location: `Stop ${idx + 1}`,
      address: `Address ${randomInt(1, 100)}`,
      lat: 25.2048 + (Math.random() - 0.5) * 2,
      lng: 55.2708 + (Math.random() - 0.5) * 2,
      estimatedArrival: new Date(Date.now() + idx * 3600000),
      estimatedDeparture: new Date(Date.now() + (idx + 1) * 3600000),
      actualArrival: status === 'COMPLETED' && idx < numStops - 1 ? new Date(Date.now() - (numStops - idx) * 3600000) : null,
    }))
    
    const totalDistance = randomFloat(50, 500) // km
    const optimizedDistance = totalDistance * (0.85 + Math.random() * 0.1) // 85-95% of original
    const timeSaved = (totalDistance - optimizedDistance) / 60 // hours saved
    const costSaved = (totalDistance - optimizedDistance) * 2.5 // AED saved
    
    return {
      id: generateId('ROUTE'),
      routeNumber: `ROUTE-${String(i + 1).padStart(6, '0')}`,
      shipmentNumber: shipment.shipmentNumber,
      trackingNumber: shipment.trackingNumber,
      soNumber: shipment.soNumber,
      carrierCode: carrier.carrierCode,
      carrierName: carrier.carrierName,
      vehicleNumber: shipment.vehicleNumber,
      driverName: shipment.driverName,
      status,
      optimizationType,
      origin: shipment.origin,
      destination: shipment.destination,
      waypoints,
      totalDistance,
      optimizedDistance: parseFloat(optimizedDistance.toFixed(2)),
      timeSaved: parseFloat(timeSaved.toFixed(2)),
      costSaved: parseFloat(costSaved.toFixed(2)),
      estimatedDuration: randomInt(2, 8), // hours
      actualDuration: status === 'COMPLETED' ? randomInt(2, 8) : null,
      trafficConditions: ['CLEAR', 'MODERATE', 'HEAVY', 'CONGESTED'][randomInt(0, 3)],
      fuelConsumption: parseFloat((totalDistance * 0.15).toFixed(2)), // liters
      carbonFootprint: parseFloat((totalDistance * 0.2).toFixed(2)), // kg CO2
      multiStopOptimized: numStops > 2,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      optimizedAt: status !== 'PLANNED' ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : null,
    }
  })
}

// Shipment Tracking Data - Real-time GPS tracking and delivery status
export const generateShipments = (count: number = 60) => {
  const carriers = generateCarriers(10)
  const salesOrders = generateSalesOrders(30)
  const statuses = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RETURNED']
  
  return Array.from({ length: count }, (_, i) => {
    const carrier = carriers[Math.floor(Math.random() * carriers.length)]
    const so = salesOrders[Math.floor(Math.random() * salesOrders.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const pickupDate = randomDate(new Date(Date.now() - 7 * 86400000), new Date())
    const estimatedDelivery = randomDate(new Date(), new Date(Date.now() + 3 * 86400000))
    const actualDelivery = status === 'DELIVERED' ? randomDate(pickupDate, new Date()) : null
    
    // GPS coordinates (Saudi Arabia region - Riyadh area)
    const currentLat = 24.7136 + (Math.random() - 0.5) * 2
    const currentLng = 46.6753 + (Math.random() - 0.5) * 2
    const destinationLat = 24.7136 + (Math.random() - 0.5) * 2
    const destinationLng = 46.6753 + (Math.random() - 0.5) * 2
    
    return {
      id: generateId('SHIP'),
      trackingNumber: `TRK-${String(i + 1).padStart(10, '0')}`,
      shipmentNumber: `SHIP-${String(i + 1).padStart(6, '0')}`,
      soNumber: so.soNumber,
      customerNumber: so.customerNumber,
      customerName: so.customerName,
      carrierCode: carrier.carrierCode,
      carrierName: carrier.carrierName,
      status,
      pickupDate,
      estimatedDelivery,
      actualDelivery,
      origin: 'Riyadh Warehouse',
      destination: `Customer Location ${randomInt(1, 30)}`,
      currentLocation: {
        lat: currentLat,
        lng: currentLng,
        address: `Location ${randomInt(1, 100)}`,
        timestamp: new Date(),
      },
      destinationLocation: {
        lat: destinationLat,
        lng: destinationLng,
        address: `Customer Address ${randomInt(1, 50)}`,
      },
      distance: randomFloat(10, 500), // km
      estimatedTimeRemaining: randomInt(30, 480), // minutes
      driverName: `Driver ${randomInt(1, 20)}`,
      driverPhone: `+971${randomInt(500000000, 599999999)}`,
      vehicleNumber: `VEH-${String(randomInt(1, 100)).padStart(4, '0')}`,
      exceptionType: status === 'EXCEPTION' ? ['DELAY', 'DAMAGE', 'MISSING', 'WRONG_ADDRESS'][randomInt(0, 3)] : null,
      exceptionDescription: status === 'EXCEPTION' ? 'Exception occurred during delivery' : null,
      podStatus: status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
      podDate: status === 'DELIVERED' ? actualDelivery : null,
      totalWeight: randomFloat(10, 1000), // kg
      totalVolume: randomFloat(0.5, 10), // m³
      totalItems: randomInt(1, 50),
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      lastUpdate: new Date(),
    }
  })
}

// Freight Management Data - Shipping Costs and Freight Calculations
export const generateFreightRecords = (count: number = 80) => {
  const carriers = ['DHL', 'FedEx', 'UPS', 'Aramex', 'Wajeeh', 'Custom Carrier']
  const freightTypes = ['STANDARD', 'EXPRESS', 'OVERNIGHT', 'ECONOMY', 'FREIGHT']
  const paymentTerms = ['PREPAID', 'COLLECT', 'THIRD_PARTY']
  
  return Array.from({ length: count }, (_, i) => {
    const weight = randomFloat(1, 1000) // kg
    const volume = randomFloat(0.1, 10) // m³
    const distance = randomFloat(10, 1000) // km
    const baseRate = randomFloat(50, 500)
    const fuelSurcharge = baseRate * 0.15
    const handlingFee = randomFloat(10, 50)
    const insurance = randomFloat(5, 100)
    const totalFreight = baseRate + fuelSurcharge + handlingFee + insurance
    const currency = ['SAR', 'USD', 'EUR'][randomInt(0, 2)]
    
    return {
      id: generateId('FRT'),
      freightNumber: `FRT-${String(i + 1).padStart(6, '0')}`,
      shipmentNumber: `SHIP-${String(randomInt(1, 200)).padStart(6, '0')}`,
      carrier: carriers[randomInt(0, carriers.length - 1)],
      freightType: freightTypes[randomInt(0, freightTypes.length - 1)],
      origin: `Warehouse ${['A', 'B', 'C'][i % 3]}`,
      destination: `Customer ${randomInt(1, 30)}`,
      weight,
      volume,
      distance,
      baseRate,
      fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
      handlingFee,
      insurance,
      totalFreight: parseFloat(totalFreight.toFixed(2)),
      currency,
      paymentTerms: paymentTerms[randomInt(0, paymentTerms.length - 1)],
      invoiceNumber: `INV-${String(randomInt(1000, 9999))}`,
      invoiceDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      paymentStatus: ['PENDING', 'PAID', 'OVERDUE'][randomInt(0, 2)],
      estimatedDelivery: randomDate(new Date(), new Date(Date.now() + 7 * 86400000)),
      actualDelivery: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : null,
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
    }
  })
}

// NCR (Non-Conformance Report) Data - Root cause analysis and corrective actions
export const generateNCRs = (count: number = 40) => {
  const severities = ['MINOR', 'MAJOR', 'CRITICAL']
  const statuses = ['OPEN', 'INVESTIGATING', 'CORRECTIVE_ACTION', 'VERIFICATION', 'CLOSED', 'REOPENED']
  const categories = ['QUALITY', 'SAFETY', 'PROCESS', 'MATERIAL', 'EQUIPMENT', 'DOCUMENTATION']
  const rootCauses = ['HUMAN_ERROR', 'EQUIPMENT_FAILURE', 'PROCESS_DEFECT', 'MATERIAL_DEFECT', 'TRAINING_GAP', 'PROCEDURE_GAP', 'ENVIRONMENTAL', 'SUPPLIER_ISSUE']
  
  return Array.from({ length: count }, (_, i) => {
    const severity = severities[randomInt(0, severities.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)]
    const category = categories[randomInt(0, categories.length - 1)]
    const rootCause = rootCauses[randomInt(0, rootCauses.length - 1)]
    
    const reportedDate = randomDate(new Date(Date.now() - 60 * 86400000), new Date())
    const targetCloseDate = randomDate(new Date(), new Date(Date.now() + 30 * 86400000))
    const actualCloseDate = status === 'CLOSED' ? randomDate(reportedDate, new Date()) : null
    
    return {
      id: generateId('NCR'),
      ncrNumber: `NCR-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      inspectionLotNumber: `INSP-${new Date().getFullYear()}-${String(randomInt(1, 50)).padStart(6, '0')}`,
      materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
      materialDescription: `Material ${randomInt(1, 50)}`,
      batchNumber: `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}`,
      quantity: randomFloat(10, 1000),
      severity,
      status,
      category,
      rootCause,
      reportedBy: `Inspector ${randomInt(1, 5)}`,
      reportedDate,
      description: `Non-conformance detected: ${category.toLowerCase()} issue identified during inspection`,
      affectedArea: `Area ${['A', 'B', 'C', 'D'][i % 4]}-${String(randomInt(1, 10)).padStart(2, '0')}`,
      immediateAction: 'Material quarantined and isolated from production',
      immediateActionBy: `Supervisor ${randomInt(1, 3)}`,
      immediateActionDate: randomDate(reportedDate, new Date(Date.now() + 1 * 86400000)),
      correctiveActions: Array.from({ length: randomInt(1, 3) }, (_, idx) => ({
        id: `CA-${i}-${idx}`,
        action: `Corrective Action ${idx + 1}: ${['Process improvement', 'Training', 'Equipment maintenance', 'Procedure update'][randomInt(0, 3)]}`,
        responsible: `Manager ${randomInt(1, 5)}`,
        targetDate: randomDate(new Date(), new Date(Date.now() + 14 * 86400000)),
        status: idx === 0 ? (status === 'CORRECTIVE_ACTION' ? 'IN_PROGRESS' : status === 'VERIFICATION' ? 'COMPLETED' : 'PENDING') : 'PENDING',
        completedDate: idx === 0 && status === 'VERIFICATION' ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : null,
      })),
      preventiveActions: Array.from({ length: randomInt(0, 2) }, (_, idx) => ({
        id: `PA-${i}-${idx}`,
        action: `Preventive Action ${idx + 1}: ${['System update', 'Additional controls', 'Enhanced monitoring'][randomInt(0, 2)]}`,
        responsible: `Manager ${randomInt(1, 5)}`,
        targetDate: randomDate(new Date(), new Date(Date.now() + 30 * 86400000)),
        status: 'PENDING',
      })),
      verificationRequired: severity !== 'MINOR',
      verifiedBy: status === 'CLOSED' ? `Quality Manager ${randomInt(1, 3)}` : undefined,
      verifiedDate: status === 'CLOSED' ? actualCloseDate : undefined,
      verificationNotes: status === 'CLOSED' ? 'Corrective actions verified and effective' : undefined,
      targetCloseDate,
      actualCloseDate,
      daysOpen: Math.floor((new Date().getTime() - new Date(reportedDate).getTime()) / (1000 * 60 * 60 * 24)),
      costImpact: randomFloat(100, 10000),
      costCurrency: 'SAR',
      recurrence: randomInt(0, 3),
      relatedNCRs: Math.random() > 0.7 ? [`NCR-${new Date().getFullYear()}-${String(randomInt(1, i)).padStart(6, '0')}`] : [],
      createdAt: reportedDate,
      updatedAt: new Date(),
    }
  })
}

// Damage Reports Data - Damage Tracking and Root Cause Analysis with Photo Evidence
export const generateDamageReports = (count: number = 60) => {
  const damageTypes = ['CRUSHED', 'BROKEN', 'SCRATCHED', 'DENTED', 'WET', 'MISSING', 'EXPIRED', 'CONTAMINATED']
  const severityLevels = ['MINOR', 'MODERATE', 'MAJOR', 'CRITICAL']
  const rootCauses = ['HANDLING_ERROR', 'TRANSPORTATION', 'STORAGE', 'PACKAGING', 'EQUIPMENT_FAILURE', 'ENVIRONMENTAL', 'THEFT', 'UNKNOWN']
  const statuses = ['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'PENDING']
  
  return Array.from({ length: count }, (_, i) => {
    const quantity = randomInt(1, 100)
    const unitValue = randomFloat(10, 1000)
    const totalValue = quantity * unitValue
    const severity = severityLevels[randomInt(0, severityLevels.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)]
    const hasPhotos = Math.random() > 0.3
    const numPhotos = hasPhotos ? randomInt(1, 5) : 0
    
    return {
      id: generateId('DMG'),
      reportNumber: `DMG-${String(i + 1).padStart(6, '0')}`,
      materialNumber: `MAT-${String(randomInt(1, 200)).padStart(6, '0')}`,
      materialDescription: `Material ${randomInt(1, 50)}`,
      batchNumber: `BATCH-${String(randomInt(1000, 9999)).padStart(6, '0')}`,
      serialNumber: Math.random() > 0.7 ? `SER-${String(randomInt(1, 1000)).padStart(6, '0')}` : undefined,
      soNumber: Math.random() > 0.5 ? `SO-${String(randomInt(1, 200)).padStart(6, '0')}` : undefined,
      shipmentNumber: Math.random() > 0.5 ? `SHIP-${String(randomInt(1, 200)).padStart(6, '0')}` : undefined,
      trackingNumber: Math.random() > 0.5 ? `TRK-${String(randomInt(1, 200)).padStart(10, '0')}` : undefined,
      damageType: damageTypes[randomInt(0, damageTypes.length - 1)],
      severity,
      quantity,
      unitValue,
      totalValue: parseFloat(totalValue.toFixed(2)),
      location: `WH-${['A', 'B', 'C'][i % 3]}-${String(randomInt(1, 10)).padStart(2, '0')}`,
      rootCause: rootCauses[randomInt(0, rootCauses.length - 1)],
      reportedBy: `Employee ${randomInt(1, 20)}`,
      reportedDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      status,
      investigationNotes: `Investigation notes for damage report ${i + 1}. Root cause identified as ${rootCauses[randomInt(0, rootCauses.length - 1)].toLowerCase().replace(/_/g, ' ')}.`,
      correctiveAction: status === 'RESOLVED' || status === 'CLOSED' ? `Corrective action taken: Enhanced ${rootCauses[randomInt(0, rootCauses.length - 1)].toLowerCase().replace(/_/g, ' ')} procedures` : null,
      resolvedDate: status === 'RESOLVED' || status === 'CLOSED' ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : null,
      resolvedBy: status === 'RESOLVED' || status === 'CLOSED' ? `Manager ${randomInt(1, 5)}` : undefined,
      photos: hasPhotos ? Array.from({ length: numPhotos }, (_, idx) => ({
        id: `PHOTO-${i}-${idx}`,
        url: `/images/damage-${i + 1}-${idx + 1}.jpg`,
        thumbnail: `/images/damage-${i + 1}-${idx + 1}-thumb.jpg`,
        description: `Damage photo ${idx + 1}`,
        takenBy: `Employee ${randomInt(1, 20)}`,
        takenDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      })) : [],
      insuranceClaimNumber: severity === 'CRITICAL' || severity === 'MAJOR' ? `INS-${String(i + 1).padStart(6, '0')}` : undefined,
      insuranceClaimStatus: severity === 'CRITICAL' || severity === 'MAJOR' ? ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'][randomInt(0, 3)] : undefined,
      insuranceClaimAmount: severity === 'CRITICAL' || severity === 'MAJOR' ? parseFloat((totalValue * 0.8).toFixed(2)) : undefined,
      costCurrency: 'SAR',
      disposalRequired: severity === 'CRITICAL' || damageTypes.includes('CONTAMINATED') || damageTypes.includes('EXPIRED'),
      disposalMethod: severity === 'CRITICAL' || damageTypes.includes('CONTAMINATED') || damageTypes.includes('EXPIRED') ? ['INCINERATION', 'RECYCLING', 'LANDFILL', 'RETURN_TO_SUPPLIER'][randomInt(0, 3)] : undefined,
      supplierNotification: Math.random() > 0.6,
      supplierResponse: Math.random() > 0.6 ? 'Supplier notified and investigating' : undefined,
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Quality Certificates Data - COA and quality certificates with expiry tracking
export const generateQualityCertificates = (count: number = 50) => {
  const certificateTypes = ['COA', 'ISO_9001', 'ISO_14001', 'FDA', 'CE', 'HALAL', 'CUSTOM']
  const statuses = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'REVOKED']
  const issuingBodies = ['TÜV', 'SGS', 'Bureau Veritas', 'Intertek', 'DNV', 'Internal QA', 'Supplier']
  
  return Array.from({ length: count }, (_, i) => {
    const issueDate = randomDate(new Date(Date.now() - 365 * 86400000), new Date())
    const validityPeriod = randomInt(90, 1095) // 3 months to 3 years
    const expiryDate = new Date(issueDate)
    expiryDate.setDate(expiryDate.getDate() + validityPeriod)
    
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED'
    
    if (daysUntilExpiry < 0) {
      status = 'EXPIRED'
    } else if (daysUntilExpiry <= 30) {
      status = 'EXPIRING_SOON'
    } else {
      status = 'ACTIVE'
    }
    
    const certificateType = certificateTypes[randomInt(0, certificateTypes.length - 1)]
    const issuingBody = issuingBodies[randomInt(0, issuingBodies.length - 1)]
    
    return {
      id: generateId('CERT'),
      certificateNumber: `CERT-${String(i + 1).padStart(6, '0')}`,
      inspectionLotNumber: `INSP-${new Date().getFullYear()}-${String(randomInt(1, 50)).padStart(6, '0')}`,
      materialNumber: `MAT-${String(randomInt(1, 50)).padStart(6, '0')}`,
      materialDescription: `Material ${randomInt(1, 50)}`,
      batchNumber: `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}`,
      certificateType,
      issuingBody,
      issueDate,
      expiryDate,
      validityPeriod,
      daysUntilExpiry,
      status,
      complianceStandard: certificateType === 'COA' ? 'CUSTOM' : certificateType,
      testResults: Array.from({ length: randomInt(3, 8) }, (_, idx) => ({
        parameter: ['Purity', 'Moisture', 'pH', 'Heavy Metals', 'Microbial Count', 'Viscosity', 'Color', 'Odor'][idx % 8],
        value: randomFloat(0.1, 100),
        unit: ['%', 'ppm', 'pH', 'CFU/g', 'cP', 'L*a*b*', 'N/A'][idx % 7],
        specification: `${randomFloat(0.1, 100).toFixed(2)} - ${randomFloat(100, 200).toFixed(2)}`,
        result: Math.random() > 0.1 ? 'PASS' : 'FAIL',
      })),
      approvedBy: `Quality Manager ${randomInt(1, 3)}`,
      approvedDate: issueDate,
      documentUrl: `/certificates/cert-${i + 1}.pdf`,
      digitalSignature: Math.random() > 0.3,
      qrCode: `QR-${String(i + 1).padStart(10, '0')}`,
      renewalRequired: daysUntilExpiry <= 60,
      renewalStatus: daysUntilExpiry <= 60 ? ['PENDING', 'IN_PROGRESS', 'SUBMITTED'][randomInt(0, 2)] : undefined,
      renewalApplicationDate: daysUntilExpiry <= 60 && Math.random() > 0.5 ? randomDate(new Date(), new Date(Date.now() + 30 * 86400000)) : undefined,
      relatedCertificates: Math.random() > 0.7 ? [`CERT-${String(randomInt(1, i)).padStart(6, '0')}`] : [],
      notes: status === 'EXPIRING_SOON' ? 'Certificate expiring soon - renewal required' : undefined,
      createdAt: issueDate,
      updatedAt: new Date(),
    }
  })
}

// Expiry Management Data - Expiry Tracking and Alerts
export const generateExpiryRecords = (count: number = 150) => {
  const materials = [
    'Chemical Compound A', 'Chemical Compound B', 'Raw Material X', 'Raw Material Y',
    'Finished Product 1', 'Finished Product 2', 'Packaging Material', 'Safety Equipment',
  ]
  
  const statuses = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'QUARANTINE', 'DISPOSED']
  const locations = ['WH-A', 'WH-B', 'WH-C', 'WH-D']
  
  return Array.from({ length: count }, (_, i) => {
    const productionDate = randomDate(new Date(Date.now() - 365 * 86400000), new Date())
    const shelfLife = randomInt(30, 730) // days
    const expiryDate = new Date(productionDate)
    expiryDate.setDate(expiryDate.getDate() + shelfLife)
    
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'QUARANTINE' | 'DISPOSED'
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    
    if (daysUntilExpiry < 0) {
      status = 'EXPIRED'
      priority = 'CRITICAL'
    } else if (daysUntilExpiry <= 7) {
      status = 'EXPIRING_SOON'
      priority = 'CRITICAL'
    } else if (daysUntilExpiry <= 30) {
      status = 'EXPIRING_SOON'
      priority = 'HIGH'
    } else if (daysUntilExpiry <= 90) {
      status = 'ACTIVE'
      priority = 'MEDIUM'
    } else {
      status = 'ACTIVE'
      priority = 'LOW'
    }
    
    const quantity = randomFloat(10, 1000)
    const unitValue = randomFloat(10, 500)
    const totalValue = quantity * unitValue
    
    return {
      id: generateId('EXP'),
      materialNumber: `MAT-${String(randomInt(1, 200)).padStart(6, '0')}`,
      materialDescription: materials[randomInt(0, materials.length - 1)],
      batchNumber: `BATCH-${String(randomInt(1, 100)).padStart(6, '0')}`,
      serialNumber: Math.random() > 0.7 ? `SER-${String(randomInt(1, 1000)).padStart(8, '0')}` : undefined,
      location: locations[randomInt(0, locations.length - 1)] + `-${String(randomInt(1, 10)).padStart(2, '0')}`,
      quantity,
      unit: 'EA',
      unitValue,
      totalValue: parseFloat(totalValue.toFixed(2)),
      productionDate,
      expiryDate,
      shelfLife,
      daysUntilExpiry,
      daysSinceProduction: Math.floor((new Date().getTime() - productionDate.getTime()) / (1000 * 60 * 60 * 24)),
      status,
      priority,
      requiresDisposal: daysUntilExpiry < 0,
      requiresAttention: daysUntilExpiry <= 30,
      fefoPriority: daysUntilExpiry, // Lower = higher priority for FEFO
      lastMovement: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
      vendor: `Vendor ${randomInt(1, 20)}`,
      certificateNumber: Math.random() > 0.5 ? `CERT-${String(randomInt(1, 100)).padStart(6, '0')}` : undefined,
      createdAt: randomDate(new Date(Date.now() - 180 * 86400000), new Date()),
    }
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry) // Sort by FEFO priority
}

// Stock Alerts Data - Low Stock Warnings and Reorder Points
export const generateStockAlerts = (count: number = 80) => {
  const materials = generateMaterialMaster(50)
  const stock = generateInventoryStock(100)
  
  return Array.from({ length: count }, (_, i) => {
    const stockItem = stock[randomInt(0, stock.length - 1)]
    const material = materials[randomInt(0, materials.length - 1)]
    const currentStock = stockItem.quantity
    const reorderPoint = randomFloat(50, 200)
    const maxStock = randomFloat(500, 2000)
    const safetyStock = reorderPoint * 0.5
    const daysOfStock = (currentStock / (randomFloat(10, 50))) // Assuming daily consumption
    const alertLevel = currentStock < reorderPoint ? 'CRITICAL' : currentStock < (reorderPoint * 1.5) ? 'HIGH' : currentStock < (reorderPoint * 2) ? 'MEDIUM' : 'LOW'
    const needsReorder = currentStock <= reorderPoint
    const suggestedOrderQty = maxStock - currentStock
    
    return {
      id: generateId('ALERT'),
      materialNumber: stockItem.materialNumber,
      materialDescription: stockItem.materialDescription,
      storageLocation: stockItem.storageLocation,
      currentStock,
      reorderPoint,
      maxStock,
      safetyStock,
      daysOfStock: Math.floor(daysOfStock),
      unit: stockItem.unit,
      alertLevel,
      needsReorder,
      suggestedOrderQty: Math.max(0, suggestedOrderQty),
      lastMovement: stockItem.lastMovementDate,
      averageConsumption: randomFloat(5, 30),
      leadTime: randomInt(1, 14), // days
      lastAlertDate: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      alertCount: randomInt(1, 5),
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
    }
  }).sort((a, b) => {
    // Sort by alert level priority
    const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return priority[a.alertLevel as keyof typeof priority] - priority[b.alertLevel as keyof typeof priority]
  })
}

// Reservations Data - Stock Reservations and Allocations
export const generateReservations = (count: number = 60) => {
  const stock = generateInventoryStock(100)
  const orders = generateSalesOrders(50)
  
  return Array.from({ length: count }, (_, i) => {
    const stockItem = stock[randomInt(0, stock.length - 1)]
    const order = orders[randomInt(0, orders.length - 1)]
    const reservedQuantity = randomFloat(10, stockItem.quantity * 0.8)
    const availableQuantity = stockItem.quantity - reservedQuantity
    
    return {
      id: generateId('RES'),
      reservationNumber: `RES-${String(i + 1).padStart(6, '0')}`,
      materialNumber: stockItem.materialNumber,
      materialDescription: stockItem.materialDescription,
      storageLocation: stockItem.storageLocation,
      orderNumber: order.soNumber,
      customerNumber: order.customerNumber,
      customerName: order.customerName,
      reservedQuantity,
      availableQuantity: Math.max(0, availableQuantity),
      unit: stockItem.unit,
      reservationDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      requiredDate: randomDate(new Date(), new Date(Date.now() + 30 * 86400000)),
      status: ['ACTIVE', 'PARTIAL', 'FULFILLED', 'CANCELLED'][randomInt(0, 3)] as any,
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)] as any,
      batchNumber: stockItem.batchNumber,
      reservedBy: `User ${randomInt(1, 20)}`,
      notes: Math.random() > 0.7 ? `Reservation notes for ${order.soNumber}` : undefined,
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
    }
  })
}

// Wave Planning Data - Order Wave Optimization
export const generateWaves = (count: number = 40) => {
  const orders = generateSalesOrders(100)
  
  return Array.from({ length: count }, (_, i) => {
    const waveOrders = orders.slice(i * 2, (i + 1) * 2 + randomInt(0, 3))
    const totalItems = waveOrders.reduce((sum, o) => sum + o.totalItems, 0)
    const totalValue = waveOrders.reduce((sum, o) => sum + o.totalValue, 0)
    const estimatedDuration = totalItems * randomFloat(2, 5) // minutes per item
    const pickersRequired = Math.ceil(totalItems / 50) // Assuming 50 items per picker per hour
    
    return {
      id: generateId('WAVE'),
      waveNumber: `WAVE-${String(i + 1).padStart(6, '0')}`,
      waveName: `Wave ${i + 1} - ${format(new Date(), 'MMM dd')}`,
      orderNumbers: waveOrders.map(o => o.soNumber),
      totalOrders: waveOrders.length,
      totalItems,
      totalValue,
      status: ['PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][randomInt(0, 4)] as any,
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)] as any,
      waveType: ['SINGLE', 'BATCH', 'ZONE', 'CLUSTER'][randomInt(0, 3)] as any,
      strategy: ['DISCRETE', 'BATCH', 'WAVE', 'ZONE'][randomInt(0, 3)] as any,
      estimatedDuration,
      actualDuration: Math.random() > 0.5 ? estimatedDuration + randomFloat(-10, 20) : undefined,
      pickersRequired,
      pickersAssigned: Math.random() > 0.3 ? pickersRequired : randomInt(1, pickersRequired),
      plannedStartTime: randomDate(new Date(), new Date(Date.now() + 7 * 86400000)),
      actualStartTime: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      plannedEndTime: randomDate(new Date(Date.now() + 1 * 86400000), new Date(Date.now() + 7 * 86400000)),
      actualEndTime: Math.random() > 0.3 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      completionPercentage: Math.random() > 0.5 ? randomFloat(0, 100) : 0,
      optimized: Math.random() > 0.3,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
    }
  })
}

// Pick Release Data - Order Release for Picking
export const generatePickReleases = (count: number = 70) => {
  const orders = generateSalesOrders(100)
  
  return Array.from({ length: count }, (_, i) => {
    const order = orders[randomInt(0, orders.length - 1)]
    const isReleased = Math.random() > 0.4
    const canRelease = order.status === 'CONFIRMED' || order.status === 'CREATED'
    
    return {
      id: generateId('PR'),
      releaseNumber: `PR-${String(i + 1).padStart(6, '0')}`,
      orderNumber: order.soNumber,
      customerNumber: order.customerNumber,
      customerName: order.customerName,
      orderDate: order.orderDate,
      requiredDate: order.expectedDeliveryDate,
      totalItems: order.totalItems,
      totalValue: order.totalValue,
      currency: order.currency,
      status: isReleased ? 'RELEASED' : canRelease ? 'PENDING' : 'ON_HOLD',
      releaseDate: isReleased ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      releasedBy: isReleased ? `User ${randomInt(1, 20)}` : undefined,
      priority: order.priority,
      warehouse: (order as any).warehouse || 'WH-001',
      pickingStrategy: ['DISCRETE', 'BATCH', 'WAVE', 'ZONE'][randomInt(0, 3)] as any,
      waveNumber: Math.random() > 0.5 ? `WAVE-${String(randomInt(1, 40)).padStart(6, '0')}` : undefined,
      holdReason: !canRelease ? ['CREDIT_HOLD', 'STOCK_UNAVAILABLE', 'QUALITY_HOLD', 'CUSTOMER_HOLD'][randomInt(0, 3)] : undefined,
      availableStock: Math.random() > 0.3,
      stockAvailability: randomFloat(80, 100), // percentage
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
    }
  })
}

// Return Management Data - Returns and Reverse Logistics
export const generateReturns = (count: number = 50) => {
  const orders = generateSalesOrders(50)
  const reasons = ['DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'CUSTOMER_CANCELLATION', 'OVERSTOCK', 'EXPIRED', 'QUALITY_ISSUE']
  const statuses = ['REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'INSPECTING', 'PROCESSED', 'REJECTED', 'CANCELLED']
  
  return Array.from({ length: count }, (_, i) => {
    const order = orders[randomInt(0, orders.length - 1)]
    const returnQuantity = randomFloat(1, order.totalItems * 0.3)
    const returnValue = (returnQuantity / order.totalItems) * order.totalValue
    
    return {
      id: generateId('RET'),
      returnNumber: `RET-${String(i + 1).padStart(6, '0')}`,
      originalOrderNumber: order.soNumber,
      customerNumber: order.customerNumber,
      customerName: order.customerName,
      materialNumber: `MAT-${String(randomInt(1, 200)).padStart(6, '0')}`,
      materialDescription: `Material ${randomInt(1, 50)}`,
      returnQuantity,
      unit: 'EA',
      returnValue: parseFloat(returnValue.toFixed(2)),
      currency: order.currency,
      returnReason: reasons[randomInt(0, reasons.length - 1)],
      status: statuses[randomInt(0, statuses.length - 1)] as any,
      returnRequestDate: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
      approvedDate: Math.random() > 0.4 ? randomDate(new Date(Date.now() - 20 * 86400000), new Date()) : undefined,
      receivedDate: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 10 * 86400000), new Date()) : undefined,
      processedDate: Math.random() > 0.6 ? randomDate(new Date(Date.now() - 5 * 86400000), new Date()) : undefined,
      requestedBy: `Customer ${randomInt(1, 30)}`,
      approvedBy: Math.random() > 0.4 ? `User ${randomInt(1, 20)}` : undefined,
      receivedBy: Math.random() > 0.5 ? `User ${randomInt(1, 20)}` : undefined,
      disposition: Math.random() > 0.5 ? ['RESTOCK', 'DAMAGED', 'DISPOSAL', 'REPAIR', 'REFUND'][randomInt(0, 4)] : undefined,
      creditMemoNumber: Math.random() > 0.6 ? `CM-${String(randomInt(1, 100)).padStart(6, '0')}` : undefined,
      notes: `Return notes for ${order.soNumber}`,
      createdAt: randomDate(new Date(Date.now() - 30 * 86400000), new Date()),
    }
  })
}

// Replenishment Data - Stock Replenishment
export const generateReplenishments = (count: number = 60) => {
  const stock = generateInventoryStock(100)
  const locations = generateStorageLocations(50)
  
  return Array.from({ length: count }, (_, i) => {
    const stockItem = stock[randomInt(0, stock.length - 1)]
    const fromLocation = locations[randomInt(0, locations.length - 1)]
    const toLocation = stockItem.storageLocation
    const replenishQuantity = randomFloat(50, 500)
    const currentStock = stockItem.quantity
    const targetStock = randomFloat(500, 2000)
    
    return {
      id: generateId('REPL'),
      replenishmentNumber: `REPL-${String(i + 1).padStart(6, '0')}`,
      materialNumber: stockItem.materialNumber,
      materialDescription: stockItem.materialDescription,
      fromLocation: fromLocation.locationCode,
      toLocation,
      currentStock,
      targetStock,
      replenishQuantity,
      unit: stockItem.unit,
      status: ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][randomInt(0, 4)] as any,
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][randomInt(0, 3)] as any,
      replenishmentType: ['MIN_MAX', 'ABC', 'MANUAL', 'AUTO'][randomInt(0, 3)] as any,
      triggerReason: ['LOW_STOCK', 'PICKING_DEMAND', 'MANUAL', 'AUTO'][randomInt(0, 3)] as any,
      assignedTo: Math.random() > 0.4 ? `User ${randomInt(1, 20)}` : undefined,
      plannedDate: randomDate(new Date(), new Date(Date.now() + 7 * 86400000)),
      startedDate: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 7 * 86400000), new Date()) : undefined,
      completedDate: Math.random() > 0.6 ? randomDate(new Date(Date.now() - 5 * 86400000), new Date()) : undefined,
      actualQuantity: Math.random() > 0.6 ? replenishQuantity + randomFloat(-10, 10) : undefined,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
    }
  })
}

// Task Management Data - Warehouse Tasks
export const generateTasks = (count: number = 100) => {
  const taskTypes = ['PUTAWAY', 'PICKING', 'REPLENISHMENT', 'CYCLE_COUNT', 'TRANSFER', 'CROSS_DOCK', 'QUALITY_CHECK', 'MAINTENANCE']
  const statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']
  
  return Array.from({ length: count }, (_, i) => {
    const taskType = taskTypes[randomInt(0, taskTypes.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)] as any
    const priority = priorities[randomInt(0, priorities.length - 1)] as any
    
    return {
      id: generateId('TASK'),
      taskNumber: `TASK-${String(i + 1).padStart(6, '0')}`,
      taskType,
      title: `${taskType.replace(/_/g, ' ')} Task ${i + 1}`,
      description: `Task description for ${taskType.replace(/_/g, ' ').toLowerCase()}`,
      status,
      priority,
      assignedTo: Math.random() > 0.3 ? `User ${randomInt(1, 20)}` : undefined,
      assignedToName: Math.random() > 0.3 ? `Employee ${randomInt(1, 20)}` : undefined,
      location: `WH-${['A', 'B', 'C'][i % 3]}-${String(randomInt(1, 10)).padStart(2, '0')}`,
      materialNumber: Math.random() > 0.5 ? `MAT-${String(randomInt(1, 200)).padStart(6, '0')}` : undefined,
      quantity: Math.random() > 0.5 ? randomFloat(1, 100) : undefined,
      unit: Math.random() > 0.5 ? 'EA' : undefined,
      estimatedDuration: randomInt(15, 120), // minutes
      actualDuration: Math.random() > 0.5 ? randomInt(10, 150) : undefined,
      dueDate: randomDate(new Date(), new Date(Date.now() + 7 * 86400000)),
      createdDate: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      assignedDate: Math.random() > 0.4 ? randomDate(new Date(Date.now() - 5 * 86400000), new Date()) : undefined,
      startedDate: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 3 * 86400000), new Date()) : undefined,
      completedDate: Math.random() > 0.6 ? randomDate(new Date(Date.now() - 1 * 86400000), new Date()) : undefined,
      completionPercentage: status === 'COMPLETED' ? 100 : status === 'IN_PROGRESS' ? randomFloat(10, 90) : 0,
      notes: Math.random() > 0.7 ? `Task notes for ${taskType}` : undefined,
      equipmentRequired: Math.random() > 0.6 ? ['FORKLIFT', 'REACH_TRUCK'][randomInt(0, 1)] : undefined,
      createdAt: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
    }
  }).sort((a, b) => {
    // Sort by priority and status
    const priorityOrder = { CRITICAL: 0, URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 }
    const statusOrder = { PENDING: 0, ASSIGNED: 1, IN_PROGRESS: 2, ON_HOLD: 3, COMPLETED: 4, CANCELLED: 5 }
    if (priorityOrder[a.priority as keyof typeof priorityOrder] !== priorityOrder[b.priority as keyof typeof priorityOrder]) {
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
    }
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
  })
}

// ============================================================================
// MULTI-TENANT DATA GENERATORS
// ============================================================================

// Tenant Data Generator
export const generateTenants = (count: number = 1): Tenant[] => {
  const tenantNames = ['Hazalyze Logistics', 'Global 3PL Solutions', 'Premium Logistics', 'Express Warehousing']
  const types: ('3PL' | '4PL')[] = ['3PL', '4PL']
  const tiers: ('BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM')[] = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `tenant-${i + 1}`,
    name: tenantNames[i] || `Tenant ${i + 1}`,
    type: types[i % types.length],
    status: 'ACTIVE' as const,
    subscriptionTier: tiers[i % tiers.length],
    subscriptionStartDate: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
    maxCustomers: [100, 500, 1000, 5000][i % 4],
    maxWarehouses: [10, 25, 50, 100][i % 4],
    maxUsers: [50, 200, 500, 2000][i % 4],
    features: [],
    settings: {
      timezone: 'Asia/Riyadh',
      currency: 'SAR',
      dateFormat: 'MM/dd/yyyy',
      timeFormat: 'HH:mm',
      language: 'en',
      allowCustomerPortal: true,
      allowApiAccess: true,
      dataRetentionDays: 365,
      backupFrequency: 'DAILY' as const,
    },
    billing: {
      monthlyFee: [5000, 10000, 25000, 50000][i % 4],
      perCustomerFee: [50, 100, 200, 500][i % 4],
      perWarehouseFee: [500, 1000, 2000, 5000][i % 4],
      currency: 'SAR',
    },
    createdAt: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
    updatedAt: new Date(),
  }))
}

// Customer Data Generator (Multi-Tenant)
export const generateMultiTenantCustomers = (count: number = 20, tenantId: string = 'tenant-1'): Customer[] => {
  const customerNames = [
    'ABC Construction LLC', 'XYZ Manufacturing', 'Global Industries', 'Tech Solutions Inc',
    'Building Materials Co', 'Industrial Supplies Ltd', 'Construction Partners', 'Material Distributors',
    'Supply Chain Solutions', 'Logistics Experts', 'Trade Partners', 'Commercial Builders',
    'Premium Materials', 'Elite Construction', 'Mega Builders', 'Prime Suppliers',
  ]
  const serviceTiers: ('PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'STANDARD')[] = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'STANDARD']
  const statuses: ('ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ONBOARDING' | 'AT_RISK')[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ONBOARDING', 'AT_RISK']
  
  return Array.from({ length: count }, (_, i) => {
    const serviceTier = serviceTiers[i % serviceTiers.length]
    const monthlyRevenue = [50000, 100000, 250000, 500000, 1000000][i % 5]
    const contractValue = monthlyRevenue * 12
    
    return {
      id: `customer-${i + 1}`,
      tenantId,
      customerNumber: `CUST-${String(i + 1).padStart(6, '0')}`,
      customerName: customerNames[i % customerNames.length] + (i >= customerNames.length ? ` ${Math.floor(i / customerNames.length) + 1}` : ''),
      type: '3PL_CLIENT' as const,
      serviceTier,
      status: statuses[i % statuses.length],
      contractStartDate: randomDate(new Date(Date.now() - 730 * 86400000), new Date(Date.now() - 30 * 86400000)),
      contractEndDate: randomDate(new Date(Date.now() + 30 * 86400000), new Date(Date.now() + 365 * 86400000)),
      contractValue,
      contractCurrency: 'SAR',
      renewalDate: randomDate(new Date(Date.now() + 30 * 86400000), new Date(Date.now() + 365 * 86400000)),
      autoRenew: Math.random() > 0.3,
      monthlyRevenue,
      totalRevenue: monthlyRevenue * randomInt(6, 24),
      averageOrderValue: randomFloat(1000, 10000),
      paymentTerms: ['NET_30', 'NET_60', 'NET_90', 'PREPAID'][randomInt(0, 3)],
      creditLimit: monthlyRevenue * 2,
      outstandingBalance: randomFloat(0, monthlyRevenue * 0.5),
      allocatedWarehouses: [`warehouse-${(i % 3) + 1}`],
      dedicatedSpace: [],
      serviceLevel: {
        tier: serviceTier,
        features: serviceTier === 'PLATINUM' ? ['Dedicated account manager', 'Priority processing', '24/7 support'] : [],
        slaComplianceTarget: serviceTier === 'PLATINUM' ? 99.5 : serviceTier === 'GOLD' ? 98.0 : serviceTier === 'SILVER' ? 95.0 : 90.0,
        priorityLevel: serviceTier === 'PLATINUM' ? 1 : serviceTier === 'GOLD' ? 2 : serviceTier === 'SILVER' ? 3 : 4,
        pricingMultiplier: serviceTier === 'PLATINUM' ? 1.5 : serviceTier === 'GOLD' ? 1.2 : serviceTier === 'SILVER' ? 1.0 : 0.9,
        dedicatedResources: serviceTier === 'PLATINUM',
        accountManager: serviceTier === 'PLATINUM' || serviceTier === 'GOLD' ? `Manager ${i + 1}` : undefined,
      },
      slaTargets: [],
      primaryContact: {
        id: `contact-${i + 1}`,
        name: `Contact ${i + 1}`,
        email: `contact${i + 1}@customer${i + 1}.com`,
        phone: `+971${randomInt(500000000, 599999999)}`,
        role: 'Primary Contact',
        isPrimary: true,
      },
      operationalContacts: [],
      metrics: {
        totalOrders: randomInt(100, 5000),
        totalRevenue: monthlyRevenue * randomInt(6, 24),
        averageOrderValue: randomFloat(1000, 10000),
        orderFulfillmentRate: randomFloat(85, 99),
        slaComplianceRate: randomFloat(90, 99.5),
        inventoryValue: randomFloat(100000, 5000000),
        spaceUtilization: randomFloat(60, 95),
        orderVolumeTrend: ['INCREASING', 'STABLE', 'DECREASING'][randomInt(0, 2)] as any,
        revenueTrend: ['INCREASING', 'STABLE', 'DECREASING'][randomInt(0, 2)] as any,
        lastOrderDate: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
        daysSinceLastOrder: randomInt(0, 7),
      },
      healthScore: randomFloat(70, 100),
      churnRisk: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][randomInt(0, 3)] as any,
      satisfactionScore: randomFloat(80, 100),
      settings: {
        allowCustomerPortal: true,
        allowApiAccess: serviceTier === 'PLATINUM' || serviceTier === 'GOLD',
        defaultWarehouse: `warehouse-${(i % 3) + 1}`,
        notificationPreferences: {
          email: true,
          sms: serviceTier === 'PLATINUM',
          push: true,
        },
        reportFrequency: 'WEEKLY' as const,
      },
      integrations: [],
      createdAt: randomDate(new Date(Date.now() - 730 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Warehouse Data Generator (Multi-Tenant) - Saudi Arabia
export const generateMultiTenantWarehouses = (count: number = 5, tenantId: string = 'tenant-1'): Warehouse[] => {
  const { 
    saudiCities, 
    saudiWarehouseNames, 
    getRandomIndustrialArea, 
    getRandomSaudiPostalCode,
    saudiWarehouseCapabilities,
    saudiComplianceStandards,
    saudiRegulators,
    SAUDI_TIMEZONE 
  } = require('./saudiData')
  
  const types: ('DEDICATED' | 'SHARED' | 'MULTI_TENANT' | 'HAZMAT')[] = ['DEDICATED', 'SHARED', 'MULTI_TENANT', 'HAZMAT']
  
  return Array.from({ length: count }, (_, i) => {
    // Ensure at least 20% of warehouses are HAZMAT (every 5th warehouse)
    const warehouseType = i % 5 === 0 ? 'HAZMAT' : types[i % types.length]
    const city = saudiCities[i % saudiCities.length]
    const totalArea = randomFloat(5000, 50000)
    const totalPalletPositions = randomInt(1000, 10000)
    const usedArea = totalArea * randomFloat(0.6, 0.95)
    const usedPalletPositions = totalPalletPositions * randomFloat(0.6, 0.95)
    const industrialArea = getRandomIndustrialArea(city.name)
    
    // Generate regulatory certifications
    const hasSABER = Math.random() > 0.3
    const hasSFDA = Math.random() > 0.4
    const hasMODON = Math.random() > 0.2
    const hasZATCA = Math.random() > 0.3
    
    const certifications = []
    if (hasSABER) {
      certifications.push({
        id: `cert-saber-${i + 1}`,
        regulator: 'SABER' as const,
        certificateNumber: `SAB-${String(i + 1).padStart(6, '0')}`,
        certificateType: 'Product Certificate of Conformity',
        issueDate: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
        expiryDate: randomDate(new Date(), new Date(Date.now() + 365 * 86400000)),
        status: 'ACTIVE' as const,
        description: 'SABER product safety certification',
      })
    }
    if (hasSFDA) {
      certifications.push({
        id: `cert-sfda-${i + 1}`,
        regulator: 'SFDA' as const,
        certificateNumber: `SFDA-${String(i + 1).padStart(6, '0')}`,
        certificateType: 'Food Storage License',
        issueDate: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
        expiryDate: randomDate(new Date(), new Date(Date.now() + 365 * 86400000)),
        status: 'ACTIVE' as const,
        description: 'SFDA food storage facility license',
      })
    }
    if (hasMODON) {
      certifications.push({
        id: `cert-modon-${i + 1}`,
        regulator: 'MODON' as const,
        certificateNumber: `MODON-${String(i + 1).padStart(6, '0')}`,
        certificateType: 'Industrial Warehouse License',
        issueDate: randomDate(new Date(Date.now() - 730 * 86400000), new Date()),
        expiryDate: undefined,
        status: 'ACTIVE' as const,
        description: 'MODON industrial warehouse license',
      })
    }
    if (hasZATCA) {
      certifications.push({
        id: `cert-zatca-${i + 1}`,
        regulator: 'ZATCA' as const,
        certificateNumber: `ZATCA-${String(i + 1).padStart(6, '0')}`,
        certificateType: 'Bonded Warehouse License',
        issueDate: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
        expiryDate: randomDate(new Date(), new Date(Date.now() + 365 * 86400000)),
        status: 'ACTIVE' as const,
        description: 'ZATCA bonded warehouse license',
      })
    }
    
    // Select compliance standards
    const complianceStandards = saudiComplianceStandards
      .sort(() => Math.random() - 0.5)
      .slice(0, randomInt(3, 8))
    
    // Add Saudi-specific capabilities
    const baseCapabilities = [
      { id: 'cap-1', name: 'Picking', enabled: true },
      { id: 'cap-2', name: 'Putaway', enabled: true },
      { id: 'cap-3', name: 'Cross-Docking', enabled: Math.random() > 0.5 },
      { id: 'cap-4', name: 'Value-Added Services', enabled: Math.random() > 0.5 },
    ]
    
    const saudiCaps = saudiWarehouseCapabilities
      .filter(() => Math.random() > 0.5)
      .map((cap: { id: string; name: string }) => ({ id: cap.id, name: cap.name, enabled: true }))
    
    // Add HAZMAT capability if warehouse is HAZMAT type
    if (warehouseType === 'HAZMAT') {
      saudiCaps.push({ id: 'hazmat', name: 'HAZMAT Storage', enabled: true })
    }
    
    return {
      id: `warehouse-${i + 1}`,
      tenantId,
      warehouseCode: `WH-${city.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      warehouseName: saudiWarehouseNames[i] || `${city.name} Warehouse ${i + 1}`,
      type: types[i % types.length],
      status: 'ACTIVE' as const,
      address: {
        street: `${randomInt(1, 999)} ${industrialArea}`,
        city: city.name,
        state: city.region,
        postalCode: getRandomSaudiPostalCode(city.name),
        country: 'Saudi Arabia',
      },
      coordinates: {
        latitude: city.coordinates.lat + randomFloat(-0.1, 0.1),
        longitude: city.coordinates.lng + randomFloat(-0.1, 0.1),
      },
      timezone: SAUDI_TIMEZONE,
      capacity: {
        totalArea,
        totalPalletPositions,
        totalVolume: totalArea * randomFloat(3, 6),
        maxWeight: totalArea * randomFloat(500, 2000),
        dockDoors: randomInt(5, 20),
        loadingBays: randomInt(10, 40),
        temperatureZones: [
          {
            id: `zone-${i + 1}-1`,
            name: 'Ambient',
            temperatureRange: { min: 15, max: 25 },
            area: totalArea * 0.7,
            palletPositions: totalPalletPositions * 0.7,
            totalVolume: totalArea * 0.7 * 4,
            usedArea: usedArea * 0.7,
            usedPalletPositions: usedPalletPositions * 0.7,
            utilization: (usedArea * 0.7) / (totalArea * 0.7) * 100,
          },
          {
            id: `zone-${i + 1}-2`,
            name: 'Cold',
            temperatureRange: { min: 2, max: 8 },
            area: totalArea * 0.2,
            palletPositions: totalPalletPositions * 0.2,
            totalVolume: totalArea * 0.2 * 4,
            usedArea: usedArea * 0.2,
            usedPalletPositions: usedPalletPositions * 0.2,
            utilization: (usedArea * 0.2) / (totalArea * 0.2) * 100,
          },
          {
            id: `zone-${i + 1}-3`,
            name: 'Frozen',
            temperatureRange: { min: -20, max: -10 },
            area: totalArea * 0.1,
            palletPositions: totalPalletPositions * 0.1,
            totalVolume: totalArea * 0.1 * 4,
            usedArea: usedArea * 0.1,
            usedPalletPositions: usedPalletPositions * 0.1,
            utilization: (usedArea * 0.1) / (totalArea * 0.1) * 100,
          },
        ],
      },
      currentUtilization: {
        totalArea,
        usedArea,
        availableArea: totalArea - usedArea,
        utilizationPercentage: (usedArea / totalArea) * 100,
        totalPalletPositions,
        usedPalletPositions,
        availablePalletPositions: totalPalletPositions - usedPalletPositions,
        palletUtilizationPercentage: (usedPalletPositions / totalPalletPositions) * 100,
        customerBreakdown: [],
        trends: [],
      },
      servingCustomers: Array.from({ length: randomInt(3, 10) }, (_, j) => `customer-${j + 1}`),
      primaryCustomer: i === 0 ? 'customer-1' : undefined,
      operatingHours: {
        monday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        friday: { isOpen: false }, // Friday is weekend in Saudi Arabia
        saturday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        sunday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      },
      capabilities: [...baseCapabilities, ...saudiCaps],
      resources: Array.from({ length: randomInt(5, 20) }, (_, j) => ({
        id: `resource-${i + 1}-${j + 1}`,
        type: ['FORKLIFT', 'REACH_TRUCK', 'PALLET_JACK'][randomInt(0, 2)] as any,
        name: `Resource ${j + 1}`,
        status: ['AVAILABLE', 'IN_USE', 'MAINTENANCE'][randomInt(0, 2)] as any,
        utilization: randomFloat(0, 100),
      })),
      metrics: {
        totalOrders: randomInt(1000, 10000),
        ordersToday: randomInt(10, 100),
        ordersThisWeek: randomInt(50, 500),
        ordersThisMonth: randomInt(200, 2000),
        averageOrderFulfillmentTime: randomFloat(2, 8),
        onTimeDeliveryRate: randomFloat(90, 99),
        inventoryAccuracy: randomFloat(95, 99.9),
        spaceEfficiency: randomFloat(75, 95),
        throughput: randomFloat(50, 200),
        costPerOrder: randomFloat(10, 50),
        revenue: randomFloat(100000, 1000000),
      },
      regulatory: {
        saberCertified: hasSABER,
        sfdaLicensed: hasSFDA,
        modonLicense: hasMODON ? `MODON-${String(i + 1).padStart(6, '0')}` : undefined,
        zatcaBonded: hasZATCA,
        complianceStandards,
        certifications,
      },
      createdAt: randomDate(new Date(Date.now() - 730 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// User Data Generator (Multi-Tenant)
export const generateMultiTenantUsers = (count: number = 15, tenantId: string = 'tenant-1'): User[] => {
  const roles: UserRole[] = [
    'SYSTEM_ADMIN',
    'BUSINESS_DEVELOPMENT_MANAGER',
    'WAREHOUSE_HEAD',
    'OPERATIONS_MANAGER',
    'CUSTOMER_ACCOUNT_MANAGER',
    'WAREHOUSE_SUPERVISOR',
    'WAREHOUSE_OPERATOR',
    'QUALITY_MANAGER',
    'INVENTORY_SPECIALIST',
  ]
  const names = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson',
    'Lisa Anderson', 'Robert Taylor', 'Jennifer Martinez', 'William Garcia', 'Amanda Rodriguez',
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const role = roles[i % roles.length]
    // Import getDefaultPermissions dynamically to avoid circular dependency
    const { getDefaultPermissions } = require('@/types/user')
    
    return {
      id: `user-${i + 1}`,
      tenantId,
      email: `user${i + 1}@hazalyze.com`,
      name: names[i % names.length],
      role,
      status: 'ACTIVE' as const,
      assignedCustomers: role === 'CUSTOMER_ACCOUNT_MANAGER' ? [`customer-${i + 1}`, `customer-${i + 2}`] : undefined,
      assignedWarehouses: ['WAREHOUSE_HEAD', 'WAREHOUSE_SUPERVISOR', 'WAREHOUSE_OPERATOR', 'OPERATIONS_MANAGER'].includes(role)
        ? [`warehouse-${(i % 3) + 1}`]
        : undefined,
      assignedRegions: undefined,
      permissions: getDefaultPermissions(role),
      preferences: {
        theme: 'dark' as const,
        language: 'en',
        timezone: 'Asia/Riyadh',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'HH:mm',
        defaultView: 'table' as const,
        notifications: {
          email: true,
          sms: false,
          push: true,
          desktop: true,
        },
        dashboard: {
          widgets: [],
          layout: 'grid' as const,
        },
      },
      lastLogin: randomDate(new Date(Date.now() - 7 * 86400000), new Date()),
      loginCount: randomInt(10, 1000),
      createdAt: randomDate(new Date(Date.now() - 365 * 86400000), new Date()),
      updatedAt: new Date(),
    }
  })
}

// Operational Metrics Data - Warehouse performance, throughput, efficiency
export const generateOperationalMetrics = (count: number = 30) => {
  const warehouses = ['WH-A', 'WH-B', 'WH-C', 'WH-D']
  const shifts = ['MORNING', 'AFTERNOON', 'NIGHT']
  
  return Array.from({ length: count }, (_, i) => {
    const date = randomDate(new Date(Date.now() - count * 86400000), new Date())
    const warehouse = warehouses[randomInt(0, warehouses.length - 1)]
    const shift = shifts[randomInt(0, shifts.length - 1)]
    
    // Throughput metrics
    const receiptsProcessed = randomInt(50, 500)
    const issuesProcessed = randomInt(50, 500)
    const putawaysCompleted = randomInt(30, 300)
    const picksCompleted = randomInt(100, 1000)
    const totalTransactions = receiptsProcessed + issuesProcessed + putawaysCompleted + picksCompleted
    
    // Performance metrics
    const avgReceiptTime = randomFloat(15, 60) // minutes
    const avgIssueTime = randomFloat(10, 45) // minutes
    const avgPutawayTime = randomFloat(20, 90) // minutes
    const avgPickTime = randomFloat(5, 30) // minutes per item
    
    // Efficiency metrics
    const onTimeReceiptRate = randomFloat(85, 100)
    const onTimeIssueRate = randomFloat(90, 100)
    const putawayAccuracy = randomFloat(95, 100)
    const pickingAccuracy = randomFloat(98, 100)
    
    // Resource utilization
    const laborUtilization = randomFloat(70, 95)
    const equipmentUtilization = randomFloat(60, 90)
    const spaceUtilization = randomFloat(65, 95)
    
    // Quality metrics
    const damageRate = randomFloat(0.1, 2.0)
    const errorRate = randomFloat(0.5, 3.0)
    const reworkRate = randomFloat(0.2, 1.5)
    
    return {
      id: generateId('OPR'),
      date: format(date, 'yyyy-MM-dd'),
      warehouse,
      shift,
      // Throughput
      receiptsProcessed,
      issuesProcessed,
      putawaysCompleted,
      picksCompleted,
      totalTransactions,
      // Performance
      avgReceiptTime: parseFloat(avgReceiptTime.toFixed(1)),
      avgIssueTime: parseFloat(avgIssueTime.toFixed(1)),
      avgPutawayTime: parseFloat(avgPutawayTime.toFixed(1)),
      avgPickTime: parseFloat(avgPickTime.toFixed(1)),
      // Efficiency
      onTimeReceiptRate: parseFloat(onTimeReceiptRate.toFixed(1)),
      onTimeIssueRate: parseFloat(onTimeIssueRate.toFixed(1)),
      putawayAccuracy: parseFloat(putawayAccuracy.toFixed(1)),
      pickingAccuracy: parseFloat(pickingAccuracy.toFixed(1)),
      // Utilization
      laborUtilization: parseFloat(laborUtilization.toFixed(1)),
      equipmentUtilization: parseFloat(equipmentUtilization.toFixed(1)),
      spaceUtilization: parseFloat(spaceUtilization.toFixed(1)),
      // Quality
      damageRate: parseFloat(damageRate.toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      reworkRate: parseFloat(reworkRate.toFixed(2)),
      // Overall score
      overallScore: parseFloat(((onTimeReceiptRate + onTimeIssueRate + putawayAccuracy + pickingAccuracy) / 4).toFixed(1)),
      createdAt: date,
    }
  })
}

// Export all generators
export const mockDataGenerators = {
  generateMaterialMaster,
  generateVendorMaster,
  generateCustomerMaster,
  generateStorageLocations,
  generatePurchaseOrders,
  generateSalesOrders,
  generateInventoryStock,
  generateCycleCounts,
  generateCarriers,
  generateWorkCenters,
  generateInspectionLots,
  generateNCRs,
  generateQualityCertificates,
  generatePickingTasks,
  generatePickers,
  generateCounters,
  generateABCAnalysis,
  generateLoadPlans,
  generateRoutes,
  generateShipments,
  generateFreightRecords,
  generateDamageReports,
  generateExpiryRecords,
  generateStockAlerts,
  generateReservations,
  generateWaves,
  generatePickReleases,
  generateReturns,
  generateReplenishments,
  generateTasks,
  generateOperationalMetrics,
  // Multi-tenant generators
  generateTenants,
  generateMultiTenantCustomers,
  generateMultiTenantWarehouses,
  generateMultiTenantUsers,
}

