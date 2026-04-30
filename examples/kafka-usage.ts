/**
 * Kafka Usage Examples
 * How to use Kafka producer and consumer in BlueDXP Platform
 */

import { kafkaProducer, kafkaConsumer } from '@/lib/services/kafka'

// Example: Publishing events to Kafka
export async function publishEventExample() {
  try {
    // Initialize producer
    await kafkaProducer.initialize()

    // Publish a single event
    await kafkaProducer.sendMessage(
      'bluedxp.events',
      {
        type: 'shipment.created',
        data: {
          shipmentId: 'ship_123',
          tenantId: 'tenant_456',
          timestamp: new Date().toISOString(),
        },
      },
      'ship_123', // Key for partitioning
      {
        'correlation-id': 'corr_789',
        'tenant-id': 'tenant_456',
      }
    )

    console.log('✅ Event published to Kafka')
  } catch (error) {
    console.error('❌ Error publishing event:', error)
  }
}

// Example: Consuming events from Kafka
export async function consumeEventsExample() {
  try {
    // Initialize consumer
    await kafkaConsumer.initialize({
      groupId: 'bluedxp-consumer-group',
      topics: ['bluedxp.events', 'bluedxp.notifications'],
      fromBeginning: false,
    })

    // Register handler for shipment events
    kafkaConsumer.on('bluedxp.events', async (payload) => {
      const message = JSON.parse(payload.message.value?.toString() || '{}')
      
      if (message.type === 'shipment.created') {
        console.log('📦 New shipment created:', message.data)
        // Process shipment creation
      }
    })

    // Register handler for notifications
    kafkaConsumer.on('bluedxp.notifications', async (payload) => {
      const message = JSON.parse(payload.message.value?.toString() || '{}')
      console.log('🔔 Notification received:', message)
      // Process notification
    })

    // Start consuming
    await kafkaConsumer.start()
    console.log('✅ Kafka consumer started')
  } catch (error) {
    console.error('❌ Error consuming events:', error)
  }
}

