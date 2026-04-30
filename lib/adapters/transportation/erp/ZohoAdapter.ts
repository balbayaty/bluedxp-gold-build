/**
 * Zoho ERP Transportation Adapter
 * 
 * Integrates with Zoho ERP for transportation management
 */

import { TransportationAdapter, ShipmentFilters, QuoteRequest, AdapterConfig } from '../base/TransportationAdapter'
import type { Shipment, Carrier, Quote, Booking, TrackingEvent } from '@/types/tms'

export class ZohoAdapter implements TransportationAdapter {
  readonly id = 'zoho'
  readonly name = 'Zoho ERP'
  readonly type = 'ERP' as const
  
  private config: AdapterConfig
  private apiUrl: string
  private accessToken?: string
  
  constructor(config: AdapterConfig) {
    this.config = config
    this.apiUrl = config.apiUrl || 'https://www.zohoapis.com'
  }
  
  async authenticate(): Promise<void> {
    // Zoho OAuth authentication
    const response = await fetch(`${this.apiUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId || '',
        client_secret: this.config.clientSecret || '',
        refresh_token: this.config.refreshToken || '',
      }),
    })
    
    const data = await response.json()
    this.accessToken = data.access_token
  }
  
  async isConnected(): Promise<boolean> {
    try {
      await this.ensureAuthenticated()
      return true
    } catch {
      return false
    }
  }
  
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.ensureAuthenticated()
      return { success: true, message: 'Connected to Zoho ERP' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Connection failed' }
    }
  }
  
  async disconnect(): Promise<void> {
    this.accessToken = undefined
  }
  
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken) {
      await this.authenticate()
    }
  }
  
  private async apiRequest(endpoint: string, options?: RequestInit): Promise<any> {
    await this.ensureAuthenticated()
    
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Zoho-oauthtoken ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Zoho API error: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status.join(','))
    if (filters?.carrierId) params.append('carrier', filters.carrierId)
    
    const data = await this.apiRequest(`/crm/v3/Shipments?${params}`)
    
    // Transform Zoho format to our format
    return (data.data || []).map((item: any) => this.transformShipment(item))
  }
  
  async getShipment(id: string): Promise<Shipment | null> {
    try {
      const data = await this.apiRequest(`/crm/v3/Shipments/${id}`)
      return this.transformShipment(data.data)
    } catch {
      return null
    }
  }
  
  async createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
    const zohoData = this.transformToZohoFormat(shipment)
    const data = await this.apiRequest('/crm/v3/Shipments', {
      method: 'POST',
      body: JSON.stringify({ data: [zohoData] }),
    })
    return this.transformShipment(data.data[0])
  }
  
  async updateShipment(id: string, updates: Partial<Shipment>): Promise<Shipment> {
    const zohoData = this.transformToZohoFormat(updates)
    const data = await this.apiRequest(`/crm/v3/Shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: [zohoData] }),
    })
    return this.transformShipment(data.data[0])
  }
  
  async cancelShipment(id: string): Promise<void> {
    await this.apiRequest(`/crm/v3/Shipments/${id}`, {
      method: 'DELETE',
    })
  }
  
  async trackShipment(trackingNumber: string): Promise<TrackingEvent[]> {
    // Zoho tracking integration
    const data = await this.apiRequest(`/crm/v3/Shipments?tracking_number=${trackingNumber}`)
    const shipment = this.transformShipment(data.data[0])
    return shipment.trackingEvents || []
  }
  
  async getTrackingEvents(shipmentId: string): Promise<TrackingEvent[]> {
    return this.trackShipment(shipmentId)
  }
  
  async getCarriers(): Promise<Carrier[]> {
    const data = await this.apiRequest('/crm/v3/Vendors?type=Carrier')
    return (data.data || []).map((item: any) => this.transformCarrier(item))
  }
  
  async getCarrier(id: string): Promise<Carrier | null> {
    try {
      const data = await this.apiRequest(`/crm/v3/Vendors/${id}`)
      return this.transformCarrier(data.data)
    } catch {
      return null
    }
  }
  
  async getQuote(request: QuoteRequest): Promise<Quote> {
    // Zoho quote generation
    const data = await this.apiRequest('/crm/v3/Quotes', {
      method: 'POST',
      body: JSON.stringify({ data: [this.transformQuoteRequest(request)] }),
    })
    return this.transformQuote(data.data[0])
  }
  
  async getQuotes(requests: QuoteRequest[]): Promise<Quote[]> {
    const quotes = await Promise.all(requests.map(req => this.getQuote(req)))
    return quotes
  }
  
  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    const zohoData = this.transformBookingToZoho(booking)
    const data = await this.apiRequest('/crm/v3/Bookings', {
      method: 'POST',
      body: JSON.stringify({ data: [zohoData] }),
    })
    return this.transformBooking(data.data[0])
  }
  
  async cancelBooking(bookingId: string): Promise<void> {
    await this.apiRequest(`/crm/v3/Bookings/${bookingId}`, {
      method: 'DELETE',
    })
  }
  
  // Transformation methods
  private transformShipment(zohoData: any): Shipment {
    return {
      id: zohoData.id,
      shipmentNumber: zohoData.Shipment_Number || zohoData.id,
      trackingNumber: zohoData.Tracking_Number,
      type: zohoData.Shipment_Type || 'STANDARD',
      mode: zohoData.Transport_Mode || 'LAND',
      status: zohoData.Status || 'DRAFT',
      origin: this.transformLocation(zohoData.Origin),
      destination: this.transformLocation(zohoData.Destination),
      items: zohoData.Items || [],
      totalWeight: zohoData.Total_Weight || 0,
      totalVolume: zohoData.Total_Volume || 0,
      totalValue: zohoData.Total_Value || 0,
      currency: zohoData.Currency || 'SAR',
      carrierId: zohoData.Carrier?.id,
      carrierName: zohoData.Carrier?.name,
      documents: [],
      trackingEvents: [],
      exceptions: [],
      alerts: [],
      createdAt: zohoData.Created_Time,
      updatedAt: zohoData.Modified_Time,
      createdBy: zohoData.Created_By?.name || 'System',
      integrationSource: 'ZOHO',
      externalId: zohoData.id,
    } as Shipment
  }
  
  private transformToZohoFormat(shipment: Partial<Shipment>): any {
    return {
      Shipment_Number: shipment.shipmentNumber,
      Tracking_Number: shipment.trackingNumber,
      Shipment_Type: shipment.type,
      Transport_Mode: shipment.mode,
      Status: shipment.status,
      Origin: shipment.origin,
      Destination: shipment.destination,
      Total_Weight: shipment.totalWeight,
      Total_Volume: shipment.totalVolume,
      Total_Value: shipment.totalValue,
      Currency: shipment.currency,
    }
  }
  
  private transformCarrier(zohoData: any): Carrier {
    return {
      id: zohoData.id,
      code: zohoData.Vendor_Code || zohoData.id,
      name: zohoData.Vendor_Name,
      type: zohoData.Type || 'MULTIMODAL',
      contactPerson: zohoData.Contact_Name,
      email: zohoData.Email,
      phone: zohoData.Phone,
      serviceTypes: zohoData.Service_Types?.split(',') || [],
      coverage: {
        local: zohoData.Coverage_Local === 'Yes',
        regional: zohoData.Coverage_Regional === 'Yes',
        international: zohoData.Coverage_International === 'Yes',
      },
      rating: zohoData.Rating || 0,
      status: zohoData.Status || 'ACTIVE',
      createdAt: zohoData.Created_Time,
      updatedAt: zohoData.Modified_Time,
    } as Carrier
  }
  
  private transformLocation(location: any): any {
    if (!location) return null
    return {
      id: location.id || '',
      name: location.name || '',
      type: location.type || 'WAREHOUSE',
      address: {
        street: location.street || '',
        city: location.city || '',
        postalCode: location.postalCode || '',
        country: location.country || '',
        countryCode: location.countryCode || '',
      },
    }
  }
  
  private transformQuoteRequest(request: QuoteRequest): any {
    return {
      Origin: request.origin,
      Destination: request.destination,
      Transport_Mode: request.mode,
      Shipment_Type: request.type,
      Weight: request.weight,
      Volume: request.volume,
      Value: request.value,
      Currency: request.currency,
    }
  }
  
  private transformQuote(zohoData: any): Quote {
    return {
      id: zohoData.id,
      quoteNumber: zohoData.Quote_Number || zohoData.id,
      origin: this.transformLocation(zohoData.Origin),
      destination: this.transformLocation(zohoData.Destination),
      mode: zohoData.Transport_Mode || 'LAND',
      type: zohoData.Shipment_Type || 'STANDARD',
      weight: zohoData.Weight || 0,
      volume: zohoData.Volume || 0,
      value: zohoData.Value || 0,
      currency: zohoData.Currency || 'SAR',
      pricing: {
        type: 'FIXED',
        baseRate: zohoData.Base_Rate || 0,
        currency: zohoData.Currency || 'SAR',
      },
      charges: {
        baseRate: zohoData.Base_Rate || 0,
        currency: zohoData.Currency || 'SAR',
        subtotal: zohoData.Subtotal || 0,
        taxes: zohoData.Taxes || 0,
        total: zohoData.Total || 0,
      },
      validFrom: zohoData.Valid_From || new Date(),
      validTo: zohoData.Valid_To || new Date(),
      status: zohoData.Status || 'PENDING',
      createdAt: zohoData.Created_Time,
      createdBy: zohoData.Created_By?.name || 'System',
    } as Quote
  }
  
  private transformBookingToZoho(booking: Partial<Booking>): any {
    return {
      Booking_Number: booking.bookingNumber,
      Shipment_ID: booking.shipmentId,
      Carrier_ID: booking.carrierId,
      Booking_Date: booking.bookingDate,
      Pickup_Date: booking.pickupDate,
      Estimated_Delivery: booking.estimatedDelivery,
      Status: booking.status || 'PENDING',
    }
  }
  
  private transformBooking(zohoData: any): Booking {
    return {
      id: zohoData.id,
      bookingNumber: zohoData.Booking_Number || zohoData.id,
      shipmentId: zohoData.Shipment_ID,
      carrierId: zohoData.Carrier_ID,
      carrierName: zohoData.Carrier?.name,
      bookingDate: zohoData.Booking_Date,
      pickupDate: zohoData.Pickup_Date,
      estimatedDelivery: zohoData.Estimated_Delivery,
      status: zohoData.Status || 'PENDING',
      confirmationNumber: zohoData.Confirmation_Number,
      createdAt: zohoData.Created_Time,
      createdBy: zohoData.Created_By?.name || 'System',
    } as Booking
  }
}


