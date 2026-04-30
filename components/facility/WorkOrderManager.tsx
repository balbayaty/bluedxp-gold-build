"use client";

/**
 * Work Order Manager Component
 *
 * Enterprise-grade work order management with:
 * - Request portal
 * - Approval workflows
 * - Assignment & tracking
 * - Mobile-ready interface
 * - Real-time updates
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
  RiFileListLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiUserLine,
  RiCalendarLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WorkOrder {
  id: string;
  title: string;
  type: string;
  status: "requested" | "approved" | "assigned" | "in-progress" | "completed";
  priority: "critical" | "high" | "medium" | "low";
  requestedBy: string;
  assignedTo?: string;
  dueDate?: Date;
  location: string;
}

export default function WorkOrderManager() {
  const [activeTab, setActiveTab] = useState("all");

  const workOrders: WorkOrder[] = [
    {
      id: "WO-001",
      title: "HVAC System Maintenance - Building A",
      type: "maintenance",
      status: "in-progress",
      priority: "high",
      requestedBy: "John Smith",
      assignedTo: "Mike Johnson",
      dueDate: new Date("2025-02-01"),
      location: "Building A - Floor 3",
    },
    {
      id: "WO-002",
      title: "Emergency: Water Leak - Building B",
      type: "repair",
      status: "assigned",
      priority: "critical",
      requestedBy: "Sarah Williams",
      assignedTo: "Tom Brown",
      dueDate: new Date("2025-01-28"),
      location: "Building B - Basement",
    },
    {
      id: "WO-003",
      title: "Lighting Retrofit - Main Lobby",
      type: "installation",
      status: "approved",
      priority: "medium",
      requestedBy: "David Lee",
      location: "Main Building - Lobby",
    },
    {
      id: "WO-004",
      title: "Fire Safety Inspection",
      type: "inspection",
      status: "completed",
      priority: "high",
      requestedBy: "Lisa Chen",
      assignedTo: "Mike Johnson",
      dueDate: new Date("2025-01-25"),
      location: "All Buildings",
    },
  ];

  const filteredOrders = workOrders.filter((wo) => {
    if (activeTab === "all") return true;
    return wo.status === activeTab;
  });

  const stats = {
    total: workOrders.length,
    requested: workOrders.filter((wo) => wo.status === "requested").length,
    inProgress: workOrders.filter((wo) => wo.status === "in-progress").length,
    completed: workOrders.filter((wo) => wo.status === "completed").length,
    overdue: workOrders.filter(
      (wo) => wo.dueDate && new Date(wo.dueDate) < new Date(),
    ).length,
  };

  const getStatusBadge = (status: WorkOrder["status"]) => {
    const configs = {
      requested: { variant: "info" as const, label: "Requested" },
      approved: { variant: "purple" as const, label: "Approved" },
      assigned: { variant: "info" as const, label: "Assigned" },
      "in-progress": { variant: "warning" as const, label: "In Progress" },
      completed: { variant: "success" as const, label: "Completed" },
    };
    const config = configs[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: WorkOrder["priority"]) => {
    const variants = {
      critical: "error" as const,
      high: "warning" as const,
      medium: "warning" as const,
      low: "success" as const,
    };
    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiFileListLine className="h-8 w-8 text-primary" />
            Work Order Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive work order tracking and management
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.requested}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Orders</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search work orders..."
                      className="pl-9 pr-4 py-2 border rounded-md w-64"
                    />
                  </div>
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
                    <TableHead>Work Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono font-semibold">
                        {wo.id}
                      </TableCell>
                      <TableCell className="font-medium">{wo.title}</TableCell>
                      <TableCell>
                        <Badge variant="default">{wo.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RiUserLine className="h-4 w-4 text-muted-foreground" />
                          {wo.requestedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        {wo.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <RiUserLine className="h-4 w-4 text-muted-foreground" />
                            {wo.assignedTo}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.dueDate ? (
                          <div className="flex items-center gap-1">
                            {new Date(wo.dueDate) < new Date() ? (
                              <RiAlertLine className="h-4 w-4 text-red-600" />
                            ) : (
                              <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={
                                new Date(wo.dueDate) < new Date()
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {new Date(wo.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {wo.location}
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
      </Tabs>
    </div>
  );
}

/**
 * Work Order Manager Component
 *
 * Enterprise-grade work order management with:
 * - Request portal
 * - Approval workflows
 * - Assignment & tracking
 * - Mobile-ready interface
 * - Real-time updates
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
  RiFileListLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiAlertLine,
  RiUserLine,
  RiCalendarLine,
} from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WorkOrder {
  id: string;
  title: string;
  type: string;
  status: "requested" | "approved" | "assigned" | "in-progress" | "completed";
  priority: "critical" | "high" | "medium" | "low";
  requestedBy: string;
  assignedTo?: string;
  dueDate?: Date;
  location: string;
}

export default function WorkOrderManager() {
  const [activeTab, setActiveTab] = useState("all");

  const workOrders: WorkOrder[] = [
    {
      id: "WO-001",
      title: "HVAC System Maintenance - Building A",
      type: "maintenance",
      status: "in-progress",
      priority: "high",
      requestedBy: "John Smith",
      assignedTo: "Mike Johnson",
      dueDate: new Date("2025-02-01"),
      location: "Building A - Floor 3",
    },
    {
      id: "WO-002",
      title: "Emergency: Water Leak - Building B",
      type: "repair",
      status: "assigned",
      priority: "critical",
      requestedBy: "Sarah Williams",
      assignedTo: "Tom Brown",
      dueDate: new Date("2025-01-28"),
      location: "Building B - Basement",
    },
    {
      id: "WO-003",
      title: "Lighting Retrofit - Main Lobby",
      type: "installation",
      status: "approved",
      priority: "medium",
      requestedBy: "David Lee",
      location: "Main Building - Lobby",
    },
    {
      id: "WO-004",
      title: "Fire Safety Inspection",
      type: "inspection",
      status: "completed",
      priority: "high",
      requestedBy: "Lisa Chen",
      assignedTo: "Mike Johnson",
      dueDate: new Date("2025-01-25"),
      location: "All Buildings",
    },
  ];

  const filteredOrders = workOrders.filter((wo) => {
    if (activeTab === "all") return true;
    return wo.status === activeTab;
  });

  const stats = {
    total: workOrders.length,
    requested: workOrders.filter((wo) => wo.status === "requested").length,
    inProgress: workOrders.filter((wo) => wo.status === "in-progress").length,
    completed: workOrders.filter((wo) => wo.status === "completed").length,
    overdue: workOrders.filter(
      (wo) => wo.dueDate && new Date(wo.dueDate) < new Date(),
    ).length,
  };

  const getStatusBadge = (status: WorkOrder["status"]) => {
    const configs = {
      requested: { variant: "info" as const, label: "Requested" },
      approved: { variant: "purple" as const, label: "Approved" },
      assigned: { variant: "info" as const, label: "Assigned" },
      "in-progress": { variant: "warning" as const, label: "In Progress" },
      completed: { variant: "success" as const, label: "Completed" },
    };
    const config = configs[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: WorkOrder["priority"]) => {
    const variants = {
      critical: "error" as const,
      high: "warning" as const,
      medium: "warning" as const,
      low: "success" as const,
    };
    return <Badge variant={variants[priority]}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RiFileListLine className="h-8 w-8 text-primary" />
            Work Order Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive work order tracking and management
          </p>
        </div>
        <Button variant="primary" size="lg" className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.requested}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="requested">Requested</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Work Orders</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search work orders..."
                      className="pl-9 pr-4 py-2 border rounded-md w-64"
                    />
                  </div>
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
                    <TableHead>Work Order ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono font-semibold">
                        {wo.id}
                      </TableCell>
                      <TableCell className="font-medium">{wo.title}</TableCell>
                      <TableCell>
                        <Badge variant="default">{wo.type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <RiUserLine className="h-4 w-4 text-muted-foreground" />
                          {wo.requestedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        {wo.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <RiUserLine className="h-4 w-4 text-muted-foreground" />
                            {wo.assignedTo}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.dueDate ? (
                          <div className="flex items-center gap-1">
                            {new Date(wo.dueDate) < new Date() ? (
                              <RiAlertLine className="h-4 w-4 text-red-600" />
                            ) : (
                              <RiCalendarLine className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span
                              className={
                                new Date(wo.dueDate) < new Date()
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {new Date(wo.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {wo.location}
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
      </Tabs>
    </div>
  );
}
