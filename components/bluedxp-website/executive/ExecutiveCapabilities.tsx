"use client";

import { motion } from "framer-motion";
import {
  RiBrainLine,
  RiShieldCheckLine,
  RiBarChartLine,
  RiGlobalLine,
  RiRobotLine,
  RiDatabaseLine,
} from "react-icons/ri";

interface ExecutiveCapabilitiesProps {
  language: "en" | "ar";
}

export default function ExecutiveCapabilities({
  language,
}: ExecutiveCapabilitiesProps) {
  const isArabic = language === "ar";

  const capabilities = [
    {
      icon: RiBrainLine,
      title: isArabic ? "الذكاء الاصطناعي المتقدم" : "Advanced AI",
      description: isArabic
        ? "نظام ذكاء اصطناعي متكامل يوفر رؤى تنبؤية واتخاذ قرارات مستقلة"
        : "Integrated AI system providing predictive insights and autonomous decision-making",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: RiShieldCheckLine,
      title: isArabic ? "الامتثال في الوقت الفعلي" : "Real-Time Compliance",
      description: isArabic
        ? "مراقبة وضمان الامتثال التلقائي لجميع اللوائح والمعايير"
        : "Automated monitoring and enforcement of all regulations and standards",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: RiBarChartLine,
      title: isArabic ? "التحليلات التنبؤية" : "Predictive Analytics",
      description: isArabic
        ? "نماذج ML متقدمة للتنبؤ بالاتجاهات والتحسينات المستقبلية"
        : "Advanced ML models for forecasting trends and future optimizations",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: RiGlobalLine,
      title: isArabic ? "التكامل الشامل" : "Comprehensive Integration",
      description: isArabic
        ? "تكامل سلس مع جميع أنظمة المؤسسة والخدمات الخارجية"
        : "Seamless integration with all enterprise systems and external services",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: RiRobotLine,
      title: isArabic
        ? "التعاون بين الإنسان والآلة"
        : "Human-Machine Collaboration",
      description: isArabic
        ? "واجهات ذكية تعزز قدرات المستخدمين وتمكنهم من العمل بكفاءة"
        : "Intelligent interfaces that enhance user capabilities and enable efficient workflows",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: RiDatabaseLine,
      title: isArabic
        ? "الذاكرة المؤسسية الموحدة"
        : "Unified Enterprise Memory",
      description: isArabic
        ? "قاعدة معرفة مركزية تربط جميع البيانات والسياقات عبر المنصة"
        : "Centralized knowledge base connecting all data and contexts across the platform",
      color: "from-teal-500 to-cyan-500",
    },
  ];

  return (
    <section id="capabilities" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "القدرات الأساسية" : "Core Capabilities"}
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            {isArabic
              ? "منصة شاملة مصممة لتحويل المؤسسات إلى أنظمة ذكية مستقلة"
              : "Comprehensive platform designed to transform enterprises into autonomous intelligent systems"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all group"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${capability.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
              >
                <capability.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {capability.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {capability.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
