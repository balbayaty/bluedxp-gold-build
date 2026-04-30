/**
 * 🌳 PERMISSION INHERITANCE VISUALIZER UI
 *
 * Beautiful tree visualization:
 * - Interactive tree view
 * - Inheritance flow
 * - Conflict highlighting
 * - Expand/collapse
 * - Search and filter
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { permissionInheritanceVisualizer } from "@/lib/services/permissions/permissionInheritanceVisualizer";
import type { User } from "@/types/user";
import type {
  InheritanceTree,
  InheritanceNode,
} from "@/lib/services/permissions/permissionInheritanceVisualizer";

export default function PermissionInheritanceVisualizerComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tree, setTree] = useState<InheritanceTree | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(["root"]),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadTree();
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers({});
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadTree = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const result =
        await permissionInheritanceVisualizer.buildInheritanceTree(
          selectedUser,
        );
      setTree(result);
    } catch (error) {
      console.error("Failed to build tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getAccessColor = (access: string) => {
    const colors = {
      full: "text-green-400",
      partial: "text-yellow-400",
      read_only: "text-blue-400",
      none: "text-gray-400",
    };
    return colors[access as keyof typeof colors] || colors.none;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      EXPLICIT: "bg-cyan-500/20 text-cyan-400",
      INHERITED: "bg-gray-500/20 text-gray-400",
      OVERRIDDEN: "bg-orange-500/20 text-orange-400",
    };
    return colors[source as keyof typeof colors] || colors.INHERITED;
  };

  const renderNode = (
    node: InheritanceNode,
    level: number = 0,
  ): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
            node.source === "EXPLICIT"
              ? "bg-cyan-500/10 border-cyan-500/20"
              : "bg-white/5 border-white/10"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            <i
              className={`ri-arrow-${isExpanded ? "down" : "right"}-s-line text-gray-400`}
            ></i>
          )}
          {!hasChildren && <div className="w-4"></div>}

          <i
            className={`ri-${node.type === "MODULE" ? "apps" : node.type === "FEATURE" ? "function" : "file"}-line text-cyan-400`}
          ></i>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{node.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded ${getSourceColor(node.source)}`}
              >
                {node.source}
              </span>
              <span
                className={`text-sm font-medium ${getAccessColor(node.access)}`}
              >
                {node.access}
              </span>
            </div>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-6xl animate-spin text-cyan-400 mb-4"></i>
          <p className="text-gray-400">Building inheritance tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-node-tree text-cyan-400"></i>
            Permission Inheritance Visualizer
          </h1>
          <p className="text-gray-400">
            Visualize permission inheritance hierarchy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: User Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Select User</h2>
              <select
                value={selectedUser?.id || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.id === e.target.value);
                  setSelectedUser(user || null);
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg mb-4"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>

              {selectedUser && (
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">
                    Total Permissions
                  </div>
                  <div className="text-lg font-semibold">
                    {(selectedUser.hierarchicalPermissions || []).length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tree Visualization */}
          <div className="lg:col-span-3">
            {tree ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Inheritance Tree</h2>
                  {tree.conflicts.length > 0 && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      {tree.conflicts.length} conflict(s)
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-[700px] overflow-y-auto">
                  {tree.root.children.map((module) => renderNode(module))}
                </div>

                {/* Conflicts */}
                {tree.conflicts.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-lg font-bold mb-4 text-red-400">
                      Conflicts Detected
                    </h3>
                    <div className="space-y-2">
                      {tree.conflicts.map((conflict, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                          <div className="font-semibold mb-1">
                            {conflict.conflictType}
                          </div>
                          <div className="text-sm text-gray-300">
                            {conflict.description}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Node: {conflict.node.name} ({conflict.node.type})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-node-tree text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Select a user to visualize inheritance tree
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
