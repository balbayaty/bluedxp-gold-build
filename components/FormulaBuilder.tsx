"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABLE_FIELDS = {
  "Time Fields": [
    {
      name: "duration1",
      description: "ASN→GR or Order→Picking time (seconds)",
    },
    {
      name: "duration2",
      description: "GR→Putaway or Picking→Dispatch time (seconds)",
    },
    {
      name: "offloadingDuration",
      description: "Offloading duration (seconds)",
    },
    { name: "putawayDuration", description: "Putaway duration (seconds)" },
    { name: "pickingDuration", description: "Picking duration (seconds)" },
    { name: "qcDuration", description: "QC duration (seconds)" },
    {
      name: "dispatchingDuration",
      description: "Dispatching duration (seconds)",
    },
    { name: "delivery_time", description: "Expected→Actual delivery time" },
    { name: "processing_time", description: "Total processing time" },
  ],
  "Employee Fields": [
    { name: "personnel", description: "Employee name/ID" },
    { name: "receivedBy", description: "Who received goods" },
    {
      name: "offloadingForkliftDriver",
      description: "Offloading forklift driver",
    },
    { name: "putawayForkliftDriver", description: "Putaway forklift driver" },
    { name: "assignedPerson", description: "Assigned person" },
    { name: "plCreating", description: "PL creator" },
    { name: "operationOfficerName", description: "Operation officer" },
  ],
  "Equipment Fields": [
    { name: "forklift1", description: "Forklift 1 ID" },
    { name: "forklift2", description: "Forklift 2 ID" },
    { name: "putawayForklift1", description: "Putaway Forklift 1" },
    { name: "putawayForklift2", description: "Putaway Forklift 2" },
    { name: "assetId", description: "Our equipment ID" },
    { name: "assetType", description: "Equipment type" },
  ],
  "Vehicle Fields (Truck)": [
    { name: "vehicleId", description: "Truck plate number" },
    { name: "truckDriverName", description: "Truck driver name" },
    {
      name: "vehicleType",
      description: "Vehicle type (Container/Truck/Trailer)",
    },
    { name: "transporterName", description: "Transporter name" },
  ],
  "Quantity Fields": [
    { name: "totalItems", description: "Number of items" },
    { name: "receivedQuantity", description: "Quantity received" },
    { name: "receivedWeight", description: "Weight in KG" },
    { name: "receivedItems", description: "Number of items received" },
    { name: "numOfPlt", description: "Number of pallets" },
  ],
  "Status Fields": [
    { name: "status", description: "Document status" },
    { name: "processStatus", description: "Processing status" },
    { name: "qcCheckStatus", description: "QC check status" },
    { name: "plStatus", description: "PL status" },
  ],
  "Overtime Fields": [
    { name: "employeeStandardHours", description: "Employee standard hours" },
    { name: "employeeOvertimeHours", description: "Employee overtime hours" },
    { name: "equipmentStandardHours", description: "Equipment standard hours" },
    { name: "equipmentOvertimeHours", description: "Equipment overtime hours" },
  ],
};

const FORMULA_TEMPLATES = [
  // Single document formulas (for SLA/KPI per document)
  { name: "Offloading Duration", formula: "offloadingDuration" },
  { name: "Putaway Duration", formula: "putawayDuration" },
  { name: "Picking Duration", formula: "pickingDuration" },
  { name: "QC Duration", formula: "qcDuration" },
  { name: "Dispatching Duration", formula: "dispatchingDuration" },
  { name: "Duration 1 (ASN→GR or Order→Picking)", formula: "duration1" },
  { name: "Duration 2 (GR→Putaway or Picking→Dispatch)", formula: "duration2" },
  { name: "Total Processing Time", formula: "duration1 + duration2" },
  { name: "Employee Overtime Hours", formula: "employeeOvertimeHours" },
  { name: "Equipment Overtime Hours", formula: "equipmentOvertimeHours" },
  // Aggregate formulas (for reporting across multiple documents)
  {
    name: "Average Offloading Time (Aggregate)",
    formula: "AVG(offloadingDuration)",
  },
  { name: "Average Putaway Time (Aggregate)", formula: "AVG(putawayDuration)" },
  { name: "Average Picking Time (Aggregate)", formula: "AVG(pickingDuration)" },
  {
    name: "Total Putaway Hours (Aggregate)",
    formula: "SUM(putawayDuration) / 3600",
  },
  {
    name: "Items Processed per Hour (Aggregate)",
    formula:
      "SUM(totalItems) / (SUM(offloadingDuration + putawayDuration) / 3600)",
  },
  {
    name: "Total Employee Overtime (Aggregate)",
    formula: "SUM(employeeOvertimeHours)",
  },
  {
    name: "Equipment Utilization (Aggregate)",
    formula: "SUM(equipmentStandardHours + equipmentOvertimeHours)",
  },
  { name: "Average QC Time (Aggregate)", formula: "AVG(qcDuration)" },
  {
    name: "Average Dispatching Time (Aggregate)",
    formula: "AVG(dispatchingDuration)",
  },
];

interface FormulaBuilderProps {
  value: string;
  onChange: (formula: string) => void;
  onValidate?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
}

export default function FormulaBuilder({
  value,
  onChange,
  onValidate,
  placeholder,
}: FormulaBuilderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const insertField = (fieldName: string) => {
    const newFormula = value ? `${value} ${fieldName}` : fieldName;
    onChange(newFormula);
    setShowFieldPicker(false);
    validateFormula(newFormula);
  };

  const insertTemplate = (formula: string) => {
    onChange(formula);
    setShowTemplates(false);
    validateFormula(formula);
  };

  const validateFormula = (formula: string) => {
    if (!formula.trim()) {
      setValidationError(null);
      onValidate?.(true);
      return true;
    }

    // Basic validation - check if fields exist
    const fieldNames = Object.values(AVAILABLE_FIELDS)
      .flat()
      .map((f) => f.name);

    // Extract potential field names (words that aren't operators)
    const operators = [
      "AVG",
      "SUM",
      "COUNT",
      "MAX",
      "MIN",
      "WHERE",
      "AND",
      "OR",
      "+",
      "-",
      "*",
      "/",
      "(",
      ")",
      "=",
    ];
    const formulaWords = formula.match(/\b\w+\b/g) || [];
    const invalidFields = formulaWords.filter(
      (f) => !operators.includes(f.toUpperCase()) && !fieldNames.includes(f),
    );

    if (invalidFields.length > 0) {
      const error = `Invalid fields: ${invalidFields.join(", ")}`;
      setValidationError(error);
      onValidate?.(false, error);
      return false;
    }

    setValidationError(null);
    onValidate?.(true);
    return true;
  };

  useEffect(() => {
    validateFormula(value);
  }, [value]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowFieldPicker(!showFieldPicker);
            setShowTemplates(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showFieldPicker
              ? "bg-blue-600 text-white"
              : "bg-[#1f2937] border border-[#374151] text-[#9ca3af] hover:text-white hover:bg-[#374151]"
          }`}
        >
          <i className="ri-list-check text-base"></i>
          Field Picker
        </button>
        <button
          type="button"
          onClick={() => {
            setShowTemplates(!showTemplates);
            setShowFieldPicker(false);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showTemplates
              ? "bg-green-600 text-white"
              : "bg-[#1f2937] border border-[#374151] text-[#9ca3af] hover:text-white hover:bg-[#374151]"
          }`}
        >
          <i className="ri-file-list-3-line text-base"></i>
          Templates
        </button>
      </div>

      <AnimatePresence>
        {showFieldPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1f2937] border border-[#374151] rounded-lg p-4 max-h-96 overflow-y-auto"
          >
            {Object.entries(AVAILABLE_FIELDS).map(([category, fields]) => (
              <div key={category} className="mb-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <i className="ri-folder-line text-blue-400"></i>
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {fields.map((field) => (
                    <button
                      key={field.name}
                      type="button"
                      onClick={() => insertField(field.name)}
                      className="text-left px-3 py-2 bg-[#111827] border border-[#374151] rounded hover:border-blue-500 hover:bg-[#1f2937] transition-colors"
                    >
                      <div className="text-cyan-400 font-mono text-sm font-medium">
                        {field.name}
                      </div>
                      <div className="text-[#9ca3af] text-xs mt-1">
                        {field.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1f2937] border border-[#374151] rounded-lg p-4"
          >
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <i className="ri-file-list-3-line text-green-400"></i>
              Pre-built Formulas
            </h4>
            <div className="space-y-2">
              {FORMULA_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => insertTemplate(template.formula)}
                  className="w-full text-left px-3 py-2 bg-[#111827] border border-[#374151] rounded hover:border-green-500 hover:bg-[#1f2937] transition-colors"
                >
                  <div className="text-white font-medium text-sm">
                    {template.name}
                  </div>
                  <div className="text-cyan-400 font-mono text-xs mt-1">
                    {template.formula}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Formula
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              validateFormula(e.target.value);
            }}
            className={`w-full bg-[#0F172A] border rounded-lg px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 transition-all ${
              validationError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-[#334155] focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder={
              placeholder ||
              "e.g., AVG(offloadingDuration) or SUM(employeeOvertimeHours)"
            }
          />
          {validationError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <i
                className="ri-error-warning-line text-red-400 text-lg"
                title={validationError}
              ></i>
            </div>
          )}
        </div>
        {validationError ? (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <i className="ri-error-warning-line"></i>
            {validationError}
          </p>
        ) : (
          <p className="text-gray-500 text-xs mt-1">
            Click "Field Picker" to see all available fields, or "Templates" for
            pre-built formulas
          </p>
        )}
      </div>
    </div>
  );
}
