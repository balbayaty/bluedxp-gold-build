/**
 * Workflow Builder Page
 * Visual drag-and-drop workflow creation
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkflowBuilder from "@/components/process-lifecycle/workflow/WorkflowBuilder";
import type { Workflow } from "@/lib/services/process-lifecycle";
import { workflowService } from "@/lib/services/process-lifecycle";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowId = searchParams.get("id");
  const [initialWorkflow, setInitialWorkflow] = useState<
    Partial<Workflow> | undefined
  >(undefined);
  const [loading, setLoading] = useState(!!workflowId);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow();
    }
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      setLoading(true);
      const workflow = await workflowService.getWorkflow(workflowId!);
      if (workflow) {
        setInitialWorkflow(workflow);
      }
    } catch (error) {
      console.error("Error loading workflow:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (workflow: Workflow) => {
    // Redirect to workflows page after save
    router.push(`/process-lifecycle/workflows`);
  };

  const handleCancel = () => {
    router.push("/process-lifecycle/workflows");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className="text-[#9ca3af]">Loading Workflow...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="text-red-400 p-4">Error loading Workflow Builder</div>
      }
    >
      <div className="h-screen flex flex-col">
        <WorkflowBuilder
          workflowId={workflowId || undefined}
          initialWorkflow={initialWorkflow}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </ErrorBoundary>
  );
}
