/**
 * System Health Module Definition
 * 
 * Comprehensive system health monitoring and diagnostics module
 * - Infrastructure monitoring (Database, Redis, Docker, etc.)
 * - Module health tracking
 * - Service status checks
 * - Auto-updating health metrics
 * - Integrated with diagnostics
 * 
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { ModuleDefinition } from './registry'

export const systemHealthModule: ModuleDefinition = {
  id: 'system-health',
  name: 'System Health',
  description: 'Comprehensive system health monitoring, diagnostics, and infrastructure status',
  version: '1.0.0',
  category: 'platform',
  standalone: true,
  dependencies: [], // No dependencies - core platform module
  
  routes: [
    {
      path: '/diagnostics',
      component: 'app/diagnostics/page',
      title: 'System Diagnostics',
      icon: 'ri-health-book-line',
      requiresAuth: true,
    },
    {
      path: '/system-status',
      component: 'app/system-status/page',
      title: 'System Status',
      icon: 'ri-dashboard-line',
      requiresAuth: true,
    },
  ],
  
  components: [
    'components/system-health/HealthDashboard',
    'components/system-health/ServiceStatusCard',
    'components/system-health/ModuleHealthCard',
    'components/system-health/DockerStatusCard',
    'components/system-health/HealthMetrics',
  ],
  
  services: [
    'lib/services/system-health/systemHealthService',
  ],
  
  widgets: [
    {
      id: 'system-health-overview',
      name: 'System Health Overview',
      description: 'Real-time system health overview widget',
      component: 'components/system-health/widgets/HealthOverviewWidget',
      size: 'medium',
    },
    {
      id: 'service-status',
      name: 'Service Status',
      description: 'Infrastructure service status widget',
      component: 'components/system-health/widgets/ServiceStatusWidget',
      size: 'small',
    },
    {
      id: 'module-health',
      name: 'Module Health',
      description: 'Module health monitoring widget',
      component: 'components/system-health/widgets/ModuleHealthWidget',
      size: 'medium',
    },
  ],
  
  apis: [
    {
      endpoint: '/api/system/health',
      method: 'GET',
      description: 'Get system health status',
      requiresAuth: true,
    },
    {
      endpoint: '/api/system/complete-status',
      method: 'GET',
      description: 'Get complete system status (services, modules, docker)',
      requiresAuth: true,
    },
    {
      endpoint: '/api/system-health/status',
      method: 'GET',
      description: 'Get comprehensive health status via service',
      requiresAuth: true,
    },
    {
      endpoint: '/api/system-health/service/:serviceName',
      method: 'GET',
      description: 'Get health status for specific service',
      requiresAuth: true,
    },
    {
      endpoint: '/api/system-health/module/:moduleId',
      method: 'GET',
      description: 'Get health status for specific module',
      requiresAuth: true,
    },
  ],
  
  settings: [
    {
      key: 'autoUpdate',
      value: true,
      type: 'boolean',
      description: 'Enable automatic health status updates',
      required: false,
      default: true,
    },
    {
      key: 'updateInterval',
      value: 30000,
      type: 'number',
      description: 'Health status update interval (milliseconds)',
      required: false,
      default: 30000,
    },
    {
      key: 'cacheExpiry',
      value: 5000,
      type: 'number',
      description: 'Health status cache expiry (milliseconds)',
      required: false,
      default: 5000,
    },
  ],
  
  featureFlags: {
    'auto-update': true,
    'docker-monitoring': true,
    'module-health-tracking': true,
    'service-health-tracking': true,
    'event-bus-integration': true,
  },
  
  enabled: true,
  config: {
    monitoring: {
      enabled: true,
      services: ['database', 'redis', 'docker'],
      modules: 'all',
    },
    autoUpdate: {
      enabled: true,
      interval: 30000,
    },
  },
}




