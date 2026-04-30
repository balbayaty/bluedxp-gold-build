/**
 * 🧪 PERMISSION TESTING ENVIRONMENT UI
 *
 * Beautiful testing interface:
 * - Create test scenarios
 * - Run tests
 * - View results
 * - Clone scenarios
 * - Test history
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/services/user";
import { permissionTestingEnvironment } from "@/lib/services/permissions/permissionTestingEnvironment";
import type { User } from "@/types/user";
import type {
  TestScenario,
  TestResult,
} from "@/lib/services/permissions/permissionTestingEnvironment";

export default function PermissionTestingEnvironmentComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(
    null,
  );
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, scenarioData] = await Promise.all([
        userService.getUsers({}),
        permissionTestingEnvironment.getAllScenarios(),
      ]);
      setUsers(userData);
      setScenarios(scenarioData);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const createScenario = async () => {
    if (!selectedScenario) return;

    setLoading(true);
    try {
      const scenario = await permissionTestingEnvironment.createScenario(
        `Test Scenario ${Date.now()}`,
        "Test scenario",
        selectedScenario.user,
        selectedScenario.permissions,
      );
      await loadData();
      setSelectedScenario(scenario);
    } catch (error) {
      console.error("Failed to create scenario:", error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (scenarioId: string) => {
    setLoading(true);
    try {
      const result = await permissionTestingEnvironment.runScenario(scenarioId);
      setTestResult(result);
      await loadData();
    } catch (error) {
      console.error("Failed to run test:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: "bg-gray-500/20 text-gray-400",
      RUNNING: "bg-blue-500/20 text-blue-400",
      PASSED: "bg-green-500/20 text-green-400",
      FAILED: "bg-red-500/20 text-red-400",
      CANCELLED: "bg-yellow-500/20 text-yellow-400",
    };
    return colors[status as keyof typeof colors] || colors.DRAFT;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <i className="ri-flask-line text-cyan-400"></i>
                Permission Testing Environment
              </h1>
              <p className="text-gray-400">
                Test permissions in isolated environment before applying
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              Create Scenario
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Scenarios List */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <h2 className="text-xl font-bold mb-4">Test Scenarios</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {scenarios.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-flask-line text-4xl mb-2"></i>
                    <p>No test scenarios</p>
                  </div>
                ) : (
                  scenarios.map((scenario) => (
                    <motion.div
                      key={scenario.id}
                      onClick={() => {
                        setSelectedScenario(scenario);
                        permissionTestingEnvironment
                          .getTestResult(scenario.id)
                          .then((result) => setTestResult(result || null));
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedScenario?.id === scenario.id
                          ? "bg-cyan-500/20 border-cyan-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{scenario.name}</div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${getStatusColor(scenario.status)}`}
                        >
                          {scenario.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {scenario.description}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>{scenario.testCases.length} tests</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            runTest(scenario.id);
                          }}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30"
                        >
                          Run
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Middle: Scenario Details */}
          <div className="lg:col-span-1">
            {selectedScenario ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-4">Scenario Details</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Name</div>
                    <div className="font-semibold">{selectedScenario.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Description
                    </div>
                    <div className="text-sm">
                      {selectedScenario.description}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">User</div>
                    <div className="text-sm">{selectedScenario.user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">
                      Permissions
                    </div>
                    <div className="text-sm font-mono">
                      {selectedScenario.permissions.length} permission(s)
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Test Cases</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedScenario.testCases.map((testCase, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white/5 rounded-lg text-sm"
                        >
                          <div className="font-semibold mb-1">
                            {testCase.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {testCase.description}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs">
                              Expected: {testCase.expectedResult}
                            </span>
                            {testCase.actualResult && (
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  testCase.passed
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {testCase.actualResult}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-flask-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Select a scenario to view details
                </p>
              </div>
            )}
          </div>

          {/* Right: Test Results */}
          <div className="lg:col-span-1">
            {testResult ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold mb-4">Test Results</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {testResult.passed}
                      </div>
                      <div className="text-xs text-gray-400">Passed</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {testResult.failed}
                      </div>
                      <div className="text-xs text-gray-400">Failed</div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Duration</div>
                    <div className="text-lg font-semibold">
                      {(testResult.duration / 1000).toFixed(2)}s
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-400 mb-2">Summary</div>
                    <div className="space-y-1 text-xs">
                      <div>
                        Access Granted: {testResult.summary.accessGranted}
                      </div>
                      <div>
                        Access Denied: {testResult.summary.accessDenied}
                      </div>
                      <div>
                        Partial Access: {testResult.summary.partialAccess}
                      </div>
                      <div>Errors: {testResult.summary.errors}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 text-center">
                <i className="ri-file-chart-line text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">Run a test to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
