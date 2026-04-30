/**
 * Saudi Government API Usage Examples
 * How to use Saudi government API integrations
 */

import {
  TGAService,
  AbsherService,
  ZATCAService,
  NAFATHService,
} from '@/lib/services/saudi-government'

// Example: Verify vehicle with TGA
export async function verifyVehicleExample() {
  try {
    const tga = new TGAService()
    await tga.verify()

    const result = await tga.verifyVehicle('ABC1234', 'CHASSIS123')
    console.log('✅ Vehicle verified:', result)
    return result
  } catch (error) {
    console.error('❌ Error verifying vehicle:', error)
    throw error
  }
}

// Example: Verify identity with Absher
export async function verifyIdentityExample(nationalId: string) {
  try {
    const absher = new AbsherService()
    await absher.verify()

    const result = await absher.verifyIdentity(nationalId)
    console.log('✅ Identity verified:', result)
    return result
  } catch (error) {
    console.error('❌ Error verifying identity:', error)
    throw error
  }
}

// Example: Submit invoice to ZATCA
export async function submitInvoiceExample(invoiceData: any) {
  try {
    const zatca = new ZATCAService()
    await zatca.verify()

    const result = await zatca.submitInvoice(invoiceData)
    console.log('✅ Invoice submitted:', result)
    return result
  } catch (error) {
    console.error('❌ Error submitting invoice:', error)
    throw error
  }
}

// Example: Authenticate with NAFATH
export async function authenticateWithNafathExample(nationalId: string, phoneNumber: string) {
  try {
    const nafath = new NAFATHService()
    await nafath.verify()

    const result = await nafath.authenticate(nationalId, phoneNumber)
    console.log('✅ NAFATH authentication initiated:', result)
    
    // Check status
    if (result.transactionId) {
      const status = await nafath.getStatus(result.transactionId)
      console.log('📊 Authentication status:', status)
    }
    
    return result
  } catch (error) {
    console.error('❌ Error authenticating with NAFATH:', error)
    throw error
  }
}

