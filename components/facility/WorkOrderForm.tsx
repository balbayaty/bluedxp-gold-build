"use client";

/**
 * Comprehensive Work Order Form
 *
 * Full-featured work order creation/editing with:
 * - All work order fields
 * - Asset linking
 * - CAPA linking
 * - Warehouse location
 * - Cost estimation
 * - Approval workflow
 * - Vendor assignment
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiSaveLine,
  RiCloseLine,
  RiFileListLine,
  RiToolsLine,
  RiMapPinLine,
  RiBuildingLine,
  RiUserLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiLinksLine,
  RiShieldCheckLine,
  RiStoreLine,
  RiFileTextLine,
} from "react-icons/ri";

interface WorkOrderFormProps {
  workOrder?: any;
  onSave: (workOrder: any) => void;
  onCancel: () => void;
}

export default function WorkOrderForm({
  workOrder,
  onSave,
  onCancel,
}: WorkOrderFormProps) {
  const [formData, setFormData] = useState({
    title: workOrder?.title || "",
    type: workOrder?.type || "maintenance",
    priority: workOrder?.priority || "medium",
    description: workOrder?.description || "",
    requestedBy: workOrder?.requestedBy || "",

    // Asset
    assetId: workOrder?.assetId || "",
    assetName: workOrder?.assetName || "",

    // Location
    facilityId: workOrder?.location?.facilityId || "",
    building: workOrder?.location?.building || "",
    room: workOrder?.location?.room || "",
    warehouseId: workOrder?.location?.warehouseId || "",
    warehouseLocationCode: workOrder?.location?.warehouseLocationCode || "",

    // Assignment
    assignedTo: workOrder?.assignedTo || "",
    vendor: workOrder?.vendor || "",

    // Dates
    dueDate: workOrder?.dueDate
      ? new Date(workOrder.dueDate).toISOString().split("T")[0]
      : "",
    scheduledDate: workOrder?.scheduledDate
      ? new Date(workOrder.scheduledDate).toISOString().split("T")[0]
      : "",

    // Costs
    estimatedCost: workOrder?.estimatedCost || "",
    cost: workOrder?.cost || "",

    // Links
    capaId: workOrder?.capaId || "",

    // Additional
    notes: workOrder?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workOrderData = {
      ...formData,
      location: {
        facilityId: formData.facilityId,
        building: formData.building,
        room: formData.room,
        warehouseId: formData.warehouseId,
        warehouseLocationCode: formData.warehouseLocationCode,
      },
      estimatedCost: parseFloat(formData.estimatedCost) || undefined,
      cost: parseFloat(formData.cost) || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      scheduledDate: formData.scheduledDate
        ? new Date(formData.scheduledDate)
        : undefined,
    };
    onSave(workOrderData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="assignment">Assignment</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    placeholder="e.g., HVAC System Maintenance - Building A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                    required
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="installation">Installation</option>
                    <option value="upgrade">Upgrade</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Requested By *
                  </label>
                  <Input
                    value={formData.requestedBy}
                    onChange={(e) =>
                      setFormData({ ...formData, requestedBy: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white min-h-[100px]"
                    required
                    placeholder="Describe the work to be performed..."
                  />
                </div>
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Facility ID
                  </label>
                  <Input
                    value={formData.facilityId}
                    onChange={(e) =>
                      setFormData({ ...formData, facilityId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Building
                  </label>
                  <Input
                    value={formData.building}
                    onChange={(e) =>
                      setFormData({ ...formData, building: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Room</label>
                  <Input
                    value={formData.room}
                    onChange={(e) =>
                      setFormData({ ...formData, room: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <RiStoreLine className="h-4 w-4" />
                  Warehouse Integration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Warehouse ID
                    </label>
                    <Input
                      value={formData.warehouseId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseId: e.target.value,
                        })
                      }
                      placeholder="wh-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location Code
                    </label>
                    <Input
                      value={formData.warehouseLocationCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseLocationCode: e.target.value,
                        })
                      }
                      placeholder="A-01-02-03"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiUserLine className="h-5 w-5" />
                Assignment & Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Assigned To
                  </label>
                  <Input
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    placeholder="Technician name or team"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vendor
                  </label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Scheduled Date
                  </label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scheduledDate: e.target.value,
                      })
                    }
                  />
                </div>
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Cost
                  </label>
                  <Input
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedCost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Actual Cost
                  </label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiLinksLine className="h-5 w-5" />
                Module Links
              </CardTitle>
              <CardDescription>
                Link this work order to assets and CAPA records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Asset ID
                </label>
                <Input
                  value={formData.assetId}
                  onChange={(e) =>
                    setFormData({ ...formData, assetId: e.target.value })
                  }
                  placeholder="asset-001"
                />
                {formData.assetName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.assetName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  CAPA ID
                </label>
                <Input
                  value={formData.capaId}
                  onChange={(e) =>
                    setFormData({ ...formData, capaId: e.target.value })
                  }
                  placeholder="capa-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white min-h-[100px]"
                  placeholder="Additional notes or instructions..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <RiCloseLine className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          <RiSaveLine className="h-4 w-4 mr-2" />
          Save Work Order
        </Button>
      </div>
    </form>
  );
}
