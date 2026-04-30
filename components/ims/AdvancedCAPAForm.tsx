/**
 * Advanced CAPA Form Component
 * Multi-step comprehensive CAPA creation form
 * Adapted from chemcheck-ai with Hazalyze enhancements
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UserSelector from "./UserSelector";
import CustomerSelector from "./CustomerSelector";
import SupplierSelector from "./SupplierSelector";

interface Resource {
  id: string;
  type: "person" | "equipment" | "material" | "external";
  name: string;
  role?: string;
  allocation: number;
  cost: number;
}

interface SubTask {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  dependencies: string[];
}

interface CostItem {
  id: string;
  category: "direct" | "indirect";
  description: string;
  amount: number;
  justification: string;
}

interface AdvancedCAPAFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  linkedNCR?: string;
}

export default function AdvancedCAPAForm({
  onSubmit,
  onCancel,
  initialData,
  linkedNCR,
}: AdvancedCAPAFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    subject: initialData?.subject || "",
    capa_type: initialData?.capa_type || "Corrective Action",
    capa_source: initialData?.capa_source || (linkedNCR ? "NCR" : "Audit"),
    priority: initialData?.priority || "Medium",
    primary_owner: initialData?.assigned_to || "",
    department: "",
    root_cause: initialData?.root_cause || "",
    root_cause_method: "5 Whys",
    action_plan: initialData?.description || "",
    success_criteria: "",
    target_start_date: "",
    exp_end_date: initialData?.exp_end_date || "",
    review_date: "",
    linked_customer: "",
    linked_supplier: "",
    linked_warehouse: "",
    linked_items: [] as string[],
    linked_sales_order: "",
    customer_impact: "None",
    revenue_impact: 0,
    safety_impact: "None",
    compliance_risk: "None",
    verification_method: "",
    effectiveness_review: "Pending",
    budget_approved: false,
    approved_by: "",
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  // ESC key handler and body scroll lock
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    // Lock body scroll when modal is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  const addResource = (type: Resource["type"]) => {
    const newResource: Resource = {
      id: Date.now().toString(),
      type,
      name: "",
      role: "",
      allocation: 0,
      cost: 0,
    };
    setResources([...resources, newResource]);
  };

  const updateResource = (id: string, field: string, value: any) => {
    setResources(
      resources.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const removeResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
  };

  const addSubTask = () => {
    const newTask: SubTask = {
      id: Date.now().toString(),
      title: "",
      assignedTo: "",
      dueDate: "",
      status: "pending",
      dependencies: [],
    };
    setSubTasks([...subTasks, newTask]);
  };

  const addCost = (category: "direct" | "indirect") => {
    const newCost: CostItem = {
      id: Date.now().toString(),
      category,
      description: "",
      amount: 0,
      justification: "",
    };
    setCosts([...costs, newCost]);
  };

  const updateCost = (id: string, field: string, value: any) => {
    setCosts(costs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const directTotal = costs
    .filter((c) => c.category === "direct")
    .reduce((sum, c) => sum + c.amount, 0);
  const indirectTotal = costs
    .filter((c) => c.category === "indirect")
    .reduce((sum, c) => sum + c.amount, 0);
  const grandTotal = directTotal + indirectTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      resources,
      subTasks,
      costs,
      total_direct_cost: directTotal,
      total_indirect_cost: indirectTotal,
      total_cost: grandTotal,
      attachments,
    });
  };

  const steps = [
    { num: 1, title: "Basic Info & Links", icon: "ri-alert-line" },
    { num: 2, title: "Analysis & Plan", icon: "ri-cpu-line" },
    { num: 3, title: "Resources & Team", icon: "ri-team-line" },
    { num: 4, title: "Budget & Costs", icon: "ri-money-dollar-circle-line" },
    { num: 5, title: "Impact & Review", icon: "ri-trending-up-line" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="advanced-capa-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden bg-gray-900 border border-gray-700 my-8"
      >
        {/* Progress Steps */}
        <div className="px-8 py-6 bg-gray-800 border-b border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2
              id="advanced-capa-title"
              className="text-2xl font-bold text-white"
            >
              Create Advanced CAPA
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors"
              aria-label="Close modal"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const isActive = currentStep === step.num;
              const isCompleted = currentStep > step.num;

              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-110"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <i className="ri-check-line text-xl"></i>
                      ) : (
                        <i className={`${step.icon} text-xl`}></i>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-purple-400" : "text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded ${
                        isCompleted ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    CAPA Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg text-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500 focus:outline-none"
                    placeholder="Brief, clear description of the corrective action..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Type *
                    </label>
                    <select
                      value={formData.capa_type}
                      onChange={(e) =>
                        setFormData({ ...formData, capa_type: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500"
                    >
                      <option value="Corrective Action">
                        Corrective (Fix problem)
                      </option>
                      <option value="Preventive Action">
                        Preventive (Prevent problem)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Priority *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High - Urgent</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Source *
                    </label>
                    <select
                      value={formData.capa_source}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          capa_source: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500"
                    >
                      <option value="NCR">NCR</option>
                      <option value="Audit">Audit Finding</option>
                      <option value="Risk">Risk Assessment</option>
                      <option value="Management Review">
                        Management Review
                      </option>
                      <option value="Customer Complaint">
                        Customer Complaint
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <UserSelector
                    value={formData.primary_owner}
                    onChange={(email) =>
                      setFormData({ ...formData, primary_owner: email })
                    }
                    label="Primary Action Owner (ISO 10.2.1)"
                    required={true}
                    isDark={true}
                    placeholder="Select responsible person..."
                  />

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500"
                      placeholder="e.g., Operations, QHSE, Logistics"
                    />
                  </div>
                </div>

                {/* Business Impact Links - Intelligent Interconnections */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-700 border">
                  <h3 className="text-lg font-semibold mb-4 text-blue-300 flex items-center gap-2">
                    <i className="ri-link"></i>
                    Intelligent Business Impact Links
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <CustomerSelector
                      value={formData.linked_customer}
                      onChange={(customerName) =>
                        setFormData({
                          ...formData,
                          linked_customer: customerName,
                        })
                      }
                      label="Related Customer"
                      isDark={true}
                      placeholder="Select customer if applicable..."
                    />

                    <SupplierSelector
                      value={formData.linked_supplier}
                      onChange={(supplierName) =>
                        setFormData({
                          ...formData,
                          linked_supplier: supplierName,
                        })
                      }
                      label="Related Supplier"
                      isDark={true}
                      placeholder="Select supplier if applicable..."
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200">
                        Customer Impact
                      </label>
                      <select
                        value={formData.customer_impact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            customer_impact: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-2"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200">
                        Revenue at Risk (SAR)
                      </label>
                      <input
                        type="number"
                        value={formData.revenue_impact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            revenue_impact: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-2"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-200">
                        Safety Impact
                      </label>
                      <select
                        value={formData.safety_impact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            safety_impact: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-2"
                      >
                        <option value="None">None</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High - Safety Critical</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Analysis & Plan */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Root Cause Analysis (ISO 10.2.1)
                  </label>
                  <select
                    value={formData.root_cause_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        root_cause_method: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border-gray-700 border-2 mb-3"
                  >
                    <option value="5 Whys">5 Whys</option>
                    <option value="Fishbone">Fishbone Diagram</option>
                    <option value="Pareto">Pareto Analysis</option>
                    <option value="Fault Tree">Fault Tree Analysis</option>
                  </select>
                  <textarea
                    rows={4}
                    value={formData.root_cause}
                    onChange={(e) =>
                      setFormData({ ...formData, root_cause: e.target.value })
                    }
                    placeholder="Why did this issue occur? Use the selected method..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Detailed Action Plan *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.action_plan}
                    onChange={(e) =>
                      setFormData({ ...formData, action_plan: e.target.value })
                    }
                    placeholder="Step-by-step plan: What will be done, how, when, by whom..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Success Criteria
                  </label>
                  <textarea
                    rows={3}
                    value={formData.success_criteria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        success_criteria: e.target.value,
                      })
                    }
                    placeholder="How will we measure effectiveness? What are the success indicators?"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Target Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.target_start_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_start_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Target Completion Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.exp_end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exp_end_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Effectiveness Review Date
                    </label>
                    <input
                      type="date"
                      value={formData.review_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Resources & Team */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-xl bg-blue-900/20 border-blue-700 border">
                  <h3 className="text-lg font-semibold mb-2 text-blue-300">
                    Smart Resource Planning
                  </h3>
                  <p className="text-sm text-blue-200">
                    Assign specific people, equipment, and materials
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-white">
                      Resource Allocation
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addResource("person")}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        <i className="ri-user-add-line"></i> Add Person
                      </button>
                      <button
                        type="button"
                        onClick={() => addResource("equipment")}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      >
                        <i className="ri-tools-line"></i> Add Equipment
                      </button>
                      <button
                        type="button"
                        onClick={() => addResource("material")}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        <i className="ri-box-3-line"></i> Add Material
                      </button>
                    </div>
                  </div>

                  {resources.length === 0 && (
                    <div className="text-center py-8 bg-gray-800 rounded-lg">
                      <i className="ri-team-line text-6xl text-gray-600 mb-2"></i>
                      <p className="text-gray-400">
                        No resources assigned yet. Click buttons above to add.
                      </p>
                    </div>
                  )}

                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-4 rounded-lg mb-3 bg-gray-800 border-gray-700 border"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            resource.type === "person"
                              ? "bg-blue-500/20 text-blue-500"
                              : resource.type === "equipment"
                                ? "bg-purple-500/20 text-purple-500"
                                : "bg-green-500/20 text-green-500"
                          }`}
                        >
                          <i
                            className={`${
                              resource.type === "person"
                                ? "ri-user-line"
                                : resource.type === "equipment"
                                  ? "ri-tools-line"
                                  : "ri-box-3-line"
                            } text-xl`}
                          ></i>
                        </div>

                        <div className="flex-1 grid grid-cols-4 gap-3">
                          <input
                            type="text"
                            value={resource.name}
                            onChange={(e) =>
                              updateResource(
                                resource.id,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder={
                              resource.type === "person"
                                ? "Person name or email"
                                : `${resource.type} name`
                            }
                            className="col-span-2 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="text"
                            value={resource.role || ""}
                            onChange={(e) =>
                              updateResource(
                                resource.id,
                                "role",
                                e.target.value,
                              )
                            }
                            placeholder={
                              resource.type === "person"
                                ? "Role/Position"
                                : "Purpose"
                            }
                            className="px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="number"
                            value={resource.cost}
                            onChange={(e) =>
                              updateResource(
                                resource.id,
                                "cost",
                                parseFloat(e.target.value),
                              )
                            }
                            placeholder="Cost (SAR)"
                            className="px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeResource(resource.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <i className="ri-close-line text-xl"></i>
                        </button>
                      </div>
                    </div>
                  ))}

                  {resources.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-purple-900/20">
                      <p className="text-sm font-medium text-purple-300">
                        Total Resource Cost:{" "}
                        <span className="text-lg">
                          SAR{" "}
                          {resources
                            .reduce((sum, r) => sum + r.cost, 0)
                            .toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Sub-Tasks */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-lg font-semibold text-white">
                      Sub-Tasks & Assignments
                    </label>
                    <button
                      type="button"
                      onClick={addSubTask}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                    >
                      <i className="ri-add-line"></i> Add Sub-Task
                    </button>
                  </div>

                  {subTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-lg mb-3 bg-gray-800"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-300">
                          Task {index + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Task description"
                          className="col-span-2 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                        />
                        <input
                          type="email"
                          placeholder="Assigned to"
                          className="px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Budget & Costs */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-xl bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700 border">
                  <h3 className="text-lg font-semibold mb-2 text-green-300">
                    Intelligent Cost Tracking
                  </h3>
                  <p className="text-sm text-green-200">
                    Break down costs into direct and indirect
                  </p>
                </div>

                {/* Direct Costs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-semibold text-white">
                      Direct Costs
                    </label>
                    <button
                      type="button"
                      onClick={() => addCost("direct")}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                    >
                      <i className="ri-add-line"></i> Add Direct Cost
                    </button>
                  </div>

                  {costs
                    .filter((c) => c.category === "direct")
                    .map((cost) => (
                      <div
                        key={cost.id}
                        className="p-4 rounded-lg mb-2 bg-gray-800"
                      >
                        <div className="grid grid-cols-12 gap-3">
                          <input
                            type="text"
                            value={cost.description}
                            onChange={(e) =>
                              updateCost(cost.id, "description", e.target.value)
                            }
                            placeholder="Labor, materials, equipment..."
                            className="col-span-5 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="number"
                            value={cost.amount}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "amount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="Amount (SAR)"
                            className="col-span-3 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="text"
                            value={cost.justification}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "justification",
                                e.target.value,
                              )
                            }
                            placeholder="Justification"
                            className="col-span-3 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCosts(costs.filter((c) => c.id !== cost.id))
                            }
                            className="col-span-1 text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Indirect Costs */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-lg font-semibold text-white">
                      Indirect Costs
                    </label>
                    <button
                      type="button"
                      onClick={() => addCost("indirect")}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                    >
                      <i className="ri-add-line"></i> Add Indirect Cost
                    </button>
                  </div>

                  {costs
                    .filter((c) => c.category === "indirect")
                    .map((cost) => (
                      <div
                        key={cost.id}
                        className="p-4 rounded-lg mb-2 bg-gray-800"
                      >
                        <div className="grid grid-cols-12 gap-3">
                          <input
                            type="text"
                            value={cost.description}
                            onChange={(e) =>
                              updateCost(cost.id, "description", e.target.value)
                            }
                            placeholder="Overhead, admin, utilities..."
                            className="col-span-5 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="number"
                            value={cost.amount}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "amount",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            placeholder="Amount (SAR)"
                            className="col-span-3 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <input
                            type="text"
                            value={cost.justification}
                            onChange={(e) =>
                              updateCost(
                                cost.id,
                                "justification",
                                e.target.value,
                              )
                            }
                            placeholder="Justification"
                            className="col-span-3 px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCosts(costs.filter((c) => c.id !== cost.id))
                            }
                            className="col-span-1 text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Cost Summary */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 border">
                  <h4 className="text-lg font-semibold mb-4 text-white">
                    Cost Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-400">Direct Costs</p>
                      <p className="text-2xl font-bold text-green-400">
                        SAR {directTotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Indirect Costs</p>
                      <p className="text-2xl font-bold text-blue-400">
                        SAR {indirectTotal.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Budget</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        SAR {grandTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.budget_approved}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          budget_approved: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded"
                    />
                    <label className="text-gray-300">
                      Budget Approved by Management
                    </label>
                  </div>
                  {formData.budget_approved && (
                    <input
                      type="email"
                      value={formData.approved_by}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          approved_by: e.target.value,
                        })
                      }
                      placeholder="Approved by (email)"
                      className="mt-2 w-full px-3 py-2 rounded-lg bg-gray-700 text-white border-gray-600 border"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Impact & Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Verification Method
                  </label>
                  <textarea
                    rows={3}
                    value={formData.verification_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verification_method: e.target.value,
                      })
                    }
                    placeholder="How will effectiveness be verified? (ISO 10.2.1)"
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Effectiveness Review (ISO 10.2.1)
                  </label>
                  <select
                    value={formData.effectiveness_review}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        effectiveness_review: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-gray-700 border-2 focus:border-purple-500"
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Effective">Effective</option>
                    <option value="Not Effective">Not Effective</option>
                    <option value="Partially Effective">
                      Partially Effective
                    </option>
                  </select>
                  <p className="text-xs mt-1 text-gray-400">
                    ISO requires verification of effectiveness - Review 30-90
                    days after implementation
                  </p>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-lg font-semibold mb-3 text-white">
                    Supporting Documents & Evidence
                  </label>
                  <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-700 bg-gray-800">
                    <i className="ri-file-paper-2-line text-6xl text-gray-600 mb-3"></i>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setAttachments([
                            ...attachments,
                            ...Array.from(e.target.files),
                          ]);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      <i className="ri-add-line"></i> Upload Files
                    </label>
                    <p className="text-sm mt-2 text-gray-400">
                      Photos, documents, cost quotes, approval emails
                    </p>
                  </div>
                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-gray-800"
                        >
                          <span className="text-sm text-gray-300">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments(
                                attachments.filter((_, index) => index !== i),
                              )
                            }
                            className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white"
              >
                ← Previous
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="ml-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-lg shadow-xl transform hover:scale-105 transition-all"
              >
                Create CAPA
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
