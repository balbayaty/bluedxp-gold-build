/**
 * MaaS (Manufacturing as a Service) Module
 * 
 * 12 shared services pillars
 * Multi-tenant manufacturing
 * 
 * @module maas
 */

import { ModuleDefinition } from './registry'

export const maasModule: ModuleDefinition = {
  id: 'maas',
  name: 'Manufacturing as a Service',
  description: 'MaaS platform with 12 shared services pillars, multi-tenant manufacturing, and comprehensive resource allocation',
  version: '1.0.0',
  category: 'other',
  standalone: true,
  dependencies: ['wms', 'tms'],
  enabled: true,
  routes: [
    {
      path: '/maas',
      component: 'app/maas/page',
      title: 'MaaS Dashboard',
      icon: 'ri-factory-line',
      requiresAuth: true,
    },
    {
      path: '/maas/pillars',
      component: 'app/maas/pillars/page',
      title: 'MaaS Pillars',
      icon: 'ri-stack-line',
      requiresAuth: true,
    },
    {
      path: '/maas/tenants',
      component: 'app/maas/tenants/page',
      title: 'MaaS Tenants',
      icon: 'ri-group-line',
      requiresAuth: true,
    },
    {
      path: '/maas/revenue',
      component: 'app/maas/revenue/page',
      title: 'Revenue Management',
      icon: 'ri-money-dollar-circle-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/maas/MaaSDashboard',
    'components/maas/PillarCard',
    'components/maas/TenantManagement',
    'components/maas/ResourceAllocation',
    'components/maas/RevenueDashboard',
  ],
  services: [
    'lib/services/maas',
  ],
  config: {
    pillars: [
      'SMART_FACTORY_INFRASTRUCTURE',
      'ROBOTICS_AUTOMATION',
      'QUALITY_ASSURANCE_LABS',
      'LOGISTICS_HUB',
      'TALENT_TRAINING_ACADEMY',
      'PROCUREMENT_CONSORTIUM',
      'SUSTAINABILITY_SERVICES',
      'DIGITAL_TWIN_PLATFORM',
      'COMPLIANCE_CERTIFICATION',
      'RD_COLLABORATION_HUB',
      'FINANCIAL_SERVICES',
      'CUSTOMER_SUCCESS_PLATFORM',
    ],
    multiTenantIsolation: true,
    revenueTracking: true,
  },
}
