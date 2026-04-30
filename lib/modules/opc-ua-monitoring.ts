/**
 * OPC UA Machine Monitoring Module
 * EUROMAP-77 compliant injection molding machine integration
 */

import { ModuleDefinition } from './registry';

export const opcuaMonitoringModule: ModuleDefinition = {
  id: 'opc-ua-monitoring',
  name: 'OPC UA Machine Monitoring',
  description: 'EUROMAP-77 compliant injection molding machine monitoring with real-time OEE tracking',
  version: '1.0.0',
  category: 'maas',
  standalone: false,
  dependencies: ['maas'],
  enabled: true,
  routes: [
    {
      path: '/opc-ua-monitoring',
      component: 'app/opc-ua-monitoring/page',
      title: 'Machine Monitoring',
      icon: 'ri-cpu-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
    {
      path: '/opc-ua-monitoring/machines',
      component: 'app/opc-ua-monitoring/machines/page',
      title: 'Machines',
      icon: 'ri-server-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      path: '/opc-ua-monitoring/oee',
      component: 'app/opc-ua-monitoring/oee/page',
      title: 'OEE Dashboard',
      icon: 'ri-bar-chart-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
  ],
  components: [
    'components/opcua/MachineDashboard.tsx',
    'components/opcua/MachineCard.tsx',
    'components/opcua/OEEDashboard.tsx',
    'components/opcua/AlarmPanel.tsx',
  ],
  services: [
    'lib/services/opc-ua-monitoring',
  ],
  apis: [
    {
      endpoint: '/api/opc-ua-monitoring/machines',
      method: 'GET',
      description: 'Get all machines',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      endpoint: '/api/opc-ua-monitoring/machines',
      method: 'POST',
      description: 'Register new machine',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      endpoint: '/api/opc-ua-monitoring/telemetry',
      method: 'GET',
      description: 'Get machine telemetry',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
    {
      endpoint: '/api/opc-ua-monitoring/oee',
      method: 'GET',
      description: 'Get OEE aggregates',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
    {
      endpoint: '/api/opc-ua-monitoring/alarms',
      method: 'GET',
      description: 'Get active alarms',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
  ],
  settings: [
    {
      key: 'defaultPollingInterval',
      value: 1000,
      type: 'number',
      description: 'Default polling interval in milliseconds',
      required: false,
      default: 1000,
    },
    {
      key: 'enableAlarmNotifications',
      value: true,
      type: 'boolean',
      description: 'Enable real-time alarm notifications',
      required: false,
      default: true,
    },
  ],
  featureFlags: {
    euromap77: true,
    realTimeMonitoring: true,
    oeeTracking: true,
    alarmManagement: true,
  },
  config: {
    defaultPollingInterval: 1000,
    enableAlarmNotifications: true,
  },
};













