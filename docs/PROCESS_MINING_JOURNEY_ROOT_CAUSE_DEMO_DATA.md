# Process Mining, Journey Analysis & Root Cause Demo Data

## Overview
Added comprehensive demo data for process mining, journey analysis, and root cause analysis features to make dashboards look impressive with realistic test data.

## What Was Added

### 1. **Process Mining Demo Data** ✅

**Location:** `lib/services/demo/demoDataService.ts`

**Functions:**
- `generateDemoProcessVariants()` - Generates 5 realistic process variants with:
  - Different event sequences (ORDER_CREATED → ORDER_CONFIRMED → PAYMENT → SHIPPED → DELIVERED)
  - Frequency counts (50-250 cases)
  - Average durations (2-12 days)
  - Efficiency scores (70-95%)
  - Deviation rates
  - Optimal variant identification

- `generateDemoProcessMetrics()` - Generates 30 days of metrics:
  - Daily case counts (20-70 cases/day)
  - Average durations
  - Efficiency trends
  - Deviation counts
  - Cost tracking
  - Bottleneck identification
  - Top variants

- `generateDemoProcessCases()` - Generates 100+ process cases with:
  - Complete event sequences
  - Performance metrics (duration, waiting time, processing time, cycle time, throughput, efficiency)
  - Deviations (DELAY, SKIP, REPEAT, EXCEPTION)
  - Attributes (customer, value, priority)
  - Realistic timestamps

**Integration:**
- `lib/services/process-lifecycle/process-mining/processMiningService.ts` - Returns demo data when no real data exists
- `app/process-lifecycle/process-mining/page.tsx` - Uses demo data
- `app/intelligent-orchestration/process-mining/page.tsx` - Uses demo data

### 2. **Journey Analysis Demo Data** ✅

**Location:** `lib/services/demo/demoDataService.ts`

**Function:** `generateDemoJourneyAnalysis()`

**Generates:**
- **Origin & Destination:** Realistic cities (Riyadh, Jeddah, Dammam, Dubai, Rotterdam, Hamburg, Shanghai)
- **Touchpoints:** 4 touchpoints per journey:
  - Origin Warehouse (pickup)
  - Port (loading/unloading)
  - Customs (clearance)
  - Destination Warehouse (delivery)
- **Timing:** Realistic delays and durations
- **Status:** COMPLETED or IN_TRANSIT
- **Root Cause Analysis:** Bottlenecks with causes (CUSTOMS_DELAY, WEATHER, TRAFFIC, DOCUMENTATION)
- **Optimization:** Alternative routes with time/cost savings
- **Predictions:** On-time probability and risk factors
- **Costs:** Freight, customs, handling breakdown

**Integration:**
- `app/api/transportation/journey-analysis/route.ts` - Returns demo data when no real data exists
- `app/transportation/journey-analysis/page.tsx` - Auto-loads demo data with default shipment ID

### 3. **Root Cause Analysis Demo Data** ✅

**Location:** `lib/services/demo/demoDataService.ts`

**Function:** `generateDemoRootCauses()`

**Generates:**
- **Issue Types:** SLA_BREACH, QUALITY_ISSUE, DELAY, COST_OVERRUN, COMPLIANCE_VIOLATION, SYSTEM_ERROR, HUMAN_ERROR
- **Severities:** LOW, MEDIUM, HIGH, CRITICAL
- **Analysis Methods:** 5_WHYS, FISHBONE, FMEA, ML_ANALYSIS
- **Root Causes:** Realistic causes like:
  - Insufficient process documentation
  - Lack of training for staff
  - System integration failure
  - Inadequate quality control
  - Resource constraints
  - Communication breakdown
  - Process deviation
  - Equipment malfunction
- **Contributing Factors:** Multiple contributing factors per issue
- **Recommendations:** Actionable recommendations
- **Actions:** Tracked actions with effectiveness scores
- **Metrics:** Confidence (70-95%), effectiveness (60-95%), recurrence counts

**Integration:**
- `data/intelligentOrchestrationEngine.ts` - Returns demo data when enabled
- `app/intelligent-orchestration/root-cause/page.tsx` - Uses demo data generator

## Demo Mode

Demo mode is **automatically enabled** in development mode (`NODE_ENV === 'development'`).

To enable/disable:
- Environment variable: `ENABLE_DEMO_DATA=true`
- localStorage: `localStorage.setItem('demo-mode', 'true')`
- UI Toggle: Demo mode toggle in header (if added)

## Data Quality

All demo data is:
- **Realistic:** Based on real-world scenarios
- **Consistent:** Relationships between data points are maintained
- **Comprehensive:** Includes all required fields and relationships
- **Impressive:** Makes dashboards look professional and feature-rich

## Usage Examples

### Process Mining
```typescript
// Automatically returns demo data if no real data exists
const variants = await processMiningService.analyzeVariants('SALES_ORDER')
const metrics = await processMiningService.getPerformanceMetrics('SALES_ORDER')
const cases = await processMiningService.getAllCases('SALES_ORDER')
```

### Journey Analysis
```typescript
// Returns demo journey analysis
const response = await fetch('/api/transportation/journey-analysis', {
  method: 'POST',
  body: JSON.stringify({
    action: 'analyze',
    shipmentId: 'SHIP-000001',
  }),
})
```

### Root Cause Analysis
```typescript
// Returns demo root cause
const rootCause = await orchestrationEngine.analyzeRootCause(
  'ISSUE-000001',
  'SLA_BREACH',
  { description: 'Service level breach detected' }
)
```

## Impact

✅ **Process Mining Dashboard** - Now shows 100+ cases, 5 variants, comprehensive metrics
✅ **Journey Analysis** - Shows complete journey with touchpoints, delays, root causes, optimization
✅ **Root Cause Analysis** - Shows 20+ analyses with detailed root causes, recommendations, actions

All dashboards now look **professional and impressive** for team presentations! 🎉






