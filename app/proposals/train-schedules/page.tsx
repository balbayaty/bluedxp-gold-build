/**
 * Global Train Schedules Page
 * Advanced rail freight scheduling and network visualization
 */

"use client";

import { useState, useMemo } from "react";
import PageTemplate from "@/components/PageTemplate";
import ProposalErrorBoundary from "@/components/proposals/ProposalErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface TrainService {
  id: string;
  trainNumber: string;
  type: string;
  operator: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  nextDay: boolean;
  frequency: string[];
  status: "ON_TIME" | "DELAYED" | "CANCELLED";
  capacity: number;
  available: number;
}

interface Station {
  code: string;
  name: string;
  country: string;
  city: string;
  type: string;
  departures: number;
  arrivals: number;
}

const stations: Station[] = [
  {
    code: "GTT",
    name: "GTT Terminal",
    country: "Saudi Arabia",
    city: "Dammam",
    type: "TERMINAL",
    departures: 12,
    arrivals: 11,
  },
  {
    code: "DRY",
    name: "Dry Port Riyadh",
    country: "Saudi Arabia",
    city: "Riyadh",
    type: "TERMINAL",
    departures: 8,
    arrivals: 9,
  },
  {
    code: "ICAD",
    name: "ICAD Terminal",
    country: "UAE",
    city: "Abu Dhabi",
    type: "INTERMODAL",
    departures: 6,
    arrivals: 6,
  },
  {
    code: "NDP",
    name: "NDP Station",
    country: "UAE",
    city: "Dubai",
    type: "STATION",
    departures: 10,
    arrivals: 10,
  },
  {
    code: "JART",
    name: "Jebel Ali Rail Terminal",
    country: "UAE",
    city: "Dubai",
    type: "PORT",
    departures: 14,
    arrivals: 14,
  },
  {
    code: "JED",
    name: "Jeddah Rail Terminal",
    country: "Saudi Arabia",
    city: "Jeddah",
    type: "PORT",
    departures: 5,
    arrivals: 5,
  },
];

const trainServices: TrainService[] = [
  {
    id: "ts-001",
    trainNumber: "NS-101",
    type: "National Shuttle",
    operator: "SAR",
    origin: "GTT",
    destination: "DRY",
    departureTime: "06:00",
    arrivalTime: "12:30",
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU"],
    status: "ON_TIME",
    capacity: 80,
    available: 24,
  },
  {
    id: "ts-002",
    trainNumber: "RDC-201",
    type: "Rail Direct Consist",
    operator: "SAR",
    origin: "GTT",
    destination: "JART",
    departureTime: "22:00",
    arrivalTime: "08:30",
    nextDay: true,
    frequency: ["SUN", "TUE", "THU"],
    status: "ON_TIME",
    capacity: 120,
    available: 45,
  },
  {
    id: "ts-003",
    trainNumber: "GTT-JART-01",
    type: "GTT-JART Express",
    operator: "Etihad Rail",
    origin: "GTT",
    destination: "JART",
    departureTime: "14:00",
    arrivalTime: "02:00",
    nextDay: true,
    frequency: ["MON", "WED", "SAT"],
    status: "DELAYED",
    capacity: 100,
    available: 12,
  },
  {
    id: "ts-004",
    trainNumber: "RT-301",
    type: "Rail Transfer",
    operator: "SAR",
    origin: "ICAD",
    destination: "NDP",
    departureTime: "08:00",
    arrivalTime: "10:30",
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
    status: "ON_TIME",
    capacity: 60,
    available: 35,
  },
  {
    id: "ts-005",
    trainNumber: "NS-102",
    type: "National Shuttle",
    operator: "SAR",
    origin: "DRY",
    destination: "GTT",
    departureTime: "15:00",
    arrivalTime: "21:30",
    nextDay: false,
    frequency: ["SUN", "MON", "TUE", "WED", "THU"],
    status: "ON_TIME",
    capacity: 80,
    available: 56,
  },
  {
    id: "ts-006",
    trainNumber: "JED-EXP-01",
    type: "Express Freight",
    operator: "SAR",
    origin: "DRY",
    destination: "JED",
    departureTime: "04:00",
    arrivalTime: "18:00",
    nextDay: false,
    frequency: ["SUN", "WED"],
    status: "ON_TIME",
    capacity: 100,
    available: 78,
  },
];

const serviceTypeColors: Record<string, string> = {
  "National Shuttle": "bg-blue-500",
  "Rail Direct Consist": "bg-purple-500",
  "GTT-JART Express": "bg-emerald-500",
  "Rail Transfer": "bg-amber-500",
  "Express Freight": "bg-red-500",
};

const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function TrainSchedules() {
  const { hasModuleAccess } = useAuth();
  const [selectedStation, setSelectedStation] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"schedule" | "network">("schedule");

  // Permission check
  const hasAccess = hasModuleAccess("proposals-rfq", "read_only");

  const filteredServices = useMemo(() => {
    return trainServices.filter((service) => {
      const matchesStation =
        selectedStation === "ALL" ||
        service.origin === selectedStation ||
        service.destination === selectedStation;
      const matchesType =
        selectedType === "ALL" || service.type === selectedType;
      return matchesStation && matchesType;
    });
  }, [selectedStation, selectedType]);

  const uniqueTypes = Array.from(new Set(trainServices.map((s) => s.type)));

  return (
    <ProposalErrorBoundary>
      <PageTemplate
        title="Train Schedules"
        description="Global rail freight scheduling and network management"
        icon="ri-train-line"
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Active Routes",
                value: trainServices.length,
                icon: "ri-route-line",
                color: "text-blue-500",
              },
              {
                label: "Stations",
                value: stations.length,
                icon: "ri-map-pin-line",
                color: "text-emerald-500",
              },
              {
                label: "On Time",
                value: `${Math.round((trainServices.filter((s) => s.status === "ON_TIME").length / trainServices.length) * 100)}%`,
                icon: "ri-time-line",
                color: "text-green-500",
              },
              {
                label: "Capacity Available",
                value: `${trainServices.reduce((sum, s) => sum + s.available, 0)} TEU`,
                icon: "ri-box-3-line",
                color: "text-purple-500",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${stat.color}`}
                  >
                    <i className={`${stat.icon} text-xl`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-3">
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Stations</option>
                {stations.map((station) => (
                  <option key={station.code} value={station.code}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">All Service Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("schedule")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "schedule"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <i className="ri-calendar-schedule-line mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setViewMode("network")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "network"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <i className="ri-global-line mr-2" />
                Network
              </button>
            </div>
          </div>

          {viewMode === "schedule" ? (
            <>
              {/* Train Schedule Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Train
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Route
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Departure
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Arrival
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Frequency
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                          Capacity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredServices.map((service, index) => (
                        <motion.tr
                          key={service.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-mono font-medium text-gray-900 dark:text-white">
                                {service.trainNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                {service.operator}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white ${serviceTypeColors[service.type] || "bg-gray-500"}`}
                            >
                              {service.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {service.origin}
                              </span>
                              <i className="ri-arrow-right-line text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                {service.destination}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-mono text-gray-900 dark:text-white">
                              {service.departureTime}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-mono text-gray-900 dark:text-white">
                                {service.arrivalTime}
                              </p>
                              {service.nextDay && (
                                <span className="text-xs text-amber-500">
                                  +1 day
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1">
                              {days.map((day) => (
                                <span
                                  key={day}
                                  className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                                    service.frequency.includes(day)
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                  }`}
                                >
                                  {day.charAt(0)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                service.status === "ON_TIME"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : service.status === "DELAYED"
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  service.status === "ON_TIME"
                                    ? "bg-green-500"
                                    : service.status === "DELAYED"
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                              ></span>
                              {service.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${(service.available / service.capacity) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {service.available}/{service.capacity}
                                </span>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Service Types:
                </span>
                {Object.entries(serviceTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color}`}></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Network View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stations List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Stations
                </h3>
                <div className="space-y-3">
                  {stations.map((station, index) => (
                    <motion.div
                      key={station.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedStation === station.code
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedStation(station.code)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                              {station.code}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                              {station.type}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white mt-1">
                            {station.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {station.city}, {station.country}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-green-600">
                            <i className="ri-arrow-up-line" />{" "}
                            {station.departures}
                          </p>
                          <p className="text-blue-600">
                            <i className="ri-arrow-down-line" />{" "}
                            {station.arrivals}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Network Diagram */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  GCC Rail Network
                </h3>
                <div className="relative h-96 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  {/* Network Visualization */}
                  <svg viewBox="0 0 600 400" className="w-full h-full">
                    {/* Routes */}
                    <line
                      x1="100"
                      y1="100"
                      x2="300"
                      y2="200"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1="300"
                      y1="200"
                      x2="500"
                      y2="100"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    <line
                      x1="300"
                      y1="200"
                      x2="500"
                      y2="200"
                      stroke="#8B5CF6"
                      strokeWidth="3"
                    />
                    <line
                      x1="500"
                      y1="100"
                      x2="500"
                      y2="200"
                      stroke="#10B981"
                      strokeWidth="3"
                    />
                    <line
                      x1="100"
                      y1="100"
                      x2="100"
                      y2="300"
                      stroke="#F59E0B"
                      strokeWidth="3"
                    />

                    {/* Stations */}
                    <g className="cursor-pointer">
                      <circle cx="100" cy="100" r="20" fill="#3B82F6" />
                      <text
                        x="100"
                        y="105"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        GTT
                      </text>
                      <text
                        x="100"
                        y="140"
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="10"
                        className="fill-gray-600 dark:fill-gray-300"
                      >
                        Dammam
                      </text>
                    </g>
                    <g className="cursor-pointer">
                      <circle cx="300" cy="200" r="20" fill="#8B5CF6" />
                      <text
                        x="300"
                        y="205"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        DRY
                      </text>
                      <text
                        x="300"
                        y="240"
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="10"
                        className="fill-gray-600 dark:fill-gray-300"
                      >
                        Riyadh
                      </text>
                    </g>
                    <g className="cursor-pointer">
                      <circle cx="500" cy="100" r="20" fill="#10B981" />
                      <text
                        x="500"
                        y="105"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        ICAD
                      </text>
                      <text
                        x="500"
                        y="140"
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="10"
                        className="fill-gray-600 dark:fill-gray-300"
                      >
                        Abu Dhabi
                      </text>
                    </g>
                    <g className="cursor-pointer">
                      <circle cx="500" cy="200" r="20" fill="#F59E0B" />
                      <text
                        x="500"
                        y="205"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        JART
                      </text>
                      <text
                        x="500"
                        y="240"
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="10"
                        className="fill-gray-600 dark:fill-gray-300"
                      >
                        Jebel Ali
                      </text>
                    </g>
                    <g className="cursor-pointer">
                      <circle cx="100" cy="300" r="20" fill="#EF4444" />
                      <text
                        x="100"
                        y="305"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        JED
                      </text>
                      <text
                        x="100"
                        y="340"
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="10"
                        className="fill-gray-600 dark:fill-gray-300"
                      >
                        Jeddah
                      </text>
                    </g>
                  </svg>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-0.5 bg-blue-500"
                          style={{ borderStyle: "dashed" }}
                        ></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Cross-Border
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-purple-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Domestic
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Future Expansions */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Upcoming Network Expansions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        name: "Kuwait Connection",
                        status: "Planning",
                        eta: "2027",
                      },
                      {
                        name: "Bahrain Link",
                        status: "Under Study",
                        eta: "2028",
                      },
                      {
                        name: "Oman Extension",
                        status: "Approved",
                        eta: "2026",
                      },
                      {
                        name: "Qatar Corridor",
                        status: "Planning",
                        eta: "2029",
                      },
                    ].map((expansion, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {expansion.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expansion.status}
                          </p>
                        </div>
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {expansion.eta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTemplate>
    </ProposalErrorBoundary>
  );
}
