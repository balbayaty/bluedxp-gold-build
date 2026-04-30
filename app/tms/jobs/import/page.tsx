/**
 * TMS CSV Import Page
 * Import Zoho CSV data into TMS
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TMSImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", "flex-logistics");
      formData.append("createdBy", "current-user-id"); // TODO: Get from auth context

      const response = await fetch("/api/tms/jobs/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (data.success) {
          setTimeout(() => {
            router.push("/tms/jobs");
          }, 3000);
        }
      } else {
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, error: data.error || "Import failed" }],
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [
          {
            row: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Import Jobs from CSV</h1>
        <p className="text-gray-600">
          Import transport jobs from Zoho CSV export
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border rounded-md"
            disabled={loading}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium mb-2">Import Information</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              • Tenant: <strong>Flex Logistics</strong>
            </li>
            <li>• All job fields from Zoho CSV will be imported</li>
            <li>
              • Detention and transit times will be calculated automatically
            </li>
            <li>• Lanes will be created/updated automatically</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Importing..." : "Import CSV"}
          </button>
          <a
            href="/tms/jobs"
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </a>
        </div>

        {result && (
          <div
            className={`mt-6 p-4 rounded-md ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <h3
              className={`font-medium mb-2 ${
                result.success ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.success ? "✅ Import Successful" : "❌ Import Failed"}
            </h3>
            <div className="text-sm space-y-1">
              <p>
                Imported: <strong>{result.imported}</strong> jobs
              </p>
              {result.failed > 0 && (
                <p>
                  Failed: <strong>{result.failed}</strong> jobs
                </p>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="max-h-48 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-sm text-red-700">
                      ... and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {result.success && (
              <p className="mt-4 text-sm text-green-700">
                Redirecting to jobs list in 3 seconds...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
