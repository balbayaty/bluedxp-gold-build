/**
 * CRM Module
 * Customer Relationship Management
 * EXTENDS WMS Customer (NO DUPLICATION)
 */

import { ModuleDefinition } from './registry'

export const crmModule: ModuleDefinition = {
  id: 'crm',
  name: 'Customer Relationship Management',
  description: 'Sales pipeline, leads, opportunities, and customer management',
  icon: '👥',
  color: '#8B5CF6',
  category: 'other',
  version: '1.0.0',
  enabled: true,
  dependencies: ['wms', 'proposals-rfq', 'marketplace'],
  
  routes: [
    {
      path: '/crm/dashboard',
      name: 'CRM Dashboard',
      component: 'app/crm/dashboard/page',
      icon: 'dashboard',
      requiresAuth: true,
      permissions: ['crm.dashboard'],
    },
    {
      path: '/crm/leads',
      name: 'Leads',
      component: 'app/crm/leads/page',
      icon: 'user-add',
      requiresAuth: true,
      permissions: ['crm.leads'],
    },
    {
      path: '/crm/opportunities',
      name: 'Opportunities',
      component: 'app/crm/opportunities/page',
      icon: 'target',
      requiresAuth: true,
      permissions: ['crm.opportunities'],
    },
    {
      path: '/crm/accounts',
      name: 'Accounts',
      component: 'app/crm/accounts/page',
      icon: 'building',
      requiresAuth: true,
      permissions: ['crm.accounts'],
    },
    {
      path: '/crm/contacts',
      name: 'Contacts',
      component: 'app/crm/contacts/page',
      icon: 'contacts',
      requiresAuth: true,
      permissions: ['crm.contacts'],
    },
    {
      path: '/crm/forecast',
      name: 'Sales Forecast',
      component: 'app/crm/forecast/page',
      icon: 'chart-line',
      requiresAuth: true,
      permissions: ['crm.forecast'],
    },
    {
      path: '/crm/activities',
      name: 'Activities',
      component: 'app/crm/activities/page',
      icon: 'calendar',
      requiresAuth: true,
      permissions: ['crm.activities'],
    },
  ],

  services: [
    {
      name: 'Lead Service',
      path: 'lib/services/crm/leadService',
      description: 'Lead management with AI scoring',
    },
    {
      name: 'Opportunity Service',
      path: 'lib/services/crm/opportunityService',
      description: 'Sales pipeline management, links to RFQ, WMS, Marketplace',
    },
    {
      name: 'Account Service',
      path: 'lib/services/crm/accountService',
      description: 'Account management extending WMS customers',
    },
    {
      name: 'Contact Service',
      path: 'lib/services/crm/contactService',
      description: 'Contact management linked to accounts and HR employees',
    },
    {
      name: 'Activity Service',
      path: 'lib/services/crm/activityService',
      description: 'Activity tracking integrated with Brand Messaging',
    },
    {
      name: 'Sales Forecast Service',
      path: 'lib/services/crm/salesForecastService',
      description: 'ML-powered forecasting using HR predictive analytics',
    },
    {
      name: 'Unified CRM Integration Service',
      path: 'lib/services/crm/integration/unifiedCRMService',
      description: 'Central hub aggregating CRM data from all modules',
    },
  ],

  features: [
    {
      id: 'crm.leads',
      name: 'Lead Management',
      description: 'Lead capture, scoring, and conversion',
      enabled: true,
    },
    {
      id: 'crm.opportunities',
      name: 'Opportunity Pipeline',
      description: 'Sales pipeline management with stages',
      enabled: true,
    },
    {
      id: 'crm.accounts',
      name: 'Account Management',
      description: 'Account management extending WMS customers',
      enabled: true,
    },
    {
      id: 'crm.contacts',
      name: 'Contact Management',
      description: 'Contact management linked to accounts',
      enabled: true,
    },
    {
      id: 'crm.activities',
      name: 'Activity Tracking',
      description: 'Email, call, meeting, and task tracking',
      enabled: true,
    },
    {
      id: 'crm.forecast',
      name: 'Sales Forecasting',
      description: 'ML-powered sales forecasting',
      enabled: true,
    },
  ],

  integrations: [
    {
      module: 'wms',
      type: 'customer',
      description: 'Extends WMS customer master (no duplication)',
      enabled: true,
    },
    {
      module: 'proposals-rfq',
      type: 'opportunity',
      description: 'Links RFQs to opportunities',
      enabled: true,
    },
    {
      module: 'marketplace',
      type: 'opportunity',
      description: 'Links marketplace bookings to opportunities',
      enabled: true,
    },
    {
      module: 'hr',
      type: 'contact',
      description: 'Links HR employees to contacts',
      enabled: true,
    },
    {
      module: 'brand-messaging',
      type: 'activity',
      description: 'Captures activities from communications',
      enabled: true,
    },
  ],

  config: {
    enableLeadScoring: true,
    enableOpportunityAutoCreation: true,
    enableActivityTracking: true,
  },
}





