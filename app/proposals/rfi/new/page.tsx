/**
 * RFI Creation Page - Advanced Portal (Full Form)
 * Dark theme, collapsible sections, live intelligence sidebar
 * Based on Flex Logistics RFI Portal
 *
 * NOTE: This is the advanced/full RFI creation form.
 * The wizard-style form is available at /proposals/rfi/new/wizard
 *
 * Consolidated: Both forms create RFIs, but this one provides more detailed fields
 * and live intelligence. The wizard is simpler and recommended for most users.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";

interface RFIData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  flexRepresentative: string;
  date: string;
  storage: {
    storageSqm: string;
    storageCbm: string;
    palletPositions: string;
    mixAmbient: string;
    mixTemp: string;
    mixYard: string;
    tempRange: string;
    storageType: string;
    skuCount: string;
    stockLevels: string;
    invValue: string;
    annualTurnover: string;
    insuranceRequired: string;
  };
  inbound: {
    inboundPalletsDaily: string;
    inboundShipmentsDaily: string;
    inboundTrucksDaily: string;
    inboundPackaging: string;
    inboundSplit: string;
    packageSizesPerSku: string;
    palletsPerShipmentAvg: string;
    skusPerPalletAvg: string;
    verifyPalletPct: string;
    verifyCartonPct: string;
    verifyPiecePct: string;
    inboundInspection: string;
  };
  outbound: {
    outboundPalletsDaily: string;
    outboundShipmentsDaily: string;
    outboundTrucksDaily: string;
    rotationRule: string;
    outboundType: string;
    ordersDaily: string;
    linesPerOrder: string;
    cutoffTime: string;
    outboundNotes: string;
  };
  returns: {
    returnsRequired: string;
    returnsNotes: string;
  };
  vas: {
    vasRequired: string;
    vasRepack: boolean;
    vasKitting: boolean;
    vasPalletize: boolean;
    vasLabel: boolean;
    vasBarcode: boolean;
    vasShrink: boolean;
    vasOtherDesc: string;
    vasVolumes: string;
  };
  systems: {
    wms: string;
    systemReq: string;
  };
  kpis: string;
  additional: string;
  certify: string;
}

interface Analysis {
  completeness: number;
  readiness: number;
  confidence: "Low" | "Medium" | "High";
  assumptions: string[];
  keyDrivers: {
    storage: string;
    handling: string;
    pick: string;
    verify: string;
    vas: string;
  };
  badge: "Green" | "Amber" | "Red";
}

export default function NewRFIPage() {
  const router = useRouter();
  const { hasModuleAccess, canPerformAction } = useAuth();
  const [rfiNumber] = useState(
    `FLX-RFI-${Math.floor(Math.random() * 900000) + 100000}`,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("I");
  const [attachments, setAttachments] = useState<
    Array<{ name: string; size: number; type: string }>
  >([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");
  const canCreate = canPerformAction(
    "proposals-rfq",
    "proposals-rfq.rfi",
    undefined,
    "write",
  );

  const [formData, setFormData] = useState<RFIData>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    flexRepresentative: "",
    date: new Date().toISOString().split("T")[0],
    storage: {
      storageSqm: "",
      storageCbm: "",
      palletPositions: "",
      mixAmbient: "",
      mixTemp: "",
      mixYard: "",
      tempRange: "",
      storageType: "",
      skuCount: "",
      stockLevels: "",
      invValue: "",
      annualTurnover: "",
      insuranceRequired: "",
    },
    inbound: {
      inboundPalletsDaily: "",
      inboundShipmentsDaily: "",
      inboundTrucksDaily: "",
      inboundPackaging: "",
      inboundSplit: "",
      packageSizesPerSku: "",
      palletsPerShipmentAvg: "",
      skusPerPalletAvg: "",
      verifyPalletPct: "",
      verifyCartonPct: "",
      verifyPiecePct: "",
      inboundInspection: "",
    },
    outbound: {
      outboundPalletsDaily: "",
      outboundShipmentsDaily: "",
      outboundTrucksDaily: "",
      rotationRule: "",
      outboundType: "",
      ordersDaily: "",
      linesPerOrder: "",
      cutoffTime: "",
      outboundNotes: "",
    },
    returns: {
      returnsRequired: "",
      returnsNotes: "",
    },
    vas: {
      vasRequired: "",
      vasRepack: false,
      vasKitting: false,
      vasPalletize: false,
      vasLabel: false,
      vasBarcode: false,
      vasShrink: false,
      vasOtherDesc: "",
      vasVolumes: "",
    },
    systems: {
      wms: "",
      systemReq: "",
    },
    kpis: "",
    additional: "",
    certify: "",
  });

  const calculateLocalAnalysis = () => {
    // Simple local calculation
    const criticalFields = [
      formData.companyName,
      formData.contactPerson,
      formData.email,
      formData.storage.storageSqm,
      formData.storage.storageCbm,
      formData.storage.palletPositions,
      formData.inbound.inboundPalletsDaily,
      formData.outbound.outboundPalletsDaily,
      formData.outbound.ordersDaily,
    ];

    const filled = criticalFields.filter((f) => f && f.trim()).length;
    const completeness = Math.round((filled / criticalFields.length) * 100);

    const sizingOk = !!(
      formData.storage.storageSqm ||
      formData.storage.storageCbm ||
      formData.storage.palletPositions
    );
    const volumesOk = !!(
      formData.inbound.inboundPalletsDaily ||
      formData.outbound.outboundPalletsDaily
    );
    const ordersOk = !!formData.outbound.ordersDaily;

    let readiness = 0;
    if (sizingOk) readiness += 25;
    if (volumesOk) readiness += 25;
    if (ordersOk) readiness += 25;
    if (formData.inbound.inboundPackaging) readiness += 25;

    let confidence: "Low" | "Medium" | "High" = "Low";
    if (readiness >= 82) confidence = "High";
    else if (readiness >= 60) confidence = "Medium";

    let badge: "Green" | "Amber" | "Red" = "Red";
    if (readiness >= 82) badge = "Green";
    else if (readiness >= 60) badge = "Amber";

    setAnalysis({
      completeness,
      readiness,
      confidence,
      assumptions: [],
      keyDrivers: {
        storage: sizingOk ? "Sqm/CBM" : "Missing",
        handling: "—",
        pick: formData.outbound.outboundType || "—",
        verify: "—",
        vas: formData.vas.vasRequired === "Yes" ? "Selected" : "None",
      },
      badge,
    });
  };

  const analyzeForm = useCallback(async () => {
    try {
      // Create a temporary RFI for analysis
      const tempData = {
        tenantId: "default",
        ...formData,
        createdBy: "user",
      };

      // Call analysis API
      const [analysisResponse, intelligenceResponse] = await Promise.allSettled(
        [
          fetch("/api/rfi/analyze-temp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tempData),
          }),
          fetch("/api/rfi/intelligence-temp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tempData),
          }),
        ],
      );

      if (
        analysisResponse.status === "fulfilled" &&
        analysisResponse.value.ok
      ) {
        const data = await analysisResponse.value.json();
        setAnalysis(data.data);
      } else {
        calculateLocalAnalysis();
      }

      if (
        intelligenceResponse.status === "fulfilled" &&
        intelligenceResponse.value.ok
      ) {
        const intelData = await intelligenceResponse.value.json();
        setIntelligence(intelData.data);
      }
    } catch (error) {
      calculateLocalAnalysis();
    }
  }, [formData]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!formData.companyName && !formData.contactPerson) return; // Don't save empty forms

    setSaving(true);
    try {
      // Save to localStorage as draft
      const draft = {
        ...formData,
        attachments,
        rfiNumber,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(`rfi-draft-${rfiNumber}`, JSON.stringify(draft));
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error auto-saving:", error);
    } finally {
      setSaving(false);
    }
  }, [formData, attachments, rfiNumber]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`rfi-draft-${rfiNumber}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        if (draft.attachments) setAttachments(draft.attachments);
        if (draft.lastSaved) setLastSaved(new Date(draft.lastSaved));
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    }
  }, [rfiNumber]);

  // Auto-save on form changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      autoSave();
    }, 2000); // Save 2 seconds after last change

    return () => clearTimeout(timer);
  }, [formData, autoSave]);

  useEffect(() => {
    analyzeForm();
  }, [analyzeForm]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      ]);
    });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.contactPerson || !formData.email) {
      alert(
        "Please fill required fields: Company Name, Contact Person, Email.",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rfi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments,
          autoGenerateRFQ: analysis && analysis.readiness >= 60,
          autoGenerateProposal: analysis && analysis.readiness >= 82,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Clear draft
        localStorage.removeItem(`rfi-draft-${rfiNumber}`);
        router.push(`/proposals/rfi/${data.data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Error creating RFI");
      }
    } catch (error) {
      console.error("Error submitting RFI:", error);
      alert("Error submitting RFI");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    if (section === "main") {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value,
        },
      }));
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Green":
        return "bg-green-500";
      case "Amber":
        return "bg-yellow-500";
      case "Red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!hasAccess || !canCreate) {
    return (
      <ProposalErrorBoundary>
        <PageTemplate
          title="Access Denied"
          description="You do not have permission to create RFIs"
          icon="ri-error-warning-line"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-fill text-3xl text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You do not have the required permissions to create RFIs. Please
                contact your administrator.
              </p>
            </div>
          </div>
        </PageTemplate>
      </ProposalErrorBoundary>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <i className="ri-file-search-line text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Flex Logistics — Smart RFI Portal
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Built to capture pricing-critical inputs with minimal friction
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saving && (
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center gap-2">
                  <i className="ri-save-line animate-pulse" />
                  Saving...
                </span>
              )}
              {lastSaved && !saving && (
                <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs text-green-300 flex items-center gap-2">
                  <i className="ri-check-line" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Link
                href="/proposals/rfi/new/wizard"
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm flex items-center gap-2"
              >
                <i className="ri-magic-line" />
                Switch to Wizard
              </Link>
              <span className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm font-mono">
                Ref: {rfiNumber}
              </span>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line" />
                    Submit RFI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
            {["I", "II", "III", "IV"].map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeSection === section
                    ? "bg-gradient-to-r from-orange-500 to-blue-500 text-white"
                    : "bg-white/5 border border-white/20 text-gray-300 hover:bg-white/10"
                }`}
              >
                {section === "I" && "Contact Info"}
                {section === "II" && "Warehousing"}
                {section === "III" && "KPIs & Reporting"}
                {section === "IV" && "Additional & Attachments"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Section I: Contact Information */}
              <motion.details
                open={activeSection === "I"}
                onToggle={(e) =>
                  setActiveSection(e.currentTarget.open ? "I" : "")
                }
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                      I
                    </span>
                    <strong>Contact Information</strong>
                  </div>
                  <span className="text-xl">▾</span>
                </summary>
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Company Name{" "}
                        <span
                          className="text-orange-400"
                          title="Used for contract entity, invoicing, and reference matching."
                        >
                          ⓘ
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) =>
                          updateField("main", "companyName", e.target.value)
                        }
                        placeholder="Legal company name"
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Contact Person{" "}
                        <span
                          className="text-orange-400"
                          title="Who can validate assumptions and approve pricing."
                        >
                          ⓘ
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) =>
                          updateField("main", "contactPerson", e.target.value)
                        }
                        placeholder="Full name"
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          updateField("main", "email", e.target.value)
                        }
                        placeholder="name@company.com"
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Phone / WhatsApp{" "}
                        <span className="text-gray-500 text-xs">
                          (optional)
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          updateField("main", "phone", e.target.value)
                        }
                        placeholder="+966..."
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) =>
                          updateField("main", "address", e.target.value)
                        }
                        placeholder="City, district, facility address"
                        className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Flex Representative / Date
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={formData.flexRepresentative}
                          onChange={(e) =>
                            updateField(
                              "main",
                              "flexRepresentative",
                              e.target.value,
                            )
                          }
                          placeholder="Flex SCS representative"
                          className="px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) =>
                            updateField("main", "date", e.target.value)
                          }
                          className="px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.details>

              {/* Section II: Warehousing Details - This is a large section, I'll create it in parts */}
              <motion.details
                open={activeSection === "II"}
                onToggle={(e) =>
                  setActiveSection(e.currentTarget.open ? "II" : "")
                }
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                      II
                    </span>
                    <strong>Warehousing Details</strong>
                  </div>
                  <span className="text-xl">▾</span>
                </summary>
                <div className="p-4 pt-0 space-y-4">
                  {/* Storage Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        A
                      </span>
                      <strong className="text-sm">Storage</strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-sm">
                        <strong>Fast-track rule:</strong> If you only fill 3
                        things, fill{" "}
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                          storage size
                        </span>
                        ,{" "}
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                          daily inbound/outbound
                        </span>
                        , and{" "}
                        <span className="px-2 py-1 bg-white/10 rounded text-xs">
                          orders & lines
                        </span>
                        .
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Storage size (Sq. meters){" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.storageSqm}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "storageSqm",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 3,000"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Storage volume (CBM){" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.storageCbm}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "storageCbm",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 1,200"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Pallet positions{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.palletPositions}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "palletPositions",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 2,500"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Mix: Ambient (%){" "}
                            <span
                              className="text-orange-400"
                              title="Percentage of ambient storage"
                            >
                              ⓘ
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.storage.mixAmbient}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "mixAmbient",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 70"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Mix: Temperature-controlled (%){" "}
                            <span
                              className="text-orange-400"
                              title="Percentage of cold storage"
                            >
                              ⓘ
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.storage.mixTemp}
                            onChange={(e) =>
                              updateField("storage", "mixTemp", e.target.value)
                            }
                            placeholder="e.g., 20"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Mix: Yard/Open (%){" "}
                            <span
                              className="text-orange-400"
                              title="Percentage of outdoor storage"
                            >
                              ⓘ
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.storage.mixYard}
                            onChange={(e) =>
                              updateField("storage", "mixYard", e.target.value)
                            }
                            placeholder="e.g., 10"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Temperature Range{" "}
                            <span className="text-gray-500 text-xs">
                              (if applicable)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={formData.storage.tempRange}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "tempRange",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 2°C to 8°C"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Storage Type
                          </label>
                          <select
                            value={formData.storage.storageType}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "storageType",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select type</option>
                            <option value="Bulk">Bulk</option>
                            <option value="Rack">Rack</option>
                            <option value="Floor">Floor</option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            SKU Count{" "}
                            <span
                              className="text-orange-400"
                              title="Number of unique SKUs"
                            >
                              ⓘ
                            </span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.skuCount}
                            onChange={(e) =>
                              updateField("storage", "skuCount", e.target.value)
                            }
                            placeholder="e.g., 5,000"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Stock Levels
                          </label>
                          <select
                            value={formData.storage.stockLevels}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "stockLevels",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select level</option>
                            <option value="High">High (90+ days)</option>
                            <option value="Medium">Medium (30-90 days)</option>
                            <option value="Low">Low (&lt;30 days)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Inventory Value (SAR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.invValue}
                            onChange={(e) =>
                              updateField("storage", "invValue", e.target.value)
                            }
                            placeholder="e.g., 10,000,000"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Annual Turnover (SAR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.storage.annualTurnover}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "annualTurnover",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 50,000,000"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Insurance Required
                          </label>
                          <select
                            value={formData.storage.insuranceRequired}
                            onChange={(e) =>
                              updateField(
                                "storage",
                                "insuranceRequired",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="TBD">To be determined</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Inbound Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        B
                      </span>
                      <strong className="text-sm">Inbound Operations</strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Inbound Pallets{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inbound.inboundPalletsDaily}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "inboundPalletsDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 50"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Inbound Shipments
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inbound.inboundShipmentsDaily}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "inboundShipmentsDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 10"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Inbound Trucks
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inbound.inboundTrucksDaily}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "inboundTrucksDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 5"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Inbound Packaging{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <select
                            value={formData.inbound.inboundPackaging}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "inboundPackaging",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select type</option>
                            <option value="Pallets">Pallets</option>
                            <option value="Cartons">Cartons</option>
                            <option value="Mixed">Mixed</option>
                            <option value="Bulk">Bulk</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Inbound Split
                          </label>
                          <select
                            value={formData.inbound.inboundSplit}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "inboundSplit",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select</option>
                            <option value="Full Pallets">Full Pallets</option>
                            <option value="Partial Pallets">
                              Partial Pallets
                            </option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Package Sizes per SKU
                          </label>
                          <input
                            type="text"
                            value={formData.inbound.packageSizesPerSku}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "packageSizesPerSku",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 1-5 sizes"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Avg Pallets per Shipment
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inbound.palletsPerShipmentAvg}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "palletsPerShipmentAvg",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 5"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Avg SKUs per Pallet
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.inbound.skusPerPalletAvg}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "skusPerPalletAvg",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 10"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm">
                        <strong>Verification Requirements:</strong> Specify what
                        percentage of inbound needs verification at each level.
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Verify Pallet (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.inbound.verifyPalletPct}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "verifyPalletPct",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 100"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Verify Carton (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.inbound.verifyCartonPct}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "verifyCartonPct",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 20"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Verify Piece (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.inbound.verifyPiecePct}
                            onChange={(e) =>
                              updateField(
                                "inbound",
                                "verifyPiecePct",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 5"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Inbound Inspection Requirements
                        </label>
                        <textarea
                          value={formData.inbound.inboundInspection}
                          onChange={(e) =>
                            updateField(
                              "inbound",
                              "inboundInspection",
                              e.target.value,
                            )
                          }
                          placeholder="Describe any special inspection requirements..."
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </details>

                  {/* Outbound Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        C
                      </span>
                      <strong className="text-sm">Outbound Operations</strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Outbound Pallets{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.outbound.outboundPalletsDaily}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "outboundPalletsDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 45"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Outbound Shipments
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.outbound.outboundShipmentsDaily}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "outboundShipmentsDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 15"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Outbound Trucks
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.outbound.outboundTrucksDaily}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "outboundTrucksDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 8"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Rotation Rule{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <select
                            value={formData.outbound.rotationRule}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "rotationRule",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select rule</option>
                            <option value="FIFO">
                              FIFO (First In, First Out)
                            </option>
                            <option value="LIFO">
                              LIFO (Last In, First Out)
                            </option>
                            <option value="FEFO">
                              FEFO (First Expiry, First Out)
                            </option>
                            <option value="None">No specific rule</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Outbound Type{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <select
                            value={formData.outbound.outboundType}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "outboundType",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select type</option>
                            <option value="Pallet">Pallet</option>
                            <option value="Case">Case</option>
                            <option value="Piece">Piece</option>
                            <option value="Mixed">Mixed</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Daily Orders{" "}
                            <span className="text-orange-400">ⓘ</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.outbound.ordersDaily}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "ordersDaily",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 200"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Lines per Order (avg)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.outbound.linesPerOrder}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "linesPerOrder",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., 5"
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">
                            Cutoff Time
                          </label>
                          <input
                            type="time"
                            value={formData.outbound.cutoffTime}
                            onChange={(e) =>
                              updateField(
                                "outbound",
                                "cutoffTime",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Outbound Notes
                        </label>
                        <textarea
                          value={formData.outbound.outboundNotes}
                          onChange={(e) =>
                            updateField(
                              "outbound",
                              "outboundNotes",
                              e.target.value,
                            )
                          }
                          placeholder="Any special outbound requirements, delivery windows, etc..."
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </details>

                  {/* Returns Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        D
                      </span>
                      <strong className="text-sm">Returns Processing</strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Returns Required?
                        </label>
                        <select
                          value={formData.returns.returnsRequired}
                          onChange={(e) =>
                            updateField(
                              "returns",
                              "returnsRequired",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Occasional">Occasional</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          Returns Notes
                        </label>
                        <textarea
                          value={formData.returns.returnsNotes}
                          onChange={(e) =>
                            updateField(
                              "returns",
                              "returnsNotes",
                              e.target.value,
                            )
                          }
                          placeholder="Describe returns process, volumes, inspection requirements..."
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </details>

                  {/* VAS Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        E
                      </span>
                      <strong className="text-sm">
                        Value-Added Services (VAS)
                      </strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          VAS Required?
                        </label>
                        <select
                          value={formData.vas.vasRequired}
                          onChange={(e) =>
                            updateField("vas", "vasRequired", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="TBD">To be determined</option>
                        </select>
                      </div>
                      {formData.vas.vasRequired === "Yes" && (
                        <>
                          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-sm mb-4">
                            <strong>Select VAS Services:</strong>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasRepack}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasRepack",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Repack</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasKitting}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasKitting",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Kitting</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasPalletize}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasPalletize",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Palletize</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasLabel}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasLabel",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Labeling</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasBarcode}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasBarcode",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Barcode Printing</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                              <input
                                type="checkbox"
                                checked={formData.vas.vasShrink}
                                onChange={(e) =>
                                  updateField(
                                    "vas",
                                    "vasShrink",
                                    e.target.checked,
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              <span className="text-sm">Shrink Wrapping</span>
                            </label>
                          </div>
                          <div className="mt-4">
                            <label className="block text-sm text-gray-300 mb-2">
                              Other VAS Description
                            </label>
                            <input
                              type="text"
                              value={formData.vas.vasOtherDesc}
                              onChange={(e) =>
                                updateField(
                                  "vas",
                                  "vasOtherDesc",
                                  e.target.value,
                                )
                              }
                              placeholder="Describe other VAS requirements..."
                              className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">
                              VAS Volumes
                            </label>
                            <input
                              type="text"
                              value={formData.vas.vasVolumes}
                              onChange={(e) =>
                                updateField("vas", "vasVolumes", e.target.value)
                              }
                              placeholder="e.g., 100 units/day for repack, 50 kits/day..."
                              className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </details>

                  {/* Systems Subsection */}
                  <details open className="bg-white/5 rounded-xl p-4">
                    <summary className="cursor-pointer flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                        F
                      </span>
                      <strong className="text-sm">Systems & Integration</strong>
                    </summary>
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          WMS System
                        </label>
                        <select
                          value={formData.systems.wms}
                          onChange={(e) =>
                            updateField("systems", "wms", e.target.value)
                          }
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select WMS</option>
                          <option value="Flex WMS">Flex WMS</option>
                          <option value="SAP WM">SAP WM</option>
                          <option value="Oracle WMS">Oracle WMS</option>
                          <option value="Manhattan">Manhattan</option>
                          <option value="HighJump">HighJump</option>
                          <option value="Other">Other</option>
                          <option value="None">None / Manual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          System Requirements
                        </label>
                        <textarea
                          value={formData.systems.systemReq}
                          onChange={(e) =>
                            updateField("systems", "systemReq", e.target.value)
                          }
                          placeholder="Describe any special system integration requirements, EDI needs, API requirements, etc..."
                          rows={4}
                          className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </motion.details>

              {/* Section III: KPIs & Reporting */}
              <motion.details
                open={activeSection === "III"}
                onToggle={(e) =>
                  setActiveSection(e.currentTarget.open ? "III" : "")
                }
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                      III
                    </span>
                    <strong>KPIs & Reporting Requirements</strong>
                  </div>
                  <span className="text-xl">▾</span>
                </summary>
                <div className="p-4 pt-0 space-y-4">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-sm">
                    <strong>KPI Requirements:</strong> Specify what KPIs and
                    reports you need. This helps us structure our service level
                    agreements.
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      KPI & Reporting Requirements
                    </label>
                    <textarea
                      value={formData.kpis}
                      onChange={(e) =>
                        updateField("main", "kpis", e.target.value)
                      }
                      placeholder="Examples: On-time delivery %, Inventory accuracy %, Order fill rate %, Daily/Weekly/Monthly reports, Dashboard access, etc..."
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                </div>
              </motion.details>

              {/* Section IV: Additional Requirements */}
              <motion.details
                open={activeSection === "IV"}
                onToggle={(e) =>
                  setActiveSection(e.currentTarget.open ? "IV" : "")
                }
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              >
                <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono">
                      IV
                    </span>
                    <strong>Additional Requirements & Attachments</strong>
                  </div>
                  <span className="text-xl">▾</span>
                </summary>
                <div className="p-4 pt-0 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Additional Requirements
                    </label>
                    <textarea
                      value={formData.additional}
                      onChange={(e) =>
                        updateField("main", "additional", e.target.value)
                      }
                      placeholder="Any other requirements, special considerations, compliance needs, certifications required, etc..."
                      rows={5}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Certification & Compliance
                    </label>
                    <textarea
                      value={formData.certify}
                      onChange={(e) =>
                        updateField("main", "certify", e.target.value)
                      }
                      placeholder="Required certifications (ISO, HACCP, etc.), compliance requirements, audit requirements..."
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  {/* File Attachments */}
                  <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-300">
                        Attachments
                      </label>
                      <label className="px-4 py-2 bg-indigo-500/30 border border-indigo-500/50 rounded-lg text-sm cursor-pointer hover:bg-indigo-500/40 transition-colors flex items-center gap-2">
                        <i className="ri-upload-line" />
                        Upload Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                    {attachments.length > 0 ? (
                      <div className="space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white/5 rounded-lg p-2 text-sm"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <i className="ri-file-line text-gray-400" />
                              <span className="truncate text-gray-300">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveAttachment(index)}
                              className="px-2 py-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <i className="ri-close-line" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-4">
                        No attachments yet. Click "Upload Files" to add
                        documents.
                      </div>
                    )}
                  </div>
                </div>
              </motion.details>
            </div>

            {/* Live Intelligence Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold mb-2">
                    Live Pricing Intelligence
                  </h2>
                  <p className="text-sm text-gray-400">
                    As you fill the form, the portal estimates readiness,
                    assumptions, and key cost drivers.
                  </p>
                </div>

                {analysis && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">
                          Data completeness
                        </div>
                        <div className="text-2xl font-bold">
                          {analysis.completeness}%
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">
                          Pricing confidence
                        </div>
                        <div className="text-lg font-semibold">
                          {analysis.confidence}
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <strong>Readiness badge</strong>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(analysis.badge)}`}
                        >
                          {analysis.badge}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300 mt-2">
                        <span className="text-green-400">Green</span> = price
                        confidently •{" "}
                        <span className="text-yellow-400">Amber</span> = price
                        with assumptions •{" "}
                        <span className="text-red-400">Red</span> = major gaps
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-3">
                        Key drivers detected
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Storage size basis
                          </span>
                          <span className="font-mono">
                            {analysis.keyDrivers.storage}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">
                            Handling intensity
                          </span>
                          <span className="font-mono">
                            {analysis.keyDrivers.handling}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pick complexity</span>
                          <span className="font-mono">
                            {analysis.keyDrivers.pick}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">
                        Assumptions (auto-generated)
                      </div>
                      <div className="text-xs text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                        {analysis.assumptions.length > 0 ? (
                          analysis.assumptions.map((a, i) => (
                            <div key={i}>• {a}</div>
                          ))
                        ) : (
                          <div className="text-green-400">
                            No major assumptions detected
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Intelligence Recommendations */}
                {intelligence &&
                  intelligence.recommendations &&
                  intelligence.recommendations.length > 0 && (
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <i className="ri-lightbulb-flash-line" />
                        Smart Recommendations
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {intelligence.recommendations
                          .slice(0, 5)
                          .map((rec: any, i: number) => (
                            <div
                              key={i}
                              className="bg-white/5 rounded-lg p-2 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-white mb-1">
                                    {rec.title}
                                  </div>
                                  <div className="text-gray-400">
                                    {rec.description}
                                  </div>
                                  {rec.impact && (
                                    <div className="text-purple-300 mt-1 text-[10px]">
                                      💡 {rec.impact}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-[10px] ${
                                    rec.priority === "high"
                                      ? "bg-red-500/30 text-red-300"
                                      : rec.priority === "medium"
                                        ? "bg-yellow-500/30 text-yellow-300"
                                        : "bg-blue-500/30 text-blue-300"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Risk Predictions */}
                {intelligence &&
                  intelligence.riskPredictions &&
                  intelligence.riskPredictions.length > 0 && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <i className="ri-alert-line" />
                        Risk Factors
                      </div>
                      <div className="space-y-2">
                        {intelligence.riskPredictions
                          .slice(0, 3)
                          .map((risk: any, i: number) => (
                            <div
                              key={i}
                              className="bg-white/5 rounded-lg p-2 text-xs"
                            >
                              <div className="font-semibold text-white mb-1">
                                {risk.description}
                              </div>
                              {risk.mitigation &&
                                risk.mitigation.length > 0 && (
                                  <div className="text-gray-400 mt-1">
                                    <div className="text-[10px] mb-1">
                                      Mitigation:
                                    </div>
                                    {risk.mitigation
                                      .slice(0, 2)
                                      .map((m: string, j: number) => (
                                        <div key={j} className="text-[10px]">
                                          • {m}
                                        </div>
                                      ))}
                                  </div>
                                )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Estimated Value & Success Probability */}
                {intelligence && (
                  <div className="grid grid-cols-2 gap-4">
                    {intelligence.estimatedValue && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">
                          Estimated Value
                        </div>
                        <div className="text-lg font-bold">
                          {new Intl.NumberFormat("en-SA", {
                            style: "currency",
                            currency: "SAR",
                            maximumFractionDigits: 0,
                          }).format(intelligence.estimatedValue)}
                        </div>
                      </div>
                    )}
                    {intelligence.successProbability !== undefined && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">
                          Success Probability
                        </div>
                        <div className="text-lg font-bold">
                          {(intelligence.successProbability * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                <div>
                  <div className="text-sm text-gray-400 mb-2 flex items-center justify-between">
                    <span>Completion</span>
                    <span className="font-semibold">
                      {analysis?.completeness || 0}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 via-blue-400 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis?.completeness || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
