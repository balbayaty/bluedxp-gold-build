/**
 * Declarations Page
 */

"use client";

import React, { useState } from "react";
import DeclarationForm from "@/components/customs/DeclarationForm";
import DeclarationsList from "@/components/customs/DeclarationsList";
import { FiPlus, FiFileText } from "react-icons/fi";

export default function DeclarationsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <FiFileText className="text-cyan-400" />
              <span>Customs Declarations</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage all customs declarations
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 rounded-lg transition-all flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>{showForm ? "Cancel" : "New Declaration"}</span>
          </button>
        </div>

        {showForm ? (
          <DeclarationForm
            onSave={(declaration) => {
              console.log("Declaration saved:", declaration);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <DeclarationsList />
        )}
      </div>
    </div>
  );
}
