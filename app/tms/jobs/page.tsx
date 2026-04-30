/**
 * TMS Jobs Management Page
 * Main page for managing transport jobs
 */

"use client";

import { useState, useEffect } from "react";
import { TransportJob, JobStatus, JobType } from "@/types/tms/transportJob";

export default function TMSJobsPage() {
  const [jobs, setJobs] = useState<TransportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);
  const [filters, setFilters] = useState({
    jobType: "" as JobType | "",
    jobStatus: "" as JobStatus | "",
    search: "",
  });

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: "flex-logistics",
        ...(filters.jobType && { jobType: filters.jobType }),
        ...(filters.jobStatus && { jobStatus: filters.jobStatus }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/tms/jobs?${params}`);
      const data = await response.json();
      setJobs(data.jobs || []);
      setIsDemoData(data.isDemoData || false);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = async () => {
    setSeeding(true);
    try {
      const response = await fetch("/api/tms/seed-sample-data", {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Successfully loaded ${result.jobs} sample jobs!\n\nJobs: ${result.jobs}\nLanes: ${result.lanes}\nPOD Records: ${result.podRecords}\nDetention: ${result.detentionRecords}\nTransit: ${result.transitRecords}`,
        );
        loadJobs(); // Reload to show the new data
      } else {
        alert(
          `❌ Failed to load sample data:\n${result.message}\n\nErrors: ${result.errors.join("\n")}`,
        );
      }
    } catch (error) {
      console.error("Error loading sample data:", error);
      alert(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white flex items-center gap-3">
            <i className="ri-truck-line text-blue-600"></i>
            Transport Jobs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track all transport jobs</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/tms/jobs/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <i className="ri-add-line text-xl"></i>
            Create Job
          </a>
          <a
            href="/tms/shipments/book"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-emerald-600 shadow-lg shadow-teal-500/25 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <i className="ri-ship-line text-lg"></i>
            Book Shipment
          </a>
          <a
            href="/tms/jobs/import"
            className="inline-flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="ri-upload-cloud-2-line"></i>
            Import
          </a>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {jobs.filter(j => j.jobStatus === JobStatus.IN_TRANSIT).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">In Transit</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {jobs.filter(j => j.jobStatus === JobStatus.COMPLETED || j.jobStatus === JobStatus.DELIVERED).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {jobs.filter(j => j.jobStatus === JobStatus.PENDING).length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Job name, number..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Job Type</label>
            <select
              value={filters.jobType}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  jobType: e.target.value as JobType | "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value={JobType.CROSS_BORDER}>Cross Border</option>
              <option value={JobType.INLAND_EXPORT}>Inland Export</option>
              <option value={JobType.INTER_CITY}>Inter City</option>
              <option value={JobType.INLAND_IMPORT}>Inland Import</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={filters.jobStatus}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  jobStatus: e.target.value as JobStatus | "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value={JobStatus.PENDING}>Pending</option>
              <option value={JobStatus.IN_TRANSIT}>In Transit</option>
              <option value={JobStatus.DELIVERED}>Delivered</option>
              <option value={JobStatus.COMPLETED}>Completed</option>
              <option value={JobStatus.REJECTED}>Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ jobType: "", jobStatus: "", search: "" })}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-refresh-line"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
                <i className="ri-truck-line text-5xl text-blue-600"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                No Transport Jobs Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Create your first transport job or import existing data to get started
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary: Create New Job */}
              <a
                href="/tms/jobs/new"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-3 font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 transform hover:scale-[1.02]"
              >
                <i className="ri-add-circle-line text-2xl"></i>
                <div className="text-left">
                  <div>Create New Job</div>
                  <div className="text-sm font-normal opacity-80">8-step wizard with all fields</div>
                </div>
              </a>

              {/* Secondary: Import CSV */}
              <a
                href="/tms/jobs/import"
                className="px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-3 font-medium transition-colors"
              >
                <i className="ri-upload-cloud-2-line text-xl text-gray-500"></i>
                Import from CSV
              </a>

              {/* Tertiary: Sample Data */}
              <button
                onClick={loadSampleData}
                disabled={seeding}
                className="px-6 py-4 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-500 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium transition-colors"
              >
                {seeding ? (
                  <>
                    <i className="ri-loader-4-line text-xl animate-spin"></i>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="ri-magic-line text-xl text-purple-500"></i>
                    Load Sample Data
                  </>
                )}
              </button>
            </div>

            {/* Quick Start Guide */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 text-left">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-file-add-line text-blue-600 text-xl"></i>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Create Manually</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use our 8-step wizard to create jobs with full details</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 text-left">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-file-excel-2-line text-green-600 text-xl"></i>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">Bulk Import</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Import from CSV/Excel with Zoho format support</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 text-left">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mb-3">
                  <i className="ri-api-line text-purple-600 text-xl"></i>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-1">API Integration</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect to Zoho, SAP, or other systems</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isDemoData && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-center">
                  <div className="text-yellow-700">
                    <p className="font-medium">📊 Showing Demo Data</p>
                    <p className="text-sm">
                      These are sample jobs. Click "Load Sample Data" to save
                      them to the database.
                    </p>
                  </div>
                  <button
                    onClick={loadSampleData}
                    disabled={seeding}
                    className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {seeding ? "Saving..." : "Save to Database"}
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Origin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lane
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/tms/jobs/${job.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {job.jobNumber}
                        </a>
                      </td>
                      <td className="px-6 py-4">{job.jobName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {job.jobType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            job.jobStatus === JobStatus.COMPLETED
                              ? "bg-green-100 text-green-800"
                              : job.jobStatus === JobStatus.IN_TRANSIT
                                ? "bg-yellow-100 text-yellow-800"
                                : job.jobStatus === JobStatus.REJECTED
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {job.jobStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {job.shipmentOrigin || job.polLocation || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {job.shipmentDestination || job.podLocation || "-"}
                      </td>
                      <td className="px-6 py-4">{job.laneName || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/tms/jobs/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </a>
                        <a
                          href={`/tms/jobs/${job.id}/pod`}
                          className="text-green-600 hover:text-green-800"
                        >
                          POD
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
