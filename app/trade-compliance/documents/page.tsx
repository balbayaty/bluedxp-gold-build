/**
 * Document Intelligence Page
 * OCR and document processing for trade compliance
 */

"use client";

import DocumentIntelligence from "@/components/trade-compliance/DocumentIntelligence";
import PageTemplate from "@/components/PageTemplate";

export default function DocumentsPage() {
  return (
    <PageTemplate
      title="Document Intelligence"
      description="AI-powered OCR and document extraction for trade compliance documents"
    >
      <DocumentIntelligence />
    </PageTemplate>
  );
}
