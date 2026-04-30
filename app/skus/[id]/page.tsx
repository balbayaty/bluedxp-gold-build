/**
 * SKU Detail Page
 * Comprehensive SKU/Product view with inventory, movements, and analytics
 * UX Enhanced: Toast notifications, confirmation dialogs, error handling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserNotification, useNotifications } from "@/components/ui/UserNotification";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorDisplay from "@/components/ui/ErrorDisplay";

interface SKU {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  uom: string;
  weight: number;
  weightUnit: string;
  dimensions: { length: number; width: number; height: number; unit: string };
  barcode: string;
  alternativeBarcodes: string[];
  status: "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  hazardous: boolean;
  hazmatClass?: string;
  temperatureControlled: boolean;
  temperatureRange?: { min: number; max: number; unit: string };
  shelfLife?: number;
  shelfLifeUnit?: string;
  reorderPoint: number;
  reorderQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  unitCost: number;
  sellingPrice: number;
  currency: string;
  vatRate: number;
  abcClass: "A" | "B" | "C";
  velocity: "FAST" | "MEDIUM" | "SLOW";
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface StockLevel {
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  allocated: number;
  available: number;
  inTransit: number;
  reserved: number;
  lastMovement: string;
}

const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "inventory", label: "Inventory", icon: "ri-stack-line" },
  { id: "movements", label: "Movements", icon: "ri-arrow-left-right-line" },
  { id: "analytics", label: "Analytics", icon: "ri-bar-chart-line" },
  { id: "settings", label: "Settings", icon: "ri-settings-3-line" },
] as const;

type TabId = typeof TABS[number]["id"];

const statusConfig: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-green-500/20", text: "text-green-400" },
  INACTIVE: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  DISCONTINUED: { bg: "bg-red-500/20", text: "text-red-400" },
};

const abcColors: Record<string, string> = {
  A: "from-green-500 to-emerald-500",
  B: "from-blue-500 to-cyan-500",
  C: "from-gray-500 to-gray-600",
};

export default function SKUDetailPage() {
  const params = useParams();
  const router = useRouter();
  const skuId = params.id as string;
  
  const [sku, setSku] = useState<SKU | null>(null);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Notifications
  const { notification, showSuccess, showError, showInfo, clearNotification } = useNotifications();

  useEffect(() => {
    loadSKU();
  }, [skuId]);

  const handlePrint = () => {
    showInfo("Print", "Opening print dialog...");
    window.print();
  };

  const handleGenerateBarcode = () => {
    showInfo("Barcode", "Generating barcode label...");
  };

  const handleDeactivate = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/wms/skus/${skuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      if (response.ok) {
        showSuccess("SKU Deactivated", "The SKU has been marked as inactive");
        loadSKU();
      } else {
        throw new Error("Deactivation failed");
      }
    } catch (err) {
      showError("Deactivation Failed", err instanceof Error ? err.message : "Please try again");
    } finally {
      setProcessing(false);
      setShowDeactivateDialog(false);
    }
  };

  const loadSKU = async () => {
    setLoading(true);
    try {
      // Mock data for demo
      setSku({
        id: skuId,
        code: `SKU-${skuId.slice(0, 6).toUpperCase()}`,
        name: "Premium Industrial Storage Container",
        description: "Heavy-duty stackable storage container suitable for warehouse and industrial use. Made from reinforced polypropylene with UV protection.",
        category: "Storage & Organization",
        subcategory: "Industrial Containers",
        brand: "StoragePro",
        uom: "EA",
        weight: 2.5,
        weightUnit: "KG",
        dimensions: { length: 60, width: 40, height: 35, unit: "CM" },
        barcode: "6281234567890",
        alternativeBarcodes: ["6281234567891", "6281234567892"],
        status: "ACTIVE",
        hazardous: false,
        temperatureControlled: false,
        shelfLife: 0,
        reorderPoint: 50,
        reorderQuantity: 200,
        minOrderQuantity: 10,
        maxOrderQuantity: 1000,
        unitCost: 45.00,
        sellingPrice: 75.00,
        currency: "SAR",
        vatRate: 15,
        abcClass: "A",
        velocity: "FAST",
        customFields: {},
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setStockLevels([
        { warehouseId: "wh-001", warehouseName: "Riyadh Main DC", onHand: 1250, allocated: 200, available: 1050, inTransit: 500, reserved: 100, lastMovement: new Date().toISOString() },
        { warehouseId: "wh-002", warehouseName: "Jeddah Hub", onHand: 450, allocated: 50, available: 400, inTransit: 100, reserved: 0, lastMovement: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { warehouseId: "wh-003", warehouseName: "Dammam Facility", onHand: 320, allocated: 80, available: 240, inTransit: 0, reserved: 20, lastMovement: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      ]);
    } catch (err) {
      setError("Failed to load SKU");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "SAR") => {
    return new Intl.NumberFormat("en-SA", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !sku) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <ErrorDisplay
          title="SKU Not Found"
          message={error || "The requested SKU could not be found"}
          onRetry={loadSKU}
          onBack={() => router.push("/skus")}
          icon="ri-box-3-line"
        />
      </div>
    );
  }

  const statusStyle = statusConfig[sku.status] || statusConfig.ACTIVE;
  const totalOnHand = stockLevels.reduce((sum, s) => sum + s.onHand, 0);
  const totalAvailable = stockLevels.reduce((sum, s) => sum + s.available, 0);
  const totalValue = totalOnHand * sku.unitCost;
  const margin = ((sku.sellingPrice - sku.unitCost) / sku.sellingPrice * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Toast Notification */}
      <UserNotification notification={notification} onClose={clearNotification} />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={handleDeactivate}
        title="Deactivate SKU"
        message={`Are you sure you want to deactivate "${sku.code}"? This SKU will no longer be available for new orders.`}
        confirmLabel="Deactivate"
        variant="warning"
        loading={processing}
        icon="ri-forbid-line"
      />

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Link href="/skus" className="p-2 hover:bg-white/10 rounded-lg transition-colors" aria-label="Back">
                <i className="ri-arrow-left-line text-2xl"></i>
              </Link>
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/30">
                <i className="ri-box-3-line text-3xl"></i>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{sku.code}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {sku.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${abcColors[sku.abcClass]} text-white`}>
                    Class {sku.abcClass}
                  </span>
                </div>
                <p className="text-gray-300 mt-1">{sku.name}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                  <span><i className="ri-folder-line mr-1"></i>{sku.category}</span>
                  <span><i className="ri-price-tag-3-line mr-1"></i>{sku.brand}</span>
                  <span><i className="ri-barcode-line mr-1"></i>{sku.barcode}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {sku.status === "ACTIVE" && (
                <button
                  onClick={() => setShowDeactivateDialog(true)}
                  className="p-2.5 bg-white/5 hover:bg-yellow-500/20 border border-white/10 hover:border-yellow-500/30 rounded-xl transition-all text-gray-400 hover:text-yellow-400"
                  aria-label="Deactivate SKU"
                >
                  <i className="ri-forbid-line text-lg"></i>
                </button>
              )}
              <Link href={`/skus/${skuId}/edit`} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-2 transition-colors">
                <i className="ri-edit-line"></i>Edit
              </Link>
              <button 
                onClick={handleGenerateBarcode}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Generate barcode"
              >
                <i className="ri-qr-code-line text-xl"></i>
              </button>
              <button 
                onClick={handlePrint}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="Print"
              >
                <i className="ri-printer-line text-xl"></i>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Total On Hand</p>
              <p className="text-3xl font-bold mt-1">{totalOnHand.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Available</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{totalAvailable.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Stock Value</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Unit Cost</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(sku.unitCost)}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm">Margin</p>
              <p className="text-3xl font-bold mt-1 text-teal-400">{margin}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-teal-500 text-teal-400" : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <i className={tab.icon}></i>{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-information-line text-teal-400"></i>
                Product Details
              </h3>
              <p className="text-gray-300 mb-6">{sku.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Category</label>
                  <p className="mt-1">{sku.category}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Subcategory</label>
                  <p className="mt-1">{sku.subcategory}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Brand</label>
                  <p className="mt-1">{sku.brand}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">UoM</label>
                  <p className="mt-1">{sku.uom}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-ruler-line text-teal-400"></i>
                Physical Attributes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Weight</label>
                  <p className="mt-1">{sku.weight} {sku.weightUnit}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Dimensions (L×W×H)</label>
                  <p className="mt-1">{sku.dimensions.length} × {sku.dimensions.width} × {sku.dimensions.height} {sku.dimensions.unit}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Hazardous</label>
                  <p className="mt-1">{sku.hazardous ? <span className="text-red-400">Yes</span> : <span className="text-green-400">No</span>}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Temp Controlled</label>
                  <p className="mt-1">{sku.temperatureControlled ? <span className="text-blue-400">Yes</span> : <span className="text-gray-400">No</span>}</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-money-dollar-circle-line text-teal-400"></i>
                Pricing
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Unit Cost</label>
                  <p className="mt-1 text-xl font-bold">{formatCurrency(sku.unitCost)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Selling Price</label>
                  <p className="mt-1 text-xl font-bold text-green-400">{formatCurrency(sku.sellingPrice)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">VAT Rate</label>
                  <p className="mt-1">{sku.vatRate}%</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Gross Margin</label>
                  <p className="mt-1 text-teal-400 font-medium">{margin}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="ri-refresh-line text-teal-400"></i>
                Replenishment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Reorder Point</label>
                  <p className="mt-1 text-xl font-bold">{sku.reorderPoint}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Reorder Qty</label>
                  <p className="mt-1 text-xl font-bold">{sku.reorderQuantity}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Min Order Qty</label>
                  <p className="mt-1">{sku.minOrderQuantity}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Max Order Qty</label>
                  <p className="mt-1">{sku.maxOrderQuantity}</p>
                </div>
              </div>
              {totalAvailable < sku.reorderPoint && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <i className="ri-alert-line mr-2"></i>Stock below reorder point! Consider placing a purchase order.
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === "inventory" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="ri-stack-line text-teal-400"></i>
                Stock by Location
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-4 px-6 text-gray-400 font-medium">Warehouse</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">On Hand</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Allocated</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Available</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">In Transit</th>
                    <th className="py-4 px-6 text-gray-400 font-medium text-right">Reserved</th>
                    <th className="py-4 px-6 text-gray-400 font-medium">Last Movement</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLevels.map((stock) => (
                    <tr key={stock.warehouseId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-6 font-medium">{stock.warehouseName}</td>
                      <td className="py-4 px-6 text-right">{stock.onHand.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-yellow-400">{stock.allocated.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-green-400 font-medium">{stock.available.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-blue-400">{stock.inTransit.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right text-purple-400">{stock.reserved.toLocaleString()}</td>
                      <td className="py-4 px-6 text-gray-400 text-sm">{new Date(stock.lastMovement).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-white/5 font-bold">
                    <td className="py-4 px-6">Total</td>
                    <td className="py-4 px-6 text-right">{stockLevels.reduce((s, l) => s + l.onHand, 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-yellow-400">{stockLevels.reduce((s, l) => s + l.allocated, 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-green-400">{stockLevels.reduce((s, l) => s + l.available, 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-blue-400">{stockLevels.reduce((s, l) => s + l.inTransit, 0).toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-purple-400">{stockLevels.reduce((s, l) => s + l.reserved, 0).toLocaleString()}</td>
                    <td className="py-4 px-6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === "movements" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">Recent Movements</h3>
            <div className="text-center py-12 text-gray-400">
              <i className="ri-arrow-left-right-line text-5xl mb-4"></i>
              <p>Stock movement history coming soon</p>
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">SKU Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">ABC Classification</p>
                <p className={`text-5xl font-bold mt-2 bg-gradient-to-r ${abcColors[sku.abcClass]} bg-clip-text text-transparent`}>{sku.abcClass}</p>
                <p className="text-sm text-gray-500 mt-2">High-value item</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Velocity</p>
                <p className="text-2xl font-bold mt-2 text-orange-400">{sku.velocity}</p>
                <p className="text-sm text-gray-500 mt-2">Movement speed</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">Days of Stock</p>
                <p className="text-3xl font-bold mt-2">{Math.round(totalAvailable / 50)}</p>
                <p className="text-sm text-gray-500 mt-2">Based on avg. daily sales</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-6">SKU Settings</h3>
            <div className="space-y-4">
              <Link href={`/skus/${skuId}/edit`} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <i className="ri-edit-line text-teal-400"></i>
                  <span>Edit SKU Details</span>
                </div>
                <i className="ri-arrow-right-s-line"></i>
              </Link>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <i className="ri-price-tag-3-line text-blue-400"></i>
                  <span>Manage Pricing</span>
                </div>
                <i className="ri-arrow-right-s-line"></i>
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <i className="ri-barcode-line text-purple-400"></i>
                  <span>Manage Barcodes</span>
                </div>
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
