"use client";

import { motion } from "framer-motion";
import { RiFlagLine, RiLightbulbLine, RiRocketLine } from "react-icons/ri";

interface SaudiVision2030Props {
  language: "en" | "ar";
}

export default function SaudiVision2030({ language }: SaudiVision2030Props) {
  const isArabic = language === "ar";
  const pillars = [
    {
      icon: RiFlagLine,
      title: isArabic ? "رؤية 2030" : "Vision 2030",
      description: isArabic
        ? "محاذاة كاملة مع أهداف رؤية 2030 للمملكة العربية السعودية"
        : "Full alignment with Saudi Arabia Vision 2030 objectives",
      color: "from-[#006c35] to-[#008c44]",
    },
    {
      icon: RiLightbulbLine,
      title: isArabic ? "الابتكار" : "Innovation",
      description: isArabic
        ? "دعم الابتكار والتحول الرقمي في المملكة"
        : "Supporting innovation and digital transformation in the Kingdom",
      color: "from-[#00ff88] to-[#006c35]",
    },
    {
      icon: RiRocketLine,
      title: isArabic ? "النمو" : "Growth",
      description: isArabic
        ? "تمكين النمو الاقتصادي والتنمية المستدامة"
        : "Enabling economic growth and sustainable development",
      color: "from-[#ffffff] to-[#00ff88]",
    },
  ];

  return (
    <section
      id="vision2030"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "محاذاة رؤية 2030" : "Vision 2030 Alignment"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "منصة مصممة لدعم أهداف رؤية 2030"
              : "Platform designed to support Vision 2030 goals"}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${pillar.color} rounded-xl flex items-center justify-center mx-auto mb-6`}
              >
                <pillar.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {pillar.title}
              </h3>
              <p className="text-white/70">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
