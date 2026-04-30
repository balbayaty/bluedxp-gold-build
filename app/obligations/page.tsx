/**
 * Obligations Management Page
 * 
 * Complete obligation tracking and management interface
 * Displays obligations with filtering, compliance status, and actions
 */

'use client'

import { useState, useEffect } from 'react'
import PageTemplate from '@/components/PageTemplate'
import { 
  RiCheckboxCircleLine, 
  RiErrorWarningLine, 
  RiTimeLine,
  RiFileListLine,
  RiAddLine,
  RiFilterLine,
  RiDashboardLine,
  RiAlarmWarningLine
} from 'react-icons/ri'

interface Obligation {
  id: string
  type: string
  name: string
  description: string
  status: string
  severity: string
  dueDate?: string
  responsibleParty: string
  jurisdiction: string
  progress: number
  source: string
  sourceType: string
}

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [filteredObligations, setFilteredObligations] = useState<Obligation[]>([])
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<any>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [severityFilter, setSeverityFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    fetchObligations()
    fetchDashboard()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [obligations, statusFilter, typeFilter, severityFilter, searchQuery])

  const fetchObligations = async () => {
    try {
      const response = await fetch('/api/obligations?tenantId=default')
      const data = await response.json()
      if (data.success) {
        setObligations(data.data)
      }
    } catch (error) {
      console.error('Error fetching obligations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/obligations/dashboard?tenantId=default')
      const data = await response.json()
      if (data.success) {
        setDashboard(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...obligations]

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(o => o.status === statusFilter)
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(o => o.type === typeFilter)
    }

    if (severityFilter !== 'ALL') {
      filtered = filtered.filter(o => o.severity === severityFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(o => 
        o.name.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        o.responsibleParty.toLowerCase().includes(query)
      )
    }

    setFilteredObligations(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MET': return 'text-green-400 bg-green-400/10'
      case 'PENDING': return 'text-blue-400 bg-blue-400/10'
      case 'IN_PROGRESS': return 'text-cyan-400 bg-cyan-400/10'
      case 'OVERDUE': return 'text-orange-400 bg-orange-400/10'
      case 'FAILED': return 'text-red-400 bg-red-400/10'
      case 'DISPUTED': return 'text-purple-400 bg-purple-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400'
      case 'HIGH': return 'text-orange-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'LOW': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null
    const now = new Date()
    const due = new Date(dueDate)
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <PageTemplate
      title="Obligation Management"
      description="Track and manage contractual, regulatory, and operational obligations"
    >
      <div className="space-y-6">
        {/* Dashboard Metrics */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Obligations</p>
                  <p className="text-2xl font-bold text-white mt-1">{dashboard.totalObligations}</p>
                </div>
                <RiFileListLine className="text-3xl text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">{dashboard.activeObligations}</p>
                </div>
                <RiTimeLine className="text-3xl text-cyan-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Compliance Rate</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">{dashboard.overallComplianceRate}%</p>
                </div>
                <RiCheckboxCircleLine className="text-3xl text-green-400" />
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overdue</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{dashboard.overdueCount}</p>
                </div>
                <RiAlarmWarningLine className="text-3xl text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <RiFilterLine className="text-xl text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="MET">Met</option>
                <option value="OVERDUE">Overdue</option>
                <option value="FAILED">Failed</option>
                <option value="DISPUTED">Disputed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="CONTRACTUAL">Contractual</option>
                <option value="REGULATORY">Regulatory</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="PROCEDURAL">Procedural</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search obligations..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Obligations List */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Obligations ({filteredObligations.length})
              </h3>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                <RiAddLine className="text-xl" />
                Create Obligation
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading obligations...</p>
            </div>
          ) : filteredObligations.length === 0 ? (
            <div className="p-8 text-center">
              <RiFileListLine className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No obligations found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or create a new obligation</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredObligations.map((obligation) => {
                const daysUntilDue = getDaysUntilDue(obligation.dueDate)
                return (
                  <div key={obligation.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">{obligation.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(obligation.status)}`}>
                            {obligation.status}
                          </span>
                          <span className={`text-sm font-medium ${getSeverityColor(obligation.severity)}`}>
                            {obligation.severity}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3">{obligation.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Type:</span>
                            <span className="text-gray-300">{obligation.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Source:</span>
                            <span className="text-gray-300">{obligation.sourceType}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Responsible:</span>
                            <span className="text-gray-300">{obligation.responsibleParty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Jurisdiction:</span>
                            <span className="text-gray-300">{obligation.jurisdiction}</span>
                          </div>
                          {obligation.dueDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Due:</span>
                              <span className={`text-gray-300 ${daysUntilDue !== null && daysUntilDue < 0 ? 'text-red-400 font-medium' : daysUntilDue !== null && daysUntilDue <= 7 ? 'text-orange-400 font-medium' : ''}`}>
                                {formatDate(obligation.dueDate)}
                                {daysUntilDue !== null && (
                                  <span className="ml-1">
                                    ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {obligation.progress > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{obligation.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${obligation.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button className="ml-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Due Soon</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Today</span>
                  <span className="text-sm font-semibold text-red-400">{dashboard.dueTodayCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">This Week</span>
                  <span className="text-sm font-semibold text-orange-400">{dashboard.dueThisWeekCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">This Month</span>
                  <span className="text-sm font-semibold text-yellow-400">{dashboard.dueThisMonthCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">By Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Met</span>
                  <span className="text-sm font-semibold text-green-400">{dashboard.metObligations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Active</span>
                  <span className="text-sm font-semibold text-cyan-400">{dashboard.activeObligations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Failed</span>
                  <span className="text-sm font-semibold text-red-400">{dashboard.failedObligations}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Compliance Rate</span>
                  <span className="text-sm font-semibold text-green-400">{dashboard.overallComplianceRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">On-Time Rate</span>
                  <span className="text-sm font-semibold text-blue-400">{dashboard.onTimeCompletionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Critical Risk</span>
                  <span className="text-sm font-semibold text-red-400">{dashboard.criticalRiskCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTemplate>
  )
}
