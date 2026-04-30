/**
 * Business Intelligence Module
 * Unified BI aggregating analytics from all modules
 * NO DUPLICATION - Only aggregates existing analytics
 */

import { ModuleDefinition } from './registry'

export const businessIntelligenceModule: ModuleDefinition = {
  id: 'business-intelligence',
  name: 'Business Intelligence',
  description: 'Unified BI dashboard and analytics aggregating data from all modules',
  icon: '📊',
  color: '#10B981',
  category: 'other',
  version: '1.0.0',
  enabled: true,
  dependencies: ['wms', 'hr', 'finance', 'crm', 'qhse', 'facility-management', 'tms', 'project-management'],
  
  routes: [
    {
      path: '/business-intelligence/dashboard',
      name: 'BI Dashboard',
      component: 'app/business-intelligence/dashboard/page',
      icon: 'dashboard',
      requiresAuth: true,
      permissions: ['business_intelligence.dashboard'],
    },
    {
      path: '/business-intelligence/data-warehouse',
      name: 'Data Warehouse',
      component: 'app/business-intelligence/data-warehouse/page',
      icon: 'database',
      requiresAuth: true,
      permissions: ['business_intelligence.data_warehouse'],
    },
    {
      path: '/business-intelligence/reports',
      name: 'BI Reports',
      component: 'app/business-intelligence/reports/page',
      icon: 'file-chart',
      requiresAuth: true,
      permissions: ['business_intelligence.reports'],
    },
  ],

  services: [
    {
      name: 'Unified BI Service',
      path: 'lib/services/business-intelligence/unifiedBIService',
      description: 'Central hub aggregating analytics from all modules',
    },
    {
      name: 'Data Warehouse Service',
      path: 'lib/services/business-intelligence/dataWarehouseService',
      description: 'ETL from all modules to data warehouse',
    },
  ],

  features: [
    {
      id: 'business_intelligence.dashboard',
      name: 'BI Dashboard',
      description: 'Unified dashboard aggregating analytics from all modules',
      enabled: true,
    },
    {
      id: 'business_intelligence.data_warehouse',
      name: 'Data Warehouse',
      description: 'ETL and data warehouse management',
      enabled: true,
    },
    {
      id: 'business_intelligence.reports',
      name: 'BI Reports',
      description: 'Custom reports across all modules',
      enabled: true,
    },
  ],

  integrations: [
    {
      module: 'wms',
      type: 'analytics',
      description: 'Aggregates WMS analytics (read-only)',
      enabled: true,
    },
    {
      module: 'hr',
      type: 'analytics',
      description: 'Aggregates HR analytics (read-only)',
      enabled: true,
    },
    {
      module: 'finance',
      type: 'analytics',
      description: 'Aggregates Finance analytics (read-only)',
      enabled: true,
    },
    {
      module: 'crm',
      type: 'analytics',
      description: 'Aggregates CRM analytics (read-only)',
      enabled: true,
    },
    {
      module: 'qhse',
      type: 'analytics',
      description: 'Aggregates QHSE analytics (read-only)',
      enabled: true,
    },
    {
      module: 'facility-management',
      type: 'analytics',
      description: 'Aggregates Facility analytics (read-only)',
      enabled: true,
    },
    {
      module: 'tms',
      type: 'analytics',
      description: 'Aggregates TMS analytics (read-only)',
      enabled: true,
    },
    {
      module: 'project-management',
      type: 'analytics',
      description: 'Aggregates Project analytics (read-only)',
      enabled: true,
    },
  ],

  config: {
    enableRealTimeSync: true,
    enableDataWarehouse: true,
    dataRetentionDays: 365,
  },
}

