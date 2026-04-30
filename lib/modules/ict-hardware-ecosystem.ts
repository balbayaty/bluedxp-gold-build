/**
 * ICT Hardware Ecosystem Module
 * Links injection molding MaaS to ICT hardware manufacturing ecosystem
 * Vision 2030 aligned - Saudi Arabia's first localized digital manufacturing node
 */

import { ModuleDefinition } from './registry';

export const ictHardwareEcosystemModule: ModuleDefinition = {
  id: 'ict-hardware-ecosystem',
  name: 'ICT Hardware Ecosystem',
  description: 'Saudi Arabia\'s first localized digital manufacturing node linking injection molding to ICT hardware ecosystems',
  version: '1.0.0',
  category: 'maas',
  standalone: false,
  dependencies: ['maas', 'opc-ua-monitoring'],
  enabled: true,
  routes: [
    {
      path: '/ict-hardware-ecosystem',
      component: 'app/ict-hardware-ecosystem/page',
      title: 'ICT Hardware Ecosystem',
      icon: 'ri-cpu-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'BUSINESS_DEVELOPMENT'],
    },
    {
      path: '/ict-hardware-ecosystem/products',
      component: 'app/ict-hardware-ecosystem/products/page',
      title: 'ICT Products',
      icon: 'ri-device-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      path: '/ict-hardware-ecosystem/manufacturing',
      component: 'app/ict-hardware-ecosystem/manufacturing/page',
      title: 'Manufacturing Pipeline',
      icon: 'ri-factory-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
    {
      path: '/ict-hardware-ecosystem/partnerships',
      component: 'app/ict-hardware-ecosystem/partnerships/page',
      title: 'Strategic Partnerships',
      icon: 'ri-handshake-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'BUSINESS_DEVELOPMENT', 'EXECUTIVE'],
    },
  ],
  components: [
    'components/ict-hardware/ICTProductCatalog.tsx',
    'components/ict-hardware/ManufacturingPipeline.tsx',
    'components/ict-hardware/PartnershipDashboard.tsx',
  ],
  services: [
    'lib/services/ict-hardware-ecosystem',
  ],
  apis: [
    {
      endpoint: '/api/ict-hardware-ecosystem/products',
      method: 'GET',
      description: 'Get ICT product catalog',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      endpoint: '/api/ict-hardware-ecosystem/products',
      method: 'POST',
      description: 'Register new ICT product',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER'],
    },
    {
      endpoint: '/api/ict-hardware-ecosystem/manufacturing/pipeline',
      method: 'GET',
      description: 'Get manufacturing pipeline status',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'PRODUCTION_MANAGER', 'PRODUCTION_ENGINEER'],
    },
    {
      endpoint: '/api/ict-hardware-ecosystem/partnerships',
      method: 'GET',
      description: 'Get strategic partnerships',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'BUSINESS_DEVELOPMENT', 'EXECUTIVE'],
    },
  ],
  settings: [
    {
      key: 'vision2030Alignment',
      value: true,
      type: 'boolean',
      description: 'Enable Vision 2030 alignment features',
      required: false,
      default: true,
    },
    {
      key: 'localContentTarget',
      value: 30,
      type: 'number',
      description: 'Local content target percentage',
      required: false,
      default: 30,
    },
  ],
  featureFlags: {
    productCatalog: true,
    manufacturingPipeline: true,
    partnershipManagement: true,
    vision2030Reporting: true,
  },
  config: {
    vision2030Alignment: true,
    localContentTarget: 30,
  },
};













