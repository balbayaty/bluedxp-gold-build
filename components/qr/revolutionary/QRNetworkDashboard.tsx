"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function QRNetworkDashboard() {
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In production, load from API
      // For now, use mock data
      setTimeout(() => {
        setNetworks([
          {
            id: "net-1",
            name: "Supply Chain Network",
            nodes: 12,
            edges: 24,
            type: "hierarchical",
          },
          {
            id: "net-2",
            name: "Document Network",
            nodes: 8,
            edges: 15,
            type: "mesh",
          },
          {
            id: "net-3",
            name: "Asset Network",
            nodes: 20,
            edges: 45,
            type: "star",
          },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to load networks");
      setIsLoading(false);
    }
  };

  const loadAnalytics = async (networkId: string) => {
    setError(null);
    try {
      const response = await fetch(
        `/api/qr/network?networkId=${networkId}&action=analyze`,
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || "Failed to load analytics");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load analytics";
      setError(errorMessage);
      console.error("Error loading analytics:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Network Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-node-tree text-purple-400"></i>
          QR Code Networks
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {networks.map((network) => (
            <motion.div
              key={network.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setSelectedNetwork(network.id);
                loadAnalytics(network.id);
              }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedNetwork === network.id
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-gray-700 hover:border-purple-500/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{network.name}</h3>
                <i className="ri-arrow-right-line text-purple-400"></i>
              </div>
              <div className="text-sm text-gray-400">
                <div>Nodes: {network.nodes}</div>
                <div>Edges: {network.edges}</div>
                <div>Type: {network.type}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Network Graph Visualization */}
        {selectedNetwork ? (
          <div className="bg-gray-900/50 rounded-lg p-6 h-96 flex items-center justify-center">
            <div className="text-center">
              <i className="ri-node-tree text-6xl text-purple-400/30 mb-4"></i>
              <p className="text-gray-400">Interactive Network Graph</p>
              <p className="text-sm text-gray-500 mt-2">
                Network: {networks.find((n) => n.id === selectedNetwork)?.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 rounded-lg p-6 h-96 flex items-center justify-center">
            <div className="text-center">
              <i className="ri-node-tree text-6xl text-purple-400/30 mb-4"></i>
              <p className="text-gray-400">Interactive Network Graph</p>
              <p className="text-sm text-gray-500 mt-2">
                Click a network above to view analytics
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Analytics */}
      {analytics ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-4">Network Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Nodes</div>
              <div className="text-2xl font-bold text-purple-400">
                {analytics.totalNodes}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Edges</div>
              <div className="text-2xl font-bold text-blue-400">
                {analytics.totalEdges}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Density</div>
              <div className="text-2xl font-bold text-green-400">
                {(analytics.networkDensity * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Communities</div>
              <div className="text-2xl font-bold text-yellow-400">
                {analytics.communities?.length || 0}
              </div>
            </div>
          </div>

          {/* Central Nodes */}
          {analytics.centralNodes && analytics.centralNodes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-bold mb-3">Most Central Nodes</h3>
              <div className="space-y-2">
                {analytics.centralNodes
                  .slice(0, 5)
                  .map((node: any, idx: number) => (
                    <motion.div
                      key={node.qrId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="font-mono text-sm">{node.qrId}</div>
                      <div className="text-purple-400 font-bold">
                        {(node.centrality * 100).toFixed(1)}%
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        selectedNetwork && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
            <div className="text-center py-8 text-gray-400">
              <i className="ri-bar-chart-line text-4xl mb-4"></i>
              <div>Click "Analyze" to view network analytics</div>
            </div>
          </div>
        )
      )}

      {/* Collaborative QR Codes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-team-line text-blue-400"></i>
          Collaborative QR Codes
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-bold">QR Code {i}</div>
                <div className="text-sm text-gray-400">
                  3 collaborators • 5 comments
                </div>
              </div>
              <button className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition">
                View
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
