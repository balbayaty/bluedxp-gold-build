"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DataFlowVisualization() {
  const [dataFlow, setDataFlow] = useState<any[]>([]);

  useEffect(() => {
    // Simulate real-time data flow
    const generateData = () => {
      return Array.from({ length: 30 }, (_, i) => {
        const time = new Date(Date.now() - (30 - i) * 60000);
        return {
          time: time.toLocaleTimeString(),
          wms: Math.floor(Math.random() * 1000) + 500,
          hazalyze: Math.floor(Math.random() * 500) + 200,
          aivision: Math.floor(Math.random() * 800) + 300,
          total: 0,
        };
      }).map((d) => ({ ...d, total: d.wms + d.hazalyze + d.aivision }));
    };

    setDataFlow(generateData());

    const interval = setInterval(() => {
      setDataFlow((prev) => {
        const newData = [...prev.slice(1)];
        const latest = prev[prev.length - 1];
        newData.push({
          time: new Date().toLocaleTimeString(),
          wms: latest.wms + Math.floor((Math.random() - 0.5) * 100),
          hazalyze: latest.hazalyze + Math.floor((Math.random() - 0.5) * 50),
          aivision: latest.aivision + Math.floor((Math.random() - 0.5) * 80),
          total: 0,
        });
        return newData.map((d) => ({
          ...d,
          total: d.wms + d.hazalyze + d.aivision,
        }));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Real-Time Data Flow
            </span>
          </h2>
          <p className="text-xl text-[#9ca3af]">
            Live data synchronization across all systems
          </p>
        </motion.div>

        {/* Data Flow Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white">
              Data Flow (Last 30 Minutes)
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-[#9ca3af]">Live</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={dataFlow}>
              <defs>
                <linearGradient id="colorWMS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorHazalyze" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAIVision" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="wms"
                stroke="#06b6d4"
                fill="url(#colorWMS)"
                name="WMS"
              />
              <Area
                type="monotone"
                dataKey="hazalyze"
                stroke="#8b5cf6"
                fill="url(#colorHazalyze)"
                name="Hazalyze"
              />
              <Area
                type="monotone"
                dataKey="aivision"
                stroke="#10b981"
                fill="url(#colorAIVision)"
                name="AI Vision"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* System Integration Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              label: "Data Points/sec",
              value: "2,450",
              system: "WMS",
              color: "cyan",
            },
            {
              label: "API Calls/min",
              value: "1,200",
              system: "Hazalyze",
              color: "purple",
            },
            {
              label: "AI Detections/min",
              value: "850",
              system: "AI Vision",
              color: "green",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center`}
                >
                  <i
                    className={`ri-activity-line text-2xl text-${stat.color}-400`}
                  ></i>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded bg-${stat.color}-500/20 text-${stat.color}-400`}
                >
                  {stat.system}
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[#9ca3af]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
