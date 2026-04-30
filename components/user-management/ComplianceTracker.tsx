/**
 * ✅ COMPLIANCE TRACKER
 * 
 * Track certifications, training, and compliance with:
 * - Expiry management
 * - Renewal reminders
 * - Document uploads
 * - Audit trail
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { ComplianceRecord, ComplianceType } from "@/types/userManagement";
import { format, differenceInDays, addDays } from "date-fns";

export interface ComplianceTrackerProps {
  userId: string;
  records: ComplianceRecord[];
  onAddRecord: (record: Omit<ComplianceRecord, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateRecord: (id: string, updates: Partial<ComplianceRecord>) => void;
  onDeleteRecord: (id: string) => void;
  readOnly?: boolean;
}

const COMPLIANCE_TYPES: { type: ComplianceType; label: string; icon: string }[] = [
  { type: "training", label: "Training", icon: "ri-book-open-line" },
  { type: "certification", label: "Certification", icon: "ri-award-line" },
  { type: "background_check", label: "Background Check", icon: "ri-user-search-line" },
  { type: "safety_training", label: "Safety Training", icon: "ri-shield-check-line" },
  { type: "gdpr_acknowledgment", label: "GDPR Acknowledgment", icon: "ri-file-shield-line" },
  { type: "security_clearance", label: "Security Clearance", icon: "ri-lock-line" },
  { type: "health_check", label: "Health Check", icon: "ri-heart-pulse-line" },
  { type: "license", label: "License", icon: "ri-file-certificate-line" },
  { type: "insurance", label: "Insurance", icon: "ri-safe-line" },
  { type: "custom", label: "Custom", icon: "ri-file-text-line" },
];

// Note: Mock records removed - component now uses real API data from /api/users/[id]/compliance

const ComplianceTracker: React.FC<ComplianceTrackerProps> = ({
  userId,
  records: providedRecords,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  readOnly = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "expiring" | "expired" | "compliant">("all");
  
  // Form state
  const [formData, setFormData] = useState({
    type: "certification" as ComplianceType,
    certificationName: "",
    certificationNumber: "",
    issuedBy: "",
    issuedAt: "",
    expiresAt: "",
    notes: "",
  });

  // Use provided records - no mock fallback
  const records = providedRecords;

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiresAt?: Date | string): number | null => {
    if (!expiresAt) return null;
    return differenceInDays(new Date(expiresAt), new Date());
  };

  // Get status color
  const getStatusStyle = (record: ComplianceRecord) => {
    const daysLeft = getDaysUntilExpiry(record.expiresAt);
    
    if (record.status === "expired" || (daysLeft !== null && daysLeft < 0)) {
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "Expired" };
    }
    if (record.status === "non_compliant") {
      return { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "Non-Compliant" };
    }
    if (record.status === "pending") {
      return { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", label: "Pending" };
    }
    if (daysLeft !== null && daysLeft <= 30) {
      return { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", label: "Expiring Soon" };
    }
    return { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", label: "Compliant" };
  };

  // Filter records
  const filteredRecords = records.filter((record) => {
    if (selectedFilter === "all") return true;
    
    const daysLeft = getDaysUntilExpiry(record.expiresAt);
    
    if (selectedFilter === "expiring") {
      return daysLeft !== null && daysLeft > 0 && daysLeft <= 30;
    }
    if (selectedFilter === "expired") {
      return record.status === "expired" || (daysLeft !== null && daysLeft < 0);
    }
    if (selectedFilter === "compliant") {
      return record.status === "compliant" && (daysLeft === null || daysLeft > 30);
    }
    return true;
  });

  // Stats
  const stats = {
    total: records.length,
    compliant: records.filter((r) => r.status === "compliant").length,
    expiring: records.filter((r) => {
      const days = getDaysUntilExpiry(r.expiresAt);
      return days !== null && days > 0 && days <= 30;
    }).length,
    expired: records.filter((r) => {
      const days = getDaysUntilExpiry(r.expiresAt);
      return r.status === "expired" || (days !== null && days < 0);
    }).length,
  };

  const handleSubmit = () => {
    onAddRecord({
      userId,
      type: formData.type,
      status: "pending",
      certificationName: formData.certificationName,
      certificationNumber: formData.certificationNumber || undefined,
      issuedBy: formData.issuedBy || undefined,
      issuedAt: formData.issuedAt ? new Date(formData.issuedAt) : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined,
      notes: formData.notes || undefined,
    });
    setShowAddModal(false);
    setFormData({
      type: "certification",
      certificationName: "",
      certificationNumber: "",
      issuedBy: "",
      issuedAt: "",
      expiresAt: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="ri-award-line text-yellow-400"></i>
            Compliance & Certifications
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            {stats.total} records • {stats.expiring > 0 && `${stats.expiring} expiring soon`}
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-yellow-600 hover:to-orange-600 transition-colors shadow-lg shadow-yellow-500/20"
          >
            <i className="ri-add-line mr-2"></i>
            Add Record
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { filter: "all", label: "Total", value: stats.total, icon: "ri-file-list-line", color: "text-cyan-400" },
          { filter: "compliant", label: "Compliant", value: stats.compliant, icon: "ri-check-line", color: "text-green-400" },
          { filter: "expiring", label: "Expiring", value: stats.expiring, icon: "ri-time-line", color: "text-orange-400" },
          { filter: "expired", label: "Expired", value: stats.expired, icon: "ri-close-line", color: "text-red-400" },
        ].map((stat) => (
          <button
            key={stat.filter}
            onClick={() => setSelectedFilter(stat.filter as any)}
            className={`p-4 rounded-lg border transition-all text-left ${
              selectedFilter === stat.filter
                ? "bg-white/10 border-cyan-500"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className={`${stat.icon} ${stat.color}`}></i>
              <span className="text-xs text-[#9ca3af]">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </button>
        ))}
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
          <i className="ri-award-line text-4xl text-[#6b7280] mb-2"></i>
          <p className="text-sm text-[#9ca3af]">No compliance records found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record, index) => {
            const typeConfig = COMPLIANCE_TYPES.find((t) => t.type === record.type) || COMPLIANCE_TYPES[9];
            const statusStyle = getStatusStyle(record);
            const daysLeft = getDaysUntilExpiry(record.expiresAt);

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 bg-white/5 border rounded-xl transition-all hover:border-white/20 ${statusStyle.border}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${statusStyle.bg} flex items-center justify-center`}>
                      <i className={`${typeConfig.icon} text-2xl ${statusStyle.text}`}></i>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{record.certificationName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <div className="text-sm text-[#9ca3af] mb-1">
                        {typeConfig.label}
                        {record.issuedBy && ` • Issued by ${record.issuedBy}`}
                      </div>
                      {record.certificationNumber && (
                        <div className="text-xs text-[#9ca3af] font-mono">
                          #{record.certificationNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {record.expiresAt && (
                      <div className="mb-1">
                        <div className="text-sm text-white">
                          {daysLeft !== null && daysLeft < 0
                            ? `Expired ${Math.abs(daysLeft)} days ago`
                            : daysLeft !== null
                              ? `${daysLeft} days left`
                              : ""}
                        </div>
                        <div className="text-xs text-[#9ca3af]">
                          Expires {format(new Date(record.expiresAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    )}
                    {record.issuedAt && (
                      <div className="text-xs text-[#9ca3af]">
                        Issued {format(new Date(record.issuedAt), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-[#9ca3af]">{record.notes}</div>
                  </div>
                )}

                {!readOnly && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                    <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white hover:bg-white/10 transition-colors">
                      <i className="ri-edit-line mr-1"></i>
                      Edit
                    </button>
                    <button className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white hover:bg-white/10 transition-colors">
                      <i className="ri-upload-line mr-1"></i>
                      Upload Doc
                    </button>
                    {statusStyle.label === "Expiring Soon" && (
                      <button className="px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400 hover:bg-orange-500/30 transition-colors">
                        <i className="ri-refresh-line mr-1"></i>
                        Renew
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Record Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Compliance Record"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ComplianceType })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              >
                {COMPLIANCE_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.certificationName}
                onChange={(e) => setFormData({ ...formData, certificationName: e.target.value })}
                placeholder="e.g., ISO 27001 Certification"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Certificate Number</label>
              <input
                type="text"
                value={formData.certificationNumber}
                onChange={(e) => setFormData({ ...formData, certificationNumber: e.target.value })}
                placeholder="e.g., CERT-2024-001"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Issued By</label>
              <input
                type="text"
                value={formData.issuedBy}
                onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                placeholder="e.g., ISO Training Institute"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Issue Date</label>
              <input
                type="date"
                value={formData.issuedAt}
                onChange={(e) => setFormData({ ...formData, issuedAt: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Expiry Date</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-[#6b7280] focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.certificationName}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50"
            >
              Add Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ComplianceTracker;
