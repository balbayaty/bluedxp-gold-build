# BlueDXP Platform - Troubleshooting Guide

## Common Issues and Solutions

### Services Not Starting

#### Docker Services

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up -d --build [service-name]
```

#### Application Service

```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app

# Check if port is in use
netstat -ano | findstr :3002  # Windows
lsof -i :3002  # Linux/Mac
```

### Database Connection Issues

#### PostgreSQL Not Accessible

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U bluedxp -d bluedxp -c "SELECT 1"

# Check connection string
echo $DATABASE_URL

# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d postgres
npm run prisma:migrate
```

#### Migration Issues

```bash
# Reset database
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

### Redis Connection Issues

#### Redis Not Responding

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHDB
```

### Kafka Issues

#### Kafka Not Starting

```bash
# Check Zookeeper is running first
docker-compose ps zookeeper

# Check Kafka logs
docker-compose logs kafka

# Restart Kafka
docker-compose restart kafka zookeeper

# Check Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### MinIO Issues

#### MinIO Not Accessible

```bash
# Check MinIO status
docker-compose ps minio

# Test MinIO connection
curl http://localhost:9000/minio/health/live

# Check MinIO logs
docker-compose logs minio

# Access MinIO console
# http://localhost:9001
```

### OpenSearch Issues

#### OpenSearch Not Starting

```bash
# Check OpenSearch logs
docker-compose logs opensearch

# Check cluster health
curl http://localhost:9200/_cluster/health

# Increase memory if needed
# Edit docker-compose.yml: OPENSEARCH_JAVA_OPTS=-Xms1g -Xmx1g
```

### Service Initialization Failures

#### Services Not Initializing

```bash
# Check service initializer logs
npm run init:services

# Check environment variables
cat .env.local

# Verify service dependencies
docker-compose ps
```

### API Errors

#### 401 Unauthorized

- Check JWT token is valid
- Verify token in Authorization header
- Check token expiration

#### 403 Forbidden

- Check user permissions
- Verify module license
- Check RBAC configuration

#### 429 Rate Limit

- Wait for rate limit window to reset
- Check rate limit headers
- Adjust rate limit configuration

#### 500 Internal Server Error

- Check application logs
- Verify service dependencies
- Check database connectivity
- Review error details in response

### Performance Issues

#### Slow API Responses

```bash
# Check service status
curl http://localhost:3002/api/v1/services/status

# Check Redis cache hit rate
curl http://localhost:3002/api/health | jq '.services.redis.stats'

# Check database query performance
# Enable query logging in Prisma
```

#### High Memory Usage

```bash
# Check container resource usage
docker stats

# Check service logs for memory leaks
docker-compose logs [service-name] | grep -i memory
```

### Port Conflicts

#### Port Already in Use

```bash
# Find process using port (Windows)
netstat -ano | findstr :3002

# Find process using port (Linux/Mac)
lsof -i :3002

# Kill process or change port in docker-compose.yml
```

### Configuration Issues

#### Environment Variables Not Loading

```bash
# Verify .env.local exists
ls -la .env.local

# Check environment variables are set
echo $DATABASE_URL
echo $REDIS_URL

# Restart application after changing .env.local
docker-compose restart app
```

### Observability Issues

#### Grafana Not Loading

```bash
# Check Grafana logs
docker-compose logs grafana

# Verify datasources
# Access: http://localhost:3001
# Check: Configuration > Data Sources

# Restart Grafana
docker-compose restart grafana
```

#### Prometheus Not Scraping

```bash
# Check Prometheus targets
# Access: http://localhost:9090/targets

# Verify prometheus.yml configuration
cat prometheus.yml

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

### Saudi Government API Issues

#### API Not Responding

```bash
# Check API key is set
echo $TGA_API_KEY

# Verify API endpoint
curl -X POST http://localhost:3002/api/saudi-government \
  -H "Content-Type: application/json" \
  -d '{"agency": "tga", "action": "verify"}'

# Check API service logs
docker-compose logs app | grep saudi-government
```

## Diagnostic Commands

### Complete System Check

```bash
# Check all services
docker-compose ps

# Check all service logs
docker-compose logs --tail=50

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Network Diagnostics

```bash
# Test internal networking
docker-compose exec app ping postgres
docker-compose exec app ping redis
docker-compose exec app ping kafka

# Check DNS resolution
docker-compose exec app nslookup postgres
```

### Database Diagnostics

```bash
# Check database size
docker-compose exec postgres psql -U bluedxp -d bluedxp -c "SELECT pg_size_pretty(pg_database_size('bluedxp'));"

# Check active connections
docker-compose exec postgres psql -U bluedxp -d bluedxp -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
docker-compose exec postgres psql -U bluedxp -d bluedxp -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Recovery Procedures

### Complete Reset

```bash
# WARNING: This deletes all data
docker-compose down -v
docker-compose up -d
npm run prisma:migrate
npm run init:services
```

### Service-Specific Reset

```bash
# Reset specific service
docker-compose stop [service-name]
docker-compose rm -f [service-name]
docker-compose up -d [service-name]
```

### Database Reset

```bash
# Reset database only
docker-compose stop postgres
docker-compose rm -f postgres
docker volume rm hazalyze-asn-module_postgres-data
docker-compose up -d postgres
npm run prisma:migrate
```

## Getting Help

1. **Check Logs**: Always check service logs first
2. **Health Checks**: Use `/api/health` and `/api/v1/services/status`
3. **Documentation**: Review relevant documentation files
4. **Examples**: Check `examples/` directory for usage patterns
5. **Support**: Contact support@bluedxp.com

## Prevention

1. **Regular Backups**: Backup database regularly
2. **Monitor Health**: Set up health check monitoring
3. **Resource Limits**: Set appropriate resource limits
4. **Update Dependencies**: Keep dependencies updated
5. **Review Logs**: Regularly review service logs

