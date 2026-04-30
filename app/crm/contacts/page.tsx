/**
 * CRM Contacts Page
 * Contact management
 */

"use client";

import { useEffect, useState } from "react";
import { RiContactsLine, RiAddLine } from "react-icons/ri";
import type { Contact } from "@/types/crm";

export default function CRMContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/crm/contacts?tenantId=default");
      const data = await response.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
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
              <RiContactsLine className="text-purple-400" />
              Contacts
            </h1>
            <p className="text-gray-400 mt-1">Contact management</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
            <RiAddLine />
            Create Contact
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-pulse text-gray-400">
              Loading contacts...
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">No contacts found</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold">All Contacts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">
                      Primary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">
                        {contact.firstName} {contact.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">{contact.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {contact.phone || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {contact.title || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {contact.isPrimary && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-400/20 text-purple-400">
                            Primary
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
