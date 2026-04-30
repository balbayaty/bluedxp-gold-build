/**
 * Proposal Detail Page - Redirects to Enhanced View
 * Consolidated: All proposal detail views now use the enhanced page
 * This page redirects to /proposals/[id]/enhanced for consistency
 */

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasModuleAccess } = useAuth();
  const proposalId = params.id as string;

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  useEffect(() => {
    if (!hasAccess) {
      return;
    }
    // Redirect to enhanced detail page (consolidated proposal detail view)
    router.replace(`/proposals/${proposalId}/enhanced`);
  }, [proposalId, router, hasAccess]);

  if (!hasAccess) {
    return (
      <ProposalErrorBoundary>
        <PageTemplate
          title="Access Denied"
          description="You do not have permission to view this proposal"
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
                You do not have the required permissions to view proposals.
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
        description="Redirecting to proposal details"
        icon="ri-loader-4-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to proposal details...
            </p>
          </div>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
