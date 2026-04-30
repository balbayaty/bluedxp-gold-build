/**
 * RFI Creation - Wizard Style UI
 * Step-by-step guided form with progress tracking
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = [
  { id: "contact", title: "Contact Info", icon: "ri-user-line" },
  { id: "storage", title: "Storage", icon: "ri-building-4-line" },
  { id: "inbound", title: "Inbound", icon: "ri-arrow-down-line" },
  { id: "outbound", title: "Outbound", icon: "ri-arrow-up-line" },
  { id: "services", title: "Services", icon: "ri-service-line" },
  { id: "review", title: "Review", icon: "ri-check-line" },
];

export default function RFIWizardPage() {
  const router = useRouter();
  const { hasModuleAccess, canPerformAction } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfi",
    undefined,
    "write",
  );

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (!hasAccess || !canCreate) {
    return (
      <PageTemplate
        title="Access Denied"
        description="You do not have permission to create RFIs"
        icon="ri-error-warning-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have the required permissions to create RFIs. Please
              contact your administrator.
            </p>
          </div>
        </div>
      </PageTemplate>
    );
  }

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="New RFI (Wizard)"
        description="Guided step-by-step RFI creation"
        icon="ri-file-add-line"
        actions={
          <Link
            href="/proposals/rfi/new"
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm flex items-center gap-2"
          >
            <i className="ri-settings-3-line" />
            Advanced Mode
          </Link>
        }
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        index <= currentStep
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      }`}
                    >
                      <i className={`${step.icon} text-xl`} />
                    </div>
                    <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        index < currentStep
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
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
              <h2 className="text-2xl font-bold mb-6">
                {STEPS[currentStep].title}
              </h2>

              {/* Step-specific content would go here */}
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Step {currentStep + 1} content for {STEPS[currentStep].title}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                {currentStep < STEPS.length - 1 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/proposals/rfi")}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
