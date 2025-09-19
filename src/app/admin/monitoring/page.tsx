'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { 
  Activity, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Clock,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react'
import styles from '../admin.module.scss'

interface CheckResult {
  id: string
  serviceId: string
  service: {
    name: string
    machine: {
      name: string
    }
  }
  success: boolean
  responseTime: number
  timestamp: string
  errorMessage?: string
}

interface LiveService {
  id: string
  name: string
  machine: {
    name: string
  }
  lastCheck?: CheckResult
  uptime: number
  avgResponseTime: number
  status: 'up' | 'down' | 'degraded'
}

export default function AdminMonitoringPage() {
  const [services, setServices] = useState<LiveService[]>([])
  const [recentChecks, setRecentChecks] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchMonitoringData()
    
    let interval: NodeJS.Timeout
    if (isLive) {
      interval = setInterval(() => {
        fetchMonitoringData()
      }, 5000) // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLive])

  const fetchMonitoringData = async () => {
    try {
      // Fetch services with their latest status
      const servicesResponse = await fetch('/api/admin/services')
      const servicesResult = await servicesResponse.json()
      
      if (servicesResult.success) {
        // Transform services data to include monitoring info
        const servicesWithStatus = servicesResult.data.map((service: any) => ({
          ...service,
          uptime: Math.random() * 10 + 90, // Mock data
          avgResponseTime: Math.floor(Math.random() * 200 + 50),
          status: Math.random() > 0.1 ? 'up' : (Math.random() > 0.5 ? 'degraded' : 'down'),
          lastCheck: {
            id: `check-${service.id}`,
            serviceId: service.id,
            service: service,
            success: Math.random() > 0.1,
            responseTime: Math.floor(Math.random() * 200 + 50),
            timestamp: new Date().toISOString(),
            errorMessage: Math.random() > 0.9 ? 'Connection timeout' : undefined
          }
        }))
        
        setServices(servicesWithStatus)
        
        // Generate recent checks
        const checks = servicesWithStatus.flatMap((service: any) => 
          Array.from({ length: 3 }, (_, i) => ({
            id: `recent-${service.id}-${i}`,
            serviceId: service.id,
            service: service,
            success: Math.random() > 0.15,
            responseTime: Math.floor(Math.random() * 300 + 20),
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
            errorMessage: Math.random() > 0.8 ? 'Connection refused' : undefined
          }))
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        
        setRecentChecks(checks.slice(0, 20))
        setError(null)
      } else {
        setError(servicesResult.error || 'Failed to fetch monitoring data')
      }
      
      setLastUpdate(new Date())
    } catch (err) {
      setError('Network error')
      console.error('Monitoring fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#22c55e'
      case 'degraded': return '#f59e0b'
      case 'down': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getServiceStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle size={16} />
      case 'degraded': return <AlertTriangle size={16} />
      case 'down': return <AlertTriangle size={16} />
      default: return <Clock size={16} />
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `Il y a ${minutes}min`
    }
    return `Il y a ${seconds}s`
  }

  if (loading) {
    return (
      <Layout>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Chargement du monitoring...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const upServices = services.filter(s => s.status === 'up').length
  const degradedServices = services.filter(s => s.status === 'degraded').length
  const downServices = services.filter(s => s.status === 'down').length
  const avgResponseTime = services.reduce((acc, s) => acc + s.avgResponseTime, 0) / services.length || 0

  return (
    <Layout>
      <div className="container">
        <div className={styles.header}>
          <div>
            <button 
              onClick={() => window.location.href = '/admin'}
              className={styles.backBtn}
            >
              <ArrowLeft size={16} />
              Retour au dashboard
            </button>
            <h1>Monitoring en Temps Réel</h1>
            <p>Surveillance en direct des services Yorkhost</p>
          </div>
          <div className={styles.monitoringControls}>
            <button 
              onClick={() => setIsLive(!isLive)}
              className={`${styles.liveBtn} ${isLive ? styles.active : ''}`}
            >
              {isLive ? <Pause size={16} /> : <Play size={16} />}
              {isLive ? 'Pause' : 'Reprendre'}
            </button>
            <button 
              onClick={fetchMonitoringData}
              className={styles.refreshBtn}
            >
              <RefreshCw size={16} />
              Actualiser
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.monitoringStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#22c55e' }}>
              <CheckCircle size={24} color="white" />
            </div>
            <div className={styles.statContent}>
              <h3>{upServices}</h3>
              <p>Services opérationnels</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#f59e0b' }}>
              <AlertTriangle size={24} color="white" />
            </div>
            <div className={styles.statContent}>
              <h3>{degradedServices}</h3>
              <p>Services dégradés</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#ef4444' }}>
              <AlertTriangle size={24} color="white" />
            </div>
            <div className={styles.statContent}>
              <h3>{downServices}</h3>
              <p>Services hors ligne</p>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ backgroundColor: '#3b82f6' }}>
              <Zap size={24} color="white" />
            </div>
            <div className={styles.statContent}>
              <h3>{Math.round(avgResponseTime)}ms</h3>
              <p>Temps de réponse moyen</p>
            </div>
          </div>
        </div>

        <div className={styles.monitoringContent}>
          <div className={styles.servicesMonitoring}>
            <div className={styles.sectionHeader}>
              <h2>Services en direct</h2>
              <span className={styles.lastUpdate}>
                <Clock size={14} />
                Dernière MàJ: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            </div>
            
            <div className={styles.servicesList}>
              {services.map(service => (
                <div key={service.id} className={styles.serviceMonitorCard}>
                  <div className={styles.serviceHeader}>
                    <div className={styles.serviceIcon}>
                      <Server size={16} />
                    </div>
                    <div className={styles.serviceInfo}>
                      <h4>{service.name}</h4>
                      <span>{service.machine.name}</span>
                    </div>
                    <div 
                      className={styles.serviceStatus}
                      style={{ color: getServiceStatusColor(service.status) }}
                    >
                      {getServiceStatusIcon(service.status)}
                      <span>{service.status.toUpperCase()}</span>
                    </div>
                  </div>
                  
                  <div className={styles.serviceMetrics}>
                    <div className={styles.metric}>
                      <span>Uptime</span>
                      <strong>{service.uptime.toFixed(2)}%</strong>
                    </div>
                    <div className={styles.metric}>
                      <span>Temps de réponse</span>
                      <strong>{service.avgResponseTime}ms</strong>
                    </div>
                    {service.lastCheck && (
                      <div className={styles.metric}>
                        <span>Dernier check</span>
                        <strong>{formatRelativeTime(service.lastCheck.timestamp)}</strong>
                      </div>
                    )}
                  </div>
                  
                  {service.lastCheck?.errorMessage && (
                    <div className={styles.errorMessage}>
                      <AlertTriangle size={14} />
                      <span>{service.lastCheck.errorMessage}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.recentActivity}>
            <h2>Activité récente</h2>
            <div className={styles.checksList}>
              {recentChecks.map(check => (
                <div key={check.id} className={styles.checkItem}>
                  <div className={styles.checkStatus}>
                    {check.success ? (
                      <CheckCircle size={16} color="#22c55e" />
                    ) : (
                      <AlertTriangle size={16} color="#ef4444" />
                    )}
                  </div>
                  <div className={styles.checkContent}>
                    <div className={styles.checkService}>
                      <strong>{check.service.name}</strong>
                      <span>• {check.service.machine.name}</span>
                    </div>
                    <div className={styles.checkDetails}>
                      {check.success ? (
                        <span>{check.responseTime}ms</span>
                      ) : (
                        <span className={styles.checkError}>{check.errorMessage || 'Check failed'}</span>
                      )}
                      <span className={styles.checkTime}>
                        {formatRelativeTime(check.timestamp)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.checkResponseTime}>
                    {check.success ? (
                      <TrendingUp size={14} color="#22c55e" />
                    ) : (
                      <TrendingDown size={14} color="#ef4444" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}