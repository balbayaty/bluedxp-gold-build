# BlueDXP Platform - Integration Examples

Complete examples for integrating with all BlueDXP Platform services.

## Quick Links

- [Kafka Examples](#kafka)
- [MinIO Examples](#minio)
- [OpenSearch Examples](#opensearch)
- [Redis Examples](#redis)
- [Saga Pattern Examples](#saga-pattern)
- [Saudi Government APIs](#saudi-government-apis)

## Kafka

### Publishing Events

```typescript
import { kafkaProducer } from '@/lib/services/kafka'

await kafkaProducer.initialize()

await kafkaProducer.sendMessage(
  'bluedxp.events',
  { type: 'shipment.created', data: { shipmentId: 'ship_123' } },
  'ship_123', // Key
  { 'correlation-id': 'corr_789' } // Headers
)
```

### Consuming Events

```typescript
import { kafkaConsumer } from '@/lib/services/kafka'

await kafkaConsumer.initialize({
  groupId: 'bluedxp-consumer',
  topics: ['bluedxp.events'],
})

kafkaConsumer.on('bluedxp.events', async (payload) => {
  const message = JSON.parse(payload.message.value?.toString() || '{}')
  // Process message
})

await kafkaConsumer.start()
```

## MinIO

### Upload File

```typescript
import { objectStorageService } from '@/lib/services/storage'

await objectStorageService.initialize()

const objectName = await objectStorageService.upload(
  'documents/file.pdf',
  fileBuffer,
  { contentType: 'application/pdf' }
)
```

### Get Presigned URL

```typescript
const url = await objectStorageService.getUrl('documents/file.pdf', 3600)
// URL valid for 1 hour
```

## OpenSearch

### Index Document

```typescript
import { searchService } from '@/lib/services/search'

await searchService.initialize()

await searchService.index({
  id: 'ship_123',
  type: 'shipment',
  origin: 'Riyadh',
  destination: 'Jeddah',
}, 'ship_123')
```

### Search Documents

```typescript
const results = await searchService.search({
  query: 'Riyadh Jeddah',
  filters: { tenantId: 'tenant_456' },
  size: 10,
})
```

## Redis

### Cache Value

```typescript
import { redisService } from '@/lib/services/cache/redisService'

await redisService.initialize()

await redisService.set(
  'user:123',
  { name: 'John', email: 'john@example.com' },
  { ttl: 3600, tags: ['user'] }
)
```

### Get Cached Value

```typescript
const value = await redisService.get('user:123')
```

## Saga Pattern

### Distributed Transaction

```typescript
import { sagaOrchestrator } from '@/lib/services/saga/sagaOrchestrator'

const steps = [
  {
    id: 'step1',
    name: 'Reserve Inventory',
    execute: async () => { /* ... */ },
    compensate: async (context) => { /* ... */ },
  },
  // ... more steps
]

await sagaOrchestrator.execute('saga_123', steps, initialData)
```

## Saudi Government APIs

### Verify Vehicle (TGA)

```typescript
import { TGAService } from '@/lib/services/saudi-government'

const tga = new TGAService()
const result = await tga.verifyVehicle('ABC1234')
```

### Verify Identity (Absher)

```typescript
import { AbsherService } from '@/lib/services/saudi-government'

const absher = new AbsherService()
const result = await absher.verifyIdentity('1234567890')
```

### Submit Invoice (ZATCA)

```typescript
import { ZATCAService } from '@/lib/services/saudi-government'

const zatca = new ZATCAService()
const result = await zatca.submitInvoice({
  invoiceNumber: 'INV-001',
  amount: 1000.00,
  vat: 150.00,
})
```

## Complete Examples

See `examples/` directory for complete, runnable examples:
- `examples/kafka-usage.ts`
- `examples/minio-usage.ts`
- `examples/opensearch-usage.ts`
- `examples/redis-usage.ts`
- `examples/saga-usage.ts`
- `examples/saudi-government-usage.ts`

## Best Practices

1. **Always initialize services** before use
2. **Handle errors gracefully** with try-catch
3. **Use appropriate TTLs** for cached data
4. **Tag cache entries** for easy invalidation
5. **Use saga pattern** for distributed transactions
6. **Validate inputs** before API calls
7. **Log operations** for debugging

## Error Handling

All services include error handling and fallbacks:

```typescript
try {
  await service.operation()
} catch (error) {
  // Service will fallback gracefully
  console.error('Operation failed:', error)
}
```

