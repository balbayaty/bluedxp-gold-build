"use client";

import { useState } from "react";
import { CreditCard, Wallet, Smartphone, Building2 } from "lucide-react";
import type { PaymentMethod } from "@/lib/services/marketplace/paymentService";

interface PaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

export default function PaymentForm({
  bookingId,
  amount,
  currency = "SAR",
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mada");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: "mada", label: "MADA", icon: CreditCard },
    { value: "visa", label: "Visa", icon: CreditCard },
    { value: "mastercard", label: "Mastercard", icon: CreditCard },
    { value: "apple_pay", label: "Apple Pay", icon: Smartphone },
    { value: "google_pay", label: "Google Pay", icon: Smartphone },
    { value: "bank_transfer", label: "Bank Transfer", icon: Building2 },
    { value: "wallet", label: "Wallet", icon: Wallet },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const intentResponse = await fetch("/api/marketplace/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount,
          method: selectedMethod,
        }),
      });

      const intentResult = await intentResponse.json();

      if (!intentResult.success) {
        throw new Error(
          intentResult.error || "Failed to create payment intent",
        );
      }

      // Process payment
      const paymentResponse = await fetch("/api/marketplace/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: intentResult.data.id,
          paymentData: {
            method: selectedMethod,
            transactionId: `txn_${Date.now()}`,
          },
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment processing failed");
      }

      if (onSuccess) {
        onSuccess(paymentResult.data.id);
      }
    } catch (err: any) {
      setError(err.message || "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Payment Details</h3>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total Amount</span>
          <span className="text-2xl font-bold text-blue-600">
            {amount.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedMethod(method.value)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedMethod === method.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{method.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={processing}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing
              ? "Processing..."
              : `Pay ${amount.toLocaleString()} ${currency}`}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Your payment is secure and encrypted
      </div>
    </div>
  );
}
