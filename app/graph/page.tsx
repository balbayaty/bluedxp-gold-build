"use client";

import { useState, useEffect } from "react";
import PageTemplate from "@/components/PageTemplate";
import { entityGraphService } from "@/lib/services/graph";

export default function GraphPage() {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      // Load graph data from service
      // const data = await entityGraphService.getGraph()
      // setGraphData(data)
    } catch (error) {
      console.error("Error loading graph data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Entity Graph"
      description="Relationship Graph & Analytics"
      icon="ri-node-tree"
      stats={[
        {
          label: "Entities",
          value: graphData?.nodes?.length || 0,
          icon: "ri-node-tree",
          trend: "up" as const,
        },
        {
          label: "Relationships",
          value: graphData?.edges?.length || 0,
          icon: "ri-git-branch-line",
          trend: "up" as const,
        },
      ]}
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="text-center py-12 text-[#9ca3af]">
            Loading graph data...
          </div>
        ) : !graphData ? (
          <div className="text-center py-12 text-[#9ca3af]">
            <i className="ri-node-tree text-4xl mb-3 opacity-50"></i>
            <p>Entity Graph Visualization</p>
            <p className="text-sm mt-2">
              Graph will display entity relationships and connections
            </p>
            <p className="text-xs mt-1 text-[#6b7280]">
              Connect to entityGraphService to display relationships
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-white">
              <p>Graph visualization will be rendered here</p>
              <p className="text-sm text-[#9ca3af] mt-2">
                {graphData.nodes?.length || 0} entities and{" "}
                {graphData.edges?.length || 0} relationships
              </p>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
