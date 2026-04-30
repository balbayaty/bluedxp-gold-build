"use client";

/**
 * Warehouse Integration Panel
 *
 * Shows intelligent integration between Facility Management and Warehouse Management:
 * - Facility ↔ Warehouse mappings
 * - Asset ↔ Location mappings
 * - Space ↔ Zone mappings
 * - Maintenance impact on warehouse operations
 * - Work order warehouse operations
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
  RiStoreLine,
  RiMapPinLine,
  RiLinksLine,
  RiToolsLine,
  RiFileListLine,
  RiLayoutGridLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiAddLine,
  RiSearchLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WarehouseMapping {
  facilityId: string;
  facilityName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  mappingType: string;
  isPrimary: boolean;
}

interface AssetLocationMapping {
  assetId: string;
  assetName: string;
  locationCode?: string;
  zoneName?: string;
  warehouseName?: string;
}

export default function WarehouseIntegrationPanel({
  facilityId,
}: {
  facilityId: string;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [warehouseMappings, setWarehouseMappings] = useState<
    WarehouseMapping[]
  >([]);
  const [assetMappings, setAssetMappings] = useState<AssetLocationMapping[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real implementation, fetch from warehouseIntegrationService
    setTimeout(() => {
      setWarehouseMappings([
        {
          facilityId: "facility-1",
          facilityName: "Main Distribution Center",
          warehouseId: "wh-001",
          warehouseName: "Warehouse A",
          warehouseCode: "WH-A",
          mappingType: "one-to-one",
          isPrimary: true,
        },
        {
          facilityId: "facility-1",
          facilityName: "Main Distribution Center",
          warehouseId: "wh-002",
          warehouseName: "Warehouse B",
          warehouseCode: "WH-B",
          mappingType: "one-to-many",
          isPrimary: false,
        },
      ]);
      setAssetMappings([
        {
          assetId: "asset-1",
          assetName: "HVAC System - Building A",
          locationCode: "A-01-02-03",
          zoneName: "Zone A",
          warehouseName: "Warehouse A",
        },
        {
          assetId: "asset-2",
          assetName: "Elevator System - Main",
          locationCode: "B-05-01-01",
          zoneName: "Zone B",
          warehouseName: "Warehouse A",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [facilityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading warehouse integration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <RiLinksLine className="h-6 w-6 text-primary" />
            Warehouse Integration
          </h2>
          <p className="text-muted-foreground mt-1">
            Intelligent integration between Facility Management and Warehouse
            Management
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Create Mapping
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="assets">Assets & Locations</TabsTrigger>
          <TabsTrigger value="spaces">Spaces & Zones</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Linked Warehouses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {warehouseMappings.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active mappings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Mapped Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetMappings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  With location data
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Zones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mapped zones
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operational Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Low</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current status
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Real-time synchronization status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RiCheckboxCircleLine className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Warehouse Mappings</p>
                      <p className="text-sm text-muted-foreground">
                        Synchronized in real-time
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RiCheckboxCircleLine className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Asset Locations</p>
                      <p className="text-sm text-muted-foreground">
                        Auto-synced with WMS
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RiCheckboxCircleLine className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Space Zones</p>
                      <p className="text-sm text-muted-foreground">
                        Bidirectional sync
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Facility ↔ Warehouse Mappings</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search warehouses..."
                      className="pl-9 pr-4 py-2 border rounded-md w-64 bg-white/5 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Mapping Type</TableHead>
                    <TableHead>Primary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseMappings.map((mapping) => (
                    <TableRow
                      key={`${mapping.facilityId}-${mapping.warehouseId}`}
                    >
                      <TableCell className="font-medium">
                        {mapping.facilityName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RiStoreLine className="h-4 w-4 text-[#9ca3af]" />
                          {mapping.warehouseName}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {mapping.warehouseCode}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{mapping.mappingType}</Badge>
                      </TableCell>
                      <TableCell>
                        {mapping.isPrimary ? (
                          <Badge variant="success">Primary</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Asset ↔ Location Mappings</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search assets..."
                      className="pl-9 pr-4 py-2 border rounded-md w-64 bg-white/5 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Location Code</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetMappings.map((mapping) => (
                    <TableRow key={mapping.assetId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <RiToolsLine className="h-4 w-4 text-muted-foreground" />
                          {mapping.assetName}
                        </div>
                      </TableCell>
                      <TableCell>{mapping.warehouseName}</TableCell>
                      <TableCell className="font-mono">
                        {mapping.locationCode || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {mapping.zoneName || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spaces">
          <Card>
            <CardHeader>
              <CardTitle>Space ↔ Zone Mappings</CardTitle>
              <CardDescription>
                Facility spaces mapped to warehouse zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Space zone mappings will appear here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Impact on Warehouse Operations</CardTitle>
              <CardDescription>
                Maintenance tasks affecting warehouse locations and zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Maintenance impact analysis will appear here...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
