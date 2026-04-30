/**
 * CRM Contact Detail Page
 * Comprehensive contact view with activities and relationships
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Contact } from "@/types/crm";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-user-line" },
  { id: "activities", label: "Activities", icon: "ri-calendar-line" },
  { id: "opportunities", label: "Opportunities", icon: "ri-funds-line" },
  { id: "history", label: "History", icon: "ri-time-line" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  const loadContact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`);
      if (!response.ok) throw new Error("Contact not found");
      const data = await response.json();
      if (data.success) {
        setContact(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        showSuccess("Contact Deleted", "The contact has been removed");
        setTimeout(() => router.push("/crm/contacts"), 1500);
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

  const handleSendEmail = () => {
    if (contact?.email) {
      window.location.href = `mailto:${contact.email}`;
      showInfo("Email", `Opening email client for ${contact.email}`);
    }
  };

  const handleCall = () => {
    if (contact?.phone) {
      window.location.href = `tel:${contact.phone}`;
      showInfo("Call", `Initiating call to ${contact.phone}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="Contact Not Found"
          message={error || "The requested contact could not be found"}
          onRetry={loadContact}
          onBack={() => router.push("/crm/contacts")}
          icon="ri-contacts-line"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={processing}
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/crm/contacts" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl shadow-violet-500/30">
                {contact.firstName[0]}{contact.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h1>
                  {contact.isPrimary && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Primary Contact
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mt-1">{contact.title} {contact.department ? `• ${contact.department}` : ""}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <a href={`mailto:${contact.email}`} className="text-violet-400 hover:underline flex items-center gap-1">
                    <i className="ri-mail-line"></i>{contact.email}
                  </a>
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="text-gray-400 hover:text-white flex items-center gap-1">
                      <i className="ri-phone-line"></i>{contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/crm/contacts/${contactId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2">
                <i className="ri-edit-line"></i>Edit
              </Link>
              <a href={`mailto:${contact.email}`} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-violet-500/30 flex items-center gap-2">
                <i className="ri-mail-send-line"></i>Send Email
              </a>
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
                  activeTab === tab.id ? "border-violet-500 text-violet-400" : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>{tab.label}
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
                  <i className="ri-user-line text-violet-400"></i>
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <a href={`mailto:${contact.email}`} className="block mt-1 text-violet-400 hover:underline">{contact.email}</a>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Phone</label>
                    <p className="mt-1">{contact.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Mobile</label>
                    <p className="mt-1">{contact.mobile || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Department</label>
                    <p className="mt-1">{contact.department || "-"}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <i className="ri-building-line text-violet-400"></i>
                  Account
                </h3>
                <Link href={`/crm/accounts/${contact.accountId}`} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <i className="ri-building-2-line text-xl"></i>
                  </div>
                  <div>
                    <p className="font-medium">View Associated Account</p>
                    <p className="text-sm text-gray-400">Account ID: {contact.accountId}</p>
                  </div>
                  <i className="ri-arrow-right-s-line text-xl ml-auto"></i>
                </Link>
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <a href={`mailto:${contact.email}`} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <i className="ri-mail-line"></i>Send Email
                  </a>
                  <a href={`tel:${contact.phone}`} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <i className="ri-phone-line"></i>Call
                  </a>
                  <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <i className="ri-calendar-line"></i>Schedule Meeting
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created</span>
                    <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated</span>
                    <span>{new Date(contact.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "activities" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Activities</h3>
              <button className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-xl flex items-center gap-2">
                <i className="ri-add-line"></i>Log Activity
              </button>
            </div>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-calendar-todo-line text-5xl mb-4"></i>
              <p>No activities logged yet</p>
            </div>
          </motion.div>
        )}

        {activeTab === "opportunities" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Related Opportunities</h3>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-funds-line text-5xl mb-4"></i>
              <p>No opportunities associated with this contact</p>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Contact History</h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10"></div>
              <div className="space-y-6">
                <div className="relative flex items-start gap-4 pl-10">
                  <div className="absolute left-2 w-5 h-5 rounded-full bg-violet-500 border-2 border-gray-900"></div>
                  <div>
                    <p className="font-medium">Contact Created</p>
                    <p className="text-sm text-gray-400">{new Date(contact.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
