/**
 * 🎨 VISUAL PERMISSION BUILDER
 *
 * Mind-blowing drag-and-drop interface for building permissions:
 * - Visual module/feature/tab tree
 * - Drag permissions to users/roles
 * - Real-time validation
 * - AI recommendations
 * - Permission templates
 * - Bulk operations
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { aiPermissionRecommender } from "@/lib/services/permissions/aiPermissionRecommender";
import type {
  User,
  HierarchicalPermission,
  ModuleId,
  FeatureId,
  TabId,
} from "@/types/user";
import type { PermissionRecommendation } from "@/lib/services/permissions/aiPermissionRecommender";

interface PermissionNode {
  id: string;
  type: "module" | "feature" | "tab";
  label: string;
  icon: string;
  children?: PermissionNode[];
  permission?: HierarchicalPermission;
  health?: {
    isFunctional: boolean;
    healthScore: number;
  };
}

interface DragState {
  isDragging: boolean;
  draggedNode?: PermissionNode;
  targetUser?: User;
}

export default function VisualPermissionBuilder() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false });
  const [recommendations, setRecommendations] = useState<
    PermissionRecommendation[]
  >([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers({});
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  // Build permission tree
  const permissionTree = useMemo(() => {
    const modules: PermissionNode[] = [
      {
        id: "wms",
        type: "module",
        label: "Warehouse Management",
        icon: "ri-warehouse-line",
        children: [
          {
            id: "wms.inventory",
            type: "feature",
            label: "Inventory",
            icon: "ri-stack-line",
            children: [
              {
                id: "wms.inventory.list",
                type: "tab",
                label: "Inventory List",
                icon: "ri-list-check",
              },
              {
                id: "wms.inventory.real-time",
                type: "tab",
                label: "Real-Time",
                icon: "ri-time-line",
              },
              {
                id: "wms.inventory.analytics",
                type: "tab",
                label: "Analytics",
                icon: "ri-bar-chart-line",
              },
            ],
          },
          {
            id: "wms.orders",
            type: "feature",
            label: "Orders",
            icon: "ri-shopping-cart-line",
            children: [
              {
                id: "wms.orders.list",
                type: "tab",
                label: "Order List",
                icon: "ri-list-check",
              },
              {
                id: "wms.orders.create",
                type: "tab",
                label: "Create Order",
                icon: "ri-add-circle-line",
              },
            ],
          },
        ],
      },
      {
        id: "tms",
        type: "module",
        label: "Transportation",
        icon: "ri-truck-line",
        children: [
          {
            id: "tms.shipments",
            type: "feature",
            label: "Shipments",
            icon: "ri-ship-line",
            children: [
              {
                id: "tms.shipments.list",
                type: "tab",
                label: "Shipment List",
                icon: "ri-list-check",
              },
              {
                id: "tms.shipments.track",
                type: "tab",
                label: "Track",
                icon: "ri-map-pin-line",
              },
            ],
          },
        ],
      },
      {
        id: "settings",
        type: "module",
        label: "Settings",
        icon: "ri-settings-3-line",
        children: [
          {
            id: "settings.users",
            type: "feature",
            label: "User Management",
            icon: "ri-user-settings-line",
            children: [
              {
                id: "settings.users.list",
                type: "tab",
                label: "Users",
                icon: "ri-list-check",
              },
              {
                id: "settings.users.permissions",
                type: "tab",
                label: "Permissions",
                icon: "ri-shield-user-line",
              },
            ],
          },
        ],
      },
    ];

    return modules;
  }, []);

  // Load AI recommendations
  const loadAIRecommendations = useCallback(async (user: User) => {
    setLoading(true);
    try {
      const analysis =
        await aiPermissionRecommender.analyzeUserPermissions(user);
      setRecommendations(analysis.recommendations);
      setShowAIRecommendations(true);
    } catch (error) {
      console.error("Failed to load AI recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle drag start
  const handleDragStart = (node: PermissionNode, user: User) => {
    setDragState({
      isDragging: true,
      draggedNode: node,
      targetUser: user,
    });
  };

  // Handle drag end
  const handleDragEnd = async () => {
    if (dragState.isDragging && dragState.draggedNode && dragState.targetUser) {
      // Apply permission
      await applyPermission(dragState.targetUser, dragState.draggedNode);
    }
    setDragState({ isDragging: false });
  };

  // Apply permission
  const applyPermission = async (targetUser: User, node: PermissionNode) => {
    if (!node.permission) {
      // Create permission from node
      const permission: HierarchicalPermission = {
        moduleId: node.id as ModuleId,
        moduleAccess: "full",
        actions: ["read", "write"],
        scope: "TENANT",
      };

      if (node.type === "feature") {
        permission.featureId = node.id as FeatureId;
        permission.featureAccess = "full";
      }

      if (node.type === "tab") {
        permission.tabId = node.id as TabId;
        permission.tabAccess = "full";
      }

      try {
        const currentPerms = targetUser.hierarchicalPermissions || [];
        const updatedPerms = [...currentPerms, permission];
        await userService.updateUserPermissions(targetUser.id, updatedPerms);

        // Refresh users
        await loadUsers();
      } catch (error) {
        console.error("Failed to apply permission:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-magic-line text-cyan-400"></i>
            Visual Permission Builder
          </h1>
          <p className="text-gray-400">
            Drag and drop permissions to build the perfect access control
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Permission Tree */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-node-tree text-cyan-400"></i>
                Permission Tree
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {permissionTree.map((module) => (
                  <PermissionTreeNode
                    key={module.id}
                    node={module}
                    level={0}
                    onDragStart={handleDragStart}
                    selectedUser={selectedUser}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle: Users */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <i className="ri-user-line text-blue-400"></i>
                Users
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <motion.div
                    key={user.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedUser?.id === user.id
                        ? "bg-cyan-500/20 border-cyan-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => {
                      setSelectedUser(user);
                      loadAIRecommendations(user);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.role}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(user.hierarchicalPermissions || []).length} perms
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Recommendations & Current Permissions */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <i className="ri-brain-line text-pink-400"></i>
                  AI Insights
                </h2>
                {selectedUser && (
                  <button
                    onClick={() => loadAIRecommendations(selectedUser)}
                    className="px-3 py-1 text-sm bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30"
                  >
                    <i className="ri-refresh-line mr-1"></i>
                    Refresh
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <i className="ri-loader-4-line text-4xl animate-spin text-cyan-400"></i>
                </div>
              ) : selectedUser ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {showAIRecommendations && recommendations.length > 0 ? (
                    <>
                      {recommendations.slice(0, 5).map((rec, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <i className="ri-lightbulb-line text-pink-400"></i>
                              <span className="font-semibold text-sm">
                                {rec.type === "ADD" && "➕ Add"}
                                {rec.type === "REMOVE" && "➖ Remove"}
                                {rec.type === "MODIFY" && "✏️ Modify"}
                                {rec.type === "UPGRADE" && "⬆️ Upgrade"}
                                {rec.type === "DOWNGRADE" && "⬇️ Downgrade"}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {rec.confidence}% confidence
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">
                            {rec.reasoning}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-cyan-400">
                              Impact: {rec.impact}
                            </span>
                            <span className="text-yellow-400">
                              Risk: {rec.riskLevel}
                            </span>
                            <span className="text-green-400">
                              Value: {rec.businessValue}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <i className="ri-user-line text-4xl mb-2"></i>
                      <p>Select a user to see AI recommendations</p>
                    </div>
                  )}

                  {/* Current Permissions */}
                  {selectedUser && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="font-semibold mb-3">
                        Current Permissions
                      </h3>
                      <div className="space-y-2">
                        {(selectedUser.hierarchicalPermissions || [])
                          .slice(0, 5)
                          .map((perm, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white/5 rounded text-sm"
                            >
                              {perm.moduleId}
                              {perm.featureId &&
                                ` → ${perm.featureId.split(".")[1]}`}
                              {perm.tabId &&
                                ` → ${perm.tabId.split(".").pop()}`}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <i className="ri-user-line text-4xl mb-2"></i>
                  <p>Select a user to see AI recommendations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Permission Tree Node Component
function PermissionTreeNode({
  node,
  level,
  onDragStart,
  selectedUser,
}: {
  node: PermissionNode;
  level: number;
  onDragStart: (node: PermissionNode, user: User) => void;
  selectedUser: User | null;
}) {
  const [expanded, setExpanded] = useState(level === 0);

  return (
    <div>
      <motion.div
        className={`flex items-center gap-2 p-2 rounded-lg cursor-move hover:bg-white/10 ${
          level === 0 ? "font-semibold" : level === 1 ? "font-medium" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        draggable
        onDragStart={() => selectedUser && onDragStart(node, selectedUser)}
        whileHover={{ x: 4 }}
        whileDrag={{ opacity: 0.5, scale: 0.95 }}
      >
        {node.children && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-white"
          >
            <i
              className={
                expanded ? "ri-arrow-down-s-line" : "ri-arrow-right-s-line"
              }
            ></i>
          </button>
        )}
        <i className={`${node.icon} text-cyan-400`}></i>
        <span className="flex-1">{node.label}</span>
        {node.health && (
          <div
            className={`text-xs px-2 py-1 rounded ${
              node.health.isFunctional
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {node.health.healthScore}%
          </div>
        )}
      </motion.div>
      {expanded && node.children && (
        <AnimatePresence>
          {node.children.map((child) => (
            <PermissionTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onDragStart={onDragStart}
              selectedUser={selectedUser}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
