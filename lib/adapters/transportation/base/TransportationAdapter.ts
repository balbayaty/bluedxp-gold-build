/**
 * Transportation Adapter Base Interface
 * 
 * Provides unified interface for all transportation integrations:
 * - Standalone (internal system)
 * - ERP systems (Zoho, SAP, Oracle, ERPNext)
 * - TMS providers (UberFreight, Flexport, Project44, FourKites)
 * - Carriers (DHL, FedEx, UPS, Aramex, etc.)
 * - Customs authorities (Rabet.sa, etc.)
 */

import type { 
  Shipment, 
  Carrier, 
  Quote, 
  Booking, 
  TrackingEvent,
  CustomsInfo,
  CustomsBroker,
  Location
} from '@/types/tms'

export interface TransportationAdapter {
  // Identification
  readonly id: string
  readonly name: string
  readonly type: 'STANDALONE' | 'ERP' | 'TMS' | 'CARRIER' | 'CUSTOMS' | 'DOCUMENT'
  
  // Connection
  isConnected(): Promise<boolean>
  testConnection(): Promise<{ success: boolean; message: string }>
  disconnect(): Promise<void>
  
  // Shipments
  getShipments(filters?: ShipmentFilters): Promise<Shipment[]>
  getShipment(id: string): Promise<Shipment | null>
  createShipment(shipment: Partial<Shipment>): Promise<Shipment>
  updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment>
  cancelShipment(id: string): Promise<void>
  
  // Tracking
  trackShipment(trackingNumber: string): Promise<TrackingEvent[]>
  getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]>
  
  // Carriers
  getCarriers(): Promise<Carrier[]>
  getCarrier(id: string): Promise<Carrier | null>
  
  // Quotes
  getQuote(request: QuoteRequest): Promise<Quote>
  getQuotes(requests: QuoteRequest[]): Promise<Quote[]>
  
  // Booking
  createBooking(booking: Partial<Booking>): Promise<Booking>
  cancelBooking(bookingId: string): Promise<void>
  
  // Customs (if applicable)
  getCustomsInfo?(shipmentId: string): Promise<CustomsInfo | null>
  submitCustomsDeclaration?(declaration: Partial<CustomsInfo>): Promise<CustomsInfo>
  
  // Brokers (if applicable)
  getBrokers?(): Promise<CustomsBroker[]>
  assignBroker?(shipmentId: string, brokerId: string): Promise<void>
}

export interface ShipmentFilters {
  status?: string[]
  carrierId?: string
  origin?: string
  destination?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  trackingNumber?: string
  shipmentNumber?: string
}

export interface QuoteRequest {
  origin: Location
  destination: Location
  mode: string
  type: string
  weight: number
  volume: number
  value: number
  currency: string
  pickupDate?: Date | string
  deliveryDate?: Date | string
  specialRequirements?: {
    temperatureControl?: boolean
    hazmat?: boolean
    insurance?: boolean
  }
}

export interface AdapterConfig {
  enabled: boolean
  apiUrl?: string
  apiKey?: string
  username?: string
  password?: string
  organizationId?: string
  [key: string]: any
}


