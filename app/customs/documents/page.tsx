/**
 * Documents Page
 */

"use client";

import React, { useState } from "react";
import DocumentManager from "@/components/customs/DocumentManager";
import { FiUpload, FiFileText, FiSearch, FiFilter } from "react-icons/fi";

export default function DocumentsPage() {
  const [declarationId, setDeclarationId] = useState("decl-1"); // Default for demo
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <FiFileText className="text-cyan-400" />
              <span>Document Management</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Upload, manage, and validate customs documents
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <FiFilter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {declarationId ? (
          <DocumentManager declarationId={declarationId} />
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
            <FiFileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              Select a declaration to manage documents
            </p>
            <p className="text-sm text-gray-500">
              Or create a new declaration first
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
