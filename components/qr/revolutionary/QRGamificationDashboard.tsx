"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function QRGamificationDashboard() {
  const [userProgress, setUserProgress] = useState({
    points: 12500,
    level: 15,
    achievements: 23,
    badges: 8,
    rank: 5,
  });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load achievements, leaderboard, challenges
      // For now, use mock data
      setAchievements([
        {
          id: "ach-1",
          name: "First Scan",
          icon: "ri-qr-scan-line",
          rarity: "common",
          unlocked: true,
        },
        {
          id: "ach-2",
          name: "QR Master",
          icon: "ri-trophy-line",
          rarity: "legendary",
          unlocked: false,
        },
        {
          id: "ach-3",
          name: "Network Builder",
          icon: "ri-node-tree",
          rarity: "epic",
          unlocked: true,
        },
        {
          id: "ach-4",
          name: "Voice Commander",
          icon: "ri-mic-line",
          rarity: "rare",
          unlocked: true,
        },
      ]);

      setLeaderboard([
        { rank: 1, name: "Ahmed Al-Rashid", points: 25000, scans: 1234 },
        { rank: 2, name: "Sarah Johnson", points: 22000, scans: 1100 },
        { rank: 3, name: "Mohammed Ali", points: 20000, scans: 980 },
        { rank: 4, name: "You", points: 12500, scans: 650 },
      ]);

      setChallenges([
        {
          id: "ch-1",
          name: "Scan 100 QR Codes",
          progress: 65,
          target: 100,
          reward: 500,
        },
        {
          id: "ch-2",
          name: "Create 10 Networks",
          progress: 7,
          target: 10,
          reward: 1000,
        },
        {
          id: "ch-3",
          name: "Use Voice Commands",
          progress: 12,
          target: 20,
          reward: 750,
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load data";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <div className="text-gray-400">Loading gamification data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <i className="ri-error-warning-line"></i>
          <div className="font-bold">Error</div>
        </div>
        <div className="text-gray-300 mb-4">{error}</div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Progress</h2>
            <div className="text-gray-300">
              Rank #{userProgress.rank} • Level {userProgress.level}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400">
              {userProgress.points.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Points</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {userProgress.achievements}
            </div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {userProgress.badges}
            </div>
            <div className="text-xs text-gray-400">Badges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {userProgress.level}
            </div>
            <div className="text-xs text-gray-400">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              #{userProgress.rank}
            </div>
            <div className="text-xs text-gray-400">Rank</div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-trophy-line text-yellow-400"></i>
          Achievements
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((ach) => (
            <motion.div
              key={ach.id}
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`p-4 rounded-lg border text-center ${
                ach.unlocked
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-gray-700 bg-gray-900/50 opacity-50"
              }`}
            >
              <i
                className={`${ach.icon} text-4xl mb-2 ${
                  ach.unlocked ? "text-yellow-400" : "text-gray-600"
                }`}
              ></i>
              <div className="font-bold text-sm">{ach.name}</div>
              <div
                className={`text-xs mt-1 ${
                  ach.rarity === "legendary"
                    ? "text-purple-400"
                    : ach.rarity === "epic"
                      ? "text-pink-400"
                      : ach.rarity === "rare"
                        ? "text-blue-400"
                        : "text-gray-400"
                }`}
              >
                {ach.rarity}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-bar-chart-line text-blue-400"></i>
          Leaderboard
        </h2>
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-lg flex items-center justify-between ${
                entry.rank === 4
                  ? "bg-yellow-500/20 border border-yellow-500"
                  : "bg-gray-900/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1
                      ? "bg-yellow-500"
                      : entry.rank === 2
                        ? "bg-gray-400"
                        : entry.rank === 3
                          ? "bg-orange-500"
                          : "bg-gray-700"
                  }`}
                >
                  {entry.rank}
                </div>
                <div>
                  <div className="font-bold">{entry.name}</div>
                  <div className="text-sm text-gray-400">
                    {entry.scans} scans
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {entry.points.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <i className="ri-flag-line text-green-400"></i>
          Active Challenges
        </h2>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold">{challenge.name}</div>
                <div className="text-yellow-400 font-bold">
                  +{challenge.reward} pts
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-800 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(challenge.progress / challenge.target) * 100}%`,
                    }}
                    className="bg-green-500 h-2 rounded-full"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  {challenge.progress}/{challenge.target}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
