/**
 * Workflow Management Page
 * Visual workflow builder and automation
 */

"use client";

import WorkflowBuilder from "@/components/trade-compliance/WorkflowBuilder";
import PageTemplate from "@/components/PageTemplate";

export default function WorkflowsPage() {
  return (
    <PageTemplate
      title="Workflow Automation"
      description="Design and automate trade compliance processes with visual workflow builder"
    >
      <WorkflowBuilder />
    </PageTemplate>
  );
}
