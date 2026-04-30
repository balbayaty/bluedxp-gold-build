# Geofence UI Update Guide

## Quick Update Instructions

To add the Analytics dashboard to the existing geofence page:

### 1. Add Analytics Tab

In `app/transportation/geofences/page.tsx`, update the `activeTab` state type:

```typescript
const [activeTab, setActiveTab] = useState<'zones' | 'map' | 'events' | 'dwell' | 'test' | 'analytics'>('zones')
```

### 2. Add Analytics Tab Button

In the tabs section, add:

```typescript
{(['zones', 'map', 'events', 'dwell', 'test', 'analytics'] as const).map((tab) => (
  <button
    key={tab}
    onClick={() => setActiveTab(tab)}
    className={...}
  >
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
))}
```

### 3. Add Analytics Tab Content

Add this after the 'test' tab content:

```typescript
{activeTab === 'analytics' && (
  <motion.div
    key="analytics"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <GeofenceAnalyticsDashboard tenantId={tenantId} />
  </motion.div>
)}
```

### 4. Import Components

Add to imports:

```typescript
import GeofenceAnalyticsDashboard from '@/components/geofence/GeofenceAnalyticsDashboard'
import { GeofenceTooltip } from '@/components/geofence/tooltips/GeofenceTooltips'
```

### 5. Add Tooltips

Wrap key features with tooltips:

```typescript
<GeofenceTooltip feature="zone-creation">
  <button>Create Zone</button>
</GeofenceTooltip>

<GeofenceTooltip feature="dwell-time">
  <input placeholder="Expected Dwell Time" />
</GeofenceTooltip>
```

## Files Created

1. ✅ `components/geofence/GeofenceAnalyticsDashboard.tsx` - Analytics dashboard
2. ✅ `components/geofence/tooltips/GeofenceTooltips.tsx` - Tooltip system
3. ✅ `app/api/geofence/analytics/route.ts` - Analytics API

## Next Steps

1. Update main page with analytics tab
2. Add tooltips throughout UI
3. Test analytics dashboard
4. Verify API endpoints



