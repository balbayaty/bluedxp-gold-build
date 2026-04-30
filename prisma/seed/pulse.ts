/**
 * Pulse Module Seed Data
 * Default rulesets, missions, rewards, badges
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedPulseModule(tenantId: string = 'default') {
  console.log('Seeding Pulse module...')

  // 1. Create default rulesets
  const rulesets = [
    {
      tenantId,
      name: 'Warehouse Default',
      status: 'ACTIVE',
      roleCluster: 'warehouse',
      weightsJson: {
        Move: 0.25,
        Execute: 0.40,
        Safe: 0.25,
        Grow: 0.10,
      },
      capsJson: {
        daily: { Move: 50, Execute: 100, Safe: 50, Grow: 30 },
        weekly: { Move: 200, Execute: 500, Safe: 200, Grow: 100 },
        monthly: { Move: 800, Execute: 2000, Safe: 800, Grow: 400 },
      },
      antiGamingJson: {
        spikeDetection: { threshold: 2.0, action: 'reduce' },
        maxEventCounts: { WELLNESS_LOGGED: 1, RECOGNITION_GIVEN: 10 },
      },
      evaluationPolicyJson: {
        icWeight: 0.10,
        allowedUses: ['performance_review', 'promotion_consideration'],
      },
    },
    {
      tenantId,
      name: 'Office Default',
      status: 'ACTIVE',
      roleCluster: 'office',
      weightsJson: {
        Move: 0.20,
        Execute: 0.45,
        Safe: 0.20,
        Grow: 0.15,
      },
      capsJson: {
        daily: { Move: 40, Execute: 120, Safe: 40, Grow: 40 },
        weekly: { Move: 150, Execute: 600, Safe: 150, Grow: 150 },
        monthly: { Move: 600, Execute: 2400, Safe: 600, Grow: 600 },
      },
      antiGamingJson: {
        spikeDetection: { threshold: 2.0, action: 'reduce' },
        maxEventCounts: { WELLNESS_LOGGED: 1, RECOGNITION_GIVEN: 10 },
      },
      evaluationPolicyJson: {
        icWeight: 0.10,
        allowedUses: ['performance_review', 'promotion_consideration'],
      },
    },
    {
      tenantId,
      name: 'Driver Default',
      status: 'ACTIVE',
      roleCluster: 'driver',
      weightsJson: {
        Move: 0.15,
        Execute: 0.50,
        Safe: 0.30,
        Grow: 0.05,
      },
      capsJson: {
        daily: { Move: 30, Execute: 150, Safe: 80, Grow: 20 },
        weekly: { Move: 100, Execute: 700, Safe: 350, Grow: 80 },
        monthly: { Move: 400, Execute: 2800, Safe: 1400, Grow: 320 },
      },
      antiGamingJson: {
        spikeDetection: { threshold: 2.0, action: 'reduce' },
        maxEventCounts: { WELLNESS_LOGGED: 1, RECOGNITION_GIVEN: 10 },
      },
      evaluationPolicyJson: {
        icWeight: 0.10,
        allowedUses: ['performance_review', 'promotion_consideration'],
      },
    },
  ]

  for (const ruleset of rulesets) {
    const rulesetId = `${tenantId}-${ruleset.roleCluster}`
    await prisma.pulseRuleset.upsert({
      where: {
        id: rulesetId,
      },
      create: {
        ...ruleset,
        id: rulesetId,
        updatedAt: new Date(),
      } as any,
      update: {
        ...ruleset,
        updatedAt: new Date(),
      } as any,
    })
  }

  // 2. Create sample badges
  const badges = [
    {
      tenantId,
      name: 'Shift Discipline I',
      icon: 'ri-time-line',
      criteriaJson: { missionsCompleted: 10 },
      rarity: 'COMMON',
    },
    {
      tenantId,
      name: 'Safety Champion',
      icon: 'ri-shield-check-line',
      criteriaJson: { safetyObservations: 20 },
      rarity: 'RARE',
    },
    {
      tenantId,
      name: 'Execution Master',
      icon: 'ri-checkbox-circle-line',
      criteriaJson: { tasksCompleted: 100 },
      rarity: 'EPIC',
    },
    {
      tenantId,
      name: 'Growth Mindset',
      icon: 'ri-graduation-cap-line',
      criteriaJson: { trainingsCompleted: 25 },
      rarity: 'RARE',
    },
    {
      tenantId,
      name: 'Wellness Warrior',
      icon: 'ri-heart-pulse-line',
      criteriaJson: { wellnessDays: 30 },
      rarity: 'COMMON',
    },
  ]

  for (const badge of badges) {
    const badgeId = `${tenantId}-${badge.name}`
    await prisma.pulseBadge.upsert({
      where: {
        id: badgeId,
      },
      create: {
        ...badge,
        id: badgeId,
      } as any,
      update: badge as any,
    })
  }

  // 3. Create sample rewards
  const rewards = [
    {
      tenantId,
      name: 'Meal Voucher',
      description: 'Redeem for a meal at company cafeteria',
      category: 'Food & Beverage',
      costPP: 120,
      monthlyLimitPerUser: 2,
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Coffee Card',
      description: 'Free coffee for a week',
      category: 'Food & Beverage',
      costPP: 60,
      monthlyLimitPerUser: 4,
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Learning Credit',
      description: 'Credit towards professional development courses',
      category: 'Education',
      costPP: 200,
      monthlyLimitPerUser: 1,
      approvalRequired: true,
      active: true,
    },
    {
      tenantId,
      name: 'Team Breakfast',
      description: 'Organize breakfast for your team',
      category: 'Team Building',
      costPP: 800,
      monthlyLimitPerUser: 1,
      approvalRequired: true,
      active: true,
    },
    {
      tenantId,
      name: 'Safety Gear Upgrade Request',
      description: 'Request upgrade to safety equipment',
      category: 'Safety',
      costPP: 500,
      monthlyLimitPerUser: 1,
      approvalRequired: true,
      active: true,
    },
    {
      tenantId,
      name: 'Charity Donation Pool',
      description: 'Contribute to company charity fund',
      category: 'Charity',
      costPP: 100,
      monthlyLimitPerUser: null, // Unlimited
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Recognition Wall Spotlight',
      description: 'Feature on company recognition wall',
      category: 'Recognition',
      costPP: 50,
      monthlyLimitPerUser: 1,
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Extra Break Token',
      description: 'Additional 15-minute break',
      category: 'Wellness',
      costPP: 70,
      monthlyLimitPerUser: 2,
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Company Merchandise',
      description: 'Company branded items',
      category: 'Merchandise',
      costPP: 150,
      monthlyLimitPerUser: 1,
      approvalRequired: false,
      active: true,
    },
    {
      tenantId,
      name: 'Wellness Bundle',
      description: 'Wellness package with gym access, nutrition consultation',
      category: 'Wellness',
      costPP: 250,
      monthlyLimitPerUser: 1,
      approvalRequired: true,
      active: true,
    },
  ]

  for (const reward of rewards) {
    const rewardId = `reward-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    await prisma.pulseRewardsCatalog.create({
      data: {
        ...reward,
        id: rewardId,
        updatedAt: new Date(),
      } as any,
    })
  }

  console.log('Pulse module seeded successfully')
}

// Run if called directly
if (require.main === module) {
  seedPulseModule()
    .then(() => {
      console.log('Seed complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seed error:', error)
      process.exit(1)
    })
}













