'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import './admin.css'
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Monitor,
  Zap,
  Globe,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

interface DashboardStats {
  totalServices: number
  totalMachines: number
  activeIncidents: number
  averageUptime: number
  checksLast24h: number
  responseTimeP95: number
  mttr: number
  uptimeChange: number
  responseTimeChange: number
}

interface RecentActivity {
  id: string
  type: 'check' | 'incident' | 'service'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error'
}

interface ServiceStatus {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  responseTime: number
  lastCheck: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch real dashboard data
      const response = await fetch('/api/admin/dashboard')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data.stats)
        setActivities(result.data.activities || [])
        setServices(result.data.services || [])
      } else {
        console.error('Dashboard API error:', result.error)
        // Fallback to empty data
        setStats({
          totalServices: 0,
          totalMachines: 0,
          activeIncidents: 0,
          averageUptime: 0,
          checksLast24h: 0,
          responseTimeP95: 0,
          mttr: 0,
          uptimeChange: 0,
          responseTimeChange: 0
        })
        setActivities([])
        setServices([])
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Fallback to empty data
      setStats({
        totalServices: 0,
        totalMachines: 0,
        activeIncidents: 0,
        averageUptime: 0,
        checksLast24h: 0,
        responseTimeP95: 0,
        mttr: 0,
        uptimeChange: 0,
        responseTimeChange: 0
      })
      setActivities([])
      setServices([])
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'outage': return '#ef4444'
      case 'success': return '#10b981'
      case 'warning': return '#f59e0b'
      case 'error': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'incident': return AlertTriangle
      case 'check': return Activity
      case 'service': return Server
      default: return Activity
    }
  }

  // Remove loading screen, just show the page immediately

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Dashboard</h1>
              <p>Vue d'ensemble de vos services et infrastructure</p>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={fetchDashboardData}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Server size={24} />
            </div>
            <div className="stat-value">{stats?.totalServices || 0}</div>
            <div className="stat-label">Services surveillés</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              +3 ce mois
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Monitor size={24} />
            </div>
            <div className="stat-value">{stats?.totalMachines || 0}</div>
            <div className="stat-label">Machines actives</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              +1 cette semaine
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-value">{stats?.activeIncidents || 0}</div>
            <div className="stat-label">Incidents actifs</div>
            <div className="stat-change negative">
              -2 depuis hier
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{stats?.averageUptime?.toFixed(2) || 100}%</div>
            <div className="stat-label">Uptime moyen</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              +{stats?.uptimeChange?.toFixed(2) || 0}%
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Zap size={24} />
            </div>
            <div className="stat-value">{stats?.responseTimeP95 || 0}ms</div>
            <div className="stat-label">Temps de réponse P95</div>
            <div className="stat-change positive">
              <TrendingUp size={12} />
              {stats?.responseTimeChange || 0}%
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-value">{stats?.mttr || 0}min</div>
            <div className="stat-label">MTTR moyen</div>
            <div className="stat-change positive">
              -5min ce mois
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Main Panel - Service Status */}
          <div className="main-panel">
            <div className="panel-header">
              <h3>État des services</h3>
              <button className="btn btn-primary">
                <Server size={16} />
                Gérer les services
              </button>
            </div>
            <div className="panel-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {services.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: getStatusColor(service.status)
                        }}
                      />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                          {service.name}
                        </h4>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.8rem', 
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {service.status === 'operational' ? 'Opérationnel' :
                           service.status === 'degraded' ? 'Dégradé' : 'Hors ligne'}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {service.uptime}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Uptime
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {service.responseTime}ms
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Réponse
                        </div>
                      </div>
                      
                      <ChevronRight size={16} style={{ color: '#d1d5db' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel - Recent Activity */}
          <div className="side-panel">
            <div className="panel-header">
              <h3>Activité récente</h3>
            </div>
            <div className="panel-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '1rem',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${getStatusColor(activity.status)}15`,
                          color: getStatusColor(activity.status),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          marginBottom: '0.25rem'
                        }}>
                          {activity.title}
                        </h4>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.8rem', 
                          color: '#6b7280',
                          lineHeight: 1.4,
                          marginBottom: '0.5rem'
                        }}>
                          {activity.description}
                        </p>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#9ca3af' 
                        }}>
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}