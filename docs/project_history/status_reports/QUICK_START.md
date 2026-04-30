# BlueDXP Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- PostgreSQL 15 (or use Docker)
- npm or yarn

### Step 1: Clone and Install

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# At minimum, set:
# - DATABASE_URL
# - REDIS_URL (or use Docker)
```

### Step 3: Start Infrastructure

```bash
# Start all Docker services
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose ps
```

### Step 4: Database Setup

```bash
# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### Step 5: Initialize Services

```bash
# Initialize all infrastructure services
npm run init:services
```

### Step 6: Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Step 7: Verify Installation

1. **Health Check**: http://localhost:3002/api/health
2. **Metrics**: http://localhost:3002/api/metrics
3. **Application**: http://localhost:3002

## 📊 Service URLs

Once started, access these services:

- **Application**: http://localhost:3002
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **OpenSearch Dashboards**: http://localhost:5601
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **RabbitMQ Management**: http://localhost:15672 (bluedxp/change_me_in_production)
- **Airflow**: http://localhost:8080
- **MLflow**: http://localhost:5000
- **Vault**: http://localhost:8200

## 🔧 Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Initialize services manually
npm run init:services

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart all services
docker-compose restart
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U bluedxp -d bluedxp -c "SELECT 1"
```

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Port Conflicts

If ports are already in use, update `docker-compose.yml` to use different ports.

## 📚 Next Steps

1. **Read Documentation**:
   - [Infrastructure Guide](./docs/INFRASTRUCTURE.md)
   - [Deployment Guide](./docs/DEPLOYMENT.md)
   - [API Documentation](./docs/API.md)

2. **Configure Saudi Government APIs**:
   - See [Saudi Compliance Guide](./docs/SAUDI_COMPLIANCE.md)
   - Add API keys to `.env.local`

3. **Set Up Monitoring**:
   - Access Grafana at http://localhost:3001
   - Configure dashboards
   - Set up alerts

4. **Production Deployment**:
   - See [Deployment Guide](./docs/DEPLOYMENT.md)
   - Use Terraform for infrastructure
   - Deploy with Helm charts

## ✅ Verification Checklist

- [ ] All Docker services are running
- [ ] Database migrations completed
- [ ] Health check returns 200
- [ ] Services initialized successfully
- [ ] Application starts without errors
- [ ] Can access Grafana dashboard
- [ ] Can access Prometheus metrics

## 🆘 Need Help?

- Check [Documentation](./docs/)
- Review [Implementation Status](./IMPLEMENTATION_STATUS.md)
- Check service logs: `docker-compose logs -f`

---

**Ready to go!** 🎉
