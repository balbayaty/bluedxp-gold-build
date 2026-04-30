/**
 * QHSE New Incident Page
 * Create new incident with smart detection form
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import type { Incident, IncidentType, IncidentSeverity } from "@/types/qhse";
import { PremiumLoader } from "@/components/loading";

type AdvancedDetectionContext = any;

export default function NewQHSEIncidentPage() {
  const router = useRouter();
  const [previousIncidents, setPreviousIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviousIncidents();
  }, []);

  const fetchPreviousIncidents = async () => {
    try {
      const response = await fetch("/api/qhse/incidents");
      const data = await response.json();
      if (data.success) {
        setPreviousIncidents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching previous incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Map form data to QHSE Incident format with all fields
      const incidentData = {
        type: (formData.type || "NEAR_MISS") as IncidentType,
        severity: (formData.severity || "MEDIUM") as IncidentSeverity,
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        occurredAt: formData.occurredAt || new Date().toISOString(),
        reportedBy: localStorage.getItem("user_email") || "",
        immediateActions: formData.immediateActions || "",
        rootCause: formData.rootCause || "",
        correctiveActions: formData.correctiveActions || "",
        assignedTo: formData.assignedTo || "",
        status: "REPORTED" as const,
        // Additional fields
        shift: formData.shift || "",
        weatherConditions: formData.weatherConditions || "",
        equipmentInvolved: formData.equipmentInvolved || "",
        // OSHA Compliance
        oshaRecordable: formData.oshaRecordable === "YES",
        oshaClassification: formData.oshaClassification || "",
        daysAwayFromWork: parseInt(formData.daysAwayFromWork) || 0,
        daysRestrictedTransfer: 0,
        // RIDDOR
        riddorReportable: formData.riddorReportable === "YES",
        riddorCategory: formData.riddorCategory || "",
        // Cost & Impact
        estimatedCost: parseFloat(formData.estimatedCost) || 0,
        lostWorkHours: parseFloat(formData.lostWorkHours) || 0,
        insuranceClaim: formData.insuranceClaim === "YES",
        // Initialize empty arrays for people/witnesses (can be added in edit)
        peopleInvolved: [],
        witnessStatements: [],
        photos: [],
        documents: [],
      };

      const response = await fetch("/api/qhse/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to incidents list or detail page
        router.push("/qhse/incidents");
      } else {
        alert(`Error: ${result.error || "Failed to create incident"}`);
      }
    } catch (error) {
      console.error("Error creating incident:", error);
      alert("Failed to create incident. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading incident form..."
          size="xl"
          variant="default"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          <i className="ri-arrow-left-line"></i>
          Back to Incidents
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Report New Incident
        </h1>
        <p className="text-gray-600 mt-1">
          Use smart detection to auto-fill incident details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <AdvancedSmartDetectionForm
          formId={`qhse-incident-form-${Date.now()}`}
          fields={[
            {
              id: "title",
              name: "title",
              type: "text",
              label: "Incident Title",
              value: "",
              required: true,
              placeholder: "Brief title of the incident...",
            },
            {
              id: "type",
              name: "type",
              type: "select",
              label: "Incident Type",
              value: "NEAR_MISS",
              required: true,
              options: [
                { label: "Near Miss", value: "NEAR_MISS" },
                { label: "First Aid", value: "FIRST_AID" },
                { label: "Medical Treatment", value: "MEDICAL_TREATMENT" },
                { label: "Lost Time", value: "LOST_TIME" },
                { label: "Fatality", value: "FATALITY" },
                { label: "Property Damage", value: "PROPERTY_DAMAGE" },
                {
                  label: "Environmental Release",
                  value: "ENVIRONMENTAL_RELEASE",
                },
                { label: "Fire", value: "FIRE" },
                { label: "Explosion", value: "EXPLOSION" },
                { label: "Chemical Spill", value: "CHEMICAL_SPILL" },
                { label: "PPE Non-Compliance", value: "PPE_NON_COMPLIANCE" },
                { label: "Safety Violation", value: "SAFETY_VIOLATION" },
                { label: "Other", value: "OTHER" },
              ],
            },
            {
              id: "severity",
              name: "severity",
              type: "select",
              label: "Severity",
              value: "MEDIUM",
              required: true,
              options: [
                { label: "Low", value: "LOW" },
                { label: "Medium", value: "MEDIUM" },
                { label: "High", value: "HIGH" },
                { label: "Critical", value: "CRITICAL" },
              ],
            },
            {
              id: "location",
              name: "location",
              type: "text",
              label: "Location",
              value: "",
              required: true,
              placeholder: "Where did the incident occur?",
            },
            {
              id: "occurredAt",
              name: "occurredAt",
              type: "date",
              label: "Occurred At",
              value: new Date().toISOString().split("T")[0],
              required: true,
            },
            {
              id: "description",
              name: "description",
              type: "textarea",
              label: "Description",
              value: "",
              required: true,
              placeholder: "Detailed description of what happened...",
            },
            {
              id: "immediateActions",
              name: "immediateActions",
              type: "textarea",
              label: "Immediate Actions Taken (Optional)",
              value: "",
              placeholder: "What immediate actions were taken?",
            },
            {
              id: "rootCause",
              name: "rootCause",
              type: "textarea",
              label: "Root Cause Analysis (Optional)",
              value: "",
              placeholder:
                "Initial root cause analysis (can be completed later)...",
            },
            {
              id: "correctiveActions",
              name: "correctiveActions",
              type: "textarea",
              label: "Corrective Actions (Optional)",
              value: "",
              placeholder: "Corrective actions taken or planned...",
            },
            {
              id: "assignedTo",
              name: "assignedTo",
              type: "email",
              label: "Assign To (Optional)",
              value: "",
              placeholder: "Select responsible person...",
            },
            // Additional fields for complete incident reporting
            {
              id: "shift",
              name: "shift",
              type: "select",
              label: "Shift",
              value: "",
              options: [
                { label: "Morning (6AM-2PM)", value: "MORNING" },
                { label: "Afternoon (2PM-10PM)", value: "AFTERNOON" },
                { label: "Night (10PM-6AM)", value: "NIGHT" },
              ],
            },
            {
              id: "weatherConditions",
              name: "weatherConditions",
              type: "text",
              label: "Weather Conditions (Optional)",
              value: "",
              placeholder: "e.g., Clear, Rainy, Hot...",
            },
            {
              id: "equipmentInvolved",
              name: "equipmentInvolved",
              type: "text",
              label: "Equipment Involved (Optional)",
              value: "",
              placeholder: "Any equipment involved in the incident...",
            },
            // OSHA Compliance
            {
              id: "oshaRecordable",
              name: "oshaRecordable",
              type: "select",
              label: "OSHA Recordable?",
              value: "NO",
              options: [
                { label: "No", value: "NO" },
                { label: "Yes", value: "YES" },
              ],
            },
            {
              id: "oshaClassification",
              name: "oshaClassification",
              type: "select",
              label: "OSHA Classification (if recordable)",
              value: "",
              options: [
                { label: "Death", value: "DEATH" },
                { label: "Days Away from Work", value: "DAYS_AWAY" },
                { label: "Restricted Work/Transfer", value: "RESTRICTED_WORK" },
                { label: "Other Recordable Case", value: "OTHER_RECORDABLE" },
              ],
            },
            {
              id: "daysAwayFromWork",
              name: "daysAwayFromWork",
              type: "number",
              label: "Days Away from Work (if applicable)",
              value: "",
              placeholder: "0",
            },
            // RIDDOR (UK)
            {
              id: "riddorReportable",
              name: "riddorReportable",
              type: "select",
              label: "RIDDOR Reportable? (UK)",
              value: "NO",
              options: [
                { label: "No", value: "NO" },
                { label: "Yes", value: "YES" },
              ],
            },
            {
              id: "riddorCategory",
              name: "riddorCategory",
              type: "select",
              label: "RIDDOR Category (if reportable)",
              value: "",
              options: [
                { label: "Fatal Injury", value: "FATAL" },
                { label: "Specified Injury", value: "SPECIFIED" },
                { label: "Over 7 Day Incapacitation", value: "OVER_7_DAYS" },
                { label: "Dangerous Occurrence", value: "DANGEROUS" },
                { label: "Occupational Disease", value: "DISEASE" },
              ],
            },
            // Cost & Impact
            {
              id: "estimatedCost",
              name: "estimatedCost",
              type: "number",
              label: "Estimated Cost ($) (Optional)",
              value: "",
              placeholder: "0.00",
            },
            {
              id: "lostWorkHours",
              name: "lostWorkHours",
              type: "number",
              label: "Lost Work Hours (Optional)",
              value: "",
              placeholder: "0",
            },
            {
              id: "insuranceClaim",
              name: "insuranceClaim",
              type: "select",
              label: "Insurance Claim Filed?",
              value: "NO",
              options: [
                { label: "No", value: "NO" },
                { label: "Yes", value: "YES" },
                { label: "Pending", value: "PENDING" },
              ],
            },
          ]}
          context={{
            formType: "INCIDENT",
            moduleId: "qhse",
            previousForms: previousIncidents.map((i) => ({
              title: i.title,
              type: i.type,
              severity: i.severity,
              location: i.location,
              description: i.description,
              immediateActions: i.immediateActions,
              rootCause: i.rootCause,
              correctiveActions: i.correctiveActions,
            })),
            userRole: "USER",
            tenantId: "default-tenant",
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          title="Report New QHSE Incident"
        />
      </div>
    </div>
  );
}
