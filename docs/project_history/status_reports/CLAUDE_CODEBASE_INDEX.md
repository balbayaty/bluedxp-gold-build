# 📚 BlueDXP Platform - Codebase Index for Claude AI

**Generated:** 2025-12-18T20:52:17.470Z
**Project:** hazalyze-asn-module v1.0.0
**Root Directory:** C:\Users\balba\hazalyze-asn-module

---

## 🏗️ Architecture

### Core Principles:
- Deep Layer Architecture (L0-L5 + Lx)
- Integration-First Design
- 4IR & 5IR Aligned
- Multi-Tenant Architecture
- Event-Driven Architecture (CQRS & Event Sourcing)
- Plugin-Based Module System

### Architecture Documentation:
- `docs/ARCHITECTURE/LAYER_INTERACTION_ARCHITECTURE.md`
- `docs/ARCHITECTURE/BLUEDXP_VISION_ALIGNMENT.md`
- `docs/ARCHITECTURE/MICROSERVICES_ARCHITECTURE.md`
- `VISUAL_ARCHITECTURE_DIAGRAM.md`
- `ARCHITECTURE_MINDMAP.md`

---

## 📦 Modules (24)

### brand-messaging
- **Path:** `lib/modules/brand-messaging.ts`
- **Files:** 20

### communication
- **Path:** `lib/modules/communication.ts`
- **Files:** 0

### compliance
- **Path:** `lib/modules/compliance.ts`
- **Files:** 20

### crm
- **Path:** `lib/modules/crm.ts`
- **Files:** 14

### digital-signature-register
- **Path:** `lib/modules/digital-signature-register.ts`
- **Files:** 0

### digital-signature
- **Path:** `lib/modules/digital-signature.ts`
- **Files:** 15

### facility-management
- **Path:** `lib/modules/facility-management.ts`
- **Files:** 0

### finance
- **Path:** `lib/modules/finance.ts`
- **Files:** 15

### hazalyze
- **Path:** `lib/modules/hazalyze.ts`
- **Files:** 0

### iso-ims
- **Path:** `lib/modules/iso-ims.ts`
- **Files:** 1

### isolation
- **Path:** `lib/modules/isolation.ts`
- **Files:** 0

### maas
- **Path:** `lib/modules/maas.ts`
- **Files:** 0

### manager
- **Path:** `lib/modules/manager.ts`
- **Files:** 0

### marketplace
- **Path:** `lib/modules/marketplace.ts`
- **Files:** 20

### process-lifecycle
- **Path:** `lib/modules/process-lifecycle.ts`
- **Files:** 20

### procurement
- **Path:** `lib/modules/procurement.ts`
- **Files:** 20

### project-management
- **Path:** `lib/modules/project-management.ts`
- **Files:** 5

### proposals-rfq
- **Path:** `lib/modules/proposals-rfq.ts`
- **Files:** 0

### qhse
- **Path:** `lib/modules/qhse.ts`
- **Files:** 20

### tms
- **Path:** `lib/modules/tms.ts`
- **Files:** 0

### trade-compliance
- **Path:** `lib/modules/trade-compliance.ts`
- **Files:** 20

### truth-engine
- **Path:** `lib/modules/truth-engine.ts`
- **Files:** 20

### warehouse-network
- **Path:** `lib/modules/warehouse-network.ts`
- **Files:** 19

### wms
- **Path:** `lib/modules/wms.ts`
- **Files:** 20


---

## 🔧 Services (30)

### agents
- **Path:** `lib/services/agents`
- **Functions:** 0

### ai
- **Path:** `lib/services/ai`
- **Functions:** 0

### ai-document-processor
- **Path:** `lib/services/ai-document-processor`
- **Functions:** 1
  - processDocumentToWorkflow

### api
- **Path:** `lib/services/api`
- **Functions:** 0

### audit
- **Path:** `lib/services/audit`
- **Functions:** 0

### compliance
- **Path:** `lib/services/compliance`
- **Functions:** 0

### decision-core
- **Path:** `lib/services/decision-core`
- **Functions:** 0

### digital-signature
- **Path:** `lib/services/digital-signature`
- **Functions:** 0

### dual-journey
- **Path:** `lib/services/dual-journey`
- **Functions:** 0

### ecosystem
- **Path:** `lib/services/ecosystem`
- **Functions:** 0

### event-bus
- **Path:** `lib/services/event-bus`
- **Functions:** 0

### event-store
- **Path:** `lib/services/event-store`
- **Functions:** 3
  - createCommand, createEvent, createQuery

### evidence
- **Path:** `lib/services/evidence`
- **Functions:** 0

### graph
- **Path:** `lib/services/graph`
- **Functions:** 0

### knowledge-base
- **Path:** `lib/services/knowledge-base`
- **Functions:** 0

### load-design
- **Path:** `lib/services/load-design`
- **Functions:** 0

### maps
- **Path:** `lib/services/maps`
- **Functions:** 0

### marketplace
- **Path:** `lib/services/marketplace`
- **Functions:** 0

### ml-registry
- **Path:** `lib/services/ml-registry`
- **Functions:** 0

### msds-sku-linking
- **Path:** `lib/services/msds-sku-linking`
- **Functions:** 0

### process-lifecycle
- **Path:** `lib/services/process-lifecycle`
- **Functions:** 2
  - initializeProcessLifecycleModule, getUnifiedProcessData

### procurement
- **Path:** `lib/services/procurement`
- **Functions:** 0

### qhse
- **Path:** `lib/services/qhse`
- **Functions:** 0

### trade-compliance
- **Path:** `lib/services/trade-compliance`
- **Functions:** 0

### transportation
- **Path:** `lib/services/transportation`
- **Functions:** 0

### truth-engine
- **Path:** `lib/services/truth-engine`
- **Functions:** 0

### warehouse-network
- **Path:** `lib/services/warehouse-network`
- **Functions:** 0

### webhooks
- **Path:** `lib/services/webhooks`
- **Functions:** 0

### wms
- **Path:** `lib/services/wms`
- **Functions:** 0

### workflows
- **Path:** `lib/services/workflows`
- **Functions:** 0


---

## 🌐 API Endpoints (406)

- `/api/ai-document-processor/process`
- `/api/ai/chat`
- `/api/ai/insights`
- `/api/ai/recommendations`
- `/api/ai/vision`
- `/api/ai/vision/chemical`
- `/api/ai/vision/enhanced`
- `/api/ai/vision/metrics`
- `/api/ai/vision/stream`
- `/api/ai/vision/unified`
- `/api/ai/vision/v2/analyze`
- `/api/ai/vision/v2/feedback`
- `/api/ai/vision/video`
- `/api/audit`
- `/api/bim/analysis`
- `/api/bim/collaboration/sessions`
- `/api/bim/collaboration/sessions/[id]`
- `/api/bim/marketplace/bookings`
- `/api/bim/marketplace/listings`
- `/api/bim/marketplace/listings/[id]`
- `/api/brand-messaging/batch`
- `/api/brand-messaging/generate`
- `/api/camera-proxy`
- `/api/chemical/analyze-comprehensive`
- `/api/chemical/containers`
- `/api/chemical/intelligence/alternatives`
- `/api/chemical/intelligence/insights`
- `/api/chemical/intelligence/recommendations`
- `/api/chemical/inventory`
- `/api/chemical/msds/batch`
- `/api/chemical/msds/bulk-approve`
- `/api/chemical/msds/bulk-reject`
- `/api/chemical/msds/compare`
- `/api/chemical/msds/compliance`
- `/api/chemical/msds/get-for-module`
- `/api/chemical/msds/update-compliance`
- `/api/chemical/msds/update-transportation`
- `/api/crm/accounts`
- `/api/crm/activities`
- `/api/crm/contacts`
- `/api/crm/dashboard`
- `/api/crm/forecast`
- `/api/crm/leads`
- `/api/crm/opportunities`
- `/api/crm/pipeline`
- `/api/customer-portal/approval-request`
- `/api/customer-portal/approve`
- `/api/decision-core/[id]`
- `/api/decision-core/[id]/status`
- `/api/decision-core/create`
- `/api/decision-core/query`
- `/api/decision-core/statistics`
- `/api/docs`
- `/api/erpnext/audits`
- `/api/erpnext/capas`
- `/api/erpnext/customers`
- `/api/erpnext/documents`
- `/api/erpnext/incidents`
- `/api/erpnext/inspections`
- `/api/erpnext/iso-stats`
- `/api/erpnext/ncrs`
- `/api/erpnext/risks`
- `/api/erpnext/save-msds`
- `/api/erpnext/send-email`
- `/api/erpnext/storage-locations`
- `/api/erpnext/suppliers`
- `/api/erpnext/trainings`
- `/api/erpnext/users`
- `/api/erpnext/warehouses`
- `/api/external-sds/compare`
- `/api/external-sds/fetch`
- `/api/facility/assets`
- `/api/facility/assets/import`
- `/api/facility/cross-module-data`
- `/api/facility/utility-bills`
- `/api/facility/utility-bills/[id]`
- `/api/facility/utility-bills/[id]/approve`
- `/api/facility/utility-bills/[id]/payment`
- `/api/facility/utility-bills/[id]/traceability`
- `/api/facility/utility-bills/analytics`
- `/api/facility/utility-bills/cross-module`
- `/api/facility/utility-bills/export`
- `/api/facility/utility-bills/forecast`
- `/api/facility/utility-bills/forecast/variance`
- `/api/facility/utility-bills/hierarchical`
- `/api/facility/utility-bills/tariff`
- `/api/facility/work-orders`
- `/api/finance/accounts-payable`
- `/api/finance/accounts-receivable`
- `/api/finance/budget`
- `/api/finance/dashboard`
- `/api/finance/general-ledger`
- `/api/finance/integrations`
- `/api/finance/reports`
- `/api/forms/intelligent`
- `/api/forms/smart-detection`
- `/api/graphql`
- `/api/health`
- `/api/labels/generate`
- `/api/labels/print`
- `/api/load-design/analytics`
- `/api/load-design/compliance/validate`
- `/api/load-design/export`
- `/api/load-design/optimize`
- `/api/load-design/plans`
- `/api/load-design/realtime`
- `/api/load-design/vehicles`
- `/api/marketplace/ai-matching`
- `/api/marketplace/analytics`
- `/api/marketplace/bookings`
- `/api/marketplace/bookings/[id]`
- `/api/marketplace/demand-forecasting`
- `/api/marketplace/export`
- `/api/marketplace/favorites`
- `/api/marketplace/intelligent-search`
- `/api/marketplace/invoices`
- `/api/marketplace/invoices/[id]`
- `/api/marketplace/learning-feedback`
- `/api/marketplace/listings`
- `/api/marketplace/listings/[id]`
- `/api/marketplace/payments`
- `/api/marketplace/payments/[id]/refund`
- `/api/marketplace/payments/intent`
- `/api/marketplace/predictive-pricing`
- `/api/marketplace/providers/[id]/badge`
- `/api/marketplace/providers/[id]/verify`
- `/api/marketplace/recommendations`
- `/api/marketplace/reviews`
- `/api/marketplace/stats`
- `/api/marketplace/sustainability`
- `/api/marketplace/verification`
- `/api/modules/list`
- `/api/msds-sku-linking/bulk`
- `/api/msds-sku-linking/links`
- `/api/msds-sku-linking/links/[id]`
- `/api/msds-sku-linking/links/[id]/approve`
- `/api/msds-sku-linking/links/[id]/reject`
- `/api/msds-sku-linking/matches`
- `/api/msds/assign-warehouse`
- `/api/notifications`
- `/api/notifications/email`
- `/api/notifications/in-app`
- `/api/notifications/sms`
- `/api/open-data/search`
- `/api/process-lifecycle`
- `/api/process-lifecycle/lifecycle`
- `/api/process-lifecycle/workflows`
- `/api/procurement/ai/negotiation-strategy`
- `/api/procurement/ai/risk-assessment`
- `/api/procurement/ai/vendor-discovery`
- `/api/procurement/analytics/risk`
- `/api/procurement/analytics/spend`
- `/api/procurement/analytics/vendors`
- `/api/procurement/bim/requisition`
- `/api/procurement/blockchain/tokenize`
- `/api/procurement/contracts`
- `/api/procurement/currency/convert`
- `/api/procurement/currency/exposure`
- `/api/procurement/dashboard`
- `/api/procurement/defi/finance`
- `/api/procurement/digital-twin/create`
- `/api/procurement/drawings/link`
- `/api/procurement/einvoice/generate`
- `/api/procurement/facility/mro-requisition`
- `/api/procurement/goods-receipt`
- `/api/procurement/hr/contractor-match`
- `/api/procurement/hr/manpower-requisition`
- `/api/procurement/integration/erp/configure`
- `/api/procurement/integration/erp/sync`
- `/api/procurement/integration/tms/quotes`
- `/api/procurement/invoices`
- `/api/procurement/invoices/[id]/approve`
- `/api/procurement/iot/smart-requisition`
- `/api/procurement/nlp/process`
- `/api/procurement/payments/discount-opportunities`
- `/api/procurement/payments/schedule`
- `/api/procurement/predictive/demand-forecast`
- `/api/procurement/predictive/optimization`
- `/api/procurement/predictive/price-forecast`
- `/api/procurement/projects`
- `/api/procurement/projects/[id]/summary`
- `/api/procurement/purchase-orders`
- `/api/procurement/purchase-orders/[id]`
- `/api/procurement/purchase-orders/[id]/approve`
- `/api/procurement/quality/certificate`
- `/api/procurement/quality/ncr`
- `/api/procurement/requisitions`
- `/api/procurement/requisitions/[id]`
- `/api/procurement/requisitions/[id]/approve`
- `/api/procurement/requisitions/[id]/submit`
- `/api/procurement/safety/ppe-requisition`
- `/api/procurement/sustainability/metrics`
- `/api/procurement/vendors`
- `/api/procurement/vendors/[id]`
- `/api/procurement/vision/inspect`
- `/api/projects`
- `/api/projects/[id]`
- `/api/proposals/rfq`
- `/api/proposals/train-schedules`
- `/api/push/subscribe`
- `/api/qhse/ai/predictions`
- `/api/qhse/alerts`
- `/api/qhse/approvals`
- `/api/qhse/bulk`
- `/api/qhse/business-continuity`
- `/api/qhse/cross-module-connections`
- `/api/qhse/custom-fields`
- `/api/qhse/custom-fields/[id]`
- `/api/qhse/digital-twin`
- `/api/qhse/environmental`
- `/api/qhse/esg`
- `/api/qhse/food-safety`
- `/api/qhse/health`
- `/api/qhse/incidents`
- `/api/qhse/incidents/[id]`
- `/api/qhse/incidents/[id]/investigation`
- `/api/qhse/inspections`
- `/api/qhse/integration`
- `/api/qhse/intelligent`
- `/api/qhse/metrics`
- `/api/qhse/oil-gas`
- `/api/qhse/pharmaceutical`
- `/api/qhse/regulatory`
- `/api/qhse/reports`
- `/api/qhse/reports/export`
- `/api/qhse/safety-metrics`
- `/api/qhse/search`
- `/api/qhse/standards`
- `/api/qhse/statistics`
- `/api/qhse/templates`
- `/api/qhse/templates/[id]`
- `/api/qhse/test`
- `/api/qhse/training`
- `/api/qhse/webhooks`
- `/api/qhse/webhooks/[id]`
- `/api/qr/agents`
- `/api/qr/analytics`
- `/api/qr/analytics/enterprise`
- `/api/qr/digital-twin`
- `/api/qr/gamification`
- `/api/qr/generate`
- `/api/qr/integrations/compliance`
- `/api/qr/integrations/damage`
- `/api/qr/integrations/incident`
- `/api/qr/integrations/iot`
- `/api/qr/msds`
- `/api/qr/network`
- `/api/qr/realtime`
- `/api/qr/scan/[qrId]`
- `/api/qr/scan/track`
- `/api/qr/scans`
- `/api/qr/search`
- `/api/qr/supply-chain`
- `/api/qr/test`
- `/api/qr/update`
- `/api/qr/voice`
- `/api/realtime`
- `/api/trade-compliance/decision-support`
- `/api/trade-compliance/landed-costs`
- `/api/trade-compliance/licenses`
- `/api/trade-compliance/predictive-analytics`
- `/api/trade-compliance/process-flows`
- `/api/trade-compliance/records`
- `/api/trade-compliance/updates`
- `/api/trade-compliance/workflows`
- `/api/transportation/ai-insights`
- `/api/transportation/blockchain`
- `/api/transportation/carrier-network`
- `/api/transportation/carrier-portal`
- `/api/transportation/carriers`
- `/api/transportation/compliance`
- `/api/transportation/customs/brokers`
- `/api/transportation/customs/declarations`
- `/api/transportation/digital-twins`
- `/api/transportation/edge-computing`
- `/api/transportation/emissions`
- `/api/transportation/fleet`
- `/api/transportation/freight-audit`
- `/api/transportation/government/elm`
- `/api/transportation/integrations`
- `/api/transportation/iot/sensor-data`
- `/api/transportation/journey-analysis`
- `/api/transportation/last-mile`
- `/api/transportation/load-building`
- `/api/transportation/load-matching`
- `/api/transportation/multi-enterprise`
- `/api/transportation/network-modeling`
- `/api/transportation/payments`
- `/api/transportation/predictive`
- `/api/transportation/pricing-intelligence`
- `/api/transportation/proposals`
- `/api/transportation/proposals/[id]/export`
- `/api/transportation/quotes`
- `/api/transportation/realtime`
- `/api/transportation/route-comparison`
- `/api/transportation/scenario-simulation`
- `/api/transportation/shipments`
- `/api/transportation/shipments/[id]`
- `/api/transportation/tracking`
- `/api/transportation/transit-time`
- `/api/transportation/webhooks`
- `/api/truth-engine/board-brief`
- `/api/truth-engine/claims`
- `/api/truth-engine/events`
- `/api/truth-engine/events/stream`
- `/api/truth-engine/export`
- `/api/truth-engine/knowledge-graph`
- `/api/truth-engine/kpis`
- `/api/truth-engine/metrics`
- `/api/truth-engine/modules/metrics`
- `/api/truth-engine/reviews`
- `/api/truth-engine/verification`
- `/api/v1/signatures/certificates`
- `/api/v1/signatures/compliance/verify`
- `/api/v1/signatures/documents`
- `/api/v1/signatures/documents/[id]`
- `/api/v1/signatures/emdha/initiate`
- `/api/v1/signatures/emdha/status/[sessionId]`
- `/api/v1/signatures/health`
- `/api/v1/signatures/nafath/initiate`
- `/api/v1/signatures/nafath/status/[transactionId]`
- `/api/v1/signatures/requests/[id]`
- `/api/v1/signatures/requests/[id]/sign`
- `/api/v1/signatures/requests/pending`
- `/api/v1/signatures/verify/[signatureId]`
- `/api/v1/signatures/webhooks`
- `/api/v1/signatures/workflows`
- `/api/v1/signatures/workflows/[id]`
- `/api/vision-analysis`
- `/api/vision-analysis/auto-capa`
- `/api/vision-analysis/auto-ncr`
- `/api/vision-analysis/batch`
- `/api/warehouse-network/analytics`
- `/api/warehouse-network/export`
- `/api/warehouse-network/networks`
- `/api/warehouse-network/networks/[id]`
- `/api/warehouse-network/optimization`
- `/api/warehouse-network/routes`
- `/api/warehouse-network/transfers`
- `/api/warehouse/[id]`
- `/api/warehouse/[id]/alerts`
- `/api/warehouse/[id]/equipment/[equipmentId]`
- `/api/warehouse/[id]/export`
- `/api/warehouse/[id]/inventory/[itemId]`
- `/api/warehouse/[id]/operations`
- `/api/warehouse/[id]/sensors/[sensorId]`
- `/api/warehouse/[id]/zones/[zoneId]`
- `/api/warehouse/alpr`
- `/api/warehouse/assign-msds`
- `/api/warehouse/config`
- `/api/warehouse/initialize-mock-data`
- `/api/warehouse/security/access-logs`
- `/api/warehouse/security/alerts`
- `/api/warehouse/security/cameras`
- `/api/warehouse/security/incidents`
- `/api/warehouse/security/metrics`
- `/api/warehouse/sustainability`
- `/api/warehouse/sustainability/carbon`
- `/api/warehouse/sustainability/emissions`
- `/api/warehouse/sustainability/energy`
- `/api/warehouse/sustainability/iot`
- `/api/warehouse/sustainability/optimize`
- `/api/warehouse/sustainability/waste`
- `/api/warehouse/vehicle-event`
- `/api/webhooks`
- `/api/webhooks/[id]`
- `/api/whatsapp/send`
- `/api/whatsapp/webhook`
- `/api/wms/ai-analytics/classification/[skuId]`
- `/api/wms/ai-analytics/forecast`
- `/api/wms/ai-analytics/forecast/[skuId]`
- `/api/wms/ai-analytics/optimization/[skuId]`
- `/api/wms/ai-analytics/optimize`
- `/api/wms/ai-analytics/reorder`
- `/api/wms/areas`
- `/api/wms/areas/[id]`
- `/api/wms/areas/export`
- `/api/wms/compliance`
- `/api/wms/fire-safety`
- `/api/wms/inventory`
- `/api/wms/inventory/accuracy/[skuId]`
- `/api/wms/inventory/activity`
- `/api/wms/inventory/alerts`
- `/api/wms/inventory/cycle-count`
- `/api/wms/inventory/metrics`
- `/api/wms/inventory/movements`
- `/api/wms/inventory/recommendations`
- `/api/wms/inventory/scan`
- `/api/wms/inventory/sku/[skuId]`
- `/api/wms/locations`
- `/api/wms/locations/[id]`
- `/api/wms/sku/analytics`
- `/api/wms/sku/analytics/apply`
- `/api/wms/sku/inventory`
- `/api/wms/skus`
- `/api/wms/skus/[id]`
- `/api/wms/skus/[id]/analytics`
- `/api/wms/skus/[id]/compliance`
- `/api/wms/skus/[id]/customers`
- `/api/wms/skus/[id]/customers/[relationshipId]`
- `/api/wms/skus/[id]/packaging`
- `/api/wms/skus/[id]/packaging/levels`
- `/api/wms/skus/[id]/packaging/levels/[levelId]`
- `/api/wms/skus/bulk/export`
- `/api/wms/skus/bulk/import`
- `/api/wms/warehouse-optimization/slotting`

---

## 📝 Type Definitions (73)

- `types/accessibility.ts`
- `types/agents.ts`
- `types/asn.ts`
- `types/bim-marketplace.ts`
- `types/brand-messaging.ts`
- `types/chemical.ts`
- `types/compliance.ts`
- `types/compliance-hierarchy.ts`
- `types/container.ts`
- `types/contract.ts`
- `types/cqrs.ts`
- `types/crm.ts`
- `types/customs-intelligence.ts`
- `types/cycleCounting.ts`
- `types/digital-signature.ts`
- `types/ecosystem.ts`
- `types/entityGraph.ts`
- `types/evidence.ts`
- `types/facility.ts`
- `types/featurePlaybook.ts`
- `types/featureRegistry.ts`
- `types/featureTooltips.ts`
- `types/finance.ts`
- `types/intelligentOrchestration.ts`
- `types/iot.ts`
- `types/journey-analysis.ts`
- `types/knowledgeBase.ts`
- `types/lane-solutions.ts`
- `types/liability.ts`
- `types/license-application.ts`
- `types/lifecycle.ts`
- `types/load-design.ts`
- `types/marketplace.ts`
- `types/marketplace-requirements.ts`
- `types/module-interconnectivity.ts`
- `types/msds.ts`
- `types/msdsSkuLinking.ts`
- `types/overtime.ts`
- `types/picking.ts`
- `types/playbookExtended.ts`
- `types/process-lifecycle.ts`
- `types/procurement.ts`
- `types/project-management.ts`
- `types/proposals.ts`
- `types/proposals-index.ts`
- `types/purchaseOrder.ts`
- `types/qhse.ts`
- `types/qr.ts`
- `types/requisition.ts`
- `types/rfq.ts`
- `types/service-catalog.ts`
- `types/showcase.ts`
- `types/sku.ts`
- `types/spaceUtilization.ts`
- `types/supplyChainSLA.ts`
- `types/tenant.ts`
- `types/tms.ts`
- `types/trade-compliance.ts`
- `types/trade-lanes.ts`
- `types/train-schedules.ts`
- `types/truth-engine.ts`
- `types/user.ts`
- `types/userManagement.ts`
- `types/utility-bills.ts`
- `types/vendor.ts`
- `types/viewContext.ts`
- `types/vision-integration.ts`
- `types/vision-learning.ts`
- `types/warehouse-management.ts`
- `types/warehouseArea.ts`
- `types/warehouseLayout.ts`
- `types/warehouseLocation.ts`
- `types/warehouseOperations.ts`

---

## 📄 Pages (409)

- `app/abc-analysis/page.tsx` (465 lines)
- `app/admin/qr-analytics/cross-module/page.tsx` (140 lines)
- `app/admin/qr-analytics/detailed/page.tsx` (151 lines)
- `app/admin/qr-analytics/executive/page.tsx` (310 lines)
- `app/admin/qr-analytics/operational/page.tsx` (145 lines)
- `app/admin/qr-analytics/page.tsx` (409 lines)
- `app/admin/qr-analytics/realtime/page.tsx` (233 lines)
- `app/admin/qr-analytics/revolutionary/page.tsx` (299 lines)
- `app/agent-orchestration/page.tsx` (184 lines)
- `app/ai-vision-demo/page.tsx` (787 lines)
- `app/ai-vision-unified-enhanced/page.tsx` (680 lines)
- `app/ai-vision-unified/page.tsx` (309 lines)
- `app/ai-vision/anomalies/page.tsx` (176 lines)
- `app/ai-vision/batch/page.tsx` (390 lines)
- `app/ai-vision/chemical/page.tsx` (172 lines)
- `app/ai-vision/healthcare/page.tsx` (192 lines)
- `app/ai-vision/history/history/page.tsx` (16 lines)
- `app/ai-vision/history/page.tsx` (383 lines)
- `app/ai-vision/integration/actions/page.tsx` (125 lines)
- `app/ai-vision/integration/map/page.tsx` (267 lines)
- `app/ai-vision/integration/settings/page.tsx` (91 lines)
- `app/ai-vision/integration/workflows/page.tsx` (145 lines)
- `app/ai-vision/learning/accuracy/page.tsx` (113 lines)
- `app/ai-vision/learning/feedback/page.tsx` (133 lines)
- `app/ai-vision/learning/how-it-works/page.tsx` (93 lines)
- `app/ai-vision/learning/page.tsx` (521 lines)
- `app/ai-vision/learning/patterns/page.tsx` (140 lines)
- `app/ai-vision/learning/rules/page.tsx` (137 lines)
- `app/ai-vision/logistics/page.tsx` (188 lines)
- `app/ai-vision/manufacturing/page.tsx` (183 lines)

... and 379 more pages

---

## 🧩 Components (50 shown)

- `components\accessibility\AccessibilityQuestionnaire.tsx` (757 lines)
- `components\accessibility\AccessibilityQuickAccess.tsx` (198 lines)
- `components\accessibility\AccessibilitySettings.tsx` (821 lines)
- `components\accessibility\index.ts` (11 lines)
- `components\accessibility\IntelligentToast.tsx` (163 lines)
- `components\analytics\TrendAnalysis.tsx` (364 lines)
- `components\ASNChart.tsx` (177 lines)
- `components\ASNDetail.tsx` (695 lines)
- `components\ASNFilters.tsx` (109 lines)
- `components\ASNHeader.tsx` (83 lines)
- `components\ASNMap.tsx` (141 lines)
- `components\ASNModule.tsx` (142 lines)
- `components\ASNPage.tsx` (359 lines)
- `components\ASNStats.tsx` (78 lines)
- `components\ASNTable.tsx` (240 lines)
- `components\auth\AuthWrapper.tsx` (50 lines)
- `components\AutoSaveStatus.tsx` (88 lines)
- `components\barcode\CameraScanner.tsx` (272 lines)
- `components\bim\AnalysisTab.tsx` (567 lines)
- `components\bim\ARVRTab.tsx` (481 lines)
- `components\bim\BIM3DViewer.tsx` (241 lines)
- `components\bim\CollaborationTab.tsx` (579 lines)
- `components\bim\DigitalTwinTab.tsx` (444 lines)
- `components\bim\MarketplaceListingModal.tsx` (386 lines)
- `components\bim\MarketplaceTab.tsx` (436 lines)
- `components\BluedxpCopilot.tsx` (492 lines)
- `components\brand-messaging\BatchGenerator.tsx` (175 lines)
- `components\brand-messaging\BrandMessage.tsx` (86 lines)
- `components\brand-messaging\BrandMessagingDashboard.tsx` (182 lines)
- `components\brand-messaging\CacheStats.tsx` (85 lines)

... and 20 more components

---

## 📚 Dependencies

- **Production:** 41
- **Development:** 9
- **Total:** 50

### Key Dependencies:
- `@apollo/client`
- `@apollo/server`
- `@react-three/drei`
- `@react-three/fiber`
- `@socket.io/redis-adapter`
- `@tailwindcss/postcss`
- `@types/d3`
- `@types/uuid`
- `bpmn-js`
- `chart.js`
- `clsx`
- `d3`
- `date-fns`
- `framer-motion`
- `graphql`
- `gsap`
- `jspdf`
- `jspdf-autotable`
- `lottie-react`
- `ml-matrix`

---

## 🔑 Key Files

- `README.md`
- `package.json`
- `tsconfig.json`
- `next.config.js`
- `tailwind.config.js`
- `lib/modules/registry.ts`
- `lib/services/event-bus/index.ts`
- `lib/services/event-store/index.ts`
- `lib/services/agents/agentOrchestrator.ts`
- `types/user.ts`
- `types/tenant.ts`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `CLAUDE_ACCESS_GUIDE.md`

---

## 📁 File Structure

```
__tests__/ (22 files)
__tests__\api/ (6 files)
__tests__\api\marketplace/ (5 files)
__tests__\api\warehouse-network/ (1 files)
__tests__\components/ (3 files)
__tests__\components\marketplace/ (3 files)
__tests__\load-design/ (5 files)
__tests__\marketplace/ (6 files)
__tests__\qr/ (1 files)
app/ (834 files)
app\abc-analysis/ (1 files)
app\admin/ (7 files)
app\admin\qr-analytics/ (7 files)
app\admin\qr-analytics\cross-module/ (1 files)
app\admin\qr-analytics\detailed/ (1 files)
app\admin\qr-analytics\executive/ (1 files)
app\admin\qr-analytics\operational/ (1 files)
app\admin\qr-analytics\realtime/ (1 files)
app\admin\qr-analytics\revolutionary/ (1 files)
app\agent-orchestration/ (1 files)
app\ai/ (2 files)
app\ai-vision/ (23 files)
app\ai-vision-demo/ (1 files)
app\ai-vision-unified/ (1 files)
app\ai-vision-unified-enhanced/ (1 files)
app\ai-vision\anomalies/ (1 files)
app\ai-vision\batch/ (1 files)
app\ai-vision\chemical/ (1 files)
app\ai-vision\healthcare/ (1 files)
app\ai-vision\history/ (2 files)
app\ai-vision\history\history/ (1 files)
app\ai-vision\integration/ (4 files)
app\ai-vision\integration\actions/ (1 files)
app\ai-vision\integration\map/ (1 files)
app\ai-vision\integration\settings/ (1 files)
app\ai-vision\integration\workflows/ (1 files)
app\ai-vision\learning/ (6 files)
app\ai-vision\learning\accuracy/ (1 files)
app\ai-vision\learning\feedback/ (1 files)
app\ai-vision\learning\how-it-works/ (1 files)
app\ai-vision\learning\patterns/ (1 files)
app\ai-vision\learning\rules/ (1 files)
app\ai-vision\logistics/ (1 files)
app\ai-vision\manufacturing/ (1 files)
app\ai-vision\scene/ (1 files)
app\ai-vision\stream/ (1 files)
app\ai-vision\tracking/ (1 files)
app\ai-vision\video/ (1 files)
app\ai\insights/ (1 files)
app\ai\recommendations/ (1 files)
```


---

## 📖 How to Use This Index

This index provides Claude AI with a comprehensive overview of your codebase.

### For Claude Desktop:
1. Open Claude Desktop
2. Attach this file (`CLAUDE_CODEBASE_INDEX.md`) to your conversation
3. Ask Claude to analyze your codebase, identify gaps, or suggest improvements

### For Claude Web:
1. Copy the contents of this file
2. Paste it into Claude's chat
3. Ask Claude to analyze your codebase

### For GitHub Integration:
1. Commit this file to your repository
2. Grant Claude access to your GitHub repository
3. Claude can analyze your codebase directly

