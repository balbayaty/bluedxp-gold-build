# Proposals & RFQ Module - Complete Integration Map

## 🔗 Full Ecosystem Interconnection

This document shows **exactly where** the Proposals module connects to the rest of the BlueDXP platform.

---

## 📍 Integration Points

### 1. **Event Bus Integration** (`lib/services/proposals/initialize.ts`)

#### **Subscribes To (Listens for events from other modules):**

```typescript
// WMS Events
eventBus.subscribe('wms.*', ...)                    // All WMS events
eventBus.subscribe('wms.shipment.created', ...)     // Auto-suggest proposals
eventBus.subscribe('wms.inventory.updated', ...)    // Update pricing

// TMS Events  
eventBus.subscribe('tms.*', ...)                    // All TMS events
eventBus.subscribe('tms.quote.created', ...)        // Auto-generate proposals
eventBus.subscribe('tms.shipment.created', ...)     // Link to shipments
eventBus.subscribe('tms.route.optimized', ...)     // Update route info

// CRM Events
eventBus.subscribe('crm.*', ...)                   // All CRM events
eventBus.subscribe('crm.opportunity.created', ...) // Create RFQ
eventBus.subscribe('crm.lead.converted', ...)      // Auto-generate proposal

// Compliance Events
eventBus.subscribe('compliance.*', ...)            // All compliance events
eventBus.subscribe('compliance.approval.approved', ...) // Auto-send proposals
eventBus.subscribe('compliance.approval.rejected', ...) // Notify creator

// Finance Events
eventBus.subscribe('finance.*', ...)              // All finance events
eventBus.subscribe('finance.invoice.created', ...) // Link invoices
eventBus.subscribe('finance.payment.received', ...) // Mark as paid

// Procurement Events
eventBus.subscribe('procurement.*', ...)          // All procurement events
eventBus.subscribe('procurement.requisition.created', ...) // Create RFQ
eventBus.subscribe('procurement.vendor.selected', ...) // Update vendor info

// Marketplace Events
eventBus.subscribe('marketplace.*', ...)          // All marketplace events
eventBus.subscribe('marketplace.booking.created', ...) // Generate proposal
eventBus.subscribe('marketplace.listing.updated', ...) // Update pricing

// QHSE Events
eventBus.subscribe('qhse.*', ...)                  // All QHSE events
eventBus.subscribe('qhse.incident.created', ...)   // Link incidents

// HR Events
eventBus.subscribe('hr.*', ...)                   // All HR events
eventBus.subscribe('hr.employee.assigned', ...)   // Assign to team

// Truth Engine Events
eventBus.subscribe('truth-engine.*', ...)         // All truth engine events
eventBus.subscribe('truth-engine.claim.verified', ...) // Update claims

// RFI Events
eventBus.subscribe('rfi.*', ...)                  // All RFI events
eventBus.subscribe('rfi.submitted', ...)          // Auto-process RFI
eventBus.subscribe('rfi.rfq_generated', ...)      // Track RFQ generation
eventBus.subscribe('rfi.proposal_generated', ...) // Track proposal generation
```

#### **Publishes (Sends events to other modules):**

```typescript
// Proposal Events
'proposals.proposal.created'        // → WMS, TMS, CRM, Finance can react
'proposals.proposal.updated'         // → All modules notified
'proposals.proposal.submitted-for-approval' // → Compliance module
'proposals.proposal.auto-approved'   // → Can trigger auto-send
'proposals.proposal.approval.approved' // → Can trigger auto-send
'proposals.proposal.approval.rejected' // → Notify creator
'proposals.proposal.sent'            // → Tracking, follow-up
'proposals.proposal.viewed'          // → Analytics, engagement
'proposals.proposal.accepted'        // → WMS, TMS, Finance, Contracts
'proposals.proposal.rejected'        // → CRM, Analytics
'proposals.proposal.learned'         // → Self-learning system
'proposals.proposal.deleted'         // → Cleanup, audit

// RFQ Events
'proposals-rfq.rfq.created'          // → CRM, Procurement
'proposals-rfq.rfq.submitted'        // → All modules
'proposals-rfq.rfq.updated'          // → All modules
'proposals-rfq.rfq.deleted'         // → Cleanup

// RFI Events
'rfi.created'                        // → Notifications
'rfi.submitted'                      // → Auto-processing
'rfi.rfq_generated'                  // → RFQ module
'rfi.proposal_generated'             // → Proposal module
```

---

### 2. **Module Registry** (`lib/modules/proposals-rfq.ts`)

**Registered Dependencies:**
```typescript
dependencies: [
  'wms',        // Warehouse Management
  'tms',        // Transportation Management
  'crm',        // Customer Relationship Management
  'compliance', // Compliance & Governance
  'finance',    // Financial Management
  'procurement', // Procurement
  'marketplace' // Marketplace
]
```

**Module Registration:**
- ✅ Registered in `lib/modules/registry.ts`
- ✅ Initialization: `initializeProposalsModule()`
- ✅ Service discovery enabled
- ✅ Route registration complete

---

### 3. **Service Integrations**

#### **A. Enhanced Proposal Service** (`lib/services/proposals/enhancedProposalService.ts`)

**Event Handlers:**
```typescript
// Listens to:
- 'proposals-rfq.rfq.created'
- 'proposals-rfq.rfq.submitted'
- 'compliance.approval.approved'
- 'compliance.approval.rejected'
- 'proposals.proposal.accepted'
- 'proposals.proposal.rejected'
- 'knowledge-base.entry.created'

// Publishes:
- 'proposals.proposal.created'
- 'proposals.proposal.updated'
- 'proposals.proposal.sent'
```

#### **B. Proposal Database Service** (`lib/services/proposals/proposalDatabaseService.ts`)

**Database Integration:**
- ✅ Prisma ORM integration
- ✅ Shared Prisma instance (`@/lib/prisma`)
- ✅ Tenant isolation
- ✅ Event Store persistence

#### **C. Proposal Compliance Integration** (`lib/services/proposals/proposalComplianceIntegration.ts`)

**Compliance Connections:**
- ✅ Governance service integration
- ✅ Approval workflows
- ✅ Regulatory checks
- ✅ Compliance validation

#### **D. Proposal Contract Integration** (`lib/services/proposals/proposalContractIntegration.ts`)

**Contract Connections:**
- ✅ Marketplace contracts
- ✅ Procurement contracts
- ✅ Contract generation from proposals
- ✅ Terms extraction

#### **E. Proposal Liability Integration** (`lib/services/proposals/proposalLiabilityIntegration.ts`)

**Liability Connections:**
- ✅ Liability assessment
- ✅ Risk calculation
- ✅ Insurance integration

#### **F. Proposal Evidence Integration** (`lib/services/proposals/proposalEvidenceIntegration.ts`)

**Evidence Connections:**
- ✅ Evidence service
- ✅ Lineage tracking
- ✅ Chain of custody

---

### 4. **API Integration Points**

#### **A. Simple Create API** (`app/api/proposals/simple-create/route.ts`)

**Integrations:**
```typescript
// Event Bus
await eventBus.publish({
  type: 'proposals.proposal.created',
  payload: { proposalId, ... }
})

// Notification Service
await notificationService.send({
  type: 'success',
  title: 'Proposal Created',
  userId: userId,
  data: { proposalId, actionUrl: `/proposals/${id}/enhanced` }
})

// Database
await proposalDatabaseService.createProposal({ ... })
```

#### **B. Rate Cards API** (`app/api/proposals/rate-cards/route.ts`)

**Used By:**
- Proposal builder (loads rate cards)
- Pricing calculations
- Service catalog

#### **C. Services API** (`app/api/proposals/services/route.ts`)

**Used By:**
- Proposal builder (loads services)
- Service catalog page
- RFQ creation

---

### 5. **Cross-Module Data Flow**

#### **WMS → Proposals**
```
WMS Shipment Created
  ↓
Event: wms.shipment.created
  ↓
Proposals Module Receives
  ↓
Auto-suggest Proposal Generation
  ↓
Proposal Created with WMS Data
```

#### **TMS → Proposals**
```
TMS Quote Created
  ↓
Event: tms.quote.created
  ↓
Proposals Module Receives
  ↓
Auto-generate Proposal from Quote
  ↓
Proposal Created with TMS Route Data
```

#### **CRM → Proposals**
```
CRM Opportunity Created
  ↓
Event: crm.opportunity.created
  ↓
Proposals Module Receives
  ↓
Create RFQ from Opportunity
  ↓
RFQ → Proposal Pipeline
```

#### **Proposals → Finance**
```
Proposal Accepted
  ↓
Event: proposals.proposal.accepted
  ↓
Finance Module Receives
  ↓
Create Invoice from Proposal
  ↓
Link Invoice to Proposal
```

#### **Proposals → Marketplace**
```
Proposal Created with Services
  ↓
Event: proposals.proposal.created
  ↓
Marketplace Module Receives
  ↓
Suggest Matching Listings
  ↓
Update Marketplace Pricing
```

---

### 6. **Notification Integration**

**Notification Service** (`lib/services/notifications/notificationService.ts`)

**Proposal Notifications:**
- ✅ Proposal created → Creator notified
- ✅ Proposal approved → Creator notified
- ✅ Proposal rejected → Creator notified
- ✅ Proposal sent → Recipients notified
- ✅ Proposal accepted → Team notified
- ✅ Proposal expired → Stakeholders notified

---

### 7. **Knowledge Base Integration**

**Knowledge Base Service** (`lib/services/knowledge-base/`)

**RAG Integration:**
- ✅ Proposal generation uses RAG
- ✅ Content suggestions from knowledge base
- ✅ Industry insights integration
- ✅ Best practices integration

---

### 8. **Agent System Integration**

**Agent Orchestrator** (`lib/services/agents/agentOrchestrator.ts`)

**Agent Connections:**
- ✅ Proposal generation agents
- ✅ Content optimization agents
- ✅ Pricing intelligence agents
- ✅ Win strategy agents

---

### 9. **Evidence & Lineage Integration**

**Evidence Service** (`lib/services/evidence/`)

**Evidence Connections:**
- ✅ Proposal data lineage
- ✅ Chain of custody
- ✅ Integrity verification
- ✅ Audit trail

---

### 10. **Scheduled Tasks Integration**

**Scheduled Tasks** (`lib/services/proposals/initialize.ts`)

**Tasks:**
1. **Auto-expire Proposals** (Daily)
   - Checks all proposals
   - Updates status
   - Sends notifications

2. **Generate Benchmarks** (Hourly)
   - Analyzes pending proposals
   - Generates benchmarks
   - Updates analytics

3. **Cleanup Old Proposals** (Weekly)
   - Archives old proposals
   - Data retention management

---

## 🔄 Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PROPOSALS MODULE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Event Bus  │  │  Database    │  │ Notifications│      │
│  │  (Subscribe) │  │  (Prisma)   │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     WMS      │    │     TMS      │    │     CRM      │
│  (Events)    │    │  (Events)    │    │  (Events)    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
        ┌──────────────────────────────────────┐
        │         OTHER MODULES                 │
        │  - Compliance                         │
        │  - Finance                            │
        │  - Procurement                        │
        │  - Marketplace                        │
        │  - QHSE                               │
        │  - HR                                 │
        │  - Truth Engine                       │
        └──────────────────────────────────────┘
```

---

## 📊 Integration Summary

### **Event Subscriptions: 15+**
- WMS: 3 events
- TMS: 3 events
- CRM: 3 events
- Compliance: 3 events
- Finance: 2 events
- Procurement: 2 events
- Marketplace: 2 events
- QHSE: 1 event
- HR: 1 event
- Truth Engine: 1 event
- RFI: 4 events

### **Event Publications: 15+**
- Proposal events: 12
- RFQ events: 4
- RFI events: 4

### **Module Dependencies: 7**
- WMS, TMS, CRM, Compliance, Finance, Procurement, Marketplace

### **Service Integrations: 10+**
- Enhanced Proposal Service
- Database Service
- Compliance Integration
- Contract Integration
- Liability Integration
- Evidence Integration
- Notification Service
- Knowledge Base Service
- Agent System
- Event Store

### **API Endpoints: 10+**
- `/api/proposals/simple-create`
- `/api/proposals/rate-cards`
- `/api/proposals/services`
- `/api/proposals/enhanced`
- `/api/proposals/[id]`
- `/api/proposals/universal/generate`
- `/api/proposals/universal/[id]`
- `/api/rfi/*`
- `/api/rfq/*`

---

## ✅ Integration Status

**ALL SYSTEMS CONNECTED ✅**

- ✅ Event Bus: Subscribes to 15+ event types
- ✅ Event Bus: Publishes 15+ event types
- ✅ Module Registry: Registered with 7 dependencies
- ✅ Database: Prisma integration with tenant isolation
- ✅ Notifications: Full notification service integration
- ✅ Knowledge Base: RAG integration for intelligent proposals
- ✅ Agent System: AI agents for proposal optimization
- ✅ Evidence: Lineage and integrity tracking
- ✅ Scheduled Tasks: 3 automated tasks running
- ✅ API Gateway: All endpoints properly routed
- ✅ Multi-Tenant: Full tenant isolation
- ✅ RBAC: Role-based access control integrated

---

**The Proposals module is FULLY INTERCONNECTED with the entire BlueDXP ecosystem!**
