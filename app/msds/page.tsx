/**
 * MSDS Complete Module
 * Comprehensive MSDS management: Upload → AI Extract → Manual Review → Approve/Reject → Email → ERPNext → Database
 * Adapted from chemcheck-ai for Hazalyze Platform
 */

"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import Modal from "@/components/Modal";
import NFPADiamond from "@/components/NFPADiamond";
import WarehouseRecommendations from "@/components/msds/WarehouseRecommendations";
import PDFViewer from "@/components/msds/PDFViewer";
import DocumentQRGenerator from "@/components/qr/DocumentQRGenerator";
import { PremiumLoader, ProgressLoader } from "@/components/loading";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  msdsGroupingService,
  GroupedSubmissions,
} from "@/lib/services/chemical/msdsGroupingService";
import { msdsExportService } from "@/lib/services/chemical/msdsExportService";
import { msdsEmailReportService } from "@/lib/services/chemical/msdsEmailReportService";
import {
  msdsDuplicateDetectionService,
  DuplicateMatch,
} from "@/lib/services/chemical/msdsDuplicateDetectionService";
import { intelligentWarehouseAssignmentService } from "@/lib/services/warehouse/intelligentWarehouseAssignment";
import {
  MSDSSubmission,
  ExtractedMSDSData as MSDSExtractedData,
} from "@/types/msds";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { apiFetch } from "@/utils/apiFetch";
import { useAuth } from "@/contexts/AuthContext";
import ProcessingQueue from "@/components/msds/ProcessingQueue";
import BatchJobMonitor from "@/components/msds/BatchJobMonitor";

interface ExtractedData {
  productName: string;
  manufacturer: string;
  casNumber: string;
  ecNumber?: string;
  unNumber?: string;
  molecularFormula?: string;
  formula: string;
  hazardClass: string;
  hazardLevel: "High" | "Medium" | "Low";
  hazardStatements: string[];
  precautionaryStatements: string[];
  physicalState: string;
  flashPoint: string;
  boilingPoint: string;
  ph: string;
  storageConditions: string[];
  incompatibleMaterials: string[];
  ppeRequired: string[];
  firstAid: string;
  firefighting: string;
  spillResponse: string;
  ghsCompliant: boolean;
  safetyScore: number;
  aiConfidence: number;
  packagingType: string;
  unNumber: string;
  transportClass: string;
  packingGroup: string;
  fireSuppressionRequired: string;
  specialHazards: string;
  remarks: string;
  healthRating: string;
  flammabilityRating: string;
  reactivityRating: string;
}

interface Submission {
  id: string;
  file: File;
  status: "uploading" | "analyzing" | "review" | "approved" | "rejected";
  extractedData?: ExtractedData;
  manualNotes?: string;
  customerEmail?: string;
  customerId?: string;
  customerName?: string;
  subCustomerId?: string;
  subCustomerName?: string;
  submittedDate: Date;
  warehouseAssignment?: {
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    areaId?: string;
    assignedAt: string;
    recommendation?: any;
  };
  parsingIssues?: {
    isProtected: boolean;
    isImageOnly: boolean;
    lowConfidence: boolean;
    message: string;
  };
  duplicateMatch?: {
    submission: Submission;
    similarity: number;
    matchType: "exact" | "cas" | "name" | "similar";
    matchedFields: string[];
    confidence: "high" | "medium" | "low";
  };
}

type MainTabType = "workflow" | "batch" | "versions" | "analytics";

export default function MSDSPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <PremiumLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#111827] to-[#0f172a] text-white p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <i className="ri-lock-line text-cyan-400 text-2xl"></i>
          </div>
          <h1 className="text-xl font-bold mb-2">Login required</h1>
          <p className="text-sm text-white/70 mb-5">
            MSDS is protected. Please sign in to continue.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-medium transition"
            >
              Go to Login
            </Link>
            <button
              onClick={() => router.refresh()}
              className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition"
            >
              Refresh
            </button>
          </div>
          <p className="text-xs text-white/50 mt-4">
            If the login page takes a while the first time, wait ~20–30 seconds
            while it compiles.
          </p>
        </div>
      </div>
    );
  }

  return <MSDSAuthed />;
}

function MSDSAuthed() {
  const router = useRouter();
  const { user, tenant } = useAuth();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [processing, setProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [mainTab, setMainTab] = useState<MainTabType>("workflow");
  const [editedData, setEditedData] = useState<Partial<ExtractedData>>({});
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestedInfo, setRequestedInfo] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({ show: false, type: "info", title: "", message: "" });
  const [notificationProgress, setNotificationProgress] = useState(100);
  const [isNotificationPaused, setIsNotificationPaused] = useState(false);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationProgressRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showWarehouseRecommendations, setShowWarehouseRecommendations] =
    useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState<string | undefined>(
    undefined,
  );
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [packaging, setPackaging] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<string | undefined>(undefined);
  const [volume, setVolume] = useState<number | undefined>(undefined);
  const [temperature, setTemperature] = useState<string | undefined>(undefined);
  const [handling, setHandling] = useState<string | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [pdfViewerFile, setPdfViewerFile] = useState<File | string | null>(
    null,
  );
  const [pdfViewerFileName, setPdfViewerFileName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHazardLevel, setFilterHazardLevel] = useState<
    "all" | "High" | "Medium" | "Low"
  >("all");
  const [filterDateRange, setFilterDateRange] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [groupBy, setGroupBy] = useState<
    "none" | "manufacturer" | "hazardLevel" | "date" | "customer" | "status"
  >("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [subCustomerName, setSubCustomerName] = useState<string | undefined>(
    undefined,
  );
  const [subCustomerId, setSubCustomerId] = useState<string | undefined>(
    undefined,
  );

  // Batch processing state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<{
    successful: number;
    failed: number;
    details: Array<{
      fileName: string;
      status: "success" | "failed";
      error?: string;
    }>;
  } | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [lastJobSummary, setLastJobSummary] = useState<{
    successful: number;
    failed: number;
    details: Array<{
      fileName: string;
      status: "success" | "failed";
      error?: string;
    }>;
  } | null>(null);
  const [jobSnapshot, setJobSnapshot] = useState<any | null>(null);
  const [jobNotFound, setJobNotFound] = useState(false);

  // Version control state
  const [selectedVersions, setSelectedVersions] = useState<{
    v1: string | null;
    v2: string | null;
  }>({ v1: null, v2: null });
  const [versionComparison, setVersionComparison] = useState<any>(null);
  const [comparingVersions, setComparingVersions] = useState(false);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const [bulkReason, setBulkReason] = useState("");

  // Local diagnostics (helps non-technical users fix "Unknown/CAS not found" quickly)
  const [aiKeyStatus, setAiKeyStatus] = useState<
    "unknown" | "configured" | "missing"
  >("unknown");
  const [systemHealth, setSystemHealth] = useState<{
    ai?: { mode?: "mock" | "real"; activeProvider?: string };
    ocr?: { pdfOcrAvailable?: boolean };
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  // Intelligent auto-dismiss notification system
  // Extracts confidence from message and adjusts duration accordingly
  useEffect(() => {
    if (!notification.show || isNotificationPaused) {
      // Clear any existing timers when paused or hidden
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      if (notificationProgressRef.current) {
        clearInterval(notificationProgressRef.current);
        notificationProgressRef.current = null;
      }
      return;
    }

    // Intelligent duration calculation based on message content and type
    const calculateDuration = (): number => {
      // Base duration by type
      const baseDuration =
        notification.type === "error"
          ? 8000
          : notification.type === "info"
            ? 6000
            : 5000;

      // Extract confidence percentage from message (e.g., "10% confidence")
      const confidenceMatch = notification.message.match(/(\d+)% confidence/i);
      if (confidenceMatch) {
        const confidence = parseInt(confidenceMatch[1], 10);
        // Lower confidence = shorter duration (user needs to act quickly)
        // Higher confidence = longer duration (can read at leisure)
        // Formula: baseDuration * (0.5 + confidence/200)
        // This gives: 10% = 0.55x, 50% = 0.75x, 90% = 0.95x, 100% = 1.0x
        return Math.max(
          3000,
          Math.min(10000, baseDuration * (0.5 + confidence / 200)),
        );
      }

      // Check for important keywords that need longer display
      const importantKeywords = [
        "error",
        "failed",
        "critical",
        "warning",
        "required",
      ];
      const hasImportantKeyword = importantKeywords.some(
        (keyword) =>
          notification.message.toLowerCase().includes(keyword) ||
          notification.title.toLowerCase().includes(keyword),
      );

      if (hasImportantKeyword) {
        return baseDuration * 1.5;
      }

      return baseDuration;
    };

    const duration = calculateDuration();
    const startTime = Date.now();
    setNotificationProgress(100);

    // Update progress bar smoothly
    const updateProgress = () => {
      if (isNotificationPaused) return;

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = Math.max(0, (remaining / duration) * 100);
      setNotificationProgress(progressPercent);

      if (remaining <= 0) {
        setNotification((prev) => ({ ...prev, show: false }));
      }
    };

    // Update progress every 50ms for smooth animation
    notificationProgressRef.current = setInterval(updateProgress, 50);

    // Auto-dismiss after calculated duration
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, duration);

    // Cleanup
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      if (notificationProgressRef.current) {
        clearInterval(notificationProgressRef.current);
        notificationProgressRef.current = null;
      }
    };
  }, [
    notification.show,
    notification.message,
    notification.title,
    notification.type,
    isNotificationPaused,
  ]);

  const additionalInfoOptions = [
    "Volume/Quantity to be stored",
    "Packaging type (Drums/Barrels/IBC/Bulk)",
    "Storage duration required",
    "Temperature control requirements",
    "Specific handling procedures",
    "Emergency response plan",
    "Previous incident history",
    "Waste disposal method",
    "Transport documentation",
    "Regulatory permits/licenses",
    "Supplier certification",
    "Quality control documentation",
    "MSDS revision history",
    "Usage/application details",
    "Dilution/concentration information",
  ];

  // Load from database on page load
  const [loadingFromDatabase, setLoadingFromDatabase] = useState(false);
  const [databaseMSDS, setDatabaseMSDS] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<
    Array<{ query: string; timestamp: string; resultsCount: number }>
  >([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // IMPORTANT: define this BEFORE any hooks that reference it in dependency arrays.
  // Otherwise, JS will throw "Cannot access 'mapExtractedToUi' before initialization".
  const mapExtractedToUi = useCallback(
    (apiData: any, fallbackFileName: string): ExtractedData => {
      // Map server ExtractedMSDSData (or analyze-comprehensive extractedData) to UI ExtractedData
      // Only use fallbacks if field is truly missing - don't hardcode "Not specified" for extracted data
      return {
        productName:
          apiData?.productName ||
          apiData?.chemicalName ||
          fallbackFileName.replace(/\.(pdf|xlsx|xls|csv)$/i, ""),
        manufacturer:
          apiData?.manufacturer || apiData?.supplierName || undefined, // Don't hardcode - let UI show "Not specified"
        casNumber: apiData?.casNumber || undefined,
        ecNumber: apiData?.ecNumber,
        unNumber: apiData?.unNumber,
        molecularFormula: apiData?.molecularFormula || apiData?.formula,
        formula: apiData?.molecularFormula || apiData?.formula || undefined,
        hazardClass:
          apiData?.hazardClass || apiData?.transportClass || undefined,
        hazardLevel: apiData?.hazardLevel || "Medium",
        hazardStatements: Array.isArray(apiData?.hazardStatements)
          ? apiData.hazardStatements
          : Array.isArray(apiData?.hazards)
            ? apiData.hazards
            : [],
        precautionaryStatements: Array.isArray(apiData?.precautionaryStatements)
          ? apiData.precautionaryStatements
          : [],
        physicalState: apiData?.physicalState || undefined,
        flashPoint: apiData?.flashPoint || undefined,
        boilingPoint: apiData?.boilingPoint || undefined,
        ph: apiData?.ph || undefined,
        storageConditions: Array.isArray(apiData?.storageConditions)
          ? apiData.storageConditions
          : Array.isArray(apiData?.handlingPrecautions)
            ? apiData.handlingPrecautions
            : [],
        incompatibleMaterials: Array.isArray(apiData?.incompatibleMaterials)
          ? apiData.incompatibleMaterials
          : [],
        ppeRequired: Array.isArray(apiData?.ppeRequired)
          ? apiData.ppeRequired
          : [],
        firstAid: apiData?.firstAid || undefined,
        firefighting: apiData?.firefighting || undefined,
        spillResponse: apiData?.spillResponse || undefined,
        ghsCompliant: apiData?.ghsCompliant !== false,
        safetyScore: apiData?.safetyScore || 0,
        aiConfidence:
          typeof apiData?.aiConfidence === "number"
            ? apiData.aiConfidence
            : typeof apiData?.confidence === "number"
              ? Math.round(apiData.confidence * 100)
              : 0,
        packagingType: apiData?.packagingType || undefined,
        transportClass:
          apiData?.transportClass || apiData?.hazardClass || undefined,
        packingGroup: apiData?.packingGroup || undefined,
        fireSuppressionRequired: apiData?.fireSuppressionRequired || undefined,
        specialHazards: apiData?.specialHazards || undefined,
        remarks: apiData?.remarks || apiData?.notes || "",
        healthRating:
          apiData?.healthRating || apiData?.nfpa?.health?.toString() || "0",
        flammabilityRating:
          apiData?.flammabilityRating ||
          apiData?.nfpa?.flammability?.toString() ||
          "0",
        reactivityRating:
          apiData?.reactivityRating ||
          apiData?.nfpa?.reactivity?.toString() ||
          "0",
      };
    },
    [],
  );

  // Load from database
  const loadFromDatabase = useCallback(async () => {
    setLoadingFromDatabase(true);
    try {
      const response = await apiFetch("/api/chemical/msds/list");
      const data = await response.json();
      if (data.success && data.data) {
        // Convert database entries to Submission format
        const dbSubmissions: Submission[] = data.data.map((entry: any) => ({
          id: entry.id,
          file: new File([], entry.productName || "Unknown"),
          status:
            entry.status === "approved"
              ? "approved"
              : entry.status === "rejected"
                ? "rejected"
                : "review",
          extractedData: mapExtractedToUi(
            entry.extractedData || {},
            entry.productName || "Unknown",
          ),
          submittedDate: new Date(entry.createdAt),
          customerName: entry.metadata?.customerName,
          customerId: entry.metadata?.customerId,
        }));
        setDatabaseMSDS(dbSubmissions);
        // Merge with existing submissions (avoid duplicates)
        setSubmissions((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newOnes = dbSubmissions.filter((s) => !existingIds.has(s.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (error) {
      console.error("Error loading from database:", error);
    } finally {
      setLoadingFromDatabase(false);
    }
  }, [mapExtractedToUi]);

  // Load search history
  const loadSearchHistory = useCallback(async () => {
    try {
      const response = await apiFetch(
        "/api/chemical/msds/search-history?type=recent&limit=10",
      );
      const data = await response.json();
      if (data.success && data.data) {
        setSearchHistory(data.data);
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const response = await apiFetch("/api/chemical/msds/analytics");
      const data = await response.json();
      if (data.success && data.data) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadFromERPNext();
    loadFromDatabase();
    loadSearchHistory();
    loadAnalytics();
  }, [loadFromDatabase, loadSearchHistory, loadAnalytics]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect whether the browser has AI keys stored (used by MSDS upload via request headers).
    try {
      const openaiKey = localStorage.getItem("openai_api_key") || "";
      const anthropicKey = localStorage.getItem("anthropic_api_key") || "";
      const openaiOk =
        openaiKey.length > 20 &&
        openaiKey.startsWith("sk-") &&
        !openaiKey.includes("****");
      const anthropicOk =
        anthropicKey.length > 20 &&
        anthropicKey.startsWith("sk-ant-") &&
        !anthropicKey.includes("****");
      setAiKeyStatus(openaiOk || anthropicOk ? "configured" : "missing");
    } catch {
      setAiKeyStatus("missing");
    }

    // Fetch lightweight system readiness (dev-friendly; doesn't require tenant).
    fetch("/api/system/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setSystemHealth(json))
      .catch(() => {
        // ignore
      });
  }, []);

  // Resume any in-flight job after refresh (dev-friendly reliability)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedActive = window.localStorage.getItem("msds_active_job_id");
      const savedLast = window.localStorage.getItem("msds_last_job_id");
      const savedSummary = window.localStorage.getItem("msds_last_job_summary");
      if (savedLast) setLastJobId(savedLast);
      if (savedSummary) {
        try {
          const parsed = JSON.parse(savedSummary) as any;
          if (parsed && typeof parsed === "object") setLastJobSummary(parsed);
        } catch {
          // ignore
        }
      }
      if (savedActive) setActiveJobId(savedActive);
    } catch {
      // ignore
    }
  }, []);

  const getClientAIKeys = useCallback((): {
    openai?: string;
    anthropic?: string;
  } => {
    let apiKeys: { openai?: string; anthropic?: string } = {};
    if (typeof window === "undefined") return apiKeys;
    try {
      const openaiKey = localStorage.getItem("openai_api_key");
      const anthropicKey = localStorage.getItem("anthropic_api_key");
      if (
        openaiKey &&
        openaiKey.length > 20 &&
        openaiKey.startsWith("sk-") &&
        !openaiKey.includes("****")
      ) {
        apiKeys.openai = openaiKey;
      }
      if (
        anthropicKey &&
        anthropicKey.length > 20 &&
        anthropicKey.startsWith("sk-ant-") &&
        !anthropicKey.includes("****")
      ) {
        apiKeys.anthropic = anthropicKey;
      }
    } catch {
      // ignore
    }
    return apiKeys;
  }, []);

  // Poll active batch job status (multi-tenant safe via apiFetch headers)
  useEffect(() => {
    // Poll active job if exists, otherwise poll last job once to show final state
    const jobIdToPoll = activeJobId || lastJobId;
    if (!jobIdToPoll) {
      // Clear localStorage if no job IDs
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("msds_active_job_id");
          window.localStorage.removeItem("msds_last_job_id");
        }
      } catch {
        // ignore
      }
      return;
    }

    try {
      if (activeJobId && typeof window !== "undefined")
        window.localStorage.setItem("msds_active_job_id", activeJobId);
    } catch {
      // ignore
    }
    let cancelled = false;
    let hasPolledLastJob = false;
    let pollCount = 0;
    const MAX_POLLS = 300; // 10 minutes max (300 * 2 seconds)
    const STUCK_JOB_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    const jobStartTime = activeJobId ? Date.now() : null;

    const tick = async () => {
      // If polling lastJobId (not active), only poll once
      if (!activeJobId && lastJobId && hasPolledLastJob) {
        cancelled = true;
        return;
      }

      pollCount++;

      // Timeout detection: if job has been running for too long, mark as potentially stuck
      if (
        activeJobId &&
        jobStartTime &&
        Date.now() - jobStartTime > STUCK_JOB_TIMEOUT
      ) {
        console.warn(
          "[msds] Job appears stuck, timeout exceeded:",
          jobIdToPoll,
        );
        setNotification({
          show: true,
          type: "warning",
          title: "Processing Taking Longer Than Expected",
          message:
            "The job is still running. This may indicate a slow LLM response or network issue. Check your API keys in Settings.",
        });
      }

      // Safety: stop polling after max attempts
      if (pollCount > MAX_POLLS) {
        console.warn(
          "[msds] Max poll attempts reached, stopping:",
          jobIdToPoll,
        );
        cancelled = true;
        setActiveJobId(null);
        setNotification({
          show: true,
          type: "warning",
          title: "Polling Timeout",
          message:
            "Job status polling stopped after maximum attempts. The job may still be processing.",
        });
        return;
      }

      try {
        const res = await apiFetch(`/api/chemical/msds/jobs/${jobIdToPoll}`);
        if (!res.ok) {
          // If job not found and we've polled a few times, stop
          if (res.status === 404 && pollCount > 3) {
            console.warn(
              "[msds] Job not found after multiple attempts:",
              jobIdToPoll,
            );
            cancelled = true;
            setActiveJobId(null);
            setLastJobId(null);
            setJobSnapshot(null);
            setLastJobSummary(null);
            setJobNotFound(true);
            // Clear from localStorage
            try {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("msds_active_job_id");
                window.localStorage.removeItem("msds_last_job_id");
              }
            } catch {
              // ignore
            }
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (!json?.success || !json?.job) {
          // If job doesn't exist after initial polls, stop
          if (pollCount > 3) {
            cancelled = true;
            setActiveJobId(null);
            setLastJobId(null);
            setJobSnapshot(null);
            setLastJobSummary(null);
            setJobNotFound(true);
            // Clear from localStorage
            try {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("msds_active_job_id");
                window.localStorage.removeItem("msds_last_job_id");
              }
            } catch {
              // ignore
            }
          }
          return;
        }

        // Job found, clear not found state
        setJobNotFound(false);

        const job = json.job;
        setJobSnapshot(job);

        if (cancelled) return;

        // Only update batch processing state for active jobs
        if (activeJobId) {
          setBatchProcessing(
            job.status === "queued" || job.status === "running",
          );
          setBatchProgress(Number(job.progress || 0));
        } else if (lastJobId) {
          // For last job, just set progress once
          setBatchProgress(Number(job.progress || 0));
          hasPolledLastJob = true;
        }

        // Update matching submissions (by filename) - only for active jobs
        if (activeJobId) {
          setSubmissions((prev) =>
            prev.map((s) => {
              const item = (job.items || []).find(
                (it: any) => it.filename === s.file.name,
              );
              if (!item) return s;

              if (item.status === "queued") {
                return { ...s, status: "uploading" };
              }
              if (item.status === "running") {
                return { ...s, status: "analyzing" };
              }
              if (item.status === "failed") {
                const minimal = mapExtractedToUi({}, s.file.name);
                return {
                  ...s,
                  status: "review",
                  extractedData: minimal,
                  parsingIssues: {
                    isProtected: false,
                    isImageOnly: false,
                    lowConfidence: true,
                    message:
                      item.error || "Batch analysis failed for this file",
                  },
                };
              }
              if (item.status === "completed") {
                const extracted = item.result?.extractedData || {};
                const uiData = mapExtractedToUi(extracted, s.file.name);
                const issues = Array.isArray(item.result?.issues)
                  ? item.result.issues
                  : [];
                const lowConfidence = Number(item.result?.confidence || 0) < 50;
                const issueMsg = issues
                  .filter(
                    (i: any) =>
                      i?.severity === "error" ||
                      i?.severity === "warning" ||
                      i?.code === "LOW_COMPLETENESS",
                  )
                  .map((i: any) => i?.message)
                  .filter(Boolean)
                  .join("; ");

                return {
                  ...s,
                  status: "review",
                  extractedData: uiData,
                  parsingIssues:
                    lowConfidence || issueMsg
                      ? {
                          isProtected: false,
                          isImageOnly: false,
                          lowConfidence,
                          message:
                            issueMsg ||
                            "Low confidence extraction. Manual review required.",
                        }
                      : undefined,
                };
              }
              return s;
            }),
          );
        }

        // Completed?
        if (job.status === "completed" || job.status === "failed") {
          const successful = (job.items || []).filter(
            (i: any) => i.status === "completed",
          ).length;
          const failed = (job.items || []).filter(
            (i: any) => i.status === "failed",
          ).length;
          const summary = {
            successful,
            failed,
            details: (job.items || []).map((i: any) => ({
              fileName: i.filename,
              status: i.status === "completed" ? "success" : "failed",
              error: i.error,
            })),
          };
          setBatchResults(summary);
          setLastJobId(String(job.id));
          setLastJobSummary(summary);
          try {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("msds_last_job_id", String(job.id));
              window.localStorage.setItem(
                "msds_last_job_summary",
                JSON.stringify(summary),
              );
            }
          } catch {
            // ignore
          }
          setActiveJobId(null);
          try {
            if (typeof window !== "undefined")
              window.localStorage.removeItem("msds_active_job_id");
          } catch {
            // ignore
          }
          setNotification({
            show: true,
            type: failed > 0 ? "error" : "success",
            title: "Batch Processing Complete",
            message: `${successful} successful, ${failed} failed`,
          });
        }
      } catch (error) {
        // Log polling errors for debugging
        console.error("[msds] Polling error:", error);
        // If we've polled multiple times and still getting errors, stop
        if (pollCount > 10) {
          cancelled = true;
          setActiveJobId(null);
          setNotification({
            show: true,
            type: "error",
            title: "Job Status Error",
            message:
              "Unable to fetch job status. The job may have failed or been cancelled.",
          });
        }
      }
    };

    tick();
    // Poll every 2 seconds for active jobs, or once for last job
    const pollInterval = activeJobId ? 2000 : 5000;
    const interval = setInterval(() => {
      if (!cancelled) tick();
    }, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeJobId, lastJobId, mapExtractedToUi]);

  const copyJobDiagnostics = useCallback(async () => {
    try {
      const payload = {
        activeJobId,
        lastJobId,
        lastJobSummary,
        systemHealth,
        aiKeyStatus,
        jobSnapshot,
        timestamp: new Date().toISOString(),
      };
      const text = JSON.stringify(payload, null, 2);

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: best-effort prompt (older browsers)
        // eslint-disable-next-line no-alert
        window.prompt("Copy this diagnostics JSON:", text);
      }

      setNotification({
        show: true,
        type: "success",
        title: "Copied diagnostics",
        message: "Diagnostics JSON copied to clipboard.",
      });
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        title: "Copy failed",
        message:
          error instanceof Error ? error.message : "Could not copy diagnostics",
      });
    }
  }, [
    activeJobId,
    aiKeyStatus,
    jobSnapshot,
    lastJobId,
    lastJobSummary,
    systemHealth,
  ]);

  const retryLastJob = useCallback(async () => {
    if (!lastJobId) return;
    try {
      const apiKeys = getClientAIKeys();
      setBatchProcessing(true);
      setBatchProgress(0);
      setActiveJobId(lastJobId);
      setNotification({
        show: true,
        type: "info",
        title: "Retry Started",
        message: "Retrying failed files in the last batch job...",
      });

      const res = await apiFetch(`/api/chemical/msds/jobs/${lastJobId}`, {
        method: "POST",
        headers: {
          ...(apiKeys.openai ? { "x-openai-key": apiKeys.openai } : {}),
          ...(apiKeys.anthropic
            ? { "x-anthropic-key": apiKeys.anthropic }
            : {}),
        },
      });
      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.error || "Retry failed");
      }
    } catch (error) {
      setBatchProcessing(false);
      setActiveJobId(null);
      setNotification({
        show: true,
        type: "error",
        title: "Retry Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [getClientAIKeys, lastJobId]);

  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRequestInfoModal) setShowRequestInfoModal(false);
        if (selectedSubmission) setSelectedSubmission(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showRequestInfoModal, selectedSubmission]);

  useEffect(() => {
    if (selectedSubmission || showRequestInfoModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedSubmission, showRequestInfoModal]);

  const loadFromERPNext = async () => {
    try {
      const response = await apiFetch(
        '/api/erpnext/items?filters=[["custom_document_type","=","MSDS"]]',
      );
      const data = await response.json();

      const serverErrorMessage: string | undefined =
        data?.error ||
        (Array.isArray(data?.errors)
          ? data.errors
              .map((e: any) => e?.message)
              .filter(Boolean)
              .join("; ")
          : undefined);

      if (data.data && data.data.length > 0) {
        const loadedSubmissions = data.data.map((item: any) => ({
          id: item.name,
          file: new File([], item.item_name),
          status:
            item.custom_approval_status === "Approved"
              ? "approved"
              : "rejected",
          extractedData: {
            productName: item.item_name,
            casNumber: item.custom_cas_number || "",
            manufacturer: item.custom_manufacturer || "",
            formula: item.custom_chemical_formula || "",
            hazardClass: item.custom_hazard_class || "",
            hazardLevel: (item.custom_hazard_level || "Medium") as
              | "High"
              | "Medium"
              | "Low",
            hazardStatements: [],
            precautionaryStatements: [],
            physicalState: item.custom_physical_state || "",
            flashPoint: item.custom_flash_point || "",
            boilingPoint: item.custom_boiling_point || "",
            ph: "",
            storageConditions: [],
            incompatibleMaterials: [],
            ppeRequired: [],
            firstAid: "",
            firefighting: "",
            spillResponse: "",
            ghsCompliant: item.custom_ghs_compliant === 1,
            safetyScore: item.custom_safety_score || 75,
            aiConfidence: item.custom_ai_confidence || 85,
            packagingType: item.custom_packaging_type || "",
            unNumber: item.custom_un_number || "",
            transportClass: item.custom_transport_class || "",
            packingGroup: item.custom_packing_group || "",
            fireSuppressionRequired:
              item.custom_fire_suppression_required || "",
            specialHazards: item.custom_special_hazards || "",
            remarks: "",
            healthRating: item.custom_health_rating || "1",
            flammabilityRating: item.custom_flammability_rating || "1",
            reactivityRating: item.custom_reactivity_rating || "0",
          },
          submittedDate: new Date(item.creation),
        }));

        setSubmissions((prev) => [...loadedSubmissions, ...prev]);
      }
    } catch (error) {
      // Error handled - previous submissions remain empty
    }
  };

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      // Single-file path stays interactive (uses analyze-comprehensive)
      if (files.length <= 1) {
        for (const file of files) {
          const submission: Submission = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            file,
            status: "uploading",
            submittedDate: new Date(),
          };
          setSubmissions((prev) => [...prev, submission]);
          await analyzeMSDS(submission);
        }
        return;
      }

      // Multi-file path uses background job pipeline (prevents timeouts + supports progress)
      const newSubs: Submission[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        file,
        status: "uploading",
        submittedDate: new Date(),
      }));
      setSubmissions((prev) => [...prev, ...newSubs]);

      setBatchProcessing(true);
      setBatchProgress(0);
      setBatchResults(null);

      try {
        // Get API keys from localStorage to send to server
        const apiKeys = getClientAIKeys();
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));

        const response = await apiFetch("/api/chemical/msds/jobs", {
          method: "POST",
          headers: {
            ...(apiKeys.openai ? { "x-openai-key": apiKeys.openai } : {}),
            ...(apiKeys.anthropic
              ? { "x-anthropic-key": apiKeys.anthropic }
              : {}),
          },
          body: formData,
        });

        const json = await response.json();
        if (!json?.success || !json?.job?.id) {
          throw new Error(json?.error || "Failed to start batch job");
        }

        setActiveJobId(String(json.job.id));
        setNotification({
          show: true,
          type: "info",
          title: "Batch Job Started",
          message: `Processing ${files.length} files in the background...`,
        });
      } catch (error) {
        setBatchProcessing(false);
        setActiveJobId(null);
        setNotification({
          show: true,
          type: "error",
          title: "Batch Processing Failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [analyzeMSDS, getClientAIKeys],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.name.endsWith(".pdf") ||
        f.name.endsWith(".xlsx") ||
        f.name.endsWith(".xls") ||
        f.name.endsWith(".csv"),
    );
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  async function analyzeMSDS(submission: Submission) {
    try {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, status: "analyzing" } : s,
        ),
      );

      const formData = new FormData();
      formData.append("file", submission.file);

      // Get API keys from localStorage and pass to server
      let apiKeys: { openai?: string; anthropic?: string } = {};
      if (typeof window !== "undefined") {
        try {
          const openaiKey = localStorage.getItem("openai_api_key");
          const anthropicKey = localStorage.getItem("anthropic_api_key");
          if (
            openaiKey &&
            openaiKey.length > 20 &&
            openaiKey.startsWith("sk-") &&
            !openaiKey.includes("****")
          ) {
            apiKeys.openai = openaiKey;
          }
          if (
            anthropicKey &&
            anthropicKey.length > 20 &&
            anthropicKey.startsWith("sk-ant-") &&
            !anthropicKey.includes("****")
          ) {
            apiKeys.anthropic = anthropicKey;
          }
        } catch (e) {
          // Error handled - API keys remain unset
        }
      }

      const response = await apiFetch("/api/chemical/analyze-comprehensive", {
        method: "POST",
        headers: {
          ...(apiKeys.openai ? { "x-openai-key": apiKeys.openai } : {}),
          ...(apiKeys.anthropic
            ? { "x-anthropic-key": apiKeys.anthropic }
            : {}),
        },
        body: formData,
      });

      // Robustly read server response (Next can return HTML on 500s).
      const contentType = response.headers.get("content-type") || "";
      let data: any = null;
      let rawBody = "";
      try {
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          rawBody = await response.text();
          try {
            data = JSON.parse(rawBody);
          } catch {
            data = null;
          }
        }
      } catch {
        data = null;
      }

      if (!data) {
        const statusMsg =
          `Server returned ${response.status} ${response.statusText || ""}`.trim();
        throw new Error(
          rawBody ? `${statusMsg}: ${rawBody.slice(0, 200)}` : statusMsg,
        );
      }

      const serverErrorMessage: string | undefined =
        data?.error ||
        (Array.isArray(data?.errors)
          ? data.errors
              .map((e: any) => e?.message)
              .filter(Boolean)
              .join("; ")
          : undefined);

      // Check if we have any extracted data, even if success is false
      const hasExtractedData = !!data.extractedData;
      const hasParsingIssues = !data.success || !!serverErrorMessage;
      const isProtected =
        serverErrorMessage?.includes("password") ||
        serverErrorMessage?.includes("protected");
      const isImageOnly =
        serverErrorMessage?.includes("image") ||
        serverErrorMessage?.includes("scan");
      const lowConfidence = (data.extractedData?.aiConfidence || 0) < 50;

      // Even if parsing has issues, try to extract what we can
      let extractedData: ExtractedData | undefined = undefined;

      // Always try to use extractedData if available, even if success is false
      if (data.extractedData || hasExtractedData) {
        // We have some data, use it even if there are issues
        const apiData = data.extractedData;
        extractedData = {
          productName:
            apiData.productName ||
            apiData.chemicalName ||
            submission.file.name.replace(/\.(pdf|xlsx|csv)$/i, ""),
          manufacturer:
            apiData.manufacturer || apiData.supplierName || undefined, // Don't hardcode
          casNumber: apiData.casNumber || undefined,
          ecNumber: apiData.ecNumber,
          unNumber: apiData.unNumber,
          molecularFormula: apiData.molecularFormula || apiData.formula,
          formula: apiData.molecularFormula || apiData.formula || undefined,
          hazardClass:
            apiData.hazardClass || apiData.transportClass || undefined,
          hazardLevel: apiData.hazardLevel || "Medium",
          hazardStatements: Array.isArray(apiData.hazardStatements)
            ? apiData.hazardStatements
            : Array.isArray(apiData.hazards)
              ? apiData.hazards
              : [],
          precautionaryStatements: Array.isArray(
            apiData.precautionaryStatements,
          )
            ? apiData.precautionaryStatements
            : [],
          physicalState: apiData.physicalState || undefined,
          flashPoint: apiData.flashPoint || undefined,
          boilingPoint: apiData.boilingPoint || undefined,
          ph: apiData.ph || undefined,
          storageConditions: Array.isArray(apiData.storageConditions)
            ? apiData.storageConditions
            : Array.isArray(apiData.handlingPrecautions)
              ? apiData.handlingPrecautions
              : ["Store in cool, dry place"],
          incompatibleMaterials: Array.isArray(apiData.incompatibleMaterials)
            ? apiData.incompatibleMaterials
            : ["Strong oxidizers"],
          ppeRequired: Array.isArray(apiData.ppeRequired)
            ? apiData.ppeRequired
            : [
                apiData.respiratoryProtection,
                apiData.handProtection,
                apiData.eyeProtection,
              ].filter(Boolean),
          firstAid:
            typeof apiData.firstAidMeasures === "object" &&
            apiData.firstAidMeasures.inhalation
              ? apiData.firstAidMeasures.inhalation
              : "Standard first aid procedures",
          firefighting:
            typeof apiData.firefightingMeasures === "object" &&
            apiData.firefightingMeasures.suitableMedia
              ? apiData.firefightingMeasures.suitableMedia
              : "CO2, dry chemical, foam",
          spillResponse:
            typeof apiData.spillResponse === "object" &&
            apiData.spillResponse.cleanupMethods
              ? apiData.spillResponse.cleanupMethods
              : "Contain and clean up",
          ghsCompliant: apiData.ghsCompliance !== false,
          safetyScore: apiData.safetyScore || 75,
          // Server returns `aiConfidence` as 0-100; `metadata.confidence` / `confidence` can be 0-1.
          aiConfidence:
            typeof apiData.aiConfidence === "number"
              ? apiData.aiConfidence
              : typeof apiData.confidence === "number"
                ? Math.max(0, Math.min(100, apiData.confidence * 100))
                : 0,
          packagingType: apiData.packagingType || "Drums/Containers",
          unNumber: apiData.unNumber || "UN not specified",
          transportClass:
            apiData.transportClass || apiData.hazardClass || "Class 9",
          packingGroup: apiData.packingGroup || "PG III",
          fireSuppressionRequired:
            apiData.firefightingMeasures?.suitableMedia || "CO2, Dry chemical",
          specialHazards:
            apiData.firefightingMeasures?.specialHazards ||
            "Standard combustion hazards",
          remarks: apiData.remarks || apiData.notes || "",
          healthRating:
            apiData.healthRating ||
            (apiData.hazardLevel === "High"
              ? "3"
              : apiData.hazardLevel === "Medium"
                ? "2"
                : "1"),
          flammabilityRating:
            apiData.flammabilityRating || (apiData.flashPoint ? "2" : "1"),
          reactivityRating: apiData.reactivityRating || "0",
        };
      }

      if (hasParsingIssues || isProtected || isImageOnly) {
        // Create minimal extractedData if we don't have any
        if (!extractedData) {
          // Try to extract CAS from filename as last resort
          const filenameCAS = submission.file.name.match(
            /(\d{2,7}-\d{2}-\d{1})/,
          )?.[1];

          extractedData = {
            productName: submission.file.name.replace(/\.(pdf|xlsx|csv)$/i, ""),
            manufacturer: "Unknown",
            casNumber: filenameCAS || "CAS not found",
            formula: "Not provided",
            hazardClass: "Could not parse Safety Data Sheet",
            hazardLevel: "Medium",
            hazardStatements: [],
            precautionaryStatements: ["Refer to original SDS document"],
            physicalState: "Not specified",
            flashPoint: "Not specified",
            boilingPoint: "Not specified",
            ph: "Not specified",
            storageConditions: [],
            incompatibleMaterials: [],
            ppeRequired: [],
            firstAid: "Refer to original SDS document",
            firefighting: "Refer to original SDS document",
            spillResponse: "Refer to original SDS document",
            ghsCompliant: false,
            safetyScore: 0,
            aiConfidence: 0,
            packagingType: "Not specified",
            unNumber: "UN not specified",
            transportClass: "Not specified",
            packingGroup: "Not specified",
            fireSuppressionRequired: "Not specified",
            specialHazards: "Not specified",
            remarks: "",
            healthRating: "0",
            flammabilityRating: "0",
            reactivityRating: "0",
          };
        }

        // Check for duplicates
        const existingSubmissions = submissions.filter(
          (s) => s.id !== submission.id && s.extractedData,
        );
        const duplicateMatches =
          await msdsDuplicateDetectionService.checkDuplicates(
            { ...submission, extractedData: extractedData! },
            existingSubmissions,
          );

        const duplicateMatch =
          duplicateMatches.length > 0 ? duplicateMatches[0] : undefined;

        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? {
                  ...s,
                  status: "review",
                  extractedData: extractedData!,
                  parsingIssues: {
                    isProtected,
                    isImageOnly,
                    lowConfidence: true,
                    message:
                      serverErrorMessage ||
                      "Document could not be fully parsed. Manual entry required.",
                  },
                  duplicateMatch,
                }
              : s,
          ),
        );

        // Show duplicate notification if found
        if (duplicateMatch) {
          const recommendation =
            msdsDuplicateDetectionService.getRecommendation(duplicateMatch);
          setTimeout(() => {
            setNotification({
              show: true,
              type:
                recommendation.action === "auto-approve" ? "success" : "info",
              title: "Duplicate MSDS Detected",
              message: `${recommendation.message}. ${recommendation.reason}`,
            });
          }, 500);
        }

        setNotification({
          show: true,
          type: "error",
          title: "Parsing Issue Detected",
          message: isProtected
            ? "Document is password protected"
            : isImageOnly
              ? "Document is image-only (scanned). OCR needed."
              : "Could not extract text. Manual review required.",
        });
        return;
      }

      if (data.success || data.extractedData) {
        const apiData = data.extractedData || data;

        const extractedData: ExtractedData = {
          productName:
            apiData.productName ||
            apiData.chemicalName ||
            submission.file.name.replace(/\.(pdf|xlsx|csv)$/i, ""),
          manufacturer:
            apiData.manufacturer ||
            apiData.supplierName ||
            "Manufacturer not specified",
          casNumber: apiData.casNumber || "CAS not found",
          ecNumber: apiData.ecNumber,
          unNumber: apiData.unNumber,
          molecularFormula: apiData.molecularFormula || apiData.formula,
          formula:
            apiData.molecularFormula ||
            apiData.formula ||
            "Formula not provided",
          hazardClass:
            apiData.hazardClass ||
            apiData.transportClass ||
            "Class pending review",
          hazardLevel: apiData.hazardLevel || "Medium",
          hazardStatements: Array.isArray(apiData.hazardStatements)
            ? apiData.hazardStatements
            : Array.isArray(apiData.hazards)
              ? apiData.hazards
              : [],
          precautionaryStatements: Array.isArray(
            apiData.precautionaryStatements,
          )
            ? apiData.precautionaryStatements
            : [],
          physicalState: apiData.physicalState || "Liquid",
          flashPoint: apiData.flashPoint || "Not specified",
          boilingPoint: apiData.boilingPoint || "Not specified",
          ph: apiData.ph || "Not specified",
          storageConditions: Array.isArray(apiData.storageConditions)
            ? apiData.storageConditions
            : Array.isArray(apiData.handlingPrecautions)
              ? apiData.handlingPrecautions
              : ["Store in cool, dry place"],
          incompatibleMaterials: Array.isArray(apiData.incompatibleMaterials)
            ? apiData.incompatibleMaterials
            : ["Strong oxidizers"],
          ppeRequired: Array.isArray(apiData.ppeRequired)
            ? apiData.ppeRequired
            : [
                apiData.respiratoryProtection,
                apiData.handProtection,
                apiData.eyeProtection,
              ].filter(Boolean),
          firstAid:
            typeof apiData.firstAidMeasures === "object" &&
            apiData.firstAidMeasures.inhalation
              ? apiData.firstAidMeasures.inhalation
              : "Standard first aid procedures",
          firefighting:
            typeof apiData.firefightingMeasures === "object" &&
            apiData.firefightingMeasures.suitableMedia
              ? apiData.firefightingMeasures.suitableMedia
              : "CO2, dry chemical, foam",
          spillResponse:
            typeof apiData.spillResponse === "object" &&
            apiData.spillResponse.cleanupMethods
              ? apiData.spillResponse.cleanupMethods
              : "Contain and clean up",
          ghsCompliant: apiData.ghsCompliance !== false,
          safetyScore: apiData.safetyScore || 75,
          aiConfidence:
            typeof apiData.aiConfidence === "number"
              ? apiData.aiConfidence
              : typeof apiData.confidence === "number"
                ? Math.max(0, Math.min(100, apiData.confidence * 100))
                : 0,
          packagingType: apiData.packagingType || "Drums/Containers",
          unNumber: apiData.unNumber || "UN not specified",
          transportClass:
            apiData.transportClass || apiData.hazardClass || "Class 9",
          packingGroup: apiData.packingGroup || "PG III",
          fireSuppressionRequired:
            apiData.firefightingMeasures?.suitableMedia || "CO2, Dry chemical",
          specialHazards:
            apiData.firefightingMeasures?.specialHazards ||
            "Standard combustion hazards",
          remarks: apiData.remarks || apiData.notes || "",
          healthRating:
            apiData.healthRating ||
            (apiData.hazardLevel === "High"
              ? "3"
              : apiData.hazardLevel === "Medium"
                ? "2"
                : "1"),
          flammabilityRating:
            apiData.flammabilityRating || (apiData.flashPoint ? "2" : "1"),
          reactivityRating: apiData.reactivityRating || "0",
        };

        // Check for duplicates after successful extraction
        const existingSubmissions = submissions.filter(
          (s) => s.id !== submission.id && s.extractedData,
        );
        const duplicateMatches =
          await msdsDuplicateDetectionService.checkDuplicates(
            { ...submission, extractedData } as MSDSSubmission,
            existingSubmissions as MSDSSubmission[],
          );

        const duplicateMatch =
          duplicateMatches.length > 0 ? duplicateMatches[0] : undefined;

        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? {
                  ...s,
                  status: "review",
                  extractedData,
                  duplicateMatch,
                }
              : s,
          ),
        );

        // Show duplicate notification if found
        if (duplicateMatch) {
          const recommendation =
            msdsDuplicateDetectionService.getRecommendation(duplicateMatch);
          setTimeout(() => {
            setNotification({
              show: true,
              type:
                recommendation.action === "auto-approve" ? "success" : "info",
              title: "Duplicate MSDS Detected",
              message: `${recommendation.message}. ${recommendation.reason}`,
            });
          }, 500);

          // Auto-approve if recommended (high confidence exact match)
          if (
            recommendation.action === "auto-approve" &&
            duplicateMatch.confidence === "high"
          ) {
            setTimeout(async () => {
              await handleApprove({
                ...submission,
                extractedData,
                duplicateMatch,
              });
            }, 2000);
            return; // Don't show success notification, auto-approval will show its own
          }
        }

        setNotification({
          show: true,
          type: "success",
          title: "AI Analysis Complete",
          message: `${extractedData.productName} analyzed. ${extractedData.aiConfidence}% confidence. Ready for review.`,
        });
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("MSDS analysis error", err, {
        module: "msds",
        service: "analysis",
      });
      errorTrackingService.captureException(err, {
        module: "msds",
        service: "analysis",
      });
      setNotification({
        show: true,
        type: "error",
        title: "Analysis Failed",
        message: err.message || "Could not analyze MSDS. Please try again.",
      });
    }
  }

  const handleApprove = async (submission: Submission) => {
    if (!submission.extractedData) return;

    setProcessing(true);
    try {
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(submission.file);
      });

      const saveResponse = await apiFetch("/api/erpnext/save-msds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted: submission.extractedData,
          fileName: submission.file.name,
          status: "approved",
          fileData: fileData,
          approvedBy: "b.albayaty@scsflex.com",
          customerEmail: submission.customerEmail || "",
          linkedCustomer: submission.customerEmail || "",
          linkedUser: "b.albayaty@scsflex.com",
        }),
      });

      const saveResult = await saveResponse.json();

      // Intelligent Warehouse Assignment (if quote accepted)
      let warehouseAssignment = null;
      try {
        // Check if quote is accepted (this would come from ERPNext or config)
        const quoteAccepted = true; // TODO: Get from ERPNext or customer config

        if (quoteAccepted && submission.customerId) {
          warehouseAssignment =
            await intelligentWarehouseAssignmentService.autoAssignOnApproval(
              submission as MSDSSubmission,
              {
                customerId: submission.customerId,
                customerName: submission.customerName,
                quoteAccepted: true,
                requireCommercialAgreement: true,
              },
            );

          if (warehouseAssignment) {
            logger.info("Auto-assigned to warehouse", undefined, {
              module: "msds",
              service: "warehouse-assignment",
              warehouseName: warehouseAssignment.warehouseName,
            });
          }
        }
      } catch (warehouseError) {
        const err =
          warehouseError instanceof Error
            ? warehouseError
            : new Error(String(warehouseError));
        logger.error("Warehouse assignment error", err, {
          module: "msds",
          service: "warehouse-assignment",
        });
        errorTrackingService.captureException(err, {
          module: "msds",
          service: "warehouse-assignment",
        });
        // Don't fail approval if warehouse assignment fails
      }

      // Generate and send professional email report
      try {
        const emailReport = msdsEmailReportService.generateEmailReport({
          submission,
          action: "approved",
          reviewerName: "Quality Manager",
          customerEmail: submission.customerEmail,
          customerName: submission.customerName,
          subCustomerName: submission.subCustomerName,
          includeDetails: true,
          includeRecommendations: true,
        });

        // Add warehouse assignment info to email if available
        if (warehouseAssignment) {
          const reasoningHtml =
            warehouseAssignment.reasoning.length > 0
              ? `<p><strong>Reasoning:</strong></p><ul>${warehouseAssignment.reasoning.map((r: string) => `<li>${r}</li>`).join("")}</ul>`
              : "";
          emailReport.html = emailReport.html.replace(
            "</body>",
            `<div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">🏭 Warehouse Assignment</h3>
              <p><strong>Assigned Warehouse:</strong> ${warehouseAssignment.warehouseName} (${warehouseAssignment.warehouseCode})</p>
              <p><strong>Confidence Score:</strong> ${warehouseAssignment.confidence}%</p>
              <p><strong>Compliance Score:</strong> ${warehouseAssignment.complianceScore}%</p>
              ${reasoningHtml}
            </div></body>`,
          );
        }

        await apiFetch("/api/erpnext/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: submission.customerEmail || "customer@example.com",
            subject: emailReport.subject,
            message: emailReport.html,
            reference_doctype: "Item",
            reference_name: saveResult.itemId || "",
          }),
        });
      } catch (emailError) {
        // Error handled - email skipped, approval continues
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id ? { ...s, status: "approved" } : s,
        ),
      );

      setSelectedSubmission(null);
      setProcessing(false);

      setTimeout(() => {
        setNotification({
          show: true,
          type: "success",
          title: "✅ MSDS Approved!",
          message: `${submission.extractedData?.productName || "MSDS"} approved! Go to "Chemical Database" to view. ${saveResult.success ? "(Saved to ERPNext)" : "(Saved locally)"}`,
        });
      }, 300);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("MSDS approve error", err, {
        module: "msds",
        service: "approval",
      });
      errorTrackingService.captureException(err, {
        module: "msds",
        service: "approval",
      });
      setProcessing(false);
      setNotification({
        show: true,
        type: "error",
        title: "Approval Failed",
        message: err.message || "Could not approve MSDS. Please try again.",
      });
    }
  };

  const handleReject = async (submission: Submission, reason: string) => {
    if (!submission.extractedData) return;

    setProcessing(true);
    try {
      await apiFetch("/api/erpnext/save-msds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extracted: submission.extractedData,
          fileName: submission.file.name,
          status: "rejected",
          rejectionReason: reason,
          approvedBy: "b.albayaty@scsflex.com",
          customerEmail: submission.customerEmail || "",
          linkedCustomer: submission.customerEmail || "",
          linkedUser: "b.albayaty@scsflex.com",
        }),
      });

      // Generate and send professional email report
      try {
        const emailReport = msdsEmailReportService.generateEmailReport({
          submission,
          action: "rejected",
          reason: reason,
          reviewerName: "Quality Manager",
          customerEmail: submission.customerEmail,
          customerName: submission.customerName,
          subCustomerName: submission.subCustomerName,
          includeDetails: true,
          includeRecommendations: true,
        });

        await apiFetch("/api/erpnext/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: submission.customerEmail || "customer@example.com",
            subject: emailReport.subject,
            message: emailReport.html,
            reference_doctype: "Communication",
          }),
        });
      } catch (emailError) {
        // Error handled - email skipped, rejection continues
      }

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submission.id
            ? { ...s, status: "rejected", manualNotes: reason }
            : s,
        ),
      );

      setSelectedSubmission(null);
      setProcessing(false);

      setTimeout(() => {
        setNotification({
          show: true,
          type: "info",
          title: "MSDS Rejected",
          message: `${submission.extractedData?.productName || "MSDS"} marked for revision.`,
        });
      }, 300);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("MSDS reject error", err, {
        module: "msds",
        service: "rejection",
      });
      errorTrackingService.captureException(err, {
        module: "msds",
        service: "rejection",
      });
      setProcessing(false);
      setNotification({
        show: true,
        type: "error",
        title: "Rejection Failed",
        message: err.message || "Could not reject MSDS. Please try again.",
      });
    }
  };

  const pendingSubmissions = useMemo(
    () => submissions.filter((s) => s.status === "review"),
    [submissions],
  );
  const approvedSubmissions = useMemo(
    () => submissions.filter((s) => s.status === "approved"),
    [submissions],
  );
  const rejectedSubmissions = useMemo(
    () => submissions.filter((s) => s.status === "rejected"),
    [submissions],
  );

  const displayedSubmissions = useMemo(() => {
    let filtered =
      viewMode === "pending"
        ? pendingSubmissions
        : viewMode === "approved"
          ? approvedSubmissions
          : rejectedSubmissions;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((s) => {
        const productName = s.extractedData?.productName?.toLowerCase() || "";
        const casNumber = s.extractedData?.casNumber?.toLowerCase() || "";
        const manufacturer = s.extractedData?.manufacturer?.toLowerCase() || "";
        return (
          productName.includes(searchLower) ||
          casNumber.includes(searchLower) ||
          manufacturer.includes(searchLower)
        );
      });
    }

    // Apply hazard level filter
    if (filterHazardLevel !== "all") {
      filtered = filtered.filter(
        (s) => s.extractedData?.hazardLevel === filterHazardLevel,
      );
    }

    // Apply date range filter
    if (filterDateRange !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (filterDateRange === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (filterDateRange === "week") {
        cutoff.setDate(now.getDate() - 7);
      } else if (filterDateRange === "month") {
        cutoff.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((s) => new Date(s.submittedDate) >= cutoff);
    }

    return filtered;
  }, [
    viewMode,
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    searchTerm,
    filterHazardLevel,
    filterDateRange,
  ]);

  // Track search when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.length > 2) {
      // Debounce search tracking
      const timer = setTimeout(async () => {
        try {
          await apiFetch("/api/chemical/msds/search-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: searchTerm,
              filters: {
                status: viewMode,
                hazardLevel:
                  filterHazardLevel !== "all" ? filterHazardLevel : undefined,
              },
              resultsCount: displayedSubmissions.length,
            }),
          });
        } catch (error) {
          // Silent fail - search history is optional
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, viewMode, filterHazardLevel, displayedSubmissions.length]);

  return (
    <PageTemplate
      title="MSDS Intelligence System"
      description="AI-powered MSDS analysis • Manual review • Full ERPNext integration • Complete workflow from upload to approval"
      icon="ri-file-paper-2-line"
      stats={[
        { label: "Uploaded", value: submissions.length, icon: "ri-file-line" },
        {
          label: "Pending Review",
          value: pendingSubmissions.length,
          icon: "ri-time-line",
        },
        {
          label: "Approved",
          value: approvedSubmissions.length,
          icon: "ri-checkbox-circle-line",
        },
        {
          label: "Rejected",
          value: rejectedSubmissions.length,
          icon: "ri-close-circle-line",
        },
      ]}
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <i className="ri-upload-cloud-line"></i>
            Upload MSDS
          </button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelect(Array.from(e.target.files));
          }
        }}
        className="hidden"
      />

      {(aiKeyStatus !== "unknown" || systemHealth) && (
        <div className="mb-6 grid gap-3">
          {aiKeyStatus === "missing" && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">AI keys not configured</div>
                  <div className="text-sm text-yellow-200/80 mt-1">
                    MSDS extraction will be limited and may show{" "}
                    <span className="font-semibold">Unknown</span> /{" "}
                    <span className="font-semibold">CAS: Not Found</span>. Add
                    your OpenAI/Anthropic key once in{" "}
                    <Link
                      href="/settings/ai"
                      className="underline text-yellow-100 hover:text-white"
                    >
                      AI &amp; Agentic Settings
                    </Link>
                    .
                  </div>
                </div>
                <Link
                  href="/settings/ai"
                  className="shrink-0 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-sm font-medium"
                >
                  Configure AI
                </Link>
              </div>
            </div>
          )}

          {systemHealth?.ocr?.pdfOcrAvailable === false && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
              <div className="font-semibold">Scanned PDF OCR not available</div>
              <div className="text-sm text-red-200/80 mt-1">
                Upload a text-based PDF or Excel/CSV. If the SDS is scanned, ask
                for a clearer PDF export.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tabs - Simplified */}
      <div className="mb-6 flex gap-2 border-b border-gray-700">
        {[
          {
            id: "workflow" as MainTabType,
            label: "Workflow",
            icon: "ri-file-list-3-line",
            badge: pendingSubmissions.length,
          },
          {
            id: "versions" as MainTabType,
            label: "Version Control",
            icon: "ri-history-line",
          },
          {
            id: "analytics" as MainTabType,
            label: "Analytics",
            icon: "ri-bar-chart-line",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            className={`relative px-6 py-3 flex items-center gap-2 font-medium transition ${
              mainTab === tab.id
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <i className={tab.icon}></i>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {mainTab === "workflow" && (
        <>
          {/* Search Bar with History */}
          <div className="mb-6 relative">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name, CAS number, or manufacturer..."
                className="w-full px-4 py-3 pl-12 rounded-xl bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500"
              />
              <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>

            {/* Search History Dropdown */}
            {searchHistory.length > 0 && !searchTerm && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-gray-800 border border-gray-700 shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs text-gray-400 px-3 py-2 font-semibold flex items-center gap-2">
                    <i className="ri-history-line"></i>
                    Recent Searches
                  </div>
                  {searchHistory.slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSearchTerm(item.query);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <i className="ri-search-line text-gray-400 group-hover:text-cyan-400 transition"></i>
                        <span className="text-sm text-gray-300 truncate">
                          {item.query}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.resultsCount} results</span>
                        <i className="ri-arrow-right-line group-hover:text-cyan-400 transition"></i>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <select
              value={filterHazardLevel}
              onChange={(e) => setFilterHazardLevel(e.target.value as any)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white text-sm"
            >
              <option value="all">All Hazard Levels</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* View Mode Tabs */}
          <div className="mb-8 flex gap-1 p-1 rounded-lg bg-gray-800 border border-gray-700 w-fit">
            {[
              {
                mode: "pending" as const,
                label: "Pending Review",
                count: pendingSubmissions.length,
              },
              {
                mode: "approved" as const,
                label: "Approved",
                count: approvedSubmissions.length,
              },
              {
                mode: "rejected" as const,
                label: "Rejected",
                count: rejectedSubmissions.length,
              },
            ].map(({ mode, label, count }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === mode
                    ? "bg-cyan-500 text-white"
                    : "hover:bg-gray-700 text-gray-400"
                }`}
              >
                <span className="text-sm">{label}</span>
                {count > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bulk Actions Bar */}
          {viewMode === "pending" && selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-300">
                    {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}{" "}
                    selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBulkAction("approve")}
                    className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition flex items-center gap-2"
                  >
                    <i className="ri-checkbox-multiple-line"></i>
                    Bulk Approve
                  </button>
                  <button
                    onClick={() => setBulkAction("reject")}
                    className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition flex items-center gap-2"
                  >
                    <i className="ri-close-circle-line"></i>
                    Bulk Reject
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Unified Upload Zone - Always Visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Customer Information Fields */}
            <div className="mb-4 p-4 rounded-xl bg-gray-800 border border-gray-700">
              <h4 className="text-sm font-semibold mb-3 text-gray-300 flex items-center gap-2">
                <i className="ri-user-line text-cyan-400"></i>
                Customer Information (Optional)
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName || ""}
                    onChange={(e) =>
                      setCustomerName(e.target.value || undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white text-sm"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Sub-Customer Name
                  </label>
                  <input
                    type="text"
                    value={subCustomerName || ""}
                    onChange={(e) =>
                      setSubCustomerName(e.target.value || undefined)
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white text-sm"
                    placeholder="Enter sub-customer name (optional)"
                  />
                </div>
              </div>
              {(customerName || subCustomerName) && (
                <p className="mt-2 text-xs text-cyan-400 flex items-center gap-1">
                  <i className="ri-information-line"></i>
                  All uploaded MSDS files will be tagged with this customer
                  information
                </p>
              )}
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative group cursor-pointer transition-all duration-300 ${
                isDragActive ? "scale-105" : ""
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
              />

              <div
                className={`relative p-8 rounded-2xl bg-gray-800 border-2 transition-all duration-300 ${
                  isDragActive
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-gray-700 hover:border-cyan-500/50"
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-30" />
                      <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <i className="ri-upload-cloud-line text-3xl text-white"></i>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">
                      {isDragActive
                        ? "📥 Drop MSDS Files Here"
                        : "🧪 Upload MSDS Files (Single or Multiple)"}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">
                      Drag & drop or click • PDF, Excel, CSV supported • Batch
                      processing automatic
                    </p>
                    <p className="text-xs text-cyan-400">
                      AI extracts 100+ fields → Review → Approve/Reject →
                      Auto-save to ERPNext → Email customer
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium">
                      <i className="ri-folder-upload-line mr-2"></i>
                      Upload
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Unified Batch Job Monitor - Collapsible with State Persistence */}
            {(activeJobId || lastJobId) && user && !jobNotFound && (
              <BatchJobMonitor
                jobId={activeJobId || lastJobId || ""}
                tenantId={
                  (user as any).tenantId || (tenant as any)?.id || "default"
                }
                userId={user.id}
                moduleId="msds"
                jobApiEndpoint={
                  activeJobId
                    ? `/api/chemical/msds/jobs/${activeJobId}`
                    : lastJobId
                      ? `/api/chemical/msds/jobs/${lastJobId}`
                      : undefined
                }
                pollInterval={2000}
                enableEventBus={true}
                initialJobData={jobSnapshot || undefined}
                disablePollingIfComplete={!activeJobId}
                systemHealth={systemHealth || undefined}
                aiKeyStatus={
                  aiKeyStatus === "configured" ? "configured" : "not-configured"
                }
                jobSnapshot={jobSnapshot || undefined}
                lastJobSummary={lastJobSummary || undefined}
                batchProcessing={batchProcessing}
                onJobComplete={(job) => {
                  const successful = (job.items || []).filter(
                    (i: any) => i.status === "completed",
                  ).length;
                  const failed = (job.items || []).filter(
                    (i: any) => i.status === "failed",
                  ).length;
                  setNotification({
                    show: true,
                    type: failed > 0 ? "error" : "success",
                    title: "Batch Processing Complete",
                    message: `${successful} successful, ${failed} failed`,
                  });
                }}
                onJobFailed={(job) => {
                  const failed = (job.items || []).filter(
                    (i: any) => i.status === "failed",
                  ).length;
                  setNotification({
                    show: true,
                    type: "error",
                    title: "Batch Processing Failed",
                    message: `${failed} files failed to process`,
                  });
                }}
                onCopyDiagnostics={copyJobDiagnostics}
                onRetryFailed={retryLastJob}
              />
            )}

            {/* Fallback: Show simple queue for submissions without job ID */}
            {!activeJobId &&
              !lastJobId &&
              submissions.filter(
                (s) => s.status === "uploading" || s.status === "analyzing",
              ).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 rounded-2xl bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-700/50">
                    <h4 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                      <i className="ri-stack-line text-cyan-400"></i>
                      Processing Queue
                      <span className="text-sm font-normal text-gray-400">
                        (
                        {
                          submissions.filter(
                            (s) =>
                              s.status === "uploading" ||
                              s.status === "analyzing",
                          ).length
                        }{" "}
                        files)
                      </span>
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {submissions
                      .filter(
                        (s) =>
                          s.status === "uploading" || s.status === "analyzing",
                      )
                      .map((submission) => (
                        <div
                          key={submission.id}
                          className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50"
                        >
                          <div className="flex-shrink-0">
                            <i
                              className={`ri-file-paper-2-line text-lg ${
                                submission.status === "analyzing"
                                  ? "text-cyan-400 animate-pulse"
                                  : "text-gray-400"
                              }`}
                            ></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-300 truncate">
                              {submission.file.name}
                            </p>
                            <div className="mt-1 w-full bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  submission.status === "analyzing"
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 w-3/4 animate-pulse"
                                    : "bg-gray-500 w-1/2"
                                }`}
                              ></div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-xs text-gray-400">
                            {submission.status === "analyzing"
                              ? "AI Analyzing..."
                              : "Uploading..."}
                          </div>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

            {/* Last batch summary + retry */}
            {lastJobSummary && lastJobId && lastJobSummary.failed > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-red-200 flex items-center gap-2">
                      <i className="ri-error-warning-line"></i>
                      Last batch had failures
                    </div>
                    <div className="mt-1 text-xs text-red-200/80">
                      {lastJobSummary.successful} successful,{" "}
                      {lastJobSummary.failed} failed • Job{" "}
                      <span className="font-mono text-red-100">
                        {lastJobId}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={retryLastJob}
                    disabled={batchProcessing}
                    className="shrink-0 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                    title="Retry only failed files (completed files will be skipped)"
                  >
                    <i className="ri-refresh-line"></i>
                    Retry Failed
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Processing Indicator */}
          {processing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/50 shadow-xl"
            >
              <div className="flex items-start gap-4">
                <PremiumLoader message="" size="lg" variant="default" />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-white">
                    Processing...
                  </h3>
                  <p className="text-sm text-white/70 mb-4">
                    Saving to ERPNext and sending email notifications
                  </p>
                  <ProgressLoader size="md" showPercentage />
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Count & Clear Filters */}
          {displayedSubmissions.length > 0 &&
            (searchTerm ||
              filterHazardLevel !== "all" ||
              filterDateRange !== "all") && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {displayedSubmissions.length} of{" "}
                  {viewMode === "pending"
                    ? pendingSubmissions.length
                    : viewMode === "approved"
                      ? approvedSubmissions.length
                      : rejectedSubmissions.length}{" "}
                  {viewMode} submission
                  {displayedSubmissions.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterHazardLevel("all");
                    setFilterDateRange("all");
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <i className="ri-close-line"></i>
                  Clear Filters
                </button>
              </div>
            )}

          {/* Smart Grouping & Export */}
          {displayedSubmissions.length > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-800 border border-gray-700">
              {/* Grouping Options */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="ri-group-line"></i>
                  <span>Group by:</span>
                </div>
                {[
                  {
                    key: "manufacturer" as const,
                    label: "Manufacturer",
                    icon: "ri-building-line",
                  },
                  {
                    key: "hazardLevel" as const,
                    label: "Hazard",
                    icon: "ri-alert-line",
                  },
                  {
                    key: "date" as const,
                    label: "Date",
                    icon: "ri-calendar-line",
                  },
                  {
                    key: "customer" as const,
                    label: "Customer",
                    icon: "ri-user-line",
                  },
                  {
                    key: "status" as const,
                    label: "Status",
                    icon: "ri-file-list-line",
                  },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setGroupBy(groupBy === key ? "none" : key)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 ${
                      groupBy === key
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "hover:bg-gray-700 text-gray-400"
                    }`}
                  >
                    <i className={icon}></i>
                    {label}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const blob = await msdsExportService.exportToExcel({
                        format: "excel",
                        submissions: displayedSubmissions,
                        filename: `msds-export-${new Date().toISOString().split("T")[0]}`,
                      });
                      msdsExportService.downloadFile(
                        blob,
                        `msds-export-${new Date().toISOString().split("T")[0]}.xlsx`,
                      );
                      setNotification({
                        show: true,
                        type: "success",
                        title: "Export Successful",
                        message: "MSDS data exported to Excel",
                      });
                    } catch (error) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "Export Failed",
                        message: "Could not export data. Please try again.",
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition flex items-center gap-2 text-sm"
                  title="Export to Excel"
                >
                  <i className="ri-download-line"></i>
                  Export Excel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const csv = await msdsExportService.exportToCSV({
                        format: "csv",
                        submissions: displayedSubmissions,
                      });
                      msdsExportService.downloadFile(
                        csv,
                        `msds-export-${new Date().toISOString().split("T")[0]}.csv`,
                        "text/csv",
                      );
                      setNotification({
                        show: true,
                        type: "success",
                        title: "Export Successful",
                        message: "MSDS data exported to CSV",
                      });
                    } catch (error) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "Export Failed",
                        message: "Could not export data. Please try again.",
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition flex items-center gap-2 text-sm"
                  title="Export to CSV"
                >
                  <i className="ri-file-text-line"></i>
                  Export CSV
                </button>
              </div>
            </div>
          )}

          {/* Submissions Grid */}
          {displayedSubmissions.length > 0 ? (
            (() => {
              const grouped = msdsGroupingService.groupSubmissions(
                displayedSubmissions,
                groupBy,
              );

              if (grouped && grouped.length > 0) {
                return (
                  <div className="space-y-6">
                    {grouped.map((group) => (
                      <div key={group.groupKey} className="space-y-4">
                        {/* Group Header */}
                        <div
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-800 border border-gray-700 cursor-pointer hover:bg-gray-750 transition"
                          onClick={() => {
                            const newExpanded = new Set(expandedGroups);
                            if (newExpanded.has(group.groupKey)) {
                              newExpanded.delete(group.groupKey);
                            } else {
                              newExpanded.add(group.groupKey);
                            }
                            setExpandedGroups(newExpanded);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <i
                              className={`ri-arrow-${expandedGroups.has(group.groupKey) ? "down" : "right"}-s-line text-cyan-400 text-lg`}
                            ></i>
                            <i
                              className={`ri-${group.metadata?.icon || "folder-line"} text-${group.metadata?.color || "cyan"}-400 text-xl`}
                            ></i>
                            <div>
                              <h3 className="font-semibold text-gray-200">
                                {group.groupLabel}
                              </h3>
                              <p className="text-xs text-gray-400">
                                {group.metadata?.description}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-medium">
                            {group.count}
                          </span>
                        </div>

                        {/* Grouped Submissions */}
                        {expandedGroups.has(group.groupKey) && (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 ml-8">
                            {group.submissions.map((submission, index) => {
                              const data = submission.extractedData;
                              if (!data) return null;

                              return (
                                <motion.div
                                  key={submission.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="group relative"
                                  whileHover={{
                                    y: -8,
                                    transition: {
                                      duration: 0.3,
                                      ease: "easeOut",
                                    },
                                  }}
                                  onClick={() =>
                                    setSelectedSubmission(submission)
                                  }
                                >
                                  <div
                                    className={`absolute inset-0 ${
                                      submission.status === "approved"
                                        ? "bg-gradient-to-br from-green-500/20 to-green-600/20"
                                        : submission.status === "rejected"
                                          ? "bg-gradient-to-br from-red-500/20 to-red-600/20"
                                          : (data.hazardLevel || "Medium") ===
                                              "High"
                                            ? "bg-gradient-to-br from-red-500/20 to-orange-600/20"
                                            : "bg-gradient-to-br from-cyan-500/20 to-blue-600/20"
                                    } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                                  />

                                  <div
                                    className={`relative p-6 rounded-2xl bg-gray-800 border transition-all duration-300 cursor-pointer ${
                                      selectedIds.has(submission.id)
                                        ? "border-cyan-500 bg-cyan-500/10"
                                        : "border-gray-700 hover:border-cyan-500/50"
                                    }`}
                                  >
                                    {/* Selection Checkbox */}
                                    {viewMode === "pending" && (
                                      <div className="absolute top-4 right-4">
                                        <input
                                          type="checkbox"
                                          checked={selectedIds.has(
                                            submission.id,
                                          )}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            const newSet = new Set(selectedIds);
                                            if (e.target.checked) {
                                              newSet.add(submission.id);
                                            } else {
                                              newSet.delete(submission.id);
                                            }
                                            setSelectedIds(newSet);
                                          }}
                                          className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                                        />
                                      </div>
                                    )}

                                    {/* Status Bar */}
                                    <div
                                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                                        submission.status === "approved"
                                          ? "from-green-500 to-cyan-500"
                                          : submission.status === "rejected"
                                            ? "from-red-500 to-orange-500"
                                            : (data.hazardLevel || "Medium") ===
                                                "High"
                                              ? "from-red-500 to-orange-500"
                                              : "from-cyan-500 to-blue-500"
                                      }`}
                                    />

                                    {/* Enhanced Header with NFPA Diamond & CAS */}
                                    <div className="mb-4">
                                      {/* Top Row: Product Name & Status */}
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                          <h3 className="text-xl font-bold mb-1.5 text-white truncate">
                                            {data.productName ||
                                              submission.file.name.replace(
                                                /\.(pdf|xlsx|csv)$/i,
                                                "",
                                              )}
                                          </h3>
                                          {/* CAS Number - Prominently Displayed */}
                                          {data.casNumber &&
                                          data.casNumber !== "CAS not found" &&
                                          data.casNumber !== "Not specified" ? (
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-sm font-mono font-semibold border border-cyan-500/40 shadow-lg">
                                                <i className="ri-flask-line mr-1.5"></i>
                                                CAS: {data.casNumber}
                                              </span>
                                              {data.ecNumber && (
                                                <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30">
                                                  EC: {data.ecNumber}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="mb-2">
                                              <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-mono border border-red-500/40">
                                                <i className="ri-alert-line mr-1"></i>
                                                CAS: Not Found
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* NFPA Diamond - Prominently Displayed */}
                                        <div className="flex-shrink-0 ml-3">
                                          <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600">
                                            <NFPADiamond
                                              health={data.healthRating || "0"}
                                              flammability={
                                                data.flammabilityRating || "0"
                                              }
                                              reactivity={
                                                data.reactivityRating || "0"
                                              }
                                              special=""
                                              size="sm"
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Duplicate Badge */}
                                      {submission.duplicateMatch && (
                                        <div className="mb-2 flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                                              submission.duplicateMatch
                                                .confidence === "high"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                            }`}
                                          >
                                            <i className="ri-file-copy-line"></i>
                                            {submission.duplicateMatch
                                              .matchType === "exact"
                                              ? "Exact Duplicate"
                                              : submission.duplicateMatch
                                                    .matchType === "cas"
                                                ? "CAS Match"
                                                : "Similar Match"}{" "}
                                            (
                                            {
                                              submission.duplicateMatch
                                                .similarity
                                            }
                                            %)
                                          </span>
                                        </div>
                                      )}

                                      {/* Key Identifiers Row */}
                                      <div className="flex flex-wrap gap-2 mb-2">
                                        {data.molecularFormula &&
                                          data.molecularFormula !==
                                            "Not specified" && (
                                            <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-300 font-mono text-xs border border-green-500/30">
                                              <i className="ri-atom-line mr-1"></i>
                                              {data.molecularFormula}
                                            </span>
                                          )}
                                        {data.unNumber &&
                                          data.unNumber !==
                                            "UN not specified" &&
                                          data.unNumber !== "Not specified" && (
                                            <span className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-300 font-mono text-xs border border-orange-500/30">
                                              <i className="ri-truck-line mr-1"></i>
                                              UN: {data.unNumber}
                                            </span>
                                          )}
                                      </div>

                                      {/* Manufacturer & Customer Info */}
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-300 flex items-center gap-1.5">
                                          <i className="ri-building-line text-gray-400"></i>
                                          <span className="truncate">
                                            {data.manufacturer ||
                                              "Manufacturer not specified"}
                                          </span>
                                        </p>

                                        {/* Customer Info */}
                                        {(submission.customerName ||
                                          submission.subCustomerName) && (
                                          <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                            <i className="ri-user-line text-gray-500"></i>
                                            <span className="truncate">
                                              {submission.customerName}
                                              {submission.subCustomerName &&
                                                ` / ${submission.subCustomerName}`}
                                            </span>
                                          </p>
                                        )}
                                      </div>

                                      {/* Parsing Issues Warning */}
                                      {submission.parsingIssues && (
                                        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                                          <i className="ri-alert-line text-red-400 text-base flex-shrink-0 mt-0.5"></i>
                                          <div className="text-xs text-red-400">
                                            <p className="font-semibold">
                                              ⚠️ Parsing Issue
                                            </p>
                                            <p className="text-red-300">
                                              {submission.parsingIssues.message}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Hazard Level & Class Badges */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      <span
                                        className={`px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1.5 ${
                                          (data.hazardLevel || "Medium") ===
                                          "High"
                                            ? "bg-red-500/20 text-red-300 border-2 border-red-500/40"
                                            : (data.hazardLevel || "Medium") ===
                                                "Medium"
                                              ? "bg-orange-500/20 text-orange-300 border-2 border-orange-500/40"
                                              : "bg-green-500/20 text-green-300 border-2 border-green-500/40"
                                        }`}
                                      >
                                        <i
                                          className={`ri-${(data.hazardLevel || "Medium") === "High" ? "alert" : "information"}-line`}
                                        ></i>
                                        {data.hazardLevel || "Medium"} Risk
                                      </span>

                                      {data.hazardClass &&
                                        data.hazardClass !== "Not classified" &&
                                        data.hazardClass !==
                                          "Not specified" && (
                                          <span className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/40 font-semibold">
                                            {data.hazardClass}
                                          </span>
                                        )}

                                      {data.ghsCompliant && (
                                        <span className="px-3 py-1.5 text-xs rounded-lg bg-green-500/20 text-green-300 border-2 border-green-500/40 font-semibold">
                                          <i className="ri-checkbox-circle-line mr-1"></i>
                                          GHS Compliant
                                        </span>
                                      )}

                                      {submission.status === "approved" && (
                                        <span className="px-3 py-1.5 text-xs rounded-lg bg-green-500/20 text-green-300 border-2 border-green-500/40 font-semibold animate-pulse">
                                          <i className="ri-check-line mr-1"></i>
                                          APPROVED
                                        </span>
                                      )}

                                      {submission.status === "rejected" && (
                                        <span className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-300 border-2 border-red-500/40 font-semibold">
                                          <i className="ri-close-line mr-1"></i>
                                          REJECTED
                                        </span>
                                      )}
                                    </div>

                                    {/* Quick Info Grid: NFPA Scores & AI Confidence */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                                      {/* Health Rating */}
                                      <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">
                                          Health
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            parseInt(
                                              data.healthRating || "0",
                                            ) >= 3
                                              ? "text-red-400"
                                              : parseInt(
                                                    data.healthRating || "0",
                                                  ) >= 2
                                                ? "text-orange-400"
                                                : "text-blue-400"
                                          }`}
                                        >
                                          {data.healthRating || "0"}
                                        </div>
                                      </div>

                                      {/* Flammability Rating */}
                                      <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">
                                          Flammability
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            parseInt(
                                              data.flammabilityRating || "0",
                                            ) >= 3
                                              ? "text-red-400"
                                              : parseInt(
                                                    data.flammabilityRating ||
                                                      "0",
                                                  ) >= 2
                                                ? "text-orange-400"
                                                : "text-red-400"
                                          }`}
                                        >
                                          {data.flammabilityRating || "0"}
                                        </div>
                                      </div>

                                      {/* Reactivity Rating */}
                                      <div className="text-center">
                                        <div className="text-xs text-gray-400 mb-1">
                                          Reactivity
                                        </div>
                                        <div
                                          className={`text-lg font-bold ${
                                            parseInt(
                                              data.reactivityRating || "0",
                                            ) >= 3
                                              ? "text-yellow-400"
                                              : parseInt(
                                                    data.reactivityRating ||
                                                      "0",
                                                  ) >= 2
                                                ? "text-orange-400"
                                                : "text-yellow-400"
                                          }`}
                                        >
                                          {data.reactivityRating || "0"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Safety Score & AI Confidence */}
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 border border-gray-600/50 mb-4">
                                      <div className="flex items-center gap-2">
                                        <i className="ri-shield-check-line text-green-400"></i>
                                        <span className="text-xs text-gray-400">
                                          Safety:
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                          {data.safetyScore || 0}/100
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <i className="ri-brain-line text-purple-400"></i>
                                        <span className="text-xs text-gray-400">
                                          AI:
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                          {data.aiConfidence || 0}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Submitted Date & Quick Actions */}
                                    <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-700">
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <i className="ri-time-line"></i>
                                        {submission.submittedDate.toLocaleDateString()}
                                      </p>
                                      {viewMode === "pending" && (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleApprove(submission);
                                            }}
                                            className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition"
                                            title="Quick Approve"
                                          >
                                            <i className="ri-check-line text-sm"></i>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReject(submission);
                                            }}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition"
                                            title="Quick Reject"
                                          >
                                            <i className="ri-close-line text-sm"></i>
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                                      {(submission.file.name
                                        .toLowerCase()
                                        .endsWith(".pdf") ||
                                        submission.file.type ===
                                          "application/pdf") && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPdfViewerFile(submission.file);
                                            setPdfViewerFileName(
                                              submission.file.name,
                                            );
                                            setShowPDFViewer(true);
                                          }}
                                          className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition flex items-center justify-center gap-2 text-sm"
                                        >
                                          <i className="ri-file-pdf-line"></i>
                                          View PDF
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSubmission(submission);
                                        }}
                                        className="flex-1 px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 transition flex items-center justify-center gap-2 text-sm"
                                      >
                                        <i className="ri-eye-line"></i>
                                        Review
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              // No grouping - render normally
              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedSubmissions.map((submission, index) => {
                    const data = submission.extractedData;
                    if (!data) return null;

                    return (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative"
                        whileHover={{
                          y: -8,
                          transition: { duration: 0.3, ease: "easeOut" },
                        }}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div
                          className={`absolute inset-0 ${
                            submission.status === "approved"
                              ? "bg-gradient-to-br from-green-500/20 to-green-600/20"
                              : submission.status === "rejected"
                                ? "bg-gradient-to-br from-red-500/20 to-red-600/20"
                                : (data.hazardLevel || "Medium") === "High"
                                  ? "bg-gradient-to-br from-red-500/20 to-orange-600/20"
                                  : "bg-gradient-to-br from-cyan-500/20 to-blue-600/20"
                          } rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`}
                        />

                        <div
                          className={`relative p-6 rounded-2xl bg-gray-800 border transition-all duration-300 cursor-pointer ${
                            selectedIds.has(submission.id)
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-gray-700 hover:border-cyan-500/50"
                          }`}
                        >
                          {/* Selection Checkbox */}
                          {viewMode === "pending" && (
                            <div className="absolute top-4 right-4">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(submission.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newSet = new Set(selectedIds);
                                  if (e.target.checked) {
                                    newSet.add(submission.id);
                                  } else {
                                    newSet.delete(submission.id);
                                  }
                                  setSelectedIds(newSet);
                                }}
                                className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                              />
                            </div>
                          )}

                          {/* Status Bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                              submission.status === "approved"
                                ? "from-green-500 to-cyan-500"
                                : submission.status === "rejected"
                                  ? "from-red-500 to-orange-500"
                                  : (data.hazardLevel || "Medium") === "High"
                                    ? "from-red-500 to-orange-500"
                                    : "from-cyan-500 to-blue-500"
                            }`}
                          />

                          {/* Enhanced Header with NFPA Diamond & CAS - Same as grouped version */}
                          <div className="mb-4">
                            {/* Top Row: Product Name & NFPA Diamond */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold mb-1.5 text-white truncate">
                                  {data.productName ||
                                    submission.file.name.replace(
                                      /\.(pdf|xlsx|csv)$/i,
                                      "",
                                    )}
                                </h3>
                                {/* CAS Number - Prominently Displayed */}
                                {data.casNumber &&
                                data.casNumber !== "CAS not found" &&
                                data.casNumber !== "Not specified" ? (
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 text-sm font-mono font-semibold border border-cyan-500/40 shadow-lg">
                                      <i className="ri-flask-line mr-1.5"></i>
                                      CAS: {data.casNumber}
                                    </span>
                                    {data.ecNumber && (
                                      <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30">
                                        EC: {data.ecNumber}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mb-2">
                                    <span className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-mono border border-red-500/40">
                                      <i className="ri-alert-line mr-1"></i>
                                      CAS: Not Found
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* NFPA Diamond - Prominently Displayed */}
                              <div className="flex-shrink-0 ml-3">
                                <div className="p-2 rounded-lg bg-gray-700/50 border border-gray-600">
                                  <NFPADiamond
                                    health={data.healthRating || "0"}
                                    flammability={
                                      data.flammabilityRating || "0"
                                    }
                                    reactivity={data.reactivityRating || "0"}
                                    special=""
                                    size="sm"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Duplicate Badge */}
                            {submission.duplicateMatch && (
                              <div className="mb-2 flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
                                    submission.duplicateMatch.confidence ===
                                    "high"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                  }`}
                                >
                                  <i className="ri-file-copy-line"></i>
                                  {submission.duplicateMatch.matchType ===
                                  "exact"
                                    ? "Exact Duplicate"
                                    : submission.duplicateMatch.matchType ===
                                        "cas"
                                      ? "CAS Match"
                                      : "Similar Match"}{" "}
                                  ({submission.duplicateMatch.similarity}%)
                                </span>
                              </div>
                            )}

                            {/* Key Identifiers Row */}
                            <div className="flex flex-wrap gap-2 mb-2">
                              {data.molecularFormula &&
                                data.molecularFormula !== "Not specified" && (
                                  <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-300 font-mono text-xs border border-green-500/30">
                                    <i className="ri-atom-line mr-1"></i>
                                    {data.molecularFormula}
                                  </span>
                                )}
                              {data.unNumber &&
                                data.unNumber !== "UN not specified" &&
                                data.unNumber !== "Not specified" && (
                                  <span className="px-2 py-1 rounded-md bg-orange-500/20 text-orange-300 font-mono text-xs border border-orange-500/30">
                                    <i className="ri-truck-line mr-1"></i>
                                    UN: {data.unNumber}
                                  </span>
                                )}
                            </div>

                            {/* Manufacturer & Customer Info */}
                            <div className="space-y-1">
                              <p className="text-xs text-gray-300 flex items-center gap-1.5">
                                <i className="ri-building-line text-gray-400"></i>
                                <span className="truncate">
                                  {data.manufacturer ||
                                    "Manufacturer not specified"}
                                </span>
                              </p>

                              {/* Customer Info */}
                              {(submission.customerName ||
                                submission.subCustomerName) && (
                                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                  <i className="ri-user-line text-gray-500"></i>
                                  <span className="truncate">
                                    {submission.customerName}
                                    {submission.subCustomerName &&
                                      ` / ${submission.subCustomerName}`}
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Parsing Issues Warning */}
                            {submission.parsingIssues && (
                              <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                                <i className="ri-alert-line text-red-400 text-base flex-shrink-0 mt-0.5"></i>
                                <div className="text-xs text-red-400">
                                  <p className="font-semibold">
                                    ⚠️ Parsing Issue
                                  </p>
                                  <p className="text-red-300">
                                    {submission.parsingIssues.message}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Hazard Level & Class Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1.5 ${
                                (data.hazardLevel || "Medium") === "High"
                                  ? "bg-red-500/20 text-red-300 border-2 border-red-500/40"
                                  : (data.hazardLevel || "Medium") === "Medium"
                                    ? "bg-orange-500/20 text-orange-300 border-2 border-orange-500/40"
                                    : "bg-green-500/20 text-green-300 border-2 border-green-500/40"
                              }`}
                            >
                              <i
                                className={`ri-${(data.hazardLevel || "Medium") === "High" ? "alert" : "information"}-line`}
                              ></i>
                              {data.hazardLevel || "Medium"} Risk
                            </span>

                            {data.hazardClass &&
                              data.hazardClass !== "Not classified" &&
                              data.hazardClass !== "Not specified" && (
                                <span className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/40 font-semibold">
                                  {data.hazardClass}
                                </span>
                              )}
                          </div>

                          {/* Quick Info Grid: NFPA Scores & AI Confidence */}
                          <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-gray-700/30 border border-gray-600/50">
                            {/* Health Rating */}
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">
                                Health
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  parseInt(data.healthRating || "0") >= 3
                                    ? "text-red-400"
                                    : parseInt(data.healthRating || "0") >= 2
                                      ? "text-orange-400"
                                      : "text-blue-400"
                                }`}
                              >
                                {data.healthRating || "0"}
                              </div>
                            </div>

                            {/* Flammability Rating */}
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">
                                Flammability
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  parseInt(data.flammabilityRating || "0") >= 3
                                    ? "text-red-400"
                                    : parseInt(
                                          data.flammabilityRating || "0",
                                        ) >= 2
                                      ? "text-orange-400"
                                      : "text-red-400"
                                }`}
                              >
                                {data.flammabilityRating || "0"}
                              </div>
                            </div>

                            {/* Reactivity Rating */}
                            <div className="text-center">
                              <div className="text-xs text-gray-400 mb-1">
                                Reactivity
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  parseInt(data.reactivityRating || "0") >= 3
                                    ? "text-yellow-400"
                                    : parseInt(data.reactivityRating || "0") >=
                                        2
                                      ? "text-orange-400"
                                      : "text-yellow-400"
                                }`}
                              >
                                {data.reactivityRating || "0"}
                              </div>
                            </div>
                          </div>

                          {/* Safety Score & AI Confidence */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30 border border-gray-600/50 mb-4">
                            <div className="flex items-center gap-2">
                              <i className="ri-shield-check-line text-green-400"></i>
                              <span className="text-xs text-gray-400">
                                Safety:
                              </span>
                              <span className="text-sm font-bold text-white">
                                {data.safetyScore || 0}/100
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="ri-brain-line text-purple-400"></i>
                              <span className="text-xs text-gray-400">AI:</span>
                              <span className="text-sm font-bold text-white">
                                {data.aiConfidence || 0}%
                              </span>
                            </div>
                          </div>

                          {/* Rest of card content - copy from existing card */}
                          {/* Badges, NFPA, Scores, Actions - same as grouped version */}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-20">
              <div className="inline-block p-8 rounded-2xl bg-gray-800 border border-gray-700 mb-6">
                <i className="ri-file-paper-2-line text-6xl text-cyan-400 mb-4"></i>
                <p className="text-xl font-semibold mb-2">
                  No {viewMode} submissions yet
                </p>
                <p className="text-sm text-gray-400">
                  {viewMode === "pending"
                    ? "Upload MSDS files to start the review process"
                    : viewMode === "approved"
                      ? "Approved MSDS documents will appear here"
                      : "Rejected MSDS documents will appear here"}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Batch Processing Tab removed: batch is unified into Workflow + Job Monitor above */}

      {/* Version Control Tab */}
      {mainTab === "versions" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="ri-history-line text-cyan-400"></i>
              Version History & Comparison
            </h3>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select First Version
                </label>
                <select
                  value={selectedVersions.v1 || ""}
                  onChange={(e) =>
                    setSelectedVersions((prev) => ({
                      ...prev,
                      v1: e.target.value || null,
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                >
                  <option value="">Select MSDS...</option>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.extractedData?.productName || s.file.name} - {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Second Version
                </label>
                <select
                  value={selectedVersions.v2 || ""}
                  onChange={(e) =>
                    setSelectedVersions((prev) => ({
                      ...prev,
                      v2: e.target.value || null,
                    }))
                  }
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                >
                  <option value="">Select MSDS...</option>
                  {submissions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.extractedData?.productName || s.file.name} - {s.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={async () => {
                if (!selectedVersions.v1 || !selectedVersions.v2) {
                  setNotification({
                    show: true,
                    type: "error",
                    title: "Selection Required",
                    message: "Please select both versions to compare",
                  });
                  return;
                }

                setComparingVersions(true);
                try {
                  const response = await apiFetch(
                    "/api/chemical/msds/compare",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        msds1Id: selectedVersions.v1,
                        msds2Id: selectedVersions.v2,
                      }),
                    },
                  );

                  const result = await response.json();
                  if (result.success) {
                    setVersionComparison(result.comparison);
                  }
                } catch (error) {
                  setNotification({
                    show: true,
                    type: "error",
                    title: "Comparison Failed",
                    message:
                      error instanceof Error ? error.message : "Unknown error",
                  });
                } finally {
                  setComparingVersions(false);
                }
              }}
              disabled={
                !selectedVersions.v1 ||
                !selectedVersions.v2 ||
                comparingVersions
              }
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {comparingVersions ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Comparing...
                </>
              ) : (
                <>
                  <i className="ri-file-compare-line"></i>
                  Compare Versions
                </>
              )}
            </button>

            {versionComparison && (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-bold mb-2 text-blue-400">
                    Differences ({versionComparison.differences?.length || 0})
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {versionComparison.differences?.map(
                      (diff: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="ri-arrow-right-line text-red-400 mt-0.5"></i>
                          <span>{diff}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-bold mb-2 text-green-400">
                    Similarities ({versionComparison.similarities?.length || 0})
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {versionComparison.similarities?.map(
                      (sim: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <i className="ri-check-line text-green-400 mt-0.5"></i>
                          <span>{sim}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {versionComparison.recommendations &&
                  versionComparison.recommendations.length > 0 && (
                    <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <h4 className="font-bold mb-2 text-cyan-400">
                        Recommendations
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {versionComparison.recommendations.map(
                          (rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <i className="ri-lightbulb-line text-cyan-400 mt-0.5"></i>
                              <span>{rec}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {mainTab === "analytics" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-20">
              <PremiumLoader message="Loading analytics..." />
            </div>
          ) : (
            <>
              {/* Stats Cards - Using Real Analytics Data */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Total Processed
                    </span>
                    <i className="ri-file-line text-cyan-400"></i>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {analyticsData?.overview?.total || submissions.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {databaseMSDS.length > 0 &&
                      `+${databaseMSDS.length} from database`}
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Approval Rate</span>
                    <i className="ri-checkbox-circle-line text-green-400"></i>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {analyticsData?.overview?.approvalRate?.toFixed(1) ||
                      (submissions.length > 0
                        ? Math.round(
                            (approvedSubmissions.length / submissions.length) *
                              100,
                          )
                        : 0)}
                    %
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {analyticsData?.overview?.approved ||
                      approvedSubmissions.length}{" "}
                    approved
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-600/10 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Pending Review
                    </span>
                    <i className="ri-time-line text-orange-400"></i>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {analyticsData?.overview?.pending ||
                      pendingSubmissions.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Needs attention
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-600/10 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Rejection Rate
                    </span>
                    <i className="ri-close-circle-line text-red-400"></i>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {analyticsData?.overview?.rejected ||
                      rejectedSubmissions.length}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {submissions.length > 0
                      ? Math.round(
                          ((analyticsData?.overview?.rejected ||
                            rejectedSubmissions.length) /
                            (analyticsData?.overview?.total ||
                              submissions.length)) *
                            100,
                        )
                      : 0}
                    % of total
                  </div>
                </div>
              </div>

              {/* AI Insights & Recommendations */}
              {analyticsData?.predictions?.recommendations &&
                analyticsData.predictions.recommendations.length > 0 && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                      <i className="ri-lightbulb-line"></i>
                      AI-Powered Recommendations
                    </h3>
                    <div className="space-y-2">
                      {analyticsData.predictions.recommendations.map(
                        (rec: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-300"
                          >
                            <i className="ri-arrow-right-s-line text-purple-400 mt-0.5"></i>
                            <span>{rec}</span>
                          </div>
                        ),
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Risk Level
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            analyticsData.predictions.riskLevel === "high"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : analyticsData.predictions.riskLevel === "medium"
                                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                                : "bg-green-500/20 text-green-400 border border-green-500/30"
                          }`}
                        >
                          {analyticsData.predictions.riskLevel?.toUpperCase() ||
                            "LOW"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Charts Row 1 */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status Distribution Pie Chart */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h4 className="font-bold mb-4 text-white">
                    Status Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Approved",
                            value: approvedSubmissions.length,
                            color: "#10b981",
                          },
                          {
                            name: "Pending",
                            value: pendingSubmissions.length,
                            color: "#f59e0b",
                          },
                          {
                            name: "Rejected",
                            value: rejectedSubmissions.length,
                            color: "#ef4444",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          {
                            name: "Approved",
                            value: approvedSubmissions.length,
                            color: "#10b981",
                          },
                          {
                            name: "Pending",
                            value: pendingSubmissions.length,
                            color: "#f59e0b",
                          },
                          {
                            name: "Rejected",
                            value: rejectedSubmissions.length,
                            color: "#ef4444",
                          },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Hazard Level Distribution - Using Real Analytics Data */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h4 className="font-bold mb-4 text-white">
                    Hazard Level Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          level: "High",
                          count:
                            analyticsData?.hazardDistribution?.High ||
                            submissions.filter(
                              (s) => s.extractedData?.hazardLevel === "High",
                            ).length,
                        },
                        {
                          level: "Medium",
                          count:
                            analyticsData?.hazardDistribution?.Medium ||
                            submissions.filter(
                              (s) => s.extractedData?.hazardLevel === "Medium",
                            ).length,
                        },
                        {
                          level: "Low",
                          count:
                            analyticsData?.hazardDistribution?.Low ||
                            submissions.filter(
                              (s) => s.extractedData?.hazardLevel === "Low",
                            ).length,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="level" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                        {[
                          { level: "High" },
                          { level: "Medium" },
                          { level: "Low" },
                        ].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.level === "High"
                                ? "#ef4444"
                                : entry.level === "Medium"
                                  ? "#f59e0b"
                                  : "#10b981"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 - Trends */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Processing Trends Over Time - Using Real Analytics Data */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h4 className="font-bold mb-4 text-white">
                    Processing Trends (Last 30 Days)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={
                        analyticsData?.statusTrend ||
                        Array.from({ length: 30 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (29 - i));
                          const daySubmissions = submissions.filter((s) => {
                            const subDate = new Date(s.submittedDate);
                            return (
                              subDate.toDateString() === date.toDateString()
                            );
                          });
                          return {
                            date: date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            }),
                            processed: daySubmissions.length,
                            approved: daySubmissions.filter(
                              (s) => s.status === "approved",
                            ).length,
                            rejected: daySubmissions.filter(
                              (s) => s.status === "rejected",
                            ).length,
                          };
                        })
                      }
                    >
                      <defs>
                        <linearGradient
                          id="colorProcessed"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stroke="#10b981"
                        fillOpacity={0.6}
                        fill="#10b981"
                      />
                      <Area
                        type="monotone"
                        dataKey="pending"
                        stroke="#f59e0b"
                        fillOpacity={0.6}
                        fill="#f59e0b"
                      />
                      <Area
                        type="monotone"
                        dataKey="rejected"
                        stroke="#ef4444"
                        fillOpacity={0.6}
                        fill="#ef4444"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* AI Confidence Distribution - Using Real Analytics Data */}
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <h4 className="font-bold mb-4 text-white">
                    AI Confidence Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          range: "High (>80%)",
                          count:
                            analyticsData?.aiConfidenceDistribution?.high || 0,
                        },
                        {
                          range: "Medium (50-80%)",
                          count:
                            analyticsData?.aiConfidenceDistribution?.medium ||
                            0,
                        },
                        {
                          range: "Low (<50%)",
                          count:
                            analyticsData?.aiConfidenceDistribution?.low || 0,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="range" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {[
                          { range: "High (>80%)", color: "#10b981" },
                          { range: "Medium (50-80%)", color: "#f59e0b" },
                          { range: "Low (<50%)", color: "#ef4444" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Additional Metrics - Using Real Analytics Data */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      GHS Compliance Rate
                    </span>
                    <i className="ri-check-double-line text-cyan-400"></i>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analyticsData?.complianceMetrics?.complianceRate?.toFixed(
                      1,
                    ) || 0}
                    %
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {analyticsData?.complianceMetrics?.ghsCompliant || 0} /{" "}
                    {analyticsData?.overview?.total || 0} compliant
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Top Manufacturer
                    </span>
                    <i className="ri-building-line text-blue-400"></i>
                  </div>
                  <div className="text-lg font-bold text-white truncate">
                    {analyticsData?.manufacturerDistribution?.[0]
                      ?.manufacturer || "N/A"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {analyticsData?.manufacturerDistribution?.[0]?.count || 0}{" "}
                    MSDS (
                    {analyticsData?.manufacturerDistribution?.[0]?.percentage?.toFixed(
                      1,
                    ) || 0}
                    %)
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">
                      Expected Approvals (Next Week)
                    </span>
                    <i className="ri-calendar-line text-purple-400"></i>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analyticsData?.predictions?.expectedApprovalsNextWeek || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Based on current trends
                  </div>
                </div>
              </div>

              {/* Top Chemicals */}
              {analyticsData?.topChemicals &&
                analyticsData.topChemicals.length > 0 && (
                  <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
                    <h4 className="font-bold mb-4 text-white">
                      Most Frequently Processed Chemicals
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.topChemicals
                        .slice(0, 5)
                        .map((chemical: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white truncate">
                                {chemical.productName}
                              </div>
                              <div className="text-xs text-gray-400">
                                {chemical.casNumber || "No CAS"}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  chemical.hazardLevel === "High"
                                    ? "bg-red-500/20 text-red-400"
                                    : chemical.hazardLevel === "Medium"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {chemical.hazardLevel}
                              </span>
                              <span className="text-sm font-bold text-cyan-400">
                                {chemical.count}x
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </motion.div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedSubmission && selectedSubmission.extractedData && (
          <Modal
            isOpen={!!selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
            title={`Review: ${selectedSubmission.extractedData?.productName || "MSDS Document"}`}
            size="xl"
          >
            <div className="space-y-6">
              {/* AI Extraction vs Manual Review */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* AI Extracted Data */}
                <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-400">
                    <i className="ri-cpu-line"></i>
                    AI Extracted Data
                  </h3>

                  {/* Field Completeness Indicator */}
                  {(() => {
                    const requiredFields = [
                      "productName",
                      "manufacturer",
                      "casNumber",
                      "hazardStatements",
                      "physicalState",
                      "flashPoint",
                      "boilingPoint",
                    ];
                    const optionalFields = [
                      "ecNumber",
                      "unNumber",
                      "molecularFormula",
                      "ph",
                      "storageConditions",
                      "incompatibleMaterials",
                    ];
                    const data = selectedSubmission.extractedData;

                    const requiredPresent = requiredFields.filter((f) => {
                      const value = data?.[f as keyof typeof data];
                      return (
                        value &&
                        value !== "Not specified" &&
                        value !== "CAS not found" &&
                        value !== "UN not specified" &&
                        (Array.isArray(value)
                          ? value.length > 0
                          : String(value).trim().length > 0)
                      );
                    }).length;

                    const optionalPresent = optionalFields.filter((f) => {
                      const value = data?.[f as keyof typeof data];
                      return (
                        value &&
                        value !== "Not specified" &&
                        (Array.isArray(value)
                          ? value.length > 0
                          : String(value).trim().length > 0)
                      );
                    }).length;

                    const completeness = Math.round(
                      ((requiredPresent / requiredFields.length) * 0.7 +
                        (optionalPresent / optionalFields.length) * 0.3) *
                        100,
                    );

                    return (
                      <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            Field Completeness
                          </span>
                          <span
                            className={`text-xs font-bold ${completeness >= 80 ? "text-green-400" : completeness >= 60 ? "text-yellow-400" : "text-red-400"}`}
                          >
                            {completeness}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              completeness >= 80
                                ? "bg-green-500"
                                : completeness >= 60
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Required: {requiredPresent}/{requiredFields.length} •
                          Optional: {optionalPresent}/{optionalFields.length}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Manufacturer:</span>
                      <p
                        className={`font-semibold ${selectedSubmission.extractedData.manufacturer && selectedSubmission.extractedData.manufacturer !== "Unknown" && selectedSubmission.extractedData.manufacturer !== "Not specified" ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.manufacturer ||
                          "Not specified"}
                        {(!selectedSubmission.extractedData.manufacturer ||
                          selectedSubmission.extractedData.manufacturer ===
                            "Unknown" ||
                          selectedSubmission.extractedData.manufacturer ===
                            "Not specified") && (
                          <i
                            className="ri-error-warning-line text-yellow-400 ml-1"
                            title="Field missing or incomplete"
                          ></i>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Molecular Formula:</span>
                      <p
                        className={`font-semibold font-mono ${selectedSubmission.extractedData.molecularFormula || selectedSubmission.extractedData.formula ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.molecularFormula ||
                          selectedSubmission.extractedData.formula ||
                          "Not specified"}
                        {!selectedSubmission.extractedData.molecularFormula &&
                          !selectedSubmission.extractedData.formula && (
                            <i
                              className="ri-error-warning-line text-yellow-400 ml-1"
                              title="Field missing"
                            ></i>
                          )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">CAS Number:</span>
                      <p
                        className={`font-semibold font-mono ${selectedSubmission.extractedData.casNumber && selectedSubmission.extractedData.casNumber !== "CAS not found" ? "text-cyan-400" : "text-red-400"}`}
                      >
                        {selectedSubmission.extractedData.casNumber ||
                          "CAS not found"}
                        {(!selectedSubmission.extractedData.casNumber ||
                          selectedSubmission.extractedData.casNumber ===
                            "CAS not found") && (
                          <i
                            className="ri-error-warning-line text-red-400 ml-1"
                            title="Required field missing"
                          ></i>
                        )}
                      </p>
                    </div>
                    {selectedSubmission.extractedData.ecNumber && (
                      <div>
                        <span className="text-gray-400">EC Number:</span>
                        <p className="font-semibold font-mono text-purple-400">
                          {selectedSubmission.extractedData.ecNumber}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">UN Number:</span>
                      <p
                        className={`font-semibold font-mono ${selectedSubmission.extractedData.unNumber && selectedSubmission.extractedData.unNumber !== "UN not specified" ? "text-orange-400" : "text-gray-500"}`}
                      >
                        {selectedSubmission.extractedData.unNumber ||
                          "UN not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Hazard Class:</span>
                      <p
                        className={`font-semibold ${selectedSubmission.extractedData.hazardClass && selectedSubmission.extractedData.hazardClass !== "Not specified" && selectedSubmission.extractedData.hazardClass !== "Class pending review" ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.hazardClass ||
                          "Not specified"}
                        {(!selectedSubmission.extractedData.hazardClass ||
                          selectedSubmission.extractedData.hazardClass ===
                            "Not specified" ||
                          selectedSubmission.extractedData.hazardClass ===
                            "Class pending review") && (
                          <i
                            className="ri-error-warning-line text-yellow-400 ml-1"
                            title="Field missing or incomplete"
                          ></i>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Hazard Statements:</span>
                      {Array.isArray(
                        selectedSubmission.extractedData.hazardStatements,
                      ) &&
                      selectedSubmission.extractedData.hazardStatements.length >
                        0 ? (
                        <div className="mt-1 space-y-1">
                          {selectedSubmission.extractedData.hazardStatements
                            .slice(0, 3)
                            .map((h: string, i: number) => (
                              <p
                                key={i}
                                className="text-xs bg-red-500/10 border border-red-500/20 rounded px-2 py-1 text-red-300"
                              >
                                {h}
                              </p>
                            ))}
                          {selectedSubmission.extractedData.hazardStatements
                            .length > 3 && (
                            <p className="text-xs text-gray-400">
                              +
                              {selectedSubmission.extractedData.hazardStatements
                                .length - 3}{" "}
                              more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-yellow-400">
                          Not specified{" "}
                          <i
                            className="ri-error-warning-line ml-1"
                            title="Required field missing"
                          ></i>
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400">Physical State:</span>
                      <p
                        className={`font-semibold ${selectedSubmission.extractedData.physicalState && selectedSubmission.extractedData.physicalState !== "Not specified" ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.physicalState ||
                          "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Flash Point:</span>
                      <p
                        className={`font-semibold ${selectedSubmission.extractedData.flashPoint && selectedSubmission.extractedData.flashPoint !== "Not specified" ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.flashPoint ||
                          "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Boiling Point:</span>
                      <p
                        className={`font-semibold ${selectedSubmission.extractedData.boilingPoint && selectedSubmission.extractedData.boilingPoint !== "Not specified" ? "text-white" : "text-yellow-400"}`}
                      >
                        {selectedSubmission.extractedData.boilingPoint ||
                          "Not specified"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">AI Confidence:</span>
                        <span
                          className={`font-bold ${(selectedSubmission.extractedData.aiConfidence || 0) >= 70 ? "text-green-400" : (selectedSubmission.extractedData.aiConfidence || 0) >= 40 ? "text-yellow-400" : "text-red-400"}`}
                        >
                          {selectedSubmission.extractedData.aiConfidence || 0}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 mt-2 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (selectedSubmission.extractedData.aiConfidence ||
                              0) >= 70
                              ? "bg-gradient-to-r from-green-500 to-green-400"
                              : (selectedSubmission.extractedData
                                    .aiConfidence || 0) >= 40
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                : "bg-gradient-to-r from-red-500 to-red-400"
                          }`}
                          style={{
                            width: `${selectedSubmission.extractedData.aiConfidence || 0}%`,
                          }}
                        />
                      </div>
                      {(selectedSubmission.extractedData.aiConfidence || 0) <
                        50 && (
                        <p className="text-xs text-yellow-400 mt-1">
                          <i className="ri-information-line mr-1"></i>
                          Low confidence - manual review recommended
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual Verification */}
                <div className="p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                    <i className="ri-edit-line"></i>
                    Manual Verification
                  </h3>

                  <textarea
                    placeholder="Add verification notes, corrections, or special instructions..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500/50 outline-none transition text-white resize-none"
                    rows={8}
                    value={selectedSubmission.manualNotes || ""}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setSubmissions((prev) =>
                        prev.map((s) =>
                          s.id === selectedSubmission.id
                            ? { ...s, manualNotes: newNotes }
                            : s,
                        ),
                      );
                      setSelectedSubmission({
                        ...selectedSubmission,
                        manualNotes: newNotes,
                      });
                    }}
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    Compare AI extraction with actual MSDS. Add notes for
                    customer if needed.
                  </p>
                </div>
              </div>

              {/* Comprehensive Data Display */}
              <div className="grid md:grid-cols-4 gap-4">
                {/* NFPA Diamond */}
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-shield-line text-blue-400"></i>
                    <h4 className="font-semibold">NFPA 704</h4>
                  </div>
                  <NFPADiamond
                    health={
                      selectedSubmission.extractedData.healthRating || "0"
                    }
                    flammability={
                      selectedSubmission.extractedData.flammabilityRating || "0"
                    }
                    reactivity={
                      selectedSubmission.extractedData.reactivityRating || "0"
                    }
                    special=""
                    size="md"
                  />
                  <p className="text-xs text-gray-400 mt-4">
                    Safety: {selectedSubmission.extractedData.safetyScore || 0}
                    /100
                  </p>
                </div>

                {/* Transport & Packaging */}
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-truck-line text-orange-400"></i>
                    <h4 className="font-semibold">Transport</h4>
                  </div>
                  <div className="text-xs space-y-2 text-gray-300">
                    <p>
                      <strong>UN#:</strong>{" "}
                      {selectedSubmission.extractedData.unNumber ||
                        "Not specified"}
                    </p>
                    <p>
                      <strong>Class:</strong>{" "}
                      {selectedSubmission.extractedData.transportClass ||
                        "Not specified"}
                    </p>
                    <p>
                      <strong>Packing Group:</strong>{" "}
                      {selectedSubmission.extractedData.packingGroup ||
                        "Not specified"}
                    </p>
                    <p>
                      <strong>Packaging:</strong>{" "}
                      {selectedSubmission.extractedData.packagingType ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Fire Safety */}
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-fire-line text-red-400"></i>
                    <h4 className="font-semibold">Fire Safety</h4>
                  </div>
                  <div className="text-xs space-y-2 text-gray-300">
                    <p>
                      <strong>Fire System:</strong>
                    </p>
                    <p className="text-cyan-400">
                      {selectedSubmission.extractedData
                        .fireSuppressionRequired || "Not specified"}
                    </p>
                    <p>
                      <strong>Special Hazards:</strong>
                    </p>
                    <p className="text-yellow-400">
                      {selectedSubmission.extractedData.specialHazards ||
                        "None specified"}
                    </p>
                  </div>
                </div>

                {/* Storage & Incompatibility */}
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="ri-alert-line text-yellow-400"></i>
                    <h4 className="font-semibold">Incompatibility</h4>
                  </div>
                  <div className="text-xs space-y-1 text-gray-300">
                    {Array.isArray(
                      selectedSubmission.extractedData.incompatibleMaterials,
                    ) &&
                    selectedSubmission.extractedData.incompatibleMaterials
                      .length > 0 ? (
                      selectedSubmission.extractedData.incompatibleMaterials
                        .slice(0, 4)
                        .map((material, i) => (
                          <p key={i} className="text-red-400">
                            • {material}
                          </p>
                        ))
                    ) : (
                      <p className="text-gray-500 italic">
                        No incompatible materials specified
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Parsing Issues Alert */}
              {selectedSubmission.parsingIssues && (
                <div className="p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30">
                  <div className="flex items-start gap-3">
                    <i className="ri-alert-line text-red-400 text-2xl flex-shrink-0"></i>
                    <div>
                      <h4 className="font-bold text-lg text-red-400 mb-2">
                        ⚠️ Document Parsing Issues Detected
                      </h4>
                      <p className="text-sm text-gray-300 mb-3">
                        {selectedSubmission.parsingIssues.message}
                      </p>

                      <div className="space-y-2 text-sm">
                        {selectedSubmission.parsingIssues.isProtected && (
                          <div className="flex items-center gap-2 text-red-300">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Document is password protected - cannot extract text
                          </div>
                        )}
                        {selectedSubmission.parsingIssues.isImageOnly && (
                          <div className="flex items-center gap-2 text-red-300">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Document is image-only (scanned) - OCR required
                          </div>
                        )}
                        {selectedSubmission.parsingIssues.lowConfidence && (
                          <div className="flex items-center gap-2 text-orange-300">
                            <span className="w-2 h-2 rounded-full bg-orange-400" />
                            Low extraction confidence - manual data entry
                            recommended
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-xs text-yellow-400 font-semibold">
                        ⚡ Action Required: Manually verify all data before
                        approval
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Generation Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <i className="ri-qr-code-line text-purple-400"></i>
                  Generate QR Code for MSDS
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Create a QR code for this MSDS document. Scan to access
                  instantly from mobile devices.
                </p>
                <DocumentQRGenerator
                  documentId={selectedSubmission.id}
                  documentType="msds"
                  documentName={selectedSubmission.extractedData.productName}
                  onQRGenerated={(qrCode, qrImageUrl) => {
                    setNotification({
                      show: true,
                      type: "success",
                      title: "QR Code Generated",
                      message:
                        "QR code created successfully! You can download or print it.",
                    });
                  }}
                />
              </div>

              {/* Warehouse Recommendations Section */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <i className="ri-building-2-line text-cyan-400"></i>
                    Warehouse Assignment Recommendations
                  </h3>
                  <button
                    onClick={() =>
                      setShowWarehouseRecommendations(
                        !showWarehouseRecommendations,
                      )
                    }
                    className="px-3 py-1 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                  >
                    {showWarehouseRecommendations ? "Hide" : "Show"}{" "}
                    Recommendations
                  </button>
                </div>

                {showWarehouseRecommendations && (
                  <div className="mb-4 p-4 rounded-lg bg-gray-800 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-4">
                      Enter customer and quantity information to get warehouse
                      recommendations based on compliance and space
                      availability:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Customer ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={customerId || ""}
                          onChange={(e) =>
                            setCustomerId(e.target.value || undefined)
                          }
                          placeholder="Enter customer ID"
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Customer Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={customerName || ""}
                          onChange={(e) =>
                            setCustomerName(e.target.value || undefined)
                          }
                          placeholder="Enter customer name"
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Quantity (Pallets/Units)
                        </label>
                        <input
                          type="number"
                          value={quantity || ""}
                          onChange={(e) =>
                            setQuantity(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder="Enter quantity"
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Volume (m³)
                        </label>
                        <input
                          type="number"
                          value={volume || ""}
                          onChange={(e) =>
                            setVolume(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder="Enter volume"
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={weight || ""}
                          onChange={(e) =>
                            setWeight(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            )
                          }
                          placeholder="Enter weight"
                          className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:border-cyan-500 outline-none text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Intelligent Warehouse Assignment Display */}
                {showWarehouseRecommendations &&
                  selectedSubmission.extractedData && (
                    <div className="space-y-4">
                      {/* Current Warehouse Assignment */}
                      {selectedSubmission.warehouseAssignment && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold mb-2 flex items-center gap-2 text-green-400">
                                <i className="ri-checkbox-circle-line"></i>
                                Warehouse Assigned
                              </h4>
                              <p className="text-gray-300">
                                <span className="font-semibold">
                                  {
                                    selectedSubmission.warehouseAssignment
                                      .warehouseName
                                  }
                                </span>{" "}
                                (
                                {
                                  selectedSubmission.warehouseAssignment
                                    .warehouseCode
                                }
                                )
                              </p>
                              {selectedSubmission.warehouseAssignment
                                .areaId && (
                                <p className="text-sm text-gray-400 mt-1">
                                  Area:{" "}
                                  {
                                    selectedSubmission.warehouseAssignment
                                      .areaId
                                  }
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Assigned:{" "}
                                {new Date(
                                  selectedSubmission.warehouseAssignment
                                    .assignedAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedSubmission({
                                  ...selectedSubmission,
                                  warehouseAssignment: undefined,
                                });
                                setSubmissions((prev) =>
                                  prev.map((sub) =>
                                    sub.id === selectedSubmission.id
                                      ? {
                                          ...sub,
                                          warehouseAssignment: undefined,
                                        }
                                      : sub,
                                  ),
                                );
                              }}
                              className="px-3 py-1 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition"
                            >
                              <i className="ri-close-line mr-1"></i>
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                      {/* NFPA Analysis */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                        <h4 className="font-bold mb-3 flex items-center gap-2 text-purple-400">
                          <i className="ri-shield-line"></i>
                          NFPA Storage Requirements Analysis
                        </h4>
                        {(() => {
                          const nfpaReq =
                            intelligentWarehouseAssignmentService.analyzeNFPARequirements(
                              selectedSubmission.extractedData,
                            );
                          return (
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-400 mb-1">
                                  NFPA Ratings:
                                </p>
                                <div className="flex gap-2">
                                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    Health: {nfpaReq.health}
                                  </span>
                                  <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                    Flammability: {nfpaReq.flammability}
                                  </span>
                                  <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    Reactivity: {nfpaReq.reactivity}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">
                                  Storage Type Required:
                                </p>
                                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold">
                                  {nfpaReq.storageArea.type.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-400 mb-1">
                                  Required Capabilities:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {nfpaReq.storageArea.requiredCapabilities.map(
                                    (cap, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30"
                                      >
                                        {cap}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                              {nfpaReq.segregationDistance > 0 && (
                                <div>
                                  <p className="text-gray-400 mb-1">
                                    Segregation Distance:
                                  </p>
                                  <span className="text-yellow-400 font-semibold">
                                    {nfpaReq.segregationDistance}m minimum
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Legacy Warehouse Recommendations (fallback) */}
                      <WarehouseRecommendations
                        msdsData={selectedSubmission.extractedData}
                        customerId={customerId}
                        customerName={customerName}
                        quantity={quantity}
                        volume={volume}
                        weight={weight}
                        onSelectWarehouse={async (
                          warehouseId,
                          recommendation,
                        ) => {
                          if (!selectedSubmission) return;

                          if (!recommendation) {
                            setNotification({
                              show: true,
                              type: "error",
                              title: "Error",
                              message: "Warehouse recommendation not found",
                            });
                            return;
                          }

                          try {
                            // Save warehouse assignment
                            const response = await apiFetch(
                              "/api/msds/assign-warehouse",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  submissionId: selectedSubmission.id,
                                  warehouseId: recommendation.warehouseId,
                                  warehouseName: recommendation.warehouseName,
                                  warehouseCode: recommendation.warehouseCode,
                                  areaId: recommendation.recommendedAreaId,
                                  recommendation: recommendation,
                                }),
                              },
                            );

                            const data = await response.json();

                            if (data.success) {
                              // Update submission state with warehouse assignment
                              setSelectedSubmission({
                                ...selectedSubmission,
                                warehouseAssignment: {
                                  warehouseId: recommendation.warehouseId,
                                  warehouseName: recommendation.warehouseName,
                                  warehouseCode: recommendation.warehouseCode,
                                  areaId: recommendation.recommendedAreaId,
                                  assignedAt: new Date().toISOString(),
                                  recommendation: recommendation,
                                },
                              });

                              // Update submissions list
                              setSubmissions((prev) =>
                                prev.map((sub) =>
                                  sub.id === selectedSubmission.id
                                    ? {
                                        ...sub,
                                        warehouseAssignment: {
                                          warehouseId:
                                            recommendation.warehouseId,
                                          warehouseName:
                                            recommendation.warehouseName,
                                          warehouseCode:
                                            recommendation.warehouseCode,
                                          areaId:
                                            recommendation.recommendedAreaId,
                                          assignedAt: new Date().toISOString(),
                                          recommendation: recommendation,
                                        },
                                      }
                                    : sub,
                                ),
                              );

                              setNotification({
                                show: true,
                                type: "success",
                                title: "Warehouse Assigned",
                                message: `${recommendation.warehouseName} has been assigned. You can proceed with approval.`,
                              });
                            } else {
                              throw new Error(
                                data.error || "Failed to assign warehouse",
                              );
                            }
                          } catch (error) {
                            const err =
                              error instanceof Error
                                ? error
                                : new Error(String(error));
                            logger.error("Error assigning warehouse", err, {
                              module: "msds",
                              service: "warehouse-assignment",
                            });
                            errorTrackingService.captureException(err, {
                              module: "msds",
                              service: "warehouse-assignment",
                            });
                            setNotification({
                              show: true,
                              type: "error",
                              title: "Assignment Failed",
                              message:
                                err.message ||
                                "Failed to assign warehouse. Please try again.",
                            });
                          }
                        }}
                      />
                    </div>
                  )}
              </div>

              {/* Approval Actions */}
              {selectedSubmission.status === "review" && (
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(selectedSubmission);
                      }}
                      disabled={processing}
                      className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <i className="ri-check-line"></i>
                      Approve & Save
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const reason =
                          selectedSubmission.manualNotes || "Requires revision";
                        handleReject(selectedSubmission, reason);
                      }}
                      disabled={processing}
                      className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 font-bold hover:shadow-lg hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <i className="ri-close-line"></i>
                      Reject
                    </button>
                  </div>

                  {/* Request Additional Info Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRequestInfoModal(true);
                      setRequestedInfo([]);
                      setCustomRequest("");
                    }}
                    disabled={processing}
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <i className="ri-alert-line"></i>
                    Request Additional Information
                  </button>
                </div>
              )}

              {/* Status Info */}
              {selectedSubmission.status !== "review" && (
                <div
                  className={`p-4 rounded-lg ${
                    selectedSubmission.status === "approved"
                      ? "bg-green-500/10 border border-green-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  <p className="text-sm">
                    <strong>Status:</strong>{" "}
                    {selectedSubmission.status === "approved"
                      ? "✅ Approved"
                      : "❌ Rejected"}
                  </p>
                  {selectedSubmission.manualNotes && (
                    <p className="text-xs mt-2 text-gray-300">
                      <strong>Notes:</strong> {selectedSubmission.manualNotes}
                    </p>
                  )}
                  <p className="text-xs mt-2 text-gray-400">
                    Customer notified via email • Logged in ERPNext • Fully
                    auditable
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Request Additional Information Modal */}
      <AnimatePresence>
        {showRequestInfoModal && selectedSubmission && (
          <Modal
            isOpen={showRequestInfoModal}
            onClose={() => setShowRequestInfoModal(false)}
            title="Request Additional Information"
            size="lg"
          >
            <div className="space-y-6">
              <p className="text-sm text-gray-300">
                Select the information you need from the customer or add custom
                requests:
              </p>

              {/* Checklist */}
              <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {additionalInfoOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition border border-gray-700 hover:border-orange-500/30"
                  >
                    <input
                      type="checkbox"
                      checked={requestedInfo.includes(option)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRequestedInfo([...requestedInfo, option]);
                        } else {
                          setRequestedInfo(
                            requestedInfo.filter((i) => i !== option),
                          );
                        }
                      }}
                      className="mt-1 w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300">{option}</span>
                  </label>
                ))}
              </div>

              {/* Custom Request */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Custom Request (Optional)
                </label>
                <textarea
                  value={customRequest}
                  onChange={(e) => setCustomRequest(e.target.value)}
                  placeholder="Specify any other information you need..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-orange-500/50 outline-none transition text-white resize-none"
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (requestedInfo.length === 0 && !customRequest.trim()) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "No Information Selected",
                        message:
                          "Please select at least one item or add a custom request",
                      });
                      return;
                    }

                    try {
                      const requestList = [...requestedInfo];
                      if (customRequest.trim()) {
                        requestList.push(`Custom: ${customRequest.trim()}`);
                      }

                      await apiFetch("/api/erpnext/send-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          to:
                            selectedSubmission.customerEmail ||
                            "customer@example.com",
                          subject: `Additional Information Required: ${selectedSubmission.extractedData?.productName}`,
                          message: `
                            <h2>Additional Information Needed for MSDS Review</h2>
                            <p><strong>Product:</strong> ${selectedSubmission.extractedData?.productName}</p>
                            <p><strong>CAS Number:</strong> ${selectedSubmission.extractedData?.casNumber}</p>
                            <p><strong>Manufacturer:</strong> ${selectedSubmission.extractedData?.manufacturer}</p>
                            
                            <h3>Please provide the following information:</h3>
                            <ul>
                              ${requestList.map((item) => `<li>${item}</li>`).join("")}
                            </ul>
                            
                            ${selectedSubmission.manualNotes ? `<p><strong>Reviewer Notes:</strong> ${selectedSubmission.manualNotes}</p>` : ""}
                            
                            <p>Please respond with this information to complete your MSDS review.</p>
                            <p><strong>Reference:</strong> ${selectedSubmission.id}</p>
                          `,
                          reference_doctype: "Communication",
                        }),
                      });

                      setShowRequestInfoModal(false);
                      setNotification({
                        show: true,
                        type: "success",
                        title: "Request Sent",
                        message: `Email sent to customer with ${requestList.length} information requests`,
                      });
                    } catch (error) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "Send Failed",
                        message: "Could not send email request",
                      });
                    }
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 font-bold hover:shadow-lg hover:shadow-orange-500/50 transition"
                >
                  Send Request (
                  {requestedInfo.length + (customRequest.trim() ? 1 : 0)} items)
                </button>

                <button
                  onClick={() => setShowRequestInfoModal(false)}
                  className="px-6 py-3 rounded-lg bg-gray-700 border border-gray-600 hover:border-gray-500 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Enhanced Notification with Intelligent Auto-Dismiss */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.95,
              transition: { duration: 0.3 },
            }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onMouseEnter={() => setIsNotificationPaused(true)}
            onMouseLeave={() => setIsNotificationPaused(false)}
            className={`fixed bottom-4 right-4 p-4 rounded-lg border backdrop-blur-sm shadow-2xl ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : notification.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            } z-50 max-w-md overflow-hidden`}
          >
            {/* Progress Bar */}
            <motion.div
              className={`absolute top-0 left-0 h-1 ${
                notification.type === "success"
                  ? "bg-green-400"
                  : notification.type === "error"
                    ? "bg-red-400"
                    : "bg-blue-400"
              }`}
              style={{ width: `${notificationProgress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />

            <div className="flex items-start gap-3 relative">
              <motion.i
                className={`${
                  notification.type === "success"
                    ? "ri-checkbox-circle-line"
                    : notification.type === "error"
                      ? "ri-close-circle-line"
                      : "ri-information-line"
                } text-xl`}
                animate={
                  notification.type === "success"
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              <div className="flex-1">
                <h4 className="font-bold mb-1">{notification.title}</h4>
                <p className="text-sm opacity-90">{notification.message}</p>
              </div>
              <motion.button
                onClick={() =>
                  setNotification({ ...notification, show: false })
                }
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                title="Dismiss"
              >
                <i className="ri-close-line"></i>
              </motion.button>
            </div>

            {/* Pause indicator when hovering */}
            {isNotificationPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-2 text-xs text-gray-400 flex items-center gap-1"
              >
                <i className="ri-pause-line"></i>
                <span>Paused</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PDF Viewer */}
      <AnimatePresence>
        {showPDFViewer && pdfViewerFile && (
          <PDFViewer
            fileUrl={pdfViewerFile}
            fileName={pdfViewerFileName}
            onClose={() => {
              setShowPDFViewer(false);
              setPdfViewerFile(null);
              setPdfViewerFileName("");
            }}
            readOnly={false}
          />
        )}
      </AnimatePresence>

      {/* Bulk Action Modal */}
      <AnimatePresence>
        {bulkAction && (
          <Modal
            isOpen={!!bulkAction}
            onClose={() => {
              setBulkAction(null);
              setBulkReason("");
            }}
            title={
              bulkAction === "approve"
                ? "Bulk Approve MSDS"
                : "Bulk Reject MSDS"
            }
            size="md"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                {bulkAction === "approve"
                  ? `You are about to approve ${selectedIds.size} MSDS document(s).`
                  : `You are about to reject ${selectedIds.size} MSDS document(s). Please provide a reason.`}
              </p>

              {bulkAction === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-500/50 outline-none text-white resize-none"
                    rows={4}
                    required
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (bulkAction === "reject" && !bulkReason.trim()) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "Reason Required",
                        message: "Please provide a rejection reason",
                      });
                      return;
                    }

                    setProcessing(true);
                    try {
                      const response = await apiFetch(
                        bulkAction === "approve"
                          ? "/api/chemical/msds/bulk-approve"
                          : "/api/chemical/msds/bulk-reject",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            msdsIds: Array.from(selectedIds),
                            reason: bulkReason,
                            comments:
                              bulkAction === "approve"
                                ? "Bulk approved"
                                : undefined,
                          }),
                        },
                      );

                      const result = await response.json();

                      if (result.success) {
                        // Update submission statuses
                        setSubmissions((prev) =>
                          prev.map((s) =>
                            selectedIds.has(s.id)
                              ? {
                                  ...s,
                                  status:
                                    bulkAction === "approve"
                                      ? "approved"
                                      : "rejected",
                                }
                              : s,
                          ),
                        );

                        setSelectedIds(new Set());
                        setBulkAction(null);
                        setBulkReason("");

                        setNotification({
                          show: true,
                          type: "success",
                          title: `Bulk ${bulkAction === "approve" ? "Approval" : "Rejection"} Complete`,
                          message: `${result.result.successful} successful, ${result.result.failed} failed`,
                        });
                      }
                    } catch (error) {
                      setNotification({
                        show: true,
                        type: "error",
                        title: "Bulk Action Failed",
                        message:
                          error instanceof Error
                            ? error.message
                            : "Unknown error",
                      });
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  disabled={processing}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 ${
                    bulkAction === "approve"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      : "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                  } text-white`}
                >
                  {bulkAction === "approve" ? "Approve All" : "Reject All"}
                </button>
                <button
                  onClick={() => {
                    setBulkAction(null);
                    setBulkReason("");
                  }}
                  className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
