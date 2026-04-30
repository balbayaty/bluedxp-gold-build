# BlueDXP Platform - Environment Variables

Complete reference for all environment variables used in BlueDXP Platform.

## Quick Start

1. Copy `env.example` to `.env.local`
2. Fill in your values (paste keys into `.env.local`)
3. Restart the application

Windows PowerShell example:

```powershell
Copy-Item env.example .env.local
```

If you prefer a smaller local-only template:

```powershell
Copy-Item env.local.template .env.local
```

## Categories

### Application
- `NODE_ENV` - Environment (development, production)
- `PORT` - Application port (default: 3002)
- `NEXT_PUBLIC_API_URL` - Public API URL

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Redis
- `REDIS_URL` - Redis connection string
- `REDIS_ENABLED` - Enable Redis (true/false)

### Kafka
- `KAFKA_ENABLED` - Enable Kafka (true/false)
- `KAFKA_BROKERS` - Comma-separated broker addresses
- `KAFKA_CLIENT_ID` - Kafka client ID

### MinIO
- `MINIO_ENABLED` - Enable MinIO (true/false)
- `MINIO_ENDPOINT` - MinIO endpoint
- `MINIO_PORT` - MinIO port
- `MINIO_ROOT_USER` - MinIO root user
- `MINIO_ROOT_PASSWORD` - MinIO root password
- `MINIO_USE_SSL` - Use SSL (true/false)
- `MINIO_REGION` - MinIO region

### OpenSearch
- `OPENSEARCH_ENABLED` - Enable OpenSearch (true/false)
- `OPENSEARCH_NODE` - OpenSearch node URL
- `OPENSEARCH_USERNAME` - OpenSearch username
- `OPENSEARCH_PASSWORD` - OpenSearch password
- `OPENSEARCH_SSL` - Use SSL (true/false)

### Observability
- `LOKI_ENABLED` - Enable Loki (true/false)
- `LOKI_URL` - Loki URL
- `PROMETHEUS_ENABLED` - Enable Prometheus (true/false)
- `PROMETHEUS_URL` - Prometheus URL

### Vault
- `VAULT_ENABLED` - Enable Vault (true/false)
- `VAULT_ADDR` - Vault address
- `VAULT_ROOT_TOKEN` - Vault root token

### Saudi Government APIs
All 17 government agencies require API keys:
- `TGA_API_KEY`, `MOT_API_KEY`, `ABSHER_API_KEY`, etc.
- See `env.full.example` for the complete list of integration keys referenced by code

### AI Services
- **Recommended (server-side):**
  - `OPENAI_API_KEY` - OpenAI API key
  - `ANTHROPIC_API_KEY` - Anthropic API key
- **Dev-only (not recommended; exposes keys to the browser bundle):**
  - `NEXT_PUBLIC_OPENAI_API_KEY`
  - `NEXT_PUBLIC_ANTHROPIC_API_KEY`

### Security
- `JWT_SECRET` - JWT signing secret

### Feature Flags
- `ENABLE_KAFKA` - Enable Kafka features
- `ENABLE_MINIO` - Enable MinIO features
- `ENABLE_OPENSEARCH` - Enable OpenSearch features
- `ENABLE_VAULT` - Enable Vault features
- `MCP_ENABLED` - Enable MCP Server

## Production Checklist

- [ ] All secrets are set
- [ ] Database URL is configured
- [ ] Redis is configured
- [ ] All Saudi government API keys are set
- [ ] JWT_SECRET is a strong random string
- [ ] All feature flags are set appropriately
- [ ] SSL/TLS is configured for production

