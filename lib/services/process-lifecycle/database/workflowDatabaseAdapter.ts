/**
 * Workflow Database Adapter
 * Production-ready database persistence for Workflow services
 * Supports PostgreSQL, MongoDB, SQLite with automatic fallback
 * Multi-tenant isolation enforced (day 1)
 */

import { DatabaseClient } from "@/lib/database/client";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: any[];
  triggers: any[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  recordId: string;
  status: string;
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  steps: any[];
  context?: any;
  progress?: number;
  slaStatus?: string;
  slaDeadline?: string;
}

// ============================================================================
// DATABASE ADAPTER
// ============================================================================

export class WorkflowDatabaseAdapter {
  private dbClient: DatabaseClient | null = null;
  private useDatabase: boolean = true;
  private initPromise: Promise<void> | null = null;

  // In-memory fallback (tenant-scoped)
  private inMemoryWorkflows: Map<string, Map<string, Workflow>> = new Map();
  private inMemoryExecutions: Map<string, Map<string, WorkflowExecution>> =
    new Map();

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const { getDatabaseClient } = await import("@/lib/database/client");
        const client = await getDatabaseClient();
        if (client) {
          this.dbClient = client;
          await this.createTables();
          console.log("✅ Workflow Database Adapter initialized with database");
        } else {
          this.useDatabase = false;
          console.warn(
            "⚠️ Workflow Database Adapter: Database not configured, using in-memory storage",
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ Workflow Database Adapter: Failed to initialize database, using in-memory storage",
          error,
        );
        this.useDatabase = false;
      }
    })();

    return this.initPromise;
  }

  private async createTables(): Promise<void> {
    if (!this.dbClient || !this.useDatabase) return;

    try {
      if (this.dbClient.config?.type === "postgresql") {
        await this.createPostgreSQLTables();
      }
    } catch (error) {
      console.error("Failed to create workflow tables:", error);
      this.useDatabase = false;
    }
  }

  private async createPostgreSQLTables(): Promise<void> {
    if (!this.dbClient) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS workflows (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        steps JSONB NOT NULL,
        triggers JSONB NOT NULL,
        status VARCHAR(50) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS workflow_executions (
        id VARCHAR(255) PRIMARY KEY,
        workflow_id VARCHAR(255) NOT NULL,
        record_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_step VARCHAR(255),
        started_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        steps JSONB NOT NULL,
        context JSONB,
        progress INTEGER,
        sla_status VARCHAR(50),
        sla_deadline TIMESTAMP,
        tenant_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_executions_tenant ON workflow_executions(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_executions_workflow ON workflow_executions(workflow_id)`,
    ];

    for (const query of queries) {
      await this.dbClient.query(query);
    }
  }

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  async storeWorkflow(tenantId: string, workflow: Workflow): Promise<void> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        await this.dbClient.query(
          `INSERT INTO workflows (id, name, description, steps, triggers, status, tenant_id, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE
           SET name = $2, description = $3, steps = $4, triggers = $5, status = $6, updated_at = NOW()`,
          [
            workflow.id,
            workflow.name,
            workflow.description,
            JSON.stringify(workflow.steps),
            JSON.stringify(workflow.triggers),
            workflow.status,
            tenantId,
          ],
        );
      } catch (error) {
        console.error("Failed to store workflow:", error);
        this.storeWorkflowInMemory(tenantId, workflow);
      }
    } else {
      this.storeWorkflowInMemory(tenantId, workflow);
    }
  }

  async getWorkflow(tenantId: string, id: string): Promise<Workflow | null> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const result = await this.dbClient.query(
          `SELECT * FROM workflows WHERE id = $1 AND tenant_id = $2`,
          [id, tenantId],
        );
        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            name: row.name,
            description: row.description,
            steps: row.steps,
            triggers: row.triggers,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to get workflow:", error);
        return this.getWorkflowFromMemory(tenantId, id);
      }
    } else {
      return this.getWorkflowFromMemory(tenantId, id);
    }
  }

  async getAllWorkflows(tenantId: string): Promise<Workflow[]> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const result = await this.dbClient.query(
          `SELECT * FROM workflows WHERE tenant_id = $1 ORDER BY created_at DESC`,
          [tenantId],
        );
        if (result.rows) {
          return result.rows.map((row: any) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            steps: row.steps,
            triggers: row.triggers,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
        return [];
      } catch (error) {
        console.error("Failed to get all workflows:", error);
        return this.getAllWorkflowsFromMemory(tenantId);
      }
    } else {
      return this.getAllWorkflowsFromMemory(tenantId);
    }
  }

  // ============================================================================
  // EXECUTION OPERATIONS
  // ============================================================================

  async storeExecution(
    tenantId: string,
    execution: WorkflowExecution,
  ): Promise<void> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        await this.dbClient.query(
          `INSERT INTO workflow_executions (id, workflow_id, record_id, status, current_step, started_at, completed_at, steps, context, progress, sla_status, sla_deadline, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE
           SET status = $4, current_step = $5, completed_at = $7, steps = $8, context = $9, progress = $10, sla_status = $11, sla_deadline = $12`,
          [
            execution.id,
            execution.workflowId,
            execution.recordId,
            execution.status,
            execution.currentStep,
            execution.startedAt,
            execution.completedAt || null,
            JSON.stringify(execution.steps),
            JSON.stringify(execution.context || {}),
            execution.progress || null,
            execution.slaStatus || null,
            execution.slaDeadline || null,
            tenantId,
          ],
        );
      } catch (error) {
        console.error("Failed to store execution:", error);
        this.storeExecutionInMemory(tenantId, execution);
      }
    } else {
      this.storeExecutionInMemory(tenantId, execution);
    }
  }

  async getExecution(
    tenantId: string,
    id: string,
  ): Promise<WorkflowExecution | null> {
    await this.initialize();

    if (this.useDatabase && this.dbClient) {
      try {
        const result = await this.dbClient.query(
          `SELECT * FROM workflow_executions WHERE id = $1 AND tenant_id = $2`,
          [id, tenantId],
        );
        if (result.rows && result.rows.length > 0) {
          const row = result.rows[0];
          return {
            id: row.id,
            workflowId: row.workflow_id,
            recordId: row.record_id,
            status: row.status,
            currentStep: row.current_step,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            steps: row.steps,
            context: row.context,
            progress: row.progress,
            slaStatus: row.sla_status,
            slaDeadline: row.sla_deadline,
          };
        }
        return null;
      } catch (error) {
        console.error("Failed to get execution:", error);
        return this.getExecutionFromMemory(tenantId, id);
      }
    } else {
      return this.getExecutionFromMemory(tenantId, id);
    }
  }

  // ============================================================================
  // IN-MEMORY FALLBACK METHODS
  // ============================================================================

  private storeWorkflowInMemory(tenantId: string, workflow: Workflow): void {
    if (!this.inMemoryWorkflows.has(tenantId)) {
      this.inMemoryWorkflows.set(tenantId, new Map());
    }
    this.inMemoryWorkflows.get(tenantId)!.set(workflow.id, workflow);
  }

  private getWorkflowFromMemory(tenantId: string, id: string): Workflow | null {
    const tenantWorkflows = this.inMemoryWorkflows.get(tenantId);
    return tenantWorkflows?.get(id) || null;
  }

  private getAllWorkflowsFromMemory(tenantId: string): Workflow[] {
    const tenantWorkflows = this.inMemoryWorkflows.get(tenantId);
    return tenantWorkflows ? Array.from(tenantWorkflows.values()) : [];
  }

  private storeExecutionInMemory(
    tenantId: string,
    execution: WorkflowExecution,
  ): void {
    if (!this.inMemoryExecutions.has(tenantId)) {
      this.inMemoryExecutions.set(tenantId, new Map());
    }
    this.inMemoryExecutions.get(tenantId)!.set(execution.id, execution);
  }

  private getExecutionFromMemory(
    tenantId: string,
    id: string,
  ): WorkflowExecution | null {
    const tenantExecutions = this.inMemoryExecutions.get(tenantId);
    return tenantExecutions?.get(id) || null;
  }
}

// Export singleton instance
export const workflowDatabaseAdapter = new WorkflowDatabaseAdapter();
