/**
 * DMARC Reports Viewer
 * View and analyze DMARC aggregate reports
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiFileChartLine,
  RiCalendarLine,
  RiDownloadLine,
} from "react-icons/ri";

interface DMARCReport {
  id: string;
  domain: string;
  dateRange: {
    begin: string;
    end: string;
  };
  totalMessages: number;
  passed: number;
  failed: number;
}

export default function DMARCReportsPage() {
  const [reports, setReports] = useState<DMARCReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const response = await fetch(
        "/api/dmarc-monitoring/aggregates?domain=scsflex.com",
        { credentials: "include" },
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DMARC Reports</h1>
          <p className="text-gray-400">
            View and analyze DMARC aggregate reports
          </p>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{report.domain}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(report.dateRange.begin).toLocaleDateString()} -{" "}
                    {new Date(report.dateRange.end).toLocaleDateString()}
                  </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-400/50 transition-colors">
                  <RiDownloadLine /> Download
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Total Messages
                  </div>
                  <div className="text-2xl font-bold">
                    {report.totalMessages}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Passed</div>
                  <div className="text-2xl font-bold text-green-400">
                    {report.passed}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Failed</div>
                  <div className="text-2xl font-bold text-red-400">
                    {report.failed}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No DMARC reports available yet. Reports will appear here once
              processed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
