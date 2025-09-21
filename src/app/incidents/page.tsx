'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import Link from 'next/link'
import { AlertTriangle, Wrench, Calendar, ArrowRight, AlertCircle } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Incident {
  id: string
  slug?: string
  title: string
  description: string
  type: 'INCIDENT' | 'MAINTENANCE'
  status: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  startTime: string
  endTime?: string
  isScheduled?: boolean
  service?: { name: string }
  machine?: { name: string }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active')

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/incidents')
      const result = await response.json()
      if (result.success && result.data) {
        setIncidents(result.data.incidents || [])
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'active') {
      return !incident.endTime && incident.status !== 'RESOLVED' && incident.status !== 'COMPLETED'
    }
    if (filter === 'resolved') {
      return incident.endTime || incident.status === 'RESOLVED' || incident.status === 'COMPLETED'
    }
    return true
  })

  const getIncidentIcon = (incident: Incident) => {
    if (incident.type === 'MAINTENANCE' || incident.isScheduled) {
      return Wrench
    }
    return AlertTriangle
  }

  const getIncidentColor = (incident: Incident) => {
    if (incident.type === 'MAINTENANCE' || incident.isScheduled) {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    }
    if (incident.status === 'RESOLVED' || incident.status === 'COMPLETED') {
      return 'text-gray-600 bg-gray-50 border-gray-200'
    }
    switch (incident.severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <PageHeader
          icon={<AlertCircle size={96} />}
          title="Incidents & Maintenance"
          subtitle="View all current and past incidents affecting our services"
          status="operational"
        />

        <div className="max-w-4xl mx-auto">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 justify-center">
            {[
              { value: 'active', label: 'Active' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'all', label: 'All' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === option.value
                    ? 'bg-[#6D96FF] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Incidents List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6D96FF] mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading incidents...</p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900">No incidents found</h3>
              <p className="text-gray-600 mt-1">
                {filter === 'active' ? 'All systems are operational' : 'No incidents match your filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map(incident => {
                const Icon = getIncidentIcon(incident)
                const colorClasses = getIncidentColor(incident)

                return (
                  <Link
                    key={incident.id}
                    href={`/incident/${incident.slug || incident.id}`}
                    className={`block p-6 rounded-lg border hover:shadow-md transition-all group ${colorClasses}`}
                  >
                    <div className="flex items-start gap-4">
                      <Icon className="mt-0.5 shrink-0" size={24} />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 group-hover:underline">
                              {incident.title}
                            </h3>
                            <p className="text-sm opacity-75 mb-2">
                              {incident.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm opacity-60">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatRelativeTime(incident.startTime)}</span>
                              </div>
                              {(incident.service || incident.machine) && (
                                <span>
                                  Affecting: {incident.service?.name || incident.machine?.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                incident.status === 'RESOLVED' || incident.status === 'COMPLETED'
                                  ? 'bg-gray-100 text-gray-700'
                                  : incident.type === 'MAINTENANCE'
                                  ? 'bg-blue-100 text-blue-700'
                                  : incident.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-700'
                                  : incident.severity === 'HIGH'
                                  ? 'bg-orange-100 text-orange-700'
                                  : incident.severity === 'MEDIUM'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {incident.type === 'MAINTENANCE' ? 'Maintenance' : incident.severity}
                              </span>
                              <p className="text-xs font-medium mt-1 opacity-60">
                                {incident.status.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <ArrowRight className="opacity-40 group-hover:opacity-70 transition-opacity" size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}