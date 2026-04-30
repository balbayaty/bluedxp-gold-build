/**
 * Multi-Module Document View Widget
 *
 * Reusable component that displays documents in any module
 * - Permission-aware
 * - Context-aware (shows relevant docs)
 * - Intelligent sorting
 * - Drill-down capability
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RiFileTextLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiLink,
} from "react-icons/ri";
import type { Document } from "@/lib/services/iso-ims/types";

interface MultiModuleDocumentViewProps {
  context: {
    module: string;
    facilityId?: string;
    assetId?: string;
    spaceId?: string;
    materialId?: string;
    orderId?: string;
    standardCode?: string;
  };
  tenantId: string;
  userId?: string;
  maxDocuments?: number;
  showTitle?: boolean;
  onDocumentClick?: (document: Document) => void;
}

export default function MultiModuleDocumentView({
  context,
  tenantId,
  userId,
  maxDocuments = 5,
  showTitle = true,
  onDocumentClick,
}: MultiModuleDocumentViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/iso-ims/documents/display", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId,
            userId,
            context,
            pagination: { page: 1, pageSize: maxDocuments },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [tenantId, userId, context, maxDocuments]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RiFileTextLine className="h-5 w-5" />
            Related Documents
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onDocumentClick?.(doc)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{doc.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {doc.documentType}
                  </Badge>
                  <Badge
                    variant={
                      doc.status === "APPROVED" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {doc.status}
                  </Badge>
                  {doc.isoStandards && doc.isoStandards.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {doc.isoStandards[0]}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm">
                  <RiEyeLine className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <RiExternalLinkLine className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {documents.length >= maxDocuments && (
            <Button variant="outline" className="w-full" size="sm">
              View All Documents
              <RiExternalLinkLine className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
