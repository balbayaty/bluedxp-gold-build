/**
 * Single Declaration Detail Page
 */

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiEdit,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiDownload,
} from "react-icons/fi";
import DeclarationForm from "@/components/customs/DeclarationForm";
import DocumentManager from "@/components/customs/DocumentManager";

export default function DeclarationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const declarationId = params.id as string;
  const [declaration, setDeclaration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadDeclaration();
  }, [declarationId]);

  const loadDeclaration = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/customs/declarations/${declarationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDeclaration(data.declaration);
      }
    } catch (error) {
      console.error("Failed to load declaration:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading declaration...</p>
        </div>
      </div>
    );
  }

  if (!declaration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
            <FiAlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Declaration not found</p>
            <button
              onClick={() => router.push("/customs/declarations")}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Back to Declarations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    DRAFT: "bg-gray-500",
    SUBMITTED: "bg-yellow-500",
    UNDER_REVIEW: "bg-blue-500",
    APPROVED: "bg-green-500",
    REJECTED: "bg-red-500",
    CLEARED: "bg-cyan-500",
    HELD: "bg-purple-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/customs/declarations")}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center space-x-3">
                <FiFileText className="text-cyan-400" />
                <span>{declaration.declarationNumber || declaration.id}</span>
              </h1>
              <p className="text-gray-400 mt-1">
                {declaration.country} • {declaration.type}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                declaration.status === "APPROVED" ||
                declaration.status === "CLEARED"
                  ? "bg-green-500/20 text-green-400"
                  : declaration.status === "REJECTED"
                    ? "bg-red-500/20 text-red-400"
                    : declaration.status === "HELD"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {declaration.status}
            </span>
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <FiEdit className="w-4 h-4" />
              <span>{editing ? "Cancel" : "Edit"}</span>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2">
              <FiDownload className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {editing ? (
          <DeclarationForm
            initialData={declaration}
            onSave={(updated) => {
              console.log("Declaration updated:", updated);
              setEditing(false);
              loadDeclaration();
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Declaration Details */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4">
                  Declaration Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Country</p>
                    <p className="font-medium">{declaration.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Type</p>
                    <p className="font-medium">{declaration.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Status</p>
                    <p className="font-medium">{declaration.status}</p>
                  </div>
                  {declaration.submittedAt && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Submitted</p>
                      <p className="font-medium">
                        {new Date(declaration.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Products */}
              {declaration.products && declaration.products.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-semibold mb-4">Products</h2>
                  <div className="space-y-3">
                    {declaration.products.map((product: any, index: number) => (
                      <div
                        key={product.id || index}
                        className="p-4 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.description}</p>
                            <p className="text-sm text-gray-400">
                              HS Code: {product.hsCode} • Qty:{" "}
                              {product.quantity} {product.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {product.totalValue?.toLocaleString()}{" "}
                              {product.currency || "USD"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4">Documents</h2>
                <DocumentManager declarationId={declarationId} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <h3 className="font-semibold mb-4">Timeline</h3>
                <div className="space-y-4">
                  {declaration.submittedAt && (
                    <div className="flex items-start space-x-3">
                      <FiClock className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Submitted</p>
                        <p className="text-sm text-gray-400">
                          {new Date(declaration.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  {declaration.status === "APPROVED" && (
                    <div className="flex items-start space-x-3">
                      <FiCheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="font-medium">Approved</p>
                        <p className="text-sm text-gray-400">
                          Declaration approved
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Parties */}
              {(declaration.importer || declaration.exporter) && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                  <h3 className="font-semibold mb-4">Parties</h3>
                  <div className="space-y-4">
                    {declaration.importer && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Importer</p>
                        <p className="font-medium">
                          {declaration.importer.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {declaration.importer.country}
                        </p>
                      </div>
                    )}
                    {declaration.exporter && (
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Exporter</p>
                        <p className="font-medium">
                          {declaration.exporter.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {declaration.exporter.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
