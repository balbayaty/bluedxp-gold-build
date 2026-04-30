"use client";

/**
 * QR Code Analytics Admin Dashboard
 * Comprehensive view of all QR code scans with location tracking, maps, and analytics
 */

import { useState, useEffect } from "react";
import { QRCodeAnalytics } from "@/lib/services/qr/documentQRService";

interface ScanEvent {
  id: string;
  qrId: string;
  documentId?: string;
  documentType?: string;
  timestamp: string;
  location: string;
  device: string;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  metadata?: any;
}

interface ScanStatistics {
  total: number;
  byLocation: Record<string, number>;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
}

export default function QRAnalyticsDashboard() {
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [statistics, setStatistics] = useState<ScanStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [qrAnalytics, setQrAnalytics] = useState<QRCodeAnalytics | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filter, setFilter] = useState({
    country: "",
    device: "",
    documentType: "",
  });

  useEffect(() => {
    loadScans();
  }, [dateRange]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "1000",
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate }),
      });

      const response = await fetch(`/api/qr/scans?${params}`);
      const data = await response.json();

      if (data.success) {
        setScans(data.scans || []);
        setStatistics(data.statistics || null);
      }
    } catch (error) {
      console.error("Error loading scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadQRAnalytics = async (qrId: string) => {
    try {
      const response = await fetch(`/api/qr/analytics?qrId=${qrId}`);
      const data = await response.json();

      if (data.success) {
        setQrAnalytics(data.analytics);
        setSelectedQR(qrId);
      }
    } catch (error) {
      console.error("Error loading QR analytics:", error);
    }
  };

  const filteredScans = scans.filter((scan) => {
    if (filter.country && !scan.location.includes(filter.country)) return false;
    if (filter.device && !scan.device.includes(filter.device)) return false;
    if (filter.documentType && scan.documentType !== filter.documentType)
      return false;
    return true;
  });

  // Extract country from location string
  const getCountryFromLocation = (location: string): string => {
    const parts = location.split(",");
    return parts[parts.length - 1]?.trim() || "Unknown";
  };

  // Extract city from location string
  const getCityFromLocation = (location: string): string => {
    const parts = location.split(",");
    return parts[0]?.trim() || "Unknown";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-qr-code-line text-purple-400"></i>
            QR Code Analytics Dashboard
          </h1>
          <p className="text-gray-400">
            Track all QR code scans with location, device, and IP information
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Total Scans</div>
              <div className="text-2xl font-bold text-purple-400">
                {statistics.total}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Unique Locations</div>
              <div className="text-2xl font-bold text-blue-400">
                {Object.keys(statistics.byLocation).length}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Countries</div>
              <div className="text-2xl font-bold text-green-400">
                {Object.keys(statistics.byCountry).length}
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Device Types</div>
              <div className="text-2xl font-bold text-yellow-400">
                {Object.keys(statistics.byDevice).length}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Date Range */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Filter by Country
              </label>
              <input
                type="text"
                placeholder="Country..."
                value={filter.country}
                onChange={(e) =>
                  setFilter({ ...filter, country: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Filter by Device
              </label>
              <input
                type="text"
                placeholder="Device..."
                value={filter.device}
                onChange={(e) =>
                  setFilter({ ...filter, device: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Document Type
              </label>
              <select
                value={filter.documentType}
                onChange={(e) =>
                  setFilter({ ...filter, documentType: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">All Types</option>
                <option value="msds">MSDS</option>
                <option value="certificate">Certificate</option>
                <option value="permit">Permit</option>
                <option value="label">Label</option>
                <option value="report">Report</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Countries Chart */}
        {statistics && Object.keys(statistics.byCountry).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <i className="ri-global-line text-blue-400"></i>
              Scans by Country
            </h2>
            <div className="space-y-3">
              {Object.entries(statistics.byCountry)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([country, count]) => (
                  <div key={country} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{country}</span>
                        <span className="text-sm text-gray-400">
                          {count} scans
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(count / statistics.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Scans Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <i className="ri-scan-line text-green-400"></i>
              Scan Events ({filteredScans.length})
            </h2>
            <button
              onClick={loadScans}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              <i className="ri-refresh-line mr-2"></i>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <i className="ri-loader-4-line animate-spin text-2xl mb-2"></i>
              <div>Loading scans...</div>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <i className="ri-inbox-line text-4xl mb-2"></i>
              <div>No scans found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      City
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Document
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredScans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-sm">
                        {new Date(scan.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <i className="ri-map-pin-line text-red-400"></i>
                          {scan.location || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getCountryFromLocation(scan.location)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getCityFromLocation(scan.location)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">
                        {scan.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <i className="ri-smartphone-line text-blue-400"></i>
                          {scan.device || "Unknown"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {scan.documentType ? (
                          <span className="px-2 py-1 bg-purple-900 text-purple-200 rounded text-xs">
                            {scan.documentType.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {scan.qrId && (
                          <button
                            onClick={() => loadQRAnalytics(scan.qrId)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                          >
                            View QR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* QR Code Details Modal */}
        {selectedQR && qrAnalytics && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold">QR Code Analytics</h2>
                <button
                  onClick={() => {
                    setSelectedQR(null);
                    setQrAnalytics(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700 rounded p-4">
                    <div className="text-sm text-gray-400 mb-1">
                      Total Scans
                    </div>
                    <div className="text-2xl font-bold">
                      {qrAnalytics.totalScans}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded p-4">
                    <div className="text-sm text-gray-400 mb-1">
                      Unique Scans
                    </div>
                    <div className="text-2xl font-bold">
                      {qrAnalytics.uniqueScans}
                    </div>
                  </div>
                </div>

                {qrAnalytics.locations &&
                  Object.keys(qrAnalytics.locations).length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold mb-3">Scans by Location</h3>
                      <div className="space-y-2">
                        {Object.entries(qrAnalytics.locations)
                          .sort(([, a], [, b]) => b - a)
                          .map(([location, count]) => (
                            <div
                              key={location}
                              className="flex justify-between bg-gray-700 rounded p-2"
                            >
                              <span>{location}</span>
                              <span className="font-bold">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {qrAnalytics.scanHistory &&
                  qrAnalytics.scanHistory.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-3">Recent Scans</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {qrAnalytics.scanHistory
                          .slice(0, 10)
                          .map((scan, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-700 rounded p-3 text-sm"
                            >
                              <div className="flex justify-between mb-1">
                                <span>
                                  {new Date(scan.timestamp).toLocaleString()}
                                </span>
                                <span className="text-gray-400">
                                  {scan.location}
                                </span>
                              </div>
                              <div className="text-gray-400 text-xs">
                                {scan.device} • {scan.ipAddress}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
