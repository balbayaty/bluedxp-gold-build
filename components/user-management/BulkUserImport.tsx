/**
 * 📥 BULK USER IMPORT COMPONENT
 * 
 * Import users from CSV/Excel with:
 * - File upload
 * - Preview & validation
 * - Error handling
 * - Progress tracking
 * 
 * BlueDXP Platform - Enterprise Grade
 */

"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { UserRole } from "@/types/user";

interface ImportUser {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  status: "valid" | "error" | "duplicate" | "imported";
  error?: string;
}

interface BulkUserImportProps {
  onImport: (users: ImportUser[]) => Promise<void>;
  existingEmails: string[];
}

const SAMPLE_CSV = `email,name,role,department,phone
john.doe@company.com,John Doe,operator,Warehouse,+1234567890
jane.smith@company.com,Jane Smith,supervisor,Logistics,+1234567891
bob.wilson@company.com,Bob Wilson,viewer,Finance,+1234567892`;

const BulkUserImport: React.FC<BulkUserImportProps> = ({
  onImport,
  existingEmails,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [users, setUsers] = useState<ImportUser[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, success: 0, errors: 0 });

  // Parse CSV content
  const parseCSV = useCallback((content: string): ImportUser[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const emailIndex = headers.indexOf("email");
    const nameIndex = headers.indexOf("name");
    const roleIndex = headers.indexOf("role");
    const deptIndex = headers.indexOf("department");
    const phoneIndex = headers.indexOf("phone");

    if (emailIndex === -1 || nameIndex === -1) {
      throw new Error("CSV must contain 'email' and 'name' columns");
    }

    const validRoles: UserRole[] = [
      "super_admin", "platform_admin", "tenant_admin", "manager",
      "supervisor", "operator", "viewer", "customer_admin",
      "customer_user", "carrier", "partner", "auditor"
    ];

    return lines.slice(1).map((line, index) => {
      const values = line.split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      
      const email = values[emailIndex] || "";
      const name = values[nameIndex] || "";
      const roleStr = (values[roleIndex] || "viewer").toLowerCase().replace(/\s+/g, "_");
      const role = validRoles.includes(roleStr as UserRole) ? roleStr as UserRole : "viewer";
      const department = deptIndex !== -1 ? values[deptIndex] : undefined;
      const phone = phoneIndex !== -1 ? values[phoneIndex] : undefined;

      // Validate
      let status: ImportUser["status"] = "valid";
      let errorMsg: string | undefined;

      if (!email || !email.includes("@")) {
        status = "error";
        errorMsg = "Invalid email address";
      } else if (existingEmails.includes(email.toLowerCase())) {
        status = "duplicate";
        errorMsg = "Email already exists";
      } else if (!name) {
        status = "error";
        errorMsg = "Name is required";
      }

      return { email, name, role, department, phone, status, error: errorMsg };
    });
  }, [existingEmails]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseCSV(content);
        
        if (parsed.length === 0) {
          setError("No valid users found in file");
          return;
        }

        setUsers(parsed);
        setStep("preview");
      } catch (err: any) {
        setError(err.message || "Failed to parse file");
      }
    };

    reader.onerror = () => {
      setError("Failed to read file");
    };

    reader.readAsText(file);
  }, [parseCSV]);

  // Handle import
  const handleImport = async () => {
    const validUsers = users.filter((u) => u.status === "valid");
    
    if (validUsers.length === 0) {
      setError("No valid users to import");
      return;
    }

    setStep("importing");
    setProgress(0);

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      await onImport(validUsers);

      clearInterval(interval);
      setProgress(100);

      // Update status
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          status: u.status === "valid" ? "imported" : u.status,
        }))
      );

      setStats({
        total: users.length,
        success: validUsers.length,
        errors: users.length - validUsers.length,
      });

      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Import failed");
      setStep("preview");
    }
  };

  // Download sample CSV
  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
  };

  // Reset
  const reset = () => {
    setStep("upload");
    setUsers([]);
    setProgress(0);
    setError(null);
    setStats({ total: 0, success: 0, errors: 0 });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
      >
        <i className="ri-upload-2-line mr-2"></i>
        Import Users
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          reset();
        }}
        title="Import Users"
        size="lg"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4">
                  <i className="ri-file-upload-line text-3xl text-cyan-400"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-[#9ca3af]">
                  Upload a CSV file with user data to import multiple users at once
                </p>
              </div>

              {/* Upload Area */}
              <label className="block p-8 border-2 border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-cyan-500/50 transition-colors">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <i className="ri-upload-cloud-2-line text-4xl text-[#6b7280] mb-2"></i>
                <p className="text-sm text-white mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[#6b7280]">CSV files only</p>
              </label>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <i className="ri-error-warning-line"></i>
                    {error}
                  </div>
                </div>
              )}

              {/* Sample Download */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Need a template?</p>
                    <p className="text-xs text-[#9ca3af]">
                      Download our sample CSV with the correct format
                    </p>
                  </div>
                  <button
                    onClick={downloadSample}
                    className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-500/30 transition-colors"
                  >
                    <i className="ri-download-line mr-1"></i>
                    Download Template
                  </button>
                </div>
              </div>

              {/* Required Fields */}
              <div className="text-xs text-[#9ca3af]">
                <p className="font-medium text-white mb-1">Required columns:</p>
                <p>• email - User email address</p>
                <p>• name - Full name</p>
                <p className="font-medium text-white mt-2 mb-1">Optional columns:</p>
                <p>• role - User role (default: viewer)</p>
                <p>• department - Department name</p>
                <p>• phone - Phone number</p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">{users.length}</div>
                  <div className="text-xs text-[#9ca3af]">Total</div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {users.filter((u) => u.status === "valid").length}
                  </div>
                  <div className="text-xs text-[#9ca3af]">Valid</div>
                </div>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {users.filter((u) => u.status !== "valid").length}
                  </div>
                  <div className="text-xs text-[#9ca3af]">Errors</div>
                </div>
              </div>

              {/* Users Table */}
              <div className="max-h-[300px] overflow-y-auto border border-white/10 rounded-xl">
                <table className="w-full">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-[#9ca3af]">Status</th>
                      <th className="px-4 py-2 text-left text-xs text-[#9ca3af]">Email</th>
                      <th className="px-4 py-2 text-left text-xs text-[#9ca3af]">Name</th>
                      <th className="px-4 py-2 text-left text-xs text-[#9ca3af]">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((user, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-2">
                          {user.status === "valid" ? (
                            <span className="text-green-400">
                              <i className="ri-check-line"></i>
                            </span>
                          ) : user.status === "duplicate" ? (
                            <span className="text-yellow-400" title={user.error}>
                              <i className="ri-error-warning-line"></i>
                            </span>
                          ) : (
                            <span className="text-red-400" title={user.error}>
                              <i className="ri-close-line"></i>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-white">{user.email}</td>
                        <td className="px-4 py-2 text-sm text-[#9ca3af]">{user.name}</td>
                        <td className="px-4 py-2 text-sm text-[#9ca3af] capitalize">
                          {user.role.replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={users.filter((u) => u.status === "valid").length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50"
                >
                  Import {users.filter((u) => u.status === "valid").length} Users
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Importing Users...
              </h3>
              <div className="w-full max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-[#9ca3af] mt-2">{progress}%</p>
            </motion.div>
          )}

          {/* Step 4: Complete */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <i className="ri-check-line text-3xl text-green-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Import Complete!
              </h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Successfully imported {stats.success} of {stats.total} users
              </p>
              
              {stats.errors > 0 && (
                <p className="text-xs text-yellow-400 mb-4">
                  {stats.errors} user(s) were skipped due to errors
                </p>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-colors"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  );
};

export default BulkUserImport;
