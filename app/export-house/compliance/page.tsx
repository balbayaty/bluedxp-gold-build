/**
 * Export House Compliance Tracking
 * Track and manage SEDA compliance requirements
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiShieldCheckLine,
  RiFileLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from "react-icons/ri";

interface ComplianceRequirement {
  id: string;
  requirement: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate?: string;
  completedAt?: string;
  notes?: string;
}

export default function CompliancePage() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequirements();
  }, []);

  async function loadRequirements() {
    try {
      const response = await fetch("/api/export-house/compliance");
      if (response.ok) {
        const data = await response.json();
        setRequirements(data);
      }
    } catch (error) {
      console.error("Error loading compliance requirements:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateRequirementStatus(
    id: string,
    status: ComplianceRequirement["status"],
  ) {
    try {
      const response = await fetch("/api/export-house/compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        loadRequirements();
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-gray-500/20 text-gray-400",
    in_progress: "bg-yellow-500/20 text-yellow-400",
    completed: "bg-green-500/20 text-green-400",
    overdue: "bg-red-500/20 text-red-400",
  };

  const statusIcons: Record<string, any> = {
    pending: RiTimeLine,
    in_progress: RiTimeLine,
    completed: RiCheckboxCircleLine,
    overdue: RiTimeLine,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Compliance Tracking</h1>
          <p className="text-gray-400">
            Track and manage SEDA Export House license compliance requirements
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Object.entries({
            pending: requirements.filter((r) => r.status === "pending").length,
            in_progress: requirements.filter((r) => r.status === "in_progress")
              .length,
            completed: requirements.filter((r) => r.status === "completed")
              .length,
            overdue: requirements.filter((r) => r.status === "overdue").length,
          }).map(([status, count]) => {
            const Icon = statusIcons[status] || RiFileLine;
            return (
              <div
                key={status}
                className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${statusColors[status]}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="text-2xl" />
                  <h3 className="text-lg font-semibold capitalize">
                    {status.replace("_", " ")}
                  </h3>
                </div>
                <div className="text-3xl font-bold">{count}</div>
              </div>
            );
          })}
        </div>

        {/* Requirements List */}
        <div className="space-y-4">
          {requirements.map((req) => {
            const Icon = statusIcons[req.status] || RiFileLine;
            return (
              <div
                key={req.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon
                        className={`text-xl ${statusColors[req.status].split(" ")[1]}`}
                      />
                      <h3 className="text-lg font-semibold">
                        {req.requirement}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${statusColors[req.status]}`}
                      >
                        {req.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{req.description}</p>
                    {req.dueDate && (
                      <p className="text-sm text-gray-500">
                        Due: {new Date(req.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <select
                    value={req.status}
                    onChange={(e) =>
                      updateRequirementStatus(
                        req.id,
                        e.target.value as ComplianceRequirement["status"],
                      )
                    }
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                {req.notes && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400">{req.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
