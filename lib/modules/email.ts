/**
 * Email Module
 * 
 * Centralized email service module for BlueDXP Platform
 * Provides unified email functionality for all modules via Event Bus
 * 
 * Architecture:
 * - No direct module connections - all communication via Event Bus
 * - Multi-tenant support
 * - Multi-provider support (SMTP, SendGrid, AWS SES, etc.)
 * - Template management
 * - Event-driven architecture
 */

import { ModuleDefinition } from './registry'

export const emailModule: ModuleDefinition = {
  id: 'email',
  name: 'Email Service',
  description: 'Centralized email service module providing unified email functionality for all modules via Event Bus',
  version: '1.0.0',
  category: 'communication',
  standalone: true,
  dependencies: [], // No dependencies - core service
  enabled: true,
  routes: [
    {
      path: '/email',
      component: 'app/email/page',
      title: 'Email Dashboard',
      icon: 'ri-mail-line',
      requiresAuth: true,
    },
    {
      path: '/email/templates',
      component: 'app/email/templates/page',
      title: 'Email Templates',
      icon: 'ri-file-text-line',
      requiresAuth: true,
    },
    {
      path: '/email/settings',
      component: 'app/email/settings/page',
      title: 'Email Settings',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/email/EmailDashboard',
    'components/email/EmailTemplateEditor',
    'components/email/EmailSettings',
  ],
  services: [
    'lib/services/email',
  ],
  apis: [
    {
      endpoint: '/api/email/send',
      method: 'POST',
      description: 'Send email',
      requiresAuth: true,
      roles: ['admin', 'manager', 'user'],
    },
    {
      endpoint: '/api/email/templates',
      method: 'GET',
      description: 'List email templates',
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
    {
      endpoint: '/api/email/templates',
      method: 'POST',
      description: 'Create email template',
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
    {
      endpoint: '/api/email/stats',
      method: 'GET',
      description: 'Get email statistics',
      requiresAuth: true,
      roles: ['admin', 'manager'],
    },
  ],
  config: {
    defaultProvider: 'SMTP',
    providers: ['SMTP', 'SENDGRID', 'AWS_SES'],
    eventDriven: true,
    multiTenant: true,
  },
}


