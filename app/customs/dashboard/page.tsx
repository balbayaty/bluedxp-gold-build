/**
 * Customs Dashboard Page
 */

"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useCustomer } from "@/contexts/CustomerContext";
import CustomsDashboard from "@/components/customs/CustomsDashboard";

export default function CustomsDashboardPage() {
  const { user } = useAuth();
  const { currentCustomer } = useCustomer();

  return (
    <div className="min-h-screen">
      <CustomsDashboard
        tenantId={currentCustomer?.id || "default"}
        userId={user?.id || "anonymous"}
        userRole={user?.role || "user"}
      />
    </div>
  );
}
