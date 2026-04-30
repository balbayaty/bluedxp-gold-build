/**
 * TMS - Create New Transport Job Page
 * 
 * Comprehensive 8-step wizard for creating transport jobs
 * with all 80+ fields, validation, and Saudi regulatory integration
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateTransportJobForm from "@/components/tms/CreateTransportJobForm";
import { TransportJob } from "@/types/tms/transportJob";

export default function NewTransportJobPage() {
  const router = useRouter();
  
  const handleSuccess = (job: TransportJob) => {
    // Navigate to the job detail page after successful creation
    router.push(`/tms/jobs/${job.id}`);
  };

  const handleCancel = () => {
    // Navigate back to jobs list
    router.push("/tms/jobs");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Page Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <i className="ri-arrow-left-line text-xl"></i>
                <span className="hidden sm:inline">Back to Jobs</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="ri-add-circle-line text-blue-600"></i>
                  Create Transport Job
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  Fill in the details to create a new transport job
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <a
                href="/tms/jobs"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <i className="ri-list-check"></i>
                All Jobs
              </a>
              <a
                href="/tms/shipments/book"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="ri-ship-line"></i>
                Book Shipment
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Mode Banner */}
      <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <i className="ri-lightbulb-line text-green-600"></i>
            <span className="text-sm text-green-800 dark:text-green-300">
              <strong>Pro tip:</strong> Your progress is auto-saved. You can leave and return to continue where you left off.
            </span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateTransportJobForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isModal={false}
        />
      </div>
    </div>
  );
}
