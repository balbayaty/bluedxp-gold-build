/**
 * Warehouse Network Module
 * 
 * Multi-warehouse management
 * Network optimization
 * Cross-docking
 * Inventory balancing
 * 
 * @module warehouse-network
 */

import { ModuleDefinition } from './registry'

export const warehouseNetworkModule: ModuleDefinition = {
  id: 'warehouse-network',
  name: 'Warehouse Network',
  description: 'Multi-warehouse network management with optimization, cross-docking, and inventory balancing',
  version: '1.0.0',
  category: 'wms',
  standalone: false,
  dependencies: ['wms'],
  enabled: true,
  routes: [
    {
      path: '/warehouse-network',
      component: 'app/warehouse-network/page',
      title: 'Warehouse Network',
      icon: 'ri-building-2-line',
      requiresAuth: true,
    },
    {
      path: '/warehouse-network/optimization',
      component: 'app/warehouse-network/optimization/page',
      title: 'Network Optimization',
      icon: 'ri-line-chart-line',
      requiresAuth: true,
    },
    {
      path: '/warehouse-network/cross-docking',
      component: 'app/warehouse-network/cross-docking/page',
      title: 'Cross-Docking',
      icon: 'ri-swap-box-line',
      requiresAuth: true,
    },
  ],
  components: [
    'components/warehouse-network/NetworkDashboard',
    'components/warehouse-network/WarehouseMap',
    'components/warehouse-network/OptimizationResults',
    'components/warehouse-network/CrossDockingOperations',
    'components/warehouse-network/InventoryBalance',
  ],
  services: [
    'lib/services/warehouse-network',
  ],
  config: {
    optimizationEnabled: true,
    crossDockingEnabled: true,
    inventoryBalancing: true,
  },
}
