/**
 * CRM Leads Page
 * Professional lead management with scoring and conversion
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiUserAddLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiStarLine,
} from "react-icons/ri";
import type { Lead } from "@/types/crm";

export default function CRMLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/crm/leads?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusColor = (status: Lead["status"]) => {
    const colors = {
      NEW: "bg-blue-400/20 text-blue-400",
      CONTACTED: "bg-cyan-400/20 text-cyan-400",
      QUALIFIED: "bg-green-400/20 text-green-400",
      CONVERTED: "bg-purple-400/20 text-purple-400",
      LOST: "bg-red-400/20 text-red-400",
    };
    return colors[status] || "bg-gray-400/20 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiUserAddLine className="text-purple-400" />
              Leads
            </h1>
            <p className="text-gray-400 mt-1">Lead management and conversion</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Lead
          </button>
        </div>

        {/* Leads Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold">All Leads</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <RiFilterLine className="text-xl" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <RiSearchLine className="text-xl" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-pulse text-gray-400">
                Loading leads...
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Score
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        {lead.firstName} {lead.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {lead.company || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">{lead.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <RiStarLine
                            className={`${getScoreColor(lead.score)}`}
                          />
                          <span
                            className={`font-semibold ${getScoreColor(lead.score)}`}
                          >
                            {lead.score}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}
                        >
                          {lead.status}
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
