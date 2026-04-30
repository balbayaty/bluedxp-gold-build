/**
 * Projects Page
 * Professional project list and management
 */

"use client";

import { useEffect, useState } from "react";
import {
  RiFolderLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
} from "react-icons/ri";
import type { Project } from "@/types/project-management";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
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

  const getStatusColor = (status: Project["status"]) => {
    const colors = {
      PLANNING: "bg-blue-400/20 text-blue-400",
      ACTIVE: "bg-green-400/20 text-green-400",
      ON_HOLD: "bg-yellow-400/20 text-yellow-400",
      COMPLETED: "bg-purple-400/20 text-purple-400",
      CANCELLED: "bg-red-400/20 text-red-400",
    };
    return colors[status] || "bg-gray-400/20 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiFolderLine className="text-orange-400" />
              Projects
            </h1>
            <p className="text-gray-400 mt-1">Project planning and tracking</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Project
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading projects...
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-orange-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{project.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  {project.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Budget</span>
                    <span className="font-semibold">
                      {formatCurrency(project.budgetedCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Tasks</span>
                    <span className="font-semibold">
                      {project.taskIds.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Work Orders</span>
                    <span className="font-semibold">
                      {project.workOrderIds.length}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
