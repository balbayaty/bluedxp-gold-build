/**
 * Global Train Schedules Types
 * Comprehensive rail freight scheduling system
 */

import { OperatingHours, Location } from './rfq'

// Train Service Types
export type TrainServiceType =
  | 'NATIONAL_SHUTTLE'
  | 'RAIL_DIRECT_CONSIST'
  | 'RAIL_TRANSFER'
  | 'EXPRESS_FREIGHT'
  | 'STANDARD_FREIGHT'
  | 'INTERMODAL'
  | 'CROSS_BORDER'
  | 'BULK_CARGO'
  | 'CONTAINER_SERVICE'

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

// Station Types
export interface TrainStation {
  id: string
  code: string
  name: string
  fullName: string
  country: string
  city: string
  region: string
  type: 'TERMINAL' | 'STATION' | 'INTERMODAL' | 'BORDER' | 'PORT' | 'YARD'
  coordinates: { lat: number; lng: number }
  capabilities: string[]
  operatingHours: OperatingHours
  facilities: string[]
  connections?: TransportConnection[]
  handlingEquipment?: string[]
  storageCapacity?: StorageCapacity
}

export interface TransportConnection {
  type: 'ROAD' | 'SEA' | 'AIR' | 'RAIL'
  destination: string
  distance: number
  transitTime: number
  frequency?: string
}

export interface StorageCapacity {
  containerYard?: number
  warehouse?: number
  hazmatStorage?: boolean
  coldStorage?: boolean
  unit: 'TEU' | 'SQM'
}

// Route Types
export interface TrainRoute {
  id: string
  name: string
  code: string
  origin: TrainStation
  destination: TrainStation
  viaStations: TrainStation[]
  distance: number
  standardTransitTime: number
  frequency: string
  serviceTypes: TrainServiceType[]
  crossBorder: boolean
  countries: string[]
  maxCapacity?: RouteCapacity
  restrictions?: RouteRestriction[]
}

export interface RouteCapacity {
  maxWeight: number
  maxLength: number
  maxContainers: number
  unit: string
}

export interface RouteRestriction {
  type: string
  description: string
  applies: string
}

// Schedule Types
export interface TrainSchedule {
  id: string
  routeId: string
  trainNumber: string
  serviceType: TrainServiceType
  operator: string
  dayOfWeek: DayOfWeek[]
  departures: ScheduledDeparture[]
  effectiveFrom: string
  effectiveUntil?: string
  exceptions?: ScheduleException[]
  notes?: string
  capacity?: TrainCapacity
}

export interface ScheduledDeparture {
  station: string
  stationCode: string
  arrivalTime?: string
  departureTime: string
  nextDay: boolean
  dwellTime?: number
  platform?: string
  activities?: string[]
}

export interface ScheduleException {
  date: string
  type: 'CANCELLED' | 'MODIFIED' | 'ADDED'
  reason: string
  alternativeSchedule?: ScheduledDeparture[]
}

export interface TrainCapacity {
  wagons: number
  containers: number
  maxWeight: number
  hazmatAllowed: boolean
  reeferAllowed: boolean
}

// Complete System
export interface TrainScheduleSystem {
  id: string
  name: string
  region: string
  operator: string
  routes: TrainRoute[]
  stations: TrainStation[]
  schedules: TrainSchedule[]
  lastUpdated: string
  timezone: string
}

// Pre-defined Routes (GCC Rail Network)
export interface GCCRailNetwork {
  corridors: RailCorridor[]
  internationalConnections: InternationalConnection[]
  futureExpansions: FutureExpansion[]
}

export interface RailCorridor {
  id: string
  name: string
  countries: string[]
  totalLength: number
  status: 'OPERATIONAL' | 'UNDER_CONSTRUCTION' | 'PLANNED'
  estimatedCompletion?: string
  stations: string[]
}

export interface InternationalConnection {
  from: string
  to: string
  borderCrossing: string
  customsArrangement: string
  transitAgreement: boolean
}

export interface FutureExpansion {
  name: string
  description: string
  expectedCompletion: string
  benefits: string[]
}

// Default GCC Train Stations
export const DEFAULT_GCC_STATIONS: Partial<TrainStation>[] = [
  {
    code: 'GTT',
    name: 'GTT Terminal',
    country: 'Saudi Arabia',
    city: 'Dammam',
    type: 'TERMINAL'
  },
  {
    code: 'ICAD',
    name: 'ICAD Terminal',
    country: 'UAE',
    city: 'Abu Dhabi',
    type: 'INTERMODAL'
  },
  {
    code: 'NDP',
    name: 'NDP Station',
    country: 'UAE',
    city: 'Dubai',
    type: 'STATION'
  },
  {
    code: 'JART',
    name: 'Jebel Ali Rail Terminal',
    country: 'UAE',
    city: 'Dubai',
    type: 'PORT'
  },
  {
    code: 'DRY',
    name: 'Dry Port Riyadh',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    type: 'TERMINAL'
  },
  {
    code: 'JED',
    name: 'Jeddah Rail Terminal',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    type: 'PORT'
  }
]


