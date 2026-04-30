/**
 * Journal Entry Creation Page
 * Create manual GL journal entries with debit/credit lines
 * UX Enhanced: Toast notifications, auto-save, validation
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SaveStatus, UnsavedChangesWarning } from "@/components/ui/FormActions";
import { FieldLabel, InlineHelp } from "@/components/ui/FieldHelp";

interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

const COMMON_ACCOUNTS = [
  { code: "1000", name: "Cash", type: "ASSET" },
  { code: "1100", name: "Accounts Receivable", type: "ASSET" },
  { code: "1200", name: "Inventory", type: "ASSET" },
  { code: "1500", name: "Fixed Assets", type: "ASSET" },
  { code: "2000", name: "Accounts Payable", type: "LIABILITY" },
  { code: "2100", name: "Accrued Expenses", type: "LIABILITY" },
  { code: "2200", name: "VAT Payable", type: "LIABILITY" },
  { code: "3000", name: "Retained Earnings", type: "EQUITY" },
  { code: "4000", name: "Revenue - Services", type: "REVENUE" },
  { code: "4100", name: "Revenue - Products", type: "REVENUE" },
  { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" },
  { code: "6000", name: "Salaries & Wages", type: "EXPENSE" },
  { code: "6100", name: "Rent Expense", type: "EXPENSE" },
  { code: "6200", name: "Utilities Expense", type: "EXPENSE" },
  { code: "6300", name: "Transportation Expense", type: "EXPENSE" },
  { code: "6400", name: "Insurance Expense", type: "EXPENSE" },
  { code: "6500", name: "Depreciation Expense", type: "EXPENSE" },
];

const ENTRY_TYPES = [
  { value: "MANUAL", label: "Manual Entry", icon: "ri-edit-line", color: "from-blue-500 to-cyan-500" },
  { value: "ADJUSTMENT", label: "Adjustment", icon: "ri-settings-3-line", color: "from-orange-500 to-red-500" },
  { value: "REVERSAL", label: "Reversal", icon: "ri-arrow-go-back-line", color: "from-purple-500 to-pink-500" },
];

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entryType, setEntryType] = useState("MANUAL");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([
    { id: "1", accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
    { id: "2", accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
  ]);

  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), accountCode: "", accountName: "", description: "", debit: 0, credit: 0 }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter((l) => l.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines(lines.map((l) => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        // If selecting account, auto-fill name
        if (field === "accountCode") {
          const account = COMMON_ACCOUNTS.find((a) => a.code === value);
          if (account) updated.accountName = account.name;
        }
        // Clear opposite field when entering debit/credit
        if (field === "debit" && value) updated.credit = 0;
        if (field === "credit" && value) updated.debit = 0;
        return updated;
      }
      return l;
    }));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (action: "draft" | "post") => {
    if (!isBalanced) {
      setError("Journal entry must be balanced (Debits = Credits)");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (lines.some((l) => !l.accountCode)) {
      setError("All lines must have an account selected");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/finance/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "default",
          entryType,
          entryDate,
          description,
          reference,
          lines: lines.filter((l) => l.debit > 0 || l.credit > 0),
          status: action === "post" ? "POSTED" : "DRAFT",
        }),
      });
      const data = await response.json();
      if (data.success) {
        router.push("/finance/general-ledger");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2 }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/finance/general-ledger" className="p-2 hover:bg-white/10 rounded-lg">
                <i className="ri-arrow-left-line text-xl"></i>
              </Link>
              <div>
                <h1 className="text-xl font-bold">New Journal Entry</h1>
                <p className="text-sm text-gray-400">Create a manual GL journal entry</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={saving}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit("post")}
                disabled={saving || !isBalanced}
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <i className="ri-loader-4-line animate-spin"></i> : <i className="ri-check-line"></i>}
                Post Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <i className="ri-error-warning-line mr-2"></i>{error}
          </motion.div>
        )}

        {/* Entry Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-file-list-3-line text-green-400"></i>
            Entry Type
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {ENTRY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setEntryType(type.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  entryType === type.value
                    ? "border-green-500 bg-green-500/20"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-2`}>
                  <i className={`${type.icon} text-xl text-white`}></i>
                </div>
                <p className="font-medium text-center">{type.label}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Header Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-information-line text-green-400"></i>
            Entry Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Entry Date *</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="INV-2024-001"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter journal entry description..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Journal Lines */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="ri-list-check text-green-400"></i>
              Journal Lines
            </h3>
            <button
              onClick={addLine}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl flex items-center gap-2 transition-colors"
            >
              <i className="ri-add-line"></i>Add Line
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 px-2 text-gray-400 font-medium">Account</th>
                  <th className="py-3 px-2 text-gray-400 font-medium">Description</th>
                  <th className="py-3 px-2 text-gray-400 font-medium text-right">Debit (SAR)</th>
                  <th className="py-3 px-2 text-gray-400 font-medium text-right">Credit (SAR)</th>
                  <th className="py-3 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className="border-b border-white/5">
                    <td className="py-2 px-2">
                      <select
                        value={line.accountCode}
                        onChange={(e) => updateLine(line.id, "accountCode", e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-green-500 outline-none text-sm"
                      >
                        <option value="" className="bg-gray-900">Select Account...</option>
                        {COMMON_ACCOUNTS.map((acc) => (
                          <option key={acc.code} value={acc.code} className="bg-gray-900">
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        placeholder="Line description"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-green-500 outline-none text-sm"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={line.debit || ""}
                        onChange={(e) => updateLine(line.id, "debit", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-green-500 outline-none text-sm text-right"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={line.credit || ""}
                        onChange={(e) => updateLine(line.id, "credit", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-green-500 outline-none text-sm text-right"
                      />
                    </td>
                    <td className="py-2 px-2">
                      {lines.length > 2 && (
                        <button
                          onClick={() => removeLine(line.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td colSpan={2} className="py-3 px-2 text-right font-semibold">Totals</td>
                  <td className="py-3 px-2 text-right font-bold text-lg">{formatCurrency(totalDebit)}</td>
                  <td className="py-3 px-2 text-right font-bold text-lg">{formatCurrency(totalCredit)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-2 text-right">Difference</td>
                  <td colSpan={2} className={`py-2 px-2 text-center font-bold ${isBalanced ? "text-green-400" : "text-red-400"}`}>
                    {isBalanced ? (
                      <span className="flex items-center justify-center gap-2">
                        <i className="ri-checkbox-circle-line"></i> Balanced
                      </span>
                    ) : (
                      <span>{formatCurrency(Math.abs(totalDebit - totalCredit))} {totalDebit > totalCredit ? "Debit" : "Credit"}</span>
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <i className="ri-lightbulb-line text-green-400"></i>
            Tips
          </h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <i className="ri-check-line text-green-400 mt-0.5"></i>
              <span>Every journal entry must balance - total debits must equal total credits</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-check-line text-green-400 mt-0.5"></i>
              <span>Assets and Expenses increase with debits, decrease with credits</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-check-line text-green-400 mt-0.5"></i>
              <span>Liabilities, Equity, and Revenue increase with credits, decrease with debits</span>
            </li>
            <li className="flex items-start gap-2">
              <i className="ri-check-line text-green-400 mt-0.5"></i>
              <span>Save as draft to review later, or post immediately to update account balances</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
