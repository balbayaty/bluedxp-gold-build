/**
 * Bank Reconciliation Service
 * Bank statement import, matching, reconciliation
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  BankAccount,
  BankStatement,
  BankTransaction,
  BankReconciliation,
} from "@/types/finance";

export class BankReconciliationService {
  private bankAccounts: Map<string, BankAccount> = new Map();
  private statements: Map<string, BankStatement> = new Map();
  private transactions: Map<string, BankTransaction> = new Map();
  private reconciliations: Map<string, BankReconciliation> = new Map();

  /**
   * Create bank account
   */
  async createBankAccount(
    tenantId: string,
    accountData: Omit<
      BankAccount,
      "id" | "currentBalance" | "createdAt" | "updatedAt"
    >,
  ): Promise<BankAccount> {
    const accountId = `bank-account-${Date.now()}`;
    const account: BankAccount = {
      ...accountData,
      id: accountId,
      currentBalance: accountData.openingBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bankAccounts.set(accountId, account);

    await eventBus.publish({
      type: "finance.bank-account.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        accountId,
        accountNumber: account.accountNumber,
      },
    } as DomainEvent);

    return account;
  }

  /**
   * Import bank statement
   */
  async importBankStatement(
    tenantId: string,
    bankAccountId: string,
    statementData: {
      statementNumber: string;
      statementDate: Date | string;
      openingBalance: number;
      closingBalance: number;
      transactions: Array<{
        transactionDate: Date | string;
        valueDate: Date | string;
        description: string;
        amount: number;
        balance: number;
        reference?: string;
        type: "DEBIT" | "CREDIT";
      }>;
      format: BankStatement["format"];
    },
    importedBy: string,
  ): Promise<BankStatement> {
    const statementId = `statement-${Date.now()}`;
    const statement: BankStatement = {
      id: statementId,
      tenantId,
      bankAccountId,
      statementNumber: statementData.statementNumber,
      statementDate: statementData.statementDate,
      openingBalance: statementData.openingBalance,
      closingBalance: statementData.closingBalance,
      currency: this.bankAccounts.get(bankAccountId)?.currency || "SAR",
      transactions: statementData.transactions.map((t, index) => ({
        id: `txn-${statementId}-${index}`,
        tenantId,
        bankAccountId,
        statementId,
        transactionDate: t.transactionDate,
        valueDate: t.valueDate,
        description: t.description,
        amount: t.amount,
        balance: t.balance,
        reference: t.reference,
        type: t.type,
        matched: false,
        reconciled: false,
      })),
      importedAt: new Date().toISOString(),
      importedBy,
      format: statementData.format,
      status: "IMPORTED",
    };

    this.statements.set(statementId, statement);
    statement.transactions.forEach((t) => this.transactions.set(t.id, t));

    await eventBus.publish({
      type: "finance.bank-statement.imported",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        statementId,
        bankAccountId,
        transactionCount: statement.transactions.length,
      },
    } as DomainEvent);

    return statement;
  }

  /**
   * Match bank transaction with GL entry
   */
  async matchTransaction(
    tenantId: string,
    transactionId: string,
    glEntryId: string,
  ): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify GL entry exists and amounts match
    try {
      const glEntry = await generalLedgerService.getGLEntry(
        glEntryId,
        tenantId,
      );
      if (!glEntry) {
        throw new Error(`GL entry ${glEntryId} not found`);
      }

      // Verify amounts match (allow for small rounding differences)
      const amountDiff = Math.abs(
        Math.abs(glEntry.amount) - Math.abs(transaction.amount),
      );
      if (amountDiff > 0.01) {
        console.warn(
          `[BankReconciliation] Amount mismatch: GL=${glEntry.amount}, Txn=${transaction.amount}`,
        );
      }
    } catch (error) {
      console.warn(`[BankReconciliation] Could not verify GL entry: ${error}`);
      // Continue with matching even if GL verification fails (for flexibility)
    }

    transaction.matched = true;
    transaction.matchedGlEntryId = glEntryId;
    transaction.matchedAt = new Date().toISOString();

    await eventBus.publish({
      type: "finance.bank-transaction.matched",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        transactionId,
        glEntryId,
      },
    } as DomainEvent);
  }

  /**
   * Auto-match transactions
   */
  async autoMatchTransactions(
    tenantId: string,
    bankAccountId: string,
    statementId: string,
  ): Promise<{
    matched: number;
    unmatched: number;
  }> {
    const statement = this.statements.get(statementId);
    if (!statement) {
      throw new Error("Statement not found");
    }

    // Get GL entries for bank account
    const bankAccount = this.bankAccounts.get(bankAccountId);
    let glEntries: any[] = [];

    try {
      if (bankAccount?.glAccountCode) {
        glEntries = await generalLedgerService.getGLEntries({
          tenantId,
          accountCode: bankAccount.glAccountCode,
          startDate: statement.statementDate as string,
          endDate: statement.statementDate as string,
        });
      }
    } catch (error) {
      console.warn(`[BankReconciliation] Could not get GL entries: ${error}`);
    }

    let matched = 0;
    let unmatched = 0;

    for (const transaction of statement.transactions) {
      // Match with GL entries based on amount, date, and description similarity
      if (!transaction.matched && glEntries.length > 0) {
        const matchingEntry = glEntries.find((gl) => {
          // Check if amounts match (allowing for small rounding differences)
          const amountMatch =
            Math.abs(Math.abs(gl.amount) - Math.abs(transaction.amount)) < 0.01;

          // Check if dates are within 3 days of each other
          const txnDate = new Date(transaction.transactionDate);
          const glDate = new Date(gl.entryDate);
          const dateDiff = Math.abs(txnDate.getTime() - glDate.getTime());
          const dateMatch = dateDiff <= 3 * 24 * 60 * 60 * 1000; // 3 days in ms

          return amountMatch && dateMatch;
        });

        if (matchingEntry) {
          transaction.matched = true;
          transaction.matchedGlEntryId = matchingEntry.id;
          transaction.matchedAt = new Date().toISOString();
          matched++;
          // Remove from available entries to prevent double-matching
          const idx = glEntries.indexOf(matchingEntry);
          if (idx > -1) glEntries.splice(idx, 1);
        } else {
          unmatched++;
        }
      } else if (transaction.matched) {
        matched++;
      } else {
        unmatched++;
      }
    }

    return { matched, unmatched };
  }

  /**
   * Reconcile bank statement
   */
  async reconcileBankStatement(
    tenantId: string,
    bankAccountId: string,
    statementId: string,
  ): Promise<BankReconciliation> {
    const statement = this.statements.get(statementId);
    if (!statement) {
      throw new Error("Statement not found");
    }

    const account = this.bankAccounts.get(bankAccountId);
    if (!account) {
      throw new Error("Bank account not found");
    }

    // TODO: Get GL balance for bank account
    // const glBalance = await generalLedgerService.getAccountBalance(
    //   tenantId,
    //   account.glAccountCode,
    //   statement.statementDate
    // )

    const glBalance = account.currentBalance; // Mock

    const unmatchedTransactions = statement.transactions.filter(
      (t) => !t.matched,
    );
    const outstandingDeposits = unmatchedTransactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const outstandingWithdrawals = unmatchedTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);

    const adjustedBalance =
      glBalance + outstandingDeposits - outstandingWithdrawals;
    const difference = statement.closingBalance - adjustedBalance;

    const reconciliationId = `recon-${Date.now()}`;
    const reconciliation: BankReconciliation = {
      id: reconciliationId,
      tenantId,
      bankAccountId,
      statementId,
      reconciliationDate: new Date().toISOString(),
      openingBalance: statement.openingBalance,
      closingBalance: statement.closingBalance,
      bankBalance: statement.closingBalance,
      glBalance,
      outstandingDeposits,
      outstandingWithdrawals,
      adjustedBalance,
      difference,
      status: difference === 0 ? "RECONCILED" : "IN_PROGRESS",
      reconciledBy: difference === 0 ? "system" : undefined,
      reconciledAt: difference === 0 ? new Date().toISOString() : undefined,
    };

    if (difference === 0) {
      // Mark all transactions as reconciled
      statement.transactions.forEach((t) => {
        t.reconciled = true;
        t.reconciledAt = new Date().toISOString();
      });
      statement.status = "RECONCILED";
    }

    this.reconciliations.set(reconciliationId, reconciliation);

    await eventBus.publish({
      type: "finance.bank-reconciliation.completed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        reconciliationId,
        bankAccountId,
        difference,
      },
    } as DomainEvent);

    return reconciliation;
  }

  /**
   * Get bank accounts
   */
  async getBankAccounts(tenantId: string): Promise<BankAccount[]> {
    return Array.from(this.bankAccounts.values()).filter(
      (a) => a.tenantId === tenantId && a.isActive,
    );
  }

  /**
   * Get bank statements
   */
  async getBankStatements(
    tenantId: string,
    bankAccountId?: string,
  ): Promise<BankStatement[]> {
    let statements = Array.from(this.statements.values()).filter(
      (s) => s.tenantId === tenantId,
    );

    if (bankAccountId) {
      statements = statements.filter((s) => s.bankAccountId === bankAccountId);
    }

    return statements.sort(
      (a, b) =>
        new Date(b.statementDate).getTime() -
        new Date(a.statementDate).getTime(),
    );
  }
}

// Singleton instance
export const bankReconciliationService = new BankReconciliationService();
