/**
 * 👥 Unified Customer Center Page
 * Consolidated customer intelligence and relationship management
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import UnifiedCustomerCenter from "@/components/unified/UnifiedCustomerCenter";

export default function UnifiedCustomerCenterPage() {
  return (
    <PageTemplate
      title="Unified Customer Center"
      description="360° customer view with AI-powered insights, predictive analytics, and personalized experiences"
      icon="ri-user-heart-line"
    >
      <UnifiedCustomerCenter />
    </PageTemplate>
  );
}
