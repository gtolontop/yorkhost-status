'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
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
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
    fetchGroups()
  }, [])

  const fetchServices = async () => {
    try {
      // Mock data - replace with real API
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'API Gateway',
          description: 'Point d\'entrée principal pour toutes les API',
          url: 'https://api.yorkhost.com',
          status: 'operational',
          uptime: 99.95,
          responseTime: 125,
          lastCheck: new Date(Date.now() - 30000).toISOString(),
          isActive: true,
          group: 'backend',
          machine: { id: '1', name: 'Server-01', category: 'web' }
        },
        {
          id: '2',
          name: 'Database Master',
          description: 'Base de données principale PostgreSQL',
          url: '',
          status: 'degraded',
          uptime: 98.2,
          responseTime: 450,
          lastCheck: new Date(Date.now() - 60000).toISOString(),
          isActive: true,
          group: 'database',
          machine: { id: '2', name: 'DB-01', category: 'database' }
        },
        {
          id: '3',
          name: 'CDN',
          description: 'Réseau de distribution de contenu',
          url: 'https://cdn.yorkhost.com',
          status: 'operational',
          uptime: 100,
          responseTime: 45,
          lastCheck: new Date(Date.now() - 15000).toISOString(),
          isActive: true,
          group: 'frontend',
          machine: { id: '3', name: 'CDN-Global', category: 'network' }
        },
        {
          id: '4',
          name: 'Auth Service',
          description: 'Service d\'authentification et autorisation',
          url: 'https://auth.yorkhost.com',
          status: 'operational',
          uptime: 99.8,
          responseTime: 85,
          lastCheck: new Date(Date.now() - 45000).toISOString(),
          isActive: true,
          group: 'backend',
          machine: { id: '4', name: 'Auth-01', category: 'web' }
        },
        {
          id: '5',
          name: 'File Storage',
          description: 'Stockage de fichiers S3 compatible',
          url: '',
          status: 'outage',
          uptime: 95.1,
          responseTime: 0,
          lastCheck: new Date(Date.now() - 120000).toISOString(),
          isActive: false,
          group: 'storage',
          machine: { id: '5', name: 'Storage-01', category: 'storage' }
        }
      ]
      
      setServices(mockServices)
    } catch (error) {
      console.error('Failed to fetch services:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      // Mock groups - replace with real API
      const mockGroups: ServiceGroup[] = [
        {
          id: 'frontend',
          name: 'Frontend',
          description: 'Services côté client et CDN',
          color: '#3b82f6',
          services: []
        },
        {
          id: 'backend',
          name: 'Backend',
          description: 'APIs et services métier',
          color: '#10b981',
          services: []
        },
        {
          id: 'database',
          name: 'Base de données',
          description: 'Services de données',
          color: '#f59e0b',
          services: []
        },
        {
          id: 'storage',
          name: 'Stockage',
          description: 'Services de fichiers et stockage',
          color: '#8b5cf6',
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
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `Il y a ${minutes}min`
    }
    return `Il y a ${seconds}s`
  }

  const toggleServiceStatus = async (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, isActive: !service.isActive }
        : service
    ))
  }

  const deleteService = async (serviceId: string) => {
    setServices(prev => prev.filter(service => service.id !== serviceId))
    setShowDeleteConfirm(null)
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || service.group === selectedGroup
    return matchesSearch && matchesGroup
  })

  const groupedFilteredServices = groups.map(group => ({
    ...group,
    services: filteredServices.filter(service => service.group === group.id)
  })).filter(group => group.services.length > 0 || selectedGroup === group.id)

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Chargement des services...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Gestion des Services</h1>
              <p>Surveillez et gérez vos services organisés par groupes</p>
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
                Nouveau service
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
            <div className="stat-label">Services totaux</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.status === 'operational').length}</div>
            <div className="stat-label">Services opérationnels</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.status !== 'operational').length}</div>
            <div className="stat-label">Services en problème</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={24} />
            </div>
            <div className="stat-value">{services.filter(s => s.isActive).length}</div>
            <div className="stat-label">Services actifs</div>
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
              placeholder="Rechercher des services..."
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
          
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            <option value="all">Tous les groupes</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
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
                    <h3>Aucun service dans ce groupe</h3>
                    <p>Créez votre premier service pour ce groupe</p>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      <Plus size={16} />
                      Ajouter un service
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
                        background: '#fafafa',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
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
                              Réponse
                            </div>
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                              {formatRelativeTime(service.lastCheck)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              Dernier check
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => toggleServiceStatus(service.id)}
                          >
                            {service.isActive ? <Pause size={14} /> : <Play size={14} />}
                            {service.isActive ? 'Pause' : 'Activer'}
                          </button>
                          
                          <button 
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                          >
                            <Edit size={14} />
                            Modifier
                          </button>
                          
                          {service.url && (
                            <button 
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                              onClick={() => window.open(service.url, '_blank')}
                            >
                              <ExternalLink size={14} />
                              Visiter
                            </button>
                          )}
                          
                          <button 
                            className="btn btn-danger"
                            style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                            onClick={() => setShowDeleteConfirm(service.id)}
                          >
                            <Trash2 size={14} />
                            Supprimer
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
                Supprimer le service
              </h3>
              
              <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
                Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Annuler
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteService(showDeleteConfirm)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}