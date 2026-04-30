/**
 * Integrations Management Page
 * Main page for managing external integrations
 */

"use client";

import React from "react";
import IntegrationManager from "@/components/integrations/IntegrationManager";

export default function IntegrationsPage() {
  // In production, get tenantId from auth context
  const tenantId = "default-tenant"; // Replace with actual tenant ID from context

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <IntegrationManager tenantId={tenantId} />
      </div>
    </div>
  );
}
