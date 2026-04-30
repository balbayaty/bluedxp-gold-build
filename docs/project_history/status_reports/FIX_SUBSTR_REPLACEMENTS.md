# Fixing .substr() to .substring() replacements

This file tracks the replacements needed:
- `.substr(2, 9)` → `.substring(2, 11)` (produces same 9-character result)

Files to fix:
1. lib/services/hr/ai/aiAssistantService.ts (2 instances)
2. lib/services/finance/integration/unifiedFinanceService.ts (1 instance)
3. lib/services/wms/knowledgeBaseIntegration.ts (1 instance)
4. lib/services/wms/graphIntegration.ts (2 instances)
5. lib/services/wms/decisionIntegration.ts (1 instance)
6. lib/services/wms/copilotIntegration.ts (1 instance)
7. lib/services/wms/qhseIntegration.ts (2 instances)






