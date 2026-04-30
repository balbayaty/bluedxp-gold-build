"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RealTimeMetricsProps {
  language: "en" | "ar";
}

export default function RealTimeMetrics({ language }: RealTimeMetricsProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [data, setData] = useState<any[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    accuracy: 99.7,
    speed: 95,
    cost: 80,
    efficiency: 94,
  });

  useEffect(() => {
    // Generate initial data
    const generateData = () => {
      const months =
        language === "en"
          ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
          : ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];

      return months.map((month, index) => ({
        month,
        accuracy: 95 + Math.random() * 5,
        speed: 85 + Math.random() * 10,
        cost: 70 + Math.random() * 15,
        efficiency: 88 + Math.random() * 7,
      }));
    };

    setData(generateData());

    // Simulate real-time updates
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        newData.push({
          month: new Date().toLocaleDateString("en", { month: "short" }),
          accuracy: Math.max(
            95,
            Math.min(100, last.accuracy + (Math.random() - 0.5) * 2),
          ),
          speed: Math.max(
            85,
            Math.min(100, last.speed + (Math.random() - 0.5) * 3),
          ),
          cost: Math.max(
            70,
            Math.min(100, last.cost + (Math.random() - 0.5) * 2),
          ),
          efficiency: Math.max(
            88,
            Math.min(100, last.efficiency + (Math.random() - 0.5) * 2),
          ),
        });
        if (newData.length > 12) newData.shift();
        return newData;
      });

      setCurrentMetrics({
        accuracy: 99.5 + Math.random() * 0.5,
        speed: 94 + Math.random() * 2,
        cost: 79 + Math.random() * 2,
        efficiency: 93 + Math.random() * 2,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [language]);

  const metrics = [
    {
      key: "accuracy",
      label: language === "en" ? "Accuracy" : "دقة",
      value: currentMetrics.accuracy,
      suffix: "%",
      icon: "ri-target-line",
      color: "#00d4a8",
    },
    {
      key: "speed",
      label: language === "en" ? "Decision Speed" : "سرعة القرار",
      value: currentMetrics.speed,
      suffix: "%",
      icon: "ri-flashlight-line",
      color: "#05a4ff",
    },
    {
      key: "cost",
      label: language === "en" ? "Cost Reduction" : "خفض التكلفة",
      value: currentMetrics.cost,
      suffix: "%",
      icon: "ri-money-dollar-circle-line",
      color: "#8b5cf6",
    },
    {
      key: "efficiency",
      label: language === "en" ? "Efficiency" : "الكفاءة",
      value: currentMetrics.efficiency,
      suffix: "%",
      icon: "ri-bar-chart-line",
      color: "#f59e0b",
    },
  ];

  return (
    <section
      ref={ref}
      id="operations"
      className="py-24 bg-gradient-to-b from-transparent to-[#05a4ff]/5 relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block bg-[#00d4a8]/15 text-[#00d4a8] px-4 py-2 rounded-full text-sm font-semibold mb-4 uppercase tracking-wider">
            {language === "en" ? "Real-Time Performance" : "الأداء اللحظي"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-[#05a4ff] bg-clip-text text-transparent">
              {language === "en"
                ? "Live Operational Intelligence"
                : "ذكاء تشغيلي مباشر"}
            </span>
          </h2>
        </motion.div>

        {/* Real-Time Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 hover:border-[#05a4ff]/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center`}
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <i
                    className={`${metric.icon} text-2xl`}
                    style={{ color: metric.color }}
                  ></i>
                </div>
                <motion.div
                  key={metric.value}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-xs text-white/60"
                >
                  {language === "en" ? "Live" : "مباشر"}
                </motion.div>
              </div>
              <div
                className="text-3xl font-bold mb-1"
                style={{ color: metric.color }}
              >
                {metric.value.toFixed(1)}
                {metric.suffix}
              </div>
              <div className="text-sm text-white/70">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">
            {language === "en" ? "Performance Trends" : "اتجاهات الأداء"}
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4a8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4a8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#05a4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#05a4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="colorEfficiency"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 15, 0.95)",
                  border: "1px solid rgba(5, 164, 255, 0.3)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#00d4a8"
                fillOpacity={1}
                fill="url(#colorAccuracy)"
              />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="#05a4ff"
                fillOpacity={1}
                fill="url(#colorSpeed)"
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorCost)"
              />
              <Area
                type="monotone"
                dataKey="efficiency"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorEfficiency)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}
