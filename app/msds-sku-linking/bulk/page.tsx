"use client";

/**
 * Bulk Link Creation Page
 * Create multiple MSDS-SKU links at once
 */

import { useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { BulkLinkRequest } from "@/types/msdsSkuLinking";

export default function BulkLinkPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [customerId, setCustomerId] = useState("");
  const [links, setLinks] = useState<
    Array<{ msdsId: string; skuIds: string[] }>
  >([{ msdsId: "", skuIds: [""] }]);
  const [autoApprove, setAutoApprove] = useState(false);
  const [requireCustomerApproval, setRequireCustomerApproval] = useState(true);

  const addLinkRow = () => {
    setLinks([...links, { msdsId: "", skuIds: [""] }]);
  };

  const removeLinkRow = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const addSkuToRow = (rowIndex: number) => {
    const newLinks = [...links];
    newLinks[rowIndex].skuIds.push("");
    setLinks(newLinks);
  };

  const removeSkuFromRow = (rowIndex: number, skuIndex: number) => {
    const newLinks = [...links];
    newLinks[rowIndex].skuIds = newLinks[rowIndex].skuIds.filter(
      (_, i) => i !== skuIndex,
    );
    setLinks(newLinks);
  };

  const updateLink = (
    rowIndex: number,
    field: "msdsId" | "skuIds",
    value: string | string[],
    skuIndex?: number,
  ) => {
    const newLinks = [...links];
    if (field === "msdsId") {
      newLinks[rowIndex].msdsId = value as string;
    } else if (field === "skuIds" && skuIndex !== undefined) {
      newLinks[rowIndex].skuIds[skuIndex] = value as string;
    }
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate
    if (!customerId) {
      setError("Customer ID is required");
      setLoading(false);
      return;
    }

    const validLinks = links.filter(
      (link) => link.msdsId && link.skuIds.some((id) => id),
    );
    if (validLinks.length === 0) {
      setError("At least one valid link is required");
      setLoading(false);
      return;
    }

    const request: BulkLinkRequest = {
      customerId,
      links: validLinks.map((link) => ({
        msdsId: link.msdsId,
        skuIds: link.skuIds.filter((id) => id),
        matchingStrategy: "BULK_IMPORT" as any,
      })),
      autoApprove,
      requireCustomerApproval,
    };

    try {
      const response = await fetch("/api/msds-sku-linking/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setSuccess(true);
      } else {
        setError(data.error || "Failed to create bulk links");
      }
    } catch (err) {
      setError("Failed to create bulk links");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Bulk Link Creation"
      description="Create multiple MSDS-SKU links at once"
      icon="ri-file-transfer-line"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {success && result && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 font-semibold mb-2">Success!</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Total: {result.total}</div>
              <div>Successful: {result.successful}</div>
              <div>Failed: {result.failed}</div>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 text-xs text-red-400">
                <div className="font-semibold mb-1">Errors:</div>
                {result.errors.map((err: any, idx: number) => (
                  <div key={idx}>{err.error}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Customer ID *
            </label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
              placeholder="Enter customer ID"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">Auto-approve links</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireCustomerApproval}
                onChange={(e) => setRequireCustomerApproval(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-300">
                Require customer approval
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Links</h3>
            <button
              type="button"
              onClick={addLinkRow}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm"
            >
              <i className="ri-add-line mr-2"></i>
              Add Link
            </button>
          </div>

          {links.map((link, rowIndex) => (
            <motion.div
              key={rowIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  Link #{rowIndex + 1}
                </span>
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinkRow(rowIndex)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  MSDS ID *
                </label>
                <input
                  type="text"
                  value={link.msdsId}
                  onChange={(e) =>
                    updateLink(rowIndex, "msdsId", e.target.value)
                  }
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="MSDS ID"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-gray-400">
                    SKU IDs *
                  </label>
                  <button
                    type="button"
                    onClick={() => addSkuToRow(rowIndex)}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <i className="ri-add-line mr-1"></i>
                    Add SKU
                  </button>
                </div>
                <div className="space-y-2">
                  {link.skuIds.map((skuId, skuIndex) => (
                    <div key={skuIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={skuId}
                        onChange={(e) =>
                          updateLink(
                            rowIndex,
                            "skuIds",
                            e.target.value,
                            skuIndex,
                          )
                        }
                        required
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        placeholder={`SKU ID ${skuIndex + 1}`}
                      />
                      {link.skuIds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkuFromRow(rowIndex, skuIndex)}
                          className="p-2 text-red-400 hover:text-red-300"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Links"}
          </button>
        </div>
      </form>
    </PageTemplate>
  );
}
