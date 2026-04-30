"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import SustainabilityBadge from "@/components/marketplace/SustainabilityBadge";
import { Leaf, Award, TrendingDown, BarChart3 } from "lucide-react";

export default function SustainabilityPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/marketplace/sustainability?action=leaderboard&limit=20",
      );
      const result = await response.json();
      if (result.success) {
        setLeaderboard(result.data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Sustainability Leaderboard"
      description="Top sustainable providers and ESG performance"
      icon="ri-leaf-line"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <Leaf className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Sustainability Excellence</h2>
          </div>
          <p className="text-green-50">
            Recognizing providers committed to environmental responsibility and
            sustainable practices
          </p>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.providerId}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                            ? "bg-slate-100 text-slate-700"
                            : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {entry.providerName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <SustainabilityBadge
                          esgScore={entry.esgScore}
                          certifications={entry.certifications}
                          carbonReduction={entry.carbonReduction}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {entry.esgScore}
                    </div>
                    <div className="text-sm text-slate-500">ESG Score</div>
                    {entry.carbonReduction > 0 && (
                      <div className="flex items-center space-x-1 text-green-600 text-sm mt-2">
                        <TrendingDown className="w-4 h-4" />
                        <span>
                          {entry.carbonReduction.toFixed(0)}% CO₂ Reduction
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Leaf className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  No sustainability data yet
                </h3>
                <p className="text-slate-500">
                  Providers will appear here as they complete sustainability
                  assessments
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <span>How ESG Scores are Calculated</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800 mb-2">
                Environmental (30%)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Carbon footprint reduction</li>
                <li>Energy efficiency</li>
                <li>Waste management</li>
                <li>Water conservation</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-2">Social (25%)</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Employee welfare</li>
                <li>Community impact</li>
                <li>Safety standards</li>
                <li>Diversity & inclusion</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-2">
                Governance (25%)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Transparency</li>
                <li>Compliance</li>
                <li>Ethical practices</li>
                <li>Certifications</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-2">
                Certifications (20%)
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>ISO 14001 (Environmental)</li>
                <li>LEED Certification</li>
                <li>Green Building</li>
                <li>Other sustainability certs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
