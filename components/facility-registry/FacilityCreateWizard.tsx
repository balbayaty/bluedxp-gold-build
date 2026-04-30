"use client";

/**
 * Facility Creation Wizard
 *
 * Multi-step wizard for creating unified facilities with government divisions
 * Easy UX/UI for adding facilities with all required information
 *
 * Steps:
 * 1. Basic Information
 * 2. Location & Geofence
 * 3. Operating Hours
 * 4. Government Divisions (with independent hours)
 * 5. Environmental Agencies (with independent hours)
 * 6. Capabilities & Constraints
 * 7. Review & Submit
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import type {
  FacilityCreateInput,
  GovernmentDivisionInput,
  EnvironmentalAgencyInput,
  OperatingHours,
} from "@/types/unified-facility";
import BasicInfoStep from "./steps/BasicInfoStep";
import LocationStep from "./steps/LocationStep";
import OperatingHoursStep from "./steps/OperatingHoursStep";
import GovernmentDivisionsStep from "./steps/GovernmentDivisionsStep";
import EnvironmentalAgenciesStep from "./steps/EnvironmentalAgenciesStep";
import CapabilitiesStep from "./steps/CapabilitiesStep";
import ReviewStep from "./steps/ReviewStep";

const STEPS = [
  { id: "basic", title: "Basic Information", icon: "ri-building-line" },
  { id: "location", title: "Location & Geofence", icon: "ri-map-pin-line" },
  { id: "hours", title: "Operating Hours", icon: "ri-time-line" },
  {
    id: "divisions",
    title: "Government Divisions",
    icon: "ri-government-line",
  },
  { id: "agencies", title: "Environmental Agencies", icon: "ri-leaf-line" },
  {
    id: "capabilities",
    title: "Capabilities & Constraints",
    icon: "ri-settings-3-line",
  },
  { id: "review", title: "Review & Submit", icon: "ri-check-line" },
];

interface FacilityCreateWizardProps {
  onComplete?: (facilityId: string) => void;
  onCancel?: () => void;
}

export default function FacilityCreateWizard({
  onComplete,
  onCancel,
}: FacilityCreateWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<FacilityCreateInput>>({
    // Basic Info
    code: "",
    name: "",
    nameLocal: "",
    alternateNames: [],
    type: "WAREHOUSE",
    status: "ACTIVE",

    // Location
    location: {
      coordinates: { latitude: 0, longitude: 0 },
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "SA" as const,
      },
      timezone: "Asia/Riyadh",
    },

    // Operating Hours
    operatingHours: {
      monday: { open: "08:00", close: "17:00", closed: false },
      tuesday: { open: "08:00", close: "17:00", closed: false },
      wednesday: { open: "08:00", close: "17:00", closed: false },
      thursday: { open: "08:00", close: "17:00", closed: false },
      friday: { open: "08:00", close: "17:00", closed: false },
      saturday: { open: "08:00", close: "17:00", closed: false },
      sunday: { open: "08:00", close: "17:00", closed: false },
    },

    // Government Divisions
    governmentDivisions: [],

    // Environmental Agencies
    environmentalAgencies: [],

    // Capabilities & Constraints
    capabilities: [],
    constraints: [],
  });

  const updateFormData = (updates: Partial<FacilityCreateInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateStep = (stepIndex: number): boolean => {
    const step = STEPS[stepIndex];

    switch (step.id) {
      case "basic":
        return !!(formData.code && formData.name && formData.type);
      case "location":
        return !!(
          formData.location?.coordinates?.latitude &&
          formData.location?.coordinates?.longitude &&
          formData.location?.address?.country
        );
      case "hours":
        return !!formData.operatingHours;
      case "divisions":
        // Optional - can skip
        return true;
      case "agencies":
        // Optional - can skip
        return true;
      case "capabilities":
        // Optional - can skip
        return true;
      case "review":
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/facility-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create facility");
      }

      const result = await response.json();
      const facilityId = result.data?.id;

      if (onComplete) {
        onComplete(facilityId);
      } else {
        router.push(`/facility-registry/${facilityId}`);
      }
    } catch (error) {
      console.error("Error creating facility:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create facility",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Unified Facility
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new facility that will be automatically synced to Geofence,
            Touchpoints, Route Analysis, and other modules
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-8 flex items-center justify-between overflow-x-auto pb-4">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => goToStep(index)}
              className={`flex flex-col items-center min-w-[120px] ${
                index <= currentStep
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                      ? "bg-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <i className="ri-check-line text-lg"></i>
                ) : (
                  <i className={`${step.icon} text-lg`}></i>
                )}
              </div>
              <span className="text-xs font-medium text-center">
                {step.title}
              </span>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
          >
            {currentStep === 0 && (
              <BasicInfoStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 1 && (
              <LocationStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 2 && (
              <OperatingHoursStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 3 && (
              <GovernmentDivisionsStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 4 && (
              <EnvironmentalAgenciesStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 5 && (
              <CapabilitiesStep
                formData={formData}
                updateFormData={updateFormData}
              />
            )}
            {currentStep === 6 && (
              <ReviewStep
                formData={formData as FacilityCreateInput}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Previous
                </button>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next
                    <i className="ri-arrow-right-line ml-2"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="ri-check-line mr-2"></i>
                        Create Facility
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
