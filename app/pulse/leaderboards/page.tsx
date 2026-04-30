/**
 * Pulse Leaderboards Page
 * View leaderboards by scope
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import type { LeaderboardEntry } from "@/types/pulse";

export default function PulseLeaderboardsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"team" | "site" | "company">("team");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, period]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(
        `/api/pulse/leaderboard?scope=${scope}&period=${period}`,
        {
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Leaderboards"
        description="See how you rank against your team, site, or company"
        icon="ri-trophy-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Leaderboards"
      description="See how you rank against your team, site, or company"
      icon="ri-trophy-line"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
            className="px-4 py-2 border rounded"
          >
            <option value="team">Team</option>
            <option value="site">Site</option>
            <option value="company">Company</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 border rounded"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Move
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Execute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Safe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Participation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-lg font-bold ${
                          entry.rank === 1
                            ? "text-yellow-500"
                            : entry.rank === 2
                              ? "text-gray-400"
                              : entry.rank === 3
                                ? "text-orange-500"
                                : "text-gray-600"
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {entry.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-600">
                      {entry.compositeScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.pillarScores.Move}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.pillarScores.Execute}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.pillarScores.Safe}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.pillarScores.Grow}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${entry.participationRate}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {entry.participationRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTemplate>
  );
}
