/**
 * Module Registration
 * Registers all modules with the registry
 */

import { registerModule } from './registry'
import { wmsModule } from './wms'
import { isoImsModule } from './iso-ims'
import { tmsModule } from './tms'

import { proposalsRfqModule } from './proposals-rfq'
import { maasModule } from './maas'
import { complianceModule } from './compliance'
import { tradeComplianceModule } from './trade-compliance'
import { processLifecycleModule } from './process-lifecycle'
import { qhseModule } from './qhse'
import { facilityManagementModule } from './facility-management'
import { marketplaceModule } from './marketplace'
import { warehouseNetworkModule } from './warehouse-network'
import { brandMessagingModule } from './brand-messaging'
import { truthEngineModule } from './truth-engine'
import { hrModule } from './hr'
import { financeModule } from './finance'
import { procurementModule } from './procurement'
import { crmModule } from './crm'
import { projectManagementModule } from './project-management'
import { businessIntelligenceModule } from './business-intelligence'
import { hazalyzeModule } from './hazalyze'
import { iotModule } from './iot'
import { digitalSignatureModule } from './digital-signature'
import { pulseModule } from './pulse'
import { exportHouseModule } from './export-house'
import { dmarcMonitoringModule } from './dmarc-monitoring'
import { opcuaMonitoringModule } from './opc-ua-monitoring'
import { ictHardwareEcosystemModule } from './ict-hardware-ecosystem'
import { externalIntegrationsModule } from './external-integrations'
import { msdsModule } from './msds'
import { customsModule } from './customs'
import { etwModule } from './etw'
import { emailModule } from './email'
import { intelligenceAnalyticsModule } from './intelligence-analytics'
import { workspaceModule } from './workspace'
import { systemHealthModule } from './system-health'
import { marketDataModule } from './market-data'
import { coreModule } from './core'


// Prevent repeated registration/bootstrapping in dev/hot-reload.
const globalForModules = globalThis as unknown as {
  __bluedxpModulesRegistered?: boolean
  __bluedxpModulesBootstrapped?: boolean
}

if (!globalForModules.__bluedxpModulesRegistered) {
  globalForModules.__bluedxpModulesRegistered = true

  // Register all modules
  registerModule(wmsModule)
  registerModule(isoImsModule)
  registerModule(tmsModule)
  registerModule(proposalsRfqModule)
  registerModule(maasModule)
  registerModule(complianceModule)
  registerModule(tradeComplianceModule)
  registerModule(processLifecycleModule)
  registerModule(qhseModule)
  registerModule(facilityManagementModule)
  registerModule(marketplaceModule)
  registerModule(warehouseNetworkModule)
  registerModule(brandMessagingModule)
  registerModule(truthEngineModule)
  registerModule(hrModule)
  registerModule(financeModule)
  registerModule(crmModule)
  registerModule(procurementModule)
  registerModule(projectManagementModule)
  registerModule(businessIntelligenceModule)
  registerModule(hazalyzeModule)
  registerModule(iotModule)
  registerModule(digitalSignatureModule)
  registerModule(pulseModule)
  registerModule(exportHouseModule)
  registerModule(dmarcMonitoringModule)
  registerModule(opcuaMonitoringModule)
  registerModule(ictHardwareEcosystemModule)
  registerModule(externalIntegrationsModule)
  registerModule(msdsModule)
  registerModule(customsModule)
  registerModule(etwModule)
  registerModule(emailModule)
  registerModule(intelligenceAnalyticsModule)
  registerModule(workspaceModule)
  registerModule(systemHealthModule)
  registerModule(marketDataModule)
  registerModule(coreModule)
}

function getBootstrapTenantId(): string {
  return process.env.BOOTSTRAP_TENANT_ID || (process.env.NODE_ENV === 'production' ? '' : 'tenant-1')
}

// Initialize all modules asynchronously and non-blocking (server-side only)
if (typeof window === 'undefined') {
  if (globalForModules.__bluedxpModulesBootstrapped) {
    // already bootstrapped in this process
  } else {
    globalForModules.__bluedxpModulesBootstrapped = true

    // Use setImmediate to defer all initializations and avoid blocking server startup
    setImmediate(async () => {
      const bootstrapTenantId = getBootstrapTenantId()

      // Initialize compliance module if enabled
      if (complianceModule.enabled) {
        if (!bootstrapTenantId) {
          console.warn('Compliance module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
        } else {
          const { initializeComplianceModule } = await import('./compliance')
          initializeComplianceModule().catch(console.error)
        }
      }

      // Initialize brand messaging module if enabled
      if (brandMessagingModule.enabled) {
        const { initializeBrandMessagingModule } = await import('./brand-messaging')
        initializeBrandMessagingModule().catch(console.error)
      }

      // Initialize marketplace module if enabled
      if (marketplaceModule.enabled) {
        try {
          const { initializeMarketplaceModule } = await import('@/lib/services/marketplace/initialize')
          initializeMarketplaceModule()
        } catch (error) {
          console.error('Marketplace module initialization error:', error)
        }
      }

      // Initialize warehouse network module if enabled
      if (warehouseNetworkModule.enabled) {
        try {
          const { initializeWarehouseNetworkModule } = await import('@/lib/services/warehouse-network/initialize')
          initializeWarehouseNetworkModule()
        } catch (error) {
          console.error('Warehouse network module initialization error:', error)
        }
      }

      // Initialize Finance module if enabled
      if (financeModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Finance module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { unifiedFinanceService } = await import('@/lib/services/finance/integration/unifiedFinanceService')
            unifiedFinanceService.initialize(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('Finance module initialization error:', error)
        }
      }

      // Initialize Truth Engine if enabled
      if (truthEngineModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Truth engine initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeTruthEngine } = await import('@/lib/services/truth-engine/initialize')
            initializeTruthEngine({
              tenantId: bootstrapTenantId,
              enableRealTimeClaims: true,
              enableEcosystemIntegration: true,
            }).catch(console.error)
          }
        } catch (error) {
          console.error('Truth engine initialization error:', error)
        }
      }

      // Initialize ETW module if enabled
      if (etwModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('ETW module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeETWModule } = await import('./etw')
            initializeETWModule(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('ETW module initialization error:', error)
        }
      }

      // Initialize Hazalyze module if enabled
      if (hazalyzeModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Hazalyze module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeHazalyzeModule } = await import('./hazalyze.server')
            initializeHazalyzeModule().catch(console.error)
          }
        } catch (error) {
          console.error('Hazalyze module initialization error:', error)
        }
      }

      // Initialize Transportation module if enabled
      if (tmsModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Transportation module bootstrap skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeTransportationModule } = await import('@/lib/services/transportation/initialize')
            initializeTransportationModule(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('Transportation module initialization error:', error)
        }
      }

      // Initialize Digital Signature module if enabled
      if (digitalSignatureModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Digital Signature module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeDigitalSignatureModule } = await import('./digital-signature')
            initializeDigitalSignatureModule(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('Digital Signature module initialization error:', error)
        }
      }

      // Initialize Pulse module if enabled
      if (pulseModule.enabled) {
        try {
          // Dynamic import to avoid issues if event-store not available
          Promise.resolve().then(async () => {
            const { initializePulseEventHandlers } = await import('@/lib/services/pulse/pulseEventHandlers')
            initializePulseEventHandlers()
          }).catch((error) => {
            console.error('Pulse module initialization error:', error)
          })
        } catch (error) {
          console.error('Pulse module initialization error:', error)
        }
      }

      // Initialize Proposals & RFQ module if enabled
      if (proposalsRfqModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Proposals & RFQ module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeProposalsModule } = await import('@/lib/services/proposals/initialize')
            initializeProposalsModule(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('Proposals & RFQ module initialization error:', error)
        }
      }

      // Initialize Email Service module if enabled
      if (emailModule.enabled) {
        try {
          const { initializeEmailService } = await import('@/lib/services/email/initialize')
          initializeEmailService().catch(console.error)
        } catch (error) {
          console.error('Email Service module initialization error:', error)
        }
      }

      // Initialize Intelligence & Analytics module if enabled
      if (intelligenceAnalyticsModule.enabled) {
        try {
          if (!bootstrapTenantId) {
            console.warn('Intelligence & Analytics module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
          } else {
            const { initializeIntelligenceAnalyticsModule } = await import('@/lib/services/intelligence-analytics/initialize')
            initializeIntelligenceAnalyticsModule(bootstrapTenantId).catch(console.error)
          }
        } catch (error) {
          console.error('Intelligence & Analytics module initialization error:', error)
        }
      }

      // Initialize ISO IMS module if enabled
      if (isoImsModule.enabled) {
        try {
          const { initializeISOIMSModule } = await import('@/lib/services/iso-ims/initialize')
          initializeISOIMSModule(bootstrapTenantId || 'default').catch(console.error)
        } catch (error) {
          console.error('ISO IMS module initialization error:', error)
        }
      }
    })
  }
}

// Export for convenience
export { moduleRegistry, isModuleEnabled, enableModule, disableModule, getEnabledModules, getAllRoutes, getModule } from './registry'
export { wmsModule } from './wms'
export { isoImsModule } from './iso-ims'
export { tmsModule } from './tms'
export { proposalsRfqModule } from './proposals-rfq'
export { maasModule } from './maas'
export { complianceModule } from './compliance'
export { tradeComplianceModule } from './trade-compliance'
export { processLifecycleModule } from './process-lifecycle'
export { qhseModule } from './qhse'
export { facilityManagementModule } from './facility-management'
export { marketplaceModule } from './marketplace'
export { warehouseNetworkModule } from './warehouse-network'
export { etwModule, initializeETWModule } from './etw'
export { brandMessagingModule } from './brand-messaging'
export { truthEngineModule } from './truth-engine'
export { hrModule } from './hr'
export { financeModule } from './finance'
export { procurementModule } from './procurement'
export { crmModule } from './crm'
export { projectManagementModule } from './project-management'
export { businessIntelligenceModule } from './business-intelligence'
export { hazalyzeModule } from './hazalyze'
export { iotModule } from './iot'
export { digitalSignatureModule } from './digital-signature'
export { pulseModule } from './pulse'
export { exportHouseModule } from './export-house'
export { dmarcMonitoringModule } from './dmarc-monitoring'
export { opcuaMonitoringModule } from './opc-ua-monitoring'
export { ictHardwareEcosystemModule } from './ict-hardware-ecosystem'
export { externalIntegrationsModule } from './external-integrations'
export { msdsModule } from './msds'
export { customsModule } from './customs'
export { emailModule } from './email'
export { intelligenceAnalyticsModule } from './intelligence-analytics'
export { workspaceModule } from './workspace'
export { marketDataModule } from './market-data'