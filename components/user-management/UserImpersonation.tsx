/**
 * 👤 USER IMPERSONATION COMPONENT
 * 
 * Allow admins to view app as another user:
 * - Select user to impersonate
 * - Visual indicator when impersonating
 * - End impersonation
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EnhancedUser } from "@/types/userManagement";

interface UserImpersonationProps {
  currentUser: EnhancedUser;
  users: EnhancedUser[];
  onImpersonate: (userId: string) => void;
  onEndImpersonation: () => void;
  isImpersonating?: boolean;
  impersonatedUser?: EnhancedUser | null;
}

const UserImpersonation: React.FC<UserImpersonationProps> = ({
  currentUser,
  users,
  onImpersonate,
  onEndImpersonation,
  isImpersonating = false,
  impersonatedUser = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if current user can impersonate
  const canImpersonate = ["super_admin", "platform_admin"].includes(currentUser.role);

  if (!canImpersonate) {
    return null;
  }

  // Filter users (exclude self)
  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get selected user
  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Start impersonation
  const handleImpersonate = () => {
    if (selectedUserId) {
      onImpersonate(selectedUserId);
      setIsOpen(false);
      setSelectedUserId(null);
      setSearchQuery("");
    }
  };

  // Impersonation Banner (shown when impersonating)
  if (isImpersonating && impersonatedUser) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="ri-spy-line text-xl"></i>
            <span className="text-sm">
              You are viewing as <strong>{impersonatedUser.name}</strong> ({impersonatedUser.email})
            </span>
          </div>
          <button
            onClick={onEndImpersonation}
            className="px-4 py-1 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <i className="ri-logout-box-line"></i>
            End Impersonation
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-400 hover:bg-purple-500/30 transition-colors"
      >
        <i className="ri-spy-line mr-1"></i>
        Impersonate User
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedUserId(null);
          setSearchQuery("");
        }}
        title="Impersonate User"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start gap-2 text-yellow-400 text-sm">
              <i className="ri-alert-line mt-0.5"></i>
              <span>
                Impersonation allows you to view the application as another user.
                All actions will be logged for security purposes.
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users to impersonate..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* User List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full p-3 rounded-xl border text-left transition-colors ${
                  selectedUserId === user.id
                    ? "bg-purple-500/10 border-purple-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{user.name}</div>
                    <div className="text-xs text-[#9ca3af] truncate">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#9ca3af] capitalize">
                      {user.role.replace(/_/g, " ")}
                    </div>
                    <div className={`text-xs ${user.status === "active" ? "text-green-400" : "text-yellow-400"}`}>
                      {user.status}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-[#9ca3af]">
                No users found
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedUserId}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="ri-spy-line"></i>
              Impersonate
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          handleImpersonate();
        }}
        title="Confirm Impersonation"
        message={`You are about to view the application as ${selectedUser?.name}. This action will be logged for security purposes. Continue?`}
        confirmText="Start Impersonation"
        confirmVariant="warning"
      />
    </>
  );
};

export default UserImpersonation;
