# 🚀 Intelligence & Analytics - Quick Start Guide

**Get started with the unified Intelligence & Analytics module in 5 minutes**

---

## 🎯 WHAT YOU GET

- ✅ **Unified Dashboard** at `/intelligence`
- ✅ **Auto-Triggered RCA** for incidents, NCRs, delays, deviations
- ✅ **Data Mining** across all modules
- ✅ **Process Mining** for end-to-end processes
- ✅ **Unified Analytics** from all modules

---

## 🚀 QUICK START

### **1. Access the Dashboard**

Navigate to: **`/intelligence`**

You'll see:
- Quick actions to all tools
- Statistics from all modules
- Recent intelligence activity
- Integration status

### **2. Root Cause Analysis**

**Automatic:**
- RCA is automatically triggered for:
  - QHSE incidents
  - ISO-IMS NCRs
  - Trade compliance delays
  - Process deviations
  - Anomalies

**Manual:**
- Navigate to `/intelligence/root-cause`
- Or use API: `POST /api/intelligence/root-cause/analyze`

### **3. Data Mining**

**Run Mining:**
1. Navigate to `/intelligence/data-mining`
2. Select algorithms (pattern, anomaly, clustering, etc.)
3. Click "Run Mining"
4. View results

**API:**
```typescript
POST /api/intelligence/data-mining/mine
{
  "tenantId": "tenant-1",
  "algorithms": ["pattern", "anomaly"],
  "timeRange": { "start": "...", "end": "..." }
}
```

### **4. Process Mining**

**Discover Process:**
1. Navigate to `/intelligence/process-mining`
2. Select process type
3. Click "Discover"
4. View variants and deviations

**API:**
```typescript
POST /api/intelligence/process-mining/discover
{
  "tenantId": "tenant-1",
  "processType": "ORDER",
  "timeRange": { "start": "...", "end": "..." }
}
```

### **5. Analytics**

**View Analytics:**
1. Navigate to `/intelligence/analytics`
2. View unified analytics from all modules
3. See cross-module insights

**API:**
```typescript
POST /api/intelligence/analytics/aggregate
{
  "tenantId": "tenant-1",
  "timeRange": { "start": "...", "end": "..." }
}
```

---

## 🔗 HOW IT INTEGRATES

### **Automatic Integration:**

The module **automatically**:
1. ✅ Subscribes to ALL module events
2. ✅ Captures every event
3. ✅ Stores in Event Store
4. ✅ Records evidence
5. ✅ Auto-triggers RCA for critical events
6. ✅ Provides unified analytics

**No configuration needed!** It just works.

### **Event Flow:**

```
Module Event → Event Bus → Event Capture Service
                              ↓
                    Event Store (CQRS)
                              ↓
                    Evidence Ledger
                              ↓
                    Auto-Trigger Analysis (if critical)
                              ↓
                    Intelligence Dashboard
```

---

## 📊 EXAMPLE USE CASES

### **1. Incident Root Cause Analysis**

When a QHSE incident is created:
1. Event `qhse.incident.created` is published
2. Intelligence module captures event
3. Auto-triggers RCA
4. Collects evidence from all modules
5. Analyzes root cause
6. Generates recommendations
7. Appears in `/intelligence/root-cause`

### **2. Cross-Module Pattern Detection**

Run data mining:
1. Go to `/intelligence/data-mining`
2. Select "pattern" algorithm
3. Run mining
4. Discover patterns across modules
5. Get recommendations

### **3. End-to-End Process Discovery**

Discover order process:
1. Go to `/intelligence/process-mining`
2. Select "ORDER" process type
3. Discover process
4. See variants across WMS, TMS, Finance
5. Detect deviations
6. Auto-trigger RCA if needed

### **4. Unified Analytics**

View all analytics:
1. Go to `/intelligence/analytics`
2. See aggregated metrics
3. Compare modules
4. View insights
5. Get recommendations

---

## 🎯 KEY FEATURES

### **✅ Zero Configuration**
- Automatically integrates with all modules
- No setup required
- Just works!

### **✅ Auto-Triggers**
- RCA automatically on incidents/deviations
- No manual intervention needed
- Proactive problem solving

### **✅ Cross-Module**
- Works across all modules
- Unified view
- Cross-module correlations

### **✅ Real-Time**
- Captures events in real-time
- Updates dashboard automatically
- Live insights

### **✅ Unified Access**
- Single dashboard
- All tools in one place
- Consistent UX

---

## 📝 API EXAMPLES

### **Analyze Root Cause:**
```typescript
const response = await fetch('/api/intelligence/root-cause/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-1',
    issueType: 'INCIDENT',
    source: {
      module: 'qhse',
      entityType: 'incident',
      entityId: 'incident-123',
    },
    context: {
      description: 'Safety incident occurred',
      severity: 'high',
    },
    method: 'HYBRID',
  }),
})
```

### **Run Data Mining:**
```typescript
const response = await fetch('/api/intelligence/data-mining/mine', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-1',
    algorithms: ['pattern', 'anomaly', 'clustering'],
    timeRange: {
      start: new Date('2024-01-01').toISOString(),
      end: new Date().toISOString(),
    },
  }),
})
```

---

## 🎨 UI FEATURES

### **Unified Dashboard:**
- Quick actions
- Statistics
- Recent activity
- Integration status

### **Root Cause Analysis:**
- All RCAs from all modules
- Cross-module RCAs highlighted
- Filtering and search
- Drill-down details
- Evidence explorer

### **Data Mining:**
- Algorithm selection
- Results visualization
- Pattern/anomaly detection
- Recommendations

### **Process Mining:**
- Process discovery
- Variant visualization
- Deviation detection
- Performance metrics

### **Analytics:**
- Module comparisons
- Unified metrics
- Insights
- Trends

---

## 🔍 TROUBLESHOOTING

### **No Events Captured:**
- Check Event Bus is running
- Verify module events are being published
- Check tenant ID matches

### **No Auto-Triggers:**
- Verify module initialization
- Check event subscriptions
- Review logs

### **No Results:**
- Check time range
- Verify module data
- Review filters

---

## 📚 NEXT STEPS

1. **Explore Dashboard:** Navigate to `/intelligence`
2. **Test Auto-Triggers:** Create an incident/NCR and watch RCA auto-trigger
3. **Run Data Mining:** Discover patterns and anomalies
4. **Discover Processes:** Find process variants
5. **View Analytics:** See unified insights

---

## 🎉 YOU'RE READY!

The module is **fully functional and ready to use**. Just navigate to `/intelligence` and start exploring!

**Happy analyzing!** 🚀













