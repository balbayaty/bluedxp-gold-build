# 🎯 HAZALYZE ASN MODULE - MASTER DEVELOPMENT PROMPT
## Complete Context & Instructions for AI Development

**Purpose:** This document serves as the master prompt for all Hazalyze ASN module development, ensuring consistency, quality, and alignment with BlueDXP platform standards.

---

## 📋 CONTEXT

### Platform Overview
- **Platform:** BlueDXP Enterprise Intelligence Operating System
- **Module:** Hazalyze ASN (Advanced Shipping Notice) Intelligence Module
- **Purpose:** World-class, AI-powered ASN processing with full ecosystem integration
- **Vision:** Vision 2040 aligned, 4IR/5IR ready, sustainability-focused

### Current Architecture
- **Module Registry:** `lib/modules/hazalyze.ts`
- **Service Layer:** `lib/services/wms/InboundService.ts` (existing), `lib/services/asn/` (to be enhanced)
- **Components:** `components/InboundPage.tsx`, `components/InboundDetail.tsx` (existing)
- **Pages:** `app/inbound/page.tsx` (existing), `app/asn/` (to be created)
- **Integration:** WMS, TMS, Event Bus, Multi-tenant, RBAC

### Key Integration Points
1. **WMS Module** - Warehouse operations, receiving, putaway
2. **TMS Module** - Transportation, tracking, delivery
3. **Hazalyze AI** - Vision intelligence, predictive analytics, agents
4. **Event Bus** - Cross-module communication
5. **Knowledge Base** - Self-learning system
6. **Agent System** - Specialized AI agents
7. **Saudi Government** - Bayan, Wasl, Daleeli, TGA

---

## 🎯 DEVELOPMENT PRINCIPLES

### 1. Deep Layer Architecture
**ALWAYS implement across all layers:**
- **Presentation Layer:** React components, pages, dashboards
- **Business Logic Layer:** Services, orchestration, workflows
- **Data Layer:** Types, models, processors, validators
- **Infrastructure Layer:** Adapters, event handlers, integrations

**Example Pattern:**
```typescript
// 1. Types (types/asn.ts)
export interface ASN { ... }

// 2. Service (lib/services/asn/asnService.ts)
export class AsnService { ... }

// 3. Actions (app/actions/asn/asnActions.ts)
export async function processAsn(...) { ... }

// 4. Component (components/asn/AsnProcessingInterface.tsx)
export function AsnProcessingInterface() { ... }

// 5. Page (app/asn/processing/page.tsx)
export default function AsnProcessingPage() { ... }
```

### 2. Integration-First Mindset
**EVERY feature must be integration-ready:**
- API-first design (REST, GraphQL, WebSocket)
- Webhook support for real-time notifications
- EDI compatibility (X12, EDIFACT)
- ERP integration (SAP, Oracle, ERPNext, Zoho)
- IoT device connectivity (scanners, RFID, cameras)
- Third-party service integrations
- Event-driven integration (pub/sub, message queues)

### 3. 4IR & 5IR Alignment
**ALWAYS consider:**
- **IoT Integration:** Sensors, RFID, barcode scanners, GPS trackers
- **AI/ML Capabilities:** Predictive analytics, computer vision, NLP
- **Big Data:** Real-time analytics, stream processing
- **Cloud & Edge:** Multi-cloud, hybrid cloud, edge computing
- **Human-Centric AI:** Explainable AI, human-in-the-loop, augmented intelligence
- **Sustainability:** Carbon tracking, ESG compliance, circular economy
- **Quantum-Ready:** Quantum-safe cryptography, scalable architecture

### 4. Security First
**MANDATORY security checklist:**
- ✅ Input validation & sanitization
- ✅ Authentication & authorization (RBAC - 11 roles)
- ✅ Data encryption (at rest & in transit)
- ✅ API key management (environment variables)
- ✅ Rate limiting & DDoS protection
- ✅ SQL injection, XSS, CSRF prevention
- ✅ Tenant isolation (multi-tenant architecture)
- ✅ Audit logging for compliance
- ✅ Quantum-safe cryptography (5IR alignment)
- ✅ Zero-trust security model

### 5. User Experience Excellence
**WORLD-CLASS UX requirements:**
- Intuitive, modern, beautiful UI
- Responsive design (mobile, tablet, desktop)
- Fast loading (< 2 seconds initial load)
- Real-time updates (WebSocket, SSE)
- Contextual help (AI Copilot)
- Accessibility (WCAG 2.1 AA)
- Multi-language support (Arabic, English)
- Dark mode support

### 6. Performance & Scalability
**REQUIRED performance targets:**
- ASN processing: < 30 seconds
- Exception detection: < 5 seconds
- Dashboard load: < 2 seconds
- API response: < 500ms
- Real-time updates: < 100ms latency
- Support 10,000+ ASNs/day
- Horizontal scaling support

---

## 🏗️ ARCHITECTURE PATTERNS

### Service Layer Pattern
```typescript
// lib/services/asn/[feature]/[feature]Service.ts
export class FeatureService {
  constructor(
    private db: PrismaClient,
    private eventBus: EventBus,
    private aiService: AIService
  ) {}

  async process(...): Promise<Result> {
    // 1. Validation
    // 2. Business logic
    // 3. Database operations
    // 4. Event publishing
    // 5. Return result
  }
}
```

### Component Pattern
```typescript
// components/asn/[feature]/[Feature]Component.tsx
'use client'

import { useAsnService } from '@/hooks/useAsnService'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function FeatureComponent() {
  const { data, loading, error } = useAsnService()
  
  if (loading) return <Loading />
  if (error) return <ErrorBoundary error={error} />
  
  return (
    <div className="...">
      {/* Component content */}
    </div>
  )
}
```

### API Route Pattern
```typescript
// app/api/asn/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/auth'
import { validateTenant } from '@/lib/tenant'
import { asnService } from '@/lib/services/asn'

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req)
    await validateTenant(user.tenantId)
    
    const body = await req.json()
    const result = await asnService.process(body)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 📦 REQUIRED FEATURES

### Core Features (Must Have)
1. **ASN Processing**
   - Create, read, update, delete ASNs
   - Multi-modal ASN ingestion (EDI, API, Webhook, Manual)
   - Real-time status tracking
   - Exception handling

2. **Intelligence**
   - Predictive arrival time
   - Exception prediction
   - Quality prediction
   - Supplier intelligence

3. **Analytics**
   - Executive dashboard
   - Operational dashboard
   - Analytical dashboard
   - Custom dashboards

4. **Integration**
   - Supplier integration
   - ERP integration
   - IoT integration
   - Government integration (Saudi)

5. **Templates**
   - ASN templates
   - Workflow templates
   - Report templates
   - Template builder

### Advanced Features (Should Have)
1. **Autonomous Processing**
   - Auto-approval workflows
   - Automated putaway recommendations
   - Self-healing workflows

2. **Vision Intelligence**
   - Auto photo analysis
   - Damage detection
   - Quantity verification

3. **Sustainability**
   - Carbon footprint tracking
   - ESG compliance
   - Sustainability dashboards

4. **Blockchain**
   - Immutability
   - Traceability
   - Smart contracts

5. **AR/VR**
   - AR receiving guidance
   - VR training
   - AR exception handling

---

## 🔌 INTEGRATION REQUIREMENTS

### Event Bus Integration
```typescript
// Publish events
await eventBus.publish('asn.created', {
  asnId: asn.id,
  supplierId: asn.supplierId,
  tenantId: asn.tenantId
})

// Subscribe to events
eventBus.subscribe('wms.receiving.completed', async (event) => {
  await asnService.updateStatus(event.asnId, 'received')
})
```

### Module Registry Integration
```typescript
// Register ASN routes in hazalyze module
routes: [
  { path: '/asn', component: 'app/asn/page', title: 'ASN Intelligence', icon: 'ri-file-list-3-line' },
  // ... more routes
]
```

### Multi-Tenant Isolation
```typescript
// ALWAYS filter by tenantId
const asns = await db.asn.findMany({
  where: { tenantId: user.tenantId }
})
```

### RBAC Integration
```typescript
// Check permissions
if (!hasPermission(user, 'asn:create')) {
  throw new Error('Unauthorized')
}
```

---

## 🎨 UI/UX STANDARDS

### Design System
- **Framework:** Tailwind CSS
- **Components:** Custom components + shadcn/ui
- **Icons:** RemixIcon
- **Animations:** Framer Motion
- **Charts:** Recharts, Chart.js

### Color Palette
- Primary: Blue (BlueDXP brand)
- Success: Green
- Warning: Yellow/Orange
- Error: Red
- Info: Blue

### Typography
- Headings: Inter, bold
- Body: Inter, regular
- Arabic: Cairo, regular

### Layout
- Sidebar navigation
- Top header with user menu
- Main content area
- Responsive grid system

### Components
- Use existing components from `components/`
- Follow existing patterns
- Ensure accessibility
- Support RTL (Arabic)

---

## 📊 DATA MODEL REQUIREMENTS

### Core Entities
1. **ASN** - Main ASN entity
2. **ASNItem** - ASN line items
3. **ASNException** - Exceptions and issues
4. **ASNDocument** - Related documents
5. **ASNTemplate** - Templates
6. **Supplier** - Supplier information
7. **ASNAnalytics** - Analytics data

### Relationships
- ASN → ASNItem (1:many)
- ASN → ASNException (1:many)
- ASN → Supplier (many:1)
- ASN → Warehouse (many:1)
- ASN → Tenant (many:1)

### Indexing
- Index on: `asnNumber`, `supplierId`, `warehouseId`, `tenantId`, `status`, `expectedArrivalDate`
- Full-text search on: `asnNumber`, `supplierName`, `description`

---

## 🧪 TESTING REQUIREMENTS

### Unit Tests
- Service layer tests (90%+ coverage)
- Component tests
- Utility function tests
- Validation tests

### Integration Tests
- API integration tests
- Database integration tests
- Event bus integration tests
- External system integration tests

### E2E Tests
- Complete ASN workflow
- Exception handling
- Multi-user scenarios
- Performance tests

### Test Files Location
- `__tests__/asn/` - Unit tests
- `__tests__/integration/asn/` - Integration tests
- `__tests__/e2e/asn/` - E2E tests

---

## 📚 DOCUMENTATION REQUIREMENTS

### Code Documentation
- JSDoc comments for all public functions
- Type definitions for all interfaces
- README in each service directory
- Architecture decisions documented

### User Documentation
- User guide
- Training materials
- Video tutorials
- Best practices

### API Documentation
- OpenAPI/Swagger specification
- Example requests/responses
- Authentication guide
- Rate limiting documentation

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying any feature:
- [ ] All tests passing
- [ ] Linter errors fixed
- [ ] TypeScript errors fixed
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance tested
- [ ] Multi-tenant tested
- [ ] RBAC tested
- [ ] Integration tested
- [ ] Error handling tested
- [ ] Accessibility tested
- [ ] Mobile responsiveness tested

---

## 🎯 IMPLEMENTATION WORKFLOW

### Step 1: Planning
1. Review this master prompt
2. Review enhancement plan: `docs/HAZALYZE_ASN_MASTER_ENHANCEMENT_PLAN.md`
3. Identify specific feature to implement
4. Design architecture (all layers)
5. Create task breakdown

### Step 2: Development
1. Create types (`types/asn/[feature].ts`)
2. Create service (`lib/services/asn/[feature]/[feature]Service.ts`)
3. Create actions (`app/actions/asn/[feature]Actions.ts`)
4. Create components (`components/asn/[feature]/[Feature]Component.tsx`)
5. Create pages (`app/asn/[feature]/page.tsx`)
6. Create API routes (`app/api/asn/[feature]/route.ts`)

### Step 3: Integration
1. Register routes in module
2. Integrate with Event Bus
3. Integrate with other modules
4. Add to navigation
5. Configure permissions

### Step 4: Testing
1. Write unit tests
2. Write integration tests
3. Write E2E tests
4. Performance testing
5. Security testing

### Step 5: Documentation
1. Update code documentation
2. Update user documentation
3. Update API documentation
4. Create training materials

### Step 6: Review & Deploy
1. Code review
2. Security review
3. Performance review
4. Deploy to staging
5. User acceptance testing
6. Deploy to production

---

## 📖 REFERENCE DOCUMENTS

### Architecture
- `docs/ARCHITECTURE_MINDMAP.md` - Complete architecture
- `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md` - Platform vision
- `lib/modules/registry.ts` - Module registry pattern

### Development
- `docs/DEVELOPMENT_QUICK_REFERENCE.md` - Quick reference
- `docs/COMPLETE_DEVELOPMENT_OVERVIEW.md` - Complete overview
- `CONTRIBUTING.md` - Contribution guidelines

### Standards
- `docs/UI_UX_STANDARDS.md` - UI/UX standards
- `SECURITY.md` - Security guidelines
- `docs/PROPOSALS_MARKET_BENCHMARK.md` - Quality standards

### Enhancement Plan
- `docs/HAZALYZE_ASN_MASTER_ENHANCEMENT_PLAN.md` - Complete enhancement plan

---

## 🎯 QUICK REFERENCE

### When Implementing a New Feature:

1. **Ask yourself:**
   - Does it follow deep layer architecture?
   - Is it integration-ready?
   - Does it align with 4IR/5IR?
   - Is it secure?
   - Is the UX world-class?
   - Is it performant?

2. **Check integration points:**
   - Event Bus
   - Module Registry
   - Multi-tenant
   - RBAC
   - Other modules

3. **Follow patterns:**
   - Service layer pattern
   - Component pattern
   - API route pattern
   - Error handling pattern

4. **Test everything:**
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance tests

5. **Document:**
   - Code documentation
   - User documentation
   - API documentation

---

## 💡 EXAMPLE IMPLEMENTATION

### Example: Predictive Arrival Time Feature

```typescript
// 1. Types (types/asn/predictive.ts)
export interface ArrivalPrediction {
  asnId: string
  predictedArrival: Date
  confidence: number
  factors: PredictionFactor[]
}

// 2. Service (lib/services/asn/intelligence/predictiveAsnService.ts)
export class PredictiveAsnService {
  async predictArrival(asnId: string): Promise<ArrivalPrediction> {
    // ML model prediction
    // Historical data analysis
    // Real-time factors
    return prediction
  }
}

// 3. Component (components/asn/intelligence/PredictiveInsights.tsx)
export function PredictiveInsights({ asnId }: { asnId: string }) {
  const { prediction } = usePredictiveAsn(asnId)
  return <PredictionCard prediction={prediction} />
}

// 4. Page (app/asn/intelligence/predictive/page.tsx)
export default function PredictivePage() {
  return <PredictiveInsights />
}
```

---

**Last Updated:** 2025-01-27  
**Version:** 1.0.0  
**Status:** ✅ Active Development Guide


