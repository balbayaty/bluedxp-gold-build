"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { format } from "date-fns";
import { CADDocumentService } from "@/lib/services/facility/cad/cadDocumentService";
import type { CADDrawing, CADDrawingType } from "@/types/facility";
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

function CADContent() {
  const [drawings, setDrawings] = useState<CADDrawing[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<CADDrawing | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState<"all" | CADDrawingType>("all");
  const [loading, setLoading] = useState(true);
  const cadService = new CADDocumentService();

  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    setLoading(true);
    try {
      const facilityId = "facility-1"; // In real app, get from context/params
      const response = await fetch(
        `/api/facility/cad?facilityId=${facilityId}`,
      );
      const result = await response.json();

      if (result.success && result.data) {
        setDrawings(result.data);
      } else {
        // Fallback to empty array
        setDrawings([]);
      }
    } catch (error) {
      console.error("Error loading CAD drawings:", error);
      // Fallback to empty array on error
      setDrawings([]);
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data function (kept for reference, not used)
  const getMockDrawings = (): CADDrawing[] => [
    {
      id: "1",
      facilityId: "facility-1",
      name: "Floor Plan - Ground Level",
      type: "architectural",
      fileFormat: "dwg",
      fileUrl: "/drawings/floor-plan-ground.dwg",
      fileSize: 5242880,
      version: "2.1",
      revision: "B",
      status: "approved",
      metadata: {
        drawingNumber: "FP-GL-001",
        author: "John Doe",
        software: "AutoCAD 2024",
        creationDate: new Date("2024-01-15"),
        description: "Ground level floor plan",
      },
      linkedAssets: ["asset-1", "asset-2"],
      linkedSpaces: ["space-1"],
      tenantId: "tenant-1",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      createdBy: "user-1",
    },
    {
      id: "2",
      facilityId: "facility-1",
      name: "Electrical Layout",
      type: "electrical",
      fileFormat: "pdf",
      fileUrl: "/drawings/electrical-layout.pdf",
      fileSize: 2097152,
      version: "1.3",
      revision: "C",
      status: "draft",
      metadata: {
        drawingNumber: "EL-001",
        author: "Jane Smith",
        software: "AutoCAD Electrical",
        creationDate: new Date("2024-02-10"),
        description: "Electrical system layout",
      },
      linkedAssets: ["asset-3"],
      linkedSpaces: [],
      tenantId: "tenant-1",
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-15"),
      createdBy: "user-2",
    },
    {
      id: "3",
      facilityId: "facility-1",
      name: "HVAC System Design",
      type: "mechanical",
      fileFormat: "dwg",
      fileUrl: "/drawings/hvac-design.dwg",
      fileSize: 8388608,
      version: "3.0",
      revision: "A",
      status: "approved",
      metadata: {
        drawingNumber: "HVAC-001",
        author: "Mike Johnson",
        software: "AutoCAD MEP",
        creationDate: new Date("2024-03-05"),
        description: "HVAC system design and layout",
      },
      linkedAssets: ["asset-4", "asset-5"],
      linkedSpaces: ["space-2", "space-3"],
      tenantId: "tenant-1",
      createdAt: new Date("2024-03-05"),
      updatedAt: new Date("2024-03-10"),
      createdBy: "user-3",
    },
  ];

  const filteredDrawings =
    filter === "all" ? drawings : drawings.filter((d) => d.type === filter);

  const stats = {
    total: drawings.length,
    approved: drawings.filter((d) => d.status === "approved").length,
    draft: drawings.filter((d) => d.status === "draft").length,
    underReview: drawings.filter((d) => d.status === "review").length,
    totalSize: drawings.reduce((sum, d) => sum + d.fileSize, 0),
  };

  const typeDistribution = Array.from(
    drawings.reduce((acc, d) => {
      acc.set(d.type, (acc.get(d.type) || 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([type, count]) => ({ type: type.replace("-", " "), count }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "under-review":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "archived":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <PageTemplate
        title="CAD & Drawings"
        icon="ri-file-draw-line"
        description="CAD drawing management and version control"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="CAD & Drawings"
      description="Manage AutoCAD drawings, PDFs, technical specifications, and BIM models"
      icon="ri-file-draw-line"
      stats={[
        {
          label: "Total Drawings",
          value: stats.total,
          icon: "ri-file-list-line",
          tooltip: "Total CAD drawings",
        },
        {
          label: "Approved",
          value: stats.approved,
          icon: "ri-checkbox-circle-line",
          tooltip: "Approved drawings",
        },
        {
          label: "Draft",
          value: stats.draft,
          icon: "ri-file-edit-line",
          tooltip: "Draft drawings",
        },
        {
          label: "Total Size",
          value: formatFileSize(stats.totalSize),
          icon: "ri-folder-line",
          tooltip: "Total file size",
        },
      ]}
      actions={
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <i className="ri-upload-line mr-2"></i>
          Upload Drawing
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {(
          [
            "all",
            "architectural",
            "electrical",
            "mechanical",
            "plumbing",
            "structural",
            "fire-safety",
            "other",
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-cyan-500 text-white"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {f === "all"
              ? "All"
              : f.replace("-", " ").charAt(0).toUpperCase() +
                f.replace("-", " ").slice(1)}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="type" stroke="#9ca3af" />
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
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Approved", value: stats.approved, color: "#10b981" },
                  { name: "Draft", value: stats.draft, color: "#f59e0b" },
                  {
                    name: "Under Review",
                    value: stats.underReview,
                    color: "#3b82f6",
                  },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Approved", value: stats.approved, color: "#10b981" },
                  { name: "Draft", value: stats.draft, color: "#f59e0b" },
                  {
                    name: "Under Review",
                    value: stats.underReview,
                    color: "#3b82f6",
                  },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawings Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">CAD Drawings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Drawing Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Version
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredDrawings.map((drawing) => (
                <tr
                  key={drawing.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">
                    {drawing.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {drawing.type.replace("-", " ")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 uppercase">
                    {drawing.fileFormat}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    v{drawing.version} Rev {drawing.revision}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(drawing.status)}`}
                    >
                      {drawing.status
                        .replace("-", " ")
                        .charAt(0)
                        .toUpperCase() +
                        drawing.status.replace("-", " ").slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {formatFileSize(drawing.fileSize)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedDrawing(drawing);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDrawing && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={selectedDrawing.name}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Drawing Number
              </label>
              <p className="text-white font-mono">
                {selectedDrawing.metadata.drawingNumber}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Type</label>
              <p className="text-white">
                {selectedDrawing.type.replace("-", " ")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Format
              </label>
              <p className="text-white uppercase">
                {selectedDrawing.fileFormat}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Version
              </label>
              <p className="text-white">
                v{selectedDrawing.version} Rev {selectedDrawing.revision}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Status
              </label>
              <p className="text-white">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedDrawing.status)}`}
                >
                  {selectedDrawing.status
                    .replace("-", " ")
                    .charAt(0)
                    .toUpperCase() +
                    selectedDrawing.status.replace("-", " ").slice(1)}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Author
              </label>
              <p className="text-white">{selectedDrawing.metadata.author}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Software
              </label>
              <p className="text-white">{selectedDrawing.metadata.software}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Creation Date
              </label>
              <p className="text-white">
                {selectedDrawing.metadata.creationDate
                  ? format(
                      new Date(selectedDrawing.metadata.creationDate),
                      "MMMM dd, yyyy",
                    )
                  : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                File Size
              </label>
              <p className="text-white">
                {formatFileSize(selectedDrawing.fileSize)}
              </p>
            </div>
            {selectedDrawing.metadata.description && (
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <p className="text-white">
                  {selectedDrawing.metadata.description}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-300">
                Linked Assets
              </label>
              <p className="text-white">
                {selectedDrawing.linkedAssets?.length ?? 0} assets
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">
                Linked Spaces
              </label>
              <p className="text-white">
                {selectedDrawing.linkedSpaces?.length ?? 0} spaces
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                View Drawing
              </button>
              <button className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors">
                Download
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload CAD Drawing"
        >
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Upload AutoCAD files (DWG, DXF), PDF drawings, or BIM models.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept=".dwg,.dxf,.pdf,.png,.jpg,.ifc,.rvt,.nwd"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Drawing Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                placeholder="Enter drawing name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="floor-plan">Floor Plan</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="plumbing">Plumbing</option>
                <option value="structural">Structural</option>
                <option value="fire-safety">Fire Safety</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-colors">
                Upload
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </PageTemplate>
  );
}

export default function CADPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="CAD Drawings"
          description="Manage CAD drawings, blueprints, and technical documentation"
          icon="ri-file-line"
        >
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Error Loading CAD Drawings
              </h2>
              <p className="text-gray-500">
                Something went wrong. Please refresh the page.
              </p>
            </div>
          </div>
        </PageTemplate>
      }
    >
      <CADContent />
    </ErrorBoundary>
  );
}
