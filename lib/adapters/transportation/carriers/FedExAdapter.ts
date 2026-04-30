/**
 * FedEx Carrier Adapter
 * 
 * Implements TransportationAdapter for FedEx carrier integration
 */

import { TransportationAdapter, ShipmentFilters, QuoteRequest, AdapterConfig } from '../base/TransportationAdapter'
import type { Shipment, Carrier, Quote, Booking, TrackingEvent, Location } from '@/types/tms'
import { getFedExClient, FedExApiClient } from '@/lib/services/load-design/integrations/carriers/fedexApi'

export class FedExAdapter implements TransportationAdapter {
  readonly id = 'fedex'
  readonly name = 'FedEx'
  readonly type = 'CARRIER' as const
  
  private config: AdapterConfig
  private client: ReturnType<typeof getFedExClient> | null = null

  constructor(config: AdapterConfig) {
    this.config = config
    this.client = getFedExClient()
  }

  async isConnected(): Promise<boolean> {
    return this.client !== null && !!process.env.FEDEX_API_KEY
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'FedEx API credentials not configured' }
    }
    
    try {
      // Test connection by getting access token
      const token = await (this.client as any).getAccessToken()
      return {
        success: !!token,
        message: token ? 'Connection successful' : 'Failed to authenticate',
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
    // FedEx API doesn't provide shipment list, return empty
    return []
  }

  async getShipment(id: string): Promise<Shipment | null> {
    const response = await fetch(`/api/transportation/shipments/${id}`)
    if (!response.ok) return null
    return response.json()
  }

  async createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
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

      // Convert FedEx tracking to TrackingEvent format
      const events = tracking.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents || []
      return events.map((event: any) => ({
        id: event.eventId || `${trackingNumber}-${Date.now()}`,
        timestamp: new Date(event.date || Date.now()),
        location: `${event.city || ''}, ${event.stateOrProvinceCode || ''}`.trim(),
        status: this.mapFedExStatus(event.eventType),
        description: event.eventDescription || '',
        carrier: 'fedex',
      }))
    } catch (error) {
      console.error('FedEx tracking error:', error)
      return []
    }
  }

  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    const shipment = await this.getShipment(shipmentId)
    if (!shipment?.trackingNumber) {
      return []
    }
    return this.trackShipment(shipment.trackingNumber)
  }

  async getCarriers(): Promise<Carrier[]> {
    return [{
      id: 'fedex',
      code: 'FDX',
      name: 'FedEx',
      type: 'AIR',
      enabled: true,
      services: ['EXPRESS', 'GROUND', 'INTERNATIONAL'],
      regions: ['GLOBAL'],
    }]
  }

  async getCarrier(id: string): Promise<Carrier | null> {
    if (id === 'fedex') {
      return (await this.getCarriers())[0]
    }
    return null
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    if (!this.client) {
      throw new Error('FedEx API not configured')
    }

    try {
      const fedexRequest = {
        origin: {
          address: request.origin.address || '',
          city: request.origin.city || '',
          state: request.origin.state,
          postalCode: request.origin.postalCode || '',
          country: request.origin.country || '',
        },
        destination: {
          address: request.destination.address || '',
          city: request.destination.city || '',
          state: request.destination.state,
          postalCode: request.destination.postalCode || '',
          country: request.destination.country || '',
        },
        cargo: {
          weight: request.weight,
          pieces: 1,
        },
        serviceType: request.specialRequirements?.hazmat ? 'EXPRESS' : 'EXPRESS',
        deliveryDate: request.deliveryDate ? new Date(request.deliveryDate).toISOString() : undefined,
      }

      const quote = await this.client.getQuote(fedexRequest)
      
      if (!quote) {
        throw new Error('Failed to get quote from FedEx')
      }

      return {
        id: quote.quoteId,
        carrierId: 'fedex',
        carrierName: 'FedEx',
        service: quote.service,
        cost: quote.cost.amount,
        currency: quote.cost.currency,
        estimatedTransitTime: quote.transitTime,
        validUntil: new Date(quote.validUntil),
        terms: ['Express', 'Door-to-Door'],
        breakdown: quote.cost.breakdown,
      }
    } catch (error: any) {
      throw new Error(`FedEx quote error: ${error.message}`)
    }
  }

  async getQuotes(requests: QuoteRequest[]): Promise<Quote[]> {
    return Promise.all(requests.map(req => this.getQuote(req)))
  }

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    if (!this.client) {
      throw new Error('FedEx API not configured')
    }

    try {
      const fedexBooking = await this.client.createBooking(
        booking.quoteId || '',
        {
          requestedShipment: {
            shipper: booking.shipper,
            recipients: [booking.consignee],
            labelSpecification: {
              imageType: 'PDF',
              labelStockType: 'PAPER_4X6',
            },
          },
        }
      )

      if (!fedexBooking) {
        throw new Error('Failed to create booking with FedEx')
      }

      return {
        id: fedexBooking.bookingNumber,
        shipmentId: booking.shipmentId || '',
        carrierId: 'fedex',
        status: fedexBooking.status,
        bookingNumber: fedexBooking.bookingNumber,
        confirmationDetails: fedexBooking.confirmationDetails,
        createdAt: new Date(),
      }
    } catch (error: any) {
      throw new Error(`FedEx booking error: ${error.message}`)
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await fetch(`/api/transportation/bookings/${bookingId}/cancel`, {
      method: 'POST',
    })
  }

  /**
   * Map FedEx status to standard status
   */
  private mapFedExStatus(eventType: string): string {
    const statusMap: Record<string, string> = {
      'OC': 'IN_TRANSIT',
      'DL': 'DELIVERED',
      'DP': 'IN_TRANSIT',
      'OD': 'OUT_FOR_DELIVERY',
      'AF': 'EXCEPTION',
      'AR': 'EXCEPTION',
    }
    return statusMap[eventType] || 'IN_TRANSIT'
  }
}











