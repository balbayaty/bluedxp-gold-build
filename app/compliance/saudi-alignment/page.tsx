/**
 * Saudi Alignment
 *
 * Placeholder page for /compliance/saudi-alignment
 * This exists to prevent broken navigation links during development.
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function SaudiAlignmentContent() {
  return (
    <PageTemplate
      title="Saudi Alignment"
      description="Vision 2030 + local regulatory alignment dashboards (in progress)"
      icon="ri-flag-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">
            Saudi Alignment (Coming Soon)
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

export default function SaudiAlignmentPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Saudi Alignment"
          description="Vision 2030 + local regulatory alignment dashboards (in progress)"
          icon="ri-flag-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <SaudiAlignmentContent />
    </ErrorBoundary>
  );
}
