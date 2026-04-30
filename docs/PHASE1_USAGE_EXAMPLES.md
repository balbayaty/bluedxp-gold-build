# 📚 Phase 1: Security & Observability - Usage Examples

**Complete guide on how to use all Phase 1 services**

---

## 🔒 SECURITY SERVICES

### **1. Zero-Trust Security Service**

```typescript
import { zeroTrustService } from '@/lib/services/security'

// Verify a request
const result = await zeroTrustService.verifyRequest(request)
if (!result.verified) {
  return NextResponse.json(
    { error: result.reason },
    { status: 403 }
  )
}

// Verify service identity (mTLS)
const serviceResult = await zeroTrustService.verifyServiceIdentity(
  'inventory-service',
  certificate
)

// Enforce least privilege
const hasAccess = await zeroTrustService.enforceLeastPrivilege(
  userId,
  'inventory',
  'read',
  { warehouseId: 'warehouse-123' }
)
```

### **2. API Security Gateway**

```typescript
import { apiSecurityGateway } from '@/lib/services/security'

// Check WAF rules
const wafResult = await apiSecurityGateway.checkWAFRules(request)
if (wafResult.blocked) {
  return NextResponse.json(
    { error: wafResult.reason },
    { status: 403 }
  )
}

// Check DDoS protection
const ddosResult = await apiSecurityGateway.checkDDoSProtection(
  clientIP,
  '/api/inventory'
)

// Check rate limit
const rateLimit = await apiSecurityGateway.checkRateLimit(
  userId,
  apiKeyId,
  '/api/inventory'
)
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}

// Rotate API key
const rotated = await apiSecurityGateway.rotateAPIKey('key-123', {
  keepOldKeyFor: 3600, // 1 hour grace period
  notifyUser: true
})
```

### **3. Secrets Rotation Service**

```typescript
import { secretsRotationService } from '@/lib/services/security'

// Set rotation policy
await secretsRotationService.setRotationPolicy({
  secretId: 'jwt-secret',
  rotationInterval: 90, // days
  minRotationInterval: 30,
  autoRotate: true,
  notifyOnRotation: true,
  notifyRecipients: ['admin@example.com']
})

// Manually rotate secret
const result = await secretsRotationService.rotateSecret('jwt-secret')
console.log(`New secret version: ${result.newVersion}`)

// Sync with Vault
await secretsRotationService.syncWithVault()

// Get secret version
const version = await secretsRotationService.getSecretVersion(
  'jwt-secret',
  2
)
```

### **4. File Encryption Service**

```typescript
import { fileEncryptionService } from '@/lib/services/storage/encryptionService'

// Encrypt file before storage
const encrypted = await fileEncryptionService.encryptFile(fileBuffer)
// Store encrypted.encryptedData, encrypted.iv, encrypted.keyId

// Decrypt file on retrieval
const decrypted = await fileEncryptionService.decryptFile(encrypted)

// Rotate encryption key
const newKey = await fileEncryptionService.rotateEncryptionKey('default')
```

---

## 📊 OBSERVABILITY SERVICES

### **1. APM Service**

```typescript
import { apmService } from '@/lib/services/observability/apmService'

// Track slow query
await apmService.trackSlowQuery(
  'SELECT * FROM inventory WHERE tenantId = ?',
  1500 // milliseconds
)

// Detect N+1 queries
const nPlusOne = await apmService.detectNPlusOneQueries([
  { query: 'SELECT * FROM users WHERE id = ?', timestamp: Date.now() },
  { query: 'SELECT * FROM users WHERE id = ?', timestamp: Date.now() },
  // ... 50 more identical queries
])
if (nPlusOne.detected) {
  console.warn('N+1 query detected:', nPlusOne.patterns)
}

// Detect memory leaks
const leakReport = await apmService.detectMemoryLeaks()
if (leakReport.detected) {
  console.error('Memory leak detected:', leakReport.memoryGrowth, 'MB/hour')
  console.log('Recommendations:', leakReport.recommendations)
}

// Check performance budget
const budget = await apmService.checkPerformanceBudget('/api/inventory')
if (!budget.withinBudget) {
  console.warn('Budget violations:', budget.violations)
}

// Get real-time metrics
const metrics = await apmService.getPerformanceMetrics()
console.log('Average response time:', metrics.averageResponseTime)
console.log('P95 response time:', metrics.p95ResponseTime)
console.log('Requests per second:', metrics.requestsPerSecond)

// Set performance budget
apmService.setPerformanceBudget('/api/inventory', {
  endpoint: '/api/inventory',
  maxResponseTime: 500,
  maxDatabaseQueries: 10,
  maxMemoryUsage: 100,
  maxCpuUsage: 80,
})
```

### **2. Alerting Service**

```typescript
import { alertingService } from '@/lib/services/observability/alertingService'

// Detect anomalies
const anomaly = await alertingService.detectAnomalies(
  'response_time:/api/inventory',
  2000 // milliseconds
)
if (anomaly.detected) {
  console.warn('Anomaly detected:', anomaly.anomalyType)
  console.log('Deviation:', anomaly.deviation, '%')
}

// Send alert
await alertingService.sendAlert({
  id: `alert-${Date.now()}`,
  severity: 'high',
  title: 'High Response Time',
  message: 'API endpoint /api/inventory is slow',
  source: 'apm',
  metric: 'response_time:/api/inventory',
  value: 2000,
  threshold: 500,
  timestamp: new Date(),
  metadata: {
    endpoint: '/api/inventory',
    userId: 'user-123',
  },
})

// Correlate alerts
const correlation = await alertingService.correlateAlerts([
  alert1,
  alert2,
  alert3,
])
if (correlation.correlated) {
  console.log('Root cause:', correlation.rootCause)
  console.log('Related alerts:', correlation.relatedAlerts)
}

// Predict future alerts
const prediction = await alertingService.predictAlert(
  'response_time:/api/inventory'
)
if (prediction.willAlert) {
  console.log('Alert predicted at:', prediction.estimatedTime)
  console.log('Confidence:', prediction.confidence)
}

// Add alert rule
alertingService.addAlertRule({
  id: 'high-response-time',
  metric: 'response_time:/api/inventory',
  threshold: 1000,
  operator: 'gt',
  severity: 'high',
  enabled: true,
})
```

---

## 🔧 MIDDLEWARE USAGE

### **Zero-Trust Middleware**

Already integrated into `middleware/apiGateway.ts`. It automatically:
- Verifies every request
- Checks WAF rules
- Protects against DDoS
- Enforces rate limits

**To enable/disable:**
```env
ZERO_TRUST_ENABLED=true  # or false to disable
```

### **Observability Middleware**

Already integrated into `middleware/apiGateway.ts`. It automatically:
- Tracks performance metrics
- Detects anomalies
- Checks performance budgets
- Creates alerts

**To enable/disable:**
```env
OBSERVABILITY_ENABLED=true  # or false to disable
```

---

## 📡 API ENDPOINTS

### **Enhanced Health Check**

```bash
# Get comprehensive health status
curl http://localhost:3002/api/health/enhanced

# Response includes:
# - Performance metrics
# - Memory leak detection
# - Service status
# - OpenTelemetry status
```

### **Metrics Endpoint**

```bash
# Prometheus metrics
curl http://localhost:3002/api/metrics

# Returns Prometheus-formatted metrics
```

---

## 🎯 INTEGRATION EXAMPLES

### **In API Route Handler**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAPIGateway } from '@/middleware/apiGateway'
import { apmService } from '@/lib/services/observability/apmService'

async function handler(req: NextRequest, context: any) {
  const startTime = Date.now()
  
  try {
    // Your business logic
    const result = await processInventory()
    
    // Track performance
    const responseTime = Date.now() - startTime
    apmService.trackRequest('/api/inventory', responseTime, 5) // 5 queries
    
    return NextResponse.json(result)
  } catch (error) {
    // Error tracking happens automatically via observability middleware
    throw error
  }
}

// Wrap with API Gateway (includes zero-trust + observability)
export const GET = withAPIGateway(handler, {
  moduleId: 'wms',
  featureId: 'inventory',
  action: 'read',
  requireAuth: true,
  rateLimit: true,
})
```

### **In Service Layer**

```typescript
import { apmService } from '@/lib/services/observability/apmService'
import { prisma } from '@/lib/services/database/prismaClient'

export async function getInventory(tenantId: string) {
  const startTime = Date.now()
  
  try {
    const inventory = await prisma.inventory.findMany({
      where: { tenantId },
    })
    
    const duration = Date.now() - startTime
    
    // Track slow queries
    if (duration > 1000) {
      await apmService.trackSlowQuery(
        'SELECT * FROM inventory WHERE tenantId = ?',
        duration
      )
    }
    
    return inventory
  } catch (error) {
    // Error tracking happens automatically
    throw error
  }
}
```

---

## 🔍 MONITORING & DEBUGGING

### **View Traces in Jaeger**

1. Start Jaeger: `docker-compose up -d jaeger`
2. Open: http://localhost:16686
3. Search for traces by service name: `bluedxp-platform`
4. View span details, timing, and errors

### **View Metrics in Prometheus**

1. Start Prometheus: `docker-compose up -d prometheus`
2. Open: http://localhost:9090
3. Query metrics: `http_request_duration_seconds`
4. Create alerts based on metrics

### **View Logs in Loki**

1. Start Loki: `docker-compose up -d loki`
2. View in Grafana: http://localhost:3001
3. Search logs by labels: `{service="bluedxp-platform"}`

### **View Alerts**

Alerts are sent to:
- Slack (if `SLACK_WEBHOOK_URL` configured)
- Email (if email service configured)
- PagerDuty (if configured)
- Stored in database (`Alert` model)

---

## 🎯 BEST PRACTICES

1. **Always use API Gateway middleware** - It includes all security and observability
2. **Track slow queries** - Use `apmService.trackSlowQuery()` for queries > 1s
3. **Set performance budgets** - Define acceptable performance for each endpoint
4. **Monitor anomalies** - Let the system automatically detect issues
5. **Rotate secrets regularly** - Set up automatic rotation policies
6. **Encrypt sensitive files** - Use encryption service for files at rest

---

**For more details, see:**
- `docs/QUICK_START_PHASE1.md` - Quick integration guide
- `docs/PHASE1_INTEGRATION_COMPLETE.md` - Integration details
- `docs/PHASE1_FINAL_SUMMARY.md` - Complete summary


