"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { RiArrowRightLine } from "react-icons/ri";

interface ModulesCTAProps {
  language: "en" | "ar";
}

export default function ModulesCTA({ language }: ModulesCTAProps) {
  const router = useRouter();
  const isArabic = language === "ar";
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "ابدأ مع BlueDXP" : "Start with BlueDXP"}
          </h2>
          <motion.button
            onClick={() => router.push("/login")}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg flex items-center space-x-2 mx-auto"
            whileHover={{ scale: 1.05 }}
          >
            <span>{isArabic ? "ابدأ الآن" : "Get Started"}</span>
            <RiArrowRightLine className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
