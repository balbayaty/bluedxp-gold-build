/**
 * Seed Default Widget Categories
 * System categories that cannot be deleted
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  {
    name: 'METRICS',
    slug: 'metrics',
    description: 'Key performance indicators and metric cards',
    icon: 'ri-dashboard-line',
    color: '#06b6d4',
    order: 1,
    isSystem: true,
  },
  {
    name: 'ANALYTICS',
    slug: 'analytics',
    description: 'Charts, graphs, and data visualizations',
    icon: 'ri-bar-chart-line',
    color: '#3b82f6',
    order: 2,
    isSystem: true,
  },
  {
    name: 'OPERATIONS',
    slug: 'operations',
    description: 'Warehouse and logistics operations',
    icon: 'ri-warehouse-line',
    color: '#10b981',
    order: 3,
    isSystem: true,
  },
  {
    name: 'COMPLIANCE',
    slug: 'compliance',
    description: 'Compliance monitoring and tracking',
    icon: 'ri-shield-check-line',
    color: '#f59e0b',
    order: 4,
    isSystem: true,
  },
  {
    name: 'SAFETY',
    slug: 'safety',
    description: 'Safety metrics and incident tracking',
    icon: 'ri-alert-line',
    color: '#ef4444',
    order: 5,
    isSystem: true,
  },
  {
    name: 'ENVIRONMENTAL',
    slug: 'environmental',
    description: 'Environmental metrics and sustainability',
    icon: 'ri-leaf-line',
    color: '#22c55e',
    order: 6,
    isSystem: true,
  },
  {
    name: 'QUALITY',
    slug: 'quality',
    description: 'Quality control and assurance',
    icon: 'ri-award-line',
    color: '#8b5cf6',
    order: 7,
    isSystem: true,
  },
  {
    name: 'FINANCIAL',
    slug: 'financial',
    description: 'Financial metrics and revenue tracking',
    icon: 'ri-money-dollar-circle-line',
    color: '#14b8a6',
    order: 8,
    isSystem: true,
  },
  {
    name: 'HUMAN_RESOURCES',
    slug: 'human-resources',
    description: 'HR metrics and employee management',
    icon: 'ri-team-line',
    color: '#ec4899',
    order: 9,
    isSystem: true,
  },
  {
    name: 'SUPPLY_CHAIN',
    slug: 'supply-chain',
    description: 'Supply chain and logistics tracking',
    icon: 'ri-truck-line',
    color: '#6366f1',
    order: 10,
    isSystem: true,
  },
  {
    name: 'IOT',
    slug: 'iot',
    description: 'IoT device monitoring and status',
    icon: 'ri-sensor-line',
    color: '#f97316',
    order: 11,
    isSystem: true,
  },
  {
    name: 'AI_ML',
    slug: 'ai-ml',
    description: 'AI insights and machine learning predictions',
    icon: 'ri-brain-line',
    color: '#a855f7',
    order: 12,
    isSystem: true,
  },
  {
    name: 'SYSTEM',
    slug: 'system',
    description: 'System health and monitoring',
    icon: 'ri-computer-line',
    color: '#64748b',
    order: 13,
    isSystem: true,
  },
  {
    name: 'CUSTOM',
    slug: 'custom',
    description: 'Custom widgets and integrations',
    icon: 'ri-puzzle-line',
    color: '#06b6d4',
    order: 14,
    isSystem: true,
  },
]

export async function seedWorkspaceCategories() {
  console.log('🌱 Seeding workspace categories...')

  for (const category of defaultCategories) {
    await prisma.widgetCategory.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        icon: category.icon,
        color: category.color,
        order: category.order,
      },
      create: category,
    })
  }

  console.log(`✅ Seeded ${defaultCategories.length} workspace categories`)
}

// Always run when executed directly
seedWorkspaceCategories()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


