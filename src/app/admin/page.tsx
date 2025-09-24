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

  const servicesDownWithoutIncident = services.filter(s => s.status === 'outage').length

  return (
    <AdminLayout>
      <div className="">
        {/* Alert Banner for Services Down Without Incident */}
        {servicesDownWithoutIncident > 0 && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
            <div className="flex-1">
              <p className="m-0 font-semibold text-red-900 dark:text-red-200">
                Action requise: {servicesDownWithoutIncident} service{servicesDownWithoutIncident > 1 ? 's' : ''} en panne sans incident déclaré
              </p>
              <p className="m-0 text-sm text-red-800 dark:text-red-300 mt-1">
                Veuillez créer des incidents pour les services affectés afin d'informer les utilisateurs.
              </p>
            </div>
            <a 
              href="/admin/incidents"
              className="btn btn-primary text-sm px-4 py-2 whitespace-nowrap"
            >
              Créer un incident
            </a>
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1>Dashboard</h1>
              <p>Vue d'ensemble de vos services et infrastructure</p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={refreshing}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
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
              <div className="flex flex-col gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-yorkhost-dark rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: getStatusColor(service.status) }}
                      />
                      <div>
                        <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {service.name}
                        </h4>
                        <p className="m-0 text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {service.status === 'operational' ? 'Opérationnel' :
                           service.status === 'degraded' ? 'Dégradé' : 'Hors ligne'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {service.uptime}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Uptime
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {service.responseTime}ms
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Réponse
                        </div>
                      </div>

                      <ChevronRight className="text-gray-300 dark:text-gray-600" size={16} />
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
              <div className="flex flex-col gap-4">
                {activities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-yorkhost-dark rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${getStatusColor(activity.status)}15`,
                          color: getStatusColor(activity.status)
                        }}
                      >
                        <IconComponent size={16} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {activity.title}
                        </h4>
                        <p className="m-0 text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                          {activity.description}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-500">
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