"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { Upload, FileText, Shield, CheckCircle, XCircle } from "lucide-react";

export default function ProviderVerificationPage() {
  const router = useRouter();
  const providerId = "current-provider"; // In production, get from auth
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadVerification();
  }, []);

  const loadVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/marketplace/verification?providerId=${providerId}`,
      );
      const result = await response.json();
      if (result.success) {
        setVerification(result.data);
      } else if (result.error === "Verification not found") {
        // Start new verification
        const startResponse = await fetch("/api/marketplace/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            providerId,
          }),
        });
        const startResult = await startResponse.json();
        if (startResult.success) {
          setVerification(startResult.data);
        }
      }
    } catch (error) {
      console.error("Failed to load verification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (type: string, file: File) => {
    setUploading(true);
    try {
      // Upload file (would upload to storage service)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      // In production, upload to storage first, then create document
      const document = {
        type,
        name: file.name,
        fileUrl: URL.createObjectURL(file), // Temporary
        fileType: file.type,
        fileSize: file.size,
      };

      const response = await fetch("/api/marketplace/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_document",
          verificationId: verification.id,
          document,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadVerification();
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 bg-green-50 border-green-200";
      case "REJECTED":
        return "text-red-600 bg-red-50 border-red-200";
      case "IN_REVIEW":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Provider Verification"
        description="Verify your provider account"
        icon="ri-shield-check-line"
      >
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-slate-500">Loading verification status...</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Provider Verification"
      description="Complete your provider verification to increase trust and bookings"
      icon="ri-shield-check-line"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Card */}
        <div
          className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getStatusColor(verification?.status || "PENDING")}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Verification Status
              </h3>
              <p className="text-sm opacity-75">
                {verification?.status === "APPROVED" &&
                  "✅ Your account is verified!"}
                {verification?.status === "REJECTED" &&
                  `❌ Verification rejected: ${verification.rejectionReason}`}
                {verification?.status === "IN_REVIEW" &&
                  "⏳ Your verification is under review"}
                {verification?.status === "PENDING" &&
                  "📋 Complete the steps below to verify your account"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold mb-1">
                {verification?.level || "BASIC"}
              </div>
              <div className="text-sm opacity-75">Verification Level</div>
            </div>
          </div>
        </div>

        {/* Documents Required */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Required Documents
          </h3>
          <div className="space-y-4">
            {[
              { type: "LICENSE", label: "Business License", required: true },
              {
                type: "REGISTRATION",
                label: "Commercial Registration",
                required: true,
              },
              {
                type: "TAX_CERTIFICATE",
                label: "Tax Certificate",
                required: true,
              },
              { type: "IDENTITY", label: "Identity Document", required: true },
              {
                type: "CERTIFICATE",
                label: "Professional Certificates",
                required: false,
              },
            ].map((doc) => {
              const uploaded = verification?.documents?.find(
                (d: any) => d.type === doc.type,
              );
              return (
                <div
                  key={doc.type}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        {doc.label}
                      </p>
                      {doc.required && (
                        <p className="text-xs text-red-600">Required</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {uploaded ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Uploaded</span>
                      </div>
                    ) : (
                      <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer">
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleDocumentUpload(doc.type, e.target.files[0]);
                            }
                          }}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Background Check & KYC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Background Check</span>
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Status:{" "}
              <span className="font-semibold">
                {verification?.backgroundCheck?.status || "PENDING"}
              </span>
            </p>
            <button
              onClick={async () => {
                const response = await fetch("/api/marketplace/verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "run_background_check",
                    verificationId: verification.id,
                    backgroundData: {
                      name: "Provider Name",
                      registrationNumber: "123456",
                      taxId: "123456789",
                    },
                  }),
                });
                const result = await response.json();
                if (result.success) {
                  await loadVerification();
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Run Background Check
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>KYC Check</span>
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Status:{" "}
              <span className="font-semibold">
                {verification?.kycCheck?.status || "PENDING"}
              </span>
            </p>
            <button
              onClick={async () => {
                const response = await fetch("/api/marketplace/verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "run_kyc",
                    verificationId: verification.id,
                    kycData: {
                      identityDocument: "uploaded",
                      addressProof: "uploaded",
                    },
                  }),
                });
                const result = await response.json();
                if (result.success) {
                  await loadVerification();
                }
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Run KYC Check
            </button>
          </div>
        </div>

        {/* Badges */}
        {verification?.badges && verification.badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Your Badges
            </h3>
            <div className="flex flex-wrap gap-2">
              {verification.badges.map((badge: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold"
                >
                  {badge.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
