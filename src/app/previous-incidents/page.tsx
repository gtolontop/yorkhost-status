'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { AlertTriangle, CheckCircle, Clock, Calendar, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'

interface Incident {
  id: string
  slug: string
  title: string
  description: string
  type: 'INCIDENT' | 'MAINTENANCE'
  status: string
  severity: string
  startTime: string
  endTime?: string
  resolvedAt?: string
  affectedServices: string[]
  updates: any[]
}

export default function PreviousIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'incident' | 'maintenance'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all')

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      // Fetch both active and historical incidents
      const [activeResponse, historyResponse] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/incidents/history')
      ])
      
      const activeResult = await activeResponse.json()
      const historyResult = await historyResponse.json()
      
      const allIncidents = []
      
      if (activeResult.success && activeResult.data?.incidents) {
        allIncidents.push(...activeResult.data.incidents)
      }
      
      if (historyResult.success && historyResult.data) {
        allIncidents.push(...historyResult.data)
      }
      
      // Remove duplicates based on ID
      const uniqueIncidents = Array.from(
        new Map(allIncidents.map(item => [item.id, item])).values()
      )
      
      setIncidents(uniqueIncidents.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ))
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50'
      case 'HIGH':
        return 'text-orange-600 bg-orange-50'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50'
      case 'LOW':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'Ongoing'
    
    const startTime = new Date(start)
    const endTime = new Date(end)
    const diff = endTime.getTime() - startTime.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Get unique years from incidents
  const years = Array.from(new Set(incidents.map(inc => new Date(inc.startTime).getFullYear()))).sort((a, b) => b - a)

  const filteredIncidents = incidents.filter(incident => {
    // Filter by year
    if (yearFilter !== 'all') {
      const incidentYear = new Date(incident.startTime).getFullYear().toString()
      if (incidentYear !== yearFilter) return false
    }

    // Filter by type
    if (typeFilter === 'incident' && incident.type !== 'INCIDENT') return false
    if (typeFilter === 'maintenance' && incident.type !== 'MAINTENANCE') return false

    // Filter by status
    if (statusFilter === 'active') {
      return !incident.endTime && incident.status !== 'RESOLVED' && incident.status !== 'COMPLETED'
    }
    if (statusFilter === 'resolved') {
      return incident.status === 'RESOLVED' || incident.status === 'COMPLETED' || incident.endTime
    }
    
    return true
  })

  // Group incidents by month
  const groupedIncidents = filteredIncidents.reduce((groups: any, incident) => {
    const date = new Date(incident.startTime)
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    if (!groups[monthYear]) {
      groups[monthYear] = []
    }
    groups[monthYear].push(incident)
    
    return groups
  }, {})

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <PageHeader
          icon={<Clock size={64} />}
          title="All Incidents"
          subtitle="View all current and past incidents affecting our services"
        />

        {/* Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
              </div>
              
              {/* Year Filter */}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              {/* Type Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    typeFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter('incident')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    typeFilter === 'incident'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Incidents
                </button>
                <button
                  onClick={() => setTypeFilter('maintenance')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    typeFilter === 'maintenance'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Maintenance
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === 'resolved'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Incidents Timeline */}
        <div className="max-w-4xl mx-auto">
          {Object.keys(groupedIncidents).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
              <p className="text-gray-500">No previous incidents match your filters.</p>
            </div>
          ) : (
            Object.entries(groupedIncidents).map(([monthYear, monthIncidents]: [string, any]) => (
              <div key={monthYear} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 px-4 -mx-4 border-b border-gray-200">
                  {monthYear}
                </h3>
                
                <div className="space-y-4">
                  {monthIncidents.map((incident: Incident) => (
                    <div key={incident.id} className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                      incident.status !== 'RESOLVED' && incident.status !== 'COMPLETED' && !incident.endTime
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="mt-0.5">
                              {incident.type === 'MAINTENANCE' ? (
                                <Calendar className="w-5 h-5 text-blue-600" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                {incident.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                {incident.type === 'INCIDENT' && (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                    {incident.severity}
                                  </span>
                                )}
                                
                                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  Duration: {formatDuration(incident.startTime, incident.endTime || incident.resolvedAt)}
                                </span>
                                
                                <span className="text-sm text-gray-500">
                                  {new Date(incident.startTime).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <p className="text-gray-600 mb-3">{incident.description}</p>
                              
                              {incident.affectedServices.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {incident.affectedServices.map((service, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                      {service}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          href={`/incident/${incident.slug}`}
                          className="ml-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}