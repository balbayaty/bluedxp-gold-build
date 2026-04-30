/**
 * ERPNext Compliance Tracker Page
 *
 * Track and manage compliance records with ERPNext integration
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import { ComplianceTracker } from "@/components/erpnext";

export default function ERPNextCompliancePage() {
  return (
    <PageTemplate
      title="ERPNext Compliance Tracker"
      description="Track and manage compliance records with ERPNext integration"
      icon="ri-shield-check-line"
    >
      <ComplianceTracker />
    </PageTemplate>
  );
}
