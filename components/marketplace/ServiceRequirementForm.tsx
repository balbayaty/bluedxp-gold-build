/**
 * Comprehensive Service Requirement Form
 * World-class form with smart detection, validation, and completeness tracking
 * Supports ALL service categories with full data collection
 */

"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronDown,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Building2,
  Users,
  Languages,
  Network,
  FileText,
  Upload,
  Mic,
  Sparkles,
  Target,
  Save,
  RefreshCw,
  Keyboard,
  X,
} from "lucide-react";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import type { ServiceRequirement } from "@/types/marketplace-requirements";
import { aiMatchingService } from "@/lib/services/marketplace/aiMatchingService";
import SmartFieldSuggestions from "./SmartFieldSuggestions";
import EnhancedLocationPicker from "./EnhancedLocationPicker";
import TimelineVisualization from "./TimelineVisualization";
import PriceCalculator from "./PriceCalculator";
import EnhancedFileUpload from "./EnhancedFileUpload";
import RealtimeMatchingPreview from "./RealtimeMatchingPreview";
import {
  TransportationFields,
  FreightFields,
  ConsultingFields,
  ManpowerFields,
  TranslationFields,
  CrossDockingFields,
  WarehouseNetworkFields,
  TimelineFields,
  BudgetFields,
  RequirementsFields,
} from "./ServiceRequirementFormFields";

const VoiceInput = lazy(() => import("./VoiceInput"));
const RichTextEditor = lazy(() => import("./RichTextEditor"));

interface ServiceRequirementFormProps {
  category: string;
  onSubmit: (requirement: ServiceRequirement) => void;
  onCancel?: () => void;
  initialData?: Partial<ServiceRequirement>;
}

export default function ServiceRequirementForm({
  category,
  onSubmit,
  onCancel,
  initialData,
}: ServiceRequirementFormProps) {
  const [step, setStep] = useState(1);
  const [requirement, setRequirement] = useState<Partial<ServiceRequirement>>(
    initialData || {
      category,
      urgency: "MEDIUM",
      timeline: { flexible: false },
      location: { multipleLocations: false },
    },
  );
  const [completeness, setCompleteness] = useState<{
    score: number;
    missing: string[];
  }>({ score: 0, missing: [] });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic"]),
  );
  const [showMatchingPreview, setShowMatchingPreview] = useState(false);
  const [matchingPreview, setMatchingPreview] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const calculateCompleteness = useCallback(async () => {
    try {
      const result = await aiMatchingService.findMatches(
        requirement as ServiceRequirement,
      );
      setCompleteness({
        score: result.completeness.completeness,
        missing: result.completeness.missingFields,
      });
    } catch (error) {
      // Calculate manually if service unavailable
      const required = getRequiredFields(category);
      const filled = required.filter((field) => hasField(requirement, field));
      setCompleteness({
        score: (filled.length / required.length) * 100,
        missing: required.filter((field) => !hasField(requirement, field)),
      });
    }
  }, [requirement, category]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (Object.keys(requirement).length > 1) {
        saveToLocalStorage();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [requirement]);

  // Load from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [category]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveToLocalStorage();
      }
      // Ctrl/Cmd + ? to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveToLocalStorage = useCallback(() => {
    try {
      setAutoSaveStatus("saving");
      const key = `marketplace_requirement_${category}_${new Date().toISOString().split("T")[0]}`;
      localStorage.setItem(key, JSON.stringify(requirement));
      setAutoSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus("error");
    }
  }, [requirement, category]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const key = `marketplace_requirement_${category}_${new Date().toISOString().split("T")[0]}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRequirement((prev) => ({ ...prev, ...parsed }));
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Load from localStorage error:", error);
    }
  }, [category]);

  useEffect(() => {
    calculateCompleteness();
  }, [calculateCompleteness]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handlePreviewMatching = async () => {
    setShowMatchingPreview(true);
    try {
      const result = await aiMatchingService.findMatches(
        requirement as ServiceRequirement,
      );
      setMatchingPreview(result);
    } catch (error) {
      console.error("Preview matching failed:", error);
    }
  };

  const handleSubmit = () => {
    if (completeness.score >= 80) {
      onSubmit(requirement as ServiceRequirement);
    } else {
      alert(
        `Please complete more fields. Current completeness: ${Math.round(completeness.score)}%`,
      );
    }
  };

  const renderCategorySpecificFields = () => {
    switch (category) {
      case "STORAGE":
        return (
          <StorageFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "TRANSPORTATION":
        return (
          <TransportationFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "FREIGHT":
        return (
          <FreightFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "CONSULTING":
        return (
          <ConsultingFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "MANPOWER":
        return (
          <ManpowerFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "TRANSLATION":
        return (
          <TranslationFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "CROSSDOCKING":
        return (
          <CrossDockingFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      case "WAREHOUSE_NETWORK":
        return (
          <WarehouseNetworkFields
            requirement={requirement}
            setRequirement={setRequirement}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Service Requirement Form
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete all fields for accurate AI-powered matching
          </p>
        </motion.div>

        {/* Completeness Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  completeness.score >= 80
                    ? "bg-green-100 dark:bg-green-900"
                    : completeness.score >= 60
                      ? "bg-yellow-100 dark:bg-yellow-900"
                      : "bg-red-100 dark:bg-red-900"
                }`}
              >
                {completeness.score >= 80 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Completeness Score</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {completeness.score >= 80
                    ? "Ready for matching"
                    : completeness.score >= 60
                      ? "Almost ready"
                      : "More information needed"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {Math.round(completeness.score)}%
              </div>
              <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                <motion.div
                  className={`h-full ${
                    completeness.score >= 80
                      ? "bg-green-500"
                      : completeness.score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness.score}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {completeness.missing.length > 0 && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Missing Fields:
              </p>
              <div className="flex flex-wrap gap-2">
                {completeness.missing.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Form Sections */}
        <div className="space-y-4">
          {/* Basic Information */}
          <FormSection
            title="Basic Information"
            icon={FileText}
            expanded={expandedSections.has("basic")}
            onToggle={() => toggleSection("basic")}
            required
          >
            <div className="space-y-4">
              <BasicFields
                requirement={requirement}
                setRequirement={setRequirement}
              />
              <Suspense fallback={null}>
                <SmartFieldSuggestions
                  category={category}
                  currentFields={requirement}
                  onSuggestionAccept={(field, value) => {
                    setRequirement({ ...requirement, [field]: value });
                  }}
                />
              </Suspense>
            </div>
          </FormSection>

          {/* Category-Specific Fields */}
          <FormSection
            title={`${category} Specific Requirements`}
            icon={getCategoryIcon(category)}
            expanded={expandedSections.has("category")}
            onToggle={() => toggleSection("category")}
            required
          >
            {renderCategorySpecificFields()}
          </FormSection>

          {/* Location */}
          <FormSection
            title="Location Details"
            icon={MapPin}
            expanded={expandedSections.has("location")}
            onToggle={() => toggleSection("location")}
            required
          >
            <EnhancedLocationPicker
              value={requirement.location}
              onChange={(location) =>
                setRequirement({ ...requirement, location })
              }
              label="Service Location"
              required
            />
          </FormSection>

          {/* Timeline */}
          <FormSection
            title="Timeline & Schedule"
            icon={Calendar}
            expanded={expandedSections.has("timeline")}
            onToggle={() => toggleSection("timeline")}
            required
          >
            <div className="space-y-4">
              <TimelineFields
                requirement={requirement}
                setRequirement={setRequirement}
              />
              <Suspense
                fallback={
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    Loading timeline...
                  </div>
                }
              >
                <TimelineVisualization
                  timeline={requirement.timeline || {}}
                  onTimelineChange={(timeline) =>
                    setRequirement({ ...requirement, timeline })
                  }
                />
              </Suspense>
            </div>
          </FormSection>

          {/* Budget with Price Calculator */}
          <FormSection
            title="Budget & Pricing"
            icon={DollarSign}
            expanded={expandedSections.has("budget")}
            onToggle={() => toggleSection("budget")}
          >
            <div className="space-y-4">
              <Suspense
                fallback={
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    Loading calculator...
                  </div>
                }
              >
                <PriceCalculator
                  requirement={requirement}
                  category={category}
                  onPriceUpdate={(price) => {
                    setRequirement({
                      ...requirement,
                      budget: { ...requirement.budget, ...price },
                    });
                  }}
                />
              </Suspense>
              <BudgetFields
                requirement={requirement}
                setRequirement={setRequirement}
              />
            </div>
          </FormSection>

          {/* Special Requirements */}
          <FormSection
            title="Special Requirements & Compliance"
            icon={CheckCircle2}
            expanded={expandedSections.has("requirements")}
            onToggle={() => toggleSection("requirements")}
          >
            <RequirementsFields
              requirement={requirement}
              setRequirement={setRequirement}
            />
          </FormSection>

          {/* File Attachments */}
          <FormSection
            title="Supporting Documents & Files"
            icon={Upload}
            expanded={expandedSections.has("attachments")}
            onToggle={() => toggleSection("attachments")}
          >
            <Suspense
              fallback={
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  Loading upload...
                </div>
              }
            >
              <EnhancedFileUpload
                value={attachments as any}
                onChange={(files) => setAttachments(files)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                maxFiles={10}
                maxSizeMB={10}
                label="Upload Supporting Documents"
                description="Upload contracts, specifications, photos, or other relevant documents"
                showPreview={true}
              />
            </Suspense>
          </FormSection>

          {/* Real-Time Matching Preview */}
          <FormSection
            title="Live Matching Preview"
            icon={Sparkles}
            expanded={expandedSections.has("matching")}
            onToggle={() => toggleSection("matching")}
          >
            <Suspense
              fallback={
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  Loading matches...
                </div>
              }
            >
              <RealtimeMatchingPreview
                requirement={requirement}
                category={category}
                onMatchSelect={(matchId) => {
                  window.location.href = `/marketplace/matching/${matchId}`;
                }}
              />
            </Suspense>
          </FormSection>
        </div>

        {/* Auto-Save Status */}
        <AnimatePresence>
          {autoSaveStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <div
                className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
                  autoSaveStatus === "saved"
                    ? "bg-green-500 text-white"
                    : autoSaveStatus === "saving"
                      ? "bg-blue-500 text-white"
                      : "bg-red-500 text-white"
                }`}
              >
                {autoSaveStatus === "saved" && (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {autoSaveStatus === "saving" && (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
                {autoSaveStatus === "error" && (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {autoSaveStatus === "saved" && "Auto-saved"}
                  {autoSaveStatus === "saving" && "Saving..."}
                  {autoSaveStatus === "error" && "Save failed"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            {lastSaved && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Keyboard Shortcuts (Ctrl+/)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <button
              onClick={saveToLocalStorage}
              className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          </div>

          <div className="flex gap-4">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handlePreviewMatching}
              className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Preview Matching
            </button>
            <button
              onClick={handleSubmit}
              disabled={completeness.score < 80}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                completeness.score >= 80
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit & Find Matches
            </button>
          </div>
        </motion.div>

        {/* Matching Preview Modal */}
        <AnimatePresence>
          {showMatchingPreview && matchingPreview && (
            <MatchingPreviewModal
              result={matchingPreview}
              onClose={() => setShowMatchingPreview(false)}
            />
          )}
        </AnimatePresence>

        {/* Keyboard Shortcuts Modal */}
        <AnimatePresence>
          {showKeyboardShortcuts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowKeyboardShortcuts(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Keyboard Shortcuts
                  </h3>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { key: "Ctrl/Cmd + S", desc: "Save draft" },
                    { key: "Ctrl/Cmd + /", desc: "Show shortcuts" },
                    { key: "Esc", desc: "Close modals" },
                  ].map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded"
                    >
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {shortcut.desc}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper Components
function FormSection({
  title,
  icon: Icon,
  expanded,
  onToggle,
  required,
  children,
}: {
  title: string;
  icon: any;
  expanded: boolean;
  onToggle: () => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {title}
              {required && <span className="text-red-500 text-sm">*</span>}
            </h3>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// COMPREHENSIVE FIELD COMPONENTS - FULL IMPLEMENTATIONS
// ============================================================================

function BasicFields({ requirement, setRequirement }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
            Urgency <span className="text-red-500">*</span>
          </label>
          <select
            value={requirement.urgency || "MEDIUM"}
            onChange={(e) =>
              setRequirement({ ...requirement, urgency: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="LOW">Low - No immediate rush</option>
            <option value="MEDIUM">Medium - Standard timeline</option>
            <option value="HIGH">High - Priority needed</option>
            <option value="URGENT">Urgent - Immediate attention</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            How urgent is your service requirement?
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes / Additional Information
            </label>
            <Suspense fallback={null}>
              <VoiceInput
                onTranscript={(text) => {
                  setRequirement({
                    ...requirement,
                    notes: (requirement.notes || "") + " " + text,
                  });
                }}
                language="en-US"
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <textarea
                value={requirement.notes || ""}
                onChange={(e) =>
                  setRequirement({ ...requirement, notes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="Enter additional information..."
              />
            }
          >
            <RichTextEditor
              value={requirement.notes || ""}
              onChange={(value) =>
                setRequirement({ ...requirement, notes: value })
              }
              placeholder="Enter detailed notes and additional information..."
              minHeight="150px"
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function StorageFields({ requirement, setRequirement }: any) {
  const req = requirement as any;
  const storageReq = req as any;

  return (
    <div className="space-y-6">
      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
          Storage Service Type <span className="text-red-500">*</span>
        </label>
        <select
          value={storageReq.serviceType || ""}
          onChange={(e) =>
            setRequirement({ ...requirement, serviceType: e.target.value })
          }
          className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select storage type...</option>
          <option value="GENERAL_STORAGE">General Storage</option>
          <option value="COLD_STORAGE">Cold Storage (Refrigerated)</option>
          <option value="HAZMAT_STORAGE">
            Hazmat Storage (Hazardous Materials)
          </option>
          <option value="BONDED_STORAGE">Bonded Storage (Customs)</option>
          <option value="BULK_STORAGE">Bulk Storage</option>
          <option value="RACK_STORAGE">Rack Storage</option>
          <option value="OPEN_YARD">Open Yard Storage</option>
          <option value="TEMPORARY_STORAGE">Temporary Storage</option>
          <option value="LONG_TERM_STORAGE">Long-Term Storage</option>
        </select>
      </div>

      {/* Capacity Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Capacity Requirements <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Capacity Unit
            </label>
            <select
              value={storageReq.capacity?.unit || "CUBIC_METERS"}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  capacity: { ...storageReq.capacity, unit: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="CUBIC_METERS">Cubic Meters (m³)</option>
              <option value="SQUARE_METERS">Square Meters (m²)</option>
              <option value="PALLETS">Pallets</option>
              <option value="TONS">Tons</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Capacity
            </label>
            <input
              type="number"
              value={
                storageReq.capacity?.volume ||
                storageReq.capacity?.area ||
                storageReq.capacity?.pallets ||
                storageReq.capacity?.weight ||
                ""
              }
              onChange={(e) => {
                const unit = storageReq.capacity?.unit || "CUBIC_METERS";
                const update: any = { ...storageReq.capacity, unit };
                if (unit === "CUBIC_METERS")
                  update.volume = Number(e.target.value);
                else if (unit === "SQUARE_METERS")
                  update.area = Number(e.target.value);
                else if (unit === "PALLETS")
                  update.pallets = Number(e.target.value);
                else if (unit === "TONS")
                  update.weight = Number(e.target.value);
                setRequirement({ ...requirement, capacity: update });
              }}
              placeholder="Enter capacity"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={storageReq.capacity?.growthExpected || false}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  capacity: {
                    ...storageReq.capacity,
                    growthExpected: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm">
              Growth Expected (May need more capacity later)
            </span>
          </label>
          {storageReq.capacity?.growthExpected && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Peak Capacity
              </label>
              <input
                type="number"
                value={storageReq.capacity?.peakCapacity || ""}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    capacity: {
                      ...storageReq.capacity,
                      peakCapacity: Number(e.target.value),
                    },
                  })
                }
                placeholder="Peak capacity needed"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* Material Details */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Material Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Material Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Electronics",
                "Food & Beverages",
                "Chemicals",
                "Textiles",
                "Machinery",
                "Pharmaceuticals",
                "Automotive",
                "Other",
              ].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
                >
                  <input
                    type="checkbox"
                    checked={
                      storageReq.materials?.type?.includes(type) || false
                    }
                    onChange={(e) => {
                      const types = storageReq.materials?.type || [];
                      const newTypes = e.target.checked
                        ? [...types, type]
                        : types.filter((t: string) => t !== type);
                      setRequirement({
                        ...requirement,
                        materials: { ...storageReq.materials, type: newTypes },
                      });
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <input
                type="checkbox"
                checked={storageReq.materials?.hazardous || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    materials: {
                      ...storageReq.materials,
                      hazardous: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Hazardous Materials</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <input
                type="checkbox"
                checked={storageReq.materials?.temperatureControlled || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    materials: {
                      ...storageReq.materials,
                      temperatureControlled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">
                Temperature Controlled
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <input
                type="checkbox"
                checked={storageReq.materials?.humidityControlled || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    materials: {
                      ...storageReq.materials,
                      humidityControlled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium">Humidity Controlled</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Special Handling Requirements
            </label>
            <textarea
              value={storageReq.materials?.specialHandling?.join(", ") || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  materials: {
                    ...storageReq.materials,
                    specialHandling: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                })
              }
              placeholder="e.g., Fragile handling, No stacking, Special packaging..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Operational Requirements */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Network className="w-4 h-4" />
          Operational Requirements
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { key: "inventoryManagement", label: "Inventory Management" },
            { key: "realTimeTracking", label: "Real-Time Tracking" },
            { key: "reporting", label: "Reporting" },
            { key: "handling", label: "Material Handling" },
            { key: "packaging", label: "Packaging" },
            { key: "labeling", label: "Labeling" },
          ].map((op) => (
            <label
              key={op.key}
              className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded"
            >
              <input
                type="checkbox"
                checked={storageReq.operations?.[op.key] || false}
                onChange={(e) =>
                  setRequirement({
                    ...requirement,
                    operations: {
                      ...storageReq.operations,
                      [op.key]: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">{op.label}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Access Hours
            </label>
            <select
              value={storageReq.operations?.accessHours || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...storageReq.operations,
                    accessHours: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select access hours...</option>
              <option value="24/7">24/7 Access</option>
              <option value="Business Hours">
                Business Hours (8 AM - 6 PM)
              </option>
              <option value="Extended">Extended Hours (6 AM - 10 PM)</option>
              <option value="Weekdays">Weekdays Only</option>
              <option value="Custom">Custom Schedule</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Security Level
            </label>
            <select
              value={storageReq.operations?.securityLevel || "STANDARD"}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  operations: {
                    ...storageReq.operations,
                    securityLevel: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="STANDARD">Standard Security</option>
              <option value="HIGH">High Security</option>
              <option value="MAXIMUM">Maximum Security</option>
            </select>
          </div>
        </div>
      </div>

      {/* Service Level */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
        <h4 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Service Level Requirements
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Inbound Frequency
            </label>
            <select
              value={storageReq.serviceLevel?.inboundFrequency || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...storageReq.serviceLevel,
                    inboundFrequency: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select frequency...</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="ON_DEMAND">On Demand</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Outbound Frequency
            </label>
            <select
              value={storageReq.serviceLevel?.outboundFrequency || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...storageReq.serviceLevel,
                    outboundFrequency: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              <option value="">Select frequency...</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="ON_DEMAND">On Demand</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Response Time (hours)
            </label>
            <input
              type="number"
              value={storageReq.serviceLevel?.responseTime || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...storageReq.serviceLevel,
                    responseTime: Number(e.target.value),
                  },
                })
              }
              placeholder="e.g., 24"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Minimum Commitment (months)
            </label>
            <input
              type="number"
              value={storageReq.serviceLevel?.minimumCommitment || ""}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  serviceLevel: {
                    ...storageReq.serviceLevel,
                    minimumCommitment: Number(e.target.value),
                  },
                })
              }
              placeholder="e.g., 6"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// All field components are now imported from ServiceRequirementFormFields.tsx

function MatchingPreviewModal({ result, onClose }: any) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold">Matching Preview</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Top matches found
          </p>
        </div>
        <div className="p-6">
          {result.matches?.slice(0, 3).map((match: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    {match.listing.title || "Service"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    Match Score: {match.matchScore}%
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {match.matchScore}%
                  </div>
                  <div className="text-sm text-slate-500">Confidence</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Helper functions
function getCategoryIcon(category: string) {
  const icons: Record<string, any> = {
    STORAGE: Building2,
    TRANSPORTATION: Truck,
    FREIGHT: Package,
    CONSULTING: Users,
    MANPOWER: Users,
    TRANSLATION: Languages,
    CROSSDOCKING: Network,
    WAREHOUSE_NETWORK: Network,
  };
  return icons[category] || FileText;
}

function getRequiredFields(category: string): string[] {
  const fields: Record<string, string[]> = {
    STORAGE: ["location", "capacity", "timeline"],
    TRANSPORTATION: ["route", "cargo", "timeline"],
    FREIGHT: ["route", "cargo", "timeline"],
    CONSULTING: ["project", "consultant", "serviceLevel"],
    MANPOWER: ["staff", "employment", "serviceLevel"],
    TRANSLATION: ["translation", "serviceLevel"],
    CROSSDOCKING: ["facility", "volume", "operations"],
    WAREHOUSE_NETWORK: ["network", "operations", "capacity"],
  };
  return fields[category] || [];
}

function hasField(obj: any, field: string): boolean {
  const parts = field.split(".");
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return false;
    }
  }
  return current !== undefined && current !== null && current !== "";
}
