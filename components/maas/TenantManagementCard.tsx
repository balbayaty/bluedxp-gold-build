/**
 * Tenant Management Card
 *
 * Comprehensive tenant management and insights
 * - Tenant list
 * - Utilization by tenant
 * - Revenue by tenant
 * - Tenant health
 */

"use client";

import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  name: string;
  utilization: number;
  revenue: number;
  status: "active" | "inactive" | "pending";
  pillars: number;
}

interface TenantManagementCardProps {
  tenants: Tenant[];
  onTenantClick: (tenantId: string) => void;
}

export default function TenantManagementCard({
  tenants,
  onTenantClick,
}: TenantManagementCardProps) {
  const router = useRouter();

  // Sample tenant data if none provided
  const sampleTenants: Tenant[] =
    tenants.length > 0
      ? tenants
      : [
          {
            id: "tenant-1",
            name: "Manufacturing Co. Ltd.",
            utilization: 75,
            revenue: 125000,
            status: "active",
            pillars: 8,
          },
          {
            id: "tenant-2",
            name: "Tech Industries Inc.",
            utilization: 82,
            revenue: 189000,
            status: "active",
            pillars: 10,
          },
          {
            id: "tenant-3",
            name: "Global Manufacturing",
            utilization: 65,
            revenue: 98000,
            status: "active",
            pillars: 6,
          },
        ];

  const totalRevenue = sampleTenants.reduce((sum, t) => sum + t.revenue, 0);
  const avgUtilization =
    sampleTenants.reduce((sum, t) => sum + t.utilization, 0) /
    sampleTenants.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Tenant Management
              </h3>
              <p className="text-sm text-gray-400">
                {sampleTenants.length} active tenants
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/maas/tenants")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Tenants</p>
            <p className="text-xl font-bold text-white">
              {sampleTenants.length}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Avg Utilization</p>
            <p className="text-xl font-bold text-white">
              {avgUtilization.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-white">
              {totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Tenant List */}
        <div className="space-y-2">
          {sampleTenants.map((tenant) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onTenantClick(tenant.id)}
              className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">
                      {tenant.name}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        tenant.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : tenant.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {tenant.pillars} pillars active
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">
                    {tenant.revenue.toLocaleString("en-US", {
                      style: "currency",
                      currency: "SAR",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${tenant.utilization}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Utilization: {tenant.utilization}%</span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Active
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
