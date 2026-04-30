/**
 * 🎮 QHSE GAMIFICATION PANEL
 * Engagement features: Leaderboards, Achievements, Points, Competitions
 * Modern, sexy, engaging gamification
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiAward, FiStar, FiTrendingUp } from "react-icons/fi";

// Create a safe wrapper that's ALWAYS defined - never undefined
// This ensures MotionDiv is always a valid React component
const MotionDiv =
  motion && motion.div && typeof motion.div === "function"
    ? motion.div
    : ({
        children,
        initial,
        animate,
        transition,
        whileHover,
        ...props
      }: any) => <div {...props}>{children}</div>;

interface GamificationPanelProps {
  tenantId?: string;
  customerId?: string;
  facilityId?: string;
  warehouseId?: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  department: string;
  points: number;
  rank: number;
  achievements: number;
  safetyScore: number;
  trend: "UP" | "DOWN" | "STABLE";
  avatar?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  unlockedAt?: Date | string;
  progress?: number; // 0-100
}

interface TeamStats {
  teamName: string;
  totalPoints: number;
  safetyScore: number;
  achievements: number;
  members: number;
  rank: number;
}

const QHSEGamificationPanel: React.FC<GamificationPanelProps> = ({
  tenantId,
  customerId,
  facilityId,
  warehouseId,
}) => {
  // Mock data - would come from API
  const leaderboard: LeaderboardEntry[] = [
    {
      id: "1",
      name: "Ahmed Al-Mahmoud",
      role: "Safety Officer",
      department: "Operations",
      points: 1250,
      rank: 1,
      achievements: 8,
      safetyScore: 98,
      trend: "UP",
    },
    {
      id: "2",
      name: "Fatima Al-Saud",
      role: "QHSE Manager",
      department: "QHSE",
      points: 1180,
      rank: 2,
      achievements: 7,
      safetyScore: 96,
      trend: "UP",
    },
    {
      id: "3",
      name: "Mohammed Al-Rashid",
      role: "Warehouse Supervisor",
      department: "Operations",
      points: 1120,
      rank: 3,
      achievements: 6,
      safetyScore: 94,
      trend: "STABLE",
    },
  ];

  const achievements: Achievement[] = [
    {
      id: "1",
      name: "Safety Champion",
      description: "30 days without incident",
      icon: "🛡️",
      rarity: "EPIC",
      unlockedAt: new Date(),
    },
    {
      id: "2",
      name: "Training Master",
      description: "Complete all required training",
      icon: "🎓",
      rarity: "RARE",
      progress: 85,
    },
    {
      id: "3",
      name: "Observation Expert",
      description: "Submit 100 safety observations",
      icon: "👁️",
      rarity: "COMMON",
      progress: 75,
    },
    {
      id: "4",
      name: "Zero Waste Hero",
      description: "Achieve 100% recycling rate",
      icon: "♻️",
      rarity: "LEGENDARY",
      progress: 92,
    },
  ];

  const teamStats: TeamStats = {
    teamName: "Operations Team",
    totalPoints: 12500,
    safetyScore: 95,
    achievements: 45,
    members: 25,
    rank: 1,
  };

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "LEGENDARY":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "EPIC":
        return "bg-gradient-to-r from-purple-400 to-pink-500 text-white";
      case "RARE":
        return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
      case "COMMON":
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Stats Card */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {teamStats.teamName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rank #{teamStats.rank} Team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FiAward className="w-8 h-8 text-yellow-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {teamStats.totalPoints.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Safety Score
            </p>
            <p className="text-2xl font-bold text-green-600">
              {teamStats.safetyScore}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Achievements
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {teamStats.achievements}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
            <p className="text-2xl font-bold text-blue-600">
              {teamStats.members}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400">Rank</p>
            <p className="text-2xl font-bold text-yellow-600">
              #{teamStats.rank}
            </p>
          </div>
        </div>
      </MotionDiv>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAward className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Leaderboard
            </h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <MotionDiv
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  entry.rank === 1
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300"
                    : entry.rank === 2
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border border-gray-300"
                      : entry.rank === 3
                        ? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-300"
                        : "bg-gray-50 dark:bg-gray-700/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1
                      ? "bg-yellow-500 text-white"
                      : entry.rank === 2
                        ? "bg-gray-400 text-white"
                        : entry.rank === 3
                          ? "bg-orange-500 text-white"
                          : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {entry.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {entry.points.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <span>{entry.role}</span>
                    <span>•</span>
                    <span>{entry.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiStar className="w-3 h-3 text-yellow-500" />
                      {entry.achievements}
                    </span>
                  </div>
                </div>
                {entry.trend === "UP" && (
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                )}
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiAward className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Achievements
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <MotionDiv
                key={achievement.id}
                whileHover={{ scale: 1.05 }}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlockedAt
                    ? getRarityColor(achievement.rarity)
                    : "bg-gray-100 dark:bg-gray-700 border-gray-300"
                }`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <h4
                  className={`font-semibold mb-1 ${achievement.unlockedAt ? "text-white" : "text-gray-900 dark:text-gray-100"}`}
                >
                  {achievement.name}
                </h4>
                <p
                  className={`text-xs ${achievement.unlockedAt ? "text-white/90" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {achievement.description}
                </p>
                {achievement.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      {achievement.progress}%
                    </p>
                  </div>
                )}
                {achievement.unlockedAt && (
                  <p className="text-xs text-white/80 mt-1">
                    Unlocked{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </MotionDiv>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QHSEGamificationPanel;
