/**
 * CRM Account Detail Page
 * Customer account with contacts, opportunities, and history
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { CRMAccount, Opportunity, Contact } from "@/types/crm";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "contacts", label: "Contacts", icon: "ri-contacts-line" },
  { id: "opportunities", label: "Opportunities", icon: "ri-funds-line" },
  { id: "activities", label: "Activities", icon: "ri-calendar-line" },
  { id: "orders", label: "Orders", icon: "ri-shopping-cart-line" },
] as const;

type TabId = typeof TABS[number]["id"];

const ratingColors: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-yellow-500",
  D: "bg-red-500",
};

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  
  const [account, setAccount] = useState<CRMAccount | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  const loadAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountRes, contactsRes, oppsRes] = await Promise.all([
        fetch(`/api/crm/accounts/${accountId}`),
        fetch(`/api/crm/contacts?accountId=${accountId}`),
        fetch(`/api/crm/opportunities?accountId=${accountId}`),
      ]);
      
      const accountData = await accountRes.json();
      const contactsData = await contactsRes.json();
      const oppsData = await oppsRes.json();
      
      if (accountData.success) setAccount(accountData.data);
      if (contactsData.success) setContacts(contactsData.data || []);
      if (oppsData.success) setOpportunities(oppsData.data || []);
    } catch (err) {
      setError("Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/crm/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showSuccess("Account Deleted", "The account has been removed");
        setTimeout(() => router.push("/crm/accounts"), 1500);
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      showError("Delete Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowDeleteDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Account Not Found"
          message={error || "The requested account could not be found"}
          onRetry={loadAccount}
          onBack={() => router.push("/crm/accounts")}
          icon="ri-building-line"
        />
      </div>
    );
  }

  const totalOpportunityValue = opportunities.reduce((sum, o) => sum + o.value, 0);
  const wonOpportunities = opportunities.filter(o => o.stage === "CLOSED_WON");
  const wonValue = wonOpportunities.reduce((sum, o) => sum + o.value, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Account"
        message={`Are you sure you want to delete "${account.name}"? This will also remove all associated contacts and opportunities. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={processing}
      />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/crm/accounts" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-blue-500/30">
                {account.name?.[0] || "A"}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{account.name}</h1>
                  {account.rating && (
                    <span className={`w-8 h-8 rounded-full ${ratingColors[account.rating]} flex items-center justify-center text-sm font-bold`}>
                      {account.rating}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-gray-400">
                  {account.industry && <span>{account.industry}</span>}
                  {account.accountType && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-white/10 rounded text-sm">{account.accountType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl transition-all text-gray-400 hover:text-red-400"
                aria-label="Delete account"
              >
                <i className="ri-delete-bin-line text-lg"></i>
              </button>
              <Link href={`/crm/accounts/${accountId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors">
                <i className="ri-edit-line"></i>Edit
              </Link>
              <Link href={`/crm/opportunities/new?accountId=${accountId}`} className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transition-all">
                <i className="ri-add-line"></i>New Opportunity
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Annual Revenue</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(account.annualRevenue || 0)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Employees</p>
              <p className="text-3xl font-bold mt-1">{account.employeeCount?.toLocaleString() || "-"}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Open Pipeline</p>
              <p className="text-3xl font-bold mt-1 text-blue-400">{formatCurrency(totalOpportunityValue - wonValue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Won Revenue</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{formatCurrency(wonValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>{tab.label}
                {tab.id === "contacts" && <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-xs">{contacts.length}</span>}
                {tab.id === "opportunities" && <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded text-xs">{opportunities.length}</span>}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-building-line text-blue-400"></i>
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400">Website</label>
                    {account.website ? (
                      <a href={account.website} target="_blank" rel="noopener noreferrer" className="block mt-1 text-blue-400 hover:underline">
                        {account.website}
                      </a>
                    ) : (
                      <p className="mt-1">-</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Industry</label>
                    <p className="mt-1">{account.industry || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Phone</label>
                    <p className="mt-1">{account.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="mt-1">{account.email || "-"}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-map-pin-line text-blue-400"></i>
                  Address
                </h3>
                <p className="text-gray-300">{account.address || "No address on file"}</p>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href={`/crm/contacts/new?accountId=${accountId}`} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2">
                    <i className="ri-user-add-line"></i>Add Contact
                  </Link>
                  <Link href={`/crm/opportunities/new?accountId=${accountId}`} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2">
                    <i className="ri-add-line"></i>New Opportunity
                  </Link>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2">
                    <i className="ri-mail-line"></i>Send Email
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">CRM Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Account Owner</span>
                    <span>{account.crmFields?.accountOwnerId || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Territory</span>
                    <span>{account.crmFields?.territory || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source</span>
                    <span>{account.crmFields?.source || "-"}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Contacts ({contacts.length})</h3>
              <Link href={`/crm/contacts/new?accountId=${accountId}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Add Contact
              </Link>
            </div>
            {contacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contacts.map((contact) => (
                  <motion.div key={contact.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-gray-400">{contact.title}</p>
                        {contact.isPrimary && (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Primary</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
                        <i className="ri-mail-line"></i>{contact.email}
                      </a>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
                          <i className="ri-phone-line"></i>{contact.phone}
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                <i className="ri-contacts-line text-5xl text-gray-500 mb-4"></i>
                <p className="text-gray-400">No contacts yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "opportunities" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Opportunities ({opportunities.length})</h3>
              <Link href={`/crm/opportunities/new?accountId=${accountId}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>New Opportunity
              </Link>
            </div>
            {opportunities.length > 0 ? (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <Link key={opp.id} href={`/crm/opportunities/${opp.id}`}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-lg">{opp.name}</p>
                          <p className="text-sm text-gray-400">{opp.stage} • {opp.probability}% probability</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-400">{formatCurrency(opp.value)}</p>
                          <p className="text-sm text-gray-400">Close: {new Date(opp.expectedCloseDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                <i className="ri-funds-line text-5xl text-gray-500 mb-4"></i>
                <p className="text-gray-400">No opportunities yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <i className="ri-calendar-todo-line text-5xl text-gray-500 mb-4"></i>
            <p className="text-gray-400">No activities logged</p>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
            <i className="ri-shopping-cart-line text-5xl text-gray-500 mb-4"></i>
            <p className="text-gray-400">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1">Sales orders and purchase orders will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
