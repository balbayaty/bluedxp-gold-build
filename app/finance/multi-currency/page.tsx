/**
 * Multi-Currency Accounting Page
 * FX revaluation, currency translation
 */

"use client";

export default function MultiCurrencyPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Multi-Currency Accounting</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Multi-Currency Accounting - Multi-currency GL, FX revaluation, and
        currency translation.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">
          <strong>Features:</strong> Multi-currency GL, FX revaluation, currency
          translation, gain/loss calculation
        </p>
      </div>
    </div>
  );
}
