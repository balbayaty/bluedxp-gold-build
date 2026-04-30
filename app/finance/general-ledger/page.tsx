/**
 * General Ledger Page
 * Professional GL management with journal entries, account balances, and trial balance
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiBookLine,
  RiAddLine,
  RiSearchLine,
  RiFileDownloadLine,
  RiFilterLine,
} from "react-icons/ri";
import type { GeneralLedgerEntry } from "@/types/finance";

export default function GeneralLedgerPage() {
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    accountCode: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  useEffect(() => {
    fetchGLEntries();
  }, [filters]);

  const fetchGLEntries = async () => {
    try {
      const params = new URLSearchParams({
        tenantId: "default",
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });
      const response = await fetch(`/api/finance/general-ledger?${params}`);
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error("Error fetching GL entries:", error);
    } finally {
      setLoading(false);
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
              <RiBookLine className="text-cyan-400" />
              General Ledger
            </h1>
            <p className="text-gray-400 mt-1">
              Journal entries and account balances
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            New Journal Entry
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Account Code
              </label>
              <input
                type="text"
                value={filters.accountCode}
                onChange={(e) =>
                  setFilters({ ...filters, accountCode: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
                placeholder="e.g., 1000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="POSTED">Posted</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
          </div>
        </div>

        {/* GL Entries Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">Journal Entries</h2>
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
                Loading entries...
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No journal entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Entry #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Debit Account
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Credit Account
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">{entry.entryNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">{entry.description}</td>
                      <td className="px-6 py-4 text-sm text-cyan-400">
                        {entry.debitAccount}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-400">
                        {entry.creditAccount}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            entry.status === "POSTED"
                              ? "bg-green-400/20 text-green-400"
                              : entry.status === "DRAFT"
                                ? "bg-yellow-400/20 text-yellow-400"
                                : "bg-red-400/20 text-red-400"
                          }`}
                        >
                          {entry.status}
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
