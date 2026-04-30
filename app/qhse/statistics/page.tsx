/**
 * QHSE Statistics Board Page
 * Smart QHSE Statistics Board with all KPIs from FLEX Logistics document
 */

"use client";

import SmartQHSEStatisticsBoard from "@/components/qhse/SmartQHSEStatisticsBoard";

export default function QHSEStatisticsPage() {
  return (
    <SmartQHSEStatisticsBoard autoRefresh={true} refreshInterval={30000} />
  );
}
