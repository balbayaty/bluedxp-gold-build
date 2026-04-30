# Pulse Module - Architecture Map

## 📋 Repository Scan Summary

### ✅ Existing Systems Identified

#### 1. **Authentication & Authorization**
- **Location**: `middleware/apiAuth.ts`, `contexts/AuthContext.tsx`
- **Pattern**: JWT-based auth with RBAC (11 roles)
- **RBAC**: Hierarchical permissions (Module → Feature → Tab → Action)
- **Multi-tenant**: Tenant isolation enforced at all layers
- **Reuse**: Use `apiAuthMiddleware` for API routes, `AuthContext` for UI

#### 2. **Database**
- **ORM**: Prisma with PostgreSQL
- **Location**: `prisma/schema.prisma`
- **Pattern**: Models with tenantId, indexes, relations
- **Migrations**: `prisma migrate dev`
- **Reuse**: Add Pulse models to existing schema

#### 3. **Tasks System**
- **Location**: `app/tasks/page.tsx`, `lib/services/wms/automationService.ts`
- **Pattern**: Task lifecycle (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
- **Integration**: Task completion events → Pulse Execute pillar
- **Reuse**: Listen to task completion events via Event Bus

#### 4. **Training System**
- **Location**: `lib/services/qhse/trainingService.ts`, `app/training-management/page.tsx`
- **Pattern**: Training records with completion tracking
- **Integration**: Training completions → Pulse Grow pillar
- **Reuse**: `completeTraining()` method emits events

#### 5. **IMS/CAPA/NCR**
- **Location**: `app/capa-management/page.tsx`, `app/ncr-management/page.tsx`
- **Pattern**: CAPA/NCR workflows with closure tracking
- **Integration**: CAPA/NCR closures → Pulse Safe pillar
- **Reuse**: Event Bus integration for closure events

#### 6. **Notifications**
- **Location**: `lib/services/notifications/notificationService.ts`
- **Pattern**: Multi-channel (email, SMS, push, in-app)
- **Integration**: Send daily missions, weekly challenges
- **Reuse**: `notificationService.send()` for mission notifications

#### 7. **Event Bus**
- **Location**: `lib/services/event-bus/index.ts`, `lib/services/event-store/index.ts`
- **Pattern**: CQRS with event sourcing
- **Integration**: Pulse events → Event Bus for cross-module awareness
- **Reuse**: Publish Pulse events, subscribe to task/training/IMS events

#### 8. **Module Registry**
- **Location**: `lib/modules/registry.ts`, `lib/modules/index.ts`
- **Pattern**: Plugin architecture with dependencies
- **Integration**: Register Pulse module
- **Reuse**: Follow existing module pattern

#### 9. **UI Patterns**
- **Location**: `components/PageTemplate.tsx`, `components/Layout.tsx`
- **Pattern**: Consistent page templates, navigation integration
- **Reuse**: Use `PageTemplate` for all Pulse pages

#### 10. **API Routes**
- **Location**: `app/api/*/route.ts`
- **Pattern**: Next.js App Router API routes
- **Reuse**: Follow existing route patterns (GET, POST, PATCH)

---

## 🏗️ Pulse Module Placement

### Module Structure
```
lib/modules/pulse.ts          # Module definition
lib/services/pulse/           # Service layer
  ├── pulseScoringService.ts
  ├── pulseMissionService.ts
  ├── pulseLedgerService.ts
  ├── pulseRewardsService.ts
  ├── pulseRecognitionService.ts
  ├── pulseScoreboardService.ts
  └── pulseBenchmarkService.ts
app/pulse/                     # UI pages
  ├── page.tsx                 # Overview
  ├── missions/page.tsx
  ├── leaderboards/page.tsx
  ├── rewards/page.tsx
  ├── recognition/page.tsx
  ├── profile/page.tsx
  ├── admin/
  │   ├── page.tsx
  │   ├── rulesets/page.tsx
  │   ├── missions/page.tsx
  │   ├── rewards/page.tsx
  │   └── redemptions/page.tsx
  └── benchmark/page.tsx
app/api/pulse/                 # API routes
  ├── overview/route.ts
  ├── missions/route.ts
  ├── leaderboard/route.ts
  ├── rewards/route.ts
  ├── recognition/route.ts
  ├── consent/route.ts
  ├── wellness/route.ts
  └── admin/
      ├── rulesets/route.ts
      ├── scoreboards/route.ts
      ├── redemptions/route.ts
      └── missions/route.ts
types/pulse.ts                 # TypeScript types
prisma/schema.prisma           # Database models (15 tables)
```

---

## 🔗 Integration Points

### 1. **Tasks Integration**
- **Event**: `wms.task.completed`
- **Action**: Award Execute pillar points
- **Service**: `pulseScoringService.processEvent()`

### 2. **Training Integration**
- **Event**: `qhse.training.completed`
- **Action**: Award Grow pillar points
- **Service**: `pulseScoringService.processEvent()`

### 3. **IMS/CAPA/NCR Integration**
- **Event**: `iso-ims.capa.closed`, `iso-ims.ncr.closed`
- **Action**: Award Safe pillar points
- **Service**: `pulseScoringService.processEvent()`

### 4. **Notifications Integration**
- **Service**: `notificationService.send()`
- **Use Cases**:
  - Daily mission reminders
  - Weekly boss battle announcements
  - Mission completion notifications
  - Reward redemption approvals

### 5. **Event Bus Integration**
- **Publish Events**:
  - `pulse.mission.completed`
  - `pulse.reward.redeemed`
  - `pulse.recognition.given`
  - `pulse.scoreboard.updated`
- **Subscribe Events**:
  - `wms.task.completed`
  - `qhse.training.completed`
  - `iso-ims.capa.closed`
  - `iso-ims.ncr.closed`

---

## 📊 Database Schema (15 Tables)

All tables follow Prisma pattern:
- `id`: String @id @default(cuid())
- `tenantId`: String (indexed)
- `createdAt`: DateTime @default(now())
- `updatedAt`: DateTime @updatedAt

See `prisma/schema.prisma` for full schema.

---

## 🔐 Security & Compliance

### RBAC Integration
- **Employee**: Own data, team leaderboards
- **Manager/Supervisor**: Team/site scoreboards, pending redemptions
- **HR/Admin**: Tenant-wide admin, rulesets, benchmark opt-in

### Privacy
- Wellness data: Aggregate only (daily totals)
- No GPS traces
- Opt-in consent required
- Data retention configurable
- Audit logs for all sensitive operations

---

## 🚀 Next Steps

1. ✅ Architecture map (this document)
2. ⏳ Add Prisma schema
3. ⏳ Create module definition
4. ⏳ Implement services
5. ⏳ Create API routes
6. ⏳ Build UI pages
7. ⏳ Add background jobs
8. ⏳ Write tests & docs













