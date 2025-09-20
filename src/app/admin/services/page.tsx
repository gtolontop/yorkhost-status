'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateServiceModal from '@/components/admin/CreateServiceModal'
import CreateGroupModal from '@/components/admin/CreateGroupModal'
import EditServiceModal from '@/components/admin/EditServiceModal'
import '../admin.css'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit,
  Trash2,
  Play,
  Pause,
  Activity,
  Server,
  Globe,
  Database,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  FolderPlus,
  Users
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  url?: string
  status: 'operational' | 'degraded' | 'outage'
  uptime: number
  responseTime: number
  lastCheck: string
  isActive: boolean
  group: string
  machine: {
    id: string
    name: string
    category: string
  }
}

interface ServiceGroup {
  id: string
  name: string
  description?: string
  color: string
  services: Service[]
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [checking, setChecking] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
    fetchGroups()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services')
      const result = await response.json()
      
      if (result.success) {
        // Transform the API response to match our component interface
        const transformedServices = result.data.map((service: any) => {
          return {
            id: service.id,
            name: service.name,
            description: service.description,
            url: service.url,
            status: service.status || 'outage',
            uptime: service.uptime || 0,
            responseTime: service.responseTime || 0,
            lastCheck: service.lastCheck || new Date().toISOString(),
            isActive: service.isActive !== false,
            group: service.machine?.category || 'other',
            machine: {
              id: service.machine?.id || '',
              name: service.machine?.name || 'Unknown',
              category: service.machine?.category || 'other'
            }
          }
        })
        
        setServices(transformedServices)
      } else {
        console.error('Services API error:', result.error)
        setServices([])
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to calculate uptime from checks
  const calculateUptime = (checks: any[]) => {
    if (!checks || checks.length === 0) return 0
    
    // Get all results from all checks
    let allResults: any[] = []
    checks.forEach(check => {
      if (check.results && check.results.length > 0) {
        allResults = allResults.concat(check.results)
      } else if (check.success !== undefined) {
        // Direct check result
        allResults.push(check)
      }
    })
    
    if (allResults.length === 0) return 0
    
    const successfulChecks = allResults.filter(result => result.success === true).length
    return Math.round((successfulChecks / allResults.length) * 100 * 100) / 100
  }

  const fetchGroups = async () => {
    try {
      // Mock groups - replace with real API
      const mockGroups: ServiceGroup[] = [
        {
          id: 'web',
          name: 'Web Servers',
          description: 'Web servers and frontend services',
          color: '#3b82f6',
          services: []
        },
        {
          id: 'api',
          name: 'API Services',
          description: 'Backend APIs and business services',
          color: '#10b981',
          services: []
        },
        {
          id: 'database',
          name: 'Databases',
          description: 'Database services and data storage',
          color: '#f59e0b',
          services: []
        },
        {
          id: 'cache',
          name: 'Cache',
          description: 'Redis and caching services',
          color: '#06b6d4',
          services: []
        },
        {
          id: 'monitoring',
          name: 'Monitoring',
          description: 'Monitoring and metrics services',
          color: '#ef4444',
          services: []
        },
        {
          id: 'network',
          name: 'Network',
          description: 'Network and security services',
          color: '#84cc16',
          services: []
        },
        {
          id: 'storage',
          name: 'Storage',
          description: 'File storage and backup services',
          color: '#8b5cf6',
          services: []
        },
        {
          id: 'cdn',
          name: 'CDN',
          description: 'Content delivery networks',
          color: '#f97316',
          services: []
        },
        {
          id: 'backup',
          name: 'Backup',
          description: 'Backup and recovery services',
          color: '#64748b',
          services: []
        },
        {
          id: 'security',
          name: 'Security',
          description: 'Security and authentication services',
          color: '#dc2626',
          services: []
        },
        {
          id: 'other',
          name: 'Other',
          description: 'Miscellaneous services',
          color: '#6b7280',
          services: []
        }
      ]
      
      // Group services by their group property
      const groupedServices = mockGroups.map(group => ({
        ...group,
        services: services.filter(service => service.group === group.id)
      }))
      
      setGroups(groupedServices)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'degraded': return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
      case 'outage': return <XCircle size={16} style={{ color: '#ef4444' }} />
      default: return <Activity size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#10b981'
      case 'degraded': return '#f59e0b'
      case 'outage': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    try {
      if (!timestamp) return 'Never'
      
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const diff = Date.now() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (days > 0) {
        return `${days}d ago`
      } else if (hours > 0) {
        return `${hours}h ago`
      } else if (minutes > 0) {
        return `${minutes}m ago`
      }
      return `${Math.max(0, seconds)}s ago`
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Unknown'
    }
  }

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      // Update UI optimistically
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      ))

      const response = await fetch(`/api/admin/services/${serviceId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        // Revert on error
        setServices(prev => prev.map(service => 
          service.id === serviceId 
            ? { ...service, isActive: !service.isActive }
            : service
        ))
        console.error('Failed to toggle service status')
      }
    } catch (error) {
      // Revert on error
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      ))
      console.error('Failed to toggle service status:', error)
    }
  }

  const deleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setServices(prev => prev.filter(service => service.id !== serviceId))
        setShowDeleteConfirm(null)
      } else {
        const result = await response.json()
        console.error('Failed to delete service:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  const handleCheckAllServices = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/admin/services/check-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      if (result.success) {
        // Refresh services to show updated data
        await fetchServices()
        console.log('Bulk check completed:', result.data)
      } else {
        console.error('Failed to check services:', result.error)
      }
    } catch (error) {
      console.error('Error checking services:', error)
    } finally {
      setChecking(false)
    }
  }

  const testService = async (serviceId: string) => {
    try {
      // For now, use the service check endpoint
      const response = await fetch(`/api/admin/services/${serviceId}/check`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        const checkResult = result.data?.checkResult || result.data
        const status = checkResult?.success ? 'UP' : 'DOWN'
        const responseTime = checkResult?.responseTime || 'N/A'
        alert(`Test successful!\nResponse time: ${responseTime}ms\nStatus: ${status}`)
        // Refresh services to show updated status
        fetchServices()
      } else {
        alert(`Test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Test service error:', error)
      alert('Failed to test service')
    }
  }

  const changeServiceGroup = async (serviceId: string, newGroup: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group: newGroup })
      })

      if (response.ok) {
        // Update service group locally and refresh groups
        setServices(prev => prev.map(service => 
          service.id === serviceId ? { ...service, group: newGroup } : service
        ))
        fetchGroups()
      } else {
        console.error('Failed to change service group')
      }
    } catch (error) {
      console.error('Failed to change service group:', error)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const groupedFilteredServices = groups.map(group => ({
    ...group,
    services: filteredServices.filter(service => service.group === group.id)
  })).filter(group => group.services.length > 0)

  // Remove loading screen

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Service Management</h1>
              <p>Monitor and manage your services organized by groups</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={handleCheckAllServices}
                disabled={checking}
                style={{ opacity: checking ? 0.6 : 1 }}
              >
                <Activity size={16} />
                {checking ? 'Checking...' : 'Check All'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <FolderPlus size={16} />
                New group
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={16} />
                New service
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Server size={24} />
            </div>
            <div className="stat-value">{services.length}</div>
            <div className="stat-label">Total services</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.status === 'operational').length}</div>
            <div className="stat-label">Operational services</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.status !== 'operational').length}</div>
            <div className="stat-label">Services with issues</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.isActive).length}</div>
            <div className="stat-label">Active services</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }} />
            <input
              type="text"
              placeholder="Search services..."
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

        {/* Services by Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groupedFilteredServices.map(group => (
            <div key={group.id} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #e5e7eb',
                background: `${group.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: group.color
                  }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                      {group.name}
                    </h3>
                    {group.description && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        {group.description}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#6b7280',
                    background: '#f3f4f6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px'
                  }}>
                    {group.services.length} service{group.services.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div style={{ padding: '2rem' }}>
                {group.services.length === 0 ? (
                  <div className="empty-state">
                    <Server size={48} />
                    <h3>No services in this group</h3>
                    <p>Create your first service for this group</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      <Plus size={16} />
                      Add service
                    </button>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                    gap: '1.5rem' 
                  }}>
                    {group.services.map(service => (
                      <div key={service.id} style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        background: '#ffffff'
                      }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getStatusIcon(service.status)}
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                {service.name}
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                                {service.machine.name}
                              </p>
                            </div>
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <button style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '6px',
                              color: '#6b7280'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {service.description && (
                          <p style={{ 
                            margin: '0 0 1rem 0', 
                            fontSize: '0.875rem', 
                            color: '#6b7280',
                            lineHeight: 1.4
                          }}>
                            {service.description}
                          </p>
                        )}
                        
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: getStatusColor(service.status) }}>
                              {service.uptime}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Uptime
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                              {service.responseTime}ms
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Response
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {formatRelativeTime(service.lastCheck)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Last check
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            fontWeight: 500, 
                            marginBottom: '0.5rem',
                            color: '#6b7280'
                          }}>
                            Group
                          </label>
                          <select
                            value={service.group}
                            onChange={(e) => changeServiceGroup(service.id, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              background: 'white'
                            }}
                          >
                            {groups.map(group => (
                              <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => toggleServiceStatus(service.id)}
                          >
                            {service.isActive ? <Pause size={14} /> : <Play size={14} />}
                            {service.isActive ? 'Pause' : 'Activate'}
                          </button>
                          
                          <button 
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => {
                              setEditingService(service)
                              setShowEditModal(true)
                            }}
                          >
                            <Edit size={14} />
                            Edit
                          </button>

                          <button 
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => testService(service.id)}
                          >
                            <Activity size={14} />
                            Test Now
                          </button>
                          
                          {service.url && (
                            <button 
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                              onClick={() => window.open(service.url, '_blank')}
                            >
                              <ExternalLink size={14} />
                              Visit
                            </button>
                          )}
                          
                          <button 
                            className="btn btn-danger"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => setShowDeleteConfirm(service.id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Service Modal */}
        <CreateServiceModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchServices()
            fetchGroups()
          }}
        />

        {/* Create Group Modal */}
        <CreateGroupModal 
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            fetchGroups()
          }}
        />

        {/* Edit Service Modal */}
        {editingService && (
          <EditServiceModal 
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingService(null)
            }}
            onSuccess={() => {
              fetchServices()
              setShowEditModal(false)
              setEditingService(null)
            }}
            service={editingService}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
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
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: '#fee2e2', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Trash2 size={32} style={{ color: '#ef4444' }} />
              </div>
              
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 600 }}>
                Delete Service
              </h3>
              
              <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteService(showDeleteConfirm)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}