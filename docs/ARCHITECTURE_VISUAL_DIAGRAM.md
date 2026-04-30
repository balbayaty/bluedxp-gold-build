# 🏗️ BlueDXP Architecture Visual Diagram

## Complete System Integration: MCP, Isolation, Self-Learning & Human-in-the-Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BLUEDXP PLATFORM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER (L5)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Copilot    │  │  Approvals   │  │  Dashboards  │  │   Modules    │    │
│  │   Widget     │  │     UI       │  │              │  │   (WMS/TMS)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │                  │            │
│         └─────────────────┴──────────────────┴──────────────────┘            │
│                                    │                                          │
│                                    ▼                                          │
│                          ┌──────────────────┐                                 │
│                          │  API Gateway    │                                 │
│                          │  (Auth + RBAC)  │                                 │
│                          └────────┬─────────┘                                 │
│                                   │                                            │
└───────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER (L3)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🔒 MULTI-TENANT ISOLATION                          │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │   Tenant     │  │   View      │  │   Resource   │                │   │
│  │  │  Resolver    │→ │  Context    │→ │   Quotas     │                │   │
│  │  │(apiAuth.ts)  │  │  System     │  │              │                │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │   │
│  │                                                                       │   │
│  │  ✅ All queries filter by tenantId                                   │   │
│  │  ✅ All events include tenantId                                      │   │
│  │  ✅ All cache keys prefixed with tenantId                            │   │
│  │  ✅ All files stored in tenant-scoped paths                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🛠️ MCP (MODEL CONTEXT PROTOCOL)                    │   │
│  │                                                                       │   │
│  │  ┌──────────────┐                                                    │   │
│  │  │   MCP        │                                                    │   │
│  │  │   Server     │                                                    │   │
│  │  └──────┬───────┘                                                    │   │
│  │         │                                                             │   │
│  │         ├──→ Knowledge Tools                                          │   │
│  │         ├──→ Quantum Tools (Schrödinger's Truck)                     │   │
│  │         ├──→ Chemical Tools                                           │   │
│  │         ├──→ Compliance Tools                                         │   │
│  │         ├──→ QHSE Tools                                               │   │
│  │         ├──→ Arabic NLP Tools                                         │   │
│  │         ├──→ Evidence Tools                                           │   │
│  │         ├──→ Cargo Psychology Tools                                   │   │
│  │         ├──→ Graph Query Tool                                         │   │
│  │         └──→ Agent Execute Tool                                       │   │
│  │                                                                       │   │
│  │  ⚠️ Status: Implemented, needs integration with Copilot              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🧠 SELF-LEARNING SYSTEM                          │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │   Agent      │  │   Agent      │  │  Knowledge   │                │   │
│  │  │   Memory     │→ │ Orchestrator │→ │    Base      │                │   │
│  │  │              │  │              │  │              │                │   │
│  │  │ • Short-term │  │ • Task       │  │ • Pattern    │                │   │
│  │  │ • Long-term  │  │   Routing    │  │   Storage    │                │   │
│  │  │ • Learning   │  │ • Learning   │  │ • RAG        │                │   │
│  │  │ • Feedback   │  │ • Consensus  │  │ • Embeddings │                │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │   │
│  │                                                                       │   │
│  │  ✅ Copilot uses Agent Memory (line 158, 542)                       │   │
│  │  ✅ Learning from success/failure                                    │   │
│  │  ✅ High-confidence patterns → Knowledge Base                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    👤 HUMAN-IN-THE-LOOP                              │   │
│  │                                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │  Permission  │  │   QHSE       │  │   Proposal   │                │   │
│  │  │  Approvals   │  │  Approvals   │  │  Approvals   │                │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                │   │
│  │         │                 │                  │                        │   │
│  │         └─────────────────┴──────────────────┘                        │   │
│  │                            │                                           │   │
│  │                            ▼                                           │   │
│  │                  ┌──────────────────┐                                 │   │
│  │                  │  Approval        │                                 │   │
│  │                  │  Workflow        │                                 │   │
│  │                  │  Engine          │                                 │   │
│  │                  │                  │                                 │   │
│  │                  │ • Multi-step     │                                 │   │
│  │                  │ • Auto-approve   │                                 │   │
│  │                  │ • Escalation     │                                 │   │
│  │                  │ • Notifications  │                                 │   │
│  │                  └──────────────────┘                                 │   │
│  │                                                                       │   │
│  │  ✅ UI Components: PermissionApprovalWorkflow.tsx                     │   │
│  │  ✅ API Routes: /api/qhse/approvals, /api/proposals/enhanced         │   │
│  │  ✅ Services: All approval services functional                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└───────────────────────────────────┬────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER (L1/L0)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Event      │  │   Event     │  │   Evidence   │  │  Database    │    │
│  │   Store      │  │   Bus       │  │   Ledger     │  │  (Prisma)    │    │
│  │              │  │             │  │   (L0)       │  │              │    │
│  │ • CQRS       │  │ • Pub/Sub   │  │ • Immutable  │  │ • tenantId    │    │
│  │ • Snapshots  │  │ • Events    │  │ • Chain of   │  │   enforced    │    │
│  │              │  │   scoped    │  │   custody    │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────┘

USER ACTION
    │
    ▼
┌─────────────────┐
│  UI Component   │
│  (Copilot/UI)   │
└────────┬────────┘
         │
         │ 1. Request (with tenantId from AuthContext)
         ▼
┌─────────────────┐
│  API Gateway    │
│  • Auth         │
│  • RBAC         │
│  • Tenant       │ ← 🔒 ISOLATION: Enforces tenantId
│    Resolution   │
└────────┬────────┘
         │
         │ 2. Validated Request
         ▼
┌─────────────────┐
│  Service Layer  │
│                 │
│  ┌─────────────┐│
│  │  Copilot    ││
│  │  Service    ││
│  └──────┬──────┘│
│         │       │
│         │ 3a. Get Context
│         ▼       │
│  ┌─────────────┐│
│  │  Agent      ││ ← 🧠 SELF-LEARNING: Recalls memories
│  │  Memory     ││
│  └──────┬──────┘│
│         │       │
│         │ 3b. Get Knowledge
│         ▼       │
│  ┌─────────────┐│
│  │  Knowledge  ││ ← 🧠 SELF-LEARNING: RAG search
│  │  Base       ││
│  └──────┬──────┘│
│         │       │
│         │ 3c. Execute Tools (if needed)
│         ▼       │
│  ┌─────────────┐│
│  │  MCP Tools  ││ ← 🛠️ MCP: Tool execution
│  │  (Future)   ││
│  └──────┬──────┘│
│         │       │
│         │ 4. Process with AI
│         ▼       │
│  ┌─────────────┐│
│  │  AI Service  ││
│  │  (OpenAI/    ││
│  │   Anthropic) ││
│  └──────┬──────┘│
│         │       │
│         │ 5. Response
│         ▼       │
│  ┌─────────────┐│
│  │  Learn from ││ ← 🧠 SELF-LEARNING: Store in memory
│  │  Result     ││
│  └──────┬──────┘│
│         │       │
│         │ 6. Return Response
│         ▼       │
└─────────┴───────┘
         │
         │ 7. Response (tenant-scoped)
         ▼
┌─────────────────┐
│  UI Component   │
│  (Displays)     │
└─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      APPROVAL WORKFLOW DIAGRAM                               │
└─────────────────────────────────────────────────────────────────────────────┘

USER REQUEST (Permission/Proposal/QHSE)
    │
    ▼
┌─────────────────┐
│  Service        │
│  (Creates       │
│   Approval)     │
└────────┬────────┘
         │
         │ 1. Create Approval Request
         ▼
┌─────────────────┐
│  Approval       │
│  Workflow       │
│  Engine         │
└────────┬────────┘
         │
         │ 2. Check Auto-Approve Conditions
         ▼
    ┌────┴────┐
    │         │
    │ YES     │ NO
    ▼         ▼
┌─────────┐ ┌─────────────────┐
│ Auto    │ │  Approval       │
│ Approve │ │  Chain          │
└─────────┘ │                 │
            │ • Step 1         │
            │ • Step 2         │
            │ • Step N         │
            └────────┬─────────┘
                     │
                     │ 3. Notify Approver
                     ▼
            ┌─────────────────┐
            │  Notification   │
            │  Service        │
            └────────┬────────┘
                     │
                     │ 4. User Approves/Rejects
                     ▼
            ┌─────────────────┐
            │  Approval       │
            │  Processing     │
            └────────┬────────┘
                     │
                     │ 5. Check if Complete
                     ▼
            ┌─────────────────┐
            │  All Steps      │
            │  Complete?      │
            └────────┬────────┘
                     │
            ┌────────┴────────┐
            │                  │
            │ YES              │ NO
            ▼                  ▼
    ┌──────────────┐   ┌──────────────┐
    │  Approved    │   │  Next Step   │
    │  (Execute)   │   │  (Loop)      │
    └──────────────┘   └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      LEARNING FLOW DIAGRAM                                   │
└─────────────────────────────────────────────────────────────────────────────┘

AGENT TASK EXECUTION
    │
    ▼
┌─────────────────┐
│  Agent          │
│  Orchestrator   │
└────────┬────────┘
         │
         │ 1. Route Task
         ▼
┌─────────────────┐
│  Specialized    │
│  Agent          │
│  (Executes)     │
└────────┬────────┘
         │
         │ 2. Get Relevant Memories
         ▼
┌─────────────────┐
│  Agent Memory   │
│  • Recall       │
│  • Context      │
└────────┬────────┘
         │
         │ 3. Execute Task
         ▼
┌─────────────────┐
│  Task Result    │
│  (Success/      │
│   Failure)      │
└────────┬────────┘
         │
         │ 4. Process Learning
         ▼
    ┌────┴────┐
    │         │
    │ SUCCESS │ FAILURE
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ Learn   │ │ Learn from  │
│ from    │ │ Error       │
│ Success │ │             │
└────┬────┘ └──────┬───────┘
     │             │
     └─────┬───────┘
           │
           │ 5. Store in Memory
           ▼
    ┌─────────────────┐
    │  Agent Memory   │
    │  • Store        │
    │  • Reinforce    │
    └────────┬────────┘
             │
             │ 6. High Confidence? (>=85%)
             ▼
    ┌─────────────────┐
    │  Knowledge      │
    │  Base           │
    │  • Pattern      │
    │  • Embeddings   │
    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION STATUS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

✅ MULTI-TENANT ISOLATION
   ├─ ✅ API Middleware (apiAuth.ts)
   ├─ ✅ Database Layer (all queries)
   ├─ ✅ Service Layer (all services)
   ├─ ✅ Event Bus (all events)
   ├─ ✅ Cache (all keys)
   └─ ✅ File Storage (all files)

✅ SELF-LEARNING
   ├─ ✅ Agent Memory (agentMemory.ts)
   ├─ ✅ Agent Orchestrator (agentOrchestrator.ts)
   ├─ ✅ Knowledge Base Integration
   ├─ ✅ Copilot Integration (copilotService.ts:158, 542)
   └─ ✅ Learning from Success/Failure

✅ HUMAN-IN-THE-LOOP
   ├─ ✅ Permission Approvals (permissionApprovalWorkflow.ts)
   ├─ ✅ QHSE Approvals (qhseApprovalWorkflowService.ts)
   ├─ ✅ Proposal Approvals (proposalApprovalService.ts)
   ├─ ✅ UI Components (PermissionApprovalWorkflow.tsx)
   └─ ✅ API Routes (/api/qhse/approvals, /api/proposals/enhanced)

⚠️ MCP (MODEL CONTEXT PROTOCOL)
   ├─ ✅ Core Server (mcp/server.ts)
   ├─ ✅ Tool Registration (10+ tools)
   ├─ ✅ Service Initialization (serviceInitializer.ts:145)
   ├─ ✅ Status API (/api/v1/services/status)
   ├─ ⚠️ Copilot Integration (needs connection)
   └─ ⚠️ API Route for Tool Execution (needs creation)

┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEGEND                                               │
└─────────────────────────────────────────────────────────────────────────────┘

✅ = Fully Implemented & Integrated
⚠️ = Implemented but Needs Integration
❌ = Not Implemented

🔒 = Multi-Tenant Isolation
🧠 = Self-Learning
👤 = Human-in-the-Loop
🛠️ = MCP (Model Context Protocol)


