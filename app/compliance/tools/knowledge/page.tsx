"use client";

/**
 * Local Knowledge Browser Page
 * Browse and search deep local knowledge and regulations
 */

import LocalKnowledgeBrowser from "@/components/compliance/tools/LocalKnowledgeBrowser";
import PageTemplate from "@/components/PageTemplate";

export default function LocalKnowledgePage() {
  return (
    <PageTemplate
      title="Local Knowledge Browser"
      description="Browse and search deep local knowledge, regulations, and compliance information by regulatory authority. Semantic search with vector embeddings for intelligent discovery."
      icon="ri-book-open-line"
      systemInfo={{
        custom: "Hazalyze Local Knowledge Base",
      }}
      stats={[]}
    >
      <LocalKnowledgeBrowser />
    </PageTemplate>
  );
}
