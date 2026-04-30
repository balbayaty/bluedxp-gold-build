// Processed Inbound Data - Uses enhanced data cleaner and importer
// This is the main entry point for processed inbound/outbound data

import { rawInboundData } from './rawInboundData'
import { processInboundData, groupASNData } from './inboundDataImporter'
import { CustomerSLA } from '@/types/asn'
import { fullLifecycleMockData } from './fullLifecycleMockData'

// Load SLAs from localStorage if available
function loadSLAs(): CustomerSLA[] {
  if (typeof window === 'undefined') return []
  
  try {
    const saved = localStorage.getItem('customer-slas')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading SLAs:', error)
  }
  
  return []
}

// Process the raw inbound data with SLA compliance
export function getProcessedInboundData(): ReturnType<typeof groupASNData> {
  const slas = loadSLAs()
  const processedData = processInboundData(rawInboundData, slas)
  const grouped = groupASNData(processedData)
  
  // Add full lifecycle mock data for visualization
  grouped.inbound = [
    fullLifecycleMockData.inbound.completed,
    fullLifecycleMockData.inbound.inProgress,
    ...grouped.inbound,
  ]
  
  grouped.outbound = [
    fullLifecycleMockData.outbound.completed,
    fullLifecycleMockData.outbound.inProgress,
    ...grouped.outbound,
  ]
  
  grouped.all = [...grouped.inbound, ...grouped.outbound]
  
  return grouped
}

// Export processed data
export const processedInboundData = getProcessedInboundData()

// Export individual groups for convenience
export const allASNs = processedInboundData.all
export const inboundASNs = processedInboundData.inbound
export const outboundASNs = processedInboundData.outbound
export const asnDocuments = processedInboundData.asns
export const grDocuments = processedInboundData.grs
export const orderDocuments = processedInboundData.orders
export const returnDocuments = processedInboundData.returns

