"use client";

/**
 * Comprehensive Asset Detail Form
 *
 * Full-featured asset creation/editing form with:
 * - All asset fields
 * - Ownership tracking
 * - Maintenance responsibility
 * - Warehouse/location integration
 * - CAPA/work order linking
 * - Specifications
 * - Documentation upload
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RiSaveLine,
  RiCloseLine,
  RiBuildingLine,
  RiMapPinLine,
  RiLinksLine,
  RiFileListLine,
  RiSettingsLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiUserLine,
  RiHomeLine,
  RiStoreLine,
  RiAddLine,
  RiDeleteBinLine,
} from "react-icons/ri";

interface AssetDetailFormProps {
  asset?: any;
  onSave: (asset: any) => void;
  onCancel: () => void;
}

export default function AssetDetailForm({
  asset,
  onSave,
  onCancel,
}: AssetDetailFormProps) {
  const [formData, setFormData] = useState<any>({
    name: asset?.name || "",
    code: asset?.code || "",
    type: asset?.type || "equipment",
    category: asset?.category || "",
    manufacturer: asset?.manufacturer || "",
    model: asset?.model || "",
    serialNumber: asset?.serialNumber || "",
    status: asset?.status || "operational",
    criticality: asset?.criticality || "medium",

    // Location
    facilityId: asset?.location?.facilityId || "",
    building: asset?.location?.building || "",
    floor: asset?.location?.floor || "",
    room: asset?.location?.room || "",
    warehouseId: asset?.location?.warehouseId || "",
    warehouseLocationCode: asset?.location?.warehouseLocationCode || "",
    warehouseZoneId: asset?.location?.warehouseZoneId || "",

    // Ownership
    ownershipType: asset?.ownership?.ownershipType || "owned",
    ownerName: asset?.ownership?.ownerName || "",
    ownerEmail: asset?.ownership?.ownerContact?.email || "",
    ownerPhone: asset?.ownership?.ownerContact?.phone || "",
    maintenanceResponsibility:
      asset?.ownership?.maintenanceResponsibility || "owner",
    maintenanceOwner: asset?.ownership?.maintenanceOwner || "",
    maintenanceNotes: asset?.ownership?.maintenanceNotes || "",

    // Financial
    acquisitionCost: asset?.financial?.acquisitionCost || "",
    currentValue: asset?.financial?.currentValue || "",
    depreciationMethod: asset?.financial?.depreciationMethod || "straight-line",

    // Maintenance
    lastMaintenanceDate: asset?.maintenance?.lastMaintenanceDate || "",
    nextMaintenanceDate: asset?.maintenance?.nextMaintenanceDate || "",
    maintenanceFrequency: asset?.maintenance?.maintenanceFrequency || "",

    // Links
    capaIds: asset?.relationships?.capaIds || [],
    workOrderIds: asset?.relationships?.workOrderIds || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetData = {
      ...formData,
      location: {
        facilityId: formData.facilityId,
        building: formData.building,
        floor: formData.floor,
        room: formData.room,
        warehouseId: formData.warehouseId,
        warehouseLocationCode: formData.warehouseLocationCode,
        warehouseZoneId: formData.warehouseZoneId,
      },
      ownership: {
        ownershipType: formData.ownershipType,
        ownerName: formData.ownerName,
        ownerContact: {
          email: formData.ownerEmail,
          phone: formData.ownerPhone,
        },
        maintenanceResponsibility: formData.maintenanceResponsibility,
        maintenanceOwner: formData.maintenanceOwner,
        maintenanceNotes: formData.maintenanceNotes,
      },
      financial: {
        acquisitionCost: parseFloat(formData.acquisitionCost) || 0,
        currentValue: parseFloat(formData.currentValue) || 0,
        depreciationMethod: formData.depreciationMethod,
      },
      maintenance: {
        lastMaintenanceDate: formData.lastMaintenanceDate
          ? new Date(formData.lastMaintenanceDate)
          : undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate
          ? new Date(formData.nextMaintenanceDate)
          : undefined,
        maintenanceFrequency:
          parseInt(formData.maintenanceFrequency) || undefined,
      },
      relationships: {
        capaIds: formData.capaIds,
        workOrderIds: formData.workOrderIds,
      },
    };
    onSave(assetData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asset Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Asset Code
                  </label>
                  <Input
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
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
                    <option value="building-system">Building System</option>
                    <option value="equipment">Equipment</option>
                    <option value="furniture">Furniture</option>
                    <option value="vehicle">Vehicle</option>
                    <option value="it-equipment">IT Equipment</option>
                    <option value="machinery">Machinery</option>
                    <option value="infrastructure">Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="operational">Operational</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out-of-service">Out of Service</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Manufacturer
                  </label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Model
                  </label>
                  <Input
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Serial Number
                  </label>
                  <Input
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Criticality
                  </label>
                  <select
                    value={formData.criticality}
                    onChange={(e) =>
                      setFormData({ ...formData, criticality: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
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
                  <label className="block text-sm font-medium mb-2">
                    Floor
                  </label>
                  <Input
                    value={formData.floor}
                    onChange={(e) =>
                      setFormData({ ...formData, floor: e.target.value })
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
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Zone ID
                    </label>
                    <Input
                      value={formData.warehouseZoneId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseZoneId: e.target.value,
                        })
                      }
                      placeholder="zone-a"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ownership" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RiHomeLine className="h-5 w-5" />
                Ownership & Maintenance Responsibility
              </CardTitle>
              <CardDescription>
                Track asset ownership and who is responsible for maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ownership Type *
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownershipType: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                    required
                  >
                    <option value="owned">Owned</option>
                    <option value="landlord">Landlord Property</option>
                    <option value="leased">Leased</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maintenance Responsibility *
                  </label>
                  <select
                    value={formData.maintenanceResponsibility}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceResponsibility: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                    required
                  >
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                    <option value="shared">Shared</option>
                    <option value="landlord">Landlord</option>
                  </select>
                </div>
                {(formData.ownershipType === "landlord" ||
                  formData.ownershipType === "leased" ||
                  formData.ownershipType === "rented") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Owner Name
                      </label>
                      <Input
                        value={formData.ownerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerName: e.target.value,
                          })
                        }
                        placeholder="Property Owner LLC"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Owner Email
                      </label>
                      <Input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerEmail: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Owner Phone
                      </label>
                      <Input
                        value={formData.ownerPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ownerPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Maintenance Owner
                  </label>
                  <Input
                    value={formData.maintenanceOwner}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceOwner: e.target.value,
                      })
                    }
                    placeholder="Facility Team, Vendor Name, etc."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Maintenance Notes
                  </label>
                  <textarea
                    value={formData.maintenanceNotes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceNotes: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white min-h-[100px]"
                    placeholder="E.g., 'We own and maintain, but the fan is property of the landlord'"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
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
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Acquisition Cost
                  </label>
                  <Input
                    type="number"
                    value={formData.acquisitionCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acquisitionCost: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Value
                  </label>
                  <Input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, currentValue: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Depreciation Method
                  </label>
                  <select
                    value={formData.depreciationMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depreciationMethod: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white"
                  >
                    <option value="straight-line">Straight-Line</option>
                    <option value="declining-balance">Declining Balance</option>
                    <option value="units-of-production">
                      Units of Production
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Maintenance Date
                  </label>
                  <Input
                    type="date"
                    value={formData.lastMaintenanceDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastMaintenanceDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Next Maintenance Date
                  </label>
                  <Input
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nextMaintenanceDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maintenance Frequency (days)
                  </label>
                  <Input
                    type="number"
                    value={formData.maintenanceFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maintenanceFrequency: e.target.value,
                      })
                    }
                    placeholder="30"
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
                Link this asset to CAPA records, Work Orders, and other modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  CAPA IDs
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="capa-001, capa-002"
                    value={formData.capaIds.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capaIds: e.target.value
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <p className="text-xs text-[#6b7280] mt-1">
                  Comma-separated CAPA record IDs
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Work Order IDs
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="wo-001, wo-002"
                    value={formData.workOrderIds.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workOrderIds: e.target.value
                          .split(",")
                          .map((id) => id.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <p className="text-xs text-[#6b7280] mt-1">
                  Comma-separated Work Order IDs
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <RiCloseLine className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          <RiSaveLine className="h-4 w-4 mr-2" />
          Save Asset
        </Button>
      </div>
    </form>
  );
}
