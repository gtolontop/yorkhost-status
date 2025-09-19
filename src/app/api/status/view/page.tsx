'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { StatusOverview as StatusOverviewType } from '@/types'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Server,
  Database,
  Globe,
  Zap
} from 'lucide-react'
import styles from './statusView.module.scss'

export default function StatusViewPage() {
  const [status, setStatus] = useState<StatusOverviewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const result = await response.json()
      
      if (result.success) {
        setStatus(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch status')
      }
    } catch (err) {
      setError('Network error')
      console.error('Status fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'operational':
        return '#22c55e'
      case 'degraded':
        return '#f59e0b'
      case 'outage':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getOverallStatusLabel = (overall: string) => {
    switch (overall) {
      case 'operational':
        return 'Tous les systèmes opérationnels'
      case 'degraded':
        return 'Performance dégradée'
      case 'outage':
        return 'Panne majeure'
      default:
        return 'Statut inconnu'
    }
  }

  const getServiceStatusLabel = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel'
      case 'degraded':
        return 'Dégradé'
      case 'outage':
        return 'Hors service'
      default:
        return 'Inconnu'
    }
  }

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase()
    if (name.includes('api') || name.includes('web')) {
      return Globe
    } else if (name.includes('database') || name.includes('db')) {
      return Database
    } else if (name.includes('server') || name.includes('host')) {
      return Server
    } else {
      return Zap
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement du statut...</p>
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
            <AlertTriangle size={48} />
            <h2>Erreur de chargement</h2>
            <p>{error}</p>
            <button onClick={fetchStatus} className="btn btn-primary">
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
          <h1>Données de statut en temps réel</h1>
          <p>Aperçu technique des données API de monitoring</p>
          <div className={styles.lastUpdate}>
            <Clock size={16} />
            <span>Dernière mise à jour: {status ? formatRelativeTime(new Date(status.lastUpdated)) : 'Inconnue'}</span>
          </div>
        </div>

        {status && (
          <>
            {/* Overall Status */}
            <div className={styles.overallStatus}>
              <div 
                className={styles.statusIndicator}
                style={{ backgroundColor: getOverallStatusColor(status.overall) }}
              >
                {status.overall === 'operational' ? (
                  <CheckCircle size={32} color="white" />
                ) : (
                  <AlertTriangle size={32} color="white" />
                )}
              </div>
              <div className={styles.statusText}>
                <h2>{getOverallStatusLabel(status.overall)}</h2>
                <p>Statut global: <strong>{status.overall.toUpperCase()}</strong></p>
              </div>
            </div>

            {/* Uptime Stats */}
            <div className={styles.statsSection}>
              <h3>Statistiques de disponibilité</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <Activity size={20} />
                    <span>24 heures</span>
                  </div>
                  <div className={styles.statValue}>
                    {status.uptimeStats['24h'].toFixed(2)}%
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <Activity size={20} />
                    <span>7 jours</span>
                  </div>
                  <div className={styles.statValue}>
                    {status.uptimeStats['7d'].toFixed(2)}%
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statHeader}>
                    <Activity size={20} />
                    <span>30 jours</span>
                  </div>
                  <div className={styles.statValue}>
                    {status.uptimeStats['30d'].toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className={styles.servicesSection}>
              <h3>Services surveillés ({status.services.length})</h3>
              <div className={styles.servicesList}>
                {status.services.map((service) => {
                  const ServiceIcon = getServiceIcon(service.name)
                  return (
                    <div key={service.id} className={styles.serviceCard}>
                      <div className={styles.serviceHeader}>
                        <div className={styles.serviceIcon}>
                          <ServiceIcon size={20} />
                        </div>
                        <div className={styles.serviceInfo}>
                          <h4>{service.name}</h4>
                          <p>{service.description || 'Aucune description'}</p>
                        </div>
                        <div 
                          className={styles.serviceStatus}
                          style={{ 
                            backgroundColor: getStatusColor(service.uptimePercent24h),
                            color: 'white'
                          }}
                        >
                          {getServiceStatusLabel(service.currentStatus)}
                        </div>
                      </div>
                      
                      <div className={styles.serviceStats}>
                        <div className={styles.serviceStat}>
                          <span className={styles.statLabel}>Uptime 24h:</span>
                          <span className={styles.statValue}>{service.uptimePercent24h.toFixed(2)}%</span>
                        </div>
                        <div className={styles.serviceStat}>
                          <span className={styles.statLabel}>Temps de réponse:</span>
                          <span className={styles.statValue}>
                            {service.averageResponseTime ? `${Math.round(service.averageResponseTime)}ms` : 'N/A'}
                          </span>
                        </div>
                        <div className={styles.serviceStat}>
                          <span className={styles.statLabel}>Dernier check:</span>
                          <span className={styles.statValue}>
                            {service.lastCheck ? formatRelativeTime(new Date(service.lastCheck)) : 'Jamais'}
                          </span>
                        </div>
                        <div className={styles.serviceStat}>
                          <span className={styles.statLabel}>Machine:</span>
                          <span className={styles.statValue}>{service.machine?.name || 'Inconnue'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Active Incidents */}
            {status.activeIncidents && status.activeIncidents.length > 0 && (
              <div className={styles.incidentsSection}>
                <h3>Incidents actifs ({status.activeIncidents.length})</h3>
                <div className={styles.incidentsList}>
                  {status.activeIncidents.map((incident) => (
                    <div key={incident.id} className={styles.incidentCard}>
                      <div className={styles.incidentHeader}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        <h4>{incident.title}</h4>
                        <span className={styles.incidentSeverity}>
                          {incident.severity}
                        </span>
                      </div>
                      <p>{incident.description}</p>
                      <div className={styles.incidentMeta}>
                        <span>Statut: {incident.status}</span>
                        <span>Début: {formatRelativeTime(new Date(incident.startTime))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Data */}
            <div className={styles.rawData}>
              <h3>Données brutes (JSON)</h3>
              <div className={styles.jsonViewer}>
                <pre>{JSON.stringify(status, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}