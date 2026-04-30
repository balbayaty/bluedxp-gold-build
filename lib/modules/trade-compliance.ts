/**
 * Trade Compliance Module Registration
 * Comprehensive import/export trade compliance module with ML integration
 */

import { ModuleDefinition } from './registry'

export const tradeComplianceModule: ModuleDefinition = {
  id: 'trade-compliance',
  name: 'Trade Compliance',
  description: 'Comprehensive import/export trade compliance module covering Saudi Arabia, Middle East, and global requirements. Includes ML-powered requirement prediction, landed cost calculation, process flow management, Civil Defense integration for chemicals, and SFDA integration for food and medicine.',
  version: '1.0.0',
  category: 'compliance',
  standalone: true,
  enabled: true,
  dependencies: ['compliance', 'ml-registry'],
  components: [
    'components/trade-compliance/TradeComplianceDashboard',
    'components/trade-compliance/TradeComplianceRecordForm',
    'components/trade-compliance/ProcessFlowViewer',
    'components/trade-compliance/LandedCostCalculator',
    'components/trade-compliance/LicenseManager',
    'components/trade-compliance/CivilDefenseLicenseForm',
    'components/trade-compliance/SFDALicenseForm',
    'components/trade-compliance/RequirementPredictor',
  ],
  services: [
    'lib/services/trade-compliance/tradeComplianceService',
    'lib/services/trade-compliance/landedCostService',
    'lib/services/trade-compliance/civilDefenseService',
    'lib/services/trade-compliance/sfdaService',
    'lib/services/trade-compliance/regulatoryFrameworks',
  ],
  routes: [
    {
      path: '/trade-compliance',
      component: 'app/trade-compliance/page',
      title: 'Trade Compliance Dashboard',
      icon: 'ShieldCheckIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER', 'CUSTOMER_ADMIN'],
    },
    {
      path: '/trade-compliance/records',
      component: 'app/trade-compliance/records/page',
      title: 'Trade Compliance Records',
      icon: 'DocumentTextIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER'],
    },
    {
      path: '/trade-compliance/create',
      component: 'app/trade-compliance/create/page',
      title: 'Create Trade Compliance Record',
      icon: 'PlusCircleIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER', 'CUSTOMER_ADMIN'],
    },
    {
      path: '/trade-compliance/licenses',
      component: 'app/trade-compliance/licenses/page',
      title: 'License Management',
      icon: 'DocumentCheckIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER'],
    },
    {
      path: '/trade-compliance/civil-defense',
      component: 'app/trade-compliance/civil-defense/page',
      title: 'Civil Defense Licenses',
      icon: 'ShieldExclamationIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER'],
    },
    {
      path: '/trade-compliance/sfda',
      component: 'app/trade-compliance/sfda/page',
      title: 'SFDA Licenses',
      icon: 'BeakerIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER'],
    },
    {
      path: '/trade-compliance/landed-costs',
      component: 'app/trade-compliance/landed-costs/page',
      title: 'Landed Cost Calculator',
      icon: 'CalculatorIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER', 'CUSTOMER_ADMIN'],
    },
    {
      path: '/trade-compliance/process-flows',
      component: 'app/trade-compliance/process-flows/page',
      title: 'Process Flows',
      icon: 'FlowIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'COMPLIANCE_MANAGER', 'TRADE_COMPLIANCE_OFFICER'],
    },
  ],
  config: {
    mlEnabled: {
      type: 'boolean',
      default: true,
      description: 'Enable ML-powered requirement prediction',
    },
    autoCalculateLandedCost: {
      type: 'boolean',
      default: true,
      description: 'Automatically calculate landed costs',
    },
    autoApplyForLicenses: {
      type: 'boolean',
      default: false,
      description: 'Automatically apply for required licenses',
    },
    enableCivilDefenseIntegration: {
      type: 'boolean',
      default: true,
      description: 'Enable Civil Defense license integration',
    },
    enableSFDAIntegration: {
      type: 'boolean',
      default: true,
      description: 'Enable SFDA license integration',
    },
  },
  initialize: async () => {
    // Initialize regulatory frameworks
    const { regulatoryFrameworksService } = await import('../services/trade-compliance/regulatoryFrameworks')
    console.log('Trade Compliance module initialized with regulatory frameworks')
    
    // Register ML models (if not already registered)
    // This would typically be done during ML model registration phase
    console.log('Trade Compliance module ready')
  },
}

