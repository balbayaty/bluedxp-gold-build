"use client";

/**
 * 🔒 PERMISSION SECURITY SCANNER COMPONENT
 *
 * UI for scanning permission configurations for security vulnerabilities
 */

import { useState } from "react";
import {
  permissionSecurityScanner,
  type SecurityScanResult,
  type SecurityMetrics,
} from "@/lib/services/permissions";

export default function PermissionSecurityScanner() {
  const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await permissionSecurityScanner.scan({
        includeCompliance: true,
        deepScan: true,
      });
      setScanResult(result);

      const metricsData = await permissionSecurityScanner.getMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error("Security scan failed:", error);
      alert("Security scan failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Security Scanner</h2>
        <div className="space-y-4">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isScanning ? "Scanning..." : "Run Security Scan"}
          </button>

          {scanResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Security Score</span>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">
                    {scanResult.overallScore}/100
                  </span>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      scanResult.riskLevel === "critical"
                        ? "bg-red-200 text-red-800"
                        : scanResult.riskLevel === "high"
                          ? "bg-orange-200 text-orange-800"
                          : scanResult.riskLevel === "medium"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                    }`}
                  >
                    {scanResult.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              {metrics && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold">{metrics.totalUsers}</p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-gray-600">Over-Privileged</p>
                    <p className="text-2xl font-bold text-red-600">
                      {metrics.overPrivilegedUsers}
                    </p>
                  </div>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-sm text-gray-600">Compliance Score</p>
                    <p className="text-2xl font-bold text-green-600">
                      {metrics.complianceScore}/100
                    </p>
                  </div>
                </div>
              )}

              {scanResult.vulnerabilities.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Vulnerabilities</h3>
                  <div className="space-y-2">
                    {scanResult.vulnerabilities.map((vuln, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-red-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{vuln.title}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              vuln.severity === "critical"
                                ? "bg-red-200 text-red-800"
                                : vuln.severity === "high"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {vuln.description}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Remediation: {vuln.remediation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResult.complianceIssues.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Compliance Issues</h3>
                  <div className="space-y-2">
                    {scanResult.complianceIssues.map((issue, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-yellow-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            {issue.standard}: {issue.requirement}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              issue.severity === "critical"
                                ? "bg-red-200 text-red-800"
                                : issue.severity === "high"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {issue.description}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Remediation: {issue.remediation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanResult.recommendations.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <div className="space-y-2">
                    {scanResult.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-blue-50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{rec.title}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              rec.priority === "critical"
                                ? "bg-red-200 text-red-800"
                                : rec.priority === "high"
                                  ? "bg-orange-200 text-orange-800"
                                  : "bg-yellow-200 text-yellow-800"
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {rec.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Action: {rec.action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
