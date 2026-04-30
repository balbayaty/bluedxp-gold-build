"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiArrowRightLine, RiAppsLine } from "react-icons/ri";

interface ModulesHeroProps {
  language: "en" | "ar";
}

export default function ModulesHero({ language }: ModulesHeroProps) {
  const router = useRouter();
  const isArabic = language === "ar";
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full mb-8"
        >
          <RiAppsLine className="w-4 h-4 text-purple-300" />
          <span className="text-purple-300 text-sm font-medium">
            {isArabic ? "24+ وحدة متكاملة" : "24+ Integrated Modules"}
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            {isArabic ? "منصة شاملة" : "Comprehensive"}
          </span>
          <br />
          <span className="text-white">
            {isArabic ? "للمؤسسات" : "Enterprise Platform"}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto mb-12"
        >
          {isArabic
            ? "مجموعة كاملة من الوحدات المتكاملة لتلبية جميع احتياجات المؤسسة"
            : "Complete suite of integrated modules to meet all enterprise needs"}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={() => router.push("/login")}
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg flex items-center space-x-2 shadow-xl shadow-purple-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <span>{isArabic ? "استكشف الوحدات" : "Explore Modules"}</span>
            <RiArrowRightLine className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
