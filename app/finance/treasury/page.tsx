/**
 * Treasury Management Page
 * Cash management, bank accounts, cash forecasting
 */

"use client";

export default function TreasuryPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Treasury Management</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Treasury Management - Cash management, bank accounts, cash forecasting,
        and liquidity analysis.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">
          <strong>Features:</strong> Cash position, cash forecasting, liquidity
          analysis, cash flow analysis
        </p>
      </div>
    </div>
  );
}
