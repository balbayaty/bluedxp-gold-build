/**
 * Brand Messaging Engine Module Registration
 * On-brand, bilingual messaging generation system
 */

import { ModuleDefinition } from './registry'

export const brandMessagingModule: ModuleDefinition = {
  id: 'brand-messaging',
  name: 'Brand Messaging Engine',
  description: 'Generate on-brand, bilingual messaging using AI. Ensures consistent brand voice across all modules with intelligent quality checking and cultural adaptation.',
  version: '1.0.0',
  category: 'other',
  standalone: true,
  enabled: true,
  routes: [
    {
      path: '/brand-messaging',
      component: 'app/brand-messaging/page',
      title: 'Brand Messaging',
      icon: 'SparklesIcon',
      requiresAuth: true,
      roles: ['SYSTEM_ADMIN', 'BUSINESS_DEVELOPMENT_MANAGER'],
    },
  ],
  components: [
    'components/brand-messaging/BrandMessagingDashboard',
    'components/brand-messaging/MessageGenerator',
    'components/brand-messaging/MessagePreview',
    'components/brand-messaging/QualityAnalyzer',
    'components/brand-messaging/BatchGenerator',
    'components/brand-messaging/MessageLibrary',
    'components/brand-messaging/CacheStats',
    'components/brand-messaging/BrandMessage',
  ],
  services: [
    'lib/services/brand-messaging/brandMessagingService',
    'lib/services/brand-messaging/useBrandMessaging',
  ],
  dependencies: [],
  config: {
    aiEnabled: true,
    qualityChecking: true,
    caching: true,
    saudiAlignmentIntegration: true,
  },
}

// Initialize function
export async function initializeBrandMessagingModule(): Promise<void> {
  try {
    // Service is already initialized as singleton
    console.log('Brand Messaging Engine module initialized successfully')
  } catch (error) {
    console.error('Error initializing Brand Messaging module:', error)
    throw error
  }
}











