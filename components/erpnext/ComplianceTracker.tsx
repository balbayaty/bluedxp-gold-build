/**
 * ERPNext Compliance Tracker Component
 *
 * Material compliance tracking with ERPNext sync
 *
 * Migrated from: flex-vision-erpnext/src/components/ComplianceTracker.tsx
 * Integrated with: Compliance Module, ERPNext Adapter
 */

"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";
import { eventBus } from "@/lib/services/event-store";

interface ComplianceRecord {
  id: string;
  materialId: string;
  material?: {
    materialName: string;
  };
  inspectionType: string;
  status: "Passed" | "Failed" | "Pending";
  complianceScore: number;
  remarks?: string;
  inspector?: string;
  syncedAt?: Date;
  inspectionDate?: Date;
}

interface Material {
  id: string;
  materialName: string;
}

export default function ComplianceTracker() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    materialId: "",
    inspectionType: "Safety Inspection",
    status: "Pending" as "Passed" | "Failed" | "Pending",
    complianceScore: 100,
    remarks: "",
    inspector: "",
  });

  useEffect(() => {
    fetchRecords();
    fetchMaterials();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/erpnext/compliance");
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Failed to fetch compliance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/erpnext/materials");
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/erpnext/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          complianceScore: parseFloat(formData.complianceScore.toString()),
          inspectionDate: new Date(),
        }),
      });

      if (response.ok) {
        await eventBus.publish("erpnext.compliance.record.created", {
          recordId: (await response.json()).record?.id,
          timestamp: new Date(),
        });
        setShowAddForm(false);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error adding record:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncToERPNext = async (recordId: string) => {
    setLoading(true);
    try {
      const record = records.find((r) => r.id === recordId);
      if (!record) return;

      const result = await enhancedERPNextClient.createComplianceRecord({
        material_name: record.material?.materialName || "",
        inspection_type: record.inspectionType,
        status:
          record.status === "Passed"
            ? "Accepted"
            : record.status === "Failed"
              ? "Rejected"
              : "In Process",
        remarks: record.remarks,
        inspector: record.inspector,
        date: record.inspectionDate?.toISOString().split("T")[0],
      });

      await eventBus.publish("erpnext.compliance.synced", {
        recordId,
        erpnextId: result?.data?.name,
        timestamp: new Date(),
      });

      // Update local record
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, syncedAt: new Date() } : r,
        ),
      );
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Passed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "Failed":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Passed: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
      Pending: "bg-yellow-100 text-yellow-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Compliance Records</CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              Add Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">
                  New Compliance Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material *
                    </label>
                    <Select
                      value={formData.materialId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, materialId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.materialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspection Type
                    </label>
                    <Select
                      value={formData.inspectionType}
                      onValueChange={(value) =>
                        setFormData({ ...formData, inspectionType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Safety Inspection">
                          Safety Inspection
                        </SelectItem>
                        <SelectItem value="Quality Check">
                          Quality Check
                        </SelectItem>
                        <SelectItem value="Regulatory Audit">
                          Regulatory Audit
                        </SelectItem>
                        <SelectItem value="Hazalyze Analysis">
                          Hazalyze Analysis
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Passed">Passed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compliance Score (%)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.complianceScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complianceScore: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Inspector
                    </label>
                    <Input
                      type="text"
                      value={formData.inspector}
                      onChange={(e) =>
                        setFormData({ ...formData, inspector: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <Input
                      type="text"
                      value={formData.remarks}
                      onChange={(e) =>
                        setFormData({ ...formData, remarks: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-span-2 flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Adding..." : "Add Record"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {getStatusIcon(record.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {record.material?.materialName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {record.inspectionType}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <Badge className={getStatusBadge(record.status)}>
                            {record.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Score: {record.complianceScore}%
                          </span>
                          {record.inspector && (
                            <span className="text-sm text-gray-500">
                              Inspector: {record.inspector}
                            </span>
                          )}
                        </div>
                        {record.remarks && (
                          <p className="text-sm text-gray-600 mt-2">
                            {record.remarks}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.syncedAt ? (
                        <span className="text-xs text-green-600">Synced</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncToERPNext(record.id)}
                          disabled={loading}
                        >
                          <Upload size={18} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
