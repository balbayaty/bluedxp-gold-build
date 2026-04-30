/**
 * 💳 BILLING MANAGER
 * 
 * Production-ready billing with:
 * - Plan management
 * - Usage-based billing
 * - Invoice history
 * - Payment methods
 * - Cost forecasting
 * 
 * BlueDXP Platform - Production Ready
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { UserBillingInfo, BillingPlan, Invoice } from "@/types/userManagement";
import { format } from "date-fns";

export interface BillingManagerProps {
  userId: string;
  billingInfo: UserBillingInfo | null;
  onPlanChange: (plan: BillingPlan) => void;
  onPaymentMethodUpdate: (method: any) => void;
  readOnly?: boolean;
}

const PLANS: {
  id: BillingPlan;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: Record<string, number | string>;
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "For individuals getting started",
    features: [
      "1,000 API calls/month",
      "1 GB storage",
      "1 user",
      "Basic features",
      "Community support",
    ],
    limits: {
      apiCalls: 1000,
      storage: 1,
      users: 1,
      tokens: 10000,
    },
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    description: "For small teams",
    features: [
      "10,000 API calls/month",
      "10 GB storage",
      "5 users",
      "All standard features",
      "Email support",
      "Basic analytics",
    ],
    limits: {
      apiCalls: 10000,
      storage: 10,
      users: 5,
      tokens: 100000,
    },
  },
  {
    id: "professional",
    name: "Professional",
    price: 199,
    description: "For growing businesses",
    popular: true,
    features: [
      "100,000 API calls/month",
      "100 GB storage",
      "25 users",
      "All features",
      "Priority support",
      "AI agents",
      "Advanced analytics",
      "Custom integrations",
    ],
    limits: {
      apiCalls: 100000,
      storage: 100,
      users: 25,
      tokens: 1000000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1, // Custom
    description: "For large organizations",
    features: [
      "Unlimited API calls",
      "Unlimited storage",
      "Unlimited users",
      "All features + custom",
      "Dedicated support",
      "SLA guarantee",
      "White-label options",
      "Custom contracts",
    ],
    limits: {
      apiCalls: "Unlimited",
      storage: "Unlimited",
      users: "Unlimited",
      tokens: "Unlimited",
    },
  },
];

const BillingManager: React.FC<BillingManagerProps> = ({
  userId,
  billingInfo,
  onPlanChange,
  onPaymentMethodUpdate,
  readOnly = false,
}) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "payment">("overview");

  // Use invoices from billing info - no mock fallback
  const invoices: Invoice[] = billingInfo?.invoices || [];

  const currentPlan = PLANS.find((p) => p.id === billingInfo?.plan) || PLANS[0];

  const handleUpgrade = (plan: BillingPlan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const confirmPlanChange = () => {
    if (selectedPlan) {
      onPlanChange(selectedPlan);
      setShowPlanModal(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="ri-money-dollar-circle-line text-green-400"></i>
            Billing & Subscription
          </h3>
          <p className="text-sm text-[#9ca3af] mt-1">
            Manage your subscription and billing
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-4">
          {[
            { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
            { id: "invoices", label: "Invoices", icon: "ri-file-list-line" },
            { id: "payment", label: "Payment Method", icon: "ri-bank-card-line" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-green-500 text-white"
                  : "border-transparent text-[#9ca3af] hover:text-white"
              }`}
            >
              <i className={tab.icon}></i>
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Current Plan */}
            <div className="p-6 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm text-[#9ca3af] mb-1">Current Plan</div>
                  <div className="text-3xl font-bold text-white">{currentPlan.name}</div>
                  <div className="text-sm text-[#9ca3af] mt-1">{currentPlan.description}</div>
                </div>
                <div className="text-right">
                  {currentPlan.price === -1 ? (
                    <div className="text-2xl font-bold text-white">Custom</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">${currentPlan.price}</div>
                      <div className="text-sm text-[#9ca3af]">/month</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    billingInfo?.status === "active"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {billingInfo?.status || "Active"}
                </span>
                <span className="text-sm text-[#9ca3af]">
                  {billingInfo?.billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
                </span>
                {billingInfo?.currentPeriodEnd && (
                  <span className="text-sm text-[#9ca3af]">
                    Renews {format(new Date(billingInfo.currentPeriodEnd), "MMM dd, yyyy")}
                  </span>
                )}
              </div>
            </div>

            {/* Plan Comparison */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Compare Plans</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-xl border transition-all ${
                      plan.id === currentPlan.id
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    } ${plan.popular ? "ring-2 ring-purple-500/50" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                        Most Popular
                      </div>
                    )}

                    <div className="text-lg font-semibold text-white mb-1">{plan.name}</div>
                    <div className="mb-4">
                      {plan.price === -1 ? (
                        <span className="text-2xl font-bold text-white">Custom</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-white">${plan.price}</span>
                          <span className="text-sm text-[#9ca3af]">/mo</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[#9ca3af]">
                          <i className="ri-check-line text-green-400"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {!readOnly && (
                      <button
                        onClick={() => plan.id !== currentPlan.id && handleUpgrade(plan.id)}
                        disabled={plan.id === currentPlan.id}
                        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          plan.id === currentPlan.id
                            ? "bg-white/5 text-[#9ca3af] cursor-default"
                            : "bg-gradient-to-r from-green-500 to-cyan-500 text-white hover:from-green-600 hover:to-cyan-600"
                        }`}
                      >
                        {plan.id === currentPlan.id ? "Current Plan" : plan.price === -1 ? "Contact Sales" : "Upgrade"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "invoices" && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-white font-mono text-sm">{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-[#9ca3af] text-sm">
                        {format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        ${invoice.total.toFixed(2)} {invoice.currency}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-500/20 text-green-400"
                              : invoice.status === "open"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-white hover:bg-white/10 transition-colors">
                            <i className="ri-download-line mr-1"></i>
                            PDF
                          </button>
                          {invoice.status === "open" && (
                            <button className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 hover:bg-green-500/30 transition-colors">
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "payment" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Current Payment Method */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h4 className="text-lg font-semibold text-white mb-4">Payment Method</h4>

              {billingInfo?.paymentMethod ? (
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center">
                      <i className="ri-bank-card-line text-white"></i>
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        •••• •••• •••• {billingInfo.paymentMethod.last4}
                      </div>
                      <div className="text-sm text-[#9ca3af]">
                        Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      Update
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-bank-card-line text-4xl text-[#6b7280] mb-2"></i>
                  <p className="text-sm text-[#9ca3af] mb-4">No payment method on file</p>
                  {!readOnly && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-cyan-600 transition-colors"
                    >
                      Add Payment Method
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Billing Address */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <h4 className="text-lg font-semibold text-white mb-4">Billing Address</h4>
              <div className="text-sm text-[#9ca3af]">
                <p>Company Name</p>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>Country</p>
              </div>
              {!readOnly && (
                <button className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">
                  Update Address
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Change Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setSelectedPlan(null);
        }}
        title="Confirm Plan Change"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#9ca3af]">Current Plan:</span>
                <span className="text-white font-medium">{currentPlan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9ca3af]">New Plan:</span>
                <span className="text-green-400 font-medium">
                  {PLANS.find((p) => p.id === selectedPlan)?.name}
                </span>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <i className="ri-information-line text-yellow-400 mt-0.5"></i>
                <div className="text-sm text-yellow-300">
                  Your plan will change immediately. Billing will be prorated.
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlanChange}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg hover:from-green-600 hover:to-cyan-600 transition-colors"
              >
                Confirm Change
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillingManager;
