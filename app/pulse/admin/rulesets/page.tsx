/**
 * Pulse Admin - Rulesets Page
 */

"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";

export default function PulseAdminRulesetsPage() {
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRulesets();
  }, []);

  const fetchRulesets = async () => {
    try {
      const res = await fetch("/api/pulse/admin/rulesets", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setRulesets(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch rulesets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Rulesets"
        description="Configure scoring rules and caps"
        icon="ri-settings-3-line"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Rulesets"
      description="Configure scoring rules and caps"
      icon="ri-settings-3-line"
    >
      <div className="space-y-4">
        {rulesets.length === 0 ? (
          <p className="text-gray-500">No rulesets configured</p>
        ) : (
          rulesets.map((ruleset) => (
            <div key={ruleset.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{ruleset.name}</h3>
                  <p className="text-sm text-gray-500">
                    Role Cluster: {ruleset.roleCluster}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    ruleset.status === "ACTIVE"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ruleset.status}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Move</div>
                  <div className="font-semibold">
                    {(ruleset.weightsJson as any)?.Move * 100}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Execute</div>
                  <div className="font-semibold">
                    {(ruleset.weightsJson as any)?.Execute * 100}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Safe</div>
                  <div className="font-semibold">
                    {(ruleset.weightsJson as any)?.Safe * 100}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Grow</div>
                  <div className="font-semibold">
                    {(ruleset.weightsJson as any)?.Grow * 100}%
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageTemplate>
  );
}
