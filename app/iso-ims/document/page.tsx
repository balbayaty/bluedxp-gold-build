/**
 * ISO-IMS Document Management Page
 * Document Control & Version Management
 * World-class UI/UX with glassmorphism and animations
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiSearch,
  FiFileText,
  FiDownload,
  FiClock,
} from "react-icons/fi";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import PageTemplate from "@/components/PageTemplate";

interface Document {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
  version: string;
  category: string;
  lastUpdated: string;
}

function DocumentPageContent() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const tenantId = "default-tenant"; // TODO: Get from auth context
      const response = await fetch(
        `/api/iso-ims/documents?tenantId=${tenantId}&page=1&pageSize=100`,
      );

      if (response.ok) {
        const data = await response.json();
        const mappedDocuments: Document[] = (data.documents || []).map(
          (doc: any) => ({
            id: doc.id,
            documentNumber: doc.documentNumber || doc.id,
            title: doc.title,
            status: doc.status || "DRAFT",
            version: doc.version || "1.0",
            category: doc.category || "GENERAL",
            lastUpdated: doc.updatedAt || doc.createdAt,
          }),
        );
        setDocuments(mappedDocuments);
      } else {
        console.error("Failed to fetch documents");
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching Documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTemplate
      title="Document Management"
      description="Document Control • Version Management • Approval Workflows"
      icon="ri-file-text-line"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search Documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        <motion.button
          onClick={() => router.push("/iso-ims/document/new")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative overflow-hidden px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <FiPlus className="w-5 h-5 relative z-10" />
          <span className="relative z-10">New Document</span>
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <PremiumLoader message="Loading Documents..." size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
              }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {doc.documentNumber}
                    </p>
                  </div>
                  <FiFileText className="w-6 h-6 text-blue-400" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    v{doc.version}
                  </span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <FiClock className="w-4 h-4" />
                    <span>
                      {new Date(doc.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}

export default function DocumentPage() {
  return (
    <ErrorBoundary>
      <DocumentPageContent />
    </ErrorBoundary>
  );
}
