# BlueDXP Platform — Tech Stack Agent Prompt (Agent 1)
## Complete Infrastructure Development for World's Most Advanced Platform

**CRITICAL: Read this entire prompt before making any changes.**

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Build infrastructure for the entire BlueDXP Platform  
**Platform:** BlueDXP (Enterprise Intelligence Operating System)  
**Scope:** Complete platform infrastructure (all modules: WMS, TMS, QHSE, Finance, CRM, Compliance, HAZALYZE, MaaS, etc.)

---

## ⚠️ Part 1: Critical Safety Rules (Non-Negotiable)

### Rule 1: Do NOT Break Existing Functionality
- ✅ Test all existing APIs after changes
- ✅ Do NOT delete working code
- ✅ Do NOT change existing API contracts
- ✅ Use feature flags for new features
- ✅ Maintain backward compatibility
- ✅ Version APIs if breaking changes needed (`/api/v2/...`)

### Rule 2: Locked Tech Stack (DO NOT CHANGE)
```yaml
Frontend:
  Framework: Next.js 14.2.3 (App Router) - DO NOT CHANGE
  Language: TypeScript 5.2 - DO NOT CHANGE
  UI Library: React 18.2 - DO NOT CHANGE
  Styling: Tailwind CSS 3.3.5 - DO NOT CHANGE

Backend:
  Runtime: Node.js 20 (LTS) - DO NOT CHANGE
  API Framework: Next.js API Routes - DO NOT CHANGE
  Real-time: Socket.io 4.7.2 - DO NOT CHANGE
  GraphQL: Apollo Server 4.9.5 - DO NOT CHANGE

Database:
  Primary: PostgreSQL 15 - DO NOT CHANGE
  Cache: Redis 7 - DO NOT CHANGE
  Message Queue: RabbitMQ 3 - DO NOT CHANGE

Containerization:
  Docker: Multi-stage builds - DO NOT CHANGE
  Docker Compose: Existing structure - ENHANCE ONLY
```

### Rule 3: Follow Existing Patterns
- **API Routes:** `app/api/[module]/[feature]/route.ts`
- **Services:** `lib/services/[service-name]/`
- **Types:** `types/[module].ts`
- **Middleware:** `middleware/[name].ts`
- **Follow existing code style and patterns**

### Rule 4: Test Before Committing
- ✅ Test each component after implementation
- ✅ Verify Docker containers start correctly
- ✅ Test API endpoints
- ✅ Check database connections
- ✅ Verify no breaking changes

---

## 📋 Part 2: Industry Standards — API Design & Naming Conventions

### REST API Naming Conventions (RFC 3986, OpenAPI 3.0)

**URL Structure:**
```
/api/v1/{resource}/{identifier}/{sub-resource}
```

**Examples:**
```
✅ CORRECT:
GET    /api/v1/transportation/shipments
GET    /api/v1/transportation/shipments/{id}
POST   /api/v1/transportation/shipments
PUT    /api/v1/transportation/shipments/{id}
DELETE /api/v1/transportation/shipments/{id}
GET    /api/v1/transportation/shipments/{id}/tracking
POST   /api/v1/transportation/shipments/{id}/cancel

❌ WRONG:
GET    /api/v1/getShipments
POST   /api/v1/createShipment
GET    /api/v1/shipment/{id}/getTracking
```

**Naming Rules:**
1. **Use nouns, not verbs:** `/shipments` not `/getShipments`
2. **Use plural nouns:** `/shipments` not `/shipment`
3. **Use kebab-case:** `/shipment-tracking` not `/shipmentTracking`
4. **Use lowercase:** `/shipments` not `/Shipments`
5. **Use forward slashes for hierarchy:** `/shipments/{id}/tracking`
6. **Use query parameters for filtering:** `?status=active&limit=10`

**HTTP Methods (RFC 7231):**
- `GET` - Retrieve resources (idempotent, safe)
- `POST` - Create resources (not idempotent)
- `PUT` - Update/replace resources (idempotent)
- `PATCH` - Partial update (not idempotent)
- `DELETE` - Delete resources (idempotent)

**HTTP Status Codes (RFC 7231):**
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down

**Response Format (JSON API Standard):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req_abc123",
    "version": "v1"
  },
  "errors": null
}
```

**Error Response Format:**
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid shipment status",
      "field": "status",
      "details": { ... }
    }
  ],
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**API Versioning:**
- **URL path:** `/api/v1/...`, `/api/v2/...`
- **Header:** `X-API-Version: v1`
- **Default:** `v1` if not specified
- **Support multiple versions simultaneously**
- **Document deprecation dates**

**OpenAPI 3.0 Documentation:**
- Generate OpenAPI spec at `/api/docs/openapi.json`
- Include all endpoints
- Include request/response schemas
- Include authentication requirements
- Include rate limits
- Include examples

---

## 🇸🇦 Part 3: Saudi Arabia Government Requirements

### Data Sovereignty & Local Hosting Requirements

**Critical Requirements:**
1. ✅ All data must be stored in Saudi Arabia data centers
2. ✅ No data transfer outside Saudi Arabia without explicit consent
3. ✅ Compliance with Personal Data Protection Law (PDPL)
4. ✅ Compliance with SAMA regulations (if financial data)
5. ✅ Compliance with NCSC cybersecurity framework
6. ✅ Compliance with SDAIA AI governance

### Saudi Government Agencies (Integrate with ALL)

**1. TGA (Transport General Authority)**
- Vehicle registration verification
- Driver license verification
- Commercial transport licenses
- **API Endpoints:**
  - `POST /api/tga/vehicles/verify`
  - `POST /api/tga/drivers/verify`
  - `GET /api/tga/licenses/{id}`

**2. MOT (Ministry of Transport)**
- Logistics license verification
- Transport permits
- **API Endpoints:**
  - `POST /api/mot/licenses/verify`
  - `GET /api/mot/licenses/{id}`

**3. Absher**
- Identity verification
- National ID validation
- **API Endpoints:**
  - `POST /api/absher/identity/verify`
  - `GET /api/absher/identity/{nationalId}`

**4. NAFATH (National Authentication Framework)**
- National authentication
- Digital identity verification
- **API Endpoints:**
  - `POST /api/nafath/authenticate`
  - `POST /api/nafath/verify`
  - `GET /api/nafath/status/{transactionId}`

**5. SABER (Saudi Product Safety Program)**
- Product conformity certificates
- Import/export compliance
- **API Endpoints:**
  - `POST /api/saber/certificates/verify`
  - `GET /api/saber/certificates/{certificateId}`

**6. SFDA (Saudi Food and Drug Authority)**
- Food safety licenses
- Pharmaceutical licenses
- **API Endpoints:**
  - `POST /api/sfda/licenses/verify`
  - `GET /api/sfda/licenses/{licenseId}`

**7. ZATCA (Zakat, Tax and Customs Authority)**
- E-invoicing integration
- Customs clearance
- Tax compliance
- **API Endpoints:**
  - `POST /api/zatca/invoices`
  - `POST /api/zatca/customs/clearance`
  - `GET /api/zatca/tax/compliance`

**8. SAMA (Saudi Central Bank)**
- Financial regulations compliance
- Payment processing compliance
- **API Endpoints:**
  - `POST /api/sama/compliance/verify`
  - `GET /api/sama/regulations`

**9. NCSC (National Cybersecurity Authority)**
- Cybersecurity framework compliance
- Data protection compliance
- **API Endpoints:**
  - `POST /api/ncsc/compliance/verify`
  - `GET /api/ncsc/framework`

**10. SDAIA (Saudi Data and AI Authority)**
- AI governance compliance
- Data strategy compliance
- **API Endpoints:**
  - `POST /api/sdaia/compliance/verify`
  - `GET /api/sdaia/governance`

**11. SASO (Saudi Standards, Metrology and Quality Organization)**
- Standards compliance
- Quality certifications
- **API Endpoints:**
  - `POST /api/saso/certificates/verify`
  - `GET /api/saso/standards`

**12. MODON (Saudi Industrial Property Authority)**
- Industrial property compliance
- Warehouse licenses
- **API Endpoints:**
  - `POST /api/modon/licenses/verify`
  - `GET /api/modon/licenses/{licenseId}`

**13. MOC (Ministry of Commerce)**
- Commercial registration
- Business licenses
- **API Endpoints:**
  - `POST /api/moc/licenses/verify`
  - `GET /api/moc/registration/{crNumber}`

**14. MOI (Ministry of Interior)**
- Security clearances
- Work permits
- **API Endpoints:**
  - `POST /api/moi/clearances/verify`
  - `GET /api/moi/permits/{permitId}`

**15. MOMRA (Ministry of Municipal, Rural Affairs and Housing)**
- Municipal licenses
- Building permits
- **API Endpoints:**
  - `POST /api/momra/licenses/verify`
  - `GET /api/momra/permits/{permitId}`

**16. MISA (Ministry of Investment)**
- Investment licenses
- Foreign investment compliance
- **API Endpoints:**
  - `POST /api/misa/licenses/verify`
  - `GET /api/misa/investment/{licenseId}`

**17. CITC (Communications and Information Technology Commission)**
- Telecommunications compliance
- Data center licenses
- **API Endpoints:**
  - `POST /api/citc/compliance/verify`
  - `GET /api/citc/licenses/{licenseId}`

### Government Hosting Requirements

**Data Residency:**
- ✅ All data in Saudi Arabia
- ✅ No cross-border data transfer without consent
- ✅ Data sovereignty compliance

**Encryption:**
- ✅ AES-256 at rest
- ✅ TLS 1.3 in transit
- ✅ Quantum-safe cryptography (5IR alignment)

**Audit Logging:**
- ✅ All operations logged
- ✅ Immutable audit trail
- ✅ Compliance reporting

**Access Control:**
- ✅ RBAC with government roles
- ✅ Multi-factor authentication (MFA)
- ✅ Zero-trust security model

**Compliance Monitoring:**
- ✅ Real-time compliance checks
- ✅ Automated compliance reports
- ✅ Regulatory change notifications

---

## 🏗️ Part 4: Missing Infrastructure Components

### 4.1 Message Streaming: Apache Kafka

**Add to `docker-compose.yml`:**
```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: bluedxp-kafka
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
  ports:
    - "9092:9092"
  depends_on:
    - zookeeper
  networks:
    - bluedxp-network
  healthcheck:
    test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
    interval: 30s
    timeout: 10s
    retries: 5

zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  container_name: bluedxp-zookeeper
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
  ports:
    - "2181:2181"
  networks:
    - bluedxp-network
  healthcheck:
    test: ["CMD", "nc", "-z", "localhost", "2181"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Implementation:**
- Create `lib/services/kafka/kafkaClient.ts`
- Create `lib/services/kafka/producer.ts`
- Create `lib/services/kafka/consumer.ts`
- Integrate with Event Bus
- Use for high-volume event streaming

### 4.2 Object Storage: MinIO

**Add to `docker-compose.yml`:**
```yaml
minio:
  image: minio/minio:latest
  container_name: bluedxp-minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
  ports:
    - "9000:9000"
    - "9001:9001"
  volumes:
    - minio-data:/data
  networks:
    - bluedxp-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
    interval: 30s
    timeout: 10s
    retries: 5

volumes:
  minio-data:
```

**Implementation:**
- Create `lib/services/storage/minioClient.ts`
- Create `lib/services/storage/objectStorageService.ts`
- Use for document storage, file uploads, backups
- Replace in-memory file storage

### 4.3 Vector Database: pgvector

**Add to PostgreSQL:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Update knowledge_base table (if exists)
ALTER TABLE knowledge_base 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector search
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops);
```

**Update Prisma Schema:**
```prisma
model KnowledgeBase {
  // ... existing fields
  embedding Unsupported("vector(1536)")?
}
```

**Implementation:**
- Update `lib/services/knowledge-base/index.ts`
- Replace in-memory vector store with pgvector
- Use for RAG, semantic search, AI embeddings

### 4.4 Search: Elasticsearch/OpenSearch

**Add to `docker-compose.yml`:**
```yaml
opensearch:
  image: opensearchproject/opensearch:2.11.0
  container_name: bluedxp-opensearch
  environment:
    - discovery.type=single-node
    - "OPENSEARCH_JAVA_OPTS=-Xms512m -Xmx512m"
    - plugins.security.disabled=true
  ports:
    - "9200:9200"
  volumes:
    - opensearch-data:/usr/share/opensearch/data
  networks:
    - bluedxp-network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9200/_cluster/health"]
    interval: 30s
    timeout: 10s
    retries: 5

opensearch-dashboards:
  image: opensearchproject/opensearch-dashboards:2.11.0
  container_name: bluedxp-opensearch-dashboards
  ports:
    - "5601:5601"
  environment:
    - 'OPENSEARCH_HOSTS=["http://opensearch:9200"]'
  depends_on:
    - opensearch
  networks:
    - bluedxp-network

volumes:
  opensearch-data:
```

**Implementation:**
- Create `lib/services/search/elasticsearchClient.ts`
- Create `lib/services/search/searchService.ts`
- Use for full-text search, analytics, log aggregation

### 4.5 Container Orchestration: Kubernetes

**Create Kubernetes Manifests:**
- `k8s/namespace.yaml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`
- `k8s/configmap.yaml`
- `k8s/secret.yaml`
- `k8s/ingress.yaml`
- `k8s/hpa.yaml` (Horizontal Pod Autoscaler)

**Support:**
- EKS (AWS)
- GKE (Google Cloud)
- AKS (Azure)
- On-premises Kubernetes

### 4.6 Observability Stack

**Add to `docker-compose.yml`:**

**Loki (Logs):**
```yaml
loki:
  image: grafana/loki:2.9.0
  container_name: bluedxp-loki
  ports:
    - "3100:3100"
  volumes:
    - loki-data:/loki
  networks:
    - bluedxp-network
  command: -config.file=/etc/loki/local-config.yaml
```

**Prometheus (Metrics):**
```yaml
prometheus:
  image: prom/prometheus:latest
  container_name: bluedxp-prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus-data:/prometheus
  networks:
    - bluedxp-network
  command:
    - '--config.file=/etc/prometheus/prometheus.yml'
    - '--storage.tsdb.path=/prometheus'
```

**Grafana (Visualization):**
```yaml
grafana:
  image: grafana/grafana:latest
  container_name: bluedxp-grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
    - GF_INSTALL_PLUGINS=grafana-piechart-panel
  volumes:
    - grafana-data:/var/lib/grafana
  networks:
    - bluedxp-network
```

**Jaeger (Tracing):**
```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  container_name: bluedxp-jaeger
  ports:
    - "16686:16686"
    - "14268:14268"
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
  networks:
    - bluedxp-network
```

**Update Existing Code:**
- `lib/services/observability/logger.ts` → Connect to Loki
- `lib/services/observability/metrics.ts` → Connect to Prometheus
- `lib/services/observability/tracing.ts` → Connect to Jaeger
- `lib/services/observability/errorTracking.ts` → Connect to Sentry

### 4.7 Redis Integration

**Update `lib/services/cache/redisCache.ts`:**
- Replace in-memory fallback with actual Redis client
- Use `ioredis` package (add to package.json)
- Implement connection pooling
- Add retry logic
- Add health checks

**Install:**
```bash
npm install ioredis
npm install --save-dev @types/ioredis
```

### 4.8 MCP Server Implementation

**Create `lib/mcp/server.ts`:**
- Implement MCP server with all tools from BlueDXP_FINAL_COMPLETE_V5.md
- Tools: knowledge_base, evidence, graph, agents, etc.
- Support multiple LLM providers
- Add authentication
- Add rate limiting

### 4.9 Module Licensing System

**Create `lib/services/licensing/moduleLicenseService.ts`:**
- License validation
- Feature gating
- Usage tracking
- Expiration handling
- Update `lib/modules/registry.ts` to check licenses

**Prisma Schema:**
```prisma
model ModuleLicense {
  id          String   @id @default(cuid())
  tenantId    String
  moduleId    String
  licenseKey  String   @unique
  status      String   // ACTIVE, EXPIRED, REVOKED
  expiresAt   DateTime?
  features    String[] // Array of enabled features
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([moduleId])
  @@index([status])
}
```

### 4.10 Pricing Engine

**Create `lib/services/pricing/pricingEngine.ts`:**
- Subscription pricing
- Usage-based pricing
- Module-based pricing
- Discounts and promotions
- Invoice generation

**Prisma Schema:**
```prisma
model PricingPlan {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal   @db.Decimal(10, 2)
  currency    String    @default("SAR")
  interval    String    // MONTHLY, YEARLY
  modules     String[]  // Array of module IDs
  features    Json      // Feature flags
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### 4.11 Security Infrastructure

**HashiCorp Vault:**
```yaml
vault:
  image: hashicorp/vault:latest
  container_name: bluedxp-vault
  ports:
    - "8200:8200"
  environment:
    - VAULT_DEV_ROOT_TOKEN_ID=${VAULT_ROOT_TOKEN:-root}
    - VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200
  volumes:
    - vault-data:/vault/data
  networks:
    - bluedxp-network
  cap_add:
    - IPC_LOCK
```

**Implementation:**
- Store API keys, secrets, certificates
- Rotate secrets automatically
- Audit secret access

**Security Scanning:**
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency scanning
- Container scanning

### 4.12 CI/CD Pipeline

**GitHub Actions:**
- Create `.github/workflows/ci.yml`
- Create `.github/workflows/cd.yml`
- Automated testing
- Automated deployment
- Security scanning

**Terraform:**
- Infrastructure as Code
- Create `terraform/` directory
- Support AWS, GCP, Azure, on-premises

**Helm Charts:**
- Create `helm/bluedxp/` directory
- Kubernetes deployment charts
- Configuration management

**ArgoCD:**
- GitOps deployment
- Continuous delivery
- Rollback capabilities

### 4.13 Event Schema Registry

**Create `lib/services/event-store/schemaRegistry.ts`:**
- Event versioning
- Schema validation
- Backward compatibility
- Schema evolution

### 4.14 Incident Management

**Create `lib/services/incidents/incidentService.ts`:**
- Incident tracking
- Alert management
- On-call rotation
- Post-mortem reports

### 4.15 Batch Processing

**Airflow:**
```yaml
airflow:
  image: apache/airflow:2.7.0
  container_name: bluedxp-airflow
  ports:
    - "8080:8080"
  environment:
    - AIRFLOW__CORE__EXECUTOR=LocalExecutor
    - AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres:5432/airflow
  volumes:
    - ./airflow/dags:/opt/airflow/dags
    - ./airflow/logs:/opt/airflow/logs
  depends_on:
    - postgres
  networks:
    - bluedxp-network
```

**Implementation:**
- Scheduled jobs
- ETL pipelines
- Data processing
- Report generation

### 4.16 Saga Patterns

**Create `lib/services/saga/sagaOrchestrator.ts`:**
- Distributed transactions
- Compensation logic
- Rollback handling
- Event-driven sagas

### 4.17 MLOps Pipeline

**MLflow:**
```yaml
mlflow:
  image: ghcr.io/mlflow/mlflow:v2.8.0
  container_name: bluedxp-mlflow
  ports:
    - "5000:5000"
  environment:
    - MLFLOW_BACKEND_STORE_URI=postgresql://mlflow:mlflow@postgres:5432/mlflow
    - MLFLOW_DEFAULT_ARTIFACT_ROOT=s3://mlflow-artifacts
  depends_on:
    - postgres
  networks:
    - bluedxp-network
```

**Implementation:**
- Model versioning
- Experiment tracking
- Model deployment
- Model monitoring

### 4.18 White-Label Architecture

**Create `lib/services/white-label/whiteLabelService.ts`:**
- Custom branding
- Custom domains
- Custom themes
- Tenant-specific configurations

### 4.19 Database Persistence

**Complete Prisma Integration:**
- Run migrations: `npx prisma migrate dev`
- Connection pooling with PgBouncer
- Read replicas for scaling
- Backup and restore
- Database monitoring

**PgBouncer:**
```yaml
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  container_name: bluedxp-pgbouncer
  ports:
    - "6432:6432"
  environment:
    - DATABASES_HOST=postgres
    - DATABASES_PORT=5432
    - DATABASES_USER=bluedxp
    - DATABASES_PASSWORD=${POSTGRES_PASSWORD}
    - DATABASES_DBNAME=bluedxp
    - POOL_MODE=transaction
    - MAX_CLIENT_CONN=1000
    - DEFAULT_POOL_SIZE=25
  depends_on:
    - postgres
  networks:
    - bluedxp-network
```

---

## 📅 Part 5: Implementation Order

**Phase 1: Foundation (Week 1)**
1. Add Kafka to docker-compose.yml
2. Add MinIO to docker-compose.yml
3. Add pgvector to PostgreSQL
4. Add Elasticsearch/OpenSearch to docker-compose.yml
5. Complete Redis integration
6. Test all containers start correctly

**Phase 2: Observability (Week 2)**
1. Add Loki, Prometheus, Grafana, Jaeger to docker-compose.yml
2. Update observability services to use real services
3. Set up dashboards in Grafana
4. Configure alerting

**Phase 3: Security & Compliance (Week 3)**
1. Add HashiCorp Vault
2. Implement Saudi government API integrations
3. Add security scanning pipeline
4. Implement audit logging

**Phase 4: Advanced Features (Week 4)**
1. Implement MCP server
2. Implement module licensing
3. Implement pricing engine
4. Implement Event Schema Registry

**Phase 5: DevOps (Week 5)**
1. Set up CI/CD pipeline
2. Create Terraform configurations
3. Create Helm charts
4. Set up ArgoCD

**Phase 6: Testing & Documentation (Week 6)**
1. Test all components
2. Update documentation
3. Create deployment guides
4. Create runbooks

---

## ✅ Part 6: Testing Requirements

**For Each Component:**
1. ✅ Unit tests
2. ✅ Integration tests
3. ✅ End-to-end tests
4. ✅ Performance tests
5. ✅ Security tests

**Test Checklist:**
- [ ] All Docker containers start
- [ ] All APIs respond correctly
- [ ] Database connections work
- [ ] Redis caching works
- [ ] Event Bus works
- [ ] No breaking changes to existing APIs
- [ ] All Saudi government APIs integrated
- [ ] Security scanning passes
- [ ] Performance meets requirements

---

## 📚 Part 7: Documentation Requirements

**Create/Update:**
1. `docs/INFRASTRUCTURE.md` - Infrastructure overview
2. `docs/DEPLOYMENT.md` - Deployment guide
3. `docs/API.md` - API documentation
4. `docs/SAUDI_COMPLIANCE.md` - Saudi compliance guide
5. `docs/SECURITY.md` - Security documentation
6. `docs/MONITORING.md` - Monitoring guide

---

## ✅ Part 8: Final Checklist

Before marking as complete:
- [ ] All infrastructure components added
- [ ] All Saudi government APIs integrated
- [ ] All observability services connected
- [ ] All security measures implemented
- [ ] CI/CD pipeline working
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Performance acceptable
- [ ] Security scanning passed

---

## 📖 Reference Documents

1. `C:\Users\balba\Downloads\BlueDXP_FINAL_COMPLETE_V5.md`
2. `file:///C:/Users/balba/Downloads/Bluedxp_Architecture_v7.html`
3. `BLUEDXP_ARCHITECTURE_V7_BENCHMARK_REPORT.md`
4. `BLUEDXP_TECH_STACK.md`
5. `SECURITY.md`
6. `ARCHITECTURE_MINDMAP.md`

---

## 🎯 Success Criteria

**The infrastructure is complete when:**
1. ✅ All missing components are implemented
2. ✅ All Saudi government requirements are met
3. ✅ All industry standards are followed
4. ✅ Platform can be deployed to Saudi data centers
5. ✅ Platform meets national security-grade requirements
6. ✅ No existing functionality is broken
7. ✅ All tests pass
8. ✅ Documentation is complete

---

**END OF PROMPT**

**Remember:** This is the world's most advanced platform. Every component must be production-ready, secure, scalable, and compliant with Saudi Arabia regulations.

**Backup Location:**
```
C:\Users\balba\Backups\hazalyze-asn-module-BACKUP-20250127.zip
```

**Full Path to This Document:**
```
C:\Users\balba\hazalyze-asn-module\docs\AGENT_PROMPTS\TECH_STACK_AGENT_PROMPT.md
```

