/**
 * Marketplace Module Registration
 * Comprehensive marketplace for all logistics and professional services
 * Benchmarking: Expert360, Thumbtack, Sulekha, Clicktrans, Catalant
 */

import { ModuleDefinition } from './registry'

export const marketplaceModule: ModuleDefinition = {
  id: 'marketplace',
  name: 'Marketplace',
  description: 'Comprehensive marketplace for all logistics services including storage, crossdocking, transportation, freight, consulting (Civil Defense, Saudization), manpower, translation, and warehouse networks. Integrated with RFQ, Proposals, and Purchasing modules.',
  version: '1.0.0',
  category: 'other',
  standalone: true,
  enabled: true,
  dependencies: ['proposals-rfq'], // Integrates with RFQ/Proposals
  components: [
    'components/marketplace/MarketplaceDashboard',
    'components/marketplace/ServiceListingCard',
    'components/marketplace/ServiceSearch',
    'components/marketplace/BookingManager',
    'components/marketplace/ProviderDashboard',
    'components/marketplace/ReviewSystem',
  ],
  services: [
    'lib/services/marketplace/marketplaceService',
    'lib/services/marketplace/storageMarketplaceService',
  ],
  routes: [
    // Main Marketplace
    { path: '/marketplace', component: 'app/marketplace/page', title: 'Marketplace', icon: 'ri-store-3-line' },
    { path: '/marketplace/search', component: 'app/marketplace/search/page', title: 'Search Services', icon: 'ri-search-line' },
    
    // Service Categories
    { path: '/marketplace/storage', component: 'app/marketplace/storage/page', title: 'Storage Services', icon: 'ri-building-4-line' },
    { path: '/marketplace/crossdocking', component: 'app/marketplace/crossdocking/page', title: 'Cross-Docking', icon: 'ri-swap-box-line' },
    { path: '/marketplace/transportation', component: 'app/marketplace/transportation/page', title: 'Transportation', icon: 'ri-truck-line' },
    { path: '/marketplace/freight', component: 'app/marketplace/freight/page', title: 'Freight Services', icon: 'ri-ship-line' },
    { path: '/marketplace/consulting', component: 'app/marketplace/consulting/page', title: 'Consulting Services', icon: 'ri-user-voice-line' },
    { path: '/marketplace/manpower', component: 'app/marketplace/manpower/page', title: 'Manpower Services', icon: 'ri-team-line' },
    { path: '/marketplace/translation', component: 'app/marketplace/translation/page', title: 'Translation Services', icon: 'ri-translate-2' },
    
    // Provider Management
    { path: '/marketplace/providers', component: 'app/marketplace/providers/page', title: 'Service Providers', icon: 'ri-building-line' },
    { path: '/marketplace/providers/register', component: 'app/marketplace/providers/register/page', title: 'Register as Provider', icon: 'ri-user-add-line' },
    { path: '/marketplace/providers/dashboard', component: 'app/marketplace/providers/dashboard/page', title: 'Provider Dashboard', icon: 'ri-dashboard-3-line' },
    { path: '/marketplace/providers/bookings', component: 'app/marketplace/providers/bookings/page', title: 'Provider Bookings', icon: 'ri-calendar-check-line' },
    
    // Bookings
    { path: '/marketplace/bookings', component: 'app/marketplace/bookings/page', title: 'My Bookings', icon: 'ri-calendar-check-line' },
    
    // Reviews
    { path: '/marketplace/reviews', component: 'app/marketplace/reviews/page', title: 'Reviews', icon: 'ri-star-line' },
    
    // Contracts & Messaging (Critical Enhancements)
    { path: '/marketplace/contracts', component: 'app/marketplace/contracts/page', title: 'Service Agreements', icon: 'ri-file-contract-line' },
    { path: '/marketplace/messages', component: 'app/marketplace/messages/page', title: 'Messages', icon: 'ri-message-3-line' },
  ],
  config: {
    defaultCurrency: 'SAR',
    supportedCurrencies: ['SAR', 'AED', 'KWD', 'USD', 'EUR'],
    enableReviews: true,
    enableRatings: true,
    enableProviderVerification: true,
    commissionRate: 0.05, // 5% commission
    paymentTerms: 30, // days
  },
  features: [
    // Core Features
    'service_listings',
    'service_search',
    'booking_management',
    'provider_management',
    'reviews_ratings',
    
    // Service Categories
    'storage_marketplace',
    'crossdocking_marketplace',
    'transportation_marketplace',
    'freight_marketplace',
    'consulting_marketplace',
    'manpower_marketplace',
    'translation_marketplace',
    'warehouse_network_marketplace',
    
    // Advanced Features
    'intelligent_matching',
    'price_comparison',
    'availability_tracking',
    'real_time_notifications',
    'multi_currency_support',
    
    // Integration Features
    'rfq_integration',
    'proposal_integration',
    'purchasing_integration',
    'wms_integration',
    'tms_integration',
    
    // Critical Enhancements
    'contract_management',
    'e_signature_integration',
    'sla_tracking',
    'real_time_messaging',
    'file_sharing',
  ],
}



