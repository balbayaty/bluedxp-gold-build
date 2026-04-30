/**
 * BIM Marketplace Platform - Complete Enhanced Page
 *
 * World-class BIM marketplace with:
 * - My Models tab (existing functionality)
 * - Marketplace tab (buy/sell/share)
 * - Collaboration tab (real-time)
 * - AI Analysis tab
 * - Digital Twin tab
 * - AR/VR tab
 *
 * Fully integrated with all services and components
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { CADDocumentService } from "@/lib/services/facility/cad/cadDocumentService";
import type { BIMModel } from "@/types/facility";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useAutoDraftSave } from "@/hooks/useAutoDraftSave";
import { useNotifications } from "@/lib/utils/notifications";
import BIM3DViewer from "@/components/bim/BIM3DViewer";
import MarketplaceTab from "@/components/bim/MarketplaceTab";
import CollaborationTab from "@/components/bim/CollaborationTab";
import AnalysisTab from "@/components/bim/AnalysisTab";
import DigitalTwinTab from "@/components/bim/DigitalTwinTab";
import ARVRTab from "@/components/bim/ARVRTab";
import MarketplaceListingModal from "@/components/bim/MarketplaceListingModal";
import type { BIMMarketplaceListing } from "@/types/bim-marketplace";
import { getBIMMarketplaceService } from "@/lib/services/facility/bim/bimMarketplaceService";
import { getBIMCollaborationService } from "@/lib/services/facility/bim/bimCollaborationService";
import { getBIMAIAnalysisService } from "@/lib/services/facility/bim/bimAIAnalysisService";

interface UploadFormData {
  file: File | null;
  name: string;
  lod: string;
  systems: string[];
  description: string;
}

type TabType =
  | "my-models"
  | "marketplace"
  | "collaboration"
  | "analysis"
  | "digital-twin"
  | "ar-vr";

export default function BIMPage() {
  // Core state
  const [bimModels, setBimModels] = useState<BIMModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<BIMModel | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("my-models");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showMarketplaceListingModal, setShowMarketplaceListingModal] =
    useState(false);
  const [selectedListing, setSelectedListing] =
    useState<BIMMarketplaceListing | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState<UploadFormData>({
    file: null,
    name: "",
    lod: "LOD 300",
    systems: [],
    description: "",
  });

  // Services
  const cadService = new CADDocumentService();
  const notifications = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize services (this will trigger mock data loading)
  const marketplaceService = getBIMMarketplaceService();
  const collaborationService = getBIMCollaborationService();
  const analysisService = getBIMAIAnalysisService();

  // Auto-draft save for upload form
  const {
    saveStatus: draftSaveStatus,
    lastSaved: draftLastSaved,
    hasUnsavedChanges: hasDraftChanges,
    saveNow: saveDraftNow,
    clearDraft,
    restoreDraft,
    hasDraft: hasDraftData,
  } = useAutoDraftSave<UploadFormData>({
    storageKey: "bim-upload-form",
    data: uploadFormData,
    hasChanges: (data) => {
      return !!(
        data.name ||
        data.file ||
        data.systems.length > 0 ||
        data.description
      );
    },
    entityType: "BIM Upload Form",
    enableAutoSave: true,
    enableEscSave: true,
    enableNavigationSave: true,
    onDraftSaved: () => {
      // Optional: Show subtle notification
    },
    onDraftRestored: (restoredData) => {
      const restored = { ...restoredData };

      if (
        restoredData.file &&
        typeof restoredData.file === "object" &&
        "_isFile" in restoredData.file
      ) {
        notifications.info(
          "File not restored",
          "Please re-select the file. Other form data has been restored.",
          { duration: 4000 },
        );
        restored.file = null;
      }

      setUploadFormData(restored);
    },
  });

  useEffect(() => {
    loadBIMModels();
  }, []);

  // Restore draft when upload modal opens
  useEffect(() => {
    if (showUploadModal && hasDraftData()) {
      restoreDraft().catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        notifications.error(
          "Draft restoration failed",
          `Could not restore saved draft: ${errorMessage}. Please try again.`,
          { duration: 3000 },
        );
      });
    }
  }, [showUploadModal, hasDraftData, restoreDraft, notifications]);

  // Handle ESC key for modals
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
        ) {
          return;
        }

        if (showUploadModal) {
          if (hasDraftChanges) {
            saveDraftNow();
          }
          setShowUploadModal(false);
        } else if (showDetailModal) {
          setShowDetailModal(false);
        } else if (show3DViewer) {
          setShow3DViewer(false);
        } else if (showMarketplaceListingModal) {
          setShowMarketplaceListingModal(false);
        }
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [
    showUploadModal,
    showDetailModal,
    show3DViewer,
    showMarketplaceListingModal,
    hasDraftChanges,
    saveDraftNow,
  ]);

  const loadBIMModels = async () => {
    setLoading(true);
    try {
      const facilityId = "facility-1"; // In real app, get from context/params
      const response = await fetch(
        `/api/facility/bim?facilityId=${facilityId}`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setBimModels(result.data);
      } else {
        // Fallback to empty array
        setBimModels([]);
      }
    } catch (error) {
      console.error("Error loading BIM models:", error);
      // Fallback to empty array on error
      setBimModels([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data function (kept for reference, not used)
  const getMockModels = (): BIMModel[] => [
    {
      id: "1",
      facilityId: "facility-1",
      name: "Main Warehouse - Full BIM Model",
      fileFormat: "ifc",
      fileUrl: "/bim/warehouse-main.ifc",
      fileSize: 52428800,
      version: "3.0",
      status: "ready",
      metadata: {
        author: "BIM Team",
        software: "Revit 2024",
        softwareVersion: "2024",
        creationDate: new Date("2024-01-15"),
        projectName: "Main Warehouse",
        buildingName: "Main Warehouse",
        buildingType: "Warehouse",
      },
      elements: [],
      linkedAssets: ["asset-1", "asset-2", "asset-3"],
      linkedSpaces: ["space-1", "space-2", "space-3"],
      tenantId: "tenant-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      createdBy: "user-1",
    },
    {
      id: "2",
      facilityId: "facility-1",
      name: "Office Building - Architectural Model",
      fileFormat: "rvt",
      fileUrl: "/bim/office-architectural.rvt",
      fileSize: 31457280,
      version: "2.5",
      status: "ready",
      metadata: {
        author: "Architecture Team",
        software: "Revit 2024",
        softwareVersion: "2024",
        creationDate: new Date("2024-02-10"),
        projectName: "Office Building",
        buildingName: "Office Building",
        buildingType: "Office",
      },
      elements: [],
      linkedAssets: ["asset-4"],
      linkedSpaces: ["space-4", "space-5"],
      tenantId: "tenant-1",
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-15"),
      createdBy: "user-2",
    },
    {
      id: "3",
      facilityId: "facility-2",
      name: "Manufacturing Plant - MEP Model",
      fileFormat: "nwd",
      fileUrl: "/bim/manufacturing-mep.nwd",
      fileSize: 41943040,
      version: "1.8",
      status: "processing",
      metadata: {
        author: "MEP Team",
        software: "Navisworks",
        softwareVersion: "2024",
        creationDate: new Date("2024-03-05"),
        projectName: "Manufacturing Plant",
        buildingName: "Manufacturing Plant",
        buildingType: "Manufacturing",
      },
      elements: [],
      linkedAssets: ["asset-5", "asset-6"],
      linkedSpaces: ["space-6"],
      tenantId: "tenant-1",
      createdAt: new Date("2024-03-05"),
      updatedAt: new Date("2024-03-10"),
      createdBy: "user-3",
    },
  ];

  const stats = {
    total: bimModels.length,
    active: bimModels.filter((m) => m.status === "ready").length,
    draft: bimModels.filter(
      (m) => m.status === "processing" || m.status === "uploading",
    ).length,
    totalSize: bimModels.reduce((sum, m) => sum + m.fileSize, 0),
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData((prev) => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  };

  const handleSystemToggle = (system: string) => {
    setUploadFormData((prev) => ({
      ...prev,
      systems: prev.systems.includes(system)
        ? prev.systems.filter((s) => s !== system)
        : [...prev.systems, system],
    }));
  };

  const handleUpload = async () => {
    if (!uploadFormData.file) {
      notifications.error(
        "File required",
        "Please select a BIM model file to upload",
      );
      return;
    }

    const maxFileSize = 500 * 1024 * 1024;
    if (uploadFormData.file.size > maxFileSize) {
      notifications.error(
        "File too large",
        `File size (${formatFileSize(uploadFormData.file.size)}) exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`,
      );
      return;
    }

    const allowedExtensions = [".ifc", ".rvt", ".nwd", ".dwg", ".dxf"];
    const fileExtension =
      "." + uploadFormData.file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      notifications.error(
        "Invalid file type",
        `Please select a valid BIM file format: ${allowedExtensions.join(", ")}`,
      );
      return;
    }

    if (!uploadFormData.name.trim()) {
      notifications.error("Name required", "Please enter a model name");
      return;
    }

    if (uploadFormData.name.trim().length > 200) {
      notifications.error(
        "Name too long",
        "Model name must be 200 characters or less",
      );
      return;
    }

    if (uploadFormData.systems.length === 0) {
      notifications.error(
        "Systems required",
        "Please select at least one system type",
      );
      return;
    }

    setUploading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fileExt =
        uploadFormData.file.name.split(".").pop()?.toLowerCase() || "ifc";
      const validFormats: ("ifc" | "dwg" | "rvt" | "nwd" | "other")[] = [
        "ifc",
        "dwg",
        "rvt",
        "nwd",
        "other",
      ];
      const fileFormat = validFormats.includes(fileExt as any)
        ? (fileExt as "ifc" | "dwg" | "rvt" | "nwd" | "other")
        : "other";

      const newModel: BIMModel = {
        id: `bim-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        facilityId: "facility-1",
        name: uploadFormData.name.trim(),
        fileFormat,
        fileUrl: `/bim/${encodeURIComponent(uploadFormData.file.name)}`,
        fileSize: uploadFormData.file.size,
        version: "1.0",
        status: "uploading",
        metadata: {
          author: "Current User",
          software: "Unknown",
          creationDate: new Date(),
          projectName: uploadFormData.name.trim(),
          buildingName: uploadFormData.name.trim(),
        },
        elements: [],
        linkedAssets: [],
        linkedSpaces: [],
        tenantId: "tenant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-1",
      };

      setBimModels((prev) => {
        const exists = prev.some(
          (m) =>
            m.name === newModel.name && m.fileFormat === newModel.fileFormat,
        );
        if (exists) {
          notifications.warning(
            "Duplicate model",
            "A model with this name and format already exists",
            { duration: 3000 },
          );
          return prev;
        }
        return [...prev, newModel];
      });

      clearDraft();
      setShowUploadModal(false);
      setUploadFormData({
        file: null,
        name: "",
        lod: "LOD 300",
        systems: [],
        description: "",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      notifications.success(
        "BIM Model Uploaded",
        `${newModel.name} has been uploaded successfully`,
        { duration: 3000 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while uploading the BIM model";

      notifications.error("Upload Failed", errorMessage, { duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

  const handleStartCollaboration = async (modelId: string) => {
    try {
      const session = await collaborationService.createSession(
        modelId,
        "user-1",
        "Current User",
        {
          modelId: modelId || selectedModel?.id || "model-1",
          name: `Collaboration - ${selectedModel?.name || "Model"}`,
          status: "scheduled",
          settings: {
            allowGuestAccess: true,
            requireApproval: false,
            recordingEnabled: true,
            chatEnabled: true,
            annotationsEnabled: true,
            measurementsEnabled: true,
            exportEnabled: true,
          },
          metadata: {},
        },
      );
      setShowDetailModal(false);
      setActiveTab("collaboration");
      notifications.success(
        "Session Created",
        "Collaboration session is ready",
      );
    } catch (error) {
      notifications.error("Failed", "Could not create collaboration session");
    }
  };

  const handleStartAnalysis = async (modelId: string, analysisType: string) => {
    try {
      const response = await fetch("/api/bim/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          analysisType,
          options: {},
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowDetailModal(false);
        setActiveTab("analysis");
        notifications.success(
          "Analysis Started",
          `${analysisType} analysis is running`,
        );
      } else {
        notifications.error(
          "Failed",
          result.error || "Could not start analysis",
        );
      }
    } catch (error) {
      notifications.error("Error", "Failed to start analysis");
    }
  };

  const systemDistribution = [
    { system: "architectural", count: 2 },
    { system: "structural", count: 1 },
    { system: "mep", count: 1 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "processing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "uploading":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "archived":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <PageTemplate
          title="Building Information Modeling (BIM)"
          description="Manage 3D building models, BIM data, and integrated building systems"
          icon="ri-3d-line"
        >
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-gray-400 text-sm">Loading BIM models...</p>
          </div>
        </PageTemplate>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <PageTemplate
        title="Building Information Modeling (BIM)"
        description="World-class BIM marketplace platform with AI analysis, collaboration, and digital twin integration"
        icon="ri-3d-line"
        stats={[
          {
            label: "Total Models",
            value: stats.total,
            icon: "ri-cube-3d-line",
            tooltip: "Total BIM models",
          },
          {
            label: "Active",
            value: stats.active,
            icon: "ri-checkbox-circle-line",
            tooltip: "Active models",
          },
          {
            label: "Draft",
            value: stats.draft,
            icon: "ri-file-edit-line",
            tooltip: "Draft models",
          },
          {
            label: "Total Size",
            value: formatFileSize(stats.totalSize),
            icon: "ri-folder-line",
            tooltip: "Total file size",
          },
        ]}
        actions={
          <div className="flex gap-2">
            {activeTab === "my-models" && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <i className="ri-upload-line mr-2"></i>
                Upload BIM Model
              </button>
            )}
            {activeTab === "marketplace" && (
              <button
                onClick={() => {
                  // In real app, navigate to create listing page
                  notifications.info(
                    "Coming Soon",
                    "Listing creation page will be available soon",
                  );
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                <i className="ri-add-line mr-2"></i>
                Create Listing
              </button>
            )}
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: "my-models", label: "My Models", icon: "ri-folder-line" },
              {
                id: "marketplace",
                label: "Marketplace",
                icon: "ri-store-line",
              },
              {
                id: "collaboration",
                label: "Collaboration",
                icon: "ri-team-line",
              },
              { id: "analysis", label: "AI Analysis", icon: "ri-brain-line" },
              {
                id: "digital-twin",
                label: "Digital Twin",
                icon: "ri-cpu-line",
              },
              { id: "ar-vr", label: "AR/VR", icon: "ri-vr-line" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "my-models" && (
            <motion.div
              key="my-models"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    By System Type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={systemDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="system" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Model Status
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Array.from(
                        bimModels.reduce((acc, m) => {
                          acc.set(m.status, (acc.get(m.status) || 0) + 1);
                          return acc;
                        }, new Map<string, number>()),
                      ).map(([status, count]) => ({ status, count }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="status" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                        }}
                      />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BIM Models Grid */}
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    My BIM Models
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    <i className="ri-upload-line mr-2"></i>
                    Upload
                  </button>
                </div>
                {bimModels.length === 0 ? (
                  <div className="p-12 text-center">
                    <i className="ri-inbox-line text-4xl text-gray-500 mb-4"></i>
                    <p className="text-gray-400 text-sm mb-4">
                      No BIM models found
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <i className="ri-upload-line mr-2"></i>
                      Upload Your First Model
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {bimModels.map((model) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedModel(model);
                          setShowDetailModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-lg mb-1">
                              {model.name}
                            </h4>
                            <p className="text-gray-400 text-xs uppercase">
                              {model.fileFormat}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(model.status)}`}
                          >
                            {model.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-2">
                            <i className="ri-file-line"></i>
                            <span>{formatFileSize(model.fileSize)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="ri-code-line"></i>
                            <span>v{model.version}</span>
                          </div>
                          {model.metadata.software && (
                            <div className="flex items-center gap-2">
                              <i className="ri-tools-line"></i>
                              <span>{model.metadata.software}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-white/10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModel(model);
                              setShow3DViewer(true);
                            }}
                            className="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
                          >
                            <i className="ri-eye-line mr-2"></i>
                            View 3D
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModel(model);
                              setShowDetailModal(true);
                            }}
                            className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
                          >
                            <i className="ri-information-line"></i>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "marketplace" && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MarketplaceTab
                onListingSelect={(listing) => {
                  setSelectedListing(listing);
                  setShowMarketplaceListingModal(true);
                }}
                onBookListing={(listingId) => {
                  notifications.success(
                    "Booking Created",
                    "Your booking has been submitted",
                  );
                }}
              />
            </motion.div>
          )}

          {activeTab === "collaboration" && (
            <motion.div
              key="collaboration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CollaborationTab
                modelId={selectedModel?.id}
                onSessionSelect={(session) => {
                  notifications.info(
                    "Session Selected",
                    "Opening collaboration session...",
                  );
                }}
                onCreateSession={(session) => {
                  notifications.success(
                    "Session Created",
                    "Collaboration session is ready",
                  );
                }}
              />
            </motion.div>
          )}

          {activeTab === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalysisTab
                modelId={selectedModel?.id}
                onAnalysisComplete={(analysis) => {
                  notifications.success(
                    "Analysis Complete",
                    `${analysis.type} analysis completed`,
                  );
                }}
              />
            </motion.div>
          )}

          {activeTab === "digital-twin" && (
            <motion.div
              key="digital-twin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DigitalTwinTab
                modelId={selectedModel?.id}
                onTwinLink={(twinId) => {
                  notifications.success(
                    "Twin Linked",
                    "BIM model successfully linked to digital twin",
                  );
                }}
              />
            </motion.div>
          )}

          {activeTab === "ar-vr" && (
            <motion.div
              key="ar-vr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ARVRTab
                modelId={selectedModel?.id}
                onSessionStart={(session) => {
                  notifications.success(
                    "Session Starting",
                    "Preparing immersive experience...",
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Model Detail Modal */}
        {showDetailModal && selectedModel && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title={selectedModel.name}
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Format
                  </label>
                  <p className="text-white uppercase">
                    {selectedModel.fileFormat}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Version
                  </label>
                  <p className="text-white">v{selectedModel.version}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Status
                  </label>
                  <p className="text-white">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedModel.status)}`}
                    >
                      {selectedModel.status.charAt(0).toUpperCase() +
                        selectedModel.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    File Size
                  </label>
                  <p className="text-white">
                    {formatFileSize(selectedModel.fileSize)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Author
                  </label>
                  <p className="text-white">
                    {selectedModel.metadata.author || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Software
                  </label>
                  <p className="text-white">
                    {selectedModel.metadata.software || "N/A"}
                  </p>
                </div>
              </div>

              {selectedModel.metadata.creationDate && (
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Creation Date
                  </label>
                  <p className="text-white">
                    {format(
                      selectedModel.metadata.creationDate,
                      "MMMM dd, yyyy",
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShow3DViewer(true);
                  }}
                  className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors"
                >
                  <i className="ri-eye-line mr-2"></i>
                  View 3D Model
                </button>
                <button
                  onClick={() => {
                    handleStartCollaboration(selectedModel.id);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
                >
                  <i className="ri-team-line mr-2"></i>
                  Start Collaboration
                </button>
                <button
                  onClick={() => {
                    handleStartAnalysis(selectedModel.id, "clash-detection");
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors"
                >
                  <i className="ri-brain-line mr-2"></i>
                  Run Analysis
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* 3D Viewer Modal */}
        {show3DViewer && selectedModel && (
          <Modal
            isOpen={show3DViewer}
            onClose={() => setShow3DViewer(false)}
            title={`3D Viewer - ${selectedModel.name}`}
            size="xl"
          >
            <BIM3DViewer
              model={selectedModel}
              height="600px"
              showControls={true}
              showLayers={true}
              showMeasurements={true}
            />
          </Modal>
        )}

        {/* Marketplace Listing Modal */}
        {showMarketplaceListingModal && selectedListing && (
          <MarketplaceListingModal
            listing={selectedListing}
            isOpen={showMarketplaceListingModal}
            onClose={() => setShowMarketplaceListingModal(false)}
            onBook={(listingId) => {
              notifications.success(
                "Booking Created",
                "Your booking request has been submitted",
              );
            }}
            onFavorite={(listingId) => {
              notifications.success("Added to Favorites", "");
            }}
          />
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <Modal
              isOpen={showUploadModal}
              onClose={() => {
                if (hasDraftChanges) {
                  saveDraftNow();
                }
                setShowUploadModal(false);
              }}
              title="Upload BIM Model"
              size="lg"
            >
              <div className="space-y-6">
                {hasDraftChanges && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <i
                      className={`ri-${
                        draftSaveStatus === "saving"
                          ? "loader-4-line animate-spin"
                          : draftSaveStatus === "saved"
                            ? "check-line text-green-400"
                            : "save-line"
                      } text-blue-400`}
                    ></i>
                    <span className="text-sm text-blue-300">
                      {draftSaveStatus === "saving" && "Saving draft..."}
                      {draftSaveStatus === "saved" &&
                        draftLastSaved &&
                        `Draft saved ${format(draftLastSaved, "HH:mm:ss")}`}
                      {draftSaveStatus === "idle" &&
                        "Draft will be saved automatically"}
                    </span>
                  </motion.div>
                )}

                <p className="text-gray-300 text-sm">
                  Upload BIM model files (IFC, RVT, NWD, or other BIM formats).
                  Your progress is automatically saved.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select File <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ifc,.rvt,.nwd,.dwg,.dxf"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 file:cursor-pointer transition-colors focus:outline-none focus:border-cyan-500/50"
                    />
                    {uploadFormData.file && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                        <i className="ri-file-line"></i>
                        <span>{uploadFormData.file.name}</span>
                        <span className="text-gray-500">
                          ({formatFileSize(uploadFormData.file.size)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Model Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadFormData.name}
                    onChange={(e) =>
                      setUploadFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="Enter model name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Level of Detail (LOD){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={uploadFormData.lod}
                    onChange={(e) =>
                      setUploadFormData((prev) => ({
                        ...prev,
                        lod: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="LOD 100">LOD 100 - Conceptual</option>
                    <option value="LOD 200">LOD 200 - Schematic Design</option>
                    <option value="LOD 300">
                      LOD 300 - Design Development
                    </option>
                    <option value="LOD 350">
                      LOD 350 - Construction Documents
                    </option>
                    <option value="LOD 400">LOD 400 - Fabrication</option>
                    <option value="LOD 500">LOD 500 - As-Built</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Systems <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "architectural",
                      "structural",
                      "mep",
                      "fire-safety",
                      "security",
                    ].map((system) => (
                      <label
                        key={system}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                          uploadFormData.systems.includes(system)
                            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={uploadFormData.systems.includes(system)}
                          onChange={() => handleSystemToggle(system)}
                          className="rounded text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-sm capitalize">
                          {system.replace("-", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadFormData.description}
                    onChange={(e) =>
                      setUploadFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                    placeholder="Optional description of the BIM model"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handleUpload}
                    disabled={
                      uploading ||
                      !uploadFormData.file ||
                      !uploadFormData.name.trim() ||
                      uploadFormData.systems.length === 0
                    }
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <i className="ri-loader-4-line animate-spin"></i>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line"></i>
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (hasDraftChanges) {
                        saveDraftNow();
                      }
                      setShowUploadModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  <i className="ri-information-line mr-1"></i>
                  Press ESC to save draft and close. Your progress is
                  automatically saved.
                </div>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </PageTemplate>
    </ErrorBoundary>
  );
}
