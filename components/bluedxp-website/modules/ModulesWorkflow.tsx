"use client";

import { motion } from "framer-motion";
import { RiArrowRightLine, RiCheckboxCircleLine } from "react-icons/ri";

interface ModulesWorkflowProps {
  language: "en" | "ar";
}

export default function ModulesWorkflow({ language }: ModulesWorkflowProps) {
  const isArabic = language === "ar";

  const workflowSteps = [
    {
      step: 1,
      title: isArabic ? "استلام الطلب" : "Order Receipt",
      desc: isArabic ? "استلام الطلب من العميل" : "Receive order from customer",
      module: isArabic ? "إدارة الطلبات" : "Order Management",
    },
    {
      step: 2,
      title: isArabic ? "معالجة المستودع" : "Warehouse Processing",
      desc: isArabic
        ? "معالجة الطلب في المستودع"
        : "Process order in warehouse",
      module: isArabic ? "إدارة المستودعات" : "Warehouse Management",
    },
    {
      step: 3,
      title: isArabic ? "التخطيط للنقل" : "Transport Planning",
      desc: isArabic
        ? "تخطيط وتنظيم النقل"
        : "Plan and organize transportation",
      module: isArabic ? "إدارة النقل" : "Transportation Management",
    },
    {
      step: 4,
      title: isArabic ? "الامتثال والجودة" : "Compliance & Quality",
      desc: isArabic
        ? "التحقق من الامتثال والجودة"
        : "Verify compliance and quality",
      module: isArabic ? "الامتثال والجودة" : "Compliance & Quality",
    },
    {
      step: 5,
      title: isArabic ? "التسليم" : "Delivery",
      desc: isArabic ? "تسليم الطلب للعميل" : "Deliver order to customer",
      module: isArabic ? "إدارة التسليم" : "Delivery Management",
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {isArabic ? "سير العمل المتكامل" : "Integrated Workflow"}
          </h2>
          <p className="text-xl text-white/70">
            {isArabic
              ? "تدفق سلس بين جميع الوحدات"
              : "Smooth flow between all modules"}
          </p>
        </motion.div>

        <div className="relative">
          {/* Workflow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-3">{item.desc}</p>
                  <div className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                    <RiCheckboxCircleLine className="w-4 h-4 text-purple-300" />
                    <span className="text-purple-300 text-xs">
                      {item.module}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <RiArrowRightLine className="w-8 h-8 text-purple-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Connection Line (Mobile) */}
          <div className="md:hidden mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              {workflowSteps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full" />
                  {index < workflowSteps.length - 1 && (
                    <div className="w-12 h-0.5 bg-purple-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
