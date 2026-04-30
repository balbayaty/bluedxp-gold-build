/**
 * TMS Job Detail Page - Comprehensive View
 * 
 * Shows ALL 80+ fields from TransportJob type organized into logical tabs:
 * - Overview (summary with key metrics)
 * - Job Details (basic info, customer, transporter)
 * - Route & Locations (origin, destination, borders, ports)
 * - Shipment & Cargo (container, cargo details)
 * - Driver & Vehicle (driver identity, vehicle info)
 * - Customs & Documentation (Bayan, documents, clearance)
 * - Financial (costs, rates, billing)
 * - Timeline (all dates and events)
 * - POD (Proof of Delivery)
 * - Detention & Transit Analytics
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TransportJob, JobStatus } from "@/types/tms/transportJob";
import PODCaptureForm from "@/components/tms/PODCaptureForm";
import DetentionDashboard from "@/components/tms/DetentionDashboard";
import TransitTimeAnalytics from "@/components/tms/TransitTimeAnalytics";

// Tab definitions
const TABS = [
  { id: "overview", label: "Overview", icon: "ri-dashboard-line" },
  { id: "details", label: "Job Details", icon: "ri-file-list-3-line" },
  { id: "route", label: "Route & Locations", icon: "ri-route-line" },
  { id: "shipment", label: "Shipment & Cargo", icon: "ri-box-3-line" },
  { id: "driver", label: "Driver & Vehicle", icon: "ri-truck-line" },
  { id: "customs", label: "Customs & Docs", icon: "ri-file-shield-line" },
  { id: "financial", label: "Financial", icon: "ri-money-dollar-circle-line" },
  { id: "timeline", label: "Timeline", icon: "ri-time-line" },
  { id: "pod", label: "POD", icon: "ri-checkbox-circle-line" },
  { id: "analytics", label: "Analytics", icon: "ri-bar-chart-box-line" },
] as const;

type TabId = typeof TABS[number]["id"];

// Helper to format dates
function formatDate(date: Date | string | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(date: Date | string | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number | undefined, currency: string = "SAR"): string {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// Status badge component
function StatusBadge({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    [JobStatus.PENDING]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    [JobStatus.IN_TRANSIT]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    [JobStatus.DELIVERED]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    [JobStatus.COMPLETED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    [JobStatus.REJECTED]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    [JobStatus.CANCELLED]: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${colors[status] || colors[JobStatus.PENDING]}`}>
      {status}
    </span>
  );
}

// Field display component
function Field({ label, value, icon, className = "" }: { label: string; value: React.ReactNode; icon?: string; className?: string }) {
  return (
    <div className={`py-3 ${className}`}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
        {icon && <i className={`${icon} text-gray-400`}></i>}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value || "-"}</dd>
    </div>
  );
}

// Section component
function Section({ title, icon, children, className = "" }: { title: string; icon: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i className={`${icon} text-blue-600`}></i>
          {title}
        </h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default function TMSJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<TransportJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tms/jobs/${jobId}?tenantId=flex-logistics`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-blue-600 animate-spin"></i>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-red-500"></i>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Job Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The requested transport job could not be found.</p>
          <a href="/tms/jobs" className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i className="ri-arrow-left-line"></i> Back to Jobs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Breadcrumb & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <a href="/tms/jobs" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                  <i className="ri-arrow-left-line text-xl"></i>
                </a>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.jobName}</h1>
                    <StatusBadge status={job.jobStatus} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Job #{job.jobNumber} • {job.jobType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/tms/jobs/${jobId}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="ri-edit-line"></i>
                  Edit Job
                </a>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <i className="ri-printer-line"></i>
                  Print
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <i className="ri-download-line"></i>
                  Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 -mb-px overflow-x-auto">
              <nav className="flex space-x-1" aria-label="Tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    <i className={tab.icon}></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <div className="text-3xl font-bold">{job.jobStatus}</div>
                <div className="text-sm opacity-80 mt-1">Current Status</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                <div className="text-3xl font-bold">{formatCurrency(job.agreedRate, job.currency)}</div>
                <div className="text-sm opacity-80 mt-1">Agreed Rate</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                <div className="text-3xl font-bold">{job.transitTime ? `${job.transitTime}h` : "-"}</div>
                <div className="text-sm opacity-80 mt-1">Transit Time</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                <div className="text-3xl font-bold">{job.bayanStatus || "Pending"}</div>
                <div className="text-sm opacity-80 mt-1">Bayan Status</div>
              </div>
            </div>

            {/* Route Visualization */}
            <Section title="Route Overview" icon="ri-route-line">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <i className="ri-map-pin-fill text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{job.shipmentOrigin || job.polLocation || "Origin"}</div>
                      <div className="text-sm text-gray-500">{job.polCountry || "Saudi Arabia"}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                    <i className="ri-truck-line text-2xl"></i>
                    <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{job.shipmentDestination || job.podLocation || "Destination"}</div>
                      <div className="text-sm text-gray-500">{job.podCountry || "-"}</div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <i className="ri-flag-fill text-green-600 text-xl"></i>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Key Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Section title="Customer & Transporter" icon="ri-user-star-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Customer" value={job.customer} icon="ri-user-line" />
                  <Field label="Transporter" value={job.transporter} icon="ri-truck-line" />
                  <Field label="Lane" value={job.laneName} icon="ri-road-map-line" />
                </dl>
              </Section>

              <Section title="Shipment Details" icon="ri-box-3-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Container #" value={job.containerNumber} icon="ri-archive-line" />
                  <Field label="Shipment Type" value={job.shipmentType} icon="ri-archive-drawer-line" />
                  <Field label="Weight" value={job.shipmentWeight ? `${job.shipmentWeight} kg` : "-"} icon="ri-scales-3-line" />
                </dl>
              </Section>

              <Section title="Driver & Vehicle" icon="ri-steering-2-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Driver Name" value={job.driverName} icon="ri-user-line" />
                  <Field label="Mobile" value={job.driverMobileNumber} icon="ri-phone-line" />
                  <Field label="Plate #" value={job.vehiclePlateNumber} icon="ri-car-line" />
                </dl>
              </Section>
            </div>
          </div>
        )}

        {/* Job Details Tab */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Basic Information" icon="ri-information-line">
              <dl className="grid grid-cols-2 gap-x-4 divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Job Name" value={job.jobName} className="col-span-2" />
                <Field label="Job Number" value={job.jobNumber} />
                <Field label="Record ID" value={job.recordId} />
                <Field label="Job Type" value={job.jobType} />
                <Field label="Status" value={<StatusBadge status={job.jobStatus} />} />
                <Field label="Currency" value={job.currency} />
                <Field label="Exchange Rate" value={job.exchangeRate} />
                <Field label="Round Trip" value={job.roundTrip ? "Yes" : "No"} />
                <Field label="Locked" value={job.locked ? "Yes" : "No"} />
              </dl>
            </Section>

            <Section title="Customer & Transporter" icon="ri-user-star-line">
              <dl className="grid grid-cols-2 gap-x-4 divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Customer ID" value={job.customerId} />
                <Field label="Customer Name" value={job.customer} />
                <Field label="Transporter ID" value={job.transporterId} />
                <Field label="Transporter Name" value={job.transporter} />
                <Field label="Lane ID" value={job.laneId} />
                <Field label="Lane Name" value={job.laneName} />
                <Field label="Deal ID" value={job.dealId} />
                <Field label="Deal" value={job.deal} />
              </dl>
            </Section>

            <Section title="Ownership & Audit" icon="ri-history-line">
              <dl className="grid grid-cols-2 gap-x-4 divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Job Owner" value={job.jobOwner} />
                <Field label="Created By" value={job.createdBy} />
                <Field label="Modified By" value={job.modifiedBy} />
                <Field label="Created Time" value={formatDateTime(job.createdTime)} />
                <Field label="Modified Time" value={formatDateTime(job.modifiedTime)} />
                <Field label="Last Activity" value={formatDateTime(job.lastActivityTime)} />
              </dl>
            </Section>

            <Section title="Notes & Instructions" icon="ri-sticky-note-line">
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {job.notesAndInstructions || "No notes or instructions provided."}
              </div>
              {job.tag && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <i className="ri-price-tag-3-line mr-2"></i>
                    {job.tag}
                  </span>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Route & Locations Tab */}
        {activeTab === "route" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Origin (POL)" icon="ri-map-pin-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Country" value={job.polCountry} />
                  <Field label="Location" value={job.polLocation} />
                  <Field label="Details" value={job.polDetails} />
                  <Field label="Shipment Origin" value={job.shipmentOrigin} />
                </dl>
              </Section>

              <Section title="Destination (POD)" icon="ri-flag-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Country" value={job.podCountry} />
                  <Field label="Location" value={job.podLocation} />
                  <Field label="Shipment Destination" value={job.shipmentDestination} />
                  <Field label="Final Destination" value={job.shipmentFinalDestination} />
                </dl>
              </Section>
            </div>

            <Section title="Ports & Terminals" icon="ri-anchor-line">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                <Field label="Drop Off Port (Sailing)" value={job.dropOffPort} />
                <Field label="Collection Port (Arrival)" value={job.collectionPort} />
                <Field label="Empty Container Depot" value={job.emptyContainerCollectionDepot} />
                <Field label="Full Container Depot" value={job.fullContainerDropOffDepot} />
                <Field label="Storage Terminal" value={job.storageTerminalName} />
                <Field label="Terminal Date In" value={formatDate(job.storageTerminalDateIn)} />
                <Field label="Terminal Date Out" value={formatDate(job.storageTerminalDateOut)} />
              </dl>
            </Section>

            <Section title="Border Crossings" icon="ri-passport-line">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                <Field label="Border Entry No" value={job.borderEntryNo} />
                <Field label="Saudi Border Arrival" value={formatDateTime(job.saudiBorderArrival)} />
                <Field label="Saudi Border Departure" value={formatDateTime(job.saudiBorderDeparture)} />
                <Field label="Destination Border Arrival" value={formatDateTime(job.destinationBorderArrival)} />
                <Field label="Destination Border Departure" value={formatDateTime(job.destinationBorderDeparture)} />
                <Field label="Transit Border Arrival" value={formatDateTime(job.transitBorderArrival)} />
                <Field label="Transit Border Departure" value={formatDateTime(job.transitBorderDeparture)} />
              </dl>
            </Section>

            <Section title="Consignee Information" icon="ri-building-line">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                <Field label="Consignee Name" value={job.consigneeName} />
                <Field label="Consignee Phone" value={job.consigneePhone} />
                <Field label="Foreign Consignee" value={job.foreignConsignee} />
                <Field label="Local Consignee" value={job.localConsignee} />
              </dl>
            </Section>
          </div>
        )}

        {/* Shipment & Cargo Tab */}
        {activeTab === "shipment" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Container Information" icon="ri-archive-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Container Number" value={job.containerNumber} />
                <Field label="Old Container" value={job.oldContainer} />
                <Field label="Containers on MBL" value={job.numberOfContainersOnMBL} />
                <Field label="Container Release Order (CRO)" value={job.containerReleaseOrderNumber} />
              </dl>
            </Section>

            <Section title="Cargo Details" icon="ri-box-3-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Shipment Number" value={job.shipmentNumber} />
                <Field label="Shipment Type" value={job.shipmentType} />
                <Field label="Shipment Type (Other)" value={job.shipmentTypeOther} />
                <Field label="Weight (kg)" value={job.shipmentWeight} />
              </dl>
            </Section>

            <Section title="Equipment & Vehicle" icon="ri-truck-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Truck Type" value={job.truckType} />
                <Field label="Vehicle Plate Number" value={job.vehiclePlateNumber} />
                <Field label="Type of Equipment" value={job.typeOfEquipment} />
              </dl>
            </Section>

            <Section title="Booking & References" icon="ri-bookmark-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Booking Number" value={job.bookingNumber} />
                <Field label="Order Number" value={job.orderNumber} />
                <Field label="PO Number" value={job.poNumber} />
                <Field label="Reference No" value={job.refNo} />
              </dl>
            </Section>
          </div>
        )}

        {/* Driver & Vehicle Tab */}
        {activeTab === "driver" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Driver Information" icon="ri-user-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Driver ID" value={job.driverId} />
                <Field label="Driver Name" value={job.driverName} />
                <Field label="Nationality" value={job.driverNationality} />
                <Field label="Mobile Number" value={job.driverMobileNumber} />
                <Field label="Foreign Mobile" value={job.driverForeignMobileNumber} />
              </dl>
            </Section>

            <Section title="Driver Identity Documents" icon="ri-id-card-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Iqama Number" value={job.driverIqamaNumber} />
                <Field label="License Number" value={job.driverLicenseNumber} />
                <Field label="Passport Number" value={job.driverPassportNumber} />
              </dl>
            </Section>

            <Section title="Vehicle Information" icon="ri-car-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Truck Type" value={job.truckType} />
                <Field label="Plate Number" value={job.vehiclePlateNumber} />
                <Field label="Equipment Type" value={job.typeOfEquipment} />
              </dl>
            </Section>

            <Section title="Dispatcher" icon="ri-customer-service-2-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="Dispatcher Name" value={job.dispatcherName} />
              </dl>
            </Section>
          </div>
        )}

        {/* Customs & Documentation Tab */}
        {activeTab === "customs" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Bayan Status" icon="ri-file-shield-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Bayan Status" value={
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.bayanStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                      job.bayanStatus === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                      job.bayanStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.bayanStatus || 'Pending'}
                    </span>
                  } />
                  <Field label="Bayan Number" value={job.bayanNumber} />
                  <Field label="Bayan Entry Number" value={job.bayanNumberEntry} />
                  <Field label="Bayan Exit Number" value={job.bayanNumberExit} />
                  <Field label="Bayan Synced" value={job.bayanSynced ? "Yes ✓" : "No"} />
                </dl>
              </Section>

              <Section title="Document Status" icon="ri-file-list-3-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="DO Status" value={job.doStatus} />
                  <Field label="Manifest Status" value={job.manifestStatus} />
                  <Field label="SI Status" value={job.siStatus} />
                </dl>
              </Section>
            </div>

            <Section title="Bills of Lading" icon="ri-file-paper-2-line">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                <Field label="Master Bill of Lading (MBL)" value={job.masterBillOfLading} />
                <Field label="House Bill of Lading (HBL)" value={job.houseBillOfLading} />
                <Field label="Flex Invoice Number" value={job.flexInvoiceNumber} />
                <Field label="Transporter Bill" value={job.transporterBill} />
              </dl>
            </Section>

            <Section title="Integration Status" icon="ri-links-line">
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${job.tgaVerified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <i className={`ri-checkbox-circle-fill text-xl ${job.tgaVerified ? 'text-green-600' : 'text-gray-400'}`}></i>
                    <span className="font-medium">TGA Verified</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${job.daleeliVerified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <i className={`ri-checkbox-circle-fill text-xl ${job.daleeliVerified ? 'text-green-600' : 'text-gray-400'}`}></i>
                    <span className="font-medium">Daleeli Verified</span>
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${job.bayanSynced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <i className={`ri-checkbox-circle-fill text-xl ${job.bayanSynced ? 'text-green-600' : 'text-gray-400'}`}></i>
                    <span className="font-medium">Bayan Synced</span>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(job.agreedRate, job.currency)}</div>
                <div className="text-sm text-gray-500 mt-1">Agreed Rate</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(job.totalCost, job.currency)}</div>
                <div className="text-sm text-gray-500 mt-1">Total Cost</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(job.costTRP, job.currency)}</div>
                <div className="text-sm text-gray-500 mt-1">Transport Cost</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(job.otherExpenses, job.currency)}</div>
                <div className="text-sm text-gray-500 mt-1">Other Expenses</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Cost Breakdown" icon="ri-pie-chart-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Agreed Rate" value={formatCurrency(job.agreedRate, job.currency)} />
                  <Field label="Transport Cost (TRP)" value={formatCurrency(job.costTRP, job.currency)} />
                  <Field label="Other Expenses" value={formatCurrency(job.otherExpenses, job.currency)} />
                  <Field label="Others Amount" value={formatCurrency(job.othersAmount, job.currency)} />
                  <Field label="Bridge Clearance Fees" value={formatCurrency(job.bridgeClearanceFees, job.currency)} />
                  <Field label="CC BO Entry" value={formatCurrency(job.ccBOEntry, job.currency)} />
                  <Field label="CC BO Exit" value={formatCurrency(job.ccBOExit, job.currency)} />
                  <Field label="Overweight Charges" value={formatCurrency(job.overWeight, job.currency)} />
                </dl>
              </Section>

              <Section title="Banking & Payment" icon="ri-bank-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Currency" value={job.currency} />
                  <Field label="Exchange Rate" value={job.exchangeRate} />
                  <Field label="Bank Name" value={job.bankName} />
                  <Field label="IBAN Number" value={job.ibanNumber} />
                  <Field label="Total Cost" value={formatCurrency(job.totalCost, job.currency)} />
                </dl>
              </Section>
            </div>

            <Section title="Detention Costs" icon="ri-time-line">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                <Field label="Detention Loading Days" value={job.detentionLoadingDays} />
                <Field label="Total Loading Time" value={job.totalLoadingTime ? `${job.totalLoadingTime} hours` : "-"} />
                <Field label="Total Offloading Time" value={job.totalOffloadingTime ? `${job.totalOffloadingTime} hours` : "-"} />
              </dl>
            </Section>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <Section title="Complete Timeline" icon="ri-time-line">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-6 ml-10">
                {job.requestDate && (
                  <TimelineEvent date={job.requestDate} title="Request Date" icon="ri-calendar-line" color="blue" />
                )}
                {job.loadingDate && (
                  <TimelineEvent date={job.loadingDate} title="Loading Date" icon="ri-upload-cloud-line" color="indigo" />
                )}
                {job.shipperArrival && (
                  <TimelineEvent date={job.shipperArrival} title="Arrived at Shipper" icon="ri-map-pin-line" color="green" />
                )}
                {job.shipperDeparture && (
                  <TimelineEvent date={job.shipperDeparture} title="Departed from Shipper" icon="ri-truck-line" color="green" />
                )}
                {job.saudiBorderArrival && (
                  <TimelineEvent date={job.saudiBorderArrival} title="Saudi Border Arrival" icon="ri-passport-line" color="orange" />
                )}
                {job.saudiBorderDeparture && (
                  <TimelineEvent date={job.saudiBorderDeparture} title="Saudi Border Departure" icon="ri-passport-line" color="orange" />
                )}
                {job.transitBorderArrival && (
                  <TimelineEvent date={job.transitBorderArrival} title="Transit Border Arrival" icon="ri-navigation-line" color="yellow" />
                )}
                {job.transitBorderDeparture && (
                  <TimelineEvent date={job.transitBorderDeparture} title="Transit Border Departure" icon="ri-navigation-line" color="yellow" />
                )}
                {job.destinationBorderArrival && (
                  <TimelineEvent date={job.destinationBorderArrival} title="Destination Border Arrival" icon="ri-map-pin-2-line" color="purple" />
                )}
                {job.destinationBorderDeparture && (
                  <TimelineEvent date={job.destinationBorderDeparture} title="Destination Border Departure" icon="ri-map-pin-2-line" color="purple" />
                )}
                {job.storageTerminalDateIn && (
                  <TimelineEvent date={job.storageTerminalDateIn} title="Storage Terminal In" icon="ri-warehouse-line" color="gray" />
                )}
                {job.storageTerminalDateOut && (
                  <TimelineEvent date={job.storageTerminalDateOut} title="Storage Terminal Out" icon="ri-warehouse-line" color="gray" />
                )}
                {job.consigneeArrival && (
                  <TimelineEvent date={job.consigneeArrival} title="Arrived at Consignee" icon="ri-flag-line" color="emerald" />
                )}
                {job.consigneeDeparture && (
                  <TimelineEvent date={job.consigneeDeparture} title="Departed from Consignee" icon="ri-check-double-line" color="emerald" />
                )}
                {job.dateOffload && (
                  <TimelineEvent date={job.dateOffload} title="Offload Complete" icon="ri-download-cloud-line" color="teal" />
                )}
                {job.eta && (
                  <TimelineEvent date={job.eta} title="ETA" icon="ri-time-line" color="pink" />
                )}
              </div>
            </div>
          </Section>
        )}

        {/* POD Tab */}
        {activeTab === "pod" && (
          <div className="space-y-6">
            <Section title="POD Details" icon="ri-file-check-line">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <Field label="POD Details" value={job.podDetails} />
              </dl>
            </Section>
            <Section title="Capture Proof of Delivery" icon="ri-camera-line">
              <PODCaptureForm
                jobId={jobId}
                onSuccess={() => {
                  alert("POD captured successfully!");
                  loadJob();
                }}
              />
            </Section>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section title="Transit Time Metrics" icon="ri-time-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Transit Time" value={job.transitTime ? `${job.transitTime} hours` : "-"} />
                  <Field label="Transit Time 2" value={job.transitTime2 ? `${job.transitTime2} hours` : "-"} />
                  <Field label="Total Loading Time" value={job.totalLoadingTime ? `${job.totalLoadingTime} hours` : "-"} />
                  <Field label="Total Offloading Time" value={job.totalOffloadingTime ? `${job.totalOffloadingTime} hours` : "-"} />
                </dl>
              </Section>

              <Section title="Detention Metrics" icon="ri-hourglass-line">
                <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                  <Field label="Detention Loading Days" value={job.detentionLoadingDays} />
                </dl>
              </Section>
            </div>

            <DetentionDashboard jobId={jobId} tenantId="flex-logistics" />
            <TransitTimeAnalytics jobId={jobId} tenantId="flex-logistics" />
          </div>
        )}
      </div>
    </div>
  );
}

// Timeline Event Component
function TimelineEvent({ date, title, icon, color }: { date: Date | string; title: string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30",
    yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-900/30",
    indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/30",
    pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30",
  };

  return (
    <div className="relative flex items-start gap-4">
      <div className={`absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center ${colorClasses[color] || colorClasses.blue}`}>
        <i className={`${icon} text-sm`}></i>
      </div>
      <div>
        <div className="font-medium text-gray-900 dark:text-white">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{formatDateTime(date)}</div>
      </div>
    </div>
  );
}
