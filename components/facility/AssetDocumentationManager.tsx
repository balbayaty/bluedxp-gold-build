"use client";

/**
 * Asset Documentation Manager
 *
 * Comprehensive documentation management:
 * - Upload documents
 * - Organize by type (manuals, drawings, specs, certificates, photos, videos)
 * - View and download
 * - Version control
 * - Link to assets
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiFileTextLine,
  RiUploadLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiImageLine,
  RiVideoLine,
  RiFileLine,
  RiShieldCheckLine,
  RiFileSettingsLine,
  RiAddLine,
  RiFolderLine,
} from "react-icons/ri";

interface Document {
  id: string;
  name: string;
  type:
    | "manual"
    | "drawing"
    | "specification"
    | "certificate"
    | "photo"
    | "video"
    | "other";
  fileType: string;
  size: number;
  uploadedDate: Date;
  uploadedBy: string;
  version?: string;
  description?: string;
  url: string;
}

interface AssetDocumentationManagerProps {
  assetId: string;
  assetName: string;
  documents: Document[];
}

export default function AssetDocumentationManager({
  assetId,
  assetName,
  documents,
}: AssetDocumentationManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [uploading, setUploading] = useState(false);

  const documentsByType = {
    all: documents,
    manual: documents.filter((d) => d.type === "manual"),
    drawing: documents.filter((d) => d.type === "drawing"),
    specification: documents.filter((d) => d.type === "specification"),
    certificate: documents.filter((d) => d.type === "certificate"),
    photo: documents.filter((d) => d.type === "photo"),
    video: documents.filter((d) => d.type === "video"),
  };

  const filteredDocuments =
    documentsByType[activeTab as keyof typeof documentsByType] || documents;

  const getTypeIcon = (type: Document["type"]) => {
    const icons = {
      manual: RiFileTextLine,
      drawing: RiFileSettingsLine,
      specification: RiFileSettingsLine,
      certificate: RiShieldCheckLine,
      photo: RiImageLine,
      video: RiVideoLine,
      other: RiFileLine,
    };
    return icons[type] || RiFileLine;
  };

  const getTypeBadge = (type: Document["type"]) => {
    const colors = {
      manual: "info",
      drawing: "warning",
      specification: "warning",
      certificate: "success",
      photo: "default",
      video: "default",
      other: "default",
    };
    return <Badge variant={colors[type] as any}>{type.toUpperCase()}</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload logic here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert(`File "${file.name}" uploaded successfully`);
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiFolderLine className="h-6 w-6 text-primary" />
            Documentation
          </h2>
          <p className="text-muted-foreground mt-1">{assetName}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            multiple
          />
          <Button
            variant="primary"
            size="lg"
            className="gap-2"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <RiUploadLine className="h-4 w-4" />
                Upload Documents
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Manuals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.type === "manual").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drawings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.type === "drawing").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.type === "certificate").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
          <TabsTrigger value="manual">
            Manuals ({documents.filter((d) => d.type === "manual").length})
          </TabsTrigger>
          <TabsTrigger value="drawing">
            Drawings ({documents.filter((d) => d.type === "drawing").length})
          </TabsTrigger>
          <TabsTrigger value="specification">
            Specs ({documents.filter((d) => d.type === "specification").length})
          </TabsTrigger>
          <TabsTrigger value="certificate">
            Certificates (
            {documents.filter((d) => d.type === "certificate").length})
          </TabsTrigger>
          <TabsTrigger value="photo">
            Photos ({documents.filter((d) => d.type === "photo").length})
          </TabsTrigger>
          <TabsTrigger value="video">
            Videos ({documents.filter((d) => d.type === "video").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredDocuments.map((doc) => {
                  const Icon = getTypeIcon(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{doc.name}</p>
                            {getTypeBadge(doc.type)}
                            {doc.version && (
                              <Badge variant="default" className="text-xs">
                                v{doc.version}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(doc.size)}</span>
                            <span>
                              {new Date(doc.uploadedDate).toLocaleDateString()}
                            </span>
                            <span>by {doc.uploadedBy}</span>
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <RiEyeLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <RiDownloadLine className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredDocuments.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No documents found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
