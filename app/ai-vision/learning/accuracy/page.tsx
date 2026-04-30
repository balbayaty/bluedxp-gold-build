/**
 * Learning Accuracy Page
 * Detailed accuracy analytics and trends
 */

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function LearningAccuracyPage() {
  const router = useRouter();

  const accuracyTrend = [
    { month: "Jan", accuracy: 86 },
    { month: "Feb", accuracy: 88 },
    { month: "Mar", accuracy: 90 },
    { month: "Apr", accuracy: 91 },
    { month: "May", accuracy: 93 },
    { month: "Jun", accuracy: 94 },
  ];

  const patternAccuracy = [
    { name: "Forklift Corner Damage", accuracy: 94 },
    { name: "Water Damage Storage", accuracy: 89 },
    { name: "Crush Damage Loading", accuracy: 96 },
    { name: "Tear Damage Handling", accuracy: 87 },
    { name: "Puncture Transport", accuracy: 81 },
  ];

  return (
    <PageTemplate
      title="📊 Accuracy Analytics"
      description="Detailed accuracy trends and pattern performance"
      icon="ri-line-chart-line"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Accuracy Analytics</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back
          </motion.button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Overall Accuracy Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 5 }}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Accuracy by Pattern Type
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patternAccuracy}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} domain={[70, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="accuracy" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Improvement Factors
          </h3>
          <div className="space-y-3">
            {[
              { factor: "User Feedback", impact: "+5%", color: "green" },
              { factor: "Pattern Learning", impact: "+2%", color: "blue" },
              { factor: "Rule Generation", impact: "+1%", color: "purple" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <span className="text-white">{item.factor}</span>
                <span className={`text-${item.color}-400 font-semibold`}>
                  {item.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
