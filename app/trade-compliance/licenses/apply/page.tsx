/**
 * Apply for License Page
 * Entry point for license application wizard and journey tracking
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LicenseApplicationWizard from "@/components/trade-compliance/LicenseApplicationWizard";
import LicenseJourneyDashboard from "@/components/trade-compliance/LicenseJourneyDashboard";
import type { LicenseApplication } from "@/types/license-application";

export default function ApplyForLicensePage() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [application, setApplication] = useState<LicenseApplication | null>(
    null,
  );

  const handleApplicationComplete = (app: LicenseApplication) => {
    setApplication(app);
    setShowWizard(false);
  };

  if (application) {
    return (
      <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              onClick={() => {
                setApplication(null);
                router.push("/trade-compliance/licenses");
              }}
              className="text-[#9ca3af] hover:text-white transition-colors mb-4 flex items-center gap-2"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Licenses
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">
              License Application Journey
            </h1>
            <p className="text-[#9ca3af]">
              Track your application progress in real-time
            </p>
          </motion.div>
          <LicenseJourneyDashboard applicationId={application.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push("/trade-compliance/licenses")}
            className="text-[#9ca3af] hover:text-white transition-colors mb-4 flex items-center gap-2"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Licenses
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            Apply for License
          </h1>
          <p className="text-[#9ca3af]">
            Start your license application journey
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-file-add-line text-white text-4xl"></i>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">
            Ready to Apply?
          </h2>
          <p className="text-[#9ca3af] mb-8 max-w-md mx-auto">
            Our intelligent system will guide you through the entire license
            application process, auto-pull required documents, and connect you
            with expert consultants if needed.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-colors font-medium"
          >
            Start Application
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </motion.div>
      </div>

      {showWizard && (
        <LicenseApplicationWizard
          onComplete={handleApplicationComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
