/**
 * Workspace Module Definition
 * Intelligent User Workspace System
 */

import { ModuleDefinition } from './registry'

export const workspaceModule: ModuleDefinition = {
  id: 'workspace',
  name: 'Workspace',
  description: 'Intelligent, dynamic user workspace with widgets, layouts, and integrations',
  version: '1.0.0',
  category: 'workspace',
  standalone: true,
  dependencies: ['wms', 'tms', 'iso-ims', 'ai'],
  routes: [
    {
      path: '/workspace',
      component: 'app/workspace/page',
      title: 'Workspace',
      icon: 'ri-layout-line',
      requiresAuth: true,
    },
    {
      path: '/workspace/settings',
      component: 'app/workspace/settings/page',
      title: 'Workspace Settings',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/workspace/WorkspaceContainer',
    'components/workspace/WorkspaceGrid',
    'components/workspace/WorkspaceToolbar',
    'components/workspace/WidgetLibrary',
    'components/workspace/WorkspaceSettings',
    'components/workspace/widgets/WorkspaceWidget',
    'components/workspace/widgets/WidgetRenderer',
  ],
  services: [
    'lib/services/workspace/workspaceService',
    'lib/services/workspace/widgetService',
    'lib/services/workspace/categoryService',
    'lib/services/workspace/layoutService',
    'lib/services/workspace/personalizationService',
    'lib/services/workspace/integrations/googleWorkspaceService',
    'lib/services/workspace/integrations/emailService',
  ],
  widgets: [
    {
      id: 'workspace-overview',
      name: 'Workspace Overview',
      description: 'Overview of your workspace',
      component: 'components/workspace/widgets/WorkspaceOverviewWidget',
      size: 'medium',
    },
  ],
  apis: [
    {
      endpoint: '/api/v1/workspace/config',
      method: 'GET',
      description: 'Get workspace configuration',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/workspace/layouts',
      method: 'GET',
      description: 'Get user layouts',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/workspace/layouts',
      method: 'POST',
      description: 'Create layout',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/workspace/widgets',
      method: 'GET',
      description: 'Get available widgets',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/workspace/integrations/google',
      method: 'GET',
      description: 'Get Google Workspace status',
      requiresAuth: true,
    },
    {
      endpoint: '/api/v1/workspace/integrations/email',
      method: 'GET',
      description: 'Get email integrations',
      requiresAuth: true,
    },
  ],
  settings: [
    {
      key: 'autoSave',
      value: true,
      type: 'boolean',
      description: 'Auto-save layout changes',
      required: false,
      default: true,
    },
    {
      key: 'defaultRefreshInterval',
      value: 300000,
      type: 'number',
      description: 'Default widget refresh interval (milliseconds)',
      required: false,
      default: 300000,
    },
  ],
  enabled: true,
}













