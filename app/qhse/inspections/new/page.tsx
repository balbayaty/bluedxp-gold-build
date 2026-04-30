/**
 * QHSE New Inspection Page
 * Schedule new inspection with smart detection form
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import type { Inspection, InspectionType } from "@/types/qhse";
import { PremiumLoader } from "@/components/loading";

type AdvancedDetectionContext = any;

export default function NewQHSEInspectionPage() {
  const router = useRouter();
  const [previousInspections, setPreviousInspections] = useState<Inspection[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviousInspections();
  }, []);

  const fetchPreviousInspections = async () => {
    try {
      const response = await fetch("/api/qhse/inspections");
      const data = await response.json();
      if (data.success) {
        setPreviousInspections(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching previous inspections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Map form data to QHSE Inspection format
      const inspectionData = {
        type: (formData.type || "SAFETY_INSPECTION") as InspectionType,
        title: formData.title || "",
        description: formData.description || "",
        location: formData.location || "",
        scheduledDate: formData.scheduledDate || new Date().toISOString(),
        scheduledBy: localStorage.getItem("user_email") || "",
        conductedBy: formData.conductedBy || "",
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        followUpRequired: formData.followUpRequired || false,
        status: "SCHEDULED" as const,
      };

      const response = await fetch("/api/qhse/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inspectionData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to inspections list
        router.push("/qhse/inspections");
      } else {
        alert(`Error: ${result.error || "Failed to create inspection"}`);
      }
    } catch (error) {
      console.error("Error creating inspection:", error);
      alert("Failed to create inspection. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading inspection form..."
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
          Back to Inspections
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Schedule New Inspection
        </h1>
        <p className="text-gray-600 mt-1">
          Use smart detection to auto-fill inspection details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <AdvancedSmartDetectionForm
          formId={`qhse-inspection-form-${Date.now()}`}
          fields={[
            {
              id: "title",
              name: "title",
              type: "text",
              label: "Inspection Title",
              value: "",
              required: true,
              placeholder: "Title of the inspection...",
            },
            {
              id: "type",
              name: "type",
              type: "select",
              label: "Inspection Type",
              value: "SAFETY_INSPECTION",
              required: true,
              options: [
                { label: "Safety Inspection", value: "SAFETY_INSPECTION" },
                {
                  label: "Environmental Inspection",
                  value: "ENVIRONMENTAL_INSPECTION",
                },
                { label: "Quality Inspection", value: "QUALITY_INSPECTION" },
                {
                  label: "Fire Safety Inspection",
                  value: "FIRE_SAFETY_INSPECTION",
                },
                {
                  label: "Equipment Inspection",
                  value: "EQUIPMENT_INSPECTION",
                },
                { label: "Facility Inspection", value: "FACILITY_INSPECTION" },
                { label: "Regulatory Audit", value: "REGULATORY_AUDIT" },
                { label: "Internal Audit", value: "INTERNAL_AUDIT" },
                { label: "Supplier Audit", value: "SUPPLIER_AUDIT" },
                { label: "Other", value: "OTHER" },
              ],
            },
            {
              id: "scheduledDate",
              name: "scheduledDate",
              type: "date",
              label: "Scheduled Date",
              value: new Date().toISOString().split("T")[0],
              required: true,
            },
            {
              id: "location",
              name: "location",
              type: "text",
              label: "Location",
              value: "",
              required: true,
              placeholder: "Location to be inspected...",
            },
            {
              id: "description",
              name: "description",
              type: "textarea",
              label: "Description (Optional)",
              value: "",
              placeholder: "Additional details about the inspection...",
            },
            {
              id: "conductedBy",
              name: "conductedBy",
              type: "email",
              label: "Conducted By (Optional)",
              value: "",
              placeholder: "inspector@example.com",
            },
            {
              id: "duration",
              name: "duration",
              type: "number",
              label: "Estimated Duration (minutes) (Optional)",
              value: "",
              placeholder: "60",
            },
          ]}
          context={{
            formType: "INSPECTION",
            moduleId: "qhse",
            previousForms: previousInspections.map((i) => ({
              title: i.title,
              type: i.type,
              scheduledDate: i.scheduledDate,
              location: i.location,
              description: i.description,
              conductedBy: i.conductedBy,
              duration: i.duration,
            })),
            userRole: "USER",
            tenantId: "default-tenant",
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          title="Schedule New QHSE Inspection"
        />
      </div>
    </div>
  );
}
