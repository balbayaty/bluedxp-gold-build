/**
 * Customer Branding & Logo Setup Page
 *
 * Allows customers to:
 * - Upload and manage their logo
 * - Set brand colors
 * - Configure logo display preferences
 * - Manage sub-customer logos (for nested customer scenarios)
 */

"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { useCustomer } from "@/contexts/CustomerContext";
import CustomerLogo from "@/components/customer/CustomerLogo";
import DualCustomerLogo from "@/components/customer/DualCustomerLogo";
import {
  uploadLogo,
  validateLogoFile,
  validateImageDimensions,
  formatFileSize,
  getUploadedLogo,
  deleteUploadedLogo,
  type LogoUploadResult,
} from "@/lib/services/customerLogoUploadService";
import { Customer } from "@/types/tenant";

export default function CustomerBrandingPage() {
  const { currentCustomer, setCurrentCustomer } = useCustomer();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<LogoUploadResult | null>(
    null,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [brandColor, setBrandColor] = useState(
    currentCustomer?.brandColor || "#FF6600",
  );
  const [secondaryColor, setSecondaryColor] = useState(
    currentCustomer?.secondaryColor || "#FF8533",
  );
  const [logoVariant, setLogoVariant] = useState<"light" | "dark" | "full">(
    currentCustomer?.logo?.variant || "full",
  );

  if (!currentCustomer) {
    return (
      <PageTemplate
        title="Customer Branding"
        description="Configure your logo and branding"
        icon="ri-palette-line"
      >
        <div className="text-center py-12">
          <p className="text-white/60">No customer selected</p>
        </div>
      </PageTemplate>
    );
  }

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);

    // Validate file
    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setUploadResult({
        success: false,
        error: validation.error,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentCustomer) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadLogo(selectedFile, currentCustomer.id);

      if (result.success && result.url) {
        // Update customer with new logo
        const updatedCustomer: Customer = {
          ...currentCustomer,
          logo: {
            url: result.url,
            alt: `${currentCustomer.customerName} Logo`,
            width: result.width,
            height: result.height,
            variant: logoVariant,
          },
          brandColor,
          secondaryColor,
        };

        setCurrentCustomer(updatedCustomer);
        setUploadResult(result);
      } else {
        setUploadResult(result);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    if (!currentCustomer) return;

    deleteUploadedLogo(currentCustomer.id);

    const updatedCustomer: Customer = {
      ...currentCustomer,
      logo: undefined,
    };

    setCurrentCustomer(updatedCustomer);
    setPreview(null);
    setSelectedFile(null);
    setUploadResult(null);
  };

  const handleSaveBranding = () => {
    if (!currentCustomer) return;

    const updatedCustomer: Customer = {
      ...currentCustomer,
      brandColor,
      secondaryColor,
      logo: currentCustomer.logo
        ? {
            ...currentCustomer.logo,
            variant: logoVariant,
          }
        : undefined,
    };

    setCurrentCustomer(updatedCustomer);
  };

  return (
    <PageTemplate
      title="Customer Branding & Logo"
      description="Upload your logo and configure branding settings"
      icon="ri-palette-line"
    >
      <div className="space-y-6">
        {/* Current Logo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-image-line"></i>
            Current Logo
          </h3>
          <div className="flex items-center gap-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <CustomerLogo
                logo={currentCustomer.logo}
                customerName={currentCustomer.customerName}
                size="lg"
                variant="full"
                showName={true}
              />
            </div>
            {currentCustomer.logo && (
              <button
                onClick={handleRemoveLogo}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
              >
                <i className="ri-delete-bin-line"></i>
                Remove Logo
              </button>
            )}
          </div>
        </motion.div>

        {/* Logo Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-upload-cloud-line"></i>
            Upload Logo
          </h3>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-300
              ${dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-white/20 hover:border-white/40 hover:bg-white/5"}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <i className="ri-image-add-line text-3xl text-cyan-400"></i>
              </div>
              <div>
                <p className="text-white font-medium mb-1">
                  {selectedFile ? selectedFile.name : "Click or drag to upload"}
                </p>
                <p className="text-white/60 text-sm">
                  SVG, PNG, JPG up to 500KB
                </p>
                {selectedFile && (
                  <p className="text-white/40 text-xs mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                )}
              </div>
            </div>

            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 flex justify-center"
              >
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-32 max-w-full object-contain"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3"
            >
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="ri-upload-line"></i>
                    Upload Logo
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setUploadResult(null);
                }}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Upload Result */}
          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-lg ${
                  uploadResult.success
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-red-500/20 border border-red-500/30"
                }`}
              >
                {uploadResult.success ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <i className="ri-checkbox-circle-line"></i>
                    <span>Logo uploaded successfully!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <i className="ri-error-warning-line"></i>
                    <span>{uploadResult.error}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Brand Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-palette-line"></i>
            Brand Colors
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="#FF6600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 rounded-lg border border-white/20 cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="#FF8533"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Logo Variant */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="ri-settings-3-line"></i>
            Logo Display Settings
          </h3>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Logo Variant
            </label>
            <div className="flex gap-3">
              {(["light", "dark", "full"] as const).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setLogoVariant(variant)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    logoVariant === variant
                      ? "bg-cyan-500 text-white"
                      : "bg-white/5 hover:bg-white/10 text-white/80"
                  }`}
                >
                  {variant.charAt(0).toUpperCase() + variant.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-white/60 text-sm mt-2">
              Choose the logo variant that works best for different backgrounds
            </p>
          </div>
        </motion.div>

        {/* Dual Logo Preview (for nested customers) */}
        {currentCustomer.subCustomers &&
          currentCustomer.subCustomers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="ri-stack-line"></i>
                Dual Logo Preview (Customer's Customer)
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Preview how your logo appears alongside your customer's logo
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["side-by-side", "stacked", "overlay", "split"] as const).map(
                  (variant) => (
                    <div
                      key={variant}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <p className="text-white/60 text-xs mb-3 capitalize">
                        {variant.replace("-", " ")}
                      </p>
                      <div className="flex justify-center">
                        <DualCustomerLogo
                          primaryCustomer={currentCustomer}
                          subCustomer={currentCustomer.subCustomers?.[0]}
                          size="md"
                          variant={variant}
                        />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </motion.div>
          )}

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end gap-3"
        >
          <button
            onClick={handleSaveBranding}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <i className="ri-save-line"></i>
            Save Branding Settings
          </button>
        </motion.div>
      </div>
    </PageTemplate>
  );
}
