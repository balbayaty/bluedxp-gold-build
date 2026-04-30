/**
 * Intelligence & Analytics Unified Module
 * 
 * The mind-blowing unified module for root cause analysis, data mining,
 * process mining, and analytics - integrated with ALL modules
 */

import { moduleRegistry, type ModuleDefinition } from './registry'

export const intelligenceAnalyticsModule: ModuleDefinition = {
  id: 'intelligence-analytics',
  name: 'Intelligence & Analytics',
  description: 'Unified intelligence, root cause analysis, data mining, process mining, and analytics across all modules',
  version: '1.0.0',
  category: 'intelligence',
  standalone: false, // Requires other modules for data
  
  // Dependencies on ALL modules (for event capture and analysis)
  dependencies: [
    'wms',
    'tms',
    'qhse',
    'iso-ims',
    'trade-compliance',
    'finance',
    'facility-management',
    'procurement',
    'marketplace',
    'hr',
    'crm',
    'msds',
    'iot',
    'process-lifecycle',
    'warehouse-network',
    'maas',
    'pulse',
    'etw',
    'communication',
    'email',
    'digital-signature',
    'truth-engine',
    'business-intelligence',
  ],
  
  routes: [
    {
      path: '/intelligence',
      component: 'app/intelligence/page.tsx',
      title: 'Intelligence Dashboard',
      name: 'Intelligence Dashboard',
      icon: 'ri-brain-line',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      path: '/intelligence/root-cause',
      component: 'app/intelligence/root-cause/page.tsx',
      title: 'Root Cause Analysis',
      name: 'Root Cause Analysis',
      icon: 'ri-search-line',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      path: '/intelligence/data-mining',
      component: 'app/intelligence/data-mining/page.tsx',
      title: 'Data Mining',
      name: 'Data Mining',
      icon: 'ri-database-2-line',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager'],
    },
    {
      path: '/intelligence/process-mining',
      component: 'app/intelligence/process-mining/page.tsx',
      title: 'Process Mining',
      name: 'Process Mining',
      icon: 'ri-flow-chart-line',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      path: '/intelligence/analytics',
      component: 'app/intelligence/analytics/page.tsx',
      title: 'Analytics',
      name: 'Analytics',
      icon: 'ri-bar-chart-box-line',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor', 'operator'],
    },
  ],
  
  apis: [
    {
      endpoint: '/api/intelligence/root-cause/analyze',
      method: 'POST',
      description: 'Analyze root cause for an issue',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      endpoint: '/api/intelligence/root-cause/:id',
      method: 'GET',
      description: 'Get root cause analysis by ID',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      endpoint: '/api/intelligence/data-mining/mine',
      method: 'POST',
      description: 'Run data mining analysis',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager'],
    },
    {
      endpoint: '/api/intelligence/process-mining/discover',
      method: 'POST',
      description: 'Discover process model',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      endpoint: '/api/intelligence/analytics/aggregate',
      method: 'POST',
      description: 'Aggregate analytics from modules',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor'],
    },
    {
      endpoint: '/api/intelligence/events/capture',
      method: 'POST',
      description: 'Capture event for analysis',
      requiresAuth: true,
      roles: ['admin', 'analyst'],
    },
    {
      endpoint: '/api/intelligence/patterns',
      method: 'GET',
      description: 'Get discovered patterns',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager'],
    },
    {
      endpoint: '/api/intelligence/insights',
      method: 'GET',
      description: 'Get intelligence insights',
      requiresAuth: true,
      roles: ['admin', 'analyst', 'manager', 'supervisor', 'operator'],
    },
  ],
  
  settings: [
    {
      key: 'autoTriggerRCA',
      value: true,
      type: 'boolean',
      description: 'Automatically trigger root cause analysis on anomalies and deviations',
      required: false,
      default: true,
    },
    {
      key: 'dataMiningSchedule',
      value: '0 2 * * *', // Daily at 2 AM
      type: 'string',
      description: 'Cron expression for scheduled data mining',
      required: false,
      default: '0 2 * * *',
    },
    {
      key: 'realTimeAnalytics',
      value: true,
      type: 'boolean',
      description: 'Enable real-time analytics updates',
      required: false,
      default: true,
    },
    {
      key: 'minConfidenceThreshold',
      value: 70,
      type: 'number',
      description: 'Minimum confidence threshold for auto-triggered analysis',
      required: false,
      default: 70,
    },
  ],
  
  featureFlags: {
    'ai-powered-rca': true,
    'cross-module-rca': true,
    'real-time-mining': true,
    'pattern-detection': true,
    'predictive-analytics': true,
    'ml-integration': true,
  },
  
  enabled: true,
  config: {
    // Module-specific configuration
    eventCapture: {
      enabled: true,
      modules: 'all', // Capture from all modules
    },
    analytics: {
      aggregationInterval: 60, // seconds
      realTime: true,
    },
  },
}

// Register the module
if (typeof moduleRegistry !== 'undefined') {
  moduleRegistry.register(intelligenceAnalyticsModule)
}

export default intelligenceAnalyticsModule














