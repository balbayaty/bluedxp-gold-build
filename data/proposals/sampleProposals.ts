/**
 * Sample Proposals Data
 * Mock proposals for demonstration and testing
 */

import type { Proposal } from '@/types/proposals'

export const SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: 'prop-001',
    proposalNumber: 'PROP-2024-001',
    type: 'QUOTE_PROPOSAL',
    title: 'Warehousing Services - Q4 2024',
    description: 'Comprehensive warehousing solution for Saudi Aramco',
    executiveSummary: 'Our warehousing solution provides secure, efficient storage with real-time inventory visibility and 99.9% uptime guarantee.',
    customerId: 'cust-001',
    customerName: 'Saudi Aramco',
    customerEmail: 'procurement@aramco.sa',
    status: 'SENT',
    version: 1,
    sections: [
      {
        id: 'sec-001',
        type: 'HEADER',
        title: 'Cover Page',
        content: 'Professional Warehousing Services Proposal',
        order: 0,
        visible: true,
      },
      {
        id: 'sec-002',
        type: 'TEXT',
        title: 'Executive Summary',
        content: 'Our comprehensive warehousing solution provides secure, efficient, and scalable storage services tailored to your business needs.',
        order: 1,
        visible: true,
      },
      {
        id: 'sec-003',
        type: 'PRICING',
        title: 'Pricing Structure',
        content: 'Competitive pricing based on storage volume and services required.',
        data: {
          items: [
            { name: 'Storage (per pallet/month)', quantity: 100, unitPrice: 50, total: 5000 },
            { name: 'Handling (per pallet)', quantity: 200, unitPrice: 10, total: 2000 },
            { name: 'Pick & Pack (per order)', quantity: 500, unitPrice: 5, total: 2500 },
          ],
          subtotal: 9500,
          tax: 1425,
          total: 10925,
        },
        order: 2,
        visible: true,
      },
    ],
    totalAmount: 10925,
    currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    recipients: [
      {
        id: 'rec-001',
        name: 'Ahmed Al-Saud',
        email: 'ahmed.alsaud@aramco.sa',
        role: 'Procurement Manager',
        company: 'Saudi Aramco',
        viewed: true,
        viewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        accepted: false,
      },
    ],
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    viewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-001',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    branding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  },
  {
    id: 'prop-002',
    proposalNumber: 'PROP-2024-002',
    type: 'QUOTE_PROPOSAL',
    title: 'Cross-Border Logistics Package',
    description: 'Multimodal logistics solution for P&G Saudi',
    executiveSummary: 'Integrated cross-border logistics solution combining road, rail, and customs clearance for seamless operations.',
    customerId: 'cust-002',
    customerName: 'P&G Saudi',
    customerEmail: 'logistics@pg.sa',
    status: 'ACCEPTED',
    version: 1,
    sections: [
      {
        id: 'sec-004',
        type: 'HEADER',
        title: 'Cover Page',
        content: 'Cross-Border Logistics Package',
        order: 0,
        visible: true,
      },
      {
        id: 'sec-005',
        type: 'TEXT',
        title: 'Executive Summary',
        content: 'Our integrated solution provides seamless cross-border logistics with customs clearance and multimodal transport.',
        order: 1,
        visible: true,
      },
      {
        id: 'sec-006',
        type: 'PRICING',
        title: 'Pricing Structure',
        content: 'Comprehensive pricing for integrated logistics solution.',
        data: {
          items: [
            { name: 'Transportation (per shipment)', quantity: 50, unitPrice: 500, total: 25000 },
            { name: 'Customs Clearance (per shipment)', quantity: 50, unitPrice: 200, total: 10000 },
            { name: 'Documentation', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
          subtotal: 40000,
          tax: 6000,
          total: 46000,
        },
        order: 2,
        visible: true,
      },
    ],
    totalAmount: 46000,
    currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    recipients: [
      {
        id: 'rec-002',
        name: 'Sarah Al-Mansouri',
        email: 'sarah.almansouri@pg.sa',
        role: 'Supply Chain Director',
        company: 'P&G Saudi',
        viewed: true,
        viewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        accepted: true,
        acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    viewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'user-001',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    branding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  },
  {
    id: 'prop-003',
    proposalNumber: 'PROP-2024-003',
    type: 'QUOTE_PROPOSAL',
    title: 'Complete Supply Chain Solution',
    description: 'End-to-end supply chain management for Almarai',
    executiveSummary: 'Comprehensive supply chain solution integrating warehousing, transportation, and value-added services.',
    customerId: 'cust-003',
    customerName: 'Almarai',
    customerEmail: 'supplychain@almarai.com',
    status: 'PENDING_REVIEW',
    version: 1,
    sections: [
      {
        id: 'sec-007',
        type: 'HEADER',
        title: 'Cover Page',
        content: 'Complete Supply Chain Solution',
        order: 0,
        visible: true,
      },
      {
        id: 'sec-008',
        type: 'TEXT',
        title: 'Executive Summary',
        content: 'Our comprehensive solution integrates all aspects of your supply chain for maximum efficiency and cost optimization.',
        order: 1,
        visible: true,
      },
      {
        id: 'sec-009',
        type: 'PRICING',
        title: 'Pricing Structure',
        content: 'Integrated pricing for complete supply chain solution.',
        data: {
          items: [
            { name: 'Warehousing (monthly)', quantity: 1, unitPrice: 50000, total: 50000 },
            { name: 'Transportation (monthly)', quantity: 1, unitPrice: 30000, total: 30000 },
            { name: 'Value-Added Services', quantity: 1, unitPrice: 20000, total: 20000 },
          ],
          subtotal: 100000,
          tax: 15000,
          total: 115000,
        },
        order: 2,
        visible: true,
      },
    ],
    totalAmount: 115000,
    currency: 'SAR',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    recipients: [
      {
        id: 'rec-003',
        name: 'Mohammed Al-Rashid',
        email: 'mohammed.alrashid@almarai.com',
        role: 'VP Supply Chain',
        company: 'Almarai',
        viewed: false,
        accepted: false,
      },
    ],
    createdBy: 'user-001',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    branding: {
      companyName: 'BlueDXP',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  },
]

// Helper functions
export function getSampleProposalById(id: string): Proposal | undefined {
  return SAMPLE_PROPOSALS.find(p => p.id === id)
}

export function getSampleProposalsByStatus(status: Proposal['status']): Proposal[] {
  return SAMPLE_PROPOSALS.filter(p => p.status === status)
}

export function getSampleProposalsByCustomer(customerId: string): Proposal[] {
  return SAMPLE_PROPOSALS.filter(p => p.customerId === customerId)
}


