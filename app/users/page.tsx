"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/ui/Tooltip";
import Modal from "@/components/ui/Modal";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role:
    | "ADMIN"
    | "WAREHOUSE_MANAGER"
    | "SUPERVISOR"
    | "OPERATOR"
    | "VIEWER"
    | "CUSTOM";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  department?: string;
  warehouse?: string;
  lastLogin?: Date | string;
  createdAt: Date | string;
  permissions: string[];
  loginCount: number;
  lastActivity?: Date | string;
  phone?: string;
  avatar?: string;
}

const generateUsers = (count: number = 100): User[] => {
  const roles: User["role"][] = [
    "ADMIN",
    "WAREHOUSE_MANAGER",
    "SUPERVISOR",
    "OPERATOR",
    "VIEWER",
    "CUSTOM",
  ];
  const statuses: User["status"][] = [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "PENDING",
  ];
  const departments = [
    "Operations",
    "Quality",
    "Inventory",
    "Logistics",
    "IT",
    "Management",
  ];
  const warehouses = ["WH-DXB-001", "WH-AUH-002", "WH-SHJ-003"];

  const names = [
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

  return Array.from({ length: count }, (_, i) => {
    const name = names[Math.floor(Math.random() * names.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const department =
      Math.random() > 0.3
        ? departments[Math.floor(Math.random() * departments.length)]
        : undefined;
    const warehouse =
      Math.random() > 0.5
        ? warehouses[Math.floor(Math.random() * warehouses.length)]
        : undefined;

    return {
      id: `USER-${String(i + 1).padStart(6, "0")}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      fullName: name,
      role,
      status,
      department,
      warehouse,
      lastLogin:
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 30 * 86400000)
          : undefined,
      createdAt: new Date(Date.now() - Math.random() * 365 * 86400000),
      permissions: ["VIEW", "CREATE", "EDIT"].slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      ),
      loginCount: Math.floor(Math.random() * 500),
      lastActivity:
        Math.random() > 0.3
          ? new Date(Date.now() - Math.random() * 7 * 86400000)
          : undefined,
      phone: `+971${Math.floor(Math.random() * 90000000 + 500000000)}`,
    };
  });
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(() => generateUsers(100));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [realTimeStats, setRealTimeStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    totalLogins: 0,
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
      const matchesStatus =
        selectedStatus === "ALL" || user.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return Object.entries(counts).map(([role, count]) => ({
      role: role.replace(/_/g, " "),
      count,
    }));
  }, [users]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.status] = (counts[u.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [users]);

  const loginTrend = useMemo(() => {
    const dailyData: Record<string, { date: string; logins: number }> = {};

    users.forEach((u) => {
      if (u.lastLogin) {
        const date = format(new Date(u.lastLogin), "yyyy-MM-dd");
        if (!dailyData[date]) {
          dailyData[date] = { date, logins: 0 };
        }
        dailyData[date].logins++;
      }
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
      .map((d) => ({
        date: format(new Date(d.date), "MMM dd"),
        logins: d.logins,
      }));
  }, [users]);

  const aggregateStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
    const onlineUsers = users.filter((u) => {
      if (!u.lastActivity) return false;
      const hoursSinceActivity =
        (Date.now() - new Date(u.lastActivity).getTime()) / (1000 * 60 * 60);
      return hoursSinceActivity < 1;
    }).length;
    const totalLogins = users.reduce((sum, u) => sum + u.loginCount, 0);

    return {
      totalUsers,
      activeUsers,
      onlineUsers,
      totalLogins,
    };
  }, [users]);

  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "users-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "users-stats",
      () => ({
        totalUsers: aggregateStats.totalUsers,
        activeUsers: simulateKPIUpdates(aggregateStats.activeUsers, 0.05),
        onlineUsers: simulateKPIUpdates(aggregateStats.onlineUsers, 0.1),
        totalLogins: aggregateStats.totalLogins,
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
    aggregateStats.totalUsers,
    aggregateStats.activeUsers,
    aggregateStats.onlineUsers,
    aggregateStats.totalLogins,
  ]);

  const stats = [
    {
      label: "Total Users",
      value: realTimeEnabled
        ? realTimeStats.totalUsers
        : aggregateStats.totalUsers,
      icon: "ri-user-3-line",
      tooltip: "Total users",
      trend: "up" as const,
    },
    {
      label: "Active Users",
      value: realTimeEnabled
        ? realTimeStats.activeUsers
        : aggregateStats.activeUsers,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active users",
      trend: "up" as const,
    },
    {
      label: "Online Now",
      value: realTimeEnabled
        ? realTimeStats.onlineUsers
        : aggregateStats.onlineUsers,
      icon: "ri-user-online-line",
      tooltip: "Users online now",
      trend: "neutral" as const,
    },
    {
      label: "Total Logins",
      value: realTimeEnabled
        ? realTimeStats.totalLogins
        : aggregateStats.totalLogins,
      icon: "ri-login-box-line",
      tooltip: "Total login count",
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

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      department: user.department,
      warehouse: user.warehouse,
      phone: user.phone,
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setFormData({
      role: "OPERATOR",
      status: "PENDING",
      permissions: [],
    });
    setShowCreateModal(true);
  };

  const handleSave = () => {
    if (selectedUser && formData.username) {
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, ...formData } : u)),
      );
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({});
    } else if (formData.username && formData.email && formData.fullName) {
      const newUser: User = {
        id: `USER-${String(users.length + 1).padStart(6, "0")}`,
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role || "OPERATOR",
        status: formData.status || "PENDING",
        department: formData.department,
        warehouse: formData.warehouse,
        phone: formData.phone,
        permissions: formData.permissions || [],
        loginCount: 0,
        createdAt: new Date(),
      };
      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      setFormData({});
    }
  };

  return (
    <PageTemplate
      title="User Management"
      description="User account management with role-based access control, permissions, activity tracking, and user analytics"
      icon="ri-user-3-line"
      systemInfo={{
        sap: "User Management, User Administration",
        oracle: "User Management, User Administration",
        manhattan: "User Management, User Administration",
      }}
      examples={[
        "User account management",
        "Role-based access control",
        "Permission management",
        "Activity tracking",
        "User analytics",
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
            onClick={handleCreate}
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Create User
          </button>
          <button
            onClick={() => router.push("/settings/users")}
            className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-settings-3-line"></i>
            Advanced Settings
          </button>
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
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="OPERATOR">Operator</option>
          <option value="VIEWER">Viewer</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
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
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Logins
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {user.email}
                          </div>
                          <div className="text-xs text-[#9ca3af] font-mono">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {user.department || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.warehouse ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/warehouses?warehouse=${user.warehouse}`,
                            )
                          }
                          className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
                        >
                          {user.warehouse}
                        </button>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : user.status === "SUSPENDED"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : user.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.lastLogin ? (
                        <div className="text-sm text-white">
                          {format(new Date(user.lastLogin), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white font-medium">
                        {user.loginCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" position="top">
                          <button
                            onClick={() => handleView(user)}
                            className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-600/30 transition-colors"
                          >
                            <i className="ri-eye-line"></i>
                          </button>
                        </Tooltip>
                        <Tooltip content="Edit User" position="top">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors"
                          >
                            <i className="ri-edit-line"></i>
                          </button>
                        </Tooltip>
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
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {user.fullName}
                    </h3>
                    <p className="text-sm text-[#9ca3af]">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    user.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : user.status === "SUSPENDED"
                        ? "bg-red-500/20 text-red-400"
                        : user.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Role:</span>
                  <span className="text-white text-xs">
                    {user.role.replace(/_/g, " ")}
                  </span>
                </div>
                {user.department && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Department:</span>
                    <span className="text-white text-xs">
                      {user.department}
                    </span>
                  </div>
                )}
                {user.warehouse && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Warehouse:</span>
                    <button
                      onClick={() =>
                        router.push(`/warehouses?warehouse=${user.warehouse}`)
                      }
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-xs"
                    >
                      {user.warehouse}
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Last Login:</span>
                  <span className="text-white text-xs">
                    {user.lastLogin
                      ? format(new Date(user.lastLogin), "MMM dd")
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Total Logins:</span>
                  <span className="text-white font-medium">
                    {user.loginCount}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(user)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <button
                  onClick={() => handleEdit(user)}
                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                >
                  <i className="ri-edit-line"></i>
                </button>
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
                Role Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, count }) => `${role}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {roleDistribution.map((entry, index) => (
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
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" />
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
              Daily Login Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={loginTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="logins"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Logins"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        title={`User Details - ${selectedUser?.fullName || ""}`}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-2xl">
                {selectedUser.fullName.charAt(0)}
              </div>
              <div>
                <div className="text-xl font-semibold text-white">
                  {selectedUser.fullName}
                </div>
                <div className="text-sm text-[#9ca3af]">
                  {selectedUser.email}
                </div>
                <div className="text-xs text-[#9ca3af] font-mono">
                  {selectedUser.username}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Role</div>
                <div className="text-white">
                  {selectedUser.role.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedUser.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedUser.status === "SUSPENDED"
                        ? "bg-red-500/20 text-red-400"
                        : selectedUser.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedUser.status}
                </span>
              </div>
              {selectedUser.department && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Department</div>
                  <div className="text-white">{selectedUser.department}</div>
                </div>
              )}
              {selectedUser.warehouse && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Warehouse</div>
                  <button
                    onClick={() =>
                      router.push(
                        `/warehouses?warehouse=${selectedUser.warehouse}`,
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-mono"
                  >
                    {selectedUser.warehouse}
                  </button>
                </div>
              )}
              {selectedUser.phone && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Phone</div>
                  <div className="text-white">{selectedUser.phone}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Created At</div>
                <div className="text-white">
                  {format(new Date(selectedUser.createdAt), "PPp")}
                </div>
              </div>
              {selectedUser.lastLogin && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Last Login</div>
                  <div className="text-white">
                    {format(new Date(selectedUser.lastLogin), "PPp")}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Total Logins</div>
                <div className="text-lg font-semibold text-white">
                  {selectedUser.loginCount}
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-[#9ca3af] mb-1">Permissions</div>
                <div className="text-lg font-semibold text-white">
                  {selectedUser.permissions.length}
                </div>
              </div>
            </div>
            {selectedUser.permissions.length > 0 && (
              <div>
                <div className="text-sm text-[#9ca3af] mb-2">Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.permissions.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  handleEdit(selectedUser);
                  setShowViewModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Edit User
              </button>
              <button
                onClick={() => router.push("/settings/users")}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
              >
                Advanced Settings
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedUser(null);
          setFormData({});
        }}
        title={showCreateModal ? "Create User" : "Edit User"}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Email *</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName || ""}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Full Name"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">Role</label>
              <select
                value={formData.role || "OPERATOR"}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ADMIN">Admin</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="OPERATOR">Operator</option>
                <option value="VIEWER">Viewer</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Status
              </label>
              <select
                value={formData.status || "PENDING"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department || ""}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="Department"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                placeholder="+971XXXXXXXXX"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              {showCreateModal ? "Create User" : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedUser(null);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </PageTemplate>
  );
}
