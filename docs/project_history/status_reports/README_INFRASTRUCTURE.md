# BlueDXP Platform - Infrastructure Overview

## 🏗️ Complete Infrastructure Stack

This document provides a quick overview of all infrastructure components implemented in BlueDXP Platform.

## Core Services

### Message & Event Streaming
- **Kafka** - High-volume event streaming
- **RabbitMQ** - Traditional message queuing
- **Event Bus** - Internal event system

### Storage & Caching
- **PostgreSQL** - Primary database with pgvector
- **Redis** - Caching and session storage
- **MinIO** - S3-compatible object storage
- **PgBouncer** - Database connection pooling

### Search & Analytics
- **OpenSearch** - Full-text search and analytics
- **OpenSearch Dashboards** - Visualization

### Observability
- **Loki** - Log aggregation
- **Prometheus** - Metrics collection
- **Grafana** - Visualization and dashboards
- **Jaeger** - Distributed tracing

### Security
- **HashiCorp Vault** - Secrets management

### Batch Processing & ML
- **Apache Airflow** - Workflow orchestration
- **MLflow** - ML lifecycle management

### Integration
- **MCP Server** - Model Context Protocol
- **17 Saudi Government APIs** - Complete integration

## Quick Start

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Application | 3002 | http://localhost:3002 |
| Grafana | 3001 | http://localhost:3001 |
| Prometheus | 9090 | http://localhost:9090 |
| Jaeger | 16686 | http://localhost:16686 |
| OpenSearch | 9200 | http://localhost:9200 |
| OpenSearch Dashboards | 5601 | http://localhost:5601 |
| MinIO | 9000 | http://localhost:9000 |
| MinIO Console | 9001 | http://localhost:9001 |
| RabbitMQ | 5672 | amqp://localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |
| Airflow | 8080 | http://localhost:8080 |
| MLflow | 5000 | http://localhost:5000 |
| Vault | 8200 | http://localhost:8200 |

## Documentation

For complete infrastructure documentation, see:
- [docs/INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md) - Complete infrastructure guide
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment guide
- [docs/MONITORING.md](./docs/MONITORING.md) - Monitoring guide

---

**Status**: ✅ **100% COMPLETE**  
**All services implemented and ready for production**

