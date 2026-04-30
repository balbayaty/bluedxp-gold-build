/**
 * Proposal Creation Page - Redirects to Universal Builder
 * Consolidated: All proposal creation now uses the Universal Intelligent Proposal Builder
 * This page redirects to /proposals/universal/new for consistency
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function ProposalBuilder() {
  const router = useRouter();
  const { hasModuleAccess, canPerformAction } = useAuth();

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.proposals",
    undefined,
    "write",
  );

  useEffect(() => {
    // Redirect to universal builder (consolidated proposal creation)
    if (hasAccess && canCreate) {
      router.replace("/proposals/universal/new");
    }
  }, [router, hasAccess, canCreate]);

  if (!hasAccess || !canCreate) {
    return (
      <ProposalErrorBoundary>
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
      </ProposalErrorBoundary>
    );
  }

  // Show loading state while redirecting
  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Loading..."
        description="Redirecting to proposal builder"
        icon="ri-loader-4-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to proposal builder...
            </p>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
