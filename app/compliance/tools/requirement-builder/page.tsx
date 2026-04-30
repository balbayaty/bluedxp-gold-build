"use client";

/**
 * Requirement Builder Page
 * Interactive tool for building custom compliance requirements
 */

import RequirementBuilder from "@/components/compliance/tools/RequirementBuilder";
import PageTemplate from "@/components/PageTemplate";
import { useRouter } from "next/navigation";

export default function RequirementBuilderPage() {
  const router = useRouter();

  const handleComplete = (requirementId: string) => {
    // Navigate back to compliance dashboard or show success
    router.push("/compliance");
  };

  return (
    <PageTemplate
      title="Requirement Builder"
      description="Build custom compliance requirements with deep local knowledge integration. Create requirements with authority hierarchy, local regulations, and validation rules."
      icon="ri-file-add-line"
      systemInfo={{
        custom: "Hazalyze Compliance Requirement Builder",
      }}
      stats={[]}
    >
      <RequirementBuilder onComplete={handleComplete} />
    </PageTemplate>
  );
}
