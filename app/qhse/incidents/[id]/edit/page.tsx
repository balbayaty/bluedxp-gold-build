/**
 * QHSE Incident Edit Page
 * 
 * Comprehensive form for editing incidents with all fields
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from "@/types/qhse";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SaveStatus, UnsavedChangesWarning } from "@/components/ui/FormActions";

const INCIDENT_TYPES: { value: IncidentType; label: string; icon: string }[] = [
  { value: "INJURY", label: "Injury", icon: "ri-heart-pulse-line" },
  { value: "ILLNESS", label: "Illness", icon: "ri-virus-line" },
  { value: "NEAR_MISS", label: "Near Miss", icon: "ri-error-warning-line" },
  { value: "PROPERTY_DAMAGE", label: "Property Damage", icon: "ri-building-line" },
  { value: "ENVIRONMENTAL", label: "Environmental", icon: "ri-plant-line" },
  { value: "FIRE", label: "Fire", icon: "ri-fire-line" },
  { value: "CHEMICAL_SPILL", label: "Chemical Spill", icon: "ri-flask-line" },
  { value: "VEHICLE_ACCIDENT", label: "Vehicle Accident", icon: "ri-car-line" },
  { value: "SLIP_TRIP_FALL", label: "Slip/Trip/Fall", icon: "ri-footprint-line" },
  { value: "ELECTRICAL", label: "Electrical", icon: "ri-flashlight-line" },
  { value: "MACHINERY", label: "Machinery", icon: "ri-settings-3-line" },
  { value: "SECURITY", label: "Security", icon: "ri-shield-line" },
  { value: "OTHER", label: "Other", icon: "ri-question-line" },
];

const SEVERITIES: { value: IncidentSeverity; label: string; color: string; description: string }[] = [
  { value: "NEAR_MISS", label: "Near Miss", color: "bg-blue-500", description: "No injury or damage, potential hazard identified" },
  { value: "MINOR", label: "Minor", color: "bg-yellow-500", description: "First aid only, minimal property damage" },
  { value: "MODERATE", label: "Moderate", color: "bg-orange-500", description: "Medical treatment required, significant damage" },
  { value: "SERIOUS", label: "Serious", color: "bg-red-500", description: "Lost time injury, major damage" },
  { value: "SEVERE", label: "Severe", color: "bg-red-700", description: "Permanent disability, extensive damage" },
  { value: "FATAL", label: "Fatal", color: "bg-gray-900", description: "Fatality, catastrophic damage" },
];

const STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: "REPORTED", label: "Reported" },
  { value: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { value: "INVESTIGATION_COMPLETE", label: "Investigation Complete" },
  { value: "CORRECTIVE_ACTIONS_IN_PROGRESS", label: "Corrective Actions In Progress" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
];

const STEPS = [
  { id: 0, title: "Basic Info", icon: "ri-information-line" },
  { id: 1, title: "Location", icon: "ri-map-pin-line" },
  { id: 2, title: "People", icon: "ri-group-line" },
  { id: 3, title: "Details", icon: "ri-file-text-line" },
  { id: 4, title: "Compliance", icon: "ri-shield-check-line" },
  { id: 5, title: "Review", icon: "ri-checkbox-circle-line" },
];

interface FormData {
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  occurredAt: string;
  reportedBy: string;
  category: string;
  subCategory: string;
  shift: string;
  weatherConditions: string;
  equipmentInvolved: string;
  immediateActions: string;
  location: {
    name: string;
    facility: string;
    building: string;
    floor: string;
    zone: string;
    specificLocation: string;
    coordinates?: { lat: number; lng: number };
  };
  peopleInvolved: Array<{
    name: string;
    role: string;
    employeeId: string;
    department: string;
    involvementType: string;
    injuryDescription?: string;
  }>;
  witnessStatements: Array<{
    witnessName: string;
    statement: string;
    contact: string;
    anonymous: boolean;
  }>;
  oshaRecordable: boolean;
  oshaClassification: string;
  oshaCaseNumber: string;
  daysAwayFromWork: number;
  daysRestrictedTransfer: number;
  riddorReportable: boolean;
  riddorCategory: string;
  estimatedCost: number;
  lostWorkHours: number;
  insuranceClaim: boolean;
}

export default function EditIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;
  const { hasModuleAccess, canPerformAction } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Notifications
  const { notification, showSuccess, showError, showWarning, clearNotification } = useNotifications();
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "OTHER",
    severity: "MINOR",
    status: "REPORTED",
    description: "",
    occurredAt: "",
    reportedBy: "",
    category: "",
    subCategory: "",
    shift: "",
    weatherConditions: "",
    equipmentInvolved: "",
    immediateActions: "",
    location: {
      name: "",
      facility: "",
      building: "",
      floor: "",
      zone: "",
      specificLocation: "",
    },
    peopleInvolved: [],
    witnessStatements: [],
    oshaRecordable: false,
    oshaClassification: "",
    oshaCaseNumber: "",
    daysAwayFromWork: 0,
    daysRestrictedTransfer: 0,
    riddorReportable: false,
    riddorCategory: "",
    estimatedCost: 0,
    lostWorkHours: 0,
    insuranceClaim: false,
  });

  const canEdit = canPerformAction("qhse", "qhse.incidents", undefined, "write");

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  const loadIncident = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`);
      if (!response.ok) throw new Error("Incident not found");
      const data = await response.json();
      if (data.success && data.data) {
        const incident = data.data;
        setFormData({
          title: incident.title || "",
          type: incident.type || "OTHER",
          severity: incident.severity || "MINOR",
          status: incident.status || "REPORTED",
          description: incident.description || "",
          occurredAt: incident.occurredAt ? new Date(incident.occurredAt).toISOString().slice(0, 16) : "",
          reportedBy: incident.reportedBy || "",
          category: incident.category || "",
          subCategory: incident.subCategory || "",
          shift: incident.shift || "",
          weatherConditions: incident.weatherConditions || "",
          equipmentInvolved: incident.equipmentInvolved || "",
          immediateActions: incident.immediateActions || "",
          location: {
            name: incident.location?.name || "",
            facility: incident.location?.facility || "",
            building: incident.location?.building || "",
            floor: incident.location?.floor || "",
            zone: incident.location?.zone || "",
            specificLocation: incident.location?.specificLocation || "",
            coordinates: incident.location?.coordinates,
          },
          peopleInvolved: incident.peopleInvolved || [],
          witnessStatements: incident.witnessStatements || [],
          oshaRecordable: incident.oshaRecordable || false,
          oshaClassification: incident.oshaClassification || "",
          oshaCaseNumber: incident.oshaCaseNumber || "",
          daysAwayFromWork: incident.daysAwayFromWork || 0,
          daysRestrictedTransfer: incident.daysRestrictedTransfer || 0,
          riddorReportable: incident.riddorReportable || false,
          riddorCategory: incident.riddorCategory || "",
          estimatedCost: incident.estimatedCost || 0,
          lostWorkHours: incident.lostWorkHours || 0,
          insuranceClaim: incident.insuranceClaim || false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/qhse/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to save");
      router.push(`/qhse/incidents/${incidentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split(".");
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addPerson = () => {
    setFormData(prev => ({
      ...prev,
      peopleInvolved: [...prev.peopleInvolved, { name: "", role: "", employeeId: "", department: "", involvementType: "" }],
    }));
  };

  const removePerson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      peopleInvolved: prev.peopleInvolved.filter((_, i) => i !== index),
    }));
  };

  const addWitness = () => {
    setFormData(prev => ({
      ...prev,
      witnessStatements: [...prev.witnessStatements, { witnessName: "", statement: "", contact: "", anonymous: false }],
    }));
  };

  const removeWitness = (index: number) => {
    setFormData(prev => ({
      ...prev,
      witnessStatements: prev.witnessStatements.filter((_, i) => i !== index),
    }));
  };

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-fill text-5xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <Link href={`/qhse/incidents/${incidentId}`} className="text-blue-600 hover:underline">View Incident</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/qhse/incidents/${incidentId}`} className="text-gray-500 hover:text-gray-700">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Incident</h1>
                <p className="text-sm text-gray-500">{formData.title || "Untitled"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/qhse/incidents/${incidentId}`} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
                Save Changes
              </button>
            </div>
          </div>

          {/* Steps */}
          <div className="mt-6 flex items-center overflow-x-auto pb-2">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeStep === step.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <i className={step.icon}></i>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <i className="ri-error-warning-line mr-2"></i>{error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            {/* Step 0: Basic Info */}
            {activeStep === 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-information-line text-blue-600"></i>
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Brief description of the incident"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => updateField("type", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {INCIDENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.occurredAt}
                      onChange={(e) => updateField("occurredAt", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reported By</label>
                    <input
                      type="text"
                      value={formData.reportedBy}
                      onChange={(e) => updateField("reportedBy", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Name of reporter"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Severity *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SEVERITIES.map((sev) => (
                      <button
                        key={sev.value}
                        type="button"
                        onClick={() => updateField("severity", sev.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.severity === sev.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${sev.color} mb-2`}></div>
                        <div className="font-medium text-gray-900 dark:text-white">{sev.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{sev.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Detailed description of what happened..."
                  />
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-map-pin-line text-blue-600"></i>
                  Location Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name</label>
                    <input
                      type="text"
                      value={formData.location.name}
                      onChange={(e) => updateField("location.name", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="e.g., Main Warehouse"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facility</label>
                    <input
                      type="text"
                      value={formData.location.facility}
                      onChange={(e) => updateField("location.facility", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Facility name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Building</label>
                    <input
                      type="text"
                      value={formData.location.building}
                      onChange={(e) => updateField("location.building", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Building name or number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                    <input
                      type="text"
                      value={formData.location.floor}
                      onChange={(e) => updateField("location.floor", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Floor level"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone/Area</label>
                    <input
                      type="text"
                      value={formData.location.zone}
                      onChange={(e) => updateField("location.zone", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Zone or area"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specific Location</label>
                    <input
                      type="text"
                      value={formData.location.specificLocation}
                      onChange={(e) => updateField("location.specificLocation", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Specific location details"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Additional Context</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift</label>
                      <select
                        value={formData.shift}
                        onChange={(e) => updateField("shift", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="">Select shift</option>
                        <option value="MORNING">Morning (6AM-2PM)</option>
                        <option value="AFTERNOON">Afternoon (2PM-10PM)</option>
                        <option value="NIGHT">Night (10PM-6AM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weather</label>
                      <input
                        type="text"
                        value={formData.weatherConditions}
                        onChange={(e) => updateField("weatherConditions", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="e.g., Clear, Rainy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment</label>
                      <input
                        type="text"
                        value={formData.equipmentInvolved}
                        onChange={(e) => updateField("equipmentInvolved", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        placeholder="Equipment involved"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: People */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="ri-group-line text-blue-600"></i>
                    People Involved
                  </h2>
                  <button
                    type="button"
                    onClick={addPerson}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <i className="ri-add-line mr-1"></i>Add Person
                  </button>
                </div>

                {formData.peopleInvolved.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <i className="ri-user-add-line text-4xl text-gray-300 mb-2"></i>
                    <p className="text-gray-500">No people added yet</p>
                    <button onClick={addPerson} className="mt-2 text-blue-600 hover:underline text-sm">
                      Add first person
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.peopleInvolved.map((person, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Person {index + 1}</h4>
                          <button onClick={() => removePerson(index)} className="text-red-500 hover:text-red-700">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            value={person.name}
                            onChange={(e) => {
                              const updated = [...formData.peopleInvolved];
                              updated[index] = { ...person, name: e.target.value };
                              updateField("peopleInvolved", updated);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            placeholder="Full name"
                          />
                          <input
                            type="text"
                            value={person.employeeId}
                            onChange={(e) => {
                              const updated = [...formData.peopleInvolved];
                              updated[index] = { ...person, employeeId: e.target.value };
                              updateField("peopleInvolved", updated);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            placeholder="Employee ID"
                          />
                          <input
                            type="text"
                            value={person.department}
                            onChange={(e) => {
                              const updated = [...formData.peopleInvolved];
                              updated[index] = { ...person, department: e.target.value };
                              updateField("peopleInvolved", updated);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            placeholder="Department"
                          />
                          <select
                            value={person.involvementType}
                            onChange={(e) => {
                              const updated = [...formData.peopleInvolved];
                              updated[index] = { ...person, involvementType: e.target.value };
                              updateField("peopleInvolved", updated);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          >
                            <option value="">Involvement type</option>
                            <option value="INJURED">Injured Party</option>
                            <option value="INVOLVED">Directly Involved</option>
                            <option value="FIRST_RESPONDER">First Responder</option>
                            <option value="SUPERVISOR">Supervisor</option>
                          </select>
                          <textarea
                            value={person.injuryDescription || ""}
                            onChange={(e) => {
                              const updated = [...formData.peopleInvolved];
                              updated[index] = { ...person, injuryDescription: e.target.value };
                              updateField("peopleInvolved", updated);
                            }}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 md:col-span-2"
                            placeholder="Injury description (if applicable)"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Witness Statements</h3>
                    <button
                      type="button"
                      onClick={addWitness}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200"
                    >
                      <i className="ri-add-line mr-1"></i>Add Witness
                    </button>
                  </div>

                  {formData.witnessStatements.map((witness, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Witness {index + 1}</h4>
                        <button onClick={() => removeWitness(index)} className="text-red-500 hover:text-red-700">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={witness.witnessName}
                          onChange={(e) => {
                            const updated = [...formData.witnessStatements];
                            updated[index] = { ...witness, witnessName: e.target.value };
                            updateField("witnessStatements", updated);
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          placeholder="Witness name"
                        />
                        <input
                          type="text"
                          value={witness.contact}
                          onChange={(e) => {
                            const updated = [...formData.witnessStatements];
                            updated[index] = { ...witness, contact: e.target.value };
                            updateField("witnessStatements", updated);
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          placeholder="Contact info"
                        />
                        <textarea
                          value={witness.statement}
                          onChange={(e) => {
                            const updated = [...formData.witnessStatements];
                            updated[index] = { ...witness, statement: e.target.value };
                            updateField("witnessStatements", updated);
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 md:col-span-2"
                          placeholder="Witness statement..."
                          rows={3}
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={witness.anonymous}
                            onChange={(e) => {
                              const updated = [...formData.witnessStatements];
                              updated[index] = { ...witness, anonymous: e.target.checked };
                              updateField("witnessStatements", updated);
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Anonymous statement</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-file-text-line text-blue-600"></i>
                  Additional Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Incident category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                    <input
                      type="text"
                      value={formData.subCategory}
                      onChange={(e) => updateField("subCategory", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="Sub-category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Immediate Actions Taken</label>
                  <textarea
                    value={formData.immediateActions}
                    onChange={(e) => updateField("immediateActions", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Describe immediate actions taken after the incident..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Cost ($)</label>
                    <input
                      type="number"
                      value={formData.estimatedCost || ""}
                      onChange={(e) => updateField("estimatedCost", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lost Work Hours</label>
                    <input
                      type="number"
                      value={formData.lostWorkHours || ""}
                      onChange={(e) => updateField("lostWorkHours", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      placeholder="0"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.insuranceClaim}
                    onChange={(e) => updateField("insuranceClaim", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Insurance claim filed</span>
                </label>
              </div>
            )}

            {/* Step 4: Compliance */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-shield-check-line text-blue-600"></i>
                  Regulatory Compliance
                </h2>

                {/* OSHA */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">OSHA Recordkeeping</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.oshaRecordable}
                        onChange={(e) => updateField("oshaRecordable", e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">OSHA Recordable</span>
                    </label>
                  </div>

                  {formData.oshaRecordable && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classification</label>
                        <select
                          value={formData.oshaClassification}
                          onChange={(e) => updateField("oshaClassification", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        >
                          <option value="">Select classification</option>
                          <option value="DEATH">Death</option>
                          <option value="DAYS_AWAY">Days Away from Work</option>
                          <option value="RESTRICTED_WORK">Restricted Work/Transfer</option>
                          <option value="OTHER_RECORDABLE">Other Recordable Case</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Number</label>
                        <input
                          type="text"
                          value={formData.oshaCaseNumber}
                          onChange={(e) => updateField("oshaCaseNumber", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          placeholder="OSHA case number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days Away from Work</label>
                        <input
                          type="number"
                          value={formData.daysAwayFromWork || ""}
                          onChange={(e) => updateField("daysAwayFromWork", parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Days Restricted/Transfer</label>
                        <input
                          type="number"
                          value={formData.daysRestrictedTransfer || ""}
                          onChange={(e) => updateField("daysRestrictedTransfer", parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* RIDDOR */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">RIDDOR (UK)</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.riddorReportable}
                        onChange={(e) => updateField("riddorReportable", e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">RIDDOR Reportable</span>
                    </label>
                  </div>

                  {formData.riddorReportable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIDDOR Category</label>
                      <select
                        value={formData.riddorCategory}
                        onChange={(e) => updateField("riddorCategory", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      >
                        <option value="">Select category</option>
                        <option value="FATAL">Fatal injury</option>
                        <option value="SPECIFIED">Specified injury</option>
                        <option value="OVER_7_DAYS">Over 7 day incapacitation</option>
                        <option value="DANGEROUS">Dangerous occurrence</option>
                        <option value="DISEASE">Occupational disease</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <i className="ri-checkbox-circle-line text-blue-600"></i>
                  Review Changes
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium mb-2">Incident</h4>
                    <p className="text-gray-700 dark:text-gray-300">{formData.title}</p>
                    <p className="text-sm text-gray-500">Type: {formData.type.replace(/_/g, " ")}</p>
                    <p className="text-sm text-gray-500">Severity: {formData.severity}</p>
                    <p className="text-sm text-gray-500">Status: {formData.status.replace(/_/g, " ")}</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-gray-700 dark:text-gray-300">{formData.location.name || "Not specified"}</p>
                    <p className="text-sm text-gray-500">{formData.location.facility}</p>
                    <p className="text-sm text-gray-500">{formData.location.building}</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium mb-2">People</h4>
                    <p className="text-sm text-gray-500">{formData.peopleInvolved.length} people involved</p>
                    <p className="text-sm text-gray-500">{formData.witnessStatements.length} witness statements</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="font-medium mb-2">Compliance</h4>
                    <p className="text-sm text-gray-500">OSHA Recordable: {formData.oshaRecordable ? "Yes" : "No"}</p>
                    <p className="text-sm text-gray-500">RIDDOR Reportable: {formData.riddorReportable ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <i className="ri-information-line"></i>
                    <span className="font-medium">Ready to save</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Click "Save Changes" to update this incident.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                <i className="ri-arrow-left-line mr-2"></i>Previous
              </button>
              {activeStep < STEPS.length - 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Next<i className="ri-arrow-right-line ml-2"></i>
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-save-line"></i>}
                  Save Changes
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
