/**
 * Marketplace Contract Detail Page
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { FileText, ArrowLeft, Download, Edit, Send } from "lucide-react";
import ContractViewer from "@/components/marketplace/contracts/ContractViewer";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const handleEdit = () => {
    // TODO: Navigate to edit page or open edit modal
    console.log("Edit contract:", contractId);
  };

  const handleSign = async () => {
    try {
      const response = await fetch(
        `/api/marketplace/contracts/${contractId}/signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "initiate" }),
        },
      );
      const result = await response.json();
      if (result.success) {
        // TODO: Open signature interface
        router.push(`/marketplace/contracts/${contractId}/sign`);
      }
    } catch (error) {
      console.error("Failed to initiate signature:", error);
    }
  };

  const handleDownload = () => {
    // TODO: Generate PDF and download
    console.log("Download contract:", contractId);
  };

  return (
    <PageTemplate
      title="Service Agreement"
      description="View and manage service agreement details"
      icon={FileText}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      }
    >
      <ContractViewer
        contractId={contractId}
        onEdit={handleEdit}
        onSign={handleSign}
        onDownload={handleDownload}
      />
    </PageTemplate>
  );
}
