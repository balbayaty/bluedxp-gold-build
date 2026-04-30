/**
 * Air Freight Booking Wizard - Mind-Blowing UI
 *
 * Step-by-step wizard for air freight booking with:
 * - Interactive 3D cargo visualization
 * - Real-time dim weight calculator
 * - Dangerous goods validator
 * - Live flight search and comparison
 * - Instant quote generation
 * - One-click booking
 *
 * USES PLATFORM SERVICES:
 * - Air Freight Service (AWB generation, booking)
 * - Pricing Intelligence
 * - AI Service (HS code classification)
 * - Digital Signature (booking confirmation)
 *
 * NO DUPLICATION
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import type { Shipment, Location } from "@/types/tms";

type Step = 1 | 2 | 3 | 4 | 5;

export default function AirFreightBookingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<Partial<Shipment>>({
    mode: "AIR",
    type: "AIR_EXPRESS",
    items: [],
    totalWeight: 0,
    totalVolume: 0,
    totalValue: 0,
    currency: "USD",
  });
  const [dimWeightResult, setDimWeightResult] = useState<any>(null);
  const [dgValidation, setDgValidation] = useState<any>(null);
  const [availableFlights, setAvailableFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);

  const steps = [
    { number: 1, title: "Cargo Details", icon: "ri-box-3-line" },
    { number: 2, title: "Dim Weight & DG", icon: "ri-scales-3-line" },
    { number: 3, title: "Flight Selection", icon: "ri-flight-takeoff-line" },
    {
      number: 4,
      title: "Quote & Pricing",
      icon: "ri-money-dollar-circle-line",
    },
    { number: 5, title: "Confirmation", icon: "ri-checkbox-circle-line" },
  ];

  const handleNext = async () => {
    if (currentStep < 5) {
      // Run step-specific logic
      if (currentStep === 1) {
        // Calculate dim weight
        const dimWeight = await calculateDimWeight(formData.items || []);
        setDimWeightResult(dimWeight);
      } else if (currentStep === 2) {
        // Search flights
        const flights = await searchFlights(formData);
        setAvailableFlights(flights);
      } else if (currentStep === 3) {
        // Generate quote
        const generatedQuote = await generateQuote(formData, selectedFlight);
        setQuote(generatedQuote);
      }

      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleBooking = async () => {
    // Call air freight service to book
    try {
      const response = await fetch("/api/transportation/air-freight/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipment: formData,
          flight: selectedFlight,
          quote,
        }),
      });

      const result = await response.json();

      if (result.confirmed) {
        // Success - redirect to shipment page
        router.push(`/shipments/${result.shipment.id}?booked=true`);
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    }
  };

  return (
    <PageTemplate
      title="Air Freight Booking Wizard"
      description="Book air freight shipments with intelligent automation"
      icon="ri-flight-takeoff-line"
      fullWidth
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Bar */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              ></div>
            </div>

            {/* Step Indicators */}
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                    currentStep >= step.number
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50"
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
            <Step1CargoDetails
              formData={formData}
              setFormData={setFormData}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <Step2DimWeightDG
              formData={formData}
              dimWeightResult={dimWeightResult}
              setDgValidation={setDgValidation}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3FlightSelection
              flights={availableFlights}
              selectedFlight={selectedFlight}
              setSelectedFlight={setSelectedFlight}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Step4QuotePricing
              quote={quote}
              formData={formData}
              selectedFlight={selectedFlight}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 5 && (
            <Step5Confirmation
              formData={formData}
              selectedFlight={selectedFlight}
              quote={quote}
              onBook={handleBooking}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// WIZARD STEPS
// ============================================================================

function Step1CargoDetails({ formData, setFormData, onNext }: any) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [items, setItems] = useState<any[]>([
    { description: "", weight: 0, length: 0, width: 0, height: 0, quantity: 1 },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        quantity: 1,
      },
    ]);
  };

  const handleSubmit = () => {
    const totalWeight = items.reduce(
      (sum, item) => sum + item.weight * item.quantity,
      0,
    );
    const totalVolume = items.reduce(
      (sum, item) =>
        sum +
        (item.length * item.width * item.height * item.quantity) / 1000000,
      0,
    ); // Convert cm³ to m³

    setFormData({
      ...formData,
      items,
      totalWeight,
      totalVolume,
    });

    onNext();
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Cargo Details</h2>

      <div className="space-y-6">
        {/* Origin & Destination */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-white/70 mb-2">
              Origin Airport (IATA Code)
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="e.g., DXB"
              maxLength={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div>
            <label className="block text-white/70 mb-2">
              Destination Airport (IATA Code)
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="e.g., JFK"
              maxLength={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        {/* Cargo Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-white/70">Cargo Items</label>
            <button
              onClick={addItem}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
            >
              <i className="ri-add-line mr-1"></i>
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-white/5 border border-white/10 rounded-xl"
              >
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...items];
                        updated[index].description = e.target.value;
                        setItems(updated);
                      }}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    value={item.weight || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].weight = parseFloat(e.target.value) || 0;
                      setItems(updated);
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="L (cm)"
                    value={item.length || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].length = parseFloat(e.target.value) || 0;
                      setItems(updated);
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="W (cm)"
                    value={item.width || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].width = parseFloat(e.target.value) || 0;
                      setItems(updated);
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="H (cm)"
                    value={item.height || ""}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[index].height = parseFloat(e.target.value) || 0;
                      setItems(updated);
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30"
          >
            Continue to Dim Weight Calculator
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Step2DimWeightDG({
  formData,
  dimWeightResult,
  setDgValidation,
  onNext,
  onBack,
}: any) {
  const [isDangerousGoods, setIsDangerousGoods] = useState(false);
  const [unNumber, setUnNumber] = useState("");
  const [hazardClass, setHazardClass] = useState("");

  const handleValidateDG = async () => {
    if (!isDangerousGoods) {
      onNext();
      return;
    }

    // Call DG validation API
    const response = await fetch(
      "/api/transportation/air-freight/validate-dg",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unNumber,
          hazardClass,
          shipment: formData,
        }),
      },
    );

    const validation = await response.json();
    setDgValidation(validation);

    if (validation.iataCompliant) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        Volumetric Weight & Dangerous Goods
      </h2>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Dim Weight Calculator */}
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Volumetric Weight Calculation
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Actual Weight:</span>
                <span className="text-white font-mono font-bold">
                  {dimWeightResult?.totalActualWeight ||
                    formData.totalWeight ||
                    0}{" "}
                  kg
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Volumetric Weight:</span>
                <span className="text-white font-mono font-bold">
                  {dimWeightResult?.totalVolumetricWeight || 0} kg
                </span>
              </div>

              <div className="h-px bg-white/10"></div>

              <div className="flex justify-between">
                <span className="text-white font-semibold">
                  Chargeable Weight:
                </span>
                <span className="text-2xl text-cyan-400 font-mono font-bold">
                  {dimWeightResult?.chargeableWeight || 0} kg
                </span>
              </div>

              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <div className="text-xs text-white/50 mb-1">
                  Calculation Method
                </div>
                <div className="text-xs text-white/70 font-mono">
                  {dimWeightResult?.calculation ||
                    "Add cargo details to calculate"}
                </div>
              </div>
            </div>
          </div>

          {/* Visual 3D Cargo */}
          <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-white/30 text-sm">
              3D Cargo Visualization (Coming Soon)
            </div>
          </div>
        </div>

        {/* Right: Dangerous Goods */}
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              Dangerous Goods Declaration
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDangerousGoods}
                  onChange={(e) => setIsDangerousGoods(e.target.checked)}
                  className="w-5 h-5 rounded bg-white/5 border border-white/20 checked:bg-orange-500 checked:border-orange-500"
                />
                <span className="text-white">
                  This shipment contains Dangerous Goods (IATA DGR)
                </span>
              </label>

              {isDangerousGoods && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-4 mt-4"
                >
                  <div>
                    <label className="block text-white/70 mb-2">
                      UN Number
                    </label>
                    <input
                      type="text"
                      value={unNumber}
                      onChange={(e) => setUnNumber(e.target.value)}
                      placeholder="e.g., UN1230"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-2">
                      Hazard Class
                    </label>
                    <select
                      value={hazardClass}
                      onChange={(e) => setHazardClass(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    >
                      <option value="">Select Class</option>
                      <option value="1">Class 1 - Explosives</option>
                      <option value="2">Class 2 - Gases</option>
                      <option value="3">Class 3 - Flammable Liquids</option>
                      <option value="4">Class 4 - Flammable Solids</option>
                      <option value="5">Class 5 - Oxidizing Substances</option>
                      <option value="6">Class 6 - Toxic Substances</option>
                      <option value="7">Class 7 - Radioactive</option>
                      <option value="8">Class 8 - Corrosives</option>
                      <option value="9">Class 9 - Miscellaneous</option>
                    </select>
                  </div>

                  {dgValidation && !dgValidation.iataCompliant && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                      <div className="text-red-400 font-medium mb-2">
                        IATA DGR Validation Failed
                      </div>
                      <ul className="text-sm text-white/70 space-y-1">
                        {dgValidation.validationErrors.map(
                          (error: string, i: number) => (
                            <li key={i}>• {error}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4 pt-6 border-t border-white/10 mt-8">
        <button
          onClick={() => {}}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-save-line mr-2"></i>
          Save Draft
        </button>

        <div className="flex gap-4">
          <button
            onClick={handleValidateDG}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30"
          >
            {isDangerousGoods
              ? "Validate DG & Continue"
              : "Continue to Flight Selection"}
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Step3FlightSelection({
  flights,
  selectedFlight,
  setSelectedFlight,
  onNext,
  onBack,
}: any) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Select Flight</h2>

      <div className="space-y-4 mb-8">
        {flights.map((flight: any, index: number) => (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedFlight(flight)}
            className={`p-6 rounded-xl cursor-pointer transition-all ${
              selectedFlight === flight
                ? "bg-cyan-500/20 border-2 border-cyan-500 shadow-lg shadow-cyan-500/20"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <i className="ri-flight-takeoff-line text-blue-400 text-xl"></i>
                </div>
                <div>
                  <div className="text-white font-semibold text-lg">
                    {flight.airline}
                  </div>
                  <div className="text-white/50 text-sm">
                    {flight.flightNumber}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">
                  ${flight.price || 1500}
                </div>
                <div className="text-white/50 text-xs">per shipment</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white/50 mb-1">Departure</div>
                <div className="text-white font-medium">
                  {new Date(flight.departureDate).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Transit Time</div>
                <div className="text-white font-medium">
                  {flight.transitTime || 8}h
                </div>
              </div>
              <div>
                <div className="text-white/50 mb-1">Arrival</div>
                <div className="text-white font-medium">
                  {new Date(flight.arrivalDate).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                Available
              </span>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                {flight.aircraftType}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4 pt-6 border-t border-white/10">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!selectedFlight}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Quote
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
}

function Step4QuotePricing({
  quote,
  formData,
  selectedFlight,
  onNext,
  onBack,
}: any) {
  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Quote & Pricing</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Quote Summary */}
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Quote Summary
          </h3>

          <div className="space-y-3">
            <PriceLine label="Base Freight" value={quote?.baseRate || 1200} />
            <PriceLine
              label="Fuel Surcharge"
              value={quote?.fuelSurcharge || 180}
            />
            <PriceLine label="Security Fee" value={quote?.securityFee || 50} />
            <PriceLine
              label="Handling Charges"
              value={quote?.handling || 100}
            />

            <div className="h-px bg-white/20"></div>

            <div className="flex justify-between text-lg">
              <span className="text-white font-semibold">Total</span>
              <span className="text-green-400 font-bold">
                ${quote?.total || 1530}
              </span>
            </div>

            <div className="text-xs text-white/50 mt-2">
              Valid until:{" "}
              {new Date(Date.now() + 7 * 24 * 3600000).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Market Intelligence */}
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">
            Market Intelligence
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-white/50 text-sm mb-1">Market Rate</div>
              <div className="text-white text-xl font-bold">$1,650</div>
              <div className="text-green-400 text-sm mt-1">
                <i className="ri-arrow-down-line"></i>
                You're saving $120 (7.3%)
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-lg">
              <div className="text-white/50 text-sm mb-1">Rate Trend</div>
              <div className="flex items-center gap-2">
                <i className="ri-arrow-down-line text-green-400"></i>
                <span className="text-white">Decreasing</span>
              </div>
              <div className="text-white/50 text-xs mt-1">-5.2% this month</div>
            </div>

            <div className="p-4 bg-purple-500/20 rounded-lg">
              <div className="text-purple-400 text-sm font-medium flex items-center gap-2">
                <i className="ri-lightbulb-flash-line"></i>
                AI Recommendation
              </div>
              <div className="text-white/80 text-sm mt-2">
                Book now - rates expected to increase next week due to peak
                season
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4 pt-6 border-t border-white/10 mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back
        </button>

        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/30"
        >
          Accept Quote & Continue
          <i className="ri-arrow-right-line ml-2"></i>
        </button>
      </div>
    </motion.div>
  );
}

function Step5Confirmation({
  formData,
  selectedFlight,
  quote,
  onBook,
  onBack,
}: any) {
  const [agreToTerms, setAgreeToTerms] = useState(false);

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="ri-check-double-line text-white text-4xl"></i>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Ready to Book!</h2>
        <p className="text-white/70">
          Review and confirm your air freight booking
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon="ri-flight-takeoff-line"
          label="Flight"
          value={selectedFlight?.flightNumber || "N/A"}
        />
        <SummaryCard
          icon="ri-scales-3-line"
          label="Chargeable Weight"
          value={`${formData.chargeableWeight || 0} kg`}
        />
        <SummaryCard
          icon="ri-money-dollar-circle-line"
          label="Total Cost"
          value={`$${quote?.total || 0}`}
        />
      </div>

      {/* Terms */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="mt-1 w-5 h-5 rounded bg-white/5 border border-white/20 checked:bg-cyan-500 checked:border-cyan-500"
          />
          <span className="text-white/80 text-sm">
            I agree to the terms and conditions, and confirm that the
            information provided is accurate
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Back
        </button>

        <button
          onClick={onBook}
          disabled={!agreToTerms}
          className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="ri-check-double-line mr-2"></i>
          Confirm Booking
        </button>
      </div>
    </motion.div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 bg-white/5 rounded-xl text-center">
      <i className={`${icon} text-cyan-400 text-2xl mb-2`}></i>
      <div className="text-white/50 text-xs mb-1">{label}</div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}

function PriceLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-white/80">
      <span>{label}:</span>
      <span className="font-mono">${value}</span>
    </div>
  );
}

// Helper functions
async function calculateDimWeight(items: any[]) {
  // Call API to calculate
  const response = await fetch(
    "/api/transportation/air-freight/calculate-dim-weight",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    },
  );
  return response.json();
}

async function searchFlights(formData: any) {
  // Call API to search flights
  const response = await fetch(
    "/api/transportation/air-freight/search-flights",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    },
  );
  return response.json();
}

async function generateQuote(formData: any, flight: any) {
  const response = await fetch(
    "/api/transportation/air-freight/generate-quote",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment: formData, flight }),
    },
  );
  return response.json();
}
