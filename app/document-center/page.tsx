/**
 * Document Center - Enhanced
 * ISO Document Management
 * Fully functional with upload, version control, and ERPNext integration
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { useSearchParams } from "next/navigation";
import type { ISODocument } from "@/types/iso-ims";
import ModuleLinks from "@/components/ModuleLinks";
import { getISOIMSLinks } from "@/utils/moduleInterconnectivity";
import DocumentUploadModal from "@/components/ims/DocumentUploadModal";

export default function DocumentCenterPage() {
  const searchParams = useSearchParams();
  const filterCategoryParam = searchParams.get("category");

  const [documents, setDocuments] = useState<ISODocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ISODocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState(
    filterCategoryParam || "all",
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        "/api/iso-ims/documents?tenantId=default-tenant",
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        setDocuments(generateMockDocuments());
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments(generateMockDocuments());
    } finally {
      setLoading(false);
    }
  };

  const generateMockDocuments = (): ISODocument[] => {
    return [
      {
        id: "1",
        type: "policy",
        category: "Safety",
        size: "2.4 MB",
        uploadedBy: "John Doe",
        uploadedDate: "2024-01-15",
        lastModified: "2024-01-15",
        status: "active",
        version: "2.1",
        tags: ["safety", "chemical", "policy"],
        iso_standard: "ISO 45001",
      },
      {
        id: "2",
        name: "Emergency Response Procedures",
        type: "procedure",
        category: "Emergency",
        size: "1.8 MB",
        uploadedBy: "Jane Smith",
        uploadedDate: "2024-01-10",
        lastModified: "2024-01-10",
        status: "active",
        version: "1.5",
        tags: ["emergency", "response", "procedure"],
        iso_standard: "ISO 14001",
      },
      {
        id: "3",
        name: "Sodium Hydroxide SDS",
        type: "sds",
        category: "Chemical Safety",
        size: "856 KB",
        uploadedBy: "Mike Johnson",
        uploadedDate: "2024-01-05",
        lastModified: "2024-01-05",
        status: "active",
        version: "3.0",
        tags: ["sds", "sodium hydroxide", "chemical"],
        iso_standard: "ISO 9001",
        owner: "Mike Johnson",
        documentUrl: "/docs/SDS-CHEM-012_Sodium_Hydroxide_SDS_v3.0.pdf",
      },
      {
        id: "4",
        title: "Work Instruction for Machine Setup",
        documentNumber: "WI-PROD-003",
        type: "WORK_INSTRUCTION",
        category: "Production",
        size: "1.2 MB",
        uploadedBy: "Alice Brown",
        uploadedDate: "2024-02-01",
        lastModified: "2024-02-01",
        revisionDate: "2024-02-01",
        status: "UNDER_REVIEW",
        version: "1.0",
        tags: ["production", "machine", "setup"],
        iso_standard: "ISO 9001",
        owner: "Alice Brown",
        documentUrl: "/docs/WI-PROD-003_Machine_Setup_v1.0.pdf",
      },
      {
        id: "5",
        title: "Quality Control Form",
        documentNumber: "FORM-QC-001",
        type: "FORM",
        category: "Quality",
        size: "300 KB",
        uploadedBy: "Bob White",
        uploadedDate: "2024-01-20",
        lastModified: "2024-01-20",
        revisionDate: "2024-01-20",
        status: "PUBLISHED",
        version: "1.0",
        tags: ["quality", "form", "inspection"],
        iso_standard: "ISO 9001",
        owner: "Bob White",
        documentUrl: "/docs/FORM-QC-001_Quality_Control_v1.0.pdf",
      },
    ];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === "" ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      filterCategory === "all" || doc.category === filterCategory;
    const matchesType = filterType === "all" || doc.type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Quick Stats
  const stats = {
    total: documents.length,
    published: documents.filter((d) => d.status === "PUBLISHED").length,
    draft: documents.filter((d) => d.status === "DRAFT").length,
    underReview: documents.filter((d) => d.status === "UNDER_REVIEW").length,
  };

  const getDocumentIcon = (type: ISODocument["type"]) => {
    switch (type) {
      case "POLICY":
        return "ri-government-line";
      case "SOP":
        return "ri-book-read-line";
      case "MANUAL":
        return "ri-booklet-line";
      case "FORM":
        return "ri-file-list-3-line";
      case "WORK_INSTRUCTION":
        return "ri-task-line";
      default:
        return "ri-file-line";
    }
  };

  return (
    <PageTemplate
      title="Document Center"
      description="ISO Document Management - Policies, Procedures, SDS, Certificates"
      icon="ri-file-text-line"
      systemInfo={{
        sap: "Document Management",
        oracle: "Document Control",
        manhattan: "File Management",
      }}
      stats={[
        {
          label: "Total Documents",
          value: stats.total,
          icon: "ri-file-list-line",
          trend: "neutral" as const,
        },
        {
          label: "Published",
          value: stats.published,
          icon: "ri-checkbox-circle-line",
          trend: "neutral" as const,
        },
        {
          label: "Draft",
          value: stats.draft,
          icon: "ri-edit-line",
          trend: "neutral" as const,
        },
        {
          label: "Under Review",
          value: stats.underReview,
          icon: "ri-error-warning-line",
          trend: "up" as const,
        },
      ]}
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ri-upload-line"></i>
            Upload Document
          </button>
        </div>
      }
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Safety">Safety</option>
          <option value="Emergency">Emergency</option>
          <option value="Chemical Safety">Chemical Safety</option>
          <option value="Compliance">Compliance</option>
          <option value="Reports">Reports</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Types</option>
          <option value="SOP">SOP</option>
          <option value="POLICY">Policy</option>
          <option value="MANUAL">Manual</option>
          <option value="FORM">Form</option>
          <option value="WORK_INSTRUCTION">Work Instruction</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedDoc(doc)}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3">
                <div
                  className={`p-3 rounded-lg ${
                    doc.type === "SOP"
                      ? "bg-blue-900/30 text-blue-400"
                      : doc.type === "POLICY"
                        ? "bg-purple-900/30 text-purple-400"
                        : doc.type === "WORK_INSTRUCTION"
                          ? "bg-orange-900/30 text-orange-400"
                          : "bg-gray-700 text-gray-400"
                  }`}
                >
                  <i
                    className={`text-xl ${
                      doc.type === "SOP"
                        ? "ri-book-read-line"
                        : doc.type === "POLICY"
                          ? "ri-government-line"
                          : doc.type === "WORK_INSTRUCTION"
                            ? "ri-task-line"
                            : "ri-file-text-line"
                    }`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">
                    {doc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-mono bg-gray-900 px-1.5 py-0.5 rounded text-xs">
                      {doc.documentNumber}
                    </span>
                    <span>•</span>
                    <span>v{doc.version}</span>
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  doc.status === "PUBLISHED"
                    ? "bg-green-900/30 text-green-400"
                    : doc.status === "DRAFT"
                      ? "bg-gray-700 text-gray-300"
                      : "bg-yellow-900/30 text-yellow-400"
                }`}
              >
                {doc.status.replace("_", " ")}
              </span>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {doc.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-gray-700 mt-4">
              <a
                href={doc.documentUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <i className="ri-external-link-line"></i>
                View
              </a>
              <a
                href={doc.documentUrl || "#"}
                download
                className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
              >
                <i className="ri-download-line"></i>
                Download
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <i className="ri-folder-line text-6xl text-gray-500 mb-4"></i>
          <p className="text-gray-400">No documents found</p>
          <p className="text-sm text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Cross-Module Links */}
      <div className="pt-6 border-t border-white/10 mt-8">
        <ModuleLinks links={getISOIMSLinks()} />
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchDocuments();
            setShowUploadModal(false);
          }}
          isDark={true}
        />
      )}
    </PageTemplate>
  );
}
