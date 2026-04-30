/**
 * Sea Freight Booking Wizard
 * Step-by-step FCL/LCL booking with container selection and VGM calculation
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";

type Step = 1 | 2 | 3 | 4;

export default function SeaFreightBookingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<any>({
    mode: "SEA",
    type: "FCL",
    containerType: "40FT",
    containerCount: 1,
  });

  const steps = [
    { number: 1, title: "Container Selection", icon: "ri-stack-line" },
    { number: 2, title: "Vessel Schedule", icon: "ri-ship-line" },
    { number: 3, title: "Documentation", icon: "ri-file-list-3-line" },
    { number: 4, title: "Confirmation", icon: "ri-checkbox-circle-line" },
  ];

  return (
    <PageTemplate
      title="Sea Freight Booking Wizard"
      description="Book FCL/LCL shipments with intelligent automation"
      icon="ri-ship-line"
      fullWidth
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              ></div>
            </div>

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                    currentStep >= step.number
                      ? "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/50"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  <i className={step.icon}></i>
                </div>
                <div
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? "text-white" : "text-white/50"
                  }`}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <Step1ContainerSelection
              formData={formData}
              setFormData={setFormData}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2VesselSchedule
              formData={formData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Documentation
              formData={formData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Confirmation
              formData={formData}
              onBook={async () => {
                const response = await fetch(
                  "/api/transportation/sea-freight/book",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                  },
                );
                const result = await response.json();
                if (result.confirmed) {
                  router.push(`/shipments/${result.shipment.id}?booked=true`);
                }
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

function Step1ContainerSelection({ formData, setFormData, onNext }: any) {
  const containerTypes = [
    {
      type: "20FT",
      name: "20ft Standard",
      capacity: "33.2 m³",
      weight: "21,700 kg",
      icon: "📦",
    },
    {
      type: "40FT",
      name: "40ft Standard",
      capacity: "67.7 m³",
      weight: "26,680 kg",
      icon: "📦📦",
    },
    {
      type: "40FT_HC",
      name: "40ft High Cube",
      capacity: "76.3 m³",
      weight: "26,580 kg",
      icon: "📦📦⬆️",
    },
    {
      type: "20FT_REEFER",
      name: "20ft Reefer",
      capacity: "28.0 m³",
      weight: "24,300 kg",
      icon: "❄️",
    },
    {
      type: "40FT_REEFER",
      name: "40ft Reefer",
      capacity: "59.0 m³",
      weight: "25,630 kg",
      icon: "❄️❄️",
    },
  ];

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        Select Container Type
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {containerTypes.map((container) => (
          <div
            key={container.type}
            onClick={() =>
              setFormData({ ...formData, containerType: container.type })
            }
            className={`p-6 rounded-xl cursor-pointer transition-all ${
              formData.containerType === container.type
                ? "bg-blue-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="text-4xl mb-3">{container.icon}</div>
            <div className="text-white font-semibold text-lg mb-2">
              {container.name}
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-white/70">
                Capacity: {container.capacity}
              </div>
              <div className="text-white/70">
                Max Weight: {container.weight}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
        >
          Continue to Vessel Schedule
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
}

function Step2VesselSchedule({ formData, onNext, onBack }: any) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Vessel Schedule</h2>

      <div className="space-y-4 mb-8">
        <VesselCard
          vesselName="MSC OSCAR"
          voyage="V123W"
          etd="2025-01-10"
          eta="2025-01-24"
          transitDays={14}
          price={2000}
          selected={true}
        />
        <VesselCard
          vesselName="MAERSK ESSEX"
          voyage="V456E"
          etd="2025-01-12"
          eta="2025-01-26"
          transitDays={14}
          price={2200}
          selected={false}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
        >
          Continue
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
}

function Step3Documentation({ formData, onNext, onBack }: any) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Documentation</h2>

      <div className="space-y-4 mb-8">
        <DocumentItem name="Commercial Invoice" status="READY" />
        <DocumentItem name="Packing List" status="READY" />
        <DocumentItem name="Bill of Lading" status="AUTO_GENERATE" />
        <DocumentItem name="Certificate of Origin" status="REQUIRED" />
        <DocumentItem name="VGM Certificate" status="AUTO_CALCULATE" />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
        >
          <i className="ri-arrow-left-line mr-2"></i>Back
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium"
        >
          Continue<i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
}

function Step4Confirmation({ formData, onBook, onBack }: any) {
  const [agreed, setAgreed] = useState(false);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="ri-ship-line text-white text-4xl"></i>
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">Ready to Book!</h2>

      <div className="mt-8 p-6 bg-white/5 rounded-xl">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded"
          />
          <span className="text-white/80 text-sm">
            I agree to terms and conditions
          </span>
        </label>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
        >
          <i className="ri-arrow-left-line mr-2"></i>Back
        </button>
        <button
          onClick={onBook}
          disabled={!agreed}
          className="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold text-lg disabled:opacity-50"
        >
          <i className="ri-check-double-line mr-2"></i>Confirm Booking
        </button>
      </div>
    </motion.div>
  );
}

function VesselCard({
  vesselName,
  voyage,
  etd,
  eta,
  transitDays,
  price,
  selected,
}: any) {
  return (
    <div
      className={`p-6 rounded-xl cursor-pointer transition-all ${
        selected
          ? "bg-blue-500/20 border-2 border-blue-500"
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-white font-semibold text-lg">{vesselName}</div>
          <div className="text-white/50 text-sm">Voyage: {voyage}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">${price}</div>
          <div className="text-white/50 text-xs">per container</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-white/50 mb-1">ETD</div>
          <div className="text-white">{etd}</div>
        </div>
        <div>
          <div className="text-white/50 mb-1">Transit</div>
          <div className="text-white">{transitDays} days</div>
        </div>
        <div>
          <div className="text-white/50 mb-1">ETA</div>
          <div className="text-white">{eta}</div>
        </div>
      </div>
    </div>
  );
}

function DocumentItem({ name, status }: { name: string; status: string }) {
  const statusColors = {
    READY: "text-green-400 bg-green-500/20",
    REQUIRED: "text-orange-400 bg-orange-500/20",
    AUTO_GENERATE: "text-blue-400 bg-blue-500/20",
    AUTO_CALCULATE: "text-purple-400 bg-purple-500/20",
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
      <span className="text-white">{name}</span>
      <span
        className={`px-3 py-1 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}
      >
        {status.replace("_", " ")}
      </span>
    </div>
  );
}
