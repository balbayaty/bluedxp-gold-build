/**
 * Marketplace API Comprehensive Test Suite
 * Tests all marketplace endpoints and functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

describe('Marketplace API Tests', () => {
  let testListingId: string
  let testBookingId: string
  let testProviderId: string
  let testPaymentIntentId: string
  let testInvoiceId: string

  beforeAll(() => {
    console.log('🧪 Starting Marketplace API Tests...')
  })

  describe('Listings API', () => {
    it('should get marketplace statistics', async () => {
      const response = await fetch(`${API_BASE}/api/marketplace/stats`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('totalListings')
      expect(data.data).toHaveProperty('totalProviders')
      expect(data.data).toHaveProperty('totalBookings')
    })

    it('should search listings', async () => {
      const response = await fetch(`${API_BASE}/api/marketplace/listings?category=storage`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      
      if (data.data.length > 0) {
        testListingId = data.data[0].id
      }
    })

    it('should create a new listing', async () => {
      const newListing = {
        title: 'Test Storage Service',
        description: 'Test description',
        category: 'storage',
        providerId: 'test-provider-1',
        providerName: 'Test Provider',
        price: 1000,
        currency: 'SAR',
        location: {
          city: 'Riyadh',
          country: 'Saudi Arabia',
        },
        availability: 'available',
      }

      const response = await fetch(`${API_BASE}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      testListingId = data.data.id
    })

    it('should get a specific listing', async () => {
      if (!testListingId) {
        console.log('⚠️ Skipping: No test listing ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/listings/${testListingId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testListingId)
    })

    it('should update a listing', async () => {
      if (!testListingId) {
        console.log('⚠️ Skipping: No test listing ID')
        return
      }

      const updates = {
        price: 1200,
        description: 'Updated description',
      }

      const response = await fetch(`${API_BASE}/api/marketplace/listings/${testListingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.price).toBe(1200)
    })
  })

  describe('Bookings API', () => {
    it('should create a booking', async () => {
      if (!testListingId) {
        console.log('⚠️ Skipping: No test listing ID')
        return
      }

      const booking = {
        customerId: 'test-customer-1',
        customerName: 'Test Customer',
        serviceId: testListingId,
        pricing: {
          basePrice: 1000,
          currency: 'SAR',
          total: 1000,
        },
        schedule: {
          startDate: new Date().toISOString(),
        },
      }

      const response = await fetch(`${API_BASE}/api/marketplace/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('bookingNumber')
      testBookingId = data.data.id
    })

    it('should get bookings', async () => {
      const response = await fetch(`${API_BASE}/api/marketplace/bookings`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('should get a specific booking', async () => {
      if (!testBookingId) {
        console.log('⚠️ Skipping: No test booking ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/bookings/${testBookingId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testBookingId)
    })

    it('should update booking status', async () => {
      if (!testBookingId) {
        console.log('⚠️ Skipping: No test booking ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/bookings/${testBookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('CONFIRMED')
    })
  })

  describe('Payment API', () => {
    it('should create a payment intent', async () => {
      if (!testBookingId) {
        console.log('⚠️ Skipping: No test booking ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: testBookingId,
          amount: 1000,
          method: 'mada',
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      testPaymentIntentId = data.data.id
    })

    it('should process a payment', async () => {
      if (!testPaymentIntentId) {
        console.log('⚠️ Skipping: No test payment intent ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: testPaymentIntentId,
          paymentData: {
            method: 'mada',
            transactionId: `txn_${Date.now()}`,
          },
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('status')
    })

    it('should get payments for a booking', async () => {
      if (!testBookingId) {
        console.log('⚠️ Skipping: No test booking ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/payments?bookingId=${testBookingId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('Invoice API', () => {
    it('should generate an invoice', async () => {
      if (!testBookingId) {
        console.log('⚠️ Skipping: No test booking ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: testBookingId,
          items: [
            {
              description: 'Test Service',
              quantity: 1,
              unitPrice: 1000,
              total: 1000,
            },
          ],
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('invoiceNumber')
      testInvoiceId = data.data.id
    })

    it('should get an invoice', async () => {
      if (!testInvoiceId) {
        console.log('⚠️ Skipping: No test invoice ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/invoices/${testInvoiceId}`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(testInvoiceId)
    })

    it('should update invoice status', async () => {
      if (!testInvoiceId) {
        console.log('⚠️ Skipping: No test invoice ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/invoices/${testInvoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data.status).toBe('sent')
    })
  })

  describe('Provider Verification API', () => {
    it('should initiate verification', async () => {
      testProviderId = 'test-provider-1'

      const response = await fetch(`${API_BASE}/api/marketplace/providers/${testProviderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.status).toBe('pending')
    })

    it('should get verification badge', async () => {
      if (!testProviderId) {
        console.log('⚠️ Skipping: No test provider ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/providers/${testProviderId}/badge`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('verified')
      expect(data.data).toHaveProperty('badge')
    })
  })

  describe('Favorites API', () => {
    it('should add a favorite', async () => {
      if (!testListingId) {
        console.log('⚠️ Skipping: No test listing ID')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-1',
          listingId: testListingId,
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })

    it('should get favorites', async () => {
      const response = await fetch(`${API_BASE}/api/marketplace/favorites?userId=test-user-1`)
      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('Reviews API', () => {
    it('should submit a review', async () => {
      if (!testBookingId || !testListingId) {
        console.log('⚠️ Skipping: Missing test IDs')
        return
      }

      const response = await fetch(`${API_BASE}/api/marketplace/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: testBookingId,
          serviceId: testListingId,
          providerId: 'test-provider-1',
          customerId: 'test-customer-1',
          customerName: 'Test Customer',
          rating: 5,
          review: 'Great service!',
        }),
      })

      const data = await response.json()
      
      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('id')
      expect(data.data.rating).toBe(5)
    })
  })
})









