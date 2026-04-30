"use client";

/**
 * Link Creation Form Component
 * Form for creating MSDS-SKU links manually or from suggestions
 */

import { useState, useEffect } from "react";
import { MSDSDocument } from "@/types/chemical";
import { SKU } from "@/types/sku";
import { MatchingStrategy } from "@/types/msdsSkuLinking";

interface LinkCreationFormProps {
  msdsId?: string;
  skuId?: string;
  customerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialStrategy?: MatchingStrategy;
  initialConfidence?: number;
}

export default function LinkCreationForm({
  msdsId,
  skuId,
  customerId,
  onSuccess,
  onCancel,
  initialStrategy,
  initialConfidence,
}: LinkCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msdsOptions, setMsdsOptions] = useState<MSDSDocument[]>([]);
  const [skuOptions, setSkuOptions] = useState<SKU[]>([]);
  const [selectedMsdsId, setSelectedMsdsId] = useState(msdsId || "");
  const [selectedSkuId, setSelectedSkuId] = useState(skuId || "");
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customerId || "",
  );
  const [strategy, setStrategy] = useState<MatchingStrategy>(
    initialStrategy || "MANUAL",
  );
  const [confidence, setConfidence] = useState(initialConfidence || 0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!msdsId) {
      loadMSDSOptions();
    }
    if (!skuId) {
      loadSKUOptions();
    }
  }, []);

  const loadMSDSOptions = async () => {
    try {
      // Load from API or localStorage fallback
      const response = await fetch("/api/chemical/msds/batch?limit=100");
      if (response.ok) {
        const data = await response.json();
        if (data.documents && Array.isArray(data.documents)) {
          setMsdsOptions(data.documents);
          return;
        }
      }

      // Fallback: Try localStorage for demo mode
      const stored = localStorage.getItem("msds_documents");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMsdsOptions(parsed);
          return;
        }
      }

      setMsdsOptions([]);
    } catch (err) {
      console.error("Error loading MSDS options:", err);
      setMsdsOptions([]);
    }
  };

  const loadSKUOptions = async () => {
    try {
      // Load from API
      const response = await fetch("/api/wms/skus?limit=100");
      if (response.ok) {
        const data = await response.json();
        if (data.skus && Array.isArray(data.skus)) {
          setSkuOptions(data.skus);
          return;
        }
        if (Array.isArray(data)) {
          setSkuOptions(data);
          return;
        }
      }

      // Fallback: Try localStorage for demo mode
      const stored = localStorage.getItem("sku_list");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSkuOptions(parsed);
          return;
        }
      }

      setSkuOptions([]);
    } catch (err) {
      console.error("Error loading SKU options:", err);
      setSkuOptions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedMsdsId || !selectedSkuId || !selectedCustomerId) {
      setError("MSDS, SKU, and Customer are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/msds-sku-linking/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msdsId: selectedMsdsId,
          skuId: selectedSkuId,
          customerId: selectedCustomerId,
          matchingStrategy: strategy,
          confidenceScore: confidence,
          notes: notes || undefined,
          status: "PENDING",
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
      } else {
        setError(data.error || "Failed to create link");
      }
    } catch (err) {
      setError("Failed to create link");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          MSDS {msdsId && "(Fixed)"}
        </label>
        {msdsId ? (
          <input
            type="text"
            value={msdsId}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          />
        ) : (
          <select
            value={selectedMsdsId}
            onChange={(e) => setSelectedMsdsId(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Select MSDS</option>
            {msdsOptions.map((msds) => (
              <option key={msds.id} value={msds.id}>
                {msds.chemicalName} ({msds.id})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          SKU {skuId && "(Fixed)"}
        </label>
        {skuId ? (
          <input
            type="text"
            value={skuId}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          />
        ) : (
          <select
            value={selectedSkuId}
            onChange={(e) => setSelectedSkuId(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          >
            <option value="">Select SKU</option>
            {skuOptions.map((sku) => (
              <option key={sku.id} value={sku.id}>
                {sku.skuCode} - {sku.materialDescription}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Customer {customerId && "(Fixed)"}
        </label>
        {customerId ? (
          <input
            type="text"
            value={customerId}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
          />
        ) : (
          <input
            type="text"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            required
            placeholder="Customer ID"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Matching Strategy
        </label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as MatchingStrategy)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
        >
          <option value="MANUAL">Manual</option>
          <option value="CAS_NUMBER">CAS Number</option>
          <option value="PRODUCT_NAME">Product Name</option>
          <option value="UN_NUMBER">UN Number</option>
          <option value="CHEMICAL_FORMULA">Chemical Formula</option>
          <option value="MANUFACTURER">Manufacturer</option>
          <option value="CATEGORY">Category</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Confidence Score (0-100)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value) || 0)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500"
          placeholder="Add any notes about this link..."
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Link"}
        </button>
      </div>
    </form>
  );
}
