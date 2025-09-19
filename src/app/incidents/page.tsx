'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import PageHeader from '@/components/ui/PageHeader'
import { IncidentWithDetails, IncidentFilter } from '@/types'
import { formatRelativeTime, getSeverityColor } from '@/lib/utils'
import { Clock } from 'lucide-react'
import styles from './incidents.module.scss'

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
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading incidents...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.error}>
            <h2>Loading Error</h2>
            <p>{error}</p>
            <button onClick={fetchIncidents} className="btn btn-primary">
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

        <div className={styles.content}>
          <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search incidents..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterTags}>
            <div className={styles.filterGroup}>
              <span>Status:</span>
              {['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  className={`${styles.filterTag} ${filter.status?.includes(status as any) ? styles.active : ''}`}
                  onClick={() => {
                    const currentStatus = filter.status || []
                    const newStatus = currentStatus.includes(status as any)
                      ? currentStatus.filter(s => s !== status)
                      : [...currentStatus, status as any]
                    setFilter(prev => ({ ...prev, status: newStatus }))
                  }}
                  style={{ borderColor: getStatusColor(status) }}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

          <div className={styles.incidents}>
            {incidents.length === 0 ? (
              <div className={styles.empty}>
                <h3>No incidents found</h3>
                <p>No incidents match the search criteria.</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className={styles.incident}>
                  <div className={styles.incidentHeader}>
                    <div className={styles.incidentTitle}>
                      <h3>{incident.title}</h3>
                      <div className={styles.incidentMeta}>
                        <span 
                          className={styles.status}
                          style={{ 
                            backgroundColor: getStatusColor(incident.status),
                            color: 'white'
                          }}
                        >
                          {getStatusLabel(incident.status)}
                        </span>
                        <span 
                          className={styles.severity}
                          style={{ color: getSeverityColor(incident.severity) }}
                        >
                          {getSeverityLabel(incident.severity)}
                        </span>
                        <span className={styles.time}>
                          {formatRelativeTime(new Date(incident.startTime))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.incidentBody}>
                    <p>{incident.description}</p>
                    
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