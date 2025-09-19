'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { IncidentWithDetails, IncidentFilter } from '@/types'
import { formatRelativeTime, getSeverityColor } from '@/lib/utils'
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
        setIncidents(result.data)
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
        return 'En investigation'
      case 'IDENTIFIED':
        return 'Identifié'
      case 'MONITORING':
        return 'Surveillance'
      case 'RESOLVED':
        return 'Résolu'
      case 'SCHEDULED':
        return 'Planifié'
      default:
        return status
    }
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'Faible'
      case 'MEDIUM':
        return 'Moyen'
      case 'HIGH':
        return 'Élevé'
      case 'CRITICAL':
        return 'Critique'
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
            <p>Chargement des incidents...</p>
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
            <h2>Erreur de chargement</h2>
            <p>{error}</p>
            <button onClick={fetchIncidents} className="btn btn-primary">
              Réessayer
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container">
        <div className={styles.header}>
          <h1>Historique des incidents</h1>
          <p>Suivi des incidents et maintenances sur les services Yorkhost</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher un incident..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterTags}>
            <div className={styles.filterGroup}>
              <span>Statut:</span>
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
              <h3>Aucun incident trouvé</h3>
              <p>Aucun incident ne correspond aux critères de recherche.</p>
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
                      <span>Service affecté: <strong>{incident.service.name}</strong></span>
                    </div>
                  )}

                  {incident.updates && incident.updates.length > 0 && (
                    <div className={styles.updates}>
                      <h4>Mises à jour:</h4>
                      {incident.updates.slice(0, 3).map((update) => (
                        <div key={update.id} className={styles.update}>
                          <div className={styles.updateTime}>
                            {formatRelativeTime(new Date(update.timestamp))}
                          </div>
                          <div className={styles.updateContent}>
                            {update.description}
                          </div>
                        </div>
                      ))}
                      {incident.updates.length > 3 && (
                        <div className={styles.moreUpdates}>
                          +{incident.updates.length - 3} autres mises à jour
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.incidentFooter}>
                  <div className={styles.timeline}>
                    <span>Début: {new Date(incident.startTime).toLocaleDateString('fr-FR')}</span>
                    {incident.endTime && (
                      <span>Fin: {new Date(incident.endTime).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}