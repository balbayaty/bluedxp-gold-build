"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";
import {
  RequirementBuilderInput,
  RequirementDetailInput,
  RuleInput,
  DocumentInput,
} from "@/lib/services/compliance/complianceToolsService";
import { complianceToolsService } from "@/lib/services/compliance/complianceToolsService";
import { authorityHierarchyService } from "@/lib/services/compliance/authorityHierarchyService";

interface RequirementBuilderProps {
  onComplete?: (requirementId: string) => void;
}

export default function RequirementBuilder({
  onComplete,
}: RequirementBuilderProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [authorities, setAuthorities] = useState<RegulatoryAuthorityNode[]>([]);
  const [formData, setFormData] = useState<RequirementBuilderInput>({
    title: "",
    description: "",
    authorityId: "",
    category: "",
    requirements: [],
    rules: [],
    documents: [],
    applicableTo: [],
  });

  useEffect(() => {
    const roots = authorityHierarchyService.getRootNodes();
    setAuthorities(roots);
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const requirement =
        await complianceToolsService.buildRequirement(formData);
      if (onComplete) {
        onComplete(requirement.id);
      }
      // Show success message
    } catch (error) {
      console.error("Error building requirement:", error);
      // Show error message
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [
        ...formData.requirements,
        {
          section: "",
          requirement: "",
          description: "",
          mandatory: true,
          priority: "MEDIUM",
          validationMethod: "AUTOMATED",
        },
      ],
    });
  };

  const updateRequirement = (
    index: number,
    updates: Partial<RequirementDetailInput>,
  ) => {
    const updated = [...formData.requirements];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, requirements: updated });
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Requirement Builder
        </h2>
        <p className="text-gray-400">
          Build custom compliance requirements with deep local knowledge
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-gray-400"
              }`}
            >
              {step > s ? <i className="ri-check-line"></i> : s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? "bg-cyan-500" : "bg-white/10"
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-xl font-semibold text-white">
            Basic Information
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Enter requirement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              rows={4}
              placeholder="Enter requirement description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Regulatory Authority
            </label>
            <select
              value={formData.authorityId}
              onChange={(e) =>
                setFormData({ ...formData, authorityId: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select Authority</option>
              {authorities.map((auth) => (
                <option key={auth.id} value={auth.id}>
                  {auth.name} ({auth.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">Select Category</option>
              <option value="DATA_SECURITY">Data Security</option>
              <option value="DATA_PRIVACY">Data Privacy</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="WAREHOUSING">Warehousing</option>
              <option value="CUSTOMS">Customs</option>
              <option value="PRODUCT_SAFETY">Product Safety</option>
              <option value="FOOD_DRUG">Food & Drug</option>
              <option value="CYBERSECURITY">Cybersecurity</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStep(2)}
              disabled={
                !formData.title ||
                !formData.description ||
                !formData.authorityId ||
                !formData.category
              }
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Requirements */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Requirements</h3>
            <button
              onClick={addRequirement}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 transition-colors"
            >
              <i className="ri-add-line mr-2"></i>
              Add Requirement
            </button>
          </div>

          <div className="space-y-4">
            {formData.requirements.map((req, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 border border-white/10 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">
                    Requirement {index + 1}
                  </h4>
                  <button
                    onClick={() => removeRequirement(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      value={req.section}
                      onChange={(e) =>
                        updateRequirement(index, { section: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={req.priority}
                      onChange={(e) =>
                        updateRequirement(index, {
                          priority: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Requirement
                  </label>
                  <input
                    type="text"
                    value={req.requirement}
                    onChange={(e) =>
                      updateRequirement(index, { requirement: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    placeholder="Enter requirement"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={req.description}
                    onChange={(e) =>
                      updateRequirement(index, { description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={req.mandatory}
                      onChange={(e) =>
                        updateRequirement(index, {
                          mandatory: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    Mandatory
                  </label>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      Validation Method
                    </label>
                    <select
                      value={req.validationMethod}
                      onChange={(e) =>
                        updateRequirement(index, {
                          validationMethod: e.target.value as any,
                        })
                      }
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm"
                    >
                      <option value="AUTOMATED">Automated</option>
                      <option value="MANUAL">Manual</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={formData.requirements.length === 0}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-xl font-semibold text-white">
            Required Documents
          </h3>
          <p className="text-gray-400 text-sm">
            Specify documents required for compliance
          </p>

          {/* Document inputs would go here */}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-xl font-semibold text-white">Review & Submit</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Basic Information</h4>
              <div className="bg-white/5 p-4 rounded-lg space-y-2 text-sm">
                <p>
                  <span className="text-gray-400">Title:</span>{" "}
                  <span className="text-white">{formData.title}</span>
                </p>
                <p>
                  <span className="text-gray-400">Description:</span>{" "}
                  <span className="text-white">{formData.description}</span>
                </p>
                <p>
                  <span className="text-gray-400">Requirements:</span>{" "}
                  <span className="text-white">
                    {formData.requirements.length}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating..." : "Create Requirement"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
