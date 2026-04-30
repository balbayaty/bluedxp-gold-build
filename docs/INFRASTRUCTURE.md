# BlueDXP Platform - Infrastructure Overview

## Architecture

BlueDXP Platform is built on a modern, cloud-native architecture designed for enterprise-scale operations in Saudi Arabia.

### Core Infrastructure Components

#### Message Streaming
- **Apache Kafka**: High-volume event streaming
- **Zookeeper**: Kafka coordination
- **RabbitMQ**: Message queue for event bus

#### Storage
- **PostgreSQL 15**: Primary database with pgvector extension
- **Redis 7**: Caching and rate limiting
- **MinIO**: Object storage for documents and files
- **PgBouncer**: Connection pooling

#### Search & Analytics
- **OpenSearch**: Full-text search and analytics
- **OpenSearch Dashboards**: Search visualization

#### Observability
- **Loki**: Log aggregation
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **Jaeger**: Distributed tracing

#### Security
- **HashiCorp Vault**: Secrets management

#### Batch Processing & MLOps
- **Apache Airflow**: Batch processing and ETL
- **MLflow**: ML model management

#### Model Context Protocol (MCP)
- **Enhanced MCP Server**: Enterprise-grade tool execution platform
- **Features**: Analytics, caching, batching, streaming, rate limiting
- **Tools**: 50+ tools across 13+ services
- **Endpoints**: `/api/mcp/tools`, `/api/mcp/health`, `/api/mcp/analytics`
- **Dashboard**: `/mcp/analytics`
- **Configuration**: `MCP_ENABLED=true` in environment
- **Documentation**: See `docs/MCP_ARCHITECTURE_INTEGRATION.md`

### Deployment

#### Docker Compose
All services are orchestrated via `docker-compose.yml`:
```bash
docker-compose up -d
```

#### Kubernetes
Helm charts available in `helm/bluedxp/`:
```bash
helm install bluedxp ./helm/bluedxp
```

#### Terraform
Infrastructure as Code in `terraform/`:
```bash
terraform init
terraform plan
terraform apply
```

### Saudi Arabia Compliance

All infrastructure components are configured for:
- Data sovereignty (Saudi Arabia data centers)
- Encryption at rest and in transit
- Audit logging
- Multi-factor authentication
- Zero-trust security model

### Monitoring

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **OpenSearch Dashboards**: http://localhost:5601

### Health Checks

All services include health check endpoints:
- Application: `/api/health`
- Event Bus: `/health`
- Individual services: See docker-compose.yml

