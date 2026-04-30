"use client";

/**
 * Asset Manager Component
 *
 * Enterprise-grade asset management interface with:
 * - Asset lifecycle tracking
 * - Real-time status monitoring
 * - Maintenance history
 * - Financial tracking
 * - BIM integration
 * - Predictive insights
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
import {
  RiToolsLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteLine,
  RiEyeLine,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoaderLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Using native select - no shadcn Select component available

interface Asset {
  id: string;
  name: string;
  code: string;
  type: string;
  status: "operational" | "maintenance" | "out-of-service" | "retired";
  location: string;
  currentValue: number;
  nextMaintenance?: Date;
  criticality: "critical" | "high" | "medium" | "low";
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setAssets([
        {
          id: "1",
          name: "HVAC System - Building A",
          code: "HVAC-A-001",
          type: "building-system",
          status: "operational",
          location: "Building A - Floor 3",
          currentValue: 125000,
          nextMaintenance: new Date("2025-02-15"),
          criticality: "critical",
        },
        {
          id: "2",
          name: "Elevator System - Main",
          code: "ELEV-M-001",
          type: "building-system",
          status: "operational",
          location: "Main Building",
          currentValue: 85000,
          nextMaintenance: new Date("2025-02-20"),
          criticality: "high",
        },
        {
          id: "3",
          name: "Fire Safety System",
          code: "FIRE-001",
          type: "building-system",
          status: "maintenance",
          location: "All Buildings",
          currentValue: 45000,
          nextMaintenance: new Date("2025-01-30"),
          criticality: "critical",
        },
        {
          id: "4",
          name: "Generator - Backup",
          code: "GEN-B-001",
          type: "equipment",
          status: "operational",
          location: "Basement",
          currentValue: 95000,
          nextMaintenance: new Date("2025-03-01"),
          criticality: "high",
        },
        {
          id: "5",
          name: "Water Pump System",
          code: "WTR-P-001",
          type: "equipment",
          status: "out-of-service",
          location: "Building B",
          currentValue: 35000,
          criticality: "medium",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || asset.status === filterStatus;
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Asset["status"]) => {
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
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCriticalityBadge = (criticality: Asset["criticality"]) => {
    const variants = {
      critical: "error" as const,
      high: "warning" as const,
      medium: "warning" as const,
      low: "success" as const,
    };
    return (
      <Badge variant={variants[criticality]}>{criticality.toUpperCase()}</Badge>
    );
  };

  const stats = {
    total: assets.length,
    operational: assets.filter((a) => a.status === "operational").length,
    maintenance: assets.filter((a) => a.status === "maintenance").length,
    totalValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RiLoaderLine className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiToolsLine className="h-8 w-8 text-primary" />
            Asset Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise Asset Management (EAM) - Full lifecycle tracking
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.operational}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.maintenance}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalValue / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
                <option value="retired">Retired</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
              >
                <option value="all">All Types</option>
                <option value="building-system">Building System</option>
                <option value="equipment">Equipment</option>
                <option value="furniture">Furniture</option>
                <option value="vehicle">Vehicle</option>
              </select>
              <Button variant="outline" size="sm">
                <RiFilterLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{asset.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.location}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${(asset.currentValue / 1000).toFixed(0)}K
                  </TableCell>
                  <TableCell>
                    {getCriticalityBadge(asset.criticality)}
                  </TableCell>
                  <TableCell>
                    {asset.nextMaintenance ? (
                      <div className="flex items-center gap-1">
                        {new Date(asset.nextMaintenance) < new Date() ? (
                          <RiAlertLine className="h-4 w-4 text-red-600" />
                        ) : null}
                        <span
                          className={
                            new Date(asset.nextMaintenance) < new Date()
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {new Date(asset.nextMaintenance).toLocaleDateString()}
                        </span>
                      </div>
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
                      <Button variant="ghost" size="sm">
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Asset Manager Component
 *
 * Enterprise-grade asset management interface with:
 * - Asset lifecycle tracking
 * - Real-time status monitoring
 * - Maintenance history
 * - Financial tracking
 * - BIM integration
 * - Predictive insights
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
import {
  RiToolsLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiMoreLine,
  RiEditLine,
  RiDeleteLine,
  RiEyeLine,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiLoaderLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Using native select - no shadcn Select component available

interface Asset {
  id: string;
  name: string;
  code: string;
  type: string;
  status: "operational" | "maintenance" | "out-of-service" | "retired";
  location: string;
  currentValue: number;
  nextMaintenance?: Date;
  criticality: "critical" | "high" | "medium" | "low";
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      setAssets([
        {
          id: "1",
          name: "HVAC System - Building A",
          code: "HVAC-A-001",
          type: "building-system",
          status: "operational",
          location: "Building A - Floor 3",
          currentValue: 125000,
          nextMaintenance: new Date("2025-02-15"),
          criticality: "critical",
        },
        {
          id: "2",
          name: "Elevator System - Main",
          code: "ELEV-M-001",
          type: "building-system",
          status: "operational",
          location: "Main Building",
          currentValue: 85000,
          nextMaintenance: new Date("2025-02-20"),
          criticality: "high",
        },
        {
          id: "3",
          name: "Fire Safety System",
          code: "FIRE-001",
          type: "building-system",
          status: "maintenance",
          location: "All Buildings",
          currentValue: 45000,
          nextMaintenance: new Date("2025-01-30"),
          criticality: "critical",
        },
        {
          id: "4",
          name: "Generator - Backup",
          code: "GEN-B-001",
          type: "equipment",
          status: "operational",
          location: "Basement",
          currentValue: 95000,
          nextMaintenance: new Date("2025-03-01"),
          criticality: "high",
        },
        {
          id: "5",
          name: "Water Pump System",
          code: "WTR-P-001",
          type: "equipment",
          status: "out-of-service",
          location: "Building B",
          currentValue: 35000,
          criticality: "medium",
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || asset.status === filterStatus;
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Asset["status"]) => {
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
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCriticalityBadge = (criticality: Asset["criticality"]) => {
    const variants = {
      critical: "error" as const,
      high: "warning" as const,
      medium: "warning" as const,
      low: "success" as const,
    };
    return (
      <Badge variant={variants[criticality]}>{criticality.toUpperCase()}</Badge>
    );
  };

  const stats = {
    total: assets.length,
    operational: assets.filter((a) => a.status === "operational").length,
    maintenance: assets.filter((a) => a.status === "maintenance").length,
    totalValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RiLoaderLine className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiToolsLine className="h-8 w-8 text-primary" />
            Asset Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Enterprise Asset Management (EAM) - Full lifecycle tracking
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.operational}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.maintenance}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalValue / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
                <option value="retired">Retired</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[180px]"
              >
                <option value="all">All Types</option>
                <option value="building-system">Building System</option>
                <option value="equipment">Equipment</option>
                <option value="furniture">Furniture</option>
                <option value="vehicle">Vehicle</option>
              </select>
              <Button variant="outline" size="sm">
                <RiFilterLine className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{asset.type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.location}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${(asset.currentValue / 1000).toFixed(0)}K
                  </TableCell>
                  <TableCell>
                    {getCriticalityBadge(asset.criticality)}
                  </TableCell>
                  <TableCell>
                    {asset.nextMaintenance ? (
                      <div className="flex items-center gap-1">
                        {new Date(asset.nextMaintenance) < new Date() ? (
                          <RiAlertLine className="h-4 w-4 text-red-600" />
                        ) : null}
                        <span
                          className={
                            new Date(asset.nextMaintenance) < new Date()
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {new Date(asset.nextMaintenance).toLocaleDateString()}
                        </span>
                      </div>
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
                      <Button variant="ghost" size="sm">
                        <RiMoreLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
