"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InteractiveDemoProps {
  language: "en" | "ar";
}

/**
 * Interactive Demo Section - Let users try features live
 */
export default function InteractiveDemo({ language }: InteractiveDemoProps) {
  const [activeDemo, setActiveDemo] = useState<
    "copilot" | "vision" | "analytics" | null
  >(null);
  const [copilotMessage, setCopilotMessage] = useState("");
  const [copilotResponse, setCopilotResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const content = {
    en: {
      title: "Try It Live",
      subtitle: "Experience BlueDXP capabilities in real-time",
      demos: {
        copilot: {
          title: "AI Copilot",
          description: "Ask questions and get intelligent responses",
          placeholder: "Ask me anything about your operations...",
        },
        vision: {
          title: "AI Vision",
          description: "Upload an image for AI analysis",
          placeholder: "Drop an image here or click to upload",
        },
        analytics: {
          title: "Real-time Analytics",
          description: "Explore live operational metrics",
        },
      },
    },
    ar: {
      title: "جربه مباشرة",
      subtitle: "اختبر قدرات BlueDXP في الوقت الفعلي",
      demos: {
        copilot: {
          title: "مساعد الذكاء الاصطناعي",
          description: "اطرح أسئلة واحصل على إجابات ذكية",
          placeholder: "اسألني أي شيء عن عملياتك...",
        },
        vision: {
          title: "رؤية الذكاء الاصطناعي",
          description: "قم بتحميل صورة للتحليل بالذكاء الاصطناعي",
          placeholder: "أسقط صورة هنا أو انقر للتحميل",
        },
        analytics: {
          title: "التحليلات في الوقت الفعلي",
          description: "استكشف مقاييس العمليات المباشرة",
        },
      },
    },
  };

  const t = content[language];

  const handleCopilotSubmit = async () => {
    if (!copilotMessage.trim()) return;
    setIsProcessing(true);
    setCopilotResponse("");

    // Simulate AI response
    setTimeout(() => {
      setCopilotResponse(
        language === "en"
          ? `Based on your question about "${copilotMessage}", I can help you understand operational efficiency, compliance requirements, or process optimization. Would you like me to dive deeper into any specific area?`
          : `بناءً على سؤالك حول "${copilotMessage}"، يمكنني مساعدتك في فهم كفاءة العمليات أو متطلبات الامتثال أو تحسين العمليات. هل تريد مني التعمق في أي مجال محدد؟`,
      );
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4"
        >
          {language === "en" ? "Interactive Experience" : "تجربة تفاعلية"}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4 text-white"
        >
          {t.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-[#a0aec0] max-w-[900px] mx-auto"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Demo Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(["copilot", "vision", "analytics"] as const).map((demo) => (
          <motion.button
            key={demo}
            onClick={() => setActiveDemo(activeDemo === demo ? null : demo)}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              activeDemo === demo
                ? "border-[#05a4ff] bg-gradient-to-br from-[#05a4ff]/20 to-[#00d4a8]/10"
                : "border-[#05a4ff]/20 bg-[#05a4ff]/5 hover:border-[#05a4ff]/40"
            }`}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-3xl mb-3">
              {demo === "copilot" ? "🤖" : demo === "vision" ? "👁️" : "📊"}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t.demos[demo].title}
            </h3>
            <p className="text-sm text-[#a0aec0]">
              {t.demos[demo].description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Active Demo Content */}
      <AnimatePresence mode="wait">
        {activeDemo === "copilot" && (
          <motion.div
            key="copilot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Hazalyze Copilot
                    </h3>
                    <p className="text-sm text-[#a0aec0]">
                      {language === "en"
                        ? "AI Assistant"
                        : "مساعد الذكاء الاصطناعي"}
                    </p>
                  </div>
                </div>
                <div className="bg-[#0a0e14]/50 rounded-lg p-4 border border-[#05a4ff]/20">
                  <input
                    type="text"
                    value={copilotMessage}
                    onChange={(e) => setCopilotMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCopilotSubmit()
                    }
                    placeholder={t.demos.copilot.placeholder}
                    className="w-full bg-transparent text-white placeholder-[#a0aec0] outline-none"
                  />
                </div>
                <motion.button
                  onClick={handleCopilotSubmit}
                  disabled={isProcessing || !copilotMessage.trim()}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-[#05a4ff] to-[#0088d1] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isProcessing
                    ? language === "en"
                      ? "Processing..."
                      : "جاري المعالجة..."
                    : language === "en"
                      ? "Ask"
                      : "اسأل"}
                </motion.button>
              </div>
              {copilotResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#00d4a8]/10 border border-[#00d4a8]/30 rounded-lg p-4"
                >
                  <p className="text-[#cbd5e1]">{copilotResponse}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeDemo === "vision" && (
          <motion.div
            key="vision"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="max-w-2xl mx-auto text-center">
              <div className="border-2 border-dashed border-[#05a4ff]/30 rounded-xl p-12 hover:border-[#05a4ff]/50 transition-all cursor-pointer">
                <div className="text-5xl mb-4">📸</div>
                <p className="text-[#a0aec0] mb-4">
                  {t.demos.vision.placeholder}
                </p>
                <button className="px-6 py-3 bg-[#05a4ff]/20 text-[#05a4ff] rounded-lg font-semibold hover:bg-[#05a4ff]/30 transition-all">
                  {language === "en" ? "Select Image" : "اختر صورة"}
                </button>
              </div>
              <p className="text-sm text-[#a0aec0] mt-4">
                {language === "en"
                  ? "AI Vision supports: Chemical analysis, Quality inspection, Anomaly detection, Object tracking"
                  : "رؤية الذكاء الاصطناعي تدعم: التحليل الكيميائي، فحص الجودة، كشف الشذوذ، تتبع الكائنات"}
              </p>
            </div>
          </motion.div>
        )}

        {activeDemo === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: language === "en" ? "Orders Today" : "الطلبات اليوم",
                  value: 1247,
                  trend: "+12%",
                },
                {
                  label: language === "en" ? "Efficiency" : "الكفاءة",
                  value: "94%",
                  trend: "+2%",
                },
                {
                  label:
                    language === "en" ? "Active Users" : "المستخدمون النشطون",
                  value: 342,
                  trend: "+5%",
                },
                {
                  label: language === "en" ? "Compliance" : "الامتثال",
                  value: "97%",
                  trend: "+1%",
                },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#0a0e14]/50 border border-[#05a4ff]/20 rounded-lg p-4 text-center"
                >
                  <div className="text-xs text-[#a0aec0] mb-2">
                    {metric.label}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs text-[#00d4a8]">{metric.trend}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
