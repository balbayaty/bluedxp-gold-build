"use client";

/**
 * Comprehensive Asset Detail View
 *
 * Complete asset information display with:
 * - All asset details
 * - Ownership information
 * - Maintenance history
 * - Linked records (CAPA, Work Orders)
 * - Warehouse location
 * - Financial information
 * - Documentation
 * - Relationships
 */

import { useState, useEffect } from "react";
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
  RiToolsLine,
  RiEditLine,
  RiCloseLine,
  RiBuildingLine,
  RiMapPinLine,
  RiLinksLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiUserLine,
  RiHomeLine,
  RiStoreLine,
  RiHistoryLine,
  RiFileTextLine,
  RiImageLine,
  RiCalendarLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiHammerLine,
  RiCloseCircleLine,
  RiTimeLine,
  RiDownloadLine,
  RiUploadLine,
} from "react-icons/ri";
import AssetMaintenanceHistory from "./AssetMaintenanceHistory";
import AssetDocumentationManager from "./AssetDocumentationManager";
import AssetQRCodeGenerator from "./AssetQRCodeGenerator";
import AssetSpecificationsManager from "./AssetSpecificationsManager";

// Linked CAPAs Component
function LinkedCAPAs({ capaIds }: { capaIds: string[] }) {
  const [capas, setCapas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCAPAs = async () => {
      try {
        const response = await fetch(
          `/api/facility/cross-module-data?type=capa&ids=${capaIds.join(",")}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCapas(result.data || []);
          }
        }
      } catch (error) {
        console.error("Error fetching CAPAs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (capaIds.length > 0) {
      fetchCAPAs();
    }
  }, [capaIds]);

  if (loading) {
    return (
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-2">
          <RiShieldCheckLine className="h-4 w-4" />
          Linked CAPA Records ({capaIds.length})
        </label>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <RiShieldCheckLine className="h-4 w-4" />
        Linked CAPA Records ({capas.length || capaIds.length})
      </label>
      <div className="flex flex-wrap gap-2">
        {capas.length > 0
          ? capas.map((capa: any) => (
              <Badge
                key={capa.id}
                variant="warning"
                className="cursor-pointer hover:bg-orange-600"
              >
                {capa.name || capa.id}: {capa.subject || "CAPA"}
              </Badge>
            ))
          : capaIds.map((capaId: string) => (
              <Badge
                key={capaId}
                variant="warning"
                className="cursor-pointer hover:bg-orange-600"
              >
                {capaId}
              </Badge>
            ))}
      </div>
    </div>
  );
}

// Linked Work Orders Component
function LinkedWorkOrders({ workOrderIds }: { workOrderIds: string[] }) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkOrders = async () => {
      try {
        const response = await fetch(
          `/api/facility/cross-module-data?type=workorder&ids=${workOrderIds.join(",")}`,
        );
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setWorkOrders(result.data || []);
          }
        }
      } catch (error) {
        console.error("Error fetching Work Orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (workOrderIds.length > 0) {
      fetchWorkOrders();
    }
  }, [workOrderIds]);

  if (loading) {
    return (
      <div>
        <label className="text-sm font-medium mb-2 flex items-center gap-2">
          <RiFileListLine className="h-4 w-4" />
          Linked Work Orders ({workOrderIds.length})
        </label>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <RiFileListLine className="h-4 w-4" />
        Linked Work Orders ({workOrders.length || workOrderIds.length})
      </label>
      <div className="flex flex-wrap gap-2">
        {workOrders.length > 0
          ? workOrders.map((wo: any) => (
              <Badge
                key={wo.id}
                variant="info"
                className="cursor-pointer hover:bg-cyan-600"
              >
                {wo.id}: {wo.title || "Work Order"}
              </Badge>
            ))
          : workOrderIds.map((woId: string) => (
              <Badge
                key={woId}
                variant="info"
                className="cursor-pointer hover:bg-cyan-600"
              >
                {woId}
              </Badge>
            ))}
      </div>
    </div>
  );
}

interface AssetDetailViewProps {
  asset: any;
  onEdit: () => void;
  onClose: () => void;
}

export default function AssetDetailView({
  asset,
  onEdit,
  onClose,
}: AssetDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusBadge = (status: string) => {
    const variants = {
      operational: {
        variant: "success" as const,
        icon: RiCheckboxCircleLine,
        label: "Operational",
      },
      maintenance: {
        variant: "warning" as const,
        icon: RiHammerLine,
        label: "Maintenance",
      },
      "out-of-service": {
        variant: "error" as const,
        icon: RiCloseCircleLine,
        label: "Out of Service",
      },
      retired: {
        variant: "default" as const,
        icon: RiTimeLine,
        label: "Retired",
      },
    };
    const config =
      variants[status as keyof typeof variants] || variants.operational;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getOwnershipBadge = (ownershipType: string) => {
    const colors = {
      owned: "bg-green-500/10 text-green-400 border-green-500/30",
      landlord: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      leased: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      rented: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    };
    return (
      <Badge
        variant="default"
        className={colors[ownershipType as keyof typeof colors] || ""}
      >
        {ownershipType.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <RiToolsLine className="h-6 w-6 text-primary" />
                {asset.name}
              </CardTitle>
              <CardDescription className="mt-2">
                Asset Code: {asset.code} | Serial: {asset.serialNumber || "N/A"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <RiEditLine className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <RiCloseLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ownership">Ownership</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="documentation">Documents</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Asset Name
                      </label>
                      <p className="font-medium">{asset.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Asset Code
                      </label>
                      <p className="font-mono">{asset.code}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Type
                      </label>
                      <p>
                        <Badge variant="default">{asset.type}</Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Status
                      </label>
                      <p>{getStatusBadge(asset.status)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Criticality
                      </label>
                      <p>
                        <Badge
                          variant={
                            asset.criticality === "critical"
                              ? "error"
                              : asset.criticality === "high"
                                ? "warning"
                                : "success"
                          }
                        >
                          {asset.criticality.toUpperCase()}
                        </Badge>
                      </p>
                    </div>
                    {asset.manufacturer && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Manufacturer
                        </label>
                        <p className="font-medium">{asset.manufacturer}</p>
                      </div>
                    )}
                    {asset.model && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Model
                        </label>
                        <p className="font-medium">{asset.model}</p>
                      </div>
                    )}
                    {asset.serialNumber && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Serial Number
                        </label>
                        <p className="font-mono">{asset.serialNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Current Value
                      </label>
                      <p className="text-2xl font-bold">
                        ${(asset.currentValue / 1000).toFixed(0)}K
                      </p>
                    </div>
                    {asset.nextMaintenance && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Next Maintenance
                        </label>
                        <div className="flex items-center gap-2">
                          {new Date(asset.nextMaintenance) < new Date() ? (
                            <RiAlertLine className="h-4 w-4 text-red-600" />
                          ) : (
                            <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                          )}
                          <p
                            className={
                              new Date(asset.nextMaintenance) < new Date()
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {new Date(
                              asset.nextMaintenance,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {asset.ownership && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Ownership
                        </label>
                        <p>
                          {getOwnershipBadge(asset.ownership.ownershipType)}
                        </p>
                      </div>
                    )}
                    {asset.ownership && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Maintenance Responsibility
                        </label>
                        <p>
                          <Badge variant="info">
                            {asset.ownership.maintenanceResponsibility}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ownership" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiHomeLine className="h-5 w-5" />
                    Ownership & Maintenance Responsibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Ownership Type
                      </label>
                      <p className="mt-1">
                        {getOwnershipBadge(
                          asset.ownership?.ownershipType || "owned",
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Maintenance Responsibility
                      </label>
                      <p className="mt-1">
                        <Badge variant="info">
                          {asset.ownership?.maintenanceResponsibility ||
                            "owner"}
                        </Badge>
                      </p>
                    </div>
                    {asset.ownership?.ownerName && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Owner Name
                        </label>
                        <p className="font-medium">
                          {asset.ownership.ownerName}
                        </p>
                      </div>
                    )}
                    {asset.ownership?.ownerContact?.email && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Owner Email
                        </label>
                        <p>{asset.ownership.ownerContact.email}</p>
                      </div>
                    )}
                    {asset.ownership?.ownerContact?.phone && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Owner Phone
                        </label>
                        <p>{asset.ownership.ownerContact.phone}</p>
                      </div>
                    )}
                    {asset.ownership?.maintenanceOwner && (
                      <div className="col-span-2">
                        <label className="text-sm text-muted-foreground">
                          Maintenance Owner
                        </label>
                        <p className="font-medium">
                          {asset.ownership.maintenanceOwner}
                        </p>
                      </div>
                    )}
                    {asset.ownership?.maintenanceNotes && (
                      <div className="col-span-2">
                        <label className="text-sm text-muted-foreground">
                          Maintenance Notes
                        </label>
                        <p className="mt-1 p-3 bg-white/5 rounded-lg">
                          {asset.ownership.maintenanceNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiMapPinLine className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {asset.location?.building && (
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-1">
                          <RiBuildingLine className="h-4 w-4" />
                          Building
                        </label>
                        <p className="font-medium">{asset.location.building}</p>
                      </div>
                    )}
                    {asset.location?.floor && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Floor
                        </label>
                        <p className="font-medium">{asset.location.floor}</p>
                      </div>
                    )}
                    {asset.location?.room && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Room
                        </label>
                        <p className="font-medium">{asset.location.room}</p>
                      </div>
                    )}
                  </div>

                  {(asset.location?.warehouseId ||
                    asset.location?.warehouseLocationCode ||
                    asset.location?.warehouseZoneId) && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <RiStoreLine className="h-4 w-4" />
                        Warehouse Integration
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {asset.location?.warehouseId && (
                          <div>
                            <label className="text-sm text-muted-foreground">
                              Warehouse ID
                            </label>
                            <p className="font-mono">
                              {asset.location.warehouseId}
                            </p>
                          </div>
                        )}
                        {asset.location?.warehouseLocationCode && (
                          <div>
                            <label className="text-sm text-muted-foreground">
                              Location Code
                            </label>
                            <p className="font-mono">
                              {asset.location.warehouseLocationCode}
                            </p>
                          </div>
                        )}
                        {asset.location?.warehouseZoneId && (
                          <div>
                            <label className="text-sm text-muted-foreground">
                              Zone ID
                            </label>
                            <p className="font-mono">
                              {asset.location.warehouseZoneId}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="space-y-4">
              <AssetSpecificationsManager
                assetId={asset.id}
                assetName={asset.name}
                specifications={asset.specifications || {}}
                onUpdate={(specs) => {
                  console.log("Updating specifications:", specs);
                  // Handle update
                }}
              />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiHammerLine className="h-5 w-5" />
                    Maintenance Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {asset.lastMaintenanceDate && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Last Maintenance
                        </label>
                        <p>
                          {new Date(
                            asset.lastMaintenanceDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {asset.nextMaintenanceDate && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Next Maintenance
                        </label>
                        <div className="flex items-center gap-2">
                          {new Date(asset.nextMaintenanceDate) < new Date() ? (
                            <RiAlertLine className="h-4 w-4 text-red-600" />
                          ) : null}
                          <p
                            className={
                              new Date(asset.nextMaintenanceDate) < new Date()
                                ? "text-red-600 font-semibold"
                                : ""
                            }
                          >
                            {new Date(
                              asset.nextMaintenanceDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    {asset.maintenanceFrequency && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Maintenance Frequency
                        </label>
                        <p>{asset.maintenanceFrequency} days</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <AssetMaintenanceHistory
                assetId={asset.id}
                assetName={asset.name}
                records={asset.maintenance?.maintenanceHistory || []}
              />
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="h-5 w-5" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {asset.acquisitionCost && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Acquisition Cost
                        </label>
                        <p className="text-xl font-bold">
                          ${asset.acquisitionCost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {asset.currentValue && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Current Value
                        </label>
                        <p className="text-xl font-bold">
                          ${asset.currentValue.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {asset.depreciationMethod && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Depreciation Method
                        </label>
                        <p>{asset.depreciationMethod}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentation" className="space-y-4">
              <AssetDocumentationManager
                assetId={asset.id}
                assetName={asset.name}
                documents={
                  asset.documentation
                    ? [
                        ...(asset.documentation.manuals?.map(
                          (url: string, idx: number) => ({
                            id: `manual-${idx}`,
                            name: `Manual ${idx + 1}`,
                            type: "manual" as const,
                            fileType: "PDF",
                            size: 0,
                            uploadedDate: new Date(),
                            uploadedBy: "System",
                            url,
                          }),
                        ) || []),
                        ...(asset.documentation.drawings?.map(
                          (url: string, idx: number) => ({
                            id: `drawing-${idx}`,
                            name: `Drawing ${idx + 1}`,
                            type: "drawing" as const,
                            fileType: "DWG",
                            size: 0,
                            uploadedDate: new Date(),
                            uploadedBy: "System",
                            url,
                          }),
                        ) || []),
                        ...(asset.documentation.certificates?.map(
                          (url: string, idx: number) => ({
                            id: `cert-${idx}`,
                            name: `Certificate ${idx + 1}`,
                            type: "certificate" as const,
                            fileType: "PDF",
                            size: 0,
                            uploadedDate: new Date(),
                            uploadedBy: "System",
                            url,
                          }),
                        ) || []),
                      ]
                    : []
                }
              />
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <AssetQRCodeGenerator
                assetId={asset.id}
                assetName={asset.name}
                assetCode={asset.code}
              />
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiLinksLine className="h-5 w-5" />
                    Module Links & Relationships
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {asset.capaIds && asset.capaIds.length > 0 && (
                    <LinkedCAPAs capaIds={asset.capaIds} />
                  )}

                  {asset.workOrderIds && asset.workOrderIds.length > 0 && (
                    <LinkedWorkOrders workOrderIds={asset.workOrderIds} />
                  )}

                  {(!asset.capaIds || asset.capaIds.length === 0) &&
                    (!asset.workOrderIds ||
                      asset.workOrderIds.length === 0) && (
                      <p className="text-muted-foreground">No linked records</p>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
