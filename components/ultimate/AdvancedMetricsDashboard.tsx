"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AdvancedMetricsDashboardProps {
  language: "en" | "ar";
}

export default function AdvancedMetricsDashboard({
  language,
}: AdvancedMetricsDashboardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeMetric, setActiveMetric] = useState("all");
  const [liveData, setLiveData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    decisions: 0,
    compliance: 0,
    efficiency: 0,
    cost: 0,
  });

  useEffect(() => {
    const generateData = () => {
      const labels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
      return labels.map((time) => ({
        time,
        decisions: 85 + Math.random() * 15,
        compliance: 90 + Math.random() * 10,
        efficiency: 75 + Math.random() * 20,
        cost: 65 + Math.random() * 25,
        prediction: 95 + Math.random() * 5,
      }));
    };

    setLiveData(generateData());

    const interval = setInterval(() => {
      setLiveData((prev) => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        newData.push({
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          decisions: Math.max(
            85,
            Math.min(100, last.decisions + (Math.random() - 0.5) * 5),
          ),
          compliance: Math.max(
            90,
            Math.min(100, last.compliance + (Math.random() - 0.5) * 3),
          ),
          efficiency: Math.max(
            75,
            Math.min(100, last.efficiency + (Math.random() - 0.5) * 4),
          ),
          cost: Math.max(
            65,
            Math.min(100, last.cost + (Math.random() - 0.5) * 5),
          ),
          prediction: Math.max(
            95,
            Math.min(100, last.prediction + (Math.random() - 0.5) * 2),
          ),
        });
        if (newData.length > 12) newData.shift();
        return newData;
      });

      setMetrics({
        decisions: 95 + Math.random() * 5,
        compliance: 98 + Math.random() * 2,
        efficiency: 92 + Math.random() * 8,
        cost: 75 + Math.random() * 10,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const metricCards = [
    {
      key: "decisions",
      label: language === "en" ? "Decision Velocity" : "سرعة القرار",
      icon: "ri-flashlight-line",
      color: "#05a4ff",
    },
    {
      key: "compliance",
      label: language === "en" ? "Compliance Rate" : "معدل الامتثال",
      icon: "ri-shield-check-line",
      color: "#00d4a8",
    },
    {
      key: "efficiency",
      label: language === "en" ? "Efficiency Gain" : "كسب الكفاءة",
      icon: "ri-bar-chart-line",
      color: "#8b5cf6",
    },
    {
      key: "cost",
      label: language === "en" ? "Cost Reduction" : "خفض التكلفة",
      icon: "ri-money-dollar-circle-line",
      color: "#f59e0b",
    },
  ];

  return (
    <section ref={ref} id="operations" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-[#00d4a8]/15 text-[#00d4a8] px-6 py-3 rounded-full text-sm font-semibold mb-6 uppercase tracking-wider">
            <motion.div
              className="w-2 h-2 bg-[#00d4a8] rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {language === "en"
              ? "Live Performance Metrics"
              : "مقاييس الأداء المباشر"}
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-[#05a4ff] to-[#00d4a8] bg-clip-text text-transparent">
              {language === "en"
                ? "Real-Time Operational Intelligence"
                : "ذكاء تشغيلي لحظي"}
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metricCards.map((card, index) => {
            const value = metrics[card.key as keyof typeof metrics];
            return (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                onClick={() => setActiveMetric(card.key)}
                className={`relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-2xl border-2 rounded-3xl p-6 cursor-pointer transition-all ${
                  activeMetric === card.key ? "shadow-2xl" : "shadow-xl"
                }`}
                style={{
                  borderColor:
                    activeMetric === card.key
                      ? card.color
                      : "rgba(255,255,255,0.2)",
                  boxShadow:
                    activeMetric === card.key
                      ? `0 20px 60px ${card.color}60`
                      : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${card.color}30` }}
                  >
                    <i
                      className={`${card.icon} text-3xl`}
                      style={{ color: card.color }}
                    ></i>
                  </div>
                  <motion.div
                    key={value}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-white/10 rounded-full"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#00d4a8]" />
                    LIVE
                  </motion.div>
                </div>
                <motion.div
                  key={`${value}-${card.key}`}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-black mb-2"
                  style={{ color: card.color }}
                >
                  {value.toFixed(1)}%
                </motion.div>
                <div className="text-sm text-white/70 font-medium">
                  {card.label}
                </div>

                <div className="mt-4 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveData.slice(-6)}>
                      <defs>
                        <linearGradient
                          id={`gradient-${card.key}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={card.color}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="100%"
                            stopColor={card.color}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey={card.key}
                        stroke={card.color}
                        strokeWidth={2}
                        fill={`url(#gradient-${card.key})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">
              {language === "en" ? "Performance Trends" : "اتجاهات الأداء"}
            </h3>
            <div className="flex gap-2">
              {["all", "decisions", "compliance", "efficiency"].map(
                (metric) => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeMetric === metric
                        ? "bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white shadow-lg"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={liveData}>
              <defs>
                <linearGradient id="colorDecisions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#05a4ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#05a4ff" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="colorCompliance"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#00d4a8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00d4a8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient
                  id="colorEfficiency"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.6)" />
              <YAxis stroke="rgba(255,255,255,0.6)" domain={[60, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(10, 10, 15, 0.95)",
                  border: "1px solid rgba(5, 164, 255, 0.3)",
                  borderRadius: "16px",
                  color: "#fff",
                  padding: "12px",
                }}
              />
              <Legend />
              {(activeMetric === "all" || activeMetric === "decisions") && (
                <Area
                  type="monotone"
                  dataKey="decisions"
                  stroke="#05a4ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorDecisions)"
                  name={language === "en" ? "Decisions" : "القرارات"}
                />
              )}
              {(activeMetric === "all" || activeMetric === "compliance") && (
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#00d4a8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCompliance)"
                  name={language === "en" ? "Compliance" : "الامتثال"}
                />
              )}
              {(activeMetric === "all" || activeMetric === "efficiency") && (
                <Area
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEfficiency)"
                  name={language === "en" ? "Efficiency" : "الكفاءة"}
                />
              )}
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={
                  language === "en" ? "AI Prediction" : "تنبؤ الذكاء الاصطناعي"
                }
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </section>
  );
}
