"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/ui/Tooltip";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PermissionManager from "@/components/permissions/PermissionManager";
import ComprehensiveUserManager from "@/components/user-management/ComprehensiveUserManager";
import CustomerHierarchySelector from "@/components/user-management/CustomerHierarchySelector";
import UserDataVisibilitySettings from "@/components/user-management/UserDataVisibilitySettings";
import { UserRole, getRoleDefinition, Action } from "@/types/user";
import { format } from "date-fns";
import { useSubscriptionLimits, canAddUserCheck } from "@/hooks/useSubscriptionLimits";
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
} from "recharts";
import {
  realtimeSimulator,
  simulateKPIUpdates,
} from "@/utils/realtimeDataSimulator";
import { User as UserType, HierarchicalPermission } from "@/types/user";
import { EnhancedUser } from "@/types/userManagement";

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
  // Enhanced permission fields
  hierarchicalPermissions?: HierarchicalPermission[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionLimits = useSubscriptionLimits();

  // Load users from service
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { userService } = await import("@/lib/services/user");
      const data = await userService.getUsers({});
      // Map to local User interface
      const mappedUsers: User[] = data.map((u) => ({
        id: u.id,
        username: u.email.split("@")[0],
        email: u.email,
        fullName: u.name,
        role: u.role as any,
        status: u.status as any,
        createdAt: new Date(u.createdAt),
        permissions:
          u.permissions?.map((p) => (typeof p === "string" ? p : p.resource)) ||
          [],
        loginCount: 0,
        hierarchicalPermissions: Array.isArray(u.hierarchicalPermissions) 
          ? u.hierarchicalPermissions 
          : [],
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      // Fallback to mock data
      const roles: User["role"][] = [
        "ADMIN",
        "WAREHOUSE_MANAGER",
        "SUPERVISOR",
        "OPERATOR",
        "VIEWER",
      ];
      const statuses: User["status"][] = [
        "ACTIVE",
        "ACTIVE",
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
      ];
      const departments = [
        "Operations",
        "Quality",
        "Logistics",
        "IT",
        "Management",
      ];
      const warehouses = ["WH-A", "WH-B", "WH-C"];

      const mockUsers = Array.from({ length: 30 }, (_, i) => {
        const role = roles[Math.floor(Math.random() * roles.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        return {
          id: `USER-${String(i + 1).padStart(6, "0")}`,
          username: `user${i + 1}`,
          email: `user${i + 1}@example.com`,
          fullName: `User ${i + 1} Name`,
          role,
          status,
          department:
            departments[Math.floor(Math.random() * departments.length)],
          warehouse:
            Math.random() > 0.3
              ? warehouses[Math.floor(Math.random() * warehouses.length)]
              : undefined,
          lastLogin:
            status === "ACTIVE"
              ? new Date(Date.now() - Math.random() * 7 * 86400000)
              : undefined,
          createdAt: new Date(Date.now() - Math.random() * 365 * 86400000),
          permissions: role === "ADMIN" ? ["all"] : ["read", "write"],
          hierarchicalPermissions: [], // Initialize as empty array
          loginCount: Math.floor(Math.random() * 500) + 10,
          lastActivity:
            status === "ACTIVE"
              ? new Date(Date.now() - Math.random() * 24 * 3600000)
              : undefined,
        };
      });
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [formData, setFormData] = useState<
    Partial<
      User & {
        moduleAccess?: Record<
          string,
          "full" | "partial" | "read_only" | "none"
        >;
        hierarchicalPermissions?: HierarchicalPermission[];
        assignedCustomers?: string[];
        assignedWarehouses?: string[];
        assignedRegions?: string[];
        phone?: string;
        jobTitle?: string;
        managerId?: string;
        avatar?: string;
        preferences?: {
          theme?: "light" | "dark" | "auto";
          language?: string;
          timezone?: string;
          dateFormat?: string;
          timeFormat?: string;
        };
      }
    >
  >({});

  // Mock data for dropdowns
  const [availableCustomers] = useState(() => [
    { id: "customer-1", name: "Acme Corporation" },
    { id: "customer-2", name: "Tech Solutions Inc" },
    { id: "customer-3", name: "Global Logistics Ltd" },
    { id: "customer-4", name: "Manufacturing Co" },
    { id: "customer-5", name: "Retail Partners" },
  ]);

  const [availableWarehouses] = useState(() => [
    { id: "WH-A", name: "Warehouse A - Main" },
    { id: "WH-B", name: "Warehouse B - Secondary" },
    { id: "WH-C", name: "Warehouse C - Distribution" },
    { id: "WH-D", name: "Warehouse D - Cold Storage" },
  ]);

  const [availableRegions] = useState(() => [
    { id: "region-1", name: "North America" },
    { id: "region-2", name: "Europe" },
    { id: "region-3", name: "Asia Pacific" },
    { id: "region-4", name: "Middle East" },
  ]);

  const [availableManagers] = useState(() =>
    users.filter((u) =>
      ["ADMIN", "WAREHOUSE_MANAGER", "OPERATIONS_MANAGER"].includes(u.role),
    ),
  );
  const [editingUserPermissions, setEditingUserPermissions] =
    useState<User | null>(null);
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
      const matchesStatus =
        selectedStatus === "ALL" || user.status === selectedStatus;
      const matchesRole = selectedRole === "ALL" || user.role === selectedRole;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, selectedStatus, selectedRole]);

  // Analytics
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

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const online = users.filter(
      (u) =>
        u.status === "ACTIVE" &&
        u.lastActivity &&
        new Date(u.lastActivity).getTime() > Date.now() - 3600000,
    ).length;
    const totalLogins = users.reduce((sum, u) => sum + u.loginCount, 0);

    return {
      total,
      active,
      online,
      totalLogins,
    };
  }, [users]);

  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const unsubscribe = realtimeSimulator.subscribe(
      "user-stats",
      (data: typeof realTimeStats) => {
        setRealTimeStats(data);
      },
    );

    const stop = realtimeSimulator.start(
      "user-stats",
      () => ({
        totalUsers: aggregateStats.total,
        activeUsers: simulateKPIUpdates(aggregateStats.active, 0.1),
        onlineUsers: simulateKPIUpdates(aggregateStats.online, 0.2),
        totalLogins: simulateKPIUpdates(aggregateStats.totalLogins, 0.05),
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
    aggregateStats.total,
    aggregateStats.active,
    aggregateStats.online,
    aggregateStats.totalLogins,
  ]);

  // Simulate real-time activity updates
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.status === "ACTIVE" && Math.random() < 0.1) {
            return {
              ...u,
              lastActivity: new Date(),
              loginCount: u.loginCount + 1,
            };
          }
          return u;
        }),
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const stats = [
    {
      label: "Total Users",
      value: realTimeEnabled ? realTimeStats.totalUsers : aggregateStats.total,
      icon: "ri-user-settings-line",
      tooltip: "Total system users",
      trend: "up" as const,
    },
    {
      label: "Active Users",
      value: realTimeEnabled
        ? realTimeStats.activeUsers
        : aggregateStats.active,
      icon: "ri-checkbox-circle-line",
      tooltip: "Active users",
      trend: "up" as const,
    },
    {
      label: "Online Now",
      value: realTimeEnabled
        ? realTimeStats.onlineUsers
        : aggregateStats.online,
      icon: "ri-user-online-line",
      tooltip: "Users currently online",
      trend: "neutral" as const,
    },
    {
      label: "Total Logins",
      value: realTimeEnabled
        ? realTimeStats.totalLogins.toLocaleString()
        : aggregateStats.totalLogins.toLocaleString(),
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

  const handleCreate = () => {
    setFormData({});
    setShowCreateModal(true);
  };

  const handleEdit = (user: User) => {
    // Convert hierarchical permissions to moduleAccess format for form (for backward compatibility)
    const moduleAccess: Record<
      string,
      "full" | "partial" | "read_only" | "none"
    > = {};
    const userPerms = Array.isArray(user.hierarchicalPermissions) ? user.hierarchicalPermissions : [];
    if (userPerms.length > 0) {
      userPerms.forEach((perm) => {
        if (perm.moduleId && !perm.featureId && !perm.tabId) {
          moduleAccess[perm.moduleId] = perm.moduleAccess || "read_only";
        }
      });
    }

    setFormData({
      ...user,
      moduleAccess,
      assignedCustomers: user.assignedCustomers || [],
      assignedWarehouses: user.assignedWarehouses || [],
      assignedRegions: user.assignedRegions || [],
      phone: user.phone,
      jobTitle: user.jobTitle,
      managerId: user.managerId,
      avatar: user.avatar,
      hierarchicalPermissions: userPerms,
      preferences: user.preferences
        ? {
            theme: user.preferences.theme,
            language: user.preferences.language,
            timezone: user.preferences.timezone,
            dateFormat: user.preferences.dateFormat,
          }
        : undefined,
    });
    setShowEditModal(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSave = () => {
    if (formData.id) {
      // Update existing user
      const updatedUser: User = {
        ...users.find((u) => u.id === formData.id)!,
        ...formData,
        assignedCustomers: formData.assignedCustomers,
        assignedWarehouses: formData.assignedWarehouses,
        assignedRegions: formData.assignedRegions,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        managerId: formData.managerId,
        avatar: formData.avatar,
        hierarchicalPermissions: formData.hierarchicalPermissions,
        preferences: {
          theme: formData.preferences?.theme || "dark",
          language: formData.preferences?.language || "en",
          timezone: formData.preferences?.timezone || "UTC",
          dateFormat: formData.preferences?.dateFormat || "MM/dd/yyyy",
          timeFormat: "HH:mm",
          defaultView: "table",
          notifications: { email: true, sms: false, push: true, desktop: true },
          dashboard: { widgets: [], layout: "grid" },
        },
        updatedAt: new Date(),
      };
      setUsers((prev) =>
        prev.map((u) => (u.id === formData.id ? updatedUser : u)),
      );
      setShowEditModal(false);
    } else {
      // Create new user - use hierarchical permissions if provided, otherwise create from moduleAccess
      let hierarchicalPermissions: HierarchicalPermission[] =
        formData.hierarchicalPermissions || [];

      // If no hierarchical permissions but moduleAccess exists, create them
      if (
        hierarchicalPermissions.length === 0 &&
        (formData as any).moduleAccess
      ) {
        const moduleAccess = (formData as any).moduleAccess || {};
        hierarchicalPermissions = Object.entries(moduleAccess)
          .filter(([_, access]) => access !== "none")
          .map(([moduleId, access]) => {
            const accessLevel = access as "full" | "partial" | "read_only";
            let actions: Action[] = [];

            switch (accessLevel) {
              case "full":
                actions = [
                  "read",
                  "read_write",
                  "write",
                  "delete",
                  "approve",
                  "export",
                  "import",
                  "manage",
                  "configure",
                  "assign",
                  "execute",
                ];
                break;
              case "partial":
                actions = [
                  "read",
                  "read_write",
                  "write",
                  "export",
                  "import",
                  "configure",
                ];
                break;
              case "read_only":
                actions = ["read", "read_only", "export"];
                break;
            }

            return {
              moduleId: moduleId as any,
              moduleAccess: accessLevel,
              actions,
              scope: "TENANT",
            };
          });
      }

      const newUser: User = {
        id: `USER-${String(users.length + 1).padStart(6, "0")}`,
        username: formData.username || "newuser",
        email: formData.email || "newuser@example.com",
        fullName: formData.fullName || "New User",
        name: formData.fullName || "New User",
        tenantId: "tenant-1",
        role: formData.role || "VIEWER",
        status: formData.status || "PENDING",
        department: formData.department,
        warehouse: formData.warehouse,
        assignedCustomers: formData.assignedCustomers,
        assignedWarehouses: formData.assignedWarehouses,
        assignedRegions: formData.assignedRegions,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        managerId: formData.managerId,
        avatar: formData.avatar,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: formData.permissions || [],
        hierarchicalPermissions:
          hierarchicalPermissions.length > 0
            ? hierarchicalPermissions
            : undefined,
        preferences: {
          theme: formData.preferences?.theme || "dark",
          language: formData.preferences?.language || "en",
          timezone: formData.preferences?.timezone || "UTC",
          dateFormat: formData.preferences?.dateFormat || "MM/dd/yyyy",
          timeFormat: "HH:mm",
          defaultView: "table",
          notifications: { email: true, sms: false, push: true, desktop: true },
          dashboard: { widgets: [], layout: "grid" },
        },
        loginCount: 0,
      };
      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
    }
    setFormData({});
  };

  return (
    <PageTemplate
      title="User Management"
      description="User accounts, roles, permissions, and access control management"
      icon="ri-user-settings-line"
      systemInfo={{
        sap: "User Management, Authorization",
        oracle: "User Administration, Access Control",
        manhattan: "User Management, Security",
      }}
      examples={[
        "Create and manage user accounts",
        "Assign roles and permissions",
        "Track user activity",
        "Manage access control",
        "User authentication",
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
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            <span className="hidden sm:inline">Create User</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      }
    >
      {/* Subscription Limit Banner */}
      {!subscriptionLimits.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-xl p-4 border ${
            subscriptionLimits.approachingUserLimit
              ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30"
              : !subscriptionLimits.canAddUsers
              ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30"
              : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <i className={`ri-vip-crown-line text-lg ${
                  subscriptionLimits.approachingUserLimit || !subscriptionLimits.canAddUsers
                    ? "text-orange-400"
                    : "text-blue-400"
                }`}></i>
                <p className="text-white font-medium">
                  {subscriptionLimits.planName} Plan - User Seats
                </p>
              </div>
              <p className="text-sm text-gray-300">
                {subscriptionLimits.currentUsers} / {subscriptionLimits.maxUsers === -1 ? "Unlimited" : subscriptionLimits.maxUsers} users
                {subscriptionLimits.maxUsers !== -1 && subscriptionLimits.usersRemaining > 0 && (
                  <span className="ml-2 text-gray-400">
                    ({subscriptionLimits.usersRemaining} remaining)
                  </span>
                )}
              </p>
              
              {/* Progress bar */}
              {subscriptionLimits.maxUsers !== -1 && (
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((subscriptionLimits.currentUsers / subscriptionLimits.maxUsers) * 100, 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${
                      subscriptionLimits.approachingUserLimit
                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                        : !subscriptionLimits.canAddUsers
                        ? "bg-gradient-to-r from-red-500 to-pink-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-500"
                    }`}
                  />
                </div>
              )}
              
              {!subscriptionLimits.canAddUsers && (
                <p className="text-sm text-orange-400 mt-2">
                  ⚠️ You've reached your user limit. Upgrade to add more users.
                </p>
              )}
              {subscriptionLimits.approachingUserLimit && subscriptionLimits.canAddUsers && (
                <p className="text-sm text-orange-400 mt-2">
                  ⚠️ Approaching user limit. Consider upgrading soon.
                </p>
              )}
            </div>
            
            {(subscriptionLimits.approachingUserLimit || !subscriptionLimits.canAddUsers) && subscriptionLimits.canUpgrade && (
              <Link 
                href="/billing?tab=overview" 
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
              >
                <i className="ri-arrow-up-line mr-1"></i>
                Upgrade Plan
              </Link>
            )}
          </div>
        </motion.div>
      )}

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
        </select>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-user-search-line text-4xl text-[#6b7280]"></i>
                        <div className="text-sm text-[#9ca3af]">
                          No users found
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-[200px]">
                          <div className="text-sm font-medium text-white">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-0.5">
                            {user.email}
                          </div>
                          <div className="text-xs text-[#6b7280] font-mono mt-0.5">
                            {user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {user.department || (
                            <span className="text-[#6b7280]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white font-mono">
                          {user.warehouse || (
                            <span className="text-[#6b7280]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
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
                          {user.lastActivity &&
                            new Date(user.lastActivity).getTime() >
                              Date.now() - 3600000 && (
                              <div className="flex items-center gap-1 text-xs text-green-400">
                                <i className="ri-circle-fill text-[8px]"></i>
                                <span>Online</span>
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.lastLogin ? (
                          <div>
                            <div className="text-sm text-white font-medium">
                              {format(new Date(user.lastLogin), "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-[#9ca3af] mt-0.5">
                              {format(new Date(user.lastLogin), "HH:mm")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b7280]">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tooltip content="View Details" position="top">
                            <button
                              onClick={() => handleView(user)}
                              className="p-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/30 transition-colors"
                            >
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                          </Tooltip>
                          <Tooltip content="Edit User" position="top">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                          </Tooltip>
                          <Tooltip
                            content="Manage Permissions, API Keys, Agents, Billing, Compliance"
                            position="top"
                          >
                            <button
                              onClick={() => {
                                setEditingUserPermissions(user);
                                setShowPermissionsModal(true);
                              }}
                              className="px-3 py-2 bg-gradient-to-r from-purple-600/30 to-purple-500/20 text-purple-300 border border-purple-500/50 rounded-lg hover:from-purple-600/40 hover:to-purple-500/30 transition-colors flex items-center gap-2 font-medium text-xs"
                            >
                              <i className="ri-shield-user-line"></i>
                              <span className="hidden sm:inline">Manage</span>
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete User" position="top">
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
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
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {user.fullName}
                  </h3>
                  <p className="text-sm text-[#9ca3af]">{user.email}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : user.status === "SUSPENDED"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {user.status}
                  </span>
                  {user.lastActivity &&
                    new Date(user.lastActivity).getTime() >
                      Date.now() - 3600000 && (
                      <span className="text-xs text-green-400">
                        <i className="ri-circle-fill mr-1"></i>
                        Online
                      </span>
                    )}
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Role:</span>
                  <span className="text-white text-xs">
                    {user.role.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Department:</span>
                  <span className="text-white">{user.department || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Warehouse:</span>
                  <span className="text-white font-mono text-xs">
                    {user.warehouse || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af]">Logins:</span>
                  <span className="text-white font-medium">
                    {user.loginCount}
                  </span>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9ca3af]">Last Login:</span>
                    <span className="text-white text-xs">
                      {format(new Date(user.lastLogin), "MMM dd, HH:mm")}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleView(user)}
                  className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
                >
                  <i className="ri-eye-line mr-1"></i>
                  View
                </button>
                <Tooltip content="Edit User" position="top">
                  <button
                    onClick={() => handleEdit(user)}
                    className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                </Tooltip>
                <Tooltip
                  content="Manage User - Permissions, API Keys, Agents, Billing, Compliance"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setEditingUserPermissions(user);
                      setShowPermissionsModal(true);
                    }}
                    className="px-3 py-2 bg-gradient-to-r from-purple-600/30 to-purple-500/20 text-purple-300 border border-purple-500/50 rounded text-sm font-medium hover:from-purple-600/40 hover:to-purple-500/30 transition-colors flex items-center gap-2"
                    title="Comprehensive User Management"
                  >
                    <i className="ri-shield-user-line"></i>
                    Manage
                  </button>
                </Tooltip>
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
                  <XAxis dataKey="status" stroke="#9ca3af" fontSize={12} />
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Username</div>
                <div className="text-white font-medium font-mono">
                  {selectedUser.username}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Email</div>
                <div className="text-white font-medium">
                  {selectedUser.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Full Name</div>
                <div className="text-white font-medium">
                  {selectedUser.fullName}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Role</div>
                <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
                  {selectedUser.role.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Status</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedUser.status === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : selectedUser.status === "SUSPENDED"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {selectedUser.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Department</div>
                <div className="text-white">
                  {selectedUser.department || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Warehouse</div>
                <div className="text-white font-mono">
                  {selectedUser.warehouse || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Login Count</div>
                <div className="text-white font-medium">
                  {selectedUser.loginCount}
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
              {selectedUser.lastActivity && (
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">
                    Last Activity
                  </div>
                  <div className="text-white">
                    {format(new Date(selectedUser.lastActivity), "PPp")}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-[#9ca3af] mb-1">Created At</div>
                <div className="text-white">
                  {format(new Date(selectedUser.createdAt), "PPp")}
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#9ca3af] mb-2">Permissions</div>
              <div className="flex flex-wrap gap-2">
                {selectedUser.permissions.map((perm, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/5 rounded text-xs text-white"
                  >
                    {perm}
                  </span>
                ))}
              </div>
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
          setFormData({});
        }}
        title={showCreateModal ? "Create New User" : "Edit User"}
        size="xl"
      >
        <div
          className="flex flex-col"
          style={{ maxHeight: "calc(90vh - 180px)" }}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
            {/* Basic Information Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-user-line text-cyan-400"></i>
                Basic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="e.g., Operations, IT, Management"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.role || "VIEWER"}
                    onChange={(e) => {
                      const newRole = e.target.value as User["role"];
                      const roleDef = getRoleDefinition(newRole as any);
                      // Auto-assign based on role requirements
                      let updates: any = { role: newRole };
                      if (
                        roleDef?.requiresCustomerAssignment &&
                        !formData.assignedCustomers?.length
                      ) {
                        // Don't auto-assign, but show requirement
                      }
                      if (
                        roleDef?.requiresWarehouseAssignment &&
                        !formData.assignedWarehouses?.length
                      ) {
                        // Don't auto-assign, but show requirement
                      }
                      setFormData({ ...formData, ...updates });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <optgroup label="System Roles">
                      <option value="SYSTEM_ADMIN">System Administrator</option>
                      <option value="BUSINESS_DEVELOPMENT_MANAGER">
                        Business Development Manager
                      </option>
                      <option value="OPERATIONS_MANAGER">
                        Operations Manager
                      </option>
                    </optgroup>
                    <optgroup label="Warehouse Roles">
                      <option value="WAREHOUSE_HEAD">Warehouse Head</option>
                      <option value="WAREHOUSE_MANAGER">
                        Warehouse Manager
                      </option>
                      <option value="WAREHOUSE_SUPERVISOR">
                        Warehouse Supervisor
                      </option>
                      <option value="WAREHOUSE_OPERATOR">
                        Warehouse Operator
                      </option>
                    </optgroup>
                    <optgroup label="Customer Roles">
                      <option value="CUSTOMER_ACCOUNT_MANAGER">
                        Customer Account Manager
                      </option>
                      <option value="CUSTOMER_ADMIN">
                        Customer Administrator
                      </option>
                      <option value="CUSTOMER_USER">Customer User</option>
                    </optgroup>
                    <optgroup label="Other Roles">
                      <option value="QUALITY_MANAGER">Quality Manager</option>
                      <option value="INVENTORY_SPECIALIST">
                        Inventory Specialist
                      </option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="OPERATOR">Operator</option>
                      <option value="VIEWER">Viewer</option>
                    </optgroup>
                  </select>
                  {formData.role &&
                    (() => {
                      const roleDef = getRoleDefinition(formData.role as any);
                      if (roleDef) {
                        return (
                          <p className="text-xs text-[#6b7280] mt-1">
                            {roleDef.description}
                            {roleDef.requiresCustomerAssignment && (
                              <span className="text-yellow-400 ml-1">
                                • Requires customer assignment
                              </span>
                            )}
                            {roleDef.requiresWarehouseAssignment && (
                              <span className="text-yellow-400 ml-1">
                                • Requires warehouse assignment
                              </span>
                            )}
                          </p>
                        );
                      }
                      return null;
                    })()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Status <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.status || "PENDING"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as User["status"],
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Warehouse Assignment
                  </label>
                  <input
                    type="text"
                    value={formData.warehouse || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, warehouse: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                    placeholder="e.g., WH-A, WH-B, WH-C"
                  />
                </div>
              </div>
            </div>

            {/* Company & Organization Assignments */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-building-line text-green-400"></i>
                Company & Organization Assignments
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Assigned Customers
                    {formData.role &&
                      (formData.role === "CUSTOMER_USER" ||
                        formData.role === "CUSTOMER_ADMIN" ||
                        formData.role === "CUSTOMER_ACCOUNT_MANAGER") && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                  </label>
                  <select
                    multiple
                    value={formData.assignedCustomers || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      );
                      setFormData({ ...formData, assignedCustomers: selected });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[120px]"
                    size={5}
                  >
                    {availableCustomers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                        className="bg-[#1f2937] text-white"
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Hold Ctrl/Cmd to select multiple
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Assigned Warehouses
                    {formData.role &&
                      [
                        "WAREHOUSE_MANAGER",
                        "WAREHOUSE_SUPERVISOR",
                        "WAREHOUSE_OPERATOR",
                      ].includes(formData.role) && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                  </label>
                  <select
                    multiple
                    value={formData.assignedWarehouses || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      );
                      setFormData({
                        ...formData,
                        assignedWarehouses: selected,
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[120px]"
                    size={5}
                  >
                    {availableWarehouses.map((warehouse) => (
                      <option
                        key={warehouse.id}
                        value={warehouse.id}
                        className="bg-[#1f2937] text-white"
                      >
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Hold Ctrl/Cmd to select multiple
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Assigned Regions
                  </label>
                  <select
                    multiple
                    value={formData.assignedRegions || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      );
                      setFormData({ ...formData, assignedRegions: selected });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[100px]"
                    size={4}
                  >
                    {availableRegions.map((region) => (
                      <option
                        key={region.id}
                        value={region.id}
                        className="bg-[#1f2937] text-white"
                      >
                        {region.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Hold Ctrl/Cmd to select multiple
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Manager
                  </label>
                  <select
                    value={formData.managerId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        managerId: e.target.value || undefined,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="">No Manager</option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.fullName} ({manager.role.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Profile Information */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-profile-line text-yellow-400"></i>
                Additional Profile Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="e.g., Senior Operations Manager"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.avatar || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, avatar: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            {/* User Preferences */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-settings-3-line text-blue-400"></i>
                User Preferences
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Theme
                  </label>
                  <select
                    value={formData.preferences?.theme || "dark"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          theme: e.target.value as "light" | "dark" | "auto",
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Language
                  </label>
                  <select
                    value={formData.preferences?.language || "en"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          language: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="fr">French</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.preferences?.timezone || "UTC"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          timezone: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">
                      Pacific Time (PT)
                    </option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                    <option value="Asia/Riyadh">Riyadh (AST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-2">
                    Date Format
                  </label>
                  <select
                    value={formData.preferences?.dateFormat || "MM/dd/yyyy"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          dateFormat: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    <option value="dd MMM yyyy">DD MMM YYYY</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Comprehensive Permission Assignment */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-shield-user-line text-purple-400"></i>
                Comprehensive Permission Assignment
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Assign granular permissions at module, feature, and tab levels
                with full control over actions, fields, and time restrictions.
              </p>
              {formData.email && formData.fullName ? (
                <PermissionManager
                  user={{
                    id: formData.id || "temp",
                    tenantId: "tenant-1",
                    email: formData.email,
                    name: formData.fullName,
                    role: (formData.role as any) || "VIEWER",
                    status: (formData.status as any) || "PENDING",
                    permissions: [],
                    hierarchicalPermissions: Array.isArray(formData.hierarchicalPermissions)
                      ? formData.hierarchicalPermissions
                      : [],
                    preferences: {
                      theme: formData.preferences?.theme || "dark",
                      language: formData.preferences?.language || "en",
                      timezone: formData.preferences?.timezone || "UTC",
                      dateFormat:
                        formData.preferences?.dateFormat || "MM/dd/yyyy",
                      timeFormat: "HH:mm",
                      defaultView: "table",
                      notifications: {
                        email: true,
                        sms: false,
                        push: true,
                        desktop: true,
                      },
                      dashboard: { widgets: [], layout: "grid" },
                    },
                    loginCount: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  }}
                  onPermissionsChange={(permissions) => {
                    setFormData({
                      ...formData,
                      hierarchicalPermissions: permissions,
                    });
                  }}
                />
              ) : (
                <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                  <i className="ri-information-line text-yellow-400 text-2xl mb-2"></i>
                  <p className="text-sm text-yellow-300">
                    Please fill in Email and Full Name first to configure
                    permissions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Fixed at Bottom */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-white/10 flex-shrink-0">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setFormData({});
              }}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <i className="ri-check-line"></i>
              {showCreateModal ? "Create User" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Comprehensive User Management Modal */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => {
          setShowPermissionsModal(false);
          setEditingUserPermissions(null);
        }}
        title={`User Management - ${editingUserPermissions?.fullName || ""}`}
        size="full"
      >
        <div className="h-full max-h-[calc(90vh-120px)] overflow-y-auto custom-scrollbar">
          {editingUserPermissions && (
            <ComprehensiveUserManager
              user={editingUserPermissions as unknown as EnhancedUser}
              onUpdate={(updates) => {
                const updated = { ...editingUserPermissions, ...updates };
                setEditingUserPermissions(updated);
                // Update in users list
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === editingUserPermissions.id ? updated : u,
                  ),
                );
              }}
            />
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${selectedUser?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </PageTemplate>
  );
}
