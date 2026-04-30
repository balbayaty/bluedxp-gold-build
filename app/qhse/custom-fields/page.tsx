/**
 * QHSE Custom Fields Management Page
 * Manage custom fields for QHSE entities
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiSettings,
  FiFileText,
  FiShield,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

interface CustomField {
  id: string;
  entityType:
    | "INCIDENT"
    | "INSPECTION"
    | "TRAINING"
    | "ENVIRONMENTAL"
    | "SAFETY"
    | "REGULATORY"
    | "ESG";
  fieldName: string;
  fieldType: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTI_SELECT";
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

export default function QHSECustomFieldsPage() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "incident"
    | "inspection"
    | "training"
    | "environmental"
    | "safety"
    | "regulatory"
    | "esg"
  >("incident");
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchFields();
  }, [activeTab]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/qhse/custom-fields?entityType=${activeTab.toUpperCase()}`,
      );
      const data = await response.json();

      if (data.success) {
        setFields(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching custom fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this custom field?")) return;

    try {
      const response = await fetch(`/api/qhse/custom-fields/${fieldId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        fetchFields();
      }
    } catch (err) {
      console.error("Error deleting custom field:", err);
    }
  };

  const entityTypes = [
    { id: "incident", label: "Incidents", icon: FiActivity },
    { id: "inspection", label: "Inspections", icon: FiFileText },
    { id: "training", label: "Training", icon: FiUsers },
    { id: "environmental", label: "Environmental", icon: FiActivity },
    { id: "safety", label: "Safety", icon: FiShield },
    { id: "regulatory", label: "Regulatory", icon: FiFileText },
    { id: "esg", label: "ESG", icon: FiSettings },
  ];

  if (loading && fields.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading custom fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Fields</h1>
          <p className="text-gray-600 mt-1">
            Manage custom fields for QHSE entities
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Add Custom Field
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {entityTypes.map((type) => {
              const Icon = type.icon;
              const count = fields.filter(
                (f) => f.entityType === type.id.toUpperCase(),
              ).length;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveTab(type.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === type.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                  {count > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Fields List */}
          <div className="space-y-4">
            {fields.filter((f) => f.entityType === activeTab.toUpperCase())
              .length === 0 ? (
              <div className="text-center py-12">
                <FiSettings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No custom fields for{" "}
                  {entityTypes.find((t) => t.id === activeTab)?.label}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Add your first custom field
                </button>
              </div>
            ) : (
              fields
                .filter((f) => f.entityType === activeTab.toUpperCase())
                .map((field) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {field.label}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              field.required
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {field.required ? "Required" : "Optional"}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {field.fieldType.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Field: {field.fieldName}
                        </p>
                        {field.options && field.options.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Options: {field.options.join(", ")}
                          </p>
                        )}
                        {field.defaultValue !== undefined && (
                          <p className="text-sm text-gray-500 mt-1">
                            Default: {String(field.defaultValue)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingField(field)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingField) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingField ? "Edit Custom Field" : "Add Custom Field"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingField(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const fieldData = {
                    entityType: (
                      formData.get("entityType") as string
                    ).toUpperCase(),
                    fieldName: formData.get("fieldName") as string,
                    fieldType: formData.get("fieldType") as string,
                    label: formData.get("label") as string,
                    required: formData.get("required") === "true",
                    options:
                      formData
                        .get("options")
                        ?.toString()
                        .split(",")
                        .filter(Boolean) || undefined,
                    defaultValue:
                      formData.get("defaultValue")?.toString() || undefined,
                  };

                  try {
                    const url = editingField
                      ? `/api/qhse/custom-fields/${editingField.id}`
                      : "/api/qhse/custom-fields";
                    const method = editingField ? "PUT" : "POST";

                    const response = await fetch(url, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(fieldData),
                    });

                    const data = await response.json();
                    if (data.success) {
                      setShowAddForm(false);
                      setEditingField(null);
                      fetchFields();
                    } else {
                      alert(data.error || "Failed to save custom field");
                    }
                  } catch (err) {
                    console.error("Error saving custom field:", err);
                    alert("Failed to save custom field");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type *
                  </label>
                  <select
                    name="entityType"
                    required
                    defaultValue={editingField?.entityType || activeTab}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INCIDENT">Incident</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="TRAINING">Training</option>
                    <option value="ENVIRONMENTAL">Environmental</option>
                    <option value="SAFETY">Safety</option>
                    <option value="REGULATORY">Regulatory</option>
                    <option value="ESG">ESG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    name="fieldName"
                    required
                    defaultValue={editingField?.fieldName}
                    placeholder="e.g., custom_location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Internal field identifier (snake_case)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label *
                  </label>
                  <input
                    type="text"
                    name="label"
                    required
                    defaultValue={editingField?.label}
                    placeholder="e.g., Custom Location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type *
                  </label>
                  <select
                    name="fieldType"
                    required
                    defaultValue={editingField?.fieldType || "TEXT"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="DATE">Date</option>
                    <option value="BOOLEAN">Boolean (Yes/No)</option>
                    <option value="SELECT">Select (Single)</option>
                    <option value="MULTI_SELECT">Multi-Select</option>
                    <option value="TEXTAREA">Text Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required
                  </label>
                  <select
                    name="required"
                    defaultValue={editingField?.required ? "true" : "false"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="false">Optional</option>
                    <option value="true">Required</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (for SELECT/MULTI_SELECT)
                  </label>
                  <input
                    type="text"
                    name="options"
                    defaultValue={editingField?.options?.join(",")}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of options
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    name="defaultValue"
                    defaultValue={editingField?.defaultValue?.toString()}
                    placeholder="Default value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingField(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiSave className="w-4 h-4" />
                    {editingField ? "Update" : "Create"} Field
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cross-Module Links */}
      <CrossModuleLinks
        title="Quick Navigation"
        links={[
          {
            label: "QHSE Dashboard",
            href: "/qhse/dashboard",
            icon: "ri-dashboard-3-line",
            description: "Overview",
          },
          {
            label: "Incidents",
            href: "/qhse/incidents",
            icon: "ri-error-warning-line",
            description: "View incidents",
          },
          {
            label: "Inspections",
            href: "/qhse/inspections",
            icon: "ri-clipboard-line",
            description: "View inspections",
          },
          {
            label: "Training",
            href: "/qhse/training",
            icon: "ri-graduation-cap-line",
            description: "Training records",
          },
          {
            label: "Search",
            href: "/qhse/search",
            icon: "ri-search-line",
            description: "Advanced search",
          },
        ]}
      />
    </div>
  );
}
