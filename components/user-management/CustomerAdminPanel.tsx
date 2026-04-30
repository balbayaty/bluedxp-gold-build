/**
 * 👥 CUSTOMER ADMIN PANEL
 * 
 * Enables Customer Admins to:
 * - Manage their team users
 * - Set permissions within their scope
 * - View team usage
 * - Invite new team members
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EnhancedUser } from "@/types/userManagement";
import { UserRole } from "@/types/user";
import { format, formatDistanceToNow } from "date-fns";

interface CustomerAdminPanelProps {
  currentUser: EnhancedUser;
  teamMembers: EnhancedUser[];
  onInviteUser: (email: string, role: UserRole, name: string) => Promise<void>;
  onUpdateUser: (userId: string, updates: Partial<EnhancedUser>) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
  onResendInvite: (userId: string) => Promise<void>;
  teamLimits: {
    maxUsers: number;
    usedUsers: number;
  };
}

// Roles that customer admins can assign
const ASSIGNABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "customer_admin", label: "Customer Admin", description: "Full access to team management" },
  { value: "customer_user", label: "Customer User", description: "Standard access to platform features" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

const CustomerAdminPanel: React.FC<CustomerAdminPanelProps> = ({
  currentUser,
  teamMembers,
  onInviteUser,
  onUpdateUser,
  onRemoveUser,
  onResendInvite,
  teamLimits,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "customer_user" as UserRole,
  });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Filter team members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      const matchesSearch =
        !searchQuery ||
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === "all" || member.role === filterRole;
      const matchesStatus = filterStatus === "all" || member.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [teamMembers, searchQuery, filterRole, filterStatus]);

  // Stats
  const stats = useMemo(() => ({
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === "active").length,
    pending: teamMembers.filter((m) => m.status === "pending").length,
    admins: teamMembers.filter((m) => m.role === "customer_admin").length,
  }), [teamMembers]);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      setInviteError("Email and name are required");
      return;
    }

    if (teamLimits.usedUsers >= teamLimits.maxUsers) {
      setInviteError("Team user limit reached. Please upgrade your plan.");
      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);
      await onInviteUser(inviteForm.email, inviteForm.role, inviteForm.name);
      setShowInviteModal(false);
      setInviteForm({ email: "", name: "", role: "customer_user" });
    } catch (error: any) {
      setInviteError(error.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await onRemoveUser(userId);
      setShowRemoveConfirm(null);
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-500/20", text: "text-green-400", label: "Active" };
      case "pending":
        return { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "Pending" };
      case "inactive":
        return { bg: "bg-gray-500/20", text: "text-gray-400", label: "Inactive" };
      case "suspended":
        return { bg: "bg-red-500/20", text: "text-red-400", label: "Suspended" };
      default:
        return { bg: "bg-gray-500/20", text: "text-gray-400", label: "Unknown" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <i className="ri-team-line text-cyan-400"></i>
            Team Management
          </h2>
          <p className="text-sm text-[#9ca3af] mt-1">
            Manage your team members and their access
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-[#9ca3af]">
            <span className="text-white font-medium">{teamLimits.usedUsers}</span>
            <span> / {teamLimits.maxUsers} users</span>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            disabled={teamLimits.usedUsers >= teamLimits.maxUsers}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-user-add-line mr-2"></i>
            Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: "ri-user-line", color: "text-cyan-400" },
          { label: "Active", value: stats.active, icon: "ri-check-line", color: "text-green-400" },
          { label: "Pending", value: stats.pending, icon: "ri-time-line", color: "text-yellow-400" },
          { label: "Admins", value: stats.admins, icon: "ri-shield-user-line", color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <i className={`${stat.icon} ${stat.color}`}></i>
              <span className="text-xs text-[#9ca3af]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"></i>
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Roles</option>
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Team Members List */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-user-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af] mb-4">No team members found</p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm hover:bg-cyan-500/30 transition-colors"
          >
            Invite First Team Member
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Last Active</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredMembers.map((member) => {
                const statusBadge = getStatusBadge(member.status);
                const isCurrentUser = member.id === currentUser.id;

                return (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {member.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium flex items-center gap-2">
                            {member.name}
                            {isCurrentUser && (
                              <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">You</span>
                            )}
                          </div>
                          <div className="text-sm text-[#9ca3af]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          onUpdateUser(member.id, { role: e.target.value as UserRole })
                        }
                        disabled={isCurrentUser}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9ca3af]">
                      {member.lastLogin
                        ? formatDistanceToNow(new Date(member.lastLogin), { addSuffix: true })
                        : "Never"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {member.status === "pending" && (
                          <button
                            onClick={() => onResendInvite(member.id)}
                            className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition-colors"
                          >
                            <i className="ri-mail-send-line mr-1"></i>
                            Resend
                          </button>
                        )}
                        {!isCurrentUser && (
                          <button
                            onClick={() => setShowRemoveConfirm(member.id)}
                            className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 transition-colors"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteError(null);
        }}
        title="Invite Team Member"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#9ca3af]">
            Send an invitation to add a new member to your team.
          </p>

          {inviteError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <i className="ri-error-warning-line"></i>
                {inviteError}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              placeholder="john@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Role</label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as UserRole })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label} - {role.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteError(null);
              }}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={isInviting || !inviteForm.email || !inviteForm.name}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInviting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Inviting...
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line"></i>
                  Send Invite
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={!!showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(null)}
        onConfirm={() => showRemoveConfirm && handleRemove(showRemoveConfirm)}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? They will lose access to all team resources."
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  );
};

export default CustomerAdminPanel;
