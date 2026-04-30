/**
 * Pulse Module
 * Wellbeing + Gamified Execution + Tokens + Scoreboards + Benchmarking
 */

import { ModuleDefinition } from './registry'

export const pulseModule: ModuleDefinition = {
  id: 'pulse',
  name: 'Pulse',
  description: 'Wellbeing + Gamified Execution + Tokens + Scoreboards + Benchmarking',
  version: '1.0.0',
  category: 'other',
  standalone: true,
  dependencies: [], // Can work standalone, but integrates with tasks, training, IMS
  enabled: true,
  routes: [
    {
      path: '/pulse',
      component: 'app/pulse/page',
      title: 'Pulse Overview',
      icon: 'ri-pulse-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/missions',
      component: 'app/pulse/missions/page',
      title: 'Missions',
      icon: 'ri-target-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/leaderboards',
      component: 'app/pulse/leaderboards/page',
      title: 'Leaderboards',
      icon: 'ri-trophy-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/rewards',
      component: 'app/pulse/rewards/page',
      title: 'Rewards',
      icon: 'ri-gift-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/recognition',
      component: 'app/pulse/recognition/page',
      title: 'Recognition',
      icon: 'ri-heart-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/profile',
      component: 'app/pulse/profile/page',
      title: 'Pulse Profile',
      icon: 'ri-user-line',
      requiresAuth: true,
    },
    {
      path: '/pulse/admin',
      component: 'app/pulse/admin/page',
      title: 'Pulse Admin',
      icon: 'ri-settings-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'WAREHOUSE_HEAD', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/pulse/admin/rulesets',
      component: 'app/pulse/admin/rulesets/page',
      title: 'Rulesets',
      icon: 'ri-settings-3-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'WAREHOUSE_HEAD', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/pulse/admin/missions',
      component: 'app/pulse/admin/missions/page',
      title: 'Manage Missions',
      icon: 'ri-target-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'WAREHOUSE_HEAD', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/pulse/admin/rewards',
      component: 'app/pulse/admin/rewards/page',
      title: 'Manage Rewards',
      icon: 'ri-gift-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'WAREHOUSE_HEAD', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/pulse/admin/redemptions',
      component: 'app/pulse/admin/redemptions/page',
      title: 'Redemptions',
      icon: 'ri-shopping-cart-line',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'WAREHOUSE_HEAD', 'OPERATIONS_MANAGER'],
    },
    {
      path: '/pulse/benchmark',
      component: 'app/pulse/benchmark/page',
      title: 'Benchmark',
      icon: 'ri-bar-chart-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/pulse/PulseOverview',
    'components/pulse/MissionCard',
    'components/pulse/LeaderboardTable',
    'components/pulse/RewardCard',
  ],
  services: [
    'lib/services/pulse',
  ],
  apis: [
    {
      endpoint: '/api/pulse/overview',
      method: 'GET',
      description: 'Get user pulse overview',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/missions',
      method: 'GET',
      description: 'Get missions',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/missions',
      method: 'POST',
      description: 'Claim mission',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/leaderboard',
      method: 'GET',
      description: 'Get leaderboard',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/rewards/catalog',
      method: 'GET',
      description: 'Get rewards catalog',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/rewards/redeem',
      method: 'POST',
      description: 'Redeem reward',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/recognition/give',
      method: 'POST',
      description: 'Give recognition',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/consent/optin',
      method: 'POST',
      description: 'Opt in/out of wellness tracking',
      requiresAuth: true,
    },
    {
      endpoint: '/api/pulse/wellness/manual',
      method: 'POST',
      description: 'Log manual wellness data',
      requiresAuth: true,
    },
  ],
  settings: [
    {
      key: 'wellnessEnabled',
      value: true,
      type: 'boolean',
      description: 'Enable wellness tracking',
      required: false,
      default: true,
    },
    {
      key: 'defaultRuleset',
      value: 'default',
      type: 'string',
      description: 'Default ruleset ID',
      required: false,
      default: 'default',
    },
  ],
  featureFlags: {
    wellness: true,
    missions: true,
    rewards: true,
    recognition: true,
    scoreboards: true,
    benchmarking: true,
  },
  config: {
    wellnessEnabled: true,
    defaultRuleset: 'default',
  },
}













