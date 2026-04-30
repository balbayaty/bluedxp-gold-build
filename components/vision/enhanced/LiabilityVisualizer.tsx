/**
 * Liability Assessment Visualizer
 * Interactive liability tree, fault breakdown, and insurance calculator
 * From UI/UX mocks - ensures all visualized features are implemented
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LiabilityNode {
  id: string;
  party: string;
  faultPercentage: number;
  liability: number;
  factors: string[];
  evidence?: string[];
  children?: LiabilityNode[];
}

interface LiabilityVisualizerProps {
  analysisId?: string;
  damageData?: {
    type: string;
    severity: string;
    estimatedCost: number;
    parties: string[];
  };
  visionAnalysis?: any;
  onLiabilityCalculated?: (liability: LiabilityNode[]) => void;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function LiabilityVisualizer({
  analysisId,
  damageData,
  visionAnalysis,
  onLiabilityCalculated,
}: LiabilityVisualizerProps) {
  const [liabilityTree, setLiabilityTree] = useState<LiabilityNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<LiabilityNode | null>(null);
  const [insuranceClaim, setInsuranceClaim] = useState<{
    estimatedAmount: number;
    deductible: number;
    coverage: number;
    claimable: number;
  } | null>(null);

  // Calculate liability from vision analysis
  const calculateLiability = () => {
    if (!visionAnalysis && !damageData) return;

    const parties = damageData?.parties || [
      "Carrier",
      "Warehouse",
      "Customer",
      "Third Party",
    ];
    const totalCost = damageData?.estimatedCost || 10000;
    const severity = damageData?.severity || "moderate";

    // Intelligent fault distribution based on analysis
    const faultDistribution: Record<string, number> = {};
    let remainingFault = 100;

    // Analyze vision results to determine fault
    if (visionAnalysis?.analysis?.qualityIssues) {
      const issues = visionAnalysis.analysis.qualityIssues;

      // If damage detected during loading, carrier fault
      if (
        issues.some(
          (i: any) => i.type === "damage" && i.location?.includes("loading"),
        )
      ) {
        faultDistribution["Carrier"] = 60;
        faultDistribution["Warehouse"] = 20;
        faultDistribution["Customer"] = 10;
        faultDistribution["Third Party"] = 10;
      }
      // If damage detected during storage, warehouse fault
      else if (
        issues.some(
          (i: any) => i.type === "damage" && i.location?.includes("storage"),
        )
      ) {
        faultDistribution["Warehouse"] = 70;
        faultDistribution["Carrier"] = 15;
        faultDistribution["Customer"] = 10;
        faultDistribution["Third Party"] = 5;
      }
      // Default distribution
      else {
        faultDistribution["Carrier"] = 40;
        faultDistribution["Warehouse"] = 30;
        faultDistribution["Customer"] = 20;
        faultDistribution["Third Party"] = 10;
      }
    } else {
      // Default distribution
      faultDistribution["Carrier"] = 40;
      faultDistribution["Warehouse"] = 30;
      faultDistribution["Customer"] = 20;
      faultDistribution["Third Party"] = 10;
    }

    // Build liability tree
    const tree: LiabilityNode[] = parties.map((party, idx) => {
      const fault = faultDistribution[party] || 100 / parties.length;
      const liability = (totalCost * fault) / 100;

      return {
        id: `node-${idx}`,
        party,
        faultPercentage: fault,
        liability,
        factors: [
          visionAnalysis?.analysis?.qualityIssues?.[0]?.issue ||
            "Damage detected",
          `Severity: ${severity}`,
          `Confidence: ${visionAnalysis?.analysis?.qualityIssues?.[0]?.confidence || 75}%`,
        ],
        evidence:
          visionAnalysis?.analysis?.detectedObjects?.map(
            (o: any) => o.object,
          ) || [],
      };
    });

    setLiabilityTree(tree);

    // Calculate insurance claim
    const deductible = totalCost * 0.1; // 10% deductible
    const coverage = totalCost * 0.9; // 90% coverage
    const claimable = Math.max(0, coverage - deductible);

    setInsuranceClaim({
      estimatedAmount: totalCost,
      deductible,
      coverage,
      claimable,
    });

    onLiabilityCalculated?.(tree);
  };

  // Auto-calculate on mount or when data changes
  useState(() => {
    if (visionAnalysis || damageData) {
      calculateLiability();
    }
  });

  const pieData = liabilityTree.map((node) => ({
    name: node.party,
    value: node.faultPercentage,
    liability: node.liability,
  }));

  const barData = liabilityTree.map((node) => ({
    party: node.party,
    fault: node.faultPercentage,
    liability: node.liability,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Liability Assessment
          </h3>
          <p className="text-sm text-gray-600">
            Interactive fault breakdown and insurance calculator
          </p>
        </div>
        <button
          onClick={calculateLiability}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="ri-calculator-line mr-2"></i>
          Recalculate
        </button>
      </div>

      {/* Liability Tree Visualization */}
      {liabilityTree.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Fault Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Liability Amounts</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="party" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fault" fill="#8884d8" name="Fault %" />
                <Bar dataKey="liability" fill="#82ca9d" name="Liability ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Liability Tree */}
      {liabilityTree.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Liability Breakdown</h4>
          <div className="space-y-4">
            {liabilityTree.map((node) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedNode?.id === node.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor:
                          COLORS[liabilityTree.indexOf(node) % COLORS.length],
                      }}
                    ></div>
                    <h5 className="font-semibold text-gray-900">
                      {node.party}
                    </h5>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ${node.liability.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {node.faultPercentage}% Fault
                    </div>
                  </div>
                </div>

                {selectedNode?.id === node.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Factors:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600">
                          {node.factors.map((factor, idx) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                      {node.evidence && node.evidence.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Evidence:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {node.evidence.map((ev, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                              >
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Claim Calculator */}
      {insuranceClaim && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg p-6 border border-green-200">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-shield-check-line text-green-600"></i>
            Insurance Claim Calculator
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">Estimated Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${insuranceClaim.estimatedAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">Deductible</p>
              <p className="text-2xl font-bold text-orange-600">
                ${insuranceClaim.deductible.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 mb-1">Coverage</p>
              <p className="text-2xl font-bold text-blue-600">
                ${insuranceClaim.coverage.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow border-2 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Claimable Amount</p>
              <p className="text-2xl font-bold text-green-600">
                ${insuranceClaim.claimable.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Compliance Checklist */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-semibold mb-4">
          Legal Compliance Checklist
        </h4>
        <div className="space-y-3">
          {[
            { item: "Documentation complete", status: true },
            {
              item: "Evidence collected",
              status: visionAnalysis?.analysis?.detectedObjects?.length > 0,
            },
            { item: "Fault assessment done", status: liabilityTree.length > 0 },
            {
              item: "Insurance claim prepared",
              status: insuranceClaim !== null,
            },
            { item: "All parties notified", status: false },
          ].map((check, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  check.status ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                {check.status && (
                  <i className="ri-check-line text-white text-xs"></i>
                )}
              </div>
              <span
                className={check.status ? "text-gray-900" : "text-gray-500"}
              >
                {check.item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Visualization */}
      {analysisId && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Liability Timeline</h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="space-y-4">
              {[
                { event: "Damage Detected", time: "T+0", status: "complete" },
                {
                  event: "Analysis Completed",
                  time: "T+5min",
                  status: "complete",
                },
                {
                  event: "Liability Assessed",
                  time: "T+10min",
                  status: "complete",
                },
                {
                  event: "Insurance Claim Filed",
                  time: "T+1hr",
                  status: "pending",
                },
                {
                  event: "Settlement Reached",
                  time: "T+7days",
                  status: "pending",
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      item.status === "complete"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {item.status === "complete" && (
                      <i className="ri-check-line text-white text-sm"></i>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.event}</p>
                    <p className="text-sm text-gray-600">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
