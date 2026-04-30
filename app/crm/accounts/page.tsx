/**
 * CRM Accounts Page
 * Account management extending WMS customers
 */

"use client";

import { useEffect, useState } from "react";
import { RiBuildingLine, RiAddLine, RiSearchLine } from "react-icons/ri";
import type { CRMAccount } from "@/types/crm";

export default function CRMAccountsPage() {
  const [accounts, setAccounts] = useState<CRMAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/crm/accounts?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <RiBuildingLine className="text-purple-400" />
              Accounts
            </h1>
            <p className="text-gray-400 mt-1">
              Account management extending WMS customers
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Account
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading accounts...
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No accounts found</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">All Accounts</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-400">Accounts will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
