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
    // Fetch groups first, then services
    const loadData = async () => {
      await fetchGroups()
      await fetchServices()
    }
    loadData()
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
      case 'operational': return <CheckCircle size={16} className="text-green-500" />
      case 'degraded': return <AlertTriangle size={16} className="text-amber-500" />
      case 'outage': return <XCircle size={16} className="text-red-500" />
      default: return <Activity size={16} className="text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-500'
      case 'degraded': return 'text-amber-500'
      case 'outage': return 'text-red-500'
      default: return 'text-gray-500'
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

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? All services in this group will be moved to ungrouped.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Move all services from this group to ungrouped
        setServices(prev => prev.map(service => 
          service.groupId === groupId ? { ...service, groupId: 'ungrouped' } : service
        ))
        
        // Remove the group from the list
        setGroups(prev => prev.filter(g => g.id !== groupId))
      } else {
        alert('Failed to delete group')
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      alert('Failed to delete group')
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
          <div className="flex items-center justify-between">
            <div>
              <h1>Service Management</h1>
              <p>Manage and organize your services with drag & drop</p>
            </div>
            <div className="flex gap-4">
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-12 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Services by Groups */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-4">
            {filteredGroups.map(group => (
              <div key={group.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                <div 
                  className="p-4 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer"
                  style={{ backgroundColor: `${group.color}10` }}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-3">
                    {group.isCollapsed ? <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" /> : <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />}
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                    <h3 className="m-0 text-base font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-xl">
                      {group.services.length}
                    </span>
                  </div>
                  {group.id !== 'ungrouped' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="py-1 px-2 bg-transparent border border-red-500 dark:border-red-400 rounded-lg text-red-500 dark:text-red-400 text-xs cursor-pointer flex items-center gap-1 transition-all hover:bg-red-500 hover:text-white dark:hover:bg-red-400"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
                
                {!group.isCollapsed && (
                  <Droppable droppableId={group.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 min-h-[60px] ${snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-700' : 'bg-transparent'}`}
                      >
                        {group.services.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            Drop services here
                          </div>
                        ) : (
                          group.services.map((service, index) => (
                            <Draggable key={service.id} draggableId={service.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : 'opacity-100'}`}
                                  style={provided.draggableProps.style}
                                >
                                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 px-6 bg-white dark:bg-gray-800 flex items-center gap-4">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical size={20} className="text-gray-400 dark:text-gray-500" />
                                    </div>
                                    
                                    {getStatusIcon(service.status)}
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">
                                          {service.name}
                                        </h4>
                                        {service.description && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            - {service.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8 text-gray-500 dark:text-gray-400 text-xs">
                                      <div className="text-center">
                                        <div className={`font-semibold ${getStatusColor(service.status)}`}>
                                          {service.uptime}%
                                        </div>
                                        <div>Uptime</div>
                                      </div>
                                      
                                      <div className="text-center">
                                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                                          {service.responseTime}ms
                                        </div>
                                        <div>Response</div>
                                      </div>
                                      
                                      <div className="text-center">
                                        <div className="font-semibold text-gray-700 dark:text-gray-300">
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
          onSuccess={async () => {
            await fetchGroups()
            await fetchServices()
          }}
        />

        <CreateGroupModal 
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSuccess={async () => {
            await fetchGroups()
            await fetchServices()
          }}
        />

        {editingService && (
          <EditServiceModal 
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingService(null)
            }}
            onSuccess={async () => {
              await fetchGroups()
              await fetchServices()
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