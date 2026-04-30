"use client";

/**
 * Comprehensive Work Order Detail View
 *
 * Full work order information with:
 * - Complete details
 * - Approval workflow
 * - Asset information
 * - Cost tracking
 * - Timeline
 * - Attachments
 * - Notes and comments
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
  RiEditLine,
  RiCloseLine,
  RiUserLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
  RiMapPinLine,
  RiBuildingLine,
  RiCheckDoubleLine,
  RiPlayLine,
  RiPauseLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiLinksLine,
  RiShieldCheckLine,
  RiFileTextLine,
  RiTimeLine,
} from "react-icons/ri";

interface WorkOrderDetailViewProps {
  workOrder: any;
  onEdit: () => void;
  onClose: () => void;
  onApprove?: () => void;
  onAssign?: () => void;
  onComplete?: () => void;
}

export default function WorkOrderDetailView({
  workOrder,
  onEdit,
  onClose,
  onApprove,
  onAssign,
  onComplete,
}: WorkOrderDetailViewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusBadge = (status: string) => {
    const configs = {
      requested: {
        variant: "info" as const,
        label: "Requested",
        icon: RiTimeLine,
      },
      approved: {
        variant: "success" as const,
        label: "Approved",
        icon: RiCheckDoubleLine,
      },
      assigned: {
        variant: "info" as const,
        label: "Assigned",
        icon: RiUserLine,
      },
      "in-progress": {
        variant: "warning" as const,
        label: "In Progress",
        icon: RiPlayLine,
      },
      "on-hold": {
        variant: "default" as const,
        label: "On Hold",
        icon: RiPauseLine,
      },
      completed: {
        variant: "success" as const,
        label: "Completed",
        icon: RiCheckboxCircleLine,
      },
      cancelled: {
        variant: "error" as const,
        label: "Cancelled",
        icon: RiAlertLine,
      },
    };
    const config = configs[status as keyof typeof configs] || configs.requested;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      critical: "error" as const,
      high: "warning" as const,
      medium: "warning" as const,
      low: "success" as const,
    };
    return (
      <Badge variant={variants[priority as keyof typeof variants] || "default"}>
        {priority.toUpperCase()}
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
                <RiFileListLine className="h-6 w-6 text-primary" />
                {workOrder.title}
              </CardTitle>
              <CardDescription className="mt-2">
                Work Order ID: {workOrder.id}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {workOrder.status === "requested" && onApprove && (
                <Button variant="primary" onClick={onApprove}>
                  <RiCheckDoubleLine className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              )}
              {workOrder.status === "approved" && onAssign && (
                <Button variant="primary" onClick={onAssign}>
                  <RiUserLine className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              )}
              {workOrder.status === "in-progress" && onComplete && (
                <Button variant="primary" onClick={onComplete}>
                  <RiCheckboxCircleLine className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Priority</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Status
                      </label>
                      <p className="mt-1">{getStatusBadge(workOrder.status)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Priority
                      </label>
                      <p className="mt-1">
                        {getPriorityBadge(workOrder.priority)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Type
                      </label>
                      <p className="mt-1">
                        <Badge variant="default">
                          {workOrder.type.toUpperCase()}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Requested
                      </label>
                      <p className="font-medium">
                        {new Date(workOrder.requestedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {workOrder.approvedDate && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Approved
                        </label>
                        <p className="font-medium">
                          {new Date(
                            workOrder.approvedDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {workOrder.dueDate && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Due Date
                        </label>
                        <p
                          className={`font-medium ${new Date(workOrder.dueDate) < new Date() && workOrder.status !== "completed" ? "text-red-600" : ""}`}
                        >
                          {new Date(workOrder.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {workOrder.completedDate && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Completed
                        </label>
                        <p className="font-medium">
                          {new Date(
                            workOrder.completedDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">People</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Requested By
                      </label>
                      <p className="font-medium">{workOrder.requestedBy}</p>
                    </div>
                    {workOrder.approvedBy && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Approved By
                        </label>
                        <p className="font-medium">{workOrder.approvedBy}</p>
                      </div>
                    )}
                    {workOrder.assignedTo ? (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Assigned To
                        </label>
                        <p className="font-medium">{workOrder.assignedTo}</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Assigned To
                        </label>
                        <p className="text-muted-foreground">Unassigned</p>
                      </div>
                    )}
                    {workOrder.vendor && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Vendor
                        </label>
                        <p className="font-medium">{workOrder.vendor}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location & Asset</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workOrder.location?.building && (
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-1">
                          <RiBuildingLine className="h-4 w-4" />
                          Building
                        </label>
                        <p className="font-medium">
                          {workOrder.location.building}
                        </p>
                      </div>
                    )}
                    {workOrder.location?.warehouseLocationCode && (
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-1">
                          <RiMapPinLine className="h-4 w-4" />
                          Location Code
                        </label>
                        <p className="font-mono">
                          {workOrder.location.warehouseLocationCode}
                        </p>
                      </div>
                    )}
                    {workOrder.assetName && (
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-1">
                          <RiToolsLine className="h-4 w-4" />
                          Asset
                        </label>
                        <p className="font-medium">{workOrder.assetName}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{workOrder.description}</p>
                </CardContent>
              </Card>

              {workOrder.workPerformed && (
                <Card>
                  <CardHeader>
                    <CardTitle>Work Performed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">
                      {workOrder.workPerformed}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Work Order ID
                      </label>
                      <p className="font-mono">{workOrder.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Type
                      </label>
                      <p>
                        <Badge variant="default">{workOrder.type}</Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Status
                      </label>
                      <p>{getStatusBadge(workOrder.status)}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Priority
                      </label>
                      <p>{getPriorityBadge(workOrder.priority)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="font-medium">Requested</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(workOrder.requestedDate).toLocaleString()}
                        </p>
                        <p className="text-sm">by {workOrder.requestedBy}</p>
                      </div>
                    </div>
                    {workOrder.approvedDate && (
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-medium">Approved</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workOrder.approvedDate).toLocaleString()}
                          </p>
                          <p className="text-sm">by {workOrder.approvedBy}</p>
                        </div>
                      </div>
                    )}
                    {workOrder.assignedTo && (
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2"></div>
                        <div>
                          <p className="font-medium">Assigned</p>
                          <p className="text-sm">to {workOrder.assignedTo}</p>
                        </div>
                      </div>
                    )}
                    {workOrder.completedDate && (
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="font-medium">Completed</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workOrder.completedDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiMoneyDollarCircleLine className="h-5 w-5" />
                    Cost Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {workOrder.estimatedCost && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Estimated Cost
                        </label>
                        <p className="text-2xl font-bold">
                          ${workOrder.estimatedCost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {workOrder.cost && (
                      <div>
                        <label className="text-sm text-muted-foreground">
                          Actual Cost
                        </label>
                        <p className="text-2xl font-bold">
                          ${workOrder.cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RiLinksLine className="h-5 w-5" />
                    Linked Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workOrder.assetId && (
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <RiToolsLine className="h-4 w-4" />
                        Linked Asset
                      </label>
                      <Badge
                        variant="info"
                        className="cursor-pointer hover:bg-cyan-600"
                      >
                        {workOrder.assetName || workOrder.assetId}
                      </Badge>
                    </div>
                  )}
                  {workOrder.capaId && (
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <RiShieldCheckLine className="h-4 w-4" />
                        Linked CAPA
                      </label>
                      <Badge
                        variant="warning"
                        className="cursor-pointer hover:bg-orange-600"
                      >
                        {workOrder.capaId}
                      </Badge>
                    </div>
                  )}
                  {!workOrder.assetId && !workOrder.capaId && (
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
