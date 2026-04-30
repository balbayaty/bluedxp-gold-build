/**
 * OAuth Callback Page
 * Handles OAuth callbacks from external services (LinkedIn, etc.)
 */

"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Processing authorization...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(errorDescription || error || "Authorization failed");
      setTimeout(() => {
        router.push("/integrations");
      }, 3000);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Missing authorization code or state");
      setTimeout(() => {
        router.push("/integrations");
      }, 3000);
      return;
    }

    // Extract tenantId from state (format: tenantId_timestamp)
    const tenantId = state.split("_")[0];
    const redirectUri = `${window.location.origin}/integrations/callback`;

    // Get stored credentials from sessionStorage
    let clientId: string | undefined;
    let clientSecret: string | undefined;
    let userId: string | undefined;

    try {
      const stored = sessionStorage.getItem("linkedin_credentials");
      if (stored) {
        const creds = JSON.parse(stored);
        clientId = creds.clientId;
        clientSecret = creds.clientSecret;
        userId = creds.userId;
        // Clear after use
        sessionStorage.removeItem("linkedin_credentials");
      }
    } catch (e) {
      console.error("Error reading stored credentials:", e);
    }

    // Handle callback
    handleCallback(code, redirectUri, tenantId, clientId, clientSecret, userId);
  }, [searchParams, router]);

  const handleCallback = async (
    code: string,
    redirectUri: string,
    tenantId: string,
    clientId?: string,
    clientSecret?: string,
    userId?: string,
  ) => {
    try {
      const response = await fetch("/api/integrations/linkedin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirectUri,
          tenantId,
          clientId,
          clientSecret,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage("Successfully connected to LinkedIn!");
        setTimeout(() => {
          router.push("/integrations");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to connect integration");
        setTimeout(() => {
          router.push("/integrations");
        }, 3000);
      }
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
      setTimeout(() => {
        router.push("/integrations");
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 max-w-md w-full text-center"
      >
        {status === "loading" && (
          <>
            <FiLoader className="mx-auto text-4xl text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Connecting...
            </h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <FiCheckCircle className="mx-auto text-4xl text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to integrations...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <FiAlertCircle className="mx-auto text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
            <p className="text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to integrations...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
