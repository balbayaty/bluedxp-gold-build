/**
 * Control Manager UI
 * Manage controls registry (SOPs, Regulations, Iktva)
 * Integrates with existing controls registry service
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { controlsRegistry } from "@/lib/services/decision-core/controlsRegistry";
import type { Control } from "@/lib/services/decision-core/controlsRegistry";

export default function ControlManager() {
  const [controls, setControls] = useState<Control[]>([]);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadControls();
  }, [filterType]);

  const loadControls = () => {
    const allControls = controlsRegistry.getAllControls();
    const filtered =
      filterType === "all"
        ? allControls
        : allControls.filter((c) => c.type === filterType);
    setControls(filtered);
  };

  const handleSave = (control: Partial<Control>) => {
    if (selectedControl) {
      // Update existing
      controlsRegistry.updateControl(
        selectedControl.id,
        control as Partial<Control>,
      );
    } else {
      // Create new
      const newControl: Control = {
        id: `control-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: control.name || "",
        type: control.type || "CUSTOM",
        reference: control.reference || "",
        description: control.description,
        appliesToModules: control.appliesToModules || [],
        appliesToEntityTypes: control.appliesToEntityTypes || [],
        required: control.required ?? false,
        severity: control.severity || "MEDIUM",
        isActive: control.isActive ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...control,
      };
      controlsRegistry.register(newControl);
    }
    loadControls();
    setSelectedControl(null);
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this control?")) {
      controlsRegistry.deleteControl(id);
      loadControls();
      if (selectedControl?.id === id) {
        setSelectedControl(null);
      }
    }
  };

  const controlTypes: Control["type"][] = [
    "SOP",
    "REGULATION",
    "IKTVA",
    "INTERNAL_POLICY",
    "CUSTOM",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Control Management</h2>
        <button
          onClick={() => {
            setShowAddForm(true);
            setSelectedControl(null);
            setIsEditing(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <i className="ri-add-line mr-2"></i>Add Control
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400">Filter by Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            {controlTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls List */}
        <div className="lg:col-span-1 space-y-3">
          {controls.map((control) => (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-colors ${
                selectedControl?.id === control.id
                  ? "border-blue-500"
                  : "border-gray-700"
              }`}
              onClick={() => {
                setSelectedControl(control);
                setIsEditing(false);
                setShowAddForm(false);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        control.type === "SOP"
                          ? "bg-blue-500"
                          : control.type === "REGULATION"
                            ? "bg-green-500"
                            : control.type === "IKTVA"
                              ? "bg-purple-500"
                              : control.type === "INTERNAL_POLICY"
                                ? "bg-orange-500"
                                : "bg-gray-500"
                      } text-white`}
                    >
                      {control.type}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        control.severity === "CRITICAL"
                          ? "bg-red-500"
                          : control.severity === "HIGH"
                            ? "bg-orange-500"
                            : control.severity === "MEDIUM"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                      } text-white`}
                    >
                      {control.severity}
                    </span>
                    {!control.isActive && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-600 text-gray-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-white font-medium">{control.name}</div>
                  <div className="text-gray-400 text-sm mt-1">
                    {control.reference}
                  </div>
                  {control.description && (
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">
                      {control.description}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {controls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="ri-shield-line text-4xl mb-2"></i>
              <p>No controls found</p>
            </div>
          )}
        </div>

        {/* Control Details/Editor */}
        <div className="lg:col-span-2">
          {(selectedControl || showAddForm) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {showAddForm
                    ? "Add New Control"
                    : isEditing
                      ? "Edit Control"
                      : "Control Details"}
                </h3>
                <div className="flex gap-2">
                  {!showAddForm && (
                    <>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <i
                          className={`ri-${isEditing ? "save" : "edit"}-line mr-2`}
                        ></i>
                        {isEditing ? "Save" : "Edit"}
                      </button>
                      {selectedControl && (
                        <button
                          onClick={() => handleDelete(selectedControl.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <i className="ri-delete-bin-line mr-2"></i>Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isEditing || showAddForm ? (
                <ControlEditor
                  control={selectedControl || undefined}
                  onSave={handleSave}
                  onCancel={() => {
                    setIsEditing(false);
                    setShowAddForm(false);
                    setSelectedControl(null);
                  }}
                />
              ) : (
                <ControlDetails control={selectedControl!} />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ControlDetails({ control }: { control: Control }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <div className="text-white">{control.name}</div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Type</label>
        <div className="text-white">{control.type}</div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Reference</label>
        <div className="text-white font-mono text-sm">{control.reference}</div>
      </div>
      {control.description && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Description
          </label>
          <div className="text-white">{control.description}</div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Severity</label>
          <div className="text-white">{control.severity}</div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Required</label>
          <div className="text-white">{control.required ? "Yes" : "No"}</div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Applies To Modules
        </label>
        <div className="text-white">
          {control.appliesToModules.length > 0
            ? control.appliesToModules.join(", ")
            : "All modules"}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Applies To Entity Types
        </label>
        <div className="text-white">
          {control.appliesToEntityTypes.length > 0
            ? control.appliesToEntityTypes.join(", ")
            : "All entity types"}
        </div>
      </div>
      {control.iktvaTag && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Iktva Tag</label>
          <div className="text-white">{control.iktvaTag}</div>
        </div>
      )}
      {control.saudiRegulation && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Saudi Regulation
          </label>
          <div className="text-white">
            {control.saudiRegulation.authority} -{" "}
            {control.saudiRegulation.regulationCode}
          </div>
        </div>
      )}
    </div>
  );
}

function ControlEditor({
  control,
  onSave,
  onCancel,
}: {
  control?: Control;
  onSave: (control: Partial<Control>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Control>>({
    name: control?.name || "",
    type: control?.type || "CUSTOM",
    reference: control?.reference || "",
    description: control?.description || "",
    appliesToModules: control?.appliesToModules || [],
    appliesToEntityTypes: control?.appliesToEntityTypes || [],
    required: control?.required ?? false,
    severity: control?.severity || "MEDIUM",
    isActive: control?.isActive ?? true,
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Type *</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as Control["type"],
              })
            }
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="SOP">SOP</option>
            <option value="REGULATION">Regulation</option>
            <option value="IKTVA">Iktva</option>
            <option value="INTERNAL_POLICY">Internal Policy</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">Severity *</label>
          <select
            value={formData.severity}
            onChange={(e) =>
              setFormData({
                ...formData,
                severity: e.target.value as Control["severity"],
              })
            }
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Reference *</label>
        <input
          type="text"
          value={formData.reference}
          onChange={(e) =>
            setFormData({ ...formData, reference: e.target.value })
          }
          placeholder="e.g., SOP-MSDS-001"
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={formData.required}
            onChange={(e) =>
              setFormData({ ...formData, required: e.target.checked })
            }
            className="rounded"
          />
          <span>Required</span>
        </label>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded"
          />
          <span>Active</span>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          disabled={!formData.name || !formData.reference}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
