/**
 * External Integrations Module
 * LinkedIn, Telegram, WhatsApp, News Sites, and Generic Site integrations
 */

import { ModuleDefinition } from './registry'

export const externalIntegrationsModule: ModuleDefinition = {
  id: 'external-integrations',
  name: 'External Integrations',
  description: 'Connect and integrate with LinkedIn, Telegram, WhatsApp, News Sites, and other external services',
  version: '1.0.0',
  category: 'integration',
  standalone: true,
  dependencies: [],
  enabled: true,
  routes: [
    {
      path: '/integrations',
      component: 'app/integrations/page',
      title: 'External Integrations',
      icon: 'ri-plug-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'WAREHOUSE_HEAD'],
    },
    {
      path: '/integrations/callback',
      component: 'app/integrations/callback/page',
      title: 'OAuth Callback',
      icon: 'ri-links-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/integrations/IntegrationManager.tsx',
    'components/integrations/IntegrationWidgets.tsx',
  ],
  services: [
    'lib/services/external-integrations',
  ],
  apis: [
    {
      endpoint: '/api/integrations',
      method: 'GET',
      description: 'List all integrations',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'WAREHOUSE_HEAD'],
    },
    {
      endpoint: '/api/integrations',
      method: 'POST',
      description: 'Create new integration',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/integrations/[id]',
      method: 'GET',
      description: 'Get integration details',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'WAREHOUSE_HEAD'],
    },
    {
      endpoint: '/api/integrations/[id]',
      method: 'PUT',
      description: 'Update integration',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/integrations/[id]',
      method: 'DELETE',
      description: 'Delete integration',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/integrations/[id]/sync',
      method: 'POST',
      description: 'Sync integration data',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'WAREHOUSE_HEAD'],
    },
    {
      endpoint: '/api/integrations/[id]/data',
      method: 'GET',
      description: 'Get integration data',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN', 'WAREHOUSE_HEAD'],
    },
    {
      endpoint: '/api/integrations/linkedin/auth',
      method: 'GET',
      description: 'Get LinkedIn OAuth URL',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/integrations/linkedin/auth/callback',
      method: 'POST',
      description: 'Handle LinkedIn OAuth callback',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'IT_ADMIN'],
    },
    {
      endpoint: '/api/integrations/telegram/webhook',
      method: 'POST',
      description: 'Telegram webhook handler',
      requiresAuth: false, // Webhooks don't require auth
    },
  ],
  settings: [
    {
      key: 'enableLinkedIn',
      value: true,
      type: 'boolean',
      description: 'Enable LinkedIn integrations',
      required: false,
      default: true,
    },
    {
      key: 'enableTelegram',
      value: true,
      type: 'boolean',
      description: 'Enable Telegram integrations',
      required: false,
      default: true,
    },
    {
      key: 'enableWhatsApp',
      value: true,
      type: 'boolean',
      description: 'Enable WhatsApp integrations',
      required: false,
      default: true,
    },
    {
      key: 'enableNewsSites',
      value: true,
      type: 'boolean',
      description: 'Enable News Site integrations',
      required: false,
      default: true,
    },
    {
      key: 'enableGenericSites',
      value: true,
      type: 'boolean',
      description: 'Enable Generic Site integrations',
      required: false,
      default: true,
    },
  ],
  featureFlags: {
    linkedIn: true,
    telegram: true,
    whatsApp: true,
    newsSites: true,
    genericSites: true,
    dashboardWidgets: true,
    webhooks: true,
    oauth: true,
  },
  config: {
    enableLinkedIn: true,
    enableTelegram: true,
    enableWhatsApp: true,
    enableNewsSites: true,
    enableGenericSites: true,
  },
}













