/**
 * Location Intelligence Input Component
 *
 * Revolutionary location input that processes:
 * - Text descriptions
 * - Google location sharing
 * - WhatsApp location messages
 * - Direct coordinates
 *
 * Auto-creates zone drafts with accuracy scoring
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LocationIntelligenceResult } from "@/lib/services/geofence/ai/locationIntelligenceService";

interface LocationIntelligenceInputProps {
  onResult: (result: LocationIntelligenceResult) => void;
  onError?: (error: string) => void;
  tenantId?: string;
}

export default function LocationIntelligenceInput({
  onResult,
  onError,
  tenantId = "default",
}: LocationIntelligenceInputProps) {
  const [inputType, setInputType] = useState<
    "TEXT" | "COORDINATES" | "GOOGLE_LOCATION" | "WHATSAPP_LOCATION"
  >("TEXT");
  const [textInput, setTextInput] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<LocationIntelligenceResult | null>(null);

  const handleProcess = async () => {
    setProcessing(true);
    setResult(null);
    if (onError) onError("");

    try {
      let requestBody: any = {
        tenantId,
      };

      if (inputType === "TEXT") {
        if (!textInput.trim()) {
          throw new Error("Please enter a location description");
        }
        requestBody = {
          type: "TEXT",
          source: "user",
          data: { text: textInput },
        };
      } else if (inputType === "COORDINATES") {
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Please enter valid coordinates");
        }
        requestBody = {
          type: "COORDINATES",
          source: "user",
          data: { coordinates: { lat, lng } },
        };
      } else if (
        inputType === "GOOGLE_LOCATION" ||
        inputType === "WHATSAPP_LOCATION"
      ) {
        // For Google/WhatsApp, would get location from browser/WhatsApp API
        // For now, use coordinates
        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Please enter valid coordinates");
        }
        requestBody = {
          type: inputType,
          source: inputType === "GOOGLE_LOCATION" ? "google" : "whatsapp",
          data: {
            location: {
              lat,
              lng,
              accuracy: 50, // Default accuracy
            },
          },
        };
      }

      const response = await fetch("/api/geofence/location-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process location");
      }

      const data = await response.json();
      if (data.success && data.data) {
        setResult(data.data);
        onResult(data.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (onError) onError(errorMessage);
      console.error("Error processing location:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatInput(position.coords.latitude.toFixed(6));
          setLngInput(position.coords.longitude.toFixed(6));
          setInputType("COORDINATES");
        },
        (error) => {
          if (onError) onError(`Geolocation error: ${error.message}`);
        },
      );
    } else {
      if (onError) onError("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          🤖 AI-Powered Location Intelligence
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter location in any format - text, coordinates, or share from
          Google/WhatsApp. Our AI will automatically create a zone draft with
          accuracy scoring.
        </p>
      </div>

      {/* Input Type Selection */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            "TEXT",
            "COORDINATES",
            "GOOGLE_LOCATION",
            "WHATSAPP_LOCATION",
          ] as const
        ).map((type) => (
          <button
            key={type}
            onClick={() => setInputType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === type
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {type === "TEXT" && "📝 Text"}
            {type === "COORDINATES" && "📍 Coordinates"}
            {type === "GOOGLE_LOCATION" && "🗺️ Google"}
            {type === "WHATSAPP_LOCATION" && "💬 WhatsApp"}
          </button>
        ))}
      </div>

      {/* Text Input */}
      {inputType === "TEXT" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location Description
          </label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g., Main warehouse in Riyadh Industrial City, Building 5"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            onKeyPress={(e) => e.key === "Enter" && handleProcess()}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Describe the location naturally - our AI will understand and geocode
            it
          </p>
        </div>
      )}

      {/* Coordinates Input */}
      {(inputType === "COORDINATES" ||
        inputType === "GOOGLE_LOCATION" ||
        inputType === "WHATSAPP_LOCATION") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="24.7136"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="46.6753"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="col-span-2">
            <button
              onClick={handleUseCurrentLocation}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              📍 Use Current Location
            </button>
          </div>
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={handleProcess}
        disabled={processing}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {processing ? "🔄 Processing..." : "🚀 Process Location with AI"}
      </button>

      {/* Result Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Location Intelligence Result
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  result.accuracy.level === "VERY_HIGH"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : result.accuracy.level === "HIGH"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : result.accuracy.level === "MEDIUM"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}
              >
                {result.accuracy.level} ({result.accuracy.score}%)
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Address:</strong> {result.location.formattedAddress}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Coordinates:</strong>{" "}
                {result.location.coordinates.lat.toFixed(6)},{" "}
                {result.location.coordinates.lng.toFixed(6)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Suggested Zone:</strong> {result.zoneDraft.name} (
                {result.zoneDraft.type})
              </p>
            </div>

            {result.zoneDraft.warnings.length > 0 && (
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  ⚠️ Warnings:
                </p>
                <ul className="mt-1 text-xs text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  {result.zoneDraft.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.zoneDraft.suggestions.length > 0 && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  💡 Suggestions:
                </p>
                <ul className="mt-1 text-xs text-blue-700 dark:text-blue-300 list-disc list-inside">
                  {result.zoneDraft.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
