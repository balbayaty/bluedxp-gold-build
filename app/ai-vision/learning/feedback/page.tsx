/**
 * Learning Feedback
 * Provide feedback to help the system learn and improve
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";

export default function LearningFeedbackPage() {
  const [feedback, setFeedback] = useState({
    pattern: "",
    type: "positive",
    comment: "",
  });

  const handleSubmit = () => {
    // Handle feedback submission
    alert("Feedback submitted! Thank you for helping improve the system.");
    setFeedback({ pattern: "", type: "positive", comment: "" });
  };

  return (
    <PageTemplate
      title="💬 Learning Feedback"
      description="Provide feedback to help the AI vision system learn and improve accuracy"
      icon="ri-feedback-line"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Submit Feedback
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Pattern
                </label>
                <input
                  type="text"
                  value={feedback.pattern}
                  onChange={(e) =>
                    setFeedback({ ...feedback, pattern: e.target.value })
                  }
                  placeholder="e.g., Forklift Corner Damage"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Feedback Type
                </label>
                <select
                  value={feedback.type}
                  onChange={(e) =>
                    setFeedback({ ...feedback, type: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="positive">
                    Positive - Correctly identified
                  </option>
                  <option value="correction">
                    Correction - Needs adjustment
                  </option>
                  <option value="negative">
                    Negative - Incorrect identification
                  </option>
                </select>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Comment
                </label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) =>
                    setFeedback({ ...feedback, comment: e.target.value })
                  }
                  placeholder="Provide detailed feedback..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
              >
                Submit Feedback
              </motion.button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Recent Feedback
            </h3>
            <div className="space-y-3">
              {[
                {
                  pattern: "Forklift Corner Damage",
                  type: "positive",
                  user: "John Doe",
                  comment: "Correctly identified forklift damage",
                  impact: "+2% accuracy",
                  date: "2 hours ago",
                },
                {
                  pattern: "Water Damage Storage",
                  type: "correction",
                  user: "Jane Smith",
                  comment: "Corrected: Was storage issue, not transport",
                  impact: "Pattern updated",
                  date: "5 hours ago",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-semibold text-sm">
                        {item.pattern}
                      </h4>
                      <p className="text-white/70 text-xs">{item.comment}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.type === "positive"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{item.user}</span>
                    <span>{item.date}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <span className="text-green-400 text-xs">
                      Impact: {item.impact}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
