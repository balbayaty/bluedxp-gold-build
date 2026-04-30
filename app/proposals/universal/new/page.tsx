/**
 * Universal Intelligent Proposal Creation Page
 * Works across all modules
 * End-user ready with help and onboarding
 */

"use client";

import { useSearchParams } from "next/navigation";
import UniversalIntelligentProposalBuilder from "@/components/proposals/UniversalIntelligentProposalBuilder";
import ProposalOnboardingTour from "@/components/proposals/ProposalOnboardingTour";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import PageTemplate from "@/components/PageTemplate";
import { useAuth } from "@/contexts/AuthContext";

export default function UniversalProposalNewPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template");
  const { hasModuleAccess, canPerformAction } = useAuth();

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.proposals",
    undefined,
    "write",
  );

  if (!hasAccess || !canCreate) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to create proposals"
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
              You do not have the required permissions to create proposals.
              Please contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <ProposalOnboardingTour />
      <UniversalIntelligentProposalBuilder
        templateId={templateId || undefined}
      />
    </ProposalErrorBoundary>
  );
}
