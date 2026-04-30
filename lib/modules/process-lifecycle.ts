/**
 * Process & Lifecycle Management Module
 * Unified platform-wide process and lifecycle management system
 * Consolidates lifecycle, workflow, process mining, and analytics
 */

import { ModuleDefinition } from './registry'

export const processLifecycleModule: ModuleDefinition = {
  id: 'process-lifecycle',
  name: 'Process & Lifecycle Management',
  description: 'Unified platform-wide process and lifecycle management system. Combines lifecycle tracking, workflow automation, process mining, and analytics for all entity types across the entire application. Mind-blowing, layered, deep, and fully interactive.',
  version: '1.0.0',
  category: 'ai', // Platform infrastructure
  standalone: true,
  dependencies: [], // No dependencies - other modules depend on this
  enabled: true,
  
  routes: [
    // Main Dashboard
    {
      path: '/process-lifecycle',
      component: 'app/process-lifecycle/page',
      title: 'Process & Lifecycle Dashboard',
      icon: 'ri-dashboard-3-line',
      requiresAuth: true,
    },
    
    // Lifecycle Management
    {
      path: '/process-lifecycle/lifecycle',
      component: 'app/process-lifecycle/lifecycle/page',
      title: 'Lifecycle Management',
      icon: 'ri-flow-chart-line',
      requiresAuth: true,
    },
    {
      path: '/process-lifecycle/lifecycle/:entityType/:entityId',
      component: 'app/process-lifecycle/lifecycle/[entityType]/[entityId]/page',
      title: 'Entity Lifecycle',
      icon: 'ri-time-line',
      requiresAuth: true,
    },
    
    // Workflow Management
    {
      path: '/process-lifecycle/workflows',
      component: 'app/process-lifecycle/workflows/page',
      title: 'Workflows',
      icon: 'ri-node-tree',
      requiresAuth: true,
    },
    {
      path: '/process-lifecycle/workflows/builder',
      component: 'app/process-lifecycle/workflows/builder/page',
      title: 'Workflow Builder',
      icon: 'ri-tools-line',
      requiresAuth: true,
    },
    {
      path: '/process-lifecycle/workflows/:workflowId',
      component: 'app/process-lifecycle/workflows/[workflowId]/page',
      title: 'Workflow Details',
      icon: 'ri-file-list-line',
      requiresAuth: true,
    },
    
    // Process Mining
    {
      path: '/process-lifecycle/process-mining',
      component: 'app/process-lifecycle/process-mining/page',
      title: 'Process Mining',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
    },
    {
      path: '/process-lifecycle/process-mining/:processType',
      component: 'app/process-lifecycle/process-mining/[processType]/page',
      title: 'Process Analysis',
      icon: 'ri-line-chart-line',
      requiresAuth: true,
    },
    
    // Analytics
    {
      path: '/process-lifecycle/analytics',
      component: 'app/process-lifecycle/analytics/page',
      title: 'Process Analytics',
      icon: 'ri-line-chart-line',
      requiresAuth: true,
    },
    {
      path: '/process-lifecycle/analytics/:entityType',
      component: 'app/process-lifecycle/analytics/[entityType]/page',
      title: 'Entity Analytics',
      icon: 'ri-bar-chart-2-line',
      requiresAuth: true,
    },
  ],
  
  components: [
    // Main Components
    'components/process-lifecycle/ProcessDashboard',
    'components/process-lifecycle/ProcessLifecycleView',
    
    // Lifecycle Components
    'components/process-lifecycle/lifecycle/LifecycleView',
    'components/process-lifecycle/lifecycle/views/TimelineView',
    'components/process-lifecycle/lifecycle/components/StageCard',
    
    // Workflow Components
    'components/trade-compliance/WorkflowBuilder', // Reuse existing
    'components/process-lifecycle/workflow/WorkflowExecutionView',
    
    // Analytics Components
    'components/process-lifecycle/analytics/ProcessAnalytics',
    'components/process-lifecycle/analytics/InsightsPanel',
  ],
  
  services: [
    // Core Services
    'lib/services/process-lifecycle/core/processOrchestrator',
    'lib/services/process-lifecycle/core/processRegistry',
    
    // Lifecycle Service
    'lib/services/process-lifecycle/lifecycle/lifecycleService',
    
    // Workflow Service
    'lib/services/process-lifecycle/workflow/workflowService',
    
    // Process Mining Service
    'lib/services/process-lifecycle/process-mining/processMiningService',
    
    // Analytics Service
    'lib/services/process-lifecycle/analytics/processAnalyticsService',
  ],
  
  config: {
    // Lifecycle configurations
    lifecycles: {
      'SALES_ORDER': 'lib/services/process-lifecycle/lifecycle/configurations/salesOrderLifecycle',
      'PURCHASE_ORDER': 'lib/services/process-lifecycle/lifecycle/configurations/purchaseOrderLifecycle',
      'ASN': 'lib/services/process-lifecycle/lifecycle/configurations/asnLifecycle',
      'NCR': 'lib/services/process-lifecycle/lifecycle/configurations/ncrLifecycle',
      'CAPA': 'lib/services/process-lifecycle/lifecycle/configurations/capaLifecycle',
    },
    
    // Workflow templates
    workflowTemplates: {
      'order-approval': 'lib/services/process-lifecycle/workflow/templates/orderApproval',
      'quality-check': 'lib/services/process-lifecycle/workflow/templates/qualityCheck',
    },
    
    // Process mining settings
    processMining: {
      enabled: true,
      dataRetention: 90, // days
      analysisInterval: 'daily',
    },
    
    // Analytics settings
    analytics: {
      enabled: true,
      realTimeUpdates: true,
      predictiveInsights: true,
      aiRecommendations: true,
    },
  },
}

