/**
 * Project Management Module
 * Project planning and tracking
 * REFERENCES WMS tasks and Facility work orders (NO DUPLICATION)
 */

import { ModuleDefinition } from './registry'

export const projectManagementModule: ModuleDefinition = {
  id: 'project-management',
  name: 'Project Management',
  description: 'Project planning, scheduling, and resource allocation',
  icon: '📊',
  color: '#F59E0B',
  category: 'other',
  version: '1.0.0',
  enabled: true,
  dependencies: ['wms', 'facility-management', 'hr', 'finance'],
  
  routes: [
    {
      path: '/projects',
      name: 'Projects',
      component: 'app/projects/page',
      icon: 'folder',
      requiresAuth: true,
      permissions: ['project-management.projects'],
    },
    {
      path: '/projects/[id]',
      name: 'Project Details',
      component: 'app/projects/[id]/page',
      icon: 'file',
      requiresAuth: true,
      permissions: ['project-management.projects'],
    },
    {
      path: '/projects/[id]/gantt',
      name: 'Gantt Chart',
      component: 'app/projects/[id]/gantt/page',
      icon: 'chart-bar',
      requiresAuth: true,
      permissions: ['project-management.gantt'],
    },
    {
      path: '/projects/[id]/resources',
      name: 'Resource Allocation',
      component: 'app/projects/[id]/resources/page',
      icon: 'users',
      requiresAuth: true,
      permissions: ['project-management.resources'],
    },
    {
      path: '/projects/[id]/budget',
      name: 'Project Budget',
      component: 'app/projects/[id]/budget/page',
      icon: 'money',
      requiresAuth: true,
      permissions: ['project-management.budget'],
    },
    {
      path: '/projects/[id]/tasks',
      name: 'Project Tasks',
      component: 'app/projects/[id]/tasks/page',
      icon: 'checklist',
      requiresAuth: true,
      permissions: ['project-management.tasks'],
    },
  ],

  services: [
    {
      name: 'Project Service',
      path: 'lib/services/project-management/projectService',
      description: 'Project management linking to WMS tasks and Facility work orders',
    },
    {
      name: 'Gantt Service',
      path: 'lib/services/project-management/ganttService',
      description: 'Gantt chart data aggregation from tasks and work orders',
    },
    {
      name: 'Resource Allocation Service',
      path: 'lib/services/project-management/resourceAllocationService',
      description: 'Resource planning linked to HR employees, WMS resources, Facility assets',
    },
    {
      name: 'Project Budget Service',
      path: 'lib/services/project-management/projectBudgetService',
      description: 'Project budgeting integrated with Finance budget',
    },
    {
      name: 'Unified Project Integration Service',
      path: 'lib/services/project-management/integration/unifiedProjectService',
      description: 'Central hub aggregating project data from all modules',
    },
  ],

  features: [
    {
      id: 'project-management.projects',
      name: 'Project Management',
      description: 'Project planning and tracking',
      enabled: true,
    },
    {
      id: 'project-management.gantt',
      name: 'Gantt Charts',
      description: 'Visual project timeline with dependencies',
      enabled: true,
    },
    {
      id: 'project-management.resources',
      name: 'Resource Allocation',
      description: 'Resource planning and conflict detection',
      enabled: true,
    },
    {
      id: 'project-management.budget',
      name: 'Project Budgeting',
      description: 'Budget tracking integrated with Finance',
      enabled: true,
    },
  ],

  integrations: [
    {
      module: 'wms',
      type: 'task',
      description: 'References WMS tasks (no duplication)',
      enabled: true,
    },
    {
      module: 'facility',
      type: 'work-order',
      description: 'References Facility work orders (no duplication)',
      enabled: true,
    },
    {
      module: 'hr',
      type: 'resource',
      description: 'Links to HR employees for resource allocation',
      enabled: true,
    },
    {
      module: 'finance',
      type: 'budget',
      description: 'Links to Finance budget (no duplication)',
      enabled: true,
    },
  ],

  config: {
    enableGanttCharts: true,
    enableResourceAllocation: true,
    enableBudgetTracking: true,
  },
}





