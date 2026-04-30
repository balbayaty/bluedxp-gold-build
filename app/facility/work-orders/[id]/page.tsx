"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import WorkOrderDetailView from "@/components/facility/WorkOrderDetailView";
import { RiLoaderLine } from "react-icons/ri";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useApiFetch } from "@/hooks/useApiFetch";

function WorkOrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const workOrderId = params.id as string;
  const {
    data: workOrder,
    loading,
    error,
    errorMessage,
    fetchData,
  } = useApiFetch({
    module: "facility",
    service: "work-orders",
    retries: 2,
  });
  const { handleError } = useErrorHandler({
    module: "facility",
    service: "work-orders",
  });

  useEffect(() => {
    if (workOrderId) {
      fetchData(`/api/facility/work-orders/${workOrderId}`);
    }
  }, [workOrderId, fetchData]);

  const handleApprove = async () => {
    try {
      const response = await fetch(
        `/api/facility/work-orders/${workOrderId}/approve`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        await fetchData(`/api/facility/work-orders/${workOrderId}`);
      } else {
        handleError(new Error(data.error || "Failed to approve work order"), {
          code: "WORK_ORDER_APPROVE_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to approve work order"),
        {
          code: "WORK_ORDER_APPROVE_ERROR",
          retryable: true,
        },
      );
    }
  };

  const handleAssign = async () => {
    try {
      const response = await fetch(
        `/api/facility/work-orders/${workOrderId}/assign`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        await fetchData(`/api/facility/work-orders/${workOrderId}`);
      } else {
        handleError(new Error(data.error || "Failed to assign work order"), {
          code: "WORK_ORDER_ASSIGN_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to assign work order"),
        {
          code: "WORK_ORDER_ASSIGN_ERROR",
          retryable: true,
        },
      );
    }
  };

  const handleComplete = async () => {
    try {
      const response = await fetch(
        `/api/facility/work-orders/${workOrderId}/complete`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        await fetchData(`/api/facility/work-orders/${workOrderId}`);
      } else {
        handleError(new Error(data.error || "Failed to complete work order"), {
          code: "WORK_ORDER_COMPLETE_ERROR",
          retryable: true,
        });
      }
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to complete work order"),
        {
          code: "WORK_ORDER_COMPLETE_ERROR",
          retryable: true,
        },
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RiLoaderLine className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading work order details...</p>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Work Order
          </h2>
          <p className="text-gray-500 mb-4">
            {errorMessage || "Work order not found"}
          </p>
          <button
            onClick={() =>
              fetchData(`/api/facility/work-orders/${workOrderId}`)
            }
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <WorkOrderDetailView
        workOrder={workOrder}
        onEdit={() => {
          router.push(`/facility/work-orders/${workOrderId}/edit`);
        }}
        onClose={() => {
          router.push("/facility/work-orders");
        }}
        onApprove={handleApprove}
        onAssign={handleAssign}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default function WorkOrderDetailPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error Loading Work Order
            </h2>
            <p className="text-gray-500">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </div>
      }
    >
      <WorkOrderDetailContent />
    </ErrorBoundary>
  );
}
