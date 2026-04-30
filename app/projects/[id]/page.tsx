/**
 * Project Details Page
 * Professional project details with tabs
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  RiFolderLine,
  RiBarChartBoxLine,
  RiUserLine,
  RiMoneyDollarCircleLine,
  RiCheckboxLine,
} from "react-icons/ri";
import type { UnifiedProjectData } from "@/types/project-management";

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [projectData, setProjectData] = useState<UnifiedProjectData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "gantt" | "resources" | "budget" | "tasks"
  >("overview");

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setProjectData(data.data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
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
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse text-gray-400">Loading project...</div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Project not found</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", name: "Overview", icon: RiFolderLine },
    { id: "gantt", name: "Gantt Chart", icon: RiBarChartBoxLine },
    { id: "resources", name: "Resources", icon: RiUserLine },
    { id: "budget", name: "Budget", icon: RiMoneyDollarCircleLine },
    { id: "tasks", name: "Tasks", icon: RiCheckboxLine },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <RiFolderLine className="text-orange-400" />
            {projectData.project.name}
          </h1>
          <p className="text-gray-400 mt-1">
            {projectData.project.description}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-orange-400/20 text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Icon />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <p className="text-lg font-bold">
                    {projectData.project.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Budget</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(projectData.project.budgetedCost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Tasks</p>
                  <p className="text-lg font-bold">
                    {projectData.tasks.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "gantt" && (
            <div>
              <p className="text-gray-400">
                Gantt chart will be displayed here
              </p>
            </div>
          )}

          {activeTab === "resources" && (
            <div>
              <p className="text-gray-400">
                Resource allocation will be displayed here
              </p>
            </div>
          )}

          {activeTab === "budget" && projectData.budget && (
            <div>
              <p className="text-gray-400 mb-4">
                Budget: {formatCurrency(projectData.budget.totalBudgeted)}
              </p>
              <p className="text-gray-400">
                Actual: {formatCurrency(projectData.budget.totalActual)}
              </p>
            </div>
          )}

          {activeTab === "tasks" && (
            <div>
              <p className="text-gray-400 mb-4">
                Tasks: {projectData.tasks.length}
              </p>
              <p className="text-gray-400">
                Work Orders: {projectData.workOrders.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
