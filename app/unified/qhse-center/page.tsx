/**
 * 🎯 Unified QHSE Center Page
 * Consolidated QHSE intelligence and management
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import UnifiedQHSECenter from "@/components/unified/UnifiedQHSECenter";

export default function UnifiedQHSECenterPage() {
  return (
    <PageTemplate
      title="Unified QHSE Center"
      description="Unified safety, health, environment, and quality management with AI-powered insights"
      icon="ri-shield-check-line"
    >
      <UnifiedQHSECenter />
    </PageTemplate>
  );
}
