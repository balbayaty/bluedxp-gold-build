/**
 * Client Portal - Proposal Signing Page
 * Beautiful, intuitive signature interface for customers
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function ClientProposalSignPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = params.id as string;
  const token = searchParams.get("token");

  const [proposal, setProposal] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<any>(null);
  const [signing, setSigning] = useState(false);
  const [signatureType, setSignatureType] = useState<
    "draw" | "type" | "upload"
  >("draw");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      const res = await fetch(
        `/api/proposals/enhanced?proposalId=${proposalId}`,
      );
      const data = await res.json();
      if (data.success) {
        setProposal(data.data?.[0] || data.data);
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const res = await fetch(
        `/api/v1/signatures/requests/${signatureData?.requestId}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signatureType: "simple_electronic",
            visualSignature: signatureImage || typedName,
            signingReason: "Proposal acceptance",
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        router.push(`/client/proposals/${proposalId}?signed=true`);
      }
    } catch (error) {
      console.error("Error signing:", error);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading proposal...
          </p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Proposal Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The proposal you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {proposal.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Proposal #{proposal.proposalNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Valid Until
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(proposal.validUntil || "").toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Proposal Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h2 className="text-xl font-bold mb-2">Review & Sign Proposal</h2>
            <p className="text-blue-100">
              Please review the proposal below and provide your signature to
              accept.
            </p>
          </div>

          {/* Proposal Content Preview */}
          <div className="p-6 max-h-96 overflow-y-auto border-b border-gray-200 dark:border-gray-700">
            {proposal.executiveSummary && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Executive Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {proposal.executiveSummary}
                </p>
              </div>
            )}
            {proposal.totalAmount && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Value
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: proposal.currency || "SAR",
                  }).format(proposal.totalAmount)}
                </p>
              </div>
            )}
          </div>

          {/* Signature Section */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Signature
            </h3>

            {/* Signature Type Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { id: "draw", label: "Draw", icon: "ri-pen-nib-line" },
                { id: "type", label: "Type", icon: "ri-font-size-line" },
                { id: "upload", label: "Upload", icon: "ri-upload-line" },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSignatureType(type.id as any)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    signatureType === type.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  <i className={`${type.icon} mr-2`} />
                  {type.label}
                </button>
              ))}
            </div>

            {/* Signature Input */}
            <div className="mb-6">
              {signatureType === "draw" && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-white dark:bg-gray-700">
                  <canvas
                    className="w-full h-48 border border-gray-200 dark:border-gray-600 rounded cursor-crosshair"
                    id="signatureCanvas"
                  />
                  <button
                    onClick={() => {
                      const canvas = document.getElementById(
                        "signatureCanvas",
                      ) as HTMLCanvasElement;
                      if (canvas) {
                        setSignatureImage(canvas.toDataURL());
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                  >
                    Save Signature
                  </button>
                </div>
              )}

              {signatureType === "type" && (
                <div>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-semibold"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    This will be used as your signature
                  </p>
                </div>
              )}

              {signatureType === "upload" && (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) =>
                          setSignatureImage(e.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="signatureUpload"
                  />
                  <label
                    htmlFor="signatureUpload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <i className="ri-upload-line text-4xl text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload signature image
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-1" required />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the terms and conditions of this proposal and
                  confirm that I have the authority to sign on behalf of the
                  organization.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={signing || (!signatureImage && !typedName)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg hover:shadow-xl"
              >
                {signing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2" />
                    Signing...
                  </>
                ) : (
                  <>
                    <i className="ri-pen-nib-line mr-2" />
                    Sign & Accept Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
