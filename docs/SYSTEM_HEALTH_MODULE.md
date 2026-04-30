# System Health Module - Complete Documentation

## 🎯 Overview

The **System Health Module** is a comprehensive, auto-updating system health monitoring and diagnostics module for the BlueDXP platform. It provides real-time monitoring of infrastructure, services, modules, and Docker containers.

## ✅ What Was Created

### 1. **System Health Service** (`lib/services/system-health/`)
- **Service Layer**: `systemHealthService.ts` - Core health monitoring logic
- **Auto-updating**: Updates every 30 seconds automatically
- **Caching**: 5-second cache to prevent excessive checks
- **Event Bus Integration**: Publishes health updates to event bus

### 2. **Module Definition** (`lib/modules/system-health.ts`)
- **Registered Module**: Follows platform module registry pattern
- **Routes**: `/diagnostics` and `/system-status`
- **APIs**: Multiple health check endpoints
- **Widgets**: Health overview widgets for dashboards

### 3. **API Endpoints**
- `/api/system-health/status` - Main comprehensive health endpoint
- `/api/system/complete-status` - Consolidated endpoint (uses service)
- `/api/system-health/service/:serviceName` - Individual service health
- `/api/system-health/module/:moduleId` - Individual module health

### 4. **Integration**
- **Diagnostics Page**: Updated to use System Health Service
- **System Status Page**: Uses unified service
- **No Duplication**: All health checks consolidated

## 🏗️ Architecture

### Service Layer Pattern
```
lib/services/system-health/
├── systemHealthService.ts  # Core service with auto-update
└── index.ts                 # Exports
```

### Module Pattern
```
lib/modules/
└── system-health.ts         # Module definition
```

### API Layer
```
app/api/system-health/
└── status/route.ts          # Main API endpoint
```

## 🔄 Auto-Update Features

### Server-Side Auto-Update
- **Interval**: 30 seconds (configurable)
- **Cache**: 5 seconds (prevents excessive checks)
- **Background**: Runs automatically on server
- **Event Bus**: Publishes updates to event bus

### Client-Side Auto-Update
- **Diagnostics Page**: Refreshes every 30 seconds
- **System Status Page**: Refreshes every 30 seconds
- **Real-time**: Shows latest status automatically

## 📊 What It Monitors

### Infrastructure Services
- ✅ PostgreSQL Database
- ✅ Redis Cache
- ✅ Docker Containers (all BlueDXP containers)

### Modules
- ✅ All registered modules (30+)
- ✅ Module health status
- ✅ Module dependencies
- ✅ Module metrics (response time, error rate, etc.)

### Environment
- ✅ Environment variables configuration
- ✅ Service connectivity
- ✅ Overall system health

## 🎨 User Interface

### Diagnostics Page (`/diagnostics`)
- **Quick Health Check**: Basic diagnostics
- **Auto-refresh**: Updates every 30 seconds
- **Link to Full Status**: Button to system status page

### System Status Page (`/system-status`)
- **Comprehensive View**: All services, modules, Docker
- **Auto-refresh**: Updates every 30 seconds
- **Visual Status**: Color-coded health indicators
- **Detailed Metrics**: Response times, uptime, etc.

## 🔌 Integration Points

### Module Registry
- ✅ Registered in `lib/modules/index.ts`
- ✅ Appears in module list
- ✅ Follows platform patterns

### Event Bus
- ✅ Publishes `system.health.updated` events
- ✅ Other modules can subscribe to health updates

### Module Manager
- ✅ Integrates with `moduleManager.getModuleHealth()`
- ✅ Tracks module health metrics

## 📝 API Usage

### Get Complete Health Status
```typescript
GET /api/system-health/status
GET /api/system-health/status?refresh=true  // Force refresh

Response:
{
  ok: true,
  overallStatus: 'ok' | 'degraded' | 'down',
  timestamp: Date,
  services: ServiceHealth[],
  modules: ModuleHealthInfo[],
  docker: DockerContainer[],
  environment_vars: Record<string, boolean>,
  summary: {
    totalServices: number,
    healthyServices: number,
    totalModules: number,
    enabledModules: number,
    healthyModules: number,
    totalContainers: number,
    healthyContainers: number,
  }
}
```

### Get Service Health
```typescript
GET /api/system-health/service/:serviceName

Response:
{
  name: string,
  status: 'ok' | 'degraded' | 'down' | 'not_configured',
  details?: string,
  port?: number,
  url?: string,
  lastChecked: Date,
  responseTime?: number,
}
```

### Get Module Health
```typescript
GET /api/system-health/module/:moduleId

Response:
{
  id: string,
  name: string,
  enabled: boolean,
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown',
    uptime: number,
    lastHealthCheck: Date,
    issues: string[],
    metrics: {
      responseTime: number,
      errorRate: number,
      requestCount: number,
    }
  }
}
```

## ⚙️ Configuration

### Module Settings
```typescript
{
  autoUpdate: true,        // Enable auto-updates
  updateInterval: 30000,  // 30 seconds
  cacheExpiry: 5000,      // 5 seconds cache
}
```

### Environment Variables
- `DATABASE_URL` - Database connection
- `REDIS_URL` - Redis connection
- `NODE_ENV` - Environment mode

## 🚀 Usage

### In Code
```typescript
import { systemHealthService } from '@/lib/services/system-health'

// Get complete health status
const status = await systemHealthService.getHealthStatus()

// Get specific service health
const dbHealth = await systemHealthService.getServiceHealth('PostgreSQL Database')

// Get specific module health
const moduleHealth = await systemHealthService.getModuleHealthStatus('wms')
```

### In Components
```typescript
// Auto-updating health status
useEffect(() => {
  const fetchHealth = async () => {
    const response = await fetch('/api/system-health/status')
    const data = await response.json()
    setHealthStatus(data)
  }
  
  fetchHealth()
  const interval = setInterval(fetchHealth, 30000)
  return () => clearInterval(interval)
}, [])
```

## ✅ Benefits

1. **No Duplication**: All health checks consolidated in one service
2. **Auto-Updating**: No manual refresh needed
3. **Comprehensive**: Monitors everything (services, modules, Docker)
4. **Reliable**: Cached results prevent excessive checks
5. **Integrated**: Follows platform patterns, registered as module
6. **Event-Driven**: Publishes updates to event bus
7. **Future-Proof**: Easy to extend with new health checks

## 🔮 Future Enhancements

- Health history tracking
- Alerting on health degradation
- Health metrics dashboard
- Integration with monitoring tools (Prometheus, Grafana)
- Health-based auto-scaling
- Predictive health analytics

---

**Status**: ✅ **COMPLETE - FULLY INTEGRATED - NO DUPLICATION**




