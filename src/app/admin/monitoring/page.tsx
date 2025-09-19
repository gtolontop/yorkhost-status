'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import '../admin.css'
import { 
  Activity, 
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Globe,
  Eye,
  Filter
} from 'lucide-react'

interface ServiceMonitor {
  id: string
  name: string
  category: string
  status: 'up' | 'down' | 'degraded'
  uptime: number
  responseTime: number
  lastCheck: string
  machine: string
  url?: string
  checkHistory: {
    timestamp: string
    success: boolean
    responseTime: number
    error?: string
  }[]
}

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  change: number
}

export default function AdminMonitoringPage() {
  const [services, setServices] = useState<ServiceMonitor[]>([])
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMonitoringData()
    
    let interval: NodeJS.Timeout
    if (isLiveMode) {
      interval = setInterval(() => {
        fetchMonitoringData()
      }, 5000) // Update every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLiveMode])

  const fetchMonitoringData = async () => {
    try {
      setRefreshing(true)
      
      // Mock data - replace with real API
      const mockServices: ServiceMonitor[] = [
        {
          id: '1',
          name: 'API Gateway',
          category: 'api',
          status: Math.random() > 0.1 ? 'up' : 'down',
          uptime: 99.95 + (Math.random() * 0.1 - 0.05),
          responseTime: Math.floor(Math.random() * 50 + 100),
          lastCheck: new Date(Date.now() - Math.random() * 60000).toISOString(),
          machine: 'Server-01',
          url: 'https://api.yorkhost.com',
          checkHistory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 30000).toISOString(),
            success: Math.random() > 0.05,
            responseTime: Math.floor(Math.random() * 100 + 80),
            error: Math.random() > 0.9 ? 'Connection timeout' : undefined
          }))
        },
        {
          id: '2',
          name: 'Database Master',
          category: 'database',
          status: Math.random() > 0.2 ? 'degraded' : 'up',
          uptime: 98.2 + (Math.random() * 0.5),
          responseTime: Math.floor(Math.random() * 200 + 300),
          lastCheck: new Date(Date.now() - Math.random() * 120000).toISOString(),
          machine: 'DB-01',
          checkHistory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 30000).toISOString(),
            success: Math.random() > 0.1,
            responseTime: Math.floor(Math.random() * 200 + 250),
            error: Math.random() > 0.8 ? 'Query timeout' : undefined
          }))
        },
        {
          id: '3',
          name: 'CDN',
          category: 'network',
          status: 'up',
          uptime: 100,
          responseTime: Math.floor(Math.random() * 20 + 30),
          lastCheck: new Date(Date.now() - Math.random() * 30000).toISOString(),
          machine: 'CDN-Global',
          url: 'https://cdn.yorkhost.com',
          checkHistory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 30000).toISOString(),
            success: true,
            responseTime: Math.floor(Math.random() * 20 + 25)
          }))
        },
        {
          id: '4',
          name: 'Auth Service',
          category: 'api',
          status: 'up',
          uptime: 99.8 + (Math.random() * 0.2),
          responseTime: Math.floor(Math.random() * 30 + 70),
          lastCheck: new Date(Date.now() - Math.random() * 45000).toISOString(),
          machine: 'Server-01',
          url: 'https://auth.yorkhost.com',
          checkHistory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 30000).toISOString(),
            success: Math.random() > 0.02,
            responseTime: Math.floor(Math.random() * 40 + 60)
          }))
        },
        {
          id: '5',
          name: 'File Storage',
          category: 'storage',
          status: 'down',
          uptime: 95.1,
          responseTime: 0,
          lastCheck: new Date(Date.now() - Math.random() * 300000).toISOString(),
          machine: 'Storage-01',
          checkHistory: Array.from({ length: 20 }, (_, i) => ({
            timestamp: new Date(Date.now() - i * 30000).toISOString(),
            success: i > 5 ? false : Math.random() > 0.3,
            responseTime: i > 5 ? 0 : Math.floor(Math.random() * 500 + 200),
            error: i > 5 ? 'Service unavailable' : undefined
          }))
        }
      ]
      
      const mockMetrics: SystemMetric[] = [
        {
          name: 'Services en ligne',
          value: mockServices.filter(s => s.status === 'up').length,
          unit: '',
          status: 'good',
          trend: 'stable',
          change: 0
        },
        {
          name: 'Temps de réponse moyen',
          value: Math.round(mockServices.reduce((acc, s) => acc + s.responseTime, 0) / mockServices.length),
          unit: 'ms',
          status: 'good',
          trend: 'down',
          change: -5.2
        },
        {
          name: 'Uptime global',
          value: Math.round(mockServices.reduce((acc, s) => acc + s.uptime, 0) / mockServices.length * 100) / 100,
          unit: '%',
          status: 'good',
          trend: 'up',
          change: 0.1
        },
        {
          name: 'Incidents actifs',
          value: mockServices.filter(s => s.status === 'down').length,
          unit: '',
          status: mockServices.filter(s => s.status === 'down').length > 0 ? 'critical' : 'good',
          trend: 'stable',
          change: 0
        }
      ]
      
      setServices(mockServices)
      setMetrics(mockMetrics)
      setLastUpdate(new Date())
      
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'down': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle size={16} />
      case 'degraded': return <AlertTriangle size={16} />
      case 'down': return <XCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <Server size={16} />
      case 'database': return <Database size={16} />
      case 'network': return <Globe size={16} />
      case 'storage': return <Database size={16} />
      default: return <Activity size={16} />
    }
  }

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={14} />
      case 'down': return <TrendingDown size={14} />
      default: return <Activity size={14} />
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}min`
    }
    return `${seconds}s`
  }

  const filteredServices = services.filter(service => {
    if (selectedFilter === 'all') return true
    return service.status === selectedFilter
  })

  // Remove loading screen

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Monitoring en Temps Réel</h1>
              <p>Surveillance continue de vos services et infrastructure</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isLiveMode ? '#10b981' : '#6b7280',
                  animation: isLiveMode ? 'pulse 1.5s infinite' : 'none'
                }} />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {isLiveMode ? 'Live' : 'Pausé'}
                </span>
              </div>
              
              <button 
                className="btn btn-secondary"
                onClick={() => setIsLiveMode(!isLiveMode)}
              >
                {isLiveMode ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                {isLiveMode ? 'Pause' : 'Reprendre'}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={fetchMonitoringData}
                disabled={refreshing}
              >
                <RefreshCw 
                  size={16} 
                  style={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none' 
                  }} 
                />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        <div className="stats-grid">
          {metrics.map((metric, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: `${getMetricStatusColor(metric.status)}15` }}>
                <Activity size={24} style={{ color: getMetricStatusColor(metric.status) }} />
              </div>
              <div className="stat-value" style={{ color: getMetricStatusColor(metric.status) }}>
                {metric.value}{metric.unit}
              </div>
              <div className="stat-label">{metric.name}</div>
              {metric.trend !== 'stable' && (
                <div className={`stat-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                  {getTrendIcon(metric.trend)}
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Last Update */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: '#6b7280' }} />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">Tous les services</option>
              <option value="up">Services en ligne</option>
              <option value="degraded">Services dégradés</option>
              <option value="down">Services hors ligne</option>
            </select>
          </div>
        </div>

        {/* Services Monitoring */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredServices.map(service => (
            <div key={service.id} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative'
            }}
            >
              {/* Status indicator */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: getStatusColor(service.status)
              }} />
              
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${getStatusColor(service.status)}15`,
                    color: getStatusColor(service.status),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getCategoryIcon(service.category)}
                  </div>
                  
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                      {service.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                      {service.machine}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    background: `${getStatusColor(service.status)}15`,
                    color: getStatusColor(service.status),
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {getStatusIcon(service.status)}
                    {service.status.toUpperCase()}
                  </div>
                </div>
              </div>
              
              {/* Metrics */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 600,
                    color: getStatusColor(service.status)
                  }}>
                    {service.uptime.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Uptime
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 600,
                    color: service.responseTime > 500 ? '#ef4444' : 
                           service.responseTime > 200 ? '#f59e0b' : '#10b981'
                  }}>
                    {service.responseTime}ms
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Réponse
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {formatRelativeTime(service.lastCheck)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    Dernier check
                  </div>
                </div>
              </div>
              
              {/* Check History */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  Historique (dernières 20 vérifications)
                </h4>
                <div style={{ 
                  display: 'flex', 
                  gap: '2px', 
                  height: '20px',
                  alignItems: 'flex-end'
                }}>
                  {service.checkHistory.slice(0, 20).reverse().map((check, index) => (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        height: check.success ? `${Math.min(check.responseTime / 10, 20)}px` : '20px',
                        background: check.success ? '#10b981' : '#ef4444',
                        borderRadius: '1px',
                        opacity: 0.7 + (index * 0.015),
                        cursor: 'pointer'
                      }}
                      title={`${new Date(check.timestamp).toLocaleTimeString('fr-FR')} - ${
                        check.success ? `${check.responseTime}ms` : check.error || 'Failed'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', flex: 1 }}
                >
                  <Eye size={14} />
                  Détails
                </button>
                
                {service.url && (
                  <button 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <Globe size={14} />
                  </button>
                )}
                
                <button 
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                  onClick={() => {
                    // Trigger manual check
                    console.log('Manual check for', service.name)
                  }}
                >
                  <Zap size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredServices.length === 0 && (
          <div className="empty-state">
            <Activity size={48} />
            <h3>Aucun service à afficher</h3>
            <p>Changez vos filtres pour voir plus de services</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}