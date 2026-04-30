/**
 * DMARC Domain Reputation Dashboard
 * Detailed domain reputation analysis
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiShieldStarLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from "react-icons/ri";

interface Reputation {
  domain: string;
  score: number;
  status: string;
  factors: {
    dmarcPassRate: number;
    spfPassRate: number;
    dkimPassRate: number;
    spamComplaints: number;
    bounceRate: number;
    blacklistStatus: string[];
  };
}

export default function ReputationPage() {
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReputation();
  }, []);

  async function loadReputation() {
    try {
      const response = await fetch(
        "/api/dmarc-monitoring/reputation?domain=scsflex.com",
        { credentials: "include" },
      );
      if (response.ok) {
        const data = await response.json();
        setReputation(data);
      }
    } catch (error) {
      console.error("Error loading reputation:", error);
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    excellent: "bg-green-500/20 text-green-400",
    good: "bg-cyan-500/20 text-cyan-400",
    fair: "bg-yellow-500/20 text-yellow-400",
    poor: "bg-orange-500/20 text-orange-400",
    critical: "bg-red-500/20 text-red-400",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>No reputation data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Domain Reputation</h1>
          <p className="text-gray-400">
            Detailed reputation analysis for {reputation.domain}
          </p>
        </div>

        {/* Overall Score */}
        <div
          className={`bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-center ${statusColors[reputation.status]}`}
        >
          <div className="text-6xl font-bold mb-2">{reputation.score}/100</div>
          <div className="text-xl capitalize">{reputation.status}</div>
        </div>

        {/* Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Authentication Factors
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">DMARC Pass Rate</span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.dmarcPassRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-cyan-400 h-2 rounded-full"
                    style={{ width: `${reputation.factors.dmarcPassRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">SPF Pass Rate</span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.spfPassRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: `${reputation.factors.spfPassRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">DKIM Pass Rate</span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.dkimPassRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-purple-400 h-2 rounded-full"
                    style={{ width: `${reputation.factors.dkimPassRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              Deliverability Factors
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Spam Complaints</span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.spamComplaints}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${reputation.factors.spamComplaints}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Bounce Rate</span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.bounceRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full"
                    style={{ width: `${reputation.factors.bounceRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Blacklist Status
                  </span>
                  <span className="text-sm font-semibold">
                    {reputation.factors.blacklistStatus.length === 0 ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <RiCheckboxCircleLine /> Clean
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <RiCloseCircleLine />{" "}
                        {reputation.factors.blacklistStatus.length} lists
                      </span>
                    )}
                  </span>
                </div>
                {reputation.factors.blacklistStatus.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {reputation.factors.blacklistStatus.map((list, idx) => (
                      <div key={idx} className="text-xs text-red-400">
                        {list}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
