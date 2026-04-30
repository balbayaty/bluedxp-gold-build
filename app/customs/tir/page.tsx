/**
 * TIR Carnets Page
 */

"use client";

import TIRManagement from "@/components/customs/TIRManagement";

export default function TIRPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <TIRManagement />
      </div>
    </div>
  );
}
