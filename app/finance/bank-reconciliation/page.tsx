/**
 * Bank Reconciliation Page
 * Bank statement import, matching, reconciliation
 */

"use client";

export default function BankReconciliationPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bank Reconciliation</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Bank Reconciliation - Bank statement import, transaction matching, and
        reconciliation.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">
          <strong>Features:</strong> Bank accounts, statement import
          (CSV/OFX/MT940), auto-matching, reconciliation
        </p>
      </div>
    </div>
  );
}
