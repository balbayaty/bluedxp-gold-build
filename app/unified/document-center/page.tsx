/**
 * 📁 Unified Document Center Page
 * Consolidated document management and intelligence
 */

"use client";

import PageTemplate from "@/components/PageTemplate";
import UnifiedDocumentCenter from "@/components/unified/UnifiedDocumentCenter";

export default function UnifiedDocumentCenterPage() {
  return (
    <PageTemplate
      title="Unified Document Center"
      description="Intelligent document upload, classification, compliance checking, and approval routing"
      icon="ri-file-text-line"
    >
      <UnifiedDocumentCenter />
    </PageTemplate>
  );
}
