/**
 * WMS Module Definition
 * Warehouse Management System Module
 */

import { ModuleDefinition } from './registry'

export const wmsModule: ModuleDefinition = {
  id: 'wms',
  name: 'Warehouse Management System',
  description: 'Complete 3PL/4PL warehouse management with 97+ pages',
  version: '1.0.0',
  category: 'wms',
  standalone: true,
  dependencies: [],
  routes: [
    // Warehouse Operations
    { path: '/inbound', component: 'app/inbound/page', title: 'Inbound Operations', icon: 'ri-inbox-line' },
    { path: '/outbound', component: 'app/outbound/page', title: 'Outbound Operations', icon: 'ri-ship-line' },
    { path: '/goods-receipt', component: 'app/goods-receipt/page', title: 'Goods Receipt', icon: 'ri-inbox-line' },
    { path: '/goods-issue', component: 'app/goods-issue/page', title: 'Goods Issue', icon: 'ri-send-plane-line' },
    { path: '/transfer-posting', component: 'app/transfer-posting/page', title: 'Transfer Posting', icon: 'ri-arrow-left-right-line' },
    { path: '/putaway', component: 'app/putaway/page', title: 'Putaway', icon: 'ri-stack-line' },
    { path: '/picking', component: 'app/picking/page', title: 'Picking', icon: 'ri-handbag-line' },
    { path: '/cycle-counting', component: 'app/cycle-counting/page', title: 'Cycle Counting', icon: 'ri-file-list-3-line' },
    { path: '/cross-docking', component: 'app/cross-docking/page', title: 'Cross-Docking', icon: 'ri-swap-box-line' },
    { path: '/task-management', component: 'app/task-management/page', title: 'Task Management', icon: 'ri-task-line' },
    { path: '/tasks', component: 'app/tasks/page', title: 'Tasks', icon: 'ri-task-line' },
    { path: '/my-tasks', component: 'app/my-tasks/page', title: 'My Tasks', icon: 'ri-user-line' },
    
    // Inventory Management
    { path: '/inventory', component: 'app/inventory/page', title: 'Stock Overview', icon: 'ri-stack-line' },
    { path: '/skus', component: 'app/skus/page', title: 'SKU Management', icon: 'ri-barcode-line' },
    { path: '/materials', component: 'app/materials/page', title: 'Materials', icon: 'ri-box-line' },
    { path: '/batches', component: 'app/batches/page', title: 'Batch Management', icon: 'ri-file-list-line' },
    { path: '/serials', component: 'app/serials/page', title: 'Serial Numbers', icon: 'ri-barcode-line' },
    { path: '/valuation', component: 'app/valuation/page', title: 'Stock Valuation', icon: 'ri-money-dollar-circle-line' },
    { path: '/abc-analysis', component: 'app/abc-analysis/page', title: 'ABC Analysis', icon: 'ri-bar-chart-box-line' },
    { path: '/stock-alerts', component: 'app/stock-alerts/page', title: 'Stock Alerts', icon: 'ri-alert-line' },
    { path: '/expiry-management', component: 'app/expiry-management/page', title: 'Expiry Management', icon: 'ri-time-line' },
    { path: '/reservations', component: 'app/reservations/page', title: 'Reservations', icon: 'ri-bookmark-line' },
    { path: '/replenishment', component: 'app/replenishment/page', title: 'Replenishment', icon: 'ri-refresh-line' },
    { path: '/storage-locations', component: 'app/storage-locations/page', title: 'Storage Locations', icon: 'ri-map-pin-line' },
    { path: '/warehouse-locations', component: 'app/warehouse-locations/page', title: 'Warehouse Locations', icon: 'ri-map-pin-3-line' },
    { path: '/warehouse-areas', component: 'app/warehouse-areas/page', title: 'Warehouse Areas', icon: 'ri-grid-line' },
    { path: '/bins', component: 'app/bins/page', title: 'Bins', icon: 'ri-layout-grid-line' },
    { path: '/holds', component: 'app/holds/page', title: 'Holds', icon: 'ri-lock-line' },
    
    // Order Management
    { path: '/orders', component: 'app/orders/page', title: 'Purchase Orders', icon: 'ri-shopping-cart-line' },
    { path: '/purchase-orders', component: 'app/purchase-orders/page', title: 'Purchase Orders', icon: 'ri-shopping-bag-line' },
    { path: '/sales-orders', component: 'app/sales-orders/page', title: 'Sales Orders', icon: 'ri-shopping-cart-2-line' },
    { path: '/order-confirmation', component: 'app/order-confirmation/page', title: 'Order Confirmation', icon: 'ri-checkbox-circle-line' },
    { path: '/pick-release', component: 'app/pick-release/page', title: 'Pick Release', icon: 'ri-play-circle-line' },
    { path: '/wave-planning', component: 'app/wave-planning/page', title: 'Wave Planning', icon: 'ri-sound-module-line' },
    { path: '/load-planning', component: 'app/load-planning/page', title: 'Load Planning', icon: 'ri-truck-line' },
    { path: '/ship-confirmation', component: 'app/ship-confirmation/page', title: 'Ship Confirmation', icon: 'ri-ship-line' },
    { path: '/delivery-note', component: 'app/delivery-note/page', title: 'Delivery Note', icon: 'ri-file-paper-line' },
    { path: '/return-management', component: 'app/return-management/page', title: 'Return Management', icon: 'ri-arrow-go-back-line' },
    { path: '/pickup-requests', component: 'app/pickup-requests/page', title: 'Pickup Requests', icon: 'ri-truck-line' },
    
    // Quality Management
    { path: '/inspection-lots', component: 'app/inspection-lots/page', title: 'Inspection Lots', icon: 'ri-search-line' },
    { path: '/ncr', component: 'app/ncr/page', title: 'NCR Management', icon: 'ri-error-warning-line' },
    { path: '/ncr-management', component: 'app/ncr-management/page', title: 'NCR Management', icon: 'ri-error-warning-line' },
    { path: '/certificates', component: 'app/certificates/page', title: 'Certificates', icon: 'ri-file-certificate-line' },
    { path: '/damage', component: 'app/damage/page', title: 'Damage Reports', icon: 'ri-alert-line' },
    { path: '/capa-management', component: 'app/capa-management/page', title: 'CAPA Management', icon: 'ri-tools-line' },
    
    // Master Data
    { path: '/customers', component: 'app/customers/page', title: 'Customers', icon: 'ri-user-line' },
    { path: '/vendors', component: 'app/vendors/page', title: 'Vendors', icon: 'ri-store-line' },
    { path: '/warehouses', component: 'app/warehouses/page', title: 'Warehouses', icon: 'ri-warehouse-line' },
    { path: '/users', component: 'app/users/page', title: 'Users', icon: 'ri-user-settings-line' },
    { path: '/work-centers', component: 'app/work-centers/page', title: 'Work Centers', icon: 'ri-building-line' },
    { path: '/resources', component: 'app/resources/page', title: 'Resources', icon: 'ri-tools-line' },
    { path: '/overtime', component: 'app/overtime/page', title: 'Overtime', icon: 'ri-time-line' },
  ],
  components: [
    'components/InboundPage',
    'components/OutboundPage',
    // ... add all WMS components
  ],
  services: [
    // Quantum Logistics Integration
    'lib/services/wms/quantum-integration',
    // AI Analytics Enhancement
    'lib/services/wms/ai-analytics-enhancement',
    'utils/mockDataGenerators',
    'utils/realtimeDataSimulator',
    'lib/services/wms/locationService',
    'lib/services/wms/areaService',
    'lib/services/wms/fireSafetyService',
    'lib/services/wms/regulatoryComplianceService',
    'lib/services/wms/aiAnalyticsService',
    'lib/services/wms/inventoryService',
    'lib/services/wms/skuService',
  ],
  enabled: true,
}



