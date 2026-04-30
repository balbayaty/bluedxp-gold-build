/**
 * 🔒 PASSWORD STRENGTH METER
 * 
 * Visual password strength indicator with:
 * - Strength calculation
 * - Requirements checklist
 * - Visual feedback
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

interface StrengthResult {
  score: number; // 0-100
  level: "weak" | "fair" | "good" | "strong" | "excellent";
  label: string;
  color: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  showRequirements = true,
}) => {
  // Calculate password strength
  const { strength, requirements } = useMemo(() => {
    const reqs: PasswordRequirement[] = [
      {
        id: "length",
        label: "At least 8 characters",
        met: password.length >= 8,
      },
      {
        id: "uppercase",
        label: "Contains uppercase letter",
        met: /[A-Z]/.test(password),
      },
      {
        id: "lowercase",
        label: "Contains lowercase letter",
        met: /[a-z]/.test(password),
      },
      {
        id: "number",
        label: "Contains a number",
        met: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "Contains special character",
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
      {
        id: "noCommon",
        label: "Not a common password",
        met: !["password", "123456", "qwerty", "admin"].includes(password.toLowerCase()),
      },
    ];

    // Calculate score
    let score = 0;

    // Base score from requirements
    const metCount = reqs.filter((r) => r.met).length;
    score += metCount * 15;

    // Bonus for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;

    // Penalty for repetitive characters
    if (/(.)\1{2,}/.test(password)) score -= 10;

    // Penalty for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      score -= 10;
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let result: StrengthResult;
    if (score < 20) {
      result = { score, level: "weak", label: "Weak", color: "bg-red-500" };
    } else if (score < 40) {
      result = { score, level: "fair", label: "Fair", color: "bg-orange-500" };
    } else if (score < 60) {
      result = { score, level: "good", label: "Good", color: "bg-yellow-500" };
    } else if (score < 80) {
      result = { score, level: "strong", label: "Strong", color: "bg-green-500" };
    } else {
      result = { score, level: "excellent", label: "Excellent", color: "bg-emerald-500" };
    }

    return { strength: result, requirements: reqs };
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9ca3af]">Password Strength</span>
          <span
            className={`font-medium ${
              strength.level === "weak"
                ? "text-red-400"
                : strength.level === "fair"
                ? "text-orange-400"
                : strength.level === "good"
                ? "text-yellow-400"
                : strength.level === "strong"
                ? "text-green-400"
                : "text-emerald-400"
            }`}
          >
            {strength.label}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength.score}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${strength.color} transition-colors`}
          />
        </div>

        {/* Segment Indicators */}
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                strength.score >= (i + 1) * 20
                  ? strength.color
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-2">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={`flex items-center gap-2 text-xs transition-colors ${
                req.met ? "text-green-400" : "text-[#6b7280]"
              }`}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: req.met ? [1, 1.2, 1] : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <i
                  className={
                    req.met ? "ri-checkbox-circle-fill" : "ri-checkbox-blank-circle-line"
                  }
                ></i>
              </motion.div>
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {strength.level === "weak" && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2 text-xs text-red-400">
            <i className="ri-lightbulb-line mt-0.5"></i>
            <span>
              Try adding a mix of uppercase, lowercase, numbers, and special characters
            </span>
          </div>
        </div>
      )}

      {strength.level === "fair" && (
        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-start gap-2 text-xs text-orange-400">
            <i className="ri-lightbulb-line mt-0.5"></i>
            <span>
              Consider making your password longer or adding special characters
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
