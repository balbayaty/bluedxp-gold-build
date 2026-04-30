"use client";

import { useState } from "react";

export default function BrainDebuggerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Default test scenario: Chemical Compatibility
  const [inputJson, setInputJson] = useState(
    JSON.stringify(
      {
        chemical1: {
          name: "Sulfuric Acid",
          cas: "7664-93-9",
          characteristics: ["Corrosive", "Acid"],
        },
        chemical2: {
          name: "Sodium Hypochlorite",
          cas: "7681-52-9",
          characteristics: ["Corrosive", "Base", "Oxidizer"],
        },
        conditions: { temperature: 25, storage: "Adjacent" },
      },
      null,
      2,
    ),
  );

  // NEW STATES
  const [activeTab, setActiveTab] = useState<
    "brain" | "logistics" | "whatsapp" | "sds"
  >("brain");

  // Logistics State
  const [logisticsInput, setLogisticsInput] = useState(
    JSON.stringify({ cargoType: "Sulfuric Acid Drums", temp: 45 }, null, 2),
  );

  // WhatsApp State
  const [whatsappInput, setWhatsappInput] = useState(
    "Help! Truck 402 just tipped over on Highway 15. Liquid leaking everywhere. Driver is safe.",
  );

  // SDS State
  const [sdsInput, setSdsInput] = useState(`SECTION 1: PRODUCT IDENTIFICATION
Product Name: METHANOL
CAS No: 67-56-1
Manufacturer: Industrial Chem Corp

SECTION 2: HAZARDS
Danger! Flammable Liquid. Toxic if swallowed.
H225: Highly flammable liquid and vapor
H301: Toxic if swallowed`);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ai/brain-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "chemical-compatibility",
          input: JSON.parse(inputJson),
          tenantId: "debug-user",
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to call brain", details: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleLogisticsTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/logistics-debug", {
        method: "POST",
        body: logisticsInput,
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  const handleWhatsappTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/whatsapp-debug", {
        method: "POST",
        body: JSON.stringify({ message: whatsappInput }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  const handleSdsTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/sds-debug", {
        method: "POST",
        body: JSON.stringify({ text: sdsInput }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ error: String(e) });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
          🧠 BlueDXP Universal Debugger
        </h1>
        <p className="text-gray-600 mt-2">
          Verify all transplanted organs:{" "}
          <span className="font-semibold text-blue-600">
            Deep Consensus Brain
          </span>
          , <span className="font-semibold text-green-600">Logistics ML</span>,{" "}
          <span className="font-semibold text-purple-600">WhatsApp AI</span>,
          and <span className="font-semibold text-orange-600">SDS Parser</span>.
        </p>

        <div className="flex gap-4 mt-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("brain");
              setResult(null);
            }}
            className={`pb-3 px-4 font-medium ${activeTab === "brain" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Deep Consensus
          </button>
          <button
            onClick={() => {
              setActiveTab("logistics");
              setResult(null);
            }}
            className={`pb-3 px-4 font-medium ${activeTab === "logistics" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            Logistics ML
          </button>
          <button
            onClick={() => {
              setActiveTab("whatsapp");
              setResult(null);
            }}
            className={`pb-3 px-4 font-medium ${activeTab === "whatsapp" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            WhatsApp AI
          </button>
          <button
            onClick={() => {
              setActiveTab("sds");
              setResult(null);
            }}
            className={`pb-3 px-4 font-medium ${activeTab === "sds" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
          >
            SDS Parser
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            {activeTab === "brain" && "1. Chemical Scenario (JSON)"}
            {activeTab === "logistics" && "1. Cargo Parameters (JSON)"}
            {activeTab === "whatsapp" && "1. Driver Message (Text)"}
            {activeTab === "sds" && "1. Raw SDS Text"}
          </h2>

          <div className="mb-4">
            {activeTab === "brain" && (
              <textarea
                className="w-full h-96 font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
              />
            )}
            {activeTab === "logistics" && (
              <textarea
                className="w-full h-96 font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={logisticsInput}
                onChange={(e) => setLogisticsInput(e.target.value)}
              />
            )}
            {activeTab === "whatsapp" && (
              <textarea
                className="w-full h-96 font-sans text-lg p-4 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={whatsappInput}
                onChange={(e) => setWhatsappInput(e.target.value)}
                placeholder="Type a message here..."
              />
            )}
            {activeTab === "sds" && (
              <textarea
                className="w-full h-96 font-mono text-xs p-4 bg-gray-50 text-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                value={sdsInput}
                onChange={(e) => setSdsInput(e.target.value)}
                placeholder="Paste raw SDS text here (e.g. SECTION 1: IDENTIFICATION...)"
              />
            )}
          </div>

          <button
            onClick={
              activeTab === "brain"
                ? handleTest
                : activeTab === "logistics"
                  ? handleLogisticsTest
                  : activeTab === "whatsapp"
                    ? handleWhatsappTest
                    : handleSdsTest
            }
            disabled={loading}
            className={`w-full py-3 px-6 rounded-lg text-white font-medium transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? "Processing..." : "⚡ Run Verification"}
          </button>
        </div>

        {/* OUTPUT SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            2. System Response
          </h2>
          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-blue-600 font-medium">Running Logic...</p>
                </div>
              </div>
            )}

            {result ? (
              <div className="h-full overflow-auto p-4">
                <pre className="font-mono text-xs text-gray-600 overflow-x-auto bg-gray-100 p-4 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Ready to verify.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
