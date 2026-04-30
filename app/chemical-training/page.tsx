/**
 * Chemical Training & Certification Module
 * Training courses, employee tracking, certification renewals
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import {
  ChemicalTraining,
  TrainingType,
  TrainingStatus,
} from "@/types/chemical";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type TabType =
  | "overview"
  | "courses"
  | "employees"
  | "certifications"
  | "renewals";

export default function ChemicalTrainingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [trainings, setTrainings] = useState<ChemicalTraining[]>([]);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    // TODO: Load from API
    setTrainings([]);
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "ri-dashboard-line" },
    {
      id: "courses" as TabType,
      label: "Training Courses",
      icon: "ri-book-open-line",
    },
    {
      id: "employees" as TabType,
      label: "Employee Training",
      icon: "ri-user-line",
    },
    {
      id: "certifications" as TabType,
      label: "Certifications",
      icon: "ri-award-line",
    },
    { id: "renewals" as TabType, label: "Renewals", icon: "ri-refresh-line" },
  ];

  return (
    <PageTemplate
      title="Chemical Training & Certification"
      description="Training courses, employee tracking, certification renewals"
      icon="ri-graduation-cap-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TrainingOverviewTab trainings={trainings} />
            </motion.div>
          )}

          {activeTab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TrainingCoursesTab />
            </motion.div>
          )}

          {activeTab === "employees" && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmployeeTrainingTab trainings={trainings} />
            </motion.div>
          )}

          {activeTab === "certifications" && (
            <motion.div
              key="certifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CertificationsTab trainings={trainings} />
            </motion.div>
          )}

          {activeTab === "renewals" && (
            <motion.div
              key="renewals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RenewalsTab trainings={trainings} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// TRAINING OVERVIEW TAB
// ============================================================================

interface TrainingOverviewTabProps {
  trainings: ChemicalTraining[];
}

function TrainingOverviewTab({ trainings }: TrainingOverviewTabProps) {
  const totalTrainings = trainings.length;
  const completed = trainings.filter((t) => t.status === "Completed").length;
  const inProgress = trainings.filter((t) => t.status === "In Progress").length;
  const expired = trainings.filter((t) => t.status === "Expired").length;
  const renewalRequired = trainings.filter(
    (t) => t.status === "Renewal Required",
  ).length;

  // Status distribution
  const statusDistribution = [
    { name: "Completed", value: completed, color: "#10b981" },
    { name: "In Progress", value: inProgress, color: "#f59e0b" },
    { name: "Expired", value: expired, color: "#ef4444" },
    { name: "Renewal Required", value: renewalRequired, color: "#dc2626" },
  ];

  // Training trends
  const trainingTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      completed: Math.floor(Math.random() * 20),
      started: Math.floor(Math.random() * 15),
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Trainings</span>
            <i className="ri-graduation-cap-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{totalTrainings}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Completed</span>
            <i className="ri-checkbox-circle-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{completed}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">In Progress</span>
            <i className="ri-time-line text-yellow-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{inProgress}</div>
        </div>
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Renewal Required</span>
            <i className="ri-refresh-line text-red-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{renewalRequired}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Training Status Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Training Trends */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Training Trends (Last 12 Months)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trainingTrend}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="completed"
                stackId="1"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorCompleted)"
              />
              <Area
                type="monotone"
                dataKey="started"
                stackId="2"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorStarted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training by Type */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Training by Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Chemical Safety",
            "MSDS Reading",
            "Emergency Response",
            "Hazard Communication",
          ].map((type) => {
            const count = trainings.filter((t) => t.type === type).length;
            return (
              <div
                key={type}
                className="p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <p className="text-sm text-gray-400 mb-1">{type}</p>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TRAINING COURSES TAB
// ============================================================================

function TrainingCoursesTab() {
  const courses = [
    {
      id: "1",
      name: "Chemical Safety Fundamentals",
      type: "Chemical Safety",
      duration: 4,
    },
    {
      id: "2",
      name: "MSDS Reading & Interpretation",
      type: "MSDS Reading",
      duration: 2,
    },
    {
      id: "3",
      name: "Emergency Response Procedures",
      type: "Emergency Response",
      duration: 6,
    },
    {
      id: "4",
      name: "Hazard Communication",
      type: "Hazard Communication",
      duration: 3,
    },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Training Courses</h3>
        <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
          <i className="ri-add-line mr-2"></i>
          New Course
        </button>
      </div>
      <div className="space-y-2">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-4 rounded-lg bg-gray-700 border border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{course.name}</p>
                <p className="text-sm text-gray-400">
                  {course.type} • {course.duration} hours
                </p>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm transition">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EMPLOYEE TRAINING TAB
// ============================================================================

function EmployeeTrainingTab({ trainings }: { trainings: ChemicalTraining[] }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Employee Training Records</h3>
      {trainings.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No training records found
        </p>
      ) : (
        <div className="space-y-2">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{training.employeeName}</p>
                  <p className="text-sm text-gray-400">{training.courseName}</p>
                  {training.completionDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completed:{" "}
                      {new Date(training.completionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    training.status === "Completed"
                      ? "bg-green-900/30 text-green-400"
                      : training.status === "In Progress"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : training.status === "Expired"
                          ? "bg-red-900/30 text-red-400"
                          : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {training.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CERTIFICATIONS TAB
// ============================================================================

function CertificationsTab({ trainings }: { trainings: ChemicalTraining[] }) {
  const certifications = trainings.filter((t) => t.certificateNumber);

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Certifications</h3>
      {certifications.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          No certifications found
        </p>
      ) : (
        <div className="space-y-2">
          {certifications.map((training) => (
            <div
              key={training.id}
              className="p-4 rounded-lg bg-gray-700 border border-gray-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{training.employeeName}</p>
                  <p className="text-sm text-gray-400">{training.courseName}</p>
                  {training.certificateNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      Cert #: {training.certificateNumber}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    training.status === "Completed"
                      ? "bg-green-900/30 text-green-400"
                      : training.status === "Expired"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-yellow-900/30 text-yellow-400"
                  }`}
                >
                  {training.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RENEWALS TAB
// ============================================================================

function RenewalsTab({ trainings }: { trainings: ChemicalTraining[] }) {
  const renewalsNeeded = trainings.filter(
    (t) =>
      t.status === "Renewal Required" ||
      (t.expiryDate && new Date(t.expiryDate) < new Date()),
  );

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Renewals Required</h3>
      {renewalsNeeded.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No renewals required</p>
      ) : (
        <div className="space-y-2">
          {renewalsNeeded.map((training) => {
            const daysUntilExpiry = training.expiryDate
              ? Math.ceil(
                  (new Date(training.expiryDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0;

            return (
              <div
                key={training.id}
                className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{training.employeeName}</p>
                    <p className="text-sm text-gray-400">
                      {training.courseName}
                    </p>
                    {training.expiryDate && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Expires:{" "}
                        {new Date(training.expiryDate).toLocaleDateString()}
                        {daysUntilExpiry > 0 && ` (${daysUntilExpiry} days)`}
                        {daysUntilExpiry <= 0 && " (EXPIRED)"}
                      </p>
                    )}
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-sm transition">
                    Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
