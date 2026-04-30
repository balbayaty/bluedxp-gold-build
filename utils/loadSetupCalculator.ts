import { ASNData, Pallet, LoadSetup, TruckRecommendation, LoadOptimization } from '@/types/asn'

// Standard truck/container specifications
const TRUCK_SPECS = {
  '20ft Container': {
    capacity: 28000, // kg
    volume: 33.2, // m³
    length: 6.06, // m
    width: 2.44, // m
    height: 2.59, // m
  },
  '40ft Container': {
    capacity: 28000, // kg
    volume: 67.7, // m³
    length: 12.19, // m
    width: 2.44, // m
    height: 2.59, // m
  },
  'Flatbed Truck': {
    capacity: 25000, // kg
    volume: 50, // m³
    length: 12, // m
    width: 2.4, // m
    height: 2.5, // m
  },
  'Box Truck': {
    capacity: 12000, // kg
    volume: 30, // m³
    length: 6, // m
    width: 2.4, // m
    height: 2.4, // m
  },
  'Refrigerated Truck': {
    capacity: 15000, // kg
    volume: 35, // m³
    length: 7, // m
    width: 2.4, // m
    height: 2.4, // m
  },
  'LTL Truck': {
    capacity: 10000, // kg
    volume: 25, // m³
    length: 5, // m
    width: 2.4, // m
    height: 2.4, // m
  },
}

// Standard pallet dimensions (cm)
const STANDARD_PALLET = {
  length: 120, // cm
  width: 100, // cm
  height: 150, // cm (average with product)
}

/**
 * Calculate Load Setup based on ASN data and pallets
 */
export function calculateLoadSetup(asn: ASNData, pallets: Pallet[]): LoadSetup {
  const totalPallets = pallets.length || asn.numOfPlt || 1
  const totalWeight = asn.totalWeight || 0
  const totalVolume = asn.totalVolume || 0
  const totalCBM = asn.totalCBM || totalVolume

  // Calculate averages
  const averagePalletWeight = totalPallets > 0 ? totalWeight / totalPallets : 0
  const averagePalletVolume = totalPallets > 0 ? totalVolume / totalPallets : 0

  // Calculate average pallet dimensions (use standard if not available)
  const averagePalletDimensions = {
    length: STANDARD_PALLET.length,
    width: STANDARD_PALLET.width,
    height: STANDARD_PALLET.height,
  }

  // Generate truck recommendations
  const recommendations = generateTruckRecommendations(totalWeight, totalVolume, totalCBM, totalPallets)

  // Calculate load optimization
  const loadOptimization = calculateLoadOptimization(totalWeight, totalVolume, recommendations[0])

  // Check for special requirements
  const specialRequirements: string[] = []
  if (pallets.some(p => p.hasDamage)) {
    specialRequirements.push('Handle with care - Damaged pallets')
  }
  // Add more special requirements based on material type, temperature, etc.

  return {
    id: `load-${asn.id}`,
    asnId: asn.id,
    totalPallets,
    totalWeight,
    totalVolume,
    totalCBM,
    averagePalletWeight,
    averagePalletVolume,
    averagePalletDimensions,
    recommendedTruckTypes: recommendations,
    loadOptimization,
    specialRequirements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Generate truck recommendations based on load characteristics
 */
function generateTruckRecommendations(
  totalWeight: number,
  totalVolume: number,
  totalCBM: number,
  totalPallets: number
): TruckRecommendation[] {
  const recommendations: TruckRecommendation[] = []

  // Calculate suitability score for each truck type
  Object.entries(TRUCK_SPECS).forEach(([truckType, specs]) => {
    const weightUtilization = (totalWeight / specs.capacity) * 100
    const volumeUtilization = (totalVolume / specs.volume) * 100

    // Calculate suitability score (0-100)
    let suitabilityScore = 0

    // Weight-based scoring
    if (totalWeight <= specs.capacity) {
      suitabilityScore += 50
      // Prefer trucks with 70-90% utilization
      if (weightUtilization >= 70 && weightUtilization <= 90) {
        suitabilityScore += 20
      } else if (weightUtilization >= 50 && weightUtilization < 70) {
        suitabilityScore += 10
      }
    } else {
      // Over capacity - negative score
      suitabilityScore -= 30
    }

    // Volume-based scoring
    if (totalVolume <= specs.volume) {
      suitabilityScore += 30
      // Prefer trucks with 70-90% utilization
      if (volumeUtilization >= 70 && volumeUtilization <= 90) {
        suitabilityScore += 20
      } else if (volumeUtilization >= 50 && volumeUtilization < 70) {
        suitabilityScore += 10
      }
    } else {
      // Over capacity - negative score
      suitabilityScore -= 20
    }

    // Bonus for exact fit
    if (weightUtilization >= 85 && weightUtilization <= 95 && volumeUtilization >= 85 && volumeUtilization <= 95) {
      suitabilityScore += 10
    }

    // Penalty for underutilization (< 30%)
    if (weightUtilization < 30 || volumeUtilization < 30) {
      suitabilityScore -= 15
    }

    // Clamp score between 0 and 100
    suitabilityScore = Math.max(0, Math.min(100, suitabilityScore))

    // Only include viable options (score > 0)
    if (suitabilityScore > 0) {
      recommendations.push({
        truckType,
        capacity: specs.capacity,
        volume: specs.volume,
        suitabilityScore: Math.round(suitabilityScore),
        estimatedCost: estimateCost(truckType, totalWeight, totalVolume),
        estimatedTransitTime: estimateTransitTime(truckType),
        notes: generateNotes(truckType, totalWeight, totalVolume, specs),
      })
    }
  })

  // Sort by suitability score (highest first)
  return recommendations.sort((a, b) => b.suitabilityScore - a.suitabilityScore)
}

/**
 * Calculate load optimization metrics
 */
function calculateLoadOptimization(
  totalWeight: number,
  totalVolume: number,
  bestTruck: TruckRecommendation
): LoadOptimization {
  const weightUtilization = (totalWeight / bestTruck.capacity) * 100
  const volumeUtilization = (totalVolume / bestTruck.volume) * 100
  const utilizationPercentage = (weightUtilization + volumeUtilization) / 2

  const canOptimize = utilizationPercentage < 70 || utilizationPercentage > 95
  const optimizationSuggestions: string[] = []

  if (weightUtilization < 50) {
    optimizationSuggestions.push('Consider consolidating with other shipments to improve weight utilization')
  }
  if (volumeUtilization < 50) {
    optimizationSuggestions.push('Consider using smaller truck or consolidating shipments')
  }
  if (weightUtilization > 95) {
    optimizationSuggestions.push('Weight is near capacity limit - verify actual weights before loading')
  }
  if (volumeUtilization > 95) {
    optimizationSuggestions.push('Volume is near capacity limit - verify actual dimensions before loading')
  }

  // Calculate recommended stacking
  const stackingHeight = Math.floor(250 / 150) // Assuming 150cm pallet height, 250cm truck height
  const palletArrangement = calculatePalletArrangement(totalWeight, totalVolume, bestTruck)

  return {
    utilizationPercentage: Math.round(utilizationPercentage),
    weightUtilization: Math.round(weightUtilization),
    volumeUtilization: Math.round(volumeUtilization),
    palletArrangement,
    stackingHeight,
    canOptimize,
    optimizationSuggestions,
  }
}

/**
 * Calculate pallet arrangement recommendation
 */
function calculatePalletArrangement(
  totalWeight: number,
  totalVolume: number,
  truck: TruckRecommendation
): string {
  // Simplified calculation - in real scenario, use 3D bin packing algorithm
  const palletsPerRow = Math.floor(truck.volume / (STANDARD_PALLET.length * STANDARD_PALLET.width * STANDARD_PALLET.height / 1000000))
  return `Approximately ${palletsPerRow} pallets per row, 2 rows, 1-2 levels high`
}

/**
 * Estimate cost based on truck type and load
 */
function estimateCost(truckType: string, weight: number, volume: number): number {
  // Simplified cost estimation (in real scenario, use actual pricing)
  const baseCosts: Record<string, number> = {
    '20ft Container': 500,
    '40ft Container': 800,
    'Flatbed Truck': 400,
    'Box Truck': 300,
    'Refrigerated Truck': 500,
    'LTL Truck': 250,
  }

  const baseCost = baseCosts[truckType] || 300
  const weightFactor = weight / 1000 // Cost per 1000kg
  const volumeFactor = volume * 10 // Cost per m³

  return Math.round(baseCost + weightFactor * 0.5 + volumeFactor * 2)
}

/**
 * Estimate transit time based on truck type
 */
function estimateTransitTime(truckType: string): number {
  // Simplified estimation (in hours)
  const transitTimes: Record<string, number> = {
    '20ft Container': 48,
    '40ft Container': 48,
    'Flatbed Truck': 24,
    'Box Truck': 12,
    'Refrigerated Truck': 18,
    'LTL Truck': 12,
  }

  return transitTimes[truckType] || 24
}

/**
 * Generate notes for truck recommendation
 */
function generateNotes(
  truckType: string,
  totalWeight: number,
  totalVolume: number,
  specs: { capacity: number; volume: number }
): string {
  const weightUtilization = (totalWeight / specs.capacity) * 100
  const volumeUtilization = (totalVolume / specs.volume) * 100

  const notes: string[] = []

  if (weightUtilization > 90) {
    notes.push('High weight utilization - verify actual weights')
  }
  if (volumeUtilization > 90) {
    notes.push('High volume utilization - verify actual dimensions')
  }
  if (weightUtilization < 40) {
    notes.push('Low weight utilization - consider smaller truck or consolidation')
  }
  if (volumeUtilization < 40) {
    notes.push('Low volume utilization - consider smaller truck or consolidation')
  }

  if (truckType.includes('Container')) {
    notes.push('Suitable for sea freight and long-distance transport')
  }
  if (truckType.includes('Refrigerated')) {
    notes.push('Temperature-controlled transport available')
  }

  return notes.join(' • ') || 'Standard transport requirements'
}

