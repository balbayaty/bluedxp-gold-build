/**
 * Global Compliance
 *
 * Placeholder page for /global-compliance
 * This exists to prevent broken navigation links during development.
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function GlobalComplianceContent() {
  return (
    <PageTemplate
      title="Global Compliance"
      description="Global compliance dashboards, policies, and cross-jurisdiction controls (in progress)"
      icon="ri-global-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            Global Compliance (Coming Soon)
          </h2>
          <p className="text-gray-400">
            This page is intentionally present to keep navigation working while
            we complete the implementation.
          </p>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function GlobalCompliancePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Global Compliance"
          description="Global compliance dashboards, policies, and cross-jurisdiction controls (in progress)"
          icon="ri-global-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <GlobalComplianceContent />
    </ErrorBoundary>
  );
}
