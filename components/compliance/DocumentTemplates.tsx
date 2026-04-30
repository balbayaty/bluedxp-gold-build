"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DocumentTemplate,
  documentTemplateService,
} from "@/lib/services/compliance/documentTemplateService";
import { RegulatoryAuthority } from "@/types/compliance";

export default function DocumentTemplates() {
  const [selectedAuthority, setSelectedAuthority] = useState<
    RegulatoryAuthority | "ALL"
  >("ALL");
  const [selectedTemplate, setSelectedTemplate] =
    useState<DocumentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const templates =
    selectedAuthority === "ALL"
      ? documentTemplateService.getAllTemplates()
      : documentTemplateService.getTemplatesByAuthority(selectedAuthority);

  const handleGenerate = (template: DocumentTemplate) => {
    const result = documentTemplateService.generateDocumentFromTemplate(
      template.id,
      formData,
    );
    if (result.success) {
      // Show success message
      alert("Document generated successfully!");
    } else {
      // Show errors
      alert(`Errors: ${result.errors?.join(", ")}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Document Templates</h2>
          <p className="text-gray-400 mt-1">
            Generate compliance documents from official templates
          </p>
        </div>
      </div>

      {/* Authority Filter */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Authority
        </label>
        <select
          value={selectedAuthority}
          onChange={(e) =>
            setSelectedAuthority(e.target.value as RegulatoryAuthority | "ALL")
          }
          className="w-full md:w-auto px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Authorities</option>
          <option value="TGA">TGA</option>
          <option value="SFDA">SFDA</option>
          <option value="ZATCA">ZATCA</option>
          <option value="SASO">SASO</option>
          <option value="NCSC">NCSC</option>
          <option value="SDAIA">SDAIA</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                    {template.authority}
                  </span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                    {template.format}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                }}
                className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm transition-colors"
              >
                <i className="ri-file-edit-line mr-2"></i>
                Use Template
              </button>
              {template.exampleUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(template.exampleUrl, "_blank");
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm transition-colors"
                >
                  <i className="ri-eye-line"></i>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Template Form Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1f2937] border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="text-gray-400 mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-white"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {selectedTemplate.instructions && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300">
                  {selectedTemplate.instructions}
                </p>
              </div>
            )}

            <form className="space-y-6">
              {selectedTemplate.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id} className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">
                      {section.title}
                    </h4>
                    {section.description && (
                      <p className="text-sm text-gray-400">
                        {section.description}
                      </p>
                    )}
                    <div className="space-y-4">
                      {section.fields.map((fieldId) => {
                        const field = selectedTemplate.fields.find(
                          (f) => f.id === fieldId,
                        );
                        if (!field) return null;

                        return (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {field.label}
                              {field.required && (
                                <span className="text-red-400 ml-1">*</span>
                              )}
                            </label>
                            {field.type === "TEXT" && (
                              <input
                                type="text"
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [field.name]: e.target.value,
                                  })
                                }
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                required={field.required}
                              />
                            )}
                            {field.type === "NUMBER" && (
                              <input
                                type="number"
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [field.name]: e.target.value,
                                  })
                                }
                                min={field.validation?.min}
                                max={field.validation?.max}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                required={field.required}
                              />
                            )}
                            {field.type === "SELECT" && (
                              <select
                                value={formData[field.name] || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [field.name]: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                required={field.required}
                              >
                                <option value="">Select {field.label}</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}
                            {field.type === "CHECKBOX" && (
                              <div className="space-y-2">
                                {field.options ? (
                                  field.options.map((opt) => (
                                    <label
                                      key={opt}
                                      className="flex items-center gap-2 text-gray-300"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          (
                                            formData[field.name] as string[]
                                          )?.includes(opt) || false
                                        }
                                        onChange={(e) => {
                                          const current =
                                            (formData[
                                              field.name
                                            ] as string[]) || [];
                                          const updated = e.target.checked
                                            ? [...current, opt]
                                            : current.filter((v) => v !== opt);
                                          setFormData({
                                            ...formData,
                                            [field.name]: updated,
                                          });
                                        }}
                                        className="rounded"
                                      />
                                      {opt}
                                    </label>
                                  ))
                                ) : (
                                  <label className="flex items-center gap-2 text-gray-300">
                                    <input
                                      type="checkbox"
                                      checked={formData[field.name] || false}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          [field.name]: e.target.checked,
                                        })
                                      }
                                      className="rounded"
                                    />
                                    {field.label}
                                  </label>
                                )}
                              </div>
                            )}
                            {field.type === "FILE" && (
                              <div>
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setFormData({
                                        ...formData,
                                        [field.name]: file.name,
                                      });
                                    }
                                  }}
                                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                  required={field.required}
                                />
                                {field.helpText && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {field.helpText}
                                  </p>
                                )}
                              </div>
                            )}
                            {field.helpText && field.type !== "FILE" && (
                              <p className="text-xs text-gray-400 mt-1">
                                {field.helpText}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </form>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleGenerate(selectedTemplate)}
                className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
              >
                <i className="ri-file-download-line mr-2"></i>
                Generate Document
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
