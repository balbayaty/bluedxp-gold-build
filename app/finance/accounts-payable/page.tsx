/**
 * Accounts Payable Page
 * Professional AP management with vendor invoices and payment tracking
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiFileChartLine,
  RiSearchLine,
  RiFilterLine,
  RiFileDownloadLine,
} from "react-icons/ri";
import type { AccountsPayable } from "@/types/finance";

export default function AccountsPayablePage() {
  const [apRecords, setApRecords] = useState<AccountsPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [agingReport, setAgingReport] = useState<any>(null);

  useEffect(() => {
    fetchAPRecords();
    fetchAgingReport();
  }, []);

  const fetchAPRecords = async () => {
    try {
      const response = await fetch(
        "/api/finance/accounts-payable?tenantId=default",
      );
      const data = await response.json();
      if (data.success) {
        setApRecords(data.data);
      }
    } catch (error) {
      console.error("Error fetching AP records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgingReport = async () => {
    try {
      const response = await fetch(
        "/api/finance/reports?type=aging&tenantId=default",
      );
      const data = await response.json();
      if (data.success && data.data.accountsPayable) {
        setAgingReport(data.data.accountsPayable);
      }
    } catch (error) {
      console.error("Error fetching aging report:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiFileChartLine className="text-cyan-400" />
              Accounts Payable
            </h1>
            <p className="text-gray-400 mt-1">
              Vendor invoices and payment tracking
            </p>
          </div>
        </div>

        {/* Aging Report Summary */}
        {agingReport && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Current</p>
              <p className="text-2xl font-bold">
                {formatCurrency(agingReport.current)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">1-30 Days</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatCurrency(agingReport.days30)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">31-60 Days</p>
              <p className="text-2xl font-bold text-orange-400">
                {formatCurrency(agingReport.days60)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">61-90 Days</p>
              <p className="text-2xl font-bold text-red-400">
                {formatCurrency(agingReport.days90)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Over 90 Days</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(agingReport.over90)}
              </p>
            </div>
          </div>
        )}

        {/* AP Records Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">Vendor Invoices</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <RiFileDownloadLine className="text-xl" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <RiFilterLine className="text-xl" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-pulse text-gray-400">
                Loading invoices...
              </div>
            </div>
          ) : apRecords.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No vendor invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      Outstanding
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        {record.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">{record.vendorName}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(record.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(record.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        {formatCurrency(record.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {formatCurrency(record.outstandingAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            record.status === "PAID"
                              ? "bg-green-400/20 text-green-400"
                              : record.status === "OVERDUE"
                                ? "bg-red-400/20 text-red-400"
                                : record.status === "PARTIAL"
                                  ? "bg-yellow-400/20 text-yellow-400"
                                  : "bg-gray-400/20 text-gray-400"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
