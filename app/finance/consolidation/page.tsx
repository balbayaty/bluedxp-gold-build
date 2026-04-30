/**
 * Financial Consolidation Page
 * Multi-entity consolidation, intercompany eliminations
 */

"use client";

export default function ConsolidationPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Financial Consolidation</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Financial Consolidation - Multi-entity consolidation, currency
        translation, and intercompany eliminations.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">
          <strong>Features:</strong> Multi-entity consolidation, currency
          translation, intercompany eliminations
        </p>
      </div>
    </div>
  );
}
