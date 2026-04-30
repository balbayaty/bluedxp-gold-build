/**
 * Truth Engine Module Definition
 * Evidence-based, audit-ready, adversarially reviewed platform layer
 */

import { ModuleDefinition } from './registry'

export const truthEngineModule: ModuleDefinition = {
  id: 'truth-engine',
  name: 'Truth Engine',
  description: 'Evidence-based, audit-ready, adversarially reviewed platform layer. Makes every KPI "click-to-proof" and every decision adversarially reviewed.',
  version: '1.0.0',
  category: 'integration',
  standalone: true,
  dependencies: [],
  routes: [
    {
      path: '/truth-engine/dashboard',
      component: 'app/truth-engine/dashboard/page',
      title: 'Truth Dashboard',
      icon: 'ri-dashboard-line',
      requiresAuth: true,
      roles: ['admin', 'manager', 'executive', 'auditor'],
    },
    {
      path: '/truth-timeline/:entityType/:entityId',
      component: 'app/truth-timeline/[entityType]/[entityId]/page',
      title: 'Truth Timeline',
      icon: 'ri-time-line',
      requiresAuth: true,
      roles: ['admin', 'manager', 'auditor'],
    },
    {
      path: '/truth-board',
      component: 'app/truth-board/page',
      title: 'Board Brief',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
      roles: ['admin', 'executive', 'cfo'],
    },
  ],
  components: [
    'app/truth-timeline/[entityType]/[entityId]/page',
    'app/truth-board/page',
  ],
  services: [
    'lib/services/truth-engine',
  ],
  enabled: true,
  config: {
    autoInitialize: true,
    enableAdversarialReview: true,
    enableKPITracking: true,
    enableBoardBrief: true,
  },
}

