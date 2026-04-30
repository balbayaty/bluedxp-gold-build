/**
 * ICT Hardware Products Catalog
 * Product catalog for ICT hardware components
 */

"use client";

import { useState, useEffect } from "react";
import { RiDeviceLine, RiAddLine } from "react-icons/ri";

interface ICTProduct {
  id: string;
  name: string;
  category: string;
  localContent: {
    percentage: number;
  };
  status: string;
}

export default function ICTProductsPage() {
  const [products, setProducts] = useState<ICTProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const response = await fetch("/api/ict-hardware-ecosystem/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">ICT Products Catalog</h1>
            <p className="text-gray-400">Manage ICT hardware product catalog</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 rounded-xl hover:bg-cyan-500/30 transition-colors">
            <RiAddLine /> Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <RiDeviceLine className="text-cyan-400 text-2xl" />
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {product.category.replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Local Content</span>
                  <span className="text-sm font-semibold text-green-400">
                    {product.localContent.percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.status === "production"
                        ? "bg-green-500/20 text-green-400"
                        : product.status === "prototype"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {product.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No products registered. Click "Add Product" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
