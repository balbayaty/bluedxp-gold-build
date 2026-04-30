/**
 * MaaS Tenants Page
 *
 * Comprehensive tenant management
 * - Tenant list with details
 * - Utilization by tenant
 * - Revenue by tenant
 * - Tenant health monitoring
 * - Tenant analytics
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PremiumLoader } from "@/components/loading";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Tenant {
  id: string;
  name: string;
  utilization: number;
  revenue: number;
  status: "active" | "inactive" | "pending";
  pillars: number;
  createdAt: string;
  health: "excellent" | "good" | "fair" | "poor";
}

function MaasTenantsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/maas/tenants");
        if (response.ok) {
          const result = await response.json();
          setTenants(result.tenants || result.data || []);
        } else {
          // Generate sample data
          setTenants(generateSampleTenants());
        }
      } catch (error) {
        console.error("Error fetching tenants:", error);
        setTenants(generateSampleTenants());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateSampleTenants = (): Tenant[] => {
    const names = [
      "Manufacturing Co. Ltd.",
      "Tech Industries Inc.",
      "Global Manufacturing",
      "Industrial Corp",
      "Advanced Solutions",
      "Precision Manufacturing",
      "Smart Factory Group",
      "Innovation Labs",
    ];

    return names.map((name, index) => ({
      id: `tenant-${index + 1}`,
      name,
      utilization: Math.random() * 40 + 50,
      revenue: Math.random() * 200000 + 80000,
      status: Math.random() > 0.2 ? "active" : ("pending" as const),
      pillars: Math.floor(Math.random() * 8) + 4,
      createdAt: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      health: (["excellent", "good", "fair", "poor"] as const)[
        Math.floor(Math.random() * 4)
      ],
    }));
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || tenant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = tenants.reduce((sum, t) => sum + t.revenue, 0);
  const avgUtilization =
    tenants.reduce((sum, t) => sum + t.utilization, 0) / tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "active").length;

  const chartData = filteredTenants.slice(0, 8).map((t) => ({
    name: t.name.substring(0, 15),
    revenue: t.revenue,
    utilization: t.utilization,
  }));

  if (loading) {
    return (
      <PageTemplate
        title="MaaS Tenants"
        description="Tenant Management - Manufacturing as a Service"
        icon="ri-group-line"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <PremiumLoader
            message="Loading tenants..."
            size="lg"
            variant="default"
          />
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="MaaS Tenants"
      description="Tenant Management - Manufacturing as a Service"
      icon="ri-group-line"
    >
      <div className="space-y-6">
        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm text-gray-400">Total Tenants</h3>
            </div>
            <p className="text-3xl font-bold text-white">{tenants.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-green-400" />
              <h3 className="text-sm text-gray-400">Avg Utilization</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {avgUtilization.toFixed(1)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm text-gray-400">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "SAR",
                minimumFractionDigits: 0,
              })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm text-gray-400">Active</h3>
            </div>
            <p className="text-3xl font-bold text-white">{activeTenants}</p>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Tenant
            </button>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Tenant Revenue & Utilization
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="#3b82f6"
                  name="Revenue (SAR)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="utilization"
                  fill="#8b5cf6"
                  name="Utilization (%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Tenants List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTenants.map((tenant, index) => {
            const healthColors = {
              excellent: "bg-green-500/20 text-green-400 border-green-500/30",
              good: "bg-blue-500/20 text-blue-400 border-blue-500/30",
              fair: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
              poor: "bg-red-500/20 text-red-400 border-red-500/30",
            };

            const statusColors = {
              active: "bg-green-500/20 text-green-400",
              inactive: "bg-gray-500/20 text-gray-400",
              pending: "bg-yellow-500/20 text-yellow-400",
            };

            return (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => {
                  // Navigate to tenant detail
                  console.log("View tenant:", tenant.id);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {tenant.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${statusColors[tenant.status]}`}
                      >
                        {tenant.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${healthColors[tenant.health]}`}
                      >
                        {tenant.health}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {tenant.pillars} pillars active
                    </p>
                  </div>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Utilization</span>
                      <span className="text-sm font-semibold text-white">
                        {tenant.utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(tenant.utilization, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Revenue</p>
                      <p className="text-sm font-semibold text-emerald-400">
                        {tenant.revenue.toLocaleString("en-US", {
                          style: "currency",
                          currency: "SAR",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Joined</p>
                      <p className="text-sm text-gray-300">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No tenants found matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

export default function MaasTenantsPagePage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="MaaS Tenants"
          description="MaaS Tenants - maas module"
          icon="ri-group-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <MaasTenantsPageContent />
    </ErrorBoundary>
  );
}
