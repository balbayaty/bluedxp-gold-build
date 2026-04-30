/**
 * Enhanced Incident Report Form
 * Comprehensive incident reporting
 * Much more comprehensive than source apps
 */

"use client";

import { useState } from "react";
import type { Incident } from "@/types/qhse";

interface IncidentReportFormProps {
  onSubmit?: (
    incident: Omit<Incident, "id" | "createdAt" | "updatedAt">,
  ) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Incident>;
}

export default function IncidentReportForm({
  onSubmit,
  onCancel,
  initialData,
}: IncidentReportFormProps) {
  const [formData, setFormData] = useState({
    type: initialData?.type || ("NEAR_MISS" as Incident["type"]),
    severity: initialData?.severity || ("LOW" as Incident["severity"]),
    title: initialData?.title || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    locationDetails: initialData?.locationDetails || "",
    occurredAt: initialData?.occurredAt
      ? new Date(initialData.occurredAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    oshaRecordable: initialData?.oshaRecordable || false,
    riddorReportable: initialData?.riddorReportable || false,
    tags: initialData?.tags || ([] as string[]),
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    try {
      setSubmitting(true);
      await onSubmit({
        tenantId: "default-tenant", // Would come from context
        type: formData.type,
        severity: formData.severity,
        status: "REPORTED",
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationDetails: formData.locationDetails,
        occurredAt: new Date(formData.occurredAt).toISOString(),
        reportedAt: new Date().toISOString(),
        reportedBy: "current-user", // Would come from auth context
        oshaRecordable: formData.oshaRecordable,
        riddorReportable: formData.riddorReportable,
        tags: formData.tags,
        createdBy: "current-user",
        updatedBy: "current-user",
      });
    } catch (error) {
      console.error("Error submitting incident:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as Incident["type"],
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="NEAR_MISS">Near Miss</option>
            <option value="FIRST_AID">First Aid</option>
            <option value="MEDICAL_TREATMENT">Medical Treatment</option>
            <option value="LOST_TIME">Lost Time</option>
            <option value="FATALITY">Fatality</option>
            <option value="PROPERTY_DAMAGE">Property Damage</option>
            <option value="ENVIRONMENTAL_RELEASE">Environmental Release</option>
            <option value="FIRE">Fire</option>
            <option value="EXPLOSION">Explosion</option>
            <option value="CHEMICAL_SPILL">Chemical Spill</option>
            <option value="PPE_NON_COMPLIANCE">PPE Non-Compliance</option>
            <option value="SAFETY_VIOLATION">Safety Violation</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity *
          </label>
          <select
            value={formData.severity}
            onChange={(e) =>
              setFormData({
                ...formData,
                severity: e.target.value as Incident["severity"],
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time *
          </label>
          <input
            type="datetime-local"
            value={formData.occurredAt}
            onChange={(e) =>
              setFormData({ ...formData, occurredAt: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.oshaRecordable}
            onChange={(e) =>
              setFormData({ ...formData, oshaRecordable: e.target.checked })
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-700">OSHA Recordable</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.riddorReportable}
            onChange={(e) =>
              setFormData({ ...formData, riddorReportable: e.target.checked })
            }
            className="mr-2"
          />
          <span className="text-sm text-gray-700">RIDDOR Reportable</span>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </form>
  );
}
