/**
 * 🔄 ROLE CLONE COMPONENT
 * 
 * Clone permissions from one user to another:
 * - Select source user
 * - Preview permissions
 * - Apply to target user
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { EnhancedUser } from "@/types/userManagement";
import { HierarchicalPermission } from "@/types/user";

interface RoleCloneProps {
  targetUser: EnhancedUser;
  users: EnhancedUser[];
  onClone: (sourceUserId: string, permissions: HierarchicalPermission[]) => void;
}

const RoleClone: React.FC<RoleCloneProps> = ({ targetUser, users, onClone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"select" | "preview" | "confirm">("select");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Filter users (exclude target user)
  const filteredUsers = users.filter(
    (u) =>
      u.id !== targetUser.id &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get selected user
  const selectedUser = users.find((u) => u.id === selectedUserId);

  // Reset on close
  const handleClose = () => {
    setIsOpen(false);
    setStep("select");
    setSelectedUserId(null);
    setSearchQuery("");
  };

  // Apply permissions
  const handleApply = async () => {
    if (!selectedUser?.hierarchicalPermissions) return;

    setIsApplying(true);
    try {
      const permissions = Array.isArray(selectedUser.hierarchicalPermissions)
        ? selectedUser.hierarchicalPermissions
        : [];
      
      onClone(selectedUserId!, permissions);
      handleClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-colors"
      >
        <i className="ri-file-copy-line mr-1"></i>
        Clone From User
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Clone Permissions"
        size="md"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Select User */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-[#9ca3af]">
                Select a user to copy permissions from:
              </p>

              {/* Search */}
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* User List */}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {filteredUsers.map((user) => {
                  const permCount = Array.isArray(user.hierarchicalPermissions)
                    ? user.hierarchicalPermissions.length
                    : 0;

                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setStep("preview");
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-colors ${
                        selectedUserId === user.id
                          ? "bg-cyan-500/10 border-cyan-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium">
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
                          <div className="text-xs text-cyan-400">
                            {permCount} permission{permCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-[#9ca3af]">
                    No users found
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && selectedUser && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-[#9ca3af]">{selectedUser.email}</div>
                  <div className="text-xs text-cyan-400 capitalize mt-1">
                    {selectedUser.role.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-2">
                  Permissions to be copied:
                </h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {Array.isArray(selectedUser.hierarchicalPermissions) &&
                  selectedUser.hierarchicalPermissions.length > 0 ? (
                    selectedUser.hierarchicalPermissions.map((perm, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <i className="ri-checkbox-circle-fill text-green-400"></i>
                          <span className="text-sm text-white capitalize">
                            {perm.moduleId.replace(/-/g, " ")}
                          </span>
                          {perm.featureId && (
                            <>
                              <span className="text-[#6b7280]">→</span>
                              <span className="text-xs text-[#9ca3af] capitalize">
                                {perm.featureId.replace(/-/g, " ")}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {perm.actions?.map((action) => (
                            <span
                              key={action}
                              className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-[#9ca3af] capitalize"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[#9ca3af]">
                      No permissions to copy
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("select")}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={
                    !Array.isArray(selectedUser.hierarchicalPermissions) ||
                    selectedUser.hierarchicalPermissions.length === 0
                  }
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedUser && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3 text-yellow-400">
                  <i className="ri-alert-line text-xl mt-0.5"></i>
                  <div>
                    <p className="font-medium">Confirm Permission Clone</p>
                    <p className="text-sm mt-1">
                      This will replace <strong>{targetUser.name}</strong>'s existing
                      permissions with permissions from <strong>{selectedUser.name}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white">{selectedUser.name}</span>
                </div>
                <i className="ri-arrow-right-line text-[#6b7280] text-xl"></i>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-medium">
                    {targetUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white">{targetUser.name}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("preview")}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isApplying ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Applying...
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line"></i>
                      Apply Permissions
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
};

export default RoleClone;
