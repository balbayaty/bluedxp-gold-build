/**
 * CRM Dashboard Page
 * World-class CRM dashboard with pipeline, KPIs, and analytics
 * 
 * INTEGRATED: Now calls real /api/crm/dashboard API
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiDashboardLine,
  RiUserAddLine,
  RiFocus2Line,
  RiMoneyDollarCircleLine,
  RiArrowUpLine,
  RiLoader4Line,
  RiAlertLine,
} from "react-icons/ri";
import type { UnifiedCRMData } from "@/types/crm";

interface CRMDashboardData extends UnifiedCRMData {
  kpis?: {
    totalLeads: number;
    activeOpportunities: number;
    pipelineValue: number;
    weightedPipeline: number;
    winRate: string;
  };
}

export default function CRMDashboardPage() {
  const [crmData, setCrmData] = useState<CRMDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call real CRM dashboard API
      const response = await fetch("/api/crm/dashboard?tenantId=default");
      const result = await response.json();
      
      if (result.success && result.data) {
        setCrmData(result.data);
      } else {
        // Fallback to empty data structure if API fails
        setCrmData({
          accounts: [],
          leads: [],
          opportunities: [],
          contacts: [],
          activities: [],
          forecast: null,
          kpis: {
            totalLeads: 0,
            activeOpportunities: 0,
            pipelineValue: 0,
            weightedPipeline: 0,
            winRate: "0",
          },
        });
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
      setError("Failed to load CRM data. Please try again.");
      // Set empty data on error
      setCrmData({
        accounts: [],
        leads: [],
        opportunities: [],
        contacts: [],
        activities: [],
        forecast: null,
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-4xl text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <RiAlertLine className="text-red-400 text-xl" />
            <p className="text-red-300">{error}</p>
            <button 
              onClick={fetchCRMData}
              className="ml-auto px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiDashboardLine className="text-purple-400" />
              CRM Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Sales pipeline and customer management
            </p>
          </div>
          <button 
            onClick={fetchCRMData}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg flex items-center gap-2 transition-all"
          >
            <RiLoader4Line className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-400/10 rounded-xl">
                <RiUserAddLine className="text-purple-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Total Leads</p>
              <p className="text-2xl font-bold">{crmData?.leads.length || 0}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-400/10 rounded-xl">
                <RiFocus2Line className="text-purple-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Active Opportunities</p>
              <p className="text-2xl font-bold">
                {crmData?.opportunities.filter(
                  (o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST",
                ).length || 0}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-400/10 rounded-xl">
                <RiMoneyDollarCircleLine className="text-purple-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Pipeline Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  crmData?.opportunities
                    .filter(
                      (o) =>
                        o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST",
                    )
                    .reduce((sum, o) => sum + o.value, 0) || 0,
                )}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-400/10 rounded-xl">
                <RiArrowUpLine className="text-purple-400 text-2xl" />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Win Rate</p>
              <p className="text-2xl font-bold">
                {crmData?.opportunities.length
                  ? (
                      (crmData.opportunities.filter(
                        (o) => o.stage === "CLOSED_WON",
                      ).length /
                        crmData.opportunities.filter(
                          (o) =>
                            o.stage === "CLOSED_WON" ||
                            o.stage === "CLOSED_LOST",
                        ).length) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Sales Pipeline</h2>
          <div className="grid grid-cols-5 gap-4">
            {[
              "DISCOVERY",
              "QUALIFICATION",
              "PROPOSAL",
              "NEGOTIATION",
              "CLOSED_WON",
            ].map((stage) => (
              <div key={stage} className="text-center">
                <p className="text-sm text-gray-400 mb-2">{stage}</p>
                <p className="text-2xl font-bold">
                  {crmData?.opportunities.filter((o) => o.stage === stage)
                    .length || 0}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
