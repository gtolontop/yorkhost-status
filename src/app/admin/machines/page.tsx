'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Plus, 
  Search, 
  Monitor, 
  Edit,
  Trash2,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  Globe,
  HardDrive,
  Cpu,
  MemoryStick,
  MapPin,
  Tag,
  Users,
  Eye
} from 'lucide-react'

interface Machine {
  id: string
  name: string
  description?: string
  category: 'web' | 'database' | 'api' | 'storage' | 'network' | 'monitoring' | 'other'
  location?: string
  tags: string[]
  status: 'online' | 'offline' | 'maintenance'
  specs: {
    cpu: string
    memory: string
    storage: string
    network: string
  }
  services: {
    id: string
    name: string
    status: 'operational' | 'degraded' | 'outage'
  }[]
  metrics: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    uptime: number
  }
  lastUpdate: string
}

export default function AdminMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      // Mock data - replace with real API
      const mockMachines: Machine[] = [
        {
          id: '1',
          name: 'Server-01',
          description: 'Serveur web principal pour les APIs',
          category: 'web',
          location: 'Paris, France - OVH DC1',
          tags: ['production', 'api', 'critical'],
          status: 'online',
          specs: {
            cpu: '8 vCPU Intel Xeon',
            memory: '32 GB DDR4',
            storage: '500 GB NVMe SSD',
            network: '1 Gbps'
          },
          services: [
            { id: '1', name: 'API Gateway', status: 'operational' },
            { id: '4', name: 'Auth Service', status: 'operational' }
          ],
          metrics: {
            cpuUsage: 45,
            memoryUsage: 68,
            diskUsage: 32,
            uptime: 99.95
          },
          lastUpdate: new Date(Date.now() - 2 * 60000).toISOString()
        },
        {
          id: '2',
          name: 'DB-01',
          description: 'Base de données PostgreSQL principale',
          category: 'database',
          location: 'Amsterdam, Netherlands - DigitalOcean',
          tags: ['production', 'database', 'critical'],
          status: 'online',
          specs: {
            cpu: '16 vCPU Intel Xeon',
            memory: '64 GB DDR4',
            storage: '2 TB NVMe SSD',
            network: '1 Gbps'
          },
          services: [
            { id: '2', name: 'Database Master', status: 'degraded' }
          ],
          metrics: {
            cpuUsage: 78,
            memoryUsage: 85,
            diskUsage: 65,
            uptime: 98.2
          },
          lastUpdate: new Date(Date.now() - 1 * 60000).toISOString()
        },
        {
          id: '3',
          name: 'CDN-Global',
          description: 'Réseau de distribution de contenu mondial',
          category: 'network',
          location: 'Multi-région - Cloudflare',
          tags: ['cdn', 'global', 'cache'],
          status: 'online',
          specs: {
            cpu: 'Edge Computing',
            memory: 'Distributed',
            storage: '10 TB Cache',
            network: '100 Gbps'
          },
          services: [
            { id: '3', name: 'CDN', status: 'operational' }
          ],
          metrics: {
            cpuUsage: 25,
            memoryUsage: 42,
            diskUsage: 78,
            uptime: 100
          },
          lastUpdate: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: '4',
          name: 'Storage-01',
          description: 'Serveur de stockage de fichiers',
          category: 'storage',
          location: 'Frankfurt, Germany - Hetzner',
          tags: ['storage', 'files', 's3'],
          status: 'maintenance',
          specs: {
            cpu: '4 vCPU AMD EPYC',
            memory: '16 GB DDR4',
            storage: '10 TB HDD RAID',
            network: '10 Gbps'
          },
          services: [
            { id: '5', name: 'File Storage', status: 'outage' }
          ],
          metrics: {
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 89,
            uptime: 95.1
          },
          lastUpdate: new Date(Date.now() - 30 * 60000).toISOString()
        },
        {
          id: '5',
          name: 'Monitor-01',
          description: 'Serveur de monitoring et métriques',
          category: 'monitoring',
          location: 'Londres, UK - AWS EC2',
          tags: ['monitoring', 'metrics', 'grafana'],
          status: 'online',
          specs: {
            cpu: '4 vCPU Intel Xeon',
            memory: '8 GB DDR4',
            storage: '100 GB GP3 SSD',
            network: '5 Gbps'
          },
          services: [],
          metrics: {
            cpuUsage: 35,
            memoryUsage: 55,
            diskUsage: 48,
            uptime: 99.8
          },
          lastUpdate: new Date(Date.now() - 45000).toISOString()
        }
      ]
      
      setMachines(mockMachines)
    } catch (error) {
      console.error('Failed to fetch machines:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web': return <Globe size={20} />
      case 'database': return <Database size={20} />
      case 'api': return <Server size={20} />
      case 'storage': return <HardDrive size={20} />
      case 'network': return <Globe size={20} />
      case 'monitoring': return <Activity size={20} />
      default: return <Monitor size={20} />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'web': return '#3b82f6'
      case 'database': return '#f59e0b'
      case 'api': return '#10b981'
      case 'storage': return '#8b5cf6'
      case 'network': return '#06b6d4'
      case 'monitoring': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981'
      case 'offline': return '#ef4444'
      case 'maintenance': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle size={16} />
      case 'offline': return <AlertTriangle size={16} />
      case 'maintenance': return <Settings size={16} />
      default: return <Activity size={16} />
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return '#ef4444'
    if (usage >= 75) return '#f59e0b'
    if (usage >= 50) return '#3b82f6'
    return '#10b981'
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

  const deleteMachine = async (machineId: string) => {
    setMachines(prev => prev.filter(machine => machine.id !== machineId))
    setShowDeleteConfirm(null)
  }

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         machine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         machine.location?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || machine.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || machine.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const onlineMachines = machines.filter(m => m.status === 'online').length
  const offlineMachines = machines.filter(m => m.status === 'offline').length
  const maintenanceMachines = machines.filter(m => m.status === 'maintenance').length

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
            <p>Chargement des machines...</p>
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
              <h1>Gestion des Machines</h1>
              <p>Surveillez et gérez votre infrastructure serveur</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Nouvelle machine
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Monitor size={24} />
            </div>
            <div className="stat-value">{machines.length}</div>
            <div className="stat-label">Machines totales</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{onlineMachines}</div>
            <div className="stat-label">En ligne</div>
            <div className="stat-change positive">
              {Math.round((onlineMachines / machines.length) * 100)}% disponibilité
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Settings size={24} />
            </div>
            <div className="stat-value">{maintenanceMachines}</div>
            <div className="stat-label">En maintenance</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-value">{offlineMachines}</div>
            <div className="stat-label">Hors ligne</div>
            <div className="stat-change negative">
              Attention requise
            </div>
          </div>
        </div>

        {/* Filters */}
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
              placeholder="Rechercher des machines..."
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            <option value="all">Toutes les catégories</option>
            <option value="web">Web</option>
            <option value="database">Base de données</option>
            <option value="api">API</option>
            <option value="storage">Stockage</option>
            <option value="network">Réseau</option>
            <option value="monitoring">Monitoring</option>
            <option value="other">Autre</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="online">En ligne</option>
            <option value="offline">Hors ligne</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Machines Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem' 
        }}>
          {filteredMachines.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Monitor size={48} />
              <h3>Aucune machine trouvée</h3>
              <p>Aucune machine ne correspond à vos critères de recherche</p>
            </div>
          ) : (
            filteredMachines.map(machine => (
              <div key={machine.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
              >
                {/* Header */}
                <div style={{
                  padding: '1.5rem',
                  background: `${getCategoryColor(machine.category)}10`,
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: getCategoryColor(machine.category),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getCategoryIcon(machine.category)}
                      </div>
                      
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                          {machine.name}
                        </h3>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          color: '#6b7280',
                          textTransform: 'capitalize'
                        }}>
                          {machine.category}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: `${getStatusColor(machine.status)}15`,
                        color: getStatusColor(machine.status),
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getStatusIcon(machine.status)}
                        {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                      </div>
                    </div>
                  </div>
                  
                  {machine.description && (
                    <p style={{ 
                      margin: '1rem 0 0 0', 
                      fontSize: '0.875rem', 
                      color: '#6b7280',
                      lineHeight: 1.4
                    }}>
                      {machine.description}
                    </p>
                  )}
                </div>
                
                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                  {/* Location */}
                  {machine.location && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <MapPin size={14} />
                      {machine.location}
                    </div>
                  )}
                  
                  {/* Specs */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Spécifications
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Cpu size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{machine.specs.cpu}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MemoryStick size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{machine.specs.memory}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HardDrive size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{machine.specs.storage}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{machine.specs.network}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Metrics */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      fontSize: '0.875rem', 
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      Métriques
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {[
                        { label: 'CPU', value: machine.metrics.cpuUsage, unit: '%' },
                        { label: 'RAM', value: machine.metrics.memoryUsage, unit: '%' },
                        { label: 'Disque', value: machine.metrics.diskUsage, unit: '%' },
                        { label: 'Uptime', value: machine.metrics.uptime, unit: '%' }
                      ].map((metric, index) => (
                        <div key={index} style={{
                          padding: '0.75rem',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#6b7280', 
                            marginBottom: '0.25rem' 
                          }}>
                            {metric.label}
                          </div>
                          <div style={{ 
                            fontSize: '1rem', 
                            fontWeight: 600,
                            color: getUsageColor(metric.value)
                          }}>
                            {metric.value}{metric.unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Services */}
                  {machine.services.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ 
                        margin: '0 0 0.75rem 0', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        color: '#374151'
                      }}>
                        Services ({machine.services.length})
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {machine.services.map(service => (
                          <div key={service.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            fontSize: '0.75rem'
                          }}>
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: service.status === 'operational' ? '#10b981' :
                                         service.status === 'degraded' ? '#f59e0b' : '#ef4444'
                            }} />
                            {service.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {machine.tags.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {machine.tags.map((tag, index) => (
                          <span key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Last Update */}
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#9ca3af',
                    marginBottom: '1rem'
                  }}>
                    Dernière mise à jour: {formatRelativeTime(machine.lastUpdate)}
                  </div>
                  
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    >
                      <Eye size={14} />
                      Détails
                    </button>
                    <button 
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    >
                      <Edit size={14} />
                      Modifier
                    </button>
                    <button 
                      className="btn btn-danger"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                      onClick={() => setShowDeleteConfirm(machine.id)}
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
                Supprimer la machine
              </h3>
              
              <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
                Êtes-vous sûr de vouloir supprimer cette machine ? Cette action est irréversible.
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
                  onClick={() => deleteMachine(showDeleteConfirm)}
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