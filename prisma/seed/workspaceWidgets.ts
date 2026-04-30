/**
 * Seed Default Widget Definitions
 * 
 * Creates default widgets that users can add to their workspace
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultWidgets = [
  // Metrics Category
  {
    name: 'Total Orders',
    description: 'Total number of orders in the system',
    type: 'METRIC_CARD',
    categorySlug: 'metrics',
    icon: 'ri-shopping-cart-line',
    defaultSize: { width: 2, height: 1, minWidth: 2, minHeight: 1 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/metrics/orders',
      refreshInterval: 60000, // 1 minute
    },
    configurable: true,
    configOptions: {
      title: true,
      colors: true,
      format: true,
    },
    tags: ['orders', 'metrics', 'dashboard'],
    order: 1,
  },
  {
    name: 'Active Shipments',
    description: 'Number of active shipments',
    type: 'METRIC_CARD',
    categorySlug: 'operations',
    icon: 'ri-truck-line',
    defaultSize: { width: 2, height: 1 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/metrics/shipments',
      refreshInterval: 30000,
    },
    configurable: true,
    tags: ['shipments', 'logistics', 'operations'],
    order: 2,
  },
  {
    name: 'Warehouse Utilization',
    description: 'Current warehouse capacity utilization',
    type: 'PROGRESS_CARD',
    categorySlug: 'operations',
    icon: 'ri-warehouse-line',
    defaultSize: { width: 2, height: 1 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/metrics/warehouse-utilization',
      refreshInterval: 60000,
    },
    configurable: true,
    tags: ['warehouse', 'capacity', 'utilization'],
    order: 3,
  },
  {
    name: 'Compliance Score',
    description: 'Overall compliance score',
    type: 'METRIC_CARD',
    categorySlug: 'compliance',
    icon: 'ri-shield-check-line',
    defaultSize: { width: 2, height: 1 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/metrics/compliance-score',
      refreshInterval: 300000, // 5 minutes
    },
    configurable: true,
    tags: ['compliance', 'score', 'quality'],
    order: 4,
  },
  {
    name: 'Safety Incidents',
    description: 'Safety incidents this month',
    type: 'METRIC_CARD',
    categorySlug: 'safety',
    icon: 'ri-alert-line',
    defaultSize: { width: 2, height: 1 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/metrics/safety-incidents',
      refreshInterval: 60000,
    },
    configurable: true,
    tags: ['safety', 'incidents', 'qhse'],
    order: 5,
  },
  {
    name: 'Revenue Trend',
    description: 'Revenue trend over time',
    type: 'LINE_CHART',
    categorySlug: 'financial',
    icon: 'ri-line-chart-line',
    defaultSize: { width: 4, height: 3, minWidth: 3, minHeight: 2 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/charts/revenue-trend',
      refreshInterval: 300000,
    },
    configurable: true,
    configOptions: {
      title: true,
      colors: true,
      timeRange: true,
      chartType: true,
    },
    tags: ['revenue', 'financial', 'trends'],
    order: 6,
  },
  {
    name: 'Order Status Distribution',
    description: 'Distribution of orders by status',
    type: 'PIE_CHART',
    categorySlug: 'analytics',
    icon: 'ri-pie-chart-line',
    defaultSize: { width: 3, height: 3, minWidth: 2, minHeight: 2 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/charts/order-status',
      refreshInterval: 120000,
    },
    configurable: true,
    tags: ['orders', 'analytics', 'distribution'],
    order: 7,
  },
  {
    name: 'Recent Activities',
    description: 'Recent system activities and events',
    type: 'ACTIVITY_FEED',
    categorySlug: 'system',
    icon: 'ri-notification-line',
    defaultSize: { width: 3, height: 4, minWidth: 2, minHeight: 3 },
    dataSource: {
      type: 'api',
      endpoint: '/api/v1/workspace/widgets/feeds/activities',
      refreshInterval: 30000,
    },
    configurable: true,
    tags: ['activities', 'events', 'system'],
    order: 8,
  },
  {
    name: 'Google Calendar',
    description: 'Upcoming calendar events from Google',
    type: 'CALENDAR_WIDGET',
    categorySlug: 'custom',
    icon: 'ri-calendar-line',
    defaultSize: { width: 3, height: 4, minWidth: 2, minHeight: 3 },
    dataSource: {
      type: 'integration',
      integration: 'google_workspace',
      service: 'calendar',
      refreshInterval: 60000,
    },
    requiredPermissions: {
      module: 'workspace',
      feature: 'integrations',
      action: 'view',
    },
    configurable: true,
    tags: ['google', 'calendar', 'integration'],
    order: 9,
  },
  {
    name: 'Email Inbox',
    description: 'Recent emails from integrated account',
    type: 'EMAIL_LIST',
    categorySlug: 'custom',
    icon: 'ri-mail-line',
    defaultSize: { width: 4, height: 4, minWidth: 3, minHeight: 3 },
    dataSource: {
      type: 'integration',
      integration: 'email',
      refreshInterval: 60000,
    },
    requiredPermissions: {
      module: 'workspace',
      feature: 'integrations',
      action: 'view',
    },
    configurable: true,
    tags: ['email', 'inbox', 'integration'],
    order: 10,
  },
]

export async function seedWorkspaceWidgets() {
  console.log('🌱 Seeding workspace widgets...')

  for (const widget of defaultWidgets) {
    // Find category by slug
    const category = await prisma.widgetCategory.findUnique({
      where: { slug: widget.categorySlug },
    })

    if (!category) {
      console.warn(`⚠️  Category "${widget.categorySlug}" not found, skipping widget: ${widget.name}`)
      continue
    }

    const { categorySlug, ...widgetData } = widget

    // Check if widget already exists
    const existing = await prisma.widgetDefinition.findFirst({
      where: {
        name: widget.name,
        categoryId: category.id,
      },
    })

    if (existing) {
      // Update existing widget
      await prisma.widgetDefinition.update({
        where: { id: existing.id },
        data: {
          description: widgetData.description,
          type: widgetData.type,
          icon: widgetData.icon,
          defaultSize: widgetData.defaultSize,
          dataSource: widgetData.dataSource,
          configurable: widgetData.configurable,
          configOptions: widgetData.configOptions,
          requiredPermissions: widgetData.requiredPermissions,
          tags: widgetData.tags,
          order: widgetData.order,
        },
      })
    } else {
      // Create new widget
      await prisma.widgetDefinition.create({
        data: {
          ...widgetData,
          categoryId: category.id,
        },
      })
    }
  }

  const count = await prisma.widgetDefinition.count()
  console.log(`✅ Seeded ${defaultWidgets.length} workspace widgets (total: ${count})`)
}

// Always run when executed directly
seedWorkspaceWidgets()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

