const fs = require('fs')
const path = require('path')

// Define all remaining pages with their configurations
const pages = [
  // Inventory Management
  { path: 'app/serials/page.tsx', title: 'Serial Number', icon: 'ri-barcode-line', desc: 'Serial number tracking and traceability', systemInfo: { sap: 'Serial Number Management', oracle: 'Serial Tracking', manhattan: 'Serial Control' } },
  { path: 'app/valuation/page.tsx', title: 'Stock Valuation', icon: 'ri-money-dollar-circle-line', desc: 'Inventory valuation and costing', systemInfo: { sap: 'MB5B - Stock Valuation', oracle: 'Inventory Valuation', manhattan: 'Stock Valuation' } },
  { path: 'app/abc-analysis/page.tsx', title: 'ABC Analysis', icon: 'ri-bar-chart-box-line', desc: 'Material classification and analysis', systemInfo: { sap: 'ABC Analysis', oracle: 'ABC Classification', manhattan: 'ABC Analysis' } },
  { path: 'app/stock-alerts/page.tsx', title: 'Stock Alerts', icon: 'ri-alert-line', desc: 'Low stock warnings and alerts', systemInfo: { sap: 'Stock Alerts', oracle: 'Inventory Alerts', manhattan: 'Stock Warnings' } },
  { path: 'app/reservations/page.tsx', title: 'Reservations', icon: 'ri-bookmark-line', desc: 'Stock reservations and allocations', systemInfo: { sap: 'MB21 - Create Reservation', oracle: 'Reservations', manhattan: 'Stock Reservations' } },
  
  // Order Management
  { path: 'app/order-confirmation/page.tsx', title: 'Order Confirmation', icon: 'ri-checkbox-circle-line', desc: 'Order confirmation and status tracking', systemInfo: { sap: 'Order Confirmation', oracle: 'Order Status', manhattan: 'Order Confirmation' } },
  { path: 'app/pick-release/page.tsx', title: 'Pick Release', icon: 'ri-play-circle-line', desc: 'Release orders for picking', systemInfo: { sap: 'Pick Release', oracle: 'Pick Release', manhattan: 'Pick Release' } },
  { path: 'app/wave-planning/page.tsx', title: 'Wave Planning', icon: 'ri-sound-module-line', desc: 'Batch optimization and wave planning', systemInfo: { sap: 'Wave Planning', oracle: 'Wave Management', manhattan: 'Wave Planning' } },
  { path: 'app/load-planning/page.tsx', title: 'Load Planning', icon: 'ri-truck-line', desc: 'Truck optimization and load planning', systemInfo: { sap: 'Load Planning', oracle: 'Load Optimization', manhattan: 'Load Planning' } },
  { path: 'app/ship-confirmation/page.tsx', title: 'Ship Confirmation', icon: 'ri-ship-line', desc: 'Shipping status and confirmation', systemInfo: { sap: 'Ship Confirmation', oracle: 'Ship Status', manhattan: 'Ship Confirmation' } },
  { path: 'app/delivery-note/page.tsx', title: 'Delivery Note', icon: 'ri-file-paper-line', desc: 'Delivery note generation and management', systemInfo: { sap: 'VL01N - Delivery Note', oracle: 'Delivery Note', manhattan: 'Delivery Note' } },
  
  // Transportation
  { path: 'app/carriers/page.tsx', title: 'Carrier Management', icon: 'ri-truck-fill', desc: 'Carrier setup and management', systemInfo: { sap: 'Carrier Management', oracle: 'Carrier Setup', manhattan: 'Carrier Management' } },
  { path: 'app/pickup-requests/page.tsx', title: 'Pickup Requests', icon: 'ri-calendar-todo-line', desc: 'Wajeeh integration and pickup requests', systemInfo: { sap: 'Pickup Requests', oracle: 'Pickup Management', manhattan: 'Pickup Requests' } },
  { path: 'app/tracking/page.tsx', title: 'Shipment Tracking', icon: 'ri-map-pin-line', desc: 'Real-time shipment tracking', systemInfo: { sap: 'Tracking', oracle: 'Shipment Tracking', manhattan: 'Tracking' } },
  { path: 'app/routes/page.tsx', title: 'Route Optimization', icon: 'ri-route-line', desc: 'Delivery routes and optimization', systemInfo: { sap: 'Route Planning', oracle: 'Route Optimization', manhattan: 'Route Management' } },
  { path: 'app/freight/page.tsx', title: 'Freight Management', icon: 'ri-price-tag-3-line', desc: 'Shipping costs and freight management', systemInfo: { sap: 'Freight Calculation', oracle: 'Freight Management', manhattan: 'Freight' } },
  { path: 'app/pod/page.tsx', title: 'Proof of Delivery', icon: 'ri-file-check-line', desc: 'POD management and tracking', systemInfo: { sap: 'POD Management', oracle: 'Proof of Delivery', manhattan: 'POD' } },
  
  // Quality Management
  { path: 'app/inspection-lots/page.tsx', title: 'Inspection Lots', icon: 'ri-file-search-line', desc: 'Quality inspections and lots', systemInfo: { sap: 'QA11 - Inspection Lot', oracle: 'Inspection Lots', manhattan: 'Inspection Management' } },
  { path: 'app/ncr/page.tsx', title: 'NCR Management', icon: 'ri-error-warning-line', desc: 'Non-conformance reports', systemInfo: { sap: 'NCR Management', oracle: 'Non-Conformance', manhattan: 'NCR' } },
  { path: 'app/damage/page.tsx', title: 'Damage Reports', icon: 'ri-alert-line', desc: 'Damage tracking and reports', systemInfo: { sap: 'Damage Reports', oracle: 'Damage Tracking', manhattan: 'Damage Management' } },
  { path: 'app/certificates/page.tsx', title: 'Quality Certificates', icon: 'ri-file-certificate-line', desc: 'COA and quality certificates', systemInfo: { sap: 'Certificates', oracle: 'Quality Certificates', manhattan: 'Certificates' } },
  { path: 'app/holds/page.tsx', title: 'Hold Management', icon: 'ri-lock-line', desc: 'Stock holds and releases', systemInfo: { sap: 'Hold Management', oracle: 'Stock Holds', manhattan: 'Hold Management' } },
  
  // Master Data
  { path: 'app/customers/page.tsx', title: 'Customer Master', icon: 'ri-user-3-line', desc: 'Customer master data', systemInfo: { sap: 'XD01 - Create Customer', oracle: 'Customer Master', manhattan: 'Customer Management' } },
  { path: 'app/storage-locations/page.tsx', title: 'Storage Locations', icon: 'ri-map-pin-3-line', desc: 'Warehouse locations and zones', systemInfo: { sap: 'Storage Location', oracle: 'Subinventory', manhattan: 'Storage Locations' } },
  { path: 'app/bins/page.tsx', title: 'Bin Master', icon: 'ri-stack-line', desc: 'Storage bins and locations', systemInfo: { sap: 'Bin Master', oracle: 'Locator', manhattan: 'Bin Management' } },
  { path: 'app/work-centers/page.tsx', title: 'Work Centers', icon: 'ri-building-2-line', desc: 'Work centers and resources', systemInfo: { sap: 'CR01 - Work Center', oracle: 'Work Center', manhattan: 'Work Centers' } },
  { path: 'app/resources/page.tsx', title: 'Resource Master', icon: 'ri-tools-line', desc: 'Equipment and resources', systemInfo: { sap: 'Resource Master', oracle: 'Resources', manhattan: 'Resource Management' } },
  
  // SLA & Performance
  { path: 'app/sla-kpi/page.tsx', title: 'SLA Management', icon: 'ri-time-fill', desc: 'SLA configuration and tracking', systemInfo: { sap: 'SLA Management', oracle: 'SLA Configuration', manhattan: 'SLA Management' } },
  { path: 'app/kpi-dashboard/page.tsx', title: 'KPI Dashboard', icon: 'ri-dashboard-line', desc: 'Key performance indicators', systemInfo: { sap: 'KPI Dashboard', oracle: 'KPI Management', manhattan: 'KPI Dashboard' } },
  { path: 'app/reports/page.tsx', title: 'SLA Reports', icon: 'ri-file-chart-line', desc: 'Compliance and SLA reports', systemInfo: { sap: 'SLA Reports', oracle: 'Compliance Reports', manhattan: 'SLA Reports' } },
  { path: 'app/modern-sla/page.tsx', title: 'Modern SLA Framework', icon: 'ri-file-paper-2-line', desc: 'Industry standards and frameworks', systemInfo: { sap: 'SLA Framework', oracle: 'SLA Standards', manhattan: 'SLA Framework' } },
  { path: 'app/customer-dashboard/page.tsx', title: 'Customer Dashboard', icon: 'ri-user-dashboard-line', desc: 'Customer portal and dashboard', systemInfo: { sap: 'Customer Portal', oracle: 'Customer Dashboard', manhattan: 'Customer Portal' } },
  { path: 'app/overtime/page.tsx', title: 'Overtime Tracking', icon: 'ri-time-zone-line', desc: 'Employee and equipment overtime', systemInfo: { sap: 'Overtime Tracking', oracle: 'Overtime Management', manhattan: 'Overtime Tracking' } },
  
  // Reporting & Analytics
  { path: 'app/reports/operational/page.tsx', title: 'Operational Reports', icon: 'ri-file-chart-2-line', desc: 'Daily operations reports', systemInfo: { sap: 'Operational Reports', oracle: 'Operations Reports', manhattan: 'Operational Reports' } },
  { path: 'app/reports/inventory/page.tsx', title: 'Inventory Reports', icon: 'ri-stack-line', desc: 'Stock and inventory reports', systemInfo: { sap: 'MB5B - Stock Overview', oracle: 'Inventory Reports', manhattan: 'Inventory Reports' } },
  { path: 'app/reports/orders/page.tsx', title: 'Order Reports', icon: 'ri-shopping-cart-line', desc: 'Order analytics and reports', systemInfo: { sap: 'Order Reports', oracle: 'Order Analytics', manhattan: 'Order Reports' } },
  { path: 'app/reports/performance/page.tsx', title: 'Performance Reports', icon: 'ri-line-chart-line', desc: 'KPI and performance reports', systemInfo: { sap: 'Performance Reports', oracle: 'KPI Reports', manhattan: 'Performance Reports' } },
  { path: 'app/reports/financial/page.tsx', title: 'Financial Reports', icon: 'ri-money-dollar-circle-line', desc: 'Cost and revenue reports', systemInfo: { sap: 'Financial Reports', oracle: 'Cost Reports', manhattan: 'Financial Reports' } },
  { path: 'app/reports/custom/page.tsx', title: 'Custom Reports', icon: 'ri-file-edit-line', desc: 'Report builder and custom reports', systemInfo: { sap: 'Report Builder', oracle: 'Custom Reports', manhattan: 'Report Builder' } },
  { path: 'app/data-mining/page.tsx', title: 'Data Mining', icon: 'ri-brain-line', desc: 'Feature engineering and data mining', systemInfo: { sap: 'Data Mining', oracle: 'Feature Engineering', manhattan: 'Data Mining' } },
  
  // Integration
  { path: 'app/integration/erp/page.tsx', title: 'ERP Integration', icon: 'ri-exchange-line', desc: 'SAP / Oracle / Custom ERP integration', systemInfo: { sap: 'ERP Integration', oracle: 'ERP Integration', manhattan: 'ERP Integration' } },
  { path: 'app/integration/edi/page.tsx', title: 'EDI Integration', icon: 'ri-file-transfer-line', desc: 'Electronic data interchange', systemInfo: { sap: 'EDI Integration', oracle: 'EDI Management', manhattan: 'EDI Integration' } },
  { path: 'app/integration/api/page.tsx', title: 'API Management', icon: 'ri-code-s-slash-line', desc: 'REST API and webhooks', systemInfo: { sap: 'API Management', oracle: 'API Gateway', manhattan: 'API Management' } },
  { path: 'app/integration/carriers/page.tsx', title: 'Carrier Integration', icon: 'ri-truck-line', desc: 'Wajeeh and carrier integrations', systemInfo: { sap: 'Carrier Integration', oracle: 'Carrier API', manhattan: 'Carrier Integration' } },
  { path: 'app/integration/labels/page.tsx', title: 'Label Printing', icon: 'ri-printer-line', desc: 'Barcode and label printing', systemInfo: { sap: 'Label Printing', oracle: 'Label Management', manhattan: 'Label Printing' } },
  
  // Configuration
  { path: 'app/settings/warehouse/page.tsx', title: 'Warehouse Setup', icon: 'ri-warehouse-fill', desc: 'Warehouse configuration', systemInfo: { sap: 'Warehouse Setup', oracle: 'Warehouse Configuration', manhattan: 'Warehouse Setup' } },
  { path: 'app/settings/users/page.tsx', title: 'User Management', icon: 'ri-user-settings-line', desc: 'Users and roles', systemInfo: { sap: 'User Management', oracle: 'User Administration', manhattan: 'User Management' } },
  { path: 'app/settings/workflow/page.tsx', title: 'Workflow Engine', icon: 'ri-flow-chart-line', desc: 'Process workflows', systemInfo: { sap: 'Workflow Engine', oracle: 'Workflow Management', manhattan: 'Workflow Engine' } },
  { path: 'app/settings/notifications/page.tsx', title: 'Notification Rules', icon: 'ri-notification-line', desc: 'Alert configuration', systemInfo: { sap: 'Notification Rules', oracle: 'Alert Configuration', manhattan: 'Notification Rules' } },
  { path: 'app/settings/templates/page.tsx', title: 'Print Templates', icon: 'ri-file-text-line', desc: 'Document templates', systemInfo: { sap: 'Print Templates', oracle: 'Template Management', manhattan: 'Print Templates' } },
  { path: 'app/settings/parameters/page.tsx', title: 'System Parameters', icon: 'ri-settings-4-line', desc: 'System configuration', systemInfo: { sap: 'System Parameters', oracle: 'System Configuration', manhattan: 'System Parameters' } },
]

// Template for page component
const pageTemplate = (config) => {
  const componentName = config.title.replace(/\s+/g, '')
  const systemInfoStr = JSON.stringify(config.systemInfo, null, 2)
  
  return `'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import PageTemplate from '@/components/PageTemplate'
import Tooltip from '@/components/Tooltip'
import { generateMaterialMaster, generateInventoryStock, generateSalesOrders, generatePurchaseOrders, generateCarriers, generateWorkCenters, generateInspectionLots, generateCustomerMaster, generateStorageLocations, generateCycleCounts } from '@/utils/mockDataGenerators'
import { format } from 'date-fns'

export default function ${componentName}() {
  const [data] = useState(() => {
    // Generate appropriate mock data based on page type
    if ('${config.title}'.includes('Customer')) {
      return generateCustomerMaster(50)
    } else if ('${config.title}'.includes('Carrier')) {
      return generateCarriers(30)
    } else if ('${config.title}'.includes('Work Center') || '${config.title}'.includes('Resource')) {
      return generateWorkCenters(20)
    } else if ('${config.title}'.includes('Inspection')) {
      return generateInspectionLots(40)
    } else if ('${config.title}'.includes('Storage') || '${config.title}'.includes('Location')) {
      return generateStorageLocations(50)
    } else if ('${config.title}'.includes('Sales Order') || '${config.title}'.includes('Order')) {
      return generateSalesOrders(50)
    } else if ('${config.title}'.includes('Purchase')) {
      return generatePurchaseOrders(50)
    } else {
      return generateInventoryStock(50)
    }
  })
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      return Object.values(item).some((val: any) =>
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [data, searchQuery])

  const stats = [
    {
      label: 'Total Items',
      value: data.length,
      icon: '${config.icon}',
      tooltip: 'Total number of items',
      trend: 'up' as const,
    },
  ]

  return (
    <PageTemplate
      title="${config.title}"
      description="${config.desc}"
      icon="${config.icon}"
      systemInfo={${systemInfoStr}}
      examples={[
        'View and manage ${config.title.toLowerCase()}',
        'Track ${config.title.toLowerCase()} status',
        'Generate reports',
        'Export data',
      ]}
      stats={stats}
      actions={
        <button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20">
          <i className="ri-add-line"></i>
          Create New
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search ${config.title.toLowerCase()}..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.slice(0, 30).map((item: any, index: number) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Tooltip
                  content={\`${config.title}: \${item.name || item.title || item.number || item.code || item.id}\`}
                  systemInfo={${systemInfoStr}}
                  position="top"
                >
                  <h3 className="text-lg font-semibold text-white font-mono cursor-help mb-1">
                    {item.name || item.title || item.number || item.code || item.id || \`Item \${index + 1}\`}
                  </h3>
                </Tooltip>
                <p className="text-sm text-[#9ca3af]">
                  {item.description || item.status || item.type || 'No description'}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {Object.entries(item).slice(0, 4).map(([key, value]: [string, any]) => (
                key !== 'id' && key !== 'name' && key !== 'title' && key !== 'description' && (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-white font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                )
              ))}
            </div>
            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
              <Tooltip content="View Details" position="top">
                <button className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors">
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
              </Tooltip>
              <Tooltip content="Edit" position="top">
                <button className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors">
                  <i className="ri-edit-line"></i>
                </button>
              </Tooltip>
            </div>
          </motion.div>
        ))}
      </div>
    </PageTemplate>
  )
}
`
}

// Create all pages
pages.forEach((page) => {
  const dir = path.dirname(page.path)
  const fullPath = path.join(process.cwd(), page.path)
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // Write page file
  fs.writeFileSync(fullPath, pageTemplate(page), 'utf8')
  console.log(`Created: ${page.path}`)
})

console.log(`\n✅ Created ${pages.length} pages successfully!`)
