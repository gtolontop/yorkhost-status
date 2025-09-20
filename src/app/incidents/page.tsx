'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { IncidentWithDetails, IncidentFilter } from '@/types'
import { formatRelativeTime, getSeverityColor } from '@/lib/utils'
import { Clock } from 'lucide-react'

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<IncidentFilter>({})

  useEffect(() => {
    fetchIncidents()
  }, [filter])

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.status?.length) {
        params.append('status', filter.status.join(','))
      }
      if (filter.severity?.length) {
        params.append('severity', filter.severity.join(','))
      }
      if (filter.search) {
        params.append('search', filter.search)
      }

      const response = await fetch(`/api/incidents?${params.toString()}`)
      const result = await response.json()
      
      if (result.success) {
        setIncidents(Array.isArray(result.data) ? result.data : [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch incidents')
      }
    } catch (err) {
      setError('Network error')
      console.error('Incidents fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return '#f59e0b'
      case 'IDENTIFIED':
        return '#3b82f6'
      case 'MONITORING':
        return '#8b5cf6'
      case 'RESOLVED':
        return '#22c55e'
      case 'SCHEDULED':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return 'Investigating'
      case 'IDENTIFIED':
        return 'Identified'
      case 'MONITORING':
        return 'Monitoring'
      case 'RESOLVED':
        return 'Resolved'
      case 'SCHEDULED':
        return 'Scheduled'
      default:
        return status
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'Low'
      case 'MEDIUM':
        return 'Medium'
      case 'HIGH':
        return 'High'
      case 'CRITICAL':
        return 'Critical'
      default:
        return severity
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className="text-center py-12">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading incidents...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container">
          <div className="text-center py-12">
            <h2 className="text-danger text-xl font-semibold mb-2">Loading Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={fetchIncidents} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-hover transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <PageHeader
          icon={<Clock size={96} />}
          title="Incident History"
          subtitle="Track incidents and maintenance on Yorkhost services"
        />

        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search incidents..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full p-3 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 placeholder:text-gray-500 transition-colors"
            />
          </div>
          
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-600 mr-2">Status:</span>
              {['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  className={`px-3 py-1 border rounded-full bg-white text-gray-600 text-sm cursor-pointer transition-all duration-150 hover:bg-gray-100 hover:-translate-y-0.5 ${filter.status?.includes(status as any) ? 'bg-primary text-white border-primary' : 'border-gray-200'}`}
                  onClick={() => {
                    const currentStatus = filter.status || []
                    const newStatus = currentStatus.includes(status as any)
                      ? currentStatus.filter(s => s !== status)
                      : [...currentStatus, status as any]
                    setFilter(prev => ({ ...prev, status: newStatus }))
                  }}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

          <div className="flex flex-col gap-6">
            {incidents.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl text-gray-900 mb-2">No incidents found</h3>
                <p className="text-gray-600">No incidents match the search criteria.</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-colors hover:border-gray-300 hover:shadow-md">
                  <div className="p-6 border-b border-gray-100">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{incident.title}</h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span 
                          className="px-2 py-1 rounded-md text-xs font-semibold uppercase"
                          style={{ 
                            backgroundColor: getStatusColor(incident.status),
                            color: 'white'
                          }}
                        >
                          {getStatusLabel(incident.status)}
                        </span>
                        <span 
                          className="text-sm font-medium capitalize"
                          style={{ color: getSeverityColor(incident.severity) }}
                        >
                          {getSeverityLabel(incident.severity)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(new Date(incident.startTime))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 leading-relaxed mb-4">{incident.description}</p>
                    
                    {incident.service && (
                      <div className={styles.affectedService}>
                        <span>Affected service: <strong>{incident.service.name}</strong></span>
                      </div>
                    )}

                    {incident.updates && incident.updates.length > 0 && (
                      <div className={styles.updates}>
                        <h4>Updates:</h4>
                        {incident.updates.slice(0, 3).map((update) => (
                          <div key={update.id} className={styles.update}>
                            <div className={styles.updateTime}>
                              {formatRelativeTime(new Date(update.timestamp))}
                            </div>
                            <div className={styles.updateContent}>
                              {update.message}
                            </div>
                          </div>
                        ))}
                        {incident.updates.length > 3 && (
                          <div className={styles.moreUpdates}>
                            +{incident.updates.length - 3} more updates
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={styles.incidentFooter}>
                    <div className={styles.timeline}>
                      <span>Started: {new Date(incident.startTime).toLocaleDateString('en-US')}</span>
                      {incident.endTime && (
                        <span>Ended: {new Date(incident.endTime).toLocaleDateString('en-US')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}