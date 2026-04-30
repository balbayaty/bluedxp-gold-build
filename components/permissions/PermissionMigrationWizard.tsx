/**
 * 🧙 PERMISSION MIGRATION WIZARD UI
 *
 * Step-by-step migration wizard:
 * - Select users
 * - Choose template or custom permissions
 * - Preview changes
 * - Execute migration
 * - Track progress
 * - Rollback support
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { permissionTemplates } from "@/lib/services/permissions/permissionTemplates";
import { permissionMigrationWizard } from "@/lib/services/permissions/permissionMigrationWizard";
import type { User } from "@/types/user";
import type { MigrationPlan } from "@/lib/services/permissions/permissionMigrationWizard";

export default function PermissionMigrationWizardComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(
    null,
  );
  const [step, setStep] = useState<
    "select" | "configure" | "preview" | "execute" | "complete"
  >("select");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, templateData] = await Promise.all([
        userService.getUsers({}),
        permissionTemplates.getTemplates({}),
      ]);
      setUsers(userData);
      setTemplates(templateData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const createPlan = async () => {
    if (selectedUsers.length === 0 || !selectedTemplate) return;

    setLoading(true);
    try {
      const plan = await permissionMigrationWizard.createMigrationPlan(
        `Migration ${new Date().toLocaleDateString()}`,
        `Migrate ${selectedUsers.length} user(s) to ${selectedTemplate} template`,
        selectedUsers,
        { targetTemplate: selectedTemplate },
      );
      setMigrationPlan(plan);
      setStep("preview");
    } catch (error) {
      console.error("Failed to create plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async () => {
    if (!migrationPlan) return;

    setLoading(true);
    try {
      const result = await permissionMigrationWizard.executeMigration(
        migrationPlan.id,
      );
      setMigrationPlan(result);
      setStep("complete");
    } catch (error) {
      console.error("Failed to execute migration:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (user: User) => {
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <i className="ri-magic-line text-cyan-400"></i>
            Permission Migration Wizard
          </h1>
          <p className="text-gray-400">
            Step-by-step wizard to migrate user permissions
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {["select", "configure", "preview", "execute", "complete"].map(
              (s, idx) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step === s
                        ? "bg-cyan-500 text-white"
                        : [
                              "select",
                              "configure",
                              "preview",
                              "execute",
                              "complete",
                            ].indexOf(step) > idx
                          ? "bg-green-500 text-white"
                          : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        [
                          "select",
                          "configure",
                          "preview",
                          "execute",
                          "complete",
                        ].indexOf(step) > idx
                          ? "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          {step === "select" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Step 1: Select Users</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedUsers.find((u) => u.id === user.id)
                        ? "bg-cyan-500/20 border-cyan-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-400">
                          {user.email}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {(user.hierarchicalPermissions || []).length} perms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("configure")}
                disabled={selectedUsers.length === 0}
                className="w-full px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Configure ({selectedUsers.length} selected)
              </button>
            </div>
          )}

          {step === "configure" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Step 2: Choose Template
              </h2>
              <div className="space-y-2 mb-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? "bg-cyan-500/20 border-cyan-400"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="font-semibold mb-1">{template.name}</div>
                    <div className="text-sm text-gray-400">
                      {template.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {template.permissions.length} permissions
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("select")}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20"
                >
                  Back
                </button>
                <button
                  onClick={createPlan}
                  disabled={!selectedTemplate || loading}
                  className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Plan..." : "Next: Preview"}
                </button>
              </div>
            </div>
          )}

          {step === "preview" && migrationPlan && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Step 3: Preview Migration
              </h2>
              <div className="space-y-4 mb-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Users</div>
                  <div className="font-semibold">
                    {migrationPlan.sourceUsers.length} user(s)
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Steps</div>
                  <div className="space-y-2">
                    {migrationPlan.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-sm"
                      >
                        <i
                          className={`ri-${step.status === "COMPLETED" ? "check" : step.status === "RUNNING" ? "loader-4 animate-spin" : "circle"}-line`}
                        ></i>
                        <span>{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("configure")}
                  className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20"
                >
                  Back
                </button>
                <button
                  onClick={executeMigration}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? "Executing..." : "Execute Migration"}
                </button>
              </div>
            </div>
          )}

          {step === "complete" && migrationPlan && (
            <div className="text-center">
              <i className="ri-checkbox-circle-line text-6xl text-green-400 mb-4"></i>
              <h2 className="text-2xl font-bold mb-2">Migration Complete!</h2>
              <p className="text-gray-400 mb-6">
                {migrationPlan.sourceUsers.length} user(s) migrated successfully
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep("select");
                    setSelectedUsers([]);
                    setSelectedTemplate("");
                    setMigrationPlan(null);
                  }}
                  className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600"
                >
                  New Migration
                </button>
                {migrationPlan.status === "COMPLETED" && (
                  <button
                    onClick={async () => {
                      await permissionMigrationWizard.rollbackMigration(
                        migrationPlan.id,
                      );
                      await loadData();
                    }}
                    className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30"
                  >
                    Rollback
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
