/**
 * CRM Opportunities Page
 * Professional sales pipeline with Kanban view
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiFocus2Line,
  RiAddLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import type { Opportunity } from "@/types/crm";

export default function CRMOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch("/api/crm/opportunities?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setOpportunities(data.data);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
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

  const stages: Opportunity["stage"][] = [
    "DISCOVERY",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ];

  const getStageColor = (stage: Opportunity["stage"]) => {
    const colors = {
      DISCOVERY: "border-blue-400/50",
      QUALIFICATION: "border-cyan-400/50",
      PROPOSAL: "border-yellow-400/50",
      NEGOTIATION: "border-orange-400/50",
      CLOSED_WON: "border-green-400/50",
      CLOSED_LOST: "border-red-400/50",
    };
    return colors[stage] || "border-gray-400/50";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiFocus2Line className="text-purple-400" />
              Opportunities
            </h1>
            <p className="text-gray-400 mt-1">Sales pipeline management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setView("kanban")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  view === "kanban"
                    ? "bg-purple-400/20 text-purple-400"
                    : "text-gray-400"
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 rounded-lg transition-all ${
                  view === "list"
                    ? "bg-purple-400/20 text-purple-400"
                    : "text-gray-400"
                }`}
              >
                List
              </button>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
              <RiAddLine />
              Create Opportunity
            </button>
          </div>
        </div>

        {/* Kanban View */}
        {view === "kanban" ? (
          <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const stageOpportunities = opportunities.filter(
                (o) => o.stage === stage,
              );
              const stageValue = stageOpportunities.reduce(
                (sum, o) => sum + o.value,
                0,
              );

              return (
                <div key={stage} className="min-w-[250px]">
                  <div
                    className={`bg-white/5 backdrop-blur-xl rounded-2xl border ${getStageColor(stage)} p-4`}
                  >
                    <div className="mb-4">
                      <h3 className="font-bold text-sm mb-1">
                        {stage.replace("_", " ")}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {stageOpportunities.length} opps •{" "}
                        {formatCurrency(stageValue)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {stageOpportunities.map((opp) => (
                        <div
                          key={opp.id}
                          className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer"
                        >
                          <p className="font-semibold text-sm mb-1">
                            {opp.name}
                          </p>
                          <p className="text-xs text-gray-400 mb-2">
                            {opp.accountName}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold">
                              {formatCurrency(opp.value)}
                            </p>
                            <span className="text-xs text-gray-400">
                              {opp.probability}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Opportunity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Account
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Stage
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Probability
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Close Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold">
                        {opp.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {opp.accountName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-400/20 text-purple-400">
                          {opp.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold">
                        {formatCurrency(opp.value)}
                      </td>
                      <td className="px-6 py-4 text-sm">{opp.probability}%</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(opp.expectedCloseDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
