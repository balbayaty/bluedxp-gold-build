"use client";

import React from "react";
import type { MessagingQuality } from "@/types/brand-messaging";

interface QualityAnalyzerProps {
  quality: MessagingQuality;
}

export const QualityAnalyzer: React.FC<QualityAnalyzerProps> = ({
  quality,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/50";
    if (score >= 60) return "bg-yellow-500/20 border-yellow-500/50";
    return "bg-red-500/20 border-red-500/50";
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Quality Analysis</h3>
        <div
          className={`text-2xl font-bold ${getScoreColor(quality.overallScore)}`}
        >
          {quality.overallScore}%
        </div>
      </div>

      {/* Overall Score Bar */}
      <div className="w-full bg-slate-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            quality.overallScore >= 80
              ? "bg-green-500"
              : quality.overallScore >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
          }`}
          style={{ width: `${quality.overallScore}%` }}
        />
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-lg border ${getScoreBg(quality.voiceCheck.score)}`}
        >
          <div className="text-sm text-slate-400 mb-2">Voice Check</div>
          <div
            className={`text-2xl font-bold ${getScoreColor(quality.voiceCheck.score)}`}
          >
            {quality.voiceCheck.score}%
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div
              className={`flex items-center gap-2 ${quality.voiceCheck.soundsLikeBlueDXP ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.voiceCheck.soundsLikeBlueDXP ? "✓" : "✗"}</span>
              <span>Sounds like BlueDXP</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.voiceCheck.avoidsBannedWords ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.voiceCheck.avoidsBannedWords ? "✓" : "✗"}</span>
              <span>Avoids banned words</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.voiceCheck.quotable ? "text-green-400" : "text-yellow-400"}`}
            >
              <span>{quality.voiceCheck.quotable ? "✓" : "○"}</span>
              <span>Quotable</span>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${getScoreBg(quality.clarityCheck.score)}`}
        >
          <div className="text-sm text-slate-400 mb-2">Clarity Check</div>
          <div
            className={`text-2xl font-bold ${getScoreColor(quality.clarityCheck.score)}`}
          >
            {quality.clarityCheck.score}%
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div
              className={`flex items-center gap-2 ${quality.clarityCheck.firstTimeUserUnderstands ? "text-green-400" : "text-red-400"}`}
            >
              <span>
                {quality.clarityCheck.firstTimeUserUnderstands ? "✓" : "✗"}
              </span>
              <span>First-time user understands</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.clarityCheck.minimumWords ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.clarityCheck.minimumWords ? "✓" : "✗"}</span>
              <span>Minimum words</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.clarityCheck.avoidsJargon ? "text-green-400" : "text-yellow-400"}`}
            >
              <span>{quality.clarityCheck.avoidsJargon ? "✓" : "○"}</span>
              <span>Avoids jargon</span>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${getScoreBg(quality.emotionalCheck.score)}`}
        >
          <div className="text-sm text-slate-400 mb-2">Emotional Check</div>
          <div
            className={`text-2xl font-bold ${getScoreColor(quality.emotionalCheck.score)}`}
          >
            {quality.emotionalCheck.score}%
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div
              className={`flex items-center gap-2 ${quality.emotionalCheck.respectsIntelligence ? "text-green-400" : "text-red-400"}`}
            >
              <span>
                {quality.emotionalCheck.respectsIntelligence ? "✓" : "✗"}
              </span>
              <span>Respects intelligence</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.emotionalCheck.feelsHuman ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.emotionalCheck.feelsHuman ? "✓" : "✗"}</span>
              <span>Feels human</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.emotionalCheck.maintainsDignity ? "text-green-400" : "text-yellow-400"}`}
            >
              <span>{quality.emotionalCheck.maintainsDignity ? "✓" : "○"}</span>
              <span>Maintains dignity</span>
            </div>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${getScoreBg(quality.culturalCheck.score)}`}
        >
          <div className="text-sm text-slate-400 mb-2">Cultural Check</div>
          <div
            className={`text-2xl font-bold ${getScoreColor(quality.culturalCheck.score)}`}
          >
            {quality.culturalCheck.score}%
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div
              className={`flex items-center gap-2 ${quality.culturalCheck.worksForMENA ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.culturalCheck.worksForMENA ? "✓" : "✗"}</span>
              <span>Works for MENA</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.culturalCheck.arabicFeelsNative ? "text-green-400" : "text-red-400"}`}
            >
              <span>{quality.culturalCheck.arabicFeelsNative ? "✓" : "✗"}</span>
              <span>Arabic feels native</span>
            </div>
            <div
              className={`flex items-center gap-2 ${quality.culturalCheck.appropriateForBusiness ? "text-green-400" : "text-yellow-400"}`}
            >
              <span>
                {quality.culturalCheck.appropriateForBusiness ? "✓" : "○"}
              </span>
              <span>Appropriate for business</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {quality.recommendations && quality.recommendations.length > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-300 mb-2">
            Recommendations:
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-yellow-200">
            {quality.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
