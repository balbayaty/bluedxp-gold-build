/**
 * CRM Activities Page
 * Activity tracking integrated with Brand Messaging
 */

"use client";

import { useEffect, useState } from "react";
import { RiCalendarLine, RiAddLine } from "react-icons/ri";
import type { Activity } from "@/types/crm";

export default function CRMActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/crm/activities?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: Activity["type"]) => {
    const icons = {
      EMAIL: "📧",
      CALL: "📞",
      MEETING: "🤝",
      TASK: "✓",
      NOTE: "📝",
      WHATSAPP: "💬",
      SMS: "💬",
    };
    return icons[type] || "📋";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiCalendarLine className="text-purple-400" />
              Activities
            </h1>
            <p className="text-gray-400 mt-1">Activity tracking and timeline</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Activity
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading activities...
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No activities found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{activity.subject}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activity.status === "COMPLETED"
                            ? "bg-green-400/20 text-green-400"
                            : activity.status === "IN_PROGRESS"
                              ? "bg-yellow-400/20 text-yellow-400"
                              : "bg-gray-400/20 text-gray-400"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-400 mb-2">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
