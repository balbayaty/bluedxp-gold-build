/**
 * QHSE Approvals Page
 * Approval workflow management
 */

"use client";

import React from "react";
import ApprovalQueue from "@/components/qhse/ApprovalQueue";
import { useAuth } from "@/contexts/AuthContext";

export default function QHSEApprovalsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">QHSE Approvals</h1>
        <p className="text-gray-600 mt-1">
          Manage approval workflows for incidents, inspections, and training
        </p>
      </div>

      {user && (
        <ApprovalQueue userId={user.id || ""} role={user.role || "USER"} />
      )}
    </div>
  );
}
