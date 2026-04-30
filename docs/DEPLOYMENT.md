# BlueDXP Platform - Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 20.x
- PostgreSQL 15 (or use Docker)
- Redis 7 (or use Docker)
- Kubernetes cluster (for production)

## Local Development

### 1. Clone Repository
```bash
git clone <repository-url>
cd hazalyze-asn-module
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Start Services
```bash
docker-compose up -d
```

### 5. Run Database Migrations
```bash
npx prisma migrate dev
```

### 6. Start Application
```bash
npm run dev
```

## Production Deployment

### Docker Compose

1. Update environment variables in `.env.local`
2. Build and start:
```bash
docker-compose build
docker-compose up -d
```

### Kubernetes (Helm)

1. Install Helm chart:
```bash
helm install bluedxp ./helm/bluedxp \
  --set image.tag=v1.0.0 \
  --set env[0].value=production
```

2. Update values in `helm/bluedxp/values.yaml`

3. Upgrade:
```bash
helm upgrade bluedxp ./helm/bluedxp
```

### Terraform (AWS)

1. Initialize Terraform:
```bash
cd terraform
terraform init
```

2. Plan deployment:
```bash
terraform plan
```

3. Apply:
```bash
terraform apply
```

## Saudi Arabia Deployment

### Data Residency Requirements

- All data must be stored in Saudi Arabia data centers
- Use AWS me-south-1 (Bahrain) or on-premises
- Configure all services for Saudi Arabia region

### Government API Integration

Configure all 17 Saudi government API integrations:
- TGA, MOT, Absher, NAFATH, SABER, SFDA, ZATCA, SAMA, NCSC, SDAIA, SASO, MODON, MOC, MOI, MOMRA, MISA, CITC

Set environment variables:
```bash
TGA_API_KEY=...
MOT_API_KEY=...
# ... etc
```

### Security Configuration

1. Enable Vault:
```bash
export VAULT_ENABLED=true
export VAULT_ADDR=http://vault:8200
```

2. Configure encryption:
- AES-256 at rest
- TLS 1.3 in transit

3. Enable audit logging:
- All operations logged
- Immutable audit trail

## Monitoring

### Access Dashboards

- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

### Health Checks

```bash
curl http://localhost:3002/api/health
```

## Troubleshooting

### Services Not Starting

1. Check logs:
```bash
docker-compose logs -f <service-name>
```

2. Verify environment variables
3. Check port conflicts
4. Verify database connectivity

### Database Issues

1. Check PostgreSQL:
```bash
docker-compose exec postgres psql -U bluedxp -d bluedxp
```

2. Run migrations:
```bash
npx prisma migrate deploy
```

### Redis Issues

1. Check Redis:
```bash
docker-compose exec redis redis-cli ping
```

## Backup & Recovery

### Database Backup

```bash
docker-compose exec postgres pg_dump -U bluedxp bluedxp > backup.sql
```

### Restore

```bash
docker-compose exec -T postgres psql -U bluedxp bluedxp < backup.sql
```

## Scaling

### Horizontal Scaling

Update `docker-compose.yml` or Kubernetes deployment:
```yaml
deploy:
  replicas: 3
```

### Vertical Scaling

Update resource limits in `docker-compose.yml` or Helm values.

