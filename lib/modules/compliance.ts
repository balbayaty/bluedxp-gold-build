/**
 * Compliance Module Registration
 * Comprehensive compliance management module
 */

import { ModuleDefinition } from './registry'
import { initializeSaudiArabiaRequirements } from '../services/compliance/regulatory-frameworks/saudi-arabia'

export const complianceModule: ModuleDefinition = {
  id: 'compliance',
  name: 'Compliance Management',
  description: 'Comprehensive compliance management covering Saudi Arabia, Middle East, and global regulations. Includes AI/ML monitoring, auto-updates, governance workflows, authority hierarchy, deep local knowledge, and interactive tools.',
  version: '2.0.0',
  category: 'other',
  standalone: true,
  enabled: true,
  routes: [
    {
      path: '/compliance',
      component: 'app/compliance/page',
      title: 'Compliance Dashboard',
      icon: 'ShieldCheckIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'COMPLIANCE_OFFICER'],
    },
    {
      path: '/compliance/tools/requirement-builder',
      component: 'components/compliance/tools/RequirementBuilder',
      title: 'Requirement Builder',
      icon: 'FileAddIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER'],
    },
    {
      path: '/compliance/tools/knowledge',
      component: 'components/compliance/tools/LocalKnowledgeBrowser',
      title: 'Local Knowledge Browser',
      icon: 'BookOpenIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'COMPLIANCE_OFFICER'],
    },
  ],
  components: [
    'components/compliance/ComplianceOverview',
    'components/compliance/ComplianceByCategory',
    'components/compliance/ComplianceByAuthority',
    'components/compliance/RecentViolations',
    'components/compliance/PendingApprovals',
    'components/compliance/ComplianceTrends',
    'components/compliance/ComplianceAlerts',
    'components/compliance/EnhancedComplianceDashboard',
    'components/compliance/tools/RequirementBuilder',
    'components/compliance/tools/LocalKnowledgeBrowser',
  ],
  services: [
    'lib/services/compliance/complianceService',
    'lib/services/compliance/mlMonitoringService',
    'lib/services/compliance/governanceService',
    'lib/services/compliance/authorityHierarchyService',
    'lib/services/compliance/complianceToolsService',
    // Saudi Alignment Engine
    'lib/services/saudi-alignment',
  ],
  dependencies: ['knowledge-base'],
  config: {
    autoComplianceCheck: true,
    mlMonitoring: true,
    autoApproveThreshold: 90,
    syncFrequency: 'DAILY',
    authorityHierarchyEnabled: true,
    localKnowledgeEnabled: true,
    interactiveToolsEnabled: true,
  },
}

// Initialize function (called when module is enabled)
export async function initializeComplianceModule(): Promise<void> {
  try {
    await initializeSaudiArabiaRequirements()
    console.log('Compliance module initialized successfully')
  } catch (error) {
    console.error('Error initializing compliance module:', error)
    throw error
  }
}

