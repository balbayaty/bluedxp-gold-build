# Truth Engine Deployment Guide

## Quick Start

### 1. Database Setup

#### PostgreSQL (Recommended)
```bash
# Create database
createdb hazalyze

# Run migration
psql hazalyze -f lib/database/migrations/003_truth_engine.sql

# Verify tables
psql hazalyze -c "\dt truth_*"
```

#### MongoDB
```bash
# MongoDB is schema-less, no migration needed
# Tables will be created automatically on first use
```

#### SQLite (Development)
```bash
# SQLite migration
sqlite3 database.db < lib/database/migrations/003_truth_engine.sql
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hazalyze

# Optional: LLM for adversarial review
TRUTH_ENGINE_LLM_ENABLED=true
TRUTH_ENGINE_LLM_PROVIDER=openai
TRUTH_ENGINE_LLM_API_KEY=sk-...
TRUTH_ENGINE_LLM_MODEL=gpt-4

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# Optional: Rate limiting
TRUTH_ENGINE_RATE_LIMIT_EVENTS_PER_MINUTE=100
TRUTH_ENGINE_RATE_LIMIT_REVIEWS_PER_HOUR=100
```

### 3. Deploy

#### Using Deployment Script (Recommended)
```bash
# Linux/Mac
chmod +x scripts/deploy-truth-engine.sh
./scripts/deploy-truth-engine.sh

# Windows PowerShell
.\scripts\deploy-truth-engine.ps1
```

#### Manual Deployment
```bash
# 1. Build
npm run build

# 2. Run migration (if using PostgreSQL)
psql $DATABASE_URL -f lib/database/migrations/003_truth_engine.sql

# 3. Start application
npm run dev
```

### 4. Verify Installation

1. **Check API Routes:**
   - `GET /api/truth-engine/events?tenantId=test&entityType=shipment&entityId=ship-123`
   - Should return empty timeline or existing events

2. **Check UI:**
   - Navigate to `/truth-timeline/shipment/ship-123`
   - Should display timeline interface

3. **Check Metrics:**
   - Metrics are automatically collected
   - Check console logs for initialization messages

## Integration

### Recording Events

```typescript
import { truthEngineService } from '@/lib/services/truth-engine'

// Record an event
const event = await truthEngineService.recordTruthEvent({
  tenantId: 'tenant-1',
  eventType: 'shipment.created',
  happenedAt: new Date().toISOString(),
  recordedAt: new Date().toISOString(),
  actor: {
    type: 'user',
    id: 'user-123',
    name: 'John Doe',
    role: 'operator',
  },
  entityRefs: {
    shipmentId: 'ship-123',
  },
  evidenceLinks: ['evidence-1', 'evidence-2'],
  confidenceScore: 0.95,
  confidenceReason: 'Automated capture with validation',
})
```

### Getting Timeline

```typescript
const timeline = await truthEngineService.getTruthTimeline('shipment', 'ship-123', {
  eventTypes: ['shipment.created', 'shipment.delivered'],
  minConfidence: 0.7,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
})
```

### Adversarial Review

```typescript
const review = await truthEngineService.reviewDecision(
  {
    type: 'approve_shipment',
    id: 'decision-1',
    data: { shipmentId: 'ship-123' },
  },
  {
    tenantId: 'tenant-1',
    relatedTruthEvents: ['event-1', 'event-2'],
    relatedEvidence: ['evidence-1'],
  }
)
```

### KPI Management

```typescript
// Register KPI
await truthEngineService.registerKPI({
  name: 'on-time-delivery',
  description: 'Percentage of shipments delivered on time',
  formula: 'count(shipment.delivered where on_time) / count(shipment.created) * 100',
  requiredEventTypes: ['shipment.created', 'shipment.delivered'],
  minimumEvidenceRequirements: [
    { type: 'delivery_proof', required: true },
  ],
  category: 'performance',
  module: 'tms',
})

// Calculate KPI
const kpi = await truthEngineService.calculateKPI('on-time-delivery', {
  tenantId: 'tenant-1',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
})
```

## Troubleshooting

### Database Connection Issues

1. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test Connection:**
   ```bash
   # PostgreSQL
   psql $DATABASE_URL -c "SELECT 1"
   
   # MongoDB
   mongosh $DATABASE_URL --eval "db.adminCommand('ping')"
   ```

### Migration Errors

1. **Check if tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'truth_%';
   ```

2. **Drop and recreate (development only):**
   ```sql
   DROP TABLE IF EXISTS truth_events CASCADE;
   DROP TABLE IF EXISTS truth_kpis CASCADE;
   DROP TABLE IF EXISTS adversarial_reviews CASCADE;
   DROP TABLE IF EXISTS board_briefs CASCADE;
   ```
   Then re-run migration.

### LLM Not Working

1. **Check API Key:**
   ```bash
   echo $TRUTH_ENGINE_LLM_API_KEY
   ```

2. **Check Provider:**
   - OpenAI: `TRUTH_ENGINE_LLM_PROVIDER=openai`
   - Anthropic: `TRUTH_ENGINE_LLM_PROVIDER=anthropic`

3. **Fallback:**
   - LLM is optional - system falls back to rules-based review

### Cache Issues

1. **Redis Connection:**
   ```bash
   redis-cli ping
   ```

2. **Memory Cache:**
   - System automatically falls back to memory cache if Redis unavailable

## Production Checklist

- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] LLM API keys set (if using LLM features)
- [ ] Redis configured (if using Redis caching)
- [ ] Rate limiting configured
- [ ] API routes tested
- [ ] UI components accessible
- [ ] Metrics collection verified
- [ ] Error logging configured
- [ ] Backup strategy in place

## Support

- **Documentation:** See `TRUTH_ENGINE_COMPLETE.md`
- **API Docs:** See `docs/TruthEngine.md`
- **Tests:** Run `npm test -- lib/services/truth-engine`







