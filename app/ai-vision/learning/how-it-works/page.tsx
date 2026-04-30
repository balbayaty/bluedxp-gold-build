/**
 * How Self-Learning Works
 * Detailed explanation of the learning system
 */

"use client";

import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function HowLearningWorksPage() {
  return (
    <PageTemplate
      title="🧠 How Self-Learning Works"
      description="Step-by-step explanation of how the AI vision system learns from damage photos and improves over time"
      icon="ri-question-line"
    >
      <div className="space-y-6">
        {[
          {
            step: 1,
            title: "Photo Analysis",
            desc: "When a damage photo is uploaded, V2 calls V1's enhancedVisionService for base analysis using GPT-4/Claude Vision.",
            details: [
              "Object detection",
              "Damage type identification",
              "Severity assessment",
              "Quality issues",
            ],
          },
          {
            step: 2,
            title: "Pattern Matching",
            desc: "The system compares the analysis against previously learned patterns stored in the knowledge base.",
            details: [
              "Pattern similarity scoring",
              "Confidence calculation",
              "Occurrence tracking",
            ],
          },
          {
            step: 3,
            title: "Learning",
            desc: "If no strong match is found, the system creates a new pattern. If a match exists, it updates the pattern's confidence.",
            details: [
              "New pattern creation",
              "Pattern confidence updates",
              "Occurrence counting",
            ],
          },
          {
            step: 4,
            title: "Rule Generation",
            desc: "When a pattern occurs 5+ times, the system automatically generates a prevention rule.",
            details: [
              "Automatic rule creation",
              "Prevention suggestions",
              "Action triggers",
            ],
          },
          {
            step: 5,
            title: "Knowledge Storage",
            desc: "All patterns, rules, and insights are stored in the knowledge base for future reference.",
            details: [
              "Vector embeddings",
              "Semantic search",
              "Cross-module access",
            ],
          },
          {
            step: 6,
            title: "Continuous Improvement",
            desc: "User feedback helps refine patterns and improve accuracy over time.",
            details: [
              "Feedback processing",
              "Pattern refinement",
              "Accuracy improvement",
            ],
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xl flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-white/80 mb-3">{item.desc}</p>
                <ul className="space-y-1">
                  {item.details.map((detail, detailIdx) => (
                    <li
                      key={detailIdx}
                      className="flex items-center gap-2 text-white/70 text-sm"
                    >
                      <i className="ri-checkbox-circle-line text-pink-400"></i>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {idx < 5 && (
              <div className="flex justify-center mt-4">
                <i className="ri-arrow-down-s-line text-pink-400 text-2xl"></i>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </PageTemplate>
  );
}
