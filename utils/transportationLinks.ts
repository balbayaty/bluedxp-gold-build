import type { ModuleLink } from '@/utils/moduleInterconnectivity'

/**
 * Generic module links for Transportation (dashboard-level; no specific shipment context).
 *
 * Kept in a small, focused file so pages don't have to import the very large
 * `moduleInterconnectivity.ts` implementation to render a simple dashboard.
 */
export function getTransportationLinks(): ModuleLink[] {
  return [
    {
      label: 'Shipments',
      href: '/shipments',
      icon: 'ri-inbox-archive-line',
      description: 'View all shipments',
    },
    {
      label: 'Carrier Management',
      href: '/carriers',
      icon: 'ri-truck-line',
      description: 'Manage carriers and performance',
    },
    {
      label: 'Customs',
      href: '/transportation/customs',
      icon: 'ri-passport-line',
      description: 'Customs authorities, clearance, and compliance',
    },
    {
      label: 'Intelligent Routing',
      href: '/transportation/intelligent-routing',
      icon: 'ri-route-line',
      description: 'Plan routes with AI assistance',
    },
    {
      label: 'Capability Catalog',
      href: '/transportation/capabilities',
      icon: 'ri-radar-line',
      description: 'Browse transportation capabilities',
    },
  ]
}


