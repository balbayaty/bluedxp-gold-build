/**
 * Module Interconnectivity Utilities
 * 
 * Provides functions to link modules together and maintain data relationships
 * Ensures complete workflow connectivity across the WMS system
 * 
 * ENHANCED: Full ISO IMS interconnections + Cross-module integration
 */

import { useRouter } from 'next/navigation'

export interface ModuleLink {
  label: string
  href: string
  icon: string
  description?: string
}

/**
 * Get related module links for Purchase Orders
 */
export function getPurchaseOrderLinks(poNumber: string): ModuleLink[] {
  return [
    {
      label: 'Goods Receipt',
      href: `/goods-receipt?po=${poNumber}`,
      icon: 'ri-inbox-line',
      description: 'Receive goods against this PO',
    },
    {
      label: 'Vendor Master',
      href: `/vendors?po=${poNumber}`,
      icon: 'ri-user-line',
      description: 'View vendor details',
    },
    {
      label: 'Stock Overview',
      href: `/inventory?po=${poNumber}`,
      icon: 'ri-stack-line',
      description: 'View received stock',
    },
    {
      label: 'Inbound Operations',
      href: `/inbound?po=${poNumber}`,
      icon: 'ri-download-line',
      description: 'View inbound ASN',
    },
    {
      label: 'ISO Documents',
      href: `/document-center?po=${poNumber}`,
      icon: 'ri-file-text-line',
      description: 'View related ISO documents',
    },
    {
      label: 'NCR Management',
      href: `/ncr-management?po=${poNumber}`,
      icon: 'ri-alert-line',
      description: 'View non-conformances',
    },
  ]
}

/**
 * Get related module links for Sales Orders
 */
export function getSalesOrderLinks(soNumber: string, customerNumber?: string): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'Picking',
      href: `/picking?so=${soNumber}`,
      icon: 'ri-handbag-line',
      description: 'View picking tasks',
    },
    {
      label: 'Shipment Tracking',
      href: `/tracking?so=${soNumber}`,
      icon: 'ri-map-pin-line',
      description: 'Track shipment',
    },
    {
      label: 'Proof of Delivery',
      href: `/pod?so=${soNumber}`,
      icon: 'ri-file-check-line',
      description: 'View POD',
    },
    {
      label: 'Load Planning',
      href: `/load-planning?so=${soNumber}`,
      icon: 'ri-truck-line',
      description: 'View load plan',
    },
    {
      label: 'Outbound Operations',
      href: `/outbound?so=${soNumber}`,
      icon: 'ri-upload-line',
      description: 'View outbound operations',
    },
    {
      label: 'NCR Management',
      href: `/ncr-management?so=${soNumber}`,
      icon: 'ri-alert-line',
      description: 'Report non-conformance',
    },
    {
      label: 'CAPA Management',
      href: `/capa-management?so=${soNumber}`,
      icon: 'ri-tools-line',
      description: 'View corrective actions',
    },
  ]

  if (customerNumber) {
    links.push({
      label: 'Customer Master',
      href: `/customers?so=${soNumber}`,
      icon: 'ri-user-line',
      description: 'View customer details',
    })
  }

  return links
}

/**
 * Get related module links for Inventory/Stock
 */
export function getInventoryLinks(materialNumber?: string, locationCode?: string): ModuleLink[] {
  const links: ModuleLink[] = []
  
  if (materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${materialNumber}`,
      icon: 'ri-file-list-line',
      description: 'View material details',
    })
    links.push({
      label: 'Transfer Posting',
      href: `/transfer-posting?material=${materialNumber}`,
      icon: 'ri-arrow-left-right-line',
      description: 'Transfer stock',
    })
    links.push({
      label: 'Cycle Counting',
      href: `/cycle-counting?material=${materialNumber}`,
      icon: 'ri-file-list-3-line',
      description: 'Create cycle count',
    })
    links.push({
      label: 'Inspection Lots',
      href: `/inspection-lots?material=${materialNumber}`,
      icon: 'ri-file-search-line',
      description: 'View quality inspections',
    })
    links.push({
      label: 'ISO Documents',
      href: `/document-center?material=${materialNumber}`,
      icon: 'ri-file-text-line',
      description: 'View material certificates',
    })
  }

  if (locationCode) {
    links.push({
      label: 'Storage Location',
      href: `/storage-locations?location=${locationCode}`,
      icon: 'ri-map-pin-3-line',
      description: 'View storage location',
    })
    links.push({
      label: 'ISO Storage Locations',
      href: `/iso-ims/storage-locations?location=${locationCode}`,
      icon: 'ri-shield-check-line',
      description: 'View ISO compliance',
    })
  }

  return links
}

/**
 * Get related module links for SKUs
 */
export function getSKULinks(skuId: string, skuCode?: string, materialNumber?: string): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'SKU Details',
      href: `/skus?sku=${skuId}`,
      icon: 'ri-barcode-line',
      description: 'View SKU details',
    },
    {
      label: 'Stock Overview',
      href: `/inventory?sku=${skuId}`,
      icon: 'ri-stack-line',
      description: 'View stock levels',
    },
  ]
  
  if (materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${materialNumber}`,
      icon: 'ri-file-list-line',
      description: 'View material details',
    })
  }
  
  links.push(
    {
      label: 'Packaging Configuration',
      href: `/skus?sku=${skuId}&tab=packaging`,
      icon: 'ri-box-line',
      description: 'Configure packaging',
    },
    {
      label: 'Customer Links',
      href: `/skus?sku=${skuId}&tab=customers`,
      icon: 'ri-user-line',
      description: 'View customer links',
    },
    {
      label: 'Compliance Check',
      href: `/skus?sku=${skuId}&tab=compliance`,
      icon: 'ri-shield-check-line',
      description: 'Check compliance',
    },
    {
      label: 'Valuation',
      href: `/valuation?sku=${skuId}`,
      icon: 'ri-money-dollar-circle-line',
      description: 'View SKU valuation',
    },
    {
      label: 'Transfer Posting',
      href: `/transfer-posting?sku=${skuId}`,
      icon: 'ri-arrow-left-right-line',
      description: 'Transfer stock',
    },
    {
      label: 'Cycle Counting',
      href: `/cycle-counting?sku=${skuId}`,
      icon: 'ri-file-list-3-line',
      description: 'Create cycle count',
    },
    {
      label: 'Inspection Lots',
      href: `/inspection-lots?sku=${skuId}`,
      icon: 'ri-file-search-line',
      description: 'View quality inspections',
    },
    {
      label: 'ISO Documents',
      href: `/document-center?sku=${skuId}`,
      icon: 'ri-file-text-line',
      description: 'View SKU certificates',
    },
    {
      label: 'Risk Management',
      href: `/risk-management?sku=${skuId}`,
      icon: 'ri-shield-cross-line',
      description: 'View SKU risks',
    }
  )
  
  return links
}

/**
 * Get related module links for Materials
 */
export function getMaterialLinks(materialNumber: string): ModuleLink[] {
  return [
    {
      label: 'Stock Overview',
      href: `/inventory?material=${materialNumber}`,
      icon: 'ri-stack-line',
      description: 'View stock levels',
    },
    {
      label: 'SKU Management',
      href: `/skus?material=${materialNumber}`,
      icon: 'ri-barcode-line',
      description: 'View SKU details',
    },
    {
      label: 'Valuation',
      href: `/valuation?material=${materialNumber}`,
      icon: 'ri-money-dollar-circle-line',
      description: 'View material valuation',
    },
    {
      label: 'Transfer Posting',
      href: `/transfer-posting?material=${materialNumber}`,
      icon: 'ri-arrow-left-right-line',
      description: 'Transfer stock',
    },
    {
      label: 'Cycle Counting',
      href: `/cycle-counting?material=${materialNumber}`,
      icon: 'ri-file-list-3-line',
      description: 'Create cycle count',
    },
    {
      label: 'ISO Documents',
      href: `/document-center?material=${materialNumber}`,
      icon: 'ri-file-text-line',
      description: 'View material certificates',
    },
    {
      label: 'Risk Management',
      href: `/risk-management?material=${materialNumber}`,
      icon: 'ri-shield-cross-line',
      description: 'View material risks',
    },
  ]
}

/**
 * Get related module links for Storage Locations
 */
export function getStorageLocationLinks(locationCode: string): ModuleLink[] {
  return [
    {
      label: 'Inventory',
      href: `/inventory?location=${locationCode}`,
      icon: 'ri-stack-line',
      description: 'View inventory at this location',
    },
    {
      label: 'Bins',
      href: `/bins?location=${locationCode}`,
      icon: 'ri-layout-grid-line',
      description: 'View bins in this location',
    },
    {
      label: 'Putaway',
      href: `/putaway?location=${locationCode}`,
      icon: 'ri-inbox-line',
      description: 'Putaway to this location',
    },
    {
      label: 'Picking',
      href: `/picking?location=${locationCode}`,
      icon: 'ri-handbag-line',
      description: 'Pick from this location',
    },
    {
      label: 'ISO Storage Locations',
      href: `/iso-ims/storage-locations?location=${locationCode}`,
      icon: 'ri-shield-check-line',
      description: 'View ISO compliance',
    },
    {
      label: 'Audit Management',
      href: `/audit-management?location=${locationCode}`,
      icon: 'ri-file-search-line',
      description: 'View location audits',
    },
  ]
}

/**
 * Get related module links for Batches
 */
export function getBatchLinks(batchNumber: string, materialNumber: string): ModuleLink[] {
  return [
    {
      label: 'Stock Overview',
      href: `/inventory?batch=${batchNumber}`,
      icon: 'ri-stack-line',
      description: 'View stock for this batch',
    },
    {
      label: 'Material Master',
      href: `/materials?material=${materialNumber}`,
      icon: 'ri-file-list-line',
      description: 'View material details',
    },
    {
      label: 'Inspection Lots',
      href: `/inspection-lots?batch=${batchNumber}`,
      icon: 'ri-file-search-line',
      description: 'View quality inspections',
    },
    {
      label: 'Expiry Management',
      href: `/expiry-management?batch=${batchNumber}`,
      icon: 'ri-time-line',
      description: 'Manage expiry',
    },
    {
      label: 'ISO Documents',
      href: `/document-center?batch=${batchNumber}`,
      icon: 'ri-file-text-line',
      description: 'View batch certificates',
    },
    {
      label: 'NCR Management',
      href: `/ncr-management?batch=${batchNumber}`,
      icon: 'ri-alert-line',
      description: 'Report batch issues',
    },
  ]
}

/**
 * Get related module links for Shipment Tracking
 */
export function getShipmentTrackingLinks(trackingNumber: string, soNumber?: string): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'Proof of Delivery',
      href: `/pod?tracking=${trackingNumber}`,
      icon: 'ri-file-check-line',
      description: 'View POD',
    },
    {
      label: 'Carrier Management',
      href: `/carriers?tracking=${trackingNumber}`,
      icon: 'ri-truck-line',
      description: 'View carrier details',
    },
    {
      label: 'Route Optimization',
      href: `/routes?tracking=${trackingNumber}`,
      icon: 'ri-route-line',
      description: 'View route details',
    },
    {
      label: 'Incident Report',
      href: `/incident-report?tracking=${trackingNumber}`,
      icon: 'ri-error-warning-line',
      description: 'Report incidents',
    },
  ]

  if (soNumber) {
    links.unshift({
      label: 'Sales Order',
      href: `/sales-orders?so=${soNumber}`,
      icon: 'ri-shopping-cart-2-line',
      description: 'View sales order',
    })
    links.push({
      label: 'NCR Management',
      href: `/ncr-management?so=${soNumber}`,
      icon: 'ri-alert-line',
      description: 'Report delivery issues',
    })
  }

  return links
}

/**
 * Get related module links for Shipments (alias for getShipmentTrackingLinks)
 */
export function getShipmentLinks(trackingNumber: string, soNumber?: string): ModuleLink[] {
  return getShipmentTrackingLinks(trackingNumber, soNumber)
}

/**
 * Get generic module links for Transportation (dashboard-level; no specific shipment context).
 *
 * Use this on overview pages where you don't have a tracking number yet.
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

/**
 * Get ISO IMS related module links
 */
export function getISOIMSLinks(context?: {
  ncrId?: string
  capaId?: string
  auditId?: string
  documentId?: string
  materialNumber?: string
  locationCode?: string
  customerNumber?: string
  soNumber?: string
  poNumber?: string
}): ModuleLink[] {
  const links: ModuleLink[] = []

  // Core ISO IMS modules
  links.push({
    label: 'ISO IMS Dashboard',
    href: '/iso-ims',
    icon: 'ri-dashboard-3-line',
    description: 'Compliance overview',
  })

  if (context?.ncrId) {
    links.push({
      label: 'NCR Details',
      href: `/ncr-management?ncr=${context.ncrId}`,
      icon: 'ri-alert-line',
      description: 'View NCR details',
    })
    links.push({
      label: 'Create CAPA',
      href: `/capa-management?ncr=${context.ncrId}`,
      icon: 'ri-tools-line',
      description: 'Create CAPA from NCR',
    })
  }

  if (context?.capaId) {
    links.push({
      label: 'CAPA Details',
      href: `/capa-management?capa=${context.capaId}`,
      icon: 'ri-tools-line',
      description: 'View CAPA details',
    })
    links.push({
      label: 'My CAPA Workspace',
      href: `/my-capa-workspace?capa=${context.capaId}`,
      icon: 'ri-briefcase-line',
      description: 'Work on CAPA',
    })
  }

  if (context?.auditId) {
    links.push({
      label: 'Audit Details',
      href: `/audit-management?audit=${context.auditId}`,
      icon: 'ri-file-search-line',
      description: 'View audit details',
    })
  }

  if (context?.documentId) {
    links.push({
      label: 'Document Center',
      href: `/document-center?document=${context.documentId}`,
      icon: 'ri-file-text-line',
      description: 'View document',
    })
  }

  // Cross-module links
  if (context?.materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${context.materialNumber}`,
      icon: 'ri-box-line',
      description: 'View material details',
    })
    links.push({
      label: 'Stock Overview',
      href: `/inventory?material=${context.materialNumber}`,
      icon: 'ri-stack-line',
      description: 'View stock levels',
    })
  }

  if (context?.locationCode) {
    links.push({
      label: 'Storage Location',
      href: `/storage-locations?location=${context.locationCode}`,
      icon: 'ri-map-pin-line',
      description: 'View storage location',
    })
    links.push({
      label: 'Inventory',
      href: `/inventory?location=${context.locationCode}`,
      icon: 'ri-stack-line',
      description: 'View inventory',
    })
  }

  if (context?.customerNumber) {
    links.push({
      label: 'Customer Master',
      href: `/customers?customer=${context.customerNumber}`,
      icon: 'ri-user-line',
      description: 'View customer details',
    })
    links.push({
      label: 'Customer Dashboard',
      href: `/customer-dashboard?customer=${context.customerNumber}`,
      icon: 'ri-dashboard-line',
      description: 'View customer dashboard',
    })
  }

  if (context?.soNumber) {
    links.push({
      label: 'Sales Order',
      href: `/sales-orders?so=${context.soNumber}`,
      icon: 'ri-shopping-cart-line',
      description: 'View sales order',
    })
    links.push({
      label: 'Shipment Tracking',
      href: `/tracking?so=${context.soNumber}`,
      icon: 'ri-map-pin-line',
      description: 'Track shipment',
    })
  }

  if (context?.poNumber) {
    links.push({
      label: 'Purchase Order',
      href: `/orders?po=${context.poNumber}`,
      icon: 'ri-shopping-bag-line',
      description: 'View purchase order',
    })
    links.push({
      label: 'Goods Receipt',
      href: `/goods-receipt?po=${context.poNumber}`,
      icon: 'ri-inbox-line',
      description: 'View goods receipt',
    })
  }

  // Always show core ISO modules
  links.push(
    {
      label: 'CAPA Management',
      href: '/capa-management',
      icon: 'ri-tools-line',
      description: 'Corrective actions',
    },
    {
      label: 'NCR Management',
      href: '/ncr-management',
      icon: 'ri-alert-line',
      description: 'Non-conformance reports',
    },
    {
      label: 'Audit Management',
      href: '/audit-management',
      icon: 'ri-file-search-line',
      description: 'Audits & inspections',
    },
    {
      label: 'Document Center',
      href: '/document-center',
      icon: 'ri-file-text-line',
      description: 'ISO documents',
    },
    {
      label: 'Risk Management',
      href: '/risk-management',
      icon: 'ri-shield-cross-line',
      description: 'Risk register',
    },
    {
      label: 'Training Management',
      href: '/training-management',
      icon: 'ri-graduation-cap-line',
      description: 'Training & competence',
    },
    {
      label: 'My Tasks',
      href: '/my-tasks',
      icon: 'ri-task-line',
      description: 'Personal tasks',
    },
    {
      label: 'Approvals',
      href: '/approvals',
      icon: 'ri-check-double-line',
      description: 'Approval queue',
    }
  )

  return links
}

/**
 * Get NCR related module links
 */
export function getNCRLinks(ncrId: string, context?: {
  materialNumber?: string
  soNumber?: string
  poNumber?: string
  locationCode?: string
  visionAnalysisId?: string
}): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'NCR Details',
      href: `/ncr-management?ncr=${ncrId}`,
      icon: 'ri-alert-line',
      description: 'View NCR details',
    },
    {
      label: 'Create CAPA',
      href: `/capa-management?ncr=${ncrId}`,
      icon: 'ri-tools-line',
      description: 'Create CAPA from NCR',
    },
    {
      label: 'ISO IMS Dashboard',
      href: '/iso-ims',
      icon: 'ri-dashboard-3-line',
      description: 'Compliance overview',
    },
  ]

  if (context?.materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${context.materialNumber}`,
      icon: 'ri-box-line',
      description: 'View material',
    })
    links.push({
      label: 'Inspection Lots',
      href: `/inspection-lots?material=${context.materialNumber}`,
      icon: 'ri-file-search-line',
      description: 'View inspections',
    })
  }

  if (context?.soNumber) {
    links.push({
      label: 'Sales Order',
      href: `/sales-orders?so=${context.soNumber}`,
      icon: 'ri-shopping-cart-line',
      description: 'View sales order',
    })
  }

  if (context?.poNumber) {
    links.push({
      label: 'Purchase Order',
      href: `/orders?po=${context.poNumber}`,
      icon: 'ri-shopping-bag-line',
      description: 'View purchase order',
    })
  }

  if (context?.locationCode) {
    links.push({
      label: 'Storage Location',
      href: `/storage-locations?location=${context.locationCode}`,
      icon: 'ri-map-pin-line',
      description: 'View location',
    })
    links.push({
      label: 'Audit Management',
      href: `/audit-management?location=${context.locationCode}`,
      icon: 'ri-file-search-line',
      description: 'View location audits',
    })
  }

  // Vision Analysis link if available
  if (context?.visionAnalysisId) {
    links.push({
      label: 'Vision Analysis',
      href: `/ai-vision/history?analysis=${context.visionAnalysisId}`,
      icon: 'ri-eye-line',
      description: 'View vision analysis that created this NCR',
    })
  }

  return links
}

/**
 * Get CAPA related module links
 */
export function getCAPALinks(capaId: string, context?: {
  visionAnalysisId?: string
  ncrId?: string
  materialNumber?: string
  soNumber?: string
  locationCode?: string
  customerNumber?: string
  supplierNumber?: string
}): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'CAPA Details',
      href: `/capa-management?capa=${capaId}`,
      icon: 'ri-tools-line',
      description: 'View CAPA details',
    },
    {
      label: 'My CAPA Workspace',
      href: `/my-capa-workspace?capa=${capaId}`,
      icon: 'ri-briefcase-line',
      description: 'Work on CAPA',
    },
    {
      label: 'ISO IMS Dashboard',
      href: '/iso-ims',
      icon: 'ri-dashboard-3-line',
      description: 'Compliance overview',
    },
  ]

  if (context?.ncrId) {
    links.push({
      label: 'Related NCR',
      href: `/ncr-management?ncr=${context.ncrId}`,
      icon: 'ri-alert-line',
      description: 'View source NCR',
    })
  }

  if (context?.materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${context.materialNumber}`,
      icon: 'ri-box-line',
      description: 'View material',
    })
  }

  if (context?.soNumber) {
    links.push({
      label: 'Sales Order',
      href: `/sales-orders?so=${context.soNumber}`,
      icon: 'ri-shopping-cart-line',
      description: 'View sales order',
    })
  }

  if (context?.locationCode) {
    links.push({
      label: 'Storage Location',
      href: `/storage-locations?location=${context.locationCode}`,
      icon: 'ri-map-pin-line',
      description: 'View location',
    })
  }

  if (context?.customerNumber) {
    links.push({
      label: 'Customer Master',
      href: `/customers?customer=${context.customerNumber}`,
      icon: 'ri-user-line',
      description: 'View customer details',
    })
    links.push({
      label: 'Customer Dashboard',
      href: `/customer-dashboard?customer=${context.customerNumber}`,
      icon: 'ri-dashboard-line',
      description: 'View customer dashboard',
    })
  }

  if (context?.supplierNumber) {
    links.push({
      label: 'Supplier Master',
      href: `/vendors?supplier=${context.supplierNumber}`,
      icon: 'ri-building-line',
      description: 'View supplier details',
    })
    links.push({
      label: 'Purchase Orders',
      href: `/orders?supplier=${context.supplierNumber}`,
      icon: 'ri-shopping-bag-line',
      description: 'View supplier orders',
    })
  }

  return links
}

/**
 * Get Customer related module links (enhanced with ISO IMS)
 */
export function getCustomerLinks(customerNumber: string): ModuleLink[] {
  return [
    {
      label: 'Customer Dashboard',
      href: `/customer-dashboard?customer=${customerNumber}`,
      icon: 'ri-dashboard-line',
      description: 'View customer dashboard',
    },
    {
      label: 'Sales Orders',
      href: `/sales-orders?customer=${customerNumber}`,
      icon: 'ri-shopping-cart-line',
      description: 'View customer orders',
    },
    {
      label: 'Shipment Tracking',
      href: `/tracking?customer=${customerNumber}`,
      icon: 'ri-map-pin-line',
      description: 'Track shipments',
    },
    {
      label: 'NCR Management',
      href: `/ncr-management?customer=${customerNumber}`,
      icon: 'ri-alert-line',
      description: 'View customer NCRs',
    },
    {
      label: 'CAPA Management',
      href: `/capa-management?customer=${customerNumber}`,
      icon: 'ri-tools-line',
      description: 'View customer CAPAs',
    },
    {
      label: 'ISO Documents',
      href: `/document-center?customer=${customerNumber}`,
      icon: 'ri-file-text-line',
      description: 'View customer documents',
    },
    {
      label: 'Risk Management',
      href: `/risk-management?customer=${customerNumber}`,
      icon: 'ri-shield-cross-line',
      description: 'View customer risks',
    },
  ]
}

/**
 * Get workflow progression links
 */
export function getWorkflowLinks(currentModule: string, id: string): ModuleLink[] {
  const workflows: Record<string, ModuleLink[]> = {
    'purchase-orders': [
      {
        label: 'Approve PO',
        href: `/purchase-orders/${id}/approve`,
        icon: 'ri-check-line',
        description: 'Approve this purchase order',
      },
      {
        label: 'Create Goods Receipt',
        href: `/goods-receipt?po=${id}`,
        icon: 'ri-inbox-line',
        description: 'Receive goods',
      },
      {
        label: 'Create NCR',
        href: `/ncr-management?po=${id}`,
        icon: 'ri-alert-line',
        description: 'Report non-conformance',
      },
    ],
    'sales-orders': [
      {
        label: 'Release for Picking',
        href: `/pick-release?so=${id}`,
        icon: 'ri-play-circle-line',
        description: 'Release order for picking',
      },
      {
        label: 'Create Shipment',
        href: `/shipments?so=${id}`,
        icon: 'ri-ship-line',
        description: 'Create shipment',
      },
      {
        label: 'Create NCR',
        href: `/ncr-management?so=${id}`,
        icon: 'ri-alert-line',
        description: 'Report delivery issues',
      },
    ],
    'ncr-management': [
      {
        label: 'Create CAPA',
        href: `/capa-management?ncr=${id}`,
        icon: 'ri-tools-line',
        description: 'Create CAPA from NCR',
      },
      {
        label: 'Link to Material',
        href: `/materials?ncr=${id}`,
        icon: 'ri-box-line',
        description: 'Link to material',
      },
      {
        label: 'Link to Order',
        href: `/sales-orders?ncr=${id}`,
        icon: 'ri-shopping-cart-line',
        description: 'Link to order',
      },
    ],
    'capa-management': [
      {
        label: 'My CAPA Workspace',
        href: `/my-capa-workspace?capa=${id}`,
        icon: 'ri-briefcase-line',
        description: 'Work on CAPA',
      },
      {
        label: 'Submit for Approval',
        href: `/approvals?capa=${id}`,
        icon: 'ri-check-double-line',
        description: 'Submit for approval',
      },
    ],
    'picking': [
      {
        label: 'Complete Picking',
        href: `/picking/${id}/complete`,
        icon: 'ri-check-double-line',
        description: 'Mark picking complete',
      },
      {
        label: 'Create Shipment',
        href: `/shipments?picking=${id}`,
        icon: 'ri-ship-line',
        description: 'Create shipment',
      },
    ],
    'shipments': [
      {
        label: 'Track Shipment',
        href: `/tracking?shipment=${id}`,
        icon: 'ri-map-pin-line',
        description: 'Track shipment',
      },
      {
        label: 'Create POD',
        href: `/pod?shipment=${id}`,
        icon: 'ri-file-check-line',
        description: 'Create proof of delivery',
      },
      {
        label: 'Report Incident',
        href: `/incident-report?shipment=${id}`,
        icon: 'ri-error-warning-line',
        description: 'Report incident',
      },
    ],
  }

  return workflows[currentModule] || []
}

/**
 * Get QHSE Incident related module links
 */
export function getQHSEIncidentLinks(incidentId: string, context?: {
  materialNumber?: string
  locationCode?: string
  employeeId?: string
  ncrId?: string
}): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'Incident Details',
      href: `/qhse/incidents/${incidentId}`,
      icon: 'ri-error-warning-line',
      description: 'View incident details',
    },
    {
      label: 'QHSE Dashboard',
      href: '/qhse/dashboard',
      icon: 'ri-dashboard-3-line',
      description: 'QHSE overview',
    },
    {
      label: 'Inspections',
      href: '/qhse/inspections',
      icon: 'ri-clipboard-line',
      description: 'Related inspections',
    },
    {
      label: 'Training',
      href: '/qhse/training',
      icon: 'ri-graduation-cap-line',
      description: 'Training records',
    },
  ]

  if (context?.ncrId) {
    links.push({
      label: 'NCR Management',
      href: `/ncr-management?ncr=${context.ncrId}`,
      icon: 'ri-alert-line',
      description: 'Related NCR',
    })
  }

  if (context?.materialNumber) {
    links.push({
      label: 'Material Master',
      href: `/materials?material=${context.materialNumber}`,
      icon: 'ri-box-line',
      description: 'View material',
    })
  }

  if (context?.locationCode) {
    links.push({
      label: 'Storage Location',
      href: `/storage-locations?location=${context.locationCode}`,
      icon: 'ri-map-pin-line',
      description: 'View location',
    })
  }

  if (context?.employeeId) {
    links.push({
      label: 'Employee Record',
      href: `/hr/employees/${context.employeeId}`,
      icon: 'ri-user-line',
      description: 'View employee',
    })
  }

  return links
}

/**
 * Get QHSE Inspection related module links
 */
export function getQHSEInspectionLinks(inspectionId: string, context?: {
  materialNumber?: string
  locationCode?: string
  ncrId?: string
}): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'Inspection Details',
      href: `/qhse/inspections/${inspectionId}`,
      icon: 'ri-clipboard-line',
      description: 'View inspection details',
    },
    {
      label: 'QHSE Calendar',
      href: '/qhse/calendar',
      icon: 'ri-calendar-line',
      description: 'View in calendar',
    },
    {
      label: 'Checklist Builder',
      href: '/qhse/inspections?tab=checklists',
      icon: 'ri-file-list-3-line',
      description: 'Manage checklists',
    },
    {
      label: 'QHSE Dashboard',
      href: '/qhse/dashboard',
      icon: 'ri-dashboard-3-line',
      description: 'QHSE overview',
    },
  ]

  if (context?.ncrId) {
    links.push({
      label: 'NCR Management',
      href: `/ncr-management?ncr=${context.ncrId}`,
      icon: 'ri-alert-line',
      description: 'Related NCR',
    })
  }

  return links
}

/**
 * Get QHSE Training related module links
 */
export function getQHSETrainingLinks(trainingId: string, context?: {
  employeeId?: string
  programId?: string
}): ModuleLink[] {
  const links: ModuleLink[] = [
    {
      label: 'Training Details',
      href: `/qhse/training/${trainingId}`,
      icon: 'ri-graduation-cap-line',
      description: 'View training details',
    },
    {
      label: 'Training Programs',
      href: '/qhse/training?tab=programs',
      icon: 'ri-book-open-line',
      description: 'All programs',
    },
    {
      label: 'Compliance Overview',
      href: '/qhse/training?tab=compliance',
      icon: 'ri-shield-check-line',
      description: 'Compliance status',
    },
    {
      label: 'HR Module',
      href: '/hr/employees',
      icon: 'ri-user-line',
      description: 'Employee records',
    },
  ]

  if (context?.employeeId) {
    links.push({
      label: 'Employee Record',
      href: `/hr/employees/${context.employeeId}`,
      icon: 'ri-user-line',
      description: 'View employee',
    })
  }

  return links
}

/**
 * Navigation helper hook
 */
export function useModuleNavigation() {
  const router = useRouter()

  const navigateToModule = (href: string, params?: Record<string, string>) => {
    const url = new URL(href, window.location.origin)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    router.push(url.pathname + url.search)
  }

  const navigateWithContext = (module: string, id: string, context?: Record<string, string>) => {
    const baseUrl = `/${module}`
    const params = { ...context, id }
    navigateToModule(baseUrl, params)
  }

  return {
    navigateToModule,
    navigateWithContext,
    router,
  }
}

/**
 * Get breadcrumb trail for a module
 */
export function getBreadcrumbs(pathname: string, params?: Record<string, string>): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Dashboard', href: '/' },
  ]

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    breadcrumbs.push({
      label,
      href: currentPath + (params ? '?' + new URLSearchParams(params).toString() : ''),
    })
  })

  return breadcrumbs
}
