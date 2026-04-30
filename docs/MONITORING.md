# BlueDXP Platform - Monitoring Guide

## Overview

BlueDXP Platform includes comprehensive observability with logs, metrics, traces, and alerts.

## Observability Stack

### Loki - Log Aggregation
- **URL**: http://localhost:3100
- **Purpose**: Centralized log collection
- **Integration**: All services send logs to Loki

### Prometheus - Metrics
- **URL**: http://localhost:9090
- **Purpose**: Metrics collection and storage
- **Integration**: All services expose Prometheus metrics

### Grafana - Visualization
- **URL**: http://localhost:3001
- **Credentials**: admin/admin (change in production)
- **Purpose**: Dashboards and visualization

### Jaeger - Distributed Tracing
- **URL**: http://localhost:16686
- **Purpose**: Request tracing across services

## Key Metrics

### Application Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration
- `event_bus_events_total` - Events published
- `database_queries_total` - Database queries
- `cache_hits_total` - Cache hits
- `cache_misses_total` - Cache misses

### Infrastructure Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Container metrics

## Logging

### Log Levels
- `DEBUG` - Detailed debugging information
- `INFO` - General information
- `WARN` - Warning messages
- `ERROR` - Error messages
- `FATAL` - Fatal errors

### Log Format
```json
{
  "timestamp": "2025-01-27T10:00:00Z",
  "level": "info",
  "message": "Request processed",
  "context": {
    "tenantId": "tenant_123",
    "userId": "user_456",
    "requestId": "req_789"
  }
}
```

## Alerting

### Alert Channels
- Email
- Slack
- PagerDuty
- Webhooks

### Alert Rules
Configured in Prometheus:
- High error rate
- High latency
- Service down
- Resource exhaustion

## Dashboards

### Pre-configured Dashboards
1. **Application Overview** - Key application metrics
2. **Infrastructure** - System resources
3. **Business Metrics** - Business KPIs
4. **Error Tracking** - Error rates and types

### Custom Dashboards
Create custom dashboards in Grafana for:
- Module-specific metrics
- Tenant-specific metrics
- Custom business metrics

## Health Checks

### Application Health
```bash
curl http://localhost:3002/api/health
```

### Service Health
All services expose health endpoints:
- Application: `/api/health`
- Event Bus: `/health`
- Individual services: See docker-compose.yml

## Troubleshooting

### High Error Rate
1. Check logs in Loki
2. Review error patterns
3. Check service dependencies
4. Review recent deployments

### High Latency
1. Check Jaeger traces
2. Identify slow queries
3. Check cache hit rates
4. Review resource usage

### Service Down
1. Check service logs
2. Verify dependencies
3. Check resource limits
4. Review health checks

## Best Practices

1. **Log Everything**: Log all important operations
2. **Structured Logging**: Use structured JSON logs
3. **Context**: Include request IDs and correlation IDs
4. **Metrics**: Expose all important metrics
5. **Traces**: Trace all requests
6. **Alerts**: Set up meaningful alerts
7. **Dashboards**: Create useful dashboards

