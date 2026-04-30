/**
 * Blockchain
 *
 * Blockchain transaction recording, smart contracts, and traceability verification
 * Module: tms
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import { apiFetch } from "@/utils/apiFetch";
import { RiLinksLine, RiFileTextLine, RiShieldCheckLine } from "react-icons/ri";

interface BlockchainTransaction {
  id: string;
  shipmentId: string;
  transactionType: string;
  timestamp: string;
  hash: string;
  status: string;
}

function TransportationBlockchainPageContent() {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState("");
  const [transactionType, setTransactionType] = useState("SHIPMENT_CREATED");

  const recordTransaction = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch("/api/transportation/blockchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record",
          shipmentId,
          transactionType,
          data: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to record transaction: ${response.statusText}`);
      }

      const data = await response.json();
      setTransactions([data, ...transactions]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to record transaction",
      );
      console.error("Error recording transaction:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactions = async () => {
    if (!shipmentId) {
      setError("Please enter a shipment ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(
        `/api/transportation/blockchain?action=list&shipmentId=${shipmentId}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to get transactions: ${response.statusText}`);
      }

      const data = await response.json();
      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : [],
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get transactions",
      );
      console.error("Error getting transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Blockchain"
      description="Blockchain transaction recording and traceability verification"
      icon="ri-links-line"
    >
      <div className="space-y-6">
        {/* Action Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RiLinksLine className="w-5 h-5" />
              Record Transaction
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipment ID
                </label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="Enter shipment ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Transaction Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="SHIPMENT_CREATED">Shipment Created</option>
                  <option value="SHIPMENT_IN_TRANSIT">In Transit</option>
                  <option value="SHIPMENT_DELIVERED">Delivered</option>
                  <option value="CUSTOMS_CLEARED">Customs Cleared</option>
                </select>
              </div>
              <button
                onClick={recordTransaction}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Record Transaction
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RiFileTextLine className="w-5 h-5" />
              View Transactions
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Shipment ID
                </label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="Enter shipment ID"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <button
                onClick={getTransactions}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Get Transactions
              </button>
            </div>
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold mb-4">
              Blockchain Transactions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Shipment ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">Hash</th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4">{tx.transactionType}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {tx.shipmentId}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {tx.hash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {transactions.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <RiLinksLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Record a transaction or view transactions for a shipment
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function TransportationBlockchainPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Blockchain"
          description="Blockchain transaction recording and traceability verification"
          icon="ri-links-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <TransportationBlockchainPageContent />
    </ErrorBoundary>
  );
}
