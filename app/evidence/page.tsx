"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { evidenceService } from "@/lib/services/evidence";

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      // Load evidence records from service
      // const records = await evidenceService.getAllEvidence()
      // setEvidence(records)
    } catch (error) {
      console.error("Error loading evidence:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Evidence & Lineage"
      description="Data Lineage Tracking & Evidence Management"
      icon="ri-file-search-line"
      stats={[
        {
          label: "Evidence Records",
          value: evidence.length,
          icon: "ri-file-search-line",
          trend: "up" as const,
        },
      ]}
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="text-center py-12 text-[#9ca3af]">
            Loading evidence records...
          </div>
        ) : evidence.length === 0 ? (
          <div className="text-center py-12 text-[#9ca3af]">
            <i className="ri-file-search-line text-4xl mb-3 opacity-50"></i>
            <p>No evidence records found</p>
            <p className="text-sm mt-2">
              Evidence will be tracked automatically as data flows through the
              system
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {evidence.map((record) => (
              <div
                key={record.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">
                      {record.title || record.id}
                    </h4>
                    <p className="text-sm text-[#9ca3af]">
                      {record.description}
                    </p>
                  </div>
                  <span className="text-xs text-[#6b7280]">
                    {new Date(record.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
