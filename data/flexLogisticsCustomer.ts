/**
 * Flex Logistics - BlueDXP's First Customer
 * Complete customer data with logo and branding
 */

import { Customer } from '@/types/tenant'

export const flexLogisticsCustomer: Customer = {
  id: 'customer-flex-001',
  tenantId: 'tenant-1',
  customerNumber: 'FLEX-001',
  customerName: 'Flex Logistics',
  type: '3PL_CLIENT',
  serviceTier: 'PLATINUM',
  status: 'ACTIVE',
  
  // Logo & Branding
  logo: {
    url: '/customers/flex-logo.png',
    alt: 'Flex Logistics - Empowering Logistics',
    width: 200,
    height: 60,
    variant: 'full',
  },
  brandColor: '#FF6600',
  secondaryColor: '#FF8533',
  
  // Contract Information
  contractStartDate: new Date('2024-01-01'),
  contractEndDate: new Date('2025-12-31'),
  contractValue: 5000000,
  contractCurrency: 'SAR',
  renewalDate: new Date('2025-12-31'),
  autoRenew: true,
  
  // Financial Information
  monthlyRevenue: 416667,
  totalRevenue: 5000000,
  averageOrderValue: 15000,
  paymentTerms: 'NET_30',
  creditLimit: 500000,
  outstandingBalance: 125000,
  
  // Service Information
  allocatedWarehouses: ['warehouse-001', 'warehouse-002'],
  dedicatedSpace: [
    {
      warehouseId: 'warehouse-001',
      warehouseName: 'Riyadh Main Warehouse',
      allocatedArea: 5000,
      allocatedPalletPositions: 2000,
      allocatedVolume: 10000,
      utilization: 85,
      reservedSpace: 4250,
      availableSpace: 750,
      allocationType: 'DEDICATED',
      startDate: new Date('2024-01-01'),
    },
  ],
  serviceLevel: {
    tier: 'PLATINUM',
    features: [
      'Dedicated Account Manager',
      '24/7 Support',
      'Priority Processing',
      'Custom Reporting',
      'API Access',
      'White-Label Portal',
    ],
    slaComplianceTarget: 98,
    priorityLevel: 1,
    pricingMultiplier: 1.2,
    dedicatedResources: true,
    accountManager: 'account-manager-001',
  },
  slaTargets: [
    {
      id: 'sla-001',
      metric: 'order_fulfillment_time',
      target: 4,
      unit: 'hours',
      warningThreshold: 5,
      criticalThreshold: 6,
      isActive: true,
    },
    {
      id: 'sla-002',
      metric: 'receiving_time',
      target: 2,
      unit: 'hours',
      warningThreshold: 3,
      criticalThreshold: 4,
      isActive: true,
    },
  ],
  
  // Contact Information
  primaryContact: {
    id: 'contact-001',
    name: 'Bassam Albayaty',
    email: 'b.albayaty@scsflex.com',
    phone: '+966501234567',
    role: 'Operations Manager',
    isPrimary: true,
  },
  billingContact: {
    id: 'contact-002',
    name: 'Finance Department',
    email: 'finance@scsflex.com',
    phone: '+966501234568',
    role: 'Billing Contact',
    isPrimary: false,
  },
  operationalContacts: [
    {
      id: 'contact-003',
      name: 'Warehouse Manager',
      email: 'warehouse@scsflex.com',
      phone: '+966501234569',
      role: 'Warehouse Operations',
      isPrimary: false,
    },
  ],
  
  // Business Intelligence
  metrics: {
    totalOrders: 1250,
    totalRevenue: 5000000,
    averageOrderValue: 15000,
    orderFulfillmentRate: 97.5,
    slaComplianceRate: 98.2,
    inventoryValue: 2500000,
    spaceUtilization: 85,
    orderVolumeTrend: 'INCREASING',
    revenueTrend: 'INCREASING',
    lastOrderDate: new Date(),
    daysSinceLastOrder: 0,
  },
  healthScore: 95,
  churnRisk: 'LOW',
  satisfactionScore: 92,
  
  // Settings
  settings: {
    allowCustomerPortal: true,
    allowApiAccess: true,
    defaultWarehouse: 'warehouse-001',
    defaultCarrier: 'carrier-001',
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
    },
    reportFrequency: 'WEEKLY',
    customFields: {
      industry: 'Logistics',
      region: 'Middle East',
      specialRequirements: 'Temperature-controlled storage',
    },
  },
  integrations: [
    {
      id: 'integration-001',
      type: 'ERP',
      system: 'ERPNext',
      status: 'ACTIVE',
      lastSync: new Date(),
      configuration: {
        apiUrl: 'https://erp.scsflex.com',
        syncFrequency: 'REAL_TIME',
      },
    },
  ],
  
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system',
}

