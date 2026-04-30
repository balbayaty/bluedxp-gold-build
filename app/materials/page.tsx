"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import ModuleLinks from "@/components/ModuleLinks";
import { getMaterialLinks } from "@/utils/moduleInterconnectivity";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Textarea from "@/components/Textarea";
import { format } from "date-fns";
import CurrencyDisplay from "@/components/CurrencyDisplay";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import UniversalQRGenerator from "@/components/qr/UniversalQRGenerator";
import { getMaterials, saveMaterial } from "@/app/actions/wms/materialActions";
import { useNotifications } from "@/lib/utils/notifications";

// Type definition matches Prisma Model mostly
type Material = {
  id: string;
  materialNumber: string;
  materialDescription: string; // Mapped from 'description'
  category: string;
  baseUnit: string;
  weight: number;
  volume: number;
  hazardous: boolean; // Mapped from isHazardous
  batchManaged: boolean; // Mapped from isBatchManaged
  serialNumberManaged: boolean; // Mapped from
  temperatureControlled: boolean; // Mapped from
  lifecycleStatus?: string;
  averageCost?: number;
  standardCost?: number;
};

export default function MaterialMaster() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notifications = useNotifications();
  const materialFilter = searchParams.get("material");

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data from Server
  const fetchMaterials = async () => {
    setLoading(true);
    const res = await getMaterials();
    if (res.success && res.data) {
      // Map Prisma Result to UI Type
      const mapped = res.data.map((m) => ({
        id: m.id,
        materialNumber: m.materialNumber,
        materialDescription: m.description,
        category: m.category,
        baseUnit: m.baseUnit,
        weight: m.weight || 0,
        volume: m.volume || 0,
        hazardous: m.isHazardous,
        batchManaged: m.isBatchManaged,
        serialNumberManaged: m.isSerialManaged,
        temperatureControlled: m.requiresTempControl,
        lifecycleStatus: "ACTIVE",
        standardCost: Number(m.standardPrice),
      }));
      setMaterials(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid" | "analytics">(
    "table",
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null,
  );

  // Using 'any' for formData temporarily to match ease of use with mapping
  const [formData, setFormData] = useState<any>({});

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      const matchesSearch =
        mat.materialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mat.materialDescription
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || mat.category === selectedCategory;
      const matchesMaterial =
        !materialFilter || mat.materialNumber === materialFilter;
      return matchesSearch && matchesCategory && matchesMaterial;
    });
  }, [materials, searchQuery, selectedCategory, materialFilter]);

  const categories = [
    "ALL",
    ...Array.from(new Set(materials.map((m) => m.category))),
  ];

  // Analytics Calcs
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    materials.forEach((mat) => {
      stats[mat.category] = (stats[mat.category] || 0) + 1;
    });
    return Object.entries(stats).map(([category, count]) => ({
      category,
      count,
    }));
  }, [materials]);

  const stats = [
    {
      label: "Total Materials",
      value: materials.length,
      icon: "ri-box-line",
      tooltip: "Total materials in DB",
      trend: "up" as const,
    },
    {
      label: "Hazardous",
      value: materials.filter((m) => m.hazardous).length,
      icon: "ri-alert-line",
      tooltip: "Classified HA (HAZMAT)",
      trend: "neutral" as const,
    },
    {
      label: "Batch Managed",
      value: materials.filter((m) => m.batchManaged).length,
      icon: "ri-file-list-line",
      tooltip: "Requires Batch",
      trend: "neutral" as const,
    },
    {
      label: "Total Valuation",
      value: materials.reduce((acc, m) => acc + (m.standardCost || 0), 0),
      isCurrency: true,
      icon: "ri-money-dollar-circle-line",
      tooltip: "Sum of Standard Prices",
      trend: "up" as const,
    },
  ];

  const handleCreate = () => {
    setFormData({});
    setShowCreateModal(true);
  };

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setFormData(material);
    setShowEditModal(true);
  };

  const handleView = (material: Material) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleDelete = (material: Material) => {
    // setSelectedMaterial(material)
    // setShowDeleteDialog(true)
    notifications.info(
      "Delete Not Enabled",
      "Deletion is disabled for safety in this phase.",
    );
  };

  const handleSave = async () => {
    const isNew = showCreateModal;

    // Optimistic Update can be added here, but for now we wait
    const input = {
      materialNumber: formData.materialNumber,
      description: formData.materialDescription,
      category: formData.category,
      baseUnit: formData.baseUnit,
      weight: Number(formData.weight),
      volume: Number(formData.volume),
      isHazardous: formData.hazardous,
      isBatchManaged: formData.batchManaged,
      isSerialManaged: formData.serialNumberManaged,
      requiresTempControl: formData.temperatureControlled,
      standardPrice: Number(formData.standardCost), // Map back
    };

    const res = await saveMaterial(input);

    if (res.success) {
      setShowCreateModal(false);
      setShowEditModal(false);
      setFormData({});
      fetchMaterials(); // Refresh list
      notifications.success(
        "Material Saved",
        `Material ${input.materialNumber} has been saved.`,
      );
    } else {
      notifications.error("Error", res.error || "Failed to save");
    }
  };

  const units = ["EA", "KG", "L", "M", "M2", "M3", "PAL", "BOX"];
  const materialCategories = [
    "HAZMAT",
    "NON-HAZMAT",
    "LIQUID",
    "SOLID",
    "GAS",
    "POWDER",
    "GENERAL",
  ];

  // Loading State
  if (loading && materials.length === 0) {
    return (
      <PageTemplate
        title="Material Master"
        description="Loading..."
        icon="ri-loader-4-line"
      >
        <div className="flex h-96 items-center justify-center">
          <div className="text-cyan-500 text-xl animate-pulse">
            Connecting to Digital Twin...
          </div>
        </div>
      </PageTemplate>
    );
  }

  const confirmDelete = async () => {
    if (!selectedMaterial) return;
    notifications.info(
      "Delete Not Enabled",
      "Deletion is disabled for safety in this phase.",
    );
    setShowDeleteDialog(false);
  };

  return (
    <PageTemplate
      title="Material Master (Live)"
      description="Central repository [PRISMA CONNECTED] - Manage materials, SKUs, and product information with full traceability"
      icon="ri-box-3-line"
      systemInfo={{
        sap: "MM01 - Create Material",
        oracle: "Item Master",
        manhattan: "Item Master",
      }}
      examples={[
        "Create new material (Real DB Write)",
        "View Materials (Real DB Read)",
        "Manage Attributes (Hazmat/Batch)",
      ]}
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            {(["table", "grid", "analytics"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <i
                  className={`ri-${mode === "table" ? "table-line" : mode === "grid" ? "grid-line" : "bar-chart-line"} mr-1`}
                ></i>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-add-line"></i>
            Create Material
          </button>
        </div>
      }
    >
      {/* Filters exist here in original... keeping simplified logic for brevity of this edit */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm"></i>
          <input
            type="text"
            placeholder="Search DB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        [
                          "#06b6d4",
                          "#10b981",
                          "#f59e0b",
                          "#ef4444",
                          "#8b5cf6",
                          "#ec4899",
                        ][index % 6]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {/* Materials List */}
      {viewMode === "table" ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Price (Std)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#9ca3af] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredMaterials.map((material, index) => (
                  <motion.tr
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white font-mono">
                      {material.materialNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {material.materialDescription}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {material.baseUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                      {material.standardCost?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {material.hazardous && (
                          <i
                            className="ri-fire-line text-red-500"
                            title="Hazardous"
                          ></i>
                        )}
                        {material.batchManaged && (
                          <i
                            className="ri-stack-line text-blue-500"
                            title="Batch"
                          ></i>
                        )}
                        {material.serialNumberManaged && (
                          <i
                            className="ri-barcode-line text-purple-500"
                            title="Serial"
                          ></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-cyan-400 hover:text-cyan-300 mr-2"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              className="bg-white/5 p-4 rounded-xl border border-white/10"
            >
              <div className="font-mono text-cyan-400 font-bold">
                {m.materialNumber}
              </div>
              <div className="text-sm text-gray-300 mb-2">
                {m.materialDescription}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="bg-white/10 px-2 py-1 rounded">
                  {m.category}
                </span>
                <span className="bg-white/10 px-2 py-1 rounded">
                  {m.baseUnit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setFormData({});
          setSelectedMaterial(null);
        }}
        title={showCreateModal ? "Create Material (Real DB)" : "Edit Material"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Material Number"
            value={formData.materialNumber || ""}
            onChange={(e) =>
              setFormData({ ...formData, materialNumber: e.target.value })
            }
            placeholder="MAT-000001"
            required
            disabled={!showCreateModal} // Lock key on edit
          />
          <Textarea
            label="Description"
            value={formData.materialDescription || ""}
            onChange={(e) =>
              setFormData({ ...formData, materialDescription: e.target.value })
            }
            placeholder="Material description"
            rows={3}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category || "GENERAL"}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={materialCategories.map((cat) => ({
                value: cat,
                label: cat,
              }))}
              required
            />
            <Input
              label="Standard Price (Valuation)"
              type="number"
              value={formData.standardCost || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  standardCost: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
            />
          </div>

          <div className="space-y-3 p-3 bg-white/5 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-400">
              Control Flags
            </h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hazardous || false}
                onChange={(e) =>
                  setFormData({ ...formData, hazardous: e.target.checked })
                }
              />
              <span className="text-sm text-white">Hazardous Material</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.batchManaged || false}
                onChange={(e) =>
                  setFormData({ ...formData, batchManaged: e.target.checked })
                }
              />
              <span className="text-sm text-white">Batch Managed</span>
            </label>
          </div>

          <div className="flex items-center gap-3 justify-end pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 text-white rounded-lg"
            >
              {showCreateModal ? "Create in DB" : "Update DB"}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedMaterial(null);
        }}
        title={`Material Details - ${selectedMaterial?.materialNumber || ""}`}
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-4">
            {/* QR Code Section */}
            <div className="bg-white/5 rounded-lg p-4 border border-cyan-500/20">
              <UniversalQRGenerator
                entityId={selectedMaterial.id}
                entityType="material"
                entityName={selectedMaterial.materialNumber}
                documentType="other"
                documentUrl={`/materials?material=${selectedMaterial.materialNumber}`}
                module="wms"
                showAdvanced={false}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Number
                </label>
                <p className="text-sm text-white font-mono font-medium">
                  {selectedMaterial.materialNumber}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Category
                </label>
                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-xs">
                  {selectedMaterial.category}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Material Type
                </label>
                <p className="text-sm text-white">
                  {(selectedMaterial as any).materialType?.replace(/_/g, " ") ||
                    "N/A"}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Lifecycle Status
                </label>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    (selectedMaterial as any).lifecycleStatus === "ACTIVE"
                      ? "bg-green-500/20 text-green-400"
                      : (selectedMaterial as any).lifecycleStatus ===
                          "DEVELOPMENT"
                        ? "bg-blue-500/20 text-blue-400"
                        : (selectedMaterial as any).lifecycleStatus ===
                            "PHASE_OUT"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {(selectedMaterial as any).lifecycleStatus?.replace(
                    /_/g,
                    " ",
                  ) || "ACTIVE"}
                </span>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Description
                </label>
                <p className="text-sm text-white">
                  {selectedMaterial.materialDescription}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Base Unit
                </label>
                <p className="text-sm text-white">
                  {selectedMaterial.baseUnit}
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Weight
                </label>
                <p className="text-sm text-white">
                  {selectedMaterial.weight.toFixed(2)} kg
                </p>
              </div>
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Volume
                </label>
                <p className="text-sm text-white">
                  {selectedMaterial.volume.toFixed(2)} m³
                </p>
              </div>
              {(selectedMaterial as any).dimensions && (
                <>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Dimensions (L×W×H)
                    </label>
                    <p className="text-sm text-white">
                      {(selectedMaterial as any).dimensions.length.toFixed(2)} ×{" "}
                      {(selectedMaterial as any).dimensions.width.toFixed(2)} ×{" "}
                      {(selectedMaterial as any).dimensions.height.toFixed(2)}{" "}
                      {(selectedMaterial as any).dimensions.unit}
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="text-xs text-[#9ca3af] mb-1 block">
                  Shelf Life
                </label>
                <p className="text-sm text-white">
                  {selectedMaterial.shelfLife} days
                </p>
              </div>
            </div>
            {(selectedMaterial as any).standardCost && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Costing Information
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Standard Cost
                    </label>
                    <CurrencyDisplay
                      amount={(selectedMaterial as any).standardCost || 0}
                      size="sm"
                      variant="default"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Last Cost
                    </label>
                    <CurrencyDisplay
                      amount={(selectedMaterial as any).lastCost || 0}
                      size="sm"
                      variant="default"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#9ca3af] mb-1 block">
                      Average Cost
                    </label>
                    <CurrencyDisplay
                      amount={(selectedMaterial as any).averageCost || 0}
                      size="sm"
                      variant="default"
                    />
                  </div>
                </div>
              </div>
            )}
            {(selectedMaterial as any).specifications && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3">
                  Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {(selectedMaterial as any).specifications.color && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Color
                      </label>
                      <p className="text-sm text-white">
                        {(selectedMaterial as any).specifications.color}
                      </p>
                    </div>
                  )}
                  {(selectedMaterial as any).specifications.grade && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Grade
                      </label>
                      <p className="text-sm text-white">
                        {(selectedMaterial as any).specifications.grade}
                      </p>
                    </div>
                  )}
                  {(selectedMaterial as any).specifications.purity && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        Purity
                      </label>
                      <p className="text-sm text-white">
                        {(selectedMaterial as any).specifications.purity}
                      </p>
                    </div>
                  )}
                  {(selectedMaterial as any).specifications.ph && (
                    <div>
                      <label className="text-xs text-[#9ca3af] mb-1 block">
                        pH
                      </label>
                      <p className="text-sm text-white">
                        {(selectedMaterial as any).specifications.ph}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <label className="text-sm text-[#9ca3af] mb-2 block">
                Attributes
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMaterial.hazardous && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">
                    Hazardous
                  </span>
                )}
                {selectedMaterial.batchManaged && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs">
                    Batch Managed
                  </span>
                )}
                {selectedMaterial.serialNumberManaged && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-xs">
                    Serial Managed
                  </span>
                )}
                {selectedMaterial.temperatureControlled && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-xs">
                    Temperature Controlled
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  router.push(
                    `/inventory?material=${selectedMaterial.materialNumber}`,
                  );
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="ri-stack-line"></i>
                View Stock
              </button>
              {selectedMaterial.batchManaged && (
                <button
                  onClick={() => {
                    router.push(
                      `/batches?material=${selectedMaterial.materialNumber}`,
                    );
                    setShowViewModal(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-file-list-line"></i>
                  View Batches
                </button>
              )}
              {selectedMaterial.serialNumberManaged && (
                <button
                  onClick={() => {
                    router.push(
                      `/serials?material=${selectedMaterial.materialNumber}`,
                    );
                    setShowViewModal(false);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-barcode-line"></i>
                  View Serials
                </button>
              )}
              {(selectedMaterial as any).preferredVendor && (
                <button
                  onClick={() => {
                    router.push(
                      `/vendors?vendor=${(selectedMaterial as any).preferredVendor}`,
                    );
                    setShowViewModal(false);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-store-line"></i>
                  View Vendor
                </button>
              )}
            </div>
            {getMaterialLinks && (
              <div className="pt-4 border-t border-white/10">
                <ModuleLinks
                  links={getMaterialLinks(selectedMaterial.materialNumber)}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedMaterial(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Material"
        message={`Are you sure you want to delete material "${selectedMaterial?.materialNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </PageTemplate>
  );
}
