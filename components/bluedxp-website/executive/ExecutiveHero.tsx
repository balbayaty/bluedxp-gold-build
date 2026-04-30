"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  RiArrowRightLine,
  RiShieldCheckLine,
  RiGlobalLine,
  RiBarChartBoxLine,
} from "react-icons/ri";

interface ExecutiveHeroProps {
  language: "en" | "ar";
}

export default function ExecutiveHero({ language }: ExecutiveHeroProps) {
  const router = useRouter();

  const isArabic = language === "ar";

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full mb-8"
        >
          <RiShieldCheckLine className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">
            {isArabic
              ? "منصة ذكاء المؤسسات الرائدة عالمياً"
              : "World's Leading Enterprise Intelligence Platform"}
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            {isArabic ? "نظام التشغيل الذكي" : "Enterprise Intelligence"}
          </span>
          <br />
          <span className="text-white">
            {isArabic ? "للمؤسسات" : "Operating System"}
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {isArabic
            ? "منصة BlueDXP تحول المؤسسات إلى أنظمة ذكية مستقلة قادرة على اتخاذ القرارات، والامتثال في الوقت الفعلي، والتنبؤ بالتحسينات، والتعاون بين الإنسان والآلة."
            : "BlueDXP transforms enterprises into autonomous intelligent systems capable of decision-making, real-time compliance, predictive optimization, and human-machine collaboration."}
        </motion.p>

        {/* Key Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto"
        >
          {[
            {
              icon: RiGlobalLine,
              value: "24+",
              label: isArabic ? "وحدة" : "Modules",
            },
            {
              icon: RiShieldCheckLine,
              value: "100%",
              label: isArabic ? "امتثال" : "Compliance",
            },
            {
              icon: RiBarChartBoxLine,
              value: "50%",
              label: isArabic ? "تحسين" : "Efficiency",
            },
            {
              icon: RiShieldCheckLine,
              value: "99.9%",
              label: isArabic ? "موثوقية" : "Uptime",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-white/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => router.push("/login")}
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-lg flex items-center space-x-2 shadow-xl shadow-blue-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{isArabic ? "ابدأ الآن" : "Get Started"}</span>
            <RiArrowRightLine className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <motion.button
            onClick={() => {
              document
                .getElementById("capabilities")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isArabic ? "استكشف القدرات" : "Explore Capabilities"}
          </motion.button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-white/50 text-sm mb-4">
            {isArabic ? "موثوق به من قبل" : "Trusted by"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["Government", "Fortune 500", "Enterprise", "Authorities"].map(
              (item, index) => (
                <div key={index} className="text-white/40 text-sm font-medium">
                  {isArabic
                    ? ["الحكومة", "فورتشن 500", "المؤسسات", "السلطات"][index]
                    : item}
                </div>
              ),
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
