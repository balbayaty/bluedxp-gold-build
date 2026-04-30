"use client";

import { BadgeCheck, Shield, Star, Zap } from "lucide-react";

interface VerificationBadgeProps {
  verified: boolean;
  level?: "BASIC" | "STANDARD" | "PREMIUM" | "VERIFIED";
  badges?: string[];
  rating?: number;
  className?: string;
}

export default function VerificationBadge({
  verified,
  level = "BASIC",
  badges = [],
  rating,
  className = "",
}: VerificationBadgeProps) {
  if (!verified) return null;

  const levelColors = {
    BASIC: "bg-blue-50 text-blue-700 border-blue-200",
    STANDARD: "bg-green-50 text-green-700 border-green-200",
    PREMIUM: "bg-purple-50 text-purple-700 border-purple-200",
    VERIFIED: "bg-gold-50 text-gold-700 border-gold-200",
  };

  const badgeIcons: Record<string, any> = {
    VERIFIED: BadgeCheck,
    PREMIUM: Star,
    TOP_RATED: Star,
    FAST_RESPONSE: Zap,
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-semibold ${levelColors[level]}`}
      >
        <Shield className="w-3 h-3" />
        <span>{level}</span>
      </div>

      {badges.map((badge, index) => {
        const Icon = badgeIcons[badge] || BadgeCheck;
        return (
          <div
            key={index}
            className="inline-flex items-center space-x-1 px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700 text-xs"
            title={badge.replace(/_/g, " ")}
          >
            <Icon className="w-3 h-3" />
            <span>{badge.replace(/_/g, " ")}</span>
          </div>
        );
      })}

      {rating && rating >= 4.5 && (
        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-700 text-xs">
          <Star className="w-3 h-3 fill-current" />
          <span>Top Rated</span>
        </div>
      )}
    </div>
  );
}
