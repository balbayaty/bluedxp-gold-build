/**
 * Strategic Partnerships Dashboard
 * Manage Vision 2030 aligned partnerships
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiUserHeartLine,
  RiGovernmentLine,
  RiBuildingLine,
} from "react-icons/ri";

interface Partnership {
  id: string;
  partnerName: string;
  partnerType: "government" | "industrial" | "academic" | "technology";
  status: string;
  alignment: {
    vision2030: boolean;
    localContent: boolean;
  };
}

export default function PartnershipsPage() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartnerships();
  }, []);

  async function loadPartnerships() {
    try {
      const response = await fetch("/api/ict-hardware-ecosystem/partnerships");
      if (response.ok) {
        const data = await response.json();
        setPartnerships(data);
      }
    } catch (error) {
      console.error("Error loading partnerships:", error);
    } finally {
      setLoading(false);
    }
  }

  const typeIcons: Record<string, any> = {
    government: RiGovernmentLine,
    industrial: RiBuildingLine,
    academic: RiUserHeartLine,
    technology: RiUserHeartLine,
  };

  const statusColors: Record<string, string> = {
    exploring: "bg-gray-500/20 text-gray-400",
    negotiating: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    paused: "bg-orange-500/20 text-orange-400",
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
          <h1 className="text-3xl font-bold mb-2">Strategic Partnerships</h1>
          <p className="text-gray-400">
            Vision 2030 aligned partnerships for ICT hardware ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerships.map((partnership) => {
            const Icon = typeIcons[partnership.partnerType] || RiUserHeartLine;
            return (
              <div
                key={partnership.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="text-cyan-400 text-2xl" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {partnership.partnerName}
                    </h3>
                    <p className="text-sm text-gray-400 capitalize">
                      {partnership.partnerType}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${statusColors[partnership.status] || statusColors.exploring}`}
                    >
                      {partnership.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {partnership.alignment.vision2030 && (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        Vision 2030
                      </span>
                    )}
                    {partnership.alignment.localContent && (
                      <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                        Local Content
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {partnerships.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No partnerships registered. Start building strategic partnerships
              to grow the ecosystem.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
