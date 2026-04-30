/**
 * Comprehensive Compliance Setup Service
 * Initialize all compliance data, authorities, regulations, and mock data
 * Set up complete compliance management system
 */

import { authorityHierarchyService } from "./authorityHierarchyService";
import { complianceService } from "./complianceService";
import { mockDataService } from "./mockDataService";
import { complianceCalendarService } from "./complianceCalendarService";
import { intelligentComplianceEngine } from "./intelligentComplianceEngine";
import { initializeSaudiArabiaRequirements } from "./regulatory-frameworks/saudi-arabia";

// ============================================================================
// SETUP CONFIGURATION
// ============================================================================

export interface SetupConfiguration {
  includeMockData: boolean;
  includeAuthorities: boolean;
  includeRegulations: boolean;
  includeComplianceRecords: boolean;
  includeKnowledgeBase: boolean;
  includeCalendarEvents: boolean;
  tenantId?: string;
}

export interface SetupResult {
  success: boolean;
  authoritiesCreated: number;
  regulationsCreated: number;
  recordsCreated: number;
  knowledgeEntriesCreated: number;
  calendarEventsCreated: number;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// COMPREHENSIVE SETUP
// ============================================================================

/**
 * Comprehensive setup of compliance management system
 */
export async function setupComplianceSystem(
  config: SetupConfiguration = {
    includeMockData: true,
    includeAuthorities: true,
    includeRegulations: true,
    includeComplianceRecords: true,
    includeKnowledgeBase: true,
    includeCalendarEvents: true,
  },
): Promise<SetupResult> {
  const result: SetupResult = {
    success: true,
    authoritiesCreated: 0,
    regulationsCreated: 0,
    recordsCreated: 0,
    knowledgeEntriesCreated: 0,
    calendarEventsCreated: 0,
    errors: [],
    warnings: [],
  };

  try {
    console.log("🚀 Starting comprehensive compliance system setup...");

    // Step 1: Initialize Saudi Arabia regulatory requirements
    if (config.includeRegulations) {
      try {
        console.log("📋 Initializing Saudi Arabia regulatory requirements...");
        await initializeSaudiArabiaRequirements();
        result.regulationsCreated += 10; // Approximate count
        console.log("✅ Saudi Arabia requirements initialized");
      } catch (error: any) {
        result.errors.push(
          `Failed to initialize Saudi Arabia requirements: ${error.message}`,
        );
        console.error(
          "❌ Error initializing Saudi Arabia requirements:",
          error,
        );
      }
    }

    // Step 2: Create authority hierarchy
    if (config.includeAuthorities) {
      try {
        console.log("🏛️ Creating regulatory authority hierarchy...");
        const authorities = mockDataService.getAuthorities();

        for (const authority of authorities) {
          try {
            await authorityHierarchyService.createOrUpdateAuthorityNode(
              authority,
            );
            result.authoritiesCreated++;
          } catch (error: any) {
            result.warnings.push(
              `Failed to create authority ${authority.code}: ${error.message}`,
            );
          }
        }
        console.log(`✅ Created ${result.authoritiesCreated} authorities`);
      } catch (error: any) {
        result.errors.push(`Failed to create authorities: ${error.message}`);
        console.error("❌ Error creating authorities:", error);
      }
    }

    // Step 3: Create local regulations
    if (config.includeRegulations) {
      try {
        console.log("📜 Creating local regulations...");
        const regulations = mockDataService.getRegulations();

        for (const regulation of regulations) {
          try {
            await authorityHierarchyService.createOrUpdateLocalRegulation(
              regulation,
            );
            result.regulationsCreated++;
          } catch (error: any) {
            result.warnings.push(
              `Failed to create regulation ${regulation.regulationCode}: ${error.message}`,
            );
          }
        }
        console.log(`✅ Created ${result.regulationsCreated} regulations`);
      } catch (error: any) {
        result.errors.push(`Failed to create regulations: ${error.message}`);
        console.error("❌ Error creating regulations:", error);
      }
    }

    // Step 4: Create compliance records
    if (config.includeComplianceRecords && config.tenantId) {
      try {
        console.log("📝 Creating compliance records...");
        const records = mockDataService.getComplianceRecords();

        for (const record of records) {
          try {
            // Update tenant ID if provided
            const recordWithTenant = { ...record, tenantId: config.tenantId };
            await complianceService.createComplianceRecord(recordWithTenant);
            result.recordsCreated++;
          } catch (error: any) {
            result.warnings.push(
              `Failed to create record ${record.id}: ${error.message}`,
            );
          }
        }
        console.log(`✅ Created ${result.recordsCreated} compliance records`);
      } catch (error: any) {
        result.errors.push(
          `Failed to create compliance records: ${error.message}`,
        );
        console.error("❌ Error creating compliance records:", error);
      }
    }

    // Step 5: Create knowledge base entries
    if (config.includeKnowledgeBase) {
      try {
        console.log("📚 Creating knowledge base entries...");
        const knowledgeEntries = mockDataService.getKnowledgeEntries();

        for (const entry of knowledgeEntries) {
          try {
            await authorityHierarchyService.createOrUpdateLocalKnowledge(entry);
            result.knowledgeEntriesCreated++;
          } catch (error: any) {
            result.warnings.push(
              `Failed to create knowledge entry ${entry.id}: ${error.message}`,
            );
          }
        }
        console.log(
          `✅ Created ${result.knowledgeEntriesCreated} knowledge entries`,
        );
      } catch (error: any) {
        result.errors.push(
          `Failed to create knowledge entries: ${error.message}`,
        );
        console.error("❌ Error creating knowledge entries:", error);
      }
    }

    // Step 6: Generate calendar events
    if (config.includeCalendarEvents && config.tenantId) {
      try {
        console.log("📅 Generating calendar events...");
        const records = config.tenantId
          ? complianceService.getRecordsByTenant(config.tenantId)
          : [];

        if (records.length > 0) {
          const events =
            complianceCalendarService.generateCalendarEvents(records);
          result.calendarEventsCreated = events.length;
          console.log(
            `✅ Generated ${result.calendarEventsCreated} calendar events`,
          );
        }
      } catch (error: any) {
        result.errors.push(
          `Failed to generate calendar events: ${error.message}`,
        );
        console.error("❌ Error generating calendar events:", error);
      }
    }

    // Determine overall success
    result.success = result.errors.length === 0;

    if (result.success) {
      console.log(
        "🎉 Comprehensive compliance system setup completed successfully!",
      );
      console.log(`   - Authorities: ${result.authoritiesCreated}`);
      console.log(`   - Regulations: ${result.regulationsCreated}`);
      console.log(`   - Records: ${result.recordsCreated}`);
      console.log(`   - Knowledge Entries: ${result.knowledgeEntriesCreated}`);
      console.log(`   - Calendar Events: ${result.calendarEventsCreated}`);
    } else {
      console.warn("⚠️ Setup completed with errors. Please review.");
    }

    return result;
  } catch (error: any) {
    result.success = false;
    result.errors.push(`Setup failed: ${error.message}`);
    console.error("❌ Fatal error during setup:", error);
    return result;
  }
}

/**
 * Quick setup with default configuration
 */
export async function quickSetup(tenantId: string): Promise<SetupResult> {
  return setupComplianceSystem({
    includeMockData: true,
    includeAuthorities: true,
    includeRegulations: true,
    includeComplianceRecords: true,
    includeKnowledgeBase: true,
    includeCalendarEvents: true,
    tenantId,
  });
}

/**
 * Verify setup completeness
 */
export function verifySetup(): {
  complete: boolean;
  missing: string[];
  recommendations: string[];
} {
  const missing: string[] = [];
  const recommendations: string[] = [];

  // Check authorities
  const authorities = authorityHierarchyService.getRootNodes();
  if (authorities.length === 0) {
    missing.push("Regulatory authorities");
    recommendations.push("Run setup to create authority hierarchy");
  }

  // Check regulations
  const allAuthorities = authorityHierarchyService.getAllNodes();
  let totalRegulations = 0;
  for (const authority of allAuthorities) {
    const regs = authorityHierarchyService.getRegulationsByAuthority(
      authority.id,
    );
    totalRegulations += regs.length;
  }
  if (totalRegulations === 0) {
    missing.push("Local regulations");
    recommendations.push("Run setup to create regulations");
  }

  // Check knowledge base
  const knowledgeEntries = authorityHierarchyService.getAllLocalKnowledge();
  if (knowledgeEntries.length === 0) {
    missing.push("Knowledge base entries");
    recommendations.push("Run setup to populate knowledge base");
  }

  return {
    complete: missing.length === 0,
    missing,
    recommendations,
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const comprehensiveSetupService = {
  setupComplianceSystem,
  quickSetup,
  verifySetup,
};

export default comprehensiveSetupService;
