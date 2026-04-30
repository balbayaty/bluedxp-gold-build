/**
 * Comprehensive ETW Creation Form
 *
 * Full-featured form with all ETW sections:
 * A) Transport Reference Matrix
 * B) Transport Scope & Mode
 * C) Parties & Legal Roles
 * D) Cargo Declaration
 * E) Compliance Flags
 * F) Permits & Regulatory Processing
 * G) Route & Execution
 * H) Commercial & Rate Context
 */

"use client";

import { useState, useEffect } from "react";
import type {
  ETWScope,
  TransportMode,
  Party,
  CargoItem,
  ComplianceFlags,
} from "@/types/etw";
import { CreateETWSchema } from "@/types/etw";
import { z } from "zod";
import type { Location } from "@/types/tms";

interface ETWCreateFormProps {
  onSubmit: (data: z.infer<typeof CreateETWSchema>) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<z.infer<typeof CreateETWSchema>>;
  isSubmitting?: boolean;
}

export default function ETWCreateForm({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}: ETWCreateFormProps) {
  const [currentSection, setCurrentSection] = useState<string>("scope");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<
    Partial<z.infer<typeof CreateETWSchema>>
  >({
    scope: "LOCAL",
    mode: "LAND",
    references: {
      shipmentNumber: "",
      invoiceNumber: "",
      purchaseOrderNumber: "",
      customerReference: "",
      internalReference: "",
      carrierReference: "",
    },
    parties: [
      {
        id: "shipper-1",
        type: "SHIPPER",
        name: "",
        contact: {
          name: "",
          phone: "",
          email: "",
          address: "",
        },
      },
      {
        id: "consignee-1",
        type: "CONSIGNEE",
        name: "",
        contact: {
          name: "",
          phone: "",
          email: "",
          address: "",
        },
      },
    ],
    cargo: {
      items: [],
      totalWeight: 0,
      totalValue: 0,
      currency: "SAR",
      totalPieces: 0,
    },
    compliance: {
      hazardous: false,
    },
    route: {
      origin: {
        id: "origin-1",
        name: "",
        type: "ORIGIN",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "SA",
          countryCode: "SA",
        },
      },
      destination: {
        id: "destination-1",
        name: "",
        type: "DESTINATION",
        address: {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "SA",
          countryCode: "SA",
        },
      },
      waypoints: [],
      mode: "LAND",
    },
    commercial: {
      contractType: "CONTRACT",
      rate: {
        base: 0,
        currency: "SAR",
        total: 0,
        surcharges: [],
      },
    },
    ...initialData,
  });

  const sections = [
    { id: "scope", label: "Scope & Mode", icon: "🚚" },
    { id: "references", label: "References", icon: "📋" },
    { id: "parties", label: "Parties", icon: "👥" },
    { id: "cargo", label: "Cargo", icon: "📦" },
    { id: "compliance", label: "Compliance", icon: "✅" },
    { id: "route", label: "Route", icon: "🗺️" },
    { id: "commercial", label: "Commercial", icon: "💰" },
  ];

  const validateSection = (section: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (section) {
      case "scope":
        if (!formData.scope) newErrors.scope = "Scope is required";
        if (!formData.mode) newErrors.mode = "Mode is required";
        break;
      case "parties":
        if (!formData.parties || formData.parties.length < 2) {
          newErrors.parties =
            "At least 2 parties (Shipper and Consignee) are required";
        } else {
          formData.parties.forEach((party, idx) => {
            if (!party.name)
              newErrors[`party-${idx}-name`] = "Party name is required";
            if (!party.contact?.email)
              newErrors[`party-${idx}-email`] = "Email is required";
          });
        }
        break;
      case "cargo":
        if (!formData.cargo?.items || formData.cargo.items.length === 0) {
          newErrors.cargo = "At least one cargo item is required";
        }
        if (!formData.cargo?.totalWeight || formData.cargo.totalWeight <= 0) {
          newErrors.totalWeight = "Total weight must be greater than 0";
        }
        break;
      case "route":
        if (!formData.route?.origin?.name)
          newErrors.origin = "Origin name is required";
        if (!formData.route?.origin?.address?.street)
          newErrors.origin = "Origin street address is required";
        if (!formData.route?.origin?.address?.city)
          newErrors.origin = "Origin city is required";
        if (!formData.route?.origin?.address?.postalCode)
          newErrors.origin = "Origin postal code is required";
        if (!formData.route?.destination?.name)
          newErrors.destination = "Destination name is required";
        if (!formData.route?.destination?.address?.street)
          newErrors.destination = "Destination street address is required";
        if (!formData.route?.destination?.address?.city)
          newErrors.destination = "Destination city is required";
        if (!formData.route?.destination?.address?.postalCode)
          newErrors.destination = "Destination postal code is required";
        break;
      case "commercial":
        if (
          !formData.commercial?.rate?.base ||
          formData.commercial.rate.base <= 0
        ) {
          newErrors.rate = "Base rate is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      const currentIndex = sections.findIndex((s) => s.id === currentSection);
      if (currentIndex < sections.length - 1) {
        setCurrentSection(sections[currentIndex + 1].id);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = sections.findIndex((s) => s.id === currentSection);
    if (currentIndex > 0) {
      setCurrentSection(sections[currentIndex - 1].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all sections
    let isValid = true;
    for (const section of sections) {
      if (!validateSection(section.id)) {
        isValid = false;
        setCurrentSection(section.id);
        break;
      }
    }

    if (!isValid) {
      return;
    }

    try {
      // Transform form data to match schema exactly
      const transformedData: z.infer<typeof CreateETWSchema> = {
        tenantId: "", // Will be set by API
        scope: formData.scope!,
        mode: formData.mode!,
        references: formData.references || {},
        parties: (formData.parties || []).map((party) => ({
          id: party.id,
          type: party.type,
          name: party.name,
          contact: {
            name: party.contact?.name || "",
            phone: party.contact?.phone || "",
            email: party.contact?.email || "",
            address: party.contact?.address || "",
          },
        })),
        cargo: {
          items: (formData.cargo?.items || []).map((item) => ({
            id: item.id,
            description: item.description,
            hsCode: item.hsCode,
            packaging: {
              type: item.packaging?.type || "BOX",
              quantity: item.packaging?.quantity || 0,
              unit: item.packaging?.unit || "PCS",
            },
            weight: {
              gross: item.weight?.gross || 0,
              net: item.weight?.net || item.weight?.gross || 0,
              unit: (item.weight?.unit || "KG") as "KG" | "TON",
            },
            value: {
              amount: item.value?.amount || 0,
              currency: item.value?.currency || "SAR",
            },
          })),
          totalWeight: formData.cargo?.totalWeight || 0,
          totalValue: formData.cargo?.totalValue || 0,
          currency: formData.cargo?.currency || "SAR",
          totalPieces: formData.cargo?.totalPieces || 0,
        },
        compliance: {
          hazardous: formData.compliance?.hazardous || false,
        },
        route: {
          origin: {
            id: formData.route?.origin?.id || "origin-1",
            name: formData.route?.origin?.name || "",
            type: formData.route?.origin?.type || "ORIGIN",
            address: {
              street: formData.route?.origin?.address?.street || "",
              city: formData.route?.origin?.address?.city || "",
              state: formData.route?.origin?.address?.state || "",
              postalCode: formData.route?.origin?.address?.postalCode || "",
              country: formData.route?.origin?.address?.country || "SA",
              countryCode: formData.route?.origin?.address?.countryCode || "SA",
            },
          },
          destination: {
            id: formData.route?.destination?.id || "destination-1",
            name: formData.route?.destination?.name || "",
            type: formData.route?.destination?.type || "DESTINATION",
            address: {
              street: formData.route?.destination?.address?.street || "",
              city: formData.route?.destination?.address?.city || "",
              state: formData.route?.destination?.address?.state || "",
              postalCode:
                formData.route?.destination?.address?.postalCode || "",
              country: formData.route?.destination?.address?.country || "SA",
              countryCode:
                formData.route?.destination?.address?.countryCode || "SA",
            },
          },
          waypoints: formData.route?.waypoints || [],
          mode: formData.route?.mode || formData.mode!,
        },
        commercial: {
          contractType: formData.commercial?.contractType || "CONTRACT",
          rate: {
            base: formData.commercial?.rate?.base || 0,
            currency: formData.commercial?.rate?.currency || "SAR",
            surcharges: formData.commercial?.rate?.surcharges || [],
            total:
              (formData.commercial?.rate?.base || 0) +
              (formData.commercial?.rate?.surcharges?.reduce(
                (sum, s) => sum + (s.amount || 0),
                0,
              ) || 0),
          },
        },
        createdBy: "", // Will be set by API
      };

      await onSubmit(transformedData);
    } catch (error) {
      console.error("[ETW Form] Submit error:", error);
    }
  };

  const addParty = () => {
    setFormData({
      ...formData,
      parties: [
        ...(formData.parties || []),
        {
          id: `party-${Date.now()}`,
          type: "CARRIER",
          name: "",
          contact: {
            name: "",
            phone: "",
            email: "",
            address: "",
          },
          verified: false,
        },
      ],
    });
  };

  const removeParty = (id: string) => {
    if ((formData.parties?.length || 0) <= 2) {
      setErrors({ ...errors, parties: "At least 2 parties are required" });
      return;
    }
    setFormData({
      ...formData,
      parties: formData.parties?.filter((p) => p.id !== id) || [],
    });
  };

  const updateParty = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      parties:
        formData.parties?.map((p) =>
          p.id === id ? { ...p, [field]: value } : p,
        ) || [],
    });
  };

  const addCargoItem = () => {
    setFormData({
      ...formData,
      cargo: {
        ...formData.cargo,
        items: [
          ...(formData.cargo?.items || []),
          {
            id: `item-${Date.now()}`,
            description: "",
            hsCode: "",
            packaging: {
              type: "BOX",
              quantity: 0,
              unit: "PCS",
            },
            weight: {
              gross: 0,
              net: 0,
              unit: "KG" as const,
            },
            value: {
              amount: 0,
              currency: "SAR",
            },
          } as CargoItem,
        ],
      },
    });
  };

  const removeCargoItem = (id: string) => {
    setFormData({
      ...formData,
      cargo: {
        ...formData.cargo,
        items: formData.cargo?.items?.filter((item) => item.id !== id) || [],
      },
    });
  };

  const updateCargoItem = (id: string, field: string, value: any) => {
    setFormData({
      ...formData,
      cargo: {
        ...formData.cargo,
        items:
          formData.cargo?.items?.map((item) =>
            item.id === id ? { ...item, [field]: value } : item,
          ) || [],
        totalWeight:
          formData.cargo?.items?.reduce(
            (sum, item) => sum + (item.weight?.gross || 0),
            0,
          ) || 0,
        totalValue:
          formData.cargo?.items?.reduce(
            (sum, item) => sum + (item.value?.amount || 0),
            0,
          ) || 0,
        totalPieces:
          formData.cargo?.items?.reduce(
            (sum, item) => sum + (item.packaging?.quantity || 0),
            0,
          ) || 0,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          {sections.map((section, idx) => (
            <div key={section.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => setCurrentSection(section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentSection === section.id
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                <span>{section.icon}</span>
                <span className="text-sm font-medium">{section.label}</span>
              </button>
              {idx < sections.length - 1 && (
                <div className="flex-1 h-0.5 bg-gray-600 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Scope & Mode Section */}
        {currentSection === "scope" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Transport Scope & Mode
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Scope *
                </label>
                <select
                  value={formData.scope || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      scope: e.target.value as ETWScope,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="LOCAL">Local</option>
                  <option value="INTERCITY">Inter-city</option>
                  <option value="CROSS_BORDER">Cross-border</option>
                  <option value="MULTIMODAL">Multimodal</option>
                </select>
                {errors.scope && (
                  <p className="text-red-400 text-xs mt-1">{errors.scope}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Mode *
                </label>
                <select
                  value={formData.mode || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mode: e.target.value as TransportMode,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="LAND">Land</option>
                  <option value="AIR">Air</option>
                  <option value="SEA">Sea</option>
                  <option value="RAIL">Rail</option>
                  <option value="MULTIMODAL">Multimodal</option>
                  <option value="EXPRESS">Express</option>
                  <option value="COURIER">Courier</option>
                </select>
                {errors.mode && (
                  <p className="text-red-400 text-xs mt-1">{errors.mode}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* References Section */}
        {currentSection === "references" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Transport Reference Matrix
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Shipment Number
                </label>
                <input
                  type="text"
                  value={formData.references?.shipmentNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        shipmentNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="SHIP-12345"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.references?.invoiceNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        invoiceNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="INV-12345"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Purchase Order Number
                </label>
                <input
                  type="text"
                  value={formData.references?.purchaseOrderNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        purchaseOrderNumber: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="PO-12345"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Customer Reference
                </label>
                <input
                  type="text"
                  value={formData.references?.customerReference || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        customerReference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="CUST-REF-12345"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Internal Reference
                </label>
                <input
                  type="text"
                  value={formData.references?.internalReference || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        internalReference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="INT-REF-12345"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Carrier Reference
                </label>
                <input
                  type="text"
                  value={formData.references?.carrierReference || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      references: {
                        ...formData.references,
                        carrierReference: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="CARRIER-REF-12345"
                />
              </div>
            </div>
          </div>
        )}

        {/* Parties Section */}
        {currentSection === "parties" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Parties & Legal Roles
              </h2>
              <button
                type="button"
                onClick={addParty}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm"
              >
                + Add Party
              </button>
            </div>
            {errors.parties && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                {errors.parties}
              </div>
            )}
            <div className="space-y-4">
              {formData.parties?.map((party, idx) => (
                <div
                  key={party.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-white font-medium">
                      Party {idx + 1}: {party.type}
                    </h3>
                    {formData.parties && formData.parties.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeParty(party.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Party Type
                      </label>
                      <select
                        value={party.type}
                        onChange={(e) =>
                          updateParty(party.id, "type", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        <option value="SHIPPER">Shipper</option>
                        <option value="CONSIGNEE">Consignee</option>
                        <option value="CARRIER">Carrier</option>
                        <option value="BROKER">Broker</option>
                        <option value="AUTHORITY">Authority</option>
                        <option value="CUSTOMS">Customs</option>
                        <option value="WAREHOUSE">Warehouse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={party.name}
                        onChange={(e) =>
                          updateParty(party.id, "name", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Company Name"
                        required
                      />
                      {errors[`party-${idx}-name`] && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors[`party-${idx}-name`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={party.contact?.name || ""}
                        onChange={(e) =>
                          updateParty(party.id, "contact", {
                            ...party.contact,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Contact Person"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={party.contact?.phone || ""}
                        onChange={(e) =>
                          updateParty(party.id, "contact", {
                            ...party.contact,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="+966 50 123 4567"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-400 text-sm mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={party.contact?.email || ""}
                        onChange={(e) =>
                          updateParty(party.id, "contact", {
                            ...party.contact,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="contact@company.com"
                        required
                      />
                      {errors[`party-${idx}-email`] && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors[`party-${idx}-email`]}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="block text-gray-400 text-sm mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={party.contact?.address || ""}
                        onChange={(e) =>
                          updateParty(party.id, "contact", {
                            ...party.contact,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Full Address"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cargo Section */}
        {currentSection === "cargo" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Cargo Declaration
              </h2>
              <button
                type="button"
                onClick={addCargoItem}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm"
              >
                + Add Item
              </button>
            </div>
            {errors.cargo && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
                {errors.cargo}
              </div>
            )}
            <div className="space-y-4">
              {formData.cargo?.items?.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-white font-medium">Item {idx + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeCargoItem(item.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-gray-400 text-sm mb-2">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateCargoItem(
                            item.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        HS Code
                      </label>
                      <input
                        type="text"
                        value={item.hsCode || ""}
                        onChange={(e) =>
                          updateCargoItem(item.id, "hsCode", e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="1234.56.78"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.packaging?.quantity || 0}
                        onChange={(e) =>
                          updateCargoItem(item.id, "packaging", {
                            ...item.packaging,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="0"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Unit
                      </label>
                      <select
                        value={item.packaging?.unit || "PCS"}
                        onChange={(e) =>
                          updateCargoItem(item.id, "packaging", {
                            ...item.packaging,
                            unit: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      >
                        <option value="PCS">Pieces</option>
                        <option value="KG">Kilograms</option>
                        <option value="TON">Tons</option>
                        <option value="L">Liters</option>
                        <option value="M3">Cubic Meters</option>
                        <option value="PALLET">Pallets</option>
                        <option value="CONTAINER">Containers</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Gross Weight (kg) *
                      </label>
                      <input
                        type="number"
                        value={item.weight?.gross || 0}
                        onChange={(e) =>
                          updateCargoItem(item.id, "weight", {
                            ...item.weight,
                            gross: parseFloat(e.target.value) || 0,
                            net:
                              item.weight?.net ||
                              parseFloat(e.target.value) ||
                              0,
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Value *
                      </label>
                      <input
                        type="number"
                        value={item.value?.amount || 0}
                        onChange={(e) =>
                          updateCargoItem(item.id, "value", {
                            ...item.value,
                            amount: parseFloat(e.target.value) || 0,
                            currency: item.value?.currency || "SAR",
                          })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {formData.cargo &&
              formData.cargo.items &&
              formData.cargo.items.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mt-4">
                  <h3 className="text-white font-medium mb-3">Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Total Weight
                      </label>
                      <p className="text-white font-semibold">
                        {formData.cargo.totalWeight.toFixed(2)} kg
                      </p>
                      {errors.totalWeight && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.totalWeight}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Total Value
                      </label>
                      <p className="text-white font-semibold">
                        {formData.cargo.totalValue.toFixed(2)}{" "}
                        {formData.cargo.currency}
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">
                        Total Pieces
                      </label>
                      <p className="text-white font-semibold">
                        {formData.cargo.totalPieces}
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Compliance Section */}
        {currentSection === "compliance" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Compliance Flags
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-gray-900 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.compliance?.hazardous || false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compliance: {
                        ...formData.compliance,
                        hazardous: e.target.checked,
                      },
                    })
                  }
                  className="mt-1 w-4 h-4 text-cyan-600 bg-gray-800 border-gray-700 rounded focus:ring-cyan-500"
                />
                <div>
                  <p className="text-white font-medium">Hazardous Materials</p>
                  <p className="text-gray-400 text-sm">
                    Contains hazardous/dangerous goods
                  </p>
                </div>
              </label>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      formData.compliance?.temperatureControl?.required || false
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compliance: {
                          ...formData.compliance,
                          temperatureControl: {
                            required: e.target.checked,
                            min: formData.compliance?.temperatureControl?.min,
                            max: formData.compliance?.temperatureControl?.max,
                          },
                        },
                      })
                    }
                    className="mt-1 w-4 h-4 text-cyan-600 bg-gray-800 border-gray-700 rounded focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      Temperature Controlled
                    </p>
                    <p className="text-gray-400 text-sm mb-3">
                      Requires temperature control
                    </p>
                    {formData.compliance?.temperatureControl?.required && (
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Min Temperature (°C)
                          </label>
                          <input
                            type="number"
                            value={
                              formData.compliance?.temperatureControl?.min || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                compliance: {
                                  ...formData.compliance,
                                  temperatureControl: {
                                    required: true,
                                    min:
                                      parseFloat(e.target.value) || undefined,
                                    max: formData.compliance?.temperatureControl
                                      ?.max,
                                  },
                                },
                              })
                            }
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="Min temp"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm mb-2">
                            Max Temperature (°C)
                          </label>
                          <input
                            type="number"
                            value={
                              formData.compliance?.temperatureControl?.max || ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                compliance: {
                                  ...formData.compliance,
                                  temperatureControl: {
                                    required: true,
                                    min: formData.compliance?.temperatureControl
                                      ?.min,
                                    max:
                                      parseFloat(e.target.value) || undefined,
                                  },
                                },
                              })
                            }
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                            placeholder="Max temp"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Route Section */}
        {currentSection === "route" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Route & Execution
            </h2>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-4">Origin *</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.origin?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              name: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Origin Location"
                      required
                    />
                    {errors.origin && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.origin}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.origin?.address?.street || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              address: {
                                ...formData.route?.origin?.address,
                                street: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.origin?.address?.city || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              address: {
                                ...formData.route?.origin?.address,
                                city: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Jeddah"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.origin?.address?.postalCode || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              address: {
                                ...formData.route?.origin?.address,
                                postalCode: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.route?.origin?.address?.state || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              address: {
                                ...formData.route?.origin?.address,
                                state: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Port/Airport Code
                    </label>
                    <input
                      type="text"
                      value={
                        formData.route?.origin?.portCode ||
                        formData.route?.origin?.airportCode ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            origin: {
                              ...formData.route?.origin,
                              portCode: e.target.value,
                              airportCode: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="JED"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-white font-medium mb-4">Destination *</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.destination?.name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              name: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Destination Location"
                      required
                    />
                    {errors.destination && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.destination}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-sm mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.destination?.address?.street || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              address: {
                                ...formData.route?.destination?.address,
                                street: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Street address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.route?.destination?.address?.city || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              address: {
                                ...formData.route?.destination?.address,
                                city: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="Riyadh"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      value={
                        formData.route?.destination?.address?.postalCode || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              address: {
                                ...formData.route?.destination?.address,
                                postalCode: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.route?.destination?.address?.state || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              address: {
                                ...formData.route?.destination?.address,
                                state: e.target.value,
                              },
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">
                      Port/Airport Code
                    </label>
                    <input
                      type="text"
                      value={
                        formData.route?.destination?.portCode ||
                        formData.route?.destination?.airportCode ||
                        ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          route: {
                            ...formData.route,
                            destination: {
                              ...formData.route?.destination,
                              portCode: e.target.value,
                              airportCode: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      placeholder="RUH"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commercial Section */}
        {currentSection === "commercial" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              Commercial & Rate Context
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Contract Type *
                </label>
                <select
                  value={formData.commercial?.contractType || "CONTRACT"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercial: {
                        ...formData.commercial,
                        contractType: e.target.value as
                          | "CONTRACT"
                          | "SPOT"
                          | "BENCHMARK",
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option value="CONTRACT">Contract</option>
                  <option value="SPOT">Spot</option>
                  <option value="BENCHMARK">Benchmark</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Currency
                </label>
                <select
                  value={formData.commercial?.rate?.currency || "SAR"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      commercial: {
                        ...formData.commercial,
                        rate: {
                          ...formData.commercial?.rate,
                          currency: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                >
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-400 text-sm mb-2">
                  Base Rate *
                </label>
                <input
                  type="number"
                  value={formData.commercial?.rate?.base || 0}
                  onChange={(e) => {
                    const base = parseFloat(e.target.value) || 0;
                    const surcharges =
                      formData.commercial?.rate?.surcharges || [];
                    const surchargeTotal = surcharges.reduce(
                      (sum, s) => sum + (s.amount || 0),
                      0,
                    );
                    setFormData({
                      ...formData,
                      commercial: {
                        ...formData.commercial,
                        rate: {
                          ...formData.commercial?.rate,
                          base,
                          total: base + surchargeTotal,
                        },
                      },
                    });
                  }}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                {errors.rate && (
                  <p className="text-red-400 text-xs mt-1">{errors.rate}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentSection === sections[0].id}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg"
        >
          Previous
        </button>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          {currentSection === sections[sections.length - 1].id ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium"
            >
              {isSubmitting ? "Creating..." : "Create e-Waybill"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
