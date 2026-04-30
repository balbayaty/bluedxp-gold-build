/**
 * Saga Pattern Usage Examples
 * How to use Saga orchestrator for distributed transactions
 */

import { sagaOrchestrator } from '@/lib/services/saga/sagaOrchestrator'

// Example: Create shipment with payment and inventory update
export async function createShipmentSagaExample() {
  const sagaId = `saga_${Date.now()}`

  const steps = [
    {
      id: 'reserve-inventory',
      name: 'Reserve Inventory',
      execute: async () => {
        // Reserve inventory items
        console.log('Reserving inventory...')
        return { inventoryReservationId: 'inv_123' }
      },
      compensate: async (context: any) => {
        // Release reserved inventory
        console.log('Releasing inventory:', context['reserve-inventory'])
      },
    },
    {
      id: 'process-payment',
      name: 'Process Payment',
      execute: async () => {
        // Process payment
        console.log('Processing payment...')
        return { paymentId: 'pay_123', transactionId: 'txn_456' }
      },
      compensate: async (context: any) => {
        // Refund payment
        console.log('Refunding payment:', context['process-payment'])
      },
    },
    {
      id: 'create-shipment',
      name: 'Create Shipment',
      execute: async () => {
        // Create shipment record
        console.log('Creating shipment...')
        return { shipmentId: 'ship_123' }
      },
      compensate: async (context: any) => {
        // Cancel shipment
        console.log('Cancelling shipment:', context['create-shipment'])
      },
    },
  ]

  try {
    await sagaOrchestrator.execute(sagaId, steps, {
      tenantId: 'tenant_456',
      orderId: 'order_789',
    })

    console.log('✅ Saga completed successfully')
  } catch (error) {
    console.error('❌ Saga failed, compensation executed:', error)
  }
}

