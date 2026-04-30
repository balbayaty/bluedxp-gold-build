"use client";

/**
 * Space Manager Component
 *
 * Comprehensive space management (CAFM) with:
 * - Space allocation
 * - Utilization analytics
 * - Optimization recommendations
 * - Cost allocation
 * - Warehouse zone integration
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiLayoutGridLine,
  RiAddLine,
  RiSearchLine,
  RiBarChartLine,
  RiLightbulbLine,
  RiMoneyDollarCircleLine,
  RiMapPinLine,
  RiStoreLine,
  RiEditLine,
  RiEyeLine,
  RiBuildingLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Space {
  id: string;
  name: string;
  type: string;
  facilityId: string;
  building?: string;
  floor?: string;
  area: number;
  utilization: number;
  capacity: number;
  warehouseId?: string;
  warehouseZoneId?: string;
  allocatedTo?: string;
  costPerSqM?: number;
}

export default function SpaceManager() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const facilityId = "facility-1"; // In real app, get from context/params

        const response = await fetch(
          `/api/facility/spaces?facilityId=${facilityId}&includeUtilization=true`,
        );
        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to component format
          const transformedSpaces = result.data.map((space: any) => ({
            id: space.id,
            name: space.name || space.id,
            type: space.type,
            facilityId: space.facilityId,
            building: space.location?.building,
            floor: space.location?.floor,
            area: space.specifications?.area || 0,
            utilization: space.utilization?.utilizationRate
              ? space.utilization.utilizationRate * 100
              : 0,
            capacity: space.specifications?.capacity || 0,
            warehouseId: space.location?.warehouseId,
            warehouseZoneId: space.location?.warehouseZoneId,
            allocatedTo: space.allocation?.allocatedTo,
            costPerSqM: space.costAllocation?.costPerSquareMeter || 0,
          }));
          setSpaces(transformedSpaces);
        }
      } catch (error) {
        console.error("Error fetching spaces:", error);
        // Keep empty array on error
        setSpaces([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch = space.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || space.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: spaces.length,
    totalArea: spaces.reduce((sum, s) => sum + s.area, 0),
    averageUtilization:
      spaces.reduce((sum, s) => sum + s.utilization, 0) / spaces.length,
    totalCost: spaces.reduce((sum, s) => sum + s.area * (s.costPerSqM || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiLayoutGridLine className="h-8 w-8 text-primary" />
            Space Management
          </h1>
          <p className="text-muted-foreground mt-1">
            CAFM - Space allocation, utilization, and optimization
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Add Space
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalArea.toLocaleString()} m²
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageUtilization.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalCost / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Spaces</TabsTrigger>
          <TabsTrigger value="office">Office</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spaces</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search spaces..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Space Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Area (m²)</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Warehouse Zone</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpaces.map((space) => (
                    <TableRow key={space.id}>
                      <TableCell className="font-medium">
                        {space.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{space.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <RiBuildingLine className="h-3 w-3 text-muted-foreground" />
                          {space.building}{" "}
                          {space.floor ? `Floor ${space.floor}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>{space.area.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                space.utilization > 80
                                  ? "bg-red-500"
                                  : space.utilization > 60
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${space.utilization}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {space.utilization}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {space.warehouseZoneId ? (
                          <div className="flex items-center gap-1">
                            <RiStoreLine className="h-3 w-3 text-[#9ca3af]" />
                            {space.warehouseZoneId}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {space.costPerSqM ? (
                          <span>
                            ${(space.area * space.costPerSqM).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <RiEyeLine className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RiEditLine className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
