/**
 * Digital Signatures Dashboard
 * Main dashboard for digital signature management
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DigitalSignaturesDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    pendingSignatures: 0,
    completedSignatures: 0,
    activeWorkflows: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats
    fetch("/api/v1/signatures/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats({
            totalDocuments: data.count || 0,
            pendingSignatures: 0, // TODO: Fetch from pending requests
            completedSignatures: 0, // TODO: Fetch from completed signatures
            activeWorkflows: 0, // TODO: Fetch from active workflows
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Digital Signatures</h1>
        <p className="text-gray-600 mt-2">
          Manage documents, workflows, and signatures with court-admissible
          digital signatures
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDocuments}
              </p>
            </div>
            <div className="text-3xl">📄</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Signatures</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.pendingSignatures}
              </p>
            </div>
            <div className="text-3xl">✍️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completedSignatures}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.activeWorkflows}
              </p>
            </div>
            <div className="text-3xl">🔄</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/digital-signatures/documents")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Upload Document
          </button>
          <button
            onClick={() => router.push("/digital-signatures/workflows/create")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Create Workflow
          </button>
          <button
            onClick={() => router.push("/digital-signatures/requests")}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
          >
            My Signatures
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold">Court-Admissible Signatures</h3>
            <p className="text-sm text-gray-600">
              SES, AES, and QES signatures compliant with Saudi Electronic
              Transactions Law
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold">Saudi QES Integration</h3>
            <p className="text-sm text-gray-600">
              Nafath and emdha integration for Qualified Electronic Signatures
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold">Workflow Management</h3>
            <p className="text-sm text-gray-600">
              Sequential, parallel, and custom signing workflows
            </p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="font-semibold">Audit Trail</h3>
            <p className="text-sm text-gray-600">
              Hash-chained, tamper-evident audit logs for compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
