/**
 * TMS - Edit Transport Job Page
 * 
 * Loads existing job data and pre-fills the comprehensive 8-step wizard form
 * for editing.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CreateTransportJobForm from "@/components/tms/CreateTransportJobForm";
import { TransportJob } from "@/types/tms/transportJob";

export default function EditTransportJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<TransportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tms/jobs/${jobId}?tenantId=flex-logistics`);
      if (!response.ok) {
        throw new Error("Failed to load job");
      }
      const data = await response.json();
      setJob(data);
    } catch (err) {
      console.error("Error loading job:", err);
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedJob: TransportJob) => {
    // Navigate to the job detail page after successful update
    router.push(`/tms/jobs/${updatedJob.id}`);
  };

  const handleCancel = () => {
    // Navigate back to job detail page
    router.push(`/tms/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <i className="ri-loader-4-line text-3xl text-blue-600 animate-spin"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Job Data</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch the job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <i className="ri-error-warning-line text-3xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Failed to Load Job</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{error || "The requested job could not be found."}</p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={loadJob}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Retry
            </button>
            <a
              href="/tms/jobs"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Jobs
            </a>
          </div>
        </div>
      </div>
    );
  }

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
                <span className="hidden sm:inline">Back to Job</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="ri-edit-line text-blue-600"></i>
                  Edit Transport Job
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                  {job.jobName} • {job.jobNumber}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <a
                href={`/tms/jobs/${jobId}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <i className="ri-eye-line"></i>
                View Job
              </a>
              <a
                href="/tms/jobs"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <i className="ri-list-check"></i>
                All Jobs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <i className="ri-information-line text-blue-600"></i>
            <span className="text-sm text-blue-800 dark:text-blue-300">
              You are editing job <strong>{job.jobNumber}</strong>. Changes will be saved when you complete the wizard.
            </span>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateTransportJobForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialData={job}
          isModal={false}
        />
      </div>
    </div>
  );
}
