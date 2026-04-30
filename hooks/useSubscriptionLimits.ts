/**
 * 💰 USE SUBSCRIPTION LIMITS HOOK
 * 
 * Hook to check subscription limits and enforce plan restrictions
 * Integrates billing service with user management
 * 
 * BlueDXP Platform - Enterprise-Grade Billing Integration
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionLimits {
  // User limits
  maxUsers: number; // -1 = unlimited
  currentUsers: number;
  canAddUsers: boolean;
  usersRemaining: number;
  
  // API limits
  maxApiCalls: number; // per month, -1 = unlimited
  currentApiCalls: number;
  apiCallsRemaining: number;
  apiCallsPercentage: number;
  
  // Storage limits
  maxStorage: number; // in GB, -1 = unlimited
  currentStorage: number;
  storageRemaining: number;
  storagePercentage: number;
  
  // Other limits
  maxAgentExecutions: number;
  currentAgentExecutions: number;
  maxDataExports: number;
  currentDataExports: number;
  
  // Plan info
  planId: string;
  planName: string;
  billingCycle: string;
  totalPrice: number;
  currency: string;
  
  // Status flags
  approachingUserLimit: boolean; // > 80%
  approachingApiLimit: boolean;
  approachingStorageLimit: boolean;
  canUpgrade: boolean;
  isLoading: boolean;
  error: string | null;
}

const PLAN_LIMITS: Record<string, {
  users: number;
  apiCalls: number;
  storage: number;
  agentExecutions: number;
  dataExports: number;
}> = {
  free: {
    users: 5,
    apiCalls: 1000,
    storage: 1, // GB
    agentExecutions: 10,
    dataExports: 5,
  },
  starter: {
    users: 25,
    apiCalls: 50000,
    storage: 10,
    agentExecutions: 100,
    dataExports: 50,
  },
  professional: {
    users: 100,
    apiCalls: 500000,
    storage: 100,
    agentExecutions: 1000,
    dataExports: 100,
  },
  enterprise: {
    users: -1, // Unlimited
    apiCalls: -1,
    storage: -1,
    agentExecutions: -1,
    dataExports: -1,
  },
};

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();
  const [limits, setLimits] = useState<SubscriptionLimits>({
    maxUsers: 0,
    currentUsers: 0,
    canAddUsers: false,
    usersRemaining: 0,
    maxApiCalls: 0,
    currentApiCalls: 0,
    apiCallsRemaining: 0,
    apiCallsPercentage: 0,
    maxStorage: 0,
    currentStorage: 0,
    storageRemaining: 0,
    storagePercentage: 0,
    maxAgentExecutions: 0,
    currentAgentExecutions: 0,
    maxDataExports: 0,
    currentDataExports: 0,
    planId: "free",
    planName: "Free",
    billingCycle: "monthly",
    totalPrice: 0,
    currency: "USD",
    approachingUserLimit: false,
    approachingApiLimit: false,
    approachingStorageLimit: false,
    canUpgrade: true,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchLimits() {
      try {
        setLimits(prev => ({ ...prev, isLoading: true, error: null }));

        // Fetch subscription
        const subRes = await fetch("/api/billing/subscriptions");
        const subData = await subRes.json();
        
        let subscription = null;
        if (subData.success && subData.data && subData.data.length > 0) {
          subscription = subData.data[0];
        }

        // Get plan limits
        const planId = subscription?.planId || "free";
        const planLimits = PLAN_LIMITS[planId] || PLAN_LIMITS.free;

        // Fetch current usage
        // In production, these would be separate API calls
        const userCount = await fetchUserCount();
        const apiCallCount = 0; // TODO: Implement API call tracking
        const storageUsage = 0; // TODO: Implement storage tracking
        const agentCount = 0; // TODO: Implement agent execution tracking
        const exportCount = 0; // TODO: Implement export tracking

        // Calculate limits
        const maxUsers = planLimits.users;
        const currentUsers = userCount;
        const usersRemaining = maxUsers === -1 ? -1 : Math.max(0, maxUsers - currentUsers);
        const canAddUsers = maxUsers === -1 || currentUsers < maxUsers;
        const approachingUserLimit = maxUsers !== -1 && (currentUsers / maxUsers) > 0.8;

        const maxApiCalls = planLimits.apiCalls;
        const currentApiCalls = apiCallCount;
        const apiCallsRemaining = maxApiCalls === -1 ? -1 : Math.max(0, maxApiCalls - currentApiCalls);
        const apiCallsPercentage = maxApiCalls === -1 ? 0 : (currentApiCalls / maxApiCalls) * 100;
        const approachingApiLimit = maxApiCalls !== -1 && apiCallsPercentage > 80;

        const maxStorage = planLimits.storage;
        const currentStorage = storageUsage;
        const storageRemaining = maxStorage === -1 ? -1 : Math.max(0, maxStorage - currentStorage);
        const storagePercentage = maxStorage === -1 ? 0 : (currentStorage / maxStorage) * 100;
        const approachingStorageLimit = maxStorage !== -1 && storagePercentage > 80;

        setLimits({
          maxUsers,
          currentUsers,
          canAddUsers,
          usersRemaining,
          maxApiCalls,
          currentApiCalls,
          apiCallsRemaining,
          apiCallsPercentage,
          maxStorage,
          currentStorage,
          storageRemaining,
          storagePercentage,
          maxAgentExecutions: planLimits.agentExecutions,
          currentAgentExecutions: agentCount,
          maxDataExports: planLimits.dataExports,
          currentDataExports: exportCount,
          planId: subscription?.planId || "free",
          planName: subscription?.planName || "Free",
          billingCycle: subscription?.billingCycle || "monthly",
          totalPrice: subscription?.totalPrice || 0,
          currency: subscription?.currency || "USD",
          approachingUserLimit,
          approachingApiLimit,
          approachingStorageLimit,
          canUpgrade: planId !== "enterprise",
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("[useSubscriptionLimits] Error fetching limits:", error);
        setLimits(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to fetch subscription limits",
        }));
      }
    }

    if (user) {
      fetchLimits();
    }
  }, [user]);

  return limits;
}

/**
 * Fetch current user count for tenant
 */
async function fetchUserCount(): Promise<number> {
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      // Count only active users
      return data.data.filter((u: any) => u.status === "ACTIVE" || u.status === "active").length;
    }
    return 0;
  } catch (error) {
    console.error("[fetchUserCount] Error:", error);
    return 0;
  }
}

/**
 * Check if user can be added (client-side check)
 * Server should also enforce this!
 */
export function canAddUserCheck(limits: SubscriptionLimits): {
  allowed: boolean;
  reason?: string;
} {
  if (limits.maxUsers === -1) {
    return { allowed: true };
  }

  if (limits.currentUsers >= limits.maxUsers) {
    return {
      allowed: false,
      reason: `You've reached your plan limit of ${limits.maxUsers} users. Upgrade to add more.`,
    };
  }

  return { allowed: true };
}
