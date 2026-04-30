# BlueDXP - Page Backlog (from scorecard)

Generated from: `reports/APP_PAGE_SCORECARD.json`
- Timestamp: 2025-12-22T17:45:23.096Z
- Pages audited: 531
- Overall readiness: 53.1%
- Coverage: 251 registered, 280 unregistered

## Top issue types (counts)

- 95× Route requires auth (per module definition) but page does not appear to enforce auth/redirect
- 92× Uses mock data instead of real database
- 15× Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth

## Priority Queue A — Auth gaps on routes marked requiresAuth
These should be fixed early because they block safe production.

| Module | Page | Score | Registered routes |
|---|---|---:|---|
| facility | `facility/dashboard` | 0 | /facility/dashboard (facility-management) |
| facility | `facility/regulatory` | 0 | /facility/regulatory (facility-management) |
| intelligent-orchestration | `intelligent-orchestration/process-mining` | 5 | /intelligent-orchestration/process-mining (hazalyze) |
| ai-vision | `ai-vision/history` | 9 | /ai-vision/history (hazalyze) |
| ai-vision | `ai-vision/stream` | 9 | /ai-vision/stream (hazalyze) |
| qhse | `qhse/regulatory` | 9 | /qhse/regulatory (qhse) |
| qhse | `qhse/search` | 9 | /qhse/search (qhse) |
| qhse | `qhse/training` | 9 | /qhse/training (qhse) |
| warehouse-network | `warehouse-network` | 9 | /warehouse-network (warehouse-network) |
| digital-signatures | `digital-signatures/dashboard` | 9 | /digital-signatures/dashboard (digital-signature) |
| facility | `facility/utility-bills` | 9 | /facility/utility-bills (facility-management) |
| ai-vision | `ai-vision/anomalies` | 11 | /ai-vision/anomalies (hazalyze) |
| ai-vision | `ai-vision` | 11 | /ai-vision (hazalyze) |
| ai-vision | `ai-vision/tracking` | 11 | /ai-vision/tracking (hazalyze) |
| qhse | `qhse/bulk` | 11 | /qhse/bulk (qhse) |
| qhse | `qhse/esg` | 11 | /qhse/esg (qhse) |
| qhse | `qhse/safety-metrics` | 11 | /qhse/safety-metrics (qhse) |
| facility | `facility/bim` | 16 | /facility/bim (facility-management) |
| settings | `settings/ai` | 19 | /settings/ai (hazalyze) |
| iot | `iot/devices` | 19 | /iot/devices (iot) |
| process-lifecycle | `process-lifecycle/lifecycle` | 19 | /process-lifecycle/lifecycle (process-lifecycle) |
| process-lifecycle | `process-lifecycle/workflows` | 19 | /process-lifecycle/workflows (process-lifecycle) |
| facility | `facility/abalady` | 19 | /facility/abalady (facility-management) |
| knowledge-base | `knowledge-base` | 19 | /knowledge-base (hazalyze) |
| intelligent-orchestration | `intelligent-orchestration/communication` | 20 | /intelligent-orchestration/communication (hazalyze) |
| intelligent-orchestration | `intelligent-orchestration/compliance` | 20 | /intelligent-orchestration/compliance (hazalyze) |
| intelligent-orchestration | `intelligent-orchestration/insights` | 20 | /intelligent-orchestration/insights (hazalyze) |
| intelligent-orchestration | `intelligent-orchestration/predictive` | 20 | /intelligent-orchestration/predictive (hazalyze) |
| intelligent-orchestration | `intelligent-orchestration/root-cause` | 20 | /intelligent-orchestration/root-cause (hazalyze) |
| iot | `iot` | 21 | /iot (iot) |
| ai-vision | `ai-vision/chemical` | 21 | /ai-vision/chemical (hazalyze) |
| ai-vision | `ai-vision/healthcare` | 21 | /ai-vision/healthcare (hazalyze) |
| ai-vision | `ai-vision/logistics` | 21 | /ai-vision/logistics (hazalyze) |
| ai-vision | `ai-vision/manufacturing` | 21 | /ai-vision/manufacturing (hazalyze) |
| ai-vision | `ai-vision/scene` | 21 | /ai-vision/scene (hazalyze) |
| ai-vision | `ai-vision/video` | 21 | /ai-vision/video (hazalyze) |
| ai | `ai/insights` | 21 | /ai/insights (hazalyze) |
| qhse | `qhse/analytics` | 21 | /qhse/analytics (qhse) |
| warehouse-network | `warehouse-network/optimization` | 21 | /warehouse-network/optimization (warehouse-network) |
| process-lifecycle | `process-lifecycle/analytics` | 21 | /process-lifecycle/analytics (process-lifecycle) |
| process-lifecycle | `process-lifecycle/process-mining` | 21 | /process-lifecycle/process-mining (process-lifecycle) |
| process-lifecycle | `process-lifecycle/workflows/[workflowId]` | 21 | /process-lifecycle/workflows/:workflowId (process-lifecycle) |
| facility | `facility/civil-defense` | 21 | /facility/civil-defense (facility-management) |
| facility | `facility/licenses` | 21 | /facility/licenses (facility-management) |
| facility | `facility/utility-bills/analytics` | 21 | /facility/utility-bills/analytics (facility-management) |
| facility | `facility/cad` | 26 | /facility/cad (facility-management) |
| facility | `facility/digital-twin` | 26 | /facility/digital-twin (facility-management) |
| ai | `ai/recommendations` | 28 | /ai/recommendations (hazalyze) |
| facility | `facility/iot` | 28 | /facility/iot (facility-management) |
| pulse | `pulse/recognition` | 29 | /pulse/recognition (pulse) |

## Priority Queue B — Mock data pages
These need service + API integration before replacing mock data.

| Module | Page | Score | Notes |
|---|---|---:|---|
| facility | `facility/dashboard` | 0 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/regulatory` | 0 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/process-mining` | 5 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| chemical-safety | `chemical-safety/compatibility` | 14 | Uses mock data instead of real database |
| chemical-safety | `chemical-safety/hazards` | 14 | Uses mock data instead of real database |
| skus | `skus` | 14 | Uses mock data instead of real database |
| marketplace | `marketplace/bookings/new` | 16 | Uses mock data instead of real database |
| marketplace | `marketplace/listings/new` | 16 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/networks/new` | 16 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/transfers/new` | 16 | Uses mock data instead of real database |
| approvals | `approvals` | 16 | Uses mock data instead of real database |
| audit-management | `audit-management` | 16 | Uses mock data instead of real database |
| batches | `batches` | 16 | Uses mock data instead of real database |
| capa-management | `capa-management` | 16 | Uses mock data instead of real database |
| cycle-counting | `cycle-counting` | 16 | Uses mock data instead of real database |
| damage | `damage` | 16 | Uses mock data instead of real database |
| document-center | `document-center` | 16 | Uses mock data instead of real database |
| expiry-management | `expiry-management` | 16 | Uses mock data instead of real database |
| goods-receipt | `goods-receipt` | 16 | Uses mock data instead of real database |
| holds | `holds` | 16 | Uses mock data instead of real database |
| incident-report | `incident-report` | 16 | Uses mock data instead of real database |
| inspection-checklist | `inspection-checklist` | 16 | Uses mock data instead of real database |
| inspection-lots | `inspection-lots` | 16 | Uses mock data instead of real database |
| inventory | `inventory` | 16 | Uses mock data instead of real database |
| ncr | `ncr` | 16 | Uses mock data instead of real database |
| ncr-management | `ncr-management` | 16 | Uses mock data instead of real database |
| picking | `picking` | 16 | Uses mock data instead of real database |
| risk-management | `risk-management` | 16 | Uses mock data instead of real database |
| sales-orders | `sales-orders` | 16 | Uses mock data instead of real database |
| stock-alerts | `stock-alerts` | 16 | Uses mock data instead of real database |
| training-management | `training-management` | 16 | Uses mock data instead of real database |
| user-management | `user-management` | 16 | Uses mock data instead of real database |
| marketplace | `marketplace/providers/bookings` | 18 | Uses mock data instead of real database |
| marketplace | `marketplace/providers/dashboard` | 18 | Uses mock data instead of real database |
| dashboard | `dashboard/business-development` | 18 | Uses mock data instead of real database |
| reports | `reports/operational` | 18 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/transfers` | 18 | Uses mock data instead of real database |
| demo | `demo/notifications` | 18 | Uses mock data instead of real database |
| my-capa-workspace | `my-capa-workspace` | 18 | Uses mock data instead of real database |
| my-tasks | `my-tasks` | 18 | Uses mock data instead of real database |
| test-notifications | `test-notifications` | 18 | Uses mock data instead of real database |
| intelligent-orchestration | `intelligent-orchestration/communication` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/compliance` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/insights` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/predictive` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/root-cause` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| integration | `integration/carriers` | 28 | Uses mock data instead of real database |
| proposals | `proposals/rfq` | 28 | Uses mock data instead of real database |
| settings | `settings/users` | 28 | Uses mock data instead of real database |
| abc-analysis | `abc-analysis` | 28 | Uses mock data instead of real database |

## Priority Queue C — Lowest readiness pages (top 100)

| Module | Page | Score | Key issues |
|---|---|---:|---|
| facility | `facility/dashboard` | 0 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/regulatory` | 0 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/process-mining` | 5 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/history` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| ai-vision | `ai-vision/stream` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/regulatory` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/search` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/training` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| warehouse-network | `warehouse-network` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| digital-signatures | `digital-signatures/dashboard` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| facility | `facility/utility-bills` | 9 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| ai-vision | `ai-vision/anomalies` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| ai-vision | `ai-vision` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| ai-vision | `ai-vision/tracking` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/bulk` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/esg` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| qhse | `qhse/safety-metrics` | 11 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| chemical-safety | `chemical-safety/compatibility` | 14 | Uses mock data instead of real database |
| chemical-safety | `chemical-safety/hazards` | 14 | Uses mock data instead of real database |
| skus | `skus` | 14 | Uses mock data instead of real database |
| marketplace | `marketplace/bookings/new` | 16 | Uses mock data instead of real database |
| marketplace | `marketplace/listings/new` | 16 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/networks/new` | 16 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/transfers/new` | 16 | Uses mock data instead of real database |
| facility | `facility/bim` | 16 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect; Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth |
| approvals | `approvals` | 16 | Uses mock data instead of real database |
| audit-management | `audit-management` | 16 | Uses mock data instead of real database |
| batches | `batches` | 16 | Uses mock data instead of real database |
| capa-management | `capa-management` | 16 | Uses mock data instead of real database |
| cycle-counting | `cycle-counting` | 16 | Uses mock data instead of real database |
| damage | `damage` | 16 | Uses mock data instead of real database |
| document-center | `document-center` | 16 | Uses mock data instead of real database |
| expiry-management | `expiry-management` | 16 | Uses mock data instead of real database |
| goods-receipt | `goods-receipt` | 16 | Uses mock data instead of real database |
| holds | `holds` | 16 | Uses mock data instead of real database |
| incident-report | `incident-report` | 16 | Uses mock data instead of real database |
| inspection-checklist | `inspection-checklist` | 16 | Uses mock data instead of real database |
| inspection-lots | `inspection-lots` | 16 | Uses mock data instead of real database |
| inventory | `inventory` | 16 | Uses mock data instead of real database |
| ncr | `ncr` | 16 | Uses mock data instead of real database |
| ncr-management | `ncr-management` | 16 | Uses mock data instead of real database |
| picking | `picking` | 16 | Uses mock data instead of real database |
| risk-management | `risk-management` | 16 | Uses mock data instead of real database |
| sales-orders | `sales-orders` | 16 | Uses mock data instead of real database |
| stock-alerts | `stock-alerts` | 16 | Uses mock data instead of real database |
| training-management | `training-management` | 16 | Uses mock data instead of real database |
| user-management | `user-management` | 16 | Uses mock data instead of real database |
| marketplace | `marketplace/providers/bookings` | 18 | Uses mock data instead of real database |
| marketplace | `marketplace/providers/dashboard` | 18 | Uses mock data instead of real database |
| dashboard | `dashboard/business-development` | 18 | Uses mock data instead of real database |
| reports | `reports/operational` | 18 | Uses mock data instead of real database |
| warehouse-network | `warehouse-network/transfers` | 18 | Uses mock data instead of real database |
| demo | `demo/notifications` | 18 | Uses mock data instead of real database |
| my-capa-workspace | `my-capa-workspace` | 18 | Uses mock data instead of real database |
| my-tasks | `my-tasks` | 18 | Uses mock data instead of real database |
| test-notifications | `test-notifications` | 18 | Uses mock data instead of real database |
| settings | `settings/ai` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| iot | `iot/devices` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| process-lifecycle | `process-lifecycle/lifecycle` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| process-lifecycle | `process-lifecycle/workflows` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/abalady` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| knowledge-base | `knowledge-base` | 19 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/communication` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/compliance` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/insights` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/predictive` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| intelligent-orchestration | `intelligent-orchestration/root-cause` | 20 | Uses mock data instead of real database; Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| iot | `iot` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/chemical` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/healthcare` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/logistics` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/manufacturing` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/scene` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai-vision | `ai-vision/video` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| ai | `ai/insights` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| qhse | `qhse/analytics` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| warehouse-network | `warehouse-network/optimization` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| process-lifecycle | `process-lifecycle/analytics` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| process-lifecycle | `process-lifecycle/process-mining` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| process-lifecycle | `process-lifecycle/workflows/[workflowId]` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/civil-defense` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/licenses` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/utility-bills/analytics` | 21 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/cad` | 26 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| facility | `facility/digital-twin` | 26 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| integration | `integration/carriers` | 28 | Uses mock data instead of real database |
| proposals | `proposals/rfq` | 28 | Uses mock data instead of real database |
| settings | `settings/users` | 28 | Uses mock data instead of real database |
| ai | `ai/recommendations` | 28 | Route requires auth (per module definition) but page does not appear to enforce auth/redirect |
| abc-analysis | `abc-analysis` | 28 | Uses mock data instead of real database |
| bins | `bins` | 28 | Uses mock data instead of real database |
| certificates | `certificates` | 28 | Uses mock data instead of real database |
| cross-docking | `cross-docking` | 28 | Uses mock data instead of real database |
| customers | `customers` | 28 | Uses mock data instead of real database |
| delivery-note | `delivery-note` | 28 | Uses mock data instead of real database |
| goods-issue | `goods-issue` | 28 | Uses mock data instead of real database |
| materials | `materials` | 28 | Uses mock data instead of real database |
| order-confirmation | `order-confirmation` | 28 | Uses mock data instead of real database |
| orders | `orders` | 28 | Uses mock data instead of real database |
| pick-release | `pick-release` | 28 | Uses mock data instead of real database |
