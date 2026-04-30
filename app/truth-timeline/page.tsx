/**
 * Truth Timeline
 *
 * Placeholder/landing page for /truth-timeline
 * The detailed timeline is currently implemented as a dynamic route:
 * /truth-timeline/[entityType]/[entityId]
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function TruthTimelineContent() {
  return (
    <PageTemplate
      title="Truth Timeline"
      description="Evidence + lineage timeline per entity (select an entity to view)"
      icon="ri-time-line"
    >
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Truth Timeline</h2>
          <p className="text-gray-400">
            The detailed timeline view requires an entity type and entity ID.
          </p>
          <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="text-sm text-gray-300 mb-2">Example URL:</div>
            <div className="font-mono text-sm text-gray-200">
              /truth-timeline/Shipment/shipment-123
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function TruthTimelinePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Truth Timeline"
          description="Evidence + lineage timeline per entity (select an entity to view)"
          icon="ri-time-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TruthTimelineContent />
    </ErrorBoundary>
  );
}
