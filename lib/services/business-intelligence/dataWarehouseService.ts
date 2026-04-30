/**
 * Data Warehouse Service
 * ETL from all modules to data warehouse
 * READS from module services (no duplication)
 */

import { eventBus } from "@/lib/services/event-bus";
import type { DataWarehouseTable, ETLJob } from "@/types/business-intelligence";

// ============================================================================
// SERVICE
// ============================================================================

class DataWarehouseService {
  private tables: Map<string, DataWarehouseTable> = new Map();
  private etlJobs: Map<string, ETLJob> = new Map();

  /**
   * Initialize ETL jobs for all modules
   */
  initializeETLJobs(): void {
    // Create ETL jobs for each module (reads from module services, no duplication)
    this.createETLJob({
      name: "HR Employees ETL",
      source: {
        module: "hr",
        service: "employeeService",
        method: "getEmployees",
      },
      destination: {
        table: "hr_employees",
        mode: "upsert",
      },
      schedule: {
        frequency: "daily",
        time: "02:00",
      },
    });

    this.createETLJob({
      name: "Finance GL Entries ETL",
      source: {
        module: "finance",
        service: "generalLedgerService",
        method: "getGLEntries",
      },
      destination: {
        table: "finance_gl_entries",
        mode: "append",
      },
      schedule: {
        frequency: "hourly",
      },
    });

    this.createETLJob({
      name: "CRM Opportunities ETL",
      source: {
        module: "crm",
        service: "opportunityService",
        method: "getOpportunities",
      },
      destination: {
        table: "crm_opportunities",
        mode: "upsert",
      },
      schedule: {
        frequency: "hourly",
      },
    });

    // Subscribe to events for real-time sync (if enabled)
    eventBus.subscribe("hr.employee.created", async (event: any) => {
      await this.syncRecord("hr_employees", event.payload, "upsert");
    });

    eventBus.subscribe("finance.gl.entry.created", async (event: any) => {
      await this.syncRecord("finance_gl_entries", event.payload, "append");
    });

    eventBus.subscribe("crm.opportunity.created", async (event: any) => {
      await this.syncRecord("crm_opportunities", event.payload, "upsert");
    });
  }

  /**
   * Create ETL job
   */
  async createETLJob(input: {
    name: string;
    source: ETLJob["source"];
    destination: ETLJob["destination"];
    schedule?: ETLJob["schedule"];
  }): Promise<ETLJob> {
    const job: ETLJob = {
      id: `etl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: input.name,
      source: input.source,
      destination: input.destination,
      schedule: input.schedule,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.etlJobs.set(job.id, job);
    return job;
  }

  /**
   * Sync record to data warehouse
   * READS from module service (no duplication)
   */
  private async syncRecord(
    tableName: string,
    record: any,
    mode: "append" | "upsert",
  ): Promise<void> {
    // This would write to actual data warehouse
    // For now, just track in memory
    const table = this.tables.get(tableName);
    if (table) {
      table.recordCount++;
      table.lastSyncAt = new Date().toISOString();
    }
  }

  /**
   * Run ETL job
   * READS from module service (no duplication)
   */
  async runETLJob(
    jobId: string,
  ): Promise<{ success: boolean; records: number }> {
    const job = this.etlJobs.get(jobId);
    if (!job) {
      throw new Error(`ETL job ${jobId} not found`);
    }

    try {
      // This would:
      // 1. Call the module service method (read-only, no duplication)
      // 2. Transform data
      // 3. Write to data warehouse
      // For now, simulate
      const records = 100; // Would be actual count from service

      job.lastRunAt = new Date().toISOString();
      job.lastRunStatus = "SUCCESS";
      job.lastRunRecords = records;
      job.updatedAt = new Date().toISOString();

      this.etlJobs.set(jobId, job);

      return { success: true, records };
    } catch (error) {
      job.lastRunAt = new Date().toISOString();
      job.lastRunStatus = "FAILED";
      job.updatedAt = new Date().toISOString();
      this.etlJobs.set(jobId, job);

      throw error;
    }
  }

  /**
   * Get ETL jobs
   */
  async getETLJobs(filters?: {
    module?: string;
    status?: ETLJob["status"];
  }): Promise<ETLJob[]> {
    let jobs = Array.from(this.etlJobs.values());

    if (filters?.module) {
      jobs = jobs.filter((j) => j.source.module === filters.module);
    }

    if (filters?.status) {
      jobs = jobs.filter((j) => j.status === filters.status);
    }

    return jobs;
  }

  /**
   * Get data warehouse tables
   */
  async getTables(): Promise<DataWarehouseTable[]> {
    return Array.from(this.tables.values());
  }
}

export const dataWarehouseService = new DataWarehouseService();

// Initialize ETL jobs on service creation
if (typeof window === "undefined") {
  dataWarehouseService.initializeETLJobs();
}
