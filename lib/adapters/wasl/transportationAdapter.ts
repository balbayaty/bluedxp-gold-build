/**
 * WASL Transportation Adapter
 * 
 * Implements TransportationAdapter interface for seamless integration with TMS
 * Maps WASL EFF services to transportation/shipment concepts
 */

import { WaslEFFAdapter } from './adapter'
import type { TransportationAdapter, ShipmentFilters, QuoteRequest, AdapterConfig } from '@/lib/adapters/transportation/base/TransportationAdapter'
import type { Shipment, Carrier, Quote, Booking, TrackingEvent, Location } from '@/types/tms'
import type { WaslAdapterConfig, WaslTrip, EffTripCreateDto, EffTripUpdateDto } from '@/types/wasl'
import { eventBus } from '@/lib/services/event-store'

export class WaslTransportationAdapter implements TransportationAdapter {
  readonly id = 'wasl-eff'
  readonly name = 'WASL Electronic Freight Forwarder'
  readonly type = 'CUSTOMS' as const
  
  private effAdapter: WaslEFFAdapter
  private config: WaslAdapterConfig

  constructor(config: WaslAdapterConfig & AdapterConfig) {
    this.config = {
      appId: config.appId,
      appKey: config.appKey,
      apiBaseUrl: config.apiBaseUrl || 'https://www.rabet.sa',
      environment: config.environment || 'production',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      enableLogging: config.enableLogging,
    }
    
    this.effAdapter = new WaslEFFAdapter(this.config)
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  async isConnected(): Promise<boolean> {
    return this.effAdapter.isAuthenticated()
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.effAdapter.authenticate()
      const testResult = await this.effAdapter.testConnection()
      return testResult
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed',
      }
    }
  }

  async disconnect(): Promise<void> {
    // WASL doesn't require explicit disconnection
    // But we can clear any cached data if needed
  }

  // ============================================================================
  // SHIPMENT MANAGEMENT (mapped from trips)
  // ============================================================================

  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    // WASL doesn't provide a list endpoint, so we return empty array
    // In production, you might cache trips locally or use a different approach
    return []
  }

  async getShipment(id: string): Promise<Shipment | null> {
    try {
      const tripResponse = await this.effAdapter.getTrip(id)
      if (tripResponse.success && tripResponse.data) {
        return this.mapTripToShipment(tripResponse.data as WaslTrip)
      }
      return null
    } catch (error) {
      return null
    }
  }

  async createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
    // Map shipment to WASL trip
    const trip = this.mapShipmentToTrip(shipment)
    
    const response = await this.effAdapter.registerTrip(trip)
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create shipment in WASL')
    }

    // Get the created trip to return full shipment data
    const tripNumber = response.data.tripNumber
    const tripResponse = await this.effAdapter.getTrip(tripNumber)
    
    if (tripResponse.success && tripResponse.data) {
      const createdShipment = this.mapTripToShipment(tripResponse.data as WaslTrip)
      
      // Emit event
      await eventBus.publish({
        type: 'tms.shipment.created',
        payload: {
          shipmentId: createdShipment.id,
          tripNumber,
          adapter: 'wasl-eff',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'wasl-transportation-adapter',
        },
      })
      
      return createdShipment
    }
    
    throw new Error('Failed to retrieve created shipment')
  }

  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    // Map shipment updates to WASL trip updates
    const tripUpdates: EffTripUpdateDto = {
      tripNumber: id,
    }
    
    // Map status
    if (updates.status) {
      const waslStatus = this.mapShipmentStatusToTripStatus(updates.status)
      if (waslStatus) {
        tripUpdates.status = waslStatus
      }
    }
    
    // Map dates
    if (updates.actualPickupDate) {
      tripUpdates.actualStartDate = new Date(updates.actualPickupDate).toISOString()
    }
    if (updates.actualDeliveryDate) {
      tripUpdates.actualEndDate = new Date(updates.actualDeliveryDate).toISOString()
    }
    
    // Map location
    if (updates.currentLocation) {
      tripUpdates.currentLocation = {
        address: updates.currentLocation.address?.street || '',
        city: updates.currentLocation.address?.city,
        region: updates.currentLocation.address?.state,
        coordinates: updates.currentLocation.coordinates ? {
          latitude: updates.currentLocation.coordinates.lat,
          longitude: updates.currentLocation.coordinates.lng,
        } : undefined,
        timestamp: new Date().toISOString(),
      }
    }
    
    const response = await this.effAdapter.updateTrip(id, tripUpdates)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update shipment in WASL')
    }
    
    // Get updated trip
    const tripResponse = await this.effAdapter.getTrip(id)
    if (tripResponse.success && tripResponse.data) {
      const updatedShipment = this.mapTripToShipment(tripResponse.data as WaslTrip)
      
      // Emit event
      await eventBus.publish({
        type: 'tms.shipment.updated',
        payload: {
          shipmentId: updatedShipment.id,
          tripNumber: id,
          adapter: 'wasl-eff',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'wasl-transportation-adapter',
        },
      })
      
      return updatedShipment
    }
    
    throw new Error('Failed to retrieve updated shipment')
  }

  async cancelShipment(id: string): Promise<void> {
    const response = await this.effAdapter.updateTrip(id, {
      tripNumber: id,
      status: 'CANCELLED',
    })
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to cancel shipment in WASL')
    }
    
    // Emit event
    await eventBus.publish({
      type: 'tms.shipment.cancelled',
      payload: {
        shipmentId: id,
        tripNumber: id,
        adapter: 'wasl-eff',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'wasl-transportation-adapter',
      },
    })
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  async trackShipment(trackingNumber: string): Promise<TrackingEvent[]> {
    const tripResponse = await this.effAdapter.getTrip(trackingNumber)
    
    if (!tripResponse.success || !tripResponse.data) {
      return []
    }
    
    const trip = tripResponse.data as WaslTrip
    const events: TrackingEvent[] = []
    
    // Add trip creation event
    if (trip.registeredAt) {
      events.push({
        id: `${trackingNumber}-created`,
        shipmentId: trackingNumber,
        timestamp: new Date(trip.registeredAt),
        status: 'BOOKED',
        location: this.mapWaslLocationToLocation(trip.origin),
        description: 'Trip registered in WASL',
      })
    }
    
    // Add start event
    if (trip.actualStartDate) {
      events.push({
        id: `${trackingNumber}-started`,
        shipmentId: trackingNumber,
        timestamp: new Date(trip.actualStartDate),
        status: 'IN_TRANSIT',
        location: this.mapWaslLocationToLocation(trip.origin),
        description: 'Trip started',
      })
    }
    
    // Add current location if available
    if (trip.currentLocation) {
      events.push({
        id: `${trackingNumber}-current`,
        shipmentId: trackingNumber,
        timestamp: trip.currentLocation.timestamp 
          ? new Date(trip.currentLocation.timestamp)
          : new Date(),
        status: trip.status === 'IN_PROGRESS' ? 'IN_TRANSIT' : trip.status as any,
        location: this.mapWaslLocationToLocation(trip.currentLocation),
        description: 'Current location',
      })
    }
    
    // Add completion event
    if (trip.actualEndDate) {
      events.push({
        id: `${trackingNumber}-completed`,
        shipmentId: trackingNumber,
        timestamp: new Date(trip.actualEndDate),
        status: 'DELIVERED',
        location: this.mapWaslLocationToLocation(trip.destination),
        description: 'Trip completed',
      })
    }
    
    return events
  }

  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    return this.trackShipment(shipmentId)
  }

  // ============================================================================
  // CARRIERS (not applicable for WASL, but required by interface)
  // ============================================================================

  async getCarriers(): Promise<Carrier[]> {
    // WASL doesn't manage carriers, return empty array
    return []
  }

  async getCarrier(id: string): Promise<Carrier | null> {
    return null
  }

  // ============================================================================
  // QUOTES (not applicable for WASL, but required by interface)
  // ============================================================================

  async getQuote(request: QuoteRequest): Promise<Quote> {
    throw new Error('WASL does not provide quote services')
  }

  async getQuotes(requests: QuoteRequest[]): Promise<Quote[]> {
    throw new Error('WASL does not provide quote services')
  }

  // ============================================================================
  // BOOKING (mapped from trip registration)
  // ============================================================================

  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    // Map booking to shipment, then to trip
    const shipment: Partial<Shipment> = {
      origin: booking.origin,
      destination: booking.destination,
      plannedPickupDate: booking.pickupDate,
      plannedDeliveryDate: booking.deliveryDate,
      carrier: booking.carrier,
    }
    
    const trip = this.mapShipmentToTrip(shipment)
    const response = await this.effAdapter.registerTrip(trip)
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create booking in WASL')
    }
    
    return {
      id: response.data.tripNumber,
      shipmentId: response.data.tripNumber,
      carrierId: booking.carrierId || '',
      status: 'CONFIRMED',
      pickupDate: booking.pickupDate,
      deliveryDate: booking.deliveryDate,
      createdAt: new Date(),
    }
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.cancelShipment(bookingId)
  }

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================

  private mapShipmentToTrip(shipment: Partial<Shipment>): EffTripCreateDto {
    if (!shipment.origin || !shipment.destination) {
      throw new Error('Origin and destination are required')
    }
    
    return {
      vehiclePlate: {
        plateNumber: (shipment as any).vehiclePlateNumber || '',
      },
      driverNationalId: (shipment as any).driverNationalId || '',
      origin: {
        address: shipment.origin.address?.street || '',
        city: shipment.origin.address?.city,
        region: shipment.origin.address?.state,
        coordinates: shipment.origin.coordinates ? {
          latitude: shipment.origin.coordinates.lat,
          longitude: shipment.origin.coordinates.lng,
        } : undefined,
      },
      destination: {
        address: shipment.destination.address?.street || '',
        city: shipment.destination.address?.city,
        region: shipment.destination.address?.state,
        coordinates: shipment.destination.coordinates ? {
          latitude: shipment.destination.coordinates.lat,
          longitude: shipment.destination.coordinates.lng,
        } : undefined,
      },
      plannedStartDate: shipment.plannedPickupDate 
        ? new Date(shipment.plannedPickupDate).toISOString()
        : new Date().toISOString(),
      plannedEndDate: shipment.plannedDeliveryDate
        ? new Date(shipment.plannedDeliveryDate).toISOString()
        : undefined,
      cargoDescription: shipment.description,
      cargoWeight: shipment.totalWeight,
      cargoValue: shipment.declaredValue,
    }
  }

  private mapTripToShipment(trip: WaslTrip): Shipment {
    return {
      id: trip.tripNumber,
      shipmentNumber: trip.tripNumber,
      status: this.mapTripStatusToShipmentStatus(trip.status),
      origin: this.mapWaslLocationToLocation(trip.origin),
      destination: this.mapWaslLocationToLocation(trip.destination),
      plannedPickupDate: new Date(trip.plannedStartDate),
      plannedDeliveryDate: trip.plannedEndDate ? new Date(trip.plannedEndDate) : undefined,
      actualPickupDate: trip.actualStartDate ? new Date(trip.actualStartDate) : undefined,
      actualDeliveryDate: trip.actualEndDate ? new Date(trip.actualEndDate) : undefined,
      currentLocation: trip.currentLocation 
        ? this.mapWaslLocationToLocation(trip.currentLocation)
        : undefined,
      description: trip.cargoDescription,
      totalWeight: trip.cargoWeight,
      declaredValue: trip.cargoValue,
      createdAt: trip.registeredAt ? new Date(trip.registeredAt) : new Date(),
      updatedAt: trip.lastUpdatedAt ? new Date(trip.lastUpdatedAt) : new Date(),
    } as Shipment
  }

  private mapWaslLocationToLocation(waslLocation: any): Location {
    return {
      id: `${waslLocation.address}-${Date.now()}`,
      name: waslLocation.address,
      type: 'WAREHOUSE',
      address: {
        street: waslLocation.address,
        city: waslLocation.city || '',
        state: waslLocation.region,
        postalCode: '',
        country: 'Saudi Arabia',
        countryCode: 'SA',
      },
      coordinates: waslLocation.coordinates ? {
        lat: waslLocation.coordinates.latitude,
        lng: waslLocation.coordinates.longitude,
      } : undefined,
    }
  }

  private mapTripStatusToShipmentStatus(tripStatus: string): string {
    const statusMap: Record<string, string> = {
      'PENDING': 'BOOKED',
      'IN_PROGRESS': 'IN_TRANSIT',
      'COMPLETED': 'DELIVERED',
      'CANCELLED': 'CANCELLED',
    }
    return statusMap[tripStatus] || 'DRAFT'
  }

  private mapShipmentStatusToTripStatus(shipmentStatus: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | undefined {
    const statusMap: Record<string, 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
      'DRAFT': 'PENDING',
      'BOOKED': 'PENDING',
      'PICKED_UP': 'IN_PROGRESS',
      'IN_TRANSIT': 'IN_PROGRESS',
      'DELIVERED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
    }
    return statusMap[shipmentStatus]
  }
}



