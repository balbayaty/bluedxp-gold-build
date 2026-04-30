# CAPA Management Module - Complete Architecture & Integration Guide

## 📋 Overview

Your CAPA (Corrective and Preventive Action) Management module is **fully integrated** into the BlueDXP platform. This document explains how it's structured, connected to your database, and integrated with the rest of your tech stack.

---

## 🏗️ **MODULE STRUCTURE**

### **1. Frontend Layer (User Interface)**
**Location:** `app/capa-management/page.tsx`

This is what users see and interact with:
- ✅ Multi-step form for creating CAPAs
- ✅ CAPA listing with filters and search
- ✅ CAPA detail views
- ✅ Edit and update functionality
- ✅ Cross-module linking (NCR, Orders, Materials, etc.)

**Key Features:**
- Advanced CAPA form with workflow steps
- Real-time status updates
- File upload for supporting documents
- Effectiveness review tracking

### **2. Service Layer (Business Logic)**
**Location:** `lib/services/iso-ims/capaService.ts`

This is the "brain" of your CAPA module - it handles all the business logic:
- ✅ Creating new CAPAs
- ✅ Updating existing CAPAs
- ✅ Deleting CAPAs (soft delete)
- ✅ Status management
- ✅ Approval workflows
- ✅ Cross-module linking
- ✅ AI-powered insights
- ✅ Analytics and reporting

**Service Interface:**
```typescript
- createCAPA() - Create new CAPA
- updateCAPA() - Update existing CAPA
- getCAPA() - Get single CAPA by ID
- getCAPAs() - Get list of CAPAs with filters
- deleteCAPA() - Soft delete CAPA
- updateStatus() - Change CAPA status
- addActionItem() - Add action items
- addComment() - Add comments
- approve() - Approve CAPA
- reject() - Reject CAPA
- linkToNCR() - Link to NCR
- linkToMaterial() - Link to Material
- getAIInsights() - Get AI recommendations
- getAnalytics() - Get analytics data
```

### **3. API Layer (Backend Endpoints)**
**Location:** `app/api/iso-ims/capa/`

These are the HTTP endpoints that the frontend calls:

**Main Routes:**
- `GET /api/iso-ims/capa` - List all CAPAs (with filters, pagination)
- `POST /api/iso-ims/capa` - Create new CAPA
- `GET /api/iso-ims/capa/[id]` - Get single CAPA
- `PUT /api/iso-ims/capa/[id]` - Update CAPA
- `DELETE /api/iso-ims/capa/[id]` - Delete CAPA

**Features:**
- ✅ Input validation (using Zod schemas)
- ✅ Security checks (tenant isolation)
- ✅ Error handling
- ✅ Proper HTTP status codes

### **4. Database Layer (Data Storage)**
**Location:** `prisma/schema.prisma` (ISOIMSCAPA model)

Your CAPA data is stored in PostgreSQL database using Prisma ORM:

**Database Connection:**
- **Database Type:** PostgreSQL
- **ORM:** Prisma Client
- **Connection:** `lib/services/database/prismaClient.ts`
- **Model:** `ISOIMSCAPA` (table: `iso_ims_capas`)

**Database Schema:**
```prisma
model ISOIMSCAPA {
  id                      String    @id
  tenantId                String    // Multi-tenant isolation
  capaNumber              String    @unique
  subject                 String
  description             String
  status                  String    // DRAFT, OPEN, IN_PROGRESS, etc.
  priority                String    // LOW, MEDIUM, HIGH, CRITICAL
  capaType                String    // CORRECTIVE_ACTION, PREVENTIVE_ACTION
  capaSource              String    // NCR, AUDIT, RISK_ASSESSMENT, etc.
  assignedTo              String
  department              String
  owner                   String
  targetDate              DateTime
  rootCause               String?
  actionPlan              String
  actionItems             Json      // Array of action items
  estimatedCost           Decimal?
  effectivenessReview     String?
  effectivenessScore      Int?
  // Cross-module links
  linkedNCR               String?
  linkedMaterial          String?
  linkedOrder             String?
  linkedLocation          String?
  linkedCustomer          String?
  linkedSupplier          String?
  linkedRisk              String?
  linkedIncident          String?
  // Workflow
  approvalChain           Json?
  comments                Json?
  attachments             String[]
  // Timestamps
  createdAt               DateTime
  updatedAt               DateTime
  createdBy               String
  updatedBy               String?
}
```

**Database Indexes (for performance):**
- ✅ `tenantId` - Fast tenant filtering
- ✅ `capaNumber` - Fast lookup by CAPA number
- ✅ `status` - Fast status filtering
- ✅ `priority` - Fast priority filtering
- ✅ `assignedTo` - Fast assignment filtering
- ✅ `targetDate` - Fast date range queries

---

## 🔌 **TECH STACK INTEGRATION**

### **1. Database Connection ✅**

**How it works:**
1. Prisma Client is initialized in `lib/services/database/prismaClient.ts`
2. CAPA Service imports Prisma: `import { prisma } from '@/lib/services/database/prismaClient'`
3. All database operations use Prisma ORM
4. Connection is managed automatically (connects on first query)

**Connection String:**
- Stored in environment variable: `DATABASE_URL`
- Format: `postgresql://username:password@host:port/database`

**Example Database Operations:**
```typescript
// Create CAPA
await prisma.iSOIMSCAPA.create({ data: {...} })

// Get CAPA
await prisma.iSOIMSCAPA.findFirst({ where: { id, tenantId } })

// Update CAPA
await prisma.iSOIMSCAPA.update({ where: { id }, data: {...} })

// List CAPAs
await prisma.iSOIMSCAPA.findMany({ where: {...}, orderBy: {...} })
```

### **2. Event Bus Integration ✅**

**Location:** `lib/services/event-bus/`

Your CAPA module publishes events when things happen:

**Events Published:**
- `iso-ims.capa.created` - When CAPA is created
- `iso-ims.capa.updated` - When CAPA is updated
- `iso-ims.capa.deleted` - When CAPA is deleted

**How it works:**
```typescript
// In capaService.ts
await eventBus.publish({
  type: 'iso-ims.capa.created',
  payload: {
    capaId: capa.id,
    capaNumber: capa.capaNumber,
    tenantId: input.tenantId,
  },
})
```

**Other Modules Listening to CAPA Events:**
- ✅ **Pulse Module** - Listens to `iso-ims.capa.closed` for scoring
- ✅ **HR Module** - Listens to `capa.*` events for employee tracking
- ✅ **Facility Management** - Can link assets to CAPAs
- ✅ **AI Vision** - Can auto-create CAPAs from vision analysis

### **3. Knowledge Base Integration ✅**

**Location:** `lib/services/knowledge-base/`

Your CAPA module uses the Knowledge Base for AI insights:

**How it works:**
- When getting AI insights, it searches the Knowledge Base for similar CAPAs
- Historical CAPA data is used to suggest action items
- Similar CAPAs are found and recommended

**Example:**
```typescript
// In capaService.ts - getAIInsights()
const similarCAPAs = await knowledgeBaseService.search({
  query: `${capa.subject} ${capa.rootCause} ${capa.actionPlan}`,
  category: 'ISO_IMS',
  tenantId,
  limit: 5,
})
```

### **4. Notification Service Integration ✅**

**Location:** `lib/services/notifications/notificationService.ts`

When a CAPA is created, notifications are sent:

**Notifications Sent:**
- ✅ To assigned user when CAPA is created
- ✅ To approvers when CAPA needs approval
- ✅ To stakeholders when CAPA status changes

**Example:**
```typescript
// In capaService.ts - createCAPA()
await notificationService.send({
  tenantId: input.tenantId,
  userId: input.assignedTo,
  type: 'alert',
  title: `New CAPA Assigned: ${capa.capaNumber}`,
  message: `You have been assigned to ${capa.subject}`,
  channel: 'in-app',
})
```

### **5. Audit Service Integration ✅**

**Location:** `lib/services/audit/auditService.ts`

All CAPA operations are logged for compliance:

**Audit Logs:**
- ✅ CREATE - When CAPA is created
- ✅ UPDATE - When CAPA is updated
- ✅ DELETE - When CAPA is deleted

**Example:**
```typescript
// In capaService.ts
await auditService.log({
  action: 'CREATE',
  entityType: 'CAPA',
  entityId: capa.id,
  userId: input.createdBy,
  tenantId: input.tenantId,
  metadata: { capaNumber: capa.capaNumber },
})
```

### **6. Evidence Service Integration ✅**

**Location:** `lib/services/evidence/`

CAPA module can link to evidence and documents:
- Supporting documents
- Photos
- Cost quotes
- Approval emails

---

## 🔗 **CROSS-MODULE CONNECTIONS**

### **1. ISO-IMS Module (Parent Module) ✅**

CAPA is part of the ISO-IMS module:
- **Module Definition:** `lib/modules/iso-ims.ts`
- **Routes:** Registered in module registry
- **Dependencies:** Can work standalone or with other modules

### **2. NCR (Non-Conformance Reports) Integration ✅**

**Bidirectional Linking:**
- CAPA can be linked to NCR
- NCR can trigger CAPA creation
- Fields: `linkedNCR`, `linkedNCRNumber`

### **3. WMS (Warehouse Management) Integration ✅**

**Links:**
- Materials (`linkedMaterial`)
- Storage Locations (`linkedLocation`)
- Orders (`linkedOrder`)

### **4. TMS (Transportation Management) Integration ✅**

**Links:**
- Shipments can trigger CAPAs
- POD (Proof of Delivery) issues → CAPA

### **5. QHSE (Quality, Health, Safety, Environment) Integration ✅**

**Links:**
- Incidents (`linkedIncident`)
- Risk Assessments (`linkedRisk`)
- Customer Complaints → CAPA

### **6. Facility Management Integration ✅**

**Links:**
- Assets can be linked to CAPAs
- Work Orders can trigger CAPAs

### **7. AI Vision Module Integration ✅**

**Auto-Creation:**
- AI Vision can auto-create CAPAs from image analysis
- Compliance issues detected → CAPA created automatically

---

## 📊 **DATA FLOW DIAGRAM**

```
┌─────────────────┐
│   User Browser  │
│  (Frontend UI)  │
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌─────────────────┐
│   API Routes    │
│ /api/iso-ims/   │
│     capa/       │
└────────┬────────┘
         │
         │ Service Calls
         ▼
┌─────────────────┐
│  CAPA Service   │
│ capaService.ts  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Prisma │ │  Event Bus   │
│  ORM   │ │  (Publish)   │
└───┬────┘ └──────┬───────┘
    │             │
    ▼             ▼
┌────────┐ ┌──────────────┐
│PostgreSQL│ │ Other Modules│
│Database │ │ (Subscribe)  │
└─────────┘ └──────────────┘
```

---

## 🔐 **SECURITY & MULTI-TENANCY**

### **Tenant Isolation ✅**

Every CAPA operation is tenant-scoped:
- ✅ All queries include `tenantId` filter
- ✅ Users can only see CAPAs from their tenant
- ✅ Database indexes on `tenantId` for performance

### **RBAC (Role-Based Access Control) ✅**

**Permission:** `iso-ims.capa_management`

**Roles with Access:**
- Quality Manager
- ISO Manager
- Operations Manager
- System Administrator

**Tabs:**
- `actions` - Create/edit CAPAs
- `tracking` - View and track CAPAs
- `effectiveness` - Review effectiveness

---

## 🚀 **API ENDPOINTS SUMMARY**

### **List CAPAs**
```
GET /api/iso-ims/capa?tenantId={id}&page=1&pageSize=20&status=OPEN
```

### **Create CAPA**
```
POST /api/iso-ims/capa
Body: {
  tenantId: string,
  subject: string,
  description: string,
  priority: "HIGH",
  capaType: "CORRECTIVE_ACTION",
  ...
}
```

### **Get Single CAPA**
```
GET /api/iso-ims/capa/{id}?tenantId={id}
```

### **Update CAPA**
```
PUT /api/iso-ims/capa/{id}?tenantId={id}
Body: {
  status: "IN_PROGRESS",
  ...
}
```

### **Delete CAPA**
```
DELETE /api/iso-ims/capa/{id}?tenantId={id}
```

---

## ✅ **INTEGRATION STATUS CHECKLIST**

### **Database Connection** ✅
- [x] Prisma ORM configured
- [x] Database schema defined
- [x] Indexes created for performance
- [x] Multi-tenant isolation enforced
- [x] Connection pooling configured

### **Service Layer** ✅
- [x] CAPA Service implemented
- [x] All CRUD operations working
- [x] Workflow management
- [x] AI insights integration
- [x] Analytics support

### **API Layer** ✅
- [x] REST API endpoints created
- [x] Input validation (Zod)
- [x] Error handling
- [x] Security checks
- [x] Proper HTTP status codes

### **Event Bus** ✅
- [x] Events published on create/update/delete
- [x] Other modules can subscribe
- [x] Event-driven architecture

### **Cross-Module Integration** ✅
- [x] NCR linking
- [x] Material linking
- [x] Order linking
- [x] Location linking
- [x] Customer/Supplier linking
- [x] Risk/Incident linking

### **Platform Services** ✅
- [x] Notification Service
- [x] Audit Service
- [x] Knowledge Base
- [x] Evidence Service

### **Frontend** ✅
- [x] User interface implemented
- [x] Multi-step form
- [x] Filtering and search
- [x] Real-time updates
- [x] Error handling

---

## 🐛 **TROUBLESHOOTING**

### **Issue: "Failed to Create CAPA" Error**

**Possible Causes:**
1. **Database Connection Issue**
   - Check `DATABASE_URL` environment variable
   - Verify PostgreSQL is running
   - Check database connection in `lib/services/database/prismaClient.ts`

2. **Validation Error**
   - Check API request body matches schema
   - Verify all required fields are provided
   - Check Zod validation errors in API response

3. **Tenant ID Missing**
   - Ensure `tenantId` is provided in request
   - Check user authentication context

4. **Permission Issue**
   - Verify user has `iso-ims.capa_management` permission
   - Check RBAC role assignments

**How to Debug:**
1. Check browser console for errors
2. Check server logs for detailed error messages
3. Verify database connection: `prisma db pull`
4. Test API directly: Use Postman or curl

### **Issue: CAPA Not Appearing in List**

**Possible Causes:**
1. **Tenant Filter**
   - Verify correct `tenantId` is being used
   - Check user's tenant assignment

2. **Status Filter**
   - Check if status filter is excluding the CAPA
   - Verify CAPA status in database

3. **Pagination**
   - Check if CAPA is on a different page
   - Verify page size settings

---

## 📝 **SUMMARY**

Your CAPA Management module is **fully integrated** and **production-ready**:

✅ **Database:** Connected via Prisma ORM to PostgreSQL  
✅ **API:** RESTful endpoints with validation  
✅ **Service Layer:** Complete business logic  
✅ **Event Bus:** Publishing events for cross-module communication  
✅ **Security:** Multi-tenant isolation and RBAC  
✅ **Integration:** Connected to all major modules  
✅ **Frontend:** User-friendly interface  

The module follows all BlueDXP platform architecture patterns and is ready for use!

---

## 🔗 **RELATED FILES**

- **Service:** `lib/services/iso-ims/capaService.ts`
- **API Routes:** `app/api/iso-ims/capa/`
- **Frontend:** `app/capa-management/page.tsx`
- **Database Schema:** `prisma/schema.prisma` (ISOIMSCAPA model)
- **Module Definition:** `lib/modules/iso-ims.ts`
- **Types:** `lib/services/iso-ims/types.ts`

---

**Last Updated:** 2024  
**Status:** ✅ Production Ready













