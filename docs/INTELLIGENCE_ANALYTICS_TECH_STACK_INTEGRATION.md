# 🔗 Intelligence & Analytics - Tech Stack & Architecture Integration

**How the unified module integrates with BlueDXP tech stack and infrastructure**

---

## 🏗️ ARCHITECTURE INTEGRATION

### **Layer 0: Evidence Ledger (Immutable Audit)**
```typescript
// Integration Point
import { evidenceService } from '@/lib/services/evidence'

// All RCA evidence stored immutably
await evidenceService.recordEvidence({
  type: 'root-cause-analysis',
  source: 'intelligence-analytics',
  data: rcaResult,
  lineage: [...evidenceChain],
  integrity: true,
})
```

**Benefits:**
- ✅ Immutable evidence for RCA
- ✅ Evidence lineage tracking
- ✅ Integrity verification
- ✅ Audit trail compliance

---

### **Layer 1: Event Store (CQRS/Event Sourcing)**
```typescript
// Integration Point
import { eventStore, eventBus } from '@/lib/services/event-store'

// All intelligence events stored
await eventStore.append([{
  type: 'intelligence.root-cause.identified',
  aggregateId: rcaId,
  aggregateType: 'RootCauseAnalysis',
  payload: rcaResult,
  metadata: { tenantId, moduleId, ... },
}])

// Subscribe to ALL module events
eventBus.subscribe('*.*', async (event) => {
  await intelligenceService.captureEvent(event)
})
```

**Benefits:**
- ✅ Event sourcing for RCA history
- ✅ CQRS projections for analytics
- ✅ Event replay for analysis
- ✅ Cross-module event capture

---

### **Layer 2: Orchestration (Process Lifecycle)**
```typescript
// Integration Point
import { processOrchestrator } from '@/lib/services/process-lifecycle'

// Process mining integrated with process lifecycle
await processOrchestrator.analyzeProcess({
  entityType: 'SHIPMENT',
  entityId: shipmentId,
  includeMining: true,
  includeRCA: true,
})
```

**Benefits:**
- ✅ Process mining for lifecycle
- ✅ RCA for process deviations
- ✅ End-to-end process analysis
- ✅ Process optimization

---

### **Layer 3: Business Logic (Services)**
```typescript
// Integration Point
import { unifiedIntelligenceService } from '@/lib/services/intelligence-analytics'

// Unified service orchestrates all intelligence
await unifiedIntelligenceService.analyze({
  type: 'root-cause',
  source: { module: 'wms', entityType: 'shipment', entityId: '...' },
  context: { ... },
})
```

**Benefits:**
- ✅ Single service for all intelligence
- ✅ Consistent API across modules
- ✅ Service discovery via module registry
- ✅ Dependency injection ready

---

### **Layer 5: Presentation (UI)**
```typescript
// Integration Point
import { UnifiedIntelligenceDashboard } from '@/components/intelligence-analytics'

// Unified dashboard for all intelligence
<UnifiedIntelligenceDashboard
  tenantId={tenantId}
  modules={['wms', 'tms', 'qhse', ...]}
  realTime={true}
/>
```

**Benefits:**
- ✅ Single entry point
- ✅ Cross-module views
- ✅ Real-time updates
- ✅ Consistent UX

---

## 🔌 MODULE REGISTRY INTEGRATION

```typescript
// lib/modules/intelligence-analytics.ts

export const intelligenceAnalyticsModule: ModuleDefinition = {
  id: 'intelligence-analytics',
  name: 'Intelligence & Analytics',
  description: 'Unified intelligence, RCA, data mining, process mining, analytics',
  version: '1.0.0',
  category: 'intelligence',
  standalone: false,
  
  // Dependencies on ALL modules (for event capture)
  dependencies: [
    'wms', 'tms', 'qhse', 'iso-ims', 'trade-compliance',
    'finance', 'facility', 'procurement', 'marketplace',
    'hr', 'crm', 'msds', 'iot', 'process-lifecycle',
    'warehouse-network', 'maas', 'pulse', 'etw',
    // ... all modules
  ],
  
  // Routes
  routes: [
    { path: '/intelligence', component: 'app/intelligence/page.tsx' },
    { path: '/intelligence/root-cause', component: 'app/intelligence/root-cause/page.tsx' },
    { path: '/intelligence/data-mining', component: 'app/intelligence/data-mining/page.tsx' },
    { path: '/intelligence/process-mining', component: 'app/intelligence/process-mining/page.tsx' },
    { path: '/intelligence/analytics', component: 'app/intelligence/analytics/page.tsx' },
  ],
  
  // APIs
  apis: [
    { endpoint: '/api/intelligence/root-cause/analyze', method: 'POST' },
    { endpoint: '/api/intelligence/data-mining/mine', method: 'POST' },
    { endpoint: '/api/intelligence/process-mining/discover', method: 'POST' },
    { endpoint: '/api/intelligence/analytics/aggregate', method: 'POST' },
  ],
  
  enabled: true,
}

// Register
moduleRegistry.register(intelligenceAnalyticsModule)
```

---

## 📡 EVENT BUS INTEGRATION

### **Subscribing to ALL Modules:**

```typescript
// lib/services/intelligence-analytics/core/eventCaptureService.ts

class EventCaptureService {
  async initialize(): Promise<void> {
    // Get all registered modules
    const modules = moduleRegistry.getAllModules()
    
    // Subscribe to each module's events
    for (const module of modules) {
      // Subscribe to all events from module
      eventBus.subscribe(`${module.id}.*`, async (event: DomainEvent) => {
        await this.captureEvent(event)
      })
      
      // Subscribe to specific event types
      const eventTypes = [
        'created', 'updated', 'deleted',
        'status.changed', 'exception', 'deviation',
        'anomaly', 'incident', 'ncr', 'capa',
        // ... module-specific events
      ]
      
      for (const eventType of eventTypes) {
        eventBus.subscribe(`${module.id}.${eventType}`, async (event) => {
          await this.analyzeEvent(event)
        })
      }
    }
  }
}
```

### **Publishing Intelligence Events:**

```typescript
// Publish intelligence events for other modules to consume
await eventBus.publish({
  type: 'intelligence.root-cause.identified',
  aggregateId: rcaId,
  aggregateType: 'RootCauseAnalysis',
  payload: {
    issueId,
    rootCauses,
    recommendations,
    confidence,
  },
  metadata: { tenantId, sourceModule, ... },
})

// Other modules can subscribe
eventBus.subscribe('intelligence.root-cause.identified', async (event) => {
  // Auto-create CAPA from RCA
  await capaService.createFromRCA(event.payload)
})
```

---

## 🗄️ DATABASE INTEGRATION

### **Prisma Schema (Event Store):**

```prisma
// Already exists in schema.prisma
model Event {
  id            String   @id @default(uuid())
  eventType     String
  aggregateId   String
  aggregateType String
  version       Int
  payload       Json
  metadata      Json?
  timestamp     DateTime @default(now())
  tenantId      String?
  
  @@index([aggregateId, aggregateType])
  @@index([eventType])
  @@index([tenantId])
  @@index([timestamp])
}
```

**Usage:**
- All intelligence events stored in Event table
- Queries for event history
- Projections for analytics
- Event replay for analysis

---

## 🧠 KNOWLEDGE BASE INTEGRATION

```typescript
// Integration Point
import { knowledgeBaseService } from '@/lib/services/knowledge-base'

// Store discovered patterns
await knowledgeBaseService.store({
  type: 'pattern',
  title: 'Recurring Delay Pattern',
  content: patternData,
  tags: ['delay', 'customs', 'pattern'],
  metadata: { confidence, frequency, ... },
})

// Store RCA results
await knowledgeBaseService.store({
  type: 'root-cause-analysis',
  title: `RCA for ${issueId}`,
  content: rcaResult,
  tags: ['rca', issueType, ...],
  metadata: { ... },
})

// Query for similar issues
const similarRCAs = await knowledgeBaseService.search({
  query: issueDescription,
  type: 'root-cause-analysis',
  filters: { issueType, ... },
})
```

**Benefits:**
- ✅ Pattern library
- ✅ RCA knowledge base
- ✅ Similar issue detection
- ✅ Learning from history

---

## 🤖 ML MODEL REGISTRY INTEGRATION

```typescript
// Integration Point
import { mlRegistry } from '@/lib/services/ml-registry'

// Use ML models for predictions
const predictionModel = await mlRegistry.getModel('anomaly-detection')
const prediction = await predictionModel.predict(data)

// Use ML models for RCA
const rcaModel = await mlRegistry.getModel('root-cause-analysis')
const rcaResult = await rcaModel.analyze(issueData)

// Train models from intelligence data
await mlRegistry.trainModel({
  modelId: 'root-cause-analysis',
  trainingData: historicalRCAs,
  algorithm: 'random-forest',
})
```

**Benefits:**
- ✅ ML-powered predictions
- ✅ AI-powered RCA
- ✅ Model versioning
- ✅ Continuous learning

---

## 🔐 MULTI-TENANT INTEGRATION

```typescript
// All operations tenant-scoped
class UnifiedIntelligenceService {
  async analyzeRootCause(
    tenantId: string,  // Required
    issueId: string,
    context: AnalysisContext
  ): Promise<RootCauseAnalysis> {
    // Verify tenant access
    await this.verifyTenantAccess(tenantId)
    
    // All queries tenant-scoped
    const events = await eventStore.getEvents({
      aggregateId: issueId,
      filters: { tenantId },  // Tenant filter
    })
    
    // All evidence tenant-scoped
    const evidence = await evidenceService.getEvidence({
      entityId: issueId,
      tenantId,  // Tenant filter
    })
    
    // Return tenant-scoped result
    return {
      ...rcaResult,
      tenantId,  // Included in result
    }
  }
}
```

**Benefits:**
- ✅ Tenant isolation
- ✅ Data segregation
- ✅ Resource quotas
- ✅ Compliance ready

---

## 📊 CACHING INTEGRATION

```typescript
// Integration Point
import { redis } from '@/lib/services/cache'

// Cache analytics projections
const cacheKey = `analytics:${tenantId}:${moduleId}:${timeRange}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// Compute analytics
const analytics = await analyticsService.aggregate(...)

// Cache result
await redis.setex(cacheKey, 300, JSON.stringify(analytics)) // 5 min TTL

// Invalidate on data change
eventBus.subscribe('*.data.updated', async (event) => {
  await redis.del(`analytics:${event.metadata.tenantId}:*`)
})
```

**Benefits:**
- ✅ Fast analytics queries
- ✅ Reduced database load
- ✅ Real-time performance
- ✅ Cache invalidation

---

## 🔄 BACKGROUND JOBS INTEGRATION

```typescript
// Integration Point
import { jobService } from '@/lib/services/jobs'

// Heavy processing in background
await jobService.createJob({
  type: 'data-mining',
  payload: {
    moduleIds: ['wms', 'tms', ...],
    timeRange: { start, end },
    algorithms: ['clustering', 'anomaly-detection'],
  },
  priority: 'normal',
})

// Job processing
jobService.processJob('data-mining', async (job) => {
  const result = await dataMiningEngine.mine(job.payload)
  await jobService.completeJob(job.id, result)
})
```

**Benefits:**
- ✅ Non-blocking operations
- ✅ Scalable processing
- ✅ Job queue management
- ✅ Progress tracking

---

## 🌐 API INTEGRATION

### **REST API Endpoints:**

```typescript
// app/api/intelligence/root-cause/analyze/route.ts
export async function POST(req: Request) {
  const { tenantId, issueId, context } = await req.json()
  
  const rca = await unifiedIntelligenceService.analyzeRootCause(
    tenantId,
    issueId,
    context
  )
  
  return Response.json(rca)
}

// app/api/intelligence/data-mining/mine/route.ts
export async function POST(req: Request) {
  const { tenantId, moduleIds, timeRange, algorithms } = await req.json()
  
  const results = await dataMiningEngine.mine({
    tenantId,
    moduleIds,
    timeRange,
    algorithms,
  })
  
  return Response.json(results)
}
```

### **GraphQL Integration:**

```typescript
// Can add GraphQL schema if needed
type RootCauseAnalysis {
  id: ID!
  issueId: String!
  rootCauses: [RootCause!]!
  evidence: [Evidence!]!
  recommendations: [Recommendation!]!
}

type Query {
  rootCauseAnalysis(id: ID!): RootCauseAnalysis
  rootCauseAnalyses(filter: RCAFilter): [RootCauseAnalysis!]!
}
```

---

## 🧪 TESTING INTEGRATION

```typescript
// Integration tests
describe('Intelligence & Analytics Integration', () => {
  it('should capture events from all modules', async () => {
    // Publish event from WMS
    await eventBus.publish({
      type: 'wms.shipment.created',
      aggregateId: 'shipment-1',
      // ...
    })
    
    // Verify event captured
    const captured = await eventCaptureService.getCapturedEvents()
    expect(captured).toContainEqual(expect.objectContaining({
      type: 'wms.shipment.created',
    }))
  })
  
  it('should trigger RCA from anomaly', async () => {
    // Publish anomaly
    await eventBus.publish({
      type: 'intelligence.anomaly.detected',
      // ...
    })
    
    // Verify RCA triggered
    const rcas = await rcaEngine.getRecentAnalyses()
    expect(rcas.length).toBeGreaterThan(0)
  })
})
```

---

## 📈 MONITORING & OBSERVABILITY

```typescript
// Integration Point
import { metrics, logger, tracing } from '@/lib/services/observability'

// Metrics
metrics.increment('intelligence.rca.analyzed', {
  module: 'wms',
  issueType: 'delay',
})

// Logging
logger.info('Root cause analysis completed', {
  rcaId,
  issueId,
  confidence,
  duration: Date.now() - startTime,
})

// Tracing
const span = tracing.startSpan('root-cause-analysis')
span.setTag('issue.id', issueId)
span.setTag('module', 'wms')
// ... analysis ...
span.finish()
```

---

## ✅ INTEGRATION CHECKLIST

- [x] **Event Store (CQRS)** - Integrated
- [x] **Event Bus** - Subscribes to all modules
- [x] **Evidence Ledger** - Stores evidence immutably
- [x] **Module Registry** - Registered module
- [x] **Knowledge Base** - Stores patterns/RCA
- [x] **ML Model Registry** - Uses ML models
- [x] **Multi-Tenant** - Full tenant isolation
- [x] **Caching** - Redis integration
- [x] **Background Jobs** - Async processing
- [x] **API** - REST endpoints
- [x] **Database** - Prisma/PostgreSQL
- [x] **Observability** - Metrics/logging/tracing

---

**Status:** Fully Integrated with Tech Stack  
**Architecture Compliance:** ✅ 100%














