# Code Quality Report

**Date:** 2026-01-05T09:47:14.887Z

## Summary

- **Total Files Analyzed:** 3684
- **Files with Commented Imports:** 24
- **Files with Commented Code:** 689
- **Total TODOs/FIXMEs:** 463
- **Files Over 500 Lines:** 526

## Files with Commented Imports

- `app\api\ai\logistics-debug\route.ts`
- `components\copilot\HazalyzeCopilotWidget.tsx`
- `components\InboundPage.tsx`
- `components\qhse\RealTimeQHSEDashboard.tsx`
- `lib\services\finance\fixedAssetsService.ts`
- `lib\services\finance\multiCurrencyService.ts`
- `lib\services\marketplace\marketplaceRecommendationService.ts`
- `lib\services\procurement\aiSourcingService.ts`
- `lib\services\procurement\blockchainService.ts`
- `lib\services\procurement\computerVisionService.ts`
- `lib\services\procurement\defiIntegrationService.ts`
- `lib\services\procurement\digitalTwinService.ts`
- `lib\services\procurement\integration\drawingBIMIntegration.ts`
- `lib\services\procurement\integration\facilityIntegration.ts`
- `lib\services\procurement\integration\financeIntegration.ts`
- `lib\services\procurement\integration\hrIntegration.ts`
- `lib\services\procurement\integration\marketplaceIntegration.ts`
- `lib\services\procurement\integration\qualityComplianceIntegration.ts`
- `lib\services\procurement\integration\safetyEnvironmentalIntegration.ts`
- `lib\services\procurement\integration\wmsIntegration.ts`
- `lib\services\procurement\iotIntegrationService.ts`
- `lib\services\procurement\nlpService.ts`
- `lib\services\procurement\predictiveAnalyticsService.ts`
- `lib\services\procurement\sourcingService.ts`

## Files with Commented Code Blocks

- `app\actions\wms\putawayActions.ts`
- `app\actions\wms\warehouseSettings.ts`
- `app\api\ai\logistics-debug\route.ts`
- `app\api\camera-proxy\route.ts`
- `app\api\chemical\analyze-comprehensive\route.ts`
- `app\api\chemical\msds\list\route.ts`
- `app\api\customer-portal\approve\route.ts`
- `app\api\debug\verify-warehouse\route.ts`
- `app\api\digital-signatures\documents\route.ts`
- `app\api\etw\[id]\export\proof-bundle\route.ts`
- `app\api\facility\assets\route.ts`
- `app\api\facility\maintenance\route.ts`
- `app\api\geofence\zones\bulk-import\route.ts`
- `app\api\hr\attendance\route.ts`
- `app\api\hr\employees\route.ts`
- `app\api\hr\payroll\route.ts`
- `app\api\hr\training\route.ts`
- `app\api\load-design\realtime\route.ts`
- `app\api\maas\tenants\route.ts`
- `app\api\msds\assign-warehouse\route.ts`
- `app\api\msds-sku-linking\links\route.ts`
- `app\api\msds-sku-linking\links\[id]\route.ts`
- `app\api\proposals\ab-tests\route.ts`
- `app\api\proposals\ab-tests\[id]\route.ts`
- `app\api\proposals\content-blocks\route.ts`
- `app\api\proposals\content-blocks\[id]\route.ts`
- `app\api\proposals\enhanced\route.ts`
- `app\api\proposals\follow-up-rules\route.ts`
- `app\api\proposals\rfq\route.ts`
- `app\api\proposals\templates\marketplace\route.ts`
- `app\api\proposals\[id]\collaboration\route.ts`
- `app\api\proposals\[id]\compliance\route.ts`
- `app\api\proposals\[id]\contract\route.ts`
- `app\api\proposals\[id]\follow-ups\route.ts`
- `app\api\proposals\[id]\sign\route.ts`
- `app\api\proposals\[id]\tracking\heatmap\route.ts`
- `app\api\proposals\[id]\tracking\route.ts`
- `app\api\rfi\route.ts`
- `app\api\rfi\[id]\route.ts`
- `app\api\shipments\[id]\psychology\route.ts`
- `app\api\shipments\[id]\quantum-state\route.ts`
- `app\api\sla-kpi\unified\compliance\route.ts`
- `app\api\sla-kpi\unified\kpi\route.ts`
- `app\api\sla-kpi\unified\route.ts`
- `app\api\system\health\route.ts`
- `app\api\system-admin\comprehensive-metrics\route.ts`
- `app\api\tms\init-database\route.ts`
- `app\api\transportation\iot\sensor-data\route.ts`
- `app\api\transportation\journey-analysis\route.ts`
- `app\api\warehouse\alpr\route.ts`

... and 639 more files

## Files with TODOs (Top 30)

- `lib\services\sla-kpi\unifiedSlaKpiService.ts` - 15 items
- `lib\services\opc-ua-monitoring\service.ts` - 10 items
- `lib\services\tms\detentionService.ts` - 10 items
- `lib\services\auth\authService.ts` - 9 items
- `lib\services\procurement\aiSourcingService.ts` - 9 items
- `lib\services\tms\laneService.ts` - 9 items
- `lib\services\workspace\integrations\emailService.ts` - 9 items
- `app\api\wms\inventory\metrics\route.ts` - 8 items
- `components\OutboundDetail.tsx` - 8 items
- `lib\services\procurement\computerVisionService.ts` - 7 items
- `lib\services\procurement\integration\financeIntegration.ts` - 7 items
- `lib\services\tms\podService.ts` - 7 items
- `lib\adapters\procurement\ediAdapter.ts` - 6 items
- `lib\services\procurement\blockchainService.ts` - 6 items
- `lib\services\procurement\eInvoicingService.ts` - 6 items
- `lib\services\procurement\integration\erpIntegration.ts` - 6 items
- `lib\services\procurement\nlpService.ts` - 6 items
- `lib\services\procurement\predictiveAnalyticsService.ts` - 6 items
- `lib\services\workspace\widgetService.ts` - 6 items
- `lib\adapters\rabet\auth\index.ts` - 5 items
- `lib\services\digital-signature\workflowService.ts` - 5 items
- `lib\services\dmarc-monitoring\service.ts` - 5 items
- `lib\services\finance\multiCurrencyService.ts` - 5 items
- `lib\services\finance\periodClosingService.ts` - 5 items
- `lib\services\intelligence-analytics\process-mining\processMiningEngine.ts` - 5 items
- `lib\services\procurement\defiIntegrationService.ts` - 5 items
- `lib\services\procurement\digitalTwinService.ts` - 5 items
- `lib\services\procurement\integration\hrIntegration.ts` - 5 items
- `lib\services\procurement\integration\qualityComplianceIntegration.ts` - 5 items
- `lib\services\procurement\integration\safetyEnvironmentalIntegration.ts` - 5 items

## Large Files (Top 20)

- `app\msds\page.tsx` - 4390 lines
- `components\marketplace\ServiceRequirementFormFields.tsx` - 3998 lines
- `lib\services\transportation\database\transportationDatabaseAdapter.ts` - 3603 lines
- `lib\services\navigation\defaultNavigation.ts` - 3557 lines
- `components\copilot\HazalyzeCopilotWidget.tsx` - 2678 lines
- `components\OutboundDetail.tsx` - 2441 lines
- `components\LogisticsIntelligencePlatform.tsx` - 2084 lines
- `lib\services\proposals\unifiedProposalService.ts` - 2003 lines
- `app\chemical-database\page.tsx` - 1946 lines
- `app\ai-vision\page.tsx` - 1822 lines
- `app\warehouses\[id]\page.tsx` - 1682 lines
- `app\proposals\rfi\new\page.tsx` - 1660 lines
- `components\dashboards\RealTimeWarehouseDashboard.tsx` - 1619 lines
- `lib\services\proposals\universalIntelligentProposalService.ts` - 1591 lines
- `app\goods-receipt\page.tsx` - 1481 lines
- `app\feature-intelligence\page.tsx` - 1467 lines
- `lib\services\truth-engine\truthEngineService.ts` - 1455 lines
- `app\picking\page.tsx` - 1435 lines
- `app\settings\users\page.tsx` - 1432 lines
- `components\dashboards\UltimateConsolidatedDashboard.tsx` - 1418 lines

