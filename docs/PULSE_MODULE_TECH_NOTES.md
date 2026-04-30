# Pulse Module - Technical Notes

## Architecture Decisions

### 1. **Database Design**
- **Append-Only Ledger**: `PulseEvent` table stores all events immutably
- **Atomic Balances**: `PulseBalance` uses composite primary key for upsert operations
- **Privacy-First**: `PulseDailyWellness` stores aggregates only, not raw GPS/health data
- **Indexes**: Optimized for common queries (tenantId, userId, date ranges)

### 2. **Service Layer**
- **Separation of Concerns**: Each service handles one domain (ledger, scoring, missions, etc.)
- **Event-Driven**: Services publish events via Event Bus for cross-module awareness
- **Error Handling**: All services include try-catch and proper error messages
- **Type Safety**: Full TypeScript interfaces for all service methods

### 3. **Scoring System**
- **Ruleset-Based**: Scoring configurable per tenant and role cluster
- **Caps**: Daily/weekly/monthly caps enforced at scoring time
- **Anti-Gaming**: Spike detection for wellness data, recognition abuse detection
- **Role Normalization**: Different weights/caps for warehouse/office/driver roles

### 4. **Integration Points**
- **Tasks**: Listens to task completion events → Execute pillar
- **Training**: Listens to training completion events → Grow pillar
- **IMS**: Listens to CAPA/NCR closure events → Safe pillar
- **Notifications**: Sends mission reminders, completion notifications
- **Event Bus**: Publishes Pulse events for other modules

### 5. **Privacy & Compliance**
- **Opt-In Consent**: Required for wellness tracking
- **Data Retention**: Configurable per user
- **Aggregate-Only**: No raw health data stored
- **Audit Logs**: All sensitive operations logged

---

## Integration Points Reused

### ✅ Authentication
- **File**: `middleware/apiAuth.ts`
- **Usage**: All API routes use `apiAuthMiddleware()`
- **RBAC**: Role-based access control enforced

### ✅ Notifications
- **File**: `lib/services/notifications/notificationService.ts`
- **Usage**: Mission reminders, completion notifications, redemption approvals
- **Channels**: In-app notifications (can extend to email/SMS)

### ✅ Event Bus
- **File**: `lib/services/event-bus/index.ts`
- **Usage**: Publish Pulse events, subscribe to task/training/IMS events
- **Pattern**: Event-driven integration for loose coupling

### ✅ Database
- **ORM**: Prisma with PostgreSQL
- **Pattern**: Follows existing schema patterns (tenantId, indexes, relations)
- **Migrations**: Use `prisma migrate dev`

### ✅ Module Registry
- **File**: `lib/modules/registry.ts`
- **Usage**: Pulse module registered with routes, APIs, settings
- **Pattern**: Follows existing module definition structure

---

## Database Migrations

### To Apply Schema:
```bash
npx prisma migrate dev --name add_pulse_module
npx prisma generate
```

### Migration File Location:
- `prisma/migrations/[timestamp]_add_pulse_module/migration.sql`

---

## Configuration

### Ruleset Configuration
Rulesets are stored in `PulseRuleset` table with JSON fields:

```json
{
  "weightsJson": {
    "Move": 0.25,
    "Execute": 0.40,
    "Safe": 0.25,
    "Grow": 0.10
  },
  "capsJson": {
    "daily": {
      "Move": 50,
      "Execute": 100,
      "Safe": 50,
      "Grow": 30
    },
    "weekly": {
      "Move": 200,
      "Execute": 500,
      "Safe": 200,
      "Grow": 100
    },
    "monthly": {
      "Move": 800,
      "Execute": 2000,
      "Safe": 800,
      "Grow": 400
    }
  },
  "antiGamingJson": {
    "spikeDetection": {
      "threshold": 2.0,
      "action": "reduce"
    },
    "maxEventCounts": {
      "WELLNESS_LOGGED": 1,
      "RECOGNITION_GIVEN": 10
    }
  },
  "evaluationPolicyJson": {
    "icWeight": 0.10,
    "allowedUses": ["performance_review", "promotion_consideration"]
  }
}
```

### Default Rulesets
Create default rulesets for:
- `warehouse` role cluster
- `office` role cluster
- `driver` role cluster
- `custom` role cluster (fallback)

---

## API Usage Examples

### Get Overview
```typescript
const res = await fetch('/api/pulse/overview')
const { data } = await res.json()
```

### Claim Mission
```typescript
const res = await fetch('/api/pulse/missions', {
  method: 'POST',
  body: JSON.stringify({ missionId: 'mission-123' })
})
```

### Redeem Reward
```typescript
const res = await fetch('/api/pulse/rewards', {
  method: 'POST',
  body: JSON.stringify({ rewardId: 'reward-456' })
})
```

### Give Recognition
```typescript
const res = await fetch('/api/pulse/recognition', {
  method: 'POST',
  body: JSON.stringify({
    toUserId: 'user-789',
    pointsPP: 15,
    reason: 'Great teamwork!',
    tags: ['Teamwork', 'Collaboration']
  })
})
```

---

## Background Jobs (To Implement)

### Daily Mission Generation
- **Schedule**: Daily at midnight (timezone-aware)
- **Action**: Generate missions for all active users
- **Location**: `lib/services/pulse/pulseJobs.ts`

### Weekly Boss Battle Evaluation
- **Schedule**: Weekly on Sunday
- **Action**: Evaluate weekly missions, distribute rewards
- **Location**: `lib/services/pulse/pulseJobs.ts`

### Score Snapshot Calculation
- **Schedule**: Daily + Weekly
- **Action**: Calculate snapshots for all scopes
- **Location**: `lib/services/pulse/pulseJobs.ts`

### Benchmark Aggregation
- **Schedule**: Monthly
- **Action**: Aggregate tenant metrics, update benchmark index
- **Location**: `lib/services/pulse/pulseJobs.ts`

---

## Testing Checklist

### Unit Tests
- [ ] Scoring service: caps, weights, normalization
- [ ] Mission service: requirement validation
- [ ] Rewards service: redemption approval workflow
- [ ] Recognition service: abuse detection
- [ ] Scoreboard service: snapshot calculations
- [ ] Benchmark service: percentile calculations

### Integration Tests
- [ ] Event processing end-to-end
- [ ] Mission claiming workflow
- [ ] Redemption approval workflow
- [ ] API permission tests
- [ ] Multi-tenant isolation

### E2E Tests
- [ ] Complete mission flow
- [ ] Redeem reward flow
- [ ] Give recognition flow
- [ ] Admin ruleset configuration

---

## Performance Considerations

1. **Indexes**: All foreign keys and common query fields indexed
2. **Pagination**: Event history limited to 100 most recent
3. **Caching**: Consider caching rulesets and balances
4. **Batch Processing**: Background jobs process in batches
5. **Aggregation**: Score snapshots pre-calculated, not computed on-demand

---

## Security Considerations

1. **Input Validation**: All API inputs validated
2. **RBAC**: Role-based access control on all endpoints
3. **Tenant Isolation**: All queries filter by tenantId
4. **Anti-Gaming**: Multiple layers of protection
5. **Audit Logs**: Sensitive operations logged
6. **Privacy**: Wellness data aggregate-only, consent required

---

## Future Enhancements

1. **Wearable Integration**: Google Fit / Apple Health adapters
2. **Real-Time Updates**: WebSocket for live leaderboards
3. **Advanced Analytics**: Correlation with operational KPIs
4. **Mobile App**: Native mobile app for Pulse
5. **Gamification**: More badge types, achievements, challenges

---

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check Prisma schema syntax
2. **Events Not Processing**: Check Event Bus subscriptions
3. **Points Not Awarded**: Check ruleset configuration
4. **Caps Not Working**: Verify capsJson structure
5. **API Auth Fails**: Check JWT token and RBAC permissions

---

## Support

For issues or questions:
1. Check implementation summary: `docs/PULSE_MODULE_IMPLEMENTATION_SUMMARY.md`
2. Check architecture map: `docs/PULSE_MODULE_ARCHITECTURE_MAP.md`
3. Review service code: `lib/services/pulse/`
4. Review API routes: `app/api/pulse/`













