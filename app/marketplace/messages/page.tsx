/**
 * Marketplace Messages Page
 * Messages dashboard with conversation list
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { MessageCircle, Search, Filter } from "lucide-react";
import ConversationList from "@/components/marketplace/messaging/ConversationList";
import ChatWindow from "@/components/marketplace/messaging/ChatWindow";

export default function MessagesPage() {
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [currentUserId] = useState("user-1"); // TODO: Get from auth context
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <PageTemplate
      title="Messages"
      description="Communicate with service providers and customers"
      icon={MessageCircle}
    >
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Conversations</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <ConversationList
            userId={currentUserId}
            onSelectConversation={setSelectedConversationId}
            selectedConversationId={selectedConversationId}
            filters={{
              status:
                statusFilter === "all" ? undefined : (statusFilter as any),
            }}
          />
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversationId ? (
            <ChatWindow
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
              onClose={() => setSelectedConversationId(undefined)}
            />
          ) : (
            <div className="h-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
