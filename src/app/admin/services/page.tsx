'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import AdminLayout from '@/components/admin/AdminLayout'
import CreateServiceModal from '@/components/admin/CreateServiceModal'
import CreateGroupModal from '@/components/admin/CreateGroupModal'
import EditGroupModal from '@/components/admin/EditGroupModal'
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
  type?: string
  target?: string
  port?: number | null
  timeout?: number
  interval?: number
  acceptedStatusCodes?: number[]
  expectedStatusCode?: number
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
  isExpandedByDefault?: boolean
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
  const [showEditGroupModal, setShowEditGroupModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingGroup, setEditingGroup] = useState<ServiceGroup | null>(null)
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
          type: service.type,
          target: service.target,
          port: service.port,
          timeout: service.timeout,
          interval: service.interval,
          acceptedStatusCodes: service.acceptedStatusCodes,
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
        // Sort groups by order to ensure correct display
        const sortedGroups = result.data.sort((a: any, b: any) => {
          // Keep 'ungrouped' at the end
          if (a.id === 'ungrouped') return 1
          if (b.id === 'ungrouped') return -1
          return (a.order || 0) - (b.order || 0)
        })

        const groupsWithServices = sortedGroups.map((group: any) => ({
          ...group,
          services: [],  // Will be populated by useEffect
          isCollapsed: false,
          isExpandedByDefault: group.isExpandedByDefault
        }))

        console.log('Fetched groups with order:', groupsWithServices.map((g: any) => ({
          id: g.id,
          name: g.name,
          order: g.order
        })))

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

    const { source, destination, draggableId, type } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    // Handle group reordering
    if (type === 'GROUP') {
      const reorderedGroups = Array.from(groups)
      const [removed] = reorderedGroups.splice(source.index, 1)
      reorderedGroups.splice(destination.index, 0, removed)

      // Update order values
      const updatedGroups = reorderedGroups.map((group, index) => ({
        ...group,
        order: index
      }))

      setGroups(updatedGroups)

      // Update server
      try {
        console.log('Sending reorder request for groups:', updatedGroups.map((g, idx) => ({ id: g.id, name: g.name, order: idx })))
        const response = await fetch('/api/admin/groups/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groups: updatedGroups.map((g, idx) => ({ id: g.id, order: idx }))
          })
        })

        const result = await response.json()
        console.log('Reorder response:', result)

        if (!result.success) {
          console.error('Failed to reorder groups:', result.error)
          fetchGroups() // Reload groups on error
        }
      } catch (error) {
        console.error('Failed to reorder groups:', error)
        fetchGroups()
      }
      return
    }

    // Handle service moving
    const serviceId = draggableId
    const sourceGroupId = source.droppableId
    const destinationGroupId = destination.droppableId
    const sourceIndex = source.index
    const destinationIndex = destination.index

    // Optimistically update UI
    setServices(prev => {
      const updatedServices = [...prev]

      // Get services in source and destination groups
      const sourceGroupServices = updatedServices.filter(s => s.groupId === sourceGroupId)
      const destinationGroupServices = updatedServices.filter(s => s.groupId === destinationGroupId)

      // Find the moved service
      const movedService = updatedServices.find(s => s.id === serviceId)
      if (!movedService) return prev

      // If moving within the same group
      if (sourceGroupId === destinationGroupId) {
        // Remove from source position
        sourceGroupServices.splice(sourceIndex, 1)
        // Insert at destination position
        sourceGroupServices.splice(destinationIndex, 0, movedService)

        // Update orders for all services in the group
        sourceGroupServices.forEach((service, index) => {
          const serviceInArray = updatedServices.find(s => s.id === service.id)
          if (serviceInArray) {
            serviceInArray.order = index
          }
        })
      } else {
        // Moving to a different group
        // Update the moved service's group and order
        movedService.groupId = destinationGroupId
        movedService.order = destinationIndex

        // Reorder remaining services in source group
        sourceGroupServices
          .filter(s => s.id !== serviceId)
          .forEach((service, index) => {
            const serviceInArray = updatedServices.find(s => s.id === service.id)
            if (serviceInArray) {
              serviceInArray.order = index
            }
          })

        // Reorder services in destination group (make space for new service)
        destinationGroupServices.forEach((service, index) => {
          const serviceInArray = updatedServices.find(s => s.id === service.id)
          if (serviceInArray) {
            if (index >= destinationIndex) {
              serviceInArray.order = index + 1
            } else {
              serviceInArray.order = index
            }
          }
        })
      }

      return updatedServices
    })

    // Update server
    try {
      const response = await fetch(`/api/admin/services/${serviceId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: destinationGroupId,
          order: destinationIndex
        })
      })

      if (!response.ok) {
        throw new Error('Failed to move service')
      }

      // Refresh to ensure consistency with server
      await fetchServices()
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
          <Droppable droppableId="groups" type="GROUP">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-4">
                {filteredGroups.map((group, index) => (
                  <Draggable key={group.id} draggableId={group.id} index={index} isDragDisabled={group.id === 'ungrouped'}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden ${dragSnapshot.isDragging ? 'shadow-lg' : ''}`}
                        style={dragProvided.draggableProps.style}
                      >
                <div 
                  className="p-4 px-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer"
                  style={{ backgroundColor: `${group.color}10` }}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center gap-3">
                    {group.id !== 'ungrouped' && (
                      <div {...dragProvided.dragHandleProps} className="cursor-grab">
                        <GripVertical size={20} className="text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
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
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGroup(group);
                          setShowEditGroupModal(true);
                        }}
                        className="py-1 px-2 bg-transparent border border-blue-500 dark:border-blue-400 rounded-lg text-blue-500 dark:text-blue-400 text-xs cursor-pointer flex items-center gap-1 transition-all hover:bg-blue-500 hover:text-white dark:hover:bg-blue-400"
                      >
                        <Edit size={14} />
                        Éditer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="py-1 px-2 bg-transparent border border-red-500 dark:border-red-400 rounded-lg text-red-500 dark:text-red-400 text-xs cursor-pointer flex items-center gap-1 transition-all hover:bg-red-500 hover:text-white dark:hover:bg-red-400"
                      >
                        <Trash2 size={14} />
                        Supprimer
                      </button>
                    </div>
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
                                    
                                    <div className="flex gap-2">
                                      <button 
                                        className="btn btn-secondary p-2"
                                        onClick={() => toggleServiceStatus(service.id)}
                                        title={service.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                                      >
                                        {service.isActive ? <Pause size={16} /> : <Play size={16} />}
                                      </button>
                                      
                                      <button 
                                        className="btn btn-secondary p-2"
                                        onClick={() => testService(service.id)}
                                        title="Test now"
                                      >
                                        <Activity size={16} />
                                      </button>
                                      
                                      <button 
                                        className="btn btn-secondary p-2"
                                        onClick={() => {
                                          setEditingService(service)
                                          setShowEditModal(true)
                                        }}
                                        title="Edit service"
                                      >
                                        <Edit size={16} />
                                      </button>
                                      
                                      <button 
                                        className="btn btn-danger p-2"
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
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

        {editingGroup && (
          <EditGroupModal
            isOpen={showEditGroupModal}
            onClose={() => {
              setShowEditGroupModal(false)
              setEditingGroup(null)
            }}
            onSuccess={async () => {
              await fetchGroups()
              await fetchServices()
              setShowEditGroupModal(false)
              setEditingGroup(null)
            }}
            group={editingGroup}
          />
        )}

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
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[1000]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-[90%] text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500 dark:text-red-400" />
              </div>
              
              <h3 className="m-0 mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Delete Service
              </h3>
              
              <p className="m-0 mb-8 text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
              
              <div className="flex gap-4 justify-center">
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