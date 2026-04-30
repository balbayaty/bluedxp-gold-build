/**
 * DMARC Monitoring Dashboard
 * Real-time email deliverability tracking and domain reputation
 */

"use client";

import { useState, useEffect } from "react";
import {
  RiMailCheckLine,
  RiShieldStarLine,
  RiAlertLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

interface DomainReputation {
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

export default function DMARCMonitoringPage() {
  const [reputation, setReputation] = useState<DomainReputation | null>(null);
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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">DMARC Monitoring</h1>
          <p className="text-gray-400">
            Email deliverability tracking and domain reputation monitoring
          </p>
        </div>

        {/* Reputation Score Card */}
        {reputation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${statusColors[reputation.status]}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <RiShieldStarLine className="text-2xl" />
                <h3 className="text-lg font-semibold">Domain Reputation</h3>
              </div>
              <div className="text-4xl font-bold mb-2">
                {reputation.score}/100
              </div>
              <div className="text-sm capitalize">{reputation.status}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">DMARC Pass Rate</h3>
              <div className="text-3xl font-bold mb-2">
                {reputation.factors.dmarcPassRate}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div
                  className="bg-cyan-400 h-2 rounded-full"
                  style={{ width: `${reputation.factors.dmarcPassRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                Authentication Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">SPF</span>
                  <span className="text-green-400">
                    {reputation.factors.spfPassRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">DKIM</span>
                  <span className="text-green-400">
                    {reputation.factors.dkimPassRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Spam Complaints</div>
            <div className="text-2xl font-bold">
              {reputation?.factors.spamComplaints || 0}%
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Bounce Rate</div>
            <div className="text-2xl font-bold">
              {reputation?.factors.bounceRate || 0}%
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-gray-400 mb-2">Blacklist Status</div>
            <div className="text-2xl font-bold">
              {reputation?.factors.blacklistStatus.length === 0 ? (
                <span className="text-green-400">Clean</span>
              ) : (
                <span className="text-red-400">
                  {reputation?.factors.blacklistStatus.length}
                </span>
              )}
            </div>
          </div>
          <a
            href="/dmarc-monitoring/reports"
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <div className="text-sm text-gray-400 mb-2">View Reports</div>
            <div className="text-cyan-400">→</div>
          </a>
        </div>

        {/* Recommendations */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-start gap-2">
              <RiCheckboxCircleLine className="text-green-400 mt-1" />
              <span>DMARC policy is configured correctly</span>
            </div>
            <div className="flex items-start gap-2">
              <RiCheckboxCircleLine className="text-green-400 mt-1" />
              <span>SPF and DKIM records are valid</span>
            </div>
            <div className="flex items-start gap-2">
              <RiCheckboxCircleLine className="text-green-400 mt-1" />
              <span>Domain is not on any blacklists</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
