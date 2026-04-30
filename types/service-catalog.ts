/**
 * Service Catalog Types
 * Comprehensive service definitions for all logistics services
 */

import { ServiceCategory, ServiceSubCategory, TransportMode } from './rfq'

// Service Catalog
export interface ServiceCatalog {
  id: string
  version: string
  effectiveDate: string
  services: CatalogService[]
  bundles: ServiceBundle[]
  rateCards: RateCard[]
}

export interface CatalogService {
  id: string
  code: string
  name: string
  category: ServiceCategory
  subCategory: ServiceSubCategory
  description: string
  features: string[]
  inclusions: string[]
  exclusions: string[]
  prerequisites?: string[]
  standardPricing?: StandardPricing
  customizable: boolean
  addOns?: ServiceAddOn[]
  availability: string[]
  leadTime?: string
}

export interface StandardPricing {
  basePrice: number
  unit: string
  currency: string
  tieredPricing?: TieredPrice[]
  minimumCharge?: number
  surcharges?: Surcharge[]
}

export interface TieredPrice {
  minVolume: number
  maxVolume?: number
  pricePerUnit: number
}

export interface Surcharge {
  name: string
  type: 'FIXED' | 'PERCENTAGE'
  value: number
  conditions?: string[]
}

export interface ServiceAddOn {
  id: string
  name: string
  description: string
  price: number
  unit: string
}

export interface ServiceBundle {
  id: string
  name: string
  description: string
  services: string[]
  bundlePrice: number
  savings: number
  features: string[]
}

export interface RateCard {
  id: string
  name: string
  effectiveDate: string
  expiryDate?: string
  currency: string
  routes: RouteRate[]
  services: ServiceRate[]
  volumeDiscounts: VolumeDiscount[]
}

export interface RouteRate {
  origin: string
  destination: string
  mode: TransportMode
  rates: ModeRate[]
}

export interface ModeRate {
  equipmentType: string
  baseRate: number
  fuelSurcharge: number
  otherCharges: number
  transitTime: number
  validFrom: string
  validUntil: string
}

export interface ServiceRate {
  serviceId: string
  rate: number
  unit: string
  minimumCharge: number
}

export interface VolumeDiscount {
  threshold: number
  discountPercentage: number
  unit: string
}

// SLA Definitions
export interface SLADefinition {
  metric: string
  target: string
  measurementPeriod: string
  penalty?: string
  bonus?: string
}

export interface KPIDefinition {
  name: string
  description: string
  target: string
  unit: string
  frequency: string
}


