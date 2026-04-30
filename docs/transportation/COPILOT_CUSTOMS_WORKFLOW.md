# Transportation/Customs Copilot Workflow (Declarations → Docs → Compliance → Events → Evidence)

This is the **world-class, enterprise-safe** Copilot workflow for Customs inside the BlueDXP Transportation module.

It is designed for:
- **Multi-tenant** correctness
- **RBAC** enforcement
- **Integration-first** (events + adapters, not hardcoded portals)
- **Evidence-first** auditability
- **Self-learning** via the tenant Knowledge Base

---

## What Copilot Can Do (Today)

These are server-governed Copilot tools (capabilities):

- `tms.customs.declaration.create`
- `tms.customs.declaration.required_documents`
- `tms.customs.document.attach`
- `tms.customs.declaration.submit`
- `tms.customs.declaration.evidence_packet`

They execute through:
- `POST /api/copilot/tools/execute`

Protected by:
- `withAPIGateway()` (tenant + RBAC)
- per-tool module/feature/action mapping
- confirmation gates for sensitive/destructive tools

---

## End-to-End Flow (Step-by-step)

### Step 1 — Create a draft declaration

Run:
- `/tool tms.customs.declaration.create {"countryOfOrigin":"Saudi Arabia","countryOfDestination":"Kuwait","customsValue":150000,"currency":"SAR","shipmentId":"SHP-123"}`

Outputs:
- declaration object with `id`, `status`, etc.

Side effects:
- stored via `transportationDatabaseAdapterInstance.storeCustomsDeclaration()`
- evidence record created
- event published: `transportation.customs.declaration.created`
- learning event recorded in tenant KB (`knowledgeBaseService.learn`)

### Step 2 — Check required documents

Run:
- `/tool tms.customs.declaration.required_documents {"declarationId":"CD-...","transportMode":"SEA","isExport":true}`

Outputs:
- required list + missing list

### Step 3 — Attach documents

Run (example commercial invoice):
- `/tool tms.customs.document.attach {"declarationId":"CD-...","shipmentId":"SHP-123","docType":"COMMERCIAL_INVOICE","name":"Commercial Invoice","fileUrl":"https://.../invoice.pdf"}`

Side effects:
- creates `ShipmentDocument` via `storeDocument()`
- updates declaration documents via `updateCustomsDeclaration()`
- evidence + event `transportation.customs.document.attached`
- learning event recorded

### Step 4 — Submit declaration (integration queue)

Run:
- `/tool tms.customs.declaration.submit {"declarationId":"CD-...","countryCode":"SA","system":"fasah"}`

Important:
- This does **not hardcode** Fasah/NAFEZA behavior.
- It emits an integration-ready event: `transportation.customs.declaration.submission_requested`

This is where external adapters/webhooks can pick up the request.

### Step 5 — Generate evidence packet (court-ready)

Run:
- `/tool tms.customs.declaration.evidence_packet {"declarationId":"CD-..."}`

Outputs:
- packet ID + Merkle root + contradiction index + chain-of-custody ready structure

---

## Self-Learning (How It Works)

Each tool execution writes a learning event into the tenant Knowledge Base:
- success/failure patterns
- missing document patterns per lane/mode
- recurring customs issues
- best practices for broker details / HS code coverage

This keeps learning:
- **tenant-scoped**
- **audit-safe**
- **non-blocking** (learning never breaks tool execution)

---

## Integration-First (No Hardcoding)

Submission is modeled as:
- domain record update + evidence
- event emission

External systems (Fasah, NAFEZA, DubaiTrade, ASYCUDA, etc.) should be connected via:
- adapter layer (`lib/adapters/customs/`)
- webhook handlers (`lib/services/webhooks/`) or integration routes
- event subscribers listening to `transportation.customs.declaration.submission_requested`

---

## Next Enhancements (to reach “best in the world”)

1. **Adapter worker**
   - subscribe to `transportation.customs.declaration.submission_requested`
   - route to correct adapter
   - update declaration status with real external statuses

2. **Document OCR + auto-classification**
   - run OCR on uploaded docs
   - automatically verify doc types & fields

3. **Trade compliance scoring**
   - connect to Trade Compliance module
   - produce explainable compliance score + remediation actions

4. **Two-person approval for destructive operations**
   - approvals workflow (human-in-the-loop)


