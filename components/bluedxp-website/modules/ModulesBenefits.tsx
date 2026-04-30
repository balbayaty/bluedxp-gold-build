"use client";

import { motion } from "framer-motion";
import {
  RiCheckboxCircleLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiBarChartLine,
  RiGlobalLine,
} from "react-icons/ri";

interface ModulesBenefitsProps {
  language: "en" | "ar";
}

export default function ModulesBenefits({ language }: ModulesBenefitsProps) {
  const isArabic = language === "ar";

  const benefits = [
    {
      icon: RiTimeLine,
      title: isArabic ? "توفير الوقت" : "Time Savings",
      desc: isArabic
        ? "تقليل الوقت المطلوب للعمليات بنسبة تصل إلى 70%"
        : "Reduce operational time by up to 70%",
      stat: "70%",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: RiMoneyDollarCircleLine,
      title: isArabic ? "توفير التكاليف" : "Cost Reduction",
      desc: isArabic
        ? "تقليل التكاليف التشغيلية بنسبة تصل إلى 45%"
        : "Reduce operational costs by up to 45%",
      stat: "45%",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: RiShieldCheckLine,
      title: isArabic ? "الامتثال الكامل" : "Full Compliance",
      desc: isArabic
        ? "ضمان الامتثال لجميع اللوائح والمعايير"
        : "Ensure compliance with all regulations and standards",
      stat: "100%",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: RiBarChartLine,
      title: isArabic ? "تحسين الكفاءة" : "Efficiency Gain",
      desc: isArabic
        ? "زيادة الكفاءة التشغيلية بنسبة تصل إلى 95%"
        : "Increase operational efficiency by up to 95%",
      stat: "95%",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: RiGlobalLine,
      title: isArabic ? "التكامل الشامل" : "Comprehensive Integration",
      desc: isArabic
        ? "تكامل سلس مع جميع الأنظمة والخدمات"
        : "Seamless integration with all systems and services",
      stat: "24+",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: RiCheckboxCircleLine,
      title: isArabic ? "الموثوقية" : "Reliability",
      desc: isArabic ? "نسبة موثوقية تصل إلى 99.9%" : "Up to 99.9% reliability",
      stat: "99.9%",
      color: "from-teal-500 to-cyan-500",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "الفوائد الرئيسية" : "Key Benefits"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic ? "لماذا تختار BlueDXP" : "Why Choose BlueDXP"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all group"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${benefit.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <benefit.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {benefit.stat}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-white/70 text-sm">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
