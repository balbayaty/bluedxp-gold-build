/**
 * Fixed Assets Page
 * Asset register, depreciation, disposal management
 */

"use client";

export default function FixedAssetsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fixed Assets</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Fixed Assets Accounting - Asset register, depreciation, disposal, and
        asset lifecycle management.
      </p>
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm">
          <strong>Features:</strong> Asset register, depreciation (4 methods),
          disposal, gain/loss calculation
        </p>
      </div>
    </div>
  );
}
