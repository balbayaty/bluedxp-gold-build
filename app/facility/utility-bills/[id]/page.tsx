/**
 * Utility Bill Detail Page
 *
 * View detailed bill information:
 * - Bill details
 * - Consumption data
 * - Payment tracking
 * - Traceability chain
 * - Related bills
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import type { UtilityBill } from "@/types/utility-bills";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useApiFetch } from "@/hooks/useApiFetch";
import { useNotifications } from "@/lib/utils/notifications";

function UtilityBillDetailContent() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;
  const notifications = useNotifications();
  const { handleError } = useErrorHandler({
    module: "facility",
    service: "utility-bills",
  });

  const {
    data: bill,
    loading,
    error,
    errorMessage,
    fetchData,
  } = useApiFetch<UtilityBill>({
    module: "facility",
    service: "utility-bills",
    retries: 2,
  });

  const { data: traceability, fetchData: fetchTraceability } = useApiFetch({
    module: "facility",
    service: "utility-bills",
    retries: 1,
  });

  const [activeTab, setActiveTab] = useState<
    "details" | "payment" | "traceability" | "related"
  >("details");

  useEffect(() => {
    if (billId) {
      fetchData(`/api/facility/utility-bills/${billId}`);
      fetchTraceability(`/api/facility/utility-bills/${billId}/traceability`);
    }
  }, [billId, fetchData, fetchTraceability]);

  const handleApprove = async () => {
    try {
      const response = await fetch(
        `/api/facility/utility-bills/${billId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ approvedBy: "current-user" }),
        },
      );

      const data = await response.json();
      if (data.success) {
        await fetchData(`/api/facility/utility-bills/${billId}`);
        notifications.success(
          "Bill Approved",
          "Bill has been approved successfully",
          { duration: 3000 },
        );
      } else {
        handleError(new Error(data.error || "Failed to approve bill"), {
          code: "BILL_APPROVE_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to approve bill"),
        {
          code: "BILL_APPROVE_ERROR",
          retryable: true,
        },
      );
    }
  };

  const handlePayment = async (amount: number) => {
    try {
      const response = await fetch(
        `/api/facility/utility-bills/${billId}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            paymentAmount: amount,
            paymentMethod: "Bank Transfer",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        await fetchData(`/api/facility/utility-bills/${billId}`);
        notifications.success(
          "Payment Recorded",
          "Payment has been recorded successfully",
          { duration: 3000 },
        );
      } else {
        handleError(new Error(data.error || "Failed to record payment"), {
          code: "BILL_PAYMENT_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to record payment"),
        {
          code: "BILL_PAYMENT_ERROR",
          retryable: true,
        },
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading bill details...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Error Loading Bill
          </h2>
          <p className="text-gray-500 mb-4">
            {errorMessage || "Bill not found"}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchData(`/api/facility/utility-bills/${billId}`)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <Link
              href="/facility/utility-bills"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Back to Bills
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/facility/utility-bills"
              className="text-blue-600 hover:underline mb-2 inline-block"
            >
              ← Back to Bills
            </Link>
            <h1 className="text-3xl font-bold">{bill.billNumber}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {bill.warehouseName || "N/A"}
            </p>
          </div>
          <div className="flex gap-3">
            {bill.status === "pending" && (
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
            )}
            {bill.paymentStatus !== "paid" && (
              <button
                onClick={() => handlePayment(bill.currentBalance)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Record Payment
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {["details", "payment", "traceability", "related"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 font-medium transition ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "details" && <BillDetailsTab bill={bill} />}
            {activeTab === "payment" && (
              <PaymentTab bill={bill} onPayment={handlePayment} />
            )}
            {activeTab === "traceability" && (
              <TraceabilityTab traceability={traceability} />
            )}
            {activeTab === "related" && <RelatedBillsTab bill={bill} />}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function BillDetailsTab({ bill }: { bill: UtilityBill }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-semibold mb-3">Bill Information</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Bill Number
            </dt>
            <dd className="font-medium">{bill.billNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Account Number
            </dt>
            <dd className="font-medium">{bill.accountNumber}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Utility Type
            </dt>
            <dd className="font-medium capitalize">{bill.utilityType}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Provider
            </dt>
            <dd className="font-medium">{bill.provider.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Billing Period
            </dt>
            <dd className="font-medium">
              {new Date(bill.billingPeriod.start).toLocaleDateString()} -{" "}
              {new Date(bill.billingPeriod.end).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Due Date
            </dt>
            <dd className="font-medium">
              {new Date(bill.dueDate).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Financial Details</h3>
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Subtotal
            </dt>
            <dd className="font-medium">
              {bill.subtotal.toFixed(2)} {bill.currency}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Taxes</dt>
            <dd className="font-medium">
              {bill.taxes.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}{" "}
              {bill.currency}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Total Amount
            </dt>
            <dd className="font-medium text-lg">
              {bill.totalAmount.toFixed(2)} {bill.currency}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Payments
            </dt>
            <dd className="font-medium">
              {(bill.payments || 0).toFixed(2)} {bill.currency}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">
              Current Balance
            </dt>
            <dd className="font-medium text-lg">
              {bill.currentBalance.toFixed(2)} {bill.currency}
            </dd>
          </div>
        </dl>
      </div>

      {bill.consumption && (
        <div>
          <h3 className="font-semibold mb-3">Consumption</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">
                Quantity
              </dt>
              <dd className="font-medium">
                {bill.consumption.quantity.toLocaleString()}{" "}
                {bill.consumption.unit}
              </dd>
            </div>
            {bill.consumption.peakDemand && (
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">
                  Peak Demand
                </dt>
                <dd className="font-medium">
                  {bill.consumption.peakDemand} kW
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">
                Cost per Unit
              </dt>
              <dd className="font-medium">
                {bill.consumption.quantity > 0
                  ? (bill.totalAmount / bill.consumption.quantity).toFixed(4)
                  : 0}{" "}
                {bill.currency}/{bill.consumption.unit}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

function PaymentTab({
  bill,
  onPayment,
}: {
  bill: UtilityBill;
  onPayment: (amount: number) => void;
}) {
  const [paymentAmount, setPaymentAmount] = useState(bill.currentBalance);

  return (
    <div className="max-w-md">
      <h3 className="font-semibold mb-4">Record Payment</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Payment Amount
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            max={bill.currentBalance}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="text-sm text-gray-500 mt-1">
            Balance: {bill.currentBalance.toFixed(2)} {bill.currency}
          </div>
        </div>
        <button
          onClick={() => onPayment(paymentAmount)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Record Payment
        </button>
      </div>
    </div>
  );
}

function TraceabilityTab({ traceability }: { traceability: any }) {
  if (!traceability) {
    return <div>Loading traceability data...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Provider</h4>
        <p className="text-gray-600 dark:text-gray-400">
          {traceability.traceability?.upstream?.provider?.name || "N/A"}
        </p>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Related Bills</h4>
        <ul className="list-disc list-inside space-y-1">
          {traceability.traceability?.relatedBills?.map((rb: any) => (
            <li key={rb.billId} className="text-gray-600 dark:text-gray-400">
              {rb.billNumber} ({rb.relationship})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RelatedBillsTab({ bill }: { bill: UtilityBill }) {
  return (
    <div>
      <p className="text-gray-600 dark:text-gray-400">
        Related bills will be displayed here based on account number, facility,
        or warehouse.
      </p>
    </div>
  );
}

export default function UtilityBillDetailPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Bill Details
            </h2>
            <p className="text-gray-500">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <UtilityBillDetailContent />
    </ErrorBoundary>
  );
}
