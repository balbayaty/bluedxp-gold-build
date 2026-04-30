/**
 * QHSE New Training Program Page
 * Create new training program with smart detection form
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdvancedSmartDetectionForm from "@/components/forms/AdvancedSmartDetectionForm";
import type { TrainingProgram, TrainingType } from "@/types/qhse";
import { PremiumLoader } from "@/components/loading";

type AdvancedDetectionContext = any;

export default function NewQHSETrainingPage() {
  const router = useRouter();
  const [previousPrograms, setPreviousPrograms] = useState<TrainingProgram[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreviousPrograms();
  }, []);

  const fetchPreviousPrograms = async () => {
    try {
      const response = await fetch("/api/qhse/training?type=programs");
      const data = await response.json();
      if (data.success) {
        setPreviousPrograms(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching previous programs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      // Map form data to QHSE Training Program format
      const programData = {
        name: formData.programName || formData.name || "",
        type: (formData.type || "SAFETY") as TrainingType,
        description: formData.description || "",
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        instructor: formData.instructor || "",
        scheduledDate: formData.scheduledDate || new Date().toISOString(),
        location: formData.location || "",
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : undefined,
        certificationRequired: formData.certificationRequired || false,
        certificationValidity: formData.certificationValidity
          ? parseInt(formData.certificationValidity)
          : undefined,
        createdBy: localStorage.getItem("user_email") || "",
      };

      const response = await fetch("/api/qhse/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(programData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to training list
        router.push("/qhse/training");
      } else {
        alert(`Error: ${result.error || "Failed to create training program"}`);
      }
    } catch (error) {
      console.error("Error creating training program:", error);
      alert("Failed to create training program. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a]">
        <PremiumLoader
          message="Loading training form..."
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
          Back to Training
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Create New Training Program
        </h1>
        <p className="text-gray-600 mt-1">
          Use smart detection to auto-fill training program details
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <AdvancedSmartDetectionForm
          formId={`qhse-training-form-${Date.now()}`}
          fields={[
            {
              id: "programName",
              name: "programName",
              type: "text",
              label: "Training Program Name",
              value: "",
              required: true,
              placeholder: "Name of the training program...",
            },
            {
              id: "type",
              name: "type",
              type: "select",
              label: "Training Type",
              value: "SAFETY",
              required: true,
              options: [
                { label: "Safety", value: "SAFETY" },
                { label: "Compliance", value: "COMPLIANCE" },
                { label: "Technical", value: "TECHNICAL" },
                { label: "Management", value: "MANAGEMENT" },
                { label: "Environmental", value: "ENVIRONMENTAL" },
                { label: "Quality", value: "QUALITY" },
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
              id: "duration",
              name: "duration",
              type: "number",
              label: "Duration (hours)",
              value: "",
              required: true,
              placeholder: "2",
            },
            {
              id: "instructor",
              name: "instructor",
              type: "email",
              label: "Instructor",
              value: "",
              required: true,
              placeholder: "instructor@example.com",
            },
            {
              id: "location",
              name: "location",
              type: "text",
              label: "Location (Optional)",
              value: "",
              placeholder: "Training location...",
            },
            {
              id: "description",
              name: "description",
              type: "textarea",
              label: "Description (Optional)",
              value: "",
              placeholder: "Training program description...",
            },
            {
              id: "maxParticipants",
              name: "maxParticipants",
              type: "number",
              label: "Max Participants (Optional)",
              value: "",
              placeholder: "20",
            },
            {
              id: "certificationValidity",
              name: "certificationValidity",
              type: "number",
              label: "Certification Validity (months) (Optional)",
              value: "",
              placeholder: "12",
            },
          ]}
          context={{
            formType: "TRAINING",
            moduleId: "qhse",
            previousForms: previousPrograms.map((p) => ({
              programName: p.name,
              type: p.type,
              scheduledDate: p.scheduledDate,
              duration: p.duration,
              instructor: p.instructor,
              location: p.location,
              description: p.description,
              maxParticipants: p.maxParticipants,
              certificationValidity: p.certificationValidity,
            })),
            userRole: "USER",
            tenantId: "default-tenant",
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          title="Create New Training Program"
        />
      </div>
    </div>
  );
}
