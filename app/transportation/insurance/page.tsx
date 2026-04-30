/**
 * Insurance Management
 *
 * Manage cargo insurance policies and claims
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { apiFetch } from "@/utils/apiFetch";
import { PremiumLoader } from "@/components/loading";
import type { InsurancePolicy } from "@/lib/services/transportation/insuranceService";

export default function InsurancePage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    totalCoverage: 0,
    totalPremiums: 0,
    totalClaims: 0,
  });

  useEffect(() => {
    fetchPolicies();
    fetchStatistics();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/transportation/insurance");
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error("Error fetching policies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiFetch(
        "/api/transportation/insurance?action=statistics",
      );
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalPolicies: data.totalPolicies || 0,
          activePolicies: data.activePolicies || 0,
          totalCoverage: data.totalCoverage || 0,
          totalPremiums: data.totalPremiums || 0,
          totalClaims: data.totalClaims || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  if (loading) {
    return (
      <PageTemplate
        title="Insurance Management"
        description="Manage cargo insurance policies and claims"
        icon="ri-shield-check-line"
      >
        <PremiumLoader />
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Insurance Management"
      description="Manage cargo insurance policies and claims"
      icon="ri-shield-check-line"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Policies
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalPolicies}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active Policies
            </div>
            <div className="text-2xl font-bold mt-1 text-green-600">
              {stats.activePolicies}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Coverage
            </div>
            <div className="text-2xl font-bold mt-1">
              {(stats.totalCoverage / 1000000).toFixed(1)}M SAR
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Claims
            </div>
            <div className="text-2xl font-bold mt-1">{stats.totalClaims}</div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Insurance Policies</h3>
              <button
                onClick={() => router.push("/transportation/insurance/new")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Policy
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {policies.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No insurance policies found.</p>
                <p className="text-sm mt-2">
                  Create a new policy to get started.
                </p>
              </div>
            ) : (
              policies.map((policy) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">
                          {policy.policyNumber}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            policy.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : policy.status === "EXPIRED"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {policy.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Shipment:
                          </span>{" "}
                          <span className="font-medium">
                            {policy.shipmentNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Provider:
                          </span>{" "}
                          <span className="font-medium">{policy.provider}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Coverage:
                          </span>{" "}
                          <span className="font-medium">
                            {(policy.coverageAmount / 1000).toFixed(0)}K{" "}
                            {policy.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Premium:
                          </span>{" "}
                          <span className="font-medium">
                            {policy.premium.toLocaleString()} {policy.currency}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Valid:{" "}
                        {new Date(policy.effectiveDate).toLocaleDateString()} -{" "}
                        {new Date(policy.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {policy.claims && policy.claims.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="font-medium mb-2">Claims</div>
                      {policy.claims.map((claim) => (
                        <div
                          key={claim.id}
                          className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">
                                {claim.claimNumber}
                              </span>
                              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                Amount: {claim.amount.toLocaleString()}{" "}
                                {claim.currency}
                              </span>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              {claim.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      onClick={() =>
                        router.push(`/transportation/insurance/${policy.id}`)
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      View Details
                    </button>
                    {policy.status === "ACTIVE" && (
                      <button
                        onClick={() =>
                          router.push(
                            `/transportation/insurance/${policy.id}/claim`,
                          )
                        }
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        File Claim
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
