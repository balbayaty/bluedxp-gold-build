"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TestimonialsSectionProps {
  language: "en" | "ar";
}

/**
 * Testimonials and Case Studies Section
 */
export default function TestimonialsSection({
  language,
}: TestimonialsSectionProps) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = {
    en: [
      {
        name: "Ahmed Al-Mansouri",
        role: "CTO, Logistics Corp",
        company: "Leading 3PL Provider",
        image: "👨‍💼",
        quote:
          "BlueDXP transformed our operations. The AI-powered insights reduced our processing time by 40% and improved compliance rates to 98%. Hazalyze's intelligent orchestration is a game-changer.",
        metrics: { efficiency: "+40%", compliance: "98%", cost: "-25%" },
      },
      {
        name: "Sarah Johnson",
        role: "Operations Director",
        company: "Chemical Distribution",
        image: "👩‍💼",
        quote:
          "The process mining capabilities helped us identify bottlenecks we didn't even know existed. Real-time compliance monitoring gives us peace of mind and has prevented multiple violations.",
        metrics: { efficiency: "+35%", compliance: "99%", cost: "-20%" },
      },
      {
        name: "Mohammed Hassan",
        role: "Supply Chain Manager",
        company: "Manufacturing Group",
        image: "👨‍🔧",
        quote:
          "Hazalyze AI Copilot is like having an expert consultant available 24/7. It understands our operations and provides actionable insights that have directly improved our bottom line.",
        metrics: { efficiency: "+45%", compliance: "97%", cost: "-30%" },
      },
    ],
    ar: [
      {
        name: "أحمد المنصوري",
        role: "مدير التكنولوجيا، شركة اللوجستيات",
        company: "مزود خدمات لوجستية رائد",
        image: "👨‍💼",
        quote:
          "حولت BlueDXP عملياتنا. قللت الرؤى المدعومة بالذكاء الاصطناعي وقت المعالجة بنسبة 40% وحسنت معدلات الامتثال إلى 98%. التنسيق الذكي لهازالايز يغير قواعد اللعبة.",
        metrics: { efficiency: "+40%", compliance: "98%", cost: "-25%" },
      },
      {
        name: "سارة جونسون",
        role: "مديرة العمليات",
        company: "توزيع المواد الكيميائية",
        image: "👩‍💼",
        quote:
          "ساعدتنا قدرات استخراج العمليات في تحديد الاختناقات التي لم نكن نعرف بوجودها. مراقبة الامتثال في الوقت الفعلي تمنحنا راحة البال وتمنع انتهاكات متعددة.",
        metrics: { efficiency: "+35%", compliance: "99%", cost: "-20%" },
      },
      {
        name: "محمد حسن",
        role: "مدير سلسلة التوريد",
        company: "مجموعة التصنيع",
        image: "👨‍🔧",
        quote:
          "مساعد هازالايز للذكاء الاصطناعي مثل وجود مستشار خبير متاح 24/7. يفهم عملياتنا ويقدم رؤى قابلة للتنفيذ حسنت مباشرة أرباحنا.",
        metrics: { efficiency: "+45%", compliance: "97%", cost: "-30%" },
      },
    ],
  };

  const t = testimonials[language];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % t.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [t.length]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-block px-4 py-2 bg-[#00d4a8]/15 text-[#00d4a8] rounded-full font-semibold text-sm uppercase tracking-wider mb-4"
        >
          {language === "en" ? "Success Stories" : "قصص النجاح"}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4 text-white"
        >
          {language === "en"
            ? "Trusted by Industry Leaders"
            : "موثوق به من قبل قادة الصناعة"}
        </motion.h2>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTestimonial}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#05a4ff]/10 to-[#00d4a8]/5 border border-[#05a4ff]/20 rounded-2xl p-8 md:p-12 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#05a4ff] to-[#00d4a8] flex items-center justify-center text-5xl">
                  {t[activeTestimonial].image}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <div className="text-4xl text-[#05a4ff] mb-4">"</div>
                  <p className="text-lg text-[#cbd5e1] leading-relaxed mb-6">
                    {t[activeTestimonial].quote}
                  </p>
                  <div className="text-4xl text-[#05a4ff] text-right">"</div>
                </div>
                <div className="border-t border-[#05a4ff]/20 pt-6">
                  <div className="font-bold text-white text-lg mb-1">
                    {t[activeTestimonial].name}
                  </div>
                  <div className="text-[#a0aec0] text-sm mb-4">
                    {t[activeTestimonial].role} • {t[activeTestimonial].company}
                  </div>
                  <div className="flex gap-4">
                    {Object.entries(t[activeTestimonial].metrics).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="bg-[#0a0e14]/50 border border-[#05a4ff]/20 rounded-lg px-4 py-2"
                        >
                          <div className="text-xs text-[#a0aec0] mb-1 capitalize">
                            {key}
                          </div>
                          <div className="text-lg font-bold text-[#00d4a8]">
                            {value}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {t.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                activeTestimonial === index
                  ? "bg-[#05a4ff] w-8"
                  : "bg-[#05a4ff]/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
