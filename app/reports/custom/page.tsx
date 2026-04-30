"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import Tooltip from "@/components/Tooltip";
import Modal from "@/components/Modal";
import CustomReportBuilder, {
  CustomReport,
} from "@/components/CustomReportBuilder";
import { format } from "date-fns";
import { logger } from "@/lib/services/observability/logger";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  dataSource: string;
  fields: string[];
  filters: string[];
  chartType?: "bar" | "line" | "pie" | "table";
  createdAt: Date | string;
  lastRun?: Date | string;
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    recipients: string[];
  };
}

export default function CustomReports() {
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: "template-1",
      name: "Daily Inventory Summary",
      description: "Daily inventory levels and movements",
      category: "Inventory",
      dataSource: "inventory",
      fields: ["materialNumber", "quantity", "valuation", "location"],
      filters: ["dateRange", "location"],
      chartType: "bar",
      createdAt: new Date(),
      schedule: {
        frequency: "daily",
        time: "08:00",
        recipients: ["warehouse@example.com"],
      },
    },
    {
      id: "template-2",
      name: "Order Fulfillment Report",
      description: "Sales order fulfillment metrics",
      category: "Orders",
      dataSource: "salesOrders",
      fields: ["soNumber", "status", "totalValue", "fulfillmentProgress"],
      filters: ["dateRange", "status"],
      chartType: "line",
      createdAt: new Date(),
    },
    {
      id: "template-3",
      name: "Financial Summary",
      description: "Revenue and cost analysis",
      category: "Financial",
      dataSource: "financial",
      fields: ["revenue", "costs", "profit", "margin"],
      filters: ["dateRange"],
      chartType: "pie",
      createdAt: new Date(),
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ReportTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({
    name: "",
    description: "",
    category: "Inventory",
    dataSource: "inventory",
    fields: [],
    filters: [],
    chartType: "table",
  });

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "ALL") return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  const availableDataSources = [
    { value: "inventory", label: "Inventory", icon: "ri-stack-line" },
    {
      value: "salesOrders",
      label: "Sales Orders",
      icon: "ri-shopping-cart-line",
    },
    {
      value: "purchaseOrders",
      label: "Purchase Orders",
      icon: "ri-file-list-line",
    },
    {
      value: "financial",
      label: "Financial",
      icon: "ri-money-dollar-circle-line",
    },
    {
      value: "operational",
      label: "Operational Metrics",
      icon: "ri-line-chart-line",
    },
    { value: "carriers", label: "Carriers", icon: "ri-truck-line" },
  ];

  const availableFields: Record<string, string[]> = {
    inventory: [
      "materialNumber",
      "materialDescription",
      "quantity",
      "reservedQuantity",
      "availableQuantity",
      "valuation",
      "location",
      "batchNumber",
    ],
    salesOrders: [
      "soNumber",
      "customerName",
      "orderDate",
      "status",
      "totalValue",
      "totalItems",
      "fulfillmentProgress",
      "slaStatus",
    ],
    purchaseOrders: [
      "poNumber",
      "vendorName",
      "orderDate",
      "status",
      "totalValue",
      "totalItems",
      "receivedQuantity",
    ],
    financial: [
      "revenue",
      "costs",
      "profit",
      "margin",
      "cashFlow",
      "inventoryValue",
    ],
    operational: [
      "throughput",
      "accuracy",
      "utilization",
      "onTimeRate",
      "damageRate",
    ],
    carriers: ["carrierName", "onTimeDelivery", "cost", "shipments", "rating"],
  };

  const availableFilters = [
    { value: "dateRange", label: "Date Range", icon: "ri-calendar-line" },
    { value: "location", label: "Location", icon: "ri-map-pin-line" },
    { value: "status", label: "Status", icon: "ri-checkbox-circle-line" },
    { value: "category", label: "Category", icon: "ri-folder-line" },
    { value: "customer", label: "Customer", icon: "ri-user-line" },
    { value: "vendor", label: "Vendor", icon: "ri-store-line" },
  ];

  const handleCreate = () => {
    if (!formData.name || !formData.dataSource) return;

    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      name: formData.name || "",
      description: formData.description || "",
      category: formData.category || "Inventory",
      dataSource: formData.dataSource || "inventory",
      fields: formData.fields || [],
      filters: formData.filters || [],
      chartType: formData.chartType || "table",
      createdAt: new Date(),
    };

    setTemplates([...templates, newTemplate]);
    setFormData({
      name: "",
      description: "",
      category: "Inventory",
      dataSource: "inventory",
      fields: [],
      filters: [],
      chartType: "table",
    });
    setShowCreateModal(false);
  };

  const handleEdit = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setFormData(template);
    setShowEditModal(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;

    setTemplates(
      templates.map((t) =>
        t.id === selectedTemplate.id ? { ...selectedTemplate, ...formData } : t,
      ),
    );
    setShowEditModal(false);
    setSelectedTemplate(null);
  };

  const handleSchedule = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = (schedule: ReportTemplate["schedule"]) => {
    if (!selectedTemplate) return;

    setTemplates(
      templates.map((t) =>
        t.id === selectedTemplate.id ? { ...t, schedule } : t,
      ),
    );
    setShowScheduleModal(false);
    setSelectedTemplate(null);
  };

  const handleRun = (template: ReportTemplate) => {
    logger.info("Running report", undefined, {
      module: "reports",
      service: "custom",
      templateId: template.id,
      templateName: template.name,
    });
    // In a real implementation, this would generate and display the report
    alert(`Running report: ${template.name}`);
  };

  const stats = [
    {
      label: "Total Templates",
      value: templates.length,
      icon: "ri-file-edit-line",
      tooltip: "Total custom report templates",
      trend: "up" as const,
    },
    {
      label: "Scheduled Reports",
      value: templates.filter((t) => t.schedule).length,
      icon: "ri-time-line",
      tooltip: "Reports with scheduled runs",
      trend: "up" as const,
    },
  ];

  return (
    <PageTemplate
      title="Custom Report Builder"
      description="Create, customize, schedule, and share custom reports with drag-and-drop functionality"
      icon="ri-file-edit-line"
      systemInfo={{
        sap: "Report Builder, Custom Reports",
        oracle: "Report Designer, Custom Analytics",
        manhattan: "Report Builder, Custom Reports",
      }}
      examples={[
        "Drag-and-drop report builder",
        "Custom data sources and fields",
        "Multiple chart types",
        "Report scheduling",
        "Email distribution",
        "Export capabilities",
      ]}
      stats={stats}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          <i className="ri-add-line"></i>
          Create Report
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 min-w-[200px]"
        >
          <option value="ALL">All Categories</option>
          {Array.from(new Set(templates.map((t) => t.category))).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Report Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-[#9ca3af] mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                  <span className="px-2 py-1 bg-white/5 rounded">
                    {template.category}
                  </span>
                  {template.schedule && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                      <i className="ri-time-line mr-1"></i>
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-xs text-[#9ca3af]">
                <i className="ri-database-line mr-1"></i>
                Data Source:{" "}
                {
                  availableDataSources.find(
                    (ds) => ds.value === template.dataSource,
                  )?.label
                }
              </div>
              <div className="text-xs text-[#9ca3af]">
                <i className="ri-file-list-line mr-1"></i>
                Fields: {template.fields.length}
              </div>
              <div className="text-xs text-[#9ca3af]">
                <i className="ri-filter-line mr-1"></i>
                Filters: {template.filters.length}
              </div>
              {template.chartType && (
                <div className="text-xs text-[#9ca3af]">
                  <i className="ri-bar-chart-line mr-1"></i>
                  Chart: {template.chartType}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-white/10">
              <button
                onClick={() => handleRun(template)}
                className="flex-1 px-3 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded text-sm font-medium hover:bg-cyan-600/30 transition-colors"
              >
                <i className="ri-play-line mr-1"></i>
                Run
              </button>
              <Tooltip content="Edit" position="top">
                <button
                  onClick={() => handleEdit(template)}
                  className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-sm font-medium hover:bg-blue-600/30 transition-colors"
                >
                  <i className="ri-edit-line"></i>
                </button>
              </Tooltip>
              <Tooltip content="Schedule" position="top">
                <button
                  onClick={() => handleSchedule(template)}
                  className="px-3 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded text-sm font-medium hover:bg-purple-600/30 transition-colors"
                >
                  <i className="ri-time-line"></i>
                </button>
              </Tooltip>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Report Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            name: "",
            description: "",
            category: "Inventory",
            dataSource: "inventory",
            fields: [],
            filters: [],
            chartType: "table",
          });
        }}
        title="Create Custom Report"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Report Name
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter report name"
            />
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              placeholder="Enter report description"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Category
            </label>
            <select
              value={formData.category || "Inventory"}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="Inventory">Inventory</option>
              <option value="Orders">Orders</option>
              <option value="Financial">Financial</option>
              <option value="Operational">Operational</option>
              <option value="Quality">Quality</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Data Source
            </label>
            <select
              value={formData.dataSource || "inventory"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dataSource: e.target.value,
                  fields: [],
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              {availableDataSources.map((ds) => (
                <option key={ds.value} value={ds.value}>
                  {ds.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Fields</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-white/5 p-3 rounded-lg">
              {availableFields[formData.dataSource || "inventory"]?.map(
                (field) => (
                  <label
                    key={field}
                    className="flex items-center gap-2 text-sm text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.fields?.includes(field)}
                      onChange={(e) => {
                        const fields = formData.fields || [];
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            fields: [...fields, field],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            fields: fields.filter((f) => f !== field),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{field}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Filters</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-white/5 p-3 rounded-lg">
              {availableFilters.map((filter) => (
                <label
                  key={filter.value}
                  className="flex items-center gap-2 text-sm text-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.filters?.includes(filter.value)}
                    onChange={(e) => {
                      const filters = formData.filters || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          filters: [...filters, filter.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          filters: filters.filter((f) => f !== filter.value),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span>{filter.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Chart Type
            </label>
            <select
              value={formData.chartType || "table"}
              onChange={(e) =>
                setFormData({ ...formData, chartType: e.target.value as any })
              }
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="table">Table</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleCreate}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Create Report
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Report Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
        }}
        title="Edit Report"
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            {/* Similar form fields as create modal */}
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Report Name
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Schedule Report Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedTemplate(null);
        }}
        title="Schedule Report"
        size="md"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Frequency
              </label>
              <select
                defaultValue={selectedTemplate.schedule?.frequency || "daily"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">Time</label>
              <input
                type="time"
                defaultValue={selectedTemplate.schedule?.time || "08:00"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-2">
                Recipients (Email)
              </label>
              <input
                type="text"
                defaultValue={
                  selectedTemplate.schedule?.recipients.join(", ") || ""
                }
                placeholder="email1@example.com, email2@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => {
                  const frequency = (
                    document.querySelector("select") as HTMLSelectElement
                  )?.value as "daily" | "weekly" | "monthly";
                  const time = (
                    document.querySelector(
                      'input[type="time"]',
                    ) as HTMLInputElement
                  )?.value;
                  const recipients = (
                    document.querySelector(
                      'input[type="text"]',
                    ) as HTMLInputElement
                  )?.value
                    .split(",")
                    .map((e) => e.trim());
                  handleSaveSchedule({
                    frequency,
                    time: time || "08:00",
                    recipients: recipients || [],
                  });
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Save Schedule
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Report Builder Modal */}
      <CustomReportBuilder
        isOpen={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
        onSave={(report) => {
          // Convert CustomReport to ReportTemplate and add to templates
          const newTemplate: ReportTemplate = {
            id: report.id,
            name: report.name,
            description: report.description,
            category: "Custom",
            dataSource: report.fields[0]?.source || "orders",
            fields: report.fields.map((f) => f.id),
            filters: report.filters.map((f) => f.field),
            chartType:
              (report.charts[0]?.type === "area"
                ? "bar"
                : report.charts[0]?.type) || "bar",
            createdAt: report.createdAt,
          };
          setTemplates([...templates, newTemplate]);
          setShowReportBuilder(false);
        }}
      />
    </PageTemplate>
  );
}
