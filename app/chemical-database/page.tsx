/**
 * Comprehensive Chemical Database & Library
 * Multi-tab, deep-layer chemical management interface
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { Chemical, ChemicalSearchFilters } from "@/types/chemical";
import { getChemicals, searchChemicals } from "@/app/actions/chemical/actions";
import NFPADiamond from "@/components/NFPADiamond";
import Modal from "@/components/Modal";
import IntelligentInsights from "@/components/chemical/IntelligentInsights";
import DocumentQRGenerator from "@/components/qr/DocumentQRGenerator";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type TabType = "library" | "search" | "categories" | "inventory" | "analytics";

export default function ChemicalDatabasePage() {
  const [activeTab, setActiveTab] = useState<TabType>("library");
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ChemicalSearchFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [detailSubTab, setDetailSubTab] = useState<string>("overview");

  useEffect(() => {
    loadChemicals();
  }, [filters]);

  const loadChemicals = async () => {
    setLoading(true);
    try {
      const result = await getChemicals(filters);
      if (result.success && result.data) {
        setChemicals(result.data.chemicals);
      } else {
        console.error("Error loading chemicals:", result.error);
      }
    } catch (error) {
      console.error("Error loading chemicals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      loadChemicals();
      return;
    }

    setLoading(true);
    try {
      const result = await searchChemicals(searchQuery, filters);
      if (result.success && result.data) {
        setChemicals(result.data.chemicals);
      } else {
        console.error("Error searching chemicals:", result.error);
      }
    } catch (error) {
      console.error("Error searching chemicals:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters]);

  const tabs = [
    {
      id: "library" as TabType,
      label: "Chemical Library",
      icon: "ri-database-2-line",
    },
    {
      id: "search" as TabType,
      label: "Search & Discovery",
      icon: "ri-search-line",
    },
    {
      id: "categories" as TabType,
      label: "Categories",
      icon: "ri-folder-line",
    },
    { id: "inventory" as TabType, label: "Inventory", icon: "ri-box-line" },
    {
      id: "analytics" as TabType,
      label: "Analytics",
      icon: "ri-bar-chart-line",
    },
  ];

  return (
    <PageTemplate
      title="Chemical Database"
      description="Comprehensive chemical library with advanced search, categorization, and analytics"
      icon="ri-database-2-line"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 font-medium transition ${
                activeTab === tab.id
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChemicalLibraryTab
                chemicals={chemicals}
                loading={loading}
                selectedChemical={selectedChemical}
                onSelectChemical={setSelectedChemical}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                detailSubTab={detailSubTab}
                onDetailSubTabChange={setDetailSubTab}
                onRefresh={loadChemicals}
              />
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChemicalSearchTab
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearch={handleSearch}
                filters={filters}
                onFiltersChange={setFilters}
                chemicals={chemicals}
                loading={loading}
                onSelectChemical={setSelectedChemical}
              />
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChemicalCategoriesTab />
            </motion.div>
          )}

          {activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChemicalInventoryTab />
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ChemicalAnalyticsTab chemicals={chemicals} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

// ============================================================================
// CHEMICAL LIBRARY TAB
// ============================================================================

interface ChemicalLibraryTabProps {
  chemicals: Chemical[];
  loading: boolean;
  selectedChemical: Chemical | null;
  onSelectChemical: (chemical: Chemical | null) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  detailSubTab: string;
  onDetailSubTabChange: (tab: string) => void;
  onRefresh: () => void;
}

function ChemicalLibraryTab({
  chemicals,
  loading,
  selectedChemical,
  onSelectChemical,
  viewMode,
  onViewModeChange,
  detailSubTab,
  onDetailSubTabChange,
  onRefresh,
}: ChemicalLibraryTabProps) {
  const [filters, setFilters] = useState({
    hazardClass: "",
    storageClass: "",
    manufacturer: "",
    complianceStatus: "",
  });

  const detailSubTabs = [
    { id: "overview", label: "Overview", icon: "ri-information-line" },
    { id: "properties", label: "Properties", icon: "ri-flask-line" },
    { id: "hazards", label: "Hazards", icon: "ri-alert-line" },
    { id: "storage", label: "Storage", icon: "ri-archive-line" },
    { id: "transport", label: "Transport", icon: "ri-truck-line" },
    { id: "compliance", label: "Compliance", icon: "ri-shield-check-line" },
    { id: "history", label: "History", icon: "ri-history-line" },
    { id: "related", label: "Related", icon: "ri-links-line" },
    { id: "intelligence", label: "AI Intelligence", icon: "ri-brain-line" },
  ];

  if (selectedChemical) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => onSelectChemical(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <i className="ri-arrow-left-line"></i>
          Back to Library
        </button>

        {/* Chemical Detail Header */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {selectedChemical.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {selectedChemical.casNumber && (
                  <span>CAS: {selectedChemical.casNumber}</span>
                )}
                {selectedChemical.formula && (
                  <span>Formula: {selectedChemical.formula}</span>
                )}
                {selectedChemical.manufacturer && (
                  <span>Manufacturer: {selectedChemical.manufacturer}</span>
                )}
              </div>
            </div>
            {selectedChemical.hazards.nfpa && (
              <NFPADiamond
                health={selectedChemical.hazards.nfpa.health}
                flammability={selectedChemical.hazards.nfpa.flammability}
                reactivity={selectedChemical.hazards.nfpa.reactivity}
                special={selectedChemical.hazards.nfpa.special}
                size="lg"
              />
            )}
          </div>

          {/* Detail Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-700">
            {detailSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onDetailSubTabChange(tab.id)}
                className={`px-4 py-2 flex items-center gap-2 text-sm font-medium transition ${
                  detailSubTab === tab.id
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail Content */}
        <AnimatePresence mode="wait">
          {detailSubTab === "overview" && (
            <ChemicalOverviewDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "properties" && (
            <ChemicalPropertiesDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "hazards" && (
            <ChemicalHazardsDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "storage" && (
            <ChemicalStorageDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "transport" && (
            <ChemicalTransportDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "compliance" && (
            <ChemicalComplianceDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "history" && (
            <ChemicalHistoryDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "related" && (
            <ChemicalRelatedDetail chemical={selectedChemical} />
          )}
          {detailSubTab === "intelligence" && (
            <ChemicalIntelligenceDetail chemical={selectedChemical} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & View Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filters.hazardClass}
            onChange={(e) =>
              setFilters({ ...filters, hazardClass: e.target.value })
            }
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="">All Hazard Classes</option>
            <option value="Class 1">Class 1 - Explosives</option>
            <option value="Class 2">Class 2 - Gases</option>
            <option value="Class 3">Class 3 - Flammable Liquids</option>
            <option value="Class 4">Class 4 - Flammable Solids</option>
            <option value="Class 5">Class 5 - Oxidizing Substances</option>
            <option value="Class 6">Class 6 - Toxic Substances</option>
            <option value="Class 7">Class 7 - Radioactive</option>
            <option value="Class 8">Class 8 - Corrosives</option>
            <option value="Class 9">Class 9 - Miscellaneous</option>
          </select>

          <select
            value={filters.storageClass}
            onChange={(e) =>
              setFilters({ ...filters, storageClass: e.target.value })
            }
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="">All Storage Classes</option>
            <option value="A">Storage Class A</option>
            <option value="B">Storage Class B</option>
            <option value="C">Storage Class C</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg transition ${
              viewMode === "grid"
                ? "bg-cyan-500 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            <i className="ri-grid-line"></i>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-lg transition ${
              viewMode === "list"
                ? "bg-cyan-500 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            <i className="ri-list-check"></i>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      {/* Chemical List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : chemicals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="ri-database-2-line text-4xl mb-4"></i>
          <p>No chemicals found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {chemicals.map((chemical) => (
            <ChemicalCard
              key={chemical.id}
              chemical={chemical}
              onClick={() => onSelectChemical(chemical)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {chemicals.map((chemical) => (
            <ChemicalListItem
              key={chemical.id}
              chemical={chemical}
              onClick={() => onSelectChemical(chemical)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHEMICAL CARD COMPONENT
// ============================================================================

interface ChemicalCardProps {
  chemical: Chemical;
  onClick: () => void;
}

function ChemicalCard({ chemical, onClick }: ChemicalCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="bg-gray-800 rounded-xl p-4 border border-gray-700 cursor-pointer hover:border-cyan-500 transition"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{chemical.name}</h3>
          {chemical.casNumber && (
            <p className="text-sm text-gray-400">CAS: {chemical.casNumber}</p>
          )}
        </div>
        {chemical.hazards.nfpa && (
          <NFPADiamond
            health={chemical.hazards.nfpa.health}
            flammability={chemical.hazards.nfpa.flammability}
            reactivity={chemical.hazards.nfpa.reactivity}
            size="sm"
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {chemical.manufacturer && <span>{chemical.manufacturer}</span>}
        {chemical.metadata.status && (
          <span
            className={`px-2 py-1 rounded ${
              chemical.metadata.status === "Active"
                ? "bg-green-900/30 text-green-400"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {chemical.metadata.status}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// CHEMICAL LIST ITEM COMPONENT
// ============================================================================

interface ChemicalListItemProps {
  chemical: Chemical;
  onClick: () => void;
}

function ChemicalListItem({ chemical, onClick }: ChemicalListItemProps) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-cyan-500 transition flex items-center justify-between"
    >
      <div className="flex items-center gap-4 flex-1">
        {chemical.hazards.nfpa && (
          <NFPADiamond
            health={chemical.hazards.nfpa.health}
            flammability={chemical.hazards.nfpa.flammability}
            reactivity={chemical.hazards.nfpa.reactivity}
            size="sm"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{chemical.name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
            {chemical.casNumber && <span>CAS: {chemical.casNumber}</span>}
            {chemical.formula && <span>Formula: {chemical.formula}</span>}
            {chemical.manufacturer && <span>{chemical.manufacturer}</span>}
          </div>
        </div>
      </div>
      <i className="ri-arrow-right-s-line text-gray-400"></i>
    </motion.div>
  );
}

// ============================================================================
// DETAIL COMPONENTS (Placeholders - will be fully implemented)
// ============================================================================

function ChemicalOverviewDetail({ chemical }: { chemical: Chemical }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Overview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-400">Name</label>
          <p className="font-semibold">{chemical.name}</p>
        </div>
        {chemical.casNumber && (
          <div>
            <label className="text-sm text-gray-400">CAS Number</label>
            <p className="font-semibold">{chemical.casNumber}</p>
          </div>
        )}
        {chemical.formula && (
          <div>
            <label className="text-sm text-gray-400">Formula</label>
            <p className="font-semibold">{chemical.formula}</p>
          </div>
        )}
        {chemical.manufacturer && (
          <div>
            <label className="text-sm text-gray-400">Manufacturer</label>
            <p className="font-semibold">{chemical.manufacturer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChemicalPropertiesDetail({ chemical }: { chemical: Chemical }) {
  const props = chemical.physicalProperties;
  const chemProps = chemical.chemicalProperties;

  return (
    <div className="space-y-6">
      {/* Physical Properties */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-flask-line text-cyan-400"></i>
          Physical Properties
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {props.physicalState && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Physical State</p>
              <p className="font-semibold">{props.physicalState}</p>
            </div>
          )}
          {props.appearance && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Appearance</p>
              <p className="font-semibold">{props.appearance}</p>
            </div>
          )}
          {props.color && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Color</p>
              <p className="font-semibold">{props.color}</p>
            </div>
          )}
          {props.odor && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Odor</p>
              <p className="font-semibold">{props.odor}</p>
            </div>
          )}
          {props.ph !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">pH</p>
              <p className="font-semibold">{props.ph}</p>
            </div>
          )}
          {props.boilingPoint !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Boiling Point</p>
              <p className="font-semibold">{props.boilingPoint}°C</p>
            </div>
          )}
          {props.meltingPoint !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Melting Point</p>
              <p className="font-semibold">{props.meltingPoint}°C</p>
            </div>
          )}
          {props.flashPoint !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Flash Point</p>
              <p className="font-semibold">{props.flashPoint}°C</p>
            </div>
          )}
          {props.density !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Density</p>
              <p className="font-semibold">{props.density} g/cm³</p>
            </div>
          )}
          {props.solubility && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Solubility</p>
              <p className="font-semibold">{props.solubility}</p>
            </div>
          )}
          {props.molecularWeight !== undefined && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Molecular Weight</p>
              <p className="font-semibold">{props.molecularWeight} g/mol</p>
            </div>
          )}
          {props.molecularFormula && (
            <div className="p-3 rounded-lg bg-gray-700">
              <p className="text-xs text-gray-400 mb-1">Molecular Formula</p>
              <p className="font-semibold font-mono">
                {props.molecularFormula}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chemical Properties */}
      {chemProps && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-atom-line text-cyan-400"></i>
            Chemical Properties
          </h3>
          <div className="space-y-4">
            {chemProps.reactivity && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Reactivity</p>
                <p className="text-gray-300">{chemProps.reactivity}</p>
              </div>
            )}
            {chemProps.stability && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Stability</p>
                <p className="text-gray-300">{chemProps.stability}</p>
              </div>
            )}
            {chemProps.incompatibleMaterials &&
              chemProps.incompatibleMaterials.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Incompatible Materials
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chemProps.incompatibleMaterials.map((material, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-red-900/30 text-red-400 text-xs border border-red-500/30"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            {chemProps.conditionsToAvoid &&
              chemProps.conditionsToAvoid.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">
                    Conditions to Avoid
                  </p>
                  <ul className="space-y-1">
                    {chemProps.conditionsToAvoid.map((condition, idx) => (
                      <li
                        key={idx}
                        className="text-gray-300 text-sm flex items-start gap-2"
                      >
                        <i className="ri-alert-line text-yellow-400 mt-0.5"></i>
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChemicalHazardsDetail({ chemical }: { chemical: Chemical }) {
  const hazards = chemical.hazards;

  return (
    <div className="space-y-6">
      {/* GHS Classification */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-shield-line text-cyan-400"></i>
          GHS Classification
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Signal Word</p>
            <span
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                hazards.ghs.signalWord === "Danger"
                  ? "bg-red-900/30 text-red-400 border border-red-500/30"
                  : hazards.ghs.signalWord === "Warning"
                    ? "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                    : "bg-gray-700 text-gray-400"
              }`}
            >
              {hazards.ghs.signalWord}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Hazard Symbols</p>
            <div className="flex flex-wrap gap-2">
              {hazards.ghs.symbols.map((symbol, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-yellow-900/30 text-yellow-400 text-xs border border-yellow-500/30"
                >
                  {symbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        {hazards.ghs.hazardCategories.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Hazard Categories</p>
            <div className="flex flex-wrap gap-2">
              {hazards.ghs.hazardCategories.map((category, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-xs border border-blue-500/30"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NFPA Diamond */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-diamond-line text-cyan-400"></i>
          NFPA 704 Diamond
        </h3>
        <div className="flex justify-center">
          {hazards.nfpa && (
            <NFPADiamond
              health={hazards.nfpa.health}
              flammability={hazards.nfpa.flammability}
              reactivity={hazards.nfpa.reactivity}
              special={hazards.nfpa.special}
              size="lg"
            />
          )}
        </div>
      </div>

      {/* Hazard Statements */}
      {hazards.hazardStatements.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-file-warning-line text-red-400"></i>
            Hazard Statements
          </h3>
          <div className="space-y-2">
            {hazards.hazardStatements.map((statement, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-sm"
              >
                {statement}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Precautionary Statements */}
      {hazards.precautionaryStatements.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-information-line text-blue-400"></i>
            Precautionary Statements
          </h3>
          <div className="space-y-2">
            {hazards.precautionaryStatements.map((statement, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-blue-900/20 border border-blue-500/30 text-sm"
              >
                {statement}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exposure Limits */}
      {hazards.exposureLimits && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-time-line text-cyan-400"></i>
            Exposure Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hazards.exposureLimits.twa && (
              <div className="p-4 rounded-lg bg-gray-700">
                <p className="text-sm text-gray-400 mb-1">TWA (8-hour)</p>
                <p className="text-2xl font-bold">
                  {hazards.exposureLimits.twa.value}
                </p>
                <p className="text-xs text-gray-500">
                  {hazards.exposureLimits.twa.units}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source: {hazards.exposureLimits.twa.source}
                </p>
              </div>
            )}
            {hazards.exposureLimits.stel && (
              <div className="p-4 rounded-lg bg-gray-700">
                <p className="text-sm text-gray-400 mb-1">STEL (15-min)</p>
                <p className="text-2xl font-bold">
                  {hazards.exposureLimits.stel.value}
                </p>
                <p className="text-xs text-gray-500">
                  {hazards.exposureLimits.stel.units}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source: {hazards.exposureLimits.stel.source}
                </p>
              </div>
            )}
            {hazards.exposureLimits.ceiling && (
              <div className="p-4 rounded-lg bg-gray-700">
                <p className="text-sm text-gray-400 mb-1">Ceiling</p>
                <p className="text-2xl font-bold">
                  {hazards.exposureLimits.ceiling.value}
                </p>
                <p className="text-xs text-gray-500">
                  {hazards.exposureLimits.ceiling.units}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Source: {hazards.exposureLimits.ceiling.source}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toxicology Data */}
      {hazards.toxicology && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-heart-pulse-line text-red-400"></i>
            Toxicology Data
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {hazards.toxicology.acuteToxicity && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Acute Toxicity</p>
                <p className="text-gray-300">
                  {hazards.toxicology.acuteToxicity}
                </p>
              </div>
            )}
            {hazards.toxicology.chronicToxicity && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Chronic Toxicity</p>
                <p className="text-gray-300">
                  {hazards.toxicology.chronicToxicity}
                </p>
              </div>
            )}
            {hazards.toxicology.carcinogenicity && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Carcinogenicity</p>
                <p className="text-gray-300">
                  {hazards.toxicology.carcinogenicity}
                </p>
              </div>
            )}
            {hazards.toxicology.mutagenicityGenotoxicity && (
              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Mutagenicity/Genotoxicity
                </p>
                <p className="text-gray-300">
                  {hazards.toxicology.mutagenicityGenotoxicity}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ChemicalStorageDetail({ chemical }: { chemical: Chemical }) {
  const storage = chemical.storage;

  return (
    <div className="space-y-6">
      {/* Storage Class & Requirements */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-archive-line text-cyan-400"></i>
          Storage Requirements
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {storage.storageClass && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Storage Class</p>
              <span className="px-3 py-1 rounded-lg bg-cyan-900/30 text-cyan-400 text-sm font-semibold border border-cyan-500/30">
                {storage.storageClass}
              </span>
            </div>
          )}
          {storage.temperatureRange && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Temperature Range</p>
              <p className="font-semibold">
                {storage.temperatureRange.min}°{storage.temperatureRange.unit} -{" "}
                {storage.temperatureRange.max}°{storage.temperatureRange.unit}
              </p>
            </div>
          )}
          {storage.humidityRange && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Humidity Range</p>
              <p className="font-semibold">
                {storage.humidityRange.min}% - {storage.humidityRange.max}%
              </p>
            </div>
          )}
        </div>

        {/* Special Requirements */}
        <div className="mt-4 space-y-2">
          {storage.lightSensitivity && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <i className="ri-sun-line"></i>
              Light sensitive - store in dark
            </div>
          )}
          {storage.airSensitivity && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <i className="ri-windy-line"></i>
              Air sensitive - store under inert atmosphere
            </div>
          )}
          {storage.moistureSensitivity && (
            <div className="flex items-center gap-2 text-sm text-yellow-400">
              <i className="ri-water-percent-line"></i>
              Moisture sensitive - keep dry
            </div>
          )}
        </div>
      </div>

      {/* Segregation Requirements */}
      {storage.segregationRequirements &&
        storage.segregationRequirements.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-layout-grid-line text-orange-400"></i>
              Segregation Requirements
            </h3>
            <div className="space-y-2">
              {storage.segregationRequirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-orange-900/20 border border-orange-500/30 text-sm"
                >
                  {req}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Incompatible Materials */}
      {storage.incompatibleMaterials &&
        storage.incompatibleMaterials.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-alert-line text-red-400"></i>
              Incompatible Materials
            </h3>
            <div className="flex flex-wrap gap-2">
              {storage.incompatibleMaterials.map((material, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-sm border border-red-500/30"
                >
                  {material}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Special Requirements */}
      {storage.specialRequirements &&
        storage.specialRequirements.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-file-list-3-line text-cyan-400"></i>
              Special Requirements
            </h3>
            <ul className="space-y-2">
              {storage.specialRequirements.map((req, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <i className="ri-checkbox-circle-line text-cyan-400 mt-0.5"></i>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Ventilation */}
      {storage.ventilationRequirements && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-windy-line text-blue-400"></i>
            Ventilation Requirements
          </h3>
          <p className="text-gray-300">{storage.ventilationRequirements}</p>
        </div>
      )}

      {/* Fire Suppression */}
      {storage.fireSuppression && storage.fireSuppression.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-fire-line text-red-400"></i>
            Fire Suppression
          </h3>
          <div className="flex flex-wrap gap-2">
            {storage.fireSuppression.map((method, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-red-900/30 text-red-400 text-sm border border-red-500/30"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChemicalTransportDetail({ chemical }: { chemical: Chemical }) {
  const transport = chemical.transport;

  return (
    <div className="space-y-6">
      {/* UN/DOT Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-truck-line text-cyan-400"></i>
          UN/DOT Classification
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {transport.unNumber && (
            <div>
              <p className="text-sm text-gray-400 mb-1">UN Number</p>
              <p className="text-xl font-bold font-mono">
                {transport.unNumber}
              </p>
            </div>
          )}
          {transport.properShippingName && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Proper Shipping Name</p>
              <p className="font-semibold">{transport.properShippingName}</p>
            </div>
          )}
          {transport.hazardClass && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Hazard Class</p>
              <span className="px-3 py-1 rounded-lg bg-orange-900/30 text-orange-400 text-sm font-semibold border border-orange-500/30">
                {transport.hazardClass}
              </span>
            </div>
          )}
          {transport.packingGroup && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Packing Group</p>
              <span className="px-3 py-1 rounded-lg bg-yellow-900/30 text-yellow-400 text-sm font-semibold border border-yellow-500/30">
                {transport.packingGroup}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Labels & Placards */}
      {(transport.labels && transport.labels.length > 0) ||
      (transport.placards && transport.placards.length > 0) ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-price-tag-3-line text-blue-400"></i>
            Labels & Placards
          </h3>
          <div className="space-y-4">
            {transport.labels && transport.labels.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Labels Required</p>
                <div className="flex flex-wrap gap-2">
                  {transport.labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-blue-900/30 text-blue-400 text-sm border border-blue-500/30"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {transport.placards && transport.placards.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Placards Required</p>
                <div className="flex flex-wrap gap-2">
                  {transport.placards.map((placard, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-orange-900/30 text-orange-400 text-sm border border-orange-500/30"
                    >
                      {placard}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Special Provisions */}
      {transport.specialProvisions &&
        transport.specialProvisions.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-file-list-3-line text-yellow-400"></i>
              Special Provisions
            </h3>
            <ul className="space-y-2">
              {transport.specialProvisions.map((provision, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <i className="ri-arrow-right-line text-yellow-400 mt-0.5"></i>
                  {provision}
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Quantity Limits */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-box-line text-green-400"></i>
          Quantity Limits
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {transport.limitedQuantities && (
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30">
              <p className="text-sm font-semibold text-green-400 mb-1">
                Limited Quantities
              </p>
              <p className="text-xs text-gray-400">
                Allowed for limited quantities
              </p>
            </div>
          )}
          {transport.exceptedQuantities && (
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
              <p className="text-sm font-semibold text-blue-400 mb-1">
                Excepted Quantities
              </p>
              <p className="text-xs text-gray-400">
                Allowed for excepted quantities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Environmental Hazards */}
      {transport.environmentalHazards &&
        transport.environmentalHazards.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-leaf-line text-green-400"></i>
              Environmental Hazards
            </h3>
            <div className="flex flex-wrap gap-2">
              {transport.environmentalHazards.map((hazard, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-green-900/30 text-green-400 text-sm border border-green-500/30"
                >
                  {hazard}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

function ChemicalComplianceDetail({ chemical }: { chemical: Chemical }) {
  const compliance = chemical.compliance;

  return (
    <div className="space-y-6">
      {/* GHS Compliance */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-shield-check-line text-cyan-400"></i>
          GHS Compliance
        </h3>
        <div className="flex items-center gap-4">
          <span
            className={`px-4 py-2 rounded-lg text-lg font-semibold ${
              compliance.ghsCompliant
                ? "bg-green-900/30 text-green-400 border border-green-500/30"
                : "bg-red-900/30 text-red-400 border border-red-500/30"
            }`}
          >
            {compliance.ghsCompliant ? "✓ GHS Compliant" : "✗ Non-Compliant"}
          </span>
        </div>
      </div>

      {/* Regulatory Status */}
      {compliance.regulatoryStatus.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-government-line text-blue-400"></i>
            Regulatory Status by Region
          </h3>
          <div className="space-y-3">
            {compliance.regulatoryStatus.map((status, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{status.region}</p>
                    {status.authority && (
                      <p className="text-xs text-gray-400">
                        Authority: {status.authority}
                      </p>
                    )}
                    {status.regulation && (
                      <p className="text-xs text-gray-400">
                        Regulation: {status.regulation}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      status.status === "Approved"
                        ? "bg-green-900/30 text-green-400 border border-green-500/30"
                        : status.status === "Restricted"
                          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                          : status.status === "Banned"
                            ? "bg-red-900/30 text-red-400 border border-red-500/30"
                            : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {status.status}
                  </span>
                </div>
                {status.lastUpdated && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last Updated:{" "}
                    {new Date(status.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {compliance.certifications && compliance.certifications.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-award-line text-yellow-400"></i>
            Certifications
          </h3>
          <div className="space-y-3">
            {compliance.certifications.map((cert, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{cert.type}</p>
                    <p className="text-xs text-gray-400">
                      Issuer: {cert.issuer}
                    </p>
                    {cert.number && (
                      <p className="text-xs text-gray-400">
                        Cert #: {cert.number}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      cert.status === "Active"
                        ? "bg-green-900/30 text-green-400 border border-green-500/30"
                        : cert.status === "Expired"
                          ? "bg-red-900/30 text-red-400 border border-red-500/30"
                          : "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>
                {cert.expiryDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permits */}
      {compliance.permits && compliance.permits.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-file-paper-line text-purple-400"></i>
            Permits
          </h3>
          <div className="space-y-3">
            {compliance.permits.map((permit, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-gray-700 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{permit.type}</p>
                    <p className="text-xs text-gray-400">
                      Issuer: {permit.issuer}
                    </p>
                    {permit.number && (
                      <p className="text-xs text-gray-400">
                        Permit #: {permit.number}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      permit.status === "Active"
                        ? "bg-green-900/30 text-green-400 border border-green-500/30"
                        : permit.status === "Expired"
                          ? "bg-red-900/30 text-red-400 border border-red-500/30"
                          : "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {permit.status}
                  </span>
                </div>
                {permit.expiryDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(permit.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restrictions */}
      {compliance.restrictions && compliance.restrictions.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-error-warning-line text-red-400"></i>
            Restrictions
          </h3>
          <div className="space-y-3">
            {compliance.restrictions.map((restriction, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-red-900/20 border border-red-500/30"
              >
                <p className="font-semibold text-red-400 mb-1">
                  {restriction.type}
                </p>
                <p className="text-sm text-gray-300">
                  {restriction.description}
                </p>
                {restriction.region && (
                  <p className="text-xs text-gray-500 mt-2">
                    Region: {restriction.region}
                  </p>
                )}
                {restriction.effectiveDate && (
                  <p className="text-xs text-gray-500">
                    Effective:{" "}
                    {new Date(restriction.effectiveDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory Updates */}
      {compliance.regulatoryUpdates &&
        compliance.regulatoryUpdates.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <i className="ri-notification-line text-cyan-400"></i>
              Recent Regulatory Updates
            </h3>
            <div className="space-y-3">
              {compliance.regulatoryUpdates.map((update, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    update.impact === "High"
                      ? "bg-red-900/20 border-red-500/30"
                      : update.impact === "Medium"
                        ? "bg-yellow-900/20 border-yellow-500/30"
                        : "bg-blue-900/20 border-blue-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-300">
                      {update.description}
                    </p>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        update.impact === "High"
                          ? "bg-red-900/30 text-red-400"
                          : update.impact === "Medium"
                            ? "bg-yellow-900/30 text-yellow-400"
                            : "bg-blue-900/30 text-blue-400"
                      }`}
                    >
                      {update.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Date: {new Date(update.date).toLocaleDateString()}
                  </p>
                  {update.actionRequired && (
                    <p className="text-xs text-yellow-400 mt-2">
                      <i className="ri-alert-line mr-1"></i>
                      Action Required: {update.actionRequired}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

function ChemicalHistoryDetail({ chemical }: { chemical: Chemical }) {
  const metadata = chemical.metadata;

  return (
    <div className="space-y-6">
      {/* Version Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-history-line text-cyan-400"></i>
          Version History
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Version</p>
            <p className="text-2xl font-bold">{metadata.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Status</p>
            <span
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                metadata.status === "Active"
                  ? "bg-green-900/30 text-green-400 border border-green-500/30"
                  : metadata.status === "Inactive"
                    ? "bg-gray-700 text-gray-400"
                    : metadata.status === "Deprecated"
                      ? "bg-red-900/30 text-red-400 border border-red-500/30"
                      : "bg-yellow-900/30 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              {metadata.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Created</p>
            <p className="font-semibold">
              {new Date(metadata.createdAt).toLocaleString()}
            </p>
            {metadata.createdBy && (
              <p className="text-xs text-gray-500 mt-1">
                By: {metadata.createdBy}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Last Updated</p>
            <p className="font-semibold">
              {new Date(metadata.updatedAt).toLocaleString()}
            </p>
            {metadata.updatedBy && (
              <p className="text-xs text-gray-500 mt-1">
                By: {metadata.updatedBy}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Change History Timeline */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-time-line text-blue-400"></i>
          Change History
        </h3>
        <div className="space-y-4">
          {/* Version entry */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <div className="w-0.5 h-full bg-gray-700 mt-2"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold">Version {metadata.version}</p>
                <p className="text-xs text-gray-500">
                  {new Date(metadata.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {metadata.status === "Active"
                  ? "Current active version"
                  : `Status: ${metadata.status}`}
              </p>
              {metadata.notes && (
                <p className="text-sm text-gray-300 mt-2">{metadata.notes}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tags & Categories */}
      {(metadata.tags && metadata.tags.length > 0) ||
      (metadata.categories && metadata.categories.length > 0) ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-price-tag-3-line text-purple-400"></i>
            Tags & Categories
          </h3>
          <div className="space-y-4">
            {metadata.tags && metadata.tags.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {metadata.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-purple-900/30 text-purple-400 text-sm border border-purple-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {metadata.categories && metadata.categories.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {metadata.categories.map((category, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-blue-900/30 text-blue-400 text-sm border border-blue-500/30"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChemicalIntelligenceDetail({ chemical }: { chemical: Chemical }) {
  const [openDataResults, setOpenDataResults] = useState<any>(null);
  const [loadingOpenData, setLoadingOpenData] = useState(false);
  const [showOpenData, setShowOpenData] = useState(false);

  const handleSearchOpenData = async () => {
    if (!chemical.casNumber) {
      alert("CAS number required for open data search");
      return;
    }

    setLoadingOpenData(true);
    try {
      const response = await fetch("/api/open-data/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          casNumber: chemical.casNumber,
          action: "properties",
        }),
      });
      const result = await response.json();
      if (result.success) {
        setOpenDataResults(result);
      }
    } catch (error) {
      console.error("Error fetching open data:", error);
    } finally {
      setLoadingOpenData(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Intelligence Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-brain-line text-cyan-400"></i>
          AI-Powered Intelligence
        </h3>
        <IntelligentInsights chemical={chemical} />
      </div>

      {/* Document QR Code Generation */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-qr-code-line text-purple-400"></i>
          Document QR Codes
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Generate QR codes for this chemical's documents. Scan to access
            MSDS, certificates, and more.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <DocumentQRGenerator
              documentId={chemical.id}
              documentType="msds"
              documentName={`MSDS - ${chemical.name}`}
            />
            <DocumentQRGenerator
              documentId={chemical.id}
              documentType="certificate"
              documentName={`Certificate - ${chemical.name}`}
            />
          </div>
        </div>
      </div>

      {/* Open Data Integration */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-database-2-line text-green-400"></i>
          Open Data Sources Integration
        </h3>
        <div className="space-y-4">
          {chemical.casNumber ? (
            <>
              <button
                onClick={handleSearchOpenData}
                disabled={loadingOpenData}
                className="w-full px-4 py-3 rounded-lg bg-green-900/20 border border-green-500/30 hover:bg-green-900/30 disabled:opacity-50 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <i className="ri-search-line text-green-400"></i>
                  <span>Search Open Data Sources</span>
                </div>
                {loadingOpenData ? (
                  <i className="ri-loader-4-line animate-spin text-green-400"></i>
                ) : (
                  <i className="ri-arrow-right-line text-green-400"></i>
                )}
              </button>

              {/* Open Data Sources List */}
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    name: "PubChem",
                    count: "111M+",
                    icon: "ri-database-line",
                    color: "blue",
                  },
                  {
                    name: "EPA CompTox",
                    count: "875K+",
                    icon: "ri-government-line",
                    color: "green",
                  },
                  {
                    name: "OSHA",
                    count: "Chemical DB",
                    icon: "ri-shield-line",
                    color: "orange",
                  },
                  {
                    name: "CAS Safety",
                    count: "Free",
                    icon: "ri-book-line",
                    color: "purple",
                  },
                ].map((source) => (
                  <div
                    key={source.name}
                    className="p-3 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <i
                        className={`${source.icon} text-${source.color}-400`}
                      ></i>
                      <div>
                        <p className="text-sm font-semibold">{source.name}</p>
                        <p className="text-xs text-gray-400">
                          {source.count} compounds
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-green-900/30 text-green-400 text-xs">
                      Enabled
                    </span>
                  </div>
                ))}
              </div>

              {/* Open Data Results */}
              {openDataResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-green-900/20 border border-green-500/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-400">
                      Open Data Results
                    </h4>
                    <span className="text-xs text-gray-400">
                      Confidence: {openDataResults.confidence?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <strong>Sources:</strong>{" "}
                      {openDataResults.sources?.join(", ") || "No sources"}
                    </p>
                    {openDataResults.properties &&
                      Object.keys(openDataResults.properties).length > 0 && (
                        <div>
                          <p className="text-gray-400 mb-1">
                            Properties Found:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(openDataResults.properties).map(
                              (key) => (
                                <span
                                  key={key}
                                  className="px-2 py-1 rounded bg-gray-700 text-xs"
                                >
                                  {key}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/30">
              <p className="text-sm text-yellow-400">
                <i className="ri-alert-line mr-2"></i>
                CAS number required to search open data sources
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              <strong>Available Sources:</strong> PubChem (111M+ compounds), EPA
              CompTox (875K+ chemicals), OSHA Chemical Database, CAS Chemical
              Safety Library, GESTIS (EU)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChemicalRelatedDetail({ chemical }: { chemical: Chemical }) {
  const metadata = chemical.metadata;

  return (
    <div className="space-y-6">
      {/* Similar Chemicals */}
      {metadata.relatedChemicals && metadata.relatedChemicals.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-links-line text-cyan-400"></i>
            Related Chemicals
          </h3>
          <div className="space-y-2">
            {metadata.relatedChemicals.map((relatedId, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gray-700 border border-gray-600 hover:border-cyan-500/50 transition cursor-pointer"
              >
                <p className="font-semibold">Chemical ID: {relatedId}</p>
                <p className="text-xs text-gray-400">Click to view details</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Chemicals */}
      {metadata.alternatives && metadata.alternatives.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="ri-exchange-line text-green-400"></i>
            Alternative Chemicals
          </h3>
          <div className="space-y-2">
            {metadata.alternatives.map((altId, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-green-900/20 border border-green-500/30 hover:border-green-500/50 transition cursor-pointer"
              >
                <p className="font-semibold text-green-400">
                  Alternative ID: {altId}
                </p>
                <p className="text-xs text-gray-400">
                  Safer or equivalent alternative
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compatibility Matrix Link */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-table-line text-orange-400"></i>
          Compatibility Information
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          View compatibility with other chemicals in the compatibility matrix
        </p>
        <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
          <i className="ri-external-link-line mr-2"></i>
          Open Compatibility Matrix
        </button>
      </div>

      {/* Risk Assessment Link */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <i className="ri-shield-cross-line text-red-400"></i>
          Risk Assessments
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          View all risk assessments for this chemical
        </p>
        <button className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition">
          <i className="ri-external-link-line mr-2"></i>
          View Risk Assessments
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// OTHER TAB COMPONENTS (Placeholders)
// ============================================================================

function ChemicalSearchTab({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  filters,
  onFiltersChange,
  chemicals,
  loading,
  onSelectChemical,
}: any) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">
          Advanced Search & Discovery
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search chemicals by name, CAS, formula, properties..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white"
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
          />
          <button
            onClick={onSearch}
            className="px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
          >
            <i className="ri-search-line mr-2"></i>
            Search
          </button>
        </div>
      </div>
      <p className="text-gray-400">Search results coming soon...</p>
    </div>
  );
}

function ChemicalCategoriesTab() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">
        Chemical Categories & Classification
      </h3>
      <p className="text-gray-400">Categories coming soon...</p>
    </div>
  );
}

function ChemicalInventoryTab() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Chemical Inventory</h3>
      <p className="text-gray-400">Inventory tracking coming soon...</p>
    </div>
  );
}

function ChemicalAnalyticsTab({ chemicals }: { chemicals: Chemical[] }) {
  // Calculate analytics data
  const totalChemicals = chemicals.length;
  const highRisk = chemicals.filter((c) => {
    const risk = c.hazards.nfpa?.health || 0;
    return risk >= 3;
  }).length;
  const compliant = chemicals.filter((c) => c.compliance.ghsCompliant).length;
  const complianceRate =
    totalChemicals > 0 ? (compliant / totalChemicals) * 100 : 0;

  // Hazard distribution
  const hazardDistribution = [
    {
      level: "High",
      count: chemicals.filter((c) => {
        const h = c.hazards.nfpa?.health || 0;
        return h >= 3;
      }).length,
      color: "#ef4444",
    },
    {
      level: "Medium",
      count: chemicals.filter((c) => {
        const h = c.hazards.nfpa?.health || 0;
        return h === 2;
      }).length,
      color: "#f59e0b",
    },
    {
      level: "Low",
      count: chemicals.filter((c) => {
        const h = c.hazards.nfpa?.health || 0;
        return h <= 1;
      }).length,
      color: "#10b981",
    },
  ];

  // Status distribution
  const statusDistribution = [
    {
      name: "Active",
      value: chemicals.filter((c) => c.metadata.status === "Active").length,
      color: "#10b981",
    },
    {
      name: "Inactive",
      value: chemicals.filter((c) => c.metadata.status === "Inactive").length,
      color: "#6b7280",
    },
    {
      name: "Deprecated",
      value: chemicals.filter((c) => c.metadata.status === "Deprecated").length,
      color: "#ef4444",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Chemicals</span>
            <i className="ri-database-2-line text-cyan-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{totalChemicals}</div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Compliance Rate</span>
            <i className="ri-shield-check-line text-green-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">
            {complianceRate.toFixed(1)}%
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-600/10 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">High Risk</span>
            <i className="ri-error-warning-line text-orange-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{highRisk}</div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">GHS Compliant</span>
            <i className="ri-check-double-line text-purple-400"></i>
          </div>
          <div className="text-3xl font-bold text-white">{compliant}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hazard Level Distribution */}
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Hazard Level Distribution
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hazardDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="level" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {hazardDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 - Trends */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chemical Additions Over Time */}
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">
            Chemical Additions (Last 30 Days)
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return {
                  date: date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  }),
                  added: Math.floor(Math.random() * 5), // TODO: Replace with actual data
                };
              })}
            >
              <defs>
                <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="added"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorAdded)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance Trends */}
        <div className="p-6 rounded-xl bg-gray-800 border border-gray-700">
          <h4 className="font-bold mb-4 text-white">Compliance Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (11 - i));
                return {
                  month: date.toLocaleDateString("en-US", { month: "short" }),
                  compliance: 85 + Math.random() * 10, // TODO: Replace with actual data
                };
              })}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="compliance"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
