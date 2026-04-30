/**
 * Core Platform Module Definition
 * 
 * Core platform features that are fundamental to the BlueDXP platform:
 * - Dashboard routing and role-specific dashboards
 * - Core navigation and routing
 * - Platform-level features
 * 
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { ModuleDefinition } from './registry'

export const coreModule: ModuleDefinition = {
  id: 'core',
  name: 'Core Platform',
  description: 'Core platform features including dashboard routing, role-specific dashboards, and fundamental platform capabilities',
  version: '1.0.0',
  category: 'platform',
  standalone: true,
  dependencies: [], // No dependencies - this is the foundation
  enabled: true,

  routes: [
    {
      path: '/dashboard',
      component: 'app/dashboard/page',
      title: 'Main Dashboard',
      icon: 'ri-dashboard-3-line',
      requiresAuth: true,
    },
    {
      path: '/dashboard/account-manager',
      component: 'app/dashboard/account-manager/page',
      title: 'Account Manager Dashboard',
      icon: 'ri-user-line',
      requiresAuth: true,
      roles: ['ACCOUNT_MANAGER', 'CUSTOMER_ACCOUNT_MANAGER'],
    },
    {
      path: '/dashboard/business-development',
      component: 'app/dashboard/business-development/page',
      title: 'Business Development Dashboard',
      icon: 'ri-line-chart-line',
      requiresAuth: true,
      roles: ['BUSINESS_DEVELOPMENT', 'EXECUTIVE'],
    },
    {
      path: '/dashboard/customer',
      component: 'app/dashboard/customer/page',
      title: 'Customer Dashboard',
      icon: 'ri-user-3-line',
      requiresAuth: true,
      roles: ['CUSTOMER_USER', 'CUSTOMER_ADMIN'],
    },
    {
      path: '/dashboard/operations',
      component: 'app/dashboard/operations/page',
      title: 'Operations Dashboard',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
      roles: ['OPERATIONS_MANAGER', 'OPERATIONS_SUPERVISOR'],
    },
    {
      path: '/dashboard/supervisor',
      component: 'app/dashboard/supervisor/page',
      title: 'Supervisor Dashboard',
      icon: 'ri-team-line',
      requiresAuth: true,
      roles: ['SUPERVISOR', 'OPERATIONS_SUPERVISOR'],
    },
    {
      path: '/dashboard/system-admin',
      component: 'app/dashboard/system-admin/page',
      title: 'System Admin Dashboard',
      icon: 'ri-admin-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN'],
    },
    {
      path: '/dashboard/transport-general-manager',
      component: 'app/dashboard/transport-general-manager/page',
      title: 'Transport General Manager Dashboard',
      icon: 'ri-truck-line',
      requiresAuth: true,
      roles: ['TRANSPORT_GENERAL_MANAGER'],
    },
    {
      path: '/dashboard/warehouse-head',
      component: 'app/dashboard/warehouse-head/page',
      title: 'Warehouse Head Dashboard',
      icon: 'ri-warehouse-line',
      requiresAuth: true,
      roles: ['WAREHOUSE_HEAD', 'WMS_MANAGER'],
    },
  ],

  components: [
    'components/dashboard/DashboardRouter',
  ],

  services: [
    'lib/services/navigation/navigationService',
  ],

  apis: [
    {
      endpoint: '/api/dashboard/route',
      method: 'GET',
      description: 'Get dashboard route for current user role',
      requiresAuth: true,
    },
  ],

  settings: [
    {
      key: 'defaultDashboard',
      value: '/dashboard',
      type: 'string',
      description: 'Default dashboard route',
      required: false,
      default: '/dashboard',
    },
  ],

  featureFlags: {
    'role-based-dashboards': true,
    'dashboard-routing': true,
  },

  enabled: true,
  config: {
    dashboard: {
      routing: {
        enabled: true,
        redirectToRoleDashboard: true,
      },
    },
  },
}
