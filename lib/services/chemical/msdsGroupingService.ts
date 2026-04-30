/**
 * MSDS Grouping Service
 * Provides smart grouping functionality for MSDS submissions
 */

import { MSDSSubmission } from "@/types/msds";

export type GroupByOption =
  | "none"
  | "manufacturer"
  | "hazardLevel"
  | "date"
  | "customer"
  | "status";

export interface GroupedSubmissions {
  groupKey: string;
  groupLabel: string;
  submissions: MSDSSubmission[];
  count: number;
  metadata?: {
    icon?: string;
    color?: string;
    description?: string;
  };
}

export class MSDSGroupingService {
  /**
   * Group submissions by manufacturer
   */
  groupByManufacturer(submissions: MSDSSubmission[]): GroupedSubmissions[] {
    const groups = new Map<string, MSDSSubmission[]>();

    submissions.forEach((sub) => {
      const manufacturer =
        sub.extractedData?.manufacturer || "Unknown Manufacturer";
      if (!groups.has(manufacturer)) {
        groups.set(manufacturer, []);
      }
      groups.get(manufacturer)!.push(sub);
    });

    return Array.from(groups.entries())
      .map(([manufacturer, subs]) => ({
        groupKey: `manufacturer-${manufacturer}`,
        groupLabel: manufacturer,
        submissions: subs,
        count: subs.length,
        metadata: {
          icon: "ri-building-line",
          color: "cyan",
          description: `${subs.length} submission${subs.length !== 1 ? "s" : ""} from ${manufacturer}`,
        },
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }

  /**
   * Group submissions by hazard level
   */
  groupByHazardLevel(submissions: MSDSSubmission[]): GroupedSubmissions[] {
    const groups = new Map<string, MSDSSubmission[]>();

    submissions.forEach((sub) => {
      const hazardLevel = sub.extractedData?.hazardLevel || "Medium";
      if (!groups.has(hazardLevel)) {
        groups.set(hazardLevel, []);
      }
      groups.get(hazardLevel)!.push(sub);
    });

    const order = ["High", "Medium", "Low"];
    return Array.from(groups.entries())
      .map(([hazardLevel, subs]) => ({
        groupKey: `hazard-${hazardLevel}`,
        groupLabel: `${hazardLevel} Risk`,
        submissions: subs,
        count: subs.length,
        metadata: {
          icon:
            hazardLevel === "High"
              ? "ri-alert-line"
              : hazardLevel === "Medium"
                ? "ri-information-line"
                : "ri-checkbox-circle-line",
          color:
            hazardLevel === "High"
              ? "red"
              : hazardLevel === "Medium"
                ? "orange"
                : "green",
          description: `${subs.length} ${hazardLevel.toLowerCase()} risk submission${subs.length !== 1 ? "s" : ""}`,
        },
      }))
      .sort((a, b) => {
        const aIndex = order.indexOf(a.groupLabel.replace(" Risk", ""));
        const bIndex = order.indexOf(b.groupLabel.replace(" Risk", ""));
        return aIndex - bIndex;
      });
  }

  /**
   * Group submissions by date
   */
  groupByDate(submissions: MSDSSubmission[]): GroupedSubmissions[] {
    const groups = new Map<string, MSDSSubmission[]>();
    const dateLabels = new Map<string, string>();

    submissions.forEach((sub) => {
      const date = new Date(sub.submittedDate);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      let dateLabel: string;

      if (date.toDateString() === today.toDateString()) {
        dateKey = "today";
        dateLabel = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "yesterday";
        dateLabel = "Yesterday";
      } else {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        if (date >= weekAgo) {
          dateKey = "this-week";
          dateLabel = "This Week";
        } else if (date >= monthAgo) {
          dateKey = "this-month";
          dateLabel = "This Month";
        } else {
          dateKey = `month-${date.getFullYear()}-${date.getMonth()}`;
          dateLabel = date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });
        }
      }

      dateLabels.set(dateKey, dateLabel);

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(sub);
    });

    const order = ["today", "yesterday", "this-week", "this-month"];
    return Array.from(groups.entries())
      .map(([dateKey, subs]) => ({
        groupKey: `date-${dateKey}`,
        groupLabel: subs[0]?.submittedDate
          ? order.includes(dateKey)
            ? dateLabels.get(dateKey) || "Unknown"
            : new Date(subs[0].submittedDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
          : dateLabels.get(dateKey) || "Unknown",
        submissions: subs.sort(
          (a, b) => b.submittedDate.getTime() - a.submittedDate.getTime(),
        ),
        count: subs.length,
        metadata: {
          icon: "ri-calendar-line",
          color: "blue",
          description: `${subs.length} submission${subs.length !== 1 ? "s" : ""}`,
        },
      }))
      .sort((a, b) => {
        const aIndex = order.indexOf(a.groupKey.replace("date-", ""));
        const bIndex = order.indexOf(b.groupKey.replace("date-", ""));
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return (
          b.submissions[0]?.submittedDate.getTime() ||
          0 - (a.submissions[0]?.submittedDate.getTime() || 0)
        );
      });
  }

  /**
   * Group submissions by customer
   */
  groupByCustomer(submissions: MSDSSubmission[]): GroupedSubmissions[] {
    const groups = new Map<string, MSDSSubmission[]>();

    submissions.forEach((sub) => {
      const customerName =
        (sub as any).customerName ||
        (sub as any).customerId ||
        "Unknown Customer";
      if (!groups.has(customerName)) {
        groups.set(customerName, []);
      }
      groups.get(customerName)!.push(sub);
    });

    return Array.from(groups.entries())
      .map(([customerName, subs]) => ({
        groupKey: `customer-${customerName}`,
        groupLabel: customerName,
        submissions: subs,
        count: subs.length,
        metadata: {
          icon: "ri-user-line",
          color: "purple",
          description: `${subs.length} submission${subs.length !== 1 ? "s" : ""} from ${customerName}`,
        },
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Group submissions by status
   */
  groupByStatus(submissions: MSDSSubmission[]): GroupedSubmissions[] {
    const groups = new Map<string, MSDSSubmission[]>();

    submissions.forEach((sub) => {
      const status = sub.status;
      if (!groups.has(status)) {
        groups.set(status, []);
      }
      groups.get(status)!.push(sub);
    });

    const order = ["review", "approved", "rejected", "analyzing", "uploading"];
    return Array.from(groups.entries())
      .map(([status, subs]) => ({
        groupKey: `status-${status}`,
        groupLabel: status.charAt(0).toUpperCase() + status.slice(1),
        submissions: subs,
        count: subs.length,
        metadata: {
          icon:
            status === "approved"
              ? "ri-checkbox-circle-line"
              : status === "rejected"
                ? "ri-close-circle-line"
                : status === "review"
                  ? "ri-eye-line"
                  : "ri-loader-line",
          color:
            status === "approved"
              ? "green"
              : status === "rejected"
                ? "red"
                : status === "review"
                  ? "yellow"
                  : "blue",
          description: `${subs.length} ${status} submission${subs.length !== 1 ? "s" : ""}`,
        },
      }))
      .sort((a, b) => {
        const aIndex = order.indexOf(a.groupKey.replace("status-", ""));
        const bIndex = order.indexOf(b.groupKey.replace("status-", ""));
        return aIndex - bIndex;
      });
  }

  /**
   * Group submissions based on option
   */
  groupSubmissions(
    submissions: MSDSSubmission[],
    groupBy: GroupByOption,
  ): GroupedSubmissions[] | null {
    if (groupBy === "none") return null;

    switch (groupBy) {
      case "manufacturer":
        return this.groupByManufacturer(submissions);
      case "hazardLevel":
        return this.groupByHazardLevel(submissions);
      case "date":
        return this.groupByDate(submissions);
      case "customer":
        return this.groupByCustomer(submissions);
      case "status":
        return this.groupByStatus(submissions);
      default:
        return null;
    }
  }
}

export const msdsGroupingService = new MSDSGroupingService();
