/**
 * Google OAuth Callback Page
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setStatus("error");
      setError(errorParam);
      return;
    }

    if (code) {
      handleCallback(code);
    }
  }, [searchParams]);

  const handleCallback = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}/workspace/integrations/google/callback`;
      const response = await fetch("/api/v1/workspace/integrations/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri,
          scopes: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/tasks.readonly",
          ],
        }),
      });

      if (response.ok) {
        setStatus("success");
        setTimeout(() => {
          router.push("/workspace");
        }, 2000);
      } else {
        setStatus("error");
        setError("Failed to connect Google Workspace");
      }
    } catch (error) {
      setStatus("error");
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="text-center">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Connecting Google Workspace...</p>
          </>
        )}

        {status === "success" && (
          <>
            <i className="ri-checkbox-circle-fill text-6xl text-green-400 mb-4"></i>
            <p className="text-white text-lg mb-2">Successfully Connected!</p>
            <p className="text-[#9ca3af]">Redirecting to workspace...</p>
          </>
        )}

        {status === "error" && (
          <>
            <i className="ri-error-warning-fill text-6xl text-red-400 mb-4"></i>
            <p className="text-white text-lg mb-2">Connection Failed</p>
            <p className="text-[#9ca3af] mb-4">{error}</p>
            <button
              onClick={() => router.push("/workspace")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Workspace
            </button>
          </>
        )}
      </div>
    </div>
  );
}
