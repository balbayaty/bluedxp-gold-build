/**
 * Maersk Carrier Adapter
 * 
 * Implements TransportationAdapter for Maersk carrier integration
 */

import { TransportationAdapter, ShipmentFilters, QuoteRequest, AdapterConfig } from '../base/TransportationAdapter'
import type { Shipment, Carrier, Quote, Booking, TrackingEvent, Location } from '@/types/tms'
import { getMaerskClient, MaerskApiClient } from '@/lib/services/load-design/integrations/carriers/maerskApi'

export class MaerskAdapter implements TransportationAdapter {
  readonly id = 'maersk'
  readonly name = 'Maersk'
  readonly type = 'CARRIER' as const
  
  private config: AdapterConfig
  private client: ReturnType<typeof getMaerskClient> | null = null

  constructor(config: AdapterConfig) {
    this.config = config
    this.client = getMaerskClient()
  }

  async isConnected(): Promise<boolean> {
    return this.client !== null && !!process.env.MAERSK_API_KEY
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'Maersk API key not configured' }
    }
    
    try {
      // Test with a simple quote request
      const testQuote = await this.client.getQuote({
        origin: { code: 'USNYC', city: 'New York', country: 'USA' },
        destination: { code: 'GBLON', city: 'London', country: 'UK' },
        cargo: { weight: 1000, volume: 1 },
        serviceType: 'FCL',
      })
      
      return {
        success: testQuote !== null,
        message: testQuote ? 'Connection successful' : 'Connection failed',
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      }
    }
  }

  async disconnect(): Promise<void> {
    // No-op for API-based adapter
  }

  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    // Maersk API doesn't provide shipment list, return empty
    // In production, this would query internal database that syncs with Maersk
    return []
  }

  async getShipment(id: string): Promise<Shipment | null> {
    // Query internal database
    const response = await fetch(`/api/transportation/shipments/${id}`)
    if (!response.ok) return null
    return response.json()
  }

  async createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
    // Create in internal system, then sync with Maersk if needed
    const response = await fetch('/api/transportation/shipments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shipment),
    })
    return response.json()
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const response = await fetch(`/api/transportation/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return response.json()
  }

  async cancelShipment(id: string): Promise<void> {
    await fetch(`/api/transportation/shipments/${id}/cancel`, {
      method: 'POST',
    })
  }

  async trackShipment(trackingNumber: string): Promise<TrackingEvent[]> {
    if (!this.client) {
      return []
    }

    try {
      const tracking = await this.client.trackShipment(trackingNumber)
      if (!tracking) {
        return []
      }

      // Convert Maersk tracking to TrackingEvent format
      return tracking.events?.map((event: any) => ({
        id: event.id || `${trackingNumber}-${Date.now()}`,
        timestamp: new Date(event.timestamp || Date.now()),
        location: event.location || '',
        status: event.status || 'IN_TRANSIT',
        description: event.description || '',
        carrier: 'maersk',
      })) || []
    } catch (error) {
      console.error('Maersk tracking error:', error)
      return []
    }
  }

  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    // Get tracking number from shipment, then track
    const shipment = await this.getShipment(shipmentId)
    if (!shipment?.trackingNumber) {
      return []
    }
    return this.trackShipment(shipment.trackingNumber)
  }

  async getCarriers(): Promise<Carrier[]> {
    return [{
      id: 'maersk',
      code: 'MAERSK',
      name: 'Maersk',
      type: 'SEA',
      enabled: true,
      services: ['FCL', 'LCL'],
      regions: ['GLOBAL'],
    }]
  }

  async getCarrier(id: string): Promise<Carrier | null> {
    if (id === 'maersk') {
      return (await this.getCarriers())[0]
    }
    return null
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    if (!this.client) {
      throw new Error('Maersk API not configured')
    }

    try {
      const maerskRequest = {
        origin: {
          code: this.extractPortCode(request.origin),
          city: request.origin.city || '',
          country: request.origin.country || '',
        },
        destination: {
          code: this.extractPortCode(request.destination),
          city: request.destination.city || '',
          country: request.destination.country || '',
        },
        cargo: {
          weight: request.weight,
          volume: request.volume,
        },
        serviceType: request.specialRequirements?.hazmat ? 'FCL' : 'FCL',
        departureDate: request.pickupDate ? new Date(request.pickupDate).toISOString() : undefined,
      }

      const quote = await this.client.getQuote(maerskRequest)
      
      if (!quote) {
        throw new Error('Failed to get quote from Maersk')
      }

      return {
        id: quote.quoteId,
        carrierId: 'maersk',
        carrierName: 'Maersk',
        service: quote.service,
        cost: quote.cost.amount,
        currency: quote.cost.currency,
        estimatedTransitTime: quote.transitTime * 24, // Convert days to hours
        validUntil: new Date(quote.validUntil),
        terms: quote.terms,
        breakdown: quote.cost.breakdown,
      }
    } catch (error: any) {
      throw new Error(`Maersk quote error: ${error.message}`)
    }
  }

  async getQuotes(requests: QuoteRequest[]): Promise<Quote[]> {
    return Promise.all(requests.map(req => this.getQuote(req)))
  }

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    if (!this.client) {
      throw new Error('Maersk API not configured')
    }

    try {
      const maerskBooking = await this.client.createBooking(
        booking.quoteId || '',
        {
          shipment: booking.shipment,
          shipper: booking.shipper,
          consignee: booking.consignee,
        }
      )

      if (!maerskBooking) {
        throw new Error('Failed to create booking with Maersk')
      }

      return {
        id: maerskBooking.bookingNumber,
        shipmentId: booking.shipmentId || '',
        carrierId: 'maersk',
        status: maerskBooking.status,
        bookingNumber: maerskBooking.bookingNumber,
        confirmationDetails: maerskBooking.confirmationDetails,
        createdAt: new Date(),
      }
    } catch (error: any) {
      throw new Error(`Maersk booking error: ${error.message}`)
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    // Maersk API cancellation would go here
    // For now, just update internal system
    await fetch(`/api/transportation/bookings/${bookingId}/cancel`, {
      method: 'POST',
    })
  }

  /**
   * Extract port code from location
   */
  private extractPortCode(location: Location): string {
    // Try to extract port code from address or use city code
    if (location.address) {
      const portMatch = location.address.match(/\b([A-Z]{5})\b/)
      if (portMatch) {
        return portMatch[1]
      }
    }
    
    // Fallback to city code
    return location.city?.substring(0, 5).toUpperCase() || 'UNKWN'
  }
}











