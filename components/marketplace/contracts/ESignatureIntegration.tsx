/**
 * E-Signature Integration Component
 * Interface for signing contracts using digital signature service
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  PenTool,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import type { MarketplaceContract } from "@/types/marketplace-contracts";

interface ESignatureIntegrationProps {
  contract: MarketplaceContract;
  currentUserId: string;
  onSigned?: () => void;
}

export default function ESignatureIntegration({
  contract,
  currentUserId,
  onSigned,
}: ESignatureIntegrationProps) {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userSignature = contract.signatures.find(
    (s) => s.signerId === currentUserId,
  );
  const canSign = userSignature && userSignature.status === "PENDING";

  const handleSign = async () => {
    if (!canSign) return;

    setSigning(true);
    setError(null);

    try {
      // Initiate signature if not already initiated
      if (contract.status === "DRAFT") {
        const initiateResponse = await fetch(
          `/api/marketplace/contracts/${contract.id}/signature`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "initiate" }),
          },
        );
        const initiateResult = await initiateResponse.json();
        if (!initiateResult.success) {
          throw new Error(
            initiateResult.error || "Failed to initiate signature",
          );
        }
      }

      // Record signature
      const response = await fetch(
        `/api/marketplace/contracts/${contract.id}/signature`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "record",
            signatureId: userSignature?.id,
            signerId: currentUserId,
          }),
        },
      );

      const result = await response.json();
      if (result.success) {
        onSigned?.();
        // Redirect to digital signature interface for completing the signature
        window.location.href = `/digital-signatures/sign?workflowId=${contract.signatureWorkflowId}&signerId=${currentUserId}`;
      } else {
        throw new Error(result.error || "Failed to sign contract");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  if (!userSignature) {
    return (
      <div className="text-center p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-600 dark:text-slate-400">
          You are not a signer for this contract
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          Digital Signature
        </h3>
        {userSignature.status === "SIGNED" && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Signed
          </span>
        )}
      </div>

      {userSignature.status === "SIGNED" ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 font-medium mb-2">
              ✓ You have signed this contract
            </p>
            {userSignature.signedAt && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Signed on {new Date(userSignature.signedAt).toLocaleString()}
              </p>
            )}
          </div>
          {contract.signatureWorkflowId && (
            <a
              href={`/digital-signatures/view/${contract.signatureWorkflowId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Download className="w-4 h-4" />
              View Signature Certificate
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Signature Required
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Please review and sign the service agreement to proceed.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={signing || !canSign}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
          >
            {signing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <PenTool className="w-5 h-5" />
                Sign Contract
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            By signing, you agree to the terms and conditions of this service
            agreement.
          </p>
        </div>
      )}
    </div>
  );
}
