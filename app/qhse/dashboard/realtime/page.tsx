/**
 * Real-Time QHSE Dashboard Page
 * Live streaming QHSE metrics dashboard
 */

"use client";

import RealTimeQHSEDashboard from "@/components/qhse/RealTimeQHSEDashboard";
import { useCustomer } from "@/contexts/CustomerContext";

export default function RealTimeQHSEDashboardPage() {
  const { currentCustomer } = useCustomer();

  return (
    <RealTimeQHSEDashboard
      customerId={currentCustomer?.id}
      autoRefresh={true}
      refreshInterval={5000}
    />
  );
}
