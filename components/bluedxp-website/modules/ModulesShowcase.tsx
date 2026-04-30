"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  RiStoreLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiBrainLine,
  RiGlobalLine,
  RiFileList3Line,
  RiMoneyDollarCircleLine,
  RiUserLine,
  RiSettings3Line,
  RiBarChartLine,
  RiRobotLine,
  RiDatabaseLine,
} from "react-icons/ri";

interface ModulesShowcaseProps {
  language: "en" | "ar";
}

// Creative module names with descriptions
const modules = [
  {
    icon: RiStoreLine,
    name: "WarehouseMaster",
    nameAr: "ماستر المستودعات",
    category: "Operations",
    categoryAr: "العمليات",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: RiTruckLine,
    name: "TransportFlow",
    nameAr: "تدفق النقل",
    category: "Logistics",
    categoryAr: "اللوجستيات",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: RiShieldCheckLine,
    name: "ComplianceGuard",
    nameAr: "حارس الامتثال",
    category: "Governance",
    categoryAr: "الحوكمة",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: RiBrainLine,
    name: "HazalyzeAI",
    nameAr: "هازالايز الذكي",
    category: "Intelligence",
    categoryAr: "الذكاء",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: RiGlobalLine,
    name: "TradeNavigator",
    nameAr: "ملاح التجارة",
    category: "Compliance",
    categoryAr: "الامتثال",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: RiFileList3Line,
    name: "ISOIMS",
    nameAr: "نظام إدارة ISO",
    category: "Quality",
    categoryAr: "الجودة",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: RiMoneyDollarCircleLine,
    name: "FinanceHub",
    nameAr: "مركز المالية",
    category: "Finance",
    categoryAr: "المالية",
    color: "from-green-500 to-teal-500",
  },
  {
    icon: RiUserLine,
    name: "PeopleConnect",
    nameAr: "ربط الأشخاص",
    category: "HR",
    categoryAr: "الموارد البشرية",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: RiSettings3Line,
    name: "FacilityPro",
    nameAr: "برو المرافق",
    category: "Facilities",
    categoryAr: "المرافق",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: RiBarChartLine,
    name: "IntelliAnalytics",
    nameAr: "التحليلات الذكية",
    category: "Analytics",
    categoryAr: "التحليلات",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: RiRobotLine,
    name: "AutoOrchestrator",
    nameAr: "منسق الأتمتة",
    category: "Automation",
    categoryAr: "الأتمتة",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: RiDatabaseLine,
    name: "TruthEngine",
    nameAr: "محرك الحقيقة",
    category: "Data",
    categoryAr: "البيانات",
    color: "from-slate-500 to-gray-500",
  },
];

export default function ModulesShowcase({ language }: ModulesShowcaseProps) {
  const isArabic = language === "ar";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = isArabic
    ? [
        "الكل",
        "العمليات",
        "اللوجستيات",
        "الحوكمة",
        "الذكاء",
        "الامتثال",
        "الجودة",
        "المالية",
        "الموارد البشرية",
        "المرافق",
        "التحليلات",
        "الأتمتة",
        "البيانات",
      ]
    : [
        "All",
        "Operations",
        "Logistics",
        "Governance",
        "Intelligence",
        "Compliance",
        "Quality",
        "Finance",
        "HR",
        "Facilities",
        "Analytics",
        "Automation",
        "Data",
      ];

  const filteredModules =
    selectedCategory && selectedCategory !== (isArabic ? "الكل" : "All")
      ? modules.filter(
          (m) => (isArabic ? m.categoryAr : m.category) === selectedCategory,
        )
      : modules;

  return (
    <section id="modules" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {isArabic ? "مجموعة الوحدات الشاملة" : "Comprehensive Module Suite"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "24+ وحدة متكاملة تغطي جميع جوانب المؤسسة"
              : "24+ integrated modules covering all aspects of enterprise"}
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all group cursor-pointer"
            >
              <div
                className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <module.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {isArabic ? module.nameAr : module.name}
              </h3>
              <p className="text-white/60 text-sm">
                {isArabic ? module.categoryAr : module.category}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
