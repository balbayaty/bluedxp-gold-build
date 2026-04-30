"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import EnergyManager from "@/components/facility/EnergyManager";

export default function EnergyPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Energy Data
            </h2>
            <p className="text-gray-500">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <EnergyManager />
    </ErrorBoundary>
  );
}
