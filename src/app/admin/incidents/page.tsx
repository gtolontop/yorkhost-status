'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateIncidentModal from '@/components/admin/CreateIncidentModal'
import EditIncidentModal from '@/components/admin/EditIncidentModal'
import '../admin.css'
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Calendar,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  Activity,
  XCircle,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react'

interface Incident {
  id: string
  title: string
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED' | 'SCHEDULED'
  isScheduled: boolean
  startTime: string
  endTime?: string
  eta?: string
  serviceId?: string
  machineId?: string
  tags: string[]
  creator: {
    id: string
    username: string
    avatar?: string
  }
  service?: {
    id: string
    name: string
  }
  machine?: {
    id: string
    name: string
  }
  updates: {
    id: string
    title?: string
    message: string
    timestamp: string
  }[]
}

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/admin/incidents')
      const result = await response.json()
      
      if (result.success) {
        // Transform the API response to match our component interface
        const transformedIncidents = result.data.map((incident: any) => ({
          id: incident.id,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          isScheduled: incident.isScheduled,
          startTime: incident.startTime,
          endTime: incident.endTime,
          eta: incident.eta,
          serviceId: incident.serviceId,
          machineId: incident.machineId,
          tags: incident.tags || [],
          creator: {
            id: incident.creator?.id || 'unknown',
            username: incident.creator?.username || 'Système',
            avatar: incident.creator?.avatar
          },
          service: incident.service ? {
            id: incident.service.id,
            name: incident.service.name
          } : undefined,
          machine: incident.machine ? {
            id: incident.machine.id,
            name: incident.machine.name
          } : undefined,
          updates: incident.updates?.map((update: any) => ({
            id: update.id,
            title: update.title,
            message: update.message,
            timestamp: update.timestamp
          })) || []
        }))
        
        setIncidents(transformedIncidents)
      } else {
        console.error('Incidents API error:', result.error)
        setIncidents([])
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error)
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return '#10b981'
      case 'MEDIUM': return '#f59e0b'
      case 'HIGH': return '#ef4444'
      case 'CRITICAL': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'LOW': return <Info size={16} />
      case 'MEDIUM': return <AlertCircle size={16} />
      case 'HIGH': return <AlertTriangle size={16} />
      case 'CRITICAL': return <Zap size={16} />
      default: return <Activity size={16} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INVESTIGATING': return <AlertTriangle size={16} />
      case 'IDENTIFIED': return <AlertCircle size={16} />
      case 'MONITORING': return <Activity size={16} />
      case 'RESOLVED': return <CheckCircle size={16} />
      case 'SCHEDULED': return <Calendar size={16} />
      default: return <XCircle size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INVESTIGATING': return '#ef4444'
      case 'IDENTIFIED': return '#f59e0b'
      case 'MONITORING': return '#3b82f6'
      case 'RESOLVED': return '#10b981'
      case 'SCHEDULED': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    
    if (hours > 0) {
      return `Il y a ${hours}h ${minutes}min`
    }
    if (minutes > 0) {
      return `Il y a ${minutes}min`
    }
    return 'À l\'instant'
  }

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = endTime - startTime
    
    const hours = Math.floor(duration / 3600000)
    const minutes = Math.floor((duration % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  const deleteIncident = async (incidentId: string) => {
    try {
      const response = await fetch(`/api/admin/incidents/${incidentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIncidents(prev => prev.filter(incident => incident.id !== incidentId))
        setShowDeleteConfirm(null)
      } else {
        const result = await response.json()
        console.error('Failed to delete incident:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete incident:', error)
    }
  }

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || incident.status === selectedStatus
    const matchesSeverity = selectedSeverity === 'all' || incident.severity === selectedSeverity
    
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const activeIncidents = incidents.filter(i => ['INVESTIGATING', 'IDENTIFIED', 'MONITORING'].includes(i.status))
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED')
  const scheduledIncidents = incidents.filter(i => i.status === 'SCHEDULED')

  // Remove loading screen

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Gestion des Incidents</h1>
              <p>Suivez et gérez tous vos incidents et maintenances</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={16} />
              Nouvel incident
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-value">{activeIncidents.length}</div>
            <div className="stat-label">Incidents actifs</div>
            <div className="stat-change negative">
              {activeIncidents.filter(i => i.severity === 'CRITICAL').length} critique(s)
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-value">{resolvedIncidents.length}</div>
            <div className="stat-label">Incidents résolus</div>
            <div className="stat-change positive">
              Cette semaine
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Calendar size={24} />
            </div>
            <div className="stat-value">{scheduledIncidents.length}</div>
            <div className="stat-label">Maintenances prévues</div>
            <div className="stat-change">
              Prochaines 7 jours
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-value">18min</div>
            <div className="stat-label">MTTR moyen</div>
            <div className="stat-change positive">
              -5min ce mois
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
              placeholder="Rechercher des incidents..."
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
            <option value="INVESTIGATING">En investigation</option>
            <option value="IDENTIFIED">Identifié</option>
            <option value="MONITORING">En surveillance</option>
            <option value="RESOLVED">Résolu</option>
            <option value="SCHEDULED">Programmé</option>
          </select>
          
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '10px',
              fontSize: '0.875rem',
              minWidth: '150px'
            }}
          >
            <option value="all">Toutes les gravités</option>
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Élevée</option>
            <option value="CRITICAL">Critique</option>
          </select>
        </div>

        {/* Incidents List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredIncidents.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <h3>Aucun incident trouvé</h3>
              <p>Aucun incident ne correspond à vos critères de recherche</p>
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div key={incident.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '2rem'
              }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                  {/* Severity Badge */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${getSeverityColor(incident.severity)}15`,
                    color: getSeverityColor(incident.severity),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getSeverityIcon(incident.severity)}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                            {incident.title}
                          </h3>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              background: `${getStatusColor(incident.status)}15`,
                              color: getStatusColor(incident.status),
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              {getStatusIcon(incident.status)}
                              {incident.status.charAt(0) + incident.status.slice(1).toLowerCase()}
                            </div>
                            
                            <div style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '20px',
                              background: `${getSeverityColor(incident.severity)}15`,
                              color: getSeverityColor(incident.severity),
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}>
                              {incident.severity}
                            </div>
                          </div>
                        </div>
                        
                        <p style={{ 
                          margin: '0 0 1rem 0', 
                          color: '#6b7280', 
                          lineHeight: 1.5,
                          fontSize: '0.875rem'
                        }}>
                          {incident.description}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} />
                          Voir
                        </button>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setEditingIncident(incident)
                            setShowEditModal(true)
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                          onClick={() => setShowDeleteConfirm(incident.id)}
                        >
                          <Trash2 size={14} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                    
                    {/* Meta Information */}
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '1.5rem', 
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} />
                        {incident.creator.username}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} />
                        {incident.isScheduled ? 
                          `Programmé pour ${new Date(incident.startTime).toLocaleDateString('fr-FR')}` :
                          `Début ${formatRelativeTime(incident.startTime)}`
                        }
                      </div>
                      
                      {incident.endTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle size={14} />
                          Durée: {formatDuration(incident.startTime, incident.endTime)}
                        </div>
                      )}
                      
                      {incident.service && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={14} />
                          Service: {incident.service.name}
                        </div>
                      )}
                      
                      {incident.machine && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={14} />
                          Machine: {incident.machine.name}
                        </div>
                      )}
                    </div>
                    
                    {/* Tags */}
                    {incident.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {incident.tags.map((tag, index) => (
                          <span key={index} style={{
                            padding: '0.25rem 0.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Latest Update */}
                    {incident.updates.length > 0 && (
                      <div style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <MessageSquare size={14} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            Dernière mise à jour
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {formatRelativeTime(incident.updates[0].timestamp)}
                          </span>
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          color: '#374151',
                          lineHeight: 1.4
                        }}>
                          {incident.updates[0].message}
                        </p>
                      </div>
                    )}
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
                Supprimer l'incident
              </h3>
              
              <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
                Êtes-vous sûr de vouloir supprimer cet incident ? Cette action est irréversible.
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
                  onClick={() => deleteIncident(showDeleteConfirm)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Incident Modal */}
        <CreateIncidentModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchIncidents()
            setShowCreateModal(false)
          }}
        />

        {/* Edit Incident Modal */}
        {editingIncident && (
          <EditIncidentModal 
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingIncident(null)
            }}
            onSuccess={() => {
              fetchIncidents()
              setShowEditModal(false)
              setEditingIncident(null)
            }}
            incident={editingIncident}
          />
        )}
      </div>
    </AdminLayout>
  )
}