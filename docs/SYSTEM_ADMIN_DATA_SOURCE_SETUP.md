# System Admin Dashboard - Data Source Setup Guide

## Overview

The System Admin Dashboard now includes comprehensive data source tracking and visual indicators showing whether data is:
- **Real**: From connected services and database
- **Demo**: Placeholder data for demonstration
- **Fallback**: Default values when services aren't available
- **Partial**: Mix of real and demo data

## Current Status

### Data Source Indicators

The dashboard displays visual indicators throughout showing:
- **Green Badge (Live Data)**: Real data from connected services
- **Yellow Badge (Demo Data)**: Placeholder data for demonstration
- **Orange Badge (Fallback)**: Default values when services aren't available
- **Blue Badge (Mixed)**: Combination of real and demo data

### Data Quality Score

The dashboard shows an overall data quality score (0-100%) based on:
- Data source reliability (50%)
- Data freshness (30%)
- Service connectivity (20%)

## Setting Up Real Data

### 1. Database Connection

To use real data from the database:

```bash
# Set up your database connection in .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/hazalyze
```

Or use individual connection parameters:

```bash
DATABASE_TYPE=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=hazalyze
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
```

### 2. Environment Configuration

For **Production Mode** (real data only):

```bash
# .env.local
NODE_ENV=production
ENABLE_DEMO_DATA=false
```

For **Development Mode** (with demo data fallback):

```bash
# .env.local
NODE_ENV=development
ENABLE_DEMO_DATA=true  # Optional - demo data will be used if services aren't connected
```

### 3. Service Connections

The dashboard tracks connections to:

#### Database (Prisma)
- Automatically checked on each request
- Shows connection status, query performance, and health

#### Redis Cache
- Connection status and statistics
- Hit rate, memory usage, key count

#### Event Bus
- Total events, subscribers, throughput
- 24-hour event statistics

#### Other Services
- IoT Manager
- Webhook Service
- Truth Engine Service
- AI/ML Services

## Data Source Tracking

### How It Works

1. **Service Health Checks**: Each service is checked for connectivity
2. **Data Source Determination**: Based on:
   - Environment mode (development/production)
   - Service connection status
   - Actual data availability
3. **Metadata Tracking**: Each metric includes:
   - Source type (real/demo/fallback/partial)
   - Freshness (live/recent/stale/unknown)
   - Reliability score (0-100%)
   - Notes about the data

### Viewing Data Sources

1. **Data Quality Panel**: Top of dashboard shows overall quality
2. **Hover Indicators**: Hover over any data source badge for details
3. **API Response**: Includes `_dataSources` object with all metadata

## API Response Structure

The comprehensive metrics API now includes:

```json
{
  "success": true,
  "data": {
    "overview": {
      "dataQuality": {
        "score": 75,
        "summary": {
          "real": 10,
          "demo": 5,
          "fallback": 2,
          "partial": 1,
          "total": 18
        },
        "isDemoMode": true,
        "databaseConnected": true,
        "environment": "development"
      }
    },
    "infrastructure": {
      "database": {
        "_dataSource": "real",
        "health": {
          "connected": true,
          "connectionTime": 45,
          "queryPerformance": { ... }
        }
      }
    },
    "_dataSources": {
      "infrastructure.database": {
        "source": "real",
        "freshness": "live",
        "reliability": 95,
        "notes": "Database connected and responding"
      }
    }
  }
}
```

## Troubleshooting

### Database Not Connected

**Symptoms:**
- Data quality score is low
- Database shows "disconnected" status
- User counts show demo data

**Solutions:**
1. Check database connection string in `.env.local`
2. Ensure database is running
3. Verify Prisma schema is migrated: `npx prisma migrate dev`
4. Check database health: Look at `infrastructure.database.health` in API response

### Services Not Available

**Symptoms:**
- Multiple "fallback" indicators
- Low data quality score
- Missing metrics

**Solutions:**
1. Check service configuration
2. Verify service dependencies are installed
3. Check service logs for connection errors
4. Review `_dataSources` in API response for specific service issues

### Demo Data Showing in Production

**Symptoms:**
- Yellow "Demo Data" badges everywhere
- Data quality shows demo mode

**Solutions:**
1. Set `NODE_ENV=production` in `.env.local`
2. Set `ENABLE_DEMO_DATA=false`
3. Restart the application
4. Verify environment variables are loaded

## Best Practices

1. **Development**: Use demo data for testing UI and features
2. **Staging**: Connect to staging database, disable demo data
3. **Production**: Always use real data, monitor data quality score
4. **Monitoring**: Watch data quality score - should be >80% in production

## Components

### DataSourceIndicator
Visual badge showing data source type with hover tooltip

### DataQualityPanel
Comprehensive panel showing:
- Overall data quality score
- Breakdown by source type
- Service connection status
- Environment information

## Next Steps

1. Connect your database
2. Set environment variables
3. Check data quality panel on dashboard
4. Monitor data source indicators throughout
5. Review API response for detailed metadata

## Support

For issues or questions:
1. Check dashboard data quality panel
2. Review API response `_dataSources` object
3. Check service health in infrastructure section
4. Review logs for connection errors



