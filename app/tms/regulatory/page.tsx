/**
 * TMS Regulatory Integration Page
 * TGA, Daleeli, and Bayan integration status
 */

"use client";

import { useState } from "react";

export default function TMSRegulatoryPage() {
  const [bayanNumber, setBayanNumber] = useState("");
  const [bayanStatus, setBayanStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkBayan = async () => {
    if (!bayanNumber) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tms/regulatory/bayan/${bayanNumber}`);
      const data = await response.json();
      setBayanStatus(data);
    } catch (error) {
      console.error("Error checking Bayan:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Regulatory Integration</h1>
        <p className="text-gray-600">
          TGA, Daleeli, and Bayan system integration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">TGA Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Transport General Authority verification for vehicles and drivers
          </p>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Vehicle Verification</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Driver License Verification</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Permit Verification</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Daleeli Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Business registration and license verification
          </p>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Business Registration</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">License Verification</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Business Search</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Bayan Integration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Customs clearance and declaration status
          </p>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Bayan Status Tracking</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">Manifest Status</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">DO/SI Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bayan Status Checker */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Check Bayan Status</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={bayanNumber}
            onChange={(e) => setBayanNumber(e.target.value)}
            placeholder="Enter Bayan Number"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={checkBayan}
            disabled={!bayanNumber || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>

        {bayanStatus && (
          <div
            className={`mt-4 p-4 rounded-md ${
              bayanStatus.verified
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3 className="font-medium mb-2">
              {bayanStatus.verified ? "✅ Verified" : "❌ Not Verified"}
            </h3>
            {bayanStatus.data && (
              <div className="text-sm space-y-1">
                <p>
                  <strong>Status:</strong> {bayanStatus.data.status}
                </p>
                {bayanStatus.data.submissionDate && (
                  <p>
                    <strong>Submission Date:</strong>{" "}
                    {new Date(
                      bayanStatus.data.submissionDate,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            {bayanStatus.errors && bayanStatus.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                {bayanStatus.errors.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
