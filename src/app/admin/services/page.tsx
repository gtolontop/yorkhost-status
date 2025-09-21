'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateServiceModal from '@/components/admin/CreateServiceModal'
import CreateGroupModal from '@/components/admin/CreateGroupModal'
import EditServiceModal from '@/components/admin/EditServiceModal'
import ServiceIncidentBadge from '@/components/admin/ServiceIncidentBadge'
import '../admin.css'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit,
  Trash2,
  Play,
  Pause,
  Activity,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FolderPlus,
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  url?: string
  status: 'operational' | 'degraded' | 'outage' | 'unknown'
  uptime: number
  responseTime: number
  lastCheck: string
  isActive: boolean
  groupId?: string
  order: number
}

interface ServiceGroup {
  id: string
  name: string
  description?: string
  color: string
  order: number
  services: Service[]
  isCollapsed?: boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [groups, setGroups] = useState<ServiceGroup[]>([])
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [checking, setChecking] = useState(false)
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
        const transformedServices = result.data.map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          url: service.url,
          status: service.status || 'unknown',
          uptime: service.uptime || 0,
          responseTime: service.responseTime || 0,
          lastCheck: service.lastCheck || new Date().toISOString(),
          isActive: service.isActive !== false,
          groupId: service.machineId || 'ungrouped',
          order: service.order || 0
        }))
        
        setServices(transformedServices)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      const result = await response.json()
      
      if (result.success) {
        const groupsWithServices = result.data.map((group: any) => ({
          ...group,
          services: [],  // Will be populated by useEffect
          isCollapsed: false
        }))
        setGroups(groupsWithServices)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }

  useEffect(() => {
    // Update groups when services change
    setGroups(prev => prev.map(group => ({
      ...group,
      services: services.filter(s => s.groupId === group.id).sort((a, b) => a.order - b.order)
    })))
  }, [services])

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Update local state optimistically
    const serviceId = draggableId
    const newGroupId = destination.droppableId
    
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        return { ...service, groupId: newGroupId, order: destination.index }
      }
      return service
    }))

    // Update server
    try {
      await fetch(`/api/admin/services/${serviceId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: newGroupId,
          order: destination.index
        })
      })
    } catch (error) {
      console.error('Failed to move service:', error)
      // Revert on error
      fetchServices()
    }
  }

  const toggleGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isCollapsed: !group.isCollapsed } : group
    ))
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
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (days > 0) return `${days}d ago`
      if (hours > 0) return `${hours}h ago`
      if (minutes > 0) return `${minutes}m ago`
      return `${Math.max(0, Math.floor(diff / 1000))}s ago`
    } catch (error) {
      return 'Unknown'
    }
  }

  const toggleServiceStatus = async (serviceId: string) => {
    try {
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
        setServices(prev => prev.map(service => 
          service.id === serviceId 
            ? { ...service, isActive: !service.isActive }
            : service
        ))
      }
    } catch (error) {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive }
          : service
      ))
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
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
    }
  }

  const testService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/check`, {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        const checkResult = result.data?.checkResult || result.data
        const status = checkResult?.success ? 'UP' : 'DOWN'
        const responseTime = checkResult?.responseTime || 'N/A'
        alert(`Test result: ${status}\nResponse time: ${responseTime}ms`)
        fetchServices()
      } else {
        alert(`Test failed: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to test service')
    }
  }

  const filteredGroups = groups.map(group => ({
    ...group,
    services: group.services.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.id === 'ungrouped' || group.services.length > 0 || searchQuery === '')

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1>Service Management</h1>
              <p>Manage and organize your services with drag & drop</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
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

        {/* Search */}
        <div style={{ 
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ position: 'relative' }}>
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredGroups.map(group => (
              <div key={group.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid #e5e7eb',
                  background: `${group.color}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }} onClick={() => toggleGroup(group.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {group.isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: group.color
                    }} />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                      {group.name}
                    </h3>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280',
                      background: 'white',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px'
                    }}>
                      {group.services.length}
                    </span>
                  </div>
                </div>
                
                {!group.isCollapsed && (
                  <Droppable droppableId={group.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          padding: '0.5rem',
                          minHeight: '60px',
                          background: snapshot.isDraggingOver ? '#f3f4f6' : 'transparent'
                        }}
                      >
                        {group.services.length === 0 ? (
                          <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem'
                          }}>
                            Drop services here
                          </div>
                        ) : (
                          group.services.map((service, index) => (
                            <Draggable key={service.id} draggableId={service.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    marginBottom: '0.5rem',
                                    opacity: snapshot.isDragging ? 0.5 : 1
                                  }}
                                >
                                  <div style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    padding: '1rem 1.5rem',
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                  }}>
                                    <div {...provided.dragHandleProps} style={{ cursor: 'grab' }}>
                                      <GripVertical size={20} color="#9ca3af" />
                                    </div>
                                    
                                    {getStatusIcon(service.status)}
                                    
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                                          {service.name}
                                        </h4>
                                        {service.description && (
                                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                            - {service.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: '#6b7280', fontSize: '0.75rem' }}>
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, color: getStatusColor(service.status) }}>
                                          {service.uptime}%
                                        </div>
                                        <div>Uptime</div>
                                      </div>
                                      
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, color: '#374151' }}>
                                          {service.responseTime}ms
                                        </div>
                                        <div>Response</div>
                                      </div>
                                      
                                      <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, color: '#374151' }}>
                                          {formatRelativeTime(service.lastCheck)}
                                        </div>
                                        <div>Last check</div>
                                      </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => toggleServiceStatus(service.id)}
                                        title={service.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                                      >
                                        {service.isActive ? <Pause size={16} /> : <Play size={16} />}
                                      </button>
                                      
                                      <button 
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => testService(service.id)}
                                        title="Test now"
                                      >
                                        <Activity size={16} />
                                      </button>
                                      
                                      <button 
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => {
                                          setEditingService(service)
                                          setShowEditModal(true)
                                        }}
                                        title="Edit service"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      
                                      <button 
                                        className="btn btn-danger"
                                        style={{ padding: '0.5rem' }}
                                        onClick={() => setShowDeleteConfirm(service.id)}
                                        title="Delete service"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Modals */}
        <CreateServiceModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchServices()
            fetchGroups()
          }}
        />

        <CreateGroupModal 
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={() => {
            fetchGroups()
          }}
        />

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