# BlueDXP - App Page Scorecard

- Timestamp: 2025-12-22T21:30:18.613Z
- Pages audited: 535
- Overall readiness: 53.2%
- Coverage: 255 registered pages, 280 unregistered pages
- Module routes: 290 (missing pages: 30)

## Top gaps (most frequent issues)

- 95× Route requires auth (per module definition) but page does not appear to enforce auth/redirect
- 92× Uses mock data instead of real database
- 15× Page calls API endpoints that appear to lack apiAuthMiddleware, but route requires auth

## Lowest readiness pages (top 25)

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

## Recommendations (auto-generated)

- Replace mock data with database in 92 pages
- Add database integration to 345 pages
- Fix critical issues in 180 pages