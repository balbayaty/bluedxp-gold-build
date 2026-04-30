"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { CreditCard, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [paymentMethod, setPaymentMethod] = useState<
    "MADA" | "VISA" | "MASTERCARD" | "APPLE_PAY" | "GOOGLE_PAY"
  >("MADA");
  const [processing, setProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      createPaymentIntent();
    }
  }, [bookingId]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch("/api/marketplace/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_intent",
          bookingId,
          amount: 5000, // Would get from booking
          currency: "SAR",
          paymentMethod: "MADA",
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPaymentIntent(result.data);
      }
    } catch (error) {
      console.error("Failed to create payment intent:", error);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/marketplace/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_payment",
          paymentIntentId: paymentIntent.id,
          paymentMethod,
        }),
      });
      const result = await response.json();
      if (result.success) {
        router.push(`/marketplace/bookings/${bookingId}?payment=success`);
      } else {
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageTemplate
      title="Secure Payment"
      description="Complete your booking payment"
      icon="ri-bank-card-line"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Security Badge */}
          <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
            <Lock className="w-5 h-5" />
            <span className="font-semibold">
              Secure Payment - SSL Encrypted
            </span>
          </div>

          {/* Payment Amount */}
          <div className="text-center py-6 border-b border-slate-200">
            <p className="text-sm text-slate-500 mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-slate-800">
              {paymentIntent?.amount?.toLocaleString() || "5,000"} SAR
            </p>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">
              Select Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  "MADA",
                  "VISA",
                  "MASTERCARD",
                  "APPLE_PAY",
                  "GOOGLE_PAY",
                ] as const
              ).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-4 border-2 rounded-lg transition ${
                    paymentMethod === method
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <CreditCard className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-800">
                    {method.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          {paymentMethod !== "APPLE_PAY" && paymentMethod !== "GOOGLE_PAY" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start space-x-2 text-sm text-slate-600">
            <input type="checkbox" id="terms" className="mt-1" />
            <label htmlFor="terms">
              I agree to the terms and conditions and privacy policy. This
              payment is secure and encrypted.
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePayment}
            disabled={processing}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Pay Securely</span>
              </>
            )}
          </button>

          {/* Security Info */}
          <div className="text-center text-xs text-slate-500 space-y-1">
            <p>🔒 Your payment is secured with 256-bit SSL encryption</p>
            <p>✅ ZATCA-compliant invoicing included</p>
            <p>🛡️ Protected by our payment guarantee</p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}
