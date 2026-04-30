# BlueDXP Platform - Complete Cursor Rules (Production-Ready + Your Existing Rules)

> **Purpose**: Complete, production-ready rules that merge your existing comprehensive guidelines with database, testing, and full tech stack requirements. Optimized for step-by-step guidance and mind-blowing results.

---

## 👤 USER PROFILE (Critical Context)

### Who You Are
- **Experience**: No programming/coding background
- **Style**: Direct, wants step-by-step, best results
- **Learning**: Needs comprehensive guidance, clear explanations
- **Goal**: Get working solutions fast, understand what's happening

### How AI Should Communicate
- ✅ **ALWAYS**: Complete solutions in one response
- ✅ **ALWAYS**: Step-by-step with explanations
- ✅ **ALWAYS**: Working code, not fragments
- ✅ **ALWAYS**: Explain WHY, not just WHAT
- ✅ **ALWAYS**: Anticipate needs, don't wait for questions
- ✅ **ALWAYS**: Production-ready (database, testing, full tech stack)
- ❌ **NEVER**: Assume technical knowledge
- ❌ **NEVER**: Leave TODOs or "you'll need to..."
- ❌ **NEVER**: Create incomplete implementations
- ❌ **NEVER**: Skip database, testing, or production setup

### Production-Ready Mandate
**When you ask to "build" or "develop" ANYTHING:**
- ✅ MUST include complete tech stack (Next.js, TypeScript, Prisma, etc.)
- ✅ MUST include database schema and migrations
- ✅ MUST include testing (unit + integration)
- ✅ MUST include production deployment setup
- ✅ MUST include all infrastructure (Docker, Redis, etc.)
- ✅ MUST be ready to deploy to production immediately

---

## 🎯 PLATFORM CONTEXT

### Platform Identity
- **PLATFORM NAME**: BlueDXP Platform (Enterprise Intelligence Operating System)
- **HAZALYZE**: A module within BlueDXP (purpose/functionality TBD - not yet defined)
- **EXISTING MODULES**: WMS, ISO-IMS, MSDS, QHSE, TMS, Trade Compliance, Proposals/RFQ, MaaS, etc.
- **ARCHITECTURE**: Multi-module platform with plugin-based architecture
- **INDUSTRIAL REVOLUTION ALIGNMENT**: Full 4IR & 5IR proof - always consider latest trends
- **INTEGRATION-FIRST**: Every feature must be integration-ready from the start

### Key Documents to Reference
- `README.md` - BlueDXP Platform overview
- `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md` - Platform vision & alignment
- `ARCHITECTURE_MINDMAP.md` - Complete system architecture
- `SECURITY.md` - Security best practices
- `UI_UX_STANDARDS.md` - Frontend standards
- `CONTRIBUTING.md` - Code style & standards

---

## 🛠️ TECH STACK REQUIREMENTS (MANDATORY - Production Ready)

### Locked Tech Stack (DO NOT CHANGE)

**When building ANY feature, MUST use:**

```yaml
Frontend:
  Framework: Next.js 14.2.3 (App Router) - MANDATORY
  Language: TypeScript 5.2 - MANDATORY
  UI Library: React 18.2.0 - MANDATORY
  Styling: Tailwind CSS 3.3.5 - MANDATORY
  Animations: Framer Motion 10.16.0 - MANDATORY
  Icons: Remix Icons / React Icons - MANDATORY

Backend:
  Runtime: Node.js 20.x (LTS) - MANDATORY
  API Framework: Next.js API Routes - MANDATORY
  Real-time: Socket.io 4.7.2 - MANDATORY
  GraphQL: Apollo Server 4.9.5 - MANDATORY (if needed)

Database:
  ORM: Prisma 5.22.0 - MANDATORY
  Primary DB: PostgreSQL 15 + pgvector - MANDATORY
  Cache: Redis 7 - MANDATORY
  Message Queue: RabbitMQ 3 / Kafka - MANDATORY (if async needed)

Testing:
  Framework: Jest 29.7.0 - MANDATORY
  Testing Library: @testing-library/react - MANDATORY
  Coverage: 70%+ minimum - MANDATORY

Infrastructure:
  Containerization: Docker + Docker Compose - MANDATORY
  Object Storage: MinIO - MANDATORY (if file storage)
  Search: OpenSearch - MANDATORY (if search needed)
  Observability: Prometheus + Grafana - MANDATORY (production)
```

---

## 🏗️ CORE PRINCIPLES - ALWAYS FOLLOW THESE

### 1. DEEP LAYER ARCHITECTURE (Go as deep as possible)

**NEVER implement features at surface level only. ALWAYS consider all architectural layers:**

```
1. Types Layer (types/[feature].ts) - TypeScript interfaces
   ↓
2. Database Schema (prisma/schema.prisma) - Prisma models
   ↓
3. Service Layer (lib/services/[module]/[feature]Service.ts) - Business logic with Prisma
   ↓
4. API Routes (app/api/[module]/[feature]/route.ts) - Next.js API
   ↓
5. Component Layer (components/[module]/[Feature].tsx) - React components
   ↓
6. Page Layer (app/[module]/[page]/page.tsx) - Next.js pages
   ↓
7. Testing (__tests__/[module]/[feature].test.ts) - Unit + Integration tests
   ↓
8. Integration Layer (Module registry, Events, Navigation)
```

**Example**: If you ask for "shipment tracking page"
- ✅ Create: types, Prisma schema, service with DB, API routes, component, page, tests, navigation, events
- ❌ Don't: Just create a page component without database, testing, or production setup

**Use established patterns:**
- CQRS & Event Sourcing (`lib/services/event-store/`)
- Event Bus for decoupling (`lib/services/event-bus/`)
- Module Registry for plugin architecture (`lib/modules/registry.ts`)
- Service abstractions with interfaces (see `lib/adapters/transportation/base/`)
- Agent Orchestration (`lib/services/agents/agentOrchestrator.ts`)

### 2. INTEGRATION-FIRST MINDSET (ALWAYS)

**ALWAYS design with integration in mind from the start. Every feature must be integration-ready:**

- API-first design (REST, GraphQL, WebSocket support)
- Webhook support for real-time notifications
- EDI (Electronic Data Interchange) compatibility
- ERP integration capabilities (SAP, Oracle, ERPNext, etc.)
- IoT device connectivity (sensors, RFID, barcode scanners)
- Third-party service integrations (carriers, customs, regulatory)
- Microservices communication patterns
- Event-driven integration (pub/sub, message queues)

**Design for:**
- External system connectivity
- Data exchange formats (JSON, XML, EDI, CSV)
- Authentication/authorization for integrations (OAuth2, API keys, certificates)
- Rate limiting and throttling for external APIs
- Retry mechanisms and circuit breakers
- Integration monitoring and health checks

**See:** `lib/adapters/` for integration patterns

### 3. CONNECTIVITY & INTEROPERABILITY (4IR & 5IR ALIGNED)

**ALWAYS consider connectivity requirements:**
- IoT Integration: Sensors, RFID, barcode scanners, GPS trackers, temperature monitors
- Edge Computing: Support for edge devices and local processing
- Cloud Connectivity: Multi-cloud support, hybrid cloud architectures
- API Connectivity: RESTful APIs, GraphQL, gRPC, WebSocket
- Real-time Communication: WebSocket, Server-Sent Events (SSE)
- Message Queues: RabbitMQ, Kafka, Redis Streams support
- Blockchain Readiness: Consider blockchain integration for supply chain transparency
- Digital Twin Support: Real-time synchronization with physical systems

**Interoperability Standards:**
- Industry standards (GS1, EPCIS, etc.)
- Open standards over proprietary solutions
- Standard data formats and schemas
- Protocol-agnostic design where possible

### 4. 4IR (FOURTH INDUSTRIAL REVOLUTION) ALIGNMENT

**Always align with 4IR capabilities:**

**A. INTERNET OF THINGS (IoT)**
- IoT device integration (sensors, actuators, smart devices)
- Real-time data collection from connected devices
- Edge device management and monitoring
- Sensor data processing and analytics
- Device lifecycle management
- See: `lib/services/` for IoT integration patterns

**B. ARTIFICIAL INTELLIGENCE & MACHINE LEARNING**
- AI-powered decision making (`lib/services/ai/`)
- ML model integration (`lib/services/ml-registry/`)
- Predictive analytics and forecasting
- Natural Language Processing (NLP)
- Computer Vision (`lib/services/ai/visionService.ts`)
- Automated insights and recommendations
- Continuous learning from data

**C. BIG DATA & ANALYTICS**
- Large-scale data processing
- Real-time analytics
- Data lakes and data warehouses support
- Stream processing capabilities
- Advanced analytics and reporting

**D. CLOUD COMPUTING & EDGE**
- Cloud-native architecture
- Edge computing support
- Hybrid cloud capabilities
- Scalable and elastic infrastructure
- Microservices architecture

**E. CYBER-PHYSICAL SYSTEMS**
- Integration with physical systems
- Real-time monitoring and control
- Digital-physical synchronization
- Automation and orchestration

**F. AUTOMATION & ROBOTICS**
- Robotic Process Automation (RPA) readiness
- Automated workflows (`lib/services/agents/`)
- Autonomous decision-making
- Process automation

### 5. 5IR (FIFTH INDUSTRIAL REVOLUTION) ALIGNMENT

**Always align with 5IR capabilities:**

**A. HUMAN-CENTRIC AI & COLLABORATION**
- Human-AI collaboration (HazalyzeCopilot, AI assistants)
- Augmented intelligence (AI enhances human capabilities)
- Explainable AI (transparent decision-making)
- Ethical AI practices
- Human-in-the-loop workflows
- Collaborative robots (cobots) support

**B. SUSTAINABILITY & CIRCULAR ECONOMY**
- Carbon footprint tracking
- Sustainability metrics and reporting
- Circular economy principles
- Resource optimization
- Waste reduction capabilities
- ESG (Environmental, Social, Governance) compliance

**C. AUGMENTED & VIRTUAL REALITY**
- AR/VR readiness for training and operations
- Digital twin visualization
- Immersive user experiences
- Remote assistance capabilities

**D. EDGE & DISTRIBUTED COMPUTING**
- Edge computing optimization
- Distributed processing
- Low-latency requirements
- Offline capability support

**E. QUANTUM-READY ARCHITECTURE**
- Quantum computing readiness (future-proof)
- Quantum-safe cryptography considerations
- Scalable to quantum algorithms when available

**F. PERSONALIZATION & ADAPTIVE SYSTEMS**
- Personalized user experiences
- Adaptive interfaces
- Context-aware systems
- User preference learning

### 6. COMPREHENSIVE CONSIDERATION (Every possible angle)

**Before implementing ANY feature, analyze:**

**A. SECURITY (ALWAYS FIRST)**
- Input validation & sanitization (SECURITY.md)
- Authentication & authorization (RBAC - 11 roles)
- Data encryption (at rest & in transit)
- API key management (never hardcode)
- Rate limiting & DDoS protection
- SQL injection, XSS, CSRF prevention
- Tenant isolation (multi-tenant architecture)
- Audit logging for compliance
- Quantum-safe cryptography (5IR alignment)
- Zero-trust security model
- Check SECURITY.md for full checklist

**B. FLEXIBILITY & EXTENSIBILITY**
- Use interfaces/abstractions (not concrete implementations)
- Plugin architecture (Module Registry pattern)
- Adapter pattern for external integrations (`lib/adapters/`)
- Configuration-driven behavior (not hardcoded)
- Support both standalone and integrated modes
- Dependency injection where appropriate
- Allow feature flags/module enablement
- API versioning for backward compatibility

**C. FUTURE-PROOFING**
- Event-driven architecture (Event Bus, Event Store)
- CQRS pattern for scalability (`lib/services/event-store/`)
- ML Model Registry for AI features (`lib/services/ml-registry/`)
- Knowledge Base with vector embeddings (`lib/services/knowledge-base/`)
- Agent Memory & Learning (`lib/services/agents/`)
- Entity Graph for relationships (`lib/services/graph/`)
- Evidence & Lineage Tracking (`lib/services/evidence/`)
- Versioning support (API versioning, model versioning)
- Quantum-ready architecture considerations

**D. ERROR HANDLING & RESILIENCE**
- Comprehensive error boundaries (`components/ErrorBoundary.tsx`)
- Fallback mechanisms (see HazalyzeCopilot.tsx for AI fallback example)
- Retry strategies with exponential backoff
- Graceful degradation
- Circuit breakers for external integrations
- Proper error messages (user-friendly + technical details)
- Error logging & monitoring
- Handle all edge cases
- Offline mode support where applicable

**E. PERFORMANCE & SCALABILITY**
- Consider caching strategies
- Optimize database queries
- Lazy loading where appropriate
- Pagination for large datasets
- Debouncing/throttling for user inputs
- Consider async/await patterns
- Event-driven for decoupling
- Horizontal scaling support
- Edge computing optimization

**F. PROS & CONS ANALYSIS**
- Decision Support Service pattern (`lib/services/trade-compliance/decisionSupportService.ts`)
- Risk Prediction & Assessment (`lib/services/trade-compliance/predictiveAnalyticsService.ts`)
- Optimization Recommendations
- Always document trade-offs in code comments
- Consider multiple implementation approaches
- Choose based on long-term maintainability
- Consider 4IR/5IR alignment in decisions

### 7. PLATFORM-WIDE INTEGRATION (Not isolated features)

**Every feature MUST integrate with:**
- Multi-Tenant Architecture (tenant isolation)
- Role-Based Access Control (11 roles - check `types/user.ts`)
- View Context System (Customer/Warehouse/Combined)
- Intelligent Orchestration Engine (if applicable)
- Event Bus (`lib/services/event-bus/`) for cross-module communication
- Notification Service (`lib/services/notifications/`)
- Export Service (`lib/services/export/`)
- Knowledge Base (`lib/services/knowledge-base/`)
- Agent System (`lib/services/agents/`)
- Compliance System (`lib/services/compliance/`)
- Evidence & Lineage (`lib/services/evidence/`)
- Module Registry (`lib/modules/registry.ts`) - for cross-module awareness
- External Integration Layer (`lib/adapters/`)
- IoT Connectivity Layer (if applicable)

### 8. MODULE PLACEMENT & ORGANIZATION

- BlueDXP is the PLATFORM - Hazalyze is a MODULE within it (purpose TBD)
- Check `lib/modules/registry.ts` for module definitions
- Modules include: wms.ts, tms.ts, compliance.ts, proposals-rfq.ts, trade-compliance.ts, iso-ims.ts, maas.ts
- Hazalyze module definition/purpose is still being determined
- Services go in `lib/services/[service-name]/`
- Adapters for external APIs go in `lib/adapters/[provider]/`
- Types go in `types/` directory
- Components go in `components/` directory
- Pages go in `app/[module]/` directory
- Follow existing patterns (see CONSOLIDATION_SUMMARY.md)
- When working on Hazalyze module, remember it's part of BlueDXP platform

### 9. TYPE SAFETY & INTERFACES

- ALWAYS define TypeScript interfaces/types
- Use existing types from `types/` directory
- Never use 'any' - use 'unknown' if needed
- Define service interfaces (see `types/evidence.ts`, `types/knowledgeBase.ts`)
- Use enums for constants
- Export types for reusability

### 10. CODE QUALITY STANDARDS

- Follow UI_UX_STANDARDS.md for frontend
- Follow CONTRIBUTING.md for code style
- Use meaningful variable names
- Add JSDoc comments for complex logic
- Keep functions small and focused
- Extract reusable logic to utilities/services
- Follow existing patterns in codebase

### 11. TESTING & VALIDATION

- Input validation on all forms/APIs
- Error boundary testing
- Edge case handling
- Type checking (TypeScript)
- Linting (ESLint)
- Unit tests for complex logic (Jest - 80%+ coverage)
- Integration testing for external systems
- E2E tests for critical flows

### 12. DOCUMENTATION

- Update relevant documentation files
- Add comments explaining "why" not just "what"
- Document architectural decisions
- Update ARCHITECTURE_MINDMAP.md if adding major features
- Update module registry if adding new modules
- Reference BlueDXP platform context when documenting
- Document integration points and connectivity

---

## 🗄️ DATABASE REQUIREMENTS (MANDATORY)

### Prisma Schema Pattern

**EVERY feature that stores data MUST have:**

```prisma
// prisma/schema.prisma

model FeatureName {
  id        String   @id @default(uuid())
  tenantId  String   // Multi-tenant isolation - ALWAYS include
  name      String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  createdBy User? @relation(fields: [createdById], references: [id])
  createdById String?
  
  // Indexes for performance
  @@index([tenantId])
  @@index([status])
  @@map("feature_names")
}
```

### Database Service Pattern

**EVERY service MUST use Prisma:**

```typescript
// lib/services/[module]/[feature]Service.ts
import { prisma } from '@/lib/database/prisma'

export const featureService: FeatureService = {
  async create(data: Partial<Entity>, tenantId: string) {
    // 1. Validate input
    if (!data.name) throw new Error('Name required')
    
    // 2. Create with Prisma
    const entity = await prisma.featureName.create({
      data: {
        ...data,
        tenantId, // ALWAYS include tenantId for multi-tenant isolation
        createdAt: new Date(),
      },
    })
    
    // 3. Publish event
    await eventBus.publish('feature.created', { entityId: entity.id })
    
    // 4. Return
    return entity
  },
  
  async get(id: string, tenantId: string) {
    // ALWAYS filter by tenantId for security
    return await prisma.featureName.findFirst({
      where: {
        id,
        tenantId, // Tenant isolation - MANDATORY
      },
    })
  },
  
  // ... other methods with Prisma
}
```

### Migration Pattern

**After adding Prisma model, MUST create migration:**

```bash
# User runs:
npm run prisma:migrate

# This creates migration file in prisma/migrations/
# Migration is automatically applied
```

**Include in response:**
- ✅ Prisma schema changes shown
- ✅ Migration command provided
- ✅ Instructions to run migration

---

## 🧪 TESTING REQUIREMENTS (MANDATORY)

### Test Structure

**EVERY feature MUST have tests:**

```
__tests__/
├── unit/
│   └── [module]/
│       └── [feature]Service.test.ts
├── integration/
│   └── [module]/
│       └── [feature].integration.test.ts
└── e2e/
    └── [module]/
        └── [feature].e2e.test.ts
```

### Unit Test Pattern

**EVERY service MUST have unit tests:**

```typescript
// __tests__/unit/[module]/[feature]Service.test.ts
import { featureService } from '@/lib/services/[module]/[feature]Service'
import { prisma } from '@/lib/database/prisma'

jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    featureName: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('FeatureService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create feature with valid data', async () => {
      const mockData = { name: 'Test', tenantId: 'tenant-1' }
      const mockEntity = { id: '1', ...mockData, createdAt: new Date() }
      
      ;(prisma.featureName.create as jest.Mock).mockResolvedValue(mockEntity)
      
      const result = await featureService.create(mockData, 'tenant-1')
      
      expect(result).toEqual(mockEntity)
      expect(prisma.featureName.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Test', tenantId: 'tenant-1' }),
      })
    })

    it('should throw error if name is missing', async () => {
      await expect(
        featureService.create({}, 'tenant-1')
      ).rejects.toThrow('Name required')
    })
  })

  // ... more tests
})
```

### Integration Test Pattern

**EVERY API route MUST have integration tests:**

```typescript
// __tests__/integration/[module]/[feature].integration.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/[module]/[feature]/route'

describe('API: /api/[module]/[feature]', () => {
  describe('GET', () => {
    it('should return features for tenant', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: { 'x-tenant-id': 'tenant-1' },
      })

      await GET(req as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toBeArray()
    })
  })

  // ... more tests
})
```

### Test Coverage Requirements

**MUST achieve:**
- ✅ Unit tests: 80%+ coverage
- ✅ Integration tests: 60%+ coverage
- ✅ Critical paths: 100% coverage
- ✅ Error handling: 100% coverage

**Include in response:**
- ✅ Test files created
- ✅ Test commands provided
- ✅ Coverage requirements met

---

## 📋 RESPONSE STRUCTURE (Mandatory Template - Step-by-Step)

### For Feature Requests (Production-Ready)

```
## ✅ Complete Production-Ready Implementation

I've created the complete [feature] with ALL layers, database, testing, and production setup:

### Files Created (Step-by-Step):
1. `types/[feature].ts` - Type definitions (what data looks like)
2. `prisma/schema.prisma` - Database model (where data is stored)
3. `lib/services/[module]/[feature]Service.ts` - Business logic (how it works)
4. `app/api/[module]/[feature]/route.ts` - API endpoints (how to access it)
5. `components/[module]/[Feature].tsx` - UI component (what you see)
6. `app/[module]/[page]/page.tsx` - Page (where it appears)
7. `__tests__/unit/[module]/[feature]Service.test.ts` - Unit tests (testing logic)
8. `__tests__/integration/[module]/[feature].integration.test.ts` - Integration tests (testing everything together)
9. `lib/modules/[module].ts` - Module registration (connecting to platform)

### Database Setup (What You Need to Do):
1. Run migration: `npm run prisma:migrate`
   - This creates the database tables
   - You'll see: "Migration applied successfully"
2. Generate Prisma client: `npm run prisma:generate`
   - This makes database available to code
   - You'll see: "Generated Prisma Client"
3. Database is now ready! ✅

### What It Does (Simple Explanation):
[Clear, simple explanation in user-friendly language - what the feature does, why it's useful]

### How to Use (Step-by-Step):
1. Start the app: `npm run dev`
   - Wait for: "Ready on http://localhost:3002"
2. Navigate to: `http://localhost:3002/[path]`
   - You'll see: [What appears on screen]
3. Click [button]: [What happens]
4. Result: [What you get]

### Test It (How to Verify It Works):
1. Run tests: `npm test [feature]Service.test.ts`
   - You'll see: "Tests passed ✅"
2. Check coverage: `npm test -- --coverage`
   - You'll see: "Coverage: 85% ✅"
3. All tests should pass ✅

### Tech Stack Used (What Technologies):
- ✅ Next.js 14.2.3 (App Router) - The framework
- ✅ TypeScript 5.2 - The language
- ✅ React 18.2.0 - The UI library
- ✅ Prisma 5.22.0 - Database tool
- ✅ PostgreSQL 15 - Database
- ✅ Tailwind CSS 3.3.5 - Styling
- ✅ Jest 29.7.0 - Testing

### Production Ready Checklist:
- ✅ Database schema created
- ✅ Migrations ready
- ✅ Tests included (80%+ coverage)
- ✅ Error handling complete
- ✅ Security checks included
- ✅ API endpoints working
- ✅ UI responsive and accessible
- ✅ Events publishing
- ✅ Navigation added
- ✅ Permissions enforced

### Integration Points (How It Connects):
- ✅ Connected to: [Module/Service]
- ✅ Events published: [Event names]
- ✅ Permissions: [RBAC roles]
- ✅ Navigation: [Where it appears]
- ✅ Database: [Tables/models]

Everything is production-ready - just run the migration and start using it!
```

---

## 🏗️ ARCHITECTURE PATTERNS TO USE

### 1. MODULE REGISTRY PATTERN (`lib/modules/registry.ts`)
- Register modules with dependencies
- Enable/disable modules dynamically
- Check dependencies before enabling
- Hazalyze module purpose/definition TBD

### 2. ADAPTER PATTERN (`lib/adapters/`)
- Base interface (e.g., TransportationAdapter)
- Multiple implementations (ERP, Standalone)
- Easy to swap implementations
- Integration-ready design

### 3. SERVICE LAYER PATTERN (`lib/services/`)
- Business logic in services
- Services expose interfaces
- Components call services, not direct APIs
- API-first design
- ALWAYS use Prisma for database operations

### 4. EVENT-DRIVEN PATTERN (`lib/services/event-bus/`, `lib/services/event-store/`)
- Publish events for cross-module communication
- Subscribe to events
- CQRS for read/write separation
- Real-time connectivity support

### 5. AGENT ORCHESTRATION (`lib/services/agents/`)
- Specialized agents for different tasks
- Agent workflows
- Memory & learning capabilities
- Human-AI collaboration (5IR)

### 6. EVIDENCE & LINEAGE (`lib/services/evidence/`)
- Track data lineage
- Chain of custody
- Integrity verification

### 7. INTEGRATION PATTERNS
- API Gateway pattern (`middleware/apiGateway.ts`)
- Webhook handlers (`lib/services/webhooks/`)
- EDI adapters (`app/integration/edi/`)
- IoT device adapters (when needed)

---

## ✅ BEFORE IMPLEMENTING ANY FEATURE - CHECKLIST

**ALWAYS complete this checklist before implementing:**

### Architecture & Design
□ 1. Searched codebase for similar implementations (avoid duplication)
□ 2. Identified correct module placement (check `lib/modules/`)
□ 3. Considered if this is platform-level or module-specific
□ 4. Designed service layer architecture (`lib/services/`)
□ 5. Defined TypeScript interfaces/types (`types/`)
□ 6. Designed database schema (Prisma models)
□ 7. Planned database migrations

### Security & Quality
□ 8. Considered security implications (SECURITY.md)
□ 9. Planned error handling & fallbacks
□ 10. Considered multi-tenant isolation
□ 11. Planned RBAC integration (11 roles)
□ 12. Planned input validation
□ 13. Planned error boundaries

### Integration & Connectivity
□ 14. Considered Event Bus integration (if applicable)
□ 15. Designed for flexibility & extensibility
□ 16. Planned integration with existing services/modules
□ 17. Ensured cross-module compatibility (if applicable)
□ 18. INTEGRATION: Designed API-first with external connectivity in mind
□ 19. INTEGRATION: Considered webhook/event support
□ 20. INTEGRATION: Planned for ERP/IoT/third-party integrations
□ 21. CONNECTIVITY: Considered real-time communication needs
□ 22. CONNECTIVITY: Planned for edge computing support (if applicable)

### Testing & Production
□ 23. Planned unit tests (Jest, 80%+ coverage)
□ 24. Planned integration tests (60%+ coverage)
□ 25. Planned E2E tests (critical flows)
□ 26. Planned production deployment
□ 27. Planned Docker setup
□ 28. Planned environment variables

### 4IR & 5IR Alignment
□ 29. 4IR ALIGNMENT: Considered IoT/AI/ML/Big Data implications
□ 30. 4IR ALIGNMENT: Planned for automation and cyber-physical systems
□ 31. 5IR ALIGNMENT: Considered human-centric AI and collaboration
□ 32. 5IR ALIGNMENT: Planned for sustainability and ethical AI
□ 33. LATEST TRENDS: Researched latest trends for this capability/feature
□ 34. LATEST TRENDS: Aligned implementation with industry best practices

---

## 🔒 SECURITY CHECKLIST (ALWAYS REVIEW)

**Before implementing, verify:**

□ No API keys in code (use environment variables)
□ Input validation on all inputs
□ Output sanitization
□ Authentication checks
□ Authorization checks (RBAC)
□ Tenant isolation enforced (ALWAYS filter by tenantId)
□ SQL injection prevention (Prisma handles this, but verify)
□ XSS prevention
□ CSRF protection
□ Rate limiting considered
□ Error messages don't leak sensitive info
□ Audit logging for sensitive operations
□ Data encryption considered
□ Secure password handling (if applicable)
□ Quantum-safe cryptography (5IR alignment)
□ Zero-trust security model

---

## 🚀 PRODUCTION-READY REQUIREMENTS

### Code Quality Checklist

**EVERY feature MUST:**
- [ ] **TypeScript**: Full type safety, no `any`
- [ ] **Error Handling**: Try/catch, error boundaries
- [ ] **Input Validation**: All inputs validated
- [ ] **Security**: Auth, RBAC, tenant isolation
- [ ] **Performance**: Optimized queries, caching
- [ ] **Logging**: Proper logging for debugging
- [ ] **Documentation**: JSDoc comments
- [ ] **Testing**: Unit + Integration tests (80%+ coverage)
- [ ] **Database**: Prisma models + migrations
- [ ] **API**: RESTful, proper status codes
- [ ] **UI**: Responsive, accessible
- [ ] **Integration**: Events, navigation, permissions

### Production Deployment Checklist

**EVERY feature MUST be:**
- [ ] **Docker-ready**: Works in containers
- [ ] **Environment-aware**: Uses env variables
- [ ] **Database-migrated**: Migrations applied
- [ ] **Tested**: All tests passing
- [ ] **Monitored**: Logging/metrics ready
- [ ] **Secure**: No secrets in code
- [ ] **Scalable**: Handles load
- [ ] **Documented**: README/comments

---

## 📝 REMEMBER

- BlueDXP is the PLATFORM - Hazalyze is a MODULE within it (purpose TBD)
- This is NOT a simple CRUD app - it's an enterprise platform
- Every feature affects the entire platform and other modules
- Think in layers, not just pages
- Security is not optional - it's mandatory
- Flexibility enables future growth
- Deep architecture prevents tech debt
- INTEGRATION-FIRST: Always design with integration and connectivity in mind
- 4IR & 5IR ALIGNED: Always consider latest industrial revolution trends
- PRODUCTION-READY: Always include database, testing, and full tech stack
- STEP-BY-STEP: Always explain in simple terms for non-technical users
- Consider everything - security, performance, scalability, maintainability, integration, connectivity
- Document decisions and trade-offs
- Follow existing patterns - consistency is key
- When working on Hazalyze, remember it's part of BlueDXP platform ecosystem
- Hazalyze module purpose/functionality is still being determined - keep flexible
- Research latest trends for each capability before implementation
- Design for connectivity, interoperability, and future industrial revolution alignment

---

**This is your complete, production-ready rule set. Every build will include database, testing, full tech stack, and step-by-step guidance!** 🚀











