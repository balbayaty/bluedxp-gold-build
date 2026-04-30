/**
 * Pulse Recognition Page
 * Give recognition to colleagues
 */

"use client";

import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import PageTemplate from "@/components/PageTemplate";
import { useApiFetch } from "@/hooks/useApiFetch";
import { useErrorHandler } from "@/hooks/useErrorHandler";

interface User {
  id: string;
  name: string;
}

interface RecognitionCaps {
  daily: { remaining: number; limit: number };
  weekly: { remaining: number; limit: number };
}

function PulseRecognitionContent() {
  const [toUserId, setToUserId] = useState("");
  const [pointsPP, setPointsPP] = useState(10);
  const [reason, setReason] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: users = [], fetchData: fetchUsers } = useApiFetch<User[]>({
    module: "pulse",
    service: "recognition",
  });

  const { data: caps, fetchData: fetchCaps } = useApiFetch<RecognitionCaps>({
    module: "pulse",
    service: "recognition",
  });

  const { handleError } = useErrorHandler({
    module: "pulse",
    service: "recognition",
  });

  useEffect(() => {
    // Fetch users - in production, use proper user API
    fetchUsers("/api/users").catch(() => {
      // Fallback to mock data if API not available
      // In production, this should be handled properly
    });
    fetchCaps("/api/pulse/recognition/caps").catch(() => {
      // Use default caps if API not available
    });
  }, [fetchUsers, fetchCaps]);

  const giveRecognition = async () => {
    if (!toUserId || !reason) {
      handleError(new Error("Please select a user and provide a reason"), {
        code: "VALIDATION_ERROR",
        retryable: false,
      });
      return;
    }

    if (pointsPP <= 0 || pointsPP > 20) {
      handleError(new Error("Points must be between 1 and 20"), {
        code: "VALIDATION_ERROR",
        retryable: false,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pulse/recognition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ toUserId, pointsPP, reason, tags }),
      });
      const data = await res.json();
      if (data.success) {
        // Success - reset form and refresh caps
        setReason("");
        setTags([]);
        setToUserId("");
        setPointsPP(10);
        await fetchCaps("/api/pulse/recognition/caps");
        // In production, show success toast notification
      } else {
        handleError(new Error(data.error || "Failed to give recognition"), {
          code: "RECOGNITION_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to give recognition"),
        {
          code: "RECOGNITION_ERROR",
          retryable: true,
        },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTemplate
      title="Recognition"
      description="Recognize your colleagues for their contributions"
      icon="ri-heart-line"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Caps Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Recognition Limits</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Daily</div>
              <div className="font-semibold">
                {caps?.daily?.remaining ?? 100} / {caps?.daily?.limit ?? 100} PP
                remaining
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Weekly</div>
              <div className="font-semibold">
                {caps?.weekly?.remaining ?? 500} / {caps?.weekly?.limit ?? 500}{" "}
                PP remaining
              </div>
            </div>
          </div>
        </div>

        {/* Recognition Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Give Recognition</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-4 py-2 border rounded"
              >
                <option value="">Select a colleague</option>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Loading users...
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <input
                type="number"
                min="1"
                max="20"
                value={pointsPP}
                onChange={(e) => setPointsPP(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border rounded"
              />
              <div className="text-xs text-gray-500 mt-1">
                Max 20 PP per recognition
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border rounded"
                placeholder="What did they do that deserves recognition?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tags (optional)
              </label>
              <input
                type="text"
                value={tags.join(", ")}
                onChange={(e) =>
                  setTags(
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  )
                }
                className="w-full px-4 py-2 border rounded"
                placeholder="Teamwork, Safety, Innovation (comma-separated)"
              />
            </div>

            <button
              onClick={giveRecognition}
              disabled={!toUserId || !reason || pointsPP <= 0 || submitting}
              className={`w-full px-4 py-2 rounded transition-colors ${
                toUserId && reason && pointsPP > 0 && !submitting
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {submitting ? "Submitting..." : "Give Recognition"}
            </button>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

export default function PulseRecognitionPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Recognition"
          description="Recognize your colleagues for their contributions"
          icon="ri-heart-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <PulseRecognitionContent />
    </ErrorBoundary>
  );
}
