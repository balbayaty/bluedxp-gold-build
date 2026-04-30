# 🏗️ Complete Layer Interaction Architecture
## BlueDXP Platform - Layer Stack (L0-L5 + Lx) with Logic, Rules & Data Flows

**Version**: 1.0  
**Date**: 2025-01-27  
**Based on**: BlueDXP Architecture v7 + Current Implementation

---

## 📋 Table of Contents

1. [Layer Stack Overview](#layer-stack-overview)
2. [Layer Interactions & Data Flows](#layer-interactions--data-flows)
3. [Business Rules & Logic](#business-rules--logic)
4. [AI Agents & Knowledge Base Integration](#ai-agents--knowledge-base-integration)
5. [Event Flow Architecture](#event-flow-architecture)
6. [Module-to-Layer Mapping](#module-to-layer-mapping)
7. [Cross-Layer Rules & Constraints](#cross-layer-rules--constraints)
8. [Security & Multi-Tenancy (Lx)](#security--multi-tenancy-lx)
9. [Implementation Patterns](#implementation-patterns)

---

## 🎯 Layer Stack Overview

### Core Layer Stack (L0-L5 + Lx)

```
┌─────────────────────────────────────────────────────────────┐
│                    L5: EXPERIENCE LAYER                     │
│  Dashboards, Mobile, WhatsApp, Portal, Marketplace, APIs     │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              L4: AI & INTELLIGENCE LAYER                      │
│  Model Router, Arabic NLP, RAG, MCP, MLOps, Agents           │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              L3: DOMAIN MODULES LAYER                         │
│  Compliance OS, Corridor Intel, Carrier Mgmt, Finance     │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              L2: ORCHESTRATION LAYER                          │
│  Workflow Engine, Sagas, Retries, Approvals, Handoffs        │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              L1: EVENT BUS LAYER                             │
│  Canonical Event Mesh: LOG.*, FIN.*, COMP.*, GEO.*, etc.     │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              L0: EVIDENCE LEDGER LAYER                        │
│  Immutable Audit Trail: actor, policy_id, correlation_id   │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              Lx: CROSS-CUTTING LAYER                          │
│  Security, Identity, Observability, Multi-Tenancy, Config    │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Name | Responsibility | Key Components |
|-------|------|----------------|----------------|
| **Lx** | Cross-Cutting | Security, Identity, Observability, Multi-Tenancy | Auth, RBAC, Logging, Metrics, Config |
| **L0** | Evidence Ledger | Immutable audit trail | Evidence Service, Chain of Custody, Validation |
| **L1** | Event Bus | Canonical event mesh | RabbitMQ, Event Store, Event Bus Service |
| **L2** | Orchestration | Workflow engine, sagas | Process Orchestrator, Workflow Service, Saga Manager |
| **L3** | Domain Modules | Business logic | WMS, TMS, Compliance, Finance, MaaS |
| **L4** | AI & Intelligence | AI/ML capabilities | Agent Orchestrator, Knowledge Base, ML Registry |
| **L5** | Experience | User interfaces | Dashboards, Mobile, APIs, Portal |

---

## 🔄 Layer Interactions & Data Flows

### 1. Standard Request Flow (L5 → L0)

```
┌─────────────────────────────────────────────────────────────┐
│  L5: User Action (Dashboard/API/Mobile)                     │
│  • User clicks "Create Shipment"                            │
│  • API receives POST /api/shipments                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Lx: Security & Multi-Tenancy Check                         │
│  • Authenticate user (JWT/OAuth2)                           │
│  • Authorize action (RBAC: 11 roles)                        │
│  • Extract tenantId from context                             │
│  • Validate input (sanitization, validation)                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L3: Domain Module Processing                               │
│  • TMS Module: createShipment()                             │
│  • Business rules validation                                │
│  • Data transformation                                       │
│  • State management                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L2: Orchestration                                           │
│  • Process Orchestrator coordinates                          │
│  • Workflow execution (if configured)                         │
│  • Saga pattern (if distributed transaction)                │
│  • Retry logic (if needed)                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L1: Event Publishing                                        │
│  • Publish event: SHIPMENT.CREATED                          │
│  • Event Bus: RabbitMQ                                      │
│  • Event Store: Append to log                                │
│  • Correlation ID generated                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L0: Evidence Ledger                                         │
│  • Record immutable evidence                                 │
│  • Hash payload (SHA-256)                                    │
│  • Store: actor, policy_id, correlation_id, timestamp        │
│  • Chain of custody                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: AI Processing (Async)                                    │
│  • Agent Orchestrator: Analyze shipment                      │
│  • Knowledge Base: Semantic search for patterns               │
│  • ML Models: Predict risks, optimize routes                 │
│  • Write insights to L0 (Evidence)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L1: Event Notification                                      │
│  • Notify subscribers (L3 modules, L5 dashboards)           │
│  • Real-time updates via WebSocket                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L5: UI Update                                               │
│  • Dashboard refresh                                         │
│  • Mobile notification                                       │
│  • API response returned                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2. AI Agent Flow (L4 → L0 → L4)

```
┌─────────────────────────────────────────────────────────────┐
│  L4: Agent Orchestrator Receives Task                       │
│  • Task: "Optimize putaway location"                        │
│  • Input: { materialId, quantity, warehouseId }             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: Agent Memory Recall                                    │
│  • Search short-term memory (100 items)                     │
│  • Search long-term memory (1000 items)                     │
│  • Find similar past tasks                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: Knowledge Base Semantic Search                         │
│  • Generate query embedding                                 │
│  • Search tenant knowledge base                              │
│  • Find similar patterns (cosine similarity)                │
│  • Retrieve relevant knowledge entries                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: Agent Execution                                         │
│  • Agent processes task with context                         │
│  • Uses retrieved knowledge                                 │
│  • Generates recommendation                                 │
│  • Confidence score calculated                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L0: Evidence Ledger (AI Output)                            │
│  • Record: AI decision made                                 │
│  • Store: agent_id, confidence, reasoning                    │
│  • Hash: decision payload                                   │
│  • Policy: AI_GOVERNANCE_POLICY                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L4: Learning & Memory Update                               │
│  • Store result in Agent Memory                             │
│  • If high confidence (≥70%): Store in Knowledge Base         │
│  • Generate embedding for knowledge entry                    │
│  • Update agent performance metrics                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L1: Event Publishing                                        │
│  • Publish: AI.AGENT_TASK_COMPLETED                         │
│  • Include: taskId, agentId, result, confidence             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L3: Domain Module Receives Result                          │
│  • WMS Module: Apply putaway recommendation                  │
│  • Update inventory location                                 │
└─────────────────────────────────────────────────────────────┘
```

### 3. Event-Driven Flow (L1 → All Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  L1: Event Published                                        │
│  • Event: SHIPMENT.STATUS_CHANGED                           │
│  • Namespace: LOG.*                                          │
│  • Payload: { shipmentId, oldStatus, newStatus }            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  L1: Event Bus Distribution                                 │
│  • RabbitMQ: Route to queues                                │
│  • Subscribers receive event                                │
│  • Dead Letter Queue (if processing fails)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  L3: TMS       │   │  L4: AI       │   │  L5: Dashboard│
│  Module        │   │  Agent        │   │  Update       │
│  • Update      │   │  • Analyze    │   │  • Refresh    │
│    tracking    │   │    pattern    │   │    UI         │
└───────────────┘   └───────────────┘   └───────────────┘
        ↓                     ↓                     ↓
┌─────────────────────────────────────────────────────────────┐
│  L0: Evidence Ledger (All Actions)                          │
│  • Each subscriber writes evidence                           │
│  • Correlation ID links all actions                         │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Business Rules & Logic

### Rule Categories

#### 1. Security Rules (Lx Layer)

```typescript
// Authentication Rules
- JWT token must be valid and not expired
- OAuth2 tokens must be refreshed before expiry
- API keys must be active and not revoked
- MFA required for sensitive operations (P1/P2)

// Authorization Rules (RBAC - 11 Roles)
- SYSTEM_ADMIN: Full access to all modules
- BD_MANAGER: Business development view only
- WAREHOUSE_HEAD: Warehouse operations + reports
- OPERATIONS_MANAGER: Operations + analytics
- ACCOUNT_MANAGER: Customer accounts + limited WMS
- SUPERVISOR: Team management + task execution
- OPERATOR: Task execution only
- QUALITY_MANAGER: Quality control + inspections
- INVENTORY_SPECIALIST: Inventory management
- CUSTOMER_USER: Read-only customer view
- CUSTOMER_ADMIN: Customer admin (limited)

// Multi-Tenancy Rules
- All queries MUST filter by tenantId
- Cross-tenant data access is BLOCKED
- Tenant isolation enforced at database level
- Shared resources (warehouses) require explicit permission
```

#### 2. Evidence Ledger Rules (L0)

```typescript
// Immutability Rules
- Evidence records CANNOT be modified or deleted
- Only append operations allowed
- Hash verification on read
- Chain of custody must be maintained

// Required Fields
- actor: string (user ID or system)
- policy_id: string (governing policy)
- correlation_id: string (links related events)
- timestamp: ISO 8601
- payload_hash: SHA-256 hash

// Validation Rules
- Payload hash must match stored hash
- Timestamp must be sequential (within tolerance)
- Actor must be authenticated user or system service
```

#### 3. Event Bus Rules (L1)

```typescript
// Event Naming Convention
- Format: NAMESPACE.ENTITY.ACTION
- Namespaces: LOG.*, FIN.*, DLT.*, COMP.*, GEO.*, CARRIER.*
- Examples: LOG.SHIPMENT.CREATED, FIN.INVOICE.PAID

// Event Schema Rules
- Must conform to JSON Schema/Avro schema
- Versioning: Semver (v1.0.0)
- Backward compatibility required
- Breaking changes require new version

// Delivery Rules
- At-least-once delivery guarantee
- Retry: 3 attempts with exponential backoff
- Dead Letter Queue after 3 failures
- Idempotency key required for critical events
```

#### 4. Orchestration Rules (L2)

```typescript
// Workflow Rules
- Workflows must be idempotent
- Retry logic: Exponential backoff (max 3 retries)
- Timeout: Configurable per workflow step
- Failure handling: Rollback or compensation

// Saga Pattern Rules
- Distributed transactions use saga pattern
- Each step must be reversible (compensation)
- Saga coordinator tracks state
- Failure triggers compensation chain

// Approval Rules
- Multi-step approvals based on amount/risk
- Escalation: Auto-escalate after timeout
- Delegation: Approver can delegate
- Audit trail: All approvals logged to L0
```

#### 5. Domain Module Rules (L3)

```typescript
// WMS Rules
- Putaway: Must assign valid storage location
- Picking: FEFO/LIFO based on material type
- Cycle Count: Must reconcile discrepancies
- Transfer: Must validate source and destination

// TMS Rules
- Shipment: Must have valid carrier
- Route: Must optimize for cost/time
- POD: Must capture signature/image
- Tracking: Real-time GPS updates required

// Compliance Rules
- Regulatory: Must check all applicable regulations
- Documents: Must be valid and not expired
- Risk: Must assess risk before approval
- Audit: Must maintain audit trail
```

#### 6. AI & Intelligence Rules (L4)

```typescript
// AI Governance Rules
- All L4 outputs MUST write to L0 (Evidence)
- Human override available for all AI decisions
- Confidence threshold: <70% requires human review
- Model versioning: Track which model made decision

// Agent Rules
- Agent actions require approval if configured
- Rate limiting: Max actions per hour per agent
- Capability matching: Agent must have required capability
- Memory limits: Short-term (100), Long-term (1000)

// Knowledge Base Rules
- Tenant isolation: Knowledge entries scoped to tenant
- Federated learning: Opt-in only, anonymized
- Embedding generation: OpenAI API or fallback
- Semantic search: Cosine similarity threshold (0.7)

// ML Model Rules
- Model registry: All models must be registered
- A/B testing: Required before production deployment
- Drift detection: Monitor model performance
- Retraining: Triggered by performance degradation
```

#### 7. Experience Layer Rules (L5)

```typescript
// API Rules
- Rate limiting: Per tier (Free → Enterprise)
- Versioning: URL-based (/api/v1/)
- Authentication: Required for all endpoints
- CORS: Configured per origin

// Dashboard Rules
- Real-time updates: WebSocket connection
- Caching: 5-minute TTL for aggregates
- Pagination: Max 100 items per page
- Filtering: Tenant-scoped by default

// Mobile Rules
- Offline mode: Queue actions, sync when online
- Push notifications: Opt-in required
- Data sync: Incremental sync on connect
```

---

## 🤖 AI Agents & Knowledge Base Integration

### Agent Orchestrator Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              AGENT ORCHESTRATOR (L4)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Agent Registry                                    │    │
│  │  • Register agents with capabilities               │    │
│  │  • Route tasks to appropriate agents               │    │
│  │  • Manage agent lifecycle                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Agent Memory                                      │    │
│  │  • Short-term: 100 recent items                    │    │
│  │  • Long-term: 1000 persistent items              │    │
│  │  • Conversation context                           │    │
│  │  • Performance metrics                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Knowledge Base Integration                        │    │
│  │  • Semantic search                                │    │
│  │  • Vector embeddings                              │    │
│  │  • RAG (Retrieval-Augmented Generation)           │    │
│  │  • Federated learning                             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Learning Engine                                   │    │
│  │  • Learn from success/failure                     │    │
│  │  • Store patterns in Knowledge Base                │    │
│  │  • Share insights (federated)                      │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Knowledge Base Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Agent Executes Task                                 │
│  • Task: "Optimize putaway for hazmat material"              │
│  • Agent: Safety Analysis Agent                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Agent Memory Recall                                │
│  • Search: "hazmat putaway"                                 │
│  • Find: Similar past tasks                                  │
│  • Retrieve: Previous recommendations                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Knowledge Base Semantic Search                     │
│  • Query: "hazmat storage requirements"                      │
│  • Generate: Embedding (1536 dimensions)                     │
│  • Search: Tenant knowledge base                            │
│  • Find: Relevant regulations, best practices               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Agent Generates Recommendation                      │
│  • Combine: Memory + Knowledge Base results                │
│  • Generate: Optimized putaway location                      │
│  • Confidence: 85%                                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Write to L0 (Evidence)                              │
│  • Record: AI decision                                      │
│  • Store: agent_id, confidence, reasoning                   │
│  • Policy: AI_GOVERNANCE_POLICY                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Learning & Storage                                 │
│  • Store in Agent Memory (long-term)                        │
│  • If confidence ≥70%: Store in Knowledge Base              │
│  • Generate: Knowledge entry with embedding                 │
│  • Category: chemical_safety, risk_assessment                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Federated Learning (Optional)                       │
│  • If tenant opted in: Share anonymized insight            │
│  • Remove: Tenant-specific data                             │
│  • Share: Pattern, not data                                │
└─────────────────────────────────────────────────────────────┘
```

### Agent Capabilities & Routing

```typescript
// Agent Capability Matching
interface AgentCapability {
  id: string
  name: string
  categories: KnowledgeCategory[]
  confidenceThreshold?: number // Min confidence to use
  priority?: number // Higher = preferred
}

// Task Routing Logic
1. Check if preferredAgent specified → Use if available
2. Find agents with requiredCapabilities
3. Filter by confidenceThreshold
4. Select highest priority agent
5. If no match → Human escalation

// Example: Putaway Optimization
Task: {
  type: 'optimize_putaway',
  requiredCapabilities: ['hazard-analysis', 'compliance-check'],
  input: { materialId: 'MAT-001', warehouseId: 'WH-001' }
}

Routing:
1. Safety Agent has 'hazard-analysis' ✅
2. Safety Agent has 'compliance-check' ✅
3. Confidence threshold: 70% ✅
4. Priority: 90 (high) ✅
5. Route to Safety Agent
```

---

## 📡 Event Flow Architecture

### Event Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. Event Generation (L3 Domain Module)                      │
│     • Business event occurs (e.g., shipment created)        │
│     • Domain module generates event                          │
│     • Event payload constructed                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Event Validation (L1 Event Bus)                         │
│     • Schema validation (JSON Schema/Avro)                   │
│     • Required fields check                                  │
│     • Tenant isolation check                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Event Publishing (L1 Event Bus)                         │
│     • Publish to RabbitMQ                                    │
│     • Route to appropriate queue                            │
│     • Generate correlation ID                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Event Storage (L1 Event Store)                          │
│     • Append to event log                                    │
│     • Store in Event Store (CQRS)                            │
│     • Create projection (if needed)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. Evidence Recording (L0 Evidence Ledger)                  │
│     • Record immutable evidence                              │
│     • Hash payload                                           │
│     • Store correlation ID                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  6. Event Distribution (L1 Event Bus)                        │
│     • Notify all subscribers                                 │
│     • L3 modules process event                               │
│     • L4 AI agents analyze event                             │
│     • L5 dashboards update UI                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Event Processing (Subscribers)                          │
│     • Each subscriber processes independently                │
│     • Idempotency handled                                    │
│     • Errors → Dead Letter Queue                             │
└─────────────────────────────────────────────────────────────┘
```

### Event Namespaces

```typescript
// Event Namespace Convention
LOG.*     - Logistics events (shipments, orders, inventory)
FIN.*     - Financial events (invoices, payments, billing)
DLT.*     - Distributed Ledger events (tokenization, proofs)
COMP.*    - Compliance events (regulations, audits, violations)
GEO.*     - Geofence events (entrance, exit, alerts)
CARRIER.* - Carrier events (tracking, POD, performance)
AI.*      - AI events (agent tasks, model predictions)
SYS.*     - System events (health, errors, maintenance)
```

### Event Schema Example

```typescript
interface DomainEvent {
  id: string // Unique event ID
  type: string // Event type (e.g., "LOG.SHIPMENT.CREATED")
  aggregateId: string // Entity ID
  aggregateType: string // Entity type (e.g., "Shipment")
  version: number // Event version
  timestamp: string // ISO 8601
  metadata: {
    tenantId: string
    userId?: string
    correlationId: string
    causationId?: string
  }
  payload: Record<string, any> // Event-specific data
}
```

---

## 🗺️ Module-to-Layer Mapping

### L3: Domain Modules

| Module | Layer | Primary Functions | Integrations |
|-------|-------|-------------------|--------------|
| **WMS** | L3 | Inventory, Putaway, Picking, Cycle Count | L2 (Orchestration), L4 (AI), L1 (Events) |
| **TMS** | L3 | Shipments, Routes, Carriers, POD | L2 (Orchestration), L4 (AI), L1 (Events) |
| **Compliance** | L3 | Regulations, Audits, Risk, Documents | L2 (Orchestration), L4 (AI), L0 (Evidence) |
| **Finance** | L3 | Invoicing, Payments, Billing | L2 (Orchestration), L1 (Events) |
| **Quality** | L3 | Inspections, NCR, CAPA, Certificates | L2 (Orchestration), L4 (AI), L0 (Evidence) |
| **ISO IMS** | L3 | ISO Standards, Documents, Training | L2 (Orchestration), L4 (AI), L0 (Evidence) |

### L4: AI & Intelligence Modules

| Component | Layer | Primary Functions | Integrations |
|-----------|-------|-------------------|--------------|
| **Agent Orchestrator** | L4 | Task routing, agent coordination | L0 (Evidence), L1 (Events), Knowledge Base |
| **Knowledge Base** | L4 | Semantic search, embeddings, RAG | L0 (Evidence), Agent Memory |
| **ML Registry** | L4 | Model management, training, A/B testing | L0 (Evidence), L1 (Events) |
| **Agent Memory** | L4 | Short/long-term memory, learning | Knowledge Base, L0 (Evidence) |

### L2: Orchestration Components

| Component | Layer | Primary Functions | Integrations |
|-----------|-------|-------------------|--------------|
| **Process Orchestrator** | L2 | Lifecycle, workflow, process mining | L1 (Events), L3 (Modules), L0 (Evidence) |
| **Workflow Engine** | L2 | Workflow execution, approvals | L1 (Events), L3 (Modules) |
| **Saga Manager** | L2 | Distributed transactions | L1 (Events), L3 (Modules) |

---

## 🔒 Cross-Layer Rules & Constraints

### Data Flow Constraints

```typescript
// Rule 1: All L4 outputs MUST write to L0
- AI decisions, predictions, recommendations
- Model outputs, agent actions
- Knowledge base updates (high confidence)

// Rule 2: All L3 actions MUST publish to L1
- Domain events for all state changes
- Business events for cross-module communication
- Integration events for external systems

// Rule 3: All L5 requests MUST pass through Lx
- Authentication required
- Authorization checked
- Tenant isolation enforced
- Input validation performed

// Rule 4: L0 is append-only
- No updates or deletes
- Immutability guaranteed
- Hash verification on read
- Chain of custody maintained

// Rule 5: L1 events MUST have correlation ID
- Links related events
- Enables event tracing
- Required for debugging
- Used in evidence chain
```

### Security Constraints

```typescript
// Multi-Tenancy
- All queries filter by tenantId
- Cross-tenant access blocked
- Shared resources require permission
- Tenant data encrypted at rest

// Authentication
- JWT tokens: 15min expiry, refresh required
- OAuth2: Token refresh before expiry
- API keys: Rotated quarterly
- MFA: Required for P1/P2 operations

// Authorization
- RBAC: 11 roles with specific permissions
- ABAC: Attribute-based for fine-grained control
- Policy-as-Code: OPA for complex rules
- Audit: All auth decisions logged to L0
```

### Performance Constraints

```typescript
// Response Time SLAs
- L5 API: <500ms p99
- L4 AI: <2s for standard tasks
- L3 Domain: <200ms for standard operations
- L1 Events: <100ms publish latency

// Throughput
- L1 Event Bus: 10,000 events/sec
- L0 Evidence: 5,000 writes/sec
- L4 Knowledge Base: 1,000 searches/sec
- L5 Dashboards: 100 concurrent users

// Caching
- Redis: Session, rate limits, hot data
- CDN: Static assets, API responses
- Query cache: 5-minute TTL for aggregates
```

---

## 🔐 Security & Multi-Tenancy (Lx)

### Lx Layer Components

```
┌─────────────────────────────────────────────────────────────┐
│              LX: CROSS-CUTTING LAYER                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Security & Identity                                 │    │
│  │  • Authentication (JWT, OAuth2, API Keys)            │    │
│  │  • Authorization (RBAC, ABAC, Policy-as-Code)      │    │
│  │  • MFA, SSO, SAML                                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Multi-Tenancy                                       │    │
│  │  • Tenant isolation                                  │    │
│  │  • Data segregation                                  │    │
│  │  • Resource quotas                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Observability                                      │    │
│  │  • Logging (Loki)                                   │    │
│  │  • Metrics (Prometheus)                             │    │
│  │  • Tracing (OpenTelemetry)                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Configuration Management                           │    │
│  │  • Feature flags                                   │    │
│  │  • Environment config                               │    │
│  │  • Secrets (Vault)                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Rules

```typescript
// Tenant Isolation
1. All database queries MUST include tenantId filter
2. API requests MUST extract tenantId from context
3. Cross-tenant queries are BLOCKED
4. Shared resources (warehouses) require explicit permission

// Data Segregation
- Database: Row-level security (tenantId column)
- Cache: Key prefix includes tenantId
- Events: TenantId in event metadata
- Files: Tenant-specific S3 buckets

// Resource Quotas
- API rate limits per tenant
- Storage quotas per tenant
- Compute quotas per tenant
- Feature access per tenant tier
```

---

## 🛠️ Implementation Patterns

### Pattern 1: CQRS (Command Query Responsibility Segregation)

```typescript
// Write Side (Command)
L5 → L3 → L2 → L1 → L0
- Commands modify state
- Events published
- Evidence recorded

// Read Side (Query)
L5 → L3 → Read Model (Projection)
- Queries read from projections
- No events published
- Fast read performance
```

### Pattern 2: Event Sourcing

```typescript
// Event Store (L1)
- All state changes as events
- Replay events to rebuild state
- Snapshots for performance
- Event versioning

// Example: Shipment Lifecycle
Events:
1. SHIPMENT.CREATED
2. SHIPMENT.ASSIGNED_TO_CARRIER
3. SHIPMENT.IN_TRANSIT
4. SHIPMENT.DELIVERED

Rebuild state by replaying events
```

### Pattern 3: Saga Pattern (Distributed Transactions)

```typescript
// Saga Coordinator (L2)
1. Start saga
2. Execute step 1 (compensatable)
3. Execute step 2 (compensatable)
4. If failure → trigger compensation
5. Rollback all steps

// Example: Order Fulfillment Saga
Steps:
1. Reserve inventory (compensate: release)
2. Create shipment (compensate: cancel)
3. Charge payment (compensate: refund)
```

### Pattern 4: Retry with Exponential Backoff

```typescript
// Retry Logic (L2)
- Max retries: 3
- Backoff: 1s, 2s, 4s
- Jitter: ±20%
- Dead Letter Queue after max retries

// Idempotency
- Idempotency key required
- Check if already processed
- Return cached result if exists
```

---

## 📊 Summary

### Key Principles

1. **L0 (Evidence Ledger)**: Immutable, append-only, all critical actions recorded
2. **L1 (Event Bus)**: Canonical event mesh, all state changes published
3. **L2 (Orchestration)**: Coordinates workflows, sagas, retries
4. **L3 (Domain Modules)**: Business logic, domain-specific rules
5. **L4 (AI & Intelligence)**: AI agents, knowledge base, ML models
6. **L5 (Experience)**: User interfaces, APIs, dashboards
7. **Lx (Cross-Cutting)**: Security, multi-tenancy, observability

### Data Flow Rules

- **Downward Flow**: L5 → Lx → L3 → L2 → L1 → L0
- **Upward Flow**: L0 → L1 → L2/L3/L4 → L5
- **Lateral Flow**: L1 distributes events to all subscribers
- **AI Flow**: L4 reads from L0/L1, writes to L0, learns in Knowledge Base

### Critical Rules

1. All L4 outputs write to L0 (Evidence)
2. All L3 actions publish to L1 (Events)
3. All L5 requests pass through Lx (Security)
4. L0 is append-only (Immutability)
5. All events have correlation ID (Tracing)
6. All queries filter by tenantId (Multi-tenancy)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Status**: ✅ Complete - Ready for Implementation Reference











