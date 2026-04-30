"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ASNData } from "@/types/asn";
import {
  EmployeeOvertimeRecord,
  OvertimeDiscrepancy,
  compareOvertime,
} from "@/types/overtime";
import { calculateEmployeeOvertime } from "@/utils/overtimeCalculator";
import { format } from "date-fns";

interface EmployeeOvertimeTrackerProps {
  asns: ASNData[];
  overtimeRecords?: EmployeeOvertimeRecord[];
}

export default function EmployeeOvertimeTracker({
  asns,
  overtimeRecords = [],
}: EmployeeOvertimeTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");

  // Calculate overtime for all employees from ASN data
  const calculatedOvertime = useMemo(() => {
    const operations: Array<{
      employeeName: string;
      startTime: Date | string;
      endTime: Date | string;
    }> = [];

    asns.forEach((asn) => {
      // Inbound operations
      if (
        asn.offloadingStartTime &&
        asn.offloadingEndTime &&
        asn.offloadingForkliftDriver
      ) {
        operations.push({
          employeeName: asn.offloadingForkliftDriver,
          startTime: asn.offloadingStartTime,
          endTime: asn.offloadingEndTime,
        });
      }
      if (
        asn.putawayStartTime &&
        asn.putawayEndTime &&
        asn.putawayForkliftDriver
      ) {
        operations.push({
          employeeName: asn.putawayForkliftDriver,
          startTime: asn.putawayStartTime,
          endTime: asn.putawayEndTime,
        });
      }
      // Outbound operations
      if (asn.pickingStartTime && asn.pickingEndTime && asn.assignedPerson) {
        operations.push({
          employeeName: asn.assignedPerson,
          startTime: asn.pickingStartTime,
          endTime: asn.pickingEndTime,
        });
      }
      if (asn.qcStartTime && asn.qcEndTime && asn.operationOfficerName) {
        operations.push({
          employeeName: asn.operationOfficerName,
          startTime: asn.qcStartTime,
          endTime: asn.qcEndTime,
        });
      }
    });

    return calculateEmployeeOvertime(operations);
  }, [asns]);

  // Compare calculated vs issued overtime
  const discrepancies = useMemo(() => {
    const discrepanciesList: OvertimeDiscrepancy[] = [];

    calculatedOvertime.forEach((calc, employeeName) => {
      const records = overtimeRecords.filter(
        (r) =>
          r.employeeName === employeeName &&
          (!selectedDate ||
            format(new Date(r.date), "yyyy-MM-dd") === selectedDate),
      );

      if (records.length > 0) {
        const totalIssued = records.reduce((sum, r) => sum + r.hoursIssued, 0);
        const status = compareOvertime(calc.overtimeHours, totalIssued);
        const difference = calc.overtimeHours - totalIssued;

        discrepanciesList.push({
          employeeId: records[0].employeeId,
          employeeName,
          date: records[0].date,
          calculatedHours: calc.overtimeHours,
          issuedHours: totalIssued,
          difference,
          status,
          details: `Standard: ${calc.standardHours.toFixed(2)}h, Overtime: ${calc.overtimeHours.toFixed(2)}h, Break: ${calc.breakHours.toFixed(2)}h`,
        });
      } else {
        // No issued record found - potential underreporting
        if (calc.overtimeHours > 0) {
          discrepanciesList.push({
            employeeId: employeeName,
            employeeName,
            date: new Date().toISOString(),
            calculatedHours: calc.overtimeHours,
            issuedHours: 0,
            difference: calc.overtimeHours,
            status: "Underreported",
            details: `No overtime record found. Calculated: ${calc.overtimeHours.toFixed(2)}h`,
          });
        }
      }
    });

    return discrepanciesList;
  }, [calculatedOvertime, overtimeRecords, selectedDate]);

  const filteredDiscrepancies = useMemo(() => {
    let filtered = discrepancies;
    if (selectedEmployee !== "ALL") {
      filtered = filtered.filter((d) => d.employeeName === selectedEmployee);
    }
    return filtered;
  }, [discrepancies, selectedEmployee]);

  const getStatusBadge = (status: OvertimeDiscrepancy["status"]) => {
    switch (status) {
      case "Match":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Underreported":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Overreported":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Employee Overtime Tracking
          </h2>
          <p className="text-[#9ca3af] text-sm">
            Compare calculated overtime vs issued overtime records
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[#9ca3af] text-xs mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-[#9ca3af] text-xs mb-1">Employee</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[150px]"
          >
            <option value="ALL">All Employees</option>
            {Array.from(new Set(discrepancies.map((d) => d.employeeName))).map(
              (name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-4"
        >
          <p className="text-sm text-[#9ca3af] mb-2">Total Employees</p>
          <h3 className="text-2xl font-bold text-white">
            {calculatedOvertime.size}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-4"
        >
          <p className="text-sm text-[#9ca3af] mb-2">Total Overtime Hours</p>
          <h3 className="text-2xl font-bold text-cyan-400">
            {Array.from(calculatedOvertime.values())
              .reduce((sum, calc) => sum + calc.overtimeHours, 0)
              .toFixed(2)}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-4"
        >
          <p className="text-sm text-[#9ca3af] mb-2">Discrepancies</p>
          <h3 className="text-2xl font-bold text-red-400">
            {filteredDiscrepancies.filter((d) => d.status !== "Match").length}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1f2937] border border-[#374151] rounded-lg p-4"
        >
          <p className="text-sm text-[#9ca3af] mb-2">Underreported</p>
          <h3 className="text-2xl font-bold text-yellow-400">
            {
              filteredDiscrepancies.filter((d) => d.status === "Underreported")
                .length
            }
          </h3>
        </motion.div>
      </div>

      {/* Discrepancies Table */}
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#374151]">
          <h3 className="text-lg font-semibold text-white">
            Overtime Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827] border-b border-[#374151]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#9ca3af] uppercase">
                  Calculated Hours
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#9ca3af] uppercase">
                  Issued Hours
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#9ca3af] uppercase">
                  Difference
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#9ca3af] uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#9ca3af] uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {filteredDiscrepancies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[#9ca3af]"
                  >
                    No discrepancies found
                  </td>
                </tr>
              ) : (
                filteredDiscrepancies.map((discrepancy, index) => (
                  <motion.tr
                    key={`${discrepancy.employeeName}-${discrepancy.date}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-[#111827] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      {discrepancy.employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af]">
                      {format(new Date(discrepancy.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-cyan-400 font-medium">
                      {discrepancy.calculatedHours.toFixed(2)}h
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-white font-medium">
                      {discrepancy.issuedHours.toFixed(2)}h
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        discrepancy.difference > 0
                          ? "text-red-400"
                          : discrepancy.difference < 0
                            ? "text-green-400"
                            : "text-white"
                      }`}
                    >
                      {discrepancy.difference > 0 ? "+" : ""}
                      {discrepancy.difference.toFixed(2)}h
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                          discrepancy.status,
                        )}`}
                      >
                        {discrepancy.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#9ca3af]">
                      {discrepancy.details}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
