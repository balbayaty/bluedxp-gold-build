/**
 * Financial Consolidation Service
 * Multi-entity consolidation, elimination entries, intercompany transactions
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  Entity,
  ConsolidationPeriod,
  ConsolidationEntry,
  IntercompanyTransaction,
} from "@/types/finance";

export class ConsolidationService {
  private entities: Map<string, Entity> = new Map();
  private consolidationPeriods: Map<string, ConsolidationPeriod> = new Map();
  private consolidationEntries: Map<string, ConsolidationEntry> = new Map();
  private intercompanyTransactions: Map<string, IntercompanyTransaction> =
    new Map();

  /**
   * Get all entities for a tenant
   */
  async getEntities(tenantId: string): Promise<Entity[]> {
    // Filter entities by tenantId
    const entities = Array.from(this.entities.values()).filter(
      (entity) => entity.tenantId === tenantId,
    );
    return entities;
  }

  /**
   * Get entity by ID
   */
  async getEntityById(entityId: string): Promise<Entity | null> {
    return this.entities.get(entityId) || null;
  }

  /**
   * Create entity
   */
  async createEntity(
    tenantId: string,
    entityData: Omit<Entity, "id" | "createdAt">,
  ): Promise<Entity> {
    const entityId = `entity-${Date.now()}`;
    const entity: Entity = {
      ...entityData,
      id: entityId,
      createdAt: new Date().toISOString(),
    };

    this.entities.set(entityId, entity);

    await eventBus.publish({
      type: "finance.entity.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        entityId,
        entityCode: entity.entityCode,
        entityType: entity.entityType,
      },
    } as DomainEvent);

    return entity;
  }

  /**
   * Create consolidation period
   */
  async createConsolidationPeriod(
    tenantId: string,
    periodData: Omit<
      ConsolidationPeriod,
      "id" | "status" | "completedAt" | "completedBy"
    >,
  ): Promise<ConsolidationPeriod> {
    const periodId = `consolidation-period-${Date.now()}`;
    const period: ConsolidationPeriod = {
      ...periodData,
      id: periodId,
      status: "OPEN",
    };

    this.consolidationPeriods.set(periodId, period);

    await eventBus.publish({
      type: "finance.consolidation-period.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        periodId,
        periodName: period.periodName,
      },
    } as DomainEvent);

    return period;
  }

  /**
   * Translate entity GL entries to reporting currency
   */
  async translateEntityEntries(
    tenantId: string,
    entityId: string,
    consolidationPeriodId: string,
    exchangeRate: number,
  ): Promise<ConsolidationEntry[]> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error("Entity not found");
    }

    // TODO: Get GL entries for entity
    // const glEntries = await generalLedgerService.getGLEntries({
    //   tenantId,
    //   entityId,
    //   startDate: period.startDate,
    //   endDate: period.endDate,
    // })

    // Mock translation
    const entries: ConsolidationEntry[] = [
      {
        id: `entry-${Date.now()}`,
        tenantId,
        consolidationPeriodId,
        entityId,
        accountCode: "REVENUE",
        localAmount: 1000000,
        localCurrency: entity.currency,
        translatedAmount: 1000000 * exchangeRate,
        reportingCurrency: entity.reportingCurrency,
        exchangeRate,
        entryType: "ENTITY",
        createdAt: new Date().toISOString(),
      },
    ];

    entries.forEach((e) => this.consolidationEntries.set(e.id, e));

    return entries;
  }

  /**
   * Create intercompany transaction
   */
  async createIntercompanyTransaction(
    tenantId: string,
    transaction: Omit<
      IntercompanyTransaction,
      "id" | "eliminated" | "eliminatedAt" | "createdAt"
    >,
  ): Promise<IntercompanyTransaction> {
    const transactionId = `intercompany-${Date.now()}`;
    const intercompanyTxn: IntercompanyTransaction = {
      ...transaction,
      id: transactionId,
      eliminated: false,
      createdAt: new Date().toISOString(),
    };

    this.intercompanyTransactions.set(transactionId, intercompanyTxn);

    // Create GL entries for both entities
    await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate: transaction.transactionDate,
      description: `Intercompany: ${transaction.description}`,
      lines: [
        {
          accountCode:
            transaction.transactionType === "SALE"
              ? "INTERCOMPANY_RECEIVABLE"
              : "INTERCOMPANY_PAYABLE",
          accountName: `Intercompany ${transaction.transactionType}`,
          debit:
            transaction.transactionType === "SALE" ? transaction.amount : 0,
          credit:
            transaction.transactionType === "PURCHASE" ? transaction.amount : 0,
          description: transaction.description,
        },
        {
          accountCode:
            transaction.transactionType === "SALE" ? "REVENUE" : "EXPENSE",
          accountName:
            transaction.transactionType === "SALE" ? "Revenue" : "Expense",
          debit:
            transaction.transactionType === "PURCHASE" ? transaction.amount : 0,
          credit:
            transaction.transactionType === "SALE" ? transaction.amount : 0,
          description: transaction.description,
        },
      ],
      currency: transaction.currency,
      createdBy: "system",
    });

    intercompanyTxn.glEntryId = "gl-entry-id";

    await eventBus.publish({
      type: "finance.intercompany-transaction.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        transactionId,
        fromEntityId: transaction.fromEntityId,
        toEntityId: transaction.toEntityId,
        amount: transaction.amount,
      },
    } as DomainEvent);

    return intercompanyTxn;
  }

  /**
   * Eliminate intercompany transactions
   */
  async eliminateIntercompanyTransactions(
    tenantId: string,
    consolidationPeriodId: string,
  ): Promise<{
    eliminatedCount: number;
    eliminationEntries: ConsolidationEntry[];
  }> {
    const transactions = Array.from(
      this.intercompanyTransactions.values(),
    ).filter((t) => t.tenantId === tenantId && !t.eliminated);

    const eliminationEntries: ConsolidationEntry[] = [];

    for (const transaction of transactions) {
      // Create elimination entry
      const eliminationId = `elimination-${Date.now()}`;
      const elimination: ConsolidationEntry = {
        id: eliminationId,
        tenantId,
        consolidationPeriodId,
        entityId: transaction.fromEntityId,
        accountCode: "INTERCOMPANY_ELIMINATION",
        localAmount: transaction.amount,
        localCurrency: transaction.currency,
        translatedAmount: transaction.amount,
        reportingCurrency: transaction.currency,
        exchangeRate: 1,
        entryType: "ELIMINATION",
        createdAt: new Date().toISOString(),
      };

      eliminationEntries.push(elimination);
      this.consolidationEntries.set(eliminationId, elimination);

      transaction.eliminated = true;
      transaction.eliminatedAt = new Date().toISOString();

      // Create GL elimination entry
      await generalLedgerService.createJournalEntry({
        tenantId,
        entryDate: new Date().toISOString(),
        description: `Intercompany Elimination: ${transaction.transactionNumber}`,
        lines: [
          {
            accountCode: "INTERCOMPANY_RECEIVABLE",
            accountName: "Intercompany Receivable",
            debit: 0,
            credit: transaction.amount,
          },
          {
            accountCode: "INTERCOMPANY_PAYABLE",
            accountName: "Intercompany Payable",
            debit: transaction.amount,
            credit: 0,
          },
        ],
        currency: transaction.currency,
        createdBy: "system",
      });
    }

    await eventBus.publish({
      type: "finance.intercompany-transactions.eliminated",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        consolidationPeriodId,
        eliminatedCount: transactions.length,
      },
    } as DomainEvent);

    return {
      eliminatedCount: transactions.length,
      eliminationEntries,
    };
  }

  /**
   * Generate consolidated financial statements
   */
  async generateConsolidatedStatements(
    tenantId: string,
    consolidationPeriodId: string,
  ): Promise<{
    consolidatedRevenue: number;
    consolidatedExpenses: number;
    consolidatedNetIncome: number;
    consolidatedAssets: number;
    consolidatedLiabilities: number;
    consolidatedEquity: number;
  }> {
    const period = this.consolidationPeriods.get(consolidationPeriodId);
    if (!period) {
      throw new Error("Consolidation period not found");
    }

    const entries = Array.from(this.consolidationEntries.values()).filter(
      (e) =>
        e.consolidationPeriodId === consolidationPeriodId &&
        e.entryType === "ENTITY",
    );

    // Aggregate by account type
    const revenue = entries
      .filter((e) => e.accountCode.includes("REVENUE"))
      .reduce((sum, e) => sum + e.translatedAmount, 0);

    const expenses = entries
      .filter((e) => e.accountCode.includes("EXPENSE"))
      .reduce((sum, e) => sum + e.translatedAmount, 0);

    const assets = entries
      .filter((e) => e.accountCode.includes("ASSET"))
      .reduce((sum, e) => sum + e.translatedAmount, 0);

    const liabilities = entries
      .filter((e) => e.accountCode.includes("LIABILITY"))
      .reduce((sum, e) => sum + e.translatedAmount, 0);

    const equity = entries
      .filter((e) => e.accountCode.includes("EQUITY"))
      .reduce((sum, e) => sum + e.translatedAmount, 0);

    return {
      consolidatedRevenue: revenue,
      consolidatedExpenses: expenses,
      consolidatedNetIncome: revenue - expenses,
      consolidatedAssets: assets,
      consolidatedLiabilities: liabilities,
      consolidatedEquity: equity,
    };
  }

  /**
   * Complete consolidation
   */
  async completeConsolidation(
    tenantId: string,
    consolidationPeriodId: string,
    completedBy: string,
  ): Promise<ConsolidationPeriod> {
    const period = this.consolidationPeriods.get(consolidationPeriodId);
    if (!period) {
      throw new Error("Consolidation period not found");
    }

    // Eliminate intercompany transactions
    await this.eliminateIntercompanyTransactions(
      tenantId,
      consolidationPeriodId,
    );

    period.status = "COMPLETED";
    period.completedAt = new Date().toISOString();
    period.completedBy = completedBy;

    await eventBus.publish({
      type: "finance.consolidation.completed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        consolidationPeriodId,
        completedBy,
      },
    } as DomainEvent);

    return period;
  }
}

// Singleton instance
export const consolidationService = new ConsolidationService();
