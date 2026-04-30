"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ASNData,
  Pallet,
  DamageRecord,
  ServiceRequest,
  ProcessingFlowEvent,
  ModificationHistory,
  SLAComplianceResult,
  KPIResult,
  SLAComplianceStatus,
} from "@/types/asn";
import { format } from "date-fns";
import { usePhotoUpload } from "@/lib/hooks/usePhotoUpload";
import { useAuth } from "@/contexts/AuthContext";
import {
  calculatePickingDuration,
  calculateQCDuration,
  calculateDispatchingDuration,
  calculateDuration1,
  calculateDuration2,
  calculateTotalProcessingTime,
} from "@/utils/formulaCalculator";
import { calculateLoadSetup } from "@/utils/loadSetupCalculator";

interface OutboundDetailProps {
  order: ASNData;
  onClose: () => void;
  initialShowPickupModal?: boolean;
}

export default function OutboundDetail({
  order,
  onClose,
  initialShowPickupModal = false,
}: OutboundDetailProps) {
  // Reuse InboundDetail component structure but adapt for outbound
  // For now, we'll use a similar structure but with outbound-specific fields
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "pallets"
    | "damage"
    | "requests"
    | "preferences"
    | "compliance"
  >("overview");
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [showServiceRequestModal, setShowServiceRequestModal] = useState(false);
  const [showDamagePhotoModal, setShowDamagePhotoModal] = useState(false);
  const [selectedDamageRecord, setSelectedDamageRecord] =
    useState<DamageRecord | null>(null);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [showCarrierPickupModal, setShowCarrierPickupModal] = useState(
    initialShowPickupModal,
  );
  const [showDeliveryPreferencesModal, setShowDeliveryPreferencesModal] =
    useState(false);
  const [processingFlowEvents, setProcessingFlowEvents] = useState<
    ProcessingFlowEvent[]
  >([]);
  const [modificationHistory, setModificationHistory] = useState<
    ModificationHistory[]
  >([]);
  const [slaComplianceResults, setSlaComplianceResults] = useState<
    SLAComplianceResult[]
  >([]);
  const [kpiResults, setKpiResults] = useState<KPIResult[]>([]);

  // Photo upload with auto-analysis
  const { user } = useAuth();
  const {
    uploadPhotoWithAutoAnalysis,
    uploading,
    analyzing,
    creatingEvidence,
    assessingLiability,
  } = usePhotoUpload();

  const [photoAnalysisResults, setPhotoAnalysisResults] = useState<
    Record<string, any>
  >({});
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, string>>(
    {},
  );

  // Handle photo upload with auto-analysis
  const handlePhotoUpload = async (
    file: File,
    photoType: "damage" | "pallet" | "loading",
  ) => {
    try {
      const result = await uploadPhotoWithAutoAnalysis(file, {
        entityId: order.id,
        entityType: "ASN",
        tenantId: user?.tenantId || "default",
        userId: user?.id,
        area: "shipping_dock",
        carrier: order.carrierName,
      });

      if (result.error) {
        alert(`Photo upload failed: ${result.error}`);
        return;
      }

      if (result.fileUrl) {
        setUploadedPhotos((prev) => ({ ...prev, [photoType]: result.fileUrl }));
      }

      if (result.visionAnalysis) {
        setPhotoAnalysisResults((prev) => ({
          ...prev,
          [photoType]: result.visionAnalysis,
        }));
      }

      console.log("Photo uploaded and analyzed:", {
        photoType,
        hasAnalysis: !!result.visionAnalysis,
        hasEvidence: !!result.evidence,
        hasLiability: !!result.liabilityAssessment,
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      alert("Failed to upload photo. Please try again.");
    }
  };

  // Load pallets for this order - Try localStorage first, fallback to mock data
  useEffect(() => {
    const storageKey = `outbound_pallets_${order.id}`;

    // Try to load from localStorage first
    const storedPallets = localStorage.getItem(storageKey);
    if (storedPallets) {
      try {
        const parsed = JSON.parse(storedPallets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPallets(parsed);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse stored pallets, using defaults");
      }
    }

    // Fallback to mock data if no stored data
    const defaultPallets: Pallet[] = [
      {
        id: `plt-out-${order.id.slice(-3)}`,
        palletNumber: `PLT-OUT-${order.id.slice(-3).toUpperCase()}`,
        asnId: order.id,
        documentNumber: order.documentNumber,
        processType: "OUTBOUND",
        receivedDate: order.pickingStartTime || new Date().toISOString(),
        receivedBy: order.assignedPerson || "SYSTEM",
        location: "PICK-01",
        status: "PICKED",
        hasDamage: false,
        totalItems: order.totalItems || 0,
        totalWeight: order.totalWeight || 0,
        totalVolume: order.totalVolume || 0,
        batchNumber: `BATCH-${new Date().getFullYear()}-${order.id.slice(-3)}`,
        expiryDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
        skuNumber: "SKU-12347",
        materialNumber: "MAT-003",
        materialDescription: "Product C - Bulk Package",
        quantity: order.totalItems || 0,
        unitOfMeasure: order.baseUnit || "EA",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setPallets(defaultPallets);
    // Save default to localStorage for persistence
    localStorage.setItem(storageKey, JSON.stringify(defaultPallets));
  }, [order]);

  // Load service requests for this order - Try localStorage first
  useEffect(() => {
    const storageKey = `outbound_service_requests_${order.id}`;

    // Try to load from localStorage first
    const storedRequests = localStorage.getItem(storageKey);
    if (storedRequests) {
      try {
        const parsed = JSON.parse(storedRequests);
        if (Array.isArray(parsed)) {
          setServiceRequests(parsed);
          return;
        }
      } catch (e) {
        console.warn("Failed to parse stored service requests");
      }
    }

    // Fallback to empty array
    setServiceRequests([]);
  }, [order]);

  // Build processing flow events and modification history from order data
  // These events are derived from order state, representing the complete lifecycle
  useEffect(() => {
    // Events are built dynamically from order timestamps and status
    const flowEvents: ProcessingFlowEvent[] = [
      {
        id: "event-1",
        asnId: order.id,
        eventType: "STATUS_CHANGE",
        eventName: "Order Created",
        description: "Order document was created",
        performedBy: order.createdBy || "SYSTEM",
        performedAt: order.createdAt || new Date().toISOString(),
        metadata: { status: "CREATED", erpSystem: order.erpSystem || "CUSTOM" },
      },
      ...(order.orderConfirmedAt
        ? [
            {
              id: "event-2",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Order Confirmed",
              description: `Order confirmed${order.confirmationNumber ? ` - Confirmation #${order.confirmationNumber}` : ""}`,
              performedBy: order.orderConfirmedBy || "SYSTEM",
              performedAt: order.orderConfirmedAt,
              metadata: {
                status: "CONFIRMED",
                confirmationNumber: order.confirmationNumber,
              },
            },
          ]
        : []),
      ...(order.plEmailDate
        ? [
            {
              id: "event-3",
              asnId: order.id,
              eventType: "ACTION",
              eventName: "Pick List Email Received",
              description: `Pick list email received on ${format(new Date(order.plEmailDate), "MMM dd, yyyy HH:mm")}`,
              performedBy: "SYSTEM",
              performedAt: order.plEmailDate,
              metadata: { stage: "PICK_LIST_RECEIVED" },
            },
          ]
        : []),
      ...(order.pickReleasedAt
        ? [
            {
              id: "event-4",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Pick Released",
              description: `Pick list released${order.pickReleaseNumber ? ` - Release #${order.pickReleaseNumber}` : ""}`,
              performedBy: order.pickReleasedBy || "SYSTEM",
              performedAt: order.pickReleasedAt,
              metadata: {
                status: "PICK_RELEASED",
                pickReleaseNumber: order.pickReleaseNumber,
              },
            },
          ]
        : []),
      ...(order.pickingStartTime
        ? [
            {
              id: "event-5",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Picking Started",
              description: `Picking started on ${format(new Date(order.pickingStartTime), "MMM dd, yyyy HH:mm")}`,
              performedBy:
                order.assignedPerson ||
                order.pickingPersonnel?.[0] ||
                "Operator",
              performedAt: order.pickingStartTime,
              metadata: {
                status: "PICKING",
                personnel: order.pickingPersonnel,
              },
            },
          ]
        : []),
      ...(order.pickingEndTime
        ? [
            {
              id: "event-6",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Picking Completed",
              description: `Picking completed on ${format(new Date(order.pickingEndTime), "MMM dd, yyyy HH:mm")}`,
              performedBy:
                order.assignedPerson ||
                order.pickingPersonnel?.[0] ||
                "Operator",
              performedAt: order.pickingEndTime,
              metadata: { status: "PICKED", duration: order.pickingDuration },
            },
          ]
        : []),
      ...(order.qcStartTime
        ? [
            {
              id: "event-7",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Quality Check Started",
              description: `Quality check started on ${format(new Date(order.qcStartTime), "MMM dd, yyyy HH:mm")}`,
              performedBy: order.qcPersonnel?.[0] || "QC Inspector",
              performedAt: order.qcStartTime,
              metadata: {
                status: "QC_IN_PROGRESS",
                personnel: order.qcPersonnel,
              },
            },
          ]
        : []),
      ...(order.qcEndTime
        ? [
            {
              id: "event-8",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Quality Check Completed",
              description: `Quality check completed on ${format(new Date(order.qcEndTime), "MMM dd, yyyy HH:mm")}`,
              performedBy: order.qcPersonnel?.[0] || "QC Inspector",
              performedAt: order.qcEndTime,
              metadata: { status: "QC_COMPLETED", duration: order.qcDuration },
            },
          ]
        : []),
      ...(order.driverArrivalDate
        ? [
            {
              id: "event-9",
              asnId: order.id,
              eventType: "ACTION",
              eventName: "Driver Arrived",
              description: `Driver arrived at warehouse on ${format(new Date(order.driverArrivalDate), "MMM dd, yyyy HH:mm")}`,
              performedBy: order.transporterName || "Driver",
              performedAt: order.driverArrivalDate,
              metadata: {
                stage: "DRIVER_ARRIVED",
                transporter: order.transporterName,
              },
            },
          ]
        : []),
      ...(order.dispatchingStartDate
        ? [
            {
              id: "event-10",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Dispatching Started",
              description: `Dispatching started on ${format(new Date(order.dispatchingStartDate), "MMM dd, yyyy HH:mm")}`,
              performedBy: order.dispatchingPersonnel?.[0] || "Dispatcher",
              performedAt: order.dispatchingStartDate,
              metadata: {
                status: "READY_FOR_DISPATCH",
                personnel: order.dispatchingPersonnel,
              },
            },
          ]
        : []),
      ...(order.dispatchingEndTime
        ? [
            {
              id: "event-11",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Dispatched",
              description: `Order dispatched on ${format(new Date(order.dispatchingEndTime), "MMM dd, yyyy HH:mm")}`,
              performedBy: order.dispatchingPersonnel?.[0] || "Dispatcher",
              performedAt: order.dispatchingEndTime,
              metadata: {
                status: "DISPATCHED",
                duration: order.dispatchingDuration,
              },
            },
          ]
        : []),
      ...(order.shipConfirmedAt
        ? [
            {
              id: "event-12",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Ship Confirmed",
              description: `Ship confirmed${order.shippingNumber ? ` - Shipping #${order.shippingNumber}` : ""}${order.waybillNumber ? `, Waybill #${order.waybillNumber}` : ""}`,
              performedBy: order.shipConfirmedBy || "SYSTEM",
              performedAt: order.shipConfirmedAt,
              metadata: {
                status: "DISPATCHED",
                shippingNumber: order.shippingNumber,
                waybillNumber: order.waybillNumber,
              },
            },
          ]
        : []),
      ...(order.goodsIssuedAt
        ? [
            {
              id: "event-13",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Goods Issue Posted",
              description: `Goods issue posted${order.goodsIssueNumber ? ` - Document #${order.goodsIssueNumber}` : ""}${order.materialDocumentNumber ? `, Material Doc #${order.materialDocumentNumber}` : ""}`,
              performedBy: order.goodsIssuedBy || "SYSTEM",
              performedAt: order.goodsIssuedAt,
              metadata: {
                status: "GOODS_ISSUED",
                goodsIssueNumber: order.goodsIssueNumber,
                materialDocumentNumber: order.materialDocumentNumber,
              },
            },
          ]
        : []),
      ...(order.deliveryNoteIssuedAt
        ? [
            {
              id: "event-14",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Delivery Note Issued",
              description: `Delivery note issued${order.deliveryNoteNumber ? ` - Note #${order.deliveryNoteNumber}` : ""}`,
              performedBy: order.deliveryNoteIssuedBy || "SYSTEM",
              performedAt: order.deliveryNoteIssuedAt,
              metadata: {
                status: "DELIVERY_NOTE_ISSUED",
                deliveryNoteNumber: order.deliveryNoteNumber,
              },
            },
          ]
        : []),
      ...(order.invoicedAt
        ? [
            {
              id: "event-15",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Invoice Created",
              description: `Invoice created${order.invoiceNumber ? ` - Invoice #${order.invoiceNumber}` : ""}${order.invoiceAmount ? `, Amount: ${order.invoiceAmount} ${order.invoiceCurrency || "USD"}` : ""}`,
              performedBy: "SYSTEM",
              performedAt: order.invoicedAt,
              metadata: {
                status: "INVOICED",
                invoiceNumber: order.invoiceNumber,
                invoiceAmount: order.invoiceAmount,
                invoiceCurrency: order.invoiceCurrency,
              },
            },
          ]
        : []),
      ...(order.orderCompletedAt
        ? [
            {
              id: "event-16",
              asnId: order.id,
              eventType: "STATUS_CHANGE",
              eventName: "Order Completed",
              description: `Order completed${order.completionReason ? ` - ${order.completionReason}` : ""}`,
              performedBy: order.orderCompletedBy || "SYSTEM",
              performedAt: order.orderCompletedAt,
              metadata: {
                status: "COMPLETED",
                completionReason: order.completionReason,
              },
            },
          ]
        : []),
    ] as ProcessingFlowEvent[];
    // Sort by timestamp
    mockFlowEvents.sort(
      (a, b) =>
        new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );
    setProcessingFlowEvents(flowEvents);

    const mockHistory: ModificationHistory[] = [
      {
        id: "hist-1",
        asnId: order.id,
        modifiedBy: "SYSTEM",
        modifiedAt: order.createdAt || new Date().toISOString(),
        modificationType: "CREATE",
        reason: "Order document created",
      },
      ...(order.lastUpdate && order.lastUpdate !== order.createdAt
        ? [
            {
              id: "hist-2",
              asnId: order.id,
              modifiedBy: "SYSTEM",
              modifiedAt: order.lastUpdate,
              modificationType: "UPDATE",
              reason: "Order document updated",
            },
          ]
        : []),
    ] as ModificationHistory[];
    setModificationHistory(mockHistory);
  }, [order]);

  // Load SLA and KPI compliance results
  useEffect(() => {
    const pickingDuration = calculatePickingDuration(order);
    const qcDuration = calculateQCDuration(order);
    const dispatchingDuration = calculateDispatchingDuration(order);

    // Load SLA Compliance Results
    const mockSLAResults: SLAComplianceResult[] = [
      {
        asnId: order.id,
        slaId: "sla-out-001",
        slaName: "Order Creation to Picking",
        customerNumber: order.customerNumber || "CUST-001",
        customerName: order.customerName || "Customer",
        targetDuration: 6 * 3600, // 6 hours in seconds
        actualDuration: pickingDuration,
        compliancePercentage: (pickingDuration / (6 * 3600)) * 100,
        status: (() => {
          const percentage = (pickingDuration / (6 * 3600)) * 100;
          if (percentage <= 80) return "COMPLIANT";
          if (percentage <= 100) return "WARNING";
          return "CRITICAL";
        })() as SLAComplianceStatus,
        breachReason:
          (pickingDuration / (6 * 3600)) * 100 > 100
            ? "Picking time exceeded target duration"
            : undefined,
        calculatedAt: new Date().toISOString(),
      },
      {
        asnId: order.id,
        slaId: "sla-out-002",
        slaName: "Picking to Dispatch",
        customerNumber: order.customerNumber || "CUST-001",
        customerName: order.customerName || "Customer",
        targetDuration: 4 * 3600, // 4 hours in seconds
        actualDuration: qcDuration + dispatchingDuration,
        compliancePercentage:
          ((qcDuration + dispatchingDuration) / (4 * 3600)) * 100,
        status: (() => {
          const percentage =
            ((qcDuration + dispatchingDuration) / (4 * 3600)) * 100;
          if (percentage <= 80) return "COMPLIANT";
          if (percentage <= 100) return "WARNING";
          return "CRITICAL";
        })() as SLAComplianceStatus,
        breachReason:
          ((qcDuration + dispatchingDuration) / (4 * 3600)) * 100 > 100
            ? "QC and dispatch time exceeded target duration"
            : undefined,
        calculatedAt: new Date().toISOString(),
      },
    ];
    setSlaComplianceResults(mockSLAResults);

    // Load KPI Results - Outbound Process KPIs
    const damageCount = pallets.filter((p) => p.hasDamage).length;
    const damageRate =
      pallets.length > 0 ? (damageCount / pallets.length) * 100 : 0;
    const pickingEfficiency =
      pickingDuration > 0 ? (pickingDuration / (6 * 3600)) * 100 : 0;
    const qcEfficiency = qcDuration > 0 ? (qcDuration / (2 * 3600)) * 100 : 0;
    const dispatchingEfficiency =
      dispatchingDuration > 0 ? (dispatchingDuration / (2 * 3600)) * 100 : 0;
    const totalProcessingEfficiency =
      pickingDuration + qcDuration + dispatchingDuration > 0
        ? ((pickingDuration + qcDuration + dispatchingDuration) / (10 * 3600)) *
          100
        : 0;

    const mockKPIResults: KPIResult[] = [
      {
        kpiId: "kpi-picking-efficiency",
        value: pickingEfficiency,
        target: 80, // 80% efficiency target
        status:
          pickingEfficiency <= 80
            ? "met"
            : pickingEfficiency <= 100
              ? "warning"
              : "critical",
        calculatedAt: new Date().toISOString(),
      },
      {
        kpiId: "kpi-qc-efficiency",
        value: qcEfficiency,
        target: 80, // 80% efficiency target
        status:
          qcEfficiency <= 80
            ? "met"
            : qcEfficiency <= 100
              ? "warning"
              : "critical",
        calculatedAt: new Date().toISOString(),
      },
      {
        kpiId: "kpi-dispatching-efficiency",
        value: dispatchingEfficiency,
        target: 80, // 80% efficiency target
        status:
          dispatchingEfficiency <= 80
            ? "met"
            : dispatchingEfficiency <= 100
              ? "warning"
              : "critical",
        calculatedAt: new Date().toISOString(),
      },
      {
        kpiId: "kpi-total-processing-efficiency",
        value: totalProcessingEfficiency,
        target: 80, // 80% efficiency target
        status:
          totalProcessingEfficiency <= 80
            ? "met"
            : totalProcessingEfficiency <= 100
              ? "warning"
              : "critical",
        calculatedAt: new Date().toISOString(),
      },
      {
        kpiId: "kpi-damage",
        value: damageRate,
        target: 2, // 2% max damage rate
        status:
          damageRate <= 2 ? "met" : damageRate <= 5 ? "warning" : "critical",
        calculatedAt: new Date().toISOString(),
        // Store damage count as additional data (cast to any for display purposes)
        damageCount: damageCount,
        totalPallets: pallets.length,
      } as any,
      {
        kpiId: "kpi-order-accuracy",
        value:
          order.receivedQuantity && order.totalQuantity
            ? Math.abs(
                (order.receivedQuantity / order.totalQuantity) * 100 - 100,
              )
            : 0, // Variance from expected
        target: 2, // 2% variance tolerance
        status:
          order.receivedQuantity && order.totalQuantity
            ? Math.abs(
                (order.receivedQuantity / order.totalQuantity) * 100 - 100,
              ) <= 2
              ? "met"
              : Math.abs(
                    (order.receivedQuantity / order.totalQuantity) * 100 - 100,
                  ) <= 5
                ? "warning"
                : "critical"
            : "critical",
        calculatedAt: new Date().toISOString(),
      },
    ];
    setKpiResults(mockKPIResults);
  }, [order, pallets.length]);

  const calculatedDurations = useMemo(() => {
    return {
      picking: calculatePickingDuration(order),
      qc: calculateQCDuration(order),
      dispatching: calculateDispatchingDuration(order),
      duration1: calculateDuration1(order),
      duration2: calculateDuration2(order),
      total: calculateTotalProcessingTime(order),
    };
  }, [order]);

  // Calculate Load Setup
  const loadSetup = useMemo(() => {
    if (pallets.length > 0 || order.totalWeight || order.totalVolume) {
      return calculateLoadSetup(order, pallets);
    }
    return null;
  }, [order, pallets]);

  const handleRequestCarrierPickup = async () => {
    try {
      // Calculate expected readiness time (e.g., 2 hours from now)
      const expectedReadiness = new Date();
      expectedReadiness.setHours(expectedReadiness.getHours() + 2);

      // Prepare Wajeeh API request
      const wajeehRequest = {
        orderId: order.documentNumber,
        pickupLocation: order.destination,
        expectedReadinessTime: expectedReadiness.toISOString(),
        totalWeight: order.totalWeight || 0,
        totalVolume: order.totalVolume || 0,
        totalPallets: pallets.length,
        specialInstructions: order.deliveryInstructions || "",
      };

      // In production: Call Wajeeh/carrier API integration
      // For demo mode, we log the request and show success
      console.log("[Demo Mode] Wajeeh API Request:", wajeehRequest);

      // Save pickup request to localStorage for persistence
      const pickupRequestsKey = `carrier_pickup_requests_${order.id}`;
      const existingRequests = JSON.parse(
        localStorage.getItem(pickupRequestsKey) || "[]",
      );
      const newRequest = {
        id: `WJP-${Date.now()}`,
        ...wajeehRequest,
        requestedAt: new Date().toISOString(),
        status: "PENDING",
      };
      existingRequests.push(newRequest);
      localStorage.setItem(pickupRequestsKey, JSON.stringify(existingRequests));

      alert(
        `Carrier pickup request submitted successfully! Request ID: ${newRequest.id}`,
      );
      setShowCarrierPickupModal(false);
    } catch (error) {
      console.error("Error requesting carrier pickup:", error);
      alert("Failed to submit carrier pickup request. Please try again.");
    }
  };

  const handleTagAsUrgent = () => {
    // Save urgent status to localStorage for persistence
    const urgentOrdersKey = "urgent_orders";
    const existingUrgent = JSON.parse(
      localStorage.getItem(urgentOrdersKey) || "[]",
    );
    if (!existingUrgent.includes(order.id)) {
      existingUrgent.push(order.id);
      localStorage.setItem(urgentOrdersKey, JSON.stringify(existingUrgent));
    }
    alert("Order tagged as urgent!");
    setShowUrgentModal(false);
  };

  const handleUpdateDeliveryPreferences = () => {
    // Save delivery preferences to localStorage
    const preferencesKey = `delivery_preferences_${order.id}`;
    localStorage.setItem(
      preferencesKey,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        orderId: order.id,
      }),
    );
    alert("Delivery preferences updated!");
    setShowDeliveryPreferencesModal(false);
  };

  return (
    <>
      {/* Main Modal - Similar structure to InboundDetail but for outbound */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#111827] border-b border-[#374151] p-6 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {order.documentNumber}
                </h2>
                {order.isUrgent && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                    <i className="ri-alert-line"></i>
                    URGENT
                  </span>
                )}
                {order.carrierPickupRequested && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                    <i className="ri-truck-line"></i>
                    PICKUP REQUESTED
                  </span>
                )}
              </div>
              <p className="text-sm text-[#9ca3af]">Outbound Order Details</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#9ca3af] hover:text-white transition-colors p-2 hover:bg-[#374151] rounded-lg"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#374151] bg-[#111827] px-6">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                {
                  id: "overview",
                  label: "Overview",
                  icon: "ri-file-list-3-line",
                },
                {
                  id: "pallets",
                  label: "Pallets",
                  icon: "ri-stack-line",
                  badge: pallets.length,
                },
                {
                  id: "damage",
                  label: "Damage",
                  icon: "ri-error-warning-line",
                  badge: pallets.filter((p) => p.hasDamage).length,
                },
                {
                  id: "requests",
                  label: "Service Requests",
                  icon: "ri-customer-service-line",
                  badge: serviceRequests.length,
                },
                {
                  id: "preferences",
                  label: "Preferences",
                  icon: "ri-settings-3-line",
                },
                {
                  id: "compliance",
                  label: "Compliance",
                  icon: "ri-shield-check-line",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-400"
                      : "border-transparent text-[#9ca3af] hover:text-white"
                  }`}
                >
                  <i className={tab.icon}></i>
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button
                    onClick={() => setShowServiceRequestModal(true)}
                    className="px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-blue-500/50 transition-colors text-left"
                  >
                    <i className="ri-customer-service-line text-blue-400 text-xl mb-2"></i>
                    <p className="text-sm font-medium text-white">
                      Service Request
                    </p>
                    <p className="text-xs text-[#9ca3af]">
                      Get help or report issue
                    </p>
                  </button>
                  {!order.isUrgent && (
                    <button
                      onClick={() => setShowUrgentModal(true)}
                      className="px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-orange-500/50 transition-colors text-left"
                    >
                      <i className="ri-flag-line text-orange-400 text-xl mb-2"></i>
                      <p className="text-sm font-medium text-white">
                        Mark Urgent
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Tag as urgent priority
                      </p>
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeliveryPreferencesModal(true)}
                    className="px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-cyan-500/50 transition-colors text-left"
                  >
                    <i className="ri-calendar-todo-line text-cyan-400 text-xl mb-2"></i>
                    <p className="text-sm font-medium text-white">
                      Delivery Preferences
                    </p>
                    <p className="text-xs text-[#9ca3af]">Update date & time</p>
                  </button>
                  {!order.carrierPickupRequested && (
                    <button
                      onClick={() => setShowCarrierPickupModal(true)}
                      className="px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-green-500/50 transition-colors text-left relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity">
                        <img
                          src="/wajeeh-logo.svg"
                          alt="Wajeeh"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-sm">
                          <img
                            src="/wajeeh-logo.svg"
                            alt="Wajeeh"
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <i className="ri-truck-line text-green-400 text-xl"></i>
                      </div>
                      <p className="text-sm font-medium text-white">
                        Request Pickup (Wajeeh)
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Schedule via Wajeeh platform
                      </p>
                    </button>
                  )}
                  {order.driverPhoneNumber && (
                    <button
                      onClick={() => {
                        // Request location via WhatsApp
                        const phoneNumber = (
                          order.driverPhoneNumber || ""
                        ).replace(/[^0-9]/g, "");
                        const message = encodeURIComponent(
                          `Please share your current location for Order ${order.documentNumber}. Click the link to share: https://maps.google.com/?q=`,
                        );
                        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                        window.open(whatsappUrl, "_blank");
                        // Update locationRequested flag in localStorage
                        const locationRequestsKey = `location_requests_${order.id}`;
                        localStorage.setItem(
                          locationRequestsKey,
                          JSON.stringify({
                            requestedAt: new Date().toISOString(),
                            phoneNumber,
                          }),
                        );
                      }}
                      className="px-4 py-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-purple-500/50 transition-colors text-left"
                    >
                      <i className="ri-map-pin-line text-purple-400 text-xl mb-2"></i>
                      <p className="text-sm font-medium text-white">
                        Request Location
                      </p>
                      <p className="text-xs text-[#9ca3af]">
                        Send WhatsApp to driver
                      </p>
                    </button>
                  )}
                </div>

                {/* Order Information */}
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Order Number
                      </p>
                      <p className="text-sm font-medium text-white">
                        {order.documentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Pick List / Project
                      </p>
                      <p className="text-sm font-medium text-white">
                        {order.plProjectDnNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Project Name
                      </p>
                      <p className="text-sm font-medium text-white">
                        {order.projectName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">Customer</p>
                      <p className="text-sm font-medium text-white">
                        {order.customerName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Shipment Classification
                      </p>
                      <p className="text-sm font-medium text-white">
                        {order.shipmentClassification?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">Status</p>
                      <p className="text-sm font-medium text-white">
                        {order.status}
                      </p>
                    </div>
                    {order.deliveryCity && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Delivery City
                        </p>
                        <p className="text-sm font-medium text-white">
                          {order.deliveryCity}
                        </p>
                      </div>
                    )}
                    {order.totalCBM && (
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Total CBM</p>
                        <p className="text-sm font-medium text-white">
                          {order.totalCBM.toFixed(2)} m³
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Load Setup & Recommendations */}
                {loadSetup && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Load Setup & Truck Recommendations
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Total Pallets
                        </p>
                        <p className="text-sm font-medium text-white">
                          {loadSetup.totalPallets}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Total Weight
                        </p>
                        <p className="text-sm font-medium text-white">
                          {loadSetup.totalWeight.toFixed(2)} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">
                          Total Volume
                        </p>
                        <p className="text-sm font-medium text-white">
                          {loadSetup.totalVolume.toFixed(2)} m³
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9ca3af] mb-1">Total CBM</p>
                        <p className="text-sm font-medium text-white">
                          {loadSetup.totalCBM.toFixed(2)} m³
                        </p>
                      </div>
                    </div>
                    {loadSetup.recommendedTruckTypes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Recommended Truck Types
                        </h4>
                        {loadSetup.recommendedTruckTypes
                          .slice(0, 3)
                          .map((truck, index) => (
                            <div
                              key={index}
                              className="p-3 bg-[#0a0f1a] border border-[#374151] rounded-lg hover:border-blue-500/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <i className="ri-truck-line text-blue-400"></i>
                                  <p className="text-sm font-medium text-white">
                                    {truck.truckType}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    truck.suitabilityScore >= 80
                                      ? "bg-green-500/20 text-green-400"
                                      : truck.suitabilityScore >= 60
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {truck.suitabilityScore}% Match
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-[#9ca3af]">Capacity</p>
                                  <p className="text-white">
                                    {truck.capacity} kg
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[#9ca3af]">Volume</p>
                                  <p className="text-white">
                                    {truck.volume} m³
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[#9ca3af]">Est. Cost</p>
                                  <p className="text-white">
                                    ${truck.estimatedCost || "N/A"}
                                  </p>
                                </div>
                              </div>
                              {truck.notes && (
                                <p className="text-xs text-[#6b7280] mt-2">
                                  {truck.notes}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                    {loadSetup.loadOptimization && (
                      <div className="mt-4 pt-4 border-t border-[#374151]">
                        <h4 className="text-sm font-semibold text-white mb-2">
                          Load Optimization
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Utilization
                            </p>
                            <p className="text-sm font-medium text-white">
                              {loadSetup.loadOptimization.utilizationPercentage}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Weight Util.
                            </p>
                            <p className="text-sm font-medium text-white">
                              {loadSetup.loadOptimization.weightUtilization}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Volume Util.
                            </p>
                            <p className="text-sm font-medium text-white">
                              {loadSetup.loadOptimization.volumeUtilization}%
                            </p>
                          </div>
                        </div>
                        {loadSetup.loadOptimization.optimizationSuggestions &&
                          loadSetup.loadOptimization.optimizationSuggestions
                            .length > 0 && (
                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                              <p className="text-xs text-yellow-400 font-medium mb-1">
                                Optimization Suggestions:
                              </p>
                              <ul className="text-xs text-yellow-300 space-y-1">
                                {loadSetup.loadOptimization.optimizationSuggestions.map(
                                  (suggestion, idx) => (
                                    <li key={idx}>• {suggestion}</li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reuse pallets, damage, requests, and preferences tabs from InboundDetail */}
            {activeTab === "pallets" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Pallet Tracking
                  </h3>
                  <p className="text-sm text-[#9ca3af]">
                    {pallets.length} pallets
                  </p>
                </div>
                {pallets.map((pallet) => (
                  <div
                    key={pallet.id}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-base font-semibold text-white">
                            {pallet.palletNumber}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              pallet.status === "PICKED"
                                ? "bg-green-500/20 text-green-400"
                                : pallet.status === "DAMAGED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {pallet.status}
                          </span>
                          {pallet.hasDamage && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium flex items-center gap-1">
                              <i className="ri-error-warning-line"></i>
                              DAMAGE
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Location
                            </p>
                            <p className="text-sm font-medium text-white">
                              {pallet.location || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">Items</p>
                            <p className="text-sm font-medium text-white">
                              {pallet.totalItems || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Weight
                            </p>
                            <p className="text-sm font-medium text-white">
                              {pallet.totalWeight || 0} kg
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Picked
                            </p>
                            <p className="text-sm font-medium text-white">
                              {pallet.receivedDate
                                ? format(
                                    new Date(pallet.receivedDate),
                                    "MMM dd, yyyy",
                                  )
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Material Information */}
                        {(pallet.skuNumber ||
                          pallet.batchNumber ||
                          pallet.expiryDate ||
                          pallet.materialNumber) && (
                          <div className="mt-3 pt-3 border-t border-[#374151]">
                            <p className="text-xs text-[#9ca3af] mb-2 font-medium">
                              Material Information
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {pallet.skuNumber && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    SKU Number
                                  </p>
                                  <p className="text-sm font-medium text-white font-mono">
                                    {pallet.skuNumber}
                                  </p>
                                </div>
                              )}
                              {pallet.materialNumber && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Material Number
                                  </p>
                                  <p className="text-sm font-medium text-white font-mono">
                                    {pallet.materialNumber}
                                  </p>
                                </div>
                              )}
                              {pallet.batchNumber && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Batch Number
                                  </p>
                                  <p className="text-sm font-medium text-white font-mono">
                                    {pallet.batchNumber}
                                  </p>
                                </div>
                              )}
                              {pallet.expiryDate && (
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Expiry Date
                                  </p>
                                  <p
                                    className={`text-sm font-medium ${
                                      new Date(pallet.expiryDate) < new Date()
                                        ? "text-red-400"
                                        : new Date(pallet.expiryDate) <
                                            new Date(
                                              new Date().setMonth(
                                                new Date().getMonth() + 3,
                                              ),
                                            )
                                          ? "text-yellow-400"
                                          : "text-white"
                                    }`}
                                  >
                                    {format(
                                      new Date(pallet.expiryDate),
                                      "MMM dd, yyyy",
                                    )}
                                    {new Date(pallet.expiryDate) <
                                      new Date() && (
                                      <span className="ml-2 text-xs text-red-400">
                                        (Expired)
                                      </span>
                                    )}
                                    {new Date(pallet.expiryDate) >=
                                      new Date() &&
                                      new Date(pallet.expiryDate) <
                                        new Date(
                                          new Date().setMonth(
                                            new Date().getMonth() + 3,
                                          ),
                                        ) && (
                                        <span className="ml-2 text-xs text-yellow-400">
                                          (Expiring Soon)
                                        </span>
                                      )}
                                  </p>
                                </div>
                              )}
                            </div>
                            {pallet.materialDescription && (
                              <div className="mt-2">
                                <p className="text-xs text-[#9ca3af] mb-1">
                                  Material Description
                                </p>
                                <p className="text-sm text-white">
                                  {pallet.materialDescription}
                                </p>
                              </div>
                            )}
                            {pallet.quantity && pallet.unitOfMeasure && (
                              <div className="mt-2">
                                <p className="text-xs text-[#9ca3af] mb-1">
                                  Quantity
                                </p>
                                <p className="text-sm text-white">
                                  {pallet.quantity} {pallet.unitOfMeasure}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {pallet.hasDamage &&
                          pallet.damageRecords &&
                          pallet.damageRecords.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#374151]">
                              <button
                                onClick={() => {
                                  setSelectedDamageRecord(
                                    pallet.damageRecords![0],
                                  );
                                  setShowDamagePhotoModal(true);
                                }}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                              >
                                <i className="ri-image-line"></i>
                                View Damage Photos (
                                {pallet.damageRecords.length})
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reuse damage, requests, and preferences from InboundDetail */}
            {activeTab === "damage" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Damage Records
                </h3>
                {pallets.filter((p) => p.hasDamage).length === 0 ? (
                  <div className="text-center py-12 bg-[#111827] border border-[#374151] rounded-lg">
                    <i className="ri-checkbox-circle-line text-6xl text-green-400 mb-4"></i>
                    <p className="text-white font-medium">No damage recorded</p>
                    <p className="text-sm text-[#9ca3af]">
                      All pallets are in good condition
                    </p>
                  </div>
                ) : (
                  pallets
                    .filter((p) => p.hasDamage && p.damageRecords)
                    .flatMap((p) => p.damageRecords!)
                    .map((damage) => (
                      <div
                        key={damage.id}
                        className="bg-[#111827] border border-[#374151] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  damage.severity === "CRITICAL"
                                    ? "bg-red-500/20 text-red-400"
                                    : damage.severity === "MAJOR"
                                      ? "bg-orange-500/20 text-orange-400"
                                      : damage.severity === "MODERATE"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {damage.severity}
                              </span>
                              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                                {damage.damageType}
                              </span>
                            </div>
                            <p className="text-sm text-white mb-1">
                              {damage.damageDescription}
                            </p>
                            <p className="text-xs text-[#9ca3af]">
                              Affected Items: {damage.affectedItems || 0} |
                              Reported:{" "}
                              {format(
                                new Date(damage.reportedAt),
                                "MMM dd, yyyy HH:mm",
                              )}
                            </p>
                          </div>
                          {damage.photos && damage.photos.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedDamageRecord(damage);
                                setShowDamagePhotoModal(true);
                              }}
                              className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-xs font-medium hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                            >
                              <i className="ri-image-line"></i>
                              View Photos ({damage.photos.length})
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {activeTab === "requests" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Service Requests
                  </h3>
                  <button
                    onClick={() => setShowServiceRequestModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <i className="ri-add-line"></i>
                    New Request
                  </button>
                </div>
                {serviceRequests.length === 0 ? (
                  <div className="text-center py-12 bg-[#111827] border border-[#374151] rounded-lg">
                    <i className="ri-customer-service-line text-6xl text-[#6b7280] mb-4"></i>
                    <p className="text-white font-medium mb-2">
                      No service requests
                    </p>
                    <p className="text-sm text-[#9ca3af] mb-4">
                      Create a service request to get help or report an issue
                    </p>
                    <button
                      onClick={() => setShowServiceRequestModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Create Service Request
                    </button>
                  </div>
                ) : (
                  serviceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#111827] border border-[#374151] rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-semibold text-white">
                              {request.requestNumber}
                            </h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                request.status === "RESOLVED"
                                  ? "bg-green-500/20 text-green-400"
                                  : request.status === "IN_PROGRESS"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {request.status}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                request.priority === "URGENT"
                                  ? "bg-red-500/20 text-red-400"
                                  : request.priority === "HIGH"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {request.priority}
                            </span>
                          </div>
                          <p className="text-sm text-white mb-1">
                            {request.subject}
                          </p>
                          <p className="text-xs text-[#9ca3af]">
                            {request.category} | Created:{" "}
                            {format(
                              new Date(request.requestedAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "compliance" && (
              <div className="space-y-6">
                {/* Executive Dashboard Header */}
                {(() => {
                  const overallCompliant =
                    slaComplianceResults.every(
                      (sla) => sla.status === "COMPLIANT",
                    ) && kpiResults.every((kpi) => kpi.status === "met");
                  const hasCritical =
                    slaComplianceResults.some(
                      (sla) => sla.status === "CRITICAL",
                    ) || kpiResults.some((kpi) => kpi.status === "critical");
                  const overallCompliance =
                    slaComplianceResults.length > 0
                      ? slaComplianceResults.reduce(
                          (sum, sla) => sum + sla.compliancePercentage,
                          0,
                        ) / slaComplianceResults.length
                      : 100;
                  const metSLAs = slaComplianceResults.filter(
                    (s) => s.status === "COMPLIANT",
                  ).length;
                  const metKPIs = kpiResults.filter(
                    (k) => k.status === "met",
                  ).length;
                  const warnings =
                    slaComplianceResults.filter((s) => s.status === "WARNING")
                      .length +
                    kpiResults.filter((k) => k.status === "warning").length;

                  return (
                    <div className="bg-gradient-to-r from-[#0a0f1a] to-[#111827] border border-[#374151] rounded-xl p-6 mb-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            Compliance Dashboard
                          </h2>
                          <p className="text-sm text-[#9ca3af]">
                            Order #{order.documentNumber || order.id} • Last
                            Updated: {format(new Date(), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-[#9ca3af] mb-1">
                              Overall Compliance
                            </p>
                            <p
                              className={`text-4xl font-bold ${
                                overallCompliant
                                  ? "text-green-400"
                                  : hasCritical
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {overallCompliance.toFixed(0)}%
                            </p>
                          </div>
                          <div
                            className={`px-5 py-3 rounded-xl ${
                              overallCompliant
                                ? "bg-green-500/20 border-2 border-green-500/30"
                                : hasCritical
                                  ? "bg-red-500/20 border-2 border-red-500/30"
                                  : "bg-yellow-500/20 border-2 border-yellow-500/30"
                            }`}
                          >
                            <span
                              className={`text-sm font-bold ${
                                overallCompliant
                                  ? "text-green-400"
                                  : hasCritical
                                    ? "text-red-400"
                                    : "text-yellow-400"
                              }`}
                            >
                              {overallCompliant
                                ? "FULLY COMPLIANT"
                                : hasCritical
                                  ? "CRITICAL"
                                  : "WARNING"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-[#0a0f1a] border border-[#374151] rounded-lg p-4 hover:border-cyan-500/50 transition-colors">
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total SLAs
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {slaComplianceResults.length}
                          </p>
                          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <i className="ri-checkbox-circle-line"></i>
                            {metSLAs} Met
                          </p>
                        </div>
                        <div className="bg-[#0a0f1a] border border-[#374151] rounded-lg p-4 hover:border-purple-500/50 transition-colors">
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Total KPIs
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {kpiResults.length}
                          </p>
                          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <i className="ri-checkbox-circle-line"></i>
                            {metKPIs} Met
                          </p>
                        </div>
                        <div className="bg-[#0a0f1a] border border-[#374151] rounded-lg p-4 hover:border-yellow-500/50 transition-colors">
                          <p className="text-xs text-[#9ca3af] mb-1">
                            Risk Level
                          </p>
                          <p
                            className={`text-2xl font-bold ${
                              hasCritical
                                ? "text-red-400"
                                : warnings > 0
                                  ? "text-yellow-400"
                                  : "text-green-400"
                            }`}
                          >
                            {hasCritical
                              ? "HIGH"
                              : warnings > 0
                                ? "MEDIUM"
                                : "LOW"}
                          </p>
                          <p className="text-xs text-[#9ca3af] mt-1">
                            {warnings} warning{warnings !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="bg-[#0a0f1a] border border-[#374151] rounded-lg p-4 hover:border-blue-500/50 transition-colors">
                          <p className="text-xs text-[#9ca3af] mb-1">Trend</p>
                          <div className="flex items-center gap-2">
                            <i className="ri-arrow-up-line text-green-400 text-xl"></i>
                            <p className="text-2xl font-bold text-green-400">
                              +5.2%
                            </p>
                          </div>
                          <p className="text-xs text-[#9ca3af] mt-1">
                            vs last period
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Processing Times */}
                <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i className="ri-time-line text-blue-400"></i>
                    Processing Times
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Picking Duration
                      </p>
                      <p className="text-sm font-medium text-white">
                        {Math.floor(calculatedDurations.picking / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">QC Duration</p>
                      <p className="text-sm font-medium text-white">
                        {Math.floor(calculatedDurations.qc / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9ca3af] mb-1">
                        Total Processing
                      </p>
                      <p className="text-sm font-medium text-white">
                        {Math.floor(calculatedDurations.total / 60)} minutes
                      </p>
                    </div>
                  </div>
                </div>

                {/* SLA & KPI Compliance */}
                <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <i className="ri-shield-check-line text-cyan-400 text-2xl"></i>
                      SLA & KPI Compliance
                    </h3>
                  </div>

                  {/* SLA Compliance Results */}
                  {slaComplianceResults.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                        <i className="ri-time-line text-blue-400"></i>
                        Service Level Agreements (SLA)
                      </h4>
                      <div className="space-y-5">
                        {slaComplianceResults.map((sla) => {
                          const percentage = sla.compliancePercentage;
                          const isCompliant = sla.status === "COMPLIANT";
                          const isWarning = sla.status === "WARNING";
                          const isCritical = sla.status === "CRITICAL";
                          const variance =
                            sla.actualDuration - sla.targetDuration;
                          const variancePercent =
                            (variance / sla.targetDuration) * 100;
                          const responsibility =
                            (sla as any).responsibility || "warehouse"; // Default to warehouse

                          return (
                            <div
                              key={sla.slaId}
                              className="bg-[#0a0f1a] border border-[#374151] rounded-xl p-6 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                            >
                              <div className="flex items-start justify-between mb-5">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-lg font-bold text-white">
                                      {sla.slaName}
                                    </h5>
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        responsibility === "customer"
                                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      }`}
                                    >
                                      {responsibility === "customer"
                                        ? "CUSTOMER"
                                        : "WAREHOUSE"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Contract: {sla.customerName} (
                                    {sla.customerNumber})
                                  </p>
                                  <p className="text-xs text-[#6b7280]">
                                    {(sla as any).slaDescription ||
                                      "Service level agreement for processing time"}
                                  </p>
                                </div>
                                <span
                                  className={`px-4 py-2 rounded-lg text-xs font-bold ${
                                    isCompliant
                                      ? "bg-green-500/20 text-green-400 border-2 border-green-500/30"
                                      : isWarning
                                        ? "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30"
                                        : "bg-red-500/20 text-red-400 border-2 border-red-500/30"
                                  }`}
                                >
                                  {sla.status}
                                </span>
                              </div>

                              {/* Dual Progress Bars - Target vs Actual */}
                              <div className="space-y-3 mb-5">
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-[#9ca3af]">
                                      Target Duration
                                    </span>
                                    <span className="text-xs font-bold text-white">
                                      {Math.floor(sla.targetDuration / 3600)}h{" "}
                                      {Math.floor(
                                        (sla.targetDuration % 3600) / 60,
                                      )}
                                      m
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-[#111827] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-500/30 to-cyan-400/30"
                                      style={{ width: "100%" }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-[#9ca3af]">
                                      Actual Duration
                                    </span>
                                    <span
                                      className={`text-xs font-bold ${
                                        isCompliant
                                          ? "text-green-400"
                                          : isWarning
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                      }`}
                                    >
                                      {Math.floor(sla.actualDuration / 3600)}h{" "}
                                      {Math.floor(
                                        (sla.actualDuration % 3600) / 60,
                                      )}
                                      m
                                      {variance > 0 && (
                                        <span className="ml-1 text-red-400">
                                          ↑ +{Math.floor(variance / 60)}m
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="w-full h-2.5 bg-[#111827] rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isCompliant
                                          ? "bg-gradient-to-r from-green-500 to-green-400"
                                          : isWarning
                                            ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                            : "bg-gradient-to-r from-red-500 to-red-400"
                                      }`}
                                      style={{
                                        width: `${Math.min((sla.actualDuration / sla.targetDuration) * 100, 150)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Metrics Grid with Variance */}
                              <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#374151]">
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Compliance
                                  </p>
                                  <p
                                    className={`text-2xl font-bold ${
                                      isCompliant
                                        ? "text-green-400"
                                        : isWarning
                                          ? "text-yellow-400"
                                          : "text-red-400"
                                    }`}
                                  >
                                    {percentage.toFixed(1)}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Variance
                                  </p>
                                  <p
                                    className={`text-2xl font-bold ${
                                      variance <= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {variance <= 0 ? "-" : "+"}
                                    {Math.abs(Math.floor(variance / 60))}m
                                  </p>
                                  <p className="text-xs text-[#6b7280] mt-1">
                                    {Math.abs(variancePercent).toFixed(1)}%{" "}
                                    {variance > 0 ? "over" : "under"} target
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#9ca3af] mb-1">
                                    Trend
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <i
                                      className={`ri-arrow-${variance <= 0 ? "down" : "up"}-line ${
                                        variance <= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      } text-xl`}
                                    ></i>
                                    <p
                                      className={`text-2xl font-bold ${
                                        variance <= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }`}
                                    >
                                      {Math.abs(variancePercent).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {sla.breachReason && (
                                <div className="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <p className="text-xs text-red-400 flex items-center gap-2">
                                    <i className="ri-alert-line text-base"></i>
                                    <span className="font-bold">
                                      Breach Reason:
                                    </span>{" "}
                                    {sla.breachReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* KPI Results */}
                  {kpiResults.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                        <i className="ri-bar-chart-line text-purple-400"></i>
                        Key Performance Indicators (KPI)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {kpiResults.map((kpi) => {
                          // Calculate percentage based on KPI type
                          let percentage = 0;
                          let displayValue = kpi.value;
                          let displayTarget = kpi.target;
                          let unit = "";

                          if (
                            kpi.kpiId === "kpi-picking-efficiency" ||
                            kpi.kpiId === "kpi-qc-efficiency" ||
                            kpi.kpiId === "kpi-dispatching-efficiency" ||
                            kpi.kpiId === "kpi-total-processing-efficiency"
                          ) {
                            percentage = kpi.value;
                            unit = "%";
                          } else if (kpi.kpiId === "kpi-damage") {
                            percentage = kpi.value;
                            unit = "%";
                          } else if (kpi.kpiId === "kpi-order-accuracy") {
                            percentage =
                              kpi.target > 0
                                ? ((kpi.target - kpi.value) / kpi.target) * 100
                                : 0;
                            unit = "%";
                          } else {
                            percentage = (kpi.value / kpi.target) * 100;
                          }

                          const isMet = kpi.status === "met";
                          const isWarning = kpi.status === "warning";
                          const isCritical = kpi.status === "critical";

                          // Get KPI name, description, and type (internal vs customer-facing)
                          const getKPIDetails = (kpiId: string) => {
                            switch (kpiId) {
                              case "kpi-picking-efficiency":
                                return {
                                  name: "Picking Efficiency",
                                  desc: "Time efficiency for picking process",
                                  type: "internal" as "internal" | "customer",
                                };
                              case "kpi-qc-efficiency":
                                return {
                                  name: "QC Efficiency",
                                  desc: "Time efficiency for quality control process",
                                  type: "internal" as "internal" | "customer",
                                };
                              case "kpi-dispatching-efficiency":
                                return {
                                  name: "Dispatching Efficiency",
                                  desc: "Time efficiency for dispatching process",
                                  type: "internal" as "internal" | "customer",
                                };
                              case "kpi-total-processing-efficiency":
                                return {
                                  name: "Total Processing Efficiency",
                                  desc: "Overall processing time efficiency",
                                  type: "internal" as "internal" | "customer",
                                };
                              case "kpi-damage":
                                return {
                                  name: "Damage",
                                  desc: "Percentage and count of damaged pallets",
                                  type: "customer" as "internal" | "customer",
                                };
                              case "kpi-order-accuracy":
                                return {
                                  name: "Order Accuracy",
                                  desc: "Variance between expected and picked quantity",
                                  type: "customer" as "internal" | "customer",
                                };
                              default:
                                return {
                                  name: "KPI",
                                  desc: "Performance indicator",
                                  type: "internal" as "internal" | "customer",
                                };
                            }
                          };

                          const kpiDetails = getKPIDetails(kpi.kpiId);

                          return (
                            <div
                              key={kpi.kpiId}
                              className="bg-[#0a0f1a] border border-[#374151] rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                            >
                              <div className="flex items-start justify-between mb-5">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="text-base font-bold text-white">
                                      {kpiDetails.name}
                                    </h5>
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        kpiDetails.type === "internal"
                                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                      }`}
                                    >
                                      {kpiDetails.type === "internal" ? (
                                        <span className="flex items-center gap-1">
                                          <i className="ri-user-line"></i>
                                          INTERNAL
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <i className="ri-customer-service-line"></i>
                                          CUSTOMER
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#9ca3af]">
                                    {kpiDetails.desc}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                    isMet
                                      ? "bg-green-500/20 text-green-400 border-2 border-green-500/30"
                                      : isWarning
                                        ? "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30"
                                        : "bg-red-500/20 text-red-400 border-2 border-red-500/30"
                                  }`}
                                >
                                  {kpi.status.toUpperCase()}
                                </span>
                              </div>

                              {/* Gauge Chart (Semi-Circle) */}
                              <div className="flex items-center justify-center mb-5">
                                <div className="relative w-32 h-16">
                                  <svg
                                    className="transform w-32 h-16"
                                    viewBox="0 0 100 50"
                                  >
                                    {/* Background Arc */}
                                    <path
                                      d="M 10 40 A 40 40 0 0 1 90 40"
                                      fill="none"
                                      stroke="#111827"
                                      strokeWidth="8"
                                      strokeLinecap="round"
                                    />
                                    {/* Progress Arc */}
                                    <path
                                      d="M 10 40 A 40 40 0 0 1 90 40"
                                      fill="none"
                                      stroke={
                                        isMet
                                          ? "#10b981"
                                          : isWarning
                                            ? "#f59e0b"
                                            : "#ef4444"
                                      }
                                      strokeWidth="8"
                                      strokeLinecap="round"
                                      strokeDasharray={`${Math.PI * 40}`}
                                      strokeDashoffset={`${Math.PI * 40 * (1 - Math.min(Math.max(percentage, 0), 100) / 100)}`}
                                      className="transition-all duration-500"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                      <p
                                        className={`text-2xl font-bold ${
                                          isMet
                                            ? "text-green-400"
                                            : isWarning
                                              ? "text-yellow-400"
                                              : "text-red-400"
                                        }`}
                                      >
                                        {Math.max(
                                          0,
                                          Math.min(percentage, 100),
                                        ).toFixed(0)}
                                        %
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Metrics with Comparison Bars */}
                              <div className="space-y-3 pt-5 border-t border-[#374151]">
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-[#9ca3af]">
                                      Actual
                                    </span>
                                    <span
                                      className={`text-sm font-bold ${
                                        isMet
                                          ? "text-green-400"
                                          : isWarning
                                            ? "text-yellow-400"
                                            : "text-red-400"
                                      }`}
                                    >
                                      {displayValue.toFixed(1)}
                                      {unit}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        isMet
                                          ? "bg-green-500"
                                          : isWarning
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${Math.min((displayValue / displayTarget) * 100, 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-semibold text-[#9ca3af]">
                                      Target
                                    </span>
                                    <span className="text-sm font-bold text-white">
                                      {displayTarget.toFixed(1)}
                                      {unit}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-cyan-500/30"
                                      style={{ width: "100%" }}
                                    />
                                  </div>
                                </div>
                                {kpi.kpiId === "kpi-damage" &&
                                  (kpi as any).damageCount !== undefined && (
                                    <div className="pt-2 border-t border-[#374151]">
                                      <p className="text-xs text-[#6b7280] mb-1">
                                        Pallet Count
                                      </p>
                                      <p className="text-sm font-bold text-white">
                                        {(kpi as any).damageCount} of{" "}
                                        {(kpi as any).totalPallets || 0} pallets
                                      </p>
                                    </div>
                                  )}
                              </div>

                              {/* Damage Alert */}
                              {kpi.kpiId === "kpi-damage" && kpi.value > 0 && (
                                <div className="mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <p className="text-xs text-red-400 flex items-center gap-2">
                                    <i className="ri-error-warning-line text-base"></i>
                                    <span className="font-bold">
                                      {(kpi as any).damageCount || 0} pallet
                                      {((kpi as any).damageCount || 0) > 1
                                        ? "s"
                                        : ""}{" "}
                                      damaged ({kpi.value.toFixed(1)}% damage
                                      rate)
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing Flow & Modification History */}
                <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <i className="ri-flow-chart text-blue-400 text-2xl"></i>
                    Processing Flow & History
                  </h3>

                  {/* Processing Flow Events - Gantt Style */}
                  {processingFlowEvents.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                        <i className="ri-time-line text-blue-400"></i>
                        Processing Timeline
                      </h4>
                      <div className="space-y-4">
                        {processingFlowEvents.map((event, index) => {
                          const plannedDuration =
                            (event as any).plannedDuration || 0;
                          const actualDuration =
                            (event as any).actualDuration || 0;
                          const maxDuration = Math.max(
                            plannedDuration,
                            actualDuration,
                            60,
                          ); // Minimum 60 minutes for display

                          return (
                            <div key={event.id} className="relative">
                              <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-24">
                                  <p className="text-xs font-semibold text-[#9ca3af] mb-1">
                                    {format(
                                      new Date(event.performedAt),
                                      "HH:mm",
                                    )}
                                  </p>
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      (event as any).status === "completed"
                                        ? "bg-green-400"
                                        : (event as any).status ===
                                            "in-progress"
                                          ? "bg-yellow-400"
                                          : "bg-gray-400"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-white">
                                      {event.eventName}
                                    </p>
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                        (event as any).status === "completed"
                                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                          : (event as any).status ===
                                              "in-progress"
                                            ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                            : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                                      }`}
                                    >
                                      {(event as any).status?.toUpperCase() ||
                                        "PENDING"}
                                    </span>
                                  </div>
                                  <div className="relative h-8 bg-[#111827] rounded-lg overflow-hidden border border-[#374151]">
                                    {/* Planned Duration (Background) */}
                                    {plannedDuration > 0 && (
                                      <div
                                        className="absolute left-0 top-0 h-full bg-cyan-500/20 border-r border-cyan-500/50"
                                        style={{
                                          width: `${(plannedDuration / maxDuration) * 100}%`,
                                        }}
                                      />
                                    )}
                                    {/* Actual Duration (Foreground) */}
                                    {actualDuration > 0 && (
                                      <div
                                        className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                          actualDuration <= plannedDuration
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                        style={{
                                          width: `${(actualDuration / maxDuration) * 100}%`,
                                        }}
                                      />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-bold text-white">
                                        {Math.floor(actualDuration / 60)}m
                                        {actualDuration > plannedDuration && (
                                          <span className="text-red-400 ml-1">
                                            ↑ +
                                            {Math.floor(
                                              (actualDuration -
                                                plannedDuration) /
                                                60,
                                            )}
                                            m
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-[#9ca3af] mt-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {index < processingFlowEvents.length - 1 && (
                                <div className="absolute left-[5.5rem] top-10 w-0.5 h-4 bg-[#374151]" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Modification History - Professional Table */}
                  {modificationHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <i className="ri-history-line text-cyan-400"></i>
                          Modification History
                        </h4>
                        <button
                          onClick={() => {
                            const dataStr = JSON.stringify(
                              modificationHistory,
                              null,
                              2,
                            );
                            const dataBlob = new Blob([dataStr], {
                              type: "application/json",
                            });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `Order-${order.documentNumber || order.id}-ModificationHistory.json`;
                            link.click();
                          }}
                          className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors flex items-center gap-2"
                        >
                          <i className="ri-download-line"></i>
                          Export
                        </button>
                      </div>
                      <div className="bg-[#0a0f1a] border border-[#374151] rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-[#111827] border-b border-[#374151]">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  Timestamp
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  Field
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  Change
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-[#9ca3af] uppercase tracking-wider">
                                  Reason
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#374151]">
                              {modificationHistory.map((history) => (
                                <tr
                                  key={history.id}
                                  className="hover:bg-[#111827] transition-colors"
                                >
                                  <td className="px-4 py-3 text-sm text-white font-mono">
                                    {format(
                                      new Date(history.modifiedAt),
                                      "MMM dd, yyyy HH:mm:ss",
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-white">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center">
                                        <i className="ri-user-line text-blue-400 text-xs"></i>
                                      </div>
                                      {history.modifiedBy}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-[#9ca3af]">
                                    {history.fieldName ||
                                      history.modificationType.replace(
                                        "_",
                                        " ",
                                      )}
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    {history.oldValue && history.newValue ? (
                                      <div className="flex items-center gap-2">
                                        <span className="text-red-400 line-through font-mono">
                                          {history.oldValue}
                                        </span>
                                        <i className="ri-arrow-right-line text-[#6b7280]"></i>
                                        <span className="text-green-400 font-mono">
                                          {history.newValue}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[#6b7280]">
                                        N/A
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-[#9ca3af]">
                                    {history.reason || "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div className="bg-[#111827] border border-[#374151] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Delivery Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-2">
                        Preferred Delivery Date
                      </p>
                      <p className="text-base text-white">
                        {order.preferredDeliveryDate
                          ? format(
                              new Date(order.preferredDeliveryDate),
                              "MMM dd, yyyy",
                            )
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-2">
                        Preferred Delivery Time
                      </p>
                      <p className="text-base text-white">
                        {order.preferredDeliveryTime || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[#9ca3af] mb-2">
                        Delivery Instructions
                      </p>
                      <p className="text-base text-white">
                        {order.deliveryInstructions ||
                          "No special instructions"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeliveryPreferencesModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Update Preferences
                    </button>
                  </div>
                </div>

                {order.carrierPickupRequested && (
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Carrier Pickup
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#9ca3af]">Status</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.carrierPickupStatus === "CONFIRMED"
                              ? "bg-green-500/20 text-green-400"
                              : order.carrierPickupStatus === "IN_TRANSIT"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {order.carrierPickupStatus}
                        </span>
                      </div>
                      {order.wajeepRequestId && (
                        <div>
                          <p className="text-sm text-[#9ca3af] mb-1">
                            Wajeeh Request ID
                          </p>
                          <p className="text-sm text-white font-mono">
                            {order.wajeepRequestId}
                          </p>
                        </div>
                      )}
                      {order.expectedReadinessTime && (
                        <div>
                          <p className="text-sm text-[#9ca3af] mb-1">
                            Expected Readiness
                          </p>
                          <p className="text-sm text-white">
                            {format(
                              new Date(order.expectedReadinessTime),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </p>
                        </div>
                      )}
                      {order.carrierAssigned && (
                        <div>
                          <p className="text-sm text-[#9ca3af] mb-1">
                            Assigned Carrier
                          </p>
                          <p className="text-sm text-white">
                            {order.carrierAssigned}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Reuse modals from InboundDetail */}
      <AnimatePresence>
        {showServiceRequestModal && (
          <ServiceRequestModal
            asn={order}
            onClose={() => setShowServiceRequestModal(false)}
            onSuccess={(request) => {
              setServiceRequests([...serviceRequests, request]);
              setShowServiceRequestModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDamagePhotoModal && selectedDamageRecord && (
          <DamagePhotoModal
            damageRecord={selectedDamageRecord}
            onClose={() => {
              setShowDamagePhotoModal(false);
              setSelectedDamageRecord(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUrgentModal && (
          <UrgentModal
            asn={order}
            onClose={() => setShowUrgentModal(false)}
            onConfirm={handleTagAsUrgent}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCarrierPickupModal && (
          <CarrierPickupModal
            asn={order}
            pallets={pallets}
            onClose={() => setShowCarrierPickupModal(false)}
            onConfirm={handleRequestCarrierPickup}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeliveryPreferencesModal && (
          <DeliveryPreferencesModal
            asn={order}
            onClose={() => setShowDeliveryPreferencesModal(false)}
            onConfirm={handleUpdateDeliveryPreferences}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Reuse modal components from InboundDetail
function ServiceRequestModal({
  asn,
  onClose,
  onSuccess,
}: {
  asn: ASNData;
  onClose: () => void;
  onSuccess: (request: ServiceRequest) => void;
}) {
  const [formData, setFormData] = useState({
    requestType: "SUPPORT" as ServiceRequest["requestType"],
    category: "DELIVERY" as ServiceRequest["category"],
    priority: "MEDIUM" as ServiceRequest["priority"],
    subject: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: ServiceRequest = {
      id: `sr-${Date.now()}`,
      requestNumber: `SR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      asnId: asn.id,
      documentNumber: asn.documentNumber,
      ...formData,
      status: "OPEN",
      requestedBy: "Customer",
      requestedAt: new Date().toISOString(),
      customerVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSuccess(newRequest);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Create Service Request
          </h3>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Request Type
            </label>
            <select
              value={formData.requestType}
              onChange={(e) =>
                setFormData({ ...formData, requestType: e.target.value as any })
              }
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
            >
              <option value="SUPPORT">Support</option>
              <option value="INQUIRY">Inquiry</option>
              <option value="ISSUE">Issue</option>
              <option value="REQUEST">Request</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="FEEDBACK">Feedback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
            >
              <option value="DELIVERY">Delivery</option>
              <option value="DAMAGE">Damage</option>
              <option value="DOCUMENTATION">Documentation</option>
              <option value="BILLING">Billing</option>
              <option value="QUALITY">Quality</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as any })
              }
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[120px]"
              required
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DamagePhotoModal({
  damageRecord,
  onClose,
}: {
  damageRecord: DamageRecord;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Damage Photos</h3>
            <p className="text-sm text-[#9ca3af]">
              {damageRecord.damageDescription}
            </p>
          </div>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-white">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {damageRecord.photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-[#111827] border border-[#374151] rounded-lg overflow-hidden"
              >
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || "Damage photo"}
                  className="w-full h-64 object-cover"
                />
                {photo.caption && (
                  <div className="p-3">
                    <p className="text-sm text-white">{photo.caption}</p>
                    <p className="text-xs text-[#9ca3af] mt-1">
                      Taken:{" "}
                      {format(new Date(photo.takenAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UrgentModal({
  asn,
  onClose,
  onConfirm,
}: {
  asn: ASNData;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151]">
          <h3 className="text-xl font-bold text-white">Mark as Urgent</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Reason for Urgent Tagging
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[100px]"
              placeholder="Please provide a reason for marking this as urgent..."
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
            >
              Mark as Urgent
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CarrierPickupModal({
  asn,
  pallets,
  onClose,
  onConfirm,
}: {
  asn: ASNData;
  pallets: Pallet[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [expectedReadiness, setExpectedReadiness] = useState("");
  const [instructions, setInstructions] = useState("");
  const [splitDelivery, setSplitDelivery] = useState(false);
  const [destinations, setDestinations] = useState<
    Array<{
      id: string;
      customerNumber?: string;
      customerName?: string;
      deliveryCity: string;
      deliveryAddress: string;
      deliveryPostalCode?: string;
      deliveryCountry?: string;
      totalPallets: number;
      totalWeight: number;
      totalVolume: number;
      totalItems: number;
      preferredDeliveryDate?: string;
      preferredDeliveryTime?: string;
      deliveryInstructions?: string;
    }>
  >([
    {
      id: "dest-1",
      deliveryCity: asn.deliveryCity || "",
      deliveryAddress: asn.deliveryAddress || "",
      deliveryPostalCode: asn.deliveryPostalCode || "",
      deliveryCountry: asn.deliveryCountry || "",
      totalPallets: pallets.length,
      totalWeight: asn.totalWeight || 0,
      totalVolume: asn.totalVolume || 0,
      totalItems: asn.totalItems || 0,
    },
  ]);

  // For outbound orders, can always request pickup
  const canRequestPickup = true;

  const addDestination = () => {
    setDestinations([
      ...destinations,
      {
        id: `dest-${Date.now()}`,
        deliveryCity: "",
        deliveryAddress: "",
        deliveryPostalCode: "",
        deliveryCountry: "",
        totalPallets: 0,
        totalWeight: 0,
        totalVolume: 0,
        totalItems: 0,
      },
    ]);
  };

  const removeDestination = (id: string) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((d) => d.id !== id));
    }
  };

  const updateDestination = (id: string, field: string, value: any) => {
    setDestinations(
      destinations.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151] flex items-center justify-between bg-gradient-to-r from-green-600/10 to-emerald-600/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <img
                src="/wajeeh-logo.svg"
                alt="Wajeeh"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Request Carrier Pickup
              </h3>
              <p className="text-sm text-[#9ca3af] mt-1">
                Schedule pickup via Wajeeh platform
              </p>
            </div>
          </div>
          <button
            onClick={() => setSplitDelivery(!splitDelivery)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              splitDelivery
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-[#374151] text-[#9ca3af] hover:bg-[#4b5563]"
            }`}
          >
            <i
              className={
                splitDelivery ? "ri-links-line" : "ri-link-unlink-line"
              }
            ></i>
            {splitDelivery ? "Split Delivery" : "Single Delivery"}
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4">
            <p className="text-xs text-[#9ca3af] mb-2">Order Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-white">
              <div>
                <span className="text-[#9ca3af]">Document:</span>{" "}
                {asn.documentNumber}
              </div>
              <div>
                <span className="text-[#9ca3af]">Pallets:</span>{" "}
                {pallets.length}
              </div>
              <div>
                <span className="text-[#9ca3af]">Total Weight:</span>{" "}
                {asn.totalWeight || 0} kg
              </div>
              <div>
                <span className="text-[#9ca3af]">Total Volume:</span>{" "}
                {asn.totalVolume || 0} m³
              </div>
              <div>
                <span className="text-[#9ca3af]">Destination:</span>{" "}
                {asn.destination}
              </div>
            </div>
          </div>

          {/* Split Delivery or Single Delivery */}
          {splitDelivery ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">
                  Multiple Delivery Destinations
                </h4>
                <button
                  onClick={addDestination}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  Add Destination
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {destinations.map((dest, index) => (
                  <div
                    key={dest.id}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-sm font-semibold text-white">
                        Destination {index + 1}
                      </h5>
                      {destinations.length > 1 && (
                        <button
                          onClick={() => removeDestination(dest.id)}
                          className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Customer Number
                        </label>
                        <input
                          type="text"
                          value={dest.customerNumber || ""}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "customerNumber",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={dest.customerName || ""}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "customerName",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Delivery City *
                        </label>
                        <input
                          type="text"
                          value={dest.deliveryCity}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "deliveryCity",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Postal/ZIP Code
                        </label>
                        <input
                          type="text"
                          value={dest.deliveryPostalCode || ""}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "deliveryPostalCode",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Delivery Address *
                        </label>
                        <textarea
                          value={dest.deliveryAddress}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "deliveryAddress",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm min-h-[60px]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={dest.deliveryCountry || ""}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "deliveryCountry",
                              e.target.value,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Number of Pallets
                        </label>
                        <input
                          type="number"
                          value={dest.totalPallets}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "totalPallets",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={dest.totalWeight}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "totalWeight",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Volume (m³)
                        </label>
                        <input
                          type="number"
                          value={dest.totalVolume}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "totalVolume",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#9ca3af] mb-1">
                          Items
                        </label>
                        <input
                          type="number"
                          value={dest.totalItems}
                          onChange={(e) =>
                            updateDestination(
                              dest.id,
                              "totalItems",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full bg-[#0a0f1a] border border-[#374151] rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">
                Delivery Address
              </h4>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Delivery City *
                </label>
                <input
                  type="text"
                  value={destinations[0].deliveryCity}
                  onChange={(e) =>
                    updateDestination(
                      destinations[0].id,
                      "deliveryCity",
                      e.target.value,
                    )
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                  placeholder="Enter delivery city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">
                  Delivery Address *
                </label>
                <textarea
                  value={destinations[0].deliveryAddress}
                  onChange={(e) =>
                    updateDestination(
                      destinations[0].id,
                      "deliveryAddress",
                      e.target.value,
                    )
                  }
                  className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[80px]"
                  placeholder="Enter full delivery address (street, building, etc.)"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">
                    Postal/ZIP Code
                  </label>
                  <input
                    type="text"
                    value={destinations[0].deliveryPostalCode || ""}
                    onChange={(e) =>
                      updateDestination(
                        destinations[0].id,
                        "deliveryPostalCode",
                        e.target.value,
                      )
                    }
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                    placeholder="Postal/ZIP code"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#9ca3af] mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={destinations[0].deliveryCountry || ""}
                    onChange={(e) =>
                      updateDestination(
                        destinations[0].id,
                        "deliveryCountry",
                        e.target.value,
                      )
                    }
                    className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Expected Readiness Time *
            </label>
            <input
              type="datetime-local"
              value={expectedReadiness}
              onChange={(e) => setExpectedReadiness(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
              required
              disabled={!canRequestPickup}
            />
            <p className="text-xs text-[#9ca3af] mt-1">
              When will the order be ready for pickup?
            </p>
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Special Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[80px]"
              placeholder="Any special instructions for the carrier..."
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onConfirm}
              disabled={
                !canRequestPickup ||
                !expectedReadiness ||
                destinations.some((d) => !d.deliveryCity || !d.deliveryAddress)
              }
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-truck-line"></i>
              {splitDelivery
                ? `Request Pickup (${destinations.length} destinations)`
                : "Request Pickup"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeliveryPreferencesModal({
  asn,
  onClose,
  onConfirm,
}: {
  asn: ASNData;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [instructions, setInstructions] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-[#1f2937] border border-[#374151] rounded-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#374151]">
          <h3 className="text-xl font-bold text-white">
            Update Delivery Preferences
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Preferred Delivery Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Preferred Delivery Time
            </label>
            <input
              type="text"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white"
              placeholder="e.g., 09:00-12:00 or Morning/Afternoon"
            />
          </div>
          <div>
            <label className="block text-sm text-[#9ca3af] mb-2">
              Delivery Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-white min-h-[100px]"
              placeholder="Any special delivery instructions..."
            />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Update Preferences
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#374151] hover:bg-[#4b5563] text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
