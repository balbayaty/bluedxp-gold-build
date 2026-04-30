/**
 * Proposal Templates Page
 * Comprehensive template library with ready-made templates
 */

"use client";

import { useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import TemplateLibrary from "@/components/proposals/TemplateLibrary";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function TemplatesPage() {
  const { hasModuleAccess, canPerformAction } = useAuth();

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.proposals",
    undefined,
    "write",
  );

  if (!hasAccess) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to view proposal templates"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to view proposal
              templates. Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Proposal Templates"
        description="Choose from our comprehensive library of ready-made proposal templates"
        icon="ri-layout-4-line"
      >
        <TemplateLibrary showCreateButton={canCreate} />
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
