'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateMonitorModal from '@/components/admin/CreateMonitorModal'
import EditMonitorModal from '@/components/admin/EditMonitorModal'
import '../admin.css'
import { 
  Plus, 
  Search, 
  Activity, 
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Globe,
  Edit,
  Trash2,
  FolderPlus
} from 'lucide-react'

interface Monitor {
  id: string
  name: string
  type: string
  target: string
  port?: number
  status: 'up' | 'down'
  responseTime: number
  lastCheck: string
  uptime: number
  group: string
  isActive: boolean
  history: {
    timestamp: string
    success: boolean
    responseTime: number
    error?: string
  }[]
}

interface MonitorGroup {
  name: string
  monitors: Monitor[]
}

export default function AdminMonitorsPage() {
  const [groups, setGroups] = useState<MonitorGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  useEffect(() => {
    fetchMonitors()
  }, [])

  const fetchMonitors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/monitors')
      const result = await response.json()
      
      if (result.success) {
        setGroups(result.data.groups)
      } else {
        console.error('Monitors API error:', result.error)
        setGroups([])
      }
    } catch (error) {
      console.error('Failed to fetch monitors:', error)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const createGroup = () => {
    if (newGroupName.trim()) {
      setGroups([...groups, { name: newGroupName.trim(), monitors: [] }])
      setNewGroupName('')
      setShowCreateGroupModal(false)
    }
  }

  const moveMonitor = async (monitorId: string, fromGroup: string, toGroup: string) => {
    // Update UI optimistically
    setGroups(prev => {
      const newGroups = [...prev]
      const fromGroupIndex = newGroups.findIndex(g => g.name === fromGroup)
      const toGroupIndex = newGroups.findIndex(g => g.name === toGroup)
      
      if (fromGroupIndex !== -1 && toGroupIndex !== -1) {
        const monitor = newGroups[fromGroupIndex].monitors.find(m => m.id === monitorId)
        if (monitor) {
          newGroups[fromGroupIndex].monitors = newGroups[fromGroupIndex].monitors.filter(m => m.id !== monitorId)
          newGroups[toGroupIndex].monitors.push({ ...monitor, group: toGroup })
        }
      }
      
      return newGroups
    })

    // TODO: API call to update monitor group
  }

  const deleteMonitor = async (monitorId: string) => {
    try {
      const response = await fetch(`/api/admin/monitors/${monitorId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchMonitors() // Refresh list
      } else {
        console.error('Failed to delete monitor')
      }
    } catch (error) {
      console.error('Delete monitor error:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    return status === 'up' ? (
      <CheckCircle size={16} style={{ color: '#10b981' }} />
    ) : (
      <XCircle size={16} style={{ color: '#ef4444' }} />
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'HTTP':
      case 'HTTPS':
        return <Globe size={16} />
      case 'TCP':
        return <Wifi size={16} />
      case 'ICMP':
        return <Activity size={16} />
      default:
        return <Activity size={16} />
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

  const filteredGroups = groups.map(group => ({
    ...group,
    monitors: group.monitors.filter(monitor =>
      monitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitor.target.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.monitors.length > 0 || searchQuery === '')

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Monitoring</h1>
              <p>Surveillez vos services par IP, port et protocole</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <FolderPlus size={16} />
                Nouveau groupe
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                Nouveau monitoring
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-value">{groups.reduce((acc, g) => acc + g.monitors.length, 0)}</div>
            <div className="stat-label">Monitors totaux</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">
              {groups.reduce((acc, g) => acc + g.monitors.filter(m => m.status === 'up').length, 0)}
            </div>
            <div className="stat-label">En ligne</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-value">
              {groups.reduce((acc, g) => acc + g.monitors.filter(m => m.status === 'down').length, 0)}
            </div>
            <div className="stat-label">Hors ligne</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-value">
              {Math.round(groups.reduce((acc, g) => 
                acc + g.monitors.reduce((sum, m) => sum + m.responseTime, 0), 0) / 
                Math.max(groups.reduce((acc, g) => acc + g.monitors.length, 0), 1)
              )}ms
            </div>
            <div className="stat-label">Temps moyen</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Rechercher des monitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Monitor Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {filteredGroups.map(group => (
            <div key={group.name} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              {/* Group Header */}
              <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                    {group.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                    {group.monitors.length} monitor{group.monitors.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Monitors List */}
              <div style={{ padding: '2rem' }}>
                {group.monitors.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#6b7280' 
                  }}>
                    <Activity size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p>Aucun monitor dans ce groupe</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {group.monitors.map(monitor => (
                      <div key={monitor.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.5rem',
                        background: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getStatusIcon(monitor.status)}
                            {getTypeIcon(monitor.type)}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                              {monitor.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                              {monitor.type} • {monitor.target}
                              {monitor.port && `:${monitor.port}`}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                              {monitor.responseTime}ms
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {formatRelativeTime(monitor.lastCheck)}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 600,
                              color: monitor.uptime > 95 ? '#10b981' : monitor.uptime > 90 ? '#f59e0b' : '#ef4444'
                            }}>
                              {monitor.uptime}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Uptime
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="btn btn-danger"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                              onClick={() => deleteMonitor(monitor.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Monitor Modal */}
        <CreateMonitorModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMonitors}
        />

        {/* Create Group Modal */}
        {showCreateGroupModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Créer un nouveau groupe</h3>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nom du groupe..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}
              />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={createGroup}
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}