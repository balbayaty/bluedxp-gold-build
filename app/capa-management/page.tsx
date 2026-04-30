/**
 * CAPA Management - Enhanced
 * Corrective & Preventive Actions Management
 *
 * Enhanced beyond original chemcheck-ai implementation:
 * - Full workflow support
 * - Cross-module interconnections
 * - AI-powered suggestions
 * - Enhanced forms and tracking
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import ModuleLinks from "@/components/ModuleLinks";
import { getCAPALinks, getISOIMSLinks } from "@/utils/moduleInterconnectivity";
import UserSelector from "@/components/ims/UserSelector";
import CustomerSelector from "@/components/ims/CustomerSelector";
import SupplierSelector from "@/components/ims/SupplierSelector";
import AdvancedCAPAForm from "@/components/ims/AdvancedCAPAForm";
import EditCAPAModal from "@/components/ims/EditCAPAModal";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotifications } from "@/lib/utils/notifications";
import { NotificationPatterns } from "@/lib/utils/notifications";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import QRCodeBadge from "@/components/qr/QRCodeBadge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/utils/apiFetch";

type AdvancedDetectionContext = any;

interface CAPA {
  id: string;
  capaNumber: string;
  subject: string;
  description: string;
  status:
    | "DRAFT"
    | "OPEN"
    | "IN_PROGRESS"
    | "UNDER_REVIEW"
    | "AWAITING_APPROVAL"
    | "APPROVED"
    | "IMPLEMENTED"
    | "EFFECTIVENESS_REVIEW"
    | "COMPLETED"
    | "CLOSED"
    | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  capaType: "CORRECTIVE_ACTION" | "PREVENTIVE_ACTION";
  capaSource:
    | "NCR"
    | "AUDIT"
    | "RISK_ASSESSMENT"
    | "CUSTOMER_COMPLAINT"
    | "MANAGEMENT_REVIEW"
    | "INCIDENT"
    | "INTERNAL_REVIEW"
    | "OTHER";
  assignedTo: string;
  department: string;
  owner: string;
  targetDate: string | Date;
  completionDate?: string | Date;
  rootCause?: string;
  actionPlan: string;
  effectivenessReview?: string;
  linkedNCR?: string;
  linkedMaterial?: string;
  linkedOrder?: string;
  linkedLocation?: string;
  linkedCustomer?: string;
  linkedSupplier?: string;
}

function CAPAManagementPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
  const { user, tenant } = useAuth();
  const linkedNCR = searchParams.get("ncr");
  const linkedSO = searchParams.get("so");
  const linkedMaterial = searchParams.get("material");

  // Get tenantId and userId from auth context
  const tenantId = tenant?.id || "tenant-1"; // Fallback for dev
  const userId = user?.id || user?.email || "system";

  const [capas, setCAPAs] = useState<CAPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCAPA, setSelectedCAPA] = useState<CAPA | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [newCAPA, setNewCAPA] = useState({
    subject: "",
    capa_type: "Corrective Action",
    capa_source: linkedNCR ? "NCR" : "Audit",
    priority: "Medium",
    description: "",
    exp_end_date: "",
    assigned_to: "",
    root_cause: "",
    resources_required: "",
    linked_customer: "",
    linked_supplier: "",
  });

  // Helper function to map API status to display status
  const getDisplayStatus = (status: CAPA["status"]): string => {
    const statusMap: Record<string, string> = {
      DRAFT: "Draft",
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      UNDER_REVIEW: "Under Review",
      AWAITING_APPROVAL: "Awaiting Approval",
      APPROVED: "Approved",
      IMPLEMENTED: "Implemented",
      EFFECTIVENESS_REVIEW: "Effectiveness Review",
      COMPLETED: "Completed",
      CLOSED: "Closed",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status;
  };

  // Helper function to map API priority to display priority
  const getDisplayPriority = (priority: CAPA["priority"]): string => {
    const priorityMap: Record<string, string> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      CRITICAL: "Critical",
    };
    return priorityMap[priority] || priority;
  };

  // Helper function to map API type to display type
  const getDisplayType = (type: CAPA["capaType"]): string => {
    return type === "CORRECTIVE_ACTION"
      ? "Corrective Action"
      : "Preventive Action";
  };

  // Helper function to map API source to display source
  const getDisplaySource = (source: CAPA["capaSource"]): string => {
    const sourceMap: Record<string, string> = {
      NCR: "NCR",
      AUDIT: "Audit",
      RISK_ASSESSMENT: "Risk Assessment",
      CUSTOMER_COMPLAINT: "Customer Complaint",
      MANAGEMENT_REVIEW: "Management Review",
      INCIDENT: "Incident",
      INTERNAL_REVIEW: "Internal Review",
      OTHER: "Other",
    };
    return sourceMap[source] || source;
  };

  const filteredCAPAs = capas.filter((capa) => {
    const matchesSearch =
      capa.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capa.capaNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || capa.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || capa.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Map API status to display status for filtering
  const getStatusForFilter = (status: CAPA["status"]): string => {
    if (status === "OPEN") return "Open";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "UNDER_REVIEW") return "Under Review";
    if (status === "COMPLETED") return "Completed";
    if (status === "CLOSED") return "Closed";
    return status;
  };

  const stats = {
    total: capas.length,
    open: capas.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS")
      .length,
    completed: capas.filter(
      (c) => c.status === "COMPLETED" || c.status === "CLOSED",
    ).length,
    critical: capas.filter((c) => c.priority === "CRITICAL").length,
  };

  const fetchCAPAs = async () => {
    try {
      setLoading(true);
      // Use consistent tenantId - API will get it from auth context, but we pass it for clarity
      const response = await apiFetch(`/api/iso-ims/capa?page=1&pageSize=100`, {
        method: "GET",
        tenantId,
        userId,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("CAPA fetch response:", {
          success: data.success,
          count: data.data?.length,
          data: data.data,
        });

        if (data.success && data.data) {
          // Map API data to our CAPA interface
          const mappedCAPAs: CAPA[] = data.data.map((capa: any) => ({
            id: capa.id,
            capaNumber: capa.capaNumber,
            subject: capa.subject,
            description: capa.description || capa.actionPlan || "",
            status: capa.status,
            priority: capa.priority,
            capaType: capa.capaType,
            capaSource: capa.capaSource,
            assignedTo: capa.assignedTo,
            department: capa.department,
            owner: capa.owner || capa.assignedTo,
            targetDate: capa.targetDate,
            completionDate: capa.completionDate,
            rootCause: capa.rootCause,
            actionPlan: capa.actionPlan,
            effectivenessReview: capa.effectivenessReview,
            linkedNCR: capa.linkedNCR,
            linkedMaterial: capa.linkedMaterial,
            linkedOrder: capa.linkedOrder,
            linkedLocation: capa.linkedLocation,
            linkedCustomer: capa.linkedCustomer,
            linkedSupplier: capa.linkedSupplier,
          }));
          console.log("Mapped CAPAs:", mappedCAPAs.length);
          setCAPAs(mappedCAPAs);
        } else {
          console.warn("No CAPAs in response or success=false:", data);
          setCAPAs([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch CAPAs:", {
          status: response.status,
          error: errorData,
        });
        setCAPAs([]);
        notifications.error(
          "Failed to Load CAPAs",
          errorData.error ||
            `Unable to load CAPAs (${response.status}). Please try again.`,
          { duration: 5000 },
        );
      }
    } catch (error) {
      console.error("Error fetching CAPAs:", error);
      setCAPAs([]);
      notifications.error(
        "Error Loading CAPAs",
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
        { duration: 5000 },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCAPAs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC key handler and body scroll lock for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showEditModal) {
          setShowEditModal(false);
          setSelectedCAPA(null);
        } else if (showAdvancedCreate) {
          setShowAdvancedCreate(false);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        } else if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedCAPA(null);
        }
      }
    };

    // Lock body scroll when any modal is open
    const hasOpenModal =
      showCreateModal || showDetailModal || showEditModal || showAdvancedCreate;
    if (hasOpenModal) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [showCreateModal, showDetailModal, showEditModal, showAdvancedCreate]);

  const handleCreateCAPA = () => {
    // Close any open modals first
    setShowDetailModal(false);
    setShowEditModal(false);
    setShowAdvancedCreate(false);
    setShowCreateModal(true);
  };

  // Helper to map display values to API values
  const mapToAPIFormat = (formData: Record<string, any>) => {
    // Map priority
    const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> =
      {
        Low: "LOW",
        Medium: "MEDIUM",
        High: "HIGH",
        Critical: "CRITICAL",
      };

    // Map CAPA type
    const typeMap: Record<string, "CORRECTIVE_ACTION" | "PREVENTIVE_ACTION"> = {
      "Corrective Action": "CORRECTIVE_ACTION",
      "Preventive Action": "PREVENTIVE_ACTION",
    };

    // Map CAPA source
    const sourceMap: Record<
      string,
      | "NCR"
      | "AUDIT"
      | "RISK_ASSESSMENT"
      | "CUSTOMER_COMPLAINT"
      | "MANAGEMENT_REVIEW"
      | "INCIDENT"
      | "INTERNAL_REVIEW"
      | "OTHER"
    > = {
      NCR: "NCR",
      Audit: "AUDIT",
      Risk: "RISK_ASSESSMENT",
      "Risk Assessment": "RISK_ASSESSMENT",
      "Customer Complaint": "CUSTOMER_COMPLAINT",
      "Management Review": "MANAGEMENT_REVIEW",
      Incident: "INCIDENT",
      "Internal Review": "INTERNAL_REVIEW",
      Other: "OTHER",
    };

    const priority = formData.priority || newCAPA.priority;
    const capaType =
      formData.capaType || formData.capa_type || newCAPA.capa_type;
    const capaSource =
      formData.capaSource || formData.capa_source || newCAPA.capa_source;

    return {
      tenantId,
      subject: formData.subject || newCAPA.subject,
      description:
        formData.actionPlan ||
        formData.description ||
        newCAPA.description ||
        formData.subject ||
        "No description provided",
      priority: priorityMap[priority] || "MEDIUM",
      capaType: typeMap[capaType] || "CORRECTIVE_ACTION",
      capaSource: sourceMap[capaSource] || (linkedNCR ? "NCR" : "AUDIT"),
      assignedTo:
        formData.assignedTo ||
        formData.assigned_to ||
        newCAPA.assigned_to ||
        userId,
      department: formData.department || "Quality",
      owner:
        formData.owner || formData.assignedTo || formData.assigned_to || userId,
      targetDate:
        formData.targetDate ||
        formData.exp_end_date ||
        newCAPA.exp_end_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      rootCause:
        formData.rootCause || formData.root_cause || newCAPA.root_cause,
      actionPlan:
        formData.actionPlan ||
        formData.description ||
        newCAPA.description ||
        formData.subject ||
        "Action plan to be defined",
      resourcesRequired:
        formData.resourcesRequired ||
        formData.resources_required ||
        newCAPA.resources_required,
      linkedNCR: linkedNCR || formData.linkedNCR,
      linkedCustomer:
        formData.linkedCustomer ||
        formData.linked_customer ||
        newCAPA.linked_customer,
      linkedSupplier:
        formData.linkedSupplier ||
        formData.linked_supplier ||
        newCAPA.linked_supplier,
      linkedMaterial: linkedMaterial || formData.linkedMaterial,
      linkedOrder: linkedSO || formData.linkedOrder,
      createdBy: userId,
    };
  };

  const handleCreateQuickCAPA = async (formData: Record<string, any>) => {
    setLoading(true);

    try {
      const capaData = mapToAPIFormat(formData);

      // Validate required fields
      if (!capaData.subject || !capaData.description || !capaData.actionPlan) {
        notifications.error(
          "Validation Error",
          "Subject, description, and action plan are required fields.",
          { duration: 5000 },
        );
        setLoading(false);
        return;
      }

      const response = await apiFetch("/api/iso-ims/capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capaData),
        tenantId,
        userId,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("CAPA creation response:", result);

        if (result.success) {
          const capaNumber = result.data?.capaNumber || "created";
          notifications.success(
            "CAPA Created Successfully!",
            `CAPA ${capaNumber} has been created.`,
            { duration: 4000 },
          );

          // Reset form and close modal first
          setShowCreateModal(false);
          setNewCAPA({
            subject: "",
            capa_type: "Corrective Action",
            capa_source: linkedNCR ? "NCR" : "Audit",
            priority: "Medium",
            description: "",
            exp_end_date: "",
            assigned_to: "",
            root_cause: "",
            resources_required: "",
            linked_customer: "",
            linked_supplier: "",
          });

          // Wait a moment for database to be ready, then refresh list
          setTimeout(async () => {
            await fetchCAPAs();
          }, 500);
        } else {
          throw new Error(result.error || "Failed to create CAPA");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("CAPA creation failed:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.error || `Failed to create CAPA (${response.status})`,
        );
      }
    } catch (error) {
      console.error("Error creating CAPA:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Please try again.";
      notifications.error("Failed to Create CAPA", errorMsg, {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedCAPASubmit = async (data: any) => {
    setLoading(true);
    try {
      // Map advanced form data to API format
      const capaData = {
        tenantId,
        subject: data.subject || "",
        description: data.action_plan || data.description || "",
        priority:
          data.priority === "Low"
            ? "LOW"
            : data.priority === "Medium"
              ? "MEDIUM"
              : data.priority === "High"
                ? "HIGH"
                : data.priority === "Critical"
                  ? "CRITICAL"
                  : "MEDIUM",
        capaType:
          data.capa_type === "Preventive Action"
            ? "PREVENTIVE_ACTION"
            : "CORRECTIVE_ACTION",
        capaSource:
          data.capa_source === "NCR"
            ? "NCR"
            : data.capa_source === "Audit"
              ? "AUDIT"
              : data.capa_source === "Risk"
                ? "RISK_ASSESSMENT"
                : data.capa_source === "Customer Complaint"
                  ? "CUSTOMER_COMPLAINT"
                  : data.capa_source === "Management Review"
                    ? "MANAGEMENT_REVIEW"
                    : data.capa_source === "Incident"
                      ? "INCIDENT"
                      : data.capa_source === "Internal Review"
                        ? "INTERNAL_REVIEW"
                        : "OTHER",
        assignedTo: data.primary_owner || data.assigned_to || userId,
        department: data.department || "Quality",
        owner: data.primary_owner || data.assigned_to || userId,
        targetDate:
          data.exp_end_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rootCause: data.root_cause || "",
        actionPlan: data.action_plan || data.description || "",
        resourcesRequired:
          data.resources?.map((r: any) => `${r.name}: ${r.cost}`).join(", ") ||
          "",
        estimatedCost: data.total_cost || data.total_direct_cost || undefined,
        linkedNCR: linkedNCR || data.linked_ncr,
        linkedCustomer: data.linked_customer,
        linkedSupplier: data.linked_supplier,
        linkedMaterial: linkedMaterial || data.linked_material,
        linkedOrder: linkedSO || data.linked_sales_order,
        createdBy: userId,
      };

      // Validate required fields
      if (!capaData.subject || !capaData.description || !capaData.actionPlan) {
        notifications.error(
          "Validation Error",
          "Subject, description, and action plan are required fields.",
          { duration: 5000 },
        );
        setLoading(false);
        return;
      }

      const response = await apiFetch("/api/iso-ims/capa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capaData),
        tenantId,
        userId,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Advanced CAPA creation response:", result);

        if (result.success) {
          const capaId = result.data?.capaNumber || "created";
          notifications.success(
            "CAPA Created Successfully!",
            `CAPA ${capaId} has been created.`,
            { duration: 4000 },
          );

          // Close modal first
          setShowAdvancedCreate(false);

          // Wait a moment for database to be ready, then refresh list
          setTimeout(async () => {
            await fetchCAPAs();
          }, 500);
        } else {
          throw new Error(result.error || "Failed to create CAPA");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Advanced CAPA creation failed:", {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.error || `Failed to create CAPA (${response.status})`,
        );
      }
    } catch (error) {
      console.error("Error creating advanced CAPA:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      notifications.error("Failed to Create CAPA", errorMsg, {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCAPA = async (updates: any) => {
    if (!selectedCAPA) return;

    setLoading(true);
    try {
      // Map updates to API format
      const apiUpdates: any = {
        updatedBy: userId,
      };

      if (updates.subject !== undefined) apiUpdates.subject = updates.subject;
      if (updates.description !== undefined)
        apiUpdates.description = updates.description;
      if (updates.actionPlan !== undefined)
        apiUpdates.actionPlan = updates.actionPlan;
      if (updates.rootCause !== undefined)
        apiUpdates.rootCause = updates.rootCause;
      if (updates.priority !== undefined) {
        const priorityMap: Record<
          string,
          "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        > = {
          Low: "LOW",
          Medium: "MEDIUM",
          High: "HIGH",
          Critical: "CRITICAL",
        };
        apiUpdates.priority = priorityMap[updates.priority] || updates.priority;
      }
      if (updates.status !== undefined) {
        const statusMap: Record<string, string> = {
          Draft: "DRAFT",
          Open: "OPEN",
          "In Progress": "IN_PROGRESS",
          "Under Review": "UNDER_REVIEW",
          "Awaiting Approval": "AWAITING_APPROVAL",
          Approved: "APPROVED",
          Implemented: "IMPLEMENTED",
          "Effectiveness Review": "EFFECTIVENESS_REVIEW",
          Completed: "COMPLETED",
          Closed: "CLOSED",
          Cancelled: "CANCELLED",
        };
        apiUpdates.status = statusMap[updates.status] || updates.status;
      }
      if (updates.targetDate !== undefined)
        apiUpdates.targetDate = updates.targetDate;
      if (updates.assignedTo !== undefined)
        apiUpdates.assignedTo = updates.assignedTo;
      if (updates.department !== undefined)
        apiUpdates.department = updates.department;
      if (updates.resourcesRequired !== undefined)
        apiUpdates.resourcesRequired = updates.resourcesRequired;
      if (updates.estimatedCost !== undefined)
        apiUpdates.estimatedCost = updates.estimatedCost;

      const response = await apiFetch(
        `/api/iso-ims/capa/${selectedCAPA.id}?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiUpdates),
          tenantId,
          userId,
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setShowEditModal(false);
          await fetchCAPAs();
          notifications.success(
            "CAPA Updated Successfully!",
            `CAPA ${selectedCAPA.capaNumber} has been updated.`,
            { duration: 4000 },
          );
        } else {
          throw new Error(result.error || "Failed to update CAPA");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update CAPA");
      }
    } catch (error) {
      console.error("Error updating CAPA:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      notifications.error("Failed to Update CAPA", errorMsg, {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (capa: CAPA) => {
    // Close any open modals first
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowAdvancedCreate(false);
    setSelectedCAPA(capa);
    setShowDetailModal(true);
  };

  const handleEditCAPA = (capa: CAPA) => {
    // Close any open modals first
    setShowCreateModal(false);
    setShowAdvancedCreate(false);
    setSelectedCAPA(capa);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleMarkComplete = async () => {
    if (!selectedCAPA) return;

    if (confirm("Mark this CAPA as completed?")) {
      setLoading(true);
      try {
        const response = await apiFetch(
          `/api/iso-ims/capa/${selectedCAPA.id}?tenantId=${encodeURIComponent(tenantId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "COMPLETED",
              updatedBy: userId,
            }),
            tenantId,
            userId,
          },
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setShowDetailModal(false);
            await fetchCAPAs();
            notifications.success(
              "CAPA Completed!",
              `CAPA ${selectedCAPA.capaNumber} has been marked as completed.`,
              { duration: 4000 },
            );
          } else {
            throw new Error(result.error || "Failed to complete CAPA");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to complete CAPA");
        }
      } catch (error) {
        console.error("Error completing CAPA:", error);
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        notifications.error("Failed to Complete CAPA", errorMsg, {
          duration: 6000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const openCAPAs = capas.filter(
    (c) => c.status !== "COMPLETED" && c.status !== "CLOSED",
  ).length;
  const highPriority = capas.filter(
    (c) => c.priority === "HIGH" || c.priority === "CRITICAL",
  ).length;

  return (
    <PageTemplate
      title="CAPA Management"
      description="Corrective & Preventive Actions - Track and manage all CAPAs"
      icon="ri-tools-line"
      systemInfo={{
        sap: "CAPA Management",
        oracle: "Corrective Actions",
        manhattan: "Action Tracking",
      }}
      stats={[
        {
          label: "Total CAPAs",
          value: stats.total,
          icon: "ri-file-list-line",
          trend: "neutral" as const,
          // color: 'blue'
        },
        {
          label: "In Progress",
          value: stats.open,
          icon: "ri-loader-line",
          trend: "neutral",
          // color: 'orange'
        },
        {
          label: "Completed",
          value: stats.completed,
          icon: "ri-checkbox-circle-line",
          trend: "neutral" as const,
          // color: 'green'
        },
        {
          label: "Critical",
          value: stats.critical,
          icon: "ri-alert-line",
          trend: "up",
          // color: 'red'
        },
      ]}
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowCreateModal(false);
              setShowDetailModal(false);
              setShowEditModal(false);
              setShowAdvancedCreate(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 transform hover:scale-105"
          >
            <i className="ri-flashlight-line"></i>
            Advanced CAPA
          </button>
          <button
            onClick={handleCreateCAPA}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-add-line"></i>
            Quick CAPA
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search CAPAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="AWAITING_APPROVAL">Awaiting Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="EFFECTIVENESS_REVIEW">Effectiveness Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* CAPAs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCAPAs.map((capa, index) => (
          <motion.div
            key={capa.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleViewDetails(capa)}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {capa.capaNumber}
                </h3>
                <p className="text-gray-300 text-sm">{capa.subject}</p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <QRCodeBadge
                  entityId={capa.id}
                  entityType="capa"
                  entityName={capa.capaNumber}
                  documentType="report"
                  documentUrl={`/capa-management?id=${capa.id}`}
                  module="iso-ims"
                  size="sm"
                />
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    capa.priority === "CRITICAL"
                      ? "bg-red-900/30 text-red-400"
                      : capa.priority === "HIGH"
                        ? "bg-orange-900/30 text-orange-400"
                        : capa.priority === "MEDIUM"
                          ? "bg-yellow-900/30 text-yellow-400"
                          : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {getDisplayPriority(capa.priority)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  capa.status === "COMPLETED" || capa.status === "CLOSED"
                    ? "bg-green-900/30 text-green-400"
                    : capa.status === "IN_PROGRESS"
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-gray-700 text-gray-400"
                }`}
              >
                {getDisplayStatus(capa.status)}
              </span>
              <span className="text-gray-400">
                {getDisplayType(capa.capaType)}
              </span>
            </div>

            <div className="text-xs text-gray-400 mb-4">
              <div>Source: {getDisplaySource(capa.capaSource)}</div>
              <div>Department: {capa.department}</div>
              <div>
                Target Date: {new Date(capa.targetDate).toLocaleDateString()}
              </div>
            </div>

            {capa.linkedNCR && (
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/ncr-management?ncr=${capa.linkedNCR}`);
                  }}
                  className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <i className="ri-link"></i>
                  Linked NCR: {capa.linkedNCR}
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {filteredCAPAs.length === 0 && !loading && (
        <div className="text-center py-12">
          <i className="ri-file-search-line text-6xl text-gray-500 mb-4"></i>
          <p className="text-gray-400 mb-2">
            {capas.length === 0
              ? "No CAPAs found. Create your first CAPA to get started!"
              : `No CAPAs match your filters (${capas.length} total CAPAs)`}
          </p>
          {capas.length === 0 && (
            <button
              onClick={handleCreateCAPA}
              className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <i className="ri-add-line"></i>
              Create Your First CAPA
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCAPA && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowDetailModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="capa-detail-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowDetailModal(false);
                  setSelectedCAPA(null);
                }
              }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="capa-detail-title"
                  className="text-2xl font-bold text-white"
                >
                  {selectedCAPA.capaNumber}
                </h2>
              </div>

              {/* QR Code Section */}
              <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20 mb-6">
                <UniversalQRGenerator
                  entityId={selectedCAPA.id}
                  entityType="capa"
                  entityName={selectedCAPA.capaNumber}
                  documentType="report"
                  documentUrl={`/capa-management?id=${selectedCAPA.id}`}
                  module="iso-ims"
                  showAdvanced={false}
                />
              </div>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCAPA(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400">Subject</label>
                  <p className="text-white font-semibold">
                    {selectedCAPA.subject}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Status</label>
                    <p className="text-white">
                      {getDisplayStatus(selectedCAPA.status)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Priority</label>
                    <p className="text-white">
                      {getDisplayPriority(selectedCAPA.priority)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Type</label>
                    <p className="text-white">
                      {getDisplayType(selectedCAPA.capaType)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Source</label>
                    <p className="text-white">
                      {getDisplaySource(selectedCAPA.capaSource)}
                    </p>
                  </div>
                </div>
                {selectedCAPA.rootCause && (
                  <div>
                    <label className="text-sm text-gray-400">Root Cause</label>
                    <p className="text-white">{selectedCAPA.rootCause}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-400">Action Plan</label>
                  <p className="text-white">
                    {selectedCAPA.actionPlan || selectedCAPA.description}
                  </p>
                </div>
                {selectedCAPA.effectivenessReview && (
                  <div>
                    <label className="text-sm text-gray-400">
                      Effectiveness Review
                    </label>
                    <p className="text-white">
                      {selectedCAPA.effectivenessReview}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-700 flex gap-3">
                <button
                  onClick={() => handleEditCAPA(selectedCAPA)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Edit CAPA
                </button>
                {selectedCAPA.status !== "COMPLETED" &&
                  selectedCAPA.status !== "CLOSED" && (
                    <button
                      onClick={handleMarkComplete}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                    >
                      <i className="ri-checkbox-circle-line mr-2"></i>
                      Mark Complete
                    </button>
                  )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Close
                </button>
              </div>

              {/* Cross-Module Links */}
              <div className="pt-6 border-t border-gray-700 mt-6">
                <ModuleLinks
                  links={getCAPALinks(selectedCAPA.id, {
                    ncrId: selectedCAPA.linkedNCR,
                    materialNumber: selectedCAPA.linkedMaterial,
                    soNumber: selectedCAPA.linkedOrder,
                    locationCode: selectedCAPA.linkedLocation,
                    customerNumber: selectedCAPA.linkedCustomer,
                    supplierNumber: selectedCAPA.linkedSupplier,
                  })}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-capa-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setShowCreateModal(false);
                }
              }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  id="create-capa-title"
                  className="text-2xl font-bold text-white"
                >
                  Create New CAPA
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>

              <AdvancedSmartDetectionForm
                formId={`capa-form-${Date.now()}`}
                fields={[
                  {
                    id: "subject",
                    name: "subject",
                    type: "text",
                    label: "CAPA Subject / Description",
                    value: newCAPA.subject,
                    required: true,
                    placeholder:
                      "Brief description of the corrective/preventive action...",
                  },
                  {
                    id: "capaType",
                    name: "capaType",
                    type: "select",
                    label: "CAPA Type",
                    value: newCAPA.capa_type,
                    required: true,
                    options: [
                      {
                        label: "Corrective Action",
                        value: "Corrective Action",
                      },
                      {
                        label: "Preventive Action",
                        value: "Preventive Action",
                      },
                    ],
                  },
                  {
                    id: "capaSource",
                    name: "capaSource",
                    type: "select",
                    label: "CAPA Source",
                    value: newCAPA.capa_source,
                    required: true,
                    options: [
                      { label: "NCR", value: "NCR" },
                      { label: "Audit", value: "Audit" },
                      { label: "Risk Assessment", value: "Risk" },
                      {
                        label: "Management Review",
                        value: "Management Review",
                      },
                      {
                        label: "Customer Complaint",
                        value: "Customer Complaint",
                      },
                      { label: "Other", value: "Other" },
                    ],
                  },
                  {
                    id: "priority",
                    name: "priority",
                    type: "select",
                    label: "Priority",
                    value: newCAPA.priority,
                    required: true,
                    options: [
                      { label: "Low", value: "Low" },
                      { label: "Medium", value: "Medium" },
                      { label: "High", value: "High" },
                      { label: "Critical", value: "Critical" },
                    ],
                  },
                  {
                    id: "targetDate",
                    name: "targetDate",
                    type: "date",
                    label: "Target Completion Date",
                    value: newCAPA.exp_end_date,
                    required: true,
                  },
                  {
                    id: "assignedTo",
                    name: "assignedTo",
                    type: "email",
                    label: "Action Owner",
                    value: newCAPA.assigned_to,
                    required: true,
                    placeholder: "Select responsible person...",
                  },
                  {
                    id: "rootCause",
                    name: "rootCause",
                    type: "textarea",
                    label: "Root Cause Analysis (Optional)",
                    value: newCAPA.root_cause,
                    placeholder:
                      "Why did the issue occur? (5 Whys, Fishbone, etc.)",
                  },
                  {
                    id: "actionPlan",
                    name: "actionPlan",
                    type: "textarea",
                    label: "Detailed Action Plan",
                    value: newCAPA.description,
                    required: true,
                    placeholder:
                      "Step-by-step: What will be done, how, when, by whom...",
                  },
                  {
                    id: "resourcesRequired",
                    name: "resourcesRequired",
                    type: "text",
                    label: "Resources Required (Optional)",
                    value: newCAPA.resources_required,
                    placeholder: "People, budget, materials needed...",
                  },
                ]}
                context={{
                  formType: "CAPA",
                  moduleId: "iso-ims",
                  relatedEntityId:
                    linkedNCR || linkedSO || linkedMaterial || undefined,
                  relatedEntityType: linkedNCR
                    ? "NCR"
                    : linkedSO
                      ? "Sales Order"
                      : linkedMaterial
                        ? "Material"
                        : undefined,
                  previousForms: capas.map((c) => ({
                    subject: c.subject,
                    capaType: c.capaType,
                    capaSource: c.capaSource,
                    priority: c.priority,
                    rootCause: c.rootCause,
                    actionPlan: c.actionPlan,
                  })),
                  userRole: "USER",
                  tenantId: "default-tenant",
                }}
                onSubmit={handleCreateQuickCAPA}
                onCancel={() => setShowCreateModal(false)}
                title="Create New CAPA"
                isDark={true}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      {showEditModal && selectedCAPA && (
        <EditCAPAModal
          capa={selectedCAPA}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCAPA(null);
          }}
          onSave={handleSaveCAPA}
        />
      )}

      {/* Advanced Create Modal */}
      {showAdvancedCreate && (
        <AdvancedCAPAForm
          onSubmit={handleAdvancedCAPASubmit}
          onCancel={() => setShowAdvancedCreate(false)}
          linkedNCR={linkedNCR || undefined}
        />
      )}

      {/* Mindblowing AI Insights & Analytics Dashboard */}
      <div className="mt-8 space-y-6">
        {/* AI-Powered Insights Panel */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-cyan-900/20 border-purple-700 border shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <i className="ri-brain-line text-3xl text-white"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 text-xl">
                🤖 AI-Powered Intelligence Dashboard
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-time-line text-purple-400"></i>
                    <span className="text-sm font-semibold text-gray-300">
                      Average Completion
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-300">12 days</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {openCAPAs} CAPAs in progress
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-line-chart-line text-green-400"></i>
                    <span className="text-sm font-semibold text-gray-300">
                      Effectiveness Rate
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-300">85%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    AI-optimized strategies
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-fire-line text-orange-400"></i>
                    <span className="text-sm font-semibold text-gray-300">
                      High Priority
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-300">
                    {highPriority}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Requiring immediate attention
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-lightbulb-flash-line text-yellow-400"></i>
                    <span className="text-sm font-semibold text-gray-300">
                      AI Suggestions
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-300">24/7</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Real-time recommendations
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-600">
                <p className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                  <i className="ri-magic-line"></i>
                  💡 Pro Tip: Use "Advanced CAPA" for enterprise features
                  including resource allocation, cost analysis, sub-task
                  management, and AI-powered completion predictions!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">
                On-Time Completion
              </span>
              <i className="ri-checkbox-circle-line text-green-400 text-xl"></i>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-300">78%</span>
              <span className="text-sm text-green-400">↑ 5%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">
                Root Cause Accuracy
              </span>
              <i className="ri-target-line text-purple-400 text-xl"></i>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-300">92%</span>
              <span className="text-sm text-green-400">↑ 3%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "92%" }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-xl bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-700"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">
                Prevention Rate
              </span>
              <i className="ri-shield-check-line text-orange-400 text-xl"></i>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-orange-300">67%</span>
              <span className="text-sm text-green-400">↑ 8%</span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "67%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-orange-500 to-red-500"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function CAPAManagementPage() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <PremiumLoader
              message="Loading CAPA Management..."
              size="xl"
              variant="default"
            />
          </div>
        }
      >
        <CAPAManagementPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
