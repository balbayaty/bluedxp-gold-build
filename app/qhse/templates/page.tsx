/**
 * QHSE Document Templates Management Page
 * Manage document templates for QHSE reports
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
  FiFileText,
  FiDownload,
  FiCopy,
  FiSearch,
} from "react-icons/fi";
import CrossModuleLinks from "@/components/qhse/CrossModuleLinks";

interface Template {
  id: string;
  name: string;
  type:
    | "INCIDENT_REPORT"
    | "INSPECTION_REPORT"
    | "AUDIT_REPORT"
    | "TRAINING_CERTIFICATE"
    | "ESG_REPORT"
    | "CUSTOM";
  description?: string;
  content: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function QHSETemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "incident" | "inspection" | "audit" | "training" | "esg" | "custom"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [activeTab]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const url =
        activeTab === "all"
          ? "/api/qhse/templates"
          : `/api/qhse/templates?type=${activeTab.toUpperCase()}_REPORT`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/qhse/templates/${templateId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        fetchTemplates();
      }
    } catch (err) {
      console.error("Error deleting template:", err);
    }
  };

  const templateTypes = [
    { id: "all", label: "All Templates" },
    { id: "incident", label: "Incident Reports" },
    { id: "inspection", label: "Inspection Reports" },
    { id: "audit", label: "Audit Reports" },
    { id: "training", label: "Training Certificates" },
    { id: "esg", label: "ESG Reports" },
    { id: "custom", label: "Custom" },
  ];

  const filteredTemplates = templates.filter((t) => {
    if (searchQuery) {
      return (
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  if (loading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Document Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage document templates for QHSE reports
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Templates
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {templates.length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Incident Reports
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {templates.filter((t) => t.type === "INCIDENT_REPORT").length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Inspection Reports
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {templates.filter((t) => t.type === "INSPECTION_REPORT").length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Custom Templates
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {templates.filter((t) => t.type === "CUSTOM").length}
              </p>
            </div>
            <FiFileText className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {templateTypes.map((type) => {
              const count =
                type.id === "all"
                  ? templates.length
                  : templates.filter(
                      (t) =>
                        t.type === `${type.id.toUpperCase()}_REPORT` ||
                        (type.id === "custom" && t.type === "CUSTOM"),
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
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No templates found</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Create your first template
                </button>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {template.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                  )}
                  {template.variables && template.variables.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1">
                      <FiDownload className="w-3 h-3" />
                      Use
                    </button>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? "Edit Template" : "Create Template"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTemplate(null);
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

                  const templateData = {
                    name: formData.get("name") as string,
                    type: formData.get("type") as string,
                    description:
                      formData.get("description")?.toString() || undefined,
                    content: formData.get("content") as string,
                    variables:
                      formData
                        .get("variables")
                        ?.toString()
                        .split(",")
                        .filter(Boolean) || [],
                  };

                  try {
                    const url = editingTemplate
                      ? `/api/qhse/templates/${editingTemplate.id}`
                      : "/api/qhse/templates";
                    const method = editingTemplate ? "PUT" : "POST";

                    const response = await fetch(url, {
                      method,
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(templateData),
                    });

                    const data = await response.json();
                    if (data.success) {
                      setShowAddForm(false);
                      setEditingTemplate(null);
                      fetchTemplates();
                    } else {
                      alert(data.error || "Failed to save template");
                    }
                  } catch (err) {
                    console.error("Error saving template:", err);
                    alert("Failed to save template");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingTemplate?.name}
                    placeholder="e.g., Incident Report Template"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type *
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue={editingTemplate?.type || "INCIDENT_REPORT"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INCIDENT_REPORT">Incident Report</option>
                    <option value="INSPECTION_REPORT">Inspection Report</option>
                    <option value="AUDIT_REPORT">Audit Report</option>
                    <option value="TRAINING_CERTIFICATE">
                      Training Certificate
                    </option>
                    <option value="ESG_REPORT">ESG Report</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingTemplate?.description}
                    placeholder="Template description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Content *
                  </label>
                  <textarea
                    name="content"
                    required
                    rows={12}
                    defaultValue={editingTemplate?.content}
                    placeholder={`Template content with variables like {{variable_name}}

Example:
---
INCIDENT REPORT
Date: {{incident_date}}
Location: {{location}}
Description: {{description}}
Severity: {{severity}}
Status: {{status}}
---`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {{ variable_name }} syntax for dynamic variables
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variables (Optional)
                  </label>
                  <input
                    type="text"
                    name="variables"
                    defaultValue={editingTemplate?.variables?.join(",")}
                    placeholder="incident_date, location, description, severity"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated list of variable names (without {{}})
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    💡 Template Tips:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Use {{ variable_name }} for dynamic content</li>
                    <li>
                      Variables will be replaced with actual data when
                      generating documents
                    </li>
                    <li>
                      Common variables: incident_date, location, description,
                      severity, status
                    </li>
                    <li>You can use HTML formatting for rich text templates</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTemplate(null);
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
                    {editingTemplate ? "Update" : "Create"} Template
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
            label: "Regulatory",
            href: "/qhse/regulatory",
            icon: "ri-file-list-3-line",
            description: "Compliance tracking",
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
