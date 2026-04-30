/**
 * License Application Wizard Component
 * Multi-step wizard for applying for licenses with intelligent document auto-pull
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  mockProducts,
  mockConsultants,
  generateMockLicenseApplication,
} from "@/utils/licenseApplicationMockData";
import type {
  LicenseApplication,
  Consultant,
} from "@/types/license-application";

interface LicenseApplicationWizardProps {
  onComplete: (application: LicenseApplication) => void;
  onClose: () => void;
}

export default function LicenseApplicationWizard({
  onComplete,
  onClose,
}: LicenseApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<string>("");
  const [documents, setDocuments] = useState<any[]>([]);

  const totalSteps = 6;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const application = generateMockLicenseApplication(selectedProduct);
    application.licenseTypes = selectedLicenses as any;
    if (selectedConsultant) {
      application.consultantId = selectedConsultant;
      application.consultantName = mockConsultants.find(
        (c) => c.id === selectedConsultant,
      )?.name;
    }
    onComplete(application);
  };

  const selectedProductData = mockProducts.find(
    (p) => p.id === selectedProduct,
  );
  const requiredDocuments = selectedProductData
    ? [
        "MSDS (Material Safety Data Sheet)",
        "Storage Plan",
        "Safety Certificate",
        "Fire Safety Plan",
        ...(selectedProductData.hazardClass === "FLAMMABLE"
          ? ["Fire Prevention Certificate", "Ventilation Plan"]
          : []),
        ...(selectedProductData.hazardClass === "TOXIC"
          ? ["Toxic Substance Handling Certificate", "Medical Emergency Plan"]
          : []),
        ...(selectedProductData.hazardClass === "CORROSIVE"
          ? [
              "Corrosion Prevention Plan",
              "Personal Protective Equipment Certificate",
            ]
          : []),
      ]
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Apply for License
            </h2>
            <p className="text-[#9ca3af] text-sm">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-white transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-white/5">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i + 1 <= currentStep ? "bg-cyan-500" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Product Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  Select Product
                </h3>
                <div className="grid gap-4">
                  {mockProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedProduct === product.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white mb-1">
                            {product.name}
                          </h4>
                          <p className="text-sm text-[#9ca3af]">
                            {product.category}
                          </p>
                          {product.chemicalName && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-white/5 rounded text-xs text-[#9ca3af]">
                                CAS: {product.casNumber}
                              </span>
                              {product.hazardClass && (
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    product.hazardClass === "FLAMMABLE"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : product.hazardClass === "CORROSIVE"
                                        ? "bg-red-500/20 text-red-400"
                                        : product.hazardClass === "TOXIC"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {product.hazardClass}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedProduct === product.id && (
                          <i className="ri-checkbox-circle-fill text-cyan-400 text-xl"></i>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: License Type Selection */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  Select License Types
                </h3>
                <div className="space-y-3">
                  {selectedProductData?.category === "CHEMICALS" && (
                    <>
                      <label className="flex items-center p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedLicenses.includes(
                            "CIVIL_DEFENSE_CHEMICAL",
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLicenses([
                                ...selectedLicenses,
                                "CIVIL_DEFENSE_CHEMICAL",
                              ]);
                            } else {
                              setSelectedLicenses(
                                selectedLicenses.filter(
                                  (l) => l !== "CIVIL_DEFENSE_CHEMICAL",
                                ),
                              );
                            }
                          }}
                          className="w-5 h-5 text-cyan-500 rounded"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-white">
                            Civil Defense License
                          </div>
                          <div className="text-sm text-[#9ca3af]">
                            Required for chemical imports
                          </div>
                        </div>
                        <i className="ri-shield-check-line text-red-400 text-xl"></i>
                      </label>
                      <label className="flex items-center p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedLicenses.includes(
                            "SABER_CERTIFICATE",
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLicenses([
                                ...selectedLicenses,
                                "SABER_CERTIFICATE",
                              ]);
                            } else {
                              setSelectedLicenses(
                                selectedLicenses.filter(
                                  (l) => l !== "SABER_CERTIFICATE",
                                ),
                              );
                            }
                          }}
                          className="w-5 h-5 text-cyan-500 rounded"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-white">
                            SABER Certificate
                          </div>
                          <div className="text-sm text-[#9ca3af]">
                            Conformity assessment certificate
                          </div>
                        </div>
                        <i className="ri-file-certificate-line text-blue-400 text-xl"></i>
                      </label>
                    </>
                  )}
                  {selectedProductData?.category === "FOOD" && (
                    <label className="flex items-center p-4 rounded-xl border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedLicenses.includes("SFDA_FOOD")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLicenses([
                              ...selectedLicenses,
                              "SFDA_FOOD",
                            ]);
                          } else {
                            setSelectedLicenses(
                              selectedLicenses.filter((l) => l !== "SFDA_FOOD"),
                            );
                          }
                        }}
                        className="w-5 h-5 text-cyan-500 rounded"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-semibold text-white">
                          SFDA Food License
                        </div>
                        <div className="text-sm text-[#9ca3af]">
                          Required for food products
                        </div>
                      </div>
                      <i className="ri-file-certificate-line text-blue-400 text-xl"></i>
                    </label>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Document Review */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  Document Review
                </h3>
                <div className="space-y-3">
                  {requiredDocuments.map((doc, index) => {
                    const isAvailable = index < 4; // Mock: first 4 are available
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${
                          isAvailable
                            ? "border-green-500/30 bg-green-500/10"
                            : "border-yellow-500/30 bg-yellow-500/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <i
                              className={`ri-${isAvailable ? "file-check-line" : "file-warning-line"} text-xl ${
                                isAvailable
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }`}
                            ></i>
                            <div>
                              <div className="font-semibold text-white">
                                {doc}
                              </div>
                              <div className="text-sm text-[#9ca3af]">
                                {isAvailable
                                  ? "Auto-pulled from system"
                                  : "Needs to be generated"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isAvailable
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {isAvailable ? "Available" : "Missing"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Consultant Selection */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  Select Consultant (Optional)
                </h3>
                <div className="space-y-3">
                  {mockConsultants.map((consultant) => (
                    <button
                      key={consultant.id}
                      onClick={() => setSelectedConsultant(consultant.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedConsultant === consultant.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          {consultant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-white">
                              {consultant.name}
                            </h4>
                            {selectedConsultant === consultant.id && (
                              <i className="ri-checkbox-circle-fill text-cyan-400 text-xl"></i>
                            )}
                          </div>
                          <p className="text-sm text-[#9ca3af] mb-2">
                            {consultant.company}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {consultant.specialties
                              .slice(0, 3)
                              .map((spec, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-white/5 rounded text-xs text-[#9ca3af]"
                                >
                                  {spec}
                                </span>
                              ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <i className="ri-star-fill"></i>
                              <span>{consultant.rating}</span>
                            </div>
                            <span className="text-[#9ca3af]">
                              {consultant.totalJobs} jobs
                            </span>
                            <span className="text-green-400">
                              {consultant.successRate}% success
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                consultant.availability === "AVAILABLE"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {consultant.availability}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSelectedConsultant("")}
                  className="w-full p-3 rounded-xl border border-white/10 hover:border-white/20 text-[#9ca3af] hover:text-white transition-colors"
                >
                  Skip - I'll handle it myself
                </button>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-white mb-4">
                  Review & Confirm
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Product</h4>
                    <p className="text-[#9ca3af]">
                      {selectedProductData?.name}
                    </p>
                    {selectedProductData?.casNumber && (
                      <p className="text-sm text-[#9ca3af] mt-1">
                        CAS: {selectedProductData.casNumber}
                      </p>
                    )}
                  </div>
                  <div className="p-4 rounded-xl border border-white/10">
                    <h4 className="font-semibold text-white mb-2">
                      License Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLicenses.map((license) => (
                        <span
                          key={license}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded"
                        >
                          {license.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Documents</h4>
                    <p className="text-[#9ca3af]">
                      {requiredDocuments.length} documents required
                    </p>
                    <p className="text-green-400 text-sm mt-1">
                      4 documents available
                    </p>
                  </div>
                  {selectedConsultant && (
                    <div className="p-4 rounded-xl border border-white/10">
                      <h4 className="font-semibold text-white mb-2">
                        Consultant
                      </h4>
                      <p className="text-[#9ca3af]">
                        {
                          mockConsultants.find(
                            (c) => c.id === selectedConsultant,
                          )?.name
                        }
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 6: Submission */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-check-line text-white text-4xl"></i>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Application Submitted!
                </h3>
                <p className="text-[#9ca3af] mb-6">
                  Your license applications have been submitted to the
                  government platforms. You can track the progress in the
                  License Journey dashboard.
                </p>
                <div className="space-y-2 text-left max-w-md mx-auto">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-[#9ca3af]">Application ID</span>
                    <span className="text-white font-mono">
                      APP-{Date.now()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-[#9ca3af]">Estimated Completion</span>
                    <span className="text-white">14 days</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded-lg border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Back
          </button>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedProduct) ||
                (currentStep === 2 && selectedLicenses.length === 0)
              }
              className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-700 transition-colors"
            >
              Next
              <i className="ri-arrow-right-line ml-2"></i>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
