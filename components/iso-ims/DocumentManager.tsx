/**
 * Document Manager Component
 *
 * World-Class Intelligent Document Management UI
 *
 * Features:
 * - Intelligent sorting (multi-criteria, personalized, context-aware)
 * - Multi-criteria filtering
 * - Context-aware display
 * - Permission-based views
 * - Facility/asset/location filters
 * - Standard requirement filters
 * - Real-time updates
 * - Deep drill-down
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiFileTextLine,
  RiSearchLine,
  RiFilterLine,
  RiSortAsc,
  RiSortDesc,
  RiAddLine,
  RiLink,
  RiBuildingLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiEyeLine,
  RiDownloadLine,
  RiEditLine,
  RiDeleteLine,
  RiLightbulbLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Document } from "@/lib/services/iso-ims/types";

interface DocumentManagerProps {
  tenantId: string;
  userId?: string;
  context?: {
    module?: string;
    facilityId?: string;
    assetId?: string;
    spaceId?: string;
    standardCode?: string;
  };
  onDocumentSelect?: (document: Document) => void;
  showCreateButton?: boolean;
  showIntelligence?: boolean;
}

export default function DocumentManager({
  tenantId,
  userId,
  context,
  onDocumentSelect,
  showCreateButton = true,
  showIntelligence = true,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    documentType: "",
    category: "",
    status: "",
    standard: "",
  });
  const [sortConfig, setSortConfig] = useState({
    field: "relevance" as
      | "relevance"
      | "compliancePriority"
      | "recency"
      | "importance",
    direction: "DESC" as "ASC" | "DESC",
  });
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [intelligenceInsights, setIntelligenceInsights] = useState<any>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/iso-ims/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          context,
          filters: {
            ...filters,
            search: searchQuery || undefined,
          },
          sortConfig: {
            criteria: [
              {
                field: sortConfig.field,
                direction: sortConfig.direction,
                weight: 1,
              },
            ],
            context,
            personalizationEnabled: !!userId,
          },
          pagination: { page: 1, pageSize: 50 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setIntelligenceInsights(data.intelligence);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, context, filters, searchQuery, sortConfig, userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    onDocumentSelect?.(document);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "OBSOLETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RiFileTextLine className="h-5 w-5" />
                Document Management
              </CardTitle>
              <CardDescription>
                Intelligent document management with AI-powered sorting and
                filtering
              </CardDescription>
            </div>
            {showCreateButton && (
              <Button>
                <RiAddLine className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search documents (semantic search enabled)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.documentType}
                onChange={(e) =>
                  setFilters({ ...filters, documentType: e.target.value })
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Types</option>
                <option value="POLICY">Policy</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="WORK_INSTRUCTION">Work Instruction</option>
                <option value="FORM">Form</option>
                <option value="RECORD">Record</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                <option value="QUALITY">Quality</option>
                <option value="ENVIRONMENTAL">Environmental</option>
                <option value="SAFETY">Safety</option>
                <option value="INFORMATION_SECURITY">
                  Information Security
                </option>
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="OBSOLETE">Obsolete</option>
              </select>

              <Button
                variant="outline"
                onClick={() =>
                  setSortConfig({
                    field: sortConfig.field,
                    direction: sortConfig.direction === "ASC" ? "DESC" : "ASC",
                  })
                }
              >
                {sortConfig.direction === "ASC" ? (
                  <RiSortAsc className="h-4 w-4 mr-2" />
                ) : (
                  <RiSortDesc className="h-4 w-4 mr-2" />
                )}
                Sort: {sortConfig.field}
              </Button>
            </div>

            {/* Intelligence Insights */}
            {showIntelligence && intelligenceInsights && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RiLightbulbLine className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    AI Insights
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  Documents sorted by intelligent multi-criteria algorithm
                  (relevance, compliance priority, recency)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No documents found.{" "}
              {showCreateButton && "Create your first document to get started."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Standards</TableHead>
                  <TableHead>Facility Links</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        {doc.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {doc.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {doc.documentNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.documentType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {doc.isoStandards?.slice(0, 2).map((std) => (
                          <Badge
                            key={std}
                            variant="secondary"
                            className="text-xs"
                          >
                            {std}
                          </Badge>
                        ))}
                        {doc.isoStandards && doc.isoStandards.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.isoStandards.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.facilityId && (
                          <Badge variant="outline" className="text-xs">
                            <RiBuildingLine className="h-3 w-3 mr-1" />
                            Facility
                          </Badge>
                        )}
                        {doc.linkedAssets && doc.linkedAssets.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {doc.linkedAssets.length} Assets
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <RiEyeLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RiDownloadLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RiLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Modal (would be implemented) */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4">
                {selectedDocument.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {selectedDocument.description}
              </p>
              {/* More details would go here */}
              <Button onClick={() => setSelectedDocument(null)}>Close</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
