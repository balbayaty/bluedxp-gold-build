# BlueDXP Platform - Cursor Shared Knowledge Rules

> **Purpose**: These rules guide AI assistance to maintain consistency, follow architectural patterns, and improve over time based on actual code interactions. Rules are ADDITIVE - new patterns should be added, not overwrite existing ones.

---

## 🎯 Core Platform Context

### Platform Identity
- **Platform Name**: BlueDXP Platform (Enterprise Intelligence Operating System)
- **Current Module**: Hazalyze (ASN Module) - purpose/functionality TBD, keep flexible
- **Architecture**: Multi-module platform with plugin-based architecture
- **Industrial Revolution Alignment**: Full 4IR & 5IR proof - always consider latest trends
- **Integration-First**: Every feature must be integration-ready from the start

### Key Documents to Reference
- `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md` - Platform vision
- `ARCHITECTURE_MINDMAP.md` - Complete system architecture
- `SECURITY.md` - Security best practices
- `UI_UX_STANDARDS.md` - Frontend standards
- `CONTRIBUTING.md` - Code style & standards

---

## 🏗️ Architectural Patterns (MANDATORY)

### 1. Deep Layer Architecture (ALWAYS)
**NEVER implement features at surface level only.** Always consider all layers:

```
Presentation Layer (UI/Components) → app/, components/
    ↓
Business Logic Layer (Services/Orchestration) → lib/services/
    ↓
Data Layer (Types/Models/Processors) → types/, data/
    ↓
Infrastructure Layer (Adapters/Event Bus/CQRS) → lib/adapters/, lib/services/event-store/
```

**Example Pattern:**
- ❌ **DON'T**: Just create a page component
- ✅ **DO**: Create page → service layer → types → adapters → event handlers

**Reference Files:**
- Service interfaces: `lib/services/*/.*Service.ts` (92+ service directories)
- Module registry: `lib/modules/registry.ts`
- Event bus: `lib/services/event-bus/`
- CQRS: `lib/services/event-store/`

### 2. Service Layer Pattern
**All business logic goes in services, not components.**

**Service Interface Pattern:**
```typescript
// lib/services/[module]/[feature]Service.ts
export interface FeatureService {
  // CRUD Operations
  create(data: Partial<Entity>): Promise<Entity>
  update(id: string, updates: Partial<Entity>): Promise<Entity>
  get(id: string): Promise<Entity | null>
  delete(id: string): Promise<void>
  
  // Business Logic Methods
  // ... specific to feature
}

// Implementation
export const featureService: FeatureService = {
  // ... implementation
}
```

**Key Points:**
- Services expose interfaces (not concrete classes)
- Components call services, never direct APIs
- Services handle all business logic
- Services integrate with Event Bus for cross-module communication
- Services use adapters for external integrations

**Reference Examples:**
- `lib/services/wms/skuService.ts` - SKU management
- `lib/services/qhse/ai/predictiveAnalyticsService.ts` - Predictive analytics
- `lib/services/knowledge-base/` - Knowledge base service

### 3. Module Registry Pattern
**All modules must register with the module registry.**

```typescript
// lib/modules/[module].ts
import { registerModule, ModuleDefinition } from '@/lib/modules/registry'

registerModule({
  id: 'module-id',
  name: 'Module Name',
  description: 'Module description',
  version: '1.0.0',
  category: 'category',
  standalone: true,
  dependencies: [], // Other module IDs
  routes: [...],
  components: [...],
  services: [...],
  enabled: true,
})
```

**Key Points:**
- Check dependencies before enabling
- Modules can be enabled/disabled dynamically
- Module registry manages cross-module awareness
- Reference: `lib/modules/registry.ts`

### 4. Adapter Pattern (Integration-First)
**All external integrations use adapters.**

```typescript
// lib/adapters/[provider]/[Provider]Adapter.ts
import { BaseAdapter } from '@/lib/adapters/base/BaseAdapter'

export class ProviderAdapter implements BaseAdapter {
  readonly id: string
  readonly name: string
  readonly type: 'ERP' | 'TMS' | 'CARRIER' | 'CUSTOMS'
  
  async connect(): Promise<void> { }
  async isConnected(): Promise<boolean> { }
  // ... adapter methods
}
```

**Adapter Types:**
- Transportation: `lib/adapters/transportation/`
- Customs: `lib/adapters/customs/`
- ERP: `lib/adapters/erp/`
- External Integrations: `lib/services/external-integrations/`

**Key Points:**
- Base interface defines contract
- Multiple implementations per adapter type
- Easy to swap implementations
- Integration-ready by design

**Reference Examples:**
- `lib/adapters/transportation/base/TransportationAdapter.ts`
- `lib/adapters/customs/base/CustomsAdapter.ts`

### 5. Event-Driven Architecture
**Use Event Bus for cross-module communication.**

```typescript
import { eventBus } from '@/lib/services/event-bus'

// Publish event
await eventBus.publish('module.event', {
  entityId: '...',
  data: { ... }
})

// Subscribe to event
eventBus.subscribe('module.event', (event) => {
  // Handle event
})
```

**Key Points:**
- Events decouple modules
- CQRS pattern for read/write separation
- Event Store for event sourcing
- Real-time connectivity support

**Reference:**
- `lib/services/event-bus/`
- `lib/services/event-store/`

---

## 🔒 Security Patterns (MANDATORY)

### Security Checklist (ALWAYS REVIEW)
Before implementing ANY feature:
- [ ] No API keys in code (use environment variables)
- [ ] Input validation on all inputs
- [ ] Output sanitization
- [ ] Authentication checks
- [ ] Authorization checks (RBAC - 11 roles)
- [ ] Tenant isolation enforced
- [ ] SQL injection prevention (if using SQL)
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting considered
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging for sensitive operations

**Reference:** `SECURITY.md`

### Authentication & Authorization
```typescript
// Use AuthContext for permissions
import { useAuth } from '@/contexts/AuthContext'

const { hasModuleAccess, hasFeatureAccess, canPerformAction } = useAuth()

// Check permissions
if (!hasModuleAccess('wms', 'full')) {
  return <Unauthorized />
}

if (!canPerformAction('wms', 'inventory', 'stock', 'edit')) {
  return <Unauthorized />
}
```

**Key Points:**
- 11 roles defined in `types/user.ts`
- Hierarchical permissions (Module → Feature → Tab → Action)
- View Context System (Customer/Warehouse/Combined)
- Multi-tenant isolation

**Reference:** `contexts/AuthContext.tsx`, `types/user.ts`, `utils/permissions.ts`

---

## 🎨 UI/UX Patterns (MANDATORY)

### Component Structure
**Follow UI_UX_STANDARDS.md for all components.**

**Page Header Pattern:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0 mt-0.5">
      <i className={`${icon} text-white text-lg sm:text-xl`}></i>
    </div>
    <div className="min-w-0 flex-1">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
        {title}
      </h1>
      <p className="text-[#9ca3af] text-sm sm:text-base leading-relaxed">
        {description}
      </p>
    </div>
  </div>
  {actions && (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
      {actions}
    </div>
  )}
</div>
```

**Card Pattern:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all"
>
  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
    <i className="ri-icon-line text-cyan-400"></i>
    Title
  </h3>
  {/* Content */}
</motion.div>
```

**Key Points:**
- Dark theme: `bg-[#1f2937]` (gray-800)
- Cards: `bg-white/5 backdrop-blur-xl border border-white/10`
- Primary accent: `text-cyan-400` / `bg-cyan-500`
- Responsive: Always use `sm:`, `md:`, `lg:` breakpoints
- Animations: Framer Motion for page transitions

**Reference:** `UI_UX_STANDARDS.md`

### Error Handling in UI
**Always use Error Boundaries and proper error handling.**

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary fallback={<CustomFallback />}>
  <YourComponent />
</ErrorBoundary>
```

**Error Hook Pattern:**
```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler'

const { handleError, clearError, errorState } = useErrorHandler({
  module: 'wms',
  service: 'inventory',
  showUserMessage: true,
})

try {
  await service.doSomething()
} catch (error) {
  handleError(error, { context: 'additional context' })
}
```

**Reference:**
- `components/ErrorBoundary.tsx`
- `hooks/useErrorHandler.ts`
- `app/error.tsx` (Next.js error page)

---

## 📝 TypeScript Patterns

### Type Definitions
**All types go in `types/` directory.**

```typescript
// types/[feature].ts
export interface Entity {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  // ... fields
}

export interface EntitySearchFilters {
  name?: string
  status?: EntityStatus
  // ... filters
}

export interface EntityService {
  create(data: Partial<Entity>): Promise<Entity>
  // ... service methods
}
```

**Key Points:**
- Never use `any` - use `unknown` if needed
- Define interfaces for all data structures
- Export types for reusability
- Use enums for constants
- Service interfaces in same file or separate

**Reference:** `types/` directory (100+ type files)

### Service Interface Pattern
**Every service must have a TypeScript interface.**

```typescript
// Service interface
export interface FeatureService {
  // Methods with proper types
  create(data: Partial<Entity>): Promise<Entity>
  update(id: string, updates: Partial<Entity>): Promise<Entity>
  get(id: string): Promise<Entity | null>
  delete(id: string): Promise<void>
}

// Service implementation
export const featureService: FeatureService = {
  async create(data) {
    // Implementation
  },
  // ... other methods
}
```

---

## 🔌 Integration Patterns

### API-First Design
**Every feature must be integration-ready.**

**API Route Pattern:**
```typescript
// app/api/[module]/[feature]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { featureService } from '@/lib/services/[module]/featureService'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    // Authorization check
    // Input validation
    const result = await featureService.get(...)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- RESTful API endpoints
- GraphQL support considered
- WebSocket/SSE for real-time
- Webhook support for external notifications
- EDI compatibility (if applicable)
- ERP integration capabilities
- IoT device connectivity
- Third-party service integration

**Reference:**
- `app/api/` directory
- `lib/services/webhooks/`
- `lib/adapters/` for external integrations

### Webhook Pattern
```typescript
// lib/services/webhooks/webhookService.ts
export interface WebhookService {
  registerWebhook(config: WebhookConfig): Promise<Webhook>
  triggerWebhook(webhookId: string, payload: any): Promise<void>
  // ... webhook methods
}
```

---

## 🚀 4IR & 5IR Alignment

### 4IR Capabilities (ALWAYS CONSIDER)
- **IoT Integration**: Sensors, RFID, barcode scanners, GPS trackers
- **AI/ML**: Predictive analytics, anomaly detection, computer vision
- **Big Data**: Large-scale data processing, real-time analytics
- **Cloud Computing**: Cloud-native, edge computing support
- **Cyber-Physical Systems**: Real-time monitoring and control
- **Automation**: RPA readiness, automated workflows

### 5IR Capabilities (ALWAYS CONSIDER)
- **Human-Centric AI**: Human-AI collaboration, augmented intelligence
- **Sustainability**: Carbon footprint tracking, ESG compliance
- **AR/VR**: Digital twin visualization, immersive experiences
- **Edge Computing**: Distributed processing, low-latency
- **Quantum-Ready**: Future-proof architecture
- **Personalization**: Adaptive interfaces, context-aware systems

**Reference:** `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md`

---

## 📁 File Organization

### Directory Structure
```
app/                    # Next.js App Router pages
  ├── [module]/        # Module-specific pages
  └── api/             # API routes

components/            # React components
  ├── [module]/        # Module-specific components
  └── shared/          # Shared components

lib/
  ├── services/        # Business logic services
  │   └── [module]/    # Module services
  ├── adapters/        # External integration adapters
  ├── modules/         # Module registry
  └── utils/           # Utility functions

types/                 # TypeScript type definitions
contexts/              # React contexts
hooks/                 # Custom React hooks
utils/                 # Utility functions
data/                  # Mock data and generators
```

**Key Points:**
- Group by feature, not by type
- Co-locate related files
- Use index files for exports
- One component per file
- Services in `lib/services/[module]/`

---

## ✅ Pre-Implementation Checklist

Before implementing ANY feature, verify:

### Architecture
- [ ] Searched codebase for similar implementations (avoid duplication)
- [ ] Identified correct module placement (check `lib/modules/`)
- [ ] Designed service layer architecture (`lib/services/`)
- [ ] Defined TypeScript interfaces/types (`types/`)
- [ ] Considered Event Bus integration (if applicable)
- [ ] Planned for flexibility & extensibility

### Security
- [ ] Input validation planned
- [ ] Authentication/authorization checks
- [ ] Tenant isolation considered
- [ ] No API keys in code
- [ ] Error messages don't leak sensitive info

### Integration
- [ ] API-first design
- [ ] Webhook support considered
- [ ] ERP/IoT/third-party integrations planned
- [ ] Real-time communication needs considered

### 4IR/5IR
- [ ] IoT integration considered (if applicable)
- [ ] AI/ML capabilities integrated (if applicable)
- [ ] Human-AI collaboration features (if applicable)
- [ ] Sustainability metrics (if applicable)

### UI/UX
- [ ] Follows UI_UX_STANDARDS.md
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility (ARIA labels, keyboard navigation)

---

## 🔄 Self-Updating Rules

### Pattern Discovery
When you notice recurring patterns in actual code interactions:

1. **Identify the Pattern**: What common approach is being used?
2. **Document the Pattern**: Add to this file in appropriate section
3. **Reference Examples**: Include file paths to examples
4. **Make it Actionable**: Clear guidance on when/how to use

### Rule Evolution
- **ADD new patterns** - Don't overwrite existing rules
- **REFINE existing rules** - Update with better examples
- **DOCUMENT exceptions** - When to break a rule and why
- **REFERENCE actual code** - Point to real implementations

### Learning from Interactions
Based on actual code interactions, update these rules with:
- Common mistakes to avoid
- Better patterns discovered
- Performance optimizations found
- Security improvements identified
- Integration patterns that work well

---

## 📚 Quick Reference

### Common Service Patterns
- **CRUD Service**: `lib/services/wms/skuService.ts`
- **Analytics Service**: `lib/services/qhse/ai/predictiveAnalyticsService.ts`
- **Integration Service**: `lib/services/external-integrations/integrationManager.ts`
- **Knowledge Service**: `lib/services/knowledge-base/`

### Common Adapter Patterns
- **Transportation**: `lib/adapters/transportation/base/TransportationAdapter.ts`
- **Customs**: `lib/adapters/customs/base/CustomsAdapter.ts`
- **ERP**: `lib/adapters/erp/`

### Common Component Patterns
- **Page Component**: Check `app/[module]/[page]/page.tsx` examples
- **Form Component**: Check `components/[module]/` for form examples
- **Table Component**: Check `components/[module]/` for table examples

### Common Error Patterns
- **Error Boundary**: `components/ErrorBoundary.tsx`
- **Error Hook**: `hooks/useErrorHandler.ts`
- **API Error**: `utils/replaceConsoleLogs.ts`

---

## 🎯 Module-Specific Patterns

### Hazalyze Module (ASN)
- **Purpose**: TBD - keep flexible
- **Location**: Module definition in `lib/modules/` (to be created)
- **Integration**: Must integrate with WMS, TMS, ISO-IMS modules
- **Pattern**: Follow existing module patterns (WMS, TMS, etc.)

### WMS Module
- **Services**: `lib/services/wms/`
- **Components**: `components/warehouse/`
- **Pages**: `app/warehouse/`, `app/inventory/`, `app/orders/`

### TMS Module
- **Services**: `lib/services/transportation/`
- **Adapters**: `lib/adapters/transportation/`
- **Components**: `components/transportation/`

### ISO-IMS Module
- **Services**: `lib/services/qhse/`
- **Components**: `components/qhse/`
- **Integration**: Cross-module compliance tracking

---

## 💡 Best Practices

### Code Quality
- **Type Safety**: Always use TypeScript, avoid `any`
- **Error Handling**: Always handle errors gracefully
- **Performance**: Consider caching, lazy loading, pagination
- **Testing**: Write tests for complex logic
- **Documentation**: Add JSDoc comments for complex functions

### Development Workflow
- **Branch Naming**: `feature/description`, `fix/description`
- **Commit Messages**: `feat(scope): description`
- **Code Review**: All code must be reviewed
- **Linting**: Run `npm run lint` before committing

### Performance
- **Lazy Loading**: Use dynamic imports for large components
- **Caching**: Consider caching strategies for frequently accessed data
- **Pagination**: Always paginate large datasets
- **Debouncing**: Debounce user inputs (search, filters)

---

## 🚨 Common Mistakes to Avoid

### Architecture Mistakes
- ❌ Implementing features at surface level only
- ❌ Putting business logic in components
- ❌ Not using service layer pattern
- ❌ Not registering modules with registry
- ❌ Not using adapters for external integrations

### Security Mistakes
- ❌ Hardcoding API keys
- ❌ Not validating inputs
- ❌ Not checking permissions
- ❌ Leaking sensitive info in error messages
- ❌ Not enforcing tenant isolation

### UI/UX Mistakes
- ❌ Not following UI_UX_STANDARDS.md
- ❌ Not handling errors gracefully
- ❌ Not showing loading states
- ❌ Not making responsive
- ❌ Not adding accessibility features

### TypeScript Mistakes
- ❌ Using `any` type
- ❌ Not defining interfaces
- ❌ Not exporting types
- ❌ Not using proper types for service methods

---

## 📖 Additional Resources

### Documentation Files
- `README.md` - Platform overview
- `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md` - Vision alignment
- `ARCHITECTURE_MINDMAP.md` - Complete architecture
- `SECURITY.md` - Security guidelines
- `UI_UX_STANDARDS.md` - UI/UX standards
- `CONTRIBUTING.md` - Contribution guidelines

### Key Directories
- `lib/services/` - 92+ service directories
- `lib/adapters/` - Integration adapters
- `lib/modules/` - Module registry
- `types/` - Type definitions
- `components/` - React components
- `app/` - Next.js pages

---

**Last Updated**: Based on codebase analysis - should be updated as patterns evolve
**Update Frequency**: After significant architectural changes or pattern discoveries











