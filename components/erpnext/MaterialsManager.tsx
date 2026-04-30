/**
 * ERPNext Materials Manager Component
 *
 * Hazardous material management with ERPNext sync
 *
 * Migrated from: flex-vision-erpnext/src/components/MaterialsManager.tsx
 * Integrated with: Chemical Module, ERPNext Adapter
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, RefreshCw } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { enhancedERPNextClient } from "@/lib/adapters/erpnext/enhancedClient";
import { eventBus } from "@/lib/services/event-store";

interface Material {
  id: string;
  materialName: string;
  casNumber?: string;
  unNumber?: string;
  hazardClass?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
  storageLocation?: string;
  syncedAt?: Date;
}

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    materialName: "",
    casNumber: "",
    unNumber: "",
    hazardClass: "",
    quantity: "",
    unit: "Kg",
    supplier: "",
    storageLocation: "",
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/erpnext/materials");
      const data = await response.json();
      setMaterials(data.materials || []);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/erpnext/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await eventBus.publish("erpnext.material.created", {
          materialName: formData.materialName,
          timestamp: new Date(),
        });
        setShowAddForm(false);
        setFormData({
          materialName: "",
          casNumber: "",
          unNumber: "",
          hazardClass: "",
          quantity: "",
          unit: "Kg",
          supplier: "",
          storageLocation: "",
        });
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error adding material:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncToERPNext = async (materialId: string) => {
    setLoading(true);
    try {
      const material = materials.find((m) => m.id === materialId);
      if (!material) return;

      const result = await enhancedERPNextClient.createHazardousMaterial({
        material_name: material.materialName,
        cas_number: material.casNumber,
        un_number: material.unNumber,
        hazard_class: material.hazardClass,
        quantity: material.quantity,
        unit: material.unit,
        supplier: material.supplier,
        storage_location: material.storageLocation,
      });

      await eventBus.publish("erpnext.material.synced", {
        materialId,
        erpnextId: result?.data?.name,
        timestamp: new Date(),
      });

      // Update local material
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === materialId ? { ...m, syncedAt: new Date() } : m,
        ),
      );
    } catch (error) {
      console.error("Failed to sync with ERPNext:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Hazardous Materials</CardTitle>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus size={18} className="mr-2" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Add New Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.materialName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          materialName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAS Number
                    </label>
                    <Input
                      type="text"
                      value={formData.casNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, casNumber: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UN Number
                    </label>
                    <Input
                      type="text"
                      value={formData.unNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, unNumber: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hazard Class
                    </label>
                    <Select
                      value={formData.hazardClass}
                      onValueChange={(value) =>
                        setFormData({ ...formData, hazardClass: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Class 1 - Explosives">
                          Class 1 - Explosives
                        </SelectItem>
                        <SelectItem value="Class 2 - Gases">
                          Class 2 - Gases
                        </SelectItem>
                        <SelectItem value="Class 3 - Flammable Liquids">
                          Class 3 - Flammable Liquids
                        </SelectItem>
                        <SelectItem value="Class 4 - Flammable Solids">
                          Class 4 - Flammable Solids
                        </SelectItem>
                        <SelectItem value="Class 5 - Oxidizing">
                          Class 5 - Oxidizing
                        </SelectItem>
                        <SelectItem value="Class 6 - Toxic">
                          Class 6 - Toxic
                        </SelectItem>
                        <SelectItem value="Class 7 - Radioactive">
                          Class 7 - Radioactive
                        </SelectItem>
                        <SelectItem value="Class 8 - Corrosive">
                          Class 8 - Corrosive
                        </SelectItem>
                        <SelectItem value="Class 9 - Miscellaneous">
                          Class 9 - Miscellaneous
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        setFormData({ ...formData, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kg">Kg</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="Ton">Ton</SelectItem>
                        <SelectItem value="Gallon">Gallon</SelectItem>
                        <SelectItem value="Barrel">Barrel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier
                    </label>
                    <Input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage Location
                    </label>
                    <Input
                      type="text"
                      value={formData.storageLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storageLocation: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2 flex gap-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Adding..." : "Add Material"}
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

          {loading && !showAddForm ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>CAS/UN</TableHead>
                    <TableHead>Hazard Class</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div className="font-medium">
                          {material.materialName}
                        </div>
                        {material.supplier && (
                          <div className="text-sm text-gray-500">
                            {material.supplier}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{material.casNumber || "-"}</div>
                        <div>{material.unNumber || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {material.hazardClass || "Unclassified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {material.quantity} {material.unit}
                      </TableCell>
                      <TableCell>
                        {material.syncedAt ? (
                          <Badge className="bg-green-100 text-green-800">
                            Synced
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Synced</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => syncToERPNext(material.id)}
                          disabled={loading || !!material.syncedAt}
                        >
                          <Upload size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
