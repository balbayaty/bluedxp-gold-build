"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleDefinition } from "@/types/user";

export default function DashboardRouter() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // OPTIMIZED: Don't wait for isLoading - redirect immediately if we have user
    if (user) {
      const roleDefinition = getRoleDefinition(user.role);
      // Use replace to avoid back button issues
      router.replace(roleDefinition.dashboardRoute);
      return;
    }

    // If not logged in and not loading, redirect to login
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-sm">Loading dashboard...</div>
      </div>
    </div>
  );
}
