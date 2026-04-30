"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import { calculateOvertime } from "@/utils/overtimeCalculator";
import CurrencyDisplay from "@/components/CurrencyDisplay";

interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: Date | string;
  startTime: Date | string;
  endTime: Date | string;
  standardHours: number;
  overtimeHours: number;
  breakHours: number;
  preShiftHours: number;
  totalHours: number;
  overtimeRate: number;
  overtimeCost: number;
  currency: string;
  operationType:
    | "INBOUND"
    | "OUTBOUND"
    | "PUTAWAY"
    | "PICKING"
    | "QC"
    | "DISPATCHING"
    | "OTHER";
  operationReference?: string;
  approvedBy?: string;
  approvedAt?: Date | string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  notes?: string;
  createdAt: Date | string;
}

const generateOvertimeRecords = (count: number = 100): OvertimeRecord[] => {
  const employees = [
    "Ahmed Al-Mansoori",
    "Fatima Al-Zahra",
    "Mohammed Al-Shehhi",
    "Aisha Al-Kaabi",
    "Khalid Al-Mazrouei",
    "Mariam Al-Dhaheri",
    "Omar Al-Hosani",
    "Layla Al-Suwaidi",
    "Hassan Al-Nuaimi",
    "Noor Al-Mazrouei",
    "Yusuf Al-Kaabi",
    "Zainab Al-Shehhi",
  ];
  const departments = [
    "Inbound",
    "Outbound",
    "Putaway",
    "Picking",
    "QC",
    "Dispatching",
    "Maintenance",
  ];
  const operationTypes: OvertimeRecord["operationType"][] = [
    "INBOUND",
    "OUTBOUND",
    "PUTAWAY",
    "PICKING",
    "QC",
    "DISPATCHING",
    "OTHER",
  ];
  const statuses: OvertimeRecord["status"][] = [
    "PENDING",
    "APPROVED",
    "REJECTED",
    "PAID",
  ];

  return Array.from({ length: count }, (_, i) => {
    const employee = employees[Math.floor(Math.random() * employees.length)];
    const date = new Date(Date.now() - Math.random() * 30 * 86400000);
    const startHour = 7 + Math.floor(Math.random() * 3); // 7-9 AM
    const endHour = 17 + Math.floor(Math.random() * 4); // 5-8 PM
    const startTime = new Date(date);
    startTime.setHours(startHour, Math.floor(Math.random() * 60), 0);
    const endTime = new Date(date);
    endTime.setHours(endHour, Math.floor(Math.random() * 60), 0);

    const overtimeCalc = calculateOvertime(startTime, endTime);
    const overtimeRate = 1.5; // 1.5x standard rate
    const standardRate = 50; // SAR per hour
    const overtimeCost =
      overtimeCalc.overtimeHours * standardRate * overtimeRate;

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `OT-${String(i + 1).padStart(6, "0")}`,
      employeeId: `EMP-${String((i % 50) + 1).padStart(6, "0")}`,
      employeeName: employee,
      department: departments[Math.floor(Math.random() * departments.length)],
      date,
      startTime,
      endTime,
      standardHours: overtimeCalc.standardHours,
      overtimeHours: overtimeCalc.overtimeHours,
      breakHours: overtimeCalc.breakHours,
      preShiftHours: overtimeCalc.preShiftHours,
      totalHours: overtimeCalc.totalHours,
      overtimeRate,
      overtimeCost: parseFloat(overtimeCost.toFixed(2)),
      currency: "SAR",
      operationType:
        operationTypes[Math.floor(Math.random() * operationTypes.length)],
      operationReference:
        Math.random() > 0.5
          ? `ASN-${String(Math.floor(Math.random() * 1000) + 1).padStart(6, "0")}`
          : undefined,
      approvedBy:
        status === "APPROVED" || status === "PAID"
          ? `Manager ${Math.floor(Math.random() * 5) + 1}`
          : undefined,
      approvedAt:
        status === "APPROVED" || status === "PAID"
          ? new Date(date.getTime() + 86400000)
          : undefined,
      status,
      notes: Math.random() > 0.7 ? "Additional work required" : undefined,
      createdAt: date,
    };
  });
};

export default function OvertimeTracking() {
  const router = useRouter();
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() =>
    generateOvertimeRecords(150),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedOperationType, setSelectedOperationType] =
    useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(
    null,
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalRecords: 0,
    pendingApproval: 0,
    totalOvertimeHours: 0,
    totalOvertimeCost: 0,
  });

  const filteredRecords = useMemo(() => {
    return overtimeRecords.filter((record) => {
      const matchesSearch =
        record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.operationReference
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "ALL" || record.status === selectedStatus;
      const matchesDepartment =
        selectedDepartment === "ALL" ||
        record.department === selectedDepartment;
      const matchesOperationType =
        selectedOperationType === "ALL" ||
        record.operationType === selectedOperationType;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesOperationType
      );
    });
  }, [
    overtimeRecords,
    searchQuery,
    selectedStatus,
    selectedDepartment,
    selectedOperationType,
  ]);

  // Analytics
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    overtimeRecords.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [overtimeRecords]);

  const departmentDistribution = useMemo(() => {
    const counts: Record<
      string,
      { count: number; totalHours: number; totalCost: number }
    > = {};
    overtimeRecords.forEach((r) => {
      if (!counts[r.department]) {
        counts[r.department] = { count: 0, totalHours: 0, totalCost: 0 };
      }
      counts[r.department].count++;
      counts[r.department].totalHours += r.overtimeHours;
      counts[r.department].totalCost += r.overtimeCost;
    });
    return Object.entries(counts).map(([department, data]) => ({
      department,
      count: data.count,
      totalHours: data.totalHours,
      totalCost: data.totalCost,
    }));
  }, [overtimeRecords]);

  const dailyTrend = useMemo(() => {
    const dailyData: Record<
      string,
      { date: string; hours: number; cost: number }
    > = {};

    overtimeRecords.forEach((r) => {
      const date = format(new Date(r.date), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, hours: 0, cost: 0 };
      }
      dailyData[date].hours += r.overtimeHours;
      dailyData[date].cost += r.overtimeCost;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        hours: d.hours,
        cost: d.cost,
      }));
  }, [overtimeRecords]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalRecords = overtimeRecords.length;
    const pendingApproval = overtimeRecords.filter(
      (r) => r.status === "PENDING",
    ).length;
    const totalOvertimeHours = overtimeRecords.reduce(
      (sum, r) => sum + r.overtimeHours,
      0,
    );
    const totalOvertimeCost = overtimeRecords.reduce(
      (sum, r) => sum + r.overtimeCost,
      0,
    );

    return {
      totalRecords,
      pendingApproval,
      totalOvertimeHours,
      totalOvertimeCost,
    };
  }, [overtimeRecords]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "overtime-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "overtime-stats",
      () => ({
        totalRecords: aggregateStats.totalRecords,
        pendingApproval: simulateKPIUpdates(
          aggregateStats.pendingApproval,
          0.1,
        ),
        totalOvertimeHours: simulateKPIUpdates(
          aggregateStats.totalOvertimeHours,
          0.05,
        ),
        totalOvertimeCost: simulateKPIUpdates(
          aggregateStats.totalOvertimeCost,
          0.05,
        ),
      }),
      5000,
      true,
    );

    return () => {
      unsubscribe();
      stop();
    };
  }, [
    realTimeEnabled,
    aggregateStats.totalRecords,
    aggregateStats.pendingApproval,
    aggregateStats.totalOvertimeHours,
    aggregateStats.totalOvertimeCost,
  ]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(overtimeRecords.map((r) => r.department))).sort();
  }, [overtimeRecords]);

  const stats = [
    {
      label: "Total Records",
      value: realTimeEnabled
        ? realTimeStats.totalRecords
        : aggregateStats.totalRecords,
      icon: "ri-time-zone-line",
      tooltip: "Total overtime records",
      trend: "up" as const,
    },
    {
      label: "Pending Approval",
      value: realTimeEnabled
        ? realTimeStats.pendingApproval
        : aggregateStats.pendingApproval,
      icon: "ri-time-line",
      tooltip: "Records pending approval",
      trend: "neutral" as const,
    },
    {
      label: "Total Overtime Hours",
      value: `${(realTimeEnabled ? realTimeStats.totalOvertimeHours : aggregateStats.totalOvertimeHours).toFixed(1)} hrs`,
      icon: "ri-timer-line",
      tooltip: "Total overtime hours",
      trend: "up" as const,
    },
    {
      label: "Total Cost",
      value: realTimeEnabled
        ? realTimeStats.totalOvertimeCost
        : aggregateStats.totalOvertimeCost,
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Total overtime cost",
      trend: "up" as const,
    },
  ];

  const COLORS = [
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  const handleView = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleApprove = (record: OvertimeRecord) => {
    setSelectedRecord(record);
    setShowApproveModal(true);
  };

  const confirmApprove = () => {
    if (selectedRecord) {
      setOvertimeRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? {
                ...r,
                status: "APPROVED" as const,
                approvedBy: "Current User",
                approvedAt: new Date(),
              }
            : r,
        ),
      );
      setShowApproveModal(false);
      setSelectedRecord(null);
    }
  };

  return (
    <PageTemplate
      title="Overtime Tracking"
      description="Employee overtime tracking with automatic calculation, approval workflow, cost analysis, and department analytics"
      icon="ri-time-zone-line"
      systemInfo={{
        sap: "Time Management, Overtime Tracking",
        oracle: "Time and Labor, Overtime Management",
        manhattan: "Labor Management, Overtime Tracking",
      }}
      examples={[
        "Automatic overtime calculation",
        "Approval workflow",
        "Department-wise analytics",
        "Cost tracking",
        "Operation type tracking",
      ]}
      stats={stats}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-lg p-1 sm:p-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Table View"
            >
              <i className="ri-table-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Grid View"
            >
              <i className="ri-grid-line text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={`p-1.5 sm:p-2 rounded transition-colors ${
                viewMode === "analytics"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-[#9ca3af] hover:text-white"
              }`}
              title="Analytics View"
            >
              <i className="ri-bar-chart-line text-sm sm:text-base"></i>
            </button>
          </div>
          <button
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              realTimeEnabled
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-[#9ca3af] border border-white/10"
            }`}
          >
            <i
              className={`ri-${realTimeEnabled ? "radio-button-line" : "checkbox-blank-circle-line"} mr-1`}
            ></i>
            Real-time
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search overtime records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PAID">Paid</option>
        </select>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Departments</option>
          {uniqueDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <select
          value={selectedOperationType}
          onChange={(e) => setSelectedOperationType(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Operations</option>
          <option value="INBOUND">Inbound</option>
          <option value="OUTBOUND">Outbound</option>
          <option value="PUTAWAY">Putaway</option>
          <option value="PICKING">Picking</option>
          <option value="QC">QC</option>
          <option value="DISPATCHING">Dispatching</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {record.employeeName}
                        </div>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {record.employeeId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          {format(new Date(record.startTime), "HH:mm")} -{" "}
                          {format(new Date(record.endTime), "HH:mm")}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Total: {record.totalHours.toFixed(1)}h
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {record.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {record.operationType}
                      </div>
                      {record.operationReference && (
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {record.operationReference}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white font-medium">
                          OT: {record.overtimeHours.toFixed(1)}h
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Std: {record.standardHours.toFixed(1)}h
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {record.overtimeCost.toLocaleString()} {record.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          record.status === "APPROVED" ||
                          record.status === "PAID"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : record.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(record)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        {record.status === "PENDING" && (
                          <Tooltip content="Approve" position="top">
                            <button
                              onClick={() => handleApprove(record)}
                              className="p-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded hover:bg-green-600/30 transition-colors"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {record.employeeName}
                  </h3>
                  <p className="text-sm text-[#9ca3af] font-mono">
                    {record.employeeId}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    record.status === "APPROVED" || record.status === "PAID"
                      ? "bg-green-500/20 text-green-400"
                      : record.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {record.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Date:</span>
                  <span className="text-white">
                    {format(new Date(record.date), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Time:</span>
                  <span className="text-white">
                    {format(new Date(record.startTime), "HH:mm")} -{" "}
                    {format(new Date(record.endTime), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Department:</span>
                  <span className="text-white text-xs">
                    {record.department}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Operation:</span>
                  <span className="text-white text-xs">
                    {record.operationType}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Overtime Hours:</span>
                  <span className="text-white font-medium">
                    {record.overtimeHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Cost:</span>
                  <span className="text-white font-medium">
                    {record.overtimeCost.toLocaleString()} {record.currency}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(record)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                {record.status === "PENDING" && (
                  <button
                    onClick={() => handleApprove(record)}
                    className="px-3 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded text-sm font-medium hover:bg-green-600/30 transition-colors"
                  >
                    <i className="ri-check-line"></i>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Department Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="department"
                    stroke="#9ca3af"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="totalHours"
                    fill="#06b6d4"
                    name="Overtime Hours"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="totalCost"
                    fill="#10b981"
                    name="Total Cost"
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Daily Overtime Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="hours"
                  fill="#06b6d4"
                  name="Overtime Hours"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Cost (SAR)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        title={`Overtime Details - ${selectedRecord?.employeeName || ""}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Employee</div>
                <div className="text-white font-medium">
                  {selectedRecord.employeeName}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedRecord.employeeId}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Date</div>
                <div className="text-white">
                  {format(new Date(selectedRecord.date), "PP")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Start Time</div>
                <div className="text-white">
                  {format(new Date(selectedRecord.startTime), "PPp")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">End Time</div>
                <div className="text-white">
                  {format(new Date(selectedRecord.endTime), "PPp")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Department</div>
                <div className="text-white">{selectedRecord.department}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">
                  Operation Type
                </div>
                <div className="text-white">{selectedRecord.operationType}</div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedRecord.status === "APPROVED" ||
                    selectedRecord.status === "PAID"
                      ? "bg-green-500/20 text-green-400"
                      : selectedRecord.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedRecord.status}
                </span>
              </div>
              {selectedRecord.operationReference && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Operation Reference
                  </div>
                  <div className="text-white font-mono">
                    {selectedRecord.operationReference}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Hours Breakdown</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Standard Hours
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {selectedRecord.standardHours.toFixed(1)}h
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">
                    Overtime Hours
                  </div>
                  <div className="text-lg font-semibold text-yellow-400">
                    {selectedRecord.overtimeHours.toFixed(1)}h
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">Break Hours</div>
                  <div className="text-lg font-semibold text-gray-400">
                    {selectedRecord.breakHours.toFixed(1)}h
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-xs text-[#9ca3af] mb-1">Total Hours</div>
                  <div className="text-lg font-semibold text-cyan-400">
                    {selectedRecord.totalHours.toFixed(1)}h
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">
                Cost Information
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Overtime Cost</div>
                <div className="text-2xl font-bold text-white">
                  {selectedRecord.overtimeCost.toLocaleString()}{" "}
                  {selectedRecord.currency}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">
                  Rate: {selectedRecord.overtimeRate}x standard rate
                </div>
              </div>
            </div>
            {selectedRecord.approvedBy && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Approved By</div>
                <div className="text-white">{selectedRecord.approvedBy}</div>
                {selectedRecord.approvedAt && (
                  <div className="text-xs text-[#9ca3af] mt-1">
                    {format(new Date(selectedRecord.approvedAt), "PPp")}
                  </div>
                )}
              </div>
            )}
            {selectedRecord.notes && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Notes</div>
                <div className="text-white">{selectedRecord.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRecord(null);
        }}
        title="Approve Overtime"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <p className="text-white">
              Approve overtime record for{" "}
              <strong>{selectedRecord.employeeName}</strong>?
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-[#9ca3af] mb-2">
                Overtime Details
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Date:</span>
                  <span className="text-white">
                    {format(new Date(selectedRecord.date), "PP")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Overtime Hours:</span>
                  <span className="text-white font-medium">
                    {selectedRecord.overtimeHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9ca3af]">Cost:</span>
                  <span className="text-white font-medium">
                    {selectedRecord.overtimeCost.toLocaleString()}{" "}
                    {selectedRecord.currency}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={confirmApprove}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRecord(null);
                }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageTemplate>
  );
}
